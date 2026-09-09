import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ShieldCheck } from 'lucide-react';
import { PROCUREMENT_STAGES } from '../../constants/stages';

interface QRCodeCardProps {
  tokenNumber: string;
  arrivalQRString?: string;
  stages?: any[];
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  tokenNumber,
  arrivalQRString,
  stages = []
}) => {
  const tokenPayload = arrivalQRString || `MND:${tokenNumber}`;
  const qrImgUrl = `https://quickchart.io/qr?text=${encodeURIComponent(tokenPayload)}&size=200&margin=2`;

  return (
    <div className="space-y-5">
      {/* Arrival Verification QR */}
      <Card className="border-2 border-blue-950 bg-blue-50/40 text-center p-6 shadow-md">
        <div className="flex items-center justify-center space-x-2 text-blue-950 font-extrabold text-lg mb-2">
          <ShieldCheck size={24} className="text-blue-900" />
          <span>FARMER ARRIVAL QR CODE</span>
        </div>
        <p className="text-xs text-slate-600 font-semibold mb-4">
          Show this QR code to the Centre Operator at the procurement centre.
        </p>

        <div className="bg-white p-3 rounded-2xl border-2 border-slate-300 inline-block shadow-inner mx-auto">
          <img
            src={qrImgUrl}
            alt={`QR Code for ${tokenNumber}`}
            className="w-48 h-48 mx-auto rounded-lg"
          />
        </div>

        <div className="mt-4 pt-3 border-t border-blue-200 flex flex-col items-center">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">SCAN REFERENCE TOKEN</span>
          <span className="text-base font-mono font-black text-blue-950 bg-white px-4 py-1.5 rounded-lg border-2 border-blue-900 shadow-xs">
            {tokenPayload}
          </span>
        </div>
      </Card>

      {/* 7 Stage QR Codes */}
      <div className="space-y-3">
        <h4 className="text-base font-extrabold text-slate-900">7 Procurement Stage Progress & Passes</h4>

        {PROCUREMENT_STAGES.map((stg) => {
          const stageResult = stages.find(s => s.stageNumber === stg.stageNumber);
          const isCompleted = stageResult?.status === 'COMPLETED';
          const stageToken = `MND:${tokenNumber}:STAGE_${stg.stageNumber}`;
          const stageQrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(stageToken)}&size=160&margin=2`;

          return (
            <Card key={stg.stageNumber} className={`border ${isCompleted ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-lg font-black text-sm flex items-center justify-center ${isCompleted ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-white'}`}>
                    0{stg.stageNumber}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{stg.stageName}</h5>
                    <p className="text-xs text-slate-500">Stage {stg.stageNumber} Pass</p>
                  </div>
                </div>

                <Badge status={stageResult?.status || 'PENDING'} />
              </div>

              {!isCompleted && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                  <img
                    src={stageQrUrl}
                    alt={`Stage ${stg.stageNumber} QR`}
                    className="w-32 h-32 mx-auto rounded-lg border border-slate-200 p-1 bg-white"
                  />
                  <span className="text-[10px] font-mono text-slate-500 block mt-1">{stageToken}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
