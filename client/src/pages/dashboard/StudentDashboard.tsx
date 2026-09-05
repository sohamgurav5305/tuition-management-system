import React from 'react';
import {
  CalendarCheck,
  CreditCard,
  FileText,
  Download,
  HelpCircle,
  CalendarRange,
  UserCheck,
  Bell,
} from 'lucide-react';
import { PortalModuleGrid, PortalModuleItem } from '../../components/common/PortalModuleGrid';

export const StudentDashboard: React.FC = () => {


  const studentModules: PortalModuleItem[] = [
    {
      id: 'attendance',
      title: 'My Attendance',
      subtitle: 'Track Your Attendance',
      path: '/student/attendance',
      icon: CalendarCheck,
      color: 'emerald',
      category: 'Academics',
    },
    {
      id: 'materials',
      title: 'Study Materials',
      subtitle: 'Access Notes & Resources',
      path: '/materials',
      icon: Download,
      color: 'cyan',
      category: 'Academics',
    },
    {
      id: 'doubts',
      title: 'Ask a Doubt',
      subtitle: 'Get Help from Your Teacher',
      path: '/doubts',
      icon: HelpCircle,
      color: 'purple',
      category: 'Mentorship',
    },
    {
      id: 'assignments',
      title: 'My Assignments',
      subtitle: 'View & Submit Assignments',
      path: '/student/assignments',
      icon: FileText,
      color: 'violet',
      category: 'Academics',
    },
    {
      id: 'accounts',
      title: 'Fees & Payments',
      subtitle: 'View Fees & Payment Status',
      path: '/student/fees',
      icon: CreditCard,
      color: 'amber',
      category: 'Finance',
    },
    {
      id: 'leaves',
      title: 'Leave Application',
      subtitle: 'Apply for Leave',
      path: '/leaves',
      icon: CalendarRange,
      color: 'pink',
      category: 'Operations',
    },
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View & Update Profile',
      path: '/student/profile',
      icon: UserCheck,
      color: 'teal',
      category: 'Account',
    },
    {
      id: 'announcements',
      title: 'Notices',
      subtitle: 'View Institute Notices',
      path: '/notifications',
      icon: Bell,
      color: 'orange',
      category: 'System',
    },
  ];

  return (
    <PortalModuleGrid
      modules={studentModules}
      searchPlaceholder="Search Module"
    />
  );
};

