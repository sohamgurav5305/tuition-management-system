import prisma from '../prisma/client';
import { Prisma, Student } from '@prisma/client';

export interface StudentFilterParams {
  search?: string;
  courseId?: string;
  batchId?: string;
  status?: string;
  feeStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
}

export class StudentRepository {
  async findById(id: string) {
    return prisma.student.findUnique({
      where: { id },
      include: {
        course: true,
        batch: {
          include: {
            faculty: true,
          },
        },
        user: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        attendance: {
          orderBy: { date: 'desc' },
        },
        results: {
          include: {
            exam: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByStudentId(studentId: string) {
    return prisma.student.findUnique({
      where: { studentId },
      include: {
        course: true,
        batch: true,
        user: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.student.findUnique({
      where: { userId },
      include: {
        course: true,
        batch: {
          include: {
            faculty: true,
          },
        },
        user: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        attendance: {
          orderBy: { date: 'desc' },
        },
        results: {
          include: {
            exam: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findAll(filters?: StudentFilterParams) {
    const where: Prisma.StudentWhereInput = {};

    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { studentId: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    if (filters?.courseId) {
      where.courseId = filters.courseId;
    }

    if (filters?.batchId) {
      where.batchId = filters.batchId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.feeStatus) {
      if (filters.feeStatus === 'PAID') {
        where.pendingFee = { lte: 0 };
      } else if (filters.feeStatus === 'PENDING') {
        where.paidFee = { equals: 0 };
        where.totalFee = { gt: 0 };
      } else if (filters.feeStatus === 'PARTIAL') {
        where.paidFee = { gt: 0 };
        where.pendingFee = { gt: 0 };
      }
    }

    return prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: true,
        batch: true,
        _count: {
          select: {
            attendance: true,
            payments: true,
            results: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.StudentUncheckedCreateInput): Promise<Student> {
    return prisma.student.create({
      data,
      include: {
        course: true,
        batch: true,
      },
    });
  }

  async update(id: string, data: Prisma.StudentUncheckedUpdateInput): Promise<Student> {
    return prisma.student.update({
      where: { id },
      data,
      include: {
        course: true,
        batch: true,
      },
    });
  }

  async delete(id: string): Promise<Student> {
    return prisma.student.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.StudentWhereInput): Promise<number> {
    return prisma.student.count({ where });
  }

  async updateFeeBalances(id: string, paidIncrement: number) {
    const current = await prisma.student.findUnique({ where: { id } });
    if (!current) throw new Error('Student not found');

    const newPaid = current.paidFee + paidIncrement;
    const newPending = Math.max(0, current.totalFee - newPaid);

    return prisma.student.update({
      where: { id },
      data: {
        paidFee: newPaid,
        pendingFee: newPending,
      },
    });
  }
}

export const studentRepository = new StudentRepository();
