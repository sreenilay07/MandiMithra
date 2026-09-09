import React, { useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { managerApi } from '../../services/api/manager.api';
import { useAuthStore } from '../../store/useAuthStore';
import { Building2, Save, CheckCircle2 } from 'lucide-react';

export const ManagerCapacityPage: React.FC = () => {
  const { user } = useAuthStore();
  const [defaultCapacity, setDefaultCapacity] = useState('2000');
  const [absencePolicy, setAbsencePolicy] = useState('SKIP');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.centreId) return;
    setIsLoading(true);
    setMsg('');

    try {
      await managerApi.updateCentreConfig(user.centreId, {
        defaultCapacity: parseFloat(defaultCapacity),
        absencePolicy
      });
      setMsg('Centre processing capacity settings updated. Queue recalculated.');
    } catch (err) {
      console.error('Failed to update capacity', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-4">
          <Card className="border-t-4 border-t-blue-900">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
              <Building2 size={22} className="text-blue-900" />
              <span>Centre Capacity Configuration</span>
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Queue waiting time estimates for farmers are calculated using the effective capacity formula:
              <br />
              <strong className="font-mono text-blue-900 text-sm">Effective Capacity = Capacity Per Hour × Active Open Counters</strong>
            </p>

            {msg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-700" />
                <span>{msg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Default Centre Processing Capacity (KG per hour per counter)"
                type="number"
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(e.target.value)}
                required
              />

              <Select
                label="Absence Policy for No-Show Farmers"
                value={absencePolicy}
                onChange={(e) => setAbsencePolicy(e.target.value)}
                options={[
                  { value: 'SKIP', label: 'SKIP — Skip farmer and recalculate queue immediately' },
                  { value: 'RESCHEDULE', label: 'RESCHEDULE — Automatically move booking to next available slot' },
                  { value: 'RETAIN_POSITION', label: 'RETAIN — Retain queue position for 1 hour' }
                ]}
              />

              <Button fullWidth type="submit" variant="primary" isLoading={isLoading} icon={<Save size={18} />}>
                Save Capacity & Recalculate Queue
              </Button>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
};
