import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const source = await readFile(new URL('../src/utils/index.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { createClientKey } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const realCrypto = globalThis.crypto;

test('secure context keeps using crypto.randomUUID', () => {
  assert.match(createClientKey(), UUID_V4);
});

test('plain-HTTP fallback still emits a canonical v4 UUID the backend accepts', () => {
  // BookingLifecycleService validates with UUID.fromString, so k-... keys are rejected with 400.
  Object.defineProperty(globalThis, 'crypto', { value: { getRandomValues: (bytes) => { for (let i = 0; i < bytes.length; i += 1) bytes[i] = i; return bytes; } }, configurable: true });
  try {
    const key = createClientKey();
    assert.match(key, UUID_V4);
    assert.equal(realCrypto.randomUUID === undefined, false);
    assert.equal(typeof key, 'string');
  } finally {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
  }
});

test('fallback without any Web Crypto still produces distinct valid UUIDs', () => {
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  try {
    const keys = new Set([createClientKey(), createClientKey(), createClientKey()]);
    for (const key of keys) assert.match(key, UUID_V4);
    assert.equal(keys.size, 3);
  } finally {
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true });
  }
});
