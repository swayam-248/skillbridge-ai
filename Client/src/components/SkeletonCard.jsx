import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm shimmer-wrapper">
      <div className="flex justify-between items-start mb-6">
        <div className="h-12 w-12 rounded-2xl bg-slate-100"></div>
        <div className="h-6 w-14 rounded-full bg-slate-100"></div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="h-6 w-2/3 rounded-xl bg-slate-100"></div>
        <div className="h-4 w-1/2 rounded-lg bg-slate-50"></div>

        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 rounded-full bg-slate-100"></div>
          <div className="h-6 w-24 rounded-full bg-slate-100"></div>
          <div className="h-6 w-16 rounded-full bg-slate-100"></div>
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
        <div className="h-4 w-16 rounded bg-slate-100"></div>
        <div className="h-4 w-20 rounded bg-slate-100"></div>
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonCard;
