import React, { useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { reportApi } from '../../services/api/report.api';
import { FileSpreadsheet, Download, Filter } from 'lucide-react';

export const DistrictReportsPage: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadExcel = async () => {
    setIsLoading(true);
    try {
      await reportApi.downloadExcel({ fromDate, toDate, status });
    } catch (err) {
      console.error('Excel download error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setIsLoading(true);
    try {
      await reportApi.downloadCSV({ fromDate, toDate, status });
    } catch (err) {
      console.error('CSV download error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
          <Card className="border-t-4 border-t-emerald-700">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4">
              <FileSpreadsheet size={22} className="text-emerald-700" />
              <span>District Procurement Reports & Exports</span>
            </h2>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 mb-6">
              <p className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                <Filter size={14} /> Filter Procurement Data
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                <Select
                  label="Status Filter"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'ARRIVED', label: 'Arrived' },
                    { value: 'CANCELLED', label: 'Cancelled' }
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                <FileSpreadsheet size={36} className="text-emerald-700 mx-auto" />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Excel Spreadsheet (.xlsx)</h4>
                  <p className="text-xs text-slate-600">Full 22-column government procurement breakdown including 7 stage timestamps & payment details.</p>
                </div>
                <Button fullWidth variant="success" onClick={handleDownloadExcel} isLoading={isLoading}>
                  Download Excel File
                </Button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                <Download size={36} className="text-slate-700 mx-auto" />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Comma-Separated Values (.csv)</h4>
                  <p className="text-xs text-slate-600">Standard CSV formatted data file compatible with all database tools and Excel.</p>
                </div>
                <Button fullWidth variant="secondary" onClick={handleDownloadCSV} isLoading={isLoading}>
                  Download CSV File
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};
