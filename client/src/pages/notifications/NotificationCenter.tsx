import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  PlusCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  Search,
  Paperclip,
  Download,
  Eye,
  X,
  FileText,
  Clock,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Users,
  Megaphone,
} from 'lucide-react';
import { notificationApi } from '../../services/api';
import { Notification } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeEvent } from '../../context/RealtimeContext';
import { formatDateTime } from '../../utils/date';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';

export const NotificationCenter: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedNotificationId = searchParams.get('id');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Broadcast Modal state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'INFORMATION' | 'WARNING' | 'SUCCESS'>('INFORMATION');
  const [targetRole, setTargetRole] = useState('ALL');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canBroadcast =
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'TEACHER' ||
    user?.role === 'ACCOUNTANT';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await notificationApi.getMyNotifications();
      setNotifications(res.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useRealtimeEvent(['notification:new', 'notification:read'], () => {
    fetchNotifications(false);
  });

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleOpenNotification = (n: Notification) => {
    setSearchParams({ id: n.id });
    if (!n.isRead) {
      handleMarkAsRead(n.id);
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
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('message', message.trim());
      formData.append('type', type);
      formData.append('targetRole', targetRole);
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });
      }

      const res = await notificationApi.create(formData);
      success('Broadcast Sent', 'Notification circular broadcasted with attachments to target users');
      setIsBroadcastOpen(false);
      setTitle('');
      setMessage('');
      setSelectedFiles([]);
      await fetchNotifications();
      if (res?.data?.data?.id) {
        setSearchParams({ id: res.data.data.id });
      }
    } catch (err: any) {
      error('Broadcast Failed', err.response?.data?.message || 'Could not send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (searchQuery.trim()) {
      const words = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        const combined = `${n.title} ${n.message} ${n.type}`.toLowerCase();
        return words.every((w) => combined.includes(w));
      }
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTargetRoleLabel = (role?: string) => {
    if (!role || role === 'ALL') return 'All Institute Users';
    if (role === 'TEACHER_STUDENT' || role === 'FACULTY_STUDENT') return 'Faculty + Student';
    if (role === 'ACCOUNTANT_STUDENT') return 'Accountant + Student';
    if (role === 'TEACHER_ACCOUNTANT' || role === 'FACULTY_ACCOUNTANT') return 'Faculty + Accountant';
    if (role === 'STUDENT') return 'Students Only';
    if (role === 'TEACHER' || role === 'FACULTY') return 'Faculty Only';
    if (role === 'ACCOUNTANT') return 'Accounts Desk';
    return role;
  };

  const selectedNotification = selectedNotificationId
    ? notifications.find((n) => n.id === selectedNotificationId)
    : null;

  // Auto-mark as read if opened via direct URL
  useEffect(() => {
    if (selectedNotification && !selectedNotification.isRead) {
      handleMarkAsRead(selectedNotification.id);
    }
  }, [selectedNotification]);

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED FULL ANNOUNCEMENT PAGE VIEW
  // -------------------------------------------------------------
  if (selectedNotification) {
    const fileList =
      selectedNotification.attachments && selectedNotification.attachments.length > 0
        ? selectedNotification.attachments
        : selectedNotification.attachmentUrl
        ? [selectedNotification.attachmentUrl]
        : [];

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => setSearchParams({})}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Back to All Announcements
          </Button>

          <span className="text-xs text-slate-400 font-mono">
            ID: {selectedNotification.id.slice(0, 8)}...
          </span>
        </div>

        {/* Hero Card */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {getTargetRoleLabel(selectedNotification.targetRole)}
              </span>
              <Badge
                variant={
                  selectedNotification.type === 'WARNING'
                    ? 'danger'
                    : selectedNotification.type === 'SUCCESS'
                    ? 'success'
                    : 'info'
                }
                size="sm"
              >
                {selectedNotification.type}
              </Badge>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatDateTime(selectedNotification.createdAt)}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {selectedNotification.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Official Institute Broadcast Notice
            </p>
          </div>
        </div>

        {/* Notice Description Body */}
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Notice Details:
            </span>
            <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedNotification.message}
            </div>
          </div>

          {/* Attached Files Section */}
          {fileList.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Official Circular Attachments ({fileList.length}):
              </span>
              <div className="flex flex-wrap gap-3">
                {fileList.map((url, i) => {
                  const rawName =
                    url.split('/').pop()?.split('?')[0] || `Circular Document #${i + 1}`;
                  const cleanName =
                    rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                  return (
                    <div
                      key={i}
                      className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 rounded-2xl text-xs font-semibold text-blue-950 dark:text-blue-200 shadow-2xs"
                    >
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="truncate max-w-[220px] font-bold" title={cleanName}>
                        {cleanName}
                      </span>
                      <div className="flex items-center gap-1.5 ml-2 border-l border-blue-200 dark:border-blue-800 pl-3">
                        <a
                          href={getMediaUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 rounded-xl transition-colors flex items-center gap-1 font-bold text-xs"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadMediaFile(url, cleanName)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 1: MAIN COMPACT ROW-BY-ROW TABLE LIST (DEFAULT VIEW)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Announcements & Alerts"
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

      {/* Search Bar Toolbar - Left Aligned */}
      <div className="flex items-center justify-start">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Notifications Row Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSkeleton count={4} />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Announcements Found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You are completely up to date with all institute circulars.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200/80 dark:border-slate-800 select-none">
                <tr>
                  <th className="px-5 py-3.5">Announcement / Notice</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((n) => {
                  const hasFiles =
                    (n.attachments && n.attachments.length > 0) || n.attachmentUrl;
                  const isUnread = !n.isRead;

                  return (
                    <tr
                      key={n.id}
                      onClick={() => handleOpenNotification(n)}
                      className={`cursor-pointer transition-colors group ${
                        isUnread
                          ? 'bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/40'
                          : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      {/* Title & Preview snippet */}
                      <td className="px-5 py-3.5 max-w-lg">
                        <div className="flex items-center gap-2.5">
                          {isUnread && (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 shadow-xs"
                              title="Unread Announcement"
                            />
                          )}
                          <span
                            className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
                          >
                            {n.title}
                          </span>
                          {isUnread && (
                            <Badge variant="primary" size="xs">
                              New
                            </Badge>
                          )}
                          {hasFiles && (
                            <span
                              className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-0.5 text-[10px]"
                              title="Attachments Available"
                            >
                              <Paperclip className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 pl-5">
                          {n.message}
                        </p>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {formatDateTime(n.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => {
          setIsBroadcastOpen(false);
          setSelectedFiles([]);
        }}
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
              placeholder="e.g. Schedule for Upcoming Term Assessments"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400"
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">All Institute Users</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Faculty Only</option>
                <option value="ACCOUNTANT">Accounts Desk Only</option>
                <option value="TEACHER_STUDENT">Faculty + Student</option>
                <option value="ACCOUNTANT_STUDENT">Accountant + Student</option>
                <option value="TEACHER_ACCOUNTANT">Faculty + Accountant</option>
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Attachment File Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" /> Attachments (Multiple Files Allowed):
              </span>
              <span className="text-[11px] text-slate-400 font-normal">PDF, Images, DOCX, ZIP (Max 25MB each)</span>
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.zip"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Selected Attachments ({selectedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="truncate max-w-[170px]" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                        title="Delete attachment"
                        aria-label={`Delete ${file.name}`}
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsBroadcastOpen(false);
                setSelectedFiles([]);
              }}
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
