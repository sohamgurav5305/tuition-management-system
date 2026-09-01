import prisma from '../prisma/client';

export async function resolveFacultyId(user?: any): Promise<string | null> {
  if (!user) return null;
  const faculty = await prisma.faculty.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
        { id: user.id },
      ],
    },
  });
  return faculty?.id || null;
}

export async function resolveStudentId(user?: any): Promise<string | null> {
  if (user?.studentId) return user.studentId;
  if (!user) return null;
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { email: user.email },
        { id: user.id },
      ],
    },
  });
  return student?.id || null;
}

export async function getFacultyAssignedBatchIds(facultyId: string): Promise<string[]> {
  const allBatches = await prisma.batch.findMany({
    select: {
      id: true,
      facultyId: true,
      subjectTeachers: true,
    },
  });

  const assignedBatchIds: string[] = [];

  for (const b of allBatches) {
    if (b.facultyId === facultyId) {
      assignedBatchIds.push(b.id);
      continue;
    }
    if (b.subjectTeachers) {
      try {
        const mapping = JSON.parse(b.subjectTeachers);
        if (Object.values(mapping).includes(facultyId)) {
          assignedBatchIds.push(b.id);
        }
      } catch {
        // ignore parse error
      }
    }
  }

  return assignedBatchIds;
}
