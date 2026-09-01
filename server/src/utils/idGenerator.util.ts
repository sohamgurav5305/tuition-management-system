import prisma from '../prisma/client';

export async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.student.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `STU-${year}-${sequence}`;
}

export async function generateFacultyId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.faculty.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `FAC-${year}-${sequence}`;
}

export async function generateCourseId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.course.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `CRS-${year}-${sequence}`;
}

export async function generateBatchId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.batch.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `BAT-${year}-${sequence}`;
}

export async function generateReceiptId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.payment.count();
  const sequence = String(count + 1).padStart(5, '0');
  return `REC-${year}-${sequence}`;
}

export async function generateExamId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.examination.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `EXM-${year}-${sequence}`;
}

export async function generateAssignmentId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.assignment.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `ASN-${year}-${sequence}`;
}

export async function generateResultId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.result.count();
  const sequence = String(count + 1).padStart(5, '0');
  return `RES-${year}-${sequence}`;
}

export async function generateClassroomId(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.classroom.count();
  const sequence = String(count + 1).padStart(4, '0');
  return `CLR-${year}-${sequence}`;
}

