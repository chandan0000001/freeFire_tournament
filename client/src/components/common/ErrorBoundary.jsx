import React from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured in ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4 py-16 text-slate-100">
          <div className="max-w-md w-full bg-[#24171e] border border-[#49303a] rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold uppercase text-white tracking-wide">
                Arena Signal Disrupted
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                An unexpected interface issue occurred. Your wallet balance and tournament slots are safe.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber text-white font-display font-bold uppercase text-xs tracking-wider shadow-glow-orange flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reload Arena
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1b1017] hover:bg-[#301e27] text-slate-200 border border-[#49303a] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Lobby
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
