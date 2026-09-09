import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { RejectModal } from './RejectModal';
import { UserCheck, Check, X, Building2, MapPin, Clock } from 'lucide-react';
import type { ApprovalRequestItem } from '../../services/api/approval.api';

interface ApprovalCardProps {
  request: ApprovalRequestItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ request, onApprove, onReject }) => {
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleApproveClick = async () => {
    setIsApproving(true);
    try {
      await onApprove(request._id);
    } finally {
      setIsApproving(false);
    }
  };

  const applicant = request.userId || {};
  const requestedRoleLabel = request.requestedRole.replace(/_/g, ' ');

  return (
    <>
      <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <UserCheck size={20} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">{applicant.fullName || 'Applicant'}</h4>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">{requestedRoleLabel} Registration</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
            <Clock size={12} /> {request.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="font-bold text-slate-500 uppercase block">Mobile:</span>
            <span className="font-semibold text-slate-900">{applicant.phoneNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500 uppercase block">Email:</span>
            <span className="font-semibold text-slate-900">{applicant.email || 'N/A'}</span>
          </div>
          {request.centreId && (
            <div>
              <span className="font-bold text-slate-500 uppercase flex items-center gap-1">
                <Building2 size={12} /> Centre:
              </span>
              <span className="font-semibold text-slate-900">{request.centreId.name} ({request.centreId.code})</span>
            </div>
          )}
          {request.districtId && (
            <div>
              <span className="font-bold text-slate-500 uppercase flex items-center gap-1">
                <MapPin size={12} /> District:
              </span>
              <span className="font-semibold text-slate-900">{request.districtId.name}</span>
            </div>
          )}
          {applicant.employeeId && (
            <div>
              <span className="font-bold text-slate-500 uppercase block">Employee ID:</span>
              <span className="font-semibold text-slate-900">{applicant.employeeId}</span>
            </div>
          )}
          <div>
            <span className="font-bold text-slate-500 uppercase block">Submitted:</span>
            <span className="font-medium text-slate-700">{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <Button
            fullWidth
            onClick={handleApproveClick}
            isLoading={isApproving}
            icon={<Check size={16} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 text-xs"
          >
            APPROVE
          </Button>

          <Button
            fullWidth
            variant="outline"
            onClick={() => setIsRejectOpen(true)}
            icon={<X size={16} />}
            className="border-rose-300 text-rose-800 hover:bg-rose-50 font-bold py-2 text-xs"
          >
            REJECT
          </Button>
        </div>
      </Card>

      <RejectModal
        isOpen={isRejectOpen}
        applicantName={applicant.fullName || 'Applicant'}
        onClose={() => setIsRejectOpen(false)}
        onConfirmReject={async (reason) => {
          await onReject(request._id, reason);
        }}
      />
    </>
  );
};
