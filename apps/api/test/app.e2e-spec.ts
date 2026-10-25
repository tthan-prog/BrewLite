import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await createApp());
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello BrewLite!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'brewlite-backend' });
  });
});
