import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Eye, ShieldCheck, Upload, LogOut, CheckCircle, AlertCircle, Trophy, Flame } from 'lucide-react';

export default function SpectatorWorkspace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Observation form state
  const [entries, setEntries] = useState([]);
  const [notes, setNotes] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/spectator/assignments');
      if (res.success) {
        setMatches(res.matches || []);
        if (res.matches.length > 0 && !selectedMatch) {
          selectMatch(res.matches[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const selectMatch = (m) => {
    setSelectedMatch(m);
    setMessage({ type: '', text: '' });
    
    // Initialize entries with verified participants
    if (m.submittedResult && m.submittedResult.entries.length > 0) {
      setEntries(m.submittedResult.entries);
      setNotes(m.submittedResult.notes || '');
    } else {
      const initial = (m.participants || []).map((p, idx) => ({
        registrationId: p._id,
        participantName: p.format === 'squad' ? p.teamName : p.players[0]?.inGameName,
        placement: idx + 1,
        kills: 0,
        isBooyah: idx === 0,
        playerKills: p.players.map((pl) => ({
          playerName: pl.inGameName,
          freeFireUid: pl.freeFireUid,
          kills: 0,
        })),
      }));
      setEntries(initial);
      setNotes('');
    }
  };

  const handleEntryChange = (idx, field, value) => {
    const updated = [...entries];
    updated[idx][field] = value;
    if (field === 'placement' && parseInt(value, 10) === 1) {
      updated[idx].isBooyah = true;
    }
    setEntries(updated);
  };

  const handleEvidenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedMatch) return;

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('screenshots', file));

      const res = await api.post(`/spectator/matches/${selectedMatch._id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success) {
        setEvidenceFiles(res.urls || []);
        setMessage({ type: 'success', text: 'Scoreboard screenshots uploaded successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Evidence upload failed' });
    }
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        entries,
        notes,
        evidenceScreenshots: evidenceFiles,
      };

      const res = await api.post(`/spectator/matches/${selectedMatch._id}/results`, payload);
      if (res.success) {
        setMessage({ type: 'success', text: 'Match scores successfully recorded and submitted for admin review!' });
        fetchAssignments();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit match results' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] p-4 sm:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1F293D] pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold uppercase text-white tracking-wider">
              Spectator Match Workspace
            </h1>
            <p className="text-xs text-slate-400">Logged in as: <strong className="text-cyan-400">{user?.name}</strong></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs text-slate-400 hover:text-white">
            View Public Site
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/spectator/login');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B26] text-xs text-rose-400 hover:bg-rose-950 border border-[#1F293D]"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
        }`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Assigned Matches List */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold uppercase text-slate-400">
            Assigned Matches ({matches.length})
          </h3>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading assignments...</div>
            ) : matches.length > 0 ? (
              matches.map((m) => (
                <div
                  key={m._id}
                  onClick={() => selectMatch(m)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedMatch?._id === m._id
                      ? 'bg-[#161B26] border-cyan-400 shadow-glow-cyan'
                      : 'bg-[#121722] border-[#1F293D] hover:border-slate-600'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Match #{m.matchNumber}</span>
                  <h4 className="font-display font-bold text-sm text-white mt-0.5">{m.tournamentId?.title}</h4>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                    <span>{m.participants?.length || 0} teams registered</span>
                    <span className="capitalize">{m.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-[#121722] border border-[#1F293D] text-center text-xs text-slate-500">
                No matches assigned to you yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Score Observation Entry Form */}
        {selectedMatch ? (
          <form onSubmit={handleSubmitResult} className="lg:col-span-2 space-y-6">
            
            <div className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400">Match #{selectedMatch.matchNumber}</span>
                <h3 className="font-display text-xl font-bold uppercase text-white mt-0.5">
                  {selectedMatch.tournamentId?.title}
                </h3>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-display font-bold uppercase tracking-wider text-white text-xs shadow-glow-cyan hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <CheckCircle className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Results for Admin Review'}
              </button>
            </div>

            {/* Score Observation Table */}
            <div className="rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0E14] text-[10px] uppercase font-bold text-slate-400 border-b border-[#1F293D]">
                    <tr>
                      <th className="py-3 px-4">Placement (1-12)</th>
                      <th className="py-3 px-4">Participant / Team</th>
                      <th className="py-3 px-4 text-center">Kills</th>
                      <th className="py-3 px-4 text-center">Booyah?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F293D]">
                    {entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-[#161B26]/60">
                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            min="1"
                            value={entry.placement}
                            onChange={(e) => handleEntryChange(idx, 'placement', parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1 rounded bg-[#0B0E14] border border-[#1F293D] text-white font-mono text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-bold text-white">
                          {entry.participantName}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.kills}
                            onChange={(e) => handleEntryChange(idx, 'kills', parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1 rounded bg-[#0B0E14] border border-[#1F293D] text-white font-mono text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={entry.isBooyah || entry.placement === 1}
                            onChange={(e) => handleEntryChange(idx, 'isBooyah', e.target.checked)}
                            className="rounded text-brand-orange"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scoreboard Screenshot Upload */}
            <div className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Upload End-Game Scoreboard Screenshot Evidence
              </label>
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={handleEvidenceUpload}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#161B26] file:text-cyan-400 hover:file:bg-[#1F293D]"
              />
              {evidenceFiles.length > 0 && (
                <p className="text-[11px] text-emerald-400">
                  ✅ {evidenceFiles.length} evidence screenshot(s) attached.
                </p>
              )}
            </div>

            {/* Match Notes */}
            <div className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Spectator Match Notes (Disputes, disconnections, or penalties)
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Clean match. Team Alpha secured Booyah with 8 kills."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>

          </form>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-500 rounded-2xl bg-[#121722] border border-[#1F293D]">
            Select an assigned match to record scores.
          </div>
        )}

      </div>

    </div>
  );
}
