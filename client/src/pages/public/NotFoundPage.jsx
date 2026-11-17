import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, Trophy, ArrowLeft, ShieldAlert } from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function NotFoundPage() {
  usePageMeta('404 — Outside Safe Zone | RIT Esports Arena', 'This page does not exist or has been eliminated from the battlefield.');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-[#121722] border border-[#1F293D] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-orange/20 blur-[90px] pointer-events-none rounded-full"></div>

        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#0B0E14] border-2 border-brand-orange/50 mx-auto flex items-center justify-center shadow-glow-orange">
            <img src="/images/rit-logo.webp" alt="RIT Crest" className="w-14 h-14 object-contain" />
          </div>
          <span className="inline-block mt-4 px-3 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
            Zone Shrink Elimination
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white tracking-wide">
            404 — Out of Zone
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            You took too much storm damage! The page you are looking for has been eliminated or moved to another coordinates.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white font-display font-bold uppercase text-xs tracking-wider shadow-glow-orange flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Lobby
          </Link>
          <Link
            to="/tournaments"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#161B26] hover:bg-[#1F293D] text-slate-200 border border-[#1F293D] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-brand-amber" /> View Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}
