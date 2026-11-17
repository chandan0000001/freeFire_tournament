import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { 
  Trophy, 
  Calendar, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Flame, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function TournamentDetailPage() {
  const { slug } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  usePageMeta(
    tournament ? `${tournament.title} | Free Fire Tournament | RIT Esports` : 'Tournament Details | RIT Esports Arena',
    tournament ? `Join ${tournament.title} with prize pool of ₹${tournament.prizePool || 0}. Format: ${tournament.gameMode || 'Battle Royale'}, Entry: ₹${tournament.entryFee || 0}. Exclusively for Roland Institute of Technology.` : 'View Free Fire tournament details, schedules, scoring system, and prize breakdown for RIT college students.'
  );

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await api.get(`/tournaments/${slug}`);
        if (res.success) {
          setTournament(res.tournament);
        }
      } catch (err) {
        console.error('Failed to load tournament', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading tournament arena...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Tournament Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">The tournament you are looking for does not exist or has been archived.</p>
        <Link to="/tournaments" className="px-6 py-2.5 rounded-lg bg-brand-orange text-white text-xs font-bold uppercase">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const isMarkedFull = tournament.status === 'full' || tournament.registeredSlots >= tournament.maxSlots;
  const isFinishedOrLocked = ['full', 'room_ready', 'live', 'completed'].includes(tournament.status);
  const displayRegisteredSlots = isFinishedOrLocked ? tournament.maxSlots : tournament.registeredSlots;
  const remaining = isFinishedOrLocked ? 0 : Math.max(0, tournament.maxSlots - tournament.registeredSlots);
  const fillPercentage = isFinishedOrLocked
    ? 100
    : Math.min(100, Math.round((tournament.registeredSlots / tournament.maxSlots) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <Link to="/tournaments" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Tournaments
      </Link>

      {/* Hero Header Card */}
      <div className="relative rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden">
        
        {/* Background Banner */}
        <div className="relative h-64 sm:h-80 w-full bg-slate-900">
          <img
            src={tournament.bannerUrl || '/images/ff-banner.webp'}
            alt={tournament.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121722] via-[#121722]/60 to-transparent"></div>
          
          {/* Status & Format Floating Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              {tournament.status.replace('_', ' ')}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-orange" />
              {tournament.format === 'squad' ? 'Squad (4v4)' : 'Solo'}
            </span>
          </div>

          {/* Tournament Title & Date */}
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase text-white tracking-wide leading-tight">
              {tournament.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 mt-2 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-amber" />
                {new Date(tournament.matchDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-cyan" />
                Map: {tournament.map || 'Bermuda'}
              </span>
            </div>
          </div>
        </div>

        {/* Action & Metric Bar */}
        <div className="p-6 bg-[#0B0E14] border-t border-[#1F293D] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full md:w-auto">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Entry Fee</p>
              <p className="text-xl font-display font-bold text-white">₹{tournament.entryFee}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Prize Pool</p>
              <p className="text-xl font-display font-bold text-brand-amber">₹{tournament.prizeConfig?.totalPool || 0}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Slots</p>
              <p className="text-xl font-display font-bold text-slate-200">
                {displayRegisteredSlots} / {tournament.maxSlots}
              </p>
            </div>
          </div>

          {/* Register Action CTA */}
          <div className="w-full md:w-auto flex items-center gap-3">
            {tournament.status === 'registration_open' && !isMarkedFull ? (
              <Link
                to={tournament.format === 'squad' ? `/join/squad/${tournament._id}` : `/join/solo/${tournament._id}`}
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white font-display font-bold text-sm uppercase tracking-wider shadow-glow-orange hover:brightness-110 active:scale-95 transition-all text-center"
              >
                Register Now (₹{tournament.entryFee})
              </Link>
            ) : (
              <button
                disabled
                className="w-full md:w-auto px-8 py-3 rounded-xl bg-slate-800 text-slate-400 font-display font-bold text-sm uppercase tracking-wider cursor-not-allowed text-center"
              >
                {isMarkedFull
                  ? 'Slots Full'
                  : tournament.status === 'upcoming'
                  ? 'Registration Opens Soon'
                  : tournament.status === 'room_ready'
                  ? 'Room In Progress'
                  : tournament.status === 'live'
                  ? 'Match Live'
                  : tournament.status === 'completed'
                  ? 'Match Completed'
                  : 'Registration Closed'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#1F293D] flex items-center gap-6 text-sm font-display uppercase tracking-wider">
        {[
          { id: 'overview', label: 'Overview & Prizes' },
          { id: 'rules', label: 'Scoring & Rules' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-bold transition-all relative ${
              activeTab === tab.id ? 'text-brand-orange' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange shadow-glow-orange"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] space-y-4">
              <h3 className="font-display text-xl font-bold uppercase text-white">About the Tournament</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {tournament.description || 'Welcome to this week’s official Free Fire college match! Bring your best team and battle for the Booyah.'}
              </p>
            </div>

            {/* Prize Breakdown */}
            <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] space-y-4">
              <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-amber" /> Prize Pool Distribution
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-brand-amber/30 text-center">
                  <p className="text-xs uppercase font-bold text-brand-amber">1st Place (Booyah)</p>
                  <p className="text-2xl font-display font-extrabold text-white mt-1">₹{tournament.prizeConfig?.firstPlace || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-center">
                  <p className="text-xs uppercase font-bold text-slate-400">2nd Place</p>
                  <p className="text-2xl font-display font-extrabold text-white mt-1">₹{tournament.prizeConfig?.secondPlace || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-center">
                  <p className="text-xs uppercase font-bold text-slate-400">3rd Place</p>
                  <p className="text-2xl font-display font-extrabold text-white mt-1">₹{tournament.prizeConfig?.thirdPlace || 0}</p>
                </div>
              </div>

              {tournament.prizeConfig?.terms && (
                <p className="text-xs text-slate-400 pt-2 border-t border-[#1F293D]">
                  <strong>Prize Terms:</strong> {tournament.prizeConfig.terms}
                </p>
              )}
            </div>
          </div>

          {/* Right Sidebar: Slot Capacity & Match Details */}
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] space-y-4">
              <h4 className="font-display text-lg font-bold uppercase text-white">Slot Availability</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Registered: <strong>{displayRegisteredSlots}</strong></span>
                  <span>Max: <strong>{tournament.maxSlots}</strong></span>
                </div>
                <div className="w-full h-3 bg-[#0B0E14] rounded-full overflow-hidden border border-[#1F293D]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      fillPercentage >= 90
                        ? 'bg-rose-500'
                        : fillPercentage >= 70
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-brand-orange to-brand-amber'
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 text-right">
                  {isMarkedFull
                    ? 'All slots filled'
                    : tournament.status === 'upcoming'
                    ? 'Registration opens soon'
                    : remaining > 0
                    ? `${remaining} slots remaining`
                    : 'No slots remaining'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1F293D] space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>College students only</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mobile devices only (No PC/Emulators)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Room ID & Pass sent by Brevo Email</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab Content: Rules & Scoring */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Scoring Engine Config */}
          <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] space-y-4">
            <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-orange" /> Configured Scoring Formula
            </h3>

            <div className="p-4 rounded-lg bg-[#0B0E14] border border-brand-orange/30">
              <p className="text-xs font-mono text-brand-amber uppercase">
                Total Match Points = (Kills × {tournament.scoringConfig?.killPointValue || 1}) + Booyah Bonus ({tournament.scoringConfig?.booyahBonus || 12})
              </p>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 pt-2">
              <li className="flex justify-between border-b border-[#1F293D] pb-2">
                <span>Kill Point Value</span>
                <strong className="text-white font-mono">{tournament.scoringConfig?.killPointValue || 1} Point per Kill</strong>
              </li>
              <li className="flex justify-between border-b border-[#1F293D] pb-2">
                <span>Booyah Bonus (1st Place)</span>
                <strong className="text-brand-amber font-mono">+{tournament.scoringConfig?.booyahBonus || 12} Points</strong>
              </li>
              <li className="flex justify-between border-b border-[#1F293D] pb-2">
                <span>Tie-Breaker Hierarchy</span>
                <strong className="text-white">Booyahs &gt; Kills &gt; Best Placement</strong>
              </li>
            </ul>
          </div>

          {/* Official Rules */}
          <div className="p-6 rounded-xl bg-[#121722] border border-[#1F293D] space-y-4">
            <h3 className="font-display text-xl font-bold uppercase text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" /> Competition Guidelines
            </h3>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-[#0B0E14] p-4 rounded-lg border border-[#1F293D]">
              {tournament.rules || 'Standard Free Fire rules apply.'}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
