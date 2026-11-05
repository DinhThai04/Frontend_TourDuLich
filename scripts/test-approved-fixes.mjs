import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import dayjs from 'dayjs';

async function load(path) {
  const source=await readFile(new URL(path,import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
}
const {departureWallTime}=await load('../src/utils/departureTime.ts');
const {AiClient,AiClientError}=await load('../src/services/aiServices.ts');
const {hasPermission,ADMIN_ACCESS}=await load('../src/config/access.ts');
const help={handled:true,reply:'Booking status',selectedBookingId:4,choices:[],checkedAt:null,policy:null};
const ok=data=>new Response(JSON.stringify({code:1000,result:data}),{headers:{'Content-Type':'application/json'}});
const denied=()=>new Response(JSON.stringify({code:1401,message:'Unauthenticated'}),{status:401});

test('departure wall time preserves the selected clock without a UTC suffix',()=>{
  assert.equal(departureWallTime(dayjs('2026-11-20T08:00:00')),'2026-11-20T08:00:00');
  assert.throws(()=>departureWallTime(null));
});
test('admin UI entry alone does not show actions whose API permissions are absent',()=>{
  const user={role:{permissions:[{code:'TOURS_GET_LIST'}]}};
  assert.equal(hasPermission(user,ADMIN_ACCESS),true);
  assert.equal(hasPermission(user,{code:'USERS_UPDATE'}),false);
});
test('private booking chat refreshes an expired token once and retries with the renewed session',async()=>{
  let token='old',refreshes=0;const calls=[];
  const api=new AiClient('http://fixture.invalid/api/v1',async(url,init)=>{
    calls.push(init.headers.Authorization??null);
    return !init.headers.Authorization?ok(help):init.headers.Authorization==='Bearer old'?denied():ok(help);
  },1000,()=>token,async stale=>{assert.equal(stale,'old');refreshes++;token='new';return token;});
  assert.equal((await api.bookingHelp('booking #4 con bao lau',null)).selectedBookingId,4);
  assert.equal(refreshes,1);assert.deepEqual(calls,[null,'Bearer old','Bearer new']);
});
test('public advice does not depend on refresh or authentication',async()=>{
  let refreshes=0;const api=new AiClient('http://fixture.invalid',async()=>ok({...help,handled:false}),1000,()=> 'old',async()=>{refreshes++;return 'new';});
  assert.equal((await api.bookingHelp('tour mien trung',null)).handled,false);assert.equal(refreshes,0);
});
test('an account change during refresh prevents private retry',async()=>{
  let token='old',calls=0;
  const api=new AiClient('http://fixture.invalid',async(url,init)=>{calls++;return init.headers.Authorization?denied():ok(help);},1000,()=>token,async()=>{token='other-account';return null;});
  await assert.rejects(api.bookingHelp('booking #4 con bao lau',null),error=>error instanceof AiClientError&&error.type==='LOGIN_REQUIRED');
  assert.equal(calls,2);
});
test('a renewed but still rejected token stops after one retry',async()=>{
  let token='old',refreshes=0,calls=0;
  const api=new AiClient('http://fixture.invalid',async(url,init)=>{calls++;return init.headers.Authorization?denied():ok(help);},1000,()=>token,async()=>{refreshes++;token='new';return token;});
  await assert.rejects(api.bookingHelp('booking #4 con bao lau',null));assert.equal(refreshes,1);assert.equal(calls,3);
});

test('locked and archived accounts never receive admin UI privileges',()=>{
  for(const status of ['LOCKED','ARCHIVED'])assert.equal(hasPermission({status,role:{name:'admin',active:true,permissions:[]}},ADMIN_ACCESS),false);
  assert.equal(hasPermission({status:'ACTIVE',role:{name:'admin',active:true,permissions:[]}},ADMIN_ACCESS),true);
});
