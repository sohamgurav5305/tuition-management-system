import { Request, Response } from 'express';
import { leaveService } from '../services/leave.service';
import prisma from '../prisma/client';
import { resolveFacultyId, resolveStudentId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class LeaveController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, facultyId, applicantType, status } = req.query;
      let targetStudentId = studentId as string | undefined;

      // Privacy Enforcement: A student can ONLY view their own leave requests
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId) {
          res.json({ success: true, data: [] });
          return;
        }
        const studentLeaves = await leaveService.getAllLeaves({
          studentId: myStudentId,
          applicantType: 'STUDENT',
          status: status as string,
        });
        res.json({ success: true, data: studentLeaves });
        return;
      }

      // Teacher Scoping: Faculty view their assigned batch student requests + their own faculty leave applications
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = myFacultyId ? await getFacultyAssignedBatchIds(myFacultyId) : [];

        const allLeaves = await leaveService.getAllLeaves({
          status: status as string,
        });

        const accessibleLeaves = allLeaves.filter((l) => {
          // 1. My own faculty leave applications
          if (l.applicantType === 'FACULTY' && myFacultyId && l.facultyId === myFacultyId) {
            return true;
          }
          // 2. Student leave applications for students in my assigned cohorts
          if (l.applicantType === 'STUDENT' && l.student?.batchId && assignedBatchIds.includes(l.student.batchId)) {
            return true;
          }
          return false;
        });

        res.json({ success: true, data: accessibleLeaves });
        return;
      }

      // Administrator Scoping: Full visibility of all Student and Faculty leave requests
      const leaves = await leaveService.getAllLeaves({
        studentId: targetStudentId,
        facultyId: facultyId as string,
        applicantType: applicantType as string,
        status: status as string,
      });
      res.json({ success: true, data: leaves });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async apply(req: Request, res: Response): Promise<void> {
    try {
      let data = { ...req.body };

      // Ensure studentId is strictly bound to the authenticated student
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId) {
          res.status(400).json({ success: false, message: 'Student profile not linked to account' });
          return;
        }
        data.studentId = myStudentId;
        data.applicantType = 'STUDENT';
        delete data.facultyId;
      }

      // Ensure facultyId is strictly bound to the authenticated teacher
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        if (!myFacultyId) {
          res.status(400).json({ success: false, message: 'Faculty profile not linked to account' });
          return;
        }
        data.facultyId = myFacultyId;
        data.applicantType = 'FACULTY';
        delete data.studentId;
      }

      const leave = await leaveService.applyLeave(data);
      res.status(201).json({
        success: true,
        data: leave,
        message:
          data.applicantType === 'FACULTY'
            ? 'Faculty leave application submitted for Administrator approval'
            : 'Student leave application submitted for review',
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;

      const leave = await prisma.leaveRequest.findUnique({
        where: { id: req.params.id },
        include: { student: true, faculty: true },
      });

      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave request not found' });
        return;
      }

      // Security Gate: ONLY Administrator can approve or reject Faculty leave requests
      if (leave.applicantType === 'FACULTY' || leave.facultyId) {
        if (req.user?.role !== 'ADMINISTRATOR') {
          res.status(403).json({
            success: false,
            message: 'Access denied: Only an Administrator can approve or reject faculty leave requests',
          });
          return;
        }
      }

      // Security Gate for Teachers reviewing Student requests
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];

        if (!leave?.student?.batchId || !assignedBatchIds.includes(leave.student.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only approve leaves for students in your assigned batches',
          });
          return;
        }
      }

      const updated = await leaveService.updateLeaveStatus(
        req.params.id,
        status,
        req.user?.username || 'Administrator',
        req.user?.role || 'ADMINISTRATOR'
      );

      res.json({
        success: true,
        data: updated,
        message: `Leave application marked as ${status.toLowerCase()}`,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const leaveController = new LeaveController();
