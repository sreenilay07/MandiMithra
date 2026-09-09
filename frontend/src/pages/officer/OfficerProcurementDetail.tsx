import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { Sidebar } from '../../components/layout/Sidebar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StageFormModal } from '../../components/officer/StageFormModal';
import { DocumentVerificationModal } from '../../components/officer/DocumentVerificationModal';
import { ReceiptModal } from '../../components/farmer/ReceiptModal';
import { procurementApi } from '../../services/api/procurement.api';
import { PROCUREMENT_STAGES } from '../../constants/stages';
import { ArrowLeft, Play, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

export const OfficerProcurementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [activeModalStage, setActiveModalStage] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProcurement = async () => {
    if (!id) return;
    try {
      const res = await procurementApi.getProcurementById(id);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load procurement detail', err);
    }
  };

  useEffect(() => {
    loadProcurement();
  }, [id]);

  const handleCompleteStageSubmit = async (payload: any) => {
    if (!id || !activeModalStage) return;
    setIsLoading(true);
    setError('');

    try {
      await procurementApi.completeStage(id, activeModalStage._id, payload);
      setActiveModalStage(null);
      await loadProcurement();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete stage. Ensure previous stage is completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const proc = data?.procurement;
  const stages = data?.stages || [];
  const docVer = data?.documentVerification;
  const isDocVerified = docVer?.overallStatus === 'VERIFIED';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <AppHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={() => navigate('/officer/dashboard')} icon={<ArrowLeft size={16} />}>
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              {proc?.status === 'COMPLETED' && (
                <Button
                  size="sm"
                  onClick={() => setShowReceiptModal(true)}
                  icon={<FileText size={16} />}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
                >
                  View Receipt
                </Button>
              )}
              {proc && <Badge status={proc.status} />}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-xl flex items-center space-x-2 shadow-xs">
              <AlertTriangle size={20} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {proc && (
            <Card className="border-t-4 border-t-blue-900 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Token Number</p>
                  <p className="text-lg font-black text-blue-950">{proc.tokenId?.tokenNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Farmer Name</p>
                  <p className="text-base font-bold text-slate-900">{proc.farmerId?.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Crop / Expected Qty</p>
                  <p className="text-base font-bold text-slate-900">{proc.cropId?.name} ({proc.expectedQuantity} KG)</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Actual Weight</p>
                  <p className="text-base font-bold text-emerald-800">{proc.actualQuantity ? `${proc.actualQuantity} KG` : 'Not Measured Yet'}</p>
                </div>
              </div>

              {/* Document Verification Callout Banner */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={20} className={isDocVerified ? 'text-emerald-700' : 'text-amber-600'} />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Farmer Document Verification Prerequisite</span>
                    <span className="text-[11px] text-slate-500">
                      Status: <strong className={isDocVerified ? 'text-emerald-700' : 'text-amber-700'}>{docVer?.overallStatus || 'PENDING'}</strong> (Aadhaar, Bank Account & Passbook)
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => setShowDocModal(true)}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs"
                  icon={<ShieldCheck size={14} />}
                >
                  {isDocVerified ? 'Edit Documents' : 'Verify Documents'}
                </Button>
              </div>
            </Card>
          )}

          {/* 7 Stages Processing List */}
          <div className="space-y-3">
            <h3 className="text-lg font-extrabold text-slate-900">Execute 7 Sequential Stages</h3>

            {PROCUREMENT_STAGES.map((defStg) => {
              const matched = stages.find((s: any) => s.stageNumber === defStg.stageNumber);
              const isCompleted = matched?.status === 'COMPLETED';

              return (
                <Card key={defStg.stageNumber} className={`border ${isCompleted ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`w-9 h-9 rounded-lg font-black text-sm flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-700 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        0{defStg.stageNumber}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">{defStg.stageName}</h4>
                        {matched?.completedAt && (
                          <p className="text-xs text-slate-500">Completed at {new Date(matched.completedAt).toLocaleTimeString()}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge status={matched?.status || 'PENDING'} />
                      {!isCompleted && matched && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setActiveModalStage(matched)}
                          icon={<Play size={14} />}
                        >
                          Process Stage
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
      </div>

      {activeModalStage && (
        <StageFormModal
          isOpen={!!activeModalStage}
          onClose={() => setActiveModalStage(null)}
          onSubmit={handleCompleteStageSubmit}
          stageNumber={activeModalStage.stageNumber}
          stageName={activeModalStage.stageName}
          expectedQuantity={proc?.expectedQuantity}
          isLoading={isLoading}
        />
      )}

      {showDocModal && proc && (
        <DocumentVerificationModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          procurementId={proc._id}
          farmerName={proc.farmerId?.fullName}
          onVerifiedSuccess={loadProcurement}
        />
      )}

      {showReceiptModal && proc && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          bookingId={proc.bookingId}
        />
      )}
    </div>
  );
};
