import React from "react";

const LoadingSpinner = ({ label = "Loading SkillBridge..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-14 h-14">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">
        {label}
      </p>
    </div>
  );
};

export default LoadingSpinner;
