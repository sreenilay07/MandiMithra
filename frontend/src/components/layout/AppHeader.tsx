import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

interface AppHeaderProps {
  title?: string;
  showLanguageSelector?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ showLanguageSelector = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { language, openLanguageModal } = useLanguageStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLanguageLabel = (lang: string) => {
    if (lang === 'te') return 'తెలుగు';
    if (lang === 'hi') return 'हिन्दी';
    return 'English';
  };

  return (
    <header className="bg-blue-950 text-white border-b-4 border-amber-600 sticky top-0 z-40 shadow-md">
      {/* Top Government Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Shield size={12} className="text-amber-500" />
          <span className="font-medium tracking-wide">MandiMithra • Public Agricultural Procurement Portal</span>
        </div>
        <div className="flex items-center space-x-3">
          {showLanguageSelector && (
            <button
              onClick={openLanguageModal}
              className="flex items-center space-x-1.5 hover:text-white font-medium cursor-pointer"
            >
              <Globe size={13} className="text-amber-400" />
              <span>{getLanguageLabel(language)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header */}
      <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between">
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center font-black text-xl text-white shadow-xs border border-emerald-500">
            🌾
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>MandiMithra</span>
              {user?.role && user.role !== 'FARMER' && (
                <span className="text-xs font-semibold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {user.role.replace(/_/g, ' ')}
                </span>
              )}
            </h1>
            <p className="text-xs text-emerald-300 font-medium">Saath Kisan Ka, Har Kadam Par</p>
          </div>
        </div>

        {/* User Controls */}
        <div className="flex items-center space-x-3">
          {user && (
            <>
              <button
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-lg bg-blue-900/60 hover:bg-blue-900 text-slate-200 hover:text-white relative cursor-pointer"
                title="Notifications"
              >
                <Bell size={20} />
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white cursor-pointer"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
