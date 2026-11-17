import React, { useState } from 'react';
import api from '../../services/api.js';
import { 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  Calendar, 
  MessageCircle, 
  AlertCircle 
} from 'lucide-react';

export default function RegistrationStatusPage() {
  const [refInput, setRefInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!refInput.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await api.get(`/registrations/check/${refInput.trim()}`);
      if (res.success) {
        setData(res.registration);
      }
    } catch (err) {
      setError(err.message || 'No registration found with this Reference ID. Please verify spelling.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 text-xs font-bold border border-emerald-500/40 uppercase">
            <CheckCircle className="w-4 h-4" /> Payment Verified & Slot Confirmed
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/80 text-blue-400 text-xs font-bold border border-blue-500/40 uppercase">
            <Clock className="w-4 h-4" /> Payment Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 text-rose-400 text-xs font-bold border border-rose-500/40 uppercase">
            <XCircle className="w-4 h-4" /> Payment Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 text-amber-400 text-xs font-bold border border-amber-500/40 uppercase">
            <Clock className="w-4 h-4" /> Payment Pending Verification
          </span>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl font-extrabold uppercase text-white tracking-wide">
          Registration Status Check
        </h1>
        <p className="text-xs text-slate-400">
          Enter your unique Reference ID (e.g., <span className="font-mono text-brand-orange">RIT-FF-SQ-00101</span>) to track payment and slot confirmation.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="Enter Reference ID (e.g. RIT-FF-SQ-XXXXX)"
            value={refInput}
            onChange={(e) => setRefInput(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl bg-[#121722] border border-[#1F293D] text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-brand-orange uppercase"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-amber font-display font-bold uppercase tracking-wider text-white text-xs transition-colors shrink-0"
        >
          {loading ? 'Checking...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {data && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F293D] pb-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Reference ID</p>
              <p className="font-mono text-xl font-bold text-brand-orange">{data.referenceId}</p>
            </div>
            <div>{getStatusBadge(data.paymentStatus)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tournament</span>
              <span className="text-white font-bold text-sm">{data.tournamentTitle}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Team / Player</span>
              <span className="text-white font-bold text-sm">{data.teamOrPlayerName}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Format</span>
              <span className="text-white font-bold text-sm uppercase">{data.format}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Room Credentials</span>
              <span className="text-white font-bold text-sm capitalize">
                {data.roomCredentialStatus === 'sent' ? '✅ Dispatched to Email' : '⏳ Scheduled before match'}
              </span>
            </div>
          </div>

          {/* Pending Payment Advice */}
          {data.paymentStatus === 'pending' && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-brand-amber/30 text-xs space-y-2">
              <p className="text-brand-amber font-bold">Action Needed: Submit Payment Screenshot</p>
              <p className="text-slate-300">
                Your slot is reserved temporarily. To confirm your entry, please send your UPI payment screenshot to the official admin WhatsApp contact.
              </p>
              <a
                href="https://wa.me/918114603994"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-400 font-bold hover:underline"
              >
                <MessageCircle className="w-4 h-4" /> Open WhatsApp with Admin (+91 8114603994)
              </a>
            </div>
          )}

          {/* Admin WhatsApp Screenshot Instructions */}
          <div className="pt-4 border-t border-[#1F293D] space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display text-sm font-bold uppercase text-white">
                Payment Receipts & Match Scoreboard Screenshots
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              All payment receipts and post-match score screenshots must be sent directly to the official tournament admin on WhatsApp with your Reference ID (<strong>{data.referenceId}</strong>).
            </p>

            <a
              href={`https://wa.me/918114603994?text=${encodeURIComponent(
                `Hello Admin!\n*Reference ID:* ${data.referenceId}\n*Tournament:* ${data.tournamentTitle}\n*Team/Player:* ${data.teamOrPlayerName}\nAttached is my payment receipt / match scoreboard screenshot.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Send Screenshot to Admin on WhatsApp (+91 8114603994)
            </a>
          </div>

        </div>
      )}

    </div>
  );
}
