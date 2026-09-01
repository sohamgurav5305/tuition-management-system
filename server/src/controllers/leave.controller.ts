import { Request, Response } from 'express';
import { leaveService } from '../services/leave.service';
import prisma from '../prisma/client';
import { resolveFacultyId, resolveStudentId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class LeaveController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, status } = req.query;
      let targetStudentId = studentId as string | undefined;

      // Privacy Enforcement: A student can ONLY view their own leave requests
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId) {
          res.json({ success: true, data: [] });
          return;
        }
        targetStudentId = myStudentId;
      }

      // Teacher Scoping: Faculty can ONLY view leave requests of students in their assigned batches
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (assignedBatchIds.length === 0) {
          res.json({ success: true, data: [] });
          return;
        }

        const leaves = await leaveService.getAllLeaves({
          studentId: targetStudentId,
          status: status as string,
        });

        const teacherLeaves = leaves.filter(
          (l) => l.student?.batchId && assignedBatchIds.includes(l.student.batchId)
        );

        res.json({ success: true, data: teacherLeaves });
        return;
      }

      const leaves = await leaveService.getAllLeaves({
        studentId: targetStudentId,
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
      }

      const leave = await leaveService.applyLeave(data);
      res.status(201).json({ success: true, data: leave, message: 'Leave application submitted for approval' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const leave = await prisma.leaveRequest.findUnique({
          where: { id: req.params.id },
          include: { student: true },
        });

        if (!leave?.student?.batchId || !assignedBatchIds.includes(leave.student.batchId)) {
          res.status(403).json({
            success: false,
            message: 'Access denied: You can only approve leaves for your assigned batch students',
          });
          return;
        }
      }

      const leave = await leaveService.updateLeaveStatus(
        req.params.id,
        status,
        req.user?.username || 'Staff'
      );
      res.json({ success: true, data: leave, message: `Leave application ${status.toLowerCase()}` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

export const leaveController = new LeaveController();
