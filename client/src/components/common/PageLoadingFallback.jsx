import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Esports-themed loading state.
 * Displays a top indicator and a centered loader so the page never looks blank or frozen.
 */
export default function PageLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Top progress line */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="h-1 w-full bg-gradient-to-r from-brand-orange via-brand-amber to-brand-gold animate-pulse" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#24171e] border border-brand-orange/40 flex items-center justify-center shadow-glow-orange">
          <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
        </div>
        <p className="font-display text-xs uppercase tracking-widest text-slate-400 font-bold">
          Entering Arena…
        </p>
      </div>
    </div>
  );
}
