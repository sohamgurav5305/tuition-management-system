import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, PlusCircle, AlertTriangle, Info, CheckCircle2, Filter } from 'lucide-react';
import { notificationApi } from '../../services/api';
import { Notification } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const NotificationCenter: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Broadcast Modal state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFORMATION' | 'WARNING' | 'SUCCESS'>('INFORMATION');
  const [targetRole, setTargetRole] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canBroadcast = user?.role === 'ADMINISTRATOR' || user?.role === 'TEACHER';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getMyNotifications();
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success('Updated', 'All notifications marked as read');
    } catch {
      // ignore
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      error('Validation', 'Title and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await notificationApi.create({
        title,
        message,
        type,
        targetRole,
      });
      success('Broadcast Sent', 'Notification broadcasted to target users');
      setIsBroadcastOpen(false);
      setTitle('');
      setMessage('');
      fetchNotifications();
    } catch (err: any) {
      error('Broadcast Failed', err.response?.data?.message || 'Could not send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList =
    filterType === 'ALL'
      ? notifications
      : notifications.filter((n) => n.type.toUpperCase() === filterType);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Announcements & Alerts"
        subtitle="Institute circulars, exam schedule notifications, holiday notices, and emergency broadcasts."
        badge={`${unreadCount} Unread`}
        actions={
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={CheckCheck}
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </Button>
            )}
            {canBroadcast && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={PlusCircle}
                onClick={() => setIsBroadcastOpen(true)}
              >
                New Announcement
              </Button>
            )}
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { label: 'All Alerts', value: 'ALL' },
          { label: 'General Info', value: 'INFORMATION' },
          { label: 'Important Notices', value: 'WARNING' },
          { label: 'Achievements', value: 'SUCCESS' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.value
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200/80 dark:border-blue-800/80'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Announcements Found
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              You are completely up to date with all institute circulars.
            </p>
          </div>
        ) : (
          filteredList.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all ${
                n.isRead
                  ? 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 shadow-xs'
                  : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <Badge variant="primary" size="xs">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="p-1 text-slate-400 hover:text-blue-600 flex-shrink-0"
                    title="Mark as Read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Modal */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Create Institute Circular"
      >
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notice Headline / Title:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., JEE Advanced Revision Batch Timetable Announcement"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notice Type:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
              >
                <option value="INFORMATION">Information / General</option>
                <option value="WARNING">Important / Urgent</option>
                <option value="SUCCESS">Success / Achievement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Audience:
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Institute Users</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Faculty Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notice Details:
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the complete announcement details..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsBroadcastOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Broadcast Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
