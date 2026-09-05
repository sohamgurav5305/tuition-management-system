import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Menu,
  Shield,
  Calendar,
  Building,
  User,
  LogOut,
  ChevronDown,
  KeyRound,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useRealtimeEvent } from '../../context/RealtimeContext';
import { notificationApi } from '../../services/api';
import { Notification } from '../../types';
import { Badge } from '../common/Badge';
import { getMediaUrl } from '../../utils/media';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { settings, formatDate, formatDateTime } = useSettings();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  // Instant real-time update on notification events
  useRealtimeEvent(['notification:new', 'notification:read'], () => {
    fetchNotifications();
  });

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await notificationApi.markAsRead(n.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
      } catch {
        // ignore
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Mobile Menu Trigger & Institute Identity */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/dashboard" className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-200">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-base sm:text-lg lg:text-xl font-black text-slate-900 truncate tracking-tight uppercase">
              {settings.instituteName || 'Apex Career Institute'}
            </span>
          </div>
        </Link>
      </div>

      {/* Right Controls: Notifications, Theme Toggle & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors"
            title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white leading-none shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-xs">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="primary" size="xs">
                      {unreadCount} New
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No recent broadcast announcements.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                          )}
                          <span>{n.title}</span>
                        </h4>
                        <span className="text-[9px] text-slate-400 font-mono flex-shrink-0">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  View All Announcements & Circulars →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown Menu */}
        <div className="relative" ref={profileMenuRef}>
          {(() => {
            const userAvatar = user?.avatarUrl || user?.student?.avatarUrl || user?.faculty?.avatarUrl;
            return (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 group-hover:bg-blue-500 transition-colors overflow-hidden">
                  {userAvatar ? (
                    <img src={getMediaUrl(userAvatar)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {user?.username || 'User'}
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">
                    {user?.role === 'STUDENT'
                      ? 'Student'
                      : user?.role === 'TEACHER'
                      ? 'Faculty'
                      : user?.role === 'ACCOUNTANT'
                      ? 'Accountant'
                      : 'Administrator'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
            );
          })()}

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* User Header Summary */}
              <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2.5">
                {(() => {
                  const userAvatar = user?.avatarUrl || user?.student?.avatarUrl || user?.faculty?.avatarUrl;
                  return (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 overflow-hidden">
                      {userAvatar ? (
                        <img src={getMediaUrl(userAvatar)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.username?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.username}
                  </p>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    {user?.role === 'STUDENT'
                      ? 'Student'
                      : user?.role === 'TEACHER'
                      ? 'Faculty Mentor'
                      : user?.role === 'ACCOUNTANT'
                      ? 'Accountant'
                      : 'Administrator'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                {/* My Profile for Student */}
                {user?.role === 'STUDENT' && (
                  <Link
                    to="/student/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-500" />
                    <span>My Profile</span>
                  </Link>
                )}

                {/* My Profile for Faculty / Teacher */}
                {user?.role === 'TEACHER' && (
                  <Link
                    to="/faculty/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-500" />
                    <span>My Profile</span>
                  </Link>
                )}

                {/* Settings Option (Administrator Only) */}
                {user?.role === 'ADMINISTRATOR' && (
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span>Settings</span>
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100" />

                {/* Log Out Option (All Roles) */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
