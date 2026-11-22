import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import useLiveRefresh from '../../hooks/useLiveRefresh.js';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  RotateCcw, 
  Plus, 
  Minus,
  Trophy,
  Flame,
  Check
} from 'lucide-react';

const DEFAULT_SESSIONS = {
  morning: {
    totalMatches: 5,
    completedMatches: 0,
    timeRange: '10:00 AM – 12:30 PM',
    isOpen: true,
  },
  afternoon: {
    totalMatches: 4,
    completedMatches: 0,
    timeRange: '2:00 PM – 4:30 PM',
    isOpen: true,
  },
  evening: {
    totalMatches: 4,
    completedMatches: 0,
    timeRange: '6:00 PM – 8:30 PM',
    isOpen: true,
  },
};

export default function AdminSeasons() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for current tournament's match sessions
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tournaments');
      if (res.success && Array.isArray(res.tournaments)) {
        setTournaments(res.tournaments);
        if (res.tournaments.length > 0) {
          const current = selectedId 
            ? res.tournaments.find((t) => t._id === selectedId) || res.tournaments[0]
            : res.tournaments[0];
          setSelectedId(current._id);
          initSessionsFromTournament(current);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const initSessionsFromTournament = (t) => {
    if (!t) return;
    const ms = t.matchSessions || {};
    setSessions({
      morning: {
        totalMatches: Number(ms.morning?.totalMatches ?? 5),
        completedMatches: Number(ms.morning?.completedMatches ?? 0),
        timeRange: ms.morning?.timeRange || '10:00 AM – 12:30 PM',
        isOpen: ms.morning?.isOpen !== undefined ? Boolean(ms.morning.isOpen) : true,
      },
      afternoon: {
        totalMatches: Number(ms.afternoon?.totalMatches ?? 4),
        completedMatches: Number(ms.afternoon?.completedMatches ?? 0),
        timeRange: ms.afternoon?.timeRange || '2:00 PM – 4:30 PM',
        isOpen: ms.afternoon?.isOpen !== undefined ? Boolean(ms.afternoon.isOpen) : true,
      },
      evening: {
        totalMatches: Number(ms.evening?.totalMatches ?? 4),
        completedMatches: Number(ms.evening?.completedMatches ?? 0),
        timeRange: ms.evening?.timeRange || '6:00 PM – 8:30 PM',
        isOpen: ms.evening?.isOpen !== undefined ? Boolean(ms.evening.isOpen) : true,
      },
    });
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useLiveRefresh(fetchTournaments);

  const handleSelectTournament = (id) => {
    setSelectedId(id);
    const found = tournaments.find((t) => t._id === id);
    if (found) {
      initSessionsFromTournament(found);
      setSuccessMsg('');
      setError('');
    }
  };

  const updateSessionField = (sessionKey, field, value) => {
    setSessions((prev) => ({
      ...prev,
      [sessionKey]: {
        ...prev[sessionKey],
        [field]: value,
      },
    }));
  };

  const stepCompleted = (sessionKey, delta) => {
    setSessions((prev) => {
      const cur = prev[sessionKey];
      const max = cur.totalMatches || 1;
      const nextVal = Math.max(0, Math.min(max, cur.completedMatches + delta));
      return {
        ...prev,
        [sessionKey]: {
          ...cur,
          completedMatches: nextVal,
        },
      };
    });
  };

  const handleResetDefaults = () => {
    setSessions(DEFAULT_SESSIONS);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedId) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/admin/tournaments/${selectedId}/sessions`, {
        matchSessions: sessions,
      });

      if (res.success) {
        setSuccessMsg('Match sessions and completed counts updated successfully!');
        // Update local list
        setTournaments((prev) =>
          prev.map((t) => (t._id === selectedId ? { ...t, matchSessions: sessions } : t))
        );
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update match sessions.');
      }
    } catch (err) {
      setError(err.message || 'Error saving session progress.');
    } finally {
      setSaving(false);
    }
  };

  const activeTournament = tournaments.find((t) => t._id === selectedId);

  if (loading && tournaments.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono uppercase tracking-wider">Loading tournaments and match sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#393236]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarDays size={13} />
            <span>Match Operations</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
            Match Sessions & Seasons
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure scheduled matches and track completed games for <strong>Morning (5)</strong>, <strong>Afternoon (4)</strong>, and <strong>Evening (4)</strong> slots. Updates reflect instantly on public cards without complex database operations.
          </p>
        </div>

        {/* Quick Reset Button */}
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1b1017] hover:bg-[#251520] border border-[#393236] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
        >
          <RotateCcw size={14} />
          <span>Reset Defaults (5 / 4 / 4)</span>
        </button>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tournament Selector Bar */}
      <div className="p-4 rounded-2xl bg-[#1c1b1e] border border-[#393236] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Active Tournament
          </label>
          <select
            value={selectedId}
            onChange={(e) => handleSelectTournament(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#111214] border border-[#393236] text-white text-xs font-semibold focus:outline-none focus:border-brand-orange"
          >
            {tournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.format.toUpperCase()} · {t.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {activeTournament && (
          <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#393236] text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-brand-orange/10 border border-brand-orange/30 text-brand-orange font-bold uppercase">
              {activeTournament.format}
            </span>
            <span className="text-slate-400">
              Map: <strong className="text-white">{activeTournament.map || 'Bermuda'}</strong>
            </span>
            <span className="text-slate-400">
              Status: <strong className="text-emerald-400 uppercase">{activeTournament.status}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main 3 Sessions Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MORNING SESSION CARD */}
          <div className="p-5 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#393236]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="font-display text-base font-extrabold uppercase text-white tracking-wide">
                  Morning Slot
                </h3>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessions.morning.isOpen}
                  onChange={(e) => updateSessionField('morning', 'isOpen', e.target.checked)}
                  className="rounded border-[#393236] text-brand-orange focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Time Window
                </label>
                <input
                  type="text"
                  value={sessions.morning.timeRange}
                  onChange={(e) => updateSessionField('morning', 'timeRange', e.target.value)}
                  placeholder="10:00 AM – 12:30 PM"
                  className="w-full px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Total Matches Scheduled
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sessions.morning.totalMatches}
                  onChange={(e) => updateSessionField('morning', 'totalMatches', Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-xs font-mono"
                />
              </div>

              {/* Completed Matches Stepper */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Completed Matches
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepCompleted('morning', -1)}
                    className="p-2 rounded-lg bg-[#111214] border border-[#393236] text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={sessions.morning.totalMatches}
                    value={sessions.morning.completedMatches}
                    onChange={(e) => updateSessionField('morning', 'completedMatches', Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-center text-sm font-bold font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => stepCompleted('morning', 1)}
                    className="p-2 rounded-lg bg-[#111214] border border-[#393236] text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Remaining open badge */}
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-300">Remaining Open:</span>
                <strong className="text-amber-300 font-mono text-sm">
                  {Math.max(0, sessions.morning.totalMatches - sessions.morning.completedMatches)} matches
                </strong>
              </div>
            </div>
          </div>

          {/* AFTERNOON SESSION CARD */}
          <div className="p-5 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#393236]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                <h3 className="font-display text-base font-extrabold uppercase text-white tracking-wide">
                  Afternoon Slot
                </h3>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessions.afternoon.isOpen}
                  onChange={(e) => updateSessionField('afternoon', 'isOpen', e.target.checked)}
                  className="rounded border-[#393236] text-brand-orange focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Time Window
                </label>
                <input
                  type="text"
                  value={sessions.afternoon.timeRange}
                  onChange={(e) => updateSessionField('afternoon', 'timeRange', e.target.value)}
                  placeholder="2:00 PM – 4:30 PM"
                  className="w-full px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Total Matches Scheduled
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sessions.afternoon.totalMatches}
                  onChange={(e) => updateSessionField('afternoon', 'totalMatches', Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-xs font-mono"
                />
              </div>

              {/* Completed Matches Stepper */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Completed Matches
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepCompleted('afternoon', -1)}
                    className="p-2 rounded-lg bg-[#111214] border border-[#393236] text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={sessions.afternoon.totalMatches}
                    value={sessions.afternoon.completedMatches}
                    onChange={(e) => updateSessionField('afternoon', 'completedMatches', Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-center text-sm font-bold font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => stepCompleted('afternoon', 1)}
                    className="p-2 rounded-lg bg-[#111214] border border-[#393236] text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Remaining open badge */}
              <div className="p-3 rounded-xl bg-orange-950/30 border border-brand-orange/30 flex items-center justify-between text-xs">
                <span className="text-slate-300">Remaining Open:</span>
                <strong className="text-brand-orange font-mono text-sm">
                  {Math.max(0, sessions.afternoon.totalMatches - sessions.afternoon.completedMatches)} matches
                </strong>
              </div>
            </div>
          </div>

          {/* EVENING SESSION CARD */}
          <div className="p-5 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#393236]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-display text-base font-extrabold uppercase text-white tracking-wide">
                  Evening Slot
                </h3>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sessions.evening.isOpen}
                  onChange={(e) => updateSessionField('evening', 'isOpen', e.target.checked)}
                  className="rounded border-[#393236] text-brand-orange focus:ring-0"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Time Window
                </label>
                <input
                  type="text"
                  value={sessions.evening.timeRange}
                  onChange={(e) => updateSessionField('evening', 'timeRange', e.target.value)}
                  placeholder="6:00 PM – 8:30 PM"
                  className="w-full px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Total Matches Scheduled
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={sessions.evening.totalMatches}
                  onChange={(e) => updateSessionField('evening', 'totalMatches', Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-xs font-mono"
                />
              </div>

              {/* Completed Matches Stepper */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Completed Matches
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepCompleted('evening', -1)}
                    className="p-2 rounded-lg bg-[#111214] border border-[#393236] text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={sessions.evening.totalMatches}
                    value={sessions.evening.completedMatches}
                    onChange={(e) => updateSessionField('evening', 'completedMatches', Math.max(0, Number(e.target.value) || 0))}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#111214] border border-[#393236] text-white text-center text-sm font-bold font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => stepCompleted('evening', 1)}
                    className="p-2 rounded-lg bg-[#111214] border border-[#393236] text-slate-300 hover:text-white hover:border-slate-500"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Remaining open badge */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
                <span className="text-slate-300">Remaining Open:</span>
                <strong className="text-emerald-300 font-mono text-sm">
                  {Math.max(0, sessions.evening.totalMatches - sessions.evening.completedMatches)} matches
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* Live Public Card Preview */}
        <div className="p-4 rounded-2xl bg-[#140b10] border border-[#39242d] space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Public Tournament Card Preview (Low Database Call)
          </span>
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#1c1b1e] border border-[#393236] text-center text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Morning</span>
              <strong className="text-amber-300 font-mono text-xs">
                {sessions.morning.completedMatches}/{sessions.morning.totalMatches} done
              </strong>
            </div>
            <div className="border-x border-[#393236]">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Afternoon</span>
              <strong className="text-brand-orange font-mono text-xs">
                {sessions.afternoon.completedMatches}/{sessions.afternoon.totalMatches} done
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Evening</span>
              <strong className="text-emerald-400 font-mono text-xs">
                {sessions.evening.completedMatches}/{sessions.evening.totalMatches} done
              </strong>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#393236]">
          <button
            type="submit"
            disabled={saving || !selectedId}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-glow-orange cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            <span>{saving ? 'Saving...' : 'Save Session Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
