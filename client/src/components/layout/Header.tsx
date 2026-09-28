import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Menu,
  Shield,
  Search,
  HelpCircle,
  Calendar,
  Building,
  User,
  LogOut,
  ChevronDown,
  KeyRound,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  const { user, logout, refreshProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { settings, formatDate, formatDateTime } = useSettings();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(7);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getMyNotifications();
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        if (typeof res.data.data.unreadCount === 'number') {
          setUnreadCount(res.data.data.unreadCount);
        }
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
    if (refreshProfile) refreshProfile();
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none transition-colors">
      {/* Left: Mobile Menu Trigger & Global Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Bar Input */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents, records, inspections, students..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Notification Bell, Help, Theme Toggle & User Chip */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Help Circle Button */}
        <button
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Help & Support Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notification Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors"
            title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 leading-none shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="primary" size="xs">
                      {unreadCount} New
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No recent broadcast announcements.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                          )}
                          <span>{n.title}</span>
                        </h4>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono flex-shrink-0">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
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
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 group-hover:bg-blue-500 transition-colors overflow-hidden relative">
                  <span className="select-none">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                  {userAvatar && (
                    <img
                      src={getMediaUrl(userAvatar)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                    {user?.username || 'User'}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">
                    {user?.role === 'STUDENT'
                      ? 'Student'
                      : user?.role === 'TEACHER'
                      ? 'Faculty'
                      : user?.role === 'ACCOUNTANT'
                      ? 'Accountant'
                      : 'Administrator'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
            );
          })()}

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* User Header Summary */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                {(() => {
                  const userAvatar = user?.avatarUrl || user?.student?.avatarUrl || user?.faculty?.avatarUrl;
                  return (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 overflow-hidden relative">
                      <span className="select-none">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                      {userAvatar && (
                        <img
                          src={getMediaUrl(userAvatar)}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.username}
                  </p>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
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
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span>Settings</span>
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                {/* Log Out Option (All Roles) */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
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
