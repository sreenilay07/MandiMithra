import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CounterToggleCard } from '../../components/manager/CounterToggleCard';
import { ApprovalCard } from '../../components/ui/ApprovalCard';
import { ProcurementPricingModal } from '../../components/manager/ProcurementPricingModal';
import { managerApi } from '../../services/api/manager.api';
import { centreApi } from '../../services/api/centre.api';
import { approvalApi, type ApprovalRequestItem } from '../../services/api/approval.api';
import { initSocketClient } from '../../services/socket';
import { Sliders, Building2, UserCheck, CheckCircle2, Tag } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [pendingOperators, setPendingOperators] = useState<ApprovalRequestItem[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);

  const loadData = async () => {
    try {
      const res = await managerApi.getDashboard();
      setDashboardData(res.data);

      if (res.data?.centre?._id) {
        const [cRes, cropRes] = await Promise.all([
          centreApi.getCounters(res.data.centre._id),
          centreApi.getCrops()
        ]);
        setCounters(cRes.data || []);
        setCrops(cropRes.data || []);
      }
    } catch (err) {
      console.warn('Failed to load manager dashboard', err);
    }
  };

  const loadPendingOperators = async () => {
    setIsLoadingApprovals(true);
    try {
      const res = await approvalApi.getPendingCentreOperators();
      if (res.success) setPendingOperators(res.data || []);
    } catch (err) {
      console.warn('Failed to load pending operator approvals');
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPendingOperators();

    const socket = initSocketClient();
    if (socket) {
      socket.on('queue:updated', () => loadData());
      socket.on('counter:opened', () => loadData());
      socket.on('counter:closed', () => loadData());
      socket.on('pricing.updated', () => loadData());
    }

    return () => {
      if (socket) {
        socket.off('queue:updated');
        socket.off('counter:opened');
        socket.off('counter:closed');
        socket.off('pricing.updated');
      }
    };
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await approvalApi.approveRequest(id, 'Approved by Centre Manager');
      if (res.success) {
        setActionMessage('Centre Operator approved successfully.');
        loadPendingOperators();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve operator.');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await approvalApi.rejectRequest(id, reason);
      if (res.success) {
        setActionMessage('Centre Operator request rejected.');
        loadPendingOperators();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const handleToggleCounter = async (counterId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'OPEN') {
        await centreApi.closeCounter(counterId);
      } else {
        await centreApi.openCounter(counterId);
      }
      await loadData();
    } catch (err) {
      console.error('Counter toggle failed', err);
    }
  };

  const metrics = dashboardData?.metrics;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{dashboardData?.centre?.name || 'Centre Operations'}</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Centre Code: <strong className="font-mono">{dashboardData?.centre?.code}</strong> • Capacity: {dashboardData?.centre?.capacityPerHour || 2000} KG/hr/counter
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={() => setShowPricingModal(true)}
                icon={<Tag size={16} />}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
              >
                Procurement Pricing
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/manager/capacity')} icon={<Building2 size={16} />}>
                Capacity
              </Button>
              <Button size="sm" variant="primary" onClick={() => navigate('/manager/counters')} icon={<Sliders size={16} />}>
                Staff & Counters
              </Button>
            </div>
          </div>

          {actionMessage && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} /> {actionMessage}
            </div>
          )}

          {/* PENDING CENTRE OPERATOR APPROVALS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="text-emerald-700" size={22} />
                Centre Operator Approval Requests ({pendingOperators.length})
              </h2>
              <Button size="sm" variant="outline" onClick={loadPendingOperators}>
                Refresh
              </Button>
            </div>

            {isLoadingApprovals ? (
              <p className="text-xs font-bold text-slate-500 py-2">Loading pending Centre Operator requests...</p>
            ) : pendingOperators.length === 0 ? (
              <Card className="p-5 text-center text-slate-500 text-sm font-medium border border-slate-200">
                No pending Centre Operator registration requests for this centre.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOperators.map((req) => (
                  <ApprovalCard
                    key={req._id}
                    request={req}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Operational Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="text-center p-3 border-l-4 border-l-emerald-800">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Farmers Today</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{metrics.totalFarmersToday || 0}</p>
                <p className="text-[11px] text-amber-700 font-semibold">{metrics.waitingFarmers || 0} Waiting</p>
              </Card>

              <Card className="text-center p-3 border-l-4 border-l-emerald-600">
                <p className="text-xs text-slate-500 font-bold uppercase">Active Counters</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{metrics.activeCounters || 0} / {metrics.totalCounters || 0}</p>
                <p className="text-[11px] text-emerald-700 font-semibold">Open Counters</p>
              </Card>

              <Card className="text-center p-3 border-l-4 border-l-amber-600">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Procured (KG)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{(metrics.totalQuantityProcessedKG || 0).toLocaleString()} KG</p>
                <p className="text-[11px] text-slate-600 font-semibold">Expected: {(metrics.totalQuantityExpectedKG || 0).toLocaleString()} KG</p>
              </Card>

              <Card className="text-center p-3 border-l-4 border-l-indigo-600">
                <p className="text-xs text-slate-500 font-bold uppercase">Avg Processing Time</p>
                <p className="text-2xl font-black text-indigo-950 mt-1">{metrics.avgProcessingTimeMinutes || 15} min</p>
                <p className="text-[11px] text-indigo-700 font-semibold">Per Farmer Batch</p>
              </Card>
            </div>
          )}

          {/* Counters Management Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center justify-between">
              <span>Counter Operations & Live State</span>
              <span className="text-xs text-slate-500 font-medium">Opening/Closing a counter automatically recalculates waiting times.</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {counters.map((c) => (
                <CounterToggleCard
                  key={c._id}
                  counterId={c._id}
                  counterNumber={c.counterNumber}
                  status={c.status}
                  assignedOfficerName={c.assignedOfficerId?.fullName}
                  capacityPerHour={c.capacityPerHour}
                  onToggle={handleToggleCounter}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {showPricingModal && dashboardData?.centre?._id && (
        <ProcurementPricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          centreId={dashboardData.centre._id}
          crops={crops}
          onPriceUpdated={loadData}
        />
      )}
    </div>
  );
};
