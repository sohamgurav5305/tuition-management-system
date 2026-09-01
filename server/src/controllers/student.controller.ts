import { Request, Response } from 'express';
import { studentService } from '../services/student.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { resolveFacultyId, getFacultyAssignedBatchIds } from '../utils/userResolver';

function sanitizeForTeacher(student: any) {
  if (!student) return student;
  const sanitized = { ...student };
  delete sanitized.totalFee;
  delete sanitized.paidFee;
  delete sanitized.pendingFee;
  delete sanitized.scholarshipPct;
  delete sanitized.feeStatus;
  delete sanitized.paymentMode;
  delete sanitized.payments;
  return sanitized;
}

export class StudentController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, courseId, batchId, status, feeStatus } = req.query;

      // Teacher Scoping: Only students enrolled in teacher's assigned batches + Hide financial data
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        if (!myFacultyId) {
          sendSuccess(res, [], 'No students found');
          return;
        }

        const assignedBatchIds = await getFacultyAssignedBatchIds(myFacultyId);
        if (assignedBatchIds.length === 0) {
          sendSuccess(res, [], 'No students assigned to your batches');
          return;
        }

        // If a specific batch was requested, verify it's within assigned batches
        let targetBatchId = batchId as string | undefined;
        if (targetBatchId && !assignedBatchIds.includes(targetBatchId)) {
          sendSuccess(res, [], 'No students in this batch');
          return;
        }

        const students = await studentService.getAllStudents({
          search: search as string,
          courseId: courseId as string,
          batchId: targetBatchId,
          status: status as string,
        });

        const teacherStudents = students
          .filter((s) => s.batchId && assignedBatchIds.includes(s.batchId))
          .map(sanitizeForTeacher);

        sendSuccess(res, teacherStudents, 'Assigned batch students fetched successfully');
        return;
      }

      const students = await studentService.getAllStudents({
        search: search as string,
        courseId: courseId as string,
        batchId: batchId as string,
        status: status as string,
        feeStatus: feeStatus as any,
      });
      sendSuccess(res, students, 'Students fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const student = await studentService.getStudentById(id);

      // Teacher Scoping
      if (req.user?.role === 'TEACHER') {
        const myFacultyId = await resolveFacultyId(req.user);
        if (!myFacultyId) {
          sendError(res, 'Access denied: Faculty profile not found', 403);
          return;
        }
        const assignedBatchIds = await getFacultyAssignedBatchIds(myFacultyId);
        if (!student.batchId || !assignedBatchIds.includes(student.batchId)) {
          sendError(res, 'Access denied: Student is not enrolled in your assigned batches', 403);
          return;
        }

        sendSuccess(res, sanitizeForTeacher(student), 'Student profile fetched successfully');
        return;
      }

      sendSuccess(res, student, 'Student fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const student = await studentService.getStudentByUserId(req.user.id);
      sendSuccess(res, student, 'My student profile fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      const student = await studentService.createStudent(req.body, file);
      sendSuccess(res, student, 'Student enrolled successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;
      const student = await studentService.updateStudent(id, req.body, file);
      sendSuccess(res, student, 'Student updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await studentService.deleteStudent(id);
      sendSuccess(res, result, 'Student deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const studentController = new StudentController();
