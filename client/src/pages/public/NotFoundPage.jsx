import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft, ShieldAlert, Crosshair } from 'lucide-react';
import usePageMeta from '../../hooks/usePageMeta.js';
import { site } from '../../config/site.js';

export default function NotFoundPage() {
  usePageMeta('404 — Outside Safe Zone | Rahul Esports', 'This page does not exist or has been eliminated from the battlefield.');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-[#24171e] border border-[#49303a] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-orange/20 blur-[90px] pointer-events-none rounded-full"></div>

        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#160e13] border-2 border-brand-orange/50 mx-auto flex items-center justify-center shadow-glow-orange">
            <Crosshair className="w-10 h-10 text-brand-orange" />
          </div>
          <span className="inline-block mt-4 px-3 py-1 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
            Safe Zone Shrink · 404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
            Outside the Zone
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            You took too much storm damage! The page or match coordinates you are looking for do not exist or have been eliminated from the battlefield.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white font-display font-bold uppercase text-xs tracking-wider shadow-glow-orange flex items-center justify-center gap-1.5 hover:brightness-110 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Lobby
          </Link>
          <Link
            to="/tournaments"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1b1017] hover:bg-[#301e27] text-slate-200 border border-[#49303a] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trophy className="w-4 h-4 text-brand-amber" /> Browse Tournaments
          </Link>
        </div>

        <div className="pt-2 border-t border-[#49303a]/60 text-[11px] text-slate-400">
          {site.name} · Free Fire Competitive Arena · {site.region}
        </div>
      </div>
    </div>
  );
}
