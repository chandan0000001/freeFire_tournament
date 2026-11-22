import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { Trophy, Award, Calendar, Users, ShieldCheck } from 'lucide-react';

export default function WinnersPage() {
  usePageMeta('Hall of Fame — Champions | RIT Esports Arena', 'Celebrating Roland Institute of Technology Free Fire champions, MVP gunslingers, and verified cash prize winners.');
  const [winnerTournaments, setWinnerTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);
    const fetchWinners = async () => {
      try {
        const res = await api.get('/winners');
        if (active && res.success) {
          setWinnerTournaments(res.winners || []);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchWinners();
    return () => { active = false; };
  }, [retry]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {error && <div className="arena-empty" role="alert"><h3>Could not load the latest data</h3><p>{error}</p><button className="arena-button secondary" onClick={() => setRetry(retry + 1)}>Try again</button></div>}
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-amber/10 text-brand-amber border border-brand-amber/30 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-4 h-4" />
          <span>Hall of Fame</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase text-white tracking-wide">
          Tournament Champions
        </h1>
        <p className="text-xs text-slate-400">
          Celebrating the college's elite Free Fire squads and solo gunslingers.
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-[#24171e] border border-[#49303a] animate-pulse"></div>
          ))}
        </div>
      ) : winnerTournaments.length > 0 ? (
        <div className="space-y-12">
          {winnerTournaments.map((item, idx) => (
            <div key={idx} className="rounded-2xl bg-[#24171e] border border-[#49303a] p-6 sm:p-8 space-y-6 shadow-xl">
              
              {/* Tournament Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#49303a] pb-4 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest">
                    {item.tournament?.format?.toUpperCase()} TOURNAMENT
                  </span>
                  <h3 className="font-display text-2xl font-bold uppercase text-white">
                    {item.tournament?.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(item.tournament?.matchDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Podium Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {item.podium.map((podium) => (
                  <div
                    key={podium.rank}
                    className={`p-6 rounded-xl border text-center space-y-3 relative overflow-hidden ${
                      podium.rank === 1
                        ? 'bg-gradient-to-b from-amber-500/10 to-[#160e13] border-amber-500/50 shadow-glow-orange'
                        : podium.rank === 2
                        ? 'bg-[#160e13] border-slate-600'
                        : 'bg-[#160e13] border-amber-800/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center font-display font-extrabold text-lg">
                      {podium.rank === 1 && <Trophy className="w-8 h-8 text-amber-400" />}
                      {podium.rank === 2 && <Award className="w-8 h-8 text-slate-300" />}
                      {podium.rank === 3 && <Award className="w-8 h-8 text-amber-700" />}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {podium.title}
                      </span>
                      <h4 className="font-display text-xl font-bold uppercase text-white mt-1">
                        {podium.winnerName}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-[#49303a]">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Cash Prize</p>
                      <p className="font-display text-2xl font-extrabold text-emerald-400">
                        ₹{podium.amount}
                      </p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold text-emerald-500/80">
                        {podium.payoutStatus === 'paid' ? 'Paid via UPI' : 'Pending Verification'}
                      </span>
                    </div>

                    {/* Consented Player Rosters */}
                    {podium.players && podium.players.length > 0 && (
                      <div className="pt-2 text-left border-t border-[#49303a] space-y-1">
                        <p className="text-[9px] uppercase font-bold text-slate-500">Roster:</p>
                        <div className="flex flex-wrap gap-1">
                          {podium.players.map((pl, pIdx) => (
                            <span key={pIdx} className="text-[10px] px-2 py-0.5 rounded bg-[#301e27] text-slate-300">
                              {pl.inGameName} {pl.freeFireUid ? `(${pl.freeFireUid})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center py-12 bg-[#24171e] rounded-2xl border border-[#49303a] p-8 space-y-3">
            <Trophy className="w-12 h-12 text-brand-amber mx-auto" />
            <h3 className="font-display text-2xl font-bold uppercase text-white">Hall of Fame Awaits Week 01 Champions</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Week 01 Squad & Solo Battles are underway. The top 3 finishers and MVP gunslingers will be immortalized here with verified UPI cash payout receipts.
            </p>
          </div>

          {/* RIT Champions Spotlight Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-[#24171e] border border-amber-500/40 p-6 text-center space-y-4 overflow-hidden relative group hover:border-amber-400 transition-all">
              <div className="w-28 h-32 rounded-xl mx-auto overflow-hidden border border-white/10 shadow-lg">
                <img src="/images/ff-character-1.webp" alt="Solo Champion" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Solo Battle Royale</span>
                <h4 className="font-display text-xl font-bold uppercase text-white mt-1">Solo Booyah Champion</h4>
                <p className="text-xs text-slate-400 mt-1">₹500 Weekly Prize Pool</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#24171e] border border-brand-orange/40 p-6 text-center space-y-4 overflow-hidden relative group hover:border-brand-orange transition-all">
              <div className="w-28 h-32 rounded-xl mx-auto overflow-hidden border border-white/10 shadow-lg">
                <img src="/images/ff-banner.webp" alt="Squad Champions" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-orange block tracking-wider">Squad 4v4 Showdown</span>
                <h4 className="font-display text-xl font-bold uppercase text-white mt-1">Squad Booyah Champions</h4>
                <p className="text-xs text-slate-400 mt-1">₹1100 Weekly Prize Pool</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#24171e] border border-cyan-500/40 p-6 text-center space-y-4 overflow-hidden relative group hover:border-cyan-400 transition-all">
              <div className="w-28 h-32 rounded-xl mx-auto overflow-hidden border border-white/10 shadow-lg">
                <img src="/images/ff-character-2.webp" alt="MVP Gunslinger" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">Tournament MVP</span>
                <h4 className="font-display text-xl font-bold uppercase text-white mt-1">Top Fragger Award</h4>
                <p className="text-xs text-slate-400 mt-1">₹100 Special Cash Bonus</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
