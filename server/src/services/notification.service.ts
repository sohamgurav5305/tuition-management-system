import { notificationRepository } from '../repositories/notification.repository';

export class NotificationService {
  async getNotificationsForUser(role: string, userId?: string) {
    const list = await notificationRepository.findForUser(role, userId);
    const unreadCount = await notificationRepository.countUnread(role, userId);
    return {
      unreadCount,
      notifications: list,
    };
  }

  async createNotification(data: {
    title: string;
    message: string;
    type: 'WARNING' | 'INFORMATION' | 'SUCCESS';
    targetRole?: string;
    targetUserId?: string;
  }) {
    return notificationRepository.create({
      title: data.title,
      message: data.message,
      type: data.type,
      targetRole: data.targetRole || 'ALL',
      targetUserId: data.targetUserId || null,
    });
  }

  async markAsRead(id: string) {
    return notificationRepository.markAsRead(id);
  }

  async markAllAsRead(role: string, userId?: string) {
    return notificationRepository.markAllAsRead(role, userId);
  }
}

export const notificationService = new NotificationService();
