import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
        Loading Talent Pool...
      </p>
    </div>
  );
};

export default LoadingSpinner;
