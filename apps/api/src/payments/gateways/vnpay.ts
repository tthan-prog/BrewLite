import { createHmac, timingSafeEqual } from 'node:crypto';

/** Ký theo quy tắc VNPay 2.1.0: sắp xếp khóa, mã hóa URL (khoảng trắng → +), HMAC-SHA512. */
export function vnpaySign(params: Record<string, string>, secret: string) {
  const query = Object.keys(params)
    .filter((k) => k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType')
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
  const hash = createHmac('sha512', secret)
    .update(Buffer.from(query, 'utf-8'))
    .digest('hex');
  return { query, hash };
}

/** yyyyMMddHHmmss theo giờ Việt Nam (GMT+7). */
export function vnpayDate(date: Date): string {
  const vn = new Date(date.getTime() + 7 * 3600 * 1000);
  return vn.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

export function buildVnpayUrl(opts: {
  baseUrl: string;
  tmnCode: string;
  secret: string;
  txnRef: string;
  amountVnd: number;
  returnUrl: string;
  ip: string;
  now: Date;
  expiresAt: Date;
}): string {
  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: opts.tmnCode,
    vnp_Amount: String(opts.amountVnd * 100),
    vnp_CreateDate: vnpayDate(opts.now),
    vnp_ExpireDate: vnpayDate(opts.expiresAt),
    vnp_CurrCode: 'VND',
    vnp_IpAddr: opts.ip,
    vnp_Locale: 'vn',
    vnp_OrderInfo: `Thanh toan don hang BrewLite ${opts.txnRef}`,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: opts.returnUrl,
    vnp_TxnRef: opts.txnRef,
  };
  const { query, hash } = vnpaySign(params, opts.secret);
  return `${opts.baseUrl}?${query}&vnp_SecureHash=${hash}`;
}

export interface VnpayResult {
  valid: boolean;
  success: boolean;
  txnRef: string;
  amountVnd: number;
  providerRef: string;
}

export function verifyVnpay(
  query: Record<string, unknown>,
  secret: string,
): VnpayResult {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (k.startsWith('vnp_') && typeof v === 'string') params[k] = v;
  }
  const given = params['vnp_SecureHash'] ?? '';
  const expected = vnpaySign(params, secret).hash;
  const a = Buffer.from(given.toLowerCase());
  const b = Buffer.from(expected);
  const valid = a.length === b.length && timingSafeEqual(a, b);
  return {
    valid,
    success:
      valid &&
      params['vnp_ResponseCode'] === '00' &&
      (params['vnp_TransactionStatus'] ?? '00') === '00',
    txnRef: params['vnp_TxnRef'] ?? '',
    amountVnd: Math.round(Number(params['vnp_Amount'] ?? 0) / 100),
    providerRef: params['vnp_TransactionNo'] ?? '',
  };
}
