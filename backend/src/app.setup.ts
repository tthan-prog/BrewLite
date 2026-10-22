import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Cấu hình dùng chung cho main.ts và test e2e (validate DTO, CORS). */
export function configureApp(app: INestApplication) {
  // Bỏ field lạ, từ chối dữ liệu sai kiểu (Task 6).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cho phép frontend gọi API (CORS). Nhiều địa chỉ cách nhau bằng dấu phẩy.
  const origins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });
}
