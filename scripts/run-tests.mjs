import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const tests = readdirSync(scriptsDir)
  .filter((name) => /^test-.*\.mjs$/.test(name))
  .sort();

if (tests.length === 0) {
  console.error('Không tìm thấy script test-*.mjs nào.');
  process.exit(1);
}

for (const name of tests) {
  const file = join(scriptsDir, name);
  console.log(`\n> node ${join('scripts', name)}`);
  const result = spawnSync(process.execPath, [resolve(file)], { stdio: 'inherit' });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nThất bại: ${name}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nĐã chạy xong ${tests.length} bộ test.`);
