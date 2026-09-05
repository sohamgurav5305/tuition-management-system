import prisma from '../prisma/client';
import { assignmentRepository } from '../repositories/assignment.repository';
import { batchRepository } from '../repositories/batch.repository';
import { submissionRepository } from '../repositories/submission.repository';
import { notificationService } from './notification.service';
import { generateAssignmentId, generateSubmissionId } from '../utils/idGenerator.util';
import { realtimeHub } from '../utils/eventEmitter';
import { storage } from '../storage';

export function calculateSubmissionTiming(submittedAt: Date, dueDateStr: string): { isLate: boolean; timingText: string } {
  const cleanDateStr = (dueDateStr || '').split('T')[0];
  const dueDateTime = cleanDateStr ? new Date(`${cleanDateStr}T23:59:59`) : new Date();
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

function resolveFileUrls(fileUrlsJson?: string | null, singleUrl?: string | null): string[] {
  if (fileUrlsJson) {
    try {
      const parsed = JSON.parse(fileUrlsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: string) => storage.getUrl(p));
      }
    } catch {
      // ignore
    }
  }
  return singleUrl ? [storage.getUrl(singleUrl)] : [];
}

export class AssignmentService {
  async getAllAssignments(filters?: { batchId?: string; status?: string; subject?: string }) {
    const list = await assignmentRepository.findAll(filters);
    if (list.length === 0) return [];

    const assignmentIds = list.map((a) => a.id);
    const submissionCounts = await prisma.assignmentSubmission.groupBy({
      by: ['assignmentId', 'status'],
      where: { assignmentId: { in: assignmentIds } },
      _count: { _all: true },
    });

    const totalMap: Record<string, number> = {};
    const gradedMap: Record<string, number> = {};

    for (const sc of submissionCounts) {
      totalMap[sc.assignmentId] = (totalMap[sc.assignmentId] || 0) + sc._count._all;
      if (sc.status === 'GRADED') {
        gradedMap[sc.assignmentId] = (gradedMap[sc.assignmentId] || 0) + sc._count._all;
      }
    }

    return list.map((a) => {
      const attachments = resolveFileUrls((a as any).fileUrls, a.attachmentUrl);
      return {
        ...a,
        attachmentUrl: a.attachmentUrl ? storage.getUrl(a.attachmentUrl) : attachments[0] || null,
        attachments,
        totalSubmissions: totalMap[a.id] || 0,
        gradedSubmissions: gradedMap[a.id] || 0,
      };
    });
  }

  async getAssignmentById(id: string) {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) throw new Error('Assignment not found');
    const attachments = resolveFileUrls((assignment as any).fileUrls, assignment.attachmentUrl);
    return {
      ...assignment,
      attachmentUrl: assignment.attachmentUrl ? storage.getUrl(assignment.attachmentUrl) : attachments[0] || null,
      attachments,
    };
  }

  async getAssignmentsForBatch(batchId: string, studentId?: string) {
    const list = await assignmentRepository.findByBatchId(batchId);
    if (list.length === 0) return [];

    const submissionMap: Record<string, any> = {};
    if (studentId) {
      const assignmentIds = list.map((a) => a.id);
      const subs = await prisma.assignmentSubmission.findMany({
        where: {
          assignmentId: { in: assignmentIds },
          studentId,
        },
      });
      for (const sub of subs) {
        submissionMap[sub.assignmentId] = sub;
      }
    }

    return list.map((a) => {
      let mySubmission: any = null;
      if (studentId && submissionMap[a.id]) {
        const sub = submissionMap[a.id];
        const files = resolveFileUrls((sub as any).fileUrls, sub.fileUrl);
        mySubmission = {
          ...sub,
          fileUrl: sub.fileUrl ? storage.getUrl(sub.fileUrl) : files[0] || null,
          files,
        };
      }
      const attachments = resolveFileUrls((a as any).fileUrls, a.attachmentUrl);
      return {
        ...a,
        attachmentUrl: a.attachmentUrl ? storage.getUrl(a.attachmentUrl) : attachments[0] || null,
        attachments,
        mySubmission,
      };
    });
  }

  async createAssignment(data: any, files?: any[]) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Assignment title is required');
    }
    if (!data.dueDate) {
      throw new Error('Due date is required');
    }

    const batch = await batchRepository.findById(data.batchId);
    if (!batch) throw new Error('Selected batch does not exist');

    const uploadedPaths: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const path = await storage.upload(file, 'assignments');
        uploadedPaths.push(path);
      }
    }

    const assignmentId = await generateAssignmentId();

    const assignment = await assignmentRepository.create({
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
      attachmentUrl: uploadedPaths[0] || null,
      fileUrls: uploadedPaths.length > 0 ? JSON.stringify(uploadedPaths) : null,
    } as any);

    // Notify students of new assignment
    try {
      await notificationService.createNotification({
        title: `New Assignment: ${assignment.title}`,
        message: `Faculty assigned "${assignment.title}" (${assignment.subject}) for ${batch.name}. Due date: ${assignment.dueDate}.`,
        type: 'INFORMATION',
        targetRole: 'STUDENT',
      });
    } catch (e) {
      console.error('Failed to send assignment notification', e);
    }

    try {
      realtimeHub.broadcast('assignment:updated', {
        assignmentId: assignment.id,
        batchId: assignment.batchId,
        action: 'created',
      });
    } catch {}

    return {
      ...assignment,
      attachmentUrl: uploadedPaths[0] ? storage.getUrl(uploadedPaths[0]) : null,
      attachments: uploadedPaths.map((p) => storage.getUrl(p)),
    };
  }

  async updateAssignment(id: string, data: any, files?: any[]) {
    const existing = await assignmentRepository.findById(id);
    if (!existing) throw new Error('Assignment not found');

    let uploadedPaths: string[] = [];
    if (data.existingAttachments !== undefined) {
      try {
        const kept = typeof data.existingAttachments === 'string'
          ? JSON.parse(data.existingAttachments)
          : data.existingAttachments;
        if (Array.isArray(kept)) {
          uploadedPaths = kept
            .map((url: string) => {
              if (typeof url === 'string') {
                if (url.startsWith('/uploads/')) {
                  return url.replace(/^\/uploads\//, '');
                }
                const match = url.match(/\/uploads\/(.+)$/);
                if (match) return match[1];
              }
              return url;
            })
            .filter(Boolean);
        }
      } catch (e) {
        console.error('Failed to parse existingAttachments', e);
      }
    } else if ((existing as any).fileUrls) {
      try {
        uploadedPaths = JSON.parse((existing as any).fileUrls);
      } catch {
        if (existing.attachmentUrl) uploadedPaths = [existing.attachmentUrl];
      }
    } else if (existing.attachmentUrl) {
      uploadedPaths = [existing.attachmentUrl];
    }

    if (files && files.length > 0) {
      for (const file of files) {
        const p = await storage.upload(file, 'assignments');
        uploadedPaths.push(p);
      }
    }

    const updated = await assignmentRepository.update(id, {
      title: data.title ?? existing.title,
      description: data.description ?? existing.description,
      subject: data.subject ?? existing.subject,
      dueDate: data.dueDate ?? existing.dueDate,
      totalMarks: data.totalMarks !== undefined ? Number(data.totalMarks) : existing.totalMarks,
      status: data.status ?? existing.status,
      attachmentUrl: uploadedPaths[0] || null,
      fileUrls: uploadedPaths.length > 0 ? JSON.stringify(uploadedPaths) : null,
    } as any);

    return {
      ...updated,
      attachmentUrl: uploadedPaths[0] ? storage.getUrl(uploadedPaths[0]) : null,
      attachments: uploadedPaths.map((p) => storage.getUrl(p)),
    };
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
    files?: any[];
  }) {
    const assignment = await assignmentRepository.findById(params.assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    const submittedAt = new Date();
    const { isLate, timingText } = calculateSubmissionTiming(submittedAt, assignment.dueDate);

    const uploadedPaths: string[] = [];
    if (params.files && params.files.length > 0) {
      for (const file of params.files) {
        const p = await storage.upload(file, 'submissions');
        uploadedPaths.push(p);
      }
    }

    const submissionId = await generateSubmissionId();

    const submission = await submissionRepository.upsert(params.assignmentId, params.studentId, {
      submissionId,
      submissionText: params.submissionText || null,
      fileUrl: uploadedPaths[0] || null,
      fileUrls: uploadedPaths.length > 0 ? JSON.stringify(uploadedPaths) : null,
      submittedAt,
      isLate,
      timingText,
      status: 'SUBMITTED',
    } as any);

    // Notify faculty of submission
    try {
      await notificationService.createNotification({
        title: `Assignment Submission Received`,
        message: `A student submitted their coursework for "${assignment.title}". (${timingText}).`,
        type: 'INFORMATION',
        targetRole: 'TEACHER',
      });
    } catch (e) {
      console.error('Failed to send submission notification', e);
    }

    try {
      realtimeHub.broadcast('assignment:updated', {
        assignmentId: assignment.id,
        submissionId: submission.id,
        action: 'submitted',
      });
    } catch {}

    return {
      ...submission,
      fileUrl: uploadedPaths[0] ? storage.getUrl(uploadedPaths[0]) : null,
      files: uploadedPaths.map((p) => storage.getUrl(p)),
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

    // Notify student of grading result
    try {
      await notificationService.createNotification({
        title: `Assignment Graded: ${submission.assignment.title}`,
        message: `Your submission for "${submission.assignment.title}" has been graded: ${params.score}/${submission.assignment.totalMarks} marks.${params.feedback ? ` Feedback: "${params.feedback}"` : ''}`,
        type: 'SUCCESS',
        targetUserId: (submission as any).student?.userId || undefined,
        targetRole: 'STUDENT',
      });
    } catch (e) {
      console.error('Failed to send grading notification', e);
    }

    try {
      realtimeHub.broadcast('assignment:updated', {
        assignmentId: submission.assignmentId,
        submissionId: updated.id,
        action: 'graded',
      });
    } catch {}

    const files = resolveFileUrls((updated as any).fileUrls, updated.fileUrl);
    return {
      ...updated,
      fileUrl: updated.fileUrl ? storage.getUrl(updated.fileUrl) : files[0] || null,
      files,
    };
  }

  async getSubmissionsForAssignment(assignmentId: string) {
    const list = await submissionRepository.findByAssignmentId(assignmentId);
    return list.map((s) => {
      const files = resolveFileUrls((s as any).fileUrls, s.fileUrl);
      return {
        ...s,
        fileUrl: s.fileUrl ? storage.getUrl(s.fileUrl) : files[0] || null,
        files,
      };
    });
  }

  async getStudentSubmission(assignmentId: string, studentId: string) {
    const sub = await submissionRepository.findByAssignmentAndStudent(assignmentId, studentId);
    if (!sub) return null;
    const files = resolveFileUrls((sub as any).fileUrls, sub.fileUrl);
    return {
      ...sub,
      fileUrl: sub.fileUrl ? storage.getUrl(sub.fileUrl) : files[0] || null,
      files,
    };
  }
}

export const assignmentService = new AssignmentService();
