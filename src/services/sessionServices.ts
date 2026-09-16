// src/services/sessionService.ts
import type { User } from '@/types/User.d';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const sessionService = {
  setSession(token: string, user: User) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  getUser(): User | null {
    const user = sessionStorage.getItem(USER_KEY);
    return user ? (JSON.parse(user) as User) : null;
  },

  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
