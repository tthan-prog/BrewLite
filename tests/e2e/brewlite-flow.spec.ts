import { expect, test } from '@playwright/test';

// E2E-T01: luồng chính từ menu đến xác nhận đơn (FR-01..FR-09, FR-12).
// Mỗi lần chạy tự đăng ký một tài khoản mới nên không phụ thuộc dữ liệu seed ngoài sản phẩm.

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.dev`;
}

async function registerAndLogin(page: import('@playwright/test').Page) {
  const email = uniqueEmail();
  await page.goto('/register');
  await page.fill('#name', 'Người Dùng E2E');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.fill('#confirm', 'secret123');
  await page.click('button[type=submit]');
  await page.waitForSelector('.form-success');

  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', 'secret123');
  await page.click('button[type=submit]');
  await page.waitForURL('**/menu');
}

test('E2E-T01a: menu hiển thị sản phẩm lấy từ API', async ({ page }) => {
  await page.goto('/menu');
  await expect(page.locator('.brew-card').first()).toBeVisible();
  expect(await page.locator('.brew-card').count()).toBeGreaterThanOrEqual(1);
});

test('E2E-T01b: đăng ký, đăng nhập, đặt đơn, thanh toán lỗi rồi thử lại thành công, xem lịch sử', async ({ page }) => {
  await registerAndLogin(page);

  await page.waitForSelector('.brew-card');
  await page.locator('.brew-card-art').first().click();
  await page.locator('button', { hasText: /Thêm vào giỏ/ }).first().click();

  await page.locator('.brew-nav button', { hasText: 'Giỏ hàng' }).click();
  await page.locator('button', { hasText: /Tiến hành thanh toán/ }).click();

  // Thanh toán lỗi (giả lập): hiện thông báo, giỏ hàng được giữ, đơn ở PAYMENT_FAILED.
  await page.check('input[type=checkbox]');
  await page.locator('button.brew-full[type=submit]').click();
  await expect(page.locator('.brew-notice')).toBeVisible();

  // Thử lại thành công: PAYMENT_FAILED -> PENDING -> PAID, chuyển sang trang xác nhận.
  await page.uncheck('input[type=checkbox]');
  await page.locator('button.brew-full[type=submit]').click();
  await page.waitForURL('**/orders/confirmation');
  await expect(page.locator('.order-number')).toBeVisible();
  await expect(page.locator('.status-pill')).toContainText(/PAID|Đã thanh toán/i);

  // Lịch sử đơn có ít nhất một đơn.
  await page.goto('/orders/history');
  await page.waitForSelector('table');
  expect(await page.locator('tbody tr').count()).toBeGreaterThanOrEqual(1);
});

test.describe('NFR-05: mobile-first', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('E2E-T02: menu dùng được trên màn hình điện thoại, không cuộn ngang', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.locator('.brew-card').first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

// E2E-T03: trạng thái loading / rỗng / lỗi của menu (FR-02, Task 4.3).
// API được giả lập bằng page.route để kiểm soát từng trạng thái.
test.describe('FR-02: trạng thái menu', () => {
  const cors = { 'access-control-allow-origin': '*' };

  test('E2E-T03a: hiển thị "đang tải" rồi hiện sản phẩm', async ({ page }) => {
    await page.route('**/products', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto('/menu');
    await expect(page.getByText('Đang tải thực đơn...')).toBeVisible();
    await expect(page.locator('.brew-card').first()).toBeVisible();
  });

  test('E2E-T03b: menu rỗng báo "chưa có đồ uống"', async ({ page }) => {
    await page.route('**/products', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: '[]' }),
    );
    await page.goto('/menu');
    await expect(page.getByText('Hiện chưa có đồ uống nào')).toBeVisible();
    await expect(page.locator('.brew-card')).toHaveCount(0);
  });

  test('E2E-T03c: API lỗi báo lỗi và bấm "Thử lại" thì tải được', async ({ page }) => {
    await page.route('**/products', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        headers: cors,
        body: JSON.stringify({ message: 'Internal server error' }),
      }),
    );
    await page.goto('/menu');
    await expect(page.getByText('Không tải được thực đơn')).toBeVisible();
    await page.unroute('**/products');
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.locator('.brew-card').first()).toBeVisible();
  });
});

// E2E-T04: PWA cơ bản (đề nêu Next.js mobile-first/PWA): có manifest và biểu tượng tải được.
test('E2E-T04: manifest PWA hợp lệ và biểu tượng tải được', async ({ page, request, baseURL }) => {
  await page.goto('/menu');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href!, baseURL).toString());
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ name: 'BrewLite', display: 'standalone', start_url: '/menu' });
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of m.icons) {
    const r = await request.get(new URL(icon.src, baseURL).toString());
    expect(r.ok()).toBe(true);
  }
});

// E2E-T05: thanh toán bằng mã QR (mô phỏng): máy tính hiện QR, "điện thoại" (trang thứ hai) mở
// URL trong QR, chọn tài khoản test + PIN, máy tính tự chuyển sang xác nhận và hiện điểm được cộng.
test('E2E-T05: thanh toán QR MoMo bằng tài khoản test, hiện điểm được cộng', async ({ page, browser }) => {
  await registerAndLogin(page);
  await page.waitForSelector('.brew-card');
  await page.locator('.brew-card-art').first().click();
  await page.locator('button', { hasText: /Thêm vào giỏ/ }).first().click();
  await page.locator('.brew-nav button', { hasText: 'Giỏ hàng' }).click();
  await page.locator('button', { hasText: /Tiến hành thanh toán/ }).click();

  await page.selectOption('select', 'MOMO');
  await page.locator('button.brew-full[type=submit]').click();

  const qrDialog = page.getByRole('dialog', { name: /mã QR/i });
  await expect(qrDialog.locator('img[alt="Mã QR thanh toán"]')).toBeVisible();
  const payUrl = await qrDialog.locator('a[href*="/pay/"]').first().getAttribute('href');
  expect(payUrl).toBeTruthy();

  // "Điện thoại": ngữ cảnh trình duyệt riêng, màn hình nhỏ, không có phiên đăng nhập.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const phonePage = await phone.newPage();
  await phonePage.goto(payUrl!);
  await phonePage.waitForSelector('#acc');
  await phonePage.selectOption('#acc', '0900000001');
  await phonePage.fill('#pin', '123456');
  await phonePage.getByRole('button', { name: /Xác nhận thanh toán/ }).click();
  await expect(phonePage.locator('.form-success')).toContainText(/thành công/i);
  await phone.close();

  await page.waitForURL('**/orders/confirmation', { timeout: 20_000 });
  await expect(page.locator('.status-pill')).toContainText(/PAID/);
  await expect(page.getByText(/\+\d+ điểm/)).toBeVisible();
});
