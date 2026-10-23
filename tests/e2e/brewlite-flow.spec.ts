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
