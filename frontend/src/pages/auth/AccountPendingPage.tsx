import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../services/api/auth.api';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, XCircle } from 'lucide-react';

export const AccountPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const getApprovalAuthority = (role?: string) => {
    switch (role) {
      case 'CENTER_OPERATOR':
      case 'PROCUREMENT_OFFICER':
        return 'Waiting for Centre Manager approval';
      case 'CENTER_MANAGER':
      case 'CENTRE_MANAGER':
        return 'Waiting for District Administrator approval';
      case 'DISTRICT_ADMIN':
      case 'DISTRICT_OFFICER':
        return 'Waiting for Super Admin approval';
      default:
        return 'Waiting for System Administrator approval';
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage('');
    try {
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        const updatedUser = res.data.user;
        if (updatedUser.status === 'APPROVED' || updatedUser.status === 'ACTIVE') {
          setAuth(updatedUser, {
            accessToken: useAuthStore.getState().accessToken || '',
            refreshToken: useAuthStore.getState().refreshToken || ''
          });

          setStatusMessage('Your account has been APPROVED! Redirecting to dashboard...');
          setTimeout(() => {
            switch (updatedUser.role) {
              case 'CENTER_OPERATOR':
              case 'PROCUREMENT_OFFICER':
                navigate('/officer/dashboard');
                break;
              case 'CENTER_MANAGER':
              case 'CENTRE_MANAGER':
                navigate('/manager/dashboard');
                break;
              case 'DISTRICT_ADMIN':
              case 'DISTRICT_OFFICER':
                navigate('/district/dashboard');
                break;
              case 'SUPER_ADMIN':
                navigate('/admin/dashboard');
                break;
              default:
                navigate('/farmer/dashboard');
            }
          }, 1000);
          return;
        } else if (updatedUser.status === 'REJECTED') {
          setStatusMessage('Your registration request was REJECTED by the administrator.');
        } else {
          setStatusMessage('Your status is still PENDING approval.');
        }
      }
    } catch (err) {
      setStatusMessage('Unable to verify account status right now. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="border-t-4 border-t-amber-500 shadow-xl text-center p-6">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-300 shadow-xs">
              <Clock size={32} className="animate-pulse" />
            </div>

            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
              Registration Status: PENDING
            </span>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registration Pending</h2>
            <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
              Your account is awaiting approval from the authorized administrator.
            </p>

            <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold uppercase">Applicant:</span>
                <span className="font-bold text-slate-900">{user?.fullName || 'Staff Member'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold uppercase">Requested Role:</span>
                <span className="font-bold text-emerald-800">{user?.role || 'Staff Role'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-bold uppercase">Approval Authority:</span>
                <span className="font-bold text-amber-900">{getApprovalAuthority(user?.role)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase">Submitted:</span>
                <span className="font-medium text-slate-700">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</span>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-lg text-xs font-bold mb-4 flex items-center justify-center gap-1.5 ${
                statusMessage.includes('APPROVED') ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                statusMessage.includes('REJECTED') ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                'bg-amber-50 text-amber-900 border border-amber-300'
              }`}>
                {statusMessage.includes('APPROVED') ? <CheckCircle2 size={16} /> :
                 statusMessage.includes('REJECTED') ? <XCircle size={16} /> :
                 <ShieldAlert size={16} />}
                {statusMessage}
              </div>
            )}

            <div className="space-y-2">
              <Button
                fullWidth
                onClick={handleCheckStatus}
                isLoading={isChecking}
                icon={<RefreshCw size={16} />}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              >
                Check Approval Status
              </Button>

              <Button
                fullWidth
                variant="outline"
                onClick={handleLogout}
                icon={<LogOut size={16} />}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Logout
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};
