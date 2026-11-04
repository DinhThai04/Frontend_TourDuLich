import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../src/utils/tourMedia.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {imageFileError,imageBatchError,submitTourMedia,pageWithinRange}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('image selection rejects oversized, empty and unsupported files',()=>{
  assert.equal(imageFileError({type:'image/png',size:5*1024*1024}),null);
  for(const file of [{type:'image/png',size:0},{type:'image/png',size:5*1024*1024+1},{type:'image/svg+xml',size:20},{type:'application/pdf',size:20}]) assert.ok(imageFileError(file));
});
test('partial create keeps the returned tour ID and retries its images without creating another tour',async()=>{
  let creates=0,retries=0;
  const data={files:[{name:'tour.png'}]};
  const create=async()=>{creates++;return {code:1000,result:{id:42,imageUploadStatus:'PENDING'}};};
  const retry=async(id,files)=>{assert.equal(id,42);assert.equal(files,data.files);retries++;return {code:1000,result:{id,imageUploadStatus:'COMPLETE',imageIds:['https://fixture.invalid/tour.png']}};};
  const pending=await submitTourMedia(null,data,create,retry);
  await submitTourMedia(pending.result.id,data,create,retry);
  assert.equal(creates,1);assert.equal(retries,1);
});
test('failed retry propagates the error and never falls back to creating a new tour',async()=>{
  let creates=0;
  await assert.rejects(submitTourMedia(42,{files:[]},async()=>{creates++;},async()=>{throw new Error('storage unavailable');}));
  assert.equal(creates,0);
});

test('gallery limit counts existing images and caps total new upload bytes',()=>{
  const existing={url:'https://fixture.invalid/image.png'};
  assert.equal(imageBatchError(Array(10).fill(existing)),null);
  assert.ok(imageBatchError(Array(11).fill(existing)));
  const full={originFileObj:{type:'image/png',size:5*1024*1024}};
  assert.equal(imageBatchError(Array(5).fill(full)),null);
  assert.ok(imageBatchError(Array(6).fill(full)));
});

test('cleanup page follows the rows when the last image on the final page is deleted',()=>{
  assert.equal(pageWithinRange(16,1,15),1);
  assert.equal(pageWithinRange(15,1,15),0);
  assert.equal(pageWithinRange(0,3,15),0);
  assert.equal(pageWithinRange(46,2,15),2);
  assert.equal(pageWithinRange(46,9,15),3);
});
