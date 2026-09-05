import prisma from '../prisma/client';
import { Prisma, Faculty } from '@prisma/client';

export class FacultyRepository {
  async findById(id: string) {
    return prisma.faculty.findUnique({
      where: { id },
      include: {
        user: true,
        batches: {
          include: {
            course: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });
  }

  async findByFacultyId(facultyId: string) {
    return prisma.faculty.findUnique({
      where: { facultyId },
      include: {
        user: true,
        batches: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.faculty.findUnique({
      where: { userId },
      include: {
        user: true,
        batches: {
          include: {
            course: true,
            students: true,
            exams: true,
            assignments: true,
          },
        },
      },
    });
  }

  async findAll(search?: string) {
    const where: Prisma.FacultyWhereInput = {};

    if (search?.trim()) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          ...words.map((word) => ({
            OR: [
              { firstName: { contains: word, mode: 'insensitive' as const } },
              { lastName: { contains: word, mode: 'insensitive' as const } },
              { facultyId: { contains: word, mode: 'insensitive' as const } },
              { email: { contains: word, mode: 'insensitive' as const } },
              { phone: { contains: word, mode: 'insensitive' as const } },
              { subjectTaught: { contains: word, mode: 'insensitive' as const } },
              { qualification: { contains: word, mode: 'insensitive' as const } },
            ],
          })),
        ];
      }
    }

    return prisma.faculty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        batches: {
          include: {
            course: true,
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: { batches: true },
        },
      },
    });
  }

  async create(data: Prisma.FacultyUncheckedCreateInput): Promise<Faculty> {
    return prisma.faculty.create({
      data,
    });
  }

  async update(id: string, data: Prisma.FacultyUncheckedUpdateInput): Promise<Faculty> {
    return prisma.faculty.update({
      where: { id },
      data,
      include: {
        batches: true,
      },
    });
  }

  async delete(id: string): Promise<Faculty> {
    return prisma.faculty.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.FacultyWhereInput): Promise<number> {
    return prisma.faculty.count({ where });
  }
}

export const facultyRepository = new FacultyRepository();
