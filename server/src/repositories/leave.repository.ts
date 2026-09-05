import prisma from '../prisma/client';
import { Prisma, LeaveRequest } from '@prisma/client';

export class LeaveRepository {
  async findById(id: string) {
    return prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            phone: true,
            guardianPhone: true,
            batchId: true,
            batch: { select: { id: true, name: true } },
          },
        },
        faculty: {
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            subjectTaught: true,
            qualification: true,
          },
        },
      },
    });
  }

  async findAll(filters?: {
    studentId?: string;
    facultyId?: string;
    applicantType?: string;
    status?: string;
  }) {
    const where: Prisma.LeaveRequestWhereInput = {};

    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.facultyId) where.facultyId = filters.facultyId;
    if (filters?.applicantType) where.applicantType = filters.applicantType;
    if (filters?.status) where.status = filters.status;

    return prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            phone: true,
            guardianPhone: true,
            batchId: true,
            batch: { select: { id: true, name: true } },
          },
        },
        faculty: {
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            subjectTaught: true,
            qualification: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.LeaveRequestUncheckedCreateInput): Promise<LeaveRequest> {
    return prisma.leaveRequest.create({
      data,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            phone: true,
            guardianPhone: true,
            batchId: true,
          },
        },
        faculty: {
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            subjectTaught: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LeaveRequestUncheckedUpdateInput): Promise<LeaveRequest> {
    return prisma.leaveRequest.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            phone: true,
            guardianPhone: true,
            batchId: true,
          },
        },
        faculty: {
          select: {
            id: true,
            facultyId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            subjectTaught: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<LeaveRequest> {
    return prisma.leaveRequest.delete({ where: { id } });
  }
}

export const leaveRepository = new LeaveRepository();
