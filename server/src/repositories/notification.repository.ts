import prisma from '../prisma/client';
import { Prisma, Notification } from '@prisma/client';

export class NotificationRepository {
  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async findForUser(role: string, userId?: string) {
    const isRoleAdmin = role.toUpperCase() === 'ADMINISTRATOR';
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'ALL', targetUserId: null },
          { targetRole: role.toUpperCase(), targetUserId: null },
          ...(userId ? [{ targetUserId: userId }] : []),
          ...(isRoleAdmin ? [{ targetRole: { not: 'ALL' } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (!userId || notifications.length === 0) {
      return notifications;
    }

    const notifIds = notifications.map((n) => n.id);
    const readRecords = await prisma.notificationRead.findMany({
      where: {
        userId,
        notificationId: { in: notifIds },
      },
      select: { notificationId: true },
    });

    const readSet = new Set(readRecords.map((r) => r.notificationId));

    return notifications.map((n) => ({
      ...n,
      isRead: readSet.has(n.id) || (n.targetUserId === userId && n.isRead),
    }));
  }

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  async markAsRead(id: string, userId?: string): Promise<any> {
    if (userId) {
      await prisma.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId: id,
            userId,
          },
        },
        create: {
          notificationId: id,
          userId,
        },
        update: {},
      });
    }

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (notif && notif.targetUserId === userId) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return { id, isRead: true };
  }

  async markAllAsRead(role: string, userId?: string) {
    if (!userId) {
      return { success: true };
    }

    const isRoleAdmin = role.toUpperCase() === 'ADMINISTRATOR';
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'ALL', targetUserId: null },
          { targetRole: role.toUpperCase(), targetUserId: null },
          { targetUserId: userId },
          ...(isRoleAdmin ? [{ targetRole: { not: 'ALL' } }] : []),
        ],
      },
      select: { id: true },
    });

    if (notifications.length > 0) {
      const records = notifications.map((n) => ({
        notificationId: n.id,
        userId,
      }));

      await prisma.notificationRead.createMany({
        data: records,
        skipDuplicates: true,
      });

      // Also mark direct personal notifications if any
      await prisma.notification.updateMany({
        where: {
          targetUserId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    return { success: true };
  }

  async countUnread(role: string, userId?: string): Promise<number> {
    const isRoleAdmin = role.toUpperCase() === 'ADMINISTRATOR';
    const filterCondition: Prisma.NotificationWhereInput = {
      OR: [
        { targetRole: 'ALL', targetUserId: null },
        { targetRole: role.toUpperCase(), targetUserId: null },
        ...(userId ? [{ targetUserId: userId }] : []),
        ...(isRoleAdmin ? [{ targetRole: { not: 'ALL' } }] : []),
      ],
    };

    if (!userId) {
      return prisma.notification.count({
        where: {
          ...filterCondition,
          isRead: false,
        },
      });
    }

    const totalCount = await prisma.notification.count({
      where: filterCondition,
    });

    const readCount = await prisma.notificationRead.count({
      where: {
        userId,
        notification: filterCondition,
      },
    });

    return Math.max(0, totalCount - readCount);
  }
}

export const notificationRepository = new NotificationRepository();

