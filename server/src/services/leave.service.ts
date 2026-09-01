import { leaveRepository } from '../repositories/leave.repository';

export class LeaveService {
  async getAllLeaves(filters?: { studentId?: string; status?: string }) {
    return leaveRepository.findAll(filters);
  }

  async applyLeave(data: { studentId: string; startDate: string; endDate: string; reason: string }) {
    return leaveRepository.create({
      studentId: data.studentId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'PENDING',
    });
  }

  async updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED', reviewedBy: string) {
    const existing = await leaveRepository.findById(id);
    if (!existing) throw new Error('Leave request not found');

    return leaveRepository.update(id, {
      status,
      reviewedBy,
    });
  }
}

export const leaveService = new LeaveService();
