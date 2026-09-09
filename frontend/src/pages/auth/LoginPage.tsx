import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../services/api/auth.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../locales/translations';
import { Phone, ArrowRight, ShieldCheck, UserPlus, Lock, Mail, Globe } from 'lucide-react';
import { useLanguageStore, type SupportedLanguage } from '../../store/useLanguageStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const [authMode, setAuthMode] = useState<'OTP' | 'PASSWORD'>('PASSWORD');
  const [identifier, setIdentifier] = useState(''); // phone or email
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier) {
      setError('Please enter mobile number or email.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'OTP') {
        const isPhone = /^\d+$/.test(identifier);
        if (!isPhone || identifier.length < 10) {
          setError('Please enter a valid 10-digit mobile number for OTP login.');
          setIsLoading(false);
          return;
        }
        await authApi.sendOtp(identifier);
        navigate('/verify-otp', { state: { phoneNumber: identifier } });
      } else {
        const payload = /^\d+$/.test(identifier)
          ? { phoneNumber: identifier, password }
          : { email: identifier, password };

        const res = await authApi.login(payload);
        if (res.success && res.data) {
          const { user, tokens } = res.data;
          setAuth(user, tokens, user.farmerProfile);

          if (['PENDING', 'REJECTED', 'SUSPENDED'].includes(user.status)) {
            navigate('/account/pending');
            return;
          }

          // Route according to role
          switch (user.role) {
            case 'FARMER':
              navigate('/farmer/dashboard');
              break;
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
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials or registration status.';
      const errorCode = err.response?.data?.errorCode;

      if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
        navigate('/account/pending');
        return;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card className="border-t-4 border-t-emerald-800 shadow-lg">
            <div className="text-center mb-6 border-b border-slate-100 pb-4">
              <div className="w-16 h-16 bg-emerald-900 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-md mb-3 border-2 border-emerald-500">
                🌾
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">MandiMithra</h1>
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider mt-0.5">
                {t('appTagline')}
              </p>
              <p className="text-xs text-slate-600 font-medium mt-1">
                {t('platformTitle')}
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 mb-4">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Globe size={14} className="text-emerald-700" /> {t('selectLanguage')}:
              </span>
              <div className="flex gap-1">
                {(['en', 'te', 'hi'] as SupportedLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                      language === lang
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'te' ? 'తెలుగు' : 'हिन्दी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAuthMode('PASSWORD')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'PASSWORD'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('OTP')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'OTP'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OTP Login (Farmers)
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label={authMode === 'OTP' ? 'Mobile Number' : 'Mobile Number or Email'}
                type="text"
                placeholder={authMode === 'OTP' ? 'Enter 10-digit mobile' : 'Enter mobile or official email'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                leftIcon={/^\d+$/.test(identifier) ? <Phone size={18} /> : <Mail size={18} />}
                required
              />

              {authMode === 'PASSWORD' && (
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock size={18} />}
                  required
                />
              )}

              <Button
                fullWidth
                type="submit"
                isLoading={isLoading}
                icon={<ArrowRight size={18} />}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              >
                {authMode === 'OTP' ? 'Send Login OTP' : t('login')}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-sm font-bold text-slate-700 mb-2">Don't have an account yet?</p>
              <Link to="/register">
                <Button fullWidth variant="outline" icon={<UserPlus size={18} />}>
                  {t('register')} / New Account Signup
                </Button>
              </Link>
            </div>
          </Card>

          {/* Dev OTP Helper */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center text-xs text-emerald-900">
            <p className="font-bold flex items-center justify-center gap-1">
              <ShieldCheck size={16} className="text-emerald-700" />
              Development OTP Mode Active
            </p>
            <p className="mt-0.5">Use default OTP: <strong className="font-mono text-sm">123456</strong> for farmer verification.</p>
          </div>
        </div>
      </main>
    </div>
  );
};
