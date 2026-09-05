import React from 'react';
import {
  CreditCard,
  FileSpreadsheet,
  Receipt,
  Users,
  Bell,
} from 'lucide-react';
import { PortalModuleGrid, PortalModuleItem } from '../../components/common/PortalModuleGrid';

export const AccountantDashboard: React.FC = () => {

  const accountantModules: PortalModuleItem[] = [
    {
      id: 'accounts',
      title: 'Fee Collection',
      subtitle: 'Track Fees & Collections',
      path: '/fees',
      icon: CreditCard,
      color: 'emerald',
      category: 'Finance',
    },
    {
      id: 'records',
      title: 'Fee Records',
      subtitle: 'View & Manage Fee Records',
      path: '/fees?tab=records',
      icon: FileSpreadsheet,
      color: 'indigo',
      category: 'Finance',
    },
    {
      id: 'receipts',
      title: 'Payment Receipts',
      subtitle: 'View & Print Receipts',
      path: '/receipts',
      icon: Receipt,
      color: 'purple',
      category: 'Finance',
    },
    {
      id: 'students',
      title: 'Students',
      subtitle: 'View Students Details',
      path: '/students',
      icon: Users,
      color: 'blue',
      category: 'Students',
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
      modules={accountantModules}
      searchPlaceholder="Search Module"
    />
  );
};

