import ResponsiveImage from '../common/ResponsiveImage.jsx';
import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin, ArrowUpRight } from 'lucide-react';
import { site, tournamentArtwork } from '../../config/site.js';
import { tournamentAvailability } from '../../utils/tournament.js';

export default function TournamentCard({ tournament: t }) {
  const slots = tournamentAvailability(t);
  const date = new Date(t.matchDate);
  const dateLabel = Number.isNaN(date.getTime())
    ? 'Schedule pending'
    : date.toLocaleDateString(site.locale, {
        timeZone: site.timeZone,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
  const recipientLabel = t.format === 'squad' ? 'Team Leader' : 'Player';
  const morning = t.matchSessions?.morning || { totalMatches: 5, completedMatches: 0 };
  const afternoon = t.matchSessions?.afternoon || { totalMatches: 4, completedMatches: 0 };
  const evening = t.matchSessions?.evening || { totalMatches: 4, completedMatches: 0 };

  return (
    <article className="tournament-card">
      <Link to={`/tournaments/${t.slug}`} className="card-art" aria-label={`View ${t.title}`}>
        <ResponsiveImage src={tournamentArtwork(t)} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px" />
        <span className={`match-status ${slots.canRegister ? 'open' : ''}`}>
          {{ registration_open: slots.canRegister ? 'Open' : 'Closed', upcoming: 'Soon', room_ready: 'Room ready', registration_closed: 'Closed', completed: 'Finished', cancelled: 'Cancelled', full: 'Full', live: 'Live' }[t.status] || 'Details'}
        </span>
        <span className="match-format">
          <Users size={14} />
          {t.format}
        </span>
      </Link>

      <div className="card-content">

        <h3>
          <Link to={`/tournaments/${t.slug}`}>{t.title}</Link>
        </h3>

        <div className="card-meta">
          <span>
            <CalendarDays size={15} />
            {dateLabel} · Timing sent to {recipientLabel}
          </span>
          <span>
            <MapPin size={15} />
            {t.map || 'Map pending'}
          </span>
        </div>

        {/* Match Sessions Progress (Morning 5, Afternoon 4, Evening 4) */}
        <div className="card-sessions grid grid-cols-3 gap-1.5 p-2 rounded-xl border text-center">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Morning</span>
            <span className="text-[11px] font-mono font-bold text-amber-300">
              {morning.completedMatches}/{morning.totalMatches} done
            </span>
          </div>
          <div className="flex flex-col border-x border-[#39242d]">
            <span className="text-[10px] uppercase font-bold text-slate-400">Afternoon</span>
            <span className="text-[11px] font-mono font-bold text-brand-orange">
              {afternoon.completedMatches}/{afternoon.totalMatches} done
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Evening</span>
            <span className="text-[11px] font-mono font-bold text-emerald-400">
              {evening.completedMatches}/{evening.totalMatches} done
            </span>
          </div>
        </div>

        <div className="card-metrics">
          <div>
            <small>Prize pool</small>
            <strong className="prize-value">₹{Number(t.prizeConfig?.totalPool ?? 0).toLocaleString(site.locale)}</strong>
          </div>
          <div>
            <small>Entry ({t.format === 'squad' ? 'Squad' : 'Player'})</small>
            <strong className="text-amber-300 font-bold">
              {t.entryFee === 0 ? 'Free' : `₹${t.entryFee}`}
            </strong>
          </div>
        </div>

        <div className="slot-label">
          <span>{slots.registered} / {slots.capacity} joined</span>
          <span>{slots.remaining} spots left</span>
        </div>

        <progress value={slots.registered} max={slots.capacity || 1} aria-label="Filled tournament slots" />

        <Link
          className={`arena-button ${slots.canRegister ? '' : 'secondary'}`}
          to={slots.canRegister ? `/join/${t.format}/${t._id}` : `/tournaments/${t.slug}`}
        >
          {slots.canRegister ? (t.entryFee === 0 ? 'Join free' : 'Join match') : 'View details'}<ArrowUpRight size={17}/>
        </Link>
      </div>
    </article>
  );
}
