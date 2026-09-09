import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../services/api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../services/i18n';
import { KeyRound, ShieldCheck } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber || '9555555555';
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter complete 6-digit OTP.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await authApi.verifyOtp(phoneNumber, otp);
      const { user, tokens, farmerProfile } = res.data;

      setAuth(user, tokens, farmerProfile);

      if (['PENDING', 'REJECTED', 'SUSPENDED'].includes(user.status)) {
        navigate('/account/pending');
        return;
      }

      // Role-Based Navigation Routing
      switch (user.role) {
        case 'FARMER':
          navigate('/farmer/dashboard');
          break;
        case 'PROCUREMENT_OFFICER':
          navigate('/officer/dashboard');
          break;
        case 'CENTRE_MANAGER':
          navigate('/manager/dashboard');
          break;
        case 'DISTRICT_OFFICER':
          navigate('/district/dashboard');
          break;
        case 'SUPER_ADMIN':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/farmer/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="border-t-4 border-t-blue-900 shadow-md">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-amber-300">
                <KeyRound size={26} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{t('enter_otp')}</h2>
              <p className="text-sm text-slate-600 font-semibold mt-1">
                {t('otp_sent_to')} <strong className="text-slate-900">{phoneNumber}</strong>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              <Input
                label="6-Digit OTP Code"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="text-center tracking-widest text-2xl font-mono font-bold"
                required
              />

              <Button fullWidth type="submit" isLoading={isLoading}>
                {t('verify_otp')}
              </Button>
            </form>
          </Card>

          {/* Dev Mode Callout */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-center text-xs text-amber-900">
            <p className="font-bold flex items-center justify-center gap-1">
              <ShieldCheck size={16} className="text-amber-700" />
              Development OTP Code: <strong className="font-mono text-sm">123456</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
