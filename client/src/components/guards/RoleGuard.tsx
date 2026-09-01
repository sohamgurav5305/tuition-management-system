import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AccessDenied } from './AccessDenied';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  const userRole = user?.role?.toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  if (!userRole || !normalizedAllowed.includes(userRole)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
