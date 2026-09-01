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
      return { total: 0, present: 0, late: 0, absent: 0, percentage: 0, subjects: {} };
    }

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const percentage = Number((((present + late * 0.8) / total) * 100).toFixed(1));

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
        late: number;
        absent: number;
        percentage: number;
        facultyName?: string;
      };
    } = {};

    for (const [subj, subList] of Object.entries(subjectGroups)) {
      const subTotal = subList.length;
      const subPres = subList.filter((r) => r.status === 'PRESENT').length;
      const subLt = subList.filter((r) => r.status === 'LATE').length;
      const subAbs = subList.filter((r) => r.status === 'ABSENT').length;
      const subPct = subTotal > 0 ? Number((((subPres + subLt * 0.8) / subTotal) * 100).toFixed(1)) : 0;
      const faculty = subList.find((r) => r.faculty)?.faculty;

      subjects[subj] = {
        total: subTotal,
        present: subPres,
        late: subLt,
        absent: subAbs,
        percentage: subPct,
        facultyName: faculty ? `${faculty.firstName} ${faculty.lastName}` : undefined,
      };
    }

    return {
      total,
      present,
      late,
      absent,
      percentage,
      subjects,
    };
  }

  async getInstituteAttendanceStats() {
    const records = await prisma.attendance.findMany();
    const total = records.length;
    if (total === 0) return { total: 0, present: 0, late: 0, absent: 0, averagePercentage: 0 };

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const averagePercentage = Number((((present + late * 0.8) / total) * 100).toFixed(1));

    return {
      total,
      present,
      late,
      absent,
      averagePercentage,
    };
  }
}

export const attendanceRepository = new AttendanceRepository();
