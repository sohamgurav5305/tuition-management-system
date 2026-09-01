import prisma from '../prisma/client';
import { Prisma, AssignmentSubmission } from '@prisma/client';

export class SubmissionRepository {
  async findById(id: string) {
    return prisma.assignmentSubmission.findUnique({
      where: { id },
      include: {
        student: true,
        assignment: true,
      },
    });
  }

  async findByAssignmentAndStudent(assignmentId: string, studentId: string) {
    return prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      include: {
        student: true,
        assignment: true,
      },
    });
  }

  async findByAssignmentId(assignmentId: string) {
    return prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            rollNumber: true,
            avatarUrl: true,
            email: true,
          },
        },
        assignment: {
          select: {
            id: true,
            assignmentId: true,
            title: true,
            totalMarks: true,
            dueDate: true,
          },
        },
      },
    });
  }

  async findByStudentId(studentId: string) {
    return prisma.assignmentSubmission.findMany({
      where: { studentId },
      orderBy: { submittedAt: 'desc' },
      include: {
        assignment: true,
      },
    });
  }

  async count(where?: Prisma.AssignmentSubmissionWhereInput) {
    return prisma.assignmentSubmission.count({ where });
  }

  async create(data: Prisma.AssignmentSubmissionUncheckedCreateInput): Promise<AssignmentSubmission> {
    return prisma.assignmentSubmission.create({
      data,
      include: {
        student: true,
        assignment: true,
      },
    });
  }

  async update(id: string, data: Prisma.AssignmentSubmissionUncheckedUpdateInput): Promise<AssignmentSubmission> {
    return prisma.assignmentSubmission.update({
      where: { id },
      data,
      include: {
        student: true,
        assignment: true,
      },
    });
  }

  async upsert(
    assignmentId: string,
    studentId: string,
    data: Omit<Prisma.AssignmentSubmissionUncheckedCreateInput, 'assignmentId' | 'studentId'>
  ): Promise<AssignmentSubmission> {
    return prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      create: {
        ...data,
        assignmentId,
        studentId,
      },
      update: data,
      include: {
        student: true,
        assignment: true,
      },
    });
  }
}

export const submissionRepository = new SubmissionRepository();
