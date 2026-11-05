import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../src/utils/accounts.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {availableAccountActions}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const admin={id:1,status:'ACTIVE'},user={id:2,status:'ACTIVE',managementAllowed:true};const grants={status:true,archive:true,delete:true};
test('active accounts can only be locked, locked accounts expose follow-up operations',()=>{
 assert.deepEqual(availableAccountActions(user,admin,grants),['LOCK']);
 assert.deepEqual(availableAccountActions({...user,status:'LOCKED'},admin,grants),['UNLOCK','ARCHIVE','DELETE']);
 assert.deepEqual(availableAccountActions({...user,status:'ARCHIVED'},admin,grants),[]);
});
test('self actions, locked operators and non-manageable target accounts are never offered',()=>{
 assert.deepEqual(availableAccountActions(admin,admin,grants),[]);
 assert.deepEqual(availableAccountActions(user,{...admin,status:'LOCKED'},grants),[]);
 assert.deepEqual(availableAccountActions({...user,managementAllowed:false},admin,grants),[]);
});
test('each account operation requires its own permission',()=>{
 assert.deepEqual(availableAccountActions({...user,status:'LOCKED'},admin,{status:true,archive:false,delete:false}),['UNLOCK']);
 assert.deepEqual(availableAccountActions(user,admin,{status:false,archive:false,delete:false}),[]);
});
