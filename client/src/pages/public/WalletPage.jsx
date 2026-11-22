import { site } from '../../config/site.js';
import React from 'react';
import { Link } from 'react-router-dom';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Coins, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  MessageCircle, 
  Trophy, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function WalletPage() {
  usePageMeta(
    'Player Wallet · Coming Soon | Rahul Esports',
    'The automated in-app coin wallet is coming soon. All current match registrations and prize payouts are processed directly via UPI and WhatsApp.'
  );

  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Hero Coming Soon Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#24171e] border border-brand-orange/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-orange/15 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#1b1017] border-2 border-brand-orange/50 text-brand-orange mx-auto flex items-center justify-center shadow-glow-orange">
            <Coins className="w-10 h-10" />
          </div>
          <span className="inline-block mt-4 px-3.5 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/40 text-xs font-black uppercase tracking-wider">
            Future Project · Coming Soon
          </span>
        </div>

        <div className="space-y-3 max-w-lg mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
            In-App Coin Wallet
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The automated coin banking system is currently in development for a future update. For all active tournaments, players register directly using UPI and receive prize payouts on WhatsApp!
          </p>
        </div>

        {/* Active Cash & WhatsApp Flow Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-4 text-left">
          <div className="p-5 rounded-2xl bg-[#1b1017] border border-[#49303a] space-y-2">
            <div className="flex items-center gap-2 text-brand-amber font-display font-bold text-sm uppercase">
              <Trophy className="w-4 h-4 text-brand-amber" />
              <span>Direct UPI Entry</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register your squad (₹29) or solo entry (₹14) directly with zero wallet balance required.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#1b1017] border border-[#49303a] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-display font-bold text-sm uppercase">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Prize Payouts</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Match winners receive 100% of their cash prize directly via UPI transfer coordinated on Admin WhatsApp within 24 hours.
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/tournaments"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-extrabold uppercase tracking-wider text-white text-xs sm:text-sm shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Browse Active Tournaments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="https://wa.me/918114603994"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-3.5 rounded-xl bg-[#1b1017] hover:bg-[#301e27] border border-[#49303a] font-display font-bold uppercase tracking-wider text-slate-200 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Contact Admin WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Account Info (if signed in) */}
      {user && (
        <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Account</span>
              <strong className="text-white text-sm">{user.name}</strong>
              <span className="text-slate-400 ml-2">({user.email})</span>
            </div>
          </div>
          {user.mobileNumber && (
            <span className="text-slate-400">WhatsApp: <strong className="text-white">{user.mobileNumber}</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
