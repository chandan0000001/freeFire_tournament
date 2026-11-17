import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import { 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Smartphone, 
  MessageCircle, 
  Award, 
  ArrowRight,
  CheckCircle,
  Users,
  Zap
} from 'lucide-react';

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          api.get('/tournaments'), // Fetch all public tournaments to get the top 3 featured
          api.get('/settings/public'),
        ]);

        if (tRes.success && tRes.tournaments) {
          // Sort to prioritize open tournaments first, then upcoming, limit to 3 for clean 3-col grid
          const sorted = [...tRes.tournaments].sort((a, b) => {
            if (a.status === 'registration_open' && b.status !== 'registration_open') return -1;
            if (b.status === 'registration_open' && a.status !== 'registration_open') return 1;
            return new Date(a.matchDate) - new Date(b.matchDate);
          });
          setTournaments(sorted.slice(0, 3));
        }

        if (sRes.success) setSettings(sRes.settings);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28 border-b border-[#1F293D]">
        {/* Background esports arena photo with rich dark gradient overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/arena-stage.jpg" 
            alt="Esports Arena Background" 
            className="w-full h-full object-cover opacity-20 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-[#0B0E14]/60"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-orange/15 blur-[140px] pointer-events-none rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Flame className="w-4 h-4 fill-brand-orange" />
              <span>Official College Free Fire League</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight">
              Prove Your Squad. <br />
              <span className="bg-gradient-to-r from-brand-orange via-brand-amber to-brand-gold bg-clip-text text-transparent">
                Claim The Booyah.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Compete in weekly verified Free Fire tournaments organized exclusively for RIT college students. Custom rooms, transparent Kill + Booyah scoring, and instant cash prizes.
            </p>

            {/* Key Value Props Pill Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> ₹29 Squad / ₹14 Solo
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Brevo Email Room Codes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Observer Verified Results
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/tournaments"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white font-display font-bold text-base uppercase tracking-wider shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Browse Tournaments
              </Link>
              
              <a
                href={settings?.whatsappCommunityUrl || 'https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 hover:border-emerald-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Join WhatsApp Community
              </a>
            </div>

            {/* Character Spotlight Preview Strip */}
            <div className="pt-8 grid grid-cols-3 gap-3 max-w-xl mx-auto">
              <div className="p-2 rounded-xl bg-[#121722]/80 border border-[#1F293D] backdrop-blur-md flex items-center gap-2.5 hover:border-brand-orange/40 transition-all">
                <img src="/images/ff-character-1.webp" alt="Solo Warrior" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-brand-orange block">Solo</span>
                  <span className="text-xs font-bold text-white">₹14 Entry</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#121722]/80 border border-[#1F293D] backdrop-blur-md flex items-center gap-2.5 hover:border-brand-amber/40 transition-all">
                <img src="/images/ff-banner.webp" alt="Squad Battle" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-brand-amber block">Squad 4v4</span>
                  <span className="text-xs font-bold text-white">₹29 Entry</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-[#121722]/80 border border-[#1F293D] backdrop-blur-md flex items-center gap-2.5 hover:border-emerald-500/40 transition-all">
                <img src="/images/ff-character-3.webp" alt="Cash Prizes" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block">Prizes</span>
                  <span className="text-xs font-bold text-white">₹1100 Pool</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Tournaments Section (Clean 3-Card Row) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Live & Featured Competitions</span>
            </div>
            <h2 className="font-display text-3xl font-bold uppercase text-white tracking-wide">
              Featured Tournaments
            </h2>
          </div>

          <Link
            to="/tournaments"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-brand-orange hover:text-brand-amber transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-xl bg-[#121722] border border-[#1F293D] animate-pulse"></div>
            ))}
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => (
              <TournamentCard key={t._id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#121722] rounded-xl border border-[#1F293D] p-8">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Tournaments Available</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-4">
              All slots are currently filled or matches are in progress. Join our WhatsApp community for next week's drop!
            </p>
            <Link
              to="/tournaments"
              className="inline-flex px-5 py-2.5 rounded-lg bg-[#1F293D] text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-[#2A3750]"
            >
              View Tournament Archive
            </Link>
          </div>
        )}
      </section>

      {/* 4-Step Workflow Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-brand-orange text-xs font-bold uppercase tracking-widest">How It Works</p>
          <h2 className="font-display text-3xl font-bold uppercase text-white tracking-wide mt-1">
            4 Simple Steps to Victory
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] hover:border-brand-orange/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-brand-orange/10 text-brand-orange flex items-center justify-center font-display font-extrabold text-2xl mb-4 border border-brand-orange/20">
              01
            </div>
            <h3 className="font-display text-lg font-bold text-white uppercase mb-2">Register Squad or Solo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fill the fast registration form with your team names and Free Fire UIDs. No email OTP required.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] hover:border-brand-orange/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-brand-amber/10 text-brand-amber flex items-center justify-center font-display font-extrabold text-2xl mb-4 border border-brand-amber/20">
              02
            </div>
            <h3 className="font-display text-lg font-bold text-white uppercase mb-2">Pay ₹29 / ₹14 via UPI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pay the low entry fee and click the 1-tap WhatsApp button to send your UTR screenshot to the admin.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121722] border border-brand-cyan/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/40 text-cyan-400 flex items-center justify-center font-display font-extrabold text-2xl mb-4 border border-cyan-500/30">
              03
            </div>
            <h3 className="font-display text-lg font-bold text-white uppercase mb-2">Receive Room ID via Email</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once verified, your Room ID and Password will be dispatched securely to your email before match kick-off.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#121722] border border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center font-display font-extrabold text-2xl mb-4 border border-emerald-500/30">
              04
            </div>
            <h3 className="font-display text-lg font-bold text-white uppercase mb-2">Booyah & Win Cash</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official observers record kills and placement. Final scores are verified and cash prizes paid via UPI.
            </p>
          </div>

        </div>
      </section>

      {/* WhatsApp Community Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-8 sm:p-12 rounded-2xl border border-emerald-500/40 overflow-hidden shadow-2xl">
          {/* Background image overlay */}
          <img 
            src="/images/esports-setup.jpg" 
            alt="Gaming Setup" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/90 to-emerald-950/80"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                Join 500+ College Gamers
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-white tracking-wide">
                Official Free Fire WhatsApp Group
              </h2>
              <p className="text-sm text-slate-300">
                Get notified the second new tournament slots open, receive match schedule reminders, and talk strategy with the community.
              </p>
            </div>

            <a
              href={settings?.whatsappCommunityUrl || 'https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-sm transition-all shadow-lg flex items-center gap-3 shrink-0"
            >
              <MessageCircle className="w-5 h-5 text-slate-950 fill-slate-950" />
              Join WhatsApp Group Now
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
