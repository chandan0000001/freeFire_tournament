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
  Save,
  PlusCircle,
  X,
  Trash2,
  Users,
  Award,
  Crown
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

  // Record Winner Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [tournamentsList, setTournamentsList] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [modalEntries, setModalEntries] = useState([]);
  const [modalMatchNumber, setModalMatchNumber] = useState(1);
  const [modalMap, setModalMap] = useState('Bermuda');
  const [modalScreenshot, setModalScreenshot] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

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

  // Open Direct Record Modal
  const openRecordModal = async () => {
    setIsRecordModalOpen(true);
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

  // Handle Tournament Select inside Modal
  const handleTournamentSelect = async (tId, list = tournamentsList) => {
    setSelectedTournamentId(tId);
    const tObj = list.find((t) => t._id === tId) || null;
    setSelectedTournament(tObj);
    if (tObj?.map) setModalMap(tObj.map);

    setLoadingRegistrations(true);
    try {
      const regRes = await api.get(`/admin/registrations?tournamentId=${tId}&paymentStatus=verified`);
      const verifiedList = regRes.registrations || [];

      if (verifiedList.length > 0) {
        const initialEntries = verifiedList.map((r, i) => {
          const leader = r.players?.find((p) => p.isLeader) || r.players?.[0] || r.captain || {};
          return {
            registrationId: r._id,
            participantName: r.teamName || leader?.name || `Participant ${i + 1}`,
            playerName: leader?.name || r.captain?.name || '',
            inGameName: leader?.inGameName || '',
            playerUid: leader?.freeFireUid || '',
            placement: i + 1,
            kills: 0,
            isBooyah: i === 0,
            calculatedPoints: i === 0 ? (tObj?.scoringConfig?.booyahBonus || 12) : 0,
            playerKills: (r.players || []).map((p) => ({
              playerName: p.name || '',
              inGameName: p.inGameName || '',
              freeFireUid: p.freeFireUid || '',
              kills: 0,
            })),
          };
        });
        setModalEntries(initialEntries);
      } else {
        // Fallback default rows
        setModalEntries([
          { registrationId: null, participantName: 'Winning Team (Champion)', playerName: 'Rahul Sharma', inGameName: 'Apex_Sniper', playerUid: '1401364963', placement: 1, kills: 8, isBooyah: true, calculatedPoints: 20 },
          { registrationId: null, participantName: 'Runner Up (2nd Place)', playerName: 'Manish Das', inGameName: 'Thunder_Op', playerUid: '1592837482', placement: 2, kills: 5, isBooyah: false, calculatedPoints: 5 },
          { registrationId: null, participantName: '3rd Place Team', playerName: 'Sunil Kumar', inGameName: 'Silent_Kill', playerUid: '1839284719', placement: 3, kills: 3, isBooyah: false, calculatedPoints: 3 },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch verified registrations', err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // Change entry inside Modal
  const handleModalEntryChange = (index, field, value) => {
    const updated = [...modalEntries];
    updated[index][field] = value;

    // Auto-update points
    const killVal = selectedTournament?.scoringConfig?.killPointValue || 1;
    const booyahBonus = selectedTournament?.scoringConfig?.booyahBonus || 12;
    const kills = parseInt(updated[index].kills, 10) || 0;
    const isBooyah = Boolean(updated[index].isBooyah || updated[index].placement === 1);

    updated[index].calculatedPoints = (kills * killVal) + (isBooyah ? booyahBonus : 0);
    setModalEntries(updated);
  };

  // Quick set as 1st place champion
  const handleSetChampion = (index) => {
    const updated = modalEntries.map((e, idx) => {
      const isWinner = idx === index;
      const killVal = selectedTournament?.scoringConfig?.killPointValue || 1;
      const booyahBonus = selectedTournament?.scoringConfig?.booyahBonus || 12;
      const kills = parseInt(e.kills, 10) || 0;
      return {
        ...e,
        placement: isWinner ? 1 : (e.placement === 1 ? 2 : e.placement),
        isBooyah: isWinner,
        calculatedPoints: (kills * killVal) + (isWinner ? booyahBonus : 0),
      };
    });
    setModalEntries(updated);
  };

  // Add new participant row in modal
  const handleAddParticipantRow = () => {
    const nextPlacement = modalEntries.length + 1;
    setModalEntries([
      ...modalEntries,
      {
        registrationId: null,
        participantName: `Team ${nextPlacement}`,
        playerName: '',
        inGameName: '',
        playerUid: '',
        placement: nextPlacement,
        kills: 0,
        isBooyah: false,
        calculatedPoints: 0,
        playerKills: [],
      },
    ]);
  };

  // Remove participant row in modal
  const handleRemoveParticipantRow = (index) => {
    if (modalEntries.length <= 1) return;
    setModalEntries(modalEntries.filter((_, i) => i !== index));
  };

  // Submit Modal Record (Save draft or auto-publish)
  const handleSubmitRecord = async (autoPublish = true) => {
    if (!selectedTournamentId) {
      alert('Please select a tournament');
      return;
    }
    if (modalEntries.length === 0) {
      alert('Please add at least one participant');
      return;
    }

    setIsSubmittingRecord(true);
    try {
      const res = await api.post('/admin/results/direct-record', {
        tournamentId: selectedTournamentId,
        matchNumber: parseInt(modalMatchNumber, 10) || 1,
        map: modalMap,
        entries: modalEntries,
        notes: modalNotes,
        evidenceScreenshots: modalScreenshot.trim() ? [modalScreenshot.trim()] : [],
        autoPublish,
      });

      if (res.success) {
        setIsRecordModalOpen(false);
        setMessage({
          type: 'success',
          text: autoPublish
            ? `Champion officially declared and published! Public leaderboards, Hall of Fame, and prizes updated.`
            : 'Match result saved to review queue.',
        });
        await fetchResultsQueue();
      }
    } catch (err) {
      alert(err.message || 'Failed to record match results');
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
            Match Result Review & Publishing
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review recorded match scores, declare tournament winners, verify captain screenshots, and officially publish results.
          </p>
        </div>

        <button
          type="button"
          onClick={openRecordModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber hover:brightness-110 text-white text-xs font-bold uppercase tracking-wider shadow-glow-orange flex items-center gap-2 shrink-0 self-start sm:self-auto transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Match & Declare Winner</span>
        </button>
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
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase text-slate-400">
              Submissions Queue ({results.length})
            </h3>
            <button
              onClick={openRecordModal}
              className="text-[11px] font-bold text-brand-orange hover:text-brand-amber uppercase transition-colors"
            >
              + Add Result
            </button>
          </div>

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
                      ? 'bg-[#301e27] border-brand-orange shadow-md'
                      : 'bg-[#24171e] border-[#49303a] hover:border-slate-600'
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
                  <p className="text-[11px] text-slate-400 mt-0.5">Recorded by: {r.recordedBy?.name || 'Admin'}</p>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-[#24171e] border border-[#49303a] text-center text-xs text-slate-500 space-y-3">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No match results submitted yet.</p>
                <button
                  type="button"
                  onClick={openRecordModal}
                  className="px-3 py-1.5 rounded-lg bg-[#301e27] hover:bg-[#49303a] text-brand-orange text-xs font-bold border border-brand-orange/30 transition-all"
                >
                  Record First Result
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Editor (Center and Right Columns) */}
        {activeResult ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tournament Details Banner */}
            <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest">
                  Match #{activeResult.matchId?.matchNumber || 1} • {activeResult.tournamentId?.format?.toUpperCase()}
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
                  className="px-4 py-2 rounded-lg bg-[#301e27] hover:bg-[#49303a] text-slate-300 border border-[#49303a] text-xs font-bold uppercase flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4 text-brand-orange" /> {saving ? 'Saving...' : 'Save Edits'}
                </button>

                {activeResult.status !== 'published' && (
                  <button
                    type="button"
                    disabled={publishing}
                    onClick={handlePublish}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> {publishing ? 'Publishing...' : 'Publish Live Results'}
                  </button>
                )}
              </div>
            </div>

            {/* Scorecard Editable Table */}
            <div className="rounded-2xl bg-[#24171e] border border-[#49303a] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#160e13] text-[10px] uppercase font-bold text-slate-400 border-b border-[#49303a]">
                    <tr>
                      <th className="py-3 px-4">Placement</th>
                      <th className="py-3 px-4">Participant / Squad</th>
                      <th className="py-3 px-4">Player IGN</th>
                      <th className="py-3 px-4">Free Fire UID</th>
                      <th className="py-3 px-4 text-center">Kills</th>
                      <th className="py-3 px-4 text-center">Booyah?</th>
                      <th className="py-3 px-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#49303a]">
                    {editedEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-[#301e27]/60">
                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            min="1"
                            value={entry.placement}
                            onChange={(e) => handleEntryChange(idx, 'placement', parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1 rounded bg-[#160e13] border border-[#49303a] text-white font-mono text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                          {entry.placement === 1 && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                          <span>{entry.participantName}</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="IGN"
                            value={entry.inGameName || ''}
                            onChange={(e) => handleEntryChange(idx, 'inGameName', e.target.value)}
                            className="w-28 px-2 py-1 rounded bg-[#160e13] border border-[#49303a] text-brand-orange font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            placeholder="UID"
                            value={entry.playerUid || ''}
                            onChange={(e) => handleEntryChange(idx, 'playerUid', e.target.value)}
                            className="w-32 px-2 py-1 rounded bg-[#160e13] border border-[#49303a] text-amber-300 font-mono text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.kills}
                            onChange={(e) => handleEntryChange(idx, 'kills', parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1 rounded bg-[#160e13] border border-[#49303a] text-white font-mono text-center"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(entry.isBooyah || entry.placement === 1)}
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
              <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-3">
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
                          className="block rounded-lg overflow-hidden border border-[#49303a] hover:border-cyan-400 transition-colors"
                        >
                          <img
                            src={img.screenshotUrl}
                            alt="Evidence screenshot"
                            className="h-28 w-full object-cover"
                          />
                          <span className="block p-1 text-[10px] text-slate-300 truncate bg-[#160e13]">
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
            <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Admin Review Notes / Audit Justification
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Cross-checked with scoreboard screenshot; kill counts matched."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="font-display text-lg font-bold text-white uppercase">
                Ready to Record a Match & Crown Winners?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click below to select a tournament, enter the teams, assign placements (1st Place Booyah), and record kills. Results will instantly publish to the Hall of Fame and update Cash Prize payouts.
              </p>
            </div>
            <button
              type="button"
              onClick={openRecordModal}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white text-xs font-bold uppercase tracking-wider shadow-glow-orange flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Match Results & Declare Winner</span>
            </button>
          </div>
        )}

      </div>

      {/* Record Match & Declare Winner Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#24171e] border border-[#49303a] rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#49303a] pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-orange" />
                <h3 className="font-display text-lg font-bold uppercase text-white">
                  Record Match Results & Declare Winner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#301e27] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Tournament */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Select Tournament *
                  </label>
                  <select
                    value={selectedTournamentId}
                    onChange={(e) => handleTournamentSelect(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
                  >
                    {tournamentsList.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title} ({t.format?.toUpperCase()} — ₹{t.entryFee})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Match Map
                  </label>
                  <select
                    value={modalMap}
                    onChange={(e) => setModalMap(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="NexTerra">NexTerra</option>
                  </select>
                </div>
              </div>

              {selectedTournament && (
                <div className="p-3 rounded-xl bg-[#160e13] border border-[#49303a] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">
                    Format: <strong className="text-white uppercase">{selectedTournament.format}</strong>
                  </span>
                  <span className="text-slate-400">
                    1st Prize Pool: <strong className="text-brand-amber">₹{selectedTournament.prizeConfig?.firstPlace || 0}</strong>
                  </span>
                  <span className="text-slate-400">
                    Scoring: <strong className="text-white">{selectedTournament.scoringConfig?.killPointValue || 1} pt/kill + {selectedTournament.scoringConfig?.booyahBonus || 12} Booyah</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Scorecard Entries Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Participant Scorecard & Placements ({modalEntries.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddParticipantRow}
                  className="text-xs font-bold text-brand-orange hover:text-brand-amber flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add Team Row
                </button>
              </div>

              {loadingRegistrations ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Loading verified tournament participants...
                </div>
              ) : (
                <div className="rounded-xl border border-[#49303a] overflow-hidden bg-[#160e13]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#24171e] text-[10px] uppercase font-bold text-slate-400 border-b border-[#49303a]">
                      <tr>
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Team / Participant</th>
                        <th className="py-2.5 px-3">Player Name</th>
                        <th className="py-2.5 px-3">In-Game Name (IGN)</th>
                        <th className="py-2.5 px-3">Free Fire UID</th>
                        <th className="py-2.5 px-3 text-center">Kills</th>
                        <th className="py-2.5 px-3 text-center">Booyah?</th>
                        <th className="py-2.5 px-3 text-right">Points</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#49303a]">
                      {modalEntries.map((entry, idx) => (
                        <tr
                          key={idx}
                          className={`${
                            entry.placement === 1 ? 'bg-amber-950/20' : 'hover:bg-[#301e27]/40'
                          }`}
                        >
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={entry.placement}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'placement', parseInt(e.target.value, 10))
                              }
                              className="w-14 px-2 py-1 rounded bg-[#24171e] border border-[#49303a] text-white font-mono text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[130px]">
                            <input
                              type="text"
                              value={entry.participantName}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'participantName', e.target.value)
                              }
                              placeholder="e.g. Phoenix Fire"
                              className="w-full px-2.5 py-1 rounded bg-[#24171e] border border-[#49303a] text-white font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[110px]">
                            <input
                              type="text"
                              value={entry.playerName || ''}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'playerName', e.target.value)
                              }
                              placeholder="Player Name"
                              className="w-full px-2 py-1 rounded bg-[#24171e] border border-[#49303a] text-white"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[110px]">
                            <input
                              type="text"
                              value={entry.inGameName || ''}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'inGameName', e.target.value)
                              }
                              placeholder="IGN"
                              className="w-full px-2 py-1 rounded bg-[#24171e] border border-[#49303a] text-white font-mono text-brand-orange"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[120px]">
                            <input
                              type="text"
                              value={entry.playerUid || ''}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'playerUid', e.target.value)
                              }
                              placeholder="e.g. 1401364963"
                              className="w-full px-2 py-1 rounded bg-[#24171e] border border-[#49303a] text-white font-mono text-amber-300"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={entry.kills}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'kills', parseInt(e.target.value, 10))
                              }
                              className="w-16 px-2 py-1 rounded bg-[#24171e] border border-[#49303a] text-white font-mono text-center"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(entry.isBooyah || entry.placement === 1)}
                              onChange={(e) =>
                                handleModalEntryChange(idx, 'isBooyah', e.target.checked)
                              }
                              className="rounded text-brand-orange"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-display font-extrabold text-brand-orange">
                            {entry.calculatedPoints} pts
                          </td>
                          <td className="py-2 px-3 text-center flex items-center justify-center gap-1.5 pt-3">
                            <button
                              type="button"
                              title="Set as 1st Place Champion"
                              onClick={() => handleSetChampion(idx)}
                              className={`p-1 rounded text-xs transition-colors ${
                                entry.placement === 1
                                  ? 'text-amber-400 bg-amber-950/40'
                                  : 'text-slate-500 hover:text-amber-400'
                              }`}
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Remove row"
                              onClick={() => handleRemoveParticipantRow(idx)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Step 3: Match Notes & Evidence (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Scoreboard Screenshot URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... image link"
                  value={modalScreenshot}
                  onChange={(e) => setModalScreenshot(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Match Notes / Comments
                </label>
                <input
                  type="text"
                  placeholder="e.g. Final custom room Booyah match."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#49303a] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#301e27] hover:bg-[#49303a] text-slate-300 text-xs font-bold uppercase transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isSubmittingRecord}
                  onClick={() => handleSubmitRecord(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#301e27] hover:bg-[#49303a] text-slate-200 border border-[#49303a] text-xs font-bold uppercase transition-colors"
                >
                  Save as Draft to Queue
                </button>

                <button
                  type="button"
                  disabled={isSubmittingRecord}
                  onClick={() => handleSubmitRecord(true)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>{isSubmittingRecord ? 'Publishing...' : 'Save & Officially Publish'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
