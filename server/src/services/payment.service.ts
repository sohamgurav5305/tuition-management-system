import { paymentRepository, PaymentFilterParams } from '../repositories/payment.repository';
import { studentRepository } from '../repositories/student.repository';
import { generateReceiptId } from '../utils/idGenerator.util';
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
      status: student.pendingFee === 0 ? 'PAID' : (student.paidFee > 0 ? 'PARTIAL' : 'PENDING'),
      payments,
      installments,
    };
  }
}

export const paymentService = new PaymentService();
