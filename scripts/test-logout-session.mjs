import { readFile } from 'node:fs/promises';
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { configureStore } from '@reduxjs/toolkit';

const dataUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const replace = (source, specifier, url) => source.replaceAll(`'${specifier}'`, JSON.stringify(url)).replaceAll(`"${specifier}"`, JSON.stringify(url));
const storage = new Map();
globalThis.sessionStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
const sessionUrl = dataUrl(await compile('../src/services/sessionServices.ts'));
const utilsUrl = dataUrl(await compile('../src/utils/index.tsx'));
const { sessionService } = await import(sessionUrl);
const apiUrl = dataUrl('export const refreshSession=async()=>{};export default {post:(...args)=>globalThis.logoutApiPost(...args)};');
let authSource = await compile('../src/services/authServices.ts');
authSource = replace(replace(replace(authSource, '@/api/axios', apiUrl), '@/utils', utilsUrl), 'axios', import.meta.resolve('axios'));
const authUrl = dataUrl(authSource);
let sliceSource = await compile('../src/store/slices/authSlice.tsx');
for (const [specifier, url] of Object.entries({
  '@reduxjs/toolkit': import.meta.resolve('@reduxjs/toolkit'), '@/services/authServices': authUrl,
  '@/services/sessionServices': sessionUrl,
  '@/services/userServices': dataUrl('export const updateAvt=async()=>{},updateProfile=async()=>{},getUserById=async()=>{};'),
})) sliceSource = replace(sliceSource, specifier, url);
const { default: reducer, logoutUser, loginUser } = await import(dataUrl(sliceSource));
const user = id => ({ id, username: `User ${id}` });
const active = () => ({ ...reducer(undefined, { type: 'init' }), isAuth: true, user: user(2), token: 'old-token', expiryTime: 'future' });
const storeForUser = () => configureStore({ reducer: { auth: reducer }, preloadedState: { auth: active() } });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
beforeEach(() => { storage.clear(); sessionService.setSession('old-token', 'old-refresh', user(2)); });

test('logout clears local credentials and Redux immediately while revocation is still pending', async () => {
  const reply = deferred(); let captured;
  globalThis.logoutApiPost = (...args) => { captured = args; return reply.promise; };
  const store = storeForUser(); const job = store.dispatch(logoutUser());
  assert.equal(sessionService.getToken(), null); assert.equal(sessionService.getUser(), null);
  assert.equal(store.getState().auth.isAuth, false); assert.equal(store.getState().auth.user, null);
  assert.equal(captured[0], '/auth/users/logout'); assert.equal(captured[1].token, 'old-token');
  assert.equal(captured[1].refreshToken, 'old-refresh');
  assert.equal(captured[2].timeout, 5000);
  reply.resolve({ code: 1000 }); await job;
});
test('network failure or timeout does not restore the logged-out session', async () => {
  for (const reason of ['Server unavailable', 'timeout exceeded']) {
    sessionService.setSession('old-token', 'old-refresh', user(2));
    globalThis.logoutApiPost = async () => { throw new Error(reason); };
    const store = storeForUser(); const result = await store.dispatch(logoutUser());
    assert.equal(result.type, logoutUser.rejected.type);
    assert.equal(sessionService.getToken(), null); assert.equal(store.getState().auth.isAuth, false);
  }
});
for (const fail of [false, true]) test(`late ${fail ? 'failed' : 'successful'} revocation cannot erase a replacement login`, async () => {
  for (const nextId of [2, 3]) {
    sessionService.setSession('old-token', 'old-refresh', user(2));
    const reply = deferred(); globalThis.logoutApiPost = () => reply.promise;
    const store = storeForUser(); const job = store.dispatch(logoutUser());
    const next = { code: 1000, result: { token: 'new-token', refreshToken: 'new-refresh', user: user(nextId), expiryTime: 'future' } };
    store.dispatch(loginUser.fulfilled(next, 'login-request', { email: 'fixture@example.invalid', password: 'fixture' }));
    sessionService.setSession('new-token', 'new-refresh', next.result.user);
    if (fail) reply.reject(new Error('Server unavailable')); else reply.resolve({ code: 1000 });
    await job;
    assert.equal(sessionService.getToken(), 'new-token'); assert.equal(sessionService.getUser().id, nextId);
    assert.equal(store.getState().auth.token, 'new-token'); assert.equal(store.getState().auth.user.id, nextId);
    assert.equal(store.getState().auth.isAuth, true); assert.equal(store.getState().auth.error, null);
  }
});
test('logout without a token settles locally without sending an empty revocation', async () => {
  sessionService.clearSession(); globalThis.logoutApiPost = () => { throw new Error('Unexpected call'); };
  const store = storeForUser(); const result = await store.dispatch(logoutUser());
  assert.equal(result.type, logoutUser.fulfilled.type); assert.equal(store.getState().auth.isAuth, false);
  assert.equal(sessionService.getToken(), null);
});
