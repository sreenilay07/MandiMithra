import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ApprovalCard } from '../../components/ui/ApprovalCard';
import { approvalApi, type ApprovalRequestItem } from '../../services/api/approval.api';
import { reportApi } from '../../services/api/report.api';
import { Users, ShieldAlert, FileSpreadsheet, UserCheck, CheckCircle2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchPendingDistrictAdmins();
  }, []);

  const fetchPendingDistrictAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await approvalApi.getPendingDistrictAdmins();
      if (res.success) setPendingRequests(res.data || []);
    } catch (err) {
      console.warn('Failed to load pending district admin approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await approvalApi.approveRequest(id, 'Approved by Super Admin');
      if (res.success) {
        setActionMessage('District Administrator approved successfully.');
        fetchPendingDistrictAdmins();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await approvalApi.rejectRequest(id, reason);
      if (res.success) {
        setActionMessage('District Administrator request rejected.');
        fetchPendingDistrictAdmins();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-6xl mx-auto w-full space-y-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between border-b-4 border-amber-500">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Super Admin Console</h1>
              <p className="text-xs text-slate-300 font-medium mt-1">
                MandiMithra Master System Administration & District Administrator Approvals
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg uppercase tracking-wider">
              Super Admin
            </span>
          </div>

          {actionMessage && (
            <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 size={16} /> {actionMessage}
            </div>
          )}

          {/* PENDING DISTRICT ADMINISTRATOR APPROVALS SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="text-emerald-700" size={22} />
                Pending District Administrator Approvals ({pendingRequests.length})
              </h2>
              <Button size="sm" variant="outline" onClick={fetchPendingDistrictAdmins}>
                Refresh
              </Button>
            </div>

            {isLoading ? (
              <p className="text-xs font-bold text-slate-500 py-4">Loading approval requests...</p>
            ) : pendingRequests.length === 0 ? (
              <Card className="p-6 text-center text-slate-500 text-sm font-medium border border-slate-200">
                No pending District Administrator registration requests.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
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

          {/* ADMIN QUICK ACTIONS & METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 text-center space-y-3 border-t-4 border-t-emerald-800">
              <Users size={32} className="text-emerald-800 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">User Management</h3>
                <p className="text-xs text-slate-500 mt-1">Manage all District Admins, Managers, Operators, and Farmers.</p>
              </div>
              <Button fullWidth onClick={() => navigate('/admin/users')} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs">
                Manage All Users
              </Button>
            </Card>

            <Card className="p-5 text-center space-y-3 border-t-4 border-t-blue-800">
              <FileSpreadsheet size={32} className="text-blue-800 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">System Reports</h3>
                <p className="text-xs text-slate-500 mt-1">Generate state-wide Excel and CSV procurement data reports.</p>
              </div>
              <div className="flex gap-2">
                <Button fullWidth size="sm" onClick={() => reportApi.downloadExcel()} className="bg-blue-800 text-white font-bold text-xs">
                  Excel
                </Button>
                <Button fullWidth size="sm" variant="outline" onClick={() => reportApi.downloadCSV()} className="border-blue-300 text-blue-900 font-bold text-xs">
                  CSV
                </Button>
              </div>
            </Card>

            <Card className="p-5 text-center space-y-3 border-t-4 border-t-amber-600">
              <ShieldAlert size={32} className="text-amber-700 mx-auto" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Audit Logs</h3>
                <p className="text-xs text-slate-500 mt-1">Review system security, approval, and QR scan audit trail.</p>
              </div>
              <Button fullWidth variant="outline" onClick={() => navigate('/admin/audit-logs')} className="border-amber-400 text-amber-900 font-bold text-xs">
                View Audit Logs
              </Button>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};
