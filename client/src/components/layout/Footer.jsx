import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, MessageCircle, Shield, Award, HelpCircle, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#07090D] border-t border-[#1F293D] mt-24 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-orange to-brand-amber p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#0B0E14] rounded flex items-center justify-center">
                  <Flame className="w-4 h-4 text-brand-orange" />
                </div>
              </div>
              <span className="font-display font-bold text-lg text-white uppercase tracking-wider">
                RIT <span className="text-brand-orange">Esports</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The official competitive Free Fire gaming arena for RIT students. Weekly custom rooms, pure skill-based scoring, and verified cash prizes.
            </p>
            <div className="pt-2">
              <span className="inline-block bg-slate-800 text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded border border-slate-700">
                College-Exclusive Platform
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-white text-sm font-bold uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/tournaments" className="hover:text-brand-orange transition-colors">Active Tournaments</Link></li>
              <li><Link to="/leaderboard" className="hover:text-brand-orange transition-colors">College Leaderboards</Link></li>
              <li><Link to="/results" className="hover:text-brand-orange transition-colors">Match Results</Link></li>
              <li><Link to="/winners" className="hover:text-brand-orange transition-colors">Hall of Fame</Link></li>
              <li><Link to="/status" className="hover:text-brand-orange transition-colors">Registration Status</Link></li>
            </ul>
          </div>

          {/* Competition Rules & Conduct */}
          <div>
            <h4 className="font-display text-white text-sm font-bold uppercase tracking-wider mb-3">Fair Play & Rules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/rules" className="hover:text-brand-orange transition-colors">Tournament Rules</Link></li>
              <li><Link to="/rules#eligibility" className="hover:text-brand-orange transition-colors">Eligibility Guidelines</Link></li>
              <li><Link to="/rules#scoring" className="hover:text-brand-orange transition-colors">Kill & Booyah Scoring</Link></li>
              <li><Link to="/rules#anti-cheat" className="hover:text-brand-orange transition-colors">Anti-Cheat & Emulators</Link></li>
              <li><Link to="/contact" className="hover:text-brand-orange transition-colors">Disputes & Support</Link></li>
            </ul>
          </div>

          {/* WhatsApp & Community */}
          <div className="space-y-3">
            <h4 className="font-display text-white text-sm font-bold uppercase tracking-wider">Official Community</h4>
            <p className="text-xs text-slate-400">
              Get instant tournament announcements, custom room release notices, and connect with fellow college gamers.
            </p>
            <a
              href="https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Join WhatsApp Group
            </a>
            <div className="pt-2 text-[11px] text-slate-400">
              Admin Contact: <span className="text-slate-300 font-mono">+91 8114603994</span>
            </div>
            
            {/* Staff & Admin links */}
            <div className="pt-3 border-t border-[#1F293D] flex items-center gap-4 text-[11px] text-slate-400">
              <Link to="/admin/login" className="hover:text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Admin Portal
              </Link>
              <span>•</span>
              <Link to="/spectator/login" className="hover:text-slate-300">
                Spectator Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="border-t border-[#1F293D] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} RIT Esports Arena. Built exclusively for our college students.</p>
          <p className="text-center md:text-right">
            Not affiliated with or endorsed by Garena Free Fire. Garena and Free Fire are registered trademarks of Garena International.
          </p>
        </div>
      </div>
    </footer>
  );
}
