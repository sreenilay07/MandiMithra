import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Image, RefreshCw, CheckCircle2, AlertCircle, Upload, SwitchCamera } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (qrCodeMessage: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError
}) => {
  const [mode, setMode] = useState<'camera' | 'gallery'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [gallerySuccess, setGallerySuccess] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'officer-qr-reader-container';

  // Stop camera scan safely
  const stopCameraStream = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping camera scanner:', err);
      }
    }
    setIsScanning(false);
  };

  // Start live camera stream
  const startCameraStream = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(regionId);
      } else if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      await html5QrCodeRef.current.start(
        { facingMode: facingMode },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (error) => {
          if (onScanError) onScanError(error);
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsScanning(false);
      setCameraError(
        err?.message || 'Unable to access camera stream. Please allow camera permissions or upload a QR photo from gallery.'
      );
    }
  };

  useEffect(() => {
    if (mode === 'camera') {
      const timer = setTimeout(() => {
        startCameraStream();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCameraStream();
      };
    } else {
      stopCameraStream();
    }
  }, [mode, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGalleryError(null);
    setGallerySuccess(null);
    setIsProcessingFile(true);

    // Show image preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPreviewImage(evt.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(regionId);
      }
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      }

      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      setGallerySuccess(`QR Code scanned successfully!`);
      onScanSuccess(decodedText);
    } catch (err: any) {
      console.error('File scan error:', err);
      setGalleryError('No readable QR code found in this photo. Please upload a clear QR image.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-4">
      {/* Hidden container for Html5Qrcode engine */}
      <div id={regionId} className={`w-full bg-black rounded-xl overflow-hidden border-2 border-slate-800 ${mode === 'camera' ? 'min-h-[260px]' : 'hidden'}`} />

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setMode('camera')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mode === 'camera'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera size={16} />
          <span>Scan Live Camera</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('gallery')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mode === 'gallery'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Image size={16} />
          <span>Upload from Gallery</span>
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE STREAM ACTIVE</span>
            </span>
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md flex items-center space-x-1 cursor-pointer transition-colors text-[11px]"
            >
              <SwitchCamera size={13} />
              <span>Flip ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
            </button>
          </div>

          {cameraError && (
            <div className="p-4 bg-slate-950 rounded-xl border border-rose-900/60 flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle size={32} className="text-amber-400" />
              <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCameraStream}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={14} /> Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => setMode('gallery')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Image size={14} /> Use Gallery Photo
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 text-center font-medium">
            Point camera live at Farmer Token QR code for instant auto-verification.
          </p>
        </div>
      ) : (
        /* Gallery Upload Mode */
        <div className="space-y-4 p-2">
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-950/60 transition-colors">
            <label className="cursor-pointer flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center">
                <Upload size={22} />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 block">Click to Select QR Photo from Gallery</span>
                <span className="text-[10px] text-slate-400">Upload QR image file saved on your device</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {isProcessingFile && (
            <div className="p-3 bg-slate-800 rounded-xl text-center text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin" size={16} />
              <span>Scanning uploaded image for QR code...</span>
            </div>
          )}

          {previewImage && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <img src={previewImage} alt="QR Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-700" />
              <div className="flex-1 text-left text-xs">
                {gallerySuccess ? (
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={16} />
                    <span>{gallerySuccess}</span>
                  </div>
                ) : galleryError ? (
                  <div className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle size={16} />
                    <span>{galleryError}</span>
                  </div>
                ) : (
                  <span className="text-slate-400">Processing QR photo...</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
