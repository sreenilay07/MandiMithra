import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ApprovalCard } from '../../components/ui/ApprovalCard';
import { DistrictKpiGrid } from '../../components/district/DistrictKpiGrid';
import { districtApi } from '../../services/api/district.api';
import { reportApi } from '../../services/api/report.api';
import { approvalApi, type ApprovalRequestItem } from '../../services/api/approval.api';
import { CreateCentreModal } from '../../components/district/CreateCentreModal';
import { EditCentreModal } from '../../components/district/EditCentreModal';
import { FileSpreadsheet, Download, RefreshCw, UserCheck, CheckCircle2, Plus, Edit2 } from 'lucide-react';

export const DistrictDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [pendingManagers, setPendingManagers] = useState<ApprovalRequestItem[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editCentreId, setEditCentreId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await districtApi.getDashboard();
      setData(res.data);
    } catch (err) {
      console.warn('Failed to load district dashboard', err);
    }
  };

  const loadPendingManagers = async () => {
    setIsLoadingApprovals(true);
    try {
      const res = await approvalApi.getPendingCentreManagers();
      if (res.success) setPendingManagers(res.data || []);
    } catch (err) {
      console.warn('Failed to load pending centre manager approvals');
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPendingManagers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await approvalApi.approveRequest(id, 'Approved by District Admin');
      if (res.success) {
        setActionMessage('Centre Manager approved successfully.');
        loadPendingManagers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve Centre Manager.');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await approvalApi.rejectRequest(id, reason);
      if (res.success) {
        setActionMessage('Centre Manager request rejected.');
        loadPendingManagers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  const centrePerformance = data?.centrePerformance || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">District Administration Console</h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                MandiMithra District Procurement Progress & Centre Manager Approvals
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus size={16} />} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold">
                Add Procurement Centre
              </Button>
              <Button size="sm" variant="success" onClick={() => reportApi.downloadExcel()} icon={<FileSpreadsheet size={16} />}>
                Export Excel (.xlsx)
              </Button>
              <Button size="sm" variant="outline" onClick={() => reportApi.downloadCSV()} icon={<Download size={16} />}>
                Export CSV
              </Button>
            </div>
          </div>

          {actionMessage && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} /> {actionMessage}
            </div>
          )}

          {/* PENDING CENTRE MANAGER APPROVALS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="text-emerald-700" size={22} />
                Centre Manager Approval Requests ({pendingManagers.length})
              </h2>
              <Button size="sm" variant="outline" onClick={loadPendingManagers}>
                Refresh
              </Button>
            </div>

            {isLoadingApprovals ? (
              <p className="text-xs font-bold text-slate-500 py-2">Loading pending Centre Manager requests...</p>
            ) : pendingManagers.length === 0 ? (
              <Card className="p-5 text-center text-slate-500 text-sm font-medium border border-slate-200">
                No pending Centre Manager registration requests for this district.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingManagers.map((req) => (
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

          {/* District Summary KPI Grid */}
          {data?.districtSummary && (
            <DistrictKpiGrid summary={data.districtSummary} />
          )}

          {/* Centre Performance Monitoring Table */}
          <Card header={<span className="font-bold flex items-center justify-between"><span>Procurement Centres Status ({centrePerformance.length})</span> <button onClick={loadData} className="p-1 hover:bg-slate-100 rounded text-slate-600"><RefreshCw size={16} /></button></span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase">
                    <th className="p-3">Centre Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Active Counters</th>
                    <th className="p-3">Processed Farmers</th>
                    <th className="p-3">Pending Queue</th>
                    <th className="p-3">Quantity Procured</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {centrePerformance.map((c: any) => (
                    <tr key={c.centreId} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.centreName} ({c.code})</td>
                      <td className="p-3"><Badge status={c.status} size="sm" /></td>
                      <td className="p-3 font-semibold">{c.activeCounters} Open</td>
                      <td className="p-3 font-bold text-emerald-800">{c.farmersProcessed} Farmers</td>
                      <td className="p-3 text-amber-800 font-bold">{c.pending} Waiting</td>
                      <td className="p-3 font-black text-slate-950">{c.quantityProcuredKG?.toLocaleString() || 0} KG</td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => setEditCentreId(c.centreId)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Centre"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      <CreateCentreModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setActionMessage('Procurement Centre created successfully!');
          loadData();
        }}
      />

      <EditCentreModal
        isOpen={!!editCentreId}
        centreId={editCentreId}
        onClose={() => setEditCentreId(null)}
        onSuccess={() => {
          setEditCentreId(null);
          setActionMessage('Procurement Centre updated successfully!');
          loadData();
        }}
      />
    </div>
  );
};
