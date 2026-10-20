import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cho phép frontend gọi API (CORS). Có thể khai báo nhiều địa chỉ, cách nhau bằng dấu phẩy.
  const origins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  // NestJS mặc định chạy cổng 3000, trùng với Next.js nên đặt mặc định là 3001.
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
