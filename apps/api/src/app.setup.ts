import { INestApplication, ValidationPipe } from '@nestjs/common';
import { isLocalNetworkOrigin } from './common/lan.js';

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
  // Khi không chạy production, cho phép thêm web mở từ localhost / IP mạng nội bộ
  // (vd điện thoại mở http://192.168.x.x:3000) mà không cần liệt kê từng IP.
  const allowLan = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const ok =
        !origin || origins.includes(origin) || (allowLan && isLocalNetworkOrigin(origin));
      callback(null, ok);
    },
  });
}
