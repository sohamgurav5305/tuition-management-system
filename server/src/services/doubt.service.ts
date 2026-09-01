import { doubtRepository } from '../repositories/doubt.repository';
import prisma from '../prisma/client';

export class DoubtService {
  async getAllDoubts(filters?: { studentId?: string; facultyId?: string; status?: string; subject?: string }) {
    return doubtRepository.findAll(filters);
  }

  async getDoubtById(id: string) {
    const doubt = await doubtRepository.findById(id);
    if (!doubt) throw new Error('Doubt thread not found');
    return doubt;
  }

  async createDoubt(data: any) {
    if (!data.questionText || !data.questionText.trim()) {
      throw new Error('Question description is required');
    }
    if (!data.facultyId) {
      throw new Error('Please select a faculty mentor from your batch to direct this question to');
    }

    const count = (await doubtRepository.findAll()).length;
    const doubtId = `DBT-2026-${String(count + 1).padStart(4, '0')}`;

    return doubtRepository.create({
      doubtId,
      studentId: data.studentId,
      facultyId: data.facultyId,
      subject: data.subject,
      topic: data.topic,
      questionText: data.questionText.trim(),
      attachmentUrl: data.attachmentUrl || null,
      status: 'OPEN',
    });
  }

  async answerDoubt(id: string, facultyId: string, answerText: string) {
    const existing = await doubtRepository.findById(id);
    if (!existing) throw new Error('Doubt not found');

    return doubtRepository.update(id, {
      facultyId,
      answerText: answerText.trim(),
      status: 'RESOLVED',
      answeredAt: new Date(),
    });
  }

  async deleteDoubt(id: string) {
    return doubtRepository.delete(id);
  }
}

export const doubtService = new DoubtService();
