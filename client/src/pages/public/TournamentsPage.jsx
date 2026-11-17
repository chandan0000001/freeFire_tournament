import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import { Trophy, Search, Filter } from 'lucide-react';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formatFilter, setFormatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formatFilter) params.append('format', formatFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await api.get(`/tournaments?${params.toString()}`);
      if (res.success) {
        setTournaments(res.tournaments || []);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [formatFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTournaments();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4" />
          <span>Competition Hub</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
          Free Fire Tournaments
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Browse upcoming custom rooms, check slot availability, and secure your spot.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#121722] border border-[#1F293D] flex flex-col md:flex-row items-center justify-between gap-4 sticky top-24 z-30 shadow-xl backdrop-blur-md bg-[#121722]/95">
        
        {/* Format & Status Toggle Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Format:
          </span>
          {['', 'squad', 'solo'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormatFilter(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                formatFilter === fmt
                  ? 'bg-brand-orange text-white shadow-glow-orange'
                  : 'bg-[#161B26] text-slate-400 hover:text-white border border-[#1F293D]'
              }`}
            >
              {fmt === '' ? 'All Formats' : fmt}
            </button>
          ))}

          <span className="text-xs text-slate-400 font-bold uppercase ml-2 mr-1">Status:</span>
          {[
            { label: 'All', val: '' },
            { label: 'Open', val: 'registration_open' },
            { label: 'Full', val: 'full' },
            { label: 'Room Ready', val: 'room_ready' },
            { label: 'Completed', val: 'completed' },
          ].map((st) => (
            <button
              key={st.val}
              onClick={() => setStatusFilter(st.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                statusFilter === st.val
                  ? 'bg-brand-amber text-slate-950 font-extrabold'
                  : 'bg-[#161B26] text-slate-400 hover:text-white border border-[#1F293D]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search tournament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-xl bg-[#121722] border border-[#1F293D] animate-pulse"></div>
          ))}
        </div>
      ) : tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {tournaments.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#121722] rounded-xl border border-[#1F293D] p-8">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Tournaments Match Your Filter</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Try clearing filters or search terms.</p>
          <button
            onClick={() => {
              setFormatFilter('');
              setStatusFilter('');
              setSearch('');
            }}
            className="px-4 py-2 rounded-lg bg-brand-orange text-white text-xs font-bold uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}
