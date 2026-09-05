import React, { useEffect, useState } from 'react';
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

export const NotificationCenter: React.FC = () => {
  const { success, error } = useToast();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
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

      await notificationApi.create(formData);
      success('Broadcast Sent', 'Notification circular broadcasted with attachments to target users');
      setIsBroadcastOpen(false);
      setTitle('');
      setMessage('');
      setSelectedFiles([]);
      fetchNotifications();
    } catch (err: any) {
      error('Broadcast Failed', err.response?.data?.message || 'Could not send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filterType !== 'ALL' && n.type.toUpperCase() !== filterType) {
      return false;
    }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Announcements & Alerts"
        subtitle=""
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

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 flex-shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800">
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
                  ? 'bg-white border-slate-200/80 shadow-xs'
                  : 'bg-blue-50/40 border-blue-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <Badge variant="primary" size="xs">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {n.message}
                  </p>
                  {((n.attachments && n.attachments.length > 0) || n.attachmentUrl) && (
                    <div className="pt-2.5 space-y-1.5">
                      <div className="flex flex-wrap gap-2">
                        {(n.attachments && n.attachments.length > 0 ? n.attachments : [n.attachmentUrl!]).map((url, i) => {
                          const rawName = url.split('/').pop()?.split('?')[0] || `Circular File #${i + 1}`;
                          const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                          return (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs font-semibold text-blue-900 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={cleanName}>
                                {cleanName || `Circular File #${i + 1}`}
                              </span>
                              <div className="flex items-center gap-1 ml-1 border-l border-blue-200 pl-1.5">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100/80 rounded-md transition-colors flex items-center gap-1"
                                  title="View / Open File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-bold">View</span>
                                </a>
                                <a
                                  href={url}
                                  download={cleanName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-100/80 rounded-md transition-colors"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">
                    {formatDateTime(n.createdAt)}
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
        onClose={() => {
          setIsBroadcastOpen(false);
          setSelectedFiles([]);
        }}
        title="Create Institute Circular"
      >
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Headline / Title:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=""
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notice Type:
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="INFORMATION">Information / General</option>
                <option value="WARNING">Important / Urgent</option>
                <option value="SUCCESS">Success / Achievement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Audience:
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Institute Users</option>
                <option value="STUDENT">Students Only</option>
                <option value="TEACHER">Faculty Only</option>
                <option value="ACCOUNTANT">Accounts Desk Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Details:
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the complete announcement details..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Attachment File Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
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
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-600">
                  Selected Attachments ({selectedFiles.length}):
                </p>
                <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto p-1 pt-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
