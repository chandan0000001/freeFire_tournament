import { site } from '../../config/site.js';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { 
  Trophy, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  KeyRound, 
  FileCheck, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true); setError('');
      try {
        const res = await api.get('/admin/dashboard/stats');
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [retry]);

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="font-display text-3xl font-extrabold uppercase text-white tracking-wide">
          Operations Overview
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {site.name} real-time operational metrics and match workflows.
        </p>
      </div>

      {error && <div className="login-error" role="alert">{error}<button className="ml-4" onClick={() => setRetry(retry + 1)}>Try again</button></div>}
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tournaments</span>
            <Trophy className="w-5 h-5 text-brand-orange" />
          </div>
          <p className="font-display text-3xl font-extrabold text-white">
            {loading ? '…' : error ? '—' : stats?.totalTournaments || 0}
          </p>
          <span className="text-[11px] text-slate-500">Squad & Solo competitions</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#24171e] border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Payments</span>
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
          <p className="font-display text-3xl font-extrabold text-amber-400">
            {loading ? '…' : error ? '—' : stats?.pendingPayments || 0}
          </p>
          <Link to="/admin/registrations" className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold">
            Review payment requests
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#24171e] border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Entries</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="font-display text-3xl font-extrabold text-emerald-400">
            {loading ? '…' : error ? '—' : stats?.verifiedRegistrations || 0}
          </p>
          <span className="text-[11px] text-slate-500">Eligible for room details</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Prizes Paid</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="font-display text-3xl font-extrabold text-white">
            ₹{loading ? '…' : error ? '—' : stats?.totalPrizePaid || 0}
          </p>
          <span className="text-[11px] text-slate-500">Total Pool: ₹{stats?.totalPrizePool || 0}</span>
        </div>

      </div>

      {/* Fast Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        <Link
          to="/admin/registrations"
          className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] hover:border-brand-orange/60 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/30 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold uppercase text-white group-hover:text-brand-orange transition-colors">
            Verify payments
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review player UTR references, approve slots, and send confirmation emails.
          </p>
        </Link>

        <Link
          to="/admin/rooms"
          className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] hover:border-brand-cyan/60 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-950/40 text-cyan-400 flex items-center justify-center border border-cyan-500/30 group-hover:scale-105 transition-transform">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold uppercase text-white group-hover:text-cyan-400 transition-colors">
            Manage room access
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter custom room credentials and securely dispatch them via Brevo transactional email to verified participants.
          </p>
        </Link>

        <Link
          to="/admin/results"
          className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] hover:border-purple-500/60 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-950/40 text-purple-400 flex items-center justify-center border border-purple-500/30 group-hover:scale-105 transition-transform">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="font-display text-lg font-bold uppercase text-white group-hover:text-purple-400 transition-colors">
            Review & publish results
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cross-check match observer records against captain screenshots, resolve discrepancies, and publish official leaderboards.
          </p>
        </Link>

      </div>

    </div>
  );
}
