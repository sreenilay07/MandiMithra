import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { managerApi } from '../../services/api/manager.api';
import { centreApi } from '../../services/api/centre.api';
import { useAuthStore } from '../../store/useAuthStore';
import { Sliders, Plus } from 'lucide-react';

export const ManagerCountersPage: React.FC = () => {
  const { user } = useAuthStore();
  const [counters, setCounters] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isAddCounterOpen, setIsAddCounterOpen] = useState(false);
  const [counterNum, setCounterNum] = useState('3');
  const [capacity, setCapacity] = useState('2000');

  const loadData = async () => {
    if (!user?.centreId) return;
    try {
      const [cRes, aRes] = await Promise.all([
        centreApi.getCounters(user.centreId),
        managerApi.getAssignedOfficers(user.centreId)
      ]);
      setCounters(cRes.data || []);
      setAssignments(aRes.data || []);
    } catch (err) {
      console.error('Failed to load counters/officers', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.centreId]);

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.centreId) return;
    try {
      await centreApi.createCounter(user.centreId, {
        counterNumber: parseInt(counterNum, 10),
        capacityPerHour: parseFloat(capacity)
      });
      setIsAddCounterOpen(false);
      await loadData();
    } catch (err) {
      console.error('Create counter failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders size={22} className="text-blue-900" />
              <span>Counter & Officer Management</span>
            </h2>
            <Button size="sm" onClick={() => setIsAddCounterOpen(true)} icon={<Plus size={16} />}>
              Add Counter
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Counters Overview */}
            <Card header={<span className="font-bold">Centre Counters ({counters.length})</span>}>
              <div className="divide-y divide-slate-200">
                {counters.map(c => (
                  <div key={c._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Counter #{c.counterNumber}</p>
                      <p className="text-xs text-slate-500">{c.capacityPerHour} KG/hr capacity</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      c.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Officer Assignments */}
            <Card header={<span className="font-bold">Active Officer Assignments ({assignments.length})</span>}>
              <div className="divide-y divide-slate-200">
                {assignments.length === 0 ? (
                  <p className="py-4 text-xs text-slate-500 text-center">No assigned officers yet.</p>
                ) : (
                  assignments.map(a => (
                    <div key={a._id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{a.officerId?.fullName}</p>
                        <p className="text-xs text-slate-500">Phone: {a.officerId?.phoneNumber}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                        {a.counterId ? `Counter #${a.counterId.counterNumber}` : 'General Duty'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>

      <Modal isOpen={isAddCounterOpen} onClose={() => setIsAddCounterOpen(false)} title="Add New Procurement Counter">
        <form onSubmit={handleAddCounter} className="space-y-4">
          <Input label="Counter Number" type="number" value={counterNum} onChange={(e) => setCounterNum(e.target.value)} required />
          <Input label="Processing Capacity (KG/hour)" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          <Button fullWidth type="submit" variant="success">Create Counter</Button>
        </form>
      </Modal>
    </div>
  );
};
