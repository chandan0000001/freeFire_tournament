import { site } from '../../config/site.js';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tournamentAvailability } from '../../utils/tournament.js';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { 
  User, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle, 
  MessageCircle, 
  Copy, 
  Coins,
  AlertCircle
} from 'lucide-react';

export default function SoloRegisterPage() {
  usePageMeta('Solo Registration (1 Player) | Rahul Esports', 'Register as a solo Free Fire player using in-app wallet coins. Room ID & password dispatched to Player WhatsApp.');
  const { tournamentId } = useParams();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [isConsentPublic, setIsConsentPublic] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Live Wallet Balance State
  const [walletBalance, setWalletBalance] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await api.get('/tournaments');
        if (res.success) {
          const found = res.tournaments.find((t) => t._id === tournamentId);
          if (found) {
            setTournament(found);
          } else {
            setError('Tournament not found or inactive');
          }
        }
      } catch (err) {
        setError('Failed to fetch tournament information');
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [tournamentId]);

  // Real-time wallet lookup for Player Email
  useEffect(() => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || trimmedEmail.length < 5) {
      setWalletBalance(null);
      return;
    }

    const timer = setTimeout(async () => {
      setWalletLoading(true);
      try {
        const res = await api.get(`/wallet/${encodeURIComponent(trimmedEmail)}`);
        if (res.success && res.wallet) {
          setWalletBalance(res.wallet.totalCoins || 0);
        } else {
          setWalletBalance(0);
        }
      } catch (err) {
        setWalletBalance(0);
      } finally {
        setWalletLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!tournament || tournament.format !== 'solo' || !tournamentAvailability(tournament).canRegister) {
      setError('Registration is unavailable for this tournament or format.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the tournament fair play rules & mobile-only policy');
      return;
    }

    const requiredCoins = tournament.entryFee || 14;
    if (walletBalance !== null && walletBalance < requiredCoins) {
      setError(`Insufficient wallet coins! You need ${requiredCoins} Coins to register. Please top up your wallet.`);
      return;
    }

    const cleanUid = freeFireUid.trim();
    if (!/^\d{6,17}$/.test(cleanUid)) {
      setError('Free Fire UID must be numbers only, between 6 and 17 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tournamentId,
        format: 'solo',
        captain: {
          name,
          email,
          phone,
          collegeRollNo: location || 'N/A',
          inGameName,
          freeFireUid: cleanUid,
        },
        players: [
          {
            name,
            inGameName,
            freeFireUid: cleanUid,
            isConsentPublic,
          },
        ],
      };

      // Direct coin registration: deducts coins from wallet and confirms slot instantly
      const res = await api.post(`/tournaments/${tournamentId}/join-with-coins`, payload);
      if (res.success) {
        setSuccessData(res);
      }
    } catch (err) {
      if (err.message && err.message.includes('Insufficient coins')) {
        setError(`${err.message} Please top up your wallet first.`);
      } else {
        setError(err.message || 'Solo registration failed. Please verify your inputs.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading registration portal...</p>
      </div>
    );
  }

  // Registration Confirmed View
  if (successData) {
    const { registration } = successData;
    const requiredCoins = tournament?.entryFee || 14;

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Solo Slot Confirmed Instantly
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1">
              {registration?.players?.[0]?.inGameName || inGameName}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Tournament: <strong>{registration?.tournamentTitle || tournament?.title}</strong>
            </p>
          </div>

          {/* Reference ID Callout Box */}
          <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1F293D] flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">Your Reference ID</p>
              <p className="font-mono text-xl font-bold text-brand-orange">{registration?.referenceId}</p>
            </div>
            <button
              onClick={() => copyToClipboard(registration?.referenceId || '')}
              className="px-3 py-1.5 rounded-lg bg-[#161B26] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 border border-[#1F293D]"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Paid with Coins Notice */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
            <Coins className="w-5 h-5 text-brand-orange" />
            <span>Registered with {requiredCoins} Wallet Coins (Deducted from Wallet)</span>
          </div>

          {/* Prominent WhatsApp Delivery Confirmation */}
          <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 space-y-2 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-extrabold text-base text-emerald-300 uppercase">
              Room Credentials Will Arrive on WhatsApp
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed max-w-md mx-auto">
              Custom Room ID and Password will be sent directly to your <strong>WhatsApp: {phone}</strong> (and {email}) 15–30 minutes before match kick-off.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/tournaments"
              className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Back to Tournaments
            </Link>
            <Link
              to="/wallet"
              className="px-6 py-2.5 rounded-xl bg-[#161B26] text-slate-300 hover:text-white border border-[#1F293D] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              View Player Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const requiredCoins = tournament?.entryFee || 14;
  const isInsufficient = walletBalance !== null && walletBalance < requiredCoins;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header */}
      <div>
        <Link to={`/tournaments/${tournament?.slug}`} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Tournament
        </Link>
        <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider">
          <User className="w-4 h-4" />
          <span>Solo Entry Form (Single Player)</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold uppercase text-white tracking-wide mt-1">
          {tournament?.title || 'Solo Battle Registration'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Entry Fee: <strong className="text-amber-300">{requiredCoins} Coins</strong> (deducted from your Player Wallet).
        </p>
      </div>

      {/* Prominent WhatsApp Delivery Notice */}
      <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white text-xs sm:text-sm font-bold block uppercase tracking-wide">
            Room ID & Password Delivery Notice
          </strong>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
            Custom Room ID and Password will be sent directly to your <strong>WhatsApp ({phone || 'Your Phone Number'})</strong> 15–30 minutes before match kick-off.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-[#1F293D] space-y-6">
        
        {/* Player Details */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold uppercase text-white border-b border-[#1F293D] pb-2">
            Player Information & Credentials
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City & State (Location) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Berhampur, Odisha"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Free Fire In-Game Name (IGN) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex_Sniper"
                value={inGameName}
                onChange={(e) => setInGameName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Free Fire UID (6–17 Digits Only) *
              </label>
              <input
                type="text"
                required
                maxLength={17}
                placeholder="e.g. 1401364963"
                value={freeFireUid}
                onChange={(e) => setFreeFireUid(e.target.value.replace(/[^0-9]/g, '').slice(0, 17))}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
              />
              {freeFireUid && freeFireUid.length < 6 && (
                <span className="text-[10px] text-rose-400 mt-1 block">
                  Must be at least 6 digits ({freeFireUid.length}/6)
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Email * (Wallet Account)
              </label>
              <input
                type="email"
                required
                placeholder="player@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Phone (WhatsApp for Room ID) *
              </label>
              <input
                type="tel"
                required
                placeholder="10-digit WhatsApp number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
        </div>

        {/* Public Consent */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isConsentPublic}
              onChange={(e) => setIsConsentPublic(e.target.checked)}
              className="w-4 h-4 rounded text-brand-orange focus:ring-0 bg-[#0B0E14] border-[#1F293D]"
            />
            <span className="text-xs text-slate-300">
              Allow displaying my Free Fire UID on public leaderboard and winners podium.
            </span>
          </label>
        </div>

        {/* Live Wallet Balance & Coin Deduction Card */}
        <div className="p-4 rounded-xl bg-[#0B0E14] border border-brand-orange/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-xs text-white uppercase flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-brand-orange" />
              <span>Wallet Coin Status</span>
            </span>
            <span className="text-[11px] text-slate-400">1 Coin = ₹1 INR</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:text-left">
            <div className="p-3 rounded-lg bg-[#121722] border border-[#1F293D]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Entry Fee</span>
              <strong className="text-base text-amber-300 font-display font-extrabold">{requiredCoins} Coins</strong>
            </div>

            <div className="p-3 rounded-lg bg-[#121722] border border-[#1F293D]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Available Balance</span>
              <strong className={`text-base font-display font-extrabold ${walletBalance !== null ? (walletBalance >= requiredCoins ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-400'}`}>
                {walletLoading ? 'Checking...' : walletBalance !== null ? `${walletBalance} Coins` : 'Enter email to check'}
              </strong>
            </div>
          </div>

          {/* Insufficient Coins Warning */}
          {isInsufficient && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Need <strong>{requiredCoins - walletBalance} more Coins</strong> to register.</span>
              </div>
              <Link
                to="/wallet"
                target="_blank"
                className="px-4 py-1.5 rounded-lg bg-brand-orange text-white text-[11px] font-bold uppercase tracking-wider hover:brightness-110 shrink-0"
              >
                Top Up Coins in Wallet
              </Link>
            </div>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-orange focus:ring-0 bg-[#0B0E14] border-[#1F293D]"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I certify that I will play only on a mobile device (no PC emulators/hacks) and agree that {requiredCoins} Coins will be deducted from my wallet for registration.
            </span>
          </label>
        </div>

        {/* Submit or Top-Up CTA */}
        {isInsufficient ? (
          <Link
            to="/wallet"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 font-display font-bold uppercase tracking-wider text-white text-base shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Coins className="w-5 h-5" />
            Top Up Coins in Wallet to Register (Need {requiredCoins - walletBalance} Coins)
          </Link>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-base shadow-glow-orange hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? 'Confirming Solo Slot...' : `Confirm Solo Registration with ${requiredCoins} Coins (Instant)`}
          </button>
        )}

      </form>

    </div>
  );
}
