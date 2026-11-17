import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Award, Trophy, Flame, Users, User, Shield } from 'lucide-react';

export default function LeaderboardPage() {
  const [format, setFormat] = useState('squad'); // 'squad' or 'individual'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/leaderboards?format=${format}`);
        if (res.success) {
          setLeaderboard(res.leaderboard || []);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [format]);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400 flex items-center justify-center font-display font-black text-sm shadow-glow-orange">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300 flex items-center justify-center font-display font-black text-sm">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-600 flex items-center justify-center font-display font-black text-sm">
          3
        </span>
      );
    }
    return <span className="font-display font-bold text-slate-400 pl-2">#{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Official Rankings</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
            College Leaderboards
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Computed from all verified Free Fire tournament matches. Point formula: (Kills × 1) + Booyah Bonus (12).
          </p>
        </div>

        {/* Squad vs Individual Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#121722] border border-[#1F293D] self-start sm:self-auto">
          <button
            onClick={() => setFormat('squad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all ${
              format === 'squad'
                ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Squads
          </button>
          <button
            onClick={() => setFormat('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all ${
              format === 'individual'
                ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Individual Players
          </button>
        </div>
      </div>

      {/* MVP Highlight Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#121722] via-[#161B26] to-[#0B0E14] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-amber-500/50 shadow-glow-orange shrink-0">
            <img src="/images/ff-character-5.webp" alt="Top Fragger" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Tournament MVP Spotlight</span>
            <h3 className="font-display text-lg font-bold uppercase text-white mt-0.5">Top Gunslingers & Booyah Champions</h3>
            <p className="text-xs text-slate-400">Weekly leaderboard winners receive direct UPI cash bonuses and Hall of Fame recognition.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
            ₹100 MVP Bonus
          </div>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0B0E14] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-[#1F293D]">
              <tr>
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">{format === 'squad' ? 'Squad Name' : 'Player IGN'}</th>
                {format === 'individual' && <th className="py-4 px-6">Squad</th>}
                <th className="py-4 px-6 text-center">Matches</th>
                <th className="py-4 px-6 text-center">Kills</th>
                <th className="py-4 px-6 text-center">Booyahs</th>
                <th className="py-4 px-6 text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 text-xs">
                    Loading standings...
                  </td>
                </tr>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((item) => (
                  <tr
                    key={item.rank}
                    className="hover:bg-[#161B26] transition-colors"
                  >
                    <td className="py-4 px-6">{getRankBadge(item.rank)}</td>
                    <td className="py-4 px-6 font-display font-bold text-base text-white">
                      {format === 'squad' ? item.squadName : item.playerName}
                    </td>
                    {format === 'individual' && (
                      <td className="py-4 px-6 text-xs text-slate-400">{item.squadName || 'Solo'}</td>
                    )}
                    <td className="py-4 px-6 text-center text-xs text-slate-300 font-mono">
                      {item.matchesPlayed}
                    </td>
                    <td className="py-4 px-6 text-center text-xs text-slate-300 font-mono font-bold">
                      {item.totalKills}
                    </td>
                    <td className="py-4 px-6 text-center text-xs text-brand-amber font-mono font-bold">
                      {item.booyahCount}
                    </td>
                    <td className="py-4 px-6 text-right font-display font-extrabold text-base text-brand-orange">
                      {item.totalPoints} pts
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500 text-xs">
                    No verified match results published yet. Join this week's tournament to climb the ranks!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
