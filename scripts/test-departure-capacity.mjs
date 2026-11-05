import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../src/utils/departureCapacity.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {capacityUpdate}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const state={id:1,tourId:2,version:42,capacity:10,availableSeats:7,paidSeats:2,heldSeats:1,issues:[],blockingIssues:[],warnings:[],scheduleEditable:false,capacityReviewRequired:false};
test('capacity payload preserves expected version and never sends absolute remaining or locked dates',()=>{
  const payload=capacityUpdate(state,15,false,{departureDate:'2090-01-20T07:00:00',returnDate:'2090-01-21T19:00:00'});
  assert.equal(payload.expectedVersion,42);assert.equal(payload.capacity,15);
  assert.ok(!('availableSeats' in payload));assert.ok(!('departureDate' in payload));assert.ok(!('returnDate' in payload));
});
test('only an empty editable schedule includes date changes',()=>{
  const dates={departureDate:'2090-01-20T07:00:00',returnDate:'2090-01-21T19:00:00'};
  assert.equal(capacityUpdate({...state,scheduleEditable:true},15,false,dates).departureDate,dates.departureDate);
});
test('unknown baseline, conflicting state and invalid capacity cannot submit',()=>{
  for(const value of [-1,2,32768,4.5,NaN])assert.throws(()=>capacityUpdate(state,value,false));
  assert.throws(()=>capacityUpdate({...state,capacityReviewRequired:true},15,false));
  assert.doesNotThrow(()=>capacityUpdate({...state,capacityReviewRequired:true},15,true));
  assert.throws(()=>capacityUpdate({...state,issues:['OPEN reconciliation'],blockingIssues:['OPEN reconciliation']},15,true));
  assert.doesNotThrow(()=>capacityUpdate({...state,capacityReviewRequired:true,issues:['Tổng sức chứa không khớp'],blockingIssues:[]},15,true));
});
