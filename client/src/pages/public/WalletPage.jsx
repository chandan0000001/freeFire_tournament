import { site } from '../../config/site.js';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Coins, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  Zap,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function WalletPage() {
  usePageMeta(
    'Player Coin Wallet | Rahul Esports Odisha',
    'Manage your tournament coins, deposit entry coins via UPI, and withdraw your match winnings directly to your UPI ID.'
  );

  const { user, wallet: authWallet, setWallet: setAuthWallet } = useAuth();
  const [emailInput, setEmailInput] = useState(() => user?.email || localStorage.getItem('re_player_email') || '');
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw' | 'history'
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [adminUpi, setAdminUpi] = useState('');
  const [adminPayeeName, setAdminPayeeName] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [walletConfig, setWalletConfig] = useState({ depositPackages: [], minimumWithdrawal: null });

  // Deposit Form State (Default minimum: 50 coins)
  const [depositCoins, setDepositCoins] = useState(0);
  const [utrNumber, setUtrNumber] = useState('');
  const [playerName, setPlayerName] = useState(() => user?.name || '');
  const [phone, setPhone] = useState(() => user?.mobileNumber || '');
  const [depositLoading, setDepositLoading] = useState(false);

  // Dynamic UPI Deep Link & QR Code for Deposit
  const depositUpiUri = `upi://pay?pa=${encodeURIComponent(adminUpi)}&pn=${encodeURIComponent(adminPayeeName)}&am=${depositCoins}&cu=INR&tn=${encodeURIComponent(`Topup ${depositCoins} Coins - ${wallet?.userEmail || site.name}`)}`;
  const depositQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(depositUpiUri)}`;

  // Withdrawal Form State
  const [withdrawCoins, setWithdrawCoins] = useState('');
  const [upiId, setUpiId] = useState('');
  const [ffUid, setFfUid] = useState(() => user?.freeFireUid || '');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Fetch admin UPI setting
  useEffect(() => {
    api.get('/settings/public')
      .then((res) => {
        if (res.success && res.settings) {
          setWalletConfig(res.settings.walletConfig || { depositPackages: [], minimumWithdrawal: null });
          setDepositCoins(res.settings.walletConfig?.depositPackages?.[0] || 0);
          setAdminUpi(res.settings.upiId || '');
          if (res.settings.upiPayeeName) {
            setAdminPayeeName(res.settings.upiPayeeName);
          }
        }
      })
      .catch(() => setError('Payment configuration could not be loaded. Please reload before making a payment.'));
  }, []);

  // Sync with logged in user
  useEffect(() => {
    if (user?.email) {
      setEmailInput(user.email);
      if (user.name) setPlayerName(user.name);
      if (user.mobileNumber) setPhone(user.mobileNumber);
      if (user.freeFireUid) setFfUid(user.freeFireUid);
      fetchWallet(user.email);
    }
  }, [user]);

  // Auto load wallet if email is already in localStorage and no user
  useEffect(() => {
    if (!user && emailInput.trim()) {
      fetchWallet(emailInput.trim());
    }
  }, []);

  const fetchWallet = async (email) => {
    if (!email) return;
    setLoading(true);
    setWallet(null);
    setTransactions([]);
    setError('');
    try {
      const res = await api.get(`/wallet/${encodeURIComponent(email.toLowerCase().trim())}`);
      if (res.success) {
        setWallet(res.wallet);
        if (setAuthWallet) setAuthWallet(res.wallet);
        setTransactions(res.transactions || []);
        setPendingWithdrawal(res.pendingWithdrawal || null);
        localStorage.setItem('re_player_email', email.toLowerCase().trim());
      }
    } catch (err) {
      setError(err.message || 'Failed to load wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      fetchWallet(emailInput.trim());
    }
  };

  const handleCopyUpi = async () => {
    try { await navigator.clipboard.writeText(adminUpi); setCopiedUpi(true); setTimeout(() => setCopiedUpi(false), 2000); }
    catch { setError('Could not copy. Please select and copy the UPI ID manually.'); }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter your email above first.');
      return;
    }
    if (!adminUpi || !walletConfig.depositPackages.includes(depositCoins)) {
      setError('Payment settings are unavailable or the package is invalid. Please reload and try again.');
      return;
    }
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      setError('UTR number must be exactly 12 digits (numbers only).');
      return;
    }

    setDepositLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/wallet/deposit', {
        userEmail: wallet?.userEmail || emailInput.trim().toLowerCase(),
        playerName,
        phone,
        coinsRequested: depositCoins,
        utrNumber: utrNumber.trim(),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Deposit request submitted! Admin will verify and credit your coins.');
        setUtrNumber('');
        fetchWallet(emailInput.trim());
      }
    } catch (err) {
      setError(err.message || 'Failed to submit deposit request.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter your email above first.');
      return;
    }
    if (!wallet || wallet.userEmail !== emailInput.trim().toLowerCase()) { setError('Look up this email’s wallet before requesting a withdrawal.'); return; }
    const coins = Number(withdrawCoins);
    if (!walletConfig.minimumWithdrawal || !Number.isSafeInteger(coins) || coins < walletConfig.minimumWithdrawal) {
      setError(`Minimum withdrawal is ${walletConfig.minimumWithdrawal ?? 'not configured'} coins.`);
      return;
    }
    if (!upiId.trim() || upiId.trim().length < 5) {
      setError('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm).');
      return;
    }

    setWithdrawLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.post('/wallet/withdraw', {
        userEmail: wallet?.userEmail || emailInput.trim().toLowerCase(),
        playerName: playerName || wallet?.playerName,
        phone: phone || wallet?.phone,
        freeFireUid: ffUid || wallet?.freeFireUid,
        coinsRequested: coins,
        upiId: upiId.trim(),
      });

      if (res.success) {
        setSuccessMsg(`Withdrawal request for ₹${coins} submitted! Admin will transfer funds to ${upiId.trim()}.`);
        setWithdrawCoins('');
        fetchWallet(emailInput.trim());
      }
    } catch (err) {
      setError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wider">
          <Coins className="w-4 h-4 text-brand-orange" />
          <span>{site.name} Coin Economy</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-wide">
          Player Wallet & Coins
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Use coins for 1-click tournament entries without waiting for manual UPI verification. 1 Coin = ₹1 INR.
        </p>
      </div>

      {/* Sign-in Banner for Guests */}
      {!user && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-orange/20 via-amber-500/10 to-transparent border border-brand-orange/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="text-left space-y-0.5">
            <span className="font-display font-extrabold text-sm text-white uppercase tracking-wider block">
              Protect Your Wallet with a Player Account
            </span>
            <p className="text-xs text-slate-300">
              Sign in or create an account to tie your coins, UTR top-ups, and match winnings permanently to your verified login.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              to="/login?redirect=/wallet"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md"
            >
              Sign In
            </Link>
            <Link
              to="/register?redirect=/wallet"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-[#1b1017] text-slate-300 hover:text-white border border-[#49303a] font-bold text-xs uppercase tracking-wider"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* Account / Email Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#24171e] border border-[#49303a] shadow-lg">
        {user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified Player Account</span>
                <strong className="text-sm text-white">{user.name} ({user.email})</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchWallet(user.email)}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 self-end sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Balance</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your registered Captain / Player Email"
                className="w-full px-4 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm focus:outline-none focus:border-brand-orange"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase text-white text-xs sm:text-sm tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              <span>Load Wallet</span>
            </button>
          </form>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live Wallet Balances */}
      {wallet && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Playable Balance */}
          <div className="p-5 rounded-2xl bg-[#24171e] border border-brand-orange/40 relative overflow-hidden shadow-glow-orange">
            <span className="text-[10px] uppercase font-bold text-brand-orange tracking-wider block">
              Total Playable Coins
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                {wallet.totalCoins}
              </span>
              <span className="text-xs text-brand-amber font-bold">Coins (₹{wallet.totalCoins})</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Usable for instant 1-click tournament join across Squad & Solo.
            </p>
          </div>

          {/* Deposit Coins */}
          <div className="p-5 rounded-2xl bg-[#24171e] border border-[#49303a]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Deposit Coins (Purchased)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-slate-200">
                {wallet.depositCoins}
              </span>
              <span className="text-xs text-slate-400 font-medium">Coins</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Credited via UPI top-up. Reserved strictly for tournament entry fees.
            </p>
          </div>

          {/* Winning Coins (Withdrawable) */}
          <div className="p-5 rounded-2xl bg-[#24171e] border border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                Winning Coins (Withdrawable)
              </span>
              <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                100% Payout
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {wallet.withdrawableCoins}
              </span>
              <span className="text-xs text-emerald-300 font-bold">Coins (₹{wallet.withdrawableCoins})</span>
            </div>
            {wallet.lockedCoins > 0 ? (
              <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {wallet.lockedCoins} coins locked in pending review
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-2">
                Earned from tournament victories & kills. Ready for instant UPI payout.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#49303a] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('deposit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'deposit'
              ? 'bg-brand-orange text-white shadow-glow-orange'
              : 'text-slate-400 hover:text-white bg-[#24171e]'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Add Coins (Deposit)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'withdraw'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white bg-[#24171e]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdraw Winnings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'history'
              ? 'bg-[#49303a] text-white'
              : 'text-slate-400 hover:text-white bg-[#24171e]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Passbook ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: ADD COINS (DEPOSIT) */}
      {activeTab === 'deposit' && (!adminUpi || !depositCoins) && <div className="arena-empty" role="status">Deposits are unavailable until the organizer payment settings are loaded.</div>}
      {activeTab === 'deposit' && adminUpi && depositCoins > 0 && (
        <div className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#412a34]">
            <div>
              <h3 className="font-display text-lg font-bold text-white uppercase">
                Purchase Tournament Coins
              </h3>
              <p className="text-xs text-slate-400">
                1 Coin = ₹1 INR. Pay via UPI and submit your 12-digit UTR number below.
              </p>
            </div>
            
            {/* Quick UPI ID Box */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1b1017] border border-brand-orange/40">
              <span className="text-[10px] uppercase font-bold text-slate-400">Official UPI:</span>
              <span className="text-xs font-mono font-bold text-brand-orange">{adminUpi}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Copy UPI ID"
              >
                {copiedUpi ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Step 1: Select Coin Package (Minimum 50) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                1. Select Coin Top-Up Package (Minimum {walletConfig.depositPackages[0]} Coins)
              </label>
              <span className="text-[11px] text-brand-orange font-bold">1 Coin = ₹1 INR</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {walletConfig.depositPackages.map((pack) => (
                <button
                  key={pack}
                  type="button"
                  onClick={() => setDepositCoins(pack)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    depositCoins === pack
                      ? 'border-brand-orange bg-brand-orange/20 shadow-glow-orange scale-[1.02]'
                      : 'border-[#49303a] bg-[#1b1017] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-white">
                    <Coins className={`w-5 h-5 ${depositCoins === pack ? 'text-brand-orange' : 'text-amber-400'}`} />
                    <span className="text-2xl font-display font-black">
                      {pack}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 font-bold block mt-1">
                    Pay ₹{pack}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                    QR Generated
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: DYNAMIC SCANNABLE UPI QR CODE CARD */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#1b1017] border border-brand-orange/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#412a34] pb-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-orange tracking-widest block">
                  2. Scan QR Code to Pay ₹{depositCoins}
                </span>
                <h4 className="font-display text-lg font-bold text-white uppercase mt-0.5">
                  Pay Exactly ₹{depositCoins} for {depositCoins} Tournament Coins
                </h4>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                Dynamic QR Ready
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 justify-center py-2">
              {/* QR Code Container */}
              <div className="text-center space-y-2 shrink-0">
                <div className="inline-block p-3 rounded-2xl bg-white shadow-2xl border-4 border-[#49303a]">
                  <img
                    src={depositQrUrl}
                    alt={`Scan to Pay ₹${depositCoins}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong>
                </p>
              </div>

              {/* Instructions & 1-Tap Mobile Link */}
              <div className="space-y-3.5 max-w-sm text-center md:text-left">
                <div className="p-3 rounded-xl bg-[#24171e] border border-[#49303a] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payee Details</span>
                  <p className="text-xs text-white font-semibold">
                    UPI ID: <span className="font-mono text-cyan-400">{adminUpi}</span>
                  </p>
                  <p className="text-xs text-slate-300">
                    Amount: <strong className="text-emerald-400 font-mono text-sm">₹{depositCoins}.00</strong>
                  </p>
                </div>

                {/* 1-Tap Mobile UPI App Link */}
                <a
                  href={depositUpiUri}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-display font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  Pay ₹{depositCoins} via Any UPI App (Mobile Only)
                </a>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  After completing your ₹{depositCoins} payment, find the <strong>12-digit UTR / UPI Ref No</strong> in your payment app receipt and submit it below for coin credit.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Deposit Verification Form */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase block">
              3. Submit 12-Digit UTR for Admin Verification
            </span>
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Coins Package Selected
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-brand-orange font-display font-extrabold text-base flex items-center justify-between">
                    <span>{depositCoins} Coins</span>
                    <span className="text-xs text-slate-400 font-mono">₹{depositCoins}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    12-Digit UPI UTR / Ref No. *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="12"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 432198765432"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm font-mono tracking-widest focus:border-brand-orange"
                  />
                  {utrNumber && utrNumber.length < 12 && (
                    <span className="text-[10px] text-rose-400 mt-1 block">
                      Must be 12 digits ({utrNumber.length}/12)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Phone (WhatsApp Contact)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your WhatsApp number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm focus:border-brand-orange"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!adminUpi || !depositCoins || depositLoading || !emailInput.trim() || utrNumber.length !== 12}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-sm hover:brightness-110 active:scale-95 shadow-glow-orange transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {depositLoading ? 'Submitting Verification...' : `Submit Verification for ${depositCoins} Coins (₹${depositCoins})`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: WITHDRAW WINNINGS */}
      {activeTab === 'withdraw' && (
        <div className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-6 shadow-xl">
          <div>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Withdraw Match Winnings to UPI
            </h3>
            <p className="text-xs text-slate-400">
              Only coins won from matches and kills can be withdrawn. Zero withdrawal fees or deductions.
            </p>
          </div>

          {/* Pending Review Notice if any */}
          {pendingWithdrawal && (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs sm:text-sm space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Withdrawal Request in Progress</span>
              </div>
              <p className="text-xs text-slate-300">
                You have a pending withdrawal of <strong>₹{pendingWithdrawal.amountInr}</strong> to <code>{pendingWithdrawal.upiId}</code> (Ref: {pendingWithdrawal.referenceId}). Admin is verifying payment.
              </p>
            </div>
          )}

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Coins to Withdraw (Max: {wallet?.withdrawableCoins || 0})
                </label>
                <input
                  type="number"
                  min={walletConfig.minimumWithdrawal}
                  max={wallet?.withdrawableCoins || 0}
                  required
                  value={withdrawCoins}
                  onChange={(e) => setWithdrawCoins(e.target.value)}
                  placeholder={`Enter coins (Min ${walletConfig.minimumWithdrawal}, Max ${wallet?.withdrawableCoins || 0})`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm font-bold focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Your UPI ID (Google Pay, PhonePe, Paytm)
                </label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. player@okhdfcbank or 9876543210@paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1b1017] border border-[#49303a] text-white text-xs sm:text-sm font-mono focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={withdrawLoading || !wallet || !walletConfig.minimumWithdrawal || (wallet?.withdrawableCoins || 0) < walletConfig.minimumWithdrawal}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-display font-bold uppercase tracking-wider text-white text-sm hover:brightness-110 active:scale-95 shadow-lg transition-all disabled:opacity-50"
            >
              {withdrawLoading ? 'Submitting Withdrawal...' : 'Request Instant UPI Withdrawal'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PASSBOOK & TRANSACTION HISTORY */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-2xl bg-[#24171e] border border-[#49303a] space-y-4 shadow-xl">
          <h3 className="font-display text-lg font-bold text-white uppercase">
            Coin Passbook & Transaction Ledger
          </h3>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#1b1017] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#49303a]">
                  <tr>
                    <th className="p-3">Reference / Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Coins</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#412a34]">
                  {transactions.map((tx) => {
                    const isCredit = ['DEPOSIT', 'TOURNAMENT_WIN', 'WITHDRAWAL_REFUND'].includes(tx.type);
                    return (
                      <tr key={tx._id} className="hover:bg-[#141A26] transition-colors">
                        <td className="p-3">
                          <span className="font-mono text-slate-400 block">{tx.referenceId || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs truncate">{tx.description || '-'}</td>
                        <td className="p-3 text-right font-display font-extrabold text-sm">
                          <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isCredit ? `+${tx.amount}` : `-${tx.amount}`} Coins
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Coins className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs">No transactions recorded yet for this email.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
