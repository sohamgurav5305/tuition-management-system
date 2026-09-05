import prisma from '../prisma/client';
import { paymentRepository } from '../repositories/payment.repository';
import { studentRepository } from '../repositories/student.repository';
import { facultyRepository } from '../repositories/faculty.repository';
import { courseRepository } from '../repositories/course.repository';
import { batchRepository } from '../repositories/batch.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { jsonToCsv } from '../utils/csvExporter.util';

export class ReportService {
  async getDashboardSummary(role: string, userId?: string) {
    if (role === 'STUDENT' && userId) {
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { id: true, batchId: true, totalFee: true, paidFee: true, pendingFee: true },
      });

      if (student) {
        const [attStats, assignmentCount] = await Promise.all([
          attendanceRepository.getStudentAttendanceStats(student.id),
          student.batchId ? prisma.assignment.count({ where: { batchId: student.batchId, status: 'OPEN' } }) : 0,
        ]);

        return {
          totalStudents: 1,
          totalRevenue: student.paidFee,
          totalFeeObligation: student.totalFee,
          totalPendingFees: student.pendingFee,
          pendingFees: student.pendingFee,
          feeCollectionRate: student.totalFee > 0 ? Number(((student.paidFee / student.totalFee) * 100).toFixed(1)) : 0,
          attendanceAverage: attStats.percentage,
          attendanceStats: attStats,
          openAssignments: assignmentCount,
        };
      }
    }

    if (role === 'TEACHER' && userId) {
      const faculty = await prisma.faculty.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (faculty) {
        const [assignedBatches, openDoubts, pendingAssignments, batchStudents] = await Promise.all([
          prisma.batch.count({ where: { facultyId: faculty.id, status: 'ACTIVE' } }),
          prisma.doubt.count({ where: { facultyId: faculty.id, status: 'OPEN' } }),
          prisma.assignment.count({ where: { facultyId: faculty.id, status: 'OPEN' } }),
          prisma.student.count({ where: { batch: { facultyId: faculty.id } } }),
        ]);

        return {
          totalBatches: assignedBatches,
          openDoubts,
          pendingAssignments,
          totalStudents: batchStudents,
        };
      }
    }

    if (role === 'ACCOUNTANT') {
      const [totalRevenue, feeAggregate, totalStudents] = await Promise.all([
        paymentRepository.getTotalRevenue(),
        prisma.student.aggregate({
          _sum: {
            totalFee: true,
            paidFee: true,
            pendingFee: true,
          },
        }),
        studentRepository.count(),
      ]);

      const totalFeeObligation = feeAggregate._sum.totalFee || 0;
      const totalPendingFees = feeAggregate._sum.pendingFee || 0;
      const feeCollectionRate = totalFeeObligation > 0
        ? Number(((totalRevenue / totalFeeObligation) * 100).toFixed(1))
        : 0;

      return {
        totalStudents,
        totalRevenue,
        totalFeeObligation,
        totalPendingFees,
        pendingFees: totalPendingFees,
        feeCollectionRate,
      };
    }

    // Default: Administrator summary using fast SQL aggregations
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      totalBatches,
      totalRevenue,
      attendanceStats,
      feeAggregate,
    ] = await Promise.all([
      studentRepository.count(),
      facultyRepository.count(),
      courseRepository.count(),
      batchRepository.count({ status: 'ACTIVE' }),
      paymentRepository.getTotalRevenue(),
      attendanceRepository.getInstituteAttendanceStats(),
      prisma.student.aggregate({
        _sum: {
          totalFee: true,
          paidFee: true,
          pendingFee: true,
        },
      }),
    ]);

    const totalFeeObligation = feeAggregate._sum.totalFee || 0;
    const totalPendingFees = feeAggregate._sum.pendingFee || 0;
    const feeCollectionRate = totalFeeObligation > 0
      ? Number(((totalRevenue / totalFeeObligation) * 100).toFixed(1))
      : 0;

    return {
      totalStudents,
      totalFaculty,
      totalCourses,
      totalBatches,
      totalRevenue,
      totalFeeObligation,
      totalPendingFees,
      pendingFees: totalPendingFees,
      feeCollectionRate,
      attendanceAverage: attendanceStats.averagePercentage,
      attendanceStats,
    };
  }

  async getRevenueReport() {
    const [aggregate, payments] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.findMany({
        select: {
          id: true,
          receiptId: true,
          amount: true,
          paymentDate: true,
          paymentMode: true,
          transactionReference: true,
          student: {
            select: {
              studentId: true,
              firstName: true,
              lastName: true,
              course: { select: { name: true } },
              batch: { select: { name: true } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    const totalRevenue = aggregate._sum.amount || 0;
    const modeBreakdown: Record<string, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      UPI: { count: 0, total: 0 },
      BANK_TRANSFER: { count: 0, total: 0 },
    };

    payments.forEach(p => {
      if (modeBreakdown[p.paymentMode]) {
        modeBreakdown[p.paymentMode].count += 1;
        modeBreakdown[p.paymentMode].total += p.amount;
      }
    });

    return {
      totalRevenue,
      totalTransactions: aggregate._count.id || 0,
      modeBreakdown,
      payments,
    };
  }

  async getPendingFeesReport() {
    const [aggregate, studentsWithPending] = await Promise.all([
      prisma.student.aggregate({
        where: { pendingFee: { gt: 0 } },
        _sum: { pendingFee: true },
        _count: { id: true },
      }),
      prisma.student.findMany({
        where: { pendingFee: { gt: 0 } },
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          phone: true,
          totalFee: true,
          paidFee: true,
          pendingFee: true,
          course: { select: { name: true } },
          batch: { select: { name: true } },
        },
        orderBy: { pendingFee: 'desc' },
      }),
    ]);

    return {
      totalPendingAmount: aggregate._sum.pendingFee || 0,
      studentCount: aggregate._count.id || 0,
      students: studentsWithPending,
    };
  }

  async getBatchStrengthReport() {
    const batches = await prisma.batch.findMany({
      include: {
        course: { select: { name: true } },
        faculty: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
    });

    return batches.map(b => ({
      id: b.id,
      batchId: b.batchId,
      name: b.name,
      courseName: b.course.name,
      facultyName: `${b.faculty.firstName} ${b.faculty.lastName}`,
      classroom: b.classroom,
      enrolledCount: b._count.students,
      status: b.status,
    }));
  }

  async getCourseRevenueReport() {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { batches: true, students: true } },
        students: {
          select: { totalFee: true, paidFee: true, pendingFee: true },
        },
      },
    });

    return courses.map(c => {
      const studentCount = c._count.students;
      const expectedRevenue = c.students.reduce((sum, s) => sum + s.totalFee, 0);
      const collectedRevenue = c.students.reduce((sum, s) => sum + s.paidFee, 0);
      const pendingRevenue = c.students.reduce((sum, s) => sum + s.pendingFee, 0);
      const collectionRate = expectedRevenue > 0 ? Number(((collectedRevenue / expectedRevenue) * 100).toFixed(1)) : 0;

      return {
        id: c.id,
        courseId: c.courseId,
        courseName: c.name,
        standardFee: c.fee,
        duration: c.duration,
        batchCount: c._count.batches,
        studentCount,
        expectedRevenue,
        collectedRevenue,
        pendingRevenue,
        collectionRate,
        status: c.status,
      };
    });
  }

  async exportCsvReport(type: 'revenue' | 'pending-fees' | 'attendance' | 'batch-strength' | 'course-revenue'): Promise<{ csv: string; filename: string }> {
    const timestamp = new Date().toISOString().split('T')[0];

    if (type === 'revenue') {
      const { payments } = await this.getRevenueReport();
      const rows = payments.map(p => ({
        receiptId: p.receiptId,
        studentId: p.student.studentId,
        studentName: `${p.student.firstName} ${p.student.lastName}`,
        course: p.student.course?.name || 'Unassigned',
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMode: p.paymentMode,
        reference: p.transactionReference || 'N/A',
      }));
      const csv = jsonToCsv(rows, [
        { key: 'receiptId', label: 'Receipt ID' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'course', label: 'Course' },
        { key: 'amount', label: 'Amount' },
        { key: 'paymentDate', label: 'Date' },
        { key: 'paymentMode', label: 'Mode' },
        { key: 'reference', label: 'Reference' },
      ]);
      return { csv, filename: `revenue-report-${timestamp}.csv` };
    }

    if (type === 'pending-fees') {
      const { students } = await this.getPendingFeesReport();
      const rows = students.map(s => ({
        studentId: s.studentId,
        studentName: `${s.firstName} ${s.lastName}`,
        phone: s.phone,
        course: s.course?.name || 'Unassigned',
        batch: s.batch?.name || 'Unassigned',
        totalFee: s.totalFee,
        paidFee: s.paidFee,
        pendingFee: s.pendingFee,
      }));
      const csv = jsonToCsv(rows, [
        { key: 'studentId', label: 'Student ID' },
        { key: 'studentName', label: 'Student Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'course', label: 'Course' },
        { key: 'batch', label: 'Batch' },
        { key: 'totalFee', label: 'Total Fee' },
        { key: 'paidFee', label: 'Paid Fee' },
        { key: 'pendingFee', label: 'Pending Fee' },
      ]);
      return { csv, filename: `pending-fees-report-${timestamp}.csv` };
    }

    if (type === 'batch-strength') {
      const batches = await this.getBatchStrengthReport();
      const rows = batches.map(b => ({
        batchId: b.batchId,
        name: b.name,
        course: b.courseName,
        faculty: b.facultyName,
        classroom: b.classroom,
        enrolled: b.enrolledCount,
        status: b.status,
      }));
      const csv = jsonToCsv(rows, [
        { key: 'batchId', label: 'Batch ID' },
        { key: 'name', label: 'Batch Name' },
        { key: 'course', label: 'Course' },
        { key: 'faculty', label: 'Faculty' },
        { key: 'classroom', label: 'Classroom' },
        { key: 'enrolled', label: 'Enrolled Students' },
        { key: 'status', label: 'Status' },
      ]);
      return { csv, filename: `batch-strength-report-${timestamp}.csv` };
    }

    if (type === 'course-revenue') {
      const courses = await this.getCourseRevenueReport();
      const rows = courses.map(c => ({
        courseId: c.courseId,
        name: c.courseName,
        fee: c.standardFee,
        batches: c.batchCount,
        students: c.studentCount,
        expected: c.expectedRevenue,
        collected: c.collectedRevenue,
        pending: c.pendingRevenue,
        rate: `${c.collectionRate}%`,
      }));
      const csv = jsonToCsv(rows, [
        { key: 'courseId', label: 'Course ID' },
        { key: 'name', label: 'Course Name' },
        { key: 'fee', label: 'Standard Fee' },
        { key: 'batches', label: 'Batches' },
        { key: 'students', label: 'Students' },
        { key: 'expected', label: 'Expected Revenue' },
        { key: 'collected', label: 'Collected Revenue' },
        { key: 'pending', label: 'Pending Revenue' },
        { key: 'rate', label: 'Collection Rate' },
      ]);
      return { csv, filename: `course-revenue-report-${timestamp}.csv` };
    }

    // Default attendance report
    const students = await prisma.student.findMany({
      include: {
        course: true,
        batch: true,
        attendance: true,
      },
    });

    const rows = students.map(s => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === 'PRESENT').length;
      const late = s.attendance.filter(a => a.status === 'LATE').length;
      const absent = s.attendance.filter(a => a.status === 'ABSENT').length;
      const pct = total > 0 ? (((present + late * 0.8) / total) * 100).toFixed(1) : '0.0';

      return {
        studentId: s.studentId,
        studentName: `${s.firstName} ${s.lastName}`,
        course: s.course?.name || 'Unassigned',
        batch: s.batch?.name || 'Unassigned',
        totalSessions: total,
        present,
        late,
        absent,
        attendancePercentage: `${pct}%`,
      };
    });

    const csv = jsonToCsv(rows, [
      { key: 'studentId', label: 'Student ID' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'course', label: 'Course' },
      { key: 'batch', label: 'Batch' },
      { key: 'totalSessions', label: 'Total Sessions' },
      { key: 'present', label: 'Present' },
      { key: 'late', label: 'Late' },
      { key: 'absent', label: 'Absent' },
      { key: 'attendancePercentage', label: 'Attendance %' },
    ]);

    return { csv, filename: `attendance-report-${timestamp}.csv` };
  }
}

export const reportService = new ReportService();
