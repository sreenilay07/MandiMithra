import React, { useState, useEffect } from 'react';
import { FileText, Printer, CheckCircle2, X } from 'lucide-react';
import { receiptApi } from '../../services/api/receipt.api';
import type { ProcurementReceipt } from '../../services/api/receipt.api';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  receiptId?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, bookingId, receiptId }) => {
  const [receipt, setReceipt] = useState<ProcurementReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && (bookingId || receiptId)) {
      setLoading(true);
      setError('');
      const promise = receiptId ? receiptApi.getById(receiptId) : receiptApi.getByBooking(bookingId!);
      promise
        .then((res) => {
          setReceipt(res.data);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Receipt is being processed or not available.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, bookingId, receiptId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (receipt) {
      const url = receiptApi.getDownloadUrl(receipt._id, true);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-600">
          <div className="flex items-center space-x-2">
            <FileText size={22} className="text-amber-400" />
            <div>
              <h2 className="text-lg font-bold">MandiMithra Procurement Receipt</h2>
              <p className="text-xs text-blue-200">Saath Kisan Ka, Har Kadam Par</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium text-sm">
              Loading Procurement Receipt...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-rose-600 font-semibold text-sm">
              {error}
            </div>
          ) : receipt ? (
            <div className="space-y-4">
              {/* Top Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Official Receipt</span>
                  <span className="text-sm font-bold text-slate-900">{receipt.receiptNumber}</span>
                </div>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                  <CheckCircle2 size={14} />
                  <span>COMPLETED</span>
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Farmer Name</span>
                  <span className="font-semibold text-slate-900">{receipt.farmerName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Token Number</span>
                  <span className="font-semibold text-slate-900">{receipt.tokenNumber}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Procurement Centre</span>
                  <span className="font-semibold text-slate-900">{receipt.centreName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Date & Time</span>
                  <span className="font-semibold text-slate-900">{new Date(receipt.completedAt).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Transaction Summary Box */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase">
                  Produce & Calculation Breakdown
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Crop Name</span>
                    <span className="font-bold text-slate-900">{receipt.cropName}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Registered Quantity</span>
                    <span className="font-semibold text-slate-800">{receipt.registeredQuantity} KG</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Actual Weight Measured</span>
                    <span className="font-bold text-slate-900">{receipt.actualWeight} KG ({receipt.quantityInQuintal} Quintal)</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Procurement Price</span>
                    <span className="font-bold text-emerald-700">₹{receipt.appliedPrice.toLocaleString('en-IN')} / {receipt.priceUnit}</span>
                  </div>

                  <div className="flex justify-between pt-2 text-sm font-black text-emerald-800 bg-emerald-50/60 p-2 rounded-lg">
                    <span>Gross Procurement Amount:</span>
                    <span>₹{receipt.grossAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Stages List */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">7 Verified Procurement Stages:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(receipt.stagesCompleted || []).map((s) => (
                    <span key={s.stageNumber} className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-medium">
                      ✓ Stage {s.stageNumber}: {s.stageName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          {receipt && (
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Printer size={16} />
                <span>Print / Download Receipt</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
