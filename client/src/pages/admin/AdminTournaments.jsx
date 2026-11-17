import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Users, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  X,
  AlertTriangle
} from 'lucide-react';

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournamentId, setEditingTournamentId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Curated high-res 16:9 widescreen Free Fire tournament banners
  const BANNER_OPTIONS = [
    { label: 'Auto-Select (Random)', value: '' },
    { label: 'Official Squad Battle (16:9)', value: '/images/ff-banner-squad.webp' },
    { label: 'Solo Firestorm Champion (16:9)', value: '/images/ff-banner-solo.webp' },
    { label: 'Rampage Battleground (16:9)', value: '/images/ff-banner-rampage.webp' },
    { label: 'Championship Hayato (16:9)', value: '/images/ff-banner-hayato.webp' },
    { label: 'Solo Gunslinger Kelly (16:9)', value: '/images/ff-banner-kelly.webp' },
    { label: 'Chrono Time Turner (16:9)', value: '/images/ff-banner-chrono.webp' },
    { label: 'Cyber Paradox Clash (16:9)', value: '/images/ff-banner-paradox.webp' },
    { label: 'High Octane Combat (16:9)', value: '/images/ff-banner-battle.webp' },
    { label: 'Booyah Flame Champion (16:9)', value: '/images/ff-banner-flame.webp' },
    { label: 'Grand Arena Stage (16:9)', value: '/images/arena-stage.webp' },
  ];

  const RANDOM_BANNERS = [
    '/images/ff-banner-squad.webp',
    '/images/ff-banner-solo.webp',
    '/images/ff-banner-rampage.webp',
    '/images/ff-banner-hayato.webp',
    '/images/ff-banner-kelly.webp',
    '/images/ff-banner-chrono.webp',
    '/images/ff-banner-paradox.webp',
    '/images/ff-banner-battle.webp',
    '/images/ff-banner-flame.webp',
    '/images/arena-stage.webp',
  ];

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    format: 'squad',
    entryFee: 29,
    maxSlots: 12,
    matchDate: '',
    registrationEnd: '',
    map: 'Bermuda',
    bannerUrl: '',
    description: '',
    firstPlace: 600,
    secondPlace: 300,
    thirdPlace: 100,
    killPointValue: 1,
    booyahBonus: 12,
  });

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tournaments');
      if (res.success) {
        setTournaments(res.tournaments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openCreateModal = () => {
    setEditingTournamentId(null);
    setFormData({
      title: '',
      format: 'squad',
      entryFee: 29,
      maxSlots: 12,
      matchDate: '',
      registrationEnd: '',
      map: 'Bermuda',
      bannerUrl: '',
      description: '',
      firstPlace: 600,
      secondPlace: 300,
      thirdPlace: 100,
      killPointValue: 1,
      booyahBonus: 12,
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTournamentId(t._id);
    setFormData({
      title: t.title,
      format: t.format,
      entryFee: t.entryFee,
      maxSlots: t.maxSlots,
      matchDate: t.matchDate ? new Date(t.matchDate).toISOString().slice(0, 16) : '',
      registrationEnd: t.registrationEnd ? new Date(t.registrationEnd).toISOString().slice(0, 16) : '',
      map: t.map || 'Bermuda',
      bannerUrl: t.bannerUrl || '',
      description: t.description || '',
      firstPlace: t.prizeConfig?.firstPlace || 0,
      secondPlace: t.prizeConfig?.secondPlace || 0,
      thirdPlace: t.prizeConfig?.thirdPlace || 0,
      killPointValue: t.scoringConfig?.killPointValue || 1,
      booyahBonus: t.scoringConfig?.booyahBonus || 12,
    });
    setError('');
    setIsModalOpen(true);
  };

  const rollRandomBanner = () => {
    const randomPick = RANDOM_BANNERS[Math.floor(Math.random() * RANDOM_BANNERS.length)];
    setFormData({ ...formData, bannerUrl: randomPick });
  };

  const handleFormatChange = (fmt) => {
    setFormData({
      ...formData,
      format: fmt,
      entryFee: fmt === 'squad' ? 29 : 14,
      maxSlots: fmt === 'squad' ? 12 : 48,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const totalPool = (Number(formData.firstPlace) || 0) + (Number(formData.secondPlace) || 0) + (Number(formData.thirdPlace) || 0);
      
      // Auto-assign random banner if empty or random
      const selectedBanner = formData.bannerUrl && formData.bannerUrl.trim() !== ''
        ? formData.bannerUrl
        : RANDOM_BANNERS[Math.floor(Math.random() * RANDOM_BANNERS.length)];

      const payload = {
        title: formData.title,
        format: formData.format,
        entryFee: Number(formData.entryFee),
        maxSlots: Number(formData.maxSlots),
        matchDate: new Date(formData.matchDate),
        registrationEnd: new Date(formData.registrationEnd || formData.matchDate),
        map: formData.map,
        bannerUrl: selectedBanner,
        description: formData.description,
        scoringConfig: {
          killPointValue: Number(formData.killPointValue),
          booyahBonus: Number(formData.booyahBonus),
        },
        prizeConfig: {
          firstPlace: Number(formData.firstPlace),
          secondPlace: Number(formData.secondPlace),
          thirdPlace: Number(formData.thirdPlace),
          totalPool,
        },
      };

      if (editingTournamentId) {
        const res = await api.patch(`/admin/tournaments/${editingTournamentId}`, payload);
        if (res.success) {
          setSuccessMsg('Tournament updated successfully!');
          setIsModalOpen(false);
          fetchTournaments();
        }
      } else {
        const res = await api.post('/admin/tournaments', payload);
        if (res.success) {
          setSuccessMsg('Tournament created successfully!');
          setIsModalOpen(false);
          fetchTournaments();
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save tournament');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tournamentId, newStatus) => {
    try {
      const res = await api.patch(`/admin/tournaments/${tournamentId}/status`, { status: newStatus });
      if (res.success) {
        setSuccessMsg(`Status updated to ${newStatus.replace('_', ' ')}`);
        fetchTournaments();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const confirmDeleteTournament = async (tournamentId) => {
    try {
      const res = await api.delete(`/admin/tournaments/${tournamentId}`);
      if (res.success) {
        setDeletingId(null);
        setSuccessMsg('Tournament deleted successfully');
        fetchTournaments();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete tournament');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Create CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
            Tournaments & Slot Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, edit, or delete tournaments, manage slot availability, and update lifecycle states.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-xs shadow-glow-orange flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Tournament
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => (
          <div key={t._id} className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] flex flex-col justify-between space-y-4 relative group hover:border-slate-600 transition-colors">
            
            <div className="space-y-3">
              {/* Mini Banner Preview */}
              <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-900 border border-[#1F293D]">
                <img
                  src={t.bannerUrl || '/images/ff-banner.webp'}
                  alt={t.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121722] via-transparent to-transparent"></div>
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] uppercase font-bold text-brand-orange border border-white/10">
                    {t.format}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] text-slate-300 font-semibold border border-white/10">
                    {t.map || 'Bermuda'}
                  </span>
                </div>
              </div>

              {/* Status selector */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Lifecycle State</span>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t._id, e.target.value)}
                  className="px-2.5 py-1 rounded bg-[#0B0E14] border border-[#1F293D] text-[11px] font-bold text-white uppercase focus:outline-none focus:border-brand-orange"
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="registration_closed">Registration Closed</option>
                  <option value="full">Full</option>
                  <option value="room_ready">Room Ready</option>
                  <option value="live">Live Match</option>
                  <option value="result_review">Result Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Title & Date */}
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-white line-clamp-1">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(t.matchDate).toLocaleString('en-IN')}</p>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-center text-xs">
                <div>
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Fee</span>
                  <span className="font-bold text-white">₹{t.entryFee}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Slots</span>
                  <span className={`font-bold ${t.status === 'full' ? 'text-amber-400' : 'text-white'}`}>
                    {t.status === 'full' ? `${t.maxSlots}/${t.maxSlots}` : `${t.registeredSlots}/${t.maxSlots}`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Prize</span>
                  <span className="font-bold text-brand-amber">₹{t.prizeConfig?.totalPool || 0}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Edit & Delete */}
            <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between gap-2">
              <button
                onClick={() => openEditModal(t)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-[#161B26] hover:bg-[#1F293D] text-slate-300 hover:text-white border border-[#1F293D] text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-cyan-400" /> Edit
              </button>

              <button
                onClick={() => setDeletingId(t._id)}
                className="py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors"
                title="Delete tournament"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>

            {/* In-Card Delete Confirmation Overlay */}
            {deletingId === t._id && (
              <div className="absolute inset-0 z-10 p-5 rounded-2xl bg-[#0B0E14]/95 backdrop-blur-sm border border-rose-500/60 flex flex-col justify-center items-center text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
                <p className="text-xs text-white font-bold">
                  Delete "{t.title}"?
                </p>
                <p className="text-[10px] text-slate-400">
                  This permanently removes the tournament and its registrations.
                </p>
                <div className="flex gap-2 pt-1 w-full">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-1.5 rounded-lg bg-[#161B26] text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmDeleteTournament(t._id)}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Create / Edit Tournament Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#121722] border border-[#1F293D] p-6 space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
              <h3 className="font-display text-xl font-bold uppercase text-white">
                {editingTournamentId ? 'Edit Tournament Details' : 'Create New Free Fire Tournament'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RIT Squad Battle — Week 03"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Format *</label>
                  <select
                    value={formData.format}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                  >
                    <option value="squad">Squad (4v4)</option>
                    <option value="solo">Solo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Entry Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Max Slots *</label>
                  <input
                    type="number"
                    required
                    value={formData.maxSlots}
                    onChange={(e) => setFormData({ ...formData, maxSlots: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Match Date & Time (IST) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.matchDate}
                    onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Map</label>
                  <select
                    value={formData.map}
                    onChange={(e) => setFormData({ ...formData, map: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-white"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                  </select>
                </div>
              </div>

              {/* Banner Image Selection with Random Auto-Select */}
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1F293D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider text-brand-orange">
                    Card Banner Image
                  </span>
                  <button
                    type="button"
                    onClick={rollRandomBanner}
                    className="px-2.5 py-1 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/40 hover:bg-brand-orange hover:text-white transition-all text-[11px] font-bold flex items-center gap-1"
                  >
                    Roll Random Image
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-slate-400 mb-1">Select Banner or Random</label>
                    <select
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-[#161B26] border border-[#1F293D] text-white text-xs"
                    >
                      {BANNER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formData.bannerUrl
                        ? 'Selected specific Free Fire image'
                        : 'Random: will auto-pick a random Free Fire image upon saving'}
                    </span>
                  </div>

                  {/* Live Preview - 16:9 widescreen preview with no vertical distortion */}
                  <div className="relative w-full aspect-[16/9] max-h-44 rounded-xl overflow-hidden border border-[#1F293D] bg-slate-900 flex items-center justify-center shadow-inner">
                    {formData.bannerUrl ? (
                      <img
                        src={formData.bannerUrl}
                        alt="Banner preview"
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400 text-[11px]">
                        <strong className="text-white">Random Mode Active</strong>
                        <p className="text-[9px] text-slate-500">Auto-assigned from 10 high-res Free Fire 16:9 banners</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scoring Config */}
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1F293D] space-y-3">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider text-brand-orange">
                  Configurable Scoring Formula
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Kill Point Value</label>
                    <input
                      type="number"
                      value={formData.killPointValue}
                      onChange={(e) => setFormData({ ...formData, killPointValue: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-[#161B26] border border-[#1F293D] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Booyah Bonus</label>
                    <input
                      type="number"
                      value={formData.booyahBonus}
                      onChange={(e) => setFormData({ ...formData, booyahBonus: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-[#161B26] border border-[#1F293D] text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Prize Config */}
              <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1F293D] space-y-3">
                <span className="font-bold text-white uppercase text-[10px] tracking-wider text-brand-amber">
                  Cash Prize Breakdown (₹)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">1st Place</label>
                    <input
                      type="number"
                      value={formData.firstPlace}
                      onChange={(e) => setFormData({ ...formData, firstPlace: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-[#161B26] border border-[#1F293D] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">2nd Place</label>
                    <input
                      type="number"
                      value={formData.secondPlace}
                      onChange={(e) => setFormData({ ...formData, secondPlace: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-[#161B26] border border-[#1F293D] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">3rd Place</label>
                    <input
                      type="number"
                      value={formData.thirdPlace}
                      onChange={(e) => setFormData({ ...formData, thirdPlace: e.target.value })}
                      className="w-full px-3 py-1.5 rounded bg-[#161B26] border border-[#1F293D] text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F293D] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#161B26] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-lg bg-brand-orange text-white font-bold uppercase shadow-glow-orange"
                >
                  {submitting ? 'Saving...' : editingTournamentId ? 'Update Tournament' : 'Create Tournament'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
