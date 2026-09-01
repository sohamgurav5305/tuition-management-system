import { attendanceRepository } from '../repositories/attendance.repository';
import { batchRepository } from '../repositories/batch.repository';
import { studentRepository } from '../repositories/student.repository';
import prisma from '../prisma/client';

export class AttendanceService {
  async getBatchAttendanceForDate(batchId: string, date: string, subject?: string) {
    const batch = await batchRepository.findById(batchId);
    if (!batch) throw new Error('Batch not found');

    const cleanSubject = subject || 'General';
    const existingRecords = await attendanceRepository.findByBatchAndDate(batchId, date, cleanSubject);

    // Resolve subject instructor if configured in batch.subjectTeachers
    let subjectTeacher: any = batch.faculty;
    if (batch.subjectTeachers) {
      try {
        const mapping = JSON.parse(batch.subjectTeachers);
        if (mapping[cleanSubject]) {
          const fac = await prisma.faculty.findUnique({ where: { id: mapping[cleanSubject] } });
          if (fac) subjectTeacher = fac;
        }
      } catch (e) {
        // ignore json parse error
      }
    }

    // Combine with all enrolled students so teachers see entire student roster
    const roster = batch.students.map((student) => {
      const found = existingRecords.find((r) => r.studentId === student.id);
      return {
        studentId: student.id,
        studentCustomId: student.studentId,
        rollNumber: student.rollNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        status: found ? found.status : 'PRESENT',
        remarks: found ? found.remarks : '',
        isMarked: !!found,
      };
    });

    // Extract subjects list from Course or Batch
    let subjectsList: string[] = ['Physics', 'Chemistry', 'Mathematics'];
    if (batch.course?.subjects) {
      try {
        subjectsList = JSON.parse(batch.course.subjects);
      } catch {
        subjectsList = batch.course.subjects.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    return {
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        name: batch.name,
        courseName: batch.course.name,
        subjects: subjectsList,
      },
      date,
      subject: cleanSubject,
      subjectTeacher: subjectTeacher
        ? {
            id: subjectTeacher.id,
            name: `${subjectTeacher.firstName} ${subjectTeacher.lastName}`,
            subjectTaught: subjectTeacher.subjectTaught,
          }
        : null,
      totalEnrolled: batch.students.length,
      records: roster,
    };
  }

  async markBatchAttendance(data: {
    batchId: string;
    date: string;
    subject?: string;
    facultyId?: string;
    records: { studentId: string; status: 'PRESENT' | 'LATE' | 'ABSENT'; remarks?: string }[];
    markedById?: string;
  }) {
    if (!data.records || data.records.length === 0) {
      throw new Error('No attendance records provided');
    }

    return attendanceRepository.recordAttendance(
      data.batchId,
      data.date,
      data.subject || 'General',
      data.records,
      data.markedById,
      data.facultyId
    );
  }

  async getStudentAttendance(studentId: string, subject?: string) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error('Student not found');

    const records = await attendanceRepository.findByStudent(studentId, subject);
    const stats = await attendanceRepository.getStudentAttendanceStats(studentId);

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
      },
      stats,
      records,
    };
  }

  async getInstituteOverview() {
    return attendanceRepository.getInstituteAttendanceStats();
  }
}

export const attendanceService = new AttendanceService();
