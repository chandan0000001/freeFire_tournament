import ResponsiveImage from '../../components/common/ResponsiveImage.jsx';
import useLiveRefresh from '../../hooks/useLiveRefresh.js';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Trophy, Crosshair, Users, ShieldCheck, CalendarDays } from 'lucide-react';
import api from '../../services/api.js';
import { site } from '../../config/site.js';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
export default function HomePage() {
 const [tournaments,setTournaments] = useState([]);
 const [state,setState] = useState('loading');
 const [reload,setReload] = useState(0);
 const [format,setFormat] = useState('');
 usePageMeta('Free Fire tournaments', `Join ${site.name}, ${site.region}’s Free Fire tournament community.`);
 useEffect(() => {
  let active = true;
  setState('loading');
  api.get('/tournaments?status=registration_open,upcoming,live,room_ready')
    .then(res => {
      if (active) {
        if (!res.success) throw new Error();
        const statusRank = { registration_open: 1, upcoming: 2, live: 3, room_ready: 4, full: 5 };
        const sorted = [...(res.tournaments || [])].sort((a, b) => {
          const diff = (statusRank[a.status] || 99) - (statusRank[b.status] || 99);
          if (diff !== 0) return diff;
          return new Date(a.matchDate || 0) - new Date(b.matchDate || 0);
        });
        setTournaments(sorted);
        setState('ready');
      }
    })
    .catch(() => { if (active) setState('error'); });
  return () => { active = false; };
}, [reload]);
 useLiveRefresh(() => setReload(value => value + 1));
 const visible = tournaments.filter(t => !format || t.format === format);
 return <div className="arena-container home-page">
  <section className="arena-hero"><ResponsiveImage priority src={site.heroImage} alt="Odisha squad champions at a coastal battle arena" className="hero-image" fetchPriority="high"/><div className="hero-shade"/><div className="hero-content"><span className="eyebrow hero-eyebrow"><MapPin size={15}/>ROOTED IN {site.region.toUpperCase()} <span lang="or">{site.regionNative}</span></span><h1>{site.region.toUpperCase()} PLAYS.<br/><em>LEGENDS RISE.</em></h1><p>From your hometown to the final circle. Bring your squad, represent your roots, and battle for the Booyah.</p><div className="hero-actions"><Link className="arena-button" to="/tournaments"><Crosshair size={18}/>Find a tournament</Link><Link className="arena-button secondary" to="/status">Track my entry</Link></div><span className="hero-caption">FREE FIRE · SOLO & SQUAD · COMMUNITY TOURNAMENTS</span></div><div className="hero-side-label"><span lang="or">{site.regionNative}</span><span>THE SPIRIT OF THE EAST</span></div></section>
  <div className="arena-highlights"><div><Crosshair/><span><strong>Solo & squad</strong><small>Your game. Your format.</small></span></div><div><CalendarDays/><span><strong>Match schedules</strong><small>Times shown in India time</small></span></div><div><ShieldCheck/><span><strong>Fair play first</strong><small>Read the rules before joining</small></span></div><div><Trophy/><span><strong>Track your progress</strong><small>Published results & standings</small></span></div></div>
  <section className="home-section"><div className="section-heading"><div><span className="eyebrow">THE BATTLEGROUND</span><h2>Find your next match</h2><p>Real tournaments. Clear entry details. One place to compete.</p></div><Link to="/tournaments" className="text-link">View all tournaments</Link></div><div className="format-tabs" aria-label="Tournament format">{[['','All matches'],['squad','Squad'],['solo','Solo']].map(([value,label]) => <button key={value} aria-pressed={format === value} className={format === value ? 'active' : ''} onClick={() => setFormat(value)}>{label}</button>)}</div>
  {state === 'loading' ? <div className="tournament-grid" aria-label="Loading tournaments">{[0,1,2].map(i => <div key={i} className="card-skeleton animate-pulse"/>)}</div> : state === 'error' ? <div className="arena-empty" role="alert"><h3>Unable to load matches</h3><p>Please try again to get the latest tournament information.</p><button className="arena-button secondary" onClick={() => setReload(reload + 1)}>Try again</button></div> : visible.length ? <div className="tournament-grid">{visible.slice(0,6).map(t => <TournamentCard key={t._id} tournament={t}/>)}</div> : <div className="arena-empty"><Trophy/><h3>The next battle is on its way</h3><p>No scheduled matches for this format yet. Check back for organizer updates.</p></div>}</section>
  <section className="home-section"><div className="section-heading"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>From lobby to leaderboard</h2></div><Link to="/rules" className="text-link">Read tournament rules</Link></div><div className="steps-grid">{[[Crosshair,'Pick your battle','Compare the format, schedule, entry fee and published prize details.'],[Users,'Secure your place','Submit your player details and follow the tournament payment instructions.'],[Trophy,'Play. Prove. Repeat.','Track your registration for room details, then check published results.']].map(([Icon,title,description]) => <article key={title}><Icon/><h3>{title}</h3><p>{description}</p></article>)}</div></section>
  {site.organizerName && site.organizerImage && <section className="organizer-section home-section"><div className="organizer-portrait"><img src={site.organizerImage} alt={site.organizerName} width="687" height="1031" loading="lazy"/><span className="portrait-caption">THE PEOPLE BEHIND THE PLAY</span></div><div className="organizer-story"><span className="eyebrow">BUILT FOR OUR COMMUNITY</span><h2>One community.<br/><em>A shared ambition.</em></h2><p>Good competition begins with people who care about the game. This arena brings our local Free Fire community together, with a clear path from registration to results.</p><div className="organizer-signature"><strong>{site.organizerName}</strong><span>{site.organizerRole} · {site.region}</span></div><Link className="arena-button secondary" to="/contact">Connect with the organizer</Link></div><span className="organizer-watermark" lang="or" aria-hidden="true">{site.regionNative}</span></section>}
  <section className="community-panel"><div><span className="eyebrow">ROOTED IN {site.region}</span><h2>Local community.<br/>Competitive spirit.</h2><p>Bring your friends, find your team and stay connected for tournament updates.</p></div>{site.communityUrl ? <a className="arena-button" href={site.communityUrl} target="_blank" rel="noreferrer">Join the community</a> : <Link className="arena-button" to="/tournaments">Explore tournaments</Link>}</section>
 </div>;
}
