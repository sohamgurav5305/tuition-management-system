import prisma from '../prisma/client';
import { Prisma, Assignment } from '@prisma/client';

export class AssignmentRepository {
  async findById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        batch: {
          include: {
            course: true,
            faculty: true,
          },
        },
      },
    });
  }

  async findByAssignmentId(assignmentId: string) {
    return prisma.assignment.findUnique({
      where: { assignmentId },
      include: {
        batch: true,
      },
    });
  }

  async findAll(filters?: { batchId?: string; status?: string; subject?: string }) {
    const where: Prisma.AssignmentWhereInput = {};
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.status) where.status = filters.status;
    if (filters?.subject) where.subject = { contains: filters.subject };

    return prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        batch: {
          include: { course: true, faculty: true },
        },
        faculty: true,
      },
    });
  }

  async findByBatchId(batchId: string) {
    return prisma.assignment.findMany({
      where: { batchId },
      orderBy: { dueDate: 'asc' },
      include: {
        batch: {
          include: { course: true, faculty: true },
        },
        faculty: true,
      },
    });
  }

  async create(data: Prisma.AssignmentUncheckedCreateInput): Promise<Assignment> {
    return prisma.assignment.create({
      data,
      include: {
        batch: true,
      },
    });
  }

  async update(id: string, data: Prisma.AssignmentUncheckedUpdateInput): Promise<Assignment> {
    return prisma.assignment.update({
      where: { id },
      data,
      include: {
        batch: true,
      },
    });
  }

  async delete(id: string): Promise<Assignment> {
    return prisma.assignment.delete({
      where: { id },
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
