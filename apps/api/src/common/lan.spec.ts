import { detectLanIp, isLocalNetworkOrigin } from './lan.js';
import { paymentConfig, resolveWebUrl } from '../payments/gateways/config.js';

const nic = (address: string, internal = false) => [
  { address, family: 'IPv4', internal } as never,
];

describe('detectLanIp', () => {
  it('chọn IP Wi-Fi 192.168.x.x, bỏ card ảo và loopback', () => {
    const ip = detectLanIp({
      Loopback: nic('127.0.0.1', true),
      'vEthernet (WSL)': nic('172.20.0.1'),
      'Ethernet VirtualBox': nic('192.168.56.1'),
      'Wi-Fi': nic('192.168.1.23'),
    });
    expect(ip).toBe('192.168.1.23');
  });

  it('ưu tiên 192.168 hơn 10.x và nhận 10.x khi chỉ có nó', () => {
    expect(detectLanIp({ a: nic('10.151.131.186'), b: nic('192.168.0.5') })).toBe('192.168.0.5');
    expect(detectLanIp({ 'Wi-Fi': nic('10.151.131.186') })).toBe('10.151.131.186');
  });

  it('trả null khi không có mạng nội bộ', () => {
    expect(detectLanIp({ Loopback: nic('127.0.0.1', true), x: nic('8.8.8.8') })).toBeNull();
    expect(detectLanIp({})).toBeNull();
  });
});

describe('resolveWebUrl', () => {
  it('thay localhost bằng IP LAN, giữ cổng', () => {
    expect(resolveWebUrl('', '192.168.1.23')).toBe('http://192.168.1.23:3000');
    expect(resolveWebUrl('http://localhost:3000', '192.168.1.23')).toBe('http://192.168.1.23:3000');
  });
  it('giữ nguyên địa chỉ công khai hoặc IP đã đặt tay', () => {
    expect(resolveWebUrl('https://brewlite-web.onrender.com', '192.168.1.23')).toBe('https://brewlite-web.onrender.com');
    expect(resolveWebUrl('http://10.0.0.9:3000', '192.168.1.23')).toBe('http://10.0.0.9:3000');
  });
  it('không có IP LAN thì dùng mặc định', () => {
    expect(resolveWebUrl('', null)).toBe('http://localhost:3000');
  });
  it('paymentConfig dùng IP truyền vào khi PUBLIC_WEB_URL là localhost', () => {
    const c = paymentConfig({ PUBLIC_WEB_URL: 'http://localhost:3000' } as NodeJS.ProcessEnv, '192.168.1.23');
    expect(c.webUrl).toBe('http://192.168.1.23:3000');
  });
});

describe('isLocalNetworkOrigin', () => {
  it('nhận localhost và IP LAN, từ chối site công khai và https', () => {
    expect(isLocalNetworkOrigin('http://localhost:3000')).toBe(true);
    expect(isLocalNetworkOrigin('http://192.168.1.23:3000')).toBe(true);
    expect(isLocalNetworkOrigin('http://10.151.131.186:3000')).toBe(true);
    expect(isLocalNetworkOrigin('https://evil.example')).toBe(false);
    expect(isLocalNetworkOrigin('http://evil.example')).toBe(false);
    expect(isLocalNetworkOrigin('http://8.8.8.8:3000')).toBe(false);
    expect(isLocalNetworkOrigin('not a url')).toBe(false);
  });
});
