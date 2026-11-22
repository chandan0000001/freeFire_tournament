import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api.js';
import { 
  Gift, 
  CheckCircle, 
  Clock, 
  X, 
  Search, 
  PlusCircle, 
  Trash2, 
  Trophy, 
  AlertCircle, 
  DollarSign, 
  Users,
  Award,
  Crown
} from 'lucide-react';

export default function AdminPrizes() {
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Filters & Search
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Update Payout Modal
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState('paid');
  const [offlineRef, setOfflineRef] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Allocate New Prize Modal
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [tournamentsList, setTournamentsList] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [verifiedTeams, setVerifiedTeams] = useState([]);
  const [modalRank, setModalRank] = useState(1);
  const [modalTitle, setModalTitle] = useState('1st Place Winner (Booyah Champion)');
  const [modalAmount, setModalAmount] = useState('');
  const [modalWinnerName, setModalWinnerName] = useState('');
  const [modalWinnerRegId, setModalWinnerRegId] = useState('');
  const [modalPayoutStatus, setModalPayoutStatus] = useState('pending');
  const [modalOfflineRef, setModalOfflineRef] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [submittingAllocate, setSubmittingAllocate] = useState(false);

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

  // Open Allocate Prize Modal
  const openAllocateModal = async () => {
    setIsAllocateModalOpen(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get('/tournaments');
      if (res.success && Array.isArray(res.tournaments)) {
        setTournamentsList(res.tournaments);
        if (res.tournaments.length > 0) {
          handleTournamentSelect(res.tournaments[0]._id, res.tournaments);
        }
      }
    } catch (err) {
      console.error('Failed to load tournaments list', err);
    }
  };

  // Tournament Selected inside Allocate Modal
  const handleTournamentSelect = async (tId, list = tournamentsList) => {
    setSelectedTournamentId(tId);
    const tObj = list.find((t) => t._id === tId) || null;
    setSelectedTournament(tObj);

    if (tObj) {
      setModalAmount(tObj.prizeConfig?.firstPlace || tObj.prizeConfig?.totalPool || 120);
    }

    try {
      const regRes = await api.get(`/admin/registrations?tournamentId=${tId}&paymentStatus=verified`);
      const teams = regRes.registrations || [];
      setVerifiedTeams(teams);
      if (teams.length > 0) {
        setModalWinnerName(teams[0].teamName || teams[0].captain?.name || '');
        setModalWinnerRegId(teams[0]._id);
      } else {
        setModalWinnerName('');
        setModalWinnerRegId('');
      }
    } catch (err) {
      console.error('Failed to load verified teams', err);
    }
  };

  // Rank changed inside Allocate Modal
  const handleRankChange = (rank) => {
    const r = parseInt(rank, 10);
    setModalRank(r);
    if (r === 1) {
      setModalTitle('1st Place Winner (Booyah Champion)');
      if (selectedTournament?.prizeConfig?.firstPlace) {
        setModalAmount(selectedTournament.prizeConfig.firstPlace);
      }
    } else if (r === 2) {
      setModalTitle('2nd Place (Runner-Up)');
      if (selectedTournament?.prizeConfig?.secondPlace) {
        setModalAmount(selectedTournament.prizeConfig.secondPlace);
      }
    } else if (r === 3) {
      setModalTitle('3rd Place');
      if (selectedTournament?.prizeConfig?.thirdPlace) {
        setModalAmount(selectedTournament.prizeConfig.thirdPlace);
      }
    } else {
      setModalTitle('Tournament MVP / Special Award');
    }
  };

  // Create Prize Submission
  const handleCreatePrize = async (e) => {
    e.preventDefault();
    if (!selectedTournamentId || !modalAmount || !modalWinnerName.trim()) {
      alert('Please fill in tournament, amount, and winner name.');
      return;
    }

    setSubmittingAllocate(true);
    try {
      const res = await api.post('/admin/prizes', {
        tournamentId: selectedTournamentId,
        rank: modalRank,
        title: modalTitle,
        amount: parseFloat(modalAmount),
        winnerRegistrationId: modalWinnerRegId || null,
        winnerName: modalWinnerName.trim(),
        payoutStatus: modalPayoutStatus,
        offlineTransactionRef: modalOfflineRef.trim(),
        notes: modalNotes.trim(),
      });

      if (res.success) {
        setIsAllocateModalOpen(false);
        setMessage({ type: 'success', text: `Cash prize of ₹${modalAmount} allocated to "${modalWinnerName}".` });
        fetchPrizes();
      }
    } catch (err) {
      alert(err.message || 'Failed to allocate prize record');
    } finally {
      setSubmittingAllocate(false);
    }
  };

  // Update Payout Status Submission
  const handleUpdatePayout = async (e) => {
    e.preventDefault();
    if (!selectedPrize) return;

    setSubmittingPayout(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.patch(`/admin/prizes/${selectedPrize._id}/payout`, {
        payoutStatus,
        offlineTransactionRef: offlineRef,
        notes,
      });

      if (res.success) {
        setMessage({ type: 'success', text: `Payout status updated to ${payoutStatus.toUpperCase()}` });
        setSelectedPrize(null);
        fetchPrizes();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update payout' });
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Delete Prize
  const handleDeletePrize = async (pId, winner) => {
    if (!window.confirm(`Permanently delete the prize record for "${winner}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/prizes/${pId}`);
      if (res.success) {
        setMessage({ type: 'success', text: 'Prize record deleted successfully.' });
        fetchPrizes();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete prize record');
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalAllocated = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let countPaid = 0;
    let countPending = 0;

    prizes.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalAllocated += amt;
      if (p.payoutStatus === 'paid') {
        totalPaid += amt;
        countPaid++;
      } else {
        totalPending += amt;
        countPending++;
      }
    });

    return { totalAllocated, totalPaid, totalPending, countPaid, countPending };
  }, [prizes]);

  // Filtered List
  const filteredPrizes = useMemo(() => {
    return prizes.filter((p) => {
      if (tournamentFilter && p.tournamentId?._id !== tournamentFilter) return false;
      if (statusFilter && p.payoutStatus !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const winner = (p.winnerName || '').toLowerCase();
        const ref = (p.offlineTransactionRef || '').toLowerCase();
        const tTitle = (p.tournamentId?.title || '').toLowerCase();
        if (!winner.includes(s) && !ref.includes(s) && !tTitle.includes(s)) return false;
      }
      return true;
    });
  }, [prizes, tournamentFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
            Cash Prize Management & Payouts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Record offline UPI cash prize disbursements to tournament champions and update verification audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={openAllocateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider shadow-glow-orange flex items-center gap-2 shrink-0 self-start sm:self-auto transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Allocate Cash Prize Record</span>
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#24171e] border border-[#49303a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Prizes Allocated
            </span>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-white mt-1 block">
              ₹{stats.totalAllocated}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Across {prizes.length} prize {prizes.length === 1 ? 'tier' : 'tiers'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#24171e] border border-[#49303a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
              Disbursed via UPI (Paid)
            </span>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400 mt-1 block">
              ₹{stats.totalPaid}
            </span>
            <span className="text-[10px] text-emerald-500 font-medium">
              {stats.countPaid} {stats.countPaid === 1 ? 'payout' : 'payouts'} verified & sent
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#24171e] border border-[#49303a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
              Pending Disbursal
            </span>
            <span className="text-xl sm:text-2xl font-display font-extrabold text-amber-400 mt-1 block">
              ₹{stats.totalPending}
            </span>
            <span className="text-[10px] text-amber-500 font-medium">
              {stats.countPending} {stats.countPending === 1 ? 'prize' : 'prizes'} waiting for UPI transfer
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-[#24171e] border border-[#49303a] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="on_hold">On Hold</option>
          </select>

          <span className="text-xs text-slate-400 font-medium ml-1">
            Showing <strong>{filteredPrizes.length}</strong> of {prizes.length} records
          </span>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search winner, UTR, or tournament..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Prizes Table */}
      <div className="rounded-2xl bg-[#24171e] border border-[#49303a] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#160e13] text-[10px] uppercase font-bold text-slate-400 border-b border-[#49303a]">
              <tr>
                <th className="py-3 px-5">Tournament</th>
                <th className="py-3 px-5">Prize Tier</th>
                <th className="py-3 px-5">Winner</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Offline UTR / Ref</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#49303a]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    Loading prize records...
                  </td>
                </tr>
              ) : filteredPrizes.length > 0 ? (
                filteredPrizes.map((p) => (
                  <tr key={p._id} className="hover:bg-[#301e27]/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-white">{p.tournamentId?.title}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">
                        {p.tournamentId?.format} • ₹{p.tournamentId?.entryFee}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5">
                        {p.rank === 1 && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                        {p.rank === 2 && <Award className="w-4 h-4 text-slate-300 shrink-0" />}
                        {p.rank === 3 && <Award className="w-4 h-4 text-amber-700 shrink-0" />}
                        <span className="font-semibold text-slate-200">{p.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <p className="font-display font-bold text-white text-sm">{p.winnerName}</p>
                      {p.winnerRegistrationId && (
                        <span className="font-mono text-[10px] text-brand-orange">
                          {p.winnerRegistrationId?.referenceId}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="font-display font-extrabold text-emerald-400 text-base">
                        ₹{p.amount}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        p.payoutStatus === 'paid'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : p.payoutStatus === 'on_hold'
                          ? 'bg-slate-800 text-slate-300 border border-slate-600'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}>
                        {p.payoutStatus === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {p.payoutStatus === 'pending' && <Clock className="w-3 h-3" />}
                        {p.payoutStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {p.offlineTransactionRef ? (
                        <span className="font-mono text-slate-300 bg-[#160e13] px-2 py-0.5 rounded border border-[#49303a] text-[11px]">
                          {p.offlineTransactionRef}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Unpaid</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedPrize(p);
                            setPayoutStatus(p.payoutStatus || 'paid');
                            setOfflineRef(p.offlineTransactionRef || '');
                            setNotes(p.notes || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#49303a] hover:bg-brand-orange hover:text-white text-slate-200 text-xs font-bold transition-all"
                        >
                          {p.payoutStatus === 'paid' ? 'View / Edit Ref' : 'Disburse UPI'}
                        </button>
                        <button
                          title="Delete prize record"
                          onClick={() => handleDeletePrize(p._id, p.winnerName)}
                          className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400 space-y-3">
                    <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="font-bold text-white text-sm">No Cash Prize Records Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Cash prizes are automatically created when you publish match results, or you can allocate a manual prize record right now.
                    </p>
                    <button
                      type="button"
                      onClick={openAllocateModal}
                      className="px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:brightness-110 transition-all"
                    >
                      + Allocate First Prize
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocate New Prize Record Modal */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#24171e] border border-[#49303a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#49303a] pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-orange" />
                <h3 className="font-display text-lg font-bold uppercase text-white">
                  Allocate Cash Prize Record
                </h3>
              </div>
              <button onClick={() => setIsAllocateModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrize} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">
                  Select Tournament *
                </label>
                <select
                  value={selectedTournamentId}
                  onChange={(e) => handleTournamentSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                >
                  {tournamentsList.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.format?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">
                    Rank / Placement *
                  </label>
                  <select
                    value={modalRank}
                    onChange={(e) => handleRankChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                  >
                    <option value={1}>1st Place (Winner)</option>
                    <option value={2}>2nd Place (Runner-Up)</option>
                    <option value={3}>3rd Place</option>
                    <option value={4}>MVP / Special Award</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">
                    Prize Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">
                  Prize Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">
                  Winner / Recipient Name *
                </label>
                {verifiedTeams.length > 0 ? (
                  <div className="space-y-1.5">
                    <select
                      value={modalWinnerRegId}
                      onChange={(e) => {
                        const sel = verifiedTeams.find((v) => v._id === e.target.value);
                        setModalWinnerRegId(e.target.value);
                        if (sel) setModalWinnerName(sel.teamName || sel.captain?.name || '');
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                    >
                      {verifiedTeams.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.teamName} (Capt: {v.captain?.name})
                        </option>
                      ))}
                      <option value="">Other / Custom Name</option>
                    </select>

                    <input
                      type="text"
                      required
                      placeholder="Winner name"
                      value={modalWinnerName}
                      onChange={(e) => setModalWinnerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Phoenix Fire"
                    value={modalWinnerName}
                    onChange={(e) => setModalWinnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={modalPayoutStatus}
                    onChange={(e) => setModalPayoutStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid (Sent via UPI)</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">
                    UPI UTR (If Paid)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4239812903"
                    value={modalOfflineRef}
                    onChange={(e) => setModalOfflineRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Google Pay to student captain"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#49303a]">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#301e27] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAllocate}
                  className="px-5 py-2 rounded-lg bg-brand-orange hover:brightness-110 text-white font-bold uppercase shadow-sm"
                >
                  {submittingAllocate ? 'Saving...' : 'Create Prize Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Payout Modal */}
      {selectedPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#24171e] border border-[#49303a] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#49303a] pb-3">
              <h3 className="font-display text-lg font-bold uppercase text-white">
                Record Cash Payout
              </h3>
              <button onClick={() => setSelectedPrize(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#160e13] border border-[#49303a] text-xs space-y-1">
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
                  className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
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
                  className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Sent to Captain's UPI"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#49303a]">
                <button
                  type="button"
                  onClick={() => setSelectedPrize(null)}
                  className="px-4 py-2 rounded-lg bg-[#301e27] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold uppercase shadow-sm"
                >
                  {submittingPayout ? 'Saving...' : 'Save Payout Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
