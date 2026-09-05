import { attendanceRepository } from '../repositories/attendance.repository';
import { batchRepository } from '../repositories/batch.repository';
import { studentRepository } from '../repositories/student.repository';
import { realtimeHub } from '../utils/eventEmitter';
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

  async getBatchAttendanceRange(batchId: string, startDate: string, endDate: string) {
    const batch = await batchRepository.findById(batchId);
    if (!batch) throw new Error('Batch not found');

    const records = await attendanceRepository.findByBatchAndDateRange(batchId, startDate, endDate);

    // Extract subjects list
    let subjectsList: string[] = ['Physics', 'Chemistry', 'Mathematics'];
    if (batch.course?.subjects) {
      try {
        subjectsList = JSON.parse(batch.course.subjects);
      } catch {
        subjectsList = batch.course.subjects.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    // Determine all distinct sessions (date + subject) conducted
    const sessionMap = new Map<string, { date: string; subject: string }>();
    records.forEach((r) => {
      const key = `${r.date}__${r.subject}`;
      if (!sessionMap.has(key)) {
        sessionMap.set(key, { date: r.date, subject: r.subject });
      }
    });

    const sessions = Array.from(sessionMap.values());

    // Subject total lectures count
    const subjectLecturesMap: Record<string, number> = {};
    subjectsList.forEach((s) => {
      subjectLecturesMap[s] = 0;
    });

    sessions.forEach((sess) => {
      subjectLecturesMap[sess.subject] = (subjectLecturesMap[sess.subject] || 0) + 1;
    });

    const allSubjects = Array.from(new Set([...subjectsList, ...sessions.map((s) => s.subject)]));
    const totalLecturesConducted = sessions.length;

    // Student-wise summary
    const studentSummaries = batch.students.map((student) => {
      const studentRecords = records.filter((r) => r.studentId === student.id);

      const subjects: Record<
        string,
        {
          totalLectures: number;
          attended: number;
          present: number;
          absent: number;
          percentage: number;
        }
      > = {};

      allSubjects.forEach((subj) => {
        const totalSubjLectures = subjectLecturesMap[subj] || 0;
        const subjRecords = studentRecords.filter((r) => r.subject === subj);
        const present = subjRecords.filter((r) => r.status === 'PRESENT').length;
        const absent = subjRecords.filter((r) => r.status === 'ABSENT').length;
        const attended = present;
        const percentage = totalSubjLectures > 0 ? Math.round((attended / totalSubjLectures) * 100) : 0;

        subjects[subj] = {
          totalLectures: totalSubjLectures,
          attended,
          present,
          absent,
          percentage,
        };
      });

      const totalPresent = studentRecords.filter((r) => r.status === 'PRESENT').length;
      const totalAbsent = studentRecords.filter((r) => r.status === 'ABSENT').length;
      const totalAttended = totalPresent;
      const overallPercentage =
        totalLecturesConducted > 0 ? Math.round((totalAttended / totalLecturesConducted) * 100) : 0;

      return {
        studentId: student.id,
        studentCustomId: student.studentId,
        rollNumber: student.rollNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        email: student.email,
        totalLecturesConducted,
        totalAttended,
        totalPresent,
        totalAbsent,
        overallPercentage,
        subjects,
      };
    });

    return {
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        name: batch.name,
        courseName: batch.course?.name || 'Academic Course',
      },
      startDate,
      endDate,
      totalLecturesConducted,
      allSubjects,
      subjectLecturesMap,
      students: studentSummaries,
    };
  }

  async markBatchAttendance(data: {
    batchId: string;
    date: string;
    subject?: string;
    facultyId?: string;
    records: { studentId: string; status: 'PRESENT' | 'ABSENT'; remarks?: string }[];
    markedById?: string;
  }) {

    if (!data.records || data.records.length === 0) {
      throw new Error('No attendance records provided');
    }

    const result = await attendanceRepository.recordAttendance(
      data.batchId,
      data.date,
      data.subject || 'General',
      data.records,
      data.markedById,
      data.facultyId
    );

    try {
      realtimeHub.broadcast('attendance:saved', {
        batchId: data.batchId,
        date: data.date,
        subject: data.subject || 'General',
        count: data.records.length,
      });
    } catch {}

    return result;
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
