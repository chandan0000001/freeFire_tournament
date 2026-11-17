import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Trophy, Zap, MapPin } from 'lucide-react';

function TournamentCard({ tournament }) {
  const isMarkedFull = tournament.status === 'full' || tournament.registeredSlots >= tournament.maxSlots;
  const isRegistrationOpen = tournament.status === 'registration_open' && !isMarkedFull;
  
  // When tournament is marked full, or in live/completed/room_ready state, the numeric slots displayed reflect full capacity
  const isFinishedOrLocked = ['full', 'room_ready', 'live', 'completed'].includes(tournament.status);
  const displayRegisteredSlots = isFinishedOrLocked ? tournament.maxSlots : tournament.registeredSlots;
  const remaining = isFinishedOrLocked ? 0 : Math.max(0, tournament.maxSlots - tournament.registeredSlots);
  const fillPercentage = isFinishedOrLocked
    ? 100
    : Math.min(100, Math.round((tournament.registeredSlots / tournament.maxSlots) * 100));

  const getSlotStatusText = () => {
    if (isMarkedFull) {
      return 'Slots Full';
    }
    switch (tournament.status) {
      case 'registration_open':
        return remaining <= 3 && remaining > 0
          ? `${remaining} slot${remaining === 1 ? '' : 's'} left!`
          : `${remaining} slots left`;
      case 'upcoming':
        return 'Opens Soon';
      case 'room_ready':
        return 'Room In Progress';
      case 'live':
        return 'Match Live';
      case 'completed':
        return 'Match Ended';
      case 'registration_closed':
      default:
        return 'Registration Closed';
    }
  };

  const getSlotStatusClass = () => {
    if (isMarkedFull) {
      return 'text-amber-400 font-bold';
    }
    switch (tournament.status) {
      case 'registration_open':
        return remaining <= 3 && remaining > 0 ? 'text-rose-400 font-bold animate-pulse' : 'text-emerald-400 font-semibold';
      case 'upcoming':
        return 'text-blue-400 font-medium';
      case 'room_ready':
        return 'text-indigo-400 font-medium';
      case 'live':
        return 'text-rose-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBadge = () => {
    switch (tournament.status) {
      case 'registration_open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 text-xs font-bold border border-emerald-500/50 uppercase tracking-wide shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Registration Open
          </span>
        );
      case 'full':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-950/80 text-amber-400 text-xs font-bold border border-amber-500/50 uppercase tracking-wide shadow-sm">
            Slots Full
          </span>
        );
      case 'room_ready':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-300 text-xs font-bold border border-indigo-500/50 uppercase tracking-wide shadow-sm">
            Room Ready
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/90 text-rose-300 text-xs font-bold border border-rose-500/50 uppercase tracking-wide animate-pulse shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Live Match
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 uppercase tracking-wide">
            Completed
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-950/80 text-blue-300 text-xs font-bold border border-blue-500/50 uppercase tracking-wide">
            Upcoming
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700 uppercase tracking-wide">
            {tournament.status.replace('_', ' ')}
          </span>
        );
    }
  };

  const getActionButtonLabel = () => {
    switch (tournament.status) {
      case 'full':
        return 'Slots Full';
      case 'room_ready':
        return 'Room In Progress';
      case 'live':
        return 'Match Live';
      case 'completed':
        return 'Completed';
      case 'upcoming':
        return 'Opens Soon';
      default:
        return 'Registration Closed';
    }
  };

  const matchDateFormatted = new Date(tournament.matchDate).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="bg-[#121722] rounded-xl border border-[#1F293D] overflow-hidden flex flex-col hover:border-brand-orange/60 hover:shadow-glow-orange transition-all duration-300 group">
      
      {/* Banner & Header Image */}
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
        <img
          src={tournament.bannerUrl || '/images/ff-banner.webp'}
          alt={tournament.title || 'Free Fire Tournament Banner'}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121722] via-[#121722]/40 to-transparent"></div>

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {getStatusBadge()}
          <span className="px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1.5 shadow-sm">
            <Users className="w-3.5 h-3.5 text-brand-orange" />
            {tournament.format === 'squad' ? 'Squad (4v4)' : 'Solo'}
          </span>
        </div>

        {/* Map Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-slate-300 font-medium z-10">
          <MapPin className="w-3.5 h-3.5 text-brand-amber" />
          <span>{tournament.map || 'Bermuda'}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-white group-hover:text-brand-orange transition-colors line-clamp-1">
            {tournament.title}
          </h3>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{matchDateFormatted} IST</span>
          </div>

          {/* Key Metrics: Entry Fee & Prize Pool */}
          <div className="grid grid-cols-2 gap-3 mt-4 p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Entry Fee</p>
              <p className="text-base font-display font-bold text-white">
                ₹{tournament.entryFee}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  {tournament.format === 'squad' ? '/ squad' : '/ player'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Prize Pool</p>
              <p className="text-base font-display font-bold text-brand-amber flex items-center gap-1">
                <Trophy className="w-4 h-4 text-brand-amber" />
                ₹{tournament.prizeConfig?.totalPool || 0}
              </p>
            </div>
          </div>

          {/* Slot Progress Meter */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-400">
                Slots: <strong className="text-white">{displayRegisteredSlots}</strong> / {tournament.maxSlots}
              </span>
              <span className={getSlotStatusClass()}>
                {getSlotStatusText()}
              </span>
            </div>
            <div className="w-full h-2 bg-[#0B0E14] rounded-full overflow-hidden border border-[#1F293D]">
              <div
                className={`h-full transition-all duration-500 ${
                  fillPercentage >= 90
                    ? 'bg-rose-500'
                    : fillPercentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-brand-orange to-brand-amber'
                }`}
                style={{ width: `${fillPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-[#1F293D] flex items-center gap-2">
          <Link
            to={`/tournaments/${tournament.slug}`}
            className="flex-1 text-center py-2.5 px-3 rounded-lg bg-[#161B26] hover:bg-[#1F293D] text-slate-200 text-xs font-bold uppercase tracking-wider border border-[#1F293D] transition-colors"
          >
            Details & Rules
          </Link>
          
          {isRegistrationOpen ? (
            <Link
              to={tournament.format === 'squad' ? `/join/squad/${tournament._id}` : `/join/solo/${tournament._id}`}
              className="flex-1 text-center py-2.5 px-3 rounded-lg bg-gradient-to-r from-brand-orange to-brand-amber hover:brightness-110 text-white text-xs font-display font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              Register Now
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 py-2.5 px-3 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed"
            >
              {getActionButtonLabel()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(TournamentCard);
