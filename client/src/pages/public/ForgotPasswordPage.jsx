import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, KeyRound } from 'lucide-react';
import api from '../../services/api.js';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { forgotPasswordSchema } from '../../validations/authValidation.js';

export default function ForgotPasswordPage() {
  usePageMeta('Reset Password | Rahul Esports', 'Request a password reset link for your account.');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    const result = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      setError(issues[0]?.message || 'Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: result.data.email });
      if (res.success) {
        setSubmittedEmail(result.data.email);
      } else {
        setError(res.message || 'Unable to process reset request.');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-art">
        <img src={site.heroImage} alt="Odisha-inspired battle arena" />
        <div>
          <span className="eyebrow">{site.region.toUpperCase()}’S ARENA</span>
          <h2>Account Security.<br />Guaranteed.</h2>
          <p>Quick, verified email password recovery with single-use expiring security tokens.</p>
        </div>
      </div>

      <div className="admin-login-form">
        <Link className="text-link" to="/login">Back to sign in</Link>
        <h1>Reset password</h1>
        <p>Enter your account email to receive a secure, one-time reset link.</p>

        {error && <div role="alert" className="login-error">{error}</div>}

        {submittedEmail ? (
          <div style={{ background: '#1c2e24', border: '1px solid #2e7d56', borderRadius: '8px', padding: '16px', color: '#cbf3dc', fontSize: '0.875rem', lineHeight: '1.5' }}>
            <strong style={{ display: 'block', color: '#6ee7b7', marginBottom: '6px' }}>Reset link dispatched</strong>
            If an account exists for <strong>{submittedEmail}</strong>, we have sent a password reset link. The link expires in <strong>15 minutes</strong>. Remember to check your spam/junk folder.
            <div style={{ marginTop: '16px' }}>
              <Link to="/login" className="arena-button" style={{ display: 'inline-flex', padding: '10px 18px', textDecoration: 'none' }}>
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="reset-email">Account email address</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@gmail.com"
              />
            </div>

            <button type="submit" className="arena-button" disabled={submitting}>
              <Mail size={17} />
              {submitting ? 'Sending reset link…' : 'Send password reset link'}
            </button>
          </form>
        )}

        <div className="login-notice">
          <ShieldCheck size={17} />
          <span>A verification email will be dispatched via Brevo secure delivery.</span>
        </div>
      </div>
    </div>
  );
}
