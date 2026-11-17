import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Gift, CheckCircle, Clock, X, Search } from 'lucide-react';

export default function AdminPrizes() {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState('paid');
  const [offlineRef, setOfflineRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchPrizes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/prizes');
      if (res.success) {
        setPrizes(res.prizes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const handleUpdatePayout = async (e) => {
    e.preventDefault();
    if (!selectedPrize) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.patch(`/admin/prizes/${selectedPrize._id}/payout`, {
        payoutStatus,
        offlineTransactionRef: offlineRef,
        notes,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Payout status updated successfully' });
        setSelectedPrize(null);
        fetchPrizes();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update payout' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Cash Prize Management & Payouts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Record offline UPI cash prize disbursements to tournament champions and update verification audit logs.
        </p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Prizes Table */}
      <div className="rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0E14] text-[10px] uppercase font-bold text-slate-400 border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-5">Tournament</th>
                <th className="py-3 px-5">Prize Tier</th>
                <th className="py-3 px-5">Winner</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Offline UTR / Ref</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    Loading prize records...
                  </td>
                </tr>
              ) : prizes.length > 0 ? (
                prizes.map((p) => (
                  <tr key={p._id} className="hover:bg-[#161B26]">
                    <td className="py-3 px-5 font-bold text-white">
                      {p.tournamentId?.title}
                    </td>
                    <td className="py-3 px-5 text-slate-300">{p.title}</td>
                    <td className="py-3 px-5 font-display font-bold text-white">
                      {p.winnerName}
                    </td>
                    <td className="py-3 px-5 font-display font-extrabold text-emerald-400 text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.payoutStatus === 'paid'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {p.payoutStatus}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-slate-400">
                      {p.offlineTransactionRef || 'N/A'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedPrize(p);
                          setPayoutStatus(p.payoutStatus || 'paid');
                          setOfflineRef(p.offlineTransactionRef || '');
                          setNotes(p.notes || '');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1F293D] hover:bg-brand-orange hover:text-white text-slate-300 text-xs font-bold transition-colors"
                      >
                        Update Payout
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No prize records allocated yet. Once match results are officially published, prizes will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {selectedPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#121722] border border-[#1F293D] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
              <h3 className="font-display text-lg font-bold uppercase text-white">
                Record Cash Payout
              </h3>
              <button onClick={() => setSelectedPrize(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs space-y-1">
              <p><strong>Tournament:</strong> {selectedPrize.tournamentId?.title}</p>
              <p><strong>Winner:</strong> {selectedPrize.winnerName}</p>
              <p><strong>Prize:</strong> <span className="text-emerald-400 font-bold">₹{selectedPrize.amount}</span></p>
            </div>

            <form onSubmit={handleUpdatePayout} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Payout Status</label>
                <select
                  value={payoutStatus}
                  onChange={(e) => setPayoutStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                >
                  <option value="paid">Paid (Disbursed via UPI)</option>
                  <option value="pending">Pending</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">
                  Offline UPI Transaction Ref / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TRANSFER-928172918"
                  value={offlineRef}
                  onChange={(e) => setOfflineRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Sent to Captain Rahul's UPI"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPrize(null)}
                  className="px-4 py-2 rounded-lg bg-[#161B26] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold uppercase shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Payout Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
