import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { farmerApi } from '../../services/api/farmer.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { User, MapPin, Globe, ShieldCheck, LogOut } from 'lucide-react';

export const FarmerProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { openLanguageModal, language } = useLanguageStore();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    farmerApi.getProfile().then(res => setProfile(res.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <Card className="border-t-4 border-t-emerald-700">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xl">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">{user?.fullName}</h3>
              <p className="text-xs text-slate-500 font-mono">{user?.phoneNumber}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1 text-xs text-slate-500 font-bold uppercase mb-1">
                <MapPin size={12} />
                <span>Primary Location</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {profile?.village || 'Village'}, {profile?.mandal || 'Mandal'}, {profile?.district || 'District'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1 text-xs text-slate-500 font-bold uppercase mb-1">
                <ShieldCheck size={12} />
                <span>Verification Data</span>
              </div>
              <p className="text-xs text-slate-700 mt-1">Aadhaar: <strong>{profile?.aadhaarLast4 || 'XXXX-XXXX-1234'}</strong></p>
              <p className="text-xs text-slate-700">Bank Account: <strong>{profile?.bankAccountLast4 || 'XXXXXX7890'}</strong></p>
              <p className="text-xs text-slate-700">Land Passbook Ref: <strong>{profile?.landPassbookReference || 'PASSBOOK-001'}</strong></p>
            </div>

            <div className="pt-2">
              <Button fullWidth variant="outline" onClick={openLanguageModal} icon={<Globe size={18} />}>
                Change Language ({language.toUpperCase()})
              </Button>
            </div>

            <div className="pt-2">
              <Button fullWidth variant="danger" onClick={logout} icon={<LogOut size={18} />}>
                Logout Session
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
};
