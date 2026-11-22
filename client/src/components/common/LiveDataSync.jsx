import { useEffect } from 'react';
import api from '../../services/api.js';
import { notifyDataChanged } from '../../services/liveData.js';
export default function LiveDataSync() {
  useEffect(() => {
    let revision, busy = false, active = true, lastCheck = 0;
    const check = async () => {
      if (busy || document.visibilityState !== 'visible' || Date.now() - lastCheck < 3000) return;
      busy = true; lastCheck = Date.now();
      try {
        const result = await api.get('/sync');
        if (!active) return;
        if (revision !== undefined && result.revision !== revision) notifyDataChanged(false);
        revision = result.revision;
      } catch { /* Existing data remains usable through temporary connection loss. */ }
      finally { busy = false; }
    };
    check();
    const timer = setInterval(check, Math.max(10000, Number(import.meta.env.VITE_SYNC_INTERVAL_MS) || 30000));
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, []);
  return null;
}
