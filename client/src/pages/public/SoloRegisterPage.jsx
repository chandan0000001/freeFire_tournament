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
  Zap,
  Coins,
  CreditCard 
} from 'lucide-react';

export default function SoloRegisterPage() {
  const { tournamentId } = useParams();
  usePageMeta('Solo Registration | Free Fire Tournament | Rahul Esports Odisha', 'Register as a solo Free Fire player for Rahul Esports weekly tournaments. In-app coin entry and room verification.');

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('WALLET_COINS'); // 'WALLET_COINS' | 'MANUAL_UPI'

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeRollNo, setCollegeRollNo] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [isConsentPublic, setIsConsentPublic] = useState(false);
  const [agreed, setAgreed] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!tournament || tournament.format !== 'solo' || !tournamentAvailability(tournament).canRegister) {
      setError('Registration is unavailable for this tournament or format. Please choose an open match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the tournament fair play rules & eligibility notice');
      return;
    }

    const cleanUid = freeFireUid.trim();
    if (!/^\d{6,17}$/.test(cleanUid)) {
      setError('Free Fire UID must be numbers only, between 6 and 17 digits.');
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMethod === 'WALLET_COINS') {
        const payload = {
          tournamentId,
          format: 'solo',
          captain: {
            name,
            email,
            phone,
            collegeRollNo: collegeRollNo || 'N/A',
          },
          players: [
            {
              name,
              inGameName,
              freeFireUid,
              isConsentPublic,
            },
          ],
        };
        const res = await api.post(`/tournaments/${tournamentId}/join-with-coins`, payload);
        if (res.success) {
          setSuccessData(res);
        }
      } else {
        const payload = {
          tournamentId,
          captain: {
            name,
            email,
            phone,
            collegeRollNo,
          },
          inGameName,
          freeFireUid,
          isConsentPublic,
        };

        const res = await api.post('/registrations/solo', payload);
        if (res.success) {
          setSuccessData(res);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('Insufficient coins')) {
        setError(`${err.message} You can top up coins in your Player Wallet.`);
      } else {
        setError(err.message || 'Solo registration failed. Please check your inputs.');
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
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Loading registration portal...</p>
      </div>
    );
  }

  // Success State
  if (successData) {
    const { registration, paymentInstructions } = successData;
    const isCoinsPaid = registration?.paymentStatus === 'verified';

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#24171e] border border-emerald-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {isCoinsPaid ? 'Solo Slot Confirmed & Verified Instantly' : 'Solo Slot Reserved — Payment Required'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white mt-1">
              {registration?.inGameName}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Tournament: <strong>{registration?.tournamentTitle || tournament?.title}</strong>
            </p>
          </div>

          {/* Reference ID Callout Box */}
          <div className="p-4 rounded-xl bg-[#160e13] border border-[#49303a] flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">Your Reference ID</p>
              <p className="font-mono text-xl font-bold text-brand-orange">{registration?.referenceId}</p>
            </div>
            <button
              onClick={() => copyToClipboard(registration?.referenceId || '')}
              className="px-3 py-1.5 rounded-lg bg-[#301e27] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 border border-[#49303a]"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Coins Paid Notice */}
          {isCoinsPaid && (
            <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
              <span className="font-display font-extrabold text-base text-emerald-400 uppercase">
                Paid with {tournament?.entryFee || 14} Wallet Coins
              </span>
              <p className="text-xs text-slate-300">
                Your solo slot is confirmed. Custom Room ID and Password will be emailed to <strong>{email}</strong> before match kick-off.
              </p>
              <div className="pt-2">
                <Link
                  to="/tournaments"
                  className="inline-block px-5 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Return to Tournaments
                </Link>
              </div>
            </div>
          )}

          {/* UPI Payment Instructions Card */}
          {!isCoinsPaid && paymentInstructions && (
            <>
              <div className="p-5 rounded-xl bg-[#160e13] border border-brand-amber/30 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-[#49303a] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand-amber">Payment Details</span>
                    <p className="text-xs text-slate-300">
                      Payee: <strong className="text-white">{paymentInstructions.payeeName || 'Admin'}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Amount</span>
                    <p className="font-display text-xl font-extrabold text-emerald-400">₹{registration.entryFee}</p>
                  </div>
                </div>

                {/* UPI ID with 1-click copy */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#301e27] border border-[#49303a]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI ID</span>
                    <span className="font-mono font-bold text-sm text-cyan-400">{paymentInstructions.upiId}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentInstructions.upiId)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy UPI
                  </button>
                </div>

                {/* Scannable Dynamic QR Code */}
                {paymentInstructions.qrCodeUrl && (
                  <div className="text-center py-2 space-y-2">
                    <div className="inline-block p-2 rounded-xl bg-white shadow-md">
                      <img
                        src={paymentInstructions.qrCodeUrl}
                        alt="Scan UPI QR Code"
                        className="w-44 h-44 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong>
                    </p>
                  </div>
                )}

                {/* 1-Tap Mobile UPI App Link */}
                {paymentInstructions.upiDeepLink && (
                  <a
                    href={paymentInstructions.upiDeepLink}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-display font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Pay ₹{registration.entryFee} via Any UPI App (Mobile Only)
                  </a>
                )}
              </div>

              {/* 1-Tap WhatsApp CTA Button */}
              <div className="space-y-2">
                <p className="text-xs text-slate-400 text-left">
                  After payment, send your payment screenshot & UTR to admin:
                </p>
                <a
                  href={paymentInstructions.whatsappChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 fill-slate-950" />
                  Send Payment Screenshot on WhatsApp
                </a>
              </div>
            </>
          )}

          <div className="pt-1">
            <Link to="/status" className="text-xs text-slate-400 hover:text-brand-orange underline">
              Check registration status later using Reference ID
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          Entry Fee: <strong className="text-white">₹{tournament?.entryFee || 14}</strong>. No email OTP required.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name (Player) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City & State (Location) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bhubaneswar, Odisha"
              value={collegeRollNo}
              onChange={(e) => setCollegeRollNo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
            />
            {freeFireUid && freeFireUid.length < 6 && (
              <span className="text-[10px] text-rose-400 mt-1 block">
                Must be at least 6 digits ({freeFireUid.length}/6)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email * (For Room Credentials)</label>
            <input
              type="email"
              required
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone (WhatsApp) *</label>
            <input
              type="tel"
              required
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#160e13] border border-[#49303a] text-sm text-white focus:outline-none focus:border-brand-orange"
            />
          </div>
        </div>

        {/* Public Consent */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isConsentPublic}
              onChange={(e) => setIsConsentPublic(e.target.checked)}
              className="w-4 h-4 rounded text-brand-orange focus:ring-0 bg-[#160e13] border-[#49303a]"
            />
            <span className="text-xs text-slate-300">
              Allow displaying my Free Fire UID on public leaderboard and winners podium.
            </span>
          </label>
        </div>

        {/* Payment Method Selector */}
        <div className="pt-2 space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase">
            Choose Payment Method *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('WALLET_COINS')}
              className={`p-4 rounded-xl border text-left transition-all ${
                paymentMethod === 'WALLET_COINS'
                  ? 'border-brand-orange bg-brand-orange/15 shadow-glow-orange'
                  : 'border-[#49303a] bg-[#160e13] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-brand-orange" />
                  <span>Pay with Wallet Coins</span>
                </span>
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Instant Verification
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Deduct {tournament?.entryFee || 14} Coins from your wallet. Instant slot confirmation!
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('MANUAL_UPI')}
              className={`p-4 rounded-xl border text-left transition-all ${
                paymentMethod === 'MANUAL_UPI'
                  ? 'border-brand-amber bg-brand-amber/15 shadow-md'
                  : 'border-[#49303a] bg-[#160e13] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-brand-amber" />
                  <span>Manual UPI Transfer</span>
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Manual Review
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Pay ₹{tournament?.entryFee || 14} via UPI and submit your 12-digit UTR.
              </p>
            </button>
          </div>
        </div>

        {/* Rules Agreement */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-brand-orange focus:ring-0 bg-[#160e13] border-[#49303a]"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I certify that I am playing on a mobile device without teaming or hacks, and agree to {site.name} official tournament rules.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-base shadow-glow-orange hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? 'Reserving Solo Slot...' : (
            paymentMethod === 'WALLET_COINS'
              ? `Confirm Slot with ${tournament?.entryFee || 14} Coins (Instant)`
              : `Submit Solo Registration (₹${tournament?.entryFee || 14})`
          )}
        </button>

      </form>

    </div>
  );
}
