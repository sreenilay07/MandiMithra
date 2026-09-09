import React from 'react';

type BadgeStatus =
  | 'WAITING'
  | 'CALLED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABSENT'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'OPEN'
  | 'CLOSED'
  | 'ACTIVE'
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING';

interface BadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, label, size = 'md' }) => {
  const upperStatus = status.toUpperCase() as BadgeStatus;

  const colorMap: Record<string, string> = {
    WAITING: 'bg-amber-100 text-amber-900 border-amber-300',
    CALLED: 'bg-blue-100 text-blue-900 border-blue-300 font-bold animate-pulse',
    ARRIVED: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-900 border-blue-300',
    COMPLETED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    PAID: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    OPEN: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    ACTIVE: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    ABSENT: 'bg-rose-100 text-rose-900 border-rose-300',
    CANCELLED: 'bg-rose-100 text-rose-900 border-rose-300',
    CLOSED: 'bg-slate-200 text-slate-800 border-slate-300',
    PENDING: 'bg-slate-100 text-slate-700 border-slate-300',
    PROCESSING: 'bg-cyan-100 text-cyan-900 border-cyan-300'
  };

  const badgeClass = colorMap[upperStatus] || 'bg-slate-100 text-slate-800 border-slate-300';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center rounded-md border ${badgeClass} ${sizeClass} tracking-wide`}>
      {label || status.replace(/_/g, ' ')}
    </span>
  );
};
