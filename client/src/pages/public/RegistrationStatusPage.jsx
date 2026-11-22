import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  Calendar, 
  Phone, 
  Crown, 
  Copy, 
  Check, 
  AlertCircle, 
  MessageSquare, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function RegistrationStatusPage() {
  usePageMeta('My Registrations | Rahul Esports', 'Track your Free Fire tournament registrations, admin approvals, session slots, and room delivery.');
  const { user } = useAuth();

  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminWhatsApp, setAdminWhatsApp] = useState('918114603994');
  const [copiedUtr, setCopiedUtr] = useState(null);

  // Manual lookup state (fallback / search by Ref ID)
  const [showManualLookup, setShowManualLookup] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualResult, setManualResult] = useState(null);

  useEffect(() => {
    // 1. Fetch admin whatsapp from site settings
    api.get('/settings/public')
      .then((res) => {
        if (res.success && res.settings?.adminWhatsAppNumber) {
          setAdminWhatsApp(res.settings.adminWhatsAppNumber.replace(/[^0-9]/g, ''));
        }
      })
      .catch(() => {});

    // 2. Fetch authenticated user's registrations
    const fetchRegistrations = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/registrations/my');
        if (res.success) {
          setMyRegistrations(res.registrations || []);
        }
      } catch (err) {
        setError(err.message || 'Unable to load your registrations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUtr(id);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const getLeader = (reg) => {
    if (reg.players && reg.players.length > 0) {
      const designated = reg.players.find((p) => p.isLeader);
      if (designated) return designated;
      return reg.players[0];
    }
    return reg.captain || {};
  };

  const getWhatsAppContactUrl = (reg) => {
    const leader = getLeader(reg);
    const text = encodeURIComponent(
      `Hello Admin! I have registered for "${reg.tournamentId?.title || 'Free Fire Tournament'}".\n` +
      `*Reference ID:* ${reg.referenceId}\n` +
      `*Team / Player:* ${reg.teamName || leader.name || 'Participant'}\n` +
      `*Preferred Slot:* ${reg.slotTime || reg.preferredSlot || 'Scheduled Slot'}\n` +
      `*12-Digit UTR:* ${reg.paymentDetails?.utr || 'Submitted'}\n\n` +
      `Please check and approve my registration status!`
    );
    return `https://wa.me/${adminWhatsApp}?text=${text}`;
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!refInput.trim()) return;

    setManualLoading(true);
    setManualError('');
    setManualResult(null);

    try {
      const res = await api.get(`/registrations/check/${encodeURIComponent(refInput.trim())}`);
      if (res.success) {
        setManualResult(res.registration);
      }
    } catch (err) {
      setManualError(err.message || 'No registration found with this Reference ID. Please verify spelling.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
          <span>Verified Player Portal</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
          My Tournament Registrations
        </h1>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Logged in as <strong className="text-slate-200">{user?.name || user?.email}</strong>. Track your entry verification, match session slot, and Room ID delivery status below.
        </p>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-[#24171e] border border-[#49303a] text-slate-400 text-xs">
          Loading your registrations...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 rounded bg-[#24171e] text-white hover:bg-brand-orange text-[11px] font-bold"
          >
            Retry
          </button>
        </div>
      ) : myRegistrations.length > 0 ? (
        <div className="space-y-6">
          {myRegistrations.map((reg) => {
            const leader = getLeader(reg);
            const isPending = reg.paymentStatus === 'pending' || reg.paymentStatus === 'under_review';
            const isVerified = reg.paymentStatus === 'verified';
            const isRejected = reg.paymentStatus === 'rejected';

            return (
              <div
                key={reg._id}
                className="rounded-2xl bg-[#24171e] border border-[#49303a] overflow-hidden shadow-xl space-y-5 p-6 sm:p-7"
              >
                {/* Card Top: Reference ID & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#36212c] pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Registration Reference
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold text-brand-orange">
                        {reg.referenceId}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(reg.referenceId, `ref-${reg._id}`)}
                        className="text-slate-400 hover:text-white"
                        title="Copy Reference ID"
                      >
                        {copiedUtr === `ref-${reg._id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 text-xs font-bold uppercase tracking-wider">
                        <CheckCircle className="w-4 h-4 text-emerald-400" /> Slot Approved
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/50 text-xs font-bold uppercase tracking-wider">
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" /> Pending Admin Review
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-500/50 text-xs font-bold uppercase tracking-wider">
                        <XCircle className="w-4 h-4 text-rose-400" /> Payment Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Tournament & Match Session Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#160e13] border border-[#49303a] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Tournament</span>
                    <span className="text-white font-bold text-sm block">
                      {reg.tournamentId?.title || 'Free Fire Tournament'}
                    </span>
                    <span className="text-slate-400 text-[11px] uppercase">
                      {reg.format} · ₹{reg.tournamentId?.entryFee || 29} Entry
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#160e13] border border-[#49303a] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Preferred Session Slot</span>
                    <span className="text-amber-300 font-bold text-sm block uppercase">
                      {reg.preferredSlot || 'Morning'}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono block">
                      {reg.slotTime || '10:00 AM – 12:30 PM'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#160e13] border border-[#49303a] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted UPI UTR</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono font-bold text-sm truncate">
                        {reg.paymentDetails?.utr || 'Not provided'}
                      </span>
                      {reg.paymentDetails?.utr && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(reg.paymentDetails.utr, `utr-${reg._id}`)}
                          className="text-slate-400 hover:text-white shrink-0 ml-1"
                          title="Copy UTR"
                        >
                          {copiedUtr === `utr-${reg._id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">Payment via UPI QR</span>
                  </div>
                </div>

                {/* Squad Roster & Team Leader */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      {reg.format === 'squad' ? `Team Roster: ${reg.teamName}` : 'Player Information'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Room credentials sent to Team Leader
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {reg.players && reg.players.length > 0 ? (
                      reg.players.map((p, idx) => {
                        const isLeader = p.isLeader || (idx === 0 && !reg.players.some((x) => x.isLeader));
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                              isLeader
                                ? 'bg-amber-950/30 border-amber-500/40 text-white'
                                : 'bg-[#160e13] border-[#49303a] text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isLeader ? (
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <span className="w-3.5 text-slate-500 font-mono text-[10px] text-center">#{idx + 1}</span>
                              )}
                              <span className="font-bold">{p.name || p.inGameName}</span>
                              {isLeader && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase border border-amber-500/40">
                                  Leader
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              {p.phone || 'No phone'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-2.5 rounded-xl bg-[#160e13] border border-[#49303a] text-xs text-white">
                        {reg.captain?.name} ({reg.captain?.phone})
                      </div>
                    )}
                  </div>
                </div>

                {/* Status-Specific Interactive Action Box */}
                {isPending && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-amber-200 block font-display uppercase tracking-wide">
                          Under Review — Slot Will Be Approved Soon
                        </strong>
                        <p className="text-amber-300/80 leading-relaxed">
                          Your registration has been recorded. Admin is actively verifying your UPI UTR payment and scheduling the match session. If slot is unavailable or you need fast-track confirmation, please tap the WhatsApp button below.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-500/20">
                      <span className="text-[11px] text-amber-200/70">
                        Admin WhatsApp: +91 81146 03994
                      </span>
                      <a
                        href={getWhatsAppContactUrl(reg)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Contact Admin on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

                {isVerified && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-emerald-200 block font-display uppercase tracking-wide">
                          Payment Verified & Slot Confirmed!
                        </strong>
                        <p className="text-emerald-300/80 leading-relaxed">
                          Your match slot is locked in for the <strong className="text-white uppercase">{reg.preferredSlot} ({reg.slotTime})</strong> session. Free Fire Custom Room ID and Password will be sent to the Team Leader’s WhatsApp ({leader.phone || reg.captain?.phone}) 15–20 minutes before match kick-off.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-emerald-500/20 text-[11px]">
                      <span className="text-emerald-200/70">
                        Room Status: {reg.roomCredentialStatus === 'sent' ? 'Dispatched to Email & WhatsApp' : 'Scheduled before match'}
                      </span>
                      <a
                        href={getWhatsAppContactUrl(reg)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-300 hover:underline font-bold"
                      >
                        <span>Need assistance? Chat with Admin</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <strong className="text-rose-200 block font-display uppercase tracking-wide">
                          Registration Verification Declined
                        </strong>
                        <p className="text-rose-300/80 leading-relaxed">
                          Reason: {reg.paymentDetails?.rejectionReason || 'UTR could not be verified or duplicate screenshot submitted.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end border-t border-rose-500/20">
                      <a
                        href={getWhatsAppContactUrl(reg)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contact Admin to Rectify</span>
                      </a>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-brand-orange mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold uppercase text-white">
              No Registrations Found
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven’t registered for any Free Fire tournaments yet. Browse upcoming matches, select your squad session slot, and compete for weekly cash prizes!
            </p>
          </div>
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-amber font-display font-bold uppercase text-white text-xs tracking-wider transition-colors shadow-glow-orange"
          >
            <span>Browse Tournaments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Collapsible: Track Another Reference ID Manually */}
      <div className="pt-4 border-t border-[#36212c]">
        <button
          type="button"
          onClick={() => setShowManualLookup(!showManualLookup)}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-[#1b1017] hover:bg-[#24171e] border border-[#49303a] text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors"
        >
          <span>Need to track another Reference ID manually?</span>
          {showManualLookup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showManualLookup && (
          <div className="mt-4 p-5 rounded-xl bg-[#24171e] border border-[#49303a] space-y-4">
            <p className="text-xs text-slate-400">
              Enter any unique Reference ID (e.g., <span className="font-mono text-brand-orange">RE-FF-SQ-…</span>) to view its public verification status.
            </p>

            <form onSubmit={handleManualLookup} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Enter Reference ID (e.g. RE-FF-SQ-…)"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#160e13] border border-[#49303a] text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-brand-orange uppercase"
              />
              <button
                type="submit"
                disabled={manualLoading}
                className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-amber font-display font-bold uppercase tracking-wider text-white text-xs transition-colors shrink-0"
              >
                {manualLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {manualError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {manualError}
              </div>
            )}

            {manualResult && (
              <div className="p-4 rounded-xl bg-[#160e13] border border-[#49303a] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-brand-orange">{manualResult.referenceId}</span>
                  <span className="uppercase font-bold text-amber-300">{manualResult.paymentStatus}</span>
                </div>
                <p className="text-white font-bold">{manualResult.tournamentTitle}</p>
                <p className="text-slate-400">Team / Player: {manualResult.teamOrPlayerName}</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
