import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class PaymentController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, paymentMode, startDate, endDate, search } = req.query;
      const payments = await paymentService.getAllPayments({
        studentId: studentId as string,
        paymentMode: paymentMode as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });
      sendSuccess(res, payments, 'Payment transactions fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await paymentService.getPaymentById(id);
      sendSuccess(res, payment, 'Payment receipt details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getByReceiptId(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId } = req.params;
      const payment = await paymentService.getPaymentByReceiptId(receiptId);
      sendSuccess(res, payment, 'Payment receipt details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getStudentFeeSummary(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const summary = await paymentService.getStudentFeeSummary(studentId);
      sendSuccess(res, summary, 'Student fee summary fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 404, error);
    }
  }

  async getMyFees(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }

      let studentId = req.user.studentId;
      if (!studentId) {
        const student = await require('../repositories/student.repository').studentRepository.findByUserId(req.user.id);
        if (!student) {
          sendError(res, 'No student record found for this user', 404);
          return;
        }
        studentId = student.id;
      }

      if (!studentId) {
        sendError(res, 'Student ID not resolved', 404);
        return;
      }

      const summary = await paymentService.getStudentFeeSummary(studentId);
      sendSuccess(res, summary, 'My fee details fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async recordPayment(req: Request, res: Response): Promise<void> {
    try {
      const recordedById = req.user?.id;
      const result = await paymentService.recordPayment({
        ...req.body,
        recordedById,
      });
      sendSuccess(res, result, 'Payment recorded successfully and receipt generated', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async assignFee(req: Request, res: Response): Promise<void> {
    try {
      const recordedById = req.user?.id;
      const result = await paymentService.assignFee({
        ...req.body,
        recordedById,
      });
      sendSuccess(res, result, 'Fee charge successfully assigned', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const paymentController = new PaymentController();
