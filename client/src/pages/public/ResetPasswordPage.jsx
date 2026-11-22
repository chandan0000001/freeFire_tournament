import ResponsiveImage from '../../components/common/ResponsiveImage.jsx';
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api.js';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { resetPasswordSchema } from '../../validations/authValidation.js';

export default function ResetPasswordPage() {
  usePageMeta('Set New Password | Rahul Esports', 'Choose your new account password.');

  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    if (!token) {
      setError('Password reset token is missing from the link. Please request a new link.');
      return;
    }

    const result = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      setError(issues[0]?.message || 'Please check your passwords.');
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
        setError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.message || 'Password reset token is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-art">
        <ResponsiveImage priority sizes="(max-width: 600px) 100vw, 510px" src={site.accountImage} alt="Odisha community gaming artwork" />
        <div>
          <span className="eyebrow">{site.region.toUpperCase()}’S ARENA</span>
          <h2>Account Security.<br />Updated.</h2>
          <p>Choose a secure password to protect your coin wallet, match entries, and withdrawals.</p>
        </div>
      </div>

      <div className="admin-login-form">
        <Link className="text-link" to="/login">Back to sign in</Link>
        <h1>Set new password</h1>
        <p>Enter your new password below to regain full account access.</p>

        {error && <div role="alert" className="login-error">{error}</div>}

        {!token ? (
          <div style={{ color: '#ffd4dc', background: '#571e31', border: '1px solid #be6078', borderRadius: '8px', padding: '16px' }}>
            <p style={{ margin: '0 0 12px 0' }}>The password reset link is invalid or incomplete. Please request a new reset link.</p>
            <Link to="/forgot-password" className="arena-button" style={{ display: 'inline-flex', padding: '8px 16px', textDecoration: 'none' }}>
              Request new link
            </Link>
          </div>
        ) : success ? (
          <div style={{ background: '#1c2e24', border: '1px solid #2e7d56', borderRadius: '8px', padding: '16px', color: '#cbf3dc', fontSize: '0.875rem' }}>
            <strong style={{ display: 'block', color: '#6ee7b7', marginBottom: '6px' }}>Password successfully updated!</strong>
            You will be redirected to the sign in page in 3 seconds...
            <div style={{ marginTop: '16px' }}>
              <Link to="/login" className="arena-button" style={{ display: 'inline-flex', padding: '10px 18px', textDecoration: 'none' }}>
                Sign in now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password">New password</label>
              <div className="password-field">
                <input
                  id="new-password"
                  name="password"
                  type={visible ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password">Confirm new password</label>
              <div className="password-field">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={visible ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <button type="submit" className="arena-button" disabled={submitting}>
              <LockKeyhole size={17} />
              {submitting ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}

        <div className="login-notice">
          <ShieldCheck size={17} />
          <span>Your new password will be encrypted and saved immediately.</span>
        </div>
      </div>
    </div>
  );
}
