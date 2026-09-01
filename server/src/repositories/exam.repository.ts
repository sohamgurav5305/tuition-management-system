import prisma from '../prisma/client';
import { Prisma, Examination } from '@prisma/client';

export class ExamRepository {
  async findById(id: string) {
    return prisma.examination.findUnique({
      where: { id },
      include: {
        course: true,
        batch: {
          include: {
            faculty: true,
          },
        },
        results: {
          include: {
            student: true,
          },
          orderBy: {
            student: { firstName: 'asc' },
          },
        },
      },
    });
  }

  async findByExamId(examId: string) {
    return prisma.examination.findUnique({
      where: { examId },
    });
  }

  async findAll(filters?: { courseId?: string; batchId?: string; status?: string }) {
    const where: Prisma.ExaminationWhereInput = {};
    if (filters?.courseId) where.courseId = filters.courseId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.status) where.status = filters.status;

    return prisma.examination.findMany({
      where,
      orderBy: { examDate: 'desc' },
      include: {
        course: true,
        batch: true,
        _count: {
          select: { results: true },
        },
      },
    });
  }

  async create(data: Prisma.ExaminationUncheckedCreateInput): Promise<Examination> {
    return prisma.examination.create({
      data,
      include: {
        course: true,
        batch: true,
      },
    });
  }

  async update(id: string, data: Prisma.ExaminationUncheckedUpdateInput): Promise<Examination> {
    return prisma.examination.update({
      where: { id },
      data,
      include: {
        course: true,
        batch: true,
      },
    });
  }

  async delete(id: string): Promise<Examination> {
    return prisma.examination.delete({
      where: { id },
    });
  }
}

export const examRepository = new ExamRepository();
