import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api.js';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { Trophy, Search, Users, User, Flame, Sparkles } from 'lucide-react';

export default function TournamentsPage() {
  usePageMeta(
    'Free Fire Tournaments | Rahul Esports Arena',
    'Browse weekly verified Free Fire tournaments. Check slot availability, prize pools, and register your squad or solo entry.'
  );

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formatFilter) params.append('format', formatFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/tournaments?${params.toString()}`);
      if (res.success) {
        setTournaments(res.tournaments || []);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  }, [formatFilter, statusFilter, search]);

  useEffect(() => {
    fetchTournaments();
  }, [formatFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTournaments();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#1A2234]">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Official Competitive Esports Hub</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
            Tournaments
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse upcoming Free Fire custom room battles, track live slots, and secure your place.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-3 py-1.5 rounded-lg bg-[#101522] border border-[#1A2234] font-semibold">
            {tournaments.length} {tournaments.length === 1 ? 'Tournament' : 'Tournaments'} Available
          </span>
        </div>
      </div>

      {/* GBArena Inspired Filter & Control Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#101522]/95 border border-[#1E2638] flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-20 z-30 shadow-2xl backdrop-blur-md">
        {/* Status Filter Tabs (GBArena Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-none pb-1 lg:pb-0">
          {[
            { label: 'ALL', val: '' },
            { label: 'UPCOMING', val: 'upcoming' },
            { label: 'REGISTRATION OPEN', val: 'registration_open' },
            { label: 'LIVE', val: 'live' },
            { label: 'FINISHED', val: 'completed' },
          ].map((st) => (
            <button
              key={st.val}
              type="button"
              onClick={() => setStatusFilter(st.val)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === st.val
                  ? 'bg-gradient-to-r from-brand-orange to-amber-500 text-white shadow-[0_2px_12px_rgba(255,85,0,0.35)]'
                  : 'bg-[#090C12] text-slate-400 hover:text-white border border-[#1A2234]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Secondary: Format Toggle & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Format Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#090C12] border border-[#1A2234] w-full sm:w-auto justify-center">
            {[
              { label: 'ALL', val: '', icon: null },
              { label: 'SQUAD', val: 'squad', icon: Users },
              { label: 'SOLO', val: 'solo', icon: User },
            ].map((fmt) => {
              const Icon = fmt.icon;
              return (
                <button
                  key={fmt.val}
                  type="button"
                  onClick={() => setFormatFilter(fmt.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                    formatFilter === fmt.val
                      ? 'bg-brand-orange text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#090C12] border border-[#1A2234] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-[#101522] border border-[#1A2234] animate-pulse"></div>
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {tournaments.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#101522] rounded-2xl border border-[#1A2234] p-8 max-w-xl mx-auto space-y-4">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Tournaments Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There are currently no tournaments matching your active filters. Try resetting the filters or check back soon for next week's schedule.
          </p>
          <button
            onClick={() => {
              setFormatFilter('');
              setStatusFilter('');
              setSearch('');
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-md hover:brightness-110 transition-all"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
