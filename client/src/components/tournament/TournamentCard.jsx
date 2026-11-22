import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin } from 'lucide-react';
import { site } from '../../config/site.js';
import { tournamentAvailability } from '../../utils/tournament.js';
export default function TournamentCard({ tournament: t }) {
 const slots = tournamentAvailability(t);
 const date = new Date(t.matchDate);
 const dateLabel = Number.isNaN(date.getTime()) ? 'Schedule pending' : date.toLocaleString(site.locale, { timeZone: site.timeZone, day:'numeric', month:'short', hour:'numeric', minute:'2-digit', timeZoneName:'short' });
 return <article className="tournament-card"><Link to={`/tournaments/${t.slug}`} className="card-art" aria-label={`View ${t.title}`}><img src={t.bannerUrl || site.tournamentImage} alt="" loading="lazy"/><span className={`match-status ${slots.canRegister ? 'open' : ''}`}>{(t.status || 'unavailable').replaceAll('_',' ')}</span><span className="match-format"><Users size={14}/>{t.format}</span></Link><div className="card-content"><p className="card-organizer">{site.name}</p><h3><Link to={`/tournaments/${t.slug}`}>{t.title}</Link></h3><div className="card-meta"><span><CalendarDays size={15}/>{dateLabel}</span><span><MapPin size={15}/>{t.map || 'Map pending'}</span></div><div className="card-metrics"><div><small>Prize pool</small><strong className="prize-value">₹{Number(t.prizeConfig?.totalPool ?? 0).toLocaleString(site.locale)}</strong></div><div><small>Entry / {t.format === 'squad' ? 'squad' : 'player'}</small><strong>{t.entryFee === 0 ? 'Free' : `₹${t.entryFee ?? '—'}`}</strong></div></div><div className="slot-label"><span>{slots.registered} / {slots.capacity} slots filled</span><span>{slots.remaining} available</span></div><progress value={slots.registered} max={slots.capacity || 1} aria-label="Filled tournament slots"/><Link className={`arena-button ${slots.canRegister ? '' : 'secondary'}`} to={slots.canRegister ? `/join/${t.format}/${t._id}` : `/tournaments/${t.slug}`}>{slots.canRegister ? 'Join tournament' : 'View match details'}</Link></div></article>;
}
