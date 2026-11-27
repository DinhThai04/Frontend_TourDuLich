import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const sizes = [10, 20, 50, 100];
export type PageSize = number | 'auto';
const preference = 'sgu-admin-page-size';

export function useAdminPagination(scope = '') {
  const [params, setParams] = useSearchParams();
  const pageKey = scope ? `${scope}Page` : 'page';
  const sizeKey = scope ? `${scope}Size` : 'size';
  const raw = params.get(pageKey) || '';
  const page = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Math.max(1, Number(raw)) : 1;
  const requested = params.get(sizeKey);
  const saved = typeof window === 'undefined' ? null : localStorage.getItem(preference);
  const rawSize = requested ?? saved;
  const mode: PageSize = sizes.includes(Number(rawSize)) ? Number(rawSize) : 'auto';
  const [fit, setFit] = useState(10);
  const tableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = tableRef.current;
    const viewport = container?.closest('.admin-content');
    if (mode !== 'auto' || !container || !viewport) return;
    let timer: number;
    function measure() {
      const row = container?.querySelector('tbody tr[data-row-key]') as HTMLElement | null;
      if (!row || !viewport) return;
      const rows = Array.from(container!.querySelectorAll<HTMLElement>('tbody tr[data-row-key]'));
      const height = Math.max(...rows.map(item => item.getBoundingClientRect().height));
      if (height <= 0) return;
      const viewportTop = viewport.getBoundingClientRect().top;
      const beforeRows = row.getBoundingClientRect().top - viewportTop + viewport.scrollTop;
      const lastRow = rows[rows.length - 1];
      const footer = Math.max(0, container!.getBoundingClientRect().bottom - (lastRow?.getBoundingClientRect().bottom ?? 0));
      const bottomPadding = Number.parseFloat(getComputedStyle(viewport).paddingBottom) || 0;
      const available = viewport.clientHeight - beforeRows - Math.max(64, footer + bottomPadding + 2);
      setFit(Math.max(5, Math.min(20, Math.floor(available / height))));
    }
    function schedule() {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 150);
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    observer.observe(container);
    schedule();
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, [mode]);
  const size = mode === 'auto' ? fit : mode;
  function change(next: number, nextMode: PageSize = mode) {
    if (nextMode !== mode) localStorage.setItem(preference, String(nextMode));
    const query = new URLSearchParams(params);
    query.set(pageKey, String(next));
    query.set(sizeKey, String(nextMode));
    if (query.toString() !== params.toString()) setParams(query, { preventScrollReset: true });
  }
  return { page, size, mode, change, tableRef };
}
