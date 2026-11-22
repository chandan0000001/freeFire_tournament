import { useEffect, useRef } from 'react';
import { DATA_CHANGED } from '../services/liveData.js';
export default function useLiveRefresh(refresh) {
  const ref = useRef(refresh);
  ref.current = refresh;
  useEffect(() => {
    const listener = () => { if (document.visibilityState === 'visible') ref.current?.(); };
    window.addEventListener(DATA_CHANGED, listener);
    return () => window.removeEventListener(DATA_CHANGED, listener);
  }, []);
}
