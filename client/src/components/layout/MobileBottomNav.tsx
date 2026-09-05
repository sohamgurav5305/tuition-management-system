import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Layers,
  FileText,
  Download,
  HelpCircle,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();

  // Role-scoped bottom navigation links so users never see routes they don't have access to
  const getNavLinks = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
          { label: 'Materials', path: '/materials', icon: Download },
          { label: 'Assignments', path: '/student/assignments', icon: FileText },
          { label: 'My Fees', path: '/student/fees', icon: CreditCard },
        ];
      case 'TEACHER':
        return [
          { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Batches', path: '/teacher/batches', icon: Layers },
          { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
          { label: 'Assignments', path: '/assignments', icon: FileText },
          { label: 'Doubts', path: '/doubts', icon: HelpCircle },
        ];
      case 'ACCOUNTANT':
        return [
          { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Students', path: '/students', icon: Users },
          { label: 'Fee Ledger', path: '/fees', icon: CreditCard },
          { label: 'Receipts', path: '/receipts', icon: CreditCard },
        ];
      case 'ADMINISTRATOR':
      default:
        return [
          { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
          { label: 'Students', path: '/students', icon: Users },
          { label: 'Batches', path: '/batches', icon: Layers },
          { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
          { label: 'Fee Desk', path: '/fees', icon: CreditCard },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 lg:hidden px-1.5 py-1.5">
      <div className="flex items-center justify-around">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
