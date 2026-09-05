import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { pathname } = location;

  // Do not render breadcrumbs on root or dashboard view
  if (pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  const getBreadcrumbTrail = (path: string): BreadcrumbSegment[] => {
    // Exact route mapping for consistent, clean naming matching the module grids
    const exactRoutes: Record<string, BreadcrumbSegment[]> = {
      '/students': [{ label: 'Students Directory' }],
      '/faculty': [{ label: 'Teachers' }],
      '/faculty/profile': [{ label: 'Faculty Profile' }],
      '/courses': [{ label: 'Courses & Curriculum' }],
      '/batches': [{ label: 'Batch Management' }],
      '/teacher/batches': [{ label: 'My Assigned Batches' }],
      '/materials': [{ label: 'Study Materials' }],
      '/doubts': [{ label: 'Doubt Forum' }],
      '/attendance': [{ label: 'Attendance' }],
      '/leaves': [{ label: 'Leave Applications' }],
      '/assignments': [{ label: 'Assignment Center' }],
      '/fees': [{ label: 'Fee Management & Collections' }],
      '/receipts': [{ label: 'Payment Receipts' }],
      '/reports': [{ label: 'Analytics & Financial Reports' }],
      '/notifications': [{ label: 'Broadcast Notifications' }],
      '/settings': [{ label: 'System Settings' }],
      '/student/my-batch': [{ label: 'My Batch & Class Schedule' }],
      '/student/attendance': [{ label: 'My Attendance Record' }],
      '/student/fees': [{ label: 'My Fee Ledger & Receipts' }],
      '/student/assignments': [{ label: 'My Assignments & Homework' }],
      '/student/profile': [{ label: 'My Student Profile' }],
    };

    if (exactRoutes[path]) {
      return exactRoutes[path];
    }

    // Dynamic routes
    if (path.startsWith('/students/')) {
      return [
        { label: 'Students Directory', path: '/students' },
        { label: 'Student Profile' },
      ];
    }

    // Generic fallback for any unexpected route
    const segments = path.split('/').filter(Boolean);
    return segments.map((seg, i) => {
      const isLast = i === segments.length - 1;
      const formatted = seg
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const subPath = '/' + segments.slice(0, i + 1).join('/');
      return {
        label: formatted,
        path: isLast ? undefined : subPath,
      };
    });
  };

  const trail = getBreadcrumbTrail(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2.5 text-sm sm:text-base font-medium mb-6 select-none"
    >
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-blue-600 transition-colors group"
      >
        <Home className="w-4 h-4 fill-slate-900 text-slate-900 group-hover:fill-blue-600 group-hover:text-blue-600 transition-colors" />
        <span>Home</span>
      </Link>

      {trail.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-slate-400 font-light text-base sm:text-lg">
            /
          </span>
          {item.path ? (
            <Link
              to={item.path}
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-500 font-normal">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
