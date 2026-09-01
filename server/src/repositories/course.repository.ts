import prisma from '../prisma/client';
import { Prisma, Course } from '@prisma/client';

export class CourseRepository {
  async findById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        batches: {
          include: {
            faculty: true,
            _count: { select: { students: true } },
          },
        },
        _count: {
          select: {
            students: true,
            batches: true,
            exams: true,
          },
        },
      },
    });
  }

  async findByCourseId(courseId: string) {
    return prisma.course.findUnique({
      where: { courseId },
    });
  }

  async findAll(status?: string) {
    const where: Prisma.CourseWhereInput = {};
    if (status) {
      where.status = status;
    }

    return prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            students: true,
            batches: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return prisma.course.create({
      data,
    });
  }

  async update(id: string, data: Prisma.CourseUpdateInput): Promise<Course> {
    return prisma.course.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Course> {
    return prisma.course.delete({
      where: { id },
    });
  }

  async count(where?: Prisma.CourseWhereInput): Promise<number> {
    return prisma.course.count({ where });
  }
}

export const courseRepository = new CourseRepository();
