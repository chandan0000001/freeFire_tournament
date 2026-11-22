import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import { resetPasswordSchema } from '../../validations/authValidation.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { Lock, CheckCircle, ShieldAlert, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  usePageMeta('Set New Password | Rahul Esports', 'Enter your new password to regain access to your Rahul Esports tournament account.');

  const location = useLocation();
  const navigate = useNavigate();

  // Extract ?token=... from URL
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError('');
    setServerError('');

    if (!token) {
      setServerError('Password reset token is missing from the link. Please request a new link.');
      return;
    }

    // Zod validation
    const result = resetPasswordSchema.safeParse({
      token,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

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
      const res = await api.post('/auth/reset-password', result.data);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } else {
        setServerError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setServerError(err.message || 'Password reset token is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1F293D] shadow-xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="font-display text-xl font-bold uppercase text-white">Invalid Reset Link</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The reset token is missing or malformed. Please request a new password reset link from the forgot password page.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase tracking-wider"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-[#1F293D] shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
            New Password
          </h1>
          <p className="text-xs text-slate-400">
            Choose a strong password to secure your tournament coins and profile.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-emerald-300 uppercase">
                Password Reset Complete
              </h3>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Your password has been securely updated. You will be redirected to the sign in page in 3 seconds...
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                New Password * (Min 8 Chars, 1 Uppercase, 1 Number)
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="new-password"
                placeholder="Enter new password"
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
                Confirm New Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-sm shadow-glow-orange hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'Resetting Password...' : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Update Password & Save</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
