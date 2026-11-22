import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { 
  KeyRound, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  ExternalLink,
  RefreshCw, 
  Mail, 
  Users, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';

export default function AdminRooms() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [verifiedRegistrations, setVerifiedRegistrations] = useState([]);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  // Room Credentials input
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [customNote, setCustomNote] = useState('Match starts promptly in 15 minutes. Join your assigned slot.');
  
  // Recipient selection
  const [selectedRegIds, setSelectedRegIds] = useState([]);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const res = await api.get('/tournaments');
        if (res.success && res.tournaments.length > 0) {
          setTournaments(res.tournaments);
          setSelectedTournamentId(res.tournaments[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;

    const loadTournamentData = async () => {
      setLoading(true);
      setStatusMessage({ type: '', text: '' });
      try {
        const [regRes, logsRes] = await Promise.all([
          api.get(`/admin/registrations?tournamentId=${selectedTournamentId}&paymentStatus=verified`),
          api.get(`/admin/rooms/${selectedTournamentId}/logs`),
        ]);

        if (regRes.success) {
          setVerifiedRegistrations(regRes.registrations || []);
          // Pre-select all verified registrations by default
          setSelectedRegIds((regRes.registrations || []).map((r) => r._id));
        }
        if (logsRes.success) {
          setDeliveryLogs(logsRes.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTournamentData();
  }, [selectedTournamentId]);

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!roomId.trim() || !roomPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Room ID and Password are both required' });
      return;
    }

    setSavingCredentials(true);
    try {
      const res = await api.post(`/admin/rooms/${selectedTournamentId}`, {
        roomId,
        roomPassword,
      });
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Room ID & Password securely saved in match record.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save room credentials' });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleSendEmails = async () => {
    if (selectedRegIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one verified registration.' });
      return;
    }

    setSendingEmails(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await api.post(`/admin/rooms/${selectedTournamentId}/send`, {
        registrationIds: selectedRegIds,
        customNote,
      });

      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        // Refresh delivery logs
        const logsRes = await api.get(`/admin/rooms/${selectedTournamentId}/logs`);
        if (logsRes.success) setDeliveryLogs(logsRes.logs || []);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to distribute credentials' });
    } finally {
      setSendingEmails(false);
    }
  };

  const handleRetryLog = async (logId) => {
    setRetryingId(logId);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await api.post(`/admin/rooms/retry/${logId}`);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'Email successfully redelivered' });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Retry delivery failed' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Retry delivery failed' });
    } finally {
      setRetryingId(null);
      try {
        const logsRes = await api.get(`/admin/rooms/${selectedTournamentId}/logs`);
        if (logsRes.success) setDeliveryLogs(logsRes.logs || []);
      } catch (e) {
        // ignore
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedRegIds.length === verifiedRegistrations.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(verifiedRegistrations.map((r) => r._id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedRegIds.includes(id)) {
      setSelectedRegIds(selectedRegIds.filter((item) => item !== id));
    } else {
      setSelectedRegIds([...selectedRegIds, id]);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase text-white tracking-wide">
          Room ID & Password Distribution
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Store confidential room credentials and dispatch them via Brevo transactional emails exclusively to verified players.
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'error'
              ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Brevo IP Whitelist Security Notice */}
      {deliveryLogs.some((l) => l.errorMessage?.includes('authorised_ips') || l.errorMessage?.includes('unrecognised IP address')) && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Action Required: Authorize Server IP in Brevo</p>
            <p className="text-slate-300 leading-relaxed">
              Brevo rejected email delivery because IP <code className="font-mono text-white bg-black/60 px-1.5 py-0.5 rounded border border-white/10 font-bold">103.144.192.239</code> is not in your Brevo Authorised IPs list.
            </p>
            <a
              href="https://app.brevo.com/security/authorised_ips"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-cyan-400 hover:text-cyan-300 hover:underline pt-1 text-xs"
            >
              Authorize IP (103.144.192.239) in Brevo Settings <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Tournament Selector Bar */}
      <div className="p-4 rounded-xl bg-[#24171e] border border-[#49303a] flex items-center gap-3">
        <label className="text-xs font-bold uppercase text-slate-400">Select Tournament:</label>
        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
        >
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title} ({t.format})
            </option>
          ))}
        </select>
      </div>

      {/* 2-Column Workflow Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Step 1: Set Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#49303a] pb-3">
            <KeyRound className="w-5 h-5 text-brand-orange" />
            <h3 className="font-display text-lg font-bold uppercase text-white">
              Step 1: Enter Room Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Custom Room ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 5829104"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Room Password *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1234"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Custom Message to Players
            </label>
            <textarea
              rows="2"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[#160e13] border border-[#49303a] text-xs text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <button
            type="submit"
            disabled={savingCredentials}
            className="w-full py-2.5 rounded-xl bg-[#301e27] hover:bg-brand-orange hover:text-white text-slate-200 border border-[#49303a] text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {savingCredentials ? 'Saving...' : 'Save Room Credentials'}
          </button>
        </form>

        {/* Step 2: Recipient Selection & Dispatch */}
        <div className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#49303a] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <h3 className="font-display text-lg font-bold uppercase text-white">
                  Step 2: Select Recipients ({selectedRegIds.length}/{verifiedRegistrations.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-cyan-400 hover:underline font-bold"
              >
                {selectedRegIds.length === verifiedRegistrations.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* List of Verified Registrations */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {verifiedRegistrations.length > 0 ? (
                verifiedRegistrations.map((reg) => (
                  <label
                    key={reg._id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      selectedRegIds.includes(reg._id)
                        ? 'bg-purple-950/40 border-purple-500/40 text-white'
                        : 'bg-[#160e13] border-[#49303a] text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedRegIds.includes(reg._id)}
                        onChange={() => toggleSelectOne(reg._id)}
                        className="rounded text-brand-orange"
                      />
                      <span className="font-mono font-bold text-brand-orange">{reg.referenceId}</span>
                      <span className="text-white font-medium">
                        {reg.format === 'squad' ? reg.teamName : reg.players[0]?.inGameName}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
                      {reg.captain.email}
                    </span>
                  </label>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No payment-verified registrations yet for this tournament.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={sendingEmails || selectedRegIds.length === 0}
            onClick={handleSendEmails}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 font-display font-bold uppercase tracking-wider text-white text-xs shadow-glow-cyan disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {sendingEmails ? (
              'Dispatching via Brevo...'
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Room Details to {selectedRegIds.length} Verified Recipient(s)
              </>
            )}
          </button>
        </div>

      </div>

      {/* Delivery Logs Table */}
      <div className="rounded-2xl bg-[#24171e] border border-[#49303a] overflow-hidden shadow-xl space-y-4 p-6">
        <h3 className="font-display text-lg font-bold uppercase text-white">
          Email Delivery Reports ({deliveryLogs.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#160e13] text-[10px] uppercase font-bold text-slate-400 border-b border-[#49303a]">
              <tr>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Team / Ref</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Sent At</th>
                <th className="py-2.5 px-4">Message ID</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#49303a]">
              {deliveryLogs.length > 0 ? (
                deliveryLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#301e27]">
                    <td className="py-2.5 px-4 text-white font-medium">{log.recipientEmail}</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {log.registrationId?.referenceId} ({log.registrationId?.teamName || 'Solo'})
                    </td>
                    <td className="py-2.5 px-4">
                      {log.deliveryStatus === 'sent' ? (
                        <span className="text-emerald-400 font-bold">Sent</span>
                      ) : (
                        <div>
                          <span className="text-rose-400 font-bold">Failed</span>
                          {log.errorMessage && (
                            <p className="text-[10px] text-rose-300/80 mt-0.5 max-w-[220px] truncate" title={log.errorMessage}>
                              {log.errorMessage.includes('authorised_ips')
                                ? 'IP 103.144.192.239 not authorized in Brevo'
                                : log.errorMessage}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {log.sentAt ? new Date(log.sentAt).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[10px] truncate max-w-[120px]">
                      {log.providerMessageId || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {log.deliveryStatus === 'failed' && (
                        <button
                          onClick={() => handleRetryLog(log._id)}
                          disabled={retryingId === log._id}
                          className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-bold hover:bg-rose-900 disabled:opacity-50 inline-flex items-center gap-1 transition-colors"
                        >
                          {retryingId === log._id ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            'Retry'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No room credentials dispatched yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
