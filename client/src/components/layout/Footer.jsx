import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Shield, Award, Lock, ExternalLink, ShieldCheck } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-[#07090D] border-t border-[#1F293D] mt-16 sm:mt-24 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Main Grid: Compact 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Brand Info with Official RIT Seal */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0.5 bg-gradient-to-br from-brand-orange to-brand-amber shadow-glow-orange shrink-0">
                <img
                  src="/images/rit-logo.png"
                  alt="Roland Institute of Technology"
                  className="w-full h-full object-contain rounded-full bg-[#0B0E14]"
                />
              </div>
              <div>
                <span className="font-display font-bold text-base sm:text-lg text-white uppercase tracking-wider group-hover:text-brand-orange transition-colors">
                  RIT <span className="text-brand-orange">Esports</span>
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                  Roland Institute of Technology
                </span>
              </div>
            </Link>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed max-w-sm">
              The official competitive Free Fire arena for RIT students. Weekly custom rooms, pure skill-based scoring, and verified cash prizes.
            </p>
            <span className="inline-block bg-slate-800/80 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded border border-brand-orange/30">
              Campus Exclusive Platform
            </span>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-display text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-[11px] sm:text-xs">
              <li><Link to="/tournaments" className="hover:text-brand-orange transition-colors">Active Tournaments</Link></li>
              <li><Link to="/leaderboard" className="hover:text-brand-orange transition-colors">College Standings</Link></li>
              <li><Link to="/results" className="hover:text-brand-orange transition-colors">Match Results</Link></li>
              <li><Link to="/winners" className="hover:text-brand-orange transition-colors">Hall of Fame</Link></li>
              <li><Link to="/status" className="hover:text-brand-orange transition-colors">Registration Status</Link></li>
            </ul>
          </div>

          {/* Competition Rules & Policy */}
          <div className="space-y-2">
            <h4 className="font-display text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
              Fair Play & Legal
            </h4>
            <ul className="space-y-1.5 text-[11px] sm:text-xs">
              <li><Link to="/rules" className="hover:text-brand-orange transition-colors">Tournament Rules</Link></li>
              <li><Link to="/rules#eligibility" className="hover:text-brand-orange transition-colors">Eligibility Guidelines</Link></li>
              <li><Link to="/rules#anti-cheat" className="hover:text-brand-orange transition-colors">Anti-Cheat & Mobile Only</Link></li>
              <li><Link to="/privacy" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Privacy Policy</Link></li>
              <li>
                <a href="https://wa.me/918114603994" target="_blank" rel="noopener noreferrer" className="hover:text-brand-orange transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* WhatsApp Community & Staff Links */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <h4 className="font-display text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
              Official Community
            </h4>
            <a
              href="https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm w-full sm:w-auto justify-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              Join WhatsApp Group
            </a>
            
            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>Admin Contact: <strong className="text-slate-200 font-mono">+91 8114603994</strong></p>
              <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                <Link to="/admin/login" className="hover:text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Admin Portal
                </Link>
                <span>•</span>
                <Link to="/spectator/login" className="hover:text-slate-300">
                  Spectator Portal
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Bottom Bar */}
        <div className="border-t border-[#1F293D] mt-6 sm:mt-8 pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-slate-500 gap-2 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Roland Institute of Technology (RIT) Esports Arena. Built for campus students.</p>
          <p>Non-commercial campus tournament. Not affiliated with Garena Free Fire.</p>
        </div>

      </div>
    </footer>
  );
}

export default React.memo(Footer);
