import React from 'react';
import { Card } from '../ui/Card';
import { Building2, Users, Scale, IndianRupee } from 'lucide-react';

interface DistrictKpiGridProps {
  summary: {
    totalCentres: number;
    activeCentres: number;
    totalFarmersProcured: number;
    pendingFarmers: number;
    totalExpectedQuantityKG: number;
    totalActualProcuredKG: number;
    totalDisbursedPaymentAmountINR: number;
  };
}

export const DistrictKpiGrid: React.FC<DistrictKpiGridProps> = ({ summary }) => {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-blue-900 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Centres</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalCentres}</p>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">{summary.activeCentres} Active Operational</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-900 rounded-xl">
            <Building2 size={24} />
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-emerald-600 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farmers Procured</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{summary.totalFarmersProcured}</p>
            <p className="text-xs text-amber-700 font-semibold mt-0.5">{summary.pendingFarmers} Pending in Queue</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users size={24} />
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-amber-600 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Procured Quantity</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalActualProcuredKG.toLocaleString()} KG</p>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">Expected: {summary.totalExpectedQuantityKG.toLocaleString()} KG</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl">
            <Scale size={24} />
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-indigo-600 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Payments Disbursed</p>
            <p className="text-2xl font-black text-indigo-950 mt-1">{formatINR(summary.totalDisbursedPaymentAmountINR)}</p>
            <p className="text-xs text-indigo-700 font-semibold mt-0.5">Direct MSP Bank Credit</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl">
            <IndianRupee size={24} />
          </div>
        </div>
      </Card>
    </div>
  );
};
