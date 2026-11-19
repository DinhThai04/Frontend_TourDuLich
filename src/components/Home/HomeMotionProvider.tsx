import { useLayoutEffect, useState, type ReactNode } from 'react';
import { HomeMotionContext } from './homeMotionContext';
export default function HomeMotionProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('sgu.home.motion') !== 'reduced'; } catch { return true; }
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.homeMotion = enabled ? 'full' : 'reduced';
    try { localStorage.setItem('sgu.home.motion', enabled ? 'full' : 'reduced'); } catch { /* Optional preference storage. */ }
    return () => { delete document.documentElement.dataset.homeMotion; };
  }, [enabled]);
  return <HomeMotionContext.Provider value={{ enabled, toggle: () => setEnabled(value => !value) }}>{children}</HomeMotionContext.Provider>;
}
