import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const compile = async path => ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

const { LIST_PAGE_SIZE, listPageParams, isListCapped } = await import(
  `data:text/javascript;base64,${Buffer.from(await compile('../src/utils/index.tsx')).toString('base64')}`
);

test('an admin list asks for the biggest page the backend still answers', () => {
  assert.deepEqual(listPageParams(), { page: 0, size: LIST_PAGE_SIZE });
  assert.deepEqual(listPageParams({ page: 3, size: 20 }), { page: 3, size: 20 });
});

/** The profile history is self-service; a staff account must not be handed the global page. */
test('mine is sent only when the caller asks for its own rows', () => {
  assert.deepEqual(listPageParams({ mine: true }), { page: 0, size: LIST_PAGE_SIZE, mine: true });
  assert.deepEqual(listPageParams({ mine: false }), { page: 0, size: LIST_PAGE_SIZE });
  assert.equal('mine' in listPageParams(), false);
});

test('a full page is reported as capped so the UI can warn', () => {
  assert.equal(isListCapped(new Array(LIST_PAGE_SIZE)), true);
  assert.equal(isListCapped(new Array(LIST_PAGE_SIZE - 1)), false);
  assert.equal(isListCapped(undefined, 10), false);
});
