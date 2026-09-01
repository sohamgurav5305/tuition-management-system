import prisma from '../prisma/client';
import { Prisma, Batch } from '@prisma/client';

export interface BatchFilterParams {
  courseId?: string;
  facultyId?: string;
  status?: string;
  search?: string;
}

export class BatchRepository {
  async findById(id: string) {
    return prisma.batch.findUnique({
      where: { id },
      include: {
        course: true,
        faculty: true,
        students: {
          orderBy: { firstName: 'asc' },
        },
        exams: {
          orderBy: { examDate: 'desc' },
        },
        assignments: {
          orderBy: { dueDate: 'desc' },
        },
        _count: {
          select: {
            students: true,
            attendance: true,
          },
        },
      },
    });
  }

  async findByBatchId(batchId: string) {
    return prisma.batch.findUnique({
      where: { batchId },
      include: {
        course: true,
        faculty: true,
        students: true,
      },
    });
  }

  async findAll(filters?: BatchFilterParams) {
    const where: Prisma.BatchWhereInput = {};

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.facultyId) {
      where.facultyId = filters.facultyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { batchId: { contains: filters.search } },
        { classroom: { contains: filters.search } },
      ];
    }

    return prisma.batch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: true,
        faculty: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.BatchUncheckedCreateInput): Promise<Batch> {
    return prisma.batch.create({
      data,
      include: {
        course: true,
        faculty: true,
      },
    });
  }

  async update(id: string, data: Prisma.BatchUncheckedUpdateInput): Promise<Batch> {
    return prisma.batch.update({
      where: { id },
      data,
      include: {
        course: true,
        faculty: true,
      },
    });
  }

  async delete(id: string): Promise<Batch> {
    return prisma.batch.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.BatchWhereInput): Promise<number> {
    return prisma.batch.count({ where });
  }

  async findActiveBatchesForConflictCheck(excludeBatchId?: string) {
    return prisma.batch.findMany({
      where: {
        status: { in: ['ACTIVE', 'UPCOMING'] },
        ...(excludeBatchId ? { id: { not: excludeBatchId } } : {}),
      },
      include: {
        faculty: true,
      },
    });
  }
}

export const batchRepository = new BatchRepository();
