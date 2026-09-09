import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Sliders,
  FileSpreadsheet,
  Building2,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user || user.role === 'FARMER') return null;

  const getMenuItems = () => {
    const role = user.role;
    if (role === 'CENTER_OPERATOR' || role === 'PROCUREMENT_OFFICER') {
      return [
        { path: '/officer/dashboard', label: "Today's Queue", icon: LayoutDashboard },
        { path: '/officer/scan', label: 'Scan QR Code', icon: QrCode },
        { path: '/notifications', label: 'Notifications', icon: Bell }
      ];
    }
    if (role === 'CENTER_MANAGER' || role === 'CENTRE_MANAGER') {
      return [
        { path: '/manager/dashboard', label: 'Centre Dashboard', icon: LayoutDashboard },
        { path: '/manager/counters', label: 'Counters & Staff', icon: Sliders },
        { path: '/manager/capacity', label: 'Capacity Settings', icon: Building2 },
        { path: '/district/reports', label: 'Centre Reports', icon: FileSpreadsheet },
        { path: '/notifications', label: 'Notifications', icon: Bell }
      ];
    }
    if (role === 'DISTRICT_ADMIN' || role === 'DISTRICT_OFFICER') {
      return [
        { path: '/district/dashboard', label: 'District Overview', icon: LayoutDashboard },
        { path: '/district/reports', label: 'Download Reports', icon: FileSpreadsheet },
        { path: '/notifications', label: 'Notifications', icon: Bell }
      ];
    }
    if (role === 'SUPER_ADMIN') {
      return [
        { path: '/admin/dashboard', label: 'Admin Console', icon: LayoutDashboard },
        { path: '/admin/users', label: 'User Management', icon: Users },
        { path: '/district/reports', label: 'System Reports', icon: FileSpreadsheet },
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
        { path: '/notifications', label: 'Notifications', icon: Bell }
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-65px)] border-r border-slate-800 hidden md:block select-none">
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Operational Role</p>
        <p className="text-sm font-extrabold text-white mt-0.5">{user.fullName}</p>
        <p className="text-xs text-amber-400 font-semibold">{user.role.replace(/_/g, ' ')}</p>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-900 text-white shadow-xs border-l-4 border-amber-500'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
