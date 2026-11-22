import { useSearchParams } from 'react-router-dom';
import useLiveRefresh from '../../hooks/useLiveRefresh.js';
import { site } from '../../config/site.js';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api.js';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { Trophy, Search, Users, User } from 'lucide-react';

export default function TournamentsPage() {
  usePageMeta(
    'Friendly Free Fire matches',
    'Find community Free Fire rooms, check entry details and join solo or with your squad.'
  );

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFormat = searchParams.get('format');
  const formatFilter = ['solo', 'squad'].includes(requestedFormat) ? requestedFormat : '';
  const setFormatFilter = value => setSearchParams(current => { const next = new URLSearchParams(current); if (value) next.set('format', value); else next.delete('format'); return next; });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const fetchTournaments = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (formatFilter) params.append('format', formatFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/tournaments?${params.toString()}`);
      if (id !== requestId.current) return;
      if (!res.success) throw new Error(res.message || 'Unable to load matches');
      if (res.success) {
        const statusRank = { registration_open: 1, upcoming: 2, live: 3, room_ready: 4, full: 5, registration_closed: 6, completed: 7 };
        const sorted = [...(res.tournaments || [])].sort((a, b) => {
          const diff = (statusRank[a.status] || 99) - (statusRank[b.status] || 99);
          if (diff !== 0) return diff;
          return new Date(a.matchDate || 0) - new Date(b.matchDate || 0);
        });
        setTournaments(sorted);
      }
    } catch (err) {
      if (id === requestId.current) { setError(err.message); setTournaments([]); }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [formatFilter, statusFilter, search]);

  useLiveRefresh(fetchTournaments);

  useEffect(() => {
    const timer = setTimeout(fetchTournaments, 250);
    return () => { clearTimeout(timer); requestId.current += 1; };
  }, [fetchTournaments]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTournaments();
  };

  return (
    <div className="match-browser max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#412a34]">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>{site.region} · friendly Free Fire matches</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
            Find your next match.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pick a room. Bring your best game.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-3 py-1.5 rounded-lg bg-[#1c1b1e] border border-[#412a34] font-semibold">
            {tournaments.length} {tournaments.length === 1 ? 'match' : 'matches'}
          </span>
        </div>
      </div>

      <div className="match-toolbar">
        <div className="match-status-tabs" aria-label="Match status">
          {[['', 'All matches'], ['registration_open', 'Open'], ['upcoming', 'Upcoming'], ['live', 'Live'], ['completed', 'Finished']].map(([value, label]) =>
            <button type="button" key={value} aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)}>{label}</button>
          )}
        </div>
        <div className="match-toolbar-controls">
          <div className="match-format-toggle" aria-label="Play style">
            {[['', 'All', null], ['squad', 'Squad', Users], ['solo', 'Solo', User]].map(([value, label, Icon]) =>
              <button type="button" key={value} aria-pressed={formatFilter === value} onClick={() => setFormatFilter(value)}>{Icon && <Icon size={15}/>} {label}</button>
            )}
          </div>
          <form onSubmit={handleSearchSubmit} className="match-search">
            <Search size={18} aria-hidden="true"/>
            <input type="search" aria-label="Search tournaments" placeholder="Find a match…" value={search} onChange={e => setSearch(e.target.value)}/>
          </form>
        </div>
      </div>

      {/* Tournaments Grid */}
      {error ? <div className="arena-empty" role="alert"><h3>Unable to load tournaments</h3><p>{error}</p><button className="arena-button" onClick={fetchTournaments}>Try again</button></div> : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-[#1c1b1e] border border-[#412a34] animate-pulse"></div>
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {tournaments.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#1c1b1e] rounded-2xl border border-[#412a34] p-8 max-w-xl mx-auto space-y-4">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Tournaments Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Try another format or clear your filters.
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
