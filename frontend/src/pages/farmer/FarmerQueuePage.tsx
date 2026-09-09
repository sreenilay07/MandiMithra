import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/layout/AppHeader';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { farmerApi } from '../../services/api/farmer.api';
import { queueApi } from '../../services/api/queue.api';
import { initSocketClient } from '../../services/socket';
import { Users, Navigation } from 'lucide-react';

export const FarmerQueuePage: React.FC = () => {
  const [queueInfo, setQueueInfo] = useState<any>(null);
  const [centreQueue, setCentreQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const loadQueue = async () => {
    try {
      const myRes = await farmerApi.getQueueDetails();
      setQueueInfo(myRes.data);

      if (myRes.data?.centre?._id) {
        const cRes = await queueApi.getCentreQueue(myRes.data.centre._id);
        setCentreQueue(cRes.data?.queue || []);
      }
    } catch (err) {
      console.warn('Failed to load queue page data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();

    const socket = initSocketClient();
    if (socket) {
      socket.on('queue:updated', () => {
        setToastMessage('Queue Updated! Your wait time estimate has been updated.');
        loadQueue();
        setTimeout(() => setToastMessage(''), 4000);
      });
    }

    return () => {
      if (socket) {
        socket.off('queue:updated');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col pb-24 font-sans">
      <AppHeader />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-emerald-800" />
            <span>Centre Active Queue</span>
          </h1>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
            Workload-Based Estimate
          </span>
        </div>

        {toastMessage && (
          <div className="p-3 bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg animate-in fade-in duration-200 text-center">
            {toastMessage}
          </div>
        )}

        {isLoading ? (
          <Skeleton height="h-64" />
        ) : (
          <>
            {/* WORKLOAD-BASED QUEUE STATS BREAKDOWN */}
            {queueInfo?.hasActiveToken && (
              <Card className="bg-slate-900 text-white border-2 border-emerald-600 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase text-emerald-400 font-black tracking-widest block">YOUR TOKEN</span>
                    <span className="text-3xl font-black text-amber-400 tracking-tight">{queueInfo.myToken.tokenNumber}</span>
                  </div>
                  <Badge status={queueInfo.myToken.status} />
                </div>

                {/* Queue Math Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Farmers Ahead</span>
                    <span className="text-xl font-black text-white">{queueInfo.farmersAhead || 0}</span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Workload Ahead</span>
                    <span className="text-xl font-black text-amber-300">
                      {((queueInfo.farmersAhead || 0) * 1150).toLocaleString()} KG
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Centre Capacity</span>
                    <span className="text-xl font-black text-emerald-400">
                      {(queueInfo.centre?.capacityPerHour || 2000) * (queueInfo.centre?.activeCounters || 1)} KG/hr
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Estimated Wait</span>
                    <span className="text-xl font-black text-white">≈ {queueInfo.estimatedWaitingMinutes || 0} mins</span>
                  </div>
                </div>

                {/* Recommended Departure */}
                <div className="bg-emerald-950 p-3 rounded-xl border border-emerald-700 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-emerald-300 font-bold uppercase block">Recommended Departure</span>
                      <span className="font-extrabold text-white text-sm">
                        {queueInfo.recommendedDepartureTime ? new Date(queueInfo.recommendedDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Leave Now'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-300">
                    ({queueInfo.travelTimeMinutes || 30}m travel time)
                  </span>
                </div>
              </Card>
            )}

            {/* Public Queue Sequence */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                Full Centre Sequence ({centreQueue.length} Farmers)
              </h2>

              {centreQueue.length === 0 ? (
                <Card className="text-center py-6 text-slate-500 text-sm font-medium border border-slate-200">
                  No active tokens in queue for this centre today.
                </Card>
              ) : (
                centreQueue.map((item) => {
                  const isMe = queueInfo?.myToken?.tokenNumber === item.tokenNumber;

                  return (
                    <div
                      key={item.tokenId}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                        isMe
                          ? 'bg-emerald-50 border-2 border-emerald-700 text-emerald-950 shadow-sm font-bold'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center ${
                          isMe ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          #{item.position}
                        </span>
                        <div>
                          <p className="font-extrabold text-sm flex items-center gap-1.5">
                            <span>{item.tokenNumber}</span>
                            {isMe && <span className="text-[10px] text-emerald-900 font-black bg-emerald-200 px-1.5 py-0.5 rounded">(YOU)</span>}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">{item.farmerName} • {item.crop} ({item.expectedQuantity} KG)</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge status={item.status} size="sm" />
                        <p className="text-[11px] text-slate-500 font-bold mt-1">≈ {item.estimatedWaitingMinutes}m wait</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
