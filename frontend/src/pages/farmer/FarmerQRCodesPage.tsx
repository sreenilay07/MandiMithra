import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { QRCodeCard } from '../../components/farmer/QRCodeCard';
import { farmerApi } from '../../services/api/farmer.api';

export const FarmerQRCodesPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    farmerApi.getQueueDetails().then(res => setData(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900">Your Verification QR Codes</h2>
        {data?.hasActiveToken ? (
          <QRCodeCard
            tokenNumber={data.myToken.tokenNumber}
            stages={data.stages}
          />
        ) : (
          <p className="text-slate-600 text-center py-10">No active token for QR code display.</p>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
