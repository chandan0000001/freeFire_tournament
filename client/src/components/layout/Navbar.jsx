import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, Wallet } from 'lucide-react';
import { site } from '../../config/site.js';
import { useAuth } from '../../context/AuthContext.jsx';
const links = [['/tournaments','Tournaments'], ['/leaderboard','Leaderboard'], ['/results','Results'], ['/winners','Winners'], ['/status','My registration'], ['/rules','Rules']];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAdmin, user, logout } = useAuth();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { const close = e => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  return <header className="site-header"><a className="skip-link" href="#main-content">Skip to content</a><div className="arena-container header-inner">
    <Link to="/" className="brand"><span className="brand-icon"><img src="/favicon.svg" alt="" width="42" height="42"/></span><span><strong>{site.name}</strong><small><span lang="or">{site.regionNative}</span> · {site.tagline}</small></span></Link>
    <nav className="desktop-nav" aria-label="Main navigation">{links.map(([to,label]) => <NavLink key={to} to={to}>{label}</NavLink>)}</nav>
    <div className="header-actions"><Link to="/wallet" className="wallet-link"><Wallet size={19}/><span>Wallet</span></Link><button className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div>
    </div>{open && <nav id="mobile-navigation" className="mobile-nav arena-container" aria-label="Mobile navigation">{links.map(([to,label]) => <NavLink key={to} to={to}>{label}</NavLink>)}{isAdmin && <Link to="/admin/dashboard">Admin dashboard</Link>}{user && <button onClick={logout}>Sign out</button>}</nav>}
    {isAdmin && <div className="admin-strip arena-container"><Link to="/admin/dashboard">Manage tournaments</Link><button onClick={logout}>Sign out</button></div>}
  </header>;
}
