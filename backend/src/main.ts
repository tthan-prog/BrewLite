import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  // NestJS mặc định chạy cổng 3000, trùng với Next.js nên đặt mặc định là 3001.
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
