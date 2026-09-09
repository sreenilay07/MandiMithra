import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, X, CreditCard, Landmark, FileText } from 'lucide-react';
import { documentApi } from '../../services/api/document.api';
import type { DocumentVerification } from '../../services/api/document.api';

interface DocumentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurementId: string;
  farmerName?: string;
  onVerifiedSuccess?: () => void;
}

export const DocumentVerificationModal: React.FC<DocumentVerificationModalProps> = ({
  isOpen,
  onClose,
  procurementId,
  farmerName = 'Farmer',
  onVerifiedSuccess
}) => {
  const [docData, setDocData] = useState<Partial<DocumentVerification>>({});
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarVerifying, setAadhaarVerifying] = useState(false);
  const [aadhaarResult, setAadhaarResult] = useState<any>(null);

  // Bank Form States
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [passbookStatus, setPassbookStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [passbookRemarks, setPassbookRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDocVerification = async () => {
    if (!procurementId) return;
    try {
      const res = await documentApi.getByProcurement(procurementId);
      if (res.data) {
        setDocData(res.data);
        if (res.data.accountHolderName) setAccountHolderName(res.data.accountHolderName);
        if (res.data.bankName) setBankName(res.data.bankName);
        if (res.data.ifscCode) setIfscCode(res.data.ifscCode);
        if (res.data.passbookStatus) setPassbookStatus(res.data.passbookStatus);
        if (res.data.passbookRemarks) setPassbookRemarks(res.data.passbookRemarks);
        if (res.data.aadhaarReference) setAadhaarInput(res.data.aadhaarReference);
      }
    } catch (err) {
      console.error('Error fetching doc verification:', err);
    }
  };

  useEffect(() => {
    if (isOpen && procurementId) {
      fetchDocVerification();
    }
  }, [isOpen, procurementId]);

  if (!isOpen) return null;

  const handleMockAadhaarVerify = async () => {
    setError('');
    setMessage('');
    if (!aadhaarInput) {
      setError('Please enter Aadhaar number or demo reference');
      return;
    }

    try {
      setAadhaarVerifying(true);
      const res = await documentApi.mockAadhaarVerify(aadhaarInput, farmerName);
      setAadhaarResult(res.data);
      if (res.data.status === 'VERIFIED') {
        setMessage('✓ Aadhaar Verified (Demo)');
      } else {
        setError('✗ Aadhaar Verification Failed (Demo)');
      }
    } catch (err: any) {
      setError('Aadhaar verification error');
    } finally {
      setAadhaarVerifying(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (accountNumber && confirmAccountNumber && accountNumber !== confirmAccountNumber) {
      setError('Bank account numbers do not match.');
      return;
    }

    try {
      setSaving(true);
      const isAadhaarVerified = aadhaarResult?.status === 'VERIFIED' || docData.aadhaarStatus === 'VERIFIED';
      const res = await documentApi.saveVerification(procurementId, {
        aadhaarReference: aadhaarInput,
        aadhaarName: farmerName,
        aadhaarStatus: isAadhaarVerified ? 'VERIFIED' : 'PENDING',
        accountHolderName: accountHolderName || farmerName,
        bankName: bankName || 'State Bank of India',
        accountNumber,
        confirmAccountNumber,
        ifscCode: ifscCode || 'SBIN0001234',
        accountType,
        bankStatus: 'VERIFIED',
        passbookStatus,
        passbookRemarks
      });

      setMessage('✓ Document Verification Saved and Marked Verified!');
      setDocData(res.data);
      if (onVerifiedSuccess) onVerifiedSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save document verification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-amber-400" size={24} />
            <div>
              <h2 className="text-lg font-bold">Farmer Document Verification</h2>
              <p className="text-xs text-blue-200">Centre Operator Entry • {farmerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSaveAll} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}

          {/* Section 1: Mock Aadhaar Verification */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <CreditCard size={18} className="text-blue-700" />
                <span>1. Mock Aadhaar Verification</span>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 font-medium px-2.5 py-0.5 rounded-full border border-amber-200">
                Demo verification — not connected to UIDAI
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Demo Aadhaar (e.g. 1234 5678 9012)"
                value={aadhaarInput}
                onChange={(e) => setAadhaarInput(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleMockAadhaarVerify}
                disabled={aadhaarVerifying}
                className="bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer"
              >
                {aadhaarVerifying ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                <span>[ MOCK VERIFY ]</span>
              </button>
            </div>

            {aadhaarResult && (
              <div className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${aadhaarResult.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                <div>
                  <span className="block font-bold">{aadhaarResult.message}</span>
                  <span className="text-[11px] opacity-80">Masked: {aadhaarResult.maskedAadhaar} | Ref: {aadhaarResult.verificationReference}</span>
                </div>
                <span className="italic opacity-75">{aadhaarResult.disclaimer}</span>
              </div>
            )}
          </div>

          {/* Section 2: Bank Account Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Landmark size={18} className="text-emerald-700" />
              <span>2. Bank Account Details Entry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Full name as in bank"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                <input
                  type="password"
                  placeholder="Enter Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Account Number</label>
                <input
                  type="text"
                  placeholder="Re-enter Account Number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="SAVINGS">Savings Account</option>
                  <option value="CURRENT">Current Account</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Passbook Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <FileText size={18} className="text-amber-700" />
              <span>3. Bank Passbook Physical Verification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Passbook Status</label>
                <select
                  value={passbookStatus}
                  onChange={(e) => setPassbookStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="VERIFIED">✓ VERIFIED (Passbook Matches Bank Record)</option>
                  <option value="PENDING">○ PENDING</option>
                  <option value="REJECTED">✗ REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Original passbook verified by operator"
                  value={passbookRemarks}
                  onChange={(e) => setPassbookRemarks(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-md"
            >
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              <span>Save & Mark Documents Verified</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
