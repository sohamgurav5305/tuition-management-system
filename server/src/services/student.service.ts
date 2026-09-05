import { studentRepository, StudentFilterParams } from '../repositories/student.repository';
import { courseRepository } from '../repositories/course.repository';
import { batchRepository } from '../repositories/batch.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { generateStudentId } from '../utils/idGenerator.util';
import { realtimeHub } from '../utils/eventEmitter';
import { storage } from '../storage';
import { batchService } from './batch.service';
import prisma from '../prisma/client';
import bcrypt from 'bcryptjs';

export class StudentService {
  async getAllStudents(filters?: StudentFilterParams) {
    const students = await studentRepository.findAll(filters);
    return Promise.all(
      students.map(async (student) => {
        const attendanceStats = await attendanceRepository.getStudentAttendanceStats(student.id);
        return {
          ...student,
          avatarUrl: student.avatarUrl ? storage.getUrl(student.avatarUrl) : null,
          attendancePercentage: attendanceStats.percentage,
        };
      })
    );
  }

  async getStudentById(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new Error('Student record not found');
    }

    const attendanceStats = await attendanceRepository.getStudentAttendanceStats(student.id);
    const installments = await prisma.feeInstallment.findMany({
      where: { studentId: id },
      orderBy: { installmentNo: 'asc' },
    });

    let batchEnriched = student.batch;
    if (student.batch) {
      batchEnriched = await batchService.getBatchById(student.batch.id);
    }

    return {
      ...student,
      batch: batchEnriched,
      avatarUrl: student.avatarUrl ? storage.getUrl(student.avatarUrl) : null,
      attendanceStats,
      installments,
    };
  }

  async getStudentByUserId(userId: string) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) {
      throw new Error('Student record not found for this user');
    }

    const attendanceStats = await attendanceRepository.getStudentAttendanceStats(student.id);
    const installments = await prisma.feeInstallment.findMany({
      where: { studentId: student.id },
      orderBy: { installmentNo: 'asc' },
    });

    let batchEnriched = student.batch;
    if (student.batch) {
      batchEnriched = await batchService.getBatchById(student.batch.id);
    }

    return {
      ...student,
      batch: batchEnriched,
      avatarUrl: student.avatarUrl ? storage.getUrl(student.avatarUrl) : null,
      attendanceStats,
      installments,
    };
  }

  async createStudent(data: any, file?: any) {
    if (data.totalFee !== undefined && Number(data.totalFee) < 0) {
      throw new Error('Total fee cannot be negative');
    }

    let standardFee = Number(data.totalFee || 0);
    if (data.courseId) {
      const course = await courseRepository.findById(data.courseId);
      if (!course) {
        throw new Error('Selected course does not exist');
      }
      standardFee = course.fee;
    }

    // Validate batch if provided
    if (data.batchId) {
      const batch = await batchRepository.findById(data.batchId);
      if (!batch) {
        throw new Error('Selected batch does not exist');
      }
    }

    const studentId = await generateStudentId();
    let avatarUrl: string | undefined = undefined;

    if (file) {
      avatarUrl = await storage.upload(file, 'profile-images');
    }

    // Auto-create login user account if doesn't exist
    let userId = data.userId;
    if (!userId && data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Student@123', salt);
        const cleanFirst = (data.firstName || 'student').toLowerCase().replace(/[^a-z]/g, '');
        const cleanLast = (data.lastName || 'applicant').toLowerCase().replace(/[^a-z]/g, '');
        const username = `stu.${cleanFirst}.${cleanLast}${Math.floor(100 + Math.random() * 900)}`;

        const newUser = await prisma.user.create({
          data: {
            username,
            email: data.email,
            passwordHash,
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        });
        userId = newUser.id;
      }
    }

    const scholarshipPct = Number(data.scholarshipPct || 0);
    const agreedTotalFee = Math.max(0, Math.round(standardFee * (1 - scholarshipPct / 100)));
    const paidFee = Number(data.paidFee ?? 0);
    const pendingFee = Math.max(0, agreedTotalFee - paidFee);

    const student = await studentRepository.create({
      studentId,
      userId,
      rollNumber: data.rollNumber || `26APX${studentId.split('-')[2] || '000'}`,
      courseId: data.courseId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      guardianName: data.guardianName,
      guardianRelation: data.guardianRelation,
      guardianPhone: data.guardianPhone,
      emergencyContact: data.emergencyContact || data.guardianPhone || data.phone || 'N/A',
      batchId: data.batchId || null,
      admissionDate: data.admissionDate || new Date().toISOString().split('T')[0],
      scholarshipPct,
      status: data.status || 'ACTIVE',
      avatarUrl,
      totalFee: agreedTotalFee,
      paidFee,
      pendingFee,
    });

    // Create 3 Term Installment Schedule
    const instAmt = Math.round(agreedTotalFee / 3);
    await prisma.feeInstallment.createMany({
      data: [
        { studentId: student.id, installmentNo: 1, title: 'Term 1: Admission & Kit', amount: instAmt, dueDate: student.admissionDate, status: paidFee >= instAmt ? 'PAID' : 'PENDING', paidAmount: Math.min(paidFee, instAmt) },
        { studentId: student.id, installmentNo: 2, title: 'Term 2: Mid-Term Tuition', amount: instAmt, dueDate: '2026-10-15', status: paidFee >= instAmt * 2 ? 'PAID' : 'PENDING', paidAmount: paidFee > instAmt ? Math.min(instAmt, paidFee - instAmt) : 0 },
        { studentId: student.id, installmentNo: 3, title: 'Term 3: Test Series & Booster', amount: agreedTotalFee - (instAmt * 2), dueDate: '2027-02-15', status: paidFee >= agreedTotalFee ? 'PAID' : 'PENDING', paidAmount: paidFee >= agreedTotalFee ? (agreedTotalFee - instAmt * 2) : 0 },
      ],
    });

    try {
      realtimeHub.broadcast('student:updated', { studentId: student.id, action: 'created' });
    } catch {}

    return student;
  }

  async updateStudent(id: string, data: any, file?: any) {
    const existing = await studentRepository.findById(id);
    if (!existing) {
      throw new Error('Student not found');
    }

    let avatarUrl = existing.avatarUrl;
    if (file) {
      if (existing.avatarUrl) {
        await storage.delete(existing.avatarUrl);
      }
      avatarUrl = await storage.upload(file, 'profile-images');
    }

    if (data.totalFee !== undefined && Number(data.totalFee) < 0) {
      throw new Error('Total fee cannot be negative');
    }

    const totalFee = data.totalFee !== undefined ? Math.max(0, Number(data.totalFee)) : existing.totalFee;
    const paidFee = existing.paidFee;
    const pendingFee = Math.max(0, totalFee - paidFee);

    const updated = await studentRepository.update(id, {
      firstName: data.firstName ?? existing.firstName,
      lastName: data.lastName ?? existing.lastName,
      rollNumber: data.rollNumber ?? existing.rollNumber,
      dateOfBirth: data.dateOfBirth ?? existing.dateOfBirth,
      gender: data.gender ?? existing.gender,
      phone: data.phone ?? existing.phone,
      email: data.email ?? existing.email,
      address: data.address ?? existing.address,
      guardianName: data.guardianName ?? existing.guardianName,
      guardianRelation: data.guardianRelation ?? existing.guardianRelation,
      guardianPhone: data.guardianPhone ?? existing.guardianPhone,
      emergencyContact: data.emergencyContact !== undefined ? (data.emergencyContact || data.guardianPhone || data.phone || 'N/A') : existing.emergencyContact,
      courseId: data.courseId ?? existing.courseId,
      batchId: data.batchId !== undefined ? (data.batchId || null) : existing.batchId,
      admissionDate: data.admissionDate ?? existing.admissionDate,
      scholarshipPct: data.scholarshipPct !== undefined ? Number(data.scholarshipPct) : existing.scholarshipPct,
      status: data.status ?? existing.status,
      avatarUrl,
      totalFee,
      pendingFee,
    });

    try {
      realtimeHub.broadcast('student:updated', { studentId: updated.id, action: 'updated' });
    } catch {}

    return updated;
  }

  async deleteStudent(id: string) {
    const existing = await studentRepository.findById(id);
    if (!existing) {
      throw new Error('Student not found');
    }

    if (existing.avatarUrl) {
      await storage.delete(existing.avatarUrl);
    }

    const res = await studentRepository.delete(id);
    try {
      realtimeHub.broadcast('student:updated', { studentId: id, action: 'deleted' });
    } catch {}
    return res;
  }
}

export const studentService = new StudentService();
