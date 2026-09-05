import prisma from '../prisma/client';
import { Prisma, Payment } from '@prisma/client';

export interface PaymentFilterParams {
  studentId?: string;
  paymentMode?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class PaymentRepository {
  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            course: true,
            batch: true,
          },
        },
      },
    });
  }

  async findByReceiptId(receiptId: string) {
    return prisma.payment.findUnique({
      where: { receiptId },
      include: {
        student: {
          include: {
            course: true,
            batch: true,
          },
        },
      },
    });
  }

  async findAll(filters?: PaymentFilterParams) {
    const where: Prisma.PaymentWhereInput = {};

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.paymentMode) {
      where.paymentMode = filters.paymentMode;
    }

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) where.paymentDate.gte = filters.startDate;
      if (filters.endDate) where.paymentDate.lte = filters.endDate;
    }

    if (filters?.search?.trim()) {
      const words = filters.search.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          ...words.map((word) => ({
            OR: [
              { receiptId: { contains: word, mode: 'insensitive' as const } },
              { transactionReference: { contains: word, mode: 'insensitive' as const } },
              { student: { firstName: { contains: word, mode: 'insensitive' as const } } },
              { student: { lastName: { contains: word, mode: 'insensitive' as const } } },
              { student: { studentId: { contains: word, mode: 'insensitive' as const } } },
              { student: { rollNumber: { contains: word, mode: 'insensitive' as const } } },
              { student: { phone: { contains: word, mode: 'insensitive' as const } } },
            ],
          })),
        ];
      }
    }

    return prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        student: {
          include: {
            course: true,
            batch: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.PaymentUncheckedCreateInput): Promise<Payment> {
    return prisma.payment.create({
      data,
      include: {
        student: {
          include: {
            course: true,
            batch: true,
          },
        },
      },
    });
  }

  async getTotalRevenue(): Promise<number> {
    const sum = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
    });
    return sum._sum.amount || 0;
  }
}

export const paymentRepository = new PaymentRepository();
