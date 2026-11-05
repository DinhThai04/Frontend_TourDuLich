/** Share an in-flight refresh; every waiter settles and failures permit a later attempt. */
export function createTokenRefresh<T>(refresh: (token: string) => Promise<T>) {
  const pending = new Map<string, Promise<T>>();
  return (token: string): Promise<T> => {
    const current = pending.get(token);
    if (current) return current;
    const job = Promise.resolve().then(() => refresh(token)).finally(() => {
      if (pending.get(token) === job) pending.delete(token);
    });
    pending.set(token, job);
    return job;
  };
}
