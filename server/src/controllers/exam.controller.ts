import { Request, Response } from 'express';
import { examService } from '../services/exam.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { resolveFacultyId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class ExamController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, batchId, status } = req.query;

      // Teacher Scoping: Only list exams for assigned batches
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (assignedBatchIds.length === 0) {
          sendSuccess(res, [], 'No exams scheduled for your batches');
          return;
        }

        let targetBatchId = batchId as string | undefined;
        if (targetBatchId && !assignedBatchIds.includes(targetBatchId)) {
          sendSuccess(res, [], 'No exams for this batch');
          return;
        }

        const exams = await examService.getAllExams({
          courseId: courseId as string,
          batchId: targetBatchId,
          status: status as string,
        });

        const teacherExams = exams.filter((e) => e.batchId && assignedBatchIds.includes(e.batchId));
        sendSuccess(res, teacherExams, 'Assigned batch exams fetched successfully');
        return;
      }

      const exams = await examService.getAllExams({
        courseId: courseId as string,
        batchId: batchId as string,
        status: status as string,
      });
      sendSuccess(res, exams, 'Examinations fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const exam = await examService.getExamById(id);

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (!assignedBatchIds.includes(exam.batchId)) {
          sendError(res, 'Access denied: You are not assigned to this exam batch', 403);
          return;
        }
      }

      sendSuccess(res, exam, 'Examination details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (!req.body.batchId || !assignedBatchIds.includes(req.body.batchId)) {
          sendError(res, 'Access denied: You can only schedule exams for your assigned batches', 403);
          return;
        }
      }

      const exam = await examService.createExam(req.body);
      sendSuccess(res, exam, 'Examination created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const existing = await examService.getExamById(id);
        if (!assignedBatchIds.includes(existing.batchId)) {
          sendError(res, 'Access denied: You cannot modify exams for another batch', 403);
          return;
        }
      }

      const exam = await examService.updateExam(id, req.body);
      sendSuccess(res, exam, 'Examination updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const existing = await examService.getExamById(id);
        if (!assignedBatchIds.includes(existing.batchId)) {
          sendError(res, 'Access denied: You cannot delete exams for another batch', 403);
          return;
        }
      }

      const result = await examService.deleteExam(id);
      sendSuccess(res, result, 'Examination deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const examController = new ExamController();
