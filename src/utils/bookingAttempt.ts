type Attempt = { key: string; expiresAt: number };

// Keep an uncertain attempt for at least as long as its original hold can last.
const ATTEMPT_LIFETIME = 7 * 24 * 60 * 60 * 1000;
const attempts = new Map<string, Attempt>();

export function bookingAttemptScope(accountId: string | number, departureId: string) {
  return `sgu:booking-attempt:${accountId}:${Number(departureId)}`;
}

export function pendingBookingKey(scope: string, now = Date.now()) {
  let attempt = attempts.get(scope);
  try {
    const saved = sessionStorage.getItem(scope);
    if (saved) attempt = JSON.parse(saved) as Attempt;
  } catch {
    // The current tab can still reuse its in-memory key if sessionStorage is unavailable.
  }
  if (attempt && typeof attempt.key === 'string' && Number.isFinite(attempt.expiresAt) && attempt.expiresAt > now)
    return attempt.key;
  return undefined;
}

export function bookingAttemptKey(scope: string, createKey: () => string, now = Date.now()) {
  const existing = pendingBookingKey(scope, now);
  if (existing) return existing;
  const attempt = { key: createKey(), expiresAt: now + ATTEMPT_LIFETIME };
  attempts.set(scope, attempt);
  try { sessionStorage.setItem(scope, JSON.stringify(attempt)); } catch { /* keep the in-memory key */ }
  return attempt.key;
}

export function clearBookingAttempt(scope: string, expectedKey?: string) {
  if (expectedKey && pendingBookingKey(scope) !== expectedKey) return;
  attempts.delete(scope);
  try { sessionStorage.removeItem(scope); } catch { /* storage may be unavailable */ }
}
