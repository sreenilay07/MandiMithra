import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { officerApi } from '../../services/api/officer.api';
import { QrCode, Search, RefreshCw } from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const res = await officerApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load officer dashboard', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const queueList = data?.todayQueue || [];
  const filteredQueue = queueList.filter((item: any) =>
    item.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.farmerId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Procurement Officer Workstation</h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Assigned Counter: {data?.assignedCounter ? `#${data.assignedCounter.counterNumber}` : 'General Verification'}
              </p>
            </div>

            <Button variant="success" onClick={() => navigate('/officer/scan')} icon={<QrCode size={20} />}>
              Scan Farmer QR Code
            </Button>
          </div>

          {/* Quick Metrics */}
          {data?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="text-center p-3">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Today</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{data.stats.totalFarmersToday}</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-xs text-amber-700 font-bold uppercase">Waiting</p>
                <p className="text-2xl font-black text-amber-900 mt-0.5">{data.stats.waiting}</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-xs text-blue-700 font-bold uppercase">Arrived / Active</p>
                <p className="text-2xl font-black text-blue-900 mt-0.5">{data.stats.arrived + data.stats.inProgress}</p>
              </Card>
              <Card className="text-center p-3">
                <p className="text-xs text-emerald-700 font-bold uppercase">Completed</p>
                <p className="text-2xl font-black text-emerald-900 mt-0.5">{data.stats.completed}</p>
              </Card>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center space-x-2">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search token number or farmer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 font-medium"
            />
            <button onClick={loadData} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600">
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Queue List Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <span>Today's Farmer Tokens</span>
              <span className="text-xs text-slate-300 font-normal">{filteredQueue.length} records</span>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredQueue.length === 0 ? (
                <p className="p-6 text-center text-slate-500 text-sm">No farmers found matching query.</p>
              ) : (
                filteredQueue.map((tItem: any) => (
                  <div key={tItem._id} className="p-4 hover:bg-slate-50 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-blue-950">{tItem.tokenNumber}</span>
                        <Badge status={tItem.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        {tItem.farmerId?.fullName} ({tItem.cropId?.name} — {tItem.expectedQuantity} KG)
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/officer/procurement/${tItem._id}`)}
                    >
                      Process Stages
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};
