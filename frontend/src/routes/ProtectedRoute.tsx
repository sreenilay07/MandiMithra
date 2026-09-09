import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LanguageSelectorModal } from '../components/layout/LanguageSelectorModal';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // REDIRECT PENDING OR INACTIVE USERS AWAY FROM OPERATIONAL DASHBOARDS
  if (user.status && ['PENDING', 'REJECTED', 'SUSPENDED'].includes(user.status)) {
    return <Navigate to="/account/pending" replace />;
  }

  if (allowedRoles) {
    const expandedAllowed = allowedRoles.flatMap(r => {
      if (r === 'CENTER_OPERATOR') return ['CENTER_OPERATOR', 'PROCUREMENT_OFFICER'];
      if (r === 'PROCUREMENT_OFFICER') return ['CENTER_OPERATOR', 'PROCUREMENT_OFFICER'];
      if (r === 'CENTER_MANAGER') return ['CENTER_MANAGER', 'CENTRE_MANAGER'];
      if (r === 'CENTRE_MANAGER') return ['CENTER_MANAGER', 'CENTRE_MANAGER'];
      if (r === 'DISTRICT_ADMIN') return ['DISTRICT_ADMIN', 'DISTRICT_OFFICER'];
      if (r === 'DISTRICT_OFFICER') return ['DISTRICT_ADMIN', 'DISTRICT_OFFICER'];
      return [r];
    });

    if (!expandedAllowed.includes(user.role)) {
      switch (user.role) {
        case 'FARMER':
          return <Navigate to="/farmer/dashboard" replace />;
        case 'CENTER_OPERATOR':
        case 'PROCUREMENT_OFFICER':
          return <Navigate to="/officer/dashboard" replace />;
        case 'CENTER_MANAGER':
        case 'CENTRE_MANAGER':
          return <Navigate to="/manager/dashboard" replace />;
        case 'DISTRICT_ADMIN':
        case 'DISTRICT_OFFICER':
          return <Navigate to="/district/dashboard" replace />;
        case 'SUPER_ADMIN':
          return <Navigate to="/admin/dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  return (
    <>
      <Outlet />
      <LanguageSelectorModal />
    </>
  );
};
