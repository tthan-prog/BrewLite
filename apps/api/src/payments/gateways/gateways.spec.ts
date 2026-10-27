import { createHmac } from 'node:crypto';
import { buildVnpayUrl, verifyVnpay, vnpayDate, vnpaySign } from './vnpay.js';
import { momoCreateBody, momoCreateSignature, verifyMomoIpn } from './momo.js';
import { paymentConfig } from './config.js';

describe('VNPay', () => {
  const secret = 'unit-test-secret';

  it('vnpayDate dùng giờ GMT+7', () => {
    expect(vnpayDate(new Date('2026-10-27T00:00:00Z'))).toBe('20261027070000');
  });

  it('ký: khóa sắp xếp, khoảng trắng thành +, bỏ vnp_SecureHash', () => {
    const { query, hash } = vnpaySign(
      { vnp_B: 'a b', vnp_A: '1', vnp_SecureHash: 'x' },
      secret,
    );
    expect(query).toBe('vnp_A=1&vnp_B=a+b');
    expect(hash).toBe(createHmac('sha512', secret).update(query).digest('hex'));
  });

  it('URL tạo ra tự xác thực được; sửa số tiền thì chữ ký sai', () => {
    const url = buildVnpayUrl({
      baseUrl: 'https://sandbox.example/pay',
      tmnCode: 'T1',
      secret,
      txnRef: 'abc',
      amountVnd: 50000,
      returnUrl: 'http://x/return',
      ip: '1.2.3.4',
      now: new Date('2026-10-27T00:00:00Z'),
      expiresAt: new Date('2026-10-27T00:10:00Z'),
    });
    const q = Object.fromEntries(new URL(url).searchParams) as Record<
      string,
      string
    >;
    expect(q.vnp_Amount).toBe('5000000');
    expect(verifyVnpay({ ...q, vnp_ResponseCode: '00' }, secret).valid).toBe(
      false,
    ); // thêm field => khác chữ ký
    expect(verifyVnpay(q, secret).valid).toBe(true);
    expect(verifyVnpay({ ...q, vnp_Amount: '1' }, secret).valid).toBe(false);
  });
});

describe('MoMo', () => {
  const base = {
    partnerCode: 'P',
    accessKey: 'AK',
    secretKey: 'SK',
    requestId: 'r1',
    orderId: 'o1',
    amount: 50000,
    orderInfo: 'info',
    redirectUrl: 'http://r',
    ipnUrl: 'http://i',
  };

  it('chữ ký tạo giao dịch = HMAC-SHA256 của chuỗi khóa theo thứ tự chữ cái', () => {
    const raw =
      'accessKey=AK&amount=50000&extraData=&ipnUrl=http://i&orderId=o1&orderInfo=info&partnerCode=P&redirectUrl=http://r&requestId=r1&requestType=captureWallet';
    expect(momoCreateSignature(base)).toBe(
      createHmac('sha256', 'SK').update(raw).digest('hex'),
    );
    expect(momoCreateBody(base).signature).toBe(momoCreateSignature(base));
  });

  it('IPN: chữ ký đúng + resultCode 0 là thành công; giả mạo bị từ chối', () => {
    const body = {
      partnerCode: 'P',
      orderId: 'o1',
      requestId: 'r1',
      amount: 50000,
      orderInfo: 'info',
      orderType: 'momo_wallet',
      transId: 99,
      resultCode: 0,
      message: 'Successful.',
      payType: 'qr',
      responseTime: 1700000000000,
      extraData: '',
    };
    const raw = `accessKey=AK&amount=50000&extraData=&message=Successful.&orderId=o1&orderInfo=info&orderType=momo_wallet&partnerCode=P&payType=qr&requestId=r1&responseTime=1700000000000&resultCode=0&transId=99`;
    const signature = createHmac('sha256', 'SK').update(raw).digest('hex');
    expect(verifyMomoIpn({ ...body, signature }, 'AK', 'SK')).toEqual({
      valid: true,
      success: true,
    });
    expect(
      verifyMomoIpn({ ...body, amount: 1, signature }, 'AK', 'SK').valid,
    ).toBe(false);
    expect(verifyMomoIpn({ ...body, signature: 'bad' }, 'AK', 'SK').valid).toBe(
      false,
    );
  });
});

describe('paymentConfig', () => {
  it('có giá trị mặc định cho local và bỏ dấu / cuối', () => {
    const c = paymentConfig({
      PUBLIC_WEB_URL: 'https://w.example/',
    } as NodeJS.ProcessEnv);
    expect(c.webUrl).toBe('https://w.example');
    expect(c.apiUrl).toBe('http://localhost:3001');
    expect(c.ttlMinutes).toBe(10);
  });
});
