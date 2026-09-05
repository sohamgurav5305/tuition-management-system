import React from 'react';
import {
  Layers,
  CalendarCheck,
  FileText,
  Download,
  HelpCircle,
  CalendarRange,
  Users,
  Bell,
  GraduationCap,
} from 'lucide-react';
import { PortalModuleGrid, PortalModuleItem } from '../../components/common/PortalModuleGrid';

export const TeacherDashboard: React.FC = () => {

  const teacherModules: PortalModuleItem[] = [
    {
      id: 'batches',
      title: 'My Batches',
      subtitle: 'View Assigned Batches',
      path: '/teacher/batches',
      icon: Layers,
      color: 'indigo',
      category: 'Academics',
    },
    {
      id: 'students',
      title: 'My Students',
      subtitle: 'View Batch Students',
      path: '/students',
      icon: Users,
      color: 'blue',
      category: 'Students',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Mark & Track Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      color: 'emerald',
      category: 'Operations',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      subtitle: 'Create & Manage Assignments',
      path: '/assignments',
      icon: FileText,
      color: 'purple',
      category: 'Academics',
    },
    {
      id: 'materials',
      title: 'Study Materials',
      subtitle: 'Share Notes & Resources',
      path: '/materials',
      icon: Download,
      color: 'cyan',
      category: 'Academics',
    },
    {
      id: 'doubts',
      title: 'Student Doubts',
      subtitle: 'Answer Student Questions',
      path: '/doubts',
      icon: HelpCircle,
      color: 'indigo',
      category: 'Mentorship',
    },
    {
      id: 'leaves',
      title: 'Leave Requests',
      subtitle: 'Review Student Requests',
      path: '/leaves',
      icon: CalendarRange,
      color: 'pink',
      category: 'Operations',
    },
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'View Profile & Qualifications',
      path: '/faculty/profile',
      icon: GraduationCap,
      color: 'teal',
      category: 'Account',
    },
    {
      id: 'announcements',
      title: 'Notices',
      subtitle: 'View Institute Notices',
      path: '/notifications',
      icon: Bell,
      color: 'purple',
      category: 'Communications',
    },
  ];

  return (
    <PortalModuleGrid
      modules={teacherModules}
      searchPlaceholder="Search Module"
    />
  );
};

