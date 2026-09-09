import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { TokenCard } from '../../components/farmer/TokenCard';
import { Button } from '../../components/ui/Button';
import { farmerApi } from '../../services/api/farmer.api';
import { QrCode, Users, ArrowLeft } from 'lucide-react';

export const FarmerTokenPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    farmerApi.getQueueDetails().then(res => setData(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Token Details</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/farmer/dashboard')} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
        </div>

        {data?.hasActiveToken ? (
          <>
            <TokenCard
              tokenNumber={data.myToken.tokenNumber}
              queuePosition={data.queuePosition}
              expectedQuantity={data.myToken.expectedQuantity}
              cropName={data.myToken.cropName}
              status={data.myToken.status}
              estimatedWaitingMinutes={data.estimatedWaitingMinutes}
              estimatedTurnTime={data.estimatedTurnTime}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate('/farmer/queue')} icon={<Users size={18} />}>
                View Queue
              </Button>
              <Button variant="outline" onClick={() => navigate('/farmer/qr')} icon={<QrCode size={18} />}>
                View QR Codes
              </Button>
            </div>
          </>
        ) : (
          <p className="text-slate-600 text-center py-10">No active token found.</p>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
