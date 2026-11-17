import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Trophy, 
  Flame, 
  Users, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  Menu, 
  X, 
  MessageCircle, 
  Search,
  ExternalLink
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, isSpectator, logout } = useAuth();

  const navLinks = [
    { name: 'Tournaments', path: '/tournaments', icon: Trophy },
    { name: 'Leaderboard', path: '/leaderboard', icon: Award },
    { name: 'Results', path: '/results', icon: Flame },
    { name: 'Winners', path: '/winners', icon: Users },
    { name: 'Status Check', path: '/status', icon: Search },
    { name: 'Rules', path: '/rules', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#1F293D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-brand-orange to-brand-amber p-0.5 flex items-center justify-center shadow-glow-orange group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0E14] rounded-[7px] flex items-center justify-center">
                <Flame className="w-6 h-6 text-brand-orange fill-brand-orange" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-bold tracking-wider text-white uppercase group-hover:text-brand-orange transition-colors">
                  RIT <span className="text-brand-orange">Esports</span>
                </span>
                <span className="bg-brand-orange/20 text-brand-orange text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-brand-orange/40">
                  Arena
                </span>
              </div>
              <p className="text-[10px] tracking-widest text-slate-400 uppercase font-medium">Free Fire College League</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'bg-[#1F293D] text-brand-orange shadow-sm border border-brand-orange/30'
                      : 'text-slate-300 hover:text-white hover:bg-[#161B26]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-orange' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* WhatsApp Community Quick Join */}
            <a
              href="https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all text-xs font-bold"
              title="Join Official Free Fire WhatsApp Community"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <MessageCircle className="w-4 h-4" />
              WhatsApp Group
            </a>

            {/* Admin or Spectator Portal button (Only shown when logged in) */}
            {isAdmin ? (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/40 hover:bg-purple-900/80 text-xs font-bold transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Admin Panel
              </Link>
            ) : isSpectator ? (
              <Link
                to="/spectator/workspace"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/80 text-xs font-bold transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Spectator Workspace
              </Link>
            ) : null}

            {/* Join Tournament CTA */}
            <Link
              to="/tournaments"
              className="relative inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-sm shadow-glow-orange hover:brightness-110 active:scale-95 transition-all"
            >
              Join Tournament
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href="https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-500/40"
              aria-label="WhatsApp Group"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-[#161B26] text-slate-300 hover:text-white border border-[#1F293D]"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[#1F293D] bg-[#0B0E14] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                  active
                    ? 'bg-[#1F293D] text-brand-orange border border-brand-orange/40'
                    : 'text-slate-300 hover:bg-[#161B26]'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-brand-orange' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[#1F293D] flex flex-col gap-2">
            <Link
              to="/tournaments"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-3 rounded-lg bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white shadow-glow-orange"
            >
              Browse Tournaments
            </Link>

            <a
              href="https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Join WhatsApp Community
            </a>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-purple-900/50 text-purple-300 border border-purple-500/40 text-sm font-semibold"
              >
                Admin Dashboard
              </Link>
            )}
            
            {user && (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-center py-2 text-xs text-rose-400 hover:underline"
              >
                Sign Out ({user.name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
