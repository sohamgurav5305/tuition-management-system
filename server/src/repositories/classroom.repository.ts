import prisma from '../prisma/client';
import { Prisma, Classroom } from '@prisma/client';

export class ClassroomRepository {
  async findById(id: string): Promise<Classroom | null> {
    return prisma.classroom.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Classroom | null> {
    return prisma.classroom.findUnique({
      where: { name },
    });
  }

  async findAll(status?: string): Promise<Classroom[]> {
    const where: Prisma.ClassroomWhereInput = {};
    if (status) {
      where.status = status;
    }

    return prisma.classroom.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.ClassroomCreateInput): Promise<Classroom> {
    return prisma.classroom.create({
      data,
    });
  }

  async update(id: string, data: Prisma.ClassroomUpdateInput): Promise<Classroom> {
    return prisma.classroom.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Classroom> {
    return prisma.classroom.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.ClassroomWhereInput): Promise<number> {
    return prisma.classroom.count({ where });
  }
}

export const classroomRepository = new ClassroomRepository();
