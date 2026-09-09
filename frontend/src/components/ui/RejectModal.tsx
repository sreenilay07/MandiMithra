import React, { useState } from 'react';
import { Button } from './Button';
import { X, AlertCircle } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  applicantName: string;
  onClose: () => void;
  onConfirmReject: (reason: string) => Promise<void>;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  applicantName,
  onClose,
  onConfirmReject
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for rejecting this registration request.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await onConfirmReject(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject registration request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-rose-600" /> Reject Registration Request
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-600 font-medium mb-4">
          You are rejecting the registration request for <strong className="text-slate-900">{applicantName}</strong>. Please enter the official reason below.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reason for Rejection *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Invalid Employee ID or unverified official credentials."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
            >
              Reject Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
