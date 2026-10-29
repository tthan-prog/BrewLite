# ADR-001: Dùng monorepo `apps/web` + `apps/api`

- **Trạng thái:** Đã chốt
- **Ngày:** 20/10/2026
- **Người quyết định:** Cả nhóm 

## Bối cảnh

Đề Assignment 2 yêu cầu cấu trúc `apps/web`, `apps/api`, `docs`, `tests`, `.github/workflows`. Nhóm 4 người, hạn nộp ngắn, cần chung một lịch sử commit để truy vết.

## Quyết định

Một repository duy nhất; frontend ở `apps/web`, backend ở `apps/api`. Hai gói có `package.json` riêng, không dùng công cụ workspace nặng.

## Hệ quả

- Một pull request có thể sửa cả hai phía và tài liệu liên quan.
- CI chạy hai job (`api`, `web`).
- Docker build dùng đường dẫn `apps/api`, `apps/web`.
- Cấu trúc ban đầu `backend/`, `frontend/` được đổi tên thành `apps/api`, `apps/web` cho khớp đề (script `ap-dung-cau-truc-moi.ps1`).

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Hai repository riêng | Khó truy vết, hai lịch sử, đề yêu cầu một cấu trúc chung |
| Workspace (npm/pnpm/Turborepo) | Thêm độ phức tạp không cần cho quy mô này |
