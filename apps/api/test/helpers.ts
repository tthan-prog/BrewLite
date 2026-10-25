import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export async function createApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export async function registerUser(app: INestApplication, email: string) {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password: 'secret123' })
    .expect(201);
  return res.body as { accessToken: string; user: { id: number } };
}

export async function loginStaff(app: INestApplication) {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'staff@brewlite.com', password: 'password123' })
    .expect(200);
  return res.body as { accessToken: string; user: { id: number } };
}
