import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { AccountantDashboard } from './AccountantDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();

  switch (role) {
    case 'ADMINISTRATOR':
      return <AdminDashboard />;
    case 'ACCOUNTANT':
      return <AccountantDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return <AdminDashboard />;
  }
};
