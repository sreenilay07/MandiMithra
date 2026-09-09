import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { TokenCard } from '../../components/farmer/TokenCard';
import { DepartureCard } from '../../components/farmer/DepartureCard';
import { DocumentChecklist } from '../../components/farmer/DocumentChecklist';
import { ProcurementTimeline } from '../../components/farmer/ProcurementTimeline';
import { ChatbotWidget } from '../../components/chatbot/ChatbotWidget';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import { farmerApi } from '../../services/api/farmer.api';
import { useAuthStore } from '../../store/useAuthStore';
import { initSocketClient } from '../../services/socket';
import { useTranslation } from '../../locales/translations';
import { CalendarPlus, QrCode, Users, CheckCircle2, FileText, Bell, Activity, Clock } from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [queueData, setQueueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQueueData = async () => {
    try {
      const res = await farmerApi.getQueueDetails();
      setQueueData(res.data);
    } catch (err: any) {
      console.error('Failed to load queue details', err);
      setError('Unable to load active queue details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Connect Socket.IO for real-time live updates
    const socket = initSocketClient();
    if (socket) {
      socket.on('queue:updated', () => {
        fetchQueueData();
      });
      socket.on('stage:completed', () => {
        fetchQueueData();
      });
      socket.on('procurement:completed', () => {
        fetchQueueData();
      });
    }

    return () => {
      if (socket) {
        socket.off('queue:updated');
        socket.off('stage:completed');
        socket.off('procurement:completed');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 font-sans">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Welcome Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hello, Farmer</p>
            <h2 className="text-xl font-black text-slate-900">{user?.fullName || 'Farmer User'}</h2>
          </div>
          <Link to="/farmer/book">
            <Button size="sm" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold" icon={<CalendarPlus size={16} />}>
              {t('bookSlot')}
            </Button>
          </Link>
        </div>

        {/* Disclaimer Notice */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs">
          <Clock size={15} className="text-amber-700 shrink-0" />
          <span>Estimated time — actual processing may vary.</span>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-semibold rounded-xl text-center">
            <p>{error}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={fetchQueueData}>
              Retry
            </Button>
          </div>
        ) : queueData?.hasActiveToken ? (
          <>
            {/* 1. Main Token Card */}
            <TokenCard
              tokenNumber={queueData.myToken.tokenNumber}
              queuePosition={queueData.queuePosition}
              expectedQuantity={queueData.myToken.expectedQuantity}
              cropName={queueData.myToken.cropName}
              status={queueData.myToken.status}
              estimatedWaitingMinutes={queueData.estimatedWaitingMinutes}
              estimatedTurnTime={queueData.estimatedTurnTime}
            />

            {/* 2. Smart Departure Recommendation */}
            <DepartureCard
              recommendedDepartureTime={queueData.recommendedDepartureTime}
              estimatedTurnTime={queueData.estimatedTurnTime}
              travelTimeMinutes={queueData.travelTimeMinutes}
              centreLocation={{
                name: queueData.centre.name,
                latitude: queueData.centre.latitude,
                longitude: queueData.centre.longitude
              }}
            />

            {/* Quick Action Navigation Grid (5 Prominent Action Buttons) */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/farmer/queue')}
                icon={<Users size={16} />}
                className="bg-white border-slate-300 text-slate-800 font-bold text-xs py-2.5"
              >
                {t('viewQueue')}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/farmer/procurement')}
                icon={<Activity size={16} />}
                className="bg-white border-slate-300 text-slate-800 font-bold text-xs py-2.5"
              >
                {t('viewStatus')}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/farmer/qr')}
                icon={<QrCode size={16} />}
                className="bg-white border-slate-300 text-slate-800 font-bold text-xs py-2.5"
              >
                {t('viewQRCodes')}
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/farmer/documents')}
                icon={<FileText size={16} />}
                className="bg-white border-slate-300 text-slate-800 font-bold text-xs py-2.5"
              >
                {t('documents')}
              </Button>
            </div>

            <Button
              fullWidth
              variant="outline"
              onClick={() => navigate('/notifications')}
              icon={<Bell size={16} />}
              className="bg-white border-slate-300 text-slate-800 font-bold text-xs py-2.5"
            >
              {t('notifications')}
            </Button>

            {/* 3. Document Checklist Reminder */}
            <DocumentChecklist documents={queueData.requiredDocuments} />

            {/* 4. Procurement Stage Timeline Preview */}
            {queueData.stages && queueData.stages.length > 0 && (
              <ProcurementTimeline
                stages={queueData.stages}
                currentProcurementStatus={queueData.procurementStatus}
              />
            )}
          </>
        ) : (
          /* Empty State — No Active Procurement Booking */
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">No Active Procurement Booking</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                You do not have any active procurement token for today. Book a slot to get your queue token.
              </p>
            </div>
            <Button
              fullWidth
              onClick={() => navigate('/farmer/book')}
              icon={<CalendarPlus size={18} />}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
            >
              {t('bookSlot')}
            </Button>
          </div>
        )}
      </main>

      <ChatbotWidget />
      <BottomNavigation />
    </div>
  );
};
