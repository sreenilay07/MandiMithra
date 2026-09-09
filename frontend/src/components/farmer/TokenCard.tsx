import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { t } from '../../services/i18n';
import { Ticket, Clock, Navigation } from 'lucide-react';

interface TokenCardProps {
  tokenNumber: string;
  queuePosition: number;
  expectedQuantity: number;
  cropName?: string;
  status: string;
  estimatedWaitingMinutes: number;
  estimatedTurnTime?: string | Date;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  tokenNumber,
  queuePosition,
  expectedQuantity,
  cropName = 'Paddy',
  status,
  estimatedWaitingMinutes,
  estimatedTurnTime
}) => {
  const formatWaitTime = (mins: number) => {
    if (mins <= 0) return '0 min';
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs > 0) {
      return `≈ ${hrs} hr ${remainingMins} min`;
    }
    return `≈ ${remainingMins} min`;
  };

  const formatTurnTime = (turn: string | Date | undefined) => {
    if (!turn) return '11:20 AM';
    const dateObj = new Date(turn);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-gradient-to-br from-blue-900 to-slate-900 text-white border-2 border-blue-800 shadow-md">
      <div className="flex items-center justify-between border-b border-blue-800/80 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Ticket size={20} className="text-amber-400" />
          <span className="text-xs uppercase tracking-wider font-extrabold text-blue-200">
            {t('today_procurement')}
          </span>
        </div>
        <Badge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        {/* Token Number */}
        <div className="bg-blue-950/60 p-3.5 rounded-xl border border-blue-700/50">
          <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">{t('token_number')}</p>
          <p className="text-3xl font-black text-amber-400 tracking-tight mt-1">{tokenNumber}</p>
          <p className="text-xs text-slate-300 mt-1 font-semibold">{cropName} ({expectedQuantity} KG)</p>
        </div>

        {/* Queue Position */}
        <div className="bg-blue-950/60 p-3.5 rounded-xl border border-blue-700/50">
          <p className="text-xs text-blue-200 font-medium uppercase tracking-wider">{t('queue_position')}</p>
          <p className="text-3xl font-black text-white tracking-tight mt-1">#{queuePosition}</p>
          <p className="text-xs text-slate-300 mt-1 font-semibold">{queuePosition - 1} farmers ahead</p>
        </div>
      </div>

      {/* Waiting Metrics */}
      <div className="mt-4 pt-3 border-t border-blue-800/80 grid grid-cols-2 gap-3 text-left">
        <div className="flex items-start space-x-2.5">
          <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-blue-200 font-medium">{t('estimated_waiting')}</p>
            <p className="text-base font-bold text-white">{formatWaitTime(estimatedWaitingMinutes)}</p>
          </div>
        </div>

        <div className="flex items-start space-x-2.5">
          <Navigation size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-blue-200 font-medium">{t('estimated_turn')}</p>
            <p className="text-base font-bold text-white">{formatTurnTime(estimatedTurnTime)}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-blue-300/80 italic text-center">
        * Estimated waiting time is calculated using real-time centre capacity and active counters.
      </p>
    </Card>
  );
};
