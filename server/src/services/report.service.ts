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
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      totalBatches,
      totalRevenue,
      attendanceStats,
      allStudents,
    ] = await Promise.all([
      studentRepository.count(),
      facultyRepository.count(),
      courseRepository.count(),
      batchRepository.count({ status: 'ACTIVE' }),
      paymentRepository.getTotalRevenue(),
      attendanceRepository.getInstituteAttendanceStats(),
      prisma.student.findMany({ select: { totalFee: true, paidFee: true, pendingFee: true } }),
    ]);

    const totalFeeObligation = allStudents.reduce((sum, s) => sum + s.totalFee, 0);
    const totalPendingFees = allStudents.reduce((sum, s) => sum + s.pendingFee, 0);
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
      feeCollectionRate,
      attendanceAverage: attendanceStats.averagePercentage,
      attendanceStats,
    };
  }

  async getRevenueReport() {
    const payments = await prisma.payment.findMany({
      include: {
        student: {
          include: {
            course: true,
            batch: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

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
      totalTransactions: payments.length,
      modeBreakdown,
      payments,
    };
  }

  async getPendingFeesReport() {
    const studentsWithPending = await prisma.student.findMany({
      where: {
        pendingFee: { gt: 0 },
      },
      include: {
        course: true,
        batch: true,
      },
      orderBy: { pendingFee: 'desc' },
    });

    const totalPending = studentsWithPending.reduce((sum, s) => sum + s.pendingFee, 0);

    return {
      totalPendingAmount: totalPending,
      studentCount: studentsWithPending.length,
      students: studentsWithPending,
    };
  }

  async getBatchStrengthReport() {
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
        faculty: true,
        students: true,
      },
    });

    return batches.map(b => {
      const enrolled = b.students.length;
      return {
        id: b.id,
        batchId: b.batchId,
        name: b.name,
        courseName: b.course.name,
        facultyName: `${b.faculty.firstName} ${b.faculty.lastName}`,
        classroom: b.classroom,
        enrolledCount: enrolled,
        status: b.status,
      };
    });
  }

  async getCourseRevenueReport() {
    const courses = await prisma.course.findMany({
      include: {
        students: true,
        batches: true,
      },
    });

    return courses.map(c => {
      const studentCount = c.students.length;
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
        batchCount: c.batches.length,
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
