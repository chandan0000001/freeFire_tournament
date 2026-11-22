import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { registerSchema } from '../../validations/authValidation.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { UserPlus, ArrowRight, ShieldAlert, Coins, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  usePageMeta('Create Player Account | Rahul Esports', 'Create your Rahul Esports account. Instant wallet creation, coin balance, and verified Free Fire tournament registration.');

  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/tournaments';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    freeFireUid: '',
    inGameName: '',
    location: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(redirectPath, { replace: true });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setFieldErrors({});

    // Zod validation
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      const issues = result.error.issues || result.error.errors || [];
      issues.forEach((err) => {
        if (err.path[0]) errors[err.path[0]] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await register(result.data);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-[#1F293D] shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30 flex items-center justify-center mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
            Player Registration
          </h1>
          <p className="text-xs text-slate-400">
            Create your account to unlock your personal coin wallet and compete in weekly Free Fire tournaments.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                  fieldErrors.fullName ? 'border-rose-500' : 'border-[#1F293D] focus:border-brand-orange'
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Mobile Number (WhatsApp) *
              </label>
              <input
                type="tel"
                name="mobileNumber"
                required
                maxLength={10}
                placeholder="10-digit number"
                value={formData.mobileNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData((prev) => ({ ...prev, mobileNumber: val }));
                  if (fieldErrors.mobileNumber) setFieldErrors((prev) => ({ ...prev, mobileNumber: '' }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                  fieldErrors.mobileNumber ? 'border-rose-500' : 'border-[#1F293D] focus:border-brand-orange'
                }`}
              />
              {fieldErrors.mobileNumber && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.mobileNumber}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Email Address * (Used for Sign In & Recovery)
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="player@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                  fieldErrors.email ? 'border-rose-500' : 'border-[#1F293D] focus:border-brand-orange'
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Password * (Min 8 Chars, 1 Uppercase, 1 Number)
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="new-password"
                placeholder="Create strong password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                  fieldErrors.password ? 'border-rose-500' : 'border-[#1F293D] focus:border-brand-orange'
                }`}
              />
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                  fieldErrors.confirmPassword ? 'border-rose-500' : 'border-[#1F293D] focus:border-brand-orange'
                }`}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Free Fire In-Game Name (IGN) (Optional)
              </label>
              <input
                type="text"
                name="inGameName"
                placeholder="e.g. Apex_Sniper"
                value={formData.inGameName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Free Fire UID (Optional)
              </label>
              <input
                type="text"
                name="freeFireUid"
                maxLength={17}
                placeholder="e.g. 1401364963"
                value={formData.freeFireUid}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 17);
                  setFormData((prev) => ({ ...prev, freeFireUid: val }));
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white font-mono focus:outline-none focus:border-brand-orange"
              />
              {fieldErrors.freeFireUid && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.freeFireUid}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                City & State (Location) (Optional)
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Berhampur, Odisha"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
            <Coins className="w-4 h-4 text-brand-orange shrink-0" />
            <span>A personal coin wallet will be automatically provisioned for your account.</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-sm shadow-glow-orange hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? 'Creating Account & Wallet...' : (
              <>
                <span>Complete Registration & Open Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing User Login CTA */}
        <div className="pt-4 border-t border-[#1F293D] text-center space-y-2">
          <p className="text-xs text-slate-400">
            Already have an account?
          </p>
          <Link
            to={`/login${location.search}`}
            className="inline-block text-xs font-bold uppercase text-brand-orange hover:text-amber-400 tracking-wider transition-colors"
          >
            Sign In to Existing Account
          </Link>
        </div>

      </div>
    </div>
  );
}
