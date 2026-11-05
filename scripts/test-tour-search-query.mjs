import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/tourSearch.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { tourSearchQuery } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const run = (raw, defaultSize) => tourSearchQuery(new URLSearchParams(raw), defaultSize);

test('page beyond the backend ceiling is clamped instead of shared as a dead link', () => {
  // TourService.searchTours rejects page > 2000 with 400, so a clamped page keeps the link usable.
  const clamped = run('page=2500');
  assert.equal(clamped.page, 2000);
  assert.equal(clamped.query.get('page'), '2000');
});

test('garbage and negative paging fall back to the first page', () => {
  for (const raw of ['page=-4', 'page=abc', 'page=1.5', '']) assert.equal(run(raw).page, 0, raw);
});

test('page size stays inside the 1..50 window the service accepts', () => {
  assert.equal(run('size=500').size, 50);
  assert.equal(run('size=0').size, 5);
  assert.equal(run('size=7', 3).size, 7);
  // An oversized default is clamped too, never forwarded as-is.
  assert.equal(run('', 999).size, 50);
});

test('only the filter keys the backend understands are forwarded', () => {
  const { query } = run('dest=Ha+Long&sort=priceLow&evil=1&page=2&size=10');
  assert.deepEqual([...query.keys()].sort(), ['dest', 'page', 'size', 'sort']);
  assert.equal(query.get('dest'), 'Ha Long');
  assert.equal(query.get('page'), '2');
});
