import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Crosshair, Users, User, Trophy, MapPin } from 'lucide-react';
import ResponsiveImage from '../../components/common/ResponsiveImage.jsx';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import { site } from '../../config/site.js';
import api from '../../services/api.js';
import useLiveRefresh from '../../hooks/useLiveRefresh.js';
import usePageMeta from '../../hooks/usePageMeta.js';

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [state, setState] = useState('loading');
  const [reload, setReload] = useState(0);
  const [format, setFormat] = useState('');
  usePageMeta('Play Free Fire with your community', `Friendly Free Fire custom-room matches with ${site.name}, ${site.region}.`);
  useEffect(() => {
    let active = true;
    setState('loading');
    api.get('/tournaments?status=registration_open,upcoming,live,room_ready')
      .then(result => { if (active) { if (!result.success) throw new Error(); setTournaments(result.tournaments || []); setState('ready'); } })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [reload]);
  useLiveRefresh(() => setReload(value => value + 1));
  const matches = tournaments.filter(match => !format || match.format === format);

  return <div className="arena-container home-page play-home">
    <section className="arena-hero play-hero">
      <ResponsiveImage priority src={site.heroImage} alt="Odisha Free Fire squad ready for the next match" className="hero-image" />
      <div className="hero-shade" />
      <div className="hero-content">
        <span className="eyebrow hero-eyebrow"><MapPin size={14} />{site.region} · Free Fire <span lang="or">{site.regionNative}</span></span>
        <h1>Your squad.<br />Your next<br /><em>BOOYAH.</em></h1>
        <p>Good friends. Close calls. One more match.</p>
        <div className="hero-actions"><Link to="/tournaments" className="arena-button"><Crosshair size={18} />Find a match<ArrowUpRight size={18}/></Link><Link to="/status" className="hero-quiet-link">My entries</Link></div>
        <span className="hero-caption">FRIENDLY CUSTOM ROOMS · SOLO + SQUAD</span>
      </div>
      <span className="hero-side-label" lang="or">{site.regionNative}</span>
    </section>

    <section className="mode-grid" aria-label="Choose your play style">
      {[{ format: 'squad', title: 'Squad up.', subtitle: 'Bring your crew.', image: (import.meta.env.VITE_ART_BERHAMPUR_SQUAD || '/images/berhampur-squad.webp'), Icon: Users }, { format: 'solo', title: 'Go solo.', subtitle: 'Make your own move.', image: (import.meta.env.VITE_ART_PARADIP_SOLO || '/images/paradip-solo.webp'), Icon: User }].map(({ format: mode, title, subtitle, image, Icon }) =>
        <Link key={mode} to={`/tournaments?format=${mode}`} className="mode-card">
          <ResponsiveImage src={image} alt="" sizes="(max-width: 600px) 100vw, 640px" />
          <div><span><Icon size={18}/>{mode}</span><h2>{title}</h2><p>{subtitle}</p></div><ArrowUpRight className="mode-arrow" size={24}/>
        </Link>)}
    </section>

    <section className="home-section match-section" id="matches">
      <div className="section-heading"><div><span className="eyebrow">PICK YOUR NEXT DROP</span><h2>Meet you in the lobby.</h2></div><Link to="/tournaments" className="text-link">All matches <ArrowUpRight size={16}/></Link></div>
      <div className="format-tabs" aria-label="Match format">{[['', 'All'], ['squad', 'Squad'], ['solo', 'Solo']].map(([value, label]) => <button key={value} aria-pressed={format === value} className={format === value ? 'active' : ''} onClick={() => setFormat(value)}>{label}</button>)}</div>
      {state === 'loading' ? <div className="tournament-grid" aria-label="Loading matches">{[0, 1, 2].map(i => <div key={i} className="card-skeleton animate-pulse" />)}</div>
        : state === 'error' ? <div className="arena-empty" role="alert"><h3>Matches couldn't load.</h3><button className="arena-button secondary" onClick={() => setReload(value => value + 1)}>Try again</button></div>
        : matches.length ? <div className="tournament-grid">{matches.slice(0, 3).map(match => <TournamentCard key={match._id} tournament={match}/>)}</div>
        : <div className="arena-empty"><Crosshair/><h3>The next drop is coming.</h3><p>New community matches will appear here.</p><Link to="/tournaments" className="text-link">Browse all matches</Link></div>}
    </section>

    <nav className="play-shortcuts" aria-label="Community links"><Link to="/rules"><Crosshair size={20}/><span>Know the rules</span><ArrowUpRight size={17}/></Link><Link to="/leaderboard"><Trophy size={20}/><span>See the standings</span><ArrowUpRight size={17}/></Link><Link to="/results"><Users size={20}/><span>Last match results</span><ArrowUpRight size={17}/></Link></nav>

    <section className="community-panel community-with-art">
      <ResponsiveImage src={(import.meta.env.VITE_ART_ODISHA_COMMUNITY || '/images/odisha-community.webp')} alt="Odisha friends sharing a Free Fire match" sizes="(max-width: 600px) 100vw, 300px" className="community-art"/>
      <div><span className="eyebrow">OUR PEOPLE. OUR GAME.</span><h2>Come for the game.<br/>Stay for the squad.</h2>{site.organizerName && <div className="organizer-inline">{site.organizerImage && <img src={site.organizerImage} alt="" width="40" height="40" loading="lazy"/>}<span>Hosted by {site.organizerName} · {site.region}</span></div>}</div>
      {site.communityUrl ? <a className="arena-button" href={site.communityUrl} target="_blank" rel="noreferrer">Meet the community<ArrowUpRight size={16}/></a> : <Link className="arena-button" to="/contact">Meet the organizer<ArrowUpRight size={16}/></Link>}
    </section>
  </div>;
}
