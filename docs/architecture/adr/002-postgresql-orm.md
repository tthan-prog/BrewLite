# ADR-002: PostgreSQL và công cụ ORM/migration

- **Trạng thái:** Đã chốt (23/10/2026)
- **Ngày:** 20/10/2026

## Bối cảnh

Đề bắt buộc PostgreSQL. Cần migration và seed tái tạo được database (NFR-10), transaction và cập nhật có điều kiện cho tồn kho (FR-13).

## Quyết định

PostgreSQL 16 và **Prisma 7** (adapter `@prisma/adapter-pg`). Phương án thay thế đã cân nhắc: TypeORM.

## Kiểm chứng

Prisma đã chạy đúng với `apps/api` (NestJS ESM, Vitest): có migration, seed, và 32 test tích hợp đạt trên PostgreSQL thật (23/10/2026). Lưu ý riêng của Prisma 7: tệp cấu hình tên `prisma7.config.ts` nên mọi lệnh Prisma cần thêm `--config prisma7.config.ts`; client sinh vào `apps/api/src/generated/prisma` (không commit, phải `prisma generate` khi build và trong CI).

## Hệ quả

- Schema và migration nằm trong `apps/api`; seed chạy bằng một lệnh.
- Tồn kho dùng truy vấn cập nhật có điều kiện trong transaction (xem ADR-005).
