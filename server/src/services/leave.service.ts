import { leaveRepository } from '../repositories/leave.repository';
import { notificationService } from './notification.service';
import { realtimeHub } from '../utils/eventEmitter';
import prisma from '../prisma/client';

export class LeaveService {
  async getAllLeaves(filters?: {
    studentId?: string;
    facultyId?: string;
    applicantType?: string;
    status?: string;
  }) {
    return leaveRepository.findAll(filters);
  }

  async applyLeave(data: {
    studentId?: string;
    facultyId?: string;
    applicantType?: 'STUDENT' | 'FACULTY';
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    const isFaculty = data.applicantType === 'FACULTY' || Boolean(data.facultyId);

    if (isFaculty) {
      if (!data.facultyId) {
        throw new Error('Faculty profile ID is required for faculty leave application.');
      }

      const faculty = await prisma.faculty.findUnique({
        where: { id: data.facultyId },
      });

      const leave = await leaveRepository.create({
        facultyId: data.facultyId,
        studentId: null,
        applicantType: 'FACULTY',
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        status: 'PENDING',
      });

      // Send immediate high-priority notification to Administrator
      try {
        const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : 'A faculty member';
        const subject = faculty?.subjectTaught ? ` (${faculty.subjectTaught})` : '';
        await notificationService.createNotification({
          title: `Faculty Leave Application: ${facultyName}`,
          message: `Faculty mentor ${facultyName}${subject} applied for leave from ${data.startDate} to ${data.endDate}. Reason: "${data.reason}".`,
          type: 'WARNING',
          targetRole: 'ADMINISTRATOR',
        });
      } catch (e) {
        console.error('Failed to send faculty leave notification', e);
      }

      return leave;
    }

    // Default: Student Leave Application
    if (!data.studentId) {
      throw new Error('Student ID is required for student leave application.');
    }

    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { batch: true },
    });

    const leave = await leaveRepository.create({
      studentId: data.studentId,
      facultyId: null,
      applicantType: 'STUDENT',
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'PENDING',
    });

    // Notify faculty mentors & administrators of incoming student leave request
    try {
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'A student';
      const batchName = student?.batch?.name ? ` (${student.batch.name})` : '';
      await notificationService.createNotification({
        title: `Student Leave Application: ${studentName}`,
        message: `${studentName}${batchName} applied for leave from ${data.startDate} to ${data.endDate}. Reason: "${data.reason}".`,
        type: 'WARNING',
        targetRole: 'ADMINISTRATOR',
      });
    } catch (e) {
      console.error('Failed to send student leave notification', e);
    }

    try {
      realtimeHub.broadcast('leave:updated', { leaveId: leave.id, status: 'PENDING', applicantType: leave.applicantType });
    } catch {}

    return leave;
  }

  async updateLeaveStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    reviewerRole: string
  ) {
    const existing = await leaveRepository.findById(id);
    if (!existing) throw new Error('Leave request not found');

    // Security Gate: ONLY Administrator can approve or reject Faculty leave applications
    if (existing.applicantType === 'FACULTY' || existing.facultyId) {
      if (reviewerRole !== 'ADMINISTRATOR') {
        throw new Error('Access denied: Only an Administrator can approve or reject faculty leave requests.');
      }
    }

    const updated = await leaveRepository.update(id, {
      status,
      reviewedBy,
    });

    // Dispatch direct personalized notification to applicant
    if (existing.applicantType === 'FACULTY' || existing.facultyId) {
      try {
        const faculty = await prisma.faculty.findUnique({
          where: { id: existing.facultyId || undefined },
        });

        if (faculty?.userId) {
          await notificationService.createNotification({
            title: `Faculty Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            message: `Your faculty leave application for ${existing.startDate} to ${existing.endDate} has been ${status.toLowerCase()} by Institute Administrator (${reviewedBy}).`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
            targetUserId: faculty.userId,
          });
        }
      } catch (e) {
        console.error('Failed to send faculty leave update notification', e);
      }
    } else {
      try {
        const student = await prisma.student.findUnique({
          where: { id: existing.studentId || undefined },
        });

        if (student?.userId) {
          await notificationService.createNotification({
            title: `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
            message: `Your student leave request for ${existing.startDate} to ${existing.endDate} has been ${status.toLowerCase()} by academic administration (${reviewedBy}).`,
            type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
            targetUserId: student.userId,
          });
        }
      } catch (e) {
        console.error('Failed to send student leave update notification', e);
      }
    }

    try {
      realtimeHub.broadcast('leave:updated', { leaveId: updated.id, status, applicantType: existing.applicantType });
    } catch {}

    return updated;
  }
}

export const leaveService = new LeaveService();
