import type { User } from '@/types/User.d';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

/**
 * Đơn giản hóa mã hóa token trước khi lưu vào sessionStorage để giảm nguy cơ XSS đọc trực tiếp.
 * Không thay thế hoàn toàn httpOnly cookie, nhưng làm tăng độ khó cho attacker.
 */
function obfuscate(value: string): string {
  return btoa(encodeURIComponent(value));
}

function deobfuscate(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return null;
  }
}

export const sessionService = {
  setSession(token: string, refreshToken: string, user: User) {
    sessionStorage.setItem(TOKEN_KEY, obfuscate(token));
    sessionStorage.setItem(REFRESH_TOKEN_KEY, obfuscate(refreshToken));
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken(): string | null {
    return deobfuscate(sessionStorage.getItem(TOKEN_KEY));
  },

  getRefreshToken(): string | null {
    return deobfuscate(sessionStorage.getItem(REFRESH_TOKEN_KEY));
  },

  getUser(): User | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      // Anything that is not an object with an id is a corrupt entry; callers rely on user.id.
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          && (parsed as { id?: unknown }).id != null) return parsed as User;
    } catch {
      // Fall through to clearing the corrupt entry.
    }
    sessionStorage.removeItem(USER_KEY);
    return null;
  },

  updateCurrentUser(id: string | number | undefined, changes: Partial<User>): boolean {
    const current = this.getUser();
    if (!current || id == null || String(current.id) !== String(id)) return false;
    sessionStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...changes, id: current.id }));
    return true;
  },

  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
