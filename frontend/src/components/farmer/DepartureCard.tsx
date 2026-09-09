import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MapPin, Navigation } from 'lucide-react';
import { t } from '../../services/i18n';

interface DepartureCardProps {
  recommendedDepartureTime?: string | Date;
  estimatedTurnTime?: string | Date;
  travelTimeMinutes?: number;
  safetyBufferMinutes?: number;
  centreLocation?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export const DepartureCard: React.FC<DepartureCardProps> = ({
  recommendedDepartureTime,
  estimatedTurnTime,
  travelTimeMinutes = 30,
  safetyBufferMinutes = 10,
  centreLocation = { name: 'ABC Procurement Centre', latitude: 17.9784, longitude: 79.5941 }
}) => {
  const formatTime = (dt?: string | Date) => {
    if (!dt) return '10:40 AM';
    const dateObj = new Date(dt);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPast = recommendedDepartureTime ? new Date(recommendedDepartureTime) <= new Date() : false;

  const handleOpenMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${centreLocation.latitude},${centreLocation.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <Card className="border-2 border-emerald-700/40 bg-emerald-50/40">
      <div className="flex items-center space-x-2 text-emerald-950 font-extrabold text-base mb-3 border-b border-emerald-200 pb-2">
        <Navigation size={20} className="text-emerald-700" />
        <span>WHEN SHOULD YOU LEAVE HOME?</span>
      </div>

      <div className="space-y-3">
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">{t('recommended_departure')}</p>
            <p className="text-2xl font-black text-emerald-900 mt-0.5">
              {isPast ? 'Leave as soon as possible' : formatTime(recommendedDepartureTime)}
            </p>
          </div>
          {isPast && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-md border border-amber-300 animate-pulse">
              LEAVE NOW
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <p className="text-slate-500 font-semibold">{t('estimated_turn')}</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{formatTime(estimatedTurnTime)}</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <p className="text-slate-500 font-semibold">{t('travel_time')}</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{travelTimeMinutes} min</p>
          </div>
          <div className="bg-white p-2 rounded-lg border border-slate-200">
            <p className="text-slate-500 font-semibold">Safety Buffer</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{safetyBufferMinutes} min</p>
          </div>
        </div>

        <Button
          fullWidth
          variant="success"
          onClick={handleOpenMaps}
          icon={<MapPin size={18} />}
        >
          {t('get_directions')} ({centreLocation.name})
        </Button>

        <p className="text-[11px] text-slate-600 text-center font-medium">
          * Travel time estimated for current location. Please allow extra time for traffic.
        </p>
      </div>
    </Card>
  );
};
