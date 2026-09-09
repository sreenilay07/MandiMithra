import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Public Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';

import { AccountPendingPage } from './pages/auth/AccountPendingPage';

// Farmer Pages
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { BookSlotPage } from './pages/farmer/BookSlotPage';
import { FarmerQueuePage } from './pages/farmer/FarmerQueuePage';
import { FarmerTokenPage } from './pages/farmer/FarmerTokenPage';
import { FarmerProcurementPage } from './pages/farmer/FarmerProcurementPage';
import { FarmerQRCodesPage } from './pages/farmer/FarmerQRCodesPage';
import { FarmerDocumentsPage } from './pages/farmer/FarmerDocumentsPage';
import { FarmerPaymentPage } from './pages/farmer/FarmerPaymentPage';
import { FarmerProfilePage } from './pages/farmer/FarmerProfilePage';

// Officer Pages
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerScanPage } from './pages/officer/OfficerScanPage';
import { OfficerProcurementDetail } from './pages/officer/OfficerProcurementDetail';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerCountersPage } from './pages/manager/ManagerCountersPage';
import { ManagerCapacityPage } from './pages/manager/ManagerCapacityPage';

// District Pages
import { DistrictDashboard } from './pages/district/DistrictDashboard';
import { DistrictReportsPage } from './pages/district/DistrictReportsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Shared Pages
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Root Dispatcher based on authenticated role
const RootDispatcher: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (user.status === 'PENDING') {
    return <Navigate to="/account/pending" replace />;
  }

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
      return <Navigate to="/farmer/dashboard" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/account/pending" element={<AccountPendingPage />} />

        {/* Root Route Dispatcher */}
        <Route path="/" element={<RootDispatcher />} />

        {/* Farmer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['FARMER']} />}>
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/farmer/book" element={<BookSlotPage />} />
          <Route path="/farmer/queue" element={<FarmerQueuePage />} />
          <Route path="/farmer/token" element={<FarmerTokenPage />} />
          <Route path="/farmer/procurement" element={<FarmerProcurementPage />} />
          <Route path="/farmer/qr" element={<FarmerQRCodesPage />} />
          <Route path="/farmer/documents" element={<FarmerDocumentsPage />} />
          <Route path="/farmer/payment" element={<FarmerPaymentPage />} />
          <Route path="/farmer/profile" element={<FarmerProfilePage />} />
        </Route>

        {/* Procurement Officer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'CENTRE_MANAGER', 'SUPER_ADMIN']} />}>
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/officer/scan" element={<OfficerScanPage />} />
          <Route path="/officer/procurement/:id" element={<OfficerProcurementDetail />} />
        </Route>

        {/* Centre Manager Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CENTRE_MANAGER', 'SUPER_ADMIN']} />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
          <Route path="/manager/counters" element={<ManagerCountersPage />} />
          <Route path="/manager/capacity" element={<ManagerCapacityPage />} />
        </Route>

        {/* District Officer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['DISTRICT_OFFICER', 'CENTRE_MANAGER', 'SUPER_ADMIN']} />}>
          <Route path="/district/dashboard" element={<DistrictDashboard />} />
          <Route path="/district/reports" element={<DistrictReportsPage />} />
        </Route>

        {/* Super Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        </Route>

        {/* Shared Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;
