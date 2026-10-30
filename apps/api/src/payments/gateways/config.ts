import { detectLanIp, isLoopbackHost } from '../../common/lan.js';

/**
 * Nếu PUBLIC_WEB_URL trống hoặc là localhost (khi phát triển), thay máy chủ bằng IP mạng nội bộ
 * của máy để điện thoại cùng Wi-Fi quét QR mở được — không cần sửa .env mỗi lần đổi mạng.
 * Địa chỉ công khai (https://...) hoặc đã là IP LAN thì giữ nguyên.
 */
export function resolveWebUrl(configured: string, lanIp: string | null): string {
  const fallback = 'http://localhost:3000';
  const base = configured || fallback;
  if (!lanIp) return base;
  try {
    const u = new URL(base);
    if (!isLoopbackHost(u.hostname)) return base;
    u.hostname = lanIp;
    return u.origin;
  } catch {
    return base;
  }
}

/**
 * Cấu hình cổng thanh toán đọc từ biến môi trường tại thời điểm gọi (dễ test).
 * KHÔNG ghi khóa bí mật vào mã nguồn: đặt chúng trong .env / biến môi trường của Render.
 */
export function paymentConfig(
  env: NodeJS.ProcessEnv = process.env,
  lanIp?: string | null,
) {
  const trim = (v?: string) => (v ?? '').trim().replace(/\/$/, '');
  // Chỉ tự dò IP khi dùng process.env thật và không phải production/test.
  const auto =
    lanIp !== undefined
      ? lanIp
      : env === process.env &&
          env.NODE_ENV !== 'production' &&
          env.NODE_ENV !== 'test' &&
          env.PUBLIC_WEB_AUTO !== 'false'
        ? detectLanIp()
        : null;
  return {
    webUrl: resolveWebUrl(trim(env.PUBLIC_WEB_URL), auto),
    apiUrl: trim(env.PUBLIC_API_URL) || 'http://localhost:3001',
    ttlMinutes: Math.max(1, Number(env.PAYMENT_QR_TTL_MINUTES) || 10),
    vnpay: {
      tmnCode: env.VNPAY_TMN_CODE?.trim() ?? '',
      secret: env.VNPAY_HASH_SECRET?.trim() ?? '',
      url:
        env.VNPAY_URL?.trim() ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    },
    momo: {
      partnerCode: env.MOMO_PARTNER_CODE?.trim() ?? '',
      accessKey: env.MOMO_ACCESS_KEY?.trim() ?? '',
      secretKey: env.MOMO_SECRET_KEY?.trim() ?? '',
      endpoint:
        env.MOMO_ENDPOINT?.trim() ||
        'https://test-payment.momo.vn/v2/gateway/api/create',
    },
  };
}

export type PaymentConfig = ReturnType<typeof paymentConfig>;

export const vnpayConfigured = (c: PaymentConfig) =>
  Boolean(c.vnpay.tmnCode && c.vnpay.secret);
export const momoConfigured = (c: PaymentConfig) =>
  Boolean(c.momo.partnerCode && c.momo.accessKey && c.momo.secretKey);
