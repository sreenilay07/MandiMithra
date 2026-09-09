import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  height = 'h-4',
  width = 'w-full'
}) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-md ${height} ${width} ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      <Skeleton height="h-28" className="rounded-xl" />
      <Skeleton height="h-36" className="rounded-xl" />
      <Skeleton height="h-44" className="rounded-xl" />
    </div>
  );
};
