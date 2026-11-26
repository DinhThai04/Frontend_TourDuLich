const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.SGU_BROWSER_BASE_URL || 'http://localhost';
const email = process.env.SGU_BROWSER_ADMIN_EMAIL;
const password = process.env.SGU_BROWSER_ADMIN_PASSWORD;
assert(email && password, 'Set SGU_BROWSER_ADMIN_EMAIL and SGU_BROWSER_ADMIN_PASSWORD');

async function main() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    async function go(path) {
      await page.goto(base + path);
    }
    await go('/login');
    await page.locator('input[type=email]').first().fill(email);
    await page.locator('input[type=password]').fill(password);
    await page.locator('button[type=submit]').click();
    await page.getByRole('heading', { name: 'Tổng quan', exact: true }).waitFor();

    async function edges() {
      return page.locator('.admin-data-table').first().evaluate(node => {
        const { left, right } = node.getBoundingClientRect();
        return [left, right];
      });
    }
    async function overlay(label, open, ready, close) {
      const before = await edges();
      await open();
      await ready();
      assert.deepEqual(await edges(), before, label + ' khi mở');
      await close();
      assert.deepEqual(await edges(), before, label + ' khi đóng');
      console.log('PASS', label, before);
    }

    await go('/admin/managerUser');
    const dialog = page.getByRole('dialog').first();
    const closeDialog = async () => {
      const close = dialog.getByRole('button', { name: /Close|Đóng|Hủy/i }).first();
      await close.click();
      await dialog.waitFor({ state: 'hidden' });
    };
    await overlay('Drawer', () => page.getByRole('button', { name: /Xem chi tiết|Chi tiết/ }).first().click(),
      () => dialog.waitFor(), closeDialog);
    await overlay('Modal', () => page.getByRole('button', { name: /Thêm người dùng/ }).first().click(),
      () => dialog.waitFor(), closeDialog);

    await go('/admin/tours');
    await overlay('Dropdown', () => page.getByRole('button', { name: /^Thao tác tour/ }).first().click(),
      () => page.getByRole('menuitem', { name: 'Sửa' }).waitFor(),
      () => page.keyboard.press('Escape'));
    await overlay('Sidebar', () => page.mouse.move(22, 110),
      () => page.waitForFunction(() => document.querySelector('.admin-sidebar').getBoundingClientRect().width >= 263),
      async () => {
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('.admin-sidebar').getBoundingClientRect().width === 72);
      });

    await go('/admin/managerRole?page=1&size=10');
    const deleteButton = page.getByRole('button', { name: 'Xóa quyền', exact: true }).first();
    const confirmation = page.locator('.ant-popconfirm').filter({ visible: true }).first();
    await overlay('Popconfirm', () => deleteButton.click(), () => confirmation.waitFor(), async () => {
      await page.getByRole('heading', { name: 'Quyền hạn', exact: true }).click();
      await confirmation.waitFor({ state: 'hidden' });
    });

    const pageInput = page.getByRole('textbox', { name: 'Trang hiện tại, nhập số trang rồi nhấn Enter' });
    async function enter(value) {
      await pageInput.fill(value);
      await pageInput.press('Enter');
    }
    await enter('2');
    await page.waitForURL(/page=2&size=10/);
    await page.waitForFunction(() => document.querySelector('.admin-pagination input[inputmode=numeric]')?.value === '2');
    const summary = await page.locator('.admin-pagination > span').innerText();
    const pageCount = Math.ceil(Number(summary.split('/').at(-1).trim()) / 10);
    await enter('99999');
    await page.waitForURL(url => Number(url.searchParams.get('page')) === pageCount);
    await page.getByRole('tooltip').filter({ hasText: `Tối đa ${pageCount} trang` }).waitFor();
    const last = Number(new URL(page.url()).searchParams.get('page'));
    assert(last >= 2 && last < 99999);
    await page.waitForFunction(expected => document.querySelector('.admin-pagination input[inputmode=numeric]')?.value === String(expected), last);
    await page.locator('.admin-pagination').getByText('10 / trang', { exact: true }).click();
    await page.locator('.ant-select-dropdown').getByText('20 / trang', { exact: true }).click();
    await page.waitForURL(/page=1&size=20/);
    await page.locator('.admin-pagination').getByTitle('20 / trang', { exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('.admin-pagination input[inputmode=numeric]')?.value === '1');
    await enter('2');
    await page.waitForURL(/page=2&size=20/);
    await page.reload();
    await page.locator('.admin-pagination').getByTitle('20 / trang', { exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('.admin-pagination input[inputmode=numeric]')?.value === '2');
    assert.equal(new URL(page.url()).searchParams.get('size'), '20');
    console.log('PASS phân trang', last);

    for (const width of [1366, 1920]) {
      await page.setViewportSize({ width, height: width === 1366 ? 768 : 1080 });
      for (const path of ['/admin/managerInvoice', '/admin/audit', '/admin/managerTour/destination']) {
        await go(path + '?size=auto');
        await page.locator('.ant-table-row[data-row-key]').first().waitFor();
        await page.waitForFunction(() => {
          const main = document.querySelector('main.admin-content');
          return main && main.scrollHeight - main.clientHeight <= 1;
        });
        console.log('PASS vừa màn hình', width, path);
      }
    }

    const newTab = await context.newPage();
    const session = await page.evaluate(() => Object.entries(sessionStorage));
    await newTab.addInitScript(entries => entries.forEach(([key, value]) => sessionStorage.setItem(key, value)), session);
    await newTab.goto(base + '/admin/tours/15/itinerary');
    const itinerary = newTab.locator('.ant-table-row[data-row-key]').first();
    await itinerary.waitFor();
    await newTab.reload();
    await itinerary.waitFor();
    await newTab.goto(base + '/admin/tours/99999999/itinerary');
    await newTab.getByText('Không tìm thấy trang', { exact: true }).waitFor();
    console.log('PASS tour #15 trực tiếp và F5, tour không tồn tại hiện 404');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
