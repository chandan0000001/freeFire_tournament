import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { site } from '../../config/site.js';
import usePageMeta from '../../hooks/usePageMeta.js';
export default function AdminLoginPage() {
  usePageMeta('Organizer sign in', 'Secure access to tournament operations.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleLogin = async event => {
    event.preventDefault();
    if (submitting) return;
    setError(''); setSubmitting(true);
    try { await login('/auth/admin/login', { email:email.trim(), password }); navigate('/admin/dashboard', {replace:true}); }
    catch (err) { setError(err.message || 'Unable to sign in. Please try again.'); }
    finally { setSubmitting(false); }
  };
  return <div className="admin-login">
    <div className="admin-login-art"><img src={site.heroImage} alt="Odisha-inspired Konark wheel and coastal sunset"/><div><span className="eyebrow">{site.region}’s arena</span><h2>Great matches.<br/>Start with you.</h2><p>A dedicated workspace for the people behind the competition.</p></div></div>
    <div className="admin-login-form"><Link className="text-link" to="/">Back to the arena</Link><h1>Welcome back, organizer.</h1><p>Sign in to manage tournaments, registrations and results.</p>
      {error && <div role="alert" className="login-error">{error}</div>}
      <form onSubmit={handleLogin}>
        <div><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your organizer email"/></div>
        <div><label htmlFor="admin-password">Password</label><div className="password-field"><input id="admin-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></div>
        <button type="submit" className="arena-button" disabled={submitting}><LockKeyhole size={17}/>{submitting ? 'Signing in…' : 'Sign in to dashboard'}</button>
      </form><div className="login-notice"><ShieldCheck size={17}/><span>Access is limited to authorized tournament staff.</span></div>
    </div>
  </div>;
}
