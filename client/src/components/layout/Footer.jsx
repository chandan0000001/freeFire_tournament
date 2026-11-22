import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { site } from '../../config/site.js';
export default function Footer() {
 return <footer className="site-footer"><div className="arena-container footer-grid"><div><Link className="brand" to="/"><img src="/favicon.svg" alt="" width="32" height="32"/><strong>{site.name}</strong></Link><p>A home for {site.region}’s Free Fire community.<br/>Find your squad. Play your best.</p></div><div><h2>Compete</h2><Link to="/tournaments">Browse tournaments</Link><Link to="/status">Track registration</Link><Link to="/leaderboard">Leaderboard</Link></div><div><h2>Player support</h2><Link to="/rules">Rules & fair play</Link><Link to="/contact">Contact organizer</Link><Link to="/privacy">Privacy policy</Link></div><div><h2>Stay connected</h2>{site.communityUrl && <a href={site.communityUrl} target="_blank" rel="noreferrer">Join the community</a>}{site.contactEmail && <a href={`mailto:${site.contactEmail}`}>Email support</a>}<Link to="/admin/login">Organizer login</Link></div></div><div className="arena-container footer-bottom"><span>© {new Date().getFullYear()} {site.name}</span><span>Community organized. Not affiliated with Garena.</span></div></footer>;
}
