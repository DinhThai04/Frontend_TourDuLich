import { sessionService } from '@/services/sessionServices';
import { createTokenRefresh } from '@/utils/tokenRefresh';
import type { LoginResponse } from '@/types/Auth';
import axios, { type InternalAxiosRequestConfig } from 'axios';

type SessionRequest = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _sessionToken?: string | null;
  _sessionUserId?: string;
};
type SessionHooks = { refreshed: (result: LoginResponse['result']) => void; expired: () => void };
let persistorRef: { purge(): Promise<unknown> } | null = null;
let hooks: SessionHooks | null = null;
export const injectPersistor = (persistor: { purge(): Promise<unknown> }) => { persistorRef = persistor; };
export const injectSessionHooks = (callbacks: SessionHooks) => { hooks = callbacks; };
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const publicAuth = /\/auth\/users\/(login|google|register|refresh|introspect|logout)(?:[?#]|$)/;
const userId = () => String(sessionService.getUser()?.id ?? '');

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // Gửi cookie (httpOnly) cùng request nếu backend thiết lập Set-Cookie.
  withCredentials: true,
  // Backend calls fail fast (Feign 2s/4s, gateway 3s); this cap only stops a dead
  // connection from hanging the UI forever, while still allowing slow uploads.
  timeout: 60000,
});

/** Where an expired session sends the visitor, keeping a `?return=` target already on the page. */
export const loginTarget = (location: { pathname: string; search: string }) => {
  const page = `${location.pathname}${location.search}`;
  // A late 401 can fire while the visitor is already reading /login?return=…; that target must survive.
  const carried = location.pathname === '/login' ? new URLSearchParams(location.search).get('return') : null;
  // Only a same-origin absolute path may come back: '//host' leaves the site and '/login…' would loop.
  const safe = (path: string | null): path is string =>
    !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') && !path.startsWith('/login');
  const target = safe(carried) ? carried : safe(page) ? page : null;
  return target ? `/login?return=${encodeURIComponent(target)}` : '/login';
};

/** Clear both storage layers and send the visitor to login; shared by every expiry path. */
const endSession = async () => {
  sessionService.clearSession();
  hooks?.expired();
  try { await persistorRef?.purge(); } catch { /* Session is already cleared. */ }
  if (!sessionService.getToken()) {
    // A hard navigation drops router state, so carry the page along as a validated query parameter.
    window.location.assign(loginTarget(window.location));
  }
};

export const refreshSession = createTokenRefresh(async (refreshToken: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/users/refresh`, { token: refreshToken }, { timeout: 15000 });
    const result = response.data?.result;
    if (response.data?.code !== 1000 || !result?.token || !result.refreshToken || !result.user?.id) throw new Error('Phản hồi làm mới phiên không hợp lệ');
    // A response for an old account must not restore a session after logout/login.
    if (sessionService.getRefreshToken() !== refreshToken) throw new Error('Phiên đăng nhập đã thay đổi');
    sessionService.setSession(result.token, result.refreshToken, result.user);
    hooks?.refreshed(result);
    return response.data;
  } catch (error) {
    const rejected = !axios.isAxiosError(error) || [400, 401, 403].includes(error.response?.status ?? 0);
    if (rejected && sessionService.getRefreshToken() === refreshToken) await endSession();
    throw error;
  }
});

axiosClient.interceptors.request.use((config: SessionRequest) => {
  if (!publicAuth.test(config.url ?? '')) {
    const token = sessionService.getToken();
    config._sessionToken = token;
    config._sessionUserId = userId();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    else config.headers.delete('Authorization');
  }
  // Public auth routes keep a caller-provided Authorization header (Google ID token);
  // no session token is attached to them, so a stale login can never leak in.
  return config;
});

axiosClient.interceptors.response.use(response => response.data, async error => {
  const request = error.config as SessionRequest | undefined;
  if (error.response?.status !== 401 || !request || request._retry || publicAuth.test(request.url ?? '')) throw error;
  request._retry = true;
  const usedToken = request._sessionToken;
  const currentToken = sessionService.getToken();
  const refreshToken = sessionService.getRefreshToken();
  if (!usedToken || !currentToken || !refreshToken || request._sessionUserId !== userId()) {
    // An expired access token without a refresh token can never recover; end it instead of looping errors.
    // A request that never had a session stays a guest: the route guard owns that redirect.
    if (usedToken && usedToken === currentToken && !refreshToken && request._sessionUserId === userId()) await endSession();
    throw error;
  }
  // Late 401s can arrive after another request has already refreshed the same session.
  const token = currentToken !== usedToken ? currentToken : (await refreshSession(refreshToken)).result.token;
  if (sessionService.getToken() !== token || request._sessionUserId !== userId() || request.signal?.aborted) throw error;
  request.headers.set('Authorization', `Bearer ${token}`);
  return axiosClient(request);
});
export default axiosClient;
