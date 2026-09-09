import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Sliders, User, Play, Square } from 'lucide-react';

interface CounterToggleCardProps {
  counterId: string;
  counterNumber: number;
  status: string;
  assignedOfficerName?: string;
  capacityPerHour?: number;
  onToggle: (counterId: string, currentStatus: string) => Promise<void>;
  isLoading?: boolean;
}

export const CounterToggleCard: React.FC<CounterToggleCardProps> = ({
  counterId,
  counterNumber,
  status,
  assignedOfficerName = 'Unassigned',
  capacityPerHour = 2000,
  onToggle,
  isLoading = false
}) => {
  const isOpen = status === 'OPEN';

  return (
    <Card className="border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Sliders size={18} className="text-blue-900" />
          <h4 className="font-extrabold text-slate-900 text-base">Counter #{counterNumber}</h4>
        </div>
        <Badge status={status} />
      </div>

      <div className="space-y-2 text-sm text-slate-700 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <User size={14} /> Assigned Officer:
          </span>
          <span className="font-bold text-slate-900">{assignedOfficerName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Counter Capacity:</span>
          <span className="font-bold text-emerald-800">{capacityPerHour} KG/hour</span>
        </div>
      </div>

      <Button
        fullWidth
        variant={isOpen ? 'danger' : 'success'}
        onClick={() => onToggle(counterId, status)}
        isLoading={isLoading}
        icon={isOpen ? <Square size={16} /> : <Play size={16} />}
      >
        {isOpen ? 'Close Counter' : 'Open Counter'}
      </Button>
    </Card>
  );
};
