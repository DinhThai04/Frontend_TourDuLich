import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';

const compile = async (path, replacements = []) => {
  let code = ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), { fileName: path, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  for (const [from, to] of replacements) code = code.replaceAll(from, to);
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
};
const servicesUrl = await compile('../src/services/aiServices.ts');
const { AiClient, AiClientError, decodeAiResult, safeAiImage, aiErrorText } = await import(servicesUrl);
// src/utils has no imports of its own, so one compiled copy can serve every '@/utils' specifier.
const utilsUrl = await compile('../src/utils/index.tsx');
const conversationUrl = await compile('../src/utils/aiConversation.ts', [["'../services/aiServices'", `'${servicesUrl}'`], ["'./index'", `'${utilsUrl}'`]]);
const { AiConversation, AI_STORAGE_KEY } = await import(conversationUrl);
const id = 'a'.repeat(43), secondId = 'b'.repeat(43), expiry = '2099-01-01T00:00:00+07:00';
const session = (conversationId = id, turnVersion = 0) => ({ conversationId, turnVersion, expiresAt: expiry });
const criteria = { region: 'CENTRAL', destinationId: null, originId: null, maxBudgetVnd: 3000000, budgetScope: 'PER_ADULT', departureFrom: null, departureTo: null, party: null, searchMode: 'CATALOG' };
const result = (request, version = 1) => ({ ...session(request.conversationId, version), requestId: request.requestId, status: 'NO_RESULTS', reply: 'Chưa có tour phù hợp.', criteria, tours: [], clarification: null, detail: null, comparison: null, policy: null, searchSummary: { returnedCount: 0, hasMore: false, matchingCatalogCount: 0, matchingBookableCount: 0, dataAsOf: expiry } });
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const fixture = (overrides = {}, saved = storage()) => {
  const calls = [];
  const api = { create: async () => session(), reset: async old => { calls.push({ reset: old }); return session(secondId); }, chat: async request => { calls.push(request); return result(request); }, ...overrides };
  const controller = new AiConversation(api, saved, randomUUID);
  controller.setOwner('guest'); return { controller, calls, saved, api };
};

test('booking-help and conversation create carry the JWT; chat and policies stay credential-free', async () => {
  const calls=[];
  const client=new AiClient('http://localhost:8888/api/v1',async(url,init)=>{
    calls.push({url,init});
    const data=url.endsWith('/booking-help')?{handled:true,reply:'Bạn còn 3 ngày.',selectedBookingId:6,choices:[],checkedAt:expiry,policy:{policyKey:'P01',policyVersion:'2026-10-24-v2',sourceLabel:'SGU Tour'}}
      :url.endsWith('/policies')?{version:'2026-10-24-v2',sourceLabel:'SGU Tour',effectiveDate:'2026-10-24',scope:'Demo',entries:[]}:session();
    return Response.json({code:1000,result:data});
  },45000,()=> 'dummy-user-token');
  await client.bookingHelp('Booking #6 còn bao lâu?',null);await client.create();await client.policies();
  assert.equal(calls[0].init.headers.Authorization,undefined);
  assert.equal(calls[1].init.headers.Authorization,'Bearer dummy-user-token');
  // Create is the only call whose owner key the gateway derives from the bearer, so it must be sent.
  assert.equal(calls[2].url,'http://localhost:8888/api/v1/ai/conversations');
  assert.equal(calls[2].init.headers.Authorization,'Bearer dummy-user-token');
  assert.equal(calls[3].init.headers.Authorization,undefined);
  assert.equal(calls[3].init.method,'GET');assert.ok(calls.every(c=>c.init.credentials==='omit' && c.init.cache==='no-store'));
});

test('guest create stays credential-free and session cap keeps its own copy', async () => {
  const calls=[];
  const client=new AiClient('http://fixture',async(url,init)=>{calls.push(init);return Response.json({code:1000,result:session()});},45000,()=>null);
  await client.create();
  assert.deepEqual(calls[0].headers,{'Content-Type':'application/json'});
  const capped=new AiClient('http://fixture',async()=>Response.json({error:{type:'AI_SESSION_LIMIT',retryable:true,retryAfterSeconds:42}},{status:429}));
  await assert.rejects(capped.create(),e=>e.type==='AI_SESSION_LIMIT'&&e.retryable&&e.retryAfterSeconds===42);
  assert.match(aiErrorText('AI_SESSION_LIMIT'),/3 phiên/);
  assert.notEqual(aiErrorText('AI_SESSION_LIMIT'),aiErrorText('AI_RATE_LIMITED'));
});

test('public question routing neither reads a JWT nor requires auth introspection', async () => {
  let tokens=0;const calls=[];
  const client=new AiClient('http://fixture',async(url,init)=>{calls.push({url,init});return Response.json({code:1000,result:{handled:false,reply:'',selectedBookingId:null,choices:[],checkedAt:null,policy:null}});},45000,()=>{tokens++;throw new Error('auth unavailable');});
  assert.equal((await client.bookingHelp('Tìm tour miền Trung',null)).handled,false);
  assert.equal(tokens,0);assert.equal(calls.length,1);assert.equal(calls[0].init.headers.Authorization,undefined);
});

test('private reply never enters public model/session and authenticated chat is RAM only', async () => {
  const saved=storage();let modelCalls=0;let selected;
  const help={handled:true,reply:'Booking #6: còn 3 ngày',selectedBookingId:6,choices:[],checkedAt:expiry,policy:null};
  const {controller}=fixture({chat:async request=>{modelCalls++;return result(request);},bookingHelp:async(_message,id)=>{selected=id;return help;}},saved);
  controller.setOwner('user:7');await controller.send('Booking #6 còn bao lâu?');
  assert.equal(modelCalls,0);assert.equal(controller.getSnapshot().session,null);assert.equal(saved.getItem(AI_STORAGE_KEY),null);
  await controller.send('Còn bao nhiêu thời gian?');assert.equal(selected,6);
  controller.setOwner('user:8');assert.equal(controller.getSnapshot().messages.length,1);
  await controller.send('Đơn của tôi');assert.equal(selected,null);
});

test('booking outage cannot fall through to sending personal question to model', async () => {
  let modelCalls=0;
  const {controller}=fixture({bookingHelp:async()=>{throw new AiClientError('BOOKING_UNAVAILABLE',true);},chat:async request=>{modelCalls++;return result(request);}});
  controller.setOwner('user:7');await controller.send('Tôi đã đặt tour, còn bao lâu để thanh toán?');
  assert.equal(modelCalls,0);assert.equal(controller.getSnapshot().error,'BOOKING_UNAVAILABLE');
});

test('late private answer is discarded when account changes', async () => {
  const late=deferred();const {controller}=fixture({bookingHelp:async()=>late.promise});
  controller.setOwner('user:7');const pending=controller.send('Đơn của tôi');controller.setOwner('user:8');
  late.resolve({handled:true,reply:'private owner 7',selectedBookingId:6,choices:[],checkedAt:expiry,policy:null});await pending;
  assert.ok(controller.getSnapshot().messages.every(m=>!m.text.includes('private owner 7')));
});

test('public client uses exact gateway paths, no cookies/JWT and no automatic retry', async () => {
  const calls = [];
  const client = new AiClient('http://localhost:8888/api/v1/', async (url, init) => {
    calls.push({ url, init }); return Response.json({ code: 1000, result: url.endsWith('/chat') ? result(JSON.parse(init.body)) : session() });
  });
  await client.create(); await client.chat({ conversationId: id, requestId: randomUUID(), message: 'Miền Trung' }); await client.reset(id);
  assert.deepEqual(calls.map(c => c.url), ['http://localhost:8888/api/v1/ai/conversations', 'http://localhost:8888/api/v1/ai/chat', 'http://localhost:8888/api/v1/ai/conversations/reset']);
  for (const { init } of calls) { assert.equal(init.credentials, 'omit'); assert.deepEqual(init.headers, { 'Content-Type': 'application/json' }); }
});
test('default browser fetch is invoked without binding the client as its receiver', async () => {
  const savedFetch = globalThis.fetch;
  globalThis.fetch = function () { assert.equal(this, undefined); return Promise.resolve(Response.json({ code: 1000, result: session() })); };
  try { assert.equal((await new AiClient('http://fixture').create()).turnVersion, 0); }
  finally { globalThis.fetch = savedFetch; }
});
test('provider failure and HTML gateway errors never expose body or invoke auth', async () => {
  let calls = 0;
  const client = new AiClient('http://fixture', async () => { calls++; return new Response('<html>secret body</html>', { status: 401 }); });
  await assert.rejects(client.create(), e => e.type === 'GATEWAY_UNAVAILABLE' && !e.message.includes('secret'));
  assert.equal(calls, 1);
});
test('quota retry metadata is bounded and rendered with local text', async () => {
  const client = new AiClient('http://fixture', async () => Response.json({ error: { type: 'AI_RATE_LIMITED', retryable: true, retryAfterSeconds: 999999 } }, { status: 429 }));
  await assert.rejects(client.create(), e => e.type === 'AI_RATE_LIMITED' && e.retryAfterSeconds === 300);
  assert.match(aiErrorText('AI_QUOTA_EXHAUSTED'), /bộ lọc/);
});
test('prompt/context budget rejection asks for a shorter question without retrying', async () => {
  let calls = 0;
  const client = new AiClient('http://fixture', async () => { calls++; return Response.json({ error: { type: 'AI_INPUT_TOO_LARGE', retryable: false } }, { status: 400 }); });
  await assert.rejects(client.create(), error => error.type === 'AI_INPUT_TOO_LARGE' && !error.retryable);
  assert.equal(calls, 1); assert.match(aiErrorText('AI_INPUT_TOO_LARGE'), /rút gọn/);
});
test('timeout is bounded and response body cap applies before JSON parsing', async () => {
  const timeout = new AiClient('http://fixture', (_url, init) => new Promise((_yes, no) => init.signal.addEventListener('abort', () => no(new Error('aborted')))), 5);
  await assert.rejects(timeout.create(), e => e.type === 'AI_TIMEOUT');
  const large = new AiClient('http://fixture', async () => new Response('x'.repeat(131073)));
  await assert.rejects(large.create(), e => e.type === 'INVALID_RESPONSE');
});
test('response IDs must correlate and malformed numbers or payload shapes are rejected', async () => {
  const request = { conversationId: id, requestId: randomUUID(), message: 'abc' };
  const client = new AiClient('http://fixture', async () => Response.json({ code: 1000, result: result({ ...request, conversationId: secondId }) }));
  await assert.rejects(client.chat(request), e => e.type === 'INVALID_RESPONSE');
  assert.throws(() => decodeAiResult({ ...result(request), turnVersion: -1 }));
  assert.throws(() => decodeAiResult({ ...result(request), status: 'ANSWER' }));
});
test('images require HTTPS Cloudinary and links are rebuilt from verified positive IDs', () => {
  for (const url of ['javascript:alert(1)', 'http://res.cloudinary.com/x', 'https://res.cloudinary.com.evil.test/x', 'https://user@res.cloudinary.com/x', 'https://res.cloudinary.com:99/x']) assert.equal(safeAiImage(url), undefined);
  assert.equal(safeAiImage('https://res.cloudinary.com/demo/image/upload/a.jpg'), 'https://res.cloudinary.com/demo/image/upload/a.jpg');
});
test('rapid double send calls backend once, not one session per click', async () => {
  const pending = deferred(); let chats = 0;
  const { controller } = fixture({ chat: async request => { chats++; await pending.promise; return result(request); } });
  const first = controller.send('Miền Trung'); await controller.send('Miền Bắc');
  pending.resolve(); await first;
  assert.equal(chats, 1); assert.equal(controller.getSnapshot().messages.filter(m => m.role === 'user').length, 1);
});
test('retry reuses message/requestId and appends no duplicate user turn', async () => {
  let attempt = 0; const requests = [];
  const { controller } = fixture({ chat: async request => { requests.push(request); if (!attempt++) throw new AiClientError('NETWORK_ERROR', true); return result(request); } });
  await controller.send('Trung 3 triệu'); await controller.send('tin mới bị chặn'); await controller.retry();
  assert.deepEqual(requests[0], requests[1]); assert.equal(requests.length, 2);
  assert.equal(controller.getSnapshot().messages.filter(m => m.role === 'user').length, 1);
  assert.equal(controller.getSnapshot().pending, null);
});
test('reset during a request drops the late answer and restores fresh version', async () => {
  const late = deferred(); let request;
  const { controller } = fixture({ chat: async body => { request = body; return late.promise; } });
  const old = controller.send('abc'); await new Promise(resolve => setImmediate(resolve));
  await controller.newChat(); late.resolve(result(request)); await old;
  assert.equal(controller.getSnapshot().session.conversationId, secondId);
  assert.equal(controller.getSnapshot().session.turnVersion, 0); assert.equal(controller.getSnapshot().messages.length, 1);
});
test('account changes while home is hidden invalidate old session and late responses', async () => {
  const late = deferred(); let request;
  const { controller, calls, saved } = fixture({ chat: async body => { request = body; return late.promise; } });
  const old = controller.send('abc'); await new Promise(resolve => setImmediate(resolve));
  controller.setOwner('user:2'); controller.setOwner('guest');
  late.resolve(result(request)); await old;
  assert.equal(controller.getSnapshot().messages.length, 1); assert.equal(controller.getSnapshot().session, null);
  assert.ok(calls.some(c => c.reset === id)); assert.equal(saved.getItem(AI_STORAGE_KEY), null);
});
test('reload restores bounded public snapshot but never calls model automatically', async () => {
  const first = fixture(); await first.controller.send('abc');
  const second = fixture({}, first.saved);
  assert.equal(second.controller.getSnapshot().session.turnVersion, 1);
  assert.equal(second.controller.getSnapshot().messages.length, 3); assert.equal(second.calls.length, 0);
});
test('reload after an interrupted request retries the original request ID', async () => {
  const late = deferred(); let original;
  const first = fixture({ chat: async request => { original = request; return late.promise; } });
  const work = first.controller.send('abc'); await new Promise(resolve => setImmediate(resolve)); first.controller.pause();
  const next = fixture({}, first.saved); await next.controller.retry();
  assert.deepEqual(next.calls[0], original); late.resolve(result(original)); await work;
  assert.equal(first.controller.getSnapshot().session.turnVersion, 0);
});
test('an older cached response cannot roll UI version or list backwards', async () => {
  let turn = 0;
  const { controller } = fixture({ chat: async request => result(request, ++turn === 1 ? 3 : 1) });
  await controller.send('abc'); await controller.send('xyz');
  assert.equal(controller.getSnapshot().session.turnVersion, 3);
  assert.equal(controller.getSnapshot().messages.filter(m => m.result).length, 1);
});
test('410 stops reuse and never silently resends into a new session', async () => {
  let creates = 0; let chats = 0;
  const { controller } = fixture({ create: async () => { creates++; return session(); }, chat: async () => { chats++; throw new AiClientError('CONVERSATION_EXPIRED'); } });
  await controller.send('abc'); await controller.send('xyz'); await controller.retry();
  assert.equal(creates, 1); assert.equal(chats, 1); assert.equal(controller.getSnapshot().expired, true);
});
test('retry-after is respected without background automatic calls', async () => {
  let now = 100; let calls = 0;
  const api = { create: async () => session(), reset: async () => session(), chat: async () => { calls++; throw new AiClientError('AI_RATE_LIMITED', true, 10); } };
  const controller = new AiConversation(api, null, randomUUID, () => now); controller.setOwner('guest');
  await controller.send('abc'); await controller.retry(); assert.equal(calls, 1);
  now += 10001; await controller.retry(); assert.equal(calls, 2);
});
test('snapshot owner mismatch, corruption and oversized data do not restore state', async () => {
  for (const raw of ['not JSON', 'x'.repeat(64001), JSON.stringify({ version: 1, owner: 'user:2', session: session(), messages: [], pending: null }), JSON.stringify({ version: 1, owner: 'guest', session: session(), messages: [{ role: 'bot', text: '<script>', id: '1', time: '', result: {} }], pending: null })]) {
    const saved = storage(); saved.setItem(AI_STORAGE_KEY, raw); const { controller } = fixture({}, saved);
    assert.equal(controller.getSnapshot().session, null); assert.equal(controller.getSnapshot().messages.length, 1);
  }
});
test('history and storage remain bounded and unavailable storage falls back to RAM', async () => {
  let version = 0; const saved = storage();
  const { controller } = fixture({ chat: async request => ({ ...result(request, ++version), reply: 'á'.repeat(6000) }) }, saved);
  for (let i = 0; i < 25; i++) await controller.send('abc');
  assert.equal(controller.getSnapshot().messages.length, 20);
  assert.ok(new TextEncoder().encode(saved.getItem(AI_STORAGE_KEY)).length <= 64000);
  const unavailable = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  const other = fixture({}, unavailable); await other.controller.send('abc'); assert.equal(other.controller.getSnapshot().session.turnVersion, 1);
});
test('empty/oversized input is rejected before create or chat', async () => {
  let calls = 0; const { controller } = fixture({ create: async () => { calls++; return session(); } });
  await controller.send('  '); await controller.send('😀'.repeat(2001)); assert.equal(calls, 0);
});

test('React renders untrusted itinerary as text and creates only local detail links', async () => {
  const replacements = [["'../../services/aiServices'", `'${servicesUrl}'`], ["'@/utils'", `'${utilsUrl}'`], ["import fallback from '../../assets/branding/sgu-tour-icon.svg';", "const fallback = '/fixture.svg';"], ['"react/jsx-runtime"', `'${import.meta.resolve('react/jsx-runtime')}'`], ["'react'", `'${import.meta.resolve('react')}'`], ["'react-router-dom'", `'${import.meta.resolve('react-router-dom')}'`]];
  const { default: AiResults } = await import(await compile('../src/components/AI/AiResults.tsx', replacements));
  const { createElement } = await import('react'); const { renderToStaticMarkup } = await import('react-dom/server'); const { MemoryRouter } = await import('react-router-dom');
  const data = { ...result({ conversationId: id, requestId: randomUUID() }), status: 'ANSWER', detail: { tourId: 7, title: '<img src=x onerror=alert(1)>', itinerary: [{ dayNumber: 1, title: 'Ngày đầu', description: '<script>alert(1)</script>', meal: '' }], truncated: false, dataAsOf: expiry } };
  const html = renderToStaticMarkup(createElement(MemoryRouter, {}, createElement(AiResults, { result: data, onSuggest() {}, disabled: false })));
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>')); assert.ok(html.includes('href="/tours/detail/7"'));
});


test('scope rejection is a terminal validation error and cannot be restored as a retryable payload', async () => {
  const saved=storage();let reject=true;
  const {controller}=fixture({chat:async request=>{if(reject) throw new AiClientError('AI_SCOPE_REJECTED',false);return result(request);}},saved);
  await controller.send('SELECT * FROM users');
  assert.equal(controller.getSnapshot().error,'AI_SCOPE_REJECTED');
  assert.equal(controller.getSnapshot().pending,null);assert.equal(controller.getSnapshot().retryable,false);
  assert.ok(!String(saved.getItem(AI_STORAGE_KEY)).includes('SELECT * FROM users'));
  reject=false;await controller.send('Tour miền Trung 3 triệu');assert.equal(controller.getSnapshot().error,null);
});

test('client recognizes a server scope rejection without exposing or retrying its raw payload', async () => {
  const client=new AiClient('http://localhost:8888/api/v1',async()=>Response.json({error:{type:'AI_SCOPE_REJECTED',retryable:false},message:'private body ignored'},{status:422}));
  await assert.rejects(()=>client.bookingHelp('write code',null),error=>error.type==='AI_SCOPE_REJECTED' && error.retryable===false);
  assert.ok(aiErrorText('AI_SCOPE_REJECTED').includes('SGU Tour'));
});
