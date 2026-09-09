import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { adminApi } from '../../services/api/admin.api';
import { ShieldAlert } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    adminApi.getAuditLogs().then(res => setLogs(res.data || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={22} className="text-amber-700" />
            <span>Immutable System Audit Trail</span>
          </h2>

          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white font-bold text-sm">
              Security Audit Logs ({logs.length})
            </div>

            <div className="divide-y divide-slate-200">
              {logs.length === 0 ? (
                <p className="p-6 text-center text-slate-500 text-sm">No audit logs recorded yet.</p>
              ) : (
                logs.map(log => (
                  <div key={log._id} className="p-3.5 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-blue-950 uppercase px-2 py-0.5 bg-blue-100 rounded mr-2">
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-900">{log.entity}</span>
                      <p className="text-slate-500 mt-0.5">User: {log.userId?.fullName || 'System'} ({log.role})</p>
                    </div>
                    <span className="text-slate-400 font-mono">{new Date(log.createdAt).toLocaleString()}</span>
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
