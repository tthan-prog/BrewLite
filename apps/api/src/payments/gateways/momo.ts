import { createHmac, timingSafeEqual } from 'node:crypto';

const hmac = (secret: string, raw: string) =>
  createHmac('sha256', secret).update(raw).digest('hex');

export interface MomoCreateInput {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  requestId: string;
  orderId: string;
  amount: number;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
}

export function momoCreateSignature(i: MomoCreateInput): string {
  const raw =
    `accessKey=${i.accessKey}&amount=${i.amount}&extraData=` +
    `&ipnUrl=${i.ipnUrl}&orderId=${i.orderId}&orderInfo=${i.orderInfo}` +
    `&partnerCode=${i.partnerCode}&redirectUrl=${i.redirectUrl}` +
    `&requestId=${i.requestId}&requestType=captureWallet`;
  return hmac(i.secretKey, raw);
}

export function momoCreateBody(i: MomoCreateInput) {
  return {
    partnerCode: i.partnerCode,
    requestId: i.requestId,
    amount: i.amount,
    orderId: i.orderId,
    orderInfo: i.orderInfo,
    redirectUrl: i.redirectUrl,
    ipnUrl: i.ipnUrl,
    requestType: 'captureWallet',
    extraData: '',
    lang: 'vi',
    signature: momoCreateSignature(i),
  };
}

export interface MomoIpn {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  orderInfo?: string;
  orderType?: string;
  transId?: number | string;
  resultCode?: number;
  message?: string;
  payType?: string;
  responseTime?: number | string;
  extraData?: string;
  signature?: string;
}

export function verifyMomoIpn(
  body: MomoIpn,
  accessKey: string,
  secretKey: string,
): { valid: boolean; success: boolean } {
  const raw =
    `accessKey=${accessKey}&amount=${body.amount}&extraData=${body.extraData ?? ''}` +
    `&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}` +
    `&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}` +
    `&requestId=${body.requestId}&responseTime=${body.responseTime}` +
    `&resultCode=${body.resultCode}&transId=${body.transId}`;
  const expected = Buffer.from(hmac(secretKey, raw));
  const given = Buffer.from(body.signature ?? '');
  const valid =
    given.length === expected.length && timingSafeEqual(given, expected);
  return { valid, success: valid && body.resultCode === 0 };
}
