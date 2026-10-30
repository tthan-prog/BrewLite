# BrewLite Frontend

Frontend dùng Next.js App Router, React và TypeScript. Phần giao diện E phụ trách gồm đăng ký/đăng nhập (Task 7), trang xác nhận và lịch sử đơn hàng (Task 9).

## Chạy trên máy cá nhân

Yêu cầu Node.js theo phiên bản trong file `.nvmrc` ở thư mục gốc dự án.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Mở http://localhost:3000.

Trong `apps/web/.env.local`, cấu hình URL backend mà trình duyệt truy cập được:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Các trang

- `/` — trang chủ giới thiệu BrewLite
- `/login` — đăng nhập, gọi `POST /auth/login`
- `/register` — đăng ký, gọi `POST /auth/register`
- `/orders/confirmation` — xác nhận đơn hàng
- `/orders/history` — lịch sử đơn, gọi `GET /orders/me` kèm Bearer token

## Tích hợp backend

Frontend gọi API NestJS ở `apps/api` qua biến `NEXT_PUBLIC_API_URL` (gắn vào lúc build). Chạy cùng backend để dùng đầy đủ chức năng: đăng nhập bằng JWT, tạo đơn, thanh toán, lịch sử đơn. Hướng dẫn chạy toàn bộ hệ thống nằm ở `README.md` gốc.

Không đưa `.env.local`, token hoặc thông tin bí mật vào Git.
