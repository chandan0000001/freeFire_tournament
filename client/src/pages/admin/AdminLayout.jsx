import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trophy, CreditCard, KeyRound, FileCheck, Gift, Settings, ScrollText, LogOut, Menu, X, ShieldCheck, Globe } from 'lucide-react';
import { site } from '../../config/site.js';
import { useAuth } from '../../context/AuthContext.jsx';
const navItems = [
  ['Dashboard', '/admin/dashboard', LayoutDashboard],
  ['Tournaments', '/admin/tournaments', Trophy],
  ['Registrations', '/admin/registrations', CreditCard],
  ['Room management', '/admin/rooms', KeyRound],
  ['Results & review', '/admin/results', FileCheck],
  ['Prizes & payouts', '/admin/prizes', Gift],
  ['Site settings', '/admin/settings', Settings],
  ['Audit trail', '/admin/audit-logs', ScrollText],
];
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', close); };
  }, [open]);
  return <div className="admin-shell">
    {open && <button className="admin-backdrop" aria-label="Close navigation overlay" onClick={() => setOpen(false)} />}
    <aside id="organizer-navigation" className={`admin-sidebar ${open ? 'is-open' : ''}`}>
      <button className="admin-sidebar-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={18}/></button>
      <Link className="admin-brand" to="/admin/dashboard"><img src="/favicon.svg" alt=""/><div><strong>{site.name}</strong><small>Organizer workspace</small></div></Link>
      <p className="admin-nav-label">Tournament operations</p>
      <nav className="admin-navigation" aria-label="Organizer navigation">
        {navItems.map(([label,path,Icon]) => <NavLink key={path} to={path}><Icon/><span>{label}</span></NavLink>)}
      </nav>
      <div className="admin-sidebar-bottom">
        <Link className="admin-site-link" to="/"><Globe size={17}/> View public website</Link>
        <div className="admin-user"><span className="admin-user-icon"><ShieldCheck size={18}/></span><div><strong>{user?.name || 'Organizer'}</strong><small>{user?.email}</small></div></div>
        <button className="admin-signout" onClick={() => { logout(); navigate('/login'); }}><LogOut size={16}/>Sign out</button>
      </div>
    </aside>
    <div className="admin-workspace">
      <header className="admin-topbar"><button className="admin-menu-toggle" aria-label="Open organizer navigation" aria-expanded={open} aria-controls="organizer-navigation" onClick={() => setOpen(true)}><Menu size={21}/></button><div><h1>{navItems.find(([,path]) => path === pathname)?.[0] || 'Organizer workspace'}</h1><p>{site.region} / {site.tagline}</p></div><span className="admin-topbar-badge"><ShieldCheck size={14}/> Authorized organizer</span></header>
      <main id="main-content" className="admin-content"><Outlet/></main>
    </div>
  </div>;
}
