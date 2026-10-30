import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers.js';

describe('CORS (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    ({ app } = await createApp());
  });
  afterAll(async () => {
    await app.close();
  });

  const allowOrigin = async (origin: string) => {
    const res = await request(app.getHttpServer()).get('/health').set('Origin', origin).expect(200);
    return res.headers['access-control-allow-origin'];
  };

  it('cho phép web mở từ localhost và IP mạng nội bộ (điện thoại cùng Wi-Fi)', async () => {
    expect(await allowOrigin('http://localhost:3000')).toBe('http://localhost:3000');
    expect(await allowOrigin('http://192.168.1.23:3000')).toBe('http://192.168.1.23:3000');
  });

  it('không cấp quyền cho trang web công khai lạ', async () => {
    expect(await allowOrigin('https://evil.example')).toBeUndefined();
  });
});
