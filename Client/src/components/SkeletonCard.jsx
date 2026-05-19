import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/50 shadow-xl h-full flex flex-col shimmer-wrapper">
      <div className="flex justify-between items-start mb-6">
        {/* Avatar block */}
        <div className="h-14 w-14 bg-slate-800/60 rounded-2xl"></div>
        {/* Rating block */}
        <div className="h-6 w-12 bg-slate-800/60 rounded-full"></div>
      </div>

      <div className="flex-1 space-y-4">
        {/* Name block */}
        <div className="h-7 bg-slate-800/60 rounded-xl w-2/3"></div>
        {/* Email block */}
        <div className="h-4 bg-slate-800/40 rounded-lg w-1/2"></div>

        {/* Skill tags */}
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-slate-800/40 rounded-full w-16"></div>
          <div className="h-6 bg-slate-800/40 rounded-full w-20"></div>
          <div className="h-6 bg-slate-800/40 rounded-full w-12"></div>
        </div>
      </div>
      
      {/* Bottom info section */}
      <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
        <div className="h-4 bg-slate-800/40 rounded w-16"></div>
        <div className="h-4 bg-slate-800/40 rounded w-20"></div>
      </div>
    </div>
  );
};

export const SkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonCard;
