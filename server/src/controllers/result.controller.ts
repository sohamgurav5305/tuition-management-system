import { Request, Response } from 'express';
import { resultService } from '../services/result.service';
import { examService } from '../services/exam.service';
import prisma from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response.util';
import { resolveFacultyId, resolveStudentId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class ResultController {
  async getByExam(req: Request, res: Response): Promise<void> {
    try {
      const { examId } = req.params;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const exam = await examService.getExamById(examId);
        if (!assignedBatchIds.includes(exam.batchId)) {
          sendError(res, 'Access denied: You are not assigned to grade this exam', 403);
          return;
        }
      }

      const data = await resultService.getResultsByExam(examId);
      sendSuccess(res, data, 'Exam results fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          select: { batchId: true },
        });
        if (!student?.batchId || !assignedBatchIds.includes(student.batchId)) {
          sendError(res, 'Access denied: Student is not in your assigned batches', 403);
          return;
        }
      }

      const results = await resultService.getResultsByStudent(studentId);
      sendSuccess(res, results, 'Student results fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getMyResults(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const studentId = await resolveStudentId(req.user);
      if (!studentId) {
        sendError(res, 'No student profile found for this account', 404);
        return;
      }

      const results = await resultService.getResultsByStudent(studentId);
      sendSuccess(res, results, 'My results fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async submitResults(req: Request, res: Response): Promise<void> {
    try {
      const { examId, entries } = req.body;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const exam = await examService.getExamById(examId);
        if (!assignedBatchIds.includes(exam.batchId)) {
          sendError(res, 'Access denied: You can only submit marks for your assigned batch exams', 403);
          return;
        }
      }

      const saved = await resultService.submitExamResults({
        examId,
        entries,
      });
      sendSuccess(res, saved, 'Exam results saved and graded successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const resultController = new ResultController();
