import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2, Clock, CircleDot, AlertCircle } from 'lucide-react';
import { PROCUREMENT_STAGES } from '../../constants/stages';

interface StageItem {
  stageNumber: number;
  stageName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  completedAt?: string;
  remarks?: string;
  metadata?: any;
}

interface ProcurementTimelineProps {
  stages?: StageItem[];
  currentProcurementStatus?: string;
}

export const ProcurementTimeline: React.FC<ProcurementTimelineProps> = ({
  stages = [],
  currentProcurementStatus = 'NOT_STARTED'
}) => {
  // Merge default stage definitions with backend stage results if present
  const fullTimeline = PROCUREMENT_STAGES.map((defStg) => {
    const matched = stages.find(s => s.stageNumber === defStg.stageNumber);
    return {
      stageNumber: defStg.stageNumber,
      stageName: defStg.stageName,
      status: matched ? matched.status : 'PENDING',
      completedAt: matched?.completedAt,
      remarks: matched?.remarks,
      metadata: matched?.metadata
    };
  });

  return (
    <Card className="border-slate-300">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <h3 className="text-base font-extrabold text-slate-900">7 Procurement Stages Timeline</h3>
        <Badge status={currentProcurementStatus} />
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {fullTimeline.map((stg) => {
          const isCompleted = stg.status === 'COMPLETED';
          const isInProgress = stg.status === 'IN_PROGRESS';
          const isFailed = stg.status === 'FAILED';

          let icon = <CircleDot size={22} className="text-slate-300 bg-white rounded-full" />;
          if (isCompleted) icon = <CheckCircle2 size={22} className="text-emerald-600 bg-white rounded-full" />;
          if (isInProgress) icon = <Clock size={22} className="text-blue-900 bg-white rounded-full animate-spin" />;
          if (isFailed) icon = <AlertCircle size={22} className="text-rose-600 bg-white rounded-full" />;

          return (
            <div key={stg.stageNumber} className="relative flex items-start space-x-3">
              <div className="absolute -left-[35px] top-0 bg-white p-0.5 rounded-full">
                {icon}
              </div>

              <div className={`w-full p-3.5 rounded-xl border transition-colors ${
                isCompleted
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : isInProgress
                  ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                      isCompleted ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-800'
                    }`}>
                      Stage 0{stg.stageNumber}
                    </span>
                    <h4 className="font-bold text-sm">{stg.stageName}</h4>
                  </div>
                  <Badge status={stg.status} size="sm" />
                </div>

                {stg.metadata && Object.keys(stg.metadata).length > 0 && (
                  <div className="mt-2 text-xs bg-white/80 p-2 rounded-md border border-slate-200 text-slate-800 font-mono">
                    {stg.metadata.actualWeight && <p>Actual Weight: <strong className="text-emerald-700 font-bold">{stg.metadata.actualWeight} KG</strong></p>}
                    {stg.metadata.lorryNumber && <p>Lorry No: <strong>{stg.metadata.lorryNumber}</strong></p>}
                    {stg.metadata.numberOfBags && <p>Allocated Bags: <strong>{stg.metadata.numberOfBags}</strong></p>}
                    {stg.metadata.testResult && <p>Test Result: <strong>{stg.metadata.testResult}</strong></p>}
                  </div>
                )}

                {stg.completedAt && (
                  <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
                    Completed at: {new Date(stg.completedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
