import React from 'react';
import usePageMeta from '../../hooks/usePageMeta.js';
import { BookOpen, ShieldCheck, Flame, AlertTriangle, Trophy, CheckCircle } from 'lucide-react';

export default function RulesPage() {
  usePageMeta('Rules & Fair Play Guidelines | Rahul Esports Arena', 'Official competitive Free Fire rules, device eligibility, mobile-only policy, and scoring system for players.');
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Fair Play Code</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
          Rules & Regulations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Rahul Esports Arena competitive rules for weekly Free Fire custom rooms.
        </p>
      </div>

      {/* Fair Play Mascot & Pledge Card */}
      <div className="p-6 rounded-2xl bg-[#121722] border border-brand-orange/40 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-brand-orange/50 shadow-glow-orange shrink-0">
          <img src="/images/ff-character-4.webp" alt="Fair Play Guardian" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange text-[10px] font-bold uppercase tracking-wider border border-brand-orange/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Fair Play Pledge
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-white">
            Pure Skill. Zero Exploits.
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Every match is hosted in private custom rooms and monitored in real-time by official referees. Play with integrity, respect fellow gamers, and claim your Booyah on merit.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        
        {/* Section 1: Eligibility */}
        <div id="eligibility" className="p-6 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-3">
          <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> 1. Player Eligibility
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>All players in a Squad or Solo tournament must register with their authentic Free Fire IGN and UID.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Admins reserve the right to verify player Free Fire profiles before releasing prize disbursements.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Impersonation, account-sharing, or teaming during solo matches will result in permanent player blacklisting.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Device & Anti-Cheat */}
        <div id="anti-cheat" className="p-6 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-3">
          <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" /> 2. Device & Anti-Cheat Policy
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Mobile Only:</strong> Only official mobile devices (Android / iOS) are permitted. PC emulators (BlueStacks, LDPlayer, Nox, etc.) are strictly prohibited.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Zero Tolerance for Hacks:</strong> Use of mod menus, aimbots, speed hacks, texture packs, or third-party config files will trigger an immediate ban and forfeiture of all entry fees and prizes.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Referee Recording:</strong> All matches have assigned match referees in custom rooms to record gameplay, track kill counts, and verify final placements.</span>
            </li>
          </ul>
        </div>

        {/* Section 3: Kill + Booyah Scoring */}
        <div id="scoring" className="p-6 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-3">
          <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-orange" /> 3. Scoring System
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Total match points are calculated using pure skill metrics:
          </p>
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-brand-orange/30 font-mono text-xs text-brand-amber">
            Total Points = (Total Kills × Kill Point Value) + Booyah Bonus Points
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
            <li>• Standard Kill Value: <strong>1 Point per verified Kill</strong></li>
            <li>• Standard Booyah Bonus: <strong>12 Points for 1st Place</strong></li>
            <li>• Multi-Round Tie Breakers: <strong>1. Most Booyahs &gt; 2. Most Kills &gt; 3. Best Placement</strong></li>
          </ul>
        </div>

        {/* Section 4: Cash Prizes & Payouts */}
        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-3">
          <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-amber" /> 4. Cash Prize Payouts
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>• Winners receive cash prizes sent via UPI directly by the tournament admin within 24 hours of result approval.</li>
            <li>• The platform records payout status and transaction details internally for complete auditability.</li>
            <li>• This is not a gambling or wagering platform; fees cover tournament organization, custom room creation, and guaranteed announced prizes.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
