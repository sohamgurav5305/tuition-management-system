import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class ReportController {
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const role = req.user?.role || 'ADMINISTRATOR';
      const userId = req.user?.id;
      const data = await reportService.getDashboardSummary(role, userId);
      sendSuccess(res, data, 'Dashboard overview fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getRevenueReport();
      sendSuccess(res, data, 'Revenue report fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getPendingFeesReport(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getPendingFeesReport();
      sendSuccess(res, data, 'Pending fees report fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getBatchStrengthReport(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getBatchStrengthReport();
      sendSuccess(res, data, 'Batch strength report fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async getCourseRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportService.getCourseRevenueReport();
      sendSuccess(res, data, 'Course revenue report fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async exportCsv(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type as any;
      const { csv, filename } = await reportService.exportCsvReport(type);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const reportController = new ReportController();
