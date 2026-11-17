import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Eye, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function SpectatorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await login('/auth/spectator/login', { email, password });
      if (res.success) {
        navigate('/spectator/workspace');
      }
    } catch (err) {
      setError(err.message || 'Invalid spectator credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Website
        </Link>

        <div className="p-8 rounded-2xl bg-[#121722] border border-[#1F293D] shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-sm">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-extrabold uppercase text-white tracking-wider">
              Spectator Portal
            </h2>
            <p className="text-xs text-slate-400">
              Official match observers & score recorders.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Observer Email
              </label>
              <input
                type="email"
                required
                placeholder="spectator@ritesports.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E14] border border-[#1F293D] text-sm text-white focus:outline-none focus:border-brand-cyan"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 font-display font-bold uppercase tracking-wider text-white text-sm shadow-glow-cyan transition-all disabled:opacity-50"
            >
              {submitting ? 'Entering Arena...' : 'Sign In as Spectator'}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
