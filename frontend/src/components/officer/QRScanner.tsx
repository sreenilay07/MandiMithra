import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (qrCodeMessage: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (error) => {
        if (onScanError) onScanError(error);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.error('Failed to clear scanner', err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full bg-slate-900 text-white rounded-xl p-4 shadow-lg border border-slate-700">
      <div className="flex items-center space-x-2 mb-3 text-amber-400 font-extrabold text-sm">
        <Camera size={18} />
        <span>OFFICER SCANNER (Point camera at QR code)</span>
      </div>

      <div id="qr-reader" className="w-full bg-black rounded-lg overflow-hidden border border-slate-800" />

      <p className="mt-3 text-xs text-slate-400 text-center font-medium">
        Ensure farmer QR code is clearly visible inside the square frame.
      </p>
    </div>
  );
};
