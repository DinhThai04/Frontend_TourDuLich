const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');

const base = process.env.SGU_BROWSER_BASE_URL || 'http://localhost';
const email = process.env.SGU_BROWSER_ADMIN_EMAIL;
const password = process.env.SGU_BROWSER_ADMIN_PASSWORD;
assert(email && password, 'Set SGU_BROWSER_ADMIN_EMAIL and SGU_BROWSER_ADMIN_PASSWORD');
const suffix = randomBytes(4).toString('hex');
let token;
const resultRows = [];

async function call(method, path, payload, label = path) {
  const response = await fetch(base + '/api/v1' + path, {
    method,
    headers: { ...(token && { Authorization: 'Bearer ' + token }), ...(payload && !(payload instanceof FormData) && { 'Content-Type': 'application/json' }) },
    body: payload instanceof FormData ? payload : payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(25000),
  });
  const body = await response.json().catch(() => ({}));
  const ok = response.ok && body.code === 1000;
  resultRows.push({ method, label, status: response.status, code: body.code, ok });
  if (!ok) throw new Error(`${method} ${label}: HTTP ${response.status}, mã ${body.code ?? '—'}`);
  return body.result;
}

async function test(label, callback) {
  try { await callback(); } catch (error) { console.error(label, error.message); process.exitCode = 1; }
}

async function main() {
  token = (await call('POST', '/auth/users/login', { email, password }, 'Đăng nhập admin')).token;
  const paths = [
    '/auth/roles', '/auth/permissions/list', '/auth/users/list?page=0&size=10', '/auth/reviews/list', '/auth/reviews/tour/15',
    '/tour/tours/list', '/tour/tours/15', '/tour/itineraries/tour/15',
    '/tour/tour-departures/list', '/tour/tour-departures/tour/15/all', '/tour/tour-departures/upcoming?page=0',
    '/tour/locations/destinations', '/pricing/prices', '/booking/book/all?page=0&size=10', '/booking/book/10',
    '/booking/customer/booking/10', '/invoice/direct/all?page=0&size=10', '/invoice/direct/booking/10',
    '/booking/operations/report?from=2026-11-01&through=2026-11-26', '/booking/operations/audit?page=0&size=10',
    '/booking/operations/deliveries/10', '/booking/operations/integrity',
    '/payment/reconciliation?page=0&size=10&view=ACTIONABLE', '/payment/reconciliation?page=0&size=10&view=HISTORY',
    '/booking/changes/admin/pending?page=0&size=10',
  ];
  for (const path of paths) await test(path, () => call('GET', path));
  await test('Quét dữ liệu đơn', () => call('POST', '/booking/operations/integrity/rescan'));

  await test('Quyền và vai trò kiểm thử', async () => {
    let permission;
    let role;
    try {
      const input = { code: `QA_ADMIN_${suffix.toUpperCase()}`, name: `QA ${suffix}`, apiPath: `/api/v1/qa/${suffix}`, method: 'GET', module: 'QA' };
      permission = await call('POST', '/auth/permissions', input);
      await call('GET', `/auth/permissions/${permission.id}`);
      await call('PUT', '/auth/permissions', { ...input, id: permission.id, name: `QA updated ${suffix}` });
      role = await call('POST', '/auth/roles', { name: `qa-${suffix}`, active: true, description: 'Vai trò kiểm thử tạm thời', permissions: [] });
      await call('GET', `/auth/roles/${role.id}`);
      await call('PUT', '/auth/roles', { id: role.id, name: role.name, active: true,
        description: 'Kiểm thử gán quyền và ghi nhật ký', permissions: [{ id: permission.id }] });
      const saved = await call('GET', `/auth/roles/${role.id}`, undefined, 'Đọc lại quyền sau PUT');
      assert(saved.permissions.some(item => item.id === permission.id), 'Quyền mới chưa được lưu');
    } finally {
      if (role) await call('DELETE', `/auth/roles/${role.id}`);
      if (permission) await call('DELETE', `/auth/permissions/${permission.id}`);
    }
  });

  await test('Tour và lịch trình kiểm thử', async () => {
    let tour;
    let row;
    const source = await call('GET', '/tour/tours/15');
    const data = new FormData();
    for (const [key, value] of Object.entries({
      tourTitle: `QA tour ${suffix}`, tourProgram: `QA-${suffix}`,
      description: 'Tour tạm để kiểm thử API quản trị', duration: 2,
      departureLocationId: source.departureCity.id, destinationLocationId: source.destinationCity.id,
      vehicleId: source.vehicle.id, tourPriceId: source.tourPrice.id,
    })) data.set(key, String(value));
    try {
      tour = await call('POST', '/tour/tours', data);
      data.set('tourTitle', `QA tour đã sửa ${suffix}`);
      await call('PUT', `/tour/tours/${tour.id}`, data);
      const input = { tourId: tour.id, title: `QA ${suffix}`, description: 'Dòng thử tạm thời', meal: 'Không có' };
      row = await call('POST', '/tour/itineraries', input);
      await call('PUT', `/tour/itineraries/${row.id}`, { ...input, title: `QA đã sửa ${suffix}` });
      const list = await call('GET', `/tour/itineraries/tour/${tour.id}`, undefined, 'Đọc lại lịch trình sau PUT');
      assert(list.some(item => item.id === row.id && item.title === `QA đã sửa ${suffix}`));
    } finally {
      if (row) await call('DELETE', `/tour/itineraries/${row.id}`);
      if (tour) await call('DELETE', `/tour/tours/${tour.id}`);
    }
  });

  if (process.env.SGU_SMOKE_PRICE_ID) await test('Bảng giá kiểm thử đã chỉ định', async () => {
    const priceId = Number(process.env.SGU_SMOKE_PRICE_ID);
    const original = await call('GET', `/pricing/prices/${priceId}`);
    try {
      await call('PUT', `/pricing/prices/${priceId}`, { ...original, adultPrice: Number(original.adultPrice) + 1000 });
    } finally {
      await call('PUT', `/pricing/prices/${priceId}`, original, 'Khôi phục giá fixture');
    }
  });
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => {
  for (const row of resultRows) console.log(`${row.method} ${row.label} → ${row.status} / ${row.code ?? '—'}`);
  console.log(`${resultRows.filter(row => row.ok).length}/${resultRows.length} thành công, ${resultRows.filter(row => row.status >= 500).length} lỗi 5xx`);
});
