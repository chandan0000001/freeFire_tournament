import ResponsiveImage from '../../components/common/ResponsiveImage.jsx';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { registerSchema } from '../../validations/authValidation.js';

export default function RegisterPage() {
  usePageMeta('Create Account | Rahul Esports', 'Create a new Rahul Esports player account.');

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const requestedRedirect = searchParams.get('redirect');
  const redirectPath = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//') && !requestedRedirect.includes('\\') ? requestedRedirect : '/tournaments';

  useEffect(() => { if (user) navigate(['admin', 'superadmin'].includes(user.role) ? '/admin/dashboard' : (redirectPath || '/tournaments'), { replace: true }); }, [user, navigate, redirectPath]);

  const handleRegister = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');

    // Zod validation with the 4 required fields
    const result = registerSchema.safeParse({
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.trim(),
      password,
    });

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      setError(issues[0]?.message || 'Please check your information.');
      return;
    }

    setSubmitting(true);
    try {
      await register(result.data);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="admin-login">
      <div className="admin-login-art">
        <ResponsiveImage priority sizes="(max-width: 600px) 100vw, 510px" src={site.soloImage} alt="Odisha community gaming artwork" />
        <div>
          <span className="eyebrow">{site.region.toUpperCase()}’S ARENA</span>
          <h2>Your legacy.<br />Starts here.</h2>
          <p>Join Rahul Esports. Fast registrations, direct UPI slot confirmation, and verified competitive Free Fire custom rooms.</p>
        </div>
      </div>

      <div className="admin-login-form">
        <Link className="text-link" to="/">Back to the arena</Link>
        <h1>Create your account</h1>
        <p>Enter your details below to create your player account.</p>

        {error && <div role="alert" className="login-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div>
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label htmlFor="reg-phone">WhatsApp number</label>
            <input
              id="reg-phone"
              name="mobileNumber"
              type="tel"
              maxLength={10}
              required
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
            />
          </div>

          <div>
            <label htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@gmail.com"
            />
          </div>

          <div>
            <label htmlFor="reg-password">Password</label>
            <div className="password-field">
              <input
                id="reg-password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create your password"
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
            <UserPlus size={17} />
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: '22px', fontSize: '0.875rem', color: '#c6a8b6', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to={`/login${location.search}`} style={{ color: '#edbd78', fontWeight: 'bold', textDecoration: 'none' }}>
            Sign in here
          </Link>
        </div>

        <div className="login-notice">
          <ShieldCheck size={17} />
          <span>Room credentials will be sent to your registered WhatsApp number.</span>
        </div>
      </div>
    </div>
  </div>
  );
}
