import React from 'react';
import {
  Users,
  GraduationCap,
  Layers,
  CalendarCheck,
  CreditCard,
  BookOpen,
  FileText,
  CalendarRange,
  Settings,
  Bell,
} from 'lucide-react';
import { PortalModuleGrid, PortalModuleItem } from '../../components/common/PortalModuleGrid';

export const AdminDashboard: React.FC = () => {

  const adminModules: PortalModuleItem[] = [
    {
      id: 'students',
      title: 'Students',
      subtitle: 'Manage Student Records',
      path: '/students',
      icon: Users,
      color: 'blue',
      category: 'Students',
    },
    {
      id: 'courses',
      title: 'Courses',
      subtitle: 'Manage Courses',
      path: '/courses',
      icon: BookOpen,
      color: 'amber',
      category: 'Courses',
    },
    {
      id: 'batches',
      title: 'Batches',
      subtitle: 'Manage Class Batches',
      path: '/batches',
      icon: Layers,
      color: 'indigo',
      category: 'Academics',
    },
    {
      id: 'faculty',
      title: 'Faculty',
      subtitle: 'Manage Faculty Members',
      path: '/faculty',
      icon: GraduationCap,
      color: 'purple',
      category: 'Faculty',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Track Student Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      color: 'emerald',
      category: 'Operations',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      subtitle: 'Manage Assignments',
      path: '/assignments',
      icon: FileText,
      color: 'violet',
      category: 'Academics',
    },
    {
      id: 'accounts',
      title: 'Fee Management',
      subtitle: 'Manage Fees & Payments',
      path: '/fees',
      icon: CreditCard,
      color: 'emerald',
      category: 'Finance',
    },
    {
      id: 'leaves',
      title: 'Leave Requests',
      subtitle: 'Review Leave Applications',
      path: '/leaves',
      icon: CalendarRange,
      color: 'pink',
      category: 'Operations',
    },
    {
      id: 'announcements',
      title: 'Notices',
      subtitle: 'Manage Notices & Announcements',
      path: '/notifications',
      icon: Bell,
      color: 'orange',
      category: 'System',
    },
    {
      id: 'settings',
      title: 'Institute Settings',
      subtitle: 'Configure Institute',
      path: '/settings',
      icon: Settings,
      color: 'slate',
      category: 'System',
    },
  ];

  return (
    <PortalModuleGrid
      modules={adminModules}
      searchPlaceholder="Search Module"
    />
  );
};
