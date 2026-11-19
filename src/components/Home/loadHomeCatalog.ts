import { searchTours } from '@/services/tourServices';
import type { ITour } from '@/types/Tour';

/** Read every public catalogue page; keep prices request-scoped rather than caching them. */
export async function loadHomeCatalog(signal: AbortSignal): Promise<ITour[]> {
  const items = new Map<number, ITour>();
  for (let page = 0; ; page += 1) {
    signal.throwIfAborted();
    const response = await searchTours(new URLSearchParams({ page: String(page), size: '50', sort: 'newest' }), signal);
    if (response.code !== 1000) throw new Error('Catalog unavailable');
    const result = response.result;
    result.content.forEach(tour => items.set(tour.id, tour));
    if (result.last || !result.content.length || page + 1 >= result.totalPages) return [...items.values()];
  }
}
