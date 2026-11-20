import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import dayjs from 'dayjs';

const source = await readFile(new URL('../src/utils/tourSchedule.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  .replace("from 'dayjs'", `from '${import.meta.resolve('dayjs')}'`);
const { departureCalendar, departureMonthStart, departureAdultPrice, departureIdFromSearch } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
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
  const calendar = departureCalendar([{ id: '1', departureDate: '2026-10-09T06:00:00' }], 3350000, now);
  assert.deepEqual(calendar.months, []);
  assert.deepEqual(calendar.upcoming, []);
});
test('sold-out dates stay visible while a bookable time on the same day wins', () => {
  const calendar = departureCalendar([
    { id: 1, departureDate: '2026-10-16T06:00:00', availableSeats: 0 },
    { id: 2, departureDate: '2026-10-16T08:00:00', availableSeats: 3, tourPrice: { adultPrice: 4500000 } },
    { id: 3, departureDate: '2026-11-10T08:00:00', availableSeats: 0 },
    { id: 4, departureDate: '2026-11-13T08:00:00', availableSeats: 4, operationalStatus: 'SUSPENDED' },
  ], 3350000, now);
  assert.deepEqual(calendar.months, ['2026-10', '2026-11']);
  assert.deepEqual([...calendar.soldOutDays], ['2026-11-10']);
  assert.deepEqual(calendar.dates['2026-10-16'], { id: 2, price: '4.500K' });
});
test('a selected day displays its own adult price and shares a validated departure id', () => {
  assert.equal(departureAdultPrice({ basePrice: 3350000 }, { tourPrice: { adultPrice: 4500000 } }), 4500000);
  assert.equal(departureAdultPrice({ basePrice: 3350000 }, null), 3350000);
  assert.equal(departureIdFromSearch('?departureId=42'), 42);
  assert.equal(departureIdFromSearch('?departureId=4.2'), null);
});
