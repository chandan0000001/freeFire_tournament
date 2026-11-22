import ResponsiveImage from '../../components/common/ResponsiveImage.jsx';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { loginSchema } from '../../validations/authValidation.js';

export default function LoginPage() {
  usePageMeta('Sign In | Rahul Esports', 'Unified sign in for Rahul Esports players and organizers.');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const requestedRedirect = searchParams.get('redirect');
  const redirectPath = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\') ? requestedRedirect : null;

  // If already logged in, redirect accordingly
  useEffect(() => { if (user) navigate(['admin', 'superadmin'].includes(user.role) ? '/admin/dashboard' : (redirectPath || '/tournaments'), { replace: true }); }, [user, navigate, redirectPath]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    // Zod validation
    const result = loginSchema.safeParse({ email: email.trim(), password });
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      setError(issues[0]?.message || 'Please check your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(result.data);
      // Unified role-based redirection
      if (res?.user && ['admin', 'superadmin'].includes(res.user.role)) {
        navigate('/admin/dashboard', { replace: true });
      } else if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/tournaments', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-art">
        <ResponsiveImage priority sizes="(max-width: 600px) 100vw, 510px" src={site.accountImage} alt="Odisha gaming desk with Sambalpuri textile accents" />
        <div>
          <span className="eyebrow">{site.region.toUpperCase()}’S ARENA</span>
          <h2>Great matches.<br />Start with you.</h2>
          <p>Join Rahul Esports community. Compete in verified custom rooms and claim your winnings.</p>
        </div>
      </div>

      <div className="admin-login-form">
        <Link className="text-link" to="/">Back to the arena</Link>
        <h1>Welcome back.</h1>
        <p>Sign in to join tournaments, track your entries, or manage the arena.</p>

        {error && <div role="alert" className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your account email"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#edbd78', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <div className="password-field">
              <input
                id="login-password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          <button type="submit" className="arena-button" disabled={submitting}>
            <LockKeyhole size={17} />
            {submitting ? 'Signing in…' : 'Sign in to account'}
          </button>
        </form>

        <div style={{ marginTop: '22px', fontSize: '0.875rem', color: '#c6a8b6', textAlign: 'center' }}>
          Don’t have an account?{' '}
          <Link to={`/register${location.search}`} style={{ color: '#edbd78', fontWeight: 'bold', textDecoration: 'none' }}>
            Create one here
          </Link>
        </div>

        <div className="login-notice">
          <ShieldCheck size={17} />
          <span>Access is secure and verified for all players and tournament staff.</span>
        </div>
      </div>
    </div>
  );
}
