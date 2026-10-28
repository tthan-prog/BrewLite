import { networkInterfaces } from 'node:os';

type Ifaces = ReturnType<typeof networkInterfaces>;

// Card mạng ảo (Docker, WSL, VPN, VirtualBox...) thường không phải mạng điện thoại nối được.
const VIRTUAL_NAME = /vethernet|wsl|docker|virtualbox|vmware|hyper-v|vpn|tailscale|loopback|bluetooth|pseudo/i;

/** Hạng ưu tiên: 192.168.x.x (Wi-Fi gia đình) > 10.x.x.x > 172.16-31.x.x. 0 = không phải mạng LAN. */
function rank(ip: string): number {
  if (ip.startsWith('192.168.')) return 3;
  if (ip.startsWith('10.')) return 2;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 1;
  return 0;
}

/** Địa chỉ IPv4 mạng nội bộ phù hợp nhất của máy này (null nếu không có). */
export function detectLanIp(ifaces: Ifaces = networkInterfaces()): string | null {
  let best: { ip: string; score: number } | null = null;
  for (const [name, list] of Object.entries(ifaces)) {
    if (VIRTUAL_NAME.test(name)) continue;
    for (const a of list ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const score = rank(a.address);
      if (score > 0 && (!best || score > best.score)) best = { ip: a.address, score };
    }
  }
  return best?.ip ?? null;
}

/** Tên máy có phải localhost / 127.x không. */
export function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '::1' || host === '[::1]' || host.startsWith('127.');
}

/** Origin dạng http://localhost:3000 hoặc http://192.168.x.x:3000 (dùng cho CORS khi phát triển). */
export function isLocalNetworkOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:') return false;
    return isLoopbackHost(u.hostname) || rank(u.hostname) > 0;
  } catch {
    return false;
  }
}
