import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, CheckSquare, Bell, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/farmer/dashboard', label: 'Home', icon: Home },
    { path: '/farmer/queue', label: 'Queue', icon: Users },
    { path: '/farmer/procurement', label: 'Stages', icon: CheckSquare },
    { path: '/notifications', label: 'Alerts', icon: Bell },
    { path: '/farmer/profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-slate-300 border-t-2 border-slate-700 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full py-1 tap-target cursor-pointer transition-colors ${
                isActive
                  ? 'text-amber-400 font-bold bg-slate-800/80 border-t-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-amber-400' : ''} />
              <span className="text-xs mt-1 font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
