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
  Trash2
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

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Registrations & Manual UPI Payments
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review player applications, verify UPI UTR numbers sent via WhatsApp, and authorize room admission.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#121722] border border-[#1F293D] flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tournament Dropdown */}
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-brand-orange"
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
            className="px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">All Payment Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified & Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search Ref ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

      </div>

      {/* Registrations Table */}
      <div className="rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0B0E14] text-[10px] uppercase font-bold text-slate-400 border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-5">Ref ID</th>
                <th className="py-3 px-5">Tournament</th>
                <th className="py-3 px-5">Participant / Team</th>
                <th className="py-3 px-5">Captain Info</th>
                <th className="py-3 px-5 text-center">Payment</th>
                <th className="py-3 px-5 text-center">Room Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    Loading registrations...
                  </td>
                </tr>
              ) : registrations.length > 0 ? (
                registrations.map((reg) => (
                  <tr key={reg._id} className="hover:bg-[#161B26] transition-colors">
                    <td className="py-3 px-5 font-mono font-bold text-brand-orange">
                      {reg.referenceId}
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-bold text-white block">{reg.tournamentId?.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{reg.format} (₹{reg.tournamentId?.entryFee})</span>
                    </td>
                    <td className="py-3 px-5">
                      <strong className="text-white">
                        {reg.format === 'squad' ? reg.teamName : reg.players[0]?.inGameName}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">
                        {reg.players.map((p) => p.inGameName).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-5 space-y-0.5">
                      <div className="text-slate-300 font-medium">{reg.captain.name} ({reg.captain.collegeRollNo})</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> {reg.captain.phone}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {getStatusBadge(reg.paymentStatus)}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="text-[11px] text-slate-400 capitalize">
                        {reg.roomCredentialStatus === 'sent' ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openVerifyModal(reg)}
                          className="px-3 py-1.5 rounded-lg bg-[#1F293D] hover:bg-brand-orange hover:text-white text-slate-300 text-xs font-bold transition-colors"
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
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    No registrations found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification / Action Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#121722] border border-[#1F293D] p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-orange">Review Payment</span>
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

            <div className="space-y-2 text-xs text-slate-300 bg-[#0B0E14] p-4 rounded-xl border border-[#1F293D]">
              <p><strong>Tournament:</strong> {selectedReg.tournamentId?.title}</p>
              <p><strong>Team / Player:</strong> {selectedReg.teamName || selectedReg.players[0]?.inGameName}</p>
              <p><strong>Captain:</strong> {selectedReg.captain.name} ({selectedReg.captain.phone})</p>
              <p><strong>Email:</strong> {selectedReg.captain.email}</p>
              <p><strong>Entry Fee:</strong> ₹{selectedReg.tournamentId?.entryFee}</p>
            </div>

            {/* UTR Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                UPI Reference / UTR Number
              </label>
              <input
                type="text"
                placeholder="e.g. 429819283741"
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Internal Admin Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Verified via WhatsApp screenshot"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-brand-orange"
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
                className="w-full px-3.5 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1F293D]">
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
      )}

    </div>
  );
}
