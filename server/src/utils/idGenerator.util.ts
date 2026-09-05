import prisma from '../prisma/client';

async function generateSequentialId(
  prefix: string,
  modelName: keyof typeof prisma,
  fieldName: string,
  digits: number = 4
): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const delegate = (prisma as any)[modelName];

  let nextSeq = 1;

  try {
    const latest = await delegate.findFirst({
      where: { [fieldName]: { startsWith: fullPrefix } },
      orderBy: { [fieldName]: 'desc' },
      select: { [fieldName]: true },
    });

    if (latest && latest[fieldName]) {
      const parts = String(latest[fieldName]).split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    } else {
      const count = await delegate.count();
      nextSeq = count + 1;
    }
  } catch (e) {
    const count = await delegate.count();
    nextSeq = count + 1;
  }

  let candidate = `${fullPrefix}${String(nextSeq).padStart(digits, '0')}`;
  while (await delegate.findUnique({ where: { [fieldName]: candidate } })) {
    nextSeq++;
    candidate = `${fullPrefix}${String(nextSeq).padStart(digits, '0')}`;
  }

  return candidate;
}

export async function generateStudentId(): Promise<string> {
  return generateSequentialId('STU', 'student', 'studentId', 4);
}

export async function generateFacultyId(): Promise<string> {
  return generateSequentialId('FAC', 'faculty', 'facultyId', 4);
}

export async function generateCourseId(): Promise<string> {
  return generateSequentialId('CRS', 'course', 'courseId', 4);
}

export async function generateBatchId(): Promise<string> {
  return generateSequentialId('BAT', 'batch', 'batchId', 4);
}

export async function generateReceiptId(): Promise<string> {
  return generateSequentialId('REC', 'payment', 'receiptId', 5);
}

export async function generateAssignmentId(): Promise<string> {
  return generateSequentialId('ASN', 'assignment', 'assignmentId', 4);
}

export async function generateClassroomId(): Promise<string> {
  return generateSequentialId('CLR', 'classroom', 'roomId', 4);
}

export async function generateMaterialId(): Promise<string> {
  return generateSequentialId('MAT', 'studyMaterial', 'materialId', 4);
}

export async function generateSubmissionId(): Promise<string> {
  return generateSequentialId('SUB', 'assignmentSubmission', 'submissionId', 4);
}

export async function generateDoubtId(): Promise<string> {
  return generateSequentialId('DBT', 'doubt', 'doubtId', 4);
}

