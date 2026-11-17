import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import TournamentCard from '../../components/tournament/TournamentCard.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { 
  Trophy, 
  ShieldCheck, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Zap,
  Sparkles,
  Gamepad2,
  Mail,
  Flame,
  Search,
  ExternalLink,
  Smartphone,
  Award
} from 'lucide-react';

// Instant-mount default featured tournaments (renders with 0ms delay on initial paint)
const DEFAULT_FEATURED = [
  {
    _id: '6afbf6bf37819059e7865025',
    title: 'RIT Squad Battle — Week 01',
    slug: 'rit-squad-battle-week-01',
    format: 'squad',
    status: 'registration_open',
    entryFee: 29,
    maxSlots: 12,
    registeredSlots: 2,
    map: 'Bermuda',
    matchDate: '2026-11-20T14:30:00.000Z',
    prizeConfig: { totalPool: 230, firstPlace: 120, secondPlace: 70, thirdPlace: 40 },
    bannerUrl: '/images/ff-banner-squad.webp',
  },
  {
    _id: '6afbf6bf37819059e7865026',
    title: 'RIT Solo Battle — Week 01',
    slug: 'rit-solo-battle-week-01',
    format: 'solo',
    status: 'upcoming',
    entryFee: 14,
    maxSlots: 48,
    registeredSlots: 0,
    map: 'Purgatory',
    matchDate: '2026-11-22T03:30:00.000Z',
    prizeConfig: { totalPool: 500, firstPlace: 250, secondPlace: 150, thirdPlace: 100 },
    bannerUrl: '/images/ff-banner-solo.webp',
  },
  {
    _id: '6afbf6bf37819059e7865027',
    title: 'RIT Squad Battle — Week 02',
    slug: 'rit-squad-battle-week-02',
    format: 'squad',
    status: 'upcoming',
    entryFee: 29,
    maxSlots: 12,
    registeredSlots: 0,
    map: 'Kalahari',
    matchDate: '2026-11-27T14:30:00.000Z',
    prizeConfig: { totalPool: 230, firstPlace: 120, secondPlace: 70, thirdPlace: 40 },
    bannerUrl: '/images/ff-banner-rampage.webp',
  },
];

// Static format filters
const FORMAT_TABS = [
  { id: 'all', label: 'All Formats' },
  { id: 'squad', label: 'Squad (4v4)' },
  { id: 'solo', label: 'Solo Battle' },
];

// Static Esports Telemetry HUD metrics
const HUD_METRICS = [
  { label: 'Active Formats', value: 'Squad & Solo', tag: 'Mobile Only', color: 'text-white' },
  { label: 'College Entry Fee', value: '₹29 / ₹14', tag: 'Low & Fair', color: 'text-brand-orange' },
  { label: 'Season Prize Pool', value: '₹1,100+', tag: 'Guaranteed', color: 'text-brand-amber' },
  { label: 'Prize Payouts', value: 'Instant UPI', tag: 'Post Scorecard', color: 'text-emerald-400' },
];

// 4-Step Competitive Workflow
const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Register Squad or Solo',
    description: 'Submit team roster and Free Fire UIDs via our instant registration form in under 60 seconds.',
    icon: Gamepad2,
    badgeColor: 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange',
  },
  {
    step: '02',
    title: 'Pay Entry via UPI',
    description: 'Pay ₹29 for Squad or ₹14 for Solo via Google Pay, PhonePe, or Paytm and submit your UTR number.',
    icon: Zap,
    badgeColor: 'border-brand-amber/30 bg-brand-amber/10 text-brand-amber',
  },
  {
    step: '03',
    title: 'Receive Room Code via Email',
    description: 'Custom Room ID and Password are dispatched directly to the captain’s registered email before kick-off.',
    icon: Mail,
    badgeColor: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400',
  },
  {
    step: '04',
    title: 'Booyah & Win Cash',
    description: 'Certified referees verify kills and placement points. Cash prizes are transferred instantly via UPI.',
    icon: Trophy,
    badgeColor: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400',
  },
];

// Fair Play & League Standards
const LEAGUE_STANDARDS = [
  {
    title: 'Mobile-Only Strict Enforcement',
    desc: 'Emulators, PC players, iPads, and modified APKs are strictly barred. All lobbies are actively scrutinized by campus tournament observers.',
    icon: Smartphone,
    tag: 'Integrity First',
  },
  {
    title: 'Official Kill + Booyah Scoring',
    desc: 'Standard competitive rule set. 1 kill = 1 point, 1st place Booyah = 12 points. Transparent scorecards published post-match.',
    icon: Flame,
    tag: 'Esports Scoring',
  },
  {
    title: 'Instant UPI Prize Settlement',
    desc: 'Direct UPI transactions to the verified team captain with audit log receipts. Zero hidden fees or withdrawal commissions.',
    icon: Award,
    tag: 'Instant UPI',
  },
];

function HomePage() {
  usePageMeta(
    'RIT Esports Arena — Official College Free Fire League',
    'Compete in weekly verified Free Fire tournaments organized exclusively for RIT college students. Custom rooms, Kill + Booyah scoring, and instant UPI cash prizes.'
  );

  const [tournaments, setTournaments] = useState(DEFAULT_FEATURED);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [settings, setSettings] = useState(null);

  // Background sync: updates with live database registrations without re-triggering renders if identical
  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/settings/public'),
        ]);

        if (isMounted && tRes.success && Array.isArray(tRes.tournaments) && tRes.tournaments.length > 0) {
          const sorted = [...tRes.tournaments].sort((a, b) => {
            if (a.status === 'registration_open' && b.status !== 'registration_open') return -1;
            if (b.status === 'registration_open' && a.status !== 'registration_open') return 1;
            return new Date(a.matchDate) - new Date(b.matchDate);
          });

          // Smart update: bail out if data is identical to avoid layout reflow and re-render flash
          setTournaments((prev) => {
            if (prev && prev.length === sorted.length) {
              const isIdentical = sorted.every((item, i) =>
                prev[i] &&
                prev[i]._id === item._id &&
                prev[i].status === item.status &&
                prev[i].registeredSlots === item.registeredSlots
              );
              if (isIdentical) return prev;
            }
            return sorted.slice(0, 6);
          });
        }

        if (isMounted && sRes.success && sRes.settings) {
          setSettings((prev) => {
            if (prev && prev.whatsappCommunityUrl === sRes.settings.whatsappCommunityUrl) {
              return prev;
            }
            return sRes.settings;
          });
        }
      } catch (err) {
        console.warn('Live sync deferred, using instant static state', err);
      }
    };

    fetchHomeData();
    return () => { isMounted = false; };
  }, []);

  const handleFormatChange = useCallback((formatId) => {
    setSelectedFormat(formatId);
  }, []);

  // Challengermode & GBArena format filtering
  const filteredTournaments = useMemo(() => {
    if (selectedFormat === 'all') return tournaments.slice(0, 3);
    return tournaments.filter((t) => t.format === selectedFormat).slice(0, 3);
  }, [tournaments, selectedFormat]);

  const whatsappUrl = settings?.whatsappCommunityUrl || 'https://chat.whatsapp.com/BmpfCWcVIeB0vlE5TgHxkt?s=cl&p=a&iam=2';

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      
      {/* Hero Section - Challengermode & GBArena Inspired */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-16 sm:pb-20 border-b border-[#1F293D]">
        {/* Esports Arena Background with Hardware-Accelerated Radial Overlays (Zero-cost GPU Compositing) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img 
            src="/images/arena-stage.webp" 
            alt="RIT Free Fire Esports Arena Championship Stage" 
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/90 to-[#0B0E14]/75"></div>
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 87, 34, 0.15) 0%, rgba(255, 87, 34, 0.03) 55%, transparent 75%)' }}
          ></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
            
            {/* Top Pill with RIT College Crest & Live Status */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
              <img 
                src="/images/rit-logo.webp" 
                alt="RIT Crest" 
                width="16" 
                height="16" 
                className="w-4 h-4 object-contain rounded-full" 
              />
              <span>Roland Institute of Technology Free Fire League</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_6px_rgba(255,87,34,0.9)]"></span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight text-white leading-tight">
              Prove Your Squad. <br />
              <span className="bg-gradient-to-r from-brand-orange via-brand-amber to-brand-gold bg-clip-text text-transparent">
                Claim The Booyah.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Weekly verified Free Fire custom rooms organized exclusively for RIT college students. Official Kill + Booyah scoring, observer-monitored anti-cheat, and instant UPI cash prizes.
            </p>

            {/* Value Props Pill Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121722]/90 border border-[#1F293D]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> ₹29 Squad / ₹14 Solo
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121722]/90 border border-[#1F293D]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Email Room Credentials
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121722]/90 border border-[#1F293D]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Verified Scorecards
              </span>
            </div>

            {/* CTA Buttons Above The Fold */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
              <Link
                to="/tournaments"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white font-display font-bold text-sm sm:text-base uppercase tracking-wider shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                Browse Tournaments
              </Link>
              
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 hover:border-emerald-400 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Join WhatsApp Community
              </a>

              <Link
                to="/status"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#141A26] text-slate-300 hover:text-white border border-[#243048] hover:border-brand-orange/40 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-brand-orange" />
                Check Status
              </Link>
            </div>

            {/* Esports Telemetry HUD Strip */}
            <div className="pt-6 sm:pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {HUD_METRICS.map((metric, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl bg-[#121722]/80 border border-[#1F293D] backdrop-blur-md text-center"
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {metric.label}
                  </span>
                  <span className={`text-base sm:text-lg font-display font-extrabold mt-0.5 block ${metric.color}`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Featured Tournaments Section - Challengermode Discovery Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Tournament Hub</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white tracking-wide">
              Featured Tournaments
            </h2>
          </div>

          {/* Challengermode Format Filter Chips */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl bg-[#101522] border border-[#1F293D] flex items-center gap-1">
              {FORMAT_TABS.map((tab) => {
                const isSelected = selectedFormat === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleFormatChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-orange to-brand-amber text-white shadow-glow-orange'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <Link
              to="/tournaments"
              className="ml-2 hidden sm:flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-amber transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3-Card Tournament Grid (Renders Immediately with 16:9 Aspect Ratio) */}
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => (
              <TournamentCard key={t._id} tournament={t} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#121722] rounded-xl border border-[#1F293D] p-8">
            <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No {selectedFormat.toUpperCase()} Tournaments Active</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-4">
              All slots are currently filled. Join our WhatsApp community for the next announcement.
            </p>
            <button
              type="button"
              onClick={() => handleFormatChange('all')}
              className="inline-flex px-5 py-2.5 rounded-lg bg-[#1F293D] text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-[#2A3750]"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* 4-Step Competitive Workflow (Challengermode / GBArena Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-brand-orange text-xs font-bold uppercase tracking-widest">How It Works</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white tracking-wide mt-1">
            4 Steps to the Winner's Podium
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HOW_IT_WORKS_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-xl bg-[#121722] border border-[#1F293D] hover:border-brand-orange/40 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-extrabold text-lg mb-3 border ${item.badgeColor}`}>
                  {item.step}
                </div>
                <h3 className="font-display text-base font-bold text-white uppercase mb-1.5 flex items-center gap-1.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* League Standards & Fair Play Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#0F141F] border border-[#1F293D] p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#1A2234]">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest block">
                Campus Esports Integrity
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-bold uppercase text-white mt-0.5">
                RIT Esports League Standards
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Campus Referees</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {LEAGUE_STANDARDS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-orange/10 border border-brand-orange/30 text-brand-orange flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-white uppercase">{pillar.title}</h4>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{pillar.tag}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp Community Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="relative p-8 sm:p-10 rounded-2xl border border-emerald-500/30 overflow-hidden shadow-2xl bg-[#0E151A]"
        >
          {/* Subtle hardware-accelerated background glow (No expensive blur filter) */}
          <div 
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}
          ></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl text-center md:text-left">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30 inline-block">
                Join 500+ College Gamers
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-white tracking-wide">
                Official Free Fire WhatsApp Group
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Get notified instantly when new tournament slots open, receive match schedule reminders, and connect with other RIT college squads.
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2.5 shrink-0"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 fill-slate-950" />
              Join WhatsApp Group Now
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

export default memo(HomePage);