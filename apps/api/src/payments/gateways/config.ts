/**
 * Cấu hình cổng thanh toán đọc từ biến môi trường tại thời điểm gọi (dễ test).
 * KHÔNG ghi khóa bí mật vào mã nguồn: đặt chúng trong .env / biến môi trường của Render.
 */
export function paymentConfig(env: NodeJS.ProcessEnv = process.env) {
  const trim = (v?: string) => (v ?? '').trim().replace(/\/$/, '');
  return {
    webUrl: trim(env.PUBLIC_WEB_URL) || 'http://localhost:3000',
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
