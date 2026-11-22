import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { site } from '../../config/site.js';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  ['/tournaments', 'Tournaments'],
  ['/leaderboard', 'Leaderboard'],
  ['/results', 'Results'],
  ['/winners', 'Winners'],
  ['/status', 'My registration'],
  ['/rules', 'Rules'],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAdmin, user, logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="arena-container header-inner">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <img src="/favicon.svg" alt="" width="42" height="42" />
          </span>
          <span>
            <strong>{site.name}</strong>
            <small>
              <span lang="or">{site.regionNative}</span> · {site.tagline}
            </small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          {isAdmin && <Link to="/admin/dashboard" className="text-link admin-dashboard-link">Dashboard</Link>}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 hidden sm:inline-block px-2.5 py-1 rounded-lg bg-[#1c1b1e] border border-[#412a34]">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#1b1017] border border-[#412a34] transition-colors"
                title="Sign out"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-wider text-brand-orange hover:text-white px-3 py-1.5 rounded-lg border border-brand-orange/40 bg-brand-orange/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-[#393236] bg-[#1b1017] transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          <button
            className="menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" className="mobile-nav arena-container" aria-label="Mobile navigation">
          {user && (
            <div className="py-2 border-b border-[#412a34] text-xs text-brand-orange font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Player: {user.name}</span>
            </div>
          )}
          {links.map(([to, label]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
          {!user ? (
            <>
              <Link to="/login" className="text-brand-orange font-bold">Sign In</Link>
              <Link to="/register">Create Account</Link>
            </>
          ) : (
            <button onClick={logout} className="text-left text-rose-400 font-bold">
              Sign Out
            </button>
          )}
          {isAdmin && <Link to="/admin/dashboard" className="text-cyan-400 font-bold">Admin Dashboard</Link>}
        </nav>
      )}


    </header>
  );
}
