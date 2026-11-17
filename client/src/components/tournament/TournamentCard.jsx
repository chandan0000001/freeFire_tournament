import React from 'react';
import { Link } from 'react-router-dom';
import { Users, User, Calendar, Trophy, MapPin, ShieldCheck, ArrowUpRight, Flame } from 'lucide-react';

function TournamentCard({ tournament }) {
  const isMarkedFull = tournament.status === 'full' || tournament.registeredSlots >= tournament.maxSlots;
  const isRegistrationOpen = tournament.status === 'registration_open' && !isMarkedFull;

  // When tournament is marked full, or in live/completed/room_ready state, the numeric slots displayed reflect full capacity
  const isFinishedOrLocked = ['full', 'room_ready', 'live', 'completed'].includes(tournament.status);
  const displayRegisteredSlots = isFinishedOrLocked ? tournament.maxSlots : (tournament.registeredSlots || 0);
  const remaining = isFinishedOrLocked ? 0 : Math.max(0, tournament.maxSlots - (tournament.registeredSlots || 0));
  const fillPercentage = isFinishedOrLocked
    ? 100
    : Math.min(100, Math.round(((tournament.registeredSlots || 0) / tournament.maxSlots) * 100));

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
        return 'Finished';
      case 'registration_closed':
      default:
        return 'Closed';
    }
  };

  const getSlotStatusClass = () => {
    if (isMarkedFull) {
      return 'text-amber-400 font-bold';
    }
    switch (tournament.status) {
      case 'registration_open':
        return remaining <= 3 && remaining > 0
          ? 'text-rose-400 font-bold animate-pulse'
          : 'text-emerald-400 font-semibold';
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 text-[11px] font-extrabold border border-emerald-500/50 uppercase tracking-wider backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400 -ml-2.5 mr-0.5"></span>
            Registration Open
          </span>
        );
      case 'full':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-950/90 text-amber-300 text-[11px] font-extrabold border border-amber-500/50 uppercase tracking-wider backdrop-blur-md shadow-lg">
            Slots Full
          </span>
        );
      case 'room_ready':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-950/90 text-indigo-200 text-[11px] font-extrabold border border-indigo-500/50 uppercase tracking-wider backdrop-blur-md shadow-lg">
            Room Ready
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/90 text-rose-300 text-[11px] font-extrabold border border-rose-500/50 uppercase tracking-wider animate-pulse backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Live Match
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900/90 text-slate-300 text-[11px] font-extrabold border border-slate-700 uppercase tracking-wider backdrop-blur-md shadow-lg">
            Finished
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-950/90 text-blue-300 text-[11px] font-extrabold border border-blue-500/50 uppercase tracking-wider backdrop-blur-md shadow-lg">
            Upcoming
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900/90 text-slate-400 text-[11px] font-extrabold border border-slate-700 uppercase tracking-wider backdrop-blur-md">
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
        return 'Finished';
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
    <div className="bg-[#101522] rounded-2xl border border-[#1E2638] overflow-hidden flex flex-col hover:border-brand-orange/60 hover:shadow-[0_10px_30px_rgba(255,85,0,0.15)] transition-all duration-300 group">
      
      {/* 16:9 Esports Banner Container (GBArena Style) */}
      <div className="relative w-full aspect-[16/9] bg-[#0A0D14] overflow-hidden">
        <img
          src={tournament.bannerUrl || '/images/ff-banner-squad.webp'}
          alt={tournament.title || 'Free Fire Tournament Banner'}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
        />
        
        {/* High-Contrast Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101522] via-[#101522]/30 to-black/60 pointer-events-none"></div>

        {/* Top Header Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {getStatusBadge()}
          <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider border border-white/15 flex items-center gap-1.5 shadow-md">
            {tournament.format === 'squad' ? (
              <>
                <Users className="w-3.5 h-3.5 text-brand-orange" />
                <span>Squad (4v4)</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-brand-amber" />
                <span>Solo</span>
              </>
            )}
          </span>
        </div>

        {/* Bottom Banner Schedule & Map Pills */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-slate-200 text-[11px] font-semibold">
            <Calendar className="w-3.5 h-3.5 text-brand-orange" />
            <span>{matchDateFormatted} IST</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 text-[11px] font-medium">
            <MapPin className="w-3 h-3 text-brand-amber" />
            <span>{tournament.map || 'Bermuda'}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Organizer / Host Pill (GBArena Style) */}
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1A2234]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full p-0.5 bg-brand-orange/20 border border-brand-orange/40 shrink-0">
                <img
                  src="/images/rit-logo.webp"
                  alt="Roland Institute of Technology"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300 truncate">
                RIT Esports Arena
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Verified
            </span>
          </div>

          {/* Tournament Title */}
          <h3 className="font-display text-lg sm:text-xl font-bold text-white group-hover:text-brand-orange transition-colors line-clamp-1">
            {tournament.title}
          </h3>

          {/* Key Metrics Grid: Entry Fee & Prize Pool */}
          <div className="grid grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-[#090C12] border border-[#1A2234]">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Entry Fee</p>
              <p className="text-base font-display font-extrabold text-white mt-0.5">
                ₹{tournament.entryFee}{' '}
                <span className="text-[10px] text-slate-400 font-normal">
                  {tournament.format === 'squad' ? '/ squad' : '/ player'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Prize Pool</p>
              <p className="text-base font-display font-extrabold text-brand-amber mt-0.5 flex items-center gap-1">
                <Trophy className="w-4 h-4 text-brand-amber shrink-0" />
                <span>₹{tournament.prizeConfig?.totalPool || 0}</span>
              </p>
            </div>
          </div>

          {/* Slot Progress Bar */}
          <div className="mt-3.5">
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-400">
                Slots:{' '}
                <strong className="text-white">
                  {displayRegisteredSlots} / {tournament.maxSlots}
                </strong>{' '}
                <span className="text-[11px] text-slate-500 font-normal">
                  ({tournament.format === 'squad' ? 'Teams' : 'Players'})
                </span>
              </span>
              <span className={getSlotStatusClass()}>{getSlotStatusText()}</span>
            </div>
            <div className="w-full h-2 bg-[#090C12] rounded-full overflow-hidden border border-[#1A2234]">
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

        {/* Action Button Row */}
        <div className="pt-3 border-t border-[#1A2234] flex items-center gap-2.5">
          <Link
            to={`/tournaments/${tournament.slug}`}
            className="flex-1 text-center py-2.5 px-3 rounded-xl bg-[#141A26] hover:bg-[#1C2536] text-slate-200 text-xs font-bold uppercase tracking-wider border border-[#243048] transition-colors"
          >
            Details & Rules
          </Link>

          {isRegistrationOpen ? (
            <Link
              to={tournament.format === 'squad' ? `/join/squad/${tournament._id}` : `/join/solo/${tournament._id}`}
              className="flex-1 text-center py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-orange to-amber-500 hover:brightness-110 text-white text-xs font-display font-bold uppercase tracking-wider shadow-[0_4px_16px_rgba(255,85,0,0.3)] transition-all flex items-center justify-center gap-1 group/btn"
            >
              <span>Register Now</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-bold uppercase tracking-wider cursor-not-allowed border border-slate-700/50"
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
