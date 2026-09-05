import { notificationRepository } from '../repositories/notification.repository';
import { storage } from '../storage';
import { realtimeHub } from '../utils/eventEmitter';

function resolveFileUrls(fileUrlsJsonOrSingle?: string | null): string[] {
  if (!fileUrlsJsonOrSingle) return [];
  try {
    const parsed = JSON.parse(fileUrlsJsonOrSingle);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: string) => storage.getUrl(p));
    }
  } catch {
    // ignore
  }
  return [storage.getUrl(fileUrlsJsonOrSingle)];
}

export class NotificationService {
  async getNotificationsForUser(role: string, userId?: string) {
    const list = await notificationRepository.findForUser(role, userId);
    const unreadCount = await notificationRepository.countUnread(role, userId);
    return {
      unreadCount,
      notifications: list.map((n) => {
        const attachments = resolveFileUrls((n as any).attachmentUrl);
        return {
          ...n,
          attachmentUrl: attachments[0] || null,
          attachments,
        };
      }),
    };
  }

  async createNotification(
    data: {
      title: string;
      message: string;
      type: 'WARNING' | 'INFORMATION' | 'SUCCESS' | 'URGENT' | 'EXAM' | 'FEE';
      targetRole?: string;
      targetUserId?: string;
      attachmentUrl?: string | null;
    },
    files?: any[]
  ) {
    let attachmentUrl = data.attachmentUrl || null;
    if (files && files.length > 0) {
      const uploadedPaths: string[] = [];
      for (const f of files) {
        const p = await storage.upload(f, 'announcements');
        uploadedPaths.push(p);
      }
      attachmentUrl = uploadedPaths.length > 1 ? JSON.stringify(uploadedPaths) : (uploadedPaths[0] || null);
    }

    const notif = await notificationRepository.create({
      title: data.title,
      message: data.message,
      type: data.type,
      targetRole: data.targetRole || 'ALL',
      targetUserId: data.targetUserId || null,
      attachmentUrl,
    } as any);

    const attachments = resolveFileUrls(notif.attachmentUrl);
    const result = {
      ...notif,
      attachmentUrl: attachments[0] || null,
      attachments,
    };

    // Realtime SSE broadcast
    try {
      if (data.targetUserId) {
        realtimeHub.sendToUser(data.targetUserId, 'notification:new', result);
        realtimeHub.sendToRole('ADMINISTRATOR', 'notification:new', result);
      } else if (data.targetRole && data.targetRole !== 'ALL') {
        const parts = data.targetRole.split('_');
        const uniqueRoles = new Set<string>();
        for (const p of parts) {
          const upper = p.toUpperCase();
          if (upper === 'FACULTY' || upper === 'TEACHER') {
            uniqueRoles.add('TEACHER');
          } else if (upper === 'STUDENT') {
            uniqueRoles.add('STUDENT');
          } else if (upper === 'ACCOUNTANT') {
            uniqueRoles.add('ACCOUNTANT');
          } else {
            uniqueRoles.add(upper);
          }
        }
        uniqueRoles.add('ADMINISTRATOR');
        for (const r of uniqueRoles) {
          realtimeHub.sendToRole(r, 'notification:new', result);
        }
      } else {
        realtimeHub.broadcast('notification:new', result);
      }
    } catch (err) {
      console.error('Failed to emit realtime notification event:', err);
    }

    return result;
  }

  async markAsRead(id: string, userId?: string) {
    const res = await notificationRepository.markAsRead(id, userId);
    try {
      realtimeHub.broadcast('notification:read', { id, userId });
    } catch {}
    return res;
  }

  async markAllAsRead(role: string, userId?: string) {
    const res = await notificationRepository.markAllAsRead(role, userId);
    try {
      realtimeHub.broadcast('notification:read', { role, userId, all: true });
    } catch {}
    return res;
  }
}

export const notificationService = new NotificationService();

