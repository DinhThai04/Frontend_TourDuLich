/** Small RAM-only cache for public reference data, never prices, seats or account data. */
export function createReadCache(ttlMs = 30_000, now: () => number = Date.now) {
  const entries = new Map<string, { expires: number; pending?: Promise<unknown>; value?: unknown }>();
  return {
    get<T>(key: string, load: () => Promise<T>, cacheable: (value: T) => boolean = () => true): Promise<T> {
      const current = entries.get(key);
      if (current?.pending) return current.pending as Promise<T>;
      if (current && current.expires > now()) return Promise.resolve(current.value as T);
      const entry: { expires: number; pending?: Promise<unknown>; value?: unknown } = { expires: 0 };
      entries.set(key, entry);
      const pending = Promise.resolve().then(load).then(value => {
        if (entries.get(key) === entry) {
          if (cacheable(value)) {
            entry.value = value;
            entry.expires = now() + ttlMs;
            entry.pending = undefined;
          } else entries.delete(key);
        }
        return value;
      }, error => {
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      });
      entry.pending = pending;
      return pending;
    },
    invalidate() { entries.clear(); },
  };
}
