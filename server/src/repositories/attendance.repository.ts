import prisma from '../prisma/client';
import { Prisma, Attendance } from '@prisma/client';

export class AttendanceRepository {
  async findByBatchAndDate(batchId: string, date: string, subject?: string) {
    const where: Prisma.AttendanceWhereInput = {
      batchId,
      date,
    };
    if (subject && subject !== 'ALL') {
      where.subject = subject;
    }

    return prisma.attendance.findMany({
      where,
      include: {
        student: true,
        faculty: true,
      },
      orderBy: {
        student: { firstName: 'asc' },
      },
    });
  }

  async findByBatchAndDateRange(batchId: string, startDate: string, endDate: string) {
    return prisma.attendance.findMany({
      where: {
        batchId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        student: true,
        faculty: true,
      },
      orderBy: [
        { date: 'asc' },
        { subject: 'asc' },
      ],
    });
  }

  async findByStudent(studentId: string, subject?: string) {
    const where: Prisma.AttendanceWhereInput = { studentId };
    if (subject && subject !== 'ALL') {
      where.subject = subject;
    }

    return prisma.attendance.findMany({
      where,
      include: {
        batch: {
          include: { course: true },
        },
        faculty: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async recordAttendance(
    batchId: string,
    date: string,
    subject: string,
    records: { studentId: string; status: string; remarks?: string }[],
    markedById?: string,
    facultyId?: string
  ) {
    const cleanSubject = subject || 'General';
    const transactions = records.map((record) => {
      return prisma.attendance.upsert({
        where: {
          batchId_studentId_date_subject: {
            batchId,
            studentId: record.studentId,
            date,
            subject: cleanSubject,
          },
        },
        update: {
          status: record.status,
          remarks: record.remarks,
          markedById,
          facultyId: facultyId || null,
        },
        create: {
          batchId,
          studentId: record.studentId,
          date,
          subject: cleanSubject,
          status: record.status,
          remarks: record.remarks,
          markedById,
          facultyId: facultyId || null,
        },
      });
    });

    return prisma.$transaction(transactions);
  }

  async getStudentAttendanceStats(studentId: string) {
    const records = await prisma.attendance.findMany({
      where: { studentId },
      include: { faculty: true },
    });

    const total = records.length;
    if (total === 0) {
      return { total: 0, present: 0, absent: 0, percentage: 0, subjects: {} };
    }

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const percentage = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 0;

    // Subject-wise stats breakdown
    const subjectGroups: { [subj: string]: typeof records } = {};
    for (const r of records) {
      const s = r.subject || 'General';
      if (!subjectGroups[s]) subjectGroups[s] = [];
      subjectGroups[s].push(r);
    }

    const subjects: {
      [subj: string]: {
        total: number;
        present: number;
        absent: number;
        percentage: number;
        facultyName?: string;
      };
    } = {};

    for (const [subj, subList] of Object.entries(subjectGroups)) {
      const subTotal = subList.length;
      const subPres = subList.filter((r) => r.status === 'PRESENT').length;
      const subAbs = subList.filter((r) => r.status === 'ABSENT').length;
      const subPct = subTotal > 0 ? Number(((subPres / subTotal) * 100).toFixed(1)) : 0;
      const faculty = subList.find((r) => r.faculty)?.faculty;

      subjects[subj] = {
        total: subTotal,
        present: subPres,
        absent: subAbs,
        percentage: subPct,
        facultyName: faculty ? `${faculty.firstName} ${faculty.lastName}` : undefined,
      };
    }

    return {
      total,
      present,
      absent,
      percentage,
      subjects,
    };
  }

  async getInstituteAttendanceStats() {
    const [total, present, absent] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: 'PRESENT' } }),
      prisma.attendance.count({ where: { status: 'ABSENT' } }),
    ]);

    if (total === 0) return { total: 0, present: 0, absent: 0, averagePercentage: 0 };
    const averagePercentage = Number(((present / total) * 100).toFixed(1));

    return {
      total,
      present,
      absent,
      averagePercentage,
    };
  }
}

export const attendanceRepository = new AttendanceRepository();

