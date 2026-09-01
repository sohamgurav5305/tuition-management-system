import prisma from '../prisma/client';
import { Prisma, Doubt } from '@prisma/client';

export class DoubtRepository {
  async findById(id: string) {
    return prisma.doubt.findUnique({
      where: { id },
      include: { student: true, faculty: true },
    });
  }

  async findAll(filters?: { studentId?: string; facultyId?: string; status?: string; subject?: string }) {
    const where: Prisma.DoubtWhereInput = {};

    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.facultyId) where.facultyId = filters.facultyId;
    if (filters?.status) where.status = filters.status;
    if (filters?.subject) where.subject = filters.subject;

    return prisma.doubt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, studentId: true, firstName: true, lastName: true, rollNumber: true, avatarUrl: true },
        },
        faculty: {
          select: { id: true, facultyId: true, firstName: true, lastName: true, subjectTaught: true },
        },
      },
    });
  }

  async create(data: Prisma.DoubtUncheckedCreateInput): Promise<Doubt> {
    return prisma.doubt.create({ data });
  }

  async update(id: string, data: Prisma.DoubtUncheckedUpdateInput): Promise<Doubt> {
    return prisma.doubt.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Doubt> {
    return prisma.doubt.delete({ where: { id } });
  }
}

export const doubtRepository = new DoubtRepository();
