import { site } from '../../config/site.js';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentAvailability } from '../../utils/tournament.js';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  User, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle, 
  MessageCircle, 
  Copy, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning Slot', time: '10:00 AM – 12:30 PM', matches: '5 Matches' },
  { id: 'afternoon', label: 'Afternoon Slot', time: '2:00 PM – 4:30 PM', matches: '4 to 5 Matches' },
  { id: 'evening', label: 'Evening Slot', time: '6:00 PM – 8:30 PM', matches: '4 to 5 Matches' },
];

export default function SoloRegisterPage() {
  usePageMeta('Solo Registration (1 Player) | Rahul Esports', 'Register as a solo Free Fire player. Choose your preferred time session. Room ID & password dispatched to Player WhatsApp.');
  const { tournamentId } = useParams();
  const { user } = useAuth();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Flow step: 'form' -> 'payment' -> 'success'
  const [step, setStep] = useState('form');

  // Saved Solo Auto-Fill State
  const [savedSolo, setSavedSolo] = useState(() => {
    try {
      const raw = localStorage.getItem('savedSoloRoster');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Form State
  const [preferredSlot, setPreferredSlot] = useState('morning');
  const [name, setName] = useState(() => user?.name || '');
  const [phone, setPhone] = useState(() => user?.mobileNumber || '');
  const [inGameName, setInGameName] = useState(() => user?.inGameName || '');
  const [freeFireUid, setFreeFireUid] = useState(() => user?.freeFireUid || '');

  // Payment state
  const [utrNumber, setUtrNumber] = useState('');
  const [registrationResult, setRegistrationResult] = useState(null);
  const [upiId, setUpiId] = useState(site.adminUpiId || '');
  const [upiPayeeName, setUpiPayeeName] = useState(site.adminUpiName || site.name);

  // Auto-sync with logged in user
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!phone && user.mobileNumber) setPhone(user.mobileNumber);
      if (!inGameName && user.inGameName) setInGameName(user.inGameName);
      if (!freeFireUid && user.freeFireUid) setFreeFireUid(user.freeFireUid);
    }
  }, [user]);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const [res, settingsRes] = await Promise.all([
          api.get('/tournaments'),
          api.get('/settings/public').catch(() => null),
        ]);
        if (res.success) {
          const found = res.tournaments.find((t) => t._id === tournamentId);
          if (found) {
            setTournament(found);
          } else {
            setError('Tournament not found or inactive');
          }
        }
        if (settingsRes?.success && settingsRes.settings) {
          if (settingsRes.settings.upiId) setUpiId(settingsRes.settings.upiId);
          if (settingsRes.settings.upiPayeeName) setUpiPayeeName(settingsRes.settings.upiPayeeName);
        }
      } catch (err) {
        setError('Failed to fetch tournament information');
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [tournamentId]);

  const handleApplySavedSolo = () => {
    if (!savedSolo) return;
    if (savedSolo.name) setName(savedSolo.name);
    if (savedSolo.phone) setPhone(savedSolo.phone);
    if (savedSolo.inGameName) setInGameName(savedSolo.inGameName);
    if (savedSolo.freeFireUid) setFreeFireUid(savedSolo.freeFireUid);
  };

  const handleClearSavedSolo = () => {
    try {
      localStorage.removeItem('savedSoloRoster');
    } catch {}
    setSavedSolo(null);
  };

  const handleGoToPayment = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your Full Name.');
      return;
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim().replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    // Persist solo data for 1-tap future registrations
    try {
      const soloToSave = {
        name: name.trim(),
        phone: phone.trim(),
        inGameName: inGameName.trim(),
        freeFireUid: freeFireUid.trim(),
      };
      localStorage.setItem('savedSoloRoster', JSON.stringify(soloToSave));
      setSavedSolo(soloToSave);
    } catch {}

    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (utrNumber.trim() && !/^\d{12}$/.test(utrNumber.trim())) {
      setError('UTR / Reference number must be exactly 12 digits (numbers only).');
      return;
    }

    setSubmitting(true);

    try {
      const activeSlotObj = TIME_SLOTS.find((s) => s.id === preferredSlot) || TIME_SLOTS[0];

      const res = await api.post('/registrations/solo', {
        tournamentId,
        preferredSlot,
        slotTime: activeSlotObj.time,
        utr: utrNumber.trim(),
        inGameName: inGameName.trim() || name.trim(),
        freeFireUid: freeFireUid.trim() || 'N/A',
        captain: {
          name: name.trim(),
          phone: phone.trim(),
          email: user?.email || '',
        },
      });

      if (res.success) {
        setRegistrationResult(res);
        setStep('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.message || 'Failed to submit registration. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-display text-sm uppercase tracking-wider text-slate-400">Loading Tournament Details...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-display text-2xl font-bold uppercase text-white">Tournament Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'The tournament you are looking for does not exist.'}</p>
        <Link to="/tournaments" className="inline-block mt-4 px-6 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold uppercase">
          Return to Tournaments
        </Link>
      </div>
    );
  }

  const activeSlot = TIME_SLOTS.find((s) => s.id === preferredSlot) || TIME_SLOTS[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between border-b border-[#412a34] pb-4">
        <Link to={`/tournaments/${tournament.slug}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 text-brand-orange" />
          <span>Back to Match Overview</span>
        </Link>
        <span className="text-xs font-bold uppercase text-amber-400 px-3 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30">
          Solo Battle Royale
        </span>
      </div>

      {/* Tournament Header Summary */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Official Registration</span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-0.5">
            {tournament.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
            <span>Map: <strong className="text-white">{tournament.map || 'Bermuda'}</strong></span>
            <span>·</span>
            <span>Total Prize Pool: <strong className="text-brand-amber font-bold">₹{tournament.prizeConfig?.totalPool || 0}</strong></span>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 border-[#412a34] pt-3 sm:pt-0 w-full sm:w-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Solo Entry Fee</span>
          <strong className="text-2xl sm:text-3xl font-display font-extrabold text-amber-400">
            ₹{tournament.entryFee}
          </strong>
          <span className="text-[11px] text-slate-400 block mt-0.5">Pay via direct UPI</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: FORM */}
      {step === 'form' && (
        <form onSubmit={handleGoToPayment} className="space-y-8">
          
          {/* Section A: Preferred Match Time Slot */}
          <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest block">Step 1 of 2</span>
              <h2 className="font-display text-xl font-bold uppercase text-white mt-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-orange" />
                Select Preferred Match Session
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the time window you prefer. Track how many matches are completed versus open.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                {
                  id: 'morning',
                  label: 'Morning Slot',
                  time: tournament.matchSessions?.morning?.timeRange || '10:00 AM – 12:30 PM',
                  total: tournament.matchSessions?.morning?.totalMatches ?? 5,
                  completed: tournament.matchSessions?.morning?.completedMatches ?? 0,
                },
                {
                  id: 'afternoon',
                  label: 'Afternoon Slot',
                  time: tournament.matchSessions?.afternoon?.timeRange || '2:00 PM – 4:30 PM',
                  total: tournament.matchSessions?.afternoon?.totalMatches ?? 4,
                  completed: tournament.matchSessions?.afternoon?.completedMatches ?? 0,
                },
                {
                  id: 'evening',
                  label: 'Evening Slot',
                  time: tournament.matchSessions?.evening?.timeRange || '6:00 PM – 8:30 PM',
                  total: tournament.matchSessions?.evening?.totalMatches ?? 4,
                  completed: tournament.matchSessions?.evening?.completedMatches ?? 0,
                },
              ].map((slot) => {
                const isSelected = preferredSlot === slot.id;
                const remainingMatches = Math.max(0, slot.total - slot.completed);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setPreferredSlot(slot.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-orange bg-brand-orange/20 shadow-glow-orange scale-[1.02]'
                        : 'border-[#393236] bg-[#1b1017] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold uppercase tracking-wider ${isSelected ? 'text-brand-orange' : 'text-slate-300'}`}>
                        {slot.label}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-brand-orange" />}
                    </div>
                    <div className="font-display text-base font-bold text-white mt-1">
                      {slot.time}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {slot.total} Matches · <strong className="text-amber-300 font-mono">{slot.completed} done</strong> ({remainingMatches} open)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Player Details */}
          <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest block">Step 2 of 2</span>
              <h2 className="font-display text-xl font-bold uppercase text-white mt-1 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-orange" />
                Solo Player Information
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Custom Room ID & Password will be delivered to this WhatsApp number before match start.
              </p>
            </div>

            {/* 1-Tap Auto-Fill Saved Solo Banner */}
            {savedSolo && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-amber-200">Saved Player: </span>
                    <span className="text-white font-mono font-bold">{savedSolo.name || 'Saved Solo'}</span>
                    {savedSolo.inGameName && (
                      <span className="text-amber-300/80 ml-1.5 font-mono">
                        (IGN: {savedSolo.inGameName})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleApplySavedSolo}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow"
                  >
                    Auto-Fill Info
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSavedSolo}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs uppercase transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your legal or display name"
                  className="w-full px-4 py-3 rounded-xl bg-[#1b1017] border border-[#393236] text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  WhatsApp Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 rounded-xl bg-[#1b1017] border border-[#393236] text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Free Fire In-Game Name (Optional)
                </label>
                <input
                  type="text"
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                  placeholder="e.g. Rahul_Headshot"
                  className="w-full px-4 py-3 rounded-xl bg-[#1b1017] border border-[#393236] text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Free Fire UID (Optional)
                </label>
                <input
                  type="text"
                  value={freeFireUid}
                  onChange={(e) => setFreeFireUid(e.target.value)}
                  placeholder="Numbers only (e.g. 123456789)"
                  className="w-full px-4 py-3 rounded-xl bg-[#1b1017] border border-[#393236] text-white text-sm focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300">
                Preferred: <strong className="text-white">{activeSlot.label} ({activeSlot.time})</strong>
              </p>
              <p className="text-xs text-emerald-400 mt-0.5">
                Player: <strong>{name || 'Player'} ({phone || 'Phone pending'})</strong>
              </p>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-extrabold uppercase tracking-wider text-white text-sm shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>GO — PROCEED TO PAYMENT (₹{tournament.entryFee})</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PAYMENT SCREEN */}
      {step === 'payment' && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#1c1b1e] border border-[#393236] space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#412a34] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest block">Checkout & UPI Payment</span>
                <h2 className="font-display text-2xl font-bold uppercase text-white mt-1">
                  Pay ₹{tournament.entryFee} for Solo Slot
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Player: <strong>{name}</strong> · Slot: <strong>{activeSlot.label} ({activeSlot.time})</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-[#1b1017] border border-[#412a34]"
              >
                Edit Info
              </button>
            </div>

            {/* Scannable Dynamic QR Code Card */}
            <div className="p-6 rounded-2xl bg-[#1b1017] border border-brand-orange/40 flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-2xl shrink-0 flex items-center justify-center">
                <img
                  src={`${site.qrCodeApiUrl.replace(/\/+$/, '')}/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName)}&am=${tournament.entryFee}&cu=INR`)}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 flex-1 text-center md:text-left">
                <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest block">
                  Scan to Pay ₹{tournament.entryFee} via Any UPI App
                </span>
                <h3 className="font-display text-lg font-bold text-white uppercase">
                  Google Pay, PhonePe, Paytm, BHIM
                </h3>
                <p className="text-xs text-slate-400">
                  Scan the QR code or pay manually to our verified organizer UPI ID:
                </p>

                <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
                  <span className="font-mono text-sm font-bold text-brand-amber bg-[#1c1b1e] px-3.5 py-1.5 rounded-xl border border-[#393236]">
                    {upiId || 'UPI ID pending admin configuration'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (upiId) {
                        await navigator.clipboard.writeText(upiId);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="p-2 rounded-xl bg-[#1c1b1e] hover:bg-[#292428] text-slate-300 hover:text-white border border-[#393236] transition-colors"
                    title="Copy UPI ID"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* UTR Input Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                12-Digit UPI UTR / Transaction Reference Number *
              </label>
              <input
                type="text"
                required
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 432198765432"
                className="w-full px-4 py-3 rounded-xl bg-[#1b1017] border border-[#393236] text-white text-base font-mono tracking-wider focus:outline-none focus:border-brand-orange"
              />
              <p className="text-[11px] text-slate-400">
                Found in your UPI payment receipt details (12 digits numbers only).
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-extrabold uppercase tracking-wider text-white text-base shadow-glow-orange hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting Registration...' : `CONFIRM & SUBMIT REGISTRATION (₹${tournament.entryFee})`}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUCCESS & WHATSAPP DISPATCH */}
      {step === 'success' && registrationResult && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#1c1b1e] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-glow-emerald">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block">
              Registration Recorded
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white">
              Solo Player Successfully Registered!
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
              Your registration reference ID has been generated. Please send payment verification to Admin WhatsApp to confirm your match slot.
            </p>
          </div>

          {/* Reference Card */}
          <div className="p-5 rounded-2xl bg-[#1b1017] border border-[#393236] max-w-md mx-auto text-left space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#412a34]">
              <span className="text-xs text-slate-400 font-semibold">Reference ID:</span>
              <strong className="text-base font-mono font-bold text-brand-orange">
                {registrationResult.registration.referenceId}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Player Name:</span>
              <span className="text-white font-bold">{registrationResult.registration.playerName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Selected Session:</span>
              <span className="text-brand-amber font-bold">{registrationResult.registration.slotTime}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">WhatsApp Phone:</span>
              <span className="text-emerald-400 font-bold">{registrationResult.registration.playerPhone}</span>
            </div>
            {registrationResult.registration.utr && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Submitted UTR:</span>
                <span className="font-mono text-slate-200">{registrationResult.registration.utr}</span>
              </div>
            )}
          </div>

          {/* High-Impact Admin WhatsApp CTA */}
          <div className="pt-2 max-w-md mx-auto space-y-3">
            <a
              href={registrationResult.paymentInstructions.whatsappChatUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-display font-extrabold uppercase text-white text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-95 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>SEND DETAILS TO ADMIN WHATSAPP</span>
            </a>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Admin will verify your 12-digit UTR on WhatsApp, schedule your room, and dispatch the Custom Room ID & Password to your WhatsApp 15-20 minutes before match time.
            </p>
          </div>

          <div className="pt-4 border-t border-[#412a34] flex justify-center gap-4">
            <Link to="/tournaments" className="text-xs font-bold uppercase text-slate-400 hover:text-white">
              Back to Tournaments
            </Link>
            <span>·</span>
            <Link to="/status" className="text-xs font-bold uppercase text-brand-orange hover:text-white">
              Track Registration Status
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
