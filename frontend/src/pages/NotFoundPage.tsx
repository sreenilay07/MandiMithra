import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/layout/AppHeader';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
          <div className="text-6xl font-black text-blue-900">404</div>
          <h2 className="text-xl font-extrabold text-slate-900">Page Not Found</h2>
          <p className="text-xs text-slate-600">
            The requested page does not exist or you do not have permission to access it.
          </p>
          <Button fullWidth onClick={() => navigate('/')} icon={<Home size={18} />}>
            Return to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};
