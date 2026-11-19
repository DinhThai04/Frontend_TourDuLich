import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ITour } from '@/types/Tour';
import { loadHomeCatalog } from './loadHomeCatalog';

import { HomeCatalogContext, type HomeCatalogValue } from './homeCatalogContext';

export default function HomeCatalogProvider({ children }: { children: ReactNode }) {
  const [tours, setTours] = useState<ITour[]>([]);
  const [status, setStatus] = useState<HomeCatalogValue['status']>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0) return;
    const controller = new AbortController();
    setStatus('loading');
    void loadHomeCatalog(controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setTours(items);
        setStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });
    return () => controller.abort();
  }, [attempt]);

  const start = useCallback(() => setAttempt(value => value === 0 ? 1 : value), []);
  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt(value => value + 1);
  }, []);

  const value = useMemo<HomeCatalogValue>(() => ({ tours, status, start, retry }), [tours, status, start, retry]);

  return <HomeCatalogContext.Provider value={value}>{children}</HomeCatalogContext.Provider>;
}
