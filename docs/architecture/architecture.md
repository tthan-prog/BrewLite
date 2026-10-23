# Kiến trúc hệ thống (Assignment 2 – Task 3.1)

> **Cập nhật 23/10/2026.** Cột "Hiện trạng" phản ánh mã nguồn thật trên nhánh `main`. Cập nhật khi quyết định thay đổi và ghi lý do trong pull request.

## 1. Phương pháp trình bày

Kiến trúc phân lớp kết hợp mức container của mô hình C4: người dùng (trình duyệt/PWA) → frontend Next.js → backend NestJS (module theo domain) → PostgreSQL, cùng một dịch vụ thanh toán mô phỏng nằm trong backend. Mỗi quyết định lớn có một ADR ở `docs/architecture/adr/`.

## 2. Các thành phần (container)

| Thành phần | Công nghệ | Trách nhiệm | Mã nguồn | Hiện trạng |
|---|---|---|---|---|
| Web (frontend) | Next.js (App Router), mobile-first/PWA | Giao diện: menu, chi tiết, giỏ hàng, thanh toán, đơn | `apps/web` | Có: menu, chi tiết, giỏ hàng, đăng nhập/đăng ký, xác nhận đơn, lịch sử đơn |
| API (backend) | NestJS, JWT, validation | Nghiệp vụ, xác thực, phân quyền, truy cập DB | `apps/api` | Có: auth, products, orders, payments, `/health` |
| Cơ sở dữ liệu | PostgreSQL 16 + migration | Lưu người dùng, sản phẩm, đơn, thanh toán, giao dịch điểm | `docker-compose.yml` (db), thư mục migration trong `apps/api` | Có schema Prisma và migration; seed 12 sản phẩm, 4 topping |
| Payment Service (mô phỏng) | Module trong NestJS | Giả lập Ví/Thẻ thành công hoặc thất bại | `apps/api/src/payments` | Có (Ví/Thẻ, giả lập lỗi bằng `simulate`) |
| CI/CD | GitHub Actions + GHCR | Lint, test, build, đóng gói image, deploy, smoke test | `.github/workflows` | Có `ci.yml` và `cd.yml`; chưa chạy thật trên GitHub |

## 3. Cấu trúc module backend

| Module | Trách nhiệm |
|---|---|
| `auth` | Đăng ký, đăng nhập, JWT, guard theo vai trò |
| `products` | `GET /products`, `GET /products/:id`, tồn kho |
| `orders` | Tạo đơn trong transaction, máy trạng thái, lịch sử đơn |
| `payments` | Thanh toán mô phỏng, Idempotency-Key |
| `prisma` | `PrismaService` truy cập PostgreSQL (adapter pg) |
| (trong `orders`) | Khuyến mãi (`promoCode`) và điểm thưởng (`User.points` và lịch sử `LoyaltyTransaction`) nằm trong dịch vụ đơn hàng |
| `app.controller` | `GET /` và `GET /health` |

## 4. Cross-cutting

| Vấn đề | Cách xử lý |
|---|---|
| Cấu hình | Biến môi trường; `.env.example` mẫu; secret của production nằm trong secret của CI/nền tảng |
| Logging | Log có cấu trúc ở mức NestJS; không ghi mật khẩu, token, secret |
| Health check | `GET /health`; dùng cho Docker healthcheck và smoke test sau deploy |
| Migration | Công cụ của ORM; chạy trước khi khởi động API ở production, theo cách an toàn (xem `deployment.md`) |
| Bảo mật | bcrypt, JWT có hạn, validate đầu vào, CORS theo `FRONTEND_ORIGIN` |

## 5. Lý do chọn, ưu điểm, hạn chế

| Lựa chọn | Ưu điểm | Hạn chế và trade-off |
|---|---|---|
| Monorepo `apps/web` + `apps/api` | Một repo, một PR có thể đổi cả hai; dễ dùng chung CI | Hai bộ `package.json` riêng, CI phải chạy cho cả hai |
| Backend dạng modular monolith | Đơn giản để triển khai và kiểm thử trong 1 tuần | Khó tách dịch vụ sau này nếu hệ thống lớn |
| Payment Service là module mô phỏng trong API | Không cần cổng thật; dựng được kịch bản thành công/thất bại | Không phản ánh độ trễ và lỗi mạng của dịch vụ ngoài |
| PostgreSQL | Transaction và khóa dòng, phù hợp kiểm soát tồn kho đồng thời | Cần quản lý migration và sao lưu |

## 6. Truy vết sang deployment diagram

Mỗi container trong `deployment-diagram.puml` phải khớp một dòng ở bảng mục 2 và có thư mục mã nguồn tương ứng. Khi thêm hoặc bỏ container, cập nhật cả hai.

## 7. Danh sách ADR

| ADR | Quyết định | Trạng thái |
|---|---|---|
| 001 | Monorepo `apps/web` + `apps/api` | Đã chốt |
| 002 | PostgreSQL và Prisma | Đã chốt |
| 003 | JWT và phân quyền theo vai trò | Đã chốt |
| 004 | Thanh toán mô phỏng và Idempotency-Key | Đã chốt |
| 005 | Kiểm soát tồn kho bằng cập nhật có điều kiện trong transaction | Đã chốt |
| 006 | CI/CD bằng GitHub Actions và registry GHCR | Đã chốt (chờ chạy thật) |
| 007 | Nền tảng triển khai production: Render | Đã chọn mặc định, chờ A xác nhận |
