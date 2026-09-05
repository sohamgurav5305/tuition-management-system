import { doubtRepository } from '../repositories/doubt.repository';
import { notificationService } from './notification.service';
import { generateDoubtId } from '../utils/idGenerator.util';
import { realtimeHub } from '../utils/eventEmitter';
import prisma from '../prisma/client';
import { storage } from '../storage';

function resolveFileUrls(fileUrlsJsonOrSingle?: string | null): string[] {
  if (!fileUrlsJsonOrSingle) return [];
  try {
    const parsed = JSON.parse(fileUrlsJsonOrSingle);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: string) => storage.getUrl(p));
    }
  } catch {
    // ignore
  }
  return [storage.getUrl(fileUrlsJsonOrSingle)];
}

export class DoubtService {
  async getAllDoubts(filters?: { studentId?: string; facultyId?: string; status?: string; subject?: string }) {
    const list = await doubtRepository.findAll(filters);
    return list.map((d) => {
      const attachments = resolveFileUrls(d.attachmentUrl);
      const answerAttachments = resolveFileUrls((d as any).answerAttachmentUrl);
      return {
        ...d,
        attachmentUrl: attachments[0] || null,
        attachments,
        answerAttachmentUrl: answerAttachments[0] || null,
        answerAttachments,
      };
    });
  }

  async getDoubtById(id: string) {
    const doubt = await doubtRepository.findById(id);
    if (!doubt) throw new Error('Doubt thread not found');
    const attachments = resolveFileUrls(doubt.attachmentUrl);
    const answerAttachments = resolveFileUrls((doubt as any).answerAttachmentUrl);
    return {
      ...doubt,
      attachmentUrl: attachments[0] || null,
      attachments,
      answerAttachmentUrl: answerAttachments[0] || null,
      answerAttachments,
    };
  }

  async createDoubt(data: any, files?: any[]) {
    const questionText = (data.questionText || data.question || '').trim();
    if (!questionText) {
      throw new Error('Question description is required');
    }
    if (!data.facultyId) {
      throw new Error('Please select a faculty mentor from your batch to direct this question to');
    }

    const doubtId = await generateDoubtId();

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { batch: true },
    });

    const faculty = await prisma.faculty.findUnique({
      where: { id: data.facultyId },
    });

    const subject = data.subject || faculty?.subjectTaught || 'General';

    let attachmentUrl = data.attachmentUrl || null;
    if (files && files.length > 0) {
      const uploadedPaths: string[] = [];
      for (const f of files) {
        const p = await storage.upload(f, 'doubts');
        uploadedPaths.push(p);
      }
      attachmentUrl = uploadedPaths.length > 1 ? JSON.stringify(uploadedPaths) : (uploadedPaths[0] || null);
    }

    const doubt = await doubtRepository.create({
      doubtId,
      studentId: data.studentId,
      facultyId: data.facultyId,
      subject,
      topic: data.topic || 'General',
      questionText,
      attachmentUrl,
      status: 'OPEN',
    });

    // Notify faculty mentor of new student question
    try {
      if (faculty?.userId) {
        const studentName = student ? `${student.firstName} ${student.lastName}` : 'A student';
        await notificationService.createNotification({
          title: `New Student Doubt: ${data.subject}`,
          message: `${studentName} submitted a doubt in ${data.subject} (${data.topic || 'General'}): "${questionText.slice(0, 100)}..."`,
          type: 'INFORMATION',
          targetUserId: faculty.userId,
        });
      }
    } catch (e) {
      console.error('Failed to send doubt notification', e);
    }

    const attachments = resolveFileUrls(doubt.attachmentUrl);
    const result = {
      ...doubt,
      attachmentUrl: attachments[0] || null,
      attachments,
      answerAttachments: [],
    };

    try {
      realtimeHub.broadcast('doubt:updated', { doubtId: doubt.id, studentId: doubt.studentId, action: 'created' });
    } catch {}

    return result;
  }

  async answerDoubt(id: string, facultyId: string, answerText: string, files?: any[]) {
    const existing = await doubtRepository.findById(id);
    if (!existing) throw new Error('Doubt not found');

    let answerAttachmentUrl = undefined;
    if (files && files.length > 0) {
      const uploadedPaths: string[] = [];
      for (const f of files) {
        const p = await storage.upload(f, 'doubts');
        uploadedPaths.push(p);
      }
      answerAttachmentUrl = uploadedPaths.length > 1 ? JSON.stringify(uploadedPaths) : (uploadedPaths[0] || null);
    }

    const updated = await doubtRepository.update(id, {
      facultyId,
      answerText: (answerText || '').trim(),
      answerAttachmentUrl,
      status: 'RESOLVED',
      answeredAt: new Date(),
    } as any);

    // Notify student that their doubt has been resolved
    try {
      const student = await prisma.student.findUnique({
        where: { id: existing.studentId },
      });

      if (student?.userId) {
        await notificationService.createNotification({
          title: `Doubt Resolved: ${existing.subject}`,
          message: `Your mentor answered your question on ${existing.topic || existing.subject}. Check your Doubts forum for the solution.`,
          type: 'SUCCESS',
          targetUserId: student.userId,
        });
      }
    } catch (e) {
      console.error('Failed to send doubt resolved notification', e);
    }

    const attachments = resolveFileUrls(updated.attachmentUrl);
    const answerAttachments = resolveFileUrls((updated as any).answerAttachmentUrl);
    const result = {
      ...updated,
      attachmentUrl: attachments[0] || null,
      attachments,
      answerAttachmentUrl: answerAttachments[0] || null,
      answerAttachments,
    };

    try {
      realtimeHub.broadcast('doubt:updated', { doubtId: updated.id, studentId: updated.studentId, action: 'resolved' });
    } catch {}

    return result;
  }

  async deleteDoubt(id: string) {
    const res = await doubtRepository.delete(id);
    try {
      realtimeHub.broadcast('doubt:updated', { doubtId: id, action: 'deleted' });
    } catch {}
    return res;
  }
}

export const doubtService = new DoubtService();
