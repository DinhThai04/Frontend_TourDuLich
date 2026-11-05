import { readFile } from 'node:fs/promises';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import axios from 'axios';

const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
async function compiled(path) {
  return ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const redirects = [];
globalThis.window = { location: { pathname: '', search: '', assign: path => redirects.push(path) } };
const sessionUrl = dataUrl(await compiled('../src/services/sessionServices.ts'));
const refreshUrl = dataUrl(await compiled('../src/utils/tokenRefresh.ts'));
const utilsUrl = dataUrl(await compiled('../src/utils/index.tsx'));
const { sessionService } = await import(sessionUrl);
const { createTokenRefresh } = await import(refreshUrl);
let adapter;
axios.defaults.adapter = config => adapter(config);
let source = await compiled('../src/api/axios.tsx');
source = source.replaceAll("'@/services/sessionServices'", JSON.stringify(sessionUrl))
  .replaceAll("'@/utils/tokenRefresh'", JSON.stringify(refreshUrl))
  .replace(/(['"])axios\1/g, JSON.stringify(import.meta.resolve('axios')))
  .replaceAll('import.meta.env.VITE_API_URL', JSON.stringify('http://test/api/v1'));
const { default: client, injectSessionHooks, loginTarget } = await import(dataUrl(source));
const changes = [];
injectSessionHooks({ refreshed: result => changes.push(result.user.id), expired: () => changes.push('expired') });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const unauthorized = config => Promise.reject(new axios.AxiosError('unauthorized', 'ERR_BAD_RESPONSE', config, null,
  { config, status: 401, data: {}, headers: {}, statusText: 'Unauthorized' }));
const fresh = { code: 1000, result: { token: 'new-token', refreshToken: 'new-refresh', user: { id: '2' }, expiryTime: '2026-12-01' } };
beforeEach(() => { storage.clear(); redirects.length = 0; changes.length = 0; sessionService.setSession('old-token', 'old-refresh', { id: '2' }); });

test('concurrent 401 requests share one refresh, retry and update the session', async () => {
  let refreshes = 0;
  const started = deferred(), gate = deferred();
  adapter = async config => {
    if (config.url.endsWith('/refresh')) { refreshes++; started.resolve(); await gate.promise; return response(config, fresh); }
    return config.headers.Authorization === 'Bearer new-token' ? response(config, { ok: true }) : unauthorized(config);
  };
  const jobs = [client.get('/private/1'), client.get('/private/2'), client.get('/private/3')];
  await started.promise; gate.resolve();
  assert.deepEqual(await Promise.all(jobs), [{ ok: true }, { ok: true }, { ok: true }]);
  assert.equal(refreshes, 1); assert.equal(sessionService.getToken(), 'new-token');
  assert.equal(sessionService.getRefreshToken(), 'new-refresh'); assert.deepEqual(changes, ['2']);
});
test('refresh rejection settles every waiter and clears the invalid session once', async () => {
  let refreshes = 0;
  adapter = async config => { if (config.url.endsWith('/refresh')) refreshes++; return unauthorized(config); };
  const result = await Promise.allSettled([client.get('/private/1'), client.get('/private/2')]);
  assert.ok(result.every(item => item.status === 'rejected'));
  assert.equal(refreshes, 1); assert.equal(sessionService.getToken(), null); assert.deepEqual(redirects, ['/login']);
});
test('logout or account replacement during refresh cannot restore the old account', async () => {
  const started = deferred(), gate = deferred();
  adapter = async config => {
    if (config.url.endsWith('/refresh')) { started.resolve(); await gate.promise; return response(config, fresh); }
    return unauthorized(config);
  };
  const job = client.get('/private');
  await started.promise; sessionService.clearSession(); sessionService.setSession('other-token', 'other-refresh', { id: '3' }); gate.resolve();
  await assert.rejects(job);
  assert.equal(sessionService.getToken(), 'other-token'); assert.equal(sessionService.getUser().id, '3'); assert.deepEqual(redirects, []);
});
test('a retried 401 stops after one refresh instead of looping', async () => {
  let refreshes = 0, requests = 0;
  adapter = async config => {
    if (config.url.endsWith('/refresh')) { refreshes++; return response(config, fresh); }
    requests++; return unauthorized(config);
  };
  await assert.rejects(client.get('/private')); assert.equal(refreshes, 1); assert.equal(requests, 2);
});
test('login errors and requests without a session never trigger refresh', async () => {
  let calls = 0;
  adapter = config => { calls++; assert.equal(config.headers.Authorization, undefined); return unauthorized(config); };
  await assert.rejects(client.post('/auth/users/login', { email: 'wrong@example.com' }));
  sessionService.clearSession(); await assert.rejects(client.get('/private'));
  assert.equal(calls, 2); assert.deepEqual(redirects, []);
});
test('failed refresh work is removed so subsequent attempts can succeed', async () => {
  let calls = 0;
  const refresh = createTokenRefresh(async () => { if (++calls === 1) throw new Error('offline'); return 'new'; });
  const result = await Promise.allSettled([refresh('old'), refresh('old')]);
  assert.ok(result.every(item => item.status === 'rejected')); assert.equal(calls, 1);
  assert.equal(await refresh('old'), 'new'); assert.equal(calls, 2);
});

test('an expired session carries the page the visitor was reading', () => {
  assert.equal(loginTarget({ pathname: '/profile', search: '?tab=history' }), '/login?return=%2Fprofile%3Ftab%3Dhistory');
  // A late 401 on the login page must keep the original target instead of folding it into /login.
  assert.equal(loginTarget({ pathname: '/login', search: '?return=%2Fprofile' }), '/login?return=%2Fprofile');
});
test('a foreign or self-referential return path is dropped', () => {
  for (const page of [{ pathname: '//evil.example', search: '' }, { pathname: '/\\evil.example', search: '' },
    { pathname: 'profile', search: '' }, { pathname: '/login', search: '?return=%2F%2Fevil.example' },
    { pathname: '/login', search: '?return=%2Flogin' }])
    assert.equal(loginTarget(page), '/login');
});
test('the redirect keeps the target through the expiry path', async () => {
  const location = globalThis.window.location;
  Object.assign(location, { pathname: '/profile', search: '?tab=history' });
  adapter = async config => unauthorized(config);
  await assert.rejects(client.get('/private'));
  Object.assign(location, { pathname: '', search: '' });
  assert.deepEqual(redirects, ['/login?return=%2Fprofile%3Ftab%3Dhistory']);
});

async function loadAuthReducer() {
  const authStub = dataUrl('export const loginService = async()=>{}, loginWithGGService = async()=>{}, logoutService = async()=>{};');
  const userStub = dataUrl('export const updateAvt = async()=>{}, updateProfile = async()=>{}, getUserById = async()=>{};');
  let code = await compiled('../src/store/slices/authSlice.tsx');
  code = code.replace(/(['"])@reduxjs\/toolkit\1/g, JSON.stringify(import.meta.resolve('@reduxjs/toolkit')))
    .replace(/(['"])@\/services\/authServices\1/g, JSON.stringify(authStub))
    .replace(/(['"])@\/services\/userServices\1/g, JSON.stringify(userStub))
    .replace(/(['"])@\/services\/sessionServices\1/g, JSON.stringify(sessionUrl));
  return import(dataUrl(code));
}
test('logout clears Redux at start and server rejection keeps the guest state', async () => {
  const { default: reducer, logoutUser } = await loadAuthReducer();
  const active = { isAuth: true, user: { id: '2' }, token: 'old-token', expiryTime: 'future', loading: false, error: null };
  const pending = reducer(active, { type: logoutUser.pending.type });
  const state = reducer(pending, { type: logoutUser.rejected.type, payload: 'Server offline' });
  assert.equal(state.isAuth, false); assert.equal(state.user, null); assert.equal(state.token, null); assert.equal(state.expiryTime, null);
});
test('refresh replaces stale role permissions in Redux along with the token', async () => {
  const { default: reducer, sessionRefreshed } = await loadAuthReducer();
  const next = { token: 'new-token', refreshToken: 'new-refresh', expiryTime: 'future', user: { id: '2', role: { permissions: [] } } };
  const state = reducer(undefined, sessionRefreshed(next));
  assert.equal(state.isAuth, true); assert.equal(state.token, 'new-token'); assert.deepEqual(state.user.role.permissions, []);
});

async function loadUserServices() {
  const apiStub = dataUrl('export default { post: (...args) => globalThis.profileApiPost(...args) };');
  const source = (await compiled('../src/services/userServices.ts'))
    .replace(/(['"])@\/api\/axios\1/g, JSON.stringify(apiStub))
    .replace(/(['"])\.\/sessionServices\1/g, JSON.stringify(sessionUrl))
    .replace(/(['"])@\/utils\1/g, JSON.stringify(utilsUrl));
  return import(dataUrl(source));
}
test('saved profile updates the session read by booking and invoice as well as Redux', async () => {
  const { updateProfile } = await loadUserServices();
  const { default: reducer, uploadProfile } = await loadAuthReducer();
  const old = { id: 2, username: 'Customer', phone: '0900000000' };
  const freshUser = { ...old, phone: '0911111111', address: 'Ho Chi Minh' };
  sessionService.setSession('token', 'refresh-token', old);
  globalThis.profileApiPost = async () => ({ code: 1000, result: freshUser });
  const response = await updateProfile({ phone: freshUser.phone }, 2);
  const active = { ...reducer(undefined, { type: 'init' }), user: old, isAuth: true };
  const state = reducer(active, uploadProfile.fulfilled(response.result, 'request', { data: {}, userId: 2 }));
  assert.equal(state.user.phone, freshUser.phone);
  assert.equal(sessionService.getUser().phone, freshUser.phone);
  assert.equal(sessionService.getUser().address, freshUser.address);
});
test('late profile and avatar replies cannot replace another logged-in account', async () => {
  const { updateProfile, updateAvt } = await loadUserServices();
  const { default: reducer, uploadProfile, uploadAvatar } = await loadAuthReducer();
  const old = { id: 2, phone: '0900000000' }, next = { id: 3, phone: '0933333333', avatar: 'other-avatar' };
  for (const avatar of [false, true]) {
    sessionService.setSession('old-token', 'old-refresh', old); const pending = deferred();
    globalThis.profileApiPost = () => pending.promise;
    const job = avatar ? updateAvt({}, 2) : updateProfile({}, 2);
    sessionService.setSession('other-token', 'other-refresh', next);
    pending.resolve({ code: 1000, result: avatar ? { url: 'old-avatar', originalFileName: 'avatar.png' } : old });
    const response = await job;
    const active = { ...reducer(undefined, { type: 'init' }), user: next, isAuth: true };
    const thunk = avatar ? uploadAvatar : uploadProfile;
    const state = reducer(active, thunk.fulfilled(response.result, 'request', { data: {}, userId: 2 }));
    assert.equal(state.user.id, 3); assert.equal(state.user.avatar, 'other-avatar');
    assert.equal(sessionService.getUser().id, 3); assert.equal(sessionService.getToken(), 'other-token');
  }
});
test('failed profile update keeps existing session details', async () => {
  const { updateProfile } = await loadUserServices();
  sessionService.setSession('token', 'refresh-token', { id: 2, phone: '0900000000' });
  globalThis.profileApiPost = async () => { throw new Error('Rejected'); };
  await assert.rejects(updateProfile({ phone: 'invalid' }, 2));
  assert.equal(sessionService.getUser().phone, '0900000000');
});
