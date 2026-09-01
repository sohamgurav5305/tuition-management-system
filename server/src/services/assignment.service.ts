import { assignmentRepository } from '../repositories/assignment.repository';
import { batchRepository } from '../repositories/batch.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { generateAssignmentId } from '../utils/idGenerator.util';
import { storage } from '../storage';
import prisma from '../prisma/client';

export function calculateSubmissionTiming(submittedAt: Date, dueDateStr: string): { isLate: boolean; timingText: string } {
  // Due date e.g. "2026-09-05" -> end of day 23:59:59
  const dueDateTime = new Date(`${dueDateStr}T23:59:59`);
  const isLate = submittedAt.getTime() > dueDateTime.getTime();
  const diffMs = Math.abs(submittedAt.getTime() - dueDateTime.getTime());

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remHours = diffHours % 24;

  let timingText = '';
  if (isLate) {
    if (diffDays > 0) {
      timingText = `Submitted ${diffDays} day${diffDays > 1 ? 's' : ''} ${remHours > 0 ? `${remHours} hr${remHours > 1 ? 's' : ''} ` : ''}late`;
    } else if (diffHours > 0) {
      timingText = `Submitted ${diffHours} hr${diffHours > 1 ? 's' : ''} late`;
    } else {
      timingText = `Submitted ${Math.max(1, diffMinutes)} min${diffMinutes > 1 ? 's' : ''} late`;
    }
  } else {
    if (diffDays > 0) {
      timingText = `Submitted ${diffDays} day${diffDays > 1 ? 's' : ''} ${remHours > 0 ? `${remHours} hr${remHours > 1 ? 's' : ''} ` : ''}early`;
    } else if (diffHours > 0) {
      timingText = `Submitted ${diffHours} hr${diffHours > 1 ? 's' : ''} early`;
    } else {
      timingText = `Submitted on time (${Math.max(1, diffMinutes)} min${diffMinutes > 1 ? 's' : ''} before deadline)`;
    }
  }

  return { isLate, timingText };
}

export class AssignmentService {
  async getAllAssignments(filters?: { batchId?: string; status?: string; subject?: string }) {
    const list = await assignmentRepository.findAll(filters);
    
    // Enrich with submission counts
    const enriched = await Promise.all(
      list.map(async (a) => {
        const totalSubmissions = await submissionRepository.count({ assignmentId: a.id });
        const gradedSubmissions = await submissionRepository.count({ assignmentId: a.id, status: 'GRADED' });
        return {
          ...a,
          attachmentUrl: a.attachmentUrl ? storage.getUrl(a.attachmentUrl) : null,
          totalSubmissions,
          gradedSubmissions,
        };
      })
    );
    return enriched;
  }

  async getAssignmentById(id: string) {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) throw new Error('Assignment not found');
    return {
      ...assignment,
      attachmentUrl: assignment.attachmentUrl ? storage.getUrl(assignment.attachmentUrl) : null,
    };
  }

  async getAssignmentsForBatch(batchId: string, studentId?: string) {
    const list = await assignmentRepository.findByBatchId(batchId);
    return Promise.all(
      list.map(async (a) => {
        let mySubmission: any = null;
        if (studentId) {
          const sub = await submissionRepository.findByAssignmentAndStudent(a.id, studentId);
          if (sub) {
            mySubmission = {
              ...sub,
              fileUrl: sub.fileUrl ? storage.getUrl(sub.fileUrl) : null,
            };
          }
        }
        return {
          ...a,
          attachmentUrl: a.attachmentUrl ? storage.getUrl(a.attachmentUrl) : null,
          mySubmission,
        };
      })
    );
  }

  async createAssignment(data: any, file?: any) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Assignment title is required');
    }
    if (!data.dueDate) {
      throw new Error('Due date is required');
    }

    const batch = await batchRepository.findById(data.batchId);
    if (!batch) throw new Error('Selected batch does not exist');

    let attachmentUrl: string | undefined = undefined;
    if (file) {
      attachmentUrl = await storage.upload(file, 'assignments');
    }

    const assignmentId = await generateAssignmentId();

    return assignmentRepository.create({
      assignmentId,
      title: data.title.trim(),
      description: data.description || '',
      subject: data.subject || batch.course.name,
      batchId: data.batchId,
      facultyId: data.facultyId || null,
      createdById: data.createdById || null,
      dueDate: data.dueDate,
      totalMarks: Number(data.totalMarks || 100),
      status: data.status || 'OPEN',
      attachmentUrl,
    });
  }

  async updateAssignment(id: string, data: any, file?: any) {
    const existing = await assignmentRepository.findById(id);
    if (!existing) throw new Error('Assignment not found');

    let attachmentUrl = existing.attachmentUrl;
    if (file) {
      if (existing.attachmentUrl) {
        await storage.delete(existing.attachmentUrl);
      }
      attachmentUrl = await storage.upload(file, 'assignments');
    }

    return assignmentRepository.update(id, {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      subject: data.subject ?? existing.subject,
      dueDate: data.dueDate ?? existing.dueDate,
      totalMarks: data.totalMarks !== undefined ? Number(data.totalMarks) : existing.totalMarks,
      status: data.status ?? existing.status,
      attachmentUrl,
    });
  }

  async deleteAssignment(id: string) {
    const existing = await assignmentRepository.findById(id);
    if (!existing) throw new Error('Assignment not found');

    if (existing.attachmentUrl) {
      await storage.delete(existing.attachmentUrl);
    }

    return assignmentRepository.delete(id);
  }

  // --- Submissions & Grading ---

  async submitAssignment(params: {
    assignmentId: string;
    studentId: string;
    submissionText?: string;
    file?: any;
  }) {
    const assignment = await assignmentRepository.findById(params.assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const submittedAt = new Date();
    const { isLate, timingText } = calculateSubmissionTiming(submittedAt, assignment.dueDate);

    let fileUrl: string | undefined = undefined;
    if (params.file) {
      fileUrl = await storage.upload(params.file, 'submissions');
    }

    const count = await submissionRepository.count();
    const submissionId = `SUB-2026-${String(count + 1).padStart(4, '0')}`;

    const submission = await submissionRepository.upsert(params.assignmentId, params.studentId, {
      submissionId,
      submissionText: params.submissionText || null,
      fileUrl: fileUrl || null,
      submittedAt,
      isLate,
      timingText,
      status: 'SUBMITTED',
    });

    return {
      ...submission,
      fileUrl: submission.fileUrl ? storage.getUrl(submission.fileUrl) : null,
    };
  }

  async gradeSubmission(params: {
    submissionId: string;
    score: number;
    feedback?: string;
    gradedById?: string;
  }) {
    const submission = await submissionRepository.findById(params.submissionId);
    if (!submission) throw new Error('Submission record not found');

    if (params.score < 0 || params.score > submission.assignment.totalMarks) {
      throw new Error(`Score must be between 0 and ${submission.assignment.totalMarks} marks`);
    }

    const updated = await submissionRepository.update(params.submissionId, {
      score: Number(params.score),
      feedback: params.feedback || null,
      status: 'GRADED',
      gradedById: params.gradedById || null,
      gradedAt: new Date(),
    });

    return {
      ...updated,
      fileUrl: updated.fileUrl ? storage.getUrl(updated.fileUrl) : null,
    };
  }

  async getSubmissionsForAssignment(assignmentId: string) {
    const list = await submissionRepository.findByAssignmentId(assignmentId);
    return list.map((s) => ({
      ...s,
      fileUrl: s.fileUrl ? storage.getUrl(s.fileUrl) : null,
    }));
  }

  async getStudentSubmission(assignmentId: string, studentId: string) {
    const sub = await submissionRepository.findByAssignmentAndStudent(assignmentId, studentId);
    if (!sub) return null;
    return {
      ...sub,
      fileUrl: sub.fileUrl ? storage.getUrl(sub.fileUrl) : null,
    };
  }
}

export const assignmentService = new AssignmentService();
