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
    title: 'STUDENTS',
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
    ],
  },
  {
    title: 'EXAMS',
    items: [
      { label: 'Test Series & Exams', path: '/exams', icon: FileSpreadsheet },
      { label: 'AIR Results & Ranks', path: '/results', icon: Award },
      { label: 'Assignments', path: '/assignments', icon: FileText },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Fee Ledger & Invoices', path: '/fees', icon: CreditCard },
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
      { label: 'Test Series & Exams', path: '/exams', icon: FileSpreadsheet },
      { label: 'Scorecard Grading', path: '/results', icon: Award },
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
    title: 'ASSESSMENTS & FEES',
    items: [
      { label: 'Exams & Results', path: '/student/exams', icon: FileSpreadsheet },
      { label: 'Homework Assignments', path: '/student/assignments', icon: FileText },
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
      { label: 'Fee Records & Register', path: '/fees?tab=records', icon: FileSpreadsheet },
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
      className={`flex flex-col h-full bg-white border-r border-slate-200 select-none transition-all duration-200 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate tracking-tight uppercase leading-tight">
                {settings.instituteName || 'Apex Institute'}
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold truncate">
                {roleLabel}
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop collapse button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
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
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isCollapsed ? 'justify-center px-0' : ''
                      } ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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

      {/* Bottom Profile Footer */}
      <div className="p-3 border-t border-slate-200 flex-shrink-0 bg-slate-50">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.username || 'Authenticated User'}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block truncate">
                  {user?.role || 'Session'}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
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
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
