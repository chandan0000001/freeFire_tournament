import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Flame, Calendar, MapPin, Trophy, ShieldCheck } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/results');
        if (res.success) {
          setResults(res.results || []);
        }
      } catch (err) {
        console.error('Failed to load published results', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4 fill-brand-orange" />
          <span>Verified Match Archives</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
          Official Match Results
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Observer-recorded and admin-verified Free Fire match scorecards.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-[#121722] border border-[#1F293D] animate-pulse"></div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-8">
          {results.map((r) => (
            <div key={r.id} className="rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden shadow-xl">
              
              {/* Match Header Bar */}
              <div className="p-5 bg-[#0B0E14] border-b border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest">
                    Match #{r.match?.matchNumber || 1} • {r.tournament?.format?.toUpperCase()}
                  </span>
                  <h3 className="font-display text-xl font-bold uppercase text-white mt-0.5">
                    {r.tournament?.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(r.tournament?.matchDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                      Map: {r.tournament?.map || 'Bermuda'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded bg-emerald-950/80 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 uppercase">
                    <ShieldCheck className="w-4 h-4" /> Official Verified
                  </span>
                </div>
              </div>

              {/* Match Scorecard Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#161B26] text-[10px] uppercase font-bold text-slate-400 border-b border-[#1F293D]">
                    <tr>
                      <th className="py-3 px-6">Placement</th>
                      <th className="py-3 px-6">Participant / Team</th>
                      <th className="py-3 px-6 text-center">Kills</th>
                      <th className="py-3 px-6 text-center">Booyah</th>
                      <th className="py-3 px-6 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F293D]">
                    {r.entries.map((entry, idx) => (
                      <tr
                        key={idx}
                        className={entry.placement === 1 ? 'bg-amber-500/5' : 'hover:bg-[#161B26]/50'}
                      >
                        <td className="py-3 px-6 font-display font-bold">
                          {entry.placement === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-brand-amber text-slate-950 text-xs font-black uppercase">
                              <Trophy className="w-3 h-3" /> #1 Booyah
                            </span>
                          ) : (
                            <span className="text-slate-400 pl-2">#{entry.placement}</span>
                          )}
                        </td>
                        <td className="py-3 px-6 font-display font-bold text-white">
                          {entry.participantName}
                        </td>
                        <td className="py-3 px-6 text-center text-xs text-slate-300 font-mono">
                          {entry.kills}
                        </td>
                        <td className="py-3 px-6 text-center text-xs">
                          {entry.isBooyah ? (
                            <span className="text-emerald-400 font-bold">YES (+12)</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right font-display font-extrabold text-brand-orange text-base">
                          {entry.calculatedPoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#121722] rounded-2xl border border-[#1F293D] p-8">
          <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Match Results Published Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Once match observers submit scores and administrators verify them, official scorecards will be published here.
          </p>
        </div>
      )}

    </div>
  );
}
