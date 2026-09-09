import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { paymentApi } from '../../services/api/payment.api';
import { IndianRupee } from 'lucide-react';

export const FarmerPaymentPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    paymentApi.getMyPayments().then(res => setPayments(res.data || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <IndianRupee size={22} className="text-emerald-700" />
          <span>Direct MSP Payment Records</span>
        </h2>

        {payments.length === 0 ? (
          <Card className="text-center py-8 text-slate-600">
            No payment transactions generated yet. Payments are calculated automatically upon Stage 7 Documents completion.
          </Card>
        ) : (
          payments.map(p => (
            <Card key={p._id} className="border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-500">{p.referenceNumber}</span>
                <Badge status={p.status} />
              </div>
              <p className="text-2xl font-black text-emerald-950">₹{p.amount?.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-600 mt-1">Initiated: {new Date(p.paymentInitiatedAt).toLocaleDateString()}</p>
            </Card>
          ))
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
