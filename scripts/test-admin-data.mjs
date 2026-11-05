import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../src/utils/adminInvoices.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {adminInvoiceRows}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('authorized invoices remain visible without permission to list all bookings and use their actual owner',()=>{
 const rows=adminInvoiceRows([], [{id:'3',bookingId:'7',accountId:'2',status:'PAID',totalBookingTourExpense:'3350000'}],[],[],null,{'2':'Actual customer'});
 assert.equal(rows.length,1);assert.equal(rows[0].userName,'Actual customer');assert.equal(rows[0].invoiceAmount,3350000);assert.equal(rows[0].id,'7');
});
test('missing users and malformed amounts have explicit fallbacks instead of admin name or NaN',()=>{
 const rows=adminInvoiceRows([], [{id:'3',bookingId:'7',accountId:'9',status:'PAID',totalBookingTourExpense:'invalid'},{id:'4',status:'UNPAID'}],[],[],null,{});
 assert.equal(rows.length,1);assert.equal(rows[0].userName,'Tài khoản #9');assert.equal(rows[0].invoiceAmount,undefined);
});
