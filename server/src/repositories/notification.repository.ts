import prisma from '../prisma/client';
import { Prisma, Notification } from '@prisma/client';

export class NotificationRepository {
  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async findForUser(role: string, userId?: string) {
    return prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: role.toUpperCase() },
          ...(userId ? [{ targetUserId: userId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(role: string, userId?: string) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: role.toUpperCase() },
          ...(userId ? [{ targetUserId: userId }] : []),
        ],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async countUnread(role: string, userId?: string): Promise<number> {
    return prisma.notification.count({
      where: {
        OR: [
          { targetRole: 'ALL' },
          { targetRole: role.toUpperCase() },
          ...(userId ? [{ targetUserId: userId }] : []),
        ],
        isRead: false,
      },
    });
  }
}

export const notificationRepository = new NotificationRepository();
