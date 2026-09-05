import React from 'react';

interface LoadingSkeletonProps {
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="w-full space-y-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-1/4 mb-6"></div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-6 bg-slate-200 rounded-full"></div>
        </div>
      ))}
    </div>
  );
};
