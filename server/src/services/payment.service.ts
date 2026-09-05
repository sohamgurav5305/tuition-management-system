import { paymentRepository, PaymentFilterParams } from '../repositories/payment.repository';
import { studentRepository } from '../repositories/student.repository';
import { notificationService } from './notification.service';
import { generateReceiptId } from '../utils/idGenerator.util';
import { realtimeHub } from '../utils/eventEmitter';
import prisma from '../prisma/client';

export class PaymentService {
  async getAllPayments(filters?: PaymentFilterParams) {
    return paymentRepository.findAll(filters);
  }

  async getPaymentById(id: string) {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw new Error('Payment receipt not found');
    return payment;
  }

  async getPaymentByReceiptId(receiptId: string) {
    const payment = await paymentRepository.findByReceiptId(receiptId);
    if (!payment) throw new Error('Payment receipt not found');
    return payment;
  }

  async recordPayment(data: {
    studentId: string;
    amount: number;
    paymentDate?: string;
    paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE_GATEWAY';
    transactionReference?: string;
    remarks?: string;
    recordedById?: string;
  }) {
    const amount = Number(data.amount);

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const student = await studentRepository.findById(data.studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Strict validation: cannot pay more than pending amount
    if (amount > student.pendingFee) {
      throw new Error(
        `Overpayment Error: Payment amount ($${amount}) exceeds student's pending fee balance ($${student.pendingFee}).`
      );
    }

    const receiptId = await generateReceiptId();
    const paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
    const taxAmount = Number((amount * 0.18 / 1.18).toFixed(2)); // 18% GST component

    // Create payment record
    const payment = await paymentRepository.create({
      receiptId,
      studentId: data.studentId,
      amount,
      taxAmount,
      paymentDate,
      paymentMode: data.paymentMode,
      transactionReference: data.transactionReference || null,
      remarks: data.remarks || null,
      recordedById: data.recordedById || null,
    });

    // Update student's paidFee and pendingFee balances
    const updatedStudent = await studentRepository.updateFeeBalances(student.id, amount);

    // Sync installments
    const pendingInstallments = await prisma.feeInstallment.findMany({
      where: { studentId: student.id, status: { in: ['PENDING', 'OVERDUE'] } },
      orderBy: { installmentNo: 'asc' },
    });

    let remainingToAllocate = amount;
    for (const inst of pendingInstallments) {
      if (remainingToAllocate <= 0) break;
      const unallocated = inst.amount - inst.paidAmount;
      if (remainingToAllocate >= unallocated) {
        await prisma.feeInstallment.update({
          where: { id: inst.id },
          data: {
            paidAmount: inst.amount,
            status: 'PAID',
            paidDate: paymentDate,
          },
        });
        remainingToAllocate -= unallocated;
      } else {
        await prisma.feeInstallment.update({
          where: { id: inst.id },
          data: {
            paidAmount: inst.paidAmount + remainingToAllocate,
          },
        });
        remainingToAllocate = 0;
      }
    }

    const fullPayment = await paymentRepository.findById(payment.id);

    // Notify student of fee payment confirmation
    try {
      await notificationService.createNotification({
        title: `Fee Payment Confirmed: ₹${amount.toLocaleString('en-IN')}`,
        message: `Tuition fee payment of ₹${amount.toLocaleString('en-IN')} via ${data.paymentMode} recorded (Receipt #${receiptId}). Remaining dues: ₹${updatedStudent.pendingFee.toLocaleString('en-IN')}.`,
        type: 'SUCCESS',
        targetUserId: student.userId || undefined,
        targetRole: 'STUDENT',
      });
    } catch (e) {
      console.error('Failed to send payment notification', e);
    }

    // Realtime SSE broadcast for payments and fee updates
    try {
      realtimeHub.broadcast('payment:created', {
        paymentId: payment.id,
        receiptId: payment.receiptId,
        studentId: student.id,
        amount: payment.amount,
      });
    } catch (e) {
      console.error('Failed to emit realtime payment event', e);
    }

    return {
      payment: fullPayment || payment,
      student: {
        id: updatedStudent.id,
        studentId: updatedStudent.studentId,
        firstName: updatedStudent.firstName,
        lastName: updatedStudent.lastName,
        phone: updatedStudent.phone,
        email: updatedStudent.email,
        guardianName: updatedStudent.guardianName,
        guardianRelation: updatedStudent.guardianRelation,
        guardianPhone: updatedStudent.guardianPhone,
        course: student.course,
        batch: student.batch,
        totalFee: updatedStudent.totalFee,
        paidFee: updatedStudent.paidFee,
        pendingFee: updatedStudent.pendingFee,
      },
    };
  }

  async getStudentFeeSummary(studentId: string) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new Error('Student not found');

    const payments = await paymentRepository.findAll({ studentId });
    const installments = await prisma.feeInstallment.findMany({
      where: { studentId },
      orderBy: { installmentNo: 'asc' },
    });

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        name: `${student.firstName} ${student.lastName}`,
        courseName: student.course?.name || 'Unassigned Course',
      },
      totalFee: student.totalFee,
      paidFee: student.paidFee,
      pendingFee: student.pendingFee,
      payments,
      installments,
    };
  }

  async assignFee(data: {
    targetType: 'ALL' | 'BATCH' | 'STUDENT';
    targetId?: string;
    title: string;
    amount: number;
    dueDate?: string;
    category?: string;
    remarks?: string;
    recordedById?: string;
  }) {
    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Fee amount must be greater than zero');
    }
    if (!data.title?.trim()) {
      throw new Error('Fee title is required');
    }

    let targetStudents: { id: string; userId: string | null; totalFee: number; pendingFee: number; firstName: string; lastName: string }[] = [];

    if (data.targetType === 'STUDENT') {
      if (!data.targetId) throw new Error('Please select a student');
      const student = await prisma.student.findUnique({
        where: { id: data.targetId },
        select: { id: true, userId: true, totalFee: true, pendingFee: true, firstName: true, lastName: true },
      });
      if (!student) throw new Error('Student not found');
      targetStudents = [student];
    } else if (data.targetType === 'BATCH') {
      if (!data.targetId) throw new Error('Please select a batch');
      targetStudents = await prisma.student.findMany({
        where: { batchId: data.targetId, status: 'ACTIVE' },
        select: { id: true, userId: true, totalFee: true, pendingFee: true, firstName: true, lastName: true },
      });
      if (targetStudents.length === 0) {
        throw new Error('No active students found in the selected batch');
      }
    } else {
      // ALL active students
      targetStudents = await prisma.student.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, userId: true, totalFee: true, pendingFee: true, firstName: true, lastName: true },
      });
      if (targetStudents.length === 0) {
        throw new Error('No active students found in the institute');
      }
    }

    const dueDate = data.dueDate || new Date().toISOString().split('T')[0];
    const categoryTitle = data.title.trim();
    const studentIds = targetStudents.map((s) => s.id);

    // 1. Efficiently query highest installment numbers for all targeted students in one bulk query
    const maxInstallments = await prisma.feeInstallment.groupBy({
      by: ['studentId'],
      where: { studentId: { in: studentIds } },
      _max: { installmentNo: true },
    });

    const nextNoMap = new Map<string, number>();
    for (const item of maxInstallments) {
      nextNoMap.set(item.studentId, (item._max.installmentNo || 0) + 1);
    }

    const installmentsData = targetStudents.map((student) => {
      const nextNo = nextNoMap.get(student.id) || 1;
      return {
        studentId: student.id,
        installmentNo: nextNo,
        title: categoryTitle,
        amount: amount,
        dueDate: dueDate,
        status: 'PENDING',
        paidAmount: 0,
      };
    });

    // 2. Perform atomic transaction with bulk operations & extended timeout for large cohorts
    await prisma.$transaction(
      async (tx) => {
        // Bulk insert installments
        await tx.feeInstallment.createMany({
          data: installmentsData,
        });

        // Bulk update student ledger balances
        await tx.student.updateMany({
          where: { id: { in: studentIds } },
          data: {
            totalFee: { increment: amount },
            pendingFee: { increment: amount },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    // Notify students of newly assigned fee / fine
    try {
      if (data.targetType === 'STUDENT') {
        const s = targetStudents[0];
        if (s.userId) {
          await notificationService.createNotification({
            title: `Fee Notice: ${categoryTitle} (₹${amount.toLocaleString('en-IN')})`,
            message: `A new fee charge of ₹${amount.toLocaleString('en-IN')} (${categoryTitle}) has been added to your account. Due date: ${dueDate}.`,
            type: 'FEE',
            targetUserId: s.userId,
            targetRole: 'STUDENT',
          });
        }
      } else {
        await notificationService.createNotification({
          title: `Fee Notice: ${categoryTitle} (₹${amount.toLocaleString('en-IN')})`,
          message: `A fee charge of ₹${amount.toLocaleString('en-IN')} (${categoryTitle}) has been assigned. Due date: ${dueDate}.`,
          type: 'FEE',
          targetRole: 'STUDENT',
        });
      }
    } catch (e) {
      console.error('Failed to send fee assignment notification', e);
    }

    try {
      realtimeHub.broadcast('fee:assigned', {
        assignedCount: targetStudents.length,
        title: categoryTitle,
        amount,
        dueDate,
      });
    } catch {}

    return {
      success: true,
      assignedCount: targetStudents.length,
      amountPerStudent: amount,
      totalAmountAssigned: amount * targetStudents.length,
      title: categoryTitle,
      dueDate,
    };
  }
}

export const paymentService = new PaymentService();
