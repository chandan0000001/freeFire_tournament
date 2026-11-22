import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { forgotPasswordSchema } from '../../validations/authValidation.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { KeyRound, Mail, ArrowLeft, ShieldAlert, CheckCircle, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  usePageMeta('Forgot Password | Rahul Esports', 'Request a password reset link for your Rahul Esports tournament account.');

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError('');
    setServerError('');

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      setFieldError(issues[0]?.message || 'Please provide a valid email');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: result.data.email });
      if (res.success) {
        setSubmittedEmail(result.data.email);
      } else {
        setServerError(res.message || 'Unable to process reset request.');
      }
    } catch (err) {
      setServerError(err.message || 'Failed to send reset link. Please check your email or try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-14">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121722] border border-[#1F293D] shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-orange/15 text-brand-orange border border-brand-orange/30 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your account email to receive a secure, one-time reset link.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {submittedEmail ? (
          <div className="p-6 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-emerald-300 uppercase">
                Reset Link Dispatched
              </h3>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                If an account exists for <strong>{submittedEmail}</strong>, we have sent a password reset link to your email.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-[11px] text-slate-400">
              The link expires in <strong>15 minutes</strong>. Remember to check your spam/junk folder if not received within 2 minutes.
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-block px-5 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                Account Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="player@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError('');
                    if (serverError) setServerError('');
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0B0E14] border text-sm text-white focus:outline-none transition-colors ${
                    fieldError ? 'border-rose-500' : 'border-[#1F293D] focus:border-brand-orange'
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {fieldError && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber font-display font-bold uppercase tracking-wider text-white text-sm shadow-glow-orange hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? 'Sending Reset Link...' : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#1F293D] text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
