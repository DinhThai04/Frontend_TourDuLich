import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

async function loadTs(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const { ageOnVietnamDate, unitPriceFor, passengerTypeFor, passengersForBooking } = await loadTs('../src/utils/booking.ts');
const { bookingAttemptKey, bookingAttemptScope, clearBookingAttempt } = await loadTs('../src/utils/bookingAttempt.ts');
const { ADMIN_ACCESS, hasPermission } = await loadTs('../src/config/access.ts');
const price = { adultPrice: 8490000, childPrice: 6390000, toddlerPrice: 0, infantPrice: 500, singleSupplementPrice: 1500000 };

test('one traveler pays adult fare without an unselected room surcharge', () => {
  assert.equal(unitPriceFor('ADULT', price), 8490000);
});
test('booker + adult + child totals all three people', () => {
  const travelers = passengersForBooking(true, { bookingType: 'ADULT' }, [{ bookingType: 'ADULT' }, { bookingType: 'CHILD' }]);
  assert.equal(travelers.length, 3);
  assert.equal(travelers.reduce((sum, traveler) => sum + unitPriceFor(traveler.bookingType, price), 0), 23370000);
});
test('contact can opt out; no duplicate implicit traveler', () => {
  assert.equal(passengersForBooking(false, { fullName: 'Contact' }, [{ fullName: 'Traveler' }]).length, 1);
});
test('missing price cannot show a payable amount', () => {
  assert.equal(unitPriceFor('ADULT', undefined), 0);
});
test('zero-price toddler and numeric strings are handled consistently', () => {
  assert.equal(unitPriceFor('TODDLER', { ...price, toddlerPrice: '0' }), 0);
  assert.equal(unitPriceFor('CHILD', { ...price, childPrice: '6390000' }), 6390000);
});
test('age rules mirror booking_service passenger types', () => {
  const bornYearsAgo = (years) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return { isValid: () => true, year: () => date.getFullYear(), month: () => date.getMonth(), date: () => date.getDate() };
  };
  assert.equal(passengerTypeFor(bornYearsAgo(1)), 'INFANT');
  assert.equal(passengerTypeFor(bornYearsAgo(3)), 'TODDLER');
  assert.equal(passengerTypeFor(bornYearsAgo(8)), 'CHILD');
  assert.equal(passengerTypeFor(bornYearsAgo(30)), 'ADULT');
  assert.equal(passengerTypeFor(null), 'ADULT');
});
test('passenger ages change at midnight in Vietnam regardless of the browser timezone', () => {
  const beforeMidnight = new Date('2026-11-18T16:59:59.999Z');
  const midnight = new Date('2026-11-18T17:00:00.000Z');
  const bornOnNov19 = (year) => ({ isValid: () => true, year: () => year, month: () => 10, date: () => 19 });

  assert.equal(passengerTypeFor(bornOnNov19(2014), beforeMidnight), 'CHILD');
  assert.equal(passengerTypeFor(bornOnNov19(2014), midnight), 'ADULT');
  assert.equal(ageOnVietnamDate(bornOnNov19(2008), beforeMidnight), 17);
  assert.equal(ageOnVietnamDate(bornOnNov19(2008), midnight), 18);
  assert.equal(ageOnVietnamDate(bornOnNov19(2026), beforeMidnight), -1);
  assert.equal(ageOnVietnamDate(bornOnNov19(2026), midnight), 0);
});

test('booking restores the pending key per account and departure until success or expiry', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key) },
  });
  const scope = bookingAttemptScope(1, '007');
  const create = () => 'new-key';
  try {
    storage.set(scope, JSON.stringify({ key: 'pending-key', expiresAt: 100 }));
    assert.equal(bookingAttemptKey(bookingAttemptScope(1, '7'), create, 99), 'pending-key');
    assert.equal(bookingAttemptKey(bookingAttemptScope(2, '7'), () => 'other-account', 99), 'other-account');
    assert.equal(bookingAttemptKey(bookingAttemptScope(1, '8'), () => 'other-departure', 99), 'other-departure');
    assert.equal(bookingAttemptKey(scope, create, 100), 'new-key');
    assert.deepEqual(Object.keys(JSON.parse(storage.get(scope))).sort(), ['expiresAt', 'key']);

    clearBookingAttempt(scope);
    assert.equal(storage.has(scope), false);
    assert.equal(bookingAttemptKey(scope, () => 'after-success', 100), 'after-success');
  } finally {
    for (const key of storage.keys()) clearBookingAttempt(key);
    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
test('staff UI entry is independent from API rights; reserved database admin role remains full access', () => {
  assert.equal(hasPermission({ role: { id: 99, name: 'Renamed role', permissions: [{ code: 'TOURS_GET_LIST' }] } }, ADMIN_ACCESS), true);
  assert.equal(hasPermission({ role: { id: 1, name: 'ADMIN', permissions: [] } }, ADMIN_ACCESS), true);
  assert.equal(hasPermission({ role: { name: 'Khách Hàng', permissions: [{ code: 'BOOKINGS_CREATE' }] } }, ADMIN_ACCESS), false);
  assert.equal(hasPermission(null, ADMIN_ACCESS), false);
});

test('3.35 million tour charges exactly one adult fare', () => {
  assert.equal(unitPriceFor('ADULT', { ...price, adultPrice: 3350000 }), 3350000);
});
