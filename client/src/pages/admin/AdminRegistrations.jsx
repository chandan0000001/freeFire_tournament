import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Mail,
  Phone,
  X,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Crown,
  Users,
  MessageSquare
} from 'lucide-react';

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [selectedReg, setSelectedReg] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');
  const [copiedUtr, setCopiedUtr] = useState(null);

  const fetchTournamentsList = async () => {
    try {
      const res = await api.get('/tournaments');
      if (res.success) setTournaments(res.tournaments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTournament) params.append('tournamentId', selectedTournament);
      if (selectedStatus) params.append('paymentStatus', selectedStatus);
      if (search) params.append('search', search);

      const res = await api.get(`/admin/registrations?${params.toString()}`);
      if (res.success) {
        setRegistrations(res.registrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch registrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentsList();
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedTournament, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const openVerifyModal = (reg) => {
    setSelectedReg(reg);
    setUtrInput(reg.paymentDetails?.utr || '');
    setAdminNotes(reg.paymentDetails?.notes || '');
    setRejectionReason('');
    setActionError('');
  };

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

  const getWhatsAppLink = (phone, text) => {
    if (!phone) return '#';
    const clean = phone.replace(/[^0-9]/g, '');
    const fullPhone = clean.length === 10 ? `91${clean}` : clean;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  };

  const submitPaymentDecision = async (status) => {
    if (!selectedReg) return;
    setSubmittingAction(true);
    setActionError('');

    try {
      const payload = {
        status,
        utr: utrInput,
        notes: adminNotes,
        rejectionReason,
      };

      const res = await api.patch(`/admin/registrations/${selectedReg._id}/payment`, payload);
      if (res.success) {
        setSelectedReg(null);
        fetchRegistrations();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to update payment status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRemoveRegistration = async (reg) => {
    if (!reg) return;
    const name = reg.teamName || reg.captain?.name || reg.referenceId;
    if (!window.confirm(`Permanently remove registration ${reg.referenceId} (${name})? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/registrations/${reg._id}`);
      if (res.success) {
        if (selectedReg?._id === reg._id) setSelectedReg(null);
        fetchRegistrations();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove registration');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 text-[11px] font-bold border border-emerald-500/40 uppercase">
            Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 text-[11px] font-bold border border-rose-500/40 uppercase">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 text-[11px] font-bold border border-amber-500/40 uppercase">
            Pending
          </span>
        );
    }
  };

  const renderSlotBadge = (reg) => {
    const slot = reg.preferredSlot || 'morning';
    const time = reg.slotTime || (
      slot === 'morning' ? '10:00 AM – 12:30 PM' :
      slot === 'afternoon' ? '2:00 PM – 4:30 PM' :
      '6:00 PM – 8:30 PM'
    );
    const colorMap = {
      morning: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
      afternoon: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
      evening: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40',
    };
    const badgeClass = colorMap[slot] || colorMap.morning;
    return (
      <div className="space-y-0.5">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeClass}`}>
          {slot}
        </span>
        <span className="block text-[11px] text-slate-400 font-mono">{time}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Registrations & Manual UPI Payments
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review player applications, verify UPI UTR numbers sent via WhatsApp, manage session slots, and contact team leaders.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#24171e] border border-[#49303a] flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tournament Dropdown */}
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.format})
              </option>
            ))}
          </select>

          {/* Payment Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">All Payment Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified & Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search Ref ID, Name, Phone, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

      </div>

      {/* Registrations Table */}
      <div className="rounded-2xl bg-[#24171e] border border-[#49303a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#160e13] text-[10px] uppercase font-bold text-slate-400 border-b border-[#49303a]">
              <tr>
                <th className="py-3 px-5">Ref ID</th>
                <th className="py-3 px-5">Tournament</th>
                <th className="py-3 px-5">Preferred Slot</th>
                <th className="py-3 px-5">Team / Players</th>
                <th className="py-3 px-5">Team Leader (Room Contact)</th>
                <th className="py-3 px-5 text-center">Payment & UTR</th>
                <th className="py-3 px-5 text-center">Room Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#49303a] text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length > 0 ? (
                registrations.map((reg) => {
                  const leader = getLeader(reg);
                  const leaderPhone = leader.phone || reg.captain?.phone || '';
                  const utr = reg.paymentDetails?.utr;
                  const waText = `Hello ${leader.name || 'Player'}! Regarding your Rahul Esports registration ${reg.referenceId} for "${reg.tournamentId?.title || 'Tournament'}" (Preferred slot: ${reg.preferredSlot || 'Morning'})...`;

                  return (
                    <tr key={reg._id} className="hover:bg-[#301e27] transition-colors">
                      {/* Ref ID */}
                      <td className="py-3 px-5 font-mono font-bold text-brand-orange whitespace-nowrap">
                        {reg.referenceId}
                      </td>

                      {/* Tournament */}
                      <td className="py-3 px-5">
                        <span className="font-bold text-white block">{reg.tournamentId?.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{reg.format} (₹{reg.tournamentId?.entryFee})</span>
                      </td>

                      {/* Preferred Session Slot */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        {renderSlotBadge(reg)}
                      </td>

                      {/* Participant / Team */}
                      <td className="py-3 px-5">
                        <strong className="text-white">
                          {reg.format === 'squad' ? reg.teamName : (reg.players[0]?.inGameName || reg.captain?.name)}
                        </strong>
                        <span className="text-[10px] text-slate-400 block line-clamp-1">
                          {reg.players.map((p) => p.name || p.inGameName).filter(Boolean).join(', ')}
                        </span>
                      </td>

                      {/* Team Leader & WhatsApp */}
                      <td className="py-3 px-5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-slate-200 font-semibold">{leader.name || reg.captain?.name}</span>
                        </div>
                        {leaderPhone && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-400">{leaderPhone}</span>
                            <a
                              href={getWhatsAppLink(leaderPhone, waText)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/70 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-colors"
                              title="Message Team Leader on WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Payment & UTR */}
                      <td className="py-3 px-5 text-center space-y-1">
                        <div>{getStatusBadge(reg.paymentStatus)}</div>
                        {utr ? (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(utr, reg._id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#160e13] hover:bg-[#301e27] border border-[#49303a] font-mono text-[10px] text-slate-300 transition-colors"
                            title="Click to copy UTR"
                          >
                            <span>UTR: {utr}</span>
                            {copiedUtr === reg._id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic block">No UTR</span>
                        )}
                      </td>

                      {/* Room Status */}
                      <td className="py-3 px-5 text-center">
                        <span className="text-[11px] text-slate-400 capitalize">
                          {reg.roomCredentialStatus === 'sent' ? 'Sent' : 'Pending'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openVerifyModal(reg)}
                            className="px-3 py-1.5 rounded-lg bg-[#49303a] hover:bg-brand-orange hover:text-white text-slate-300 text-xs font-bold transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleRemoveRegistration(reg)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-colors flex items-center gap-1"
                            title="Permanently remove registration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-500">
                    No registrations found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification / Action Modal */}
      {selectedReg && (() => {
        const leader = getLeader(selectedReg);
        const leaderPhone = leader.phone || selectedReg.captain?.phone || '';
        const waText = `Hello ${leader.name || 'Team Leader'}! This is Rahul Esports admin regarding your registration ${selectedReg.referenceId} for "${selectedReg.tournamentId?.title}".\n\nChosen Session: ${selectedReg.slotTime || selectedReg.preferredSlot}\nStatus: ${selectedReg.paymentStatus === 'verified' ? 'Slot Confirmed!' : 'Verifying payment'}`;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-[#24171e] border border-[#49303a] p-6 space-y-5 shadow-2xl my-8">
              
              <div className="flex items-center justify-between border-b border-[#49303a] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-orange">Review Registration & Payment</span>
                  <h3 className="font-display text-xl font-bold uppercase text-white">
                    {selectedReg.referenceId}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                  {actionError}
                </div>
              )}

              {/* Tournament & Slot Summary */}
              <div className="space-y-2 text-xs text-slate-300 bg-[#160e13] p-4 rounded-xl border border-[#49303a]">
                <div className="flex justify-between items-center border-b border-[#2d1b26] pb-2">
                  <span className="text-slate-400">Tournament:</span>
                  <span className="text-white font-bold">{selectedReg.tournamentId?.title} (₹{selectedReg.tournamentId?.entryFee})</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#2d1b26] pb-2">
                  <span className="text-slate-400">Preferred Session:</span>
                  <span className="text-amber-400 font-bold uppercase">{selectedReg.preferredSlot} ({selectedReg.slotTime})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Team / Player Name:</span>
                  <span className="text-white font-bold">{selectedReg.teamName || selectedReg.players[0]?.inGameName}</span>
                </div>
              </div>

              {/* Roster & Team Leader Highlight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase">
                    Squad Roster & Designated Leader
                  </span>
                  {leaderPhone && (
                    <a
                      href={getWhatsAppLink(leaderPhone, waText)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Leader</span>
                    </a>
                  )}
                </div>

                <div className="space-y-1.5">
                  {selectedReg.players && selectedReg.players.length > 0 ? (
                    selectedReg.players.map((p, idx) => {
                      const isLeader = p.isLeader || (idx === 0 && !selectedReg.players.some((pl) => pl.isLeader));
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                            isLeader
                              ? 'bg-amber-950/40 border-amber-500/50 text-white'
                              : 'bg-[#160e13] border-[#49303a] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isLeader ? (
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <span className="w-3.5 text-center text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                            )}
                            <span className="font-bold">{p.name || p.inGameName}</span>
                            {isLeader && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase border border-amber-500/40">
                                Team Leader
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
                    <div className="p-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-slate-300">
                      {selectedReg.captain?.name} ({selectedReg.captain?.phone})
                    </div>
                  )}
                </div>
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  UPI Reference / UTR Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 429819283741"
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                  {utrInput && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(utrInput, 'modal-utr')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="Copy UTR"
                    >
                      {copiedUtr === 'modal-utr' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Internal Admin Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified via WhatsApp screenshot, slot confirmed"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Rejection Reason (only needed if rejecting) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Rejection Reason (if declining)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invalid UTR or duplicate payment screenshot"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#49303a]">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleRemoveRegistration(selectedReg)}
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 border border-rose-500/30 font-bold uppercase text-[11px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Remove Permanently
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => submitPaymentDecision('rejected')}
                    className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold uppercase tracking-wider text-white text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>

                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={() => submitPaymentDecision('verified')}
                    className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold uppercase tracking-wider text-white text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Verify & Confirm Slot
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
