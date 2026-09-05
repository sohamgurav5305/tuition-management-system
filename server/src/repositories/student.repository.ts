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
      },
    });
  }

  async findAll(filters?: StudentFilterParams) {
    const where: Prisma.StudentWhereInput = {};

    if (filters?.search?.trim()) {
      const words = filters.search.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          ...words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: 'insensitive' as const } },
              { lastName: { contains: word, mode: 'insensitive' as const } },
              { studentId: { contains: word, mode: 'insensitive' as const } },
              { rollNumber: { contains: word, mode: 'insensitive' as const } },
              { email: { contains: word, mode: 'insensitive' as const } },
              { phone: { contains: word, mode: 'insensitive' as const } },
              { guardianName: { contains: word, mode: 'insensitive' as const } },
              { address: { contains: word, mode: 'insensitive' as const } },
              { course: { name: { contains: word, mode: 'insensitive' as const } } },
              { batch: { name: { contains: word, mode: 'insensitive' as const } } },
            ],
          })),
        ];
      }
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
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { studentId: 'asc' },
      ],
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
