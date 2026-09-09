import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../services/api/auth.api';
import { centreApi } from '../../services/api/centre.api';
import { districtApi } from '../../services/api/district.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from '../../locales/translations';
import { User, Phone, Mail, Lock, ShieldAlert, CheckCircle2, UserCheck, Building2, MapPin, BadgeCheck, ArrowLeft, Globe } from 'lucide-react';
import { useLanguageStore, type SupportedLanguage } from '../../store/useLanguageStore';
import { State, City } from 'country-state-city';

type RoleOption = 'FARMER' | 'CENTER_OPERATOR' | 'CENTER_MANAGER' | 'DISTRICT_ADMIN';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  const [selectedRole, setSelectedRole] = useState<RoleOption>('FARMER');
  const [districts, setDistricts] = useState<any[]>([]);
  const [centres, setCentres] = useState<any[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [stateName, setStateName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [centreId, setCentreId] = useState('');

  const selectedDbDistrict = districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
  const computedDistrictId = selectedDbDistrict ? selectedDbDistrict._id : '';
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [pincode, setPincode] = useState('500001');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadDistrictsAndCentres();
  }, []);

  const loadDistrictsAndCentres = async () => {
    try {
      const distRes = await districtApi.getAllDistricts();
      if (distRes.success) setDistricts(distRes.data || []);

      const centreRes = await centreApi.getAllCentres();
      if (centreRes.success) setCentres(centreRes.data || []);
    } catch (err) {
      console.warn('Could not load districts or centres list');
    }
  };

  const handleFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        fullName,
        phone,
        email,
        password,
        state: stateName,
        district: districtName || 'Guntur',
        districtId: computedDistrictId || undefined,
        village: village || 'Sample Village',
        mandal: mandal || 'Sample Mandal',
        pincode: pincode || '500001',
        preferredLanguage: language
      };

      const res = await authApi.registerFarmer(payload);
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.tokens, res.data.user.farmerProfile);
        navigate('/farmer/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Farmer registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (['CENTER_OPERATOR', 'CENTER_MANAGER'].includes(selectedRole) && !centreId) {
      setError('Please select a valid Procurement Centre.');
      return;
    }
    if (selectedRole === 'DISTRICT_ADMIN' && !districtName) {
      setError('Please select a valid District.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        fullName,
        phone,
        email,
        password,
        requestedRole: selectedRole,
        state: stateName,
        district: districtName,
        districtId: computedDistrictId || undefined,
        centreId: centreId || undefined,
        employeeId,
        preferredLanguage: language
      };

      const res = await authApi.registerStaff(payload);
      if (res.success) {
        if (res.data?.tokens && res.data?.user) {
          setAuth(res.data.user, res.data.tokens);
        }
        setSuccessMessage('Registration request submitted successfully. Your account is pending administrative approval.');
        setTimeout(() => {
          navigate('/account/pending');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Staff registration request failed. Please check form details.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCentres = computedDistrictId
    ? centres.filter(c => c.districtId?._id === computedDistrictId || c.districtId === computedDistrictId)
    : centres;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/login" className="text-sm font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Login
          </Link>
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg">
            <Globe size={14} className="text-emerald-700" />
            {(['en', 'te', 'hi'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-0.5 text-xs font-bold rounded ${
                  language === lang ? 'bg-emerald-800 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'te' ? 'తెలుగు' : 'हिंदी'}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">MandiMithra Registration</h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            Select your account type below to proceed with registration
          </p>
        </div>

        {/* REGISTRATION ROLE SELECTOR CARDS (Excludes Super Admin) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              role: 'FARMER' as RoleOption,
              title: t('registerAsFarmer'),
              badge: 'Auto-Approved',
              desc: 'Direct registration for farmers to book slots & track queue position.',
              icon: '🌾'
            },
            {
              role: 'CENTER_OPERATOR' as RoleOption,
              title: t('registerAsOperator'),
              badge: 'Requires Manager Approval',
              desc: 'For procurement centre operators conducting stage tasks & QR scans.',
              icon: '📋'
            },
            {
              role: 'CENTER_MANAGER' as RoleOption,
              title: t('registerAsManager'),
              badge: 'Requires District Admin Approval',
              desc: 'For centre managers configuring capacity, counters & approving operators.',
              icon: '🏢'
            },
            {
              role: 'DISTRICT_ADMIN' as RoleOption,
              title: t('registerAsDistrictAdmin'),
              badge: 'Requires Super Admin Approval',
              desc: 'For district administrators managing district centres & reports.',
              icon: '🏛️'
            }
          ].map((item) => (
            <div
              key={item.role}
              onClick={() => {
                setSelectedRole(item.role);
                setError('');
                setSuccessMessage('');
              }}
              className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                selectedRole === item.role
                  ? 'border-emerald-800 bg-white shadow-md ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div>
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-3">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.role === 'FARMER' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Clear Super Admin Exclusion Notice */}
        <div className="bg-slate-800 text-slate-200 text-xs p-3 rounded-xl flex items-center gap-2 border border-slate-700">
          <ShieldAlert size={18} className="text-amber-400 shrink-0" />
          <span>{t('superAdminNotice')}</span>
        </div>

        {/* REGISTRATION FORM CARD */}
        <Card className="border-t-4 border-t-emerald-800 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
              {selectedRole === 'FARMER' && <BadgeCheck className="text-emerald-700" />}
              {selectedRole === 'CENTER_OPERATOR' && <UserCheck className="text-amber-600" />}
              {selectedRole === 'CENTER_MANAGER' && <Building2 className="text-blue-700" />}
              {selectedRole === 'DISTRICT_ADMIN' && <MapPin className="text-purple-700" />}
              {selectedRole === 'FARMER' ? t('registerAsFarmer') :
               selectedRole === 'CENTER_OPERATOR' ? t('registerAsOperator') :
               selectedRole === 'CENTER_MANAGER' ? t('registerAsManager') : t('registerAsDistrictAdmin')}
            </h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {selectedRole === 'FARMER' ? 'No Admin Approval Needed' : 'Staff Approval Workflow'}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold rounded-lg flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-700" />
              {successMessage}
            </div>
          )}

          <form onSubmit={selectedRole === 'FARMER' ? handleFarmerSubmit : handleStaffSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User size={18} />}
                required
              />

              <Input
                label="Mobile Number *"
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                leftIcon={<Phone size={18} />}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={selectedRole === 'FARMER' ? 'Email (Optional)' : 'Official Email *'}
                type="email"
                placeholder="name@domain.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={18} />}
                required={selectedRole !== 'FARMER'}
              />

              <Input
                label="Account Password *"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={18} />}
                required
              />
            </div>

            {selectedRole !== 'FARMER' && (
              <Input
                label="Employee / Official ID *"
                placeholder="EMP-12345"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            )}

            {/* Location Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State *</label>
                <select
                  value={stateCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setStateCode(code);
                    const sName = State.getStateByCodeAndCountry(code, 'IN')?.name || '';
                    setStateName(sName);
                    setDistrictName('');
                    setCentreId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  <option value="">-- Select State --</option>
                  {State.getStatesOfCountry('IN').map(s => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">District *</label>
                <select
                  value={districtName}
                  onChange={(e) => {
                    setDistrictName(e.target.value);
                    setCentreId('');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-700"
                  required={selectedRole === 'DISTRICT_ADMIN'}
                  disabled={!stateCode}
                >
                  <option value="">-- Select District --</option>
                  {City.getCitiesOfState('IN', stateCode).map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Centre Selector for Operators and Managers */}
            {['CENTER_OPERATOR', 'CENTER_MANAGER'].includes(selectedRole) && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Procurement Centre *</label>
                <select
                  value={centreId}
                  onChange={(e) => setCentreId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  <option value="">-- Select Procurement Centre --</option>
                  {filteredCentres.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Extra Farmer details */}
            {selectedRole === 'FARMER' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <Input
                  label="Village"
                  placeholder="Village Name"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                />
                <Input
                  label="Mandal"
                  placeholder="Mandal Name"
                  value={mandal}
                  onChange={(e) => setMandal(e.target.value)}
                />
                <Input
                  label="Pincode"
                  maxLength={6}
                  placeholder="500001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>
            )}

            <div className="pt-4">
              <Button
                fullWidth
                type="submit"
                isLoading={isLoading}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 text-sm"
              >
                {selectedRole === 'FARMER' ? 'Complete Farmer Registration' : t('submitRegistration')}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};
