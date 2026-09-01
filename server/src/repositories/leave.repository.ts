import prisma from '../prisma/client';
import { Prisma, LeaveRequest } from '@prisma/client';

export class LeaveRepository {
  async findById(id: string) {
    return prisma.leaveRequest.findUnique({
      where: { id },
      include: { student: true },
    });
  }

  async findAll(filters?: { studentId?: string; status?: string }) {
    const where: Prisma.LeaveRequestWhereInput = {};

    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.status) where.status = filters.status;

    return prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, studentId: true, firstName: true, lastName: true, rollNumber: true, phone: true, guardianPhone: true, batchId: true },
        },
      },
    });
  }

  async create(data: Prisma.LeaveRequestUncheckedCreateInput): Promise<LeaveRequest> {
    return prisma.leaveRequest.create({ data });
  }

  async update(id: string, data: Prisma.LeaveRequestUncheckedUpdateInput): Promise<LeaveRequest> {
    return prisma.leaveRequest.update({ where: { id }, data });
  }

  async delete(id: string): Promise<LeaveRequest> {
    return prisma.leaveRequest.delete({ where: { id } });
  }
}

export const leaveRepository = new LeaveRepository();
