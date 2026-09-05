import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class NotificationController {
  async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const role = req.user?.role || 'STUDENT';
      const userId = req.user?.id;
      const data = await notificationService.getNotificationsForUser(role, userId);
      sendSuccess(res, data, 'Notifications fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
      const notification = await notificationService.createNotification(req.body, files);
      sendSuccess(res, notification, 'Notification broadcasted successfully', 201);
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const notification = await notificationService.markAsRead(id, userId);
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const role = req.user?.role || 'STUDENT';
      const userId = req.user?.id;
      await notificationService.markAllAsRead(role, userId);
      sendSuccess(res, { success: true }, 'All notifications marked as read');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }
}

export const notificationController = new NotificationController();
