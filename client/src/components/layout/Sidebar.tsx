import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarRange,
  BookOpen,
  Layers,
  GraduationCap,
  FileSpreadsheet,
  Award,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  Download,
  HelpCircle,
  UserCheck,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'STUDENTS & OPS',
    items: [
      { label: 'Students', path: '/students', icon: Users },
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { label: 'Leave Requests', path: '/leaves', icon: CalendarRange },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      { label: 'Courses', path: '/courses', icon: BookOpen },
      { label: 'Batches', path: '/batches', icon: Layers },
      { label: 'Faculty', path: '/faculty', icon: GraduationCap },
      { label: 'Assignments', path: '/assignments', icon: FileText },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Fee Ledger & Invoices', path: '/fees', icon: CreditCard },
      { label: 'Fee Records & Register', path: '/fee-records', icon: FileSpreadsheet },
      { label: 'Payment Receipts', path: '/receipts', icon: Receipt },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Announcements', path: '/notifications', icon: Bell },
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

const TEACHER_NAV_GROUPS: NavGroup[] = [
  {
    title: 'ACADEMIC OVERVIEW',
    items: [
      { label: 'Faculty Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Teaching Batches', path: '/teacher/batches', icon: Layers },
      { label: 'Students Roster', path: '/students', icon: Users },
    ],
  },
  {
    title: 'ACADEMIC OPERATIONS',
    items: [
      { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
      { label: 'Assignments', path: '/assignments', icon: FileText },
      { label: 'Study Materials', path: '/materials', icon: Download },
      { label: 'Student Doubts', path: '/doubts', icon: HelpCircle },
      { label: 'Leave Requests', path: '/leaves', icon: CalendarRange },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Announcements', path: '/notifications', icon: Bell },
      { label: 'My Profile', path: '/faculty/profile', icon: User },
    ],
  },
];

const STUDENT_NAV_GROUPS: NavGroup[] = [
  {
    title: 'LEARNING PORTAL',
    items: [
      { label: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'My Batch & Schedule', path: '/student/my-batch', icon: Layers },
      { label: 'Attendance Record', path: '/student/attendance', icon: CalendarCheck },
      { label: 'Study Materials', path: '/materials', icon: Download },
      { label: 'Ask a Doubt', path: '/doubts', icon: HelpCircle },
      { label: 'Leave Application', path: '/leaves', icon: CalendarRange },
    ],
  },
  {
    title: 'HOMEWORK & FEES',
    items: [
      { label: 'My Assignments', path: '/student/assignments', icon: FileText },
      { label: 'Fee Receipts & Ledger', path: '/student/fees', icon: CreditCard },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Announcements', path: '/notifications', icon: Bell },
      { label: 'My Profile', path: '/student/profile', icon: UserCheck },
    ],
  },
];

const ACCOUNTANT_NAV_GROUPS: NavGroup[] = [
  {
    title: 'FINANCE CORE',
    items: [
      { label: 'Finance Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Fee Ledger & Invoices', path: '/fees', icon: CreditCard },
      { label: 'Fee Records & Register', path: '/fee-records', icon: FileSpreadsheet },
      { label: 'Payment Receipts', path: '/receipts', icon: Receipt },
      { label: 'Student Accounts', path: '/students', icon: Users },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { label: 'Announcements', path: '/notifications', icon: Bell },
    ],
  },
];

export const Sidebar: React.FC<{
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}> = ({ mobileOpen = false, onCloseMobile, isCollapsed = false, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navGroups =
    user?.role === 'STUDENT'
      ? STUDENT_NAV_GROUPS
      : user?.role === 'TEACHER'
      ? TEACHER_NAV_GROUPS
      : user?.role === 'ACCOUNTANT'
      ? ACCOUNTANT_NAV_GROUPS
      : ADMIN_NAV_GROUPS;

  const roleLabel =
    user?.role === 'STUDENT'
      ? 'Student Portal'
      : user?.role === 'TEACHER'
      ? 'Faculty Portal'
      : user?.role === 'ACCOUNTANT'
      ? 'Accounts Desk'
      : 'Admin Control Center';

  const sidebarContent = (
    <aside
      className={`flex flex-col h-full bg-[#0B1528] text-slate-200 border-r border-[#1E293B] select-none transition-all duration-200 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1E293B] flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate tracking-tight leading-tight">
                {settings.instituteName || 'Apex Academy'}
              </h1>
              <p className="text-[11px] text-blue-400 font-medium truncate">
                {roleLabel}
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                {group.title}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isCollapsed ? 'justify-center px-0' : ''
                      } ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Logout Button */}
      <div className="p-3 border-t border-[#1E293B] flex-shrink-0 bg-[#0B1528]">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 flex items-center justify-center flex-shrink-0 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Log Out</span>
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
                logout();
              }}
              title="Log Out"
              className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
