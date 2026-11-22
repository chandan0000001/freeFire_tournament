import ResponsiveImage from '../common/ResponsiveImage.jsx';
import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin, Coins, MessageCircle } from 'lucide-react';
import { site, tournamentArtwork } from '../../config/site.js';
import { tournamentAvailability } from '../../utils/tournament.js';

export default function TournamentCard({ tournament: t }) {
  const slots = tournamentAvailability(t);
  const date = new Date(t.matchDate);
  const dateLabel = Number.isNaN(date.getTime())
    ? 'Schedule pending'
    : date.toLocaleString(site.locale, {
        timeZone: site.timeZone,
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      });

  return (
    <article className="tournament-card">
      <Link to={`/tournaments/${t.slug}`} className="card-art" aria-label={`View ${t.title}`}>
        <ResponsiveImage src={tournamentArtwork(t)} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px" />
        <span className={`match-status ${slots.canRegister ? 'open' : ''}`}>
          {(t.status || 'unavailable').replaceAll('_', ' ')}
        </span>
        <span className="match-format">
          <Users size={14} />
          {t.format}
        </span>
      </Link>

      <div className="card-content">
        <p className="card-organizer">{site.name}</p>
        <h3>
          <Link to={`/tournaments/${t.slug}`}>{t.title}</Link>
        </h3>
        
        <div className="card-meta">
          <span>
            <CalendarDays size={15} />
            {dateLabel}
          </span>
          <span>
            <MapPin size={15} />
            {t.map || 'Map pending'}
          </span>
        </div>

        {/* Room ID and Password WhatsApp Notice */}
        <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-300">
          <MessageCircle size={14} className="text-emerald-400 shrink-0" />
          <span>Room details shared with {t.format === 'squad' ? 'Team Leader' : 'Player'} after verification</span>
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
          <span>{slots.registered} / {slots.capacity} slots filled</span>
          <span>{slots.remaining} available</span>
        </div>

        <progress value={slots.registered} max={slots.capacity || 1} aria-label="Filled tournament slots" />

        <Link
          className={`arena-button ${slots.canRegister ? '' : 'secondary'}`}
          to={slots.canRegister ? `/join/${t.format}/${t._id}` : `/tournaments/${t.slug}`}
        >
          {slots.canRegister ? (t.entryFee === 0 ? 'Register free' : `Register · ₹${t.entryFee}`) : 'View match details'}
        </Link>
      </div>
    </article>
  );
}
