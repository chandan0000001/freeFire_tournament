import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { loginSchema } from '../../validations/authValidation.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { User, Lock, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  usePageMeta('Player Login | Rahul Esports', 'Log in to your Rahul Esports player account to access your coin wallet and register for Free Fire tournaments.');
  
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle redirect destination if user was attempting to register
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/tournaments';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
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
    const result = loginSchema.safeParse(formData);
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
      await login(result.data);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-[#1F293D] shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30 flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
            Player Sign In
          </h1>
          <p className="text-xs text-slate-400">
            Access your tournament coin wallet & verified Free Fire matches.
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
              Email Address *
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
                fieldErrors.email
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-[#1F293D] focus:border-brand-orange'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-slate-300">
                Password *
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-brand-orange hover:text-amber-400 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                fieldErrors.password
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-[#1F293D] focus:border-brand-orange'
              }`}
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-sm shadow-glow-orange hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? 'Authenticating...' : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register CTA */}
        <div className="pt-4 border-t border-[#1F293D] text-center space-y-2">
          <p className="text-xs text-slate-400">
            Don't have a player account yet?
          </p>
          <Link
            to={`/register${location.search}`}
            className="inline-block text-xs font-bold uppercase text-brand-orange hover:text-amber-400 tracking-wider transition-colors"
          >
            Create New Player Account (Instant)
          </Link>
        </div>

      </div>
    </div>
  );
}
