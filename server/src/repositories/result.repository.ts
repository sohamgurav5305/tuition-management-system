import prisma from '../prisma/client';
import { Prisma, Result } from '@prisma/client';

export class ResultRepository {
  async findById(id: string) {
    return prisma.result.findUnique({
      where: { id },
      include: {
        exam: true,
        student: true,
      },
    });
  }

  async findByExam(examId: string) {
    return prisma.result.findMany({
      where: { examId },
      include: {
        student: true,
        exam: true,
      },
      orderBy: {
        batchRank: 'asc',
      },
    });
  }

  async findByStudent(studentId: string) {
    return prisma.result.findMany({
      where: { studentId },
      include: {
        exam: {
          include: {
            batch: true,
            course: true,
          },
        },
      },
      orderBy: {
        exam: { examDate: 'desc' },
      },
    });
  }

  async upsertResult(data: {
    resultId: string;
    examId: string;
    studentId: string;
    marksObtained: number;
    negativePenalty?: number;
    percentage: number;
    percentile?: number;
    batchRank?: number;
    instituteRank?: number;
    grade: string;
    isPassed: boolean;
    subjectScores?: string | null;
    remarks?: string;
  }) {
    return prisma.result.upsert({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: data.studentId,
        },
      },
      update: {
        marksObtained: data.marksObtained,
        negativePenalty: data.negativePenalty || 0.0,
        percentage: data.percentage,
        percentile: data.percentile || 0.0,
        batchRank: data.batchRank || 1,
        instituteRank: data.instituteRank || 1,
        grade: data.grade,
        isPassed: data.isPassed,
        subjectScores: data.subjectScores || null,
        remarks: data.remarks,
      },
      create: {
        resultId: data.resultId,
        examId: data.examId,
        studentId: data.studentId,
        marksObtained: data.marksObtained,
        negativePenalty: data.negativePenalty || 0.0,
        percentage: data.percentage,
        percentile: data.percentile || 0.0,
        batchRank: data.batchRank || 1,
        instituteRank: data.instituteRank || 1,
        grade: data.grade,
        isPassed: data.isPassed,
        subjectScores: data.subjectScores || null,
        remarks: data.remarks,
      },
      include: {
        student: true,
        exam: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.result.delete({
      where: { id },
    });
  }
}

export const resultRepository = new ResultRepository();
