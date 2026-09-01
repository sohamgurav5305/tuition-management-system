import { examRepository } from '../repositories/exam.repository';
import { batchRepository } from '../repositories/batch.repository';
import { generateExamId } from '../utils/idGenerator.util';

export class ExamService {
  async getAllExams(filters?: { courseId?: string; batchId?: string; status?: string }) {
    return examRepository.findAll(filters);
  }

  async getExamById(id: string) {
    const exam = await examRepository.findById(id);
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async createExam(data: any) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Exam title is required');
    }
    if (!data.examDate) {
      throw new Error('Exam date is required');
    }

    const totalMarks = Number(data.totalMarks);
    const passingMarks = Number(data.passingMarks);

    if (isNaN(totalMarks) || totalMarks <= 0) {
      throw new Error('Total marks must be greater than zero');
    }
    if (isNaN(passingMarks) || passingMarks <= 0) {
      throw new Error('Passing marks must be greater than zero');
    }
    if (passingMarks > totalMarks) {
      throw new Error(`Passing marks (${passingMarks}) cannot exceed total marks (${totalMarks})`);
    }

    const batch = await batchRepository.findById(data.batchId);
    if (!batch) throw new Error('Selected batch does not exist');

    const courseId = data.courseId || batch.courseId;
    const examId = await generateExamId();

    return examRepository.create({
      examId,
      title: data.title.trim(),
      examPattern: data.examPattern || 'JEE_MAIN',
      examDate: data.examDate,
      courseId,
      batchId: data.batchId,
      subject: data.subject || batch.course.name,
      totalMarks,
      passingMarks,
      correctMarks: data.correctMarks !== undefined ? Number(data.correctMarks) : 4.0,
      negativeMarks: data.negativeMarks !== undefined ? Number(data.negativeMarks) : 1.0,
      status: data.status || 'UPCOMING',
    });
  }

  async updateExam(id: string, data: any) {
    const existing = await examRepository.findById(id);
    if (!existing) throw new Error('Exam not found');

    const totalMarks = data.totalMarks !== undefined ? Number(data.totalMarks) : existing.totalMarks;
    const passingMarks = data.passingMarks !== undefined ? Number(data.passingMarks) : existing.passingMarks;

    if (totalMarks <= 0) {
      throw new Error('Total marks must be greater than zero');
    }
    if (passingMarks <= 0) {
      throw new Error('Passing marks must be greater than zero');
    }
    if (passingMarks > totalMarks) {
      throw new Error(`Passing marks (${passingMarks}) cannot exceed total marks (${totalMarks})`);
    }

    return examRepository.update(id, {
      title: data.title ?? existing.title,
      examPattern: data.examPattern ?? existing.examPattern,
      examDate: data.examDate ?? existing.examDate,
      subject: data.subject ?? existing.subject,
      totalMarks,
      passingMarks,
      correctMarks: data.correctMarks !== undefined ? Number(data.correctMarks) : existing.correctMarks,
      negativeMarks: data.negativeMarks !== undefined ? Number(data.negativeMarks) : existing.negativeMarks,
      status: data.status ?? existing.status,
    });
  }

  async deleteExam(id: string) {
    const existing = await examRepository.findById(id);
    if (!existing) throw new Error('Exam not found');
    return examRepository.delete(id);
  }
}

export const examService = new ExamService();
