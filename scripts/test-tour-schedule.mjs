import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import dayjs from 'dayjs';

const source = await readFile(new URL('../src/utils/tourSchedule.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace("from 'dayjs'", `from '${import.meta.resolve('dayjs')}'`);
const { departureCalendar, departureMonthStart } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const now = dayjs('2026-10-15T01:00:00');

test('ISO month from API produces October, not NaN from slash splitting', () => {
  const month = departureMonthStart('2026-10');
  assert.equal(month.isValid(), true); assert.equal(month.month(), 9); assert.equal(month.year(), 2026); assert.equal(month.date(), 1);
});
test('empty and malformed month cannot become a calendar value', () => {
  for (const month of ['', '10/2026', '2026-13', 'NaN', 'undefined-2026-10']) assert.equal(departureMonthStart(month), null);
});
test('months are sorted across years and invalid/past departures are excluded', () => {
  const calendar = departureCalendar([
    { id: '3', departureDate: '2027-01-05T06:00:00' },
    { id: '1', departureDate: '2026-10-16T06:00:00' },
    { id: '2', departureDate: '2026-10-09T06:00:00' },
    { id: '4', departureDate: 'invalid-date' },
    { id: '5', departureDate: '' },
    { id: '6', departureDate: null },
  ], 3350000, now);
  assert.deepEqual(calendar.months, ['2026-10', '2027-01']);
  assert.deepEqual(Object.keys(calendar.dates).sort(), ['2026-10-16', '2027-01-05']);
  assert.equal(calendar.dates['2026-10-16'].id, 1);
});
test('tour with no upcoming departures has an explicit empty state', () => {
  assert.deepEqual(departureCalendar([{ id: '1', departureDate: '2026-10-09T06:00:00' }], 3350000, now), { dates: {}, months: [] });
});
