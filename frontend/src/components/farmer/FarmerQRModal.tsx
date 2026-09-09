import React, { useState, useEffect } from 'react';
import { QrCode, X, Copy, Check, Info } from 'lucide-react';
import { qrApi } from '../../services/api/qr.api';

interface FarmerQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    _id: string;
    tokenNumber?: string;
    centreName?: string;
    cropName?: string;
    expectedQuantity?: number;
    bookingReference?: string;
  };
}

export const FarmerQRModal: React.FC<FarmerQRModalProps> = ({ isOpen, onClose, booking }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrPayloadString, setQrPayloadString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && booking._id) {
      setLoading(true);
      qrApi.generateBookingQR(booking._id)
        .then((res: any) => {
          if (res.data) {
            const tokenStr = res.data.tokenRef || `MND:${booking._id}`;
            setQrPayloadString(tokenStr);

            // Generate clean visual QR using public QuickChart QR API
            const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(tokenStr)}&size=240&margin=2`;
            setQrCodeUrl(qrUrl);
          }
        })
        .catch((err: any) => {
          console.error('Failed to generate QR:', err);
          const fallbackToken = `MND:${booking._id}`;
          setQrPayloadString(fallbackToken);
          setQrCodeUrl(`https://quickchart.io/qr?text=${encodeURIComponent(fallbackToken)}&size=240&margin=2`);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, booking._id]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-center">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between border-b-4 border-amber-600">
          <div className="flex items-center space-x-2 text-left">
            <QrCode size={20} className="text-amber-400" />
            <div>
              <h2 className="text-base font-bold">MandiMithra</h2>
              <p className="text-xs text-blue-200">Procurement QR Pass</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-600">Token Number</span>
              <span className="text-lg font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                {booking.tokenNumber || 'P-005'}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-semibold">{booking.centreName || 'Procurement Centre'}</p>
            <p className="text-xs text-slate-500">
              Crop: <strong className="text-slate-800">{booking.cropName || 'Paddy'}</strong> ({booking.expectedQuantity || 1000} KG)
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 inline-block mx-auto relative shadow-inner">
            {loading ? (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Generating QR...
              </div>
            ) : (
              <img
                src={qrCodeUrl}
                alt="Farmer Procurement QR Code"
                className="w-48 h-48 mx-auto rounded-lg shadow-xs"
              />
            )}
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700">
            <span className="truncate max-w-[200px]">{qrPayloadString}</span>
            <button
              onClick={handleCopy}
              className="ml-2 text-blue-800 hover:text-blue-900 font-bold flex items-center space-x-1 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center space-x-1">
            <Info size={14} className="text-blue-600" />
            <span>Show this QR code to Centre Operator at arrival</span>
          </p>
        </div>
      </div>
    </div>
  );
};
