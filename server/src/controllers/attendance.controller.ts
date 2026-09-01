import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { sendSuccess, sendError } from '../utils/response.util';
import prisma from '../prisma/client';
import { resolveFacultyId, resolveStudentId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class AttendanceController {
  async getBatchAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;

      // Teacher Scoping: Only allow rollcall view for assigned batches
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (!assignedBatchIds.includes(batchId)) {
          sendError(res, 'Access denied: You are not assigned to take rollcall for this batch', 403);
          return;
        }
      }

      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const subject = (req.query.subject as string) || 'General';
      const result = await attendanceService.getBatchAttendanceForDate(batchId, date, subject);
      sendSuccess(res, result, 'Batch attendance fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async markAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { batchId, date, subject, facultyId, records } = req.body;

      // Teacher Scoping: Only allow recording rollcall for assigned batches
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = myFacultyId ? await getFacultyAssignedBatchIds(myFacultyId) : [];
        if (!assignedBatchIds.includes(batchId)) {
          sendError(res, 'Access denied: You are only permitted to record attendance for your assigned batches', 403);
          return;
        }
      }

      const markedById = req.user?.id;
      const result = await attendanceService.markBatchAttendance({
        batchId,
        date: date || new Date().toISOString().split('T')[0],
        subject: subject || 'General',
        facultyId,
        records,
        markedById,
      });
      sendSuccess(res, result, 'Attendance recorded successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async getStudentAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const subject = req.query.subject as string | undefined;

      // Privacy Enforcement: A student cannot view any other student's attendance records
      if (req.user?.role === 'STUDENT') {
        const myStudentId = await resolveStudentId(req.user);
        if (!myStudentId || studentId !== myStudentId) {
          sendError(res, 'Access denied: You are only permitted to view your own attendance records.', 403);
          return;
        }
      }

      // Teacher Scoping: Teachers can only view attendance for students in their assigned batches
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { batchId: true },
        });

        if (!student?.batchId || !assignedBatchIds.includes(student.batchId)) {
          sendError(res, 'Access denied: Student is not enrolled in your assigned batches', 403);
          return;
        }
      }

      const result = await attendanceService.getStudentAttendance(studentId, subject);
      sendSuccess(res, result, 'Student attendance history fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async getMyAttendance(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const studentId = await resolveStudentId(req.user);
      if (!studentId) {
        sendError(res, 'No student record associated with this account', 404);
        return;
      }

      const subject = req.query.subject as string | undefined;
      const result = await attendanceService.getStudentAttendance(studentId, subject);
      sendSuccess(res, result, 'My attendance history fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async getInstituteStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await attendanceService.getInstituteOverview();
      sendSuccess(res, stats, 'Institute attendance statistics fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }
}

export const attendanceController = new AttendanceController();
