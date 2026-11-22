import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  AlertCircle,
  Copy,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export default function AdminWithdrawals() {
  usePageMeta('Coin Withdrawals & Wallet Control | Rahul Esports Admin', 'Review player withdrawal requests, approve UPI payouts, and verify coin deposit requests.');

  const [activeTab, setActiveTab] = useState('withdrawals'); // 'withdrawals' | 'deposits' | 'adjust'
  const [withdrawals, setWithdrawals] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState({ pendingCount: 0, totalPaidInr: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [payoutUtr, setPayoutUtr] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Manual Adjust Form state
  const [adjustEmail, setAdjustEmail] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('DEPOSIT');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'withdrawals') {
        const res = await api.get('/admin/withdrawals');
        if (res.success) {
          setWithdrawals(res.withdrawals || []);
          setStats(res.stats || { pendingCount: 0, totalPaidInr: 0 });
        }
      } else if (activeTab === 'deposits') {
        const res = await api.get('/admin/deposits');
        if (res.success) {
          setDeposits(res.deposits || []);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (e) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/admin/withdrawals/${selectedWithdrawal._id}/approve`, {
        payoutUtr: payoutUtr.trim() || 'MANUAL_UPI_PAID',
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setSelectedWithdrawal(null);
        setPayoutUtr('');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithdrawal = async (e) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/admin/withdrawals/${selectedWithdrawal._id}/reject`, {
        rejectionReason: rejectReason.trim() || 'Rejected by administrator',
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setSelectedWithdrawal(null);
        setShowRejectModal(false);
        setRejectReason('');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveDeposit = async (id) => {
    if (!window.confirm('Confirm that you received UPI payment for this UTR and wish to credit coins?')) return;
    try {
      const res = await api.post(`/admin/deposits/${id}/approve`);
      if (res.success) {
        setSuccessMsg(res.message);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to approve deposit');
    }
  };

  const handleRejectDeposit = async (id) => {
    const reason = window.prompt('Enter rejection reason (e.g. UTR not found, invalid amount):');
    if (!reason) return;
    try {
      const res = await api.post(`/admin/deposits/${id}/reject`, { adminNote: reason });
      if (res.success) {
        setSuccessMsg(res.message);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to reject deposit');
    }
  };

  const handleManualAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjustLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/admin/wallets/manual-adjust', {
        userEmail: adjustEmail.trim(),
        amount: parseInt(adjustAmount, 10),
        coinType: adjustType,
        reason: adjustReason.trim(),
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setAdjustAmount('');
        setAdjustReason('');
      }
    } catch (err) {
      setError(err.message || 'Failed to adjust coins');
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-white tracking-wide flex items-center gap-2">
            <Coins className="w-6 h-6 text-brand-orange" />
            <span>Coin Withdrawals & Wallet Control</span>
          </h1>
          <p className="text-xs text-slate-400">
            Review player withdrawal payout requests, approve coin deposits, and manage player wallet balances.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#301e27] hover:bg-[#49303a] text-slate-200 text-xs font-bold border border-[#243048]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#24171e] border border-amber-500/30">
          <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Pending Withdrawals</span>
          <span className="font-display text-2xl font-extrabold text-white mt-1 block">
            {stats.pendingCount} Requests
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#24171e] border border-emerald-500/30">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Total Disbursed (Paid Out)</span>
          <span className="font-display text-2xl font-extrabold text-emerald-400 mt-1 block">
            ₹{stats.totalPaidInr}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#24171e] border border-[#49303a]">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Coin Economy Rate</span>
          <span className="font-display text-2xl font-extrabold text-brand-orange mt-1 block">
            1 Coin = ₹1 INR
          </span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#49303a] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'withdrawals'
              ? 'bg-brand-orange text-white shadow-glow-orange'
              : 'text-slate-400 hover:text-white bg-[#24171e]'
          }`}
        >
          Withdrawal Requests ({withdrawals.filter(w => w.status === 'PENDING').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'deposits'
              ? 'bg-brand-orange text-white shadow-glow-orange'
              : 'text-slate-400 hover:text-white bg-[#24171e]'
          }`}
        >
          Deposit Verification ({deposits.filter(d => d.status === 'PENDING').length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adjust')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'adjust'
              ? 'bg-[#49303a] text-white'
              : 'text-slate-400 hover:text-white bg-[#24171e]'
          }`}
        >
          Manual Coin Adjustment
        </button>
      </div>

      {/* TAB 1: WITHDRAWAL REQUESTS */}
      {activeTab === 'withdrawals' && (
        <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4 shadow-xl">
          <h3 className="font-display text-base font-bold text-white uppercase">
            Player Payout Requests
          </h3>

          {withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#1b1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#49303a]">
                  <tr>
                    <th className="p-3">Reference / Date</th>
                    <th className="p-3">Player Info</th>
                    <th className="p-3">Coins / Amount</th>
                    <th className="p-3">Player UPI ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#412a34]">
                  {withdrawals.map((w) => (
                    <tr key={w._id} className="hover:bg-[#141A26] transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-slate-300 font-bold block">{w.referenceId}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(w.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-white font-semibold block">{w.playerName || w.userEmail}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{w.userEmail}</span>
                        {w.freeFireUid && <span className="text-[10px] text-brand-orange block">UID: {w.freeFireUid}</span>}
                      </td>
                      <td className="p-3">
                        <span className="font-display font-black text-emerald-400 text-sm block">
                          ₹{w.amountInr}
                        </span>
                        <span className="text-[10px] text-slate-400">{w.coinsRequested} Winning Coins</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <code className="px-2 py-1 rounded bg-[#1b1017] border border-emerald-500/30 text-emerald-300 font-mono text-xs">
                            {w.upiId}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(w.upiId);
                              alert(`Copied ${w.upiId} to clipboard!`);
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy UPI ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          w.status === 'APPROVED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : w.status === 'PENDING'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                        }`}>
                          {w.status}
                        </span>
                        {w.payoutUtr && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            UTR: {w.payoutUtr}
                          </span>
                        )}
                        {w.rejectionReason && (
                          <span className="block text-[10px] text-rose-400 mt-0.5">
                            Reason: {w.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setShowRejectModal(false);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Pay & Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setShowRejectModal(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 font-bold text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No withdrawal requests submitted yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPOSIT VERIFICATION */}
      {activeTab === 'deposits' && (
        <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4 shadow-xl">
          <h3 className="font-display text-base font-bold text-white uppercase">
            Coin Purchase Requests (UTR Verification)
          </h3>

          {deposits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#1b1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#49303a]">
                  <tr>
                    <th className="p-3">Reference / Date</th>
                    <th className="p-3">Player Email</th>
                    <th className="p-3">Coins to Credit</th>
                    <th className="p-3">Submitted UTR</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#412a34]">
                  {deposits.map((d) => (
                    <tr key={d._id} className="hover:bg-[#141A26] transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-slate-300 font-bold block">{d.referenceId}</span>
                        <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{d.userEmail}</td>
                      <td className="p-3 font-display font-extrabold text-sm text-brand-orange">
                        🪙 {d.coinsRequested} (₹{d.amountInr})
                      </td>
                      <td className="p-3">
                        <code className="px-2 py-1 rounded bg-[#1b1017] border border-[#49303a] text-brand-amber font-mono text-xs">
                          {d.utrNumber}
                        </code>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          d.status === 'APPROVED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                            : d.status === 'PENDING'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {d.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveDeposit(d._id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Credit Coins
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectDeposit(d._id)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 font-bold text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs">
              No coin purchase requests recorded.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL COIN ADJUSTMENT */}
      {activeTab === 'adjust' && (
        <div className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] max-w-xl space-y-4 shadow-xl">
          <h3 className="font-display text-base font-bold text-white uppercase">
            Manual Coin Grant / Deduction
          </h3>
          <p className="text-xs text-slate-400">
            Credit bonus coins or correct wallet balances for any player email directly.
          </p>

          <form onSubmit={handleManualAdjustSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Player / Captain Email
              </label>
              <input
                type="email"
                required
                value={adjustEmail}
                onChange={(e) => setAdjustEmail(e.target.value)}
                placeholder="player@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm focus:border-brand-orange"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Coins Amount (e.g. 50 or -50)
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm font-bold focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Coin Category
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm focus:border-brand-orange"
                >
                  <option value="DEPOSIT">Deposit Coins (Tournament Play)</option>
                  <option value="WINNING">Winning Coins (Withdrawable)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Reason / Audit Note
              </label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Compensation for match cancellation / Promotional grant"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm focus:border-brand-orange"
              />
            </div>

            <button
              type="submit"
              disabled={adjustLoading}
              className="w-full py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-display font-bold uppercase tracking-wider text-xs sm:text-sm shadow-glow-orange transition-all"
            >
              {adjustLoading ? 'Adjusting...' : 'Confirm Coin Adjustment'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: APPROVE WITHDRAWAL */}
      {selectedWithdrawal && !showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#24171e] border border-[#49303a] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Approve Payout: ₹{selectedWithdrawal.amountInr}
            </h3>
            
            <div className="p-3 rounded-xl bg-[#1b1017] border border-[#49303a] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Player:</span>
                <span className="text-white font-semibold">{selectedWithdrawal.playerName || selectedWithdrawal.userEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">UPI ID:</span>
                <code className="text-emerald-400 font-mono font-bold">{selectedWithdrawal.upiId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coins Deducted:</span>
                <span className="text-amber-400 font-bold">{selectedWithdrawal.coinsRequested} Winning Coins</span>
              </div>
            </div>

            <form onSubmit={handleApproveWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Bank / UPI Payment UTR (Optional)
                </label>
                <input
                  type="text"
                  value={payoutUtr}
                  onChange={(e) => setPayoutUtr(e.target.value)}
                  placeholder="Paste bank transfer reference or UTR"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm font-mono focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Mark as Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT WITHDRAWAL */}
      {selectedWithdrawal && showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#24171e] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white uppercase text-rose-400">
              Reject Withdrawal & Refund Coins
            </h3>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Rejecting this request will immediately release and return <strong>{selectedWithdrawal.coinsRequested} coins</strong> back to {selectedWithdrawal.userEmail}'s wallet.
            </p>

            <form onSubmit={handleRejectWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows="3"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid UPI ID / Account suspended / Free Fire UID mismatch"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setShowRejectModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase shadow-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
