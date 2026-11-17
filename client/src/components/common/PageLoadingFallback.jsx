import React from 'react';

export default function PageLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 px-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-4 border-brand-orange/20 animate-ping"></div>
        <div className="w-14 h-14 rounded-full border-4 border-brand-orange border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <img src="/images/rit-logo.png" alt="Loading" className="w-7 h-7 object-contain" />
        </div>
      </div>
      <p className="text-xs uppercase font-bold tracking-widest text-slate-400 animate-pulse">
        Loading Arena...
      </p>
    </div>
  );
}
