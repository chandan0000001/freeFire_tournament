import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { 
  FileCheck, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Trophy, 
  Flame, 
  ExternalLink,
  Edit,
  Save
} from 'lucide-react';

export default function AdminResultsReview() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeResult, setActiveResult] = useState(null);
  const [editedEntries, setEditedEntries] = useState([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchResultsQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/results');
      if (res.success) {
        setResults(res.results || []);
        if (res.results.length > 0 && !activeResult) {
          selectResult(res.results[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultsQueue();
  }, []);

  const selectResult = (r) => {
    setActiveResult(r);
    setEditedEntries(JSON.parse(JSON.stringify(r.entries || [])));
    setAdminNotes(r.adminReviewNotes || '');
    setMessage({ type: '', text: '' });
  };

  const handleEntryChange = (idx, field, value) => {
    const updated = [...editedEntries];
    updated[idx][field] = value;
    
    // Recalculate points on the fly in UI
    const killVal = activeResult.tournamentId?.scoringConfig?.killPointValue || 1;
    const booyahBonus = activeResult.tournamentId?.scoringConfig?.booyahBonus || 12;
    const kills = parseInt(updated[idx].kills, 10) || 0;
    const isBooyah = Boolean(updated[idx].isBooyah || updated[idx].placement === 1);
    
    updated[idx].calculatedPoints = (kills * killVal) + (isBooyah ? booyahBonus : 0);
    setEditedEntries(updated);
  };

  const handleSaveEdits = async () => {
    if (!activeResult) return;
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.patch(`/admin/results/${activeResult._id}/review`, {
        entries: editedEntries,
        adminReviewNotes: adminNotes,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Scores & adjustments updated successfully.' });
        fetchResultsQueue();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update scores' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!activeResult) return;
    if (!window.confirm('Are you sure you want to officially publish these results? This will mark the tournament completed, update the public leaderboard, and allocate cash prize records.')) {
      return;
    }

    setPublishing(true);
    setMessage({ type: '', text: '' });

    try {
      // First save any unsaved edits
      await api.patch(`/admin/results/${activeResult._id}/review`, {
        entries: editedEntries,
        adminReviewNotes: adminNotes,
      });

      // Now publish
      const res = await api.post(`/admin/results/${activeResult._id}/publish`);
      if (res.success) {
        setMessage({ type: 'success', text: 'Match results PUBLISHED officially! Public leaderboards and prize records updated.' });
        fetchResultsQueue();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to publish results' });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Match Result Review & Publishing
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review recorded match scores, verify against captain screenshots, and officially publish tournament results.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'error'
              ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Results Queue List (Left Column) */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold uppercase text-slate-400">
            Submissions Queue ({results.length})
          </h3>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading submissions...</div>
            ) : results.length > 0 ? (
              results.map((r) => (
                <div
                  key={r._id}
                  onClick={() => selectResult(r)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    activeResult?._id === r._id
                      ? 'bg-[#161B26] border-brand-orange shadow-md'
                      : 'bg-[#121722] border-[#1F293D] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-brand-orange font-bold">
                      Match #{r.matchId?.matchNumber || 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'published'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-white">{r.tournamentId?.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Recorded by: {r.recordedBy?.name}</p>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-[#121722] border border-[#1F293D] text-center text-xs text-slate-500">
                No match results submitted yet.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Editor (Center and Right Columns) */}
        {activeResult ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tournament Details Banner */}
            <div className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-orange">
                  Scoring: {activeResult.tournamentId?.scoringConfig?.killPointValue || 1} pt/kill • +{activeResult.tournamentId?.scoringConfig?.booyahBonus || 12} Booyah
                </span>
                <h3 className="font-display text-xl font-bold uppercase text-white mt-0.5">
                  {activeResult.tournamentId?.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveEdits}
                  className="px-4 py-2 rounded-lg bg-[#161B26] hover:bg-[#1F293D] text-slate-300 border border-[#1F293D] text-xs font-bold uppercase flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-brand-orange" /> Save Edits
                </button>

                {activeResult.status !== 'published' && (
                  <button
                    type="button"
                    disabled={publishing}
                    onClick={handlePublish}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle className="w-4 h-4" /> Publish Live Results
                  </button>
                )}
              </div>
            </div>

            {/* Scorecard Editable Table */}
            <div className="rounded-2xl bg-[#121722] border border-[#1F293D] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B0E14] text-[10px] uppercase font-bold text-slate-400 border-b border-[#1F293D]">
                    <tr>
                      <th className="py-3 px-4">Placement</th>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4 text-center">Kills</th>
                      <th className="py-3 px-4 text-center">Booyah?</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F293D]">
                    {editedEntries.map((entry, idx) => (
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
                        <td className="py-2.5 px-4 text-right font-display font-extrabold text-brand-orange text-sm">
                          {entry.calculatedPoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supporting Captain Screenshots Section */}
            {activeResult.captainEvidence && activeResult.captainEvidence.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-3">
                <h4 className="font-display text-sm font-bold uppercase text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" /> Captain-Submitted Supporting Screenshots ({activeResult.captainEvidence.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeResult.captainEvidence.map((ev, eIdx) => (
                    <div key={eIdx} className="space-y-1">
                      {ev.captainEvidence.map((img, iIdx) => (
                        <a
                          key={iIdx}
                          href={img.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-[#1F293D] hover:border-cyan-400 transition-colors"
                        >
                          <img
                            src={img.screenshotUrl}
                            alt="Evidence screenshot"
                            className="h-28 w-full object-cover"
                          />
                          <span className="block p-1 text-[10px] text-slate-300 truncate bg-[#0B0E14]">
                            {ev.teamName || 'Solo'}: {img.notes || 'Evidence'}
                          </span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Review Notes */}
            <div className="p-5 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Admin Review Notes / Audit Justification
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Cross-checked with scoreboard screenshot; kill counts matched."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-500 rounded-2xl bg-[#121722] border border-[#1F293D]">
            Select a match result from the queue to review and publish.
          </div>
        )}

      </div>

    </div>
  );
}
