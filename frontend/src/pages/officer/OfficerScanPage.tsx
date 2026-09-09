import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { QRScanner } from '../../components/officer/QRScanner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { qrApi } from '../../services/api/qr.api';
import { CheckCircle2, AlertCircle, ArrowLeft, QrCode, Search, RefreshCw } from 'lucide-react';

export const OfficerScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualToken, setManualToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [scannedProcurement, setScannedProcurement] = useState<any>(null);

  const processScan = async (qrString: string) => {
    if (isVerifying) return;
    setIsVerifying(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await qrApi.scanQR(qrString);
      const data = res.data;
      if (data && data.procurement) {
        setScannedProcurement(data.procurement);
        setSuccessMsg(data.isAlreadyArrived ? `✓ Farmer ${data.procurement.farmerId?.fullName || ''} already arrived.` : `✓ Arrival Verified for Token ${data.procurement.tokenId?.tokenNumber || 'P-001'}! Queue recalculated.`);

        // Navigate after brief delay to procurement details
        setTimeout(() => {
          navigate(`/officer/procurement/${data.procurement._id}`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to scan / verify QR. Please check token or centre authorization.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken) return;
    processScan(manualToken);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => navigate('/officer/dashboard')} icon={<ArrowLeft size={16} />}>
            Dashboard
          </Button>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 flex items-center space-x-1">
            <QrCode size={14} />
            <span>Operator Scanner</span>
          </span>
        </div>

        {/* Camera Scanner View */}
        <QRScanner onScanSuccess={(code) => processScan(code)} />

        {/* Manual Token Input Fallback */}
        <Card className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Or Enter Token / Booking Reference Manually
          </label>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. P-005 or MND:BK-ABC-DEMO-001"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              type="submit"
              disabled={isVerifying}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs"
            >
              {isVerifying ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            </Button>
          </form>
        </Card>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
            <AlertCircle size={20} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {scannedProcurement && (
          <Card className="border-t-4 border-t-emerald-600 bg-white space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base">Procurement Record Identified</h3>
            <p className="text-xs text-slate-600">Farmer: <strong className="text-slate-900">{scannedProcurement.farmerId?.fullName}</strong></p>
            <p className="text-xs text-slate-600">Crop: <strong>{scannedProcurement.cropId?.name}</strong> ({scannedProcurement.expectedQuantity} KG)</p>
            <Button
              fullWidth
              className="mt-3 bg-emerald-800 text-white font-bold"
              onClick={() => navigate(`/officer/procurement/${scannedProcurement._id}`)}
            >
              Open Procurement Verification & Stages →
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};
