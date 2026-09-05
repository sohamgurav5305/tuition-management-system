import { Request, Response } from 'express';
import { assignmentService } from '../services/assignment.service';
import { sendSuccess, sendError } from '../utils/response.util';
import prisma from '../prisma/client';
import { resolveFacultyId, resolveStudentId, getFacultyAssignedBatchIds } from '../utils/userResolver';

export class AssignmentController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { batchId, status, subject } = req.query;

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (assignedBatchIds.length === 0) {
          sendSuccess(res, [], 'No assignments found for your batches');
          return;
        }

        let targetBatchId = batchId as string | undefined;
        if (targetBatchId && !assignedBatchIds.includes(targetBatchId)) {
          sendSuccess(res, [], 'No assignments in this batch');
          return;
        }

        const assignments = await assignmentService.getAllAssignments({
          batchId: targetBatchId,
          status: status as string,
          subject: subject as string,
        });

        const teacherAssignments = assignments.filter((a) => a.batchId && assignedBatchIds.includes(a.batchId));
        sendSuccess(res, teacherAssignments, 'Assigned batch coursework fetched successfully');
        return;
      }

      const assignments = await assignmentService.getAllAssignments({
        batchId: batchId as string,
        status: status as string,
        subject: subject as string,
      });
      sendSuccess(res, assignments, 'Assignments fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const assignment = await assignmentService.getAssignmentById(id);

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (!assignedBatchIds.includes(assignment.batchId)) {
          sendError(res, 'Access denied: Assignment is not from your assigned batches', 403);
          return;
        }
      }

      sendSuccess(res, assignment, 'Assignment fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getMyAssignments(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      const studentId = await resolveStudentId(req.user);
      if (!studentId) {
        sendSuccess(res, [], 'No student record associated with this account');
        return;
      }

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { batchId: true },
      });

      if (!student || !student.batchId) {
        sendSuccess(res, [], 'No assignments found for unassigned student');
        return;
      }

      const assignments = await assignmentService.getAssignmentsForBatch(student.batchId, studentId);
      sendSuccess(res, assignments, 'My batch assignments fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      let facultyId: string | null = null;
      if (req.user?.role === 'TEACHER') {
        facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        if (!req.body.batchId || !assignedBatchIds.includes(req.body.batchId)) {
          sendError(res, 'Access denied: You can only create assignments for your assigned batches', 403);
          return;
        }
      }

      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const data = {
        ...req.body,
        facultyId: facultyId || undefined,
        createdById: req.user?.id,
      };
      const assignment = await assignmentService.createAssignment(data, files);
      sendSuccess(res, assignment, 'Assignment created successfully', 201);
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
        const existing = await assignmentService.getAssignmentById(id);
        if (!assignedBatchIds.includes(existing.batchId)) {
          sendError(res, 'Access denied: You cannot edit assignments for another batch', 403);
          return;
        }
      }

      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const assignment = await assignmentService.updateAssignment(id, req.body, files);
      sendSuccess(res, assignment, 'Assignment updated successfully');
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
        const existing = await assignmentService.getAssignmentById(id);
        if (!assignedBatchIds.includes(existing.batchId)) {
          sendError(res, 'Access denied: You cannot delete assignments for another batch', 403);
          return;
        }
      }

      const result = await assignmentService.deleteAssignment(id);
      sendSuccess(res, result, 'Assignment deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  // --- Student Submission ---

  async submitAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { id: assignmentId } = req.params;
      const studentId = await resolveStudentId(req.user);

      if (!studentId) {
        sendError(res, 'Student profile not linked to account', 400);
        return;
      }

      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const { submissionText } = req.body;

      if (files.length === 0 && (!submissionText || !submissionText.trim())) {
        sendError(res, 'Please provide uploaded solution file(s) or text response', 400);
        return;
      }

      const submission = await assignmentService.submitAssignment({
        assignmentId,
        studentId,
        submissionText,
        files,
      });

      sendSuccess(res, submission, 'Assignment solution submitted successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  // --- Submissions Listing (Role-Scoped) ---

  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const { id: assignmentId } = req.params;

      if (req.user?.role === 'STUDENT') {
        const studentId = await resolveStudentId(req.user);
        if (!studentId) {
          sendSuccess(res, null, 'No submission found');
          return;
        }
        const submission = await assignmentService.getStudentSubmission(assignmentId, studentId);
        sendSuccess(res, submission ? [submission] : [], 'My submission fetched successfully');
        return;
      }

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const assignment = await assignmentService.getAssignmentById(assignmentId);
        if (!assignedBatchIds.includes(assignment.batchId)) {
          sendError(res, 'Access denied: You cannot view submissions for this batch', 403);
          return;
        }
      }

      // Teachers & Admins see all student submissions
      const submissions = await assignmentService.getSubmissionsForAssignment(assignmentId);
      sendSuccess(res, submissions, 'Assignment submissions fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  // --- Teacher Grading ---

  async gradeSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { submissionId } = req.params;
      const { score, feedback } = req.body;

      if (score === undefined || score === null || isNaN(Number(score))) {
        sendError(res, 'Valid score/marks obtained is required', 400);
        return;
      }

      if (req.user?.role === 'TEACHER') {
        const facultyId = await resolveFacultyId(req.user);
        const assignedBatchIds = facultyId ? await getFacultyAssignedBatchIds(facultyId) : [];
        const sub = await prisma.assignmentSubmission.findUnique({
          where: { id: submissionId },
          include: { assignment: true },
        });
        if (!sub || !assignedBatchIds.includes(sub.assignment.batchId)) {
          sendError(res, 'Access denied: You cannot grade submissions for another batch', 403);
          return;
        }
      }

      const result = await assignmentService.gradeSubmission({
        submissionId,
        score: Number(score),
        feedback,
        gradedById: req.user?.id,
      });

      sendSuccess(res, result, 'Submission evaluated and graded successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const assignmentController = new AssignmentController();
