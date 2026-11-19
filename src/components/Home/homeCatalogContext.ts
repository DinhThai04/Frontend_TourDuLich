import { createContext, useContext, useEffect } from 'react';
import type { ITour } from '@/types/Tour';

export type HomeCatalogValue = {
  tours: ITour[];
  status: 'loading' | 'ready' | 'error';
  start: () => void;
  retry: () => void;
};

export const HomeCatalogContext = createContext<HomeCatalogValue | null>(null);

export function useHomeCatalog() {
  const value = useContext(HomeCatalogContext);
  if (!value) throw new Error('useHomeCatalog must be used within HomeCatalogProvider');
  const { start } = value;
  useEffect(start, [start]);
  return value;
}
