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

Trong `frontend/.env.local`, cấu hình URL backend mà trình duyệt truy cập được:

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

Các trang và giao diện có thể chạy độc lập. Các chức năng gửi/đọc dữ liệu thật cần backend triển khai đúng API, schema request/response và JWT. Hiện backend scaffold ban đầu chỉ cung cấp `GET /health` và `GET /`; phối hợp với thành viên C để hoàn thiện API nghiệp vụ trước khi nghiệm thu.

Không đưa `.env.local`, token hoặc thông tin bí mật vào Git.
