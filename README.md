# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt. Khách xem menu, chọn size và topping, thêm vào giỏ, đăng nhập, thanh toán (giả lập) và theo dõi đơn hàng.

Đây là bài tập lớn môn **Công nghệ Phần mềm** (Trường Đại học Sài Gòn, Khoa Công nghệ Thông tin, học kỳ I năm học 2026–2027), thực hiện theo quy trình **Agile Scrum**.

> **Trạng thái hiện tại:** mới xong **Task 1** (khung dự án). Backend và frontend chạy được "Hello BrewLite". Các tính năng khác (menu, giỏ hàng, đăng nhập, thanh toán...) chưa làm; xem bảng ở [Mục 8](#8-api-và-tiến-độ-task).
>
> Các mục gắn nhãn `[Chưa kiểm chứng]` là phần chưa chạy thử thực tế. Nhóm cần kiểm tra trước khi nộp.

---

## Mục lục

1. [Giới thiệu và phạm vi](#1-giới-thiệu-và-phạm-vi)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Môi trường phát triển](#3-môi-trường-phát-triển)
4. [Công cụ làm việc và triển khai](#4-công-cụ-làm-việc-và-triển-khai)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Cài đặt và chạy](#6-cài-đặt-và-chạy)
7. [Biến môi trường](#7-biến-môi-trường)
8. [API và tiến độ task](#8-api-và-tiến-độ-task)
9. [Trạng thái đơn hàng](#9-trạng-thái-đơn-hàng)
10. [Kiểm thử và chất lượng code](#10-kiểm-thử-và-chất-lượng-code)
11. [Quy ước làm việc nhóm](#11-quy-ước-làm-việc-nhóm)
12. [Tài liệu Scrum và báo cáo](#12-tài-liệu-scrum-và-báo-cáo)
13. [Xử lý sự cố thường gặp](#13-xử-lý-sự-cố-thường-gặp)
14. [Thành viên nhóm](#14-thành-viên-nhóm)

---

## 1. Giới thiệu và phạm vi

**Product Vision:** BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.

**Luồng chính (MVP):**

```
Xem menu → Chọn sản phẩm (size, topping) → Thêm vào giỏ → Xem giỏ và tổng tiền
        → Đăng nhập (nếu chưa) → Thanh toán không tiền mặt → Xác nhận đơn (mã đơn)
```

**Trong phạm vi:** menu, chi tiết sản phẩm (size, topping), giỏ hàng, đăng ký/đăng nhập (JWT), tạo đơn, thanh toán giả lập (Ví hoặc Thẻ), xác nhận đơn và lịch sử đơn; nghiệp vụ backend nâng cao (Task 10): máy trạng thái đơn hàng, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi và điểm thưởng.

**Ngoài phạm vi:** giao diện cho nhân viên pha chế (barista), cổng thanh toán thật, quản lý kho nguyên liệu, quên mật khẩu, hồ sơ cá nhân.

---

## 2. Công nghệ sử dụng

Bảng dưới ghi đúng những gì **đã có trong khung dự án** (lấy từ `package.json` do công cụ sinh ra) và những gì **dự kiến thêm** ở các task sau.

| Lớp | Công nghệ | Trạng thái |
|---|---|---|
| Frontend | Next.js 16.4, React 19.3, TypeScript, TailwindCSS 4 | Đã có |
| Backend | NestJS 12, TypeScript, REST API | Đã có |
| Kiểm thử backend | Vitest, Supertest | Đã có (không phải Jest) |
| Kiểm tra code | oxlint + Prettier (backend), ESLint (frontend) | Đã có |
| Đóng gói | Docker, Docker Compose | Đã viết file, `[Chưa kiểm chứng]` build image |
| CSDL | PostgreSQL (chạy bằng Docker) | Có trong compose, backend chưa dùng |
| ORM | Prisma (hoặc TypeORM) | Dự kiến, nhóm chọn ở Task 2 |
| Xác thực | JWT (Passport), bcrypt | Dự kiến, Task 7 |
| Validate dữ liệu | class-validator, class-transformer | Dự kiến, Task 6 |
| State giỏ hàng | Zustand (hoặc React Context) | Dự kiến, Task 5 |
| Thanh toán | Mock Payment Service | Dự kiến, Task 8 |

---

## 3. Môi trường phát triển

### 3.1. Yêu cầu phần mềm

| Công cụ | Yêu cầu | Dùng để |
|---|---|---|
| **Node.js** | **24.15 trở lên** (khuyến nghị, ghi trong `.nvmrc`), hoặc 22.22.3 trở lên | Chạy backend và frontend |
| npm | Đi kèm Node.js; cả nhóm dùng **npm** (không trộn pnpm/yarn) | Cài thư viện |
| Git | Bản mới | Quản lý mã nguồn |
| Docker Desktop (hoặc Docker Engine + Compose) | Có lệnh `docker compose` | Chạy PostgreSQL và toàn bộ hệ thống |
| Trình duyệt | Chrome hoặc Edge bản mới | Chạy và kiểm thử giao diện |
| Hệ điều hành | Windows 10/11, macOS hoặc Linux | |

**Vì sao Node.js 24.15+ (hoặc 22.22.3+):** một số gói của công cụ NestJS CLI khai báo yêu cầu `node: ^22.22.3 || ^24.15.0 || >=26.0.0`. Node 22.22.0 vẫn cài và chạy được trong lúc thử, nhưng npm in cảnh báo `EBADENGINE`. Dùng `nvm use` (đọc `.nvmrc`) để thống nhất cả nhóm.

> Trên Windows, nên bật **WSL 2** để Docker chạy ổn định.

### 3.2. Công cụ nên có

| Công cụ | Mục đích |
|---|---|
| Visual Studio Code | Trình soạn thảo. Gợi ý tiện ích có trong `.vscode/extensions.json` (Prettier, ESLint, oxc, Tailwind, Docker, Prisma) |
| Postman hoặc Swagger UI | Gọi thử API |
| DBeaver hoặc pgAdmin | Xem dữ liệu PostgreSQL |

### 3.3. Cổng (port) mặc định

| Dịch vụ | Cổng |
|---|---|
| Frontend (Next.js) | 3000 |
| Backend (NestJS) | 3001 (mặc định của NestJS là 3000, đã đổi để không trùng) |
| PostgreSQL | 5432 |

---

## 4. Công cụ làm việc và triển khai

| Nhóm | Công cụ | Cách dùng trong dự án |
|---|---|---|
| Mã nguồn | Git + GitHub | Mỗi chức năng một branch, gộp qua pull request, không push thẳng lên `main` |
| Theo dõi việc | GitHub Projects (hoặc Trello) | Product Backlog và Sprint Backlog |
| Liên lạc | Nhóm chat | Trao đổi hằng ngày, đăng biên bản họp |
| Tài liệu chung | Google Drive | Báo cáo, slide, bản nháp |
| Vẽ sơ đồ | draw.io, StarUML hoặc PlantUML | Use case, ERD, state machine |
| Đóng gói và chạy | Docker Compose | `docker compose up --build` chạy cả 3 dịch vụ |
| Kiểm thử | Vitest, Supertest | Test Task 10 và các logic quan trọng |
| Chất lượng code | oxlint, ESLint, Prettier | Thống nhất kiểu code |
| CI (tùy chọn) | GitHub Actions | Chạy build và test mỗi pull request `[Tùy chọn, nếu còn thời gian]` |

**Triển khai:** phạm vi bài tập là **chạy được bằng docker-compose** trên máy nhóm hoặc máy giảng viên để demo. Đưa lên máy chủ công khai là việc ngoài yêu cầu của đề.

---

## 5. Cấu trúc thư mục

```
brewlite/
├── backend/                 # NestJS
│   ├── src/                 # mã nguồn (hiện: app.controller, app.service, main)
│   ├── test/                # kiểm thử e2e (Vitest + Supertest)
│   ├── .env.example
│   ├── .npmrc               # legacy-peer-deps=true (xem Mục 13)
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js (App Router, thư mục src/)
│   ├── src/app/             # trang và layout
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── team-agreement.md    # thỏa thuận nhóm
│   ├── message-to-lecturer.md   # bản nháp tin nhắn hỏi giảng viên
│   ├── scrum/               # Product Backlog, Sprint Backlog, Burndown, biên bản họp
│   ├── design/              # ERD, state machine, use case, wireframe (sẽ bổ sung)
│   └── report/              # báo cáo và slide (sẽ bổ sung)
├── docker-compose.yml
├── .env.example             # biến cho docker-compose
├── .nvmrc
├── .gitignore
└── README.md
```

---

## 6. Cài đặt và chạy

### 6.1. Lấy mã nguồn

```bash
git clone <địa-chỉ-repo-GitHub-của-nhóm>
cd brewlite
nvm use            # (nếu dùng nvm) chọn đúng phiên bản Node trong .nvmrc
```

### 6.2. Cách 1 – Chạy toàn bộ bằng Docker Compose

`[Chưa kiểm chứng]` (file đã viết và kiểm tra cú pháp, chưa build image thật)

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
docker compose up --build
```

Sau khi chạy xong:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (thử `http://localhost:3001/health`)
- PostgreSQL: `localhost:5432`

Dừng hệ thống:

```bash
docker compose down           # giữ lại dữ liệu
docker compose down -v        # xóa cả dữ liệu CSDL
```

### 6.3. Cách 2 – Chạy từng phần để phát triển

Đã chạy thử các bước này.

**Backend** (terminal 1):

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Kiểm tra: http://localhost:3001/ trả `Hello BrewLite!`; http://localhost:3001/health trả `{"status":"ok","service":"brewlite-backend"}`.

**Frontend** (terminal 2):

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Mở http://localhost:3000. Trang hiển thị "Hello BrewLite!" và trạng thái kết nối backend.

> Khi có PostgreSQL (từ Task 2): chạy `docker compose up -d db` rồi cấu hình `DATABASE_URL` trong `backend/.env`.

---

## 7. Biến môi trường

Không đưa file `.env` hoặc `.env.local` lên Git. Chỉ đưa các file `.env.example`.

### 7.1. `.env.example` (thư mục gốc, cho docker-compose)

```env
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=change_me
POSTGRES_DB=brewlite
JWT_SECRET=change_me_to_a_long_random_string
```

### 7.2. `backend/.env.example`

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://brewlite:change_me@localhost:5432/brewlite
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1d
```

### 7.3. `frontend/.env.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 7.4. Giải thích

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng backend (mặc định 3001) |
| `FRONTEND_ORIGIN` | Địa chỉ frontend được phép gọi API (CORS); nhiều địa chỉ cách nhau bằng dấu phẩy |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL. Trong Docker Compose, host là `db` (tên dịch vụ), không phải `localhost`. Chưa dùng ở khung dự án |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Khóa ký và thời hạn JWT. Phải đổi khỏi giá trị mẫu. Chưa dùng ở khung dự án |
| `NEXT_PUBLIC_API_URL` | Địa chỉ backend mà **trình duyệt** gọi tới. Biến `NEXT_PUBLIC_*` được gắn lúc **build**, nên đổi giá trị phải build lại |

---

## 8. API và tiến độ task

### 8.1. API

| Method | Endpoint | Chức năng | Task | Trạng thái |
|---|---|---|---|---|
| GET | `/` | "Hello BrewLite!" | 1 | Xong |
| GET | `/health` | Kiểm tra backend sống | 1 | Xong |
| GET | `/products` | Danh sách sản phẩm (menu) | 2 | Chưa làm |
| GET | `/products/:id` | Chi tiết sản phẩm | 2 | Chưa làm |
| POST | `/auth/register` | Đăng ký | 7 | Chưa làm |
| POST | `/auth/login` | Đăng nhập, trả JWT | 7 | Chưa làm |
| POST | `/orders` | Tạo đơn (PENDING) | 6 | Chưa làm |
| POST | `/payments` | Thanh toán (idempotent, header `Idempotency-Key`) | 8, 10 | Chưa làm |
| GET | `/orders/me` | Lịch sử đơn của người dùng | 9 | Chưa làm |
| PATCH | `/orders/:id/status` | Cập nhật trạng thái đơn, chỉ role STAFF (để demo và test) | 10 | Chưa làm |

> `GET /health` và `PATCH /orders/:id/status` là bổ sung của nhóm (đề không nêu).

### 8.2. Tiến độ 10 task

| # | Task | Trạng thái |
|---|---|---|
| 1 | Khởi tạo dự án và cấu trúc | Xong (đã build, test, chạy thử) |
| 2 | API danh sách sản phẩm | Chưa làm |
| 3 | Trang Menu | Chưa làm |
| 4 | Chi tiết và tùy chọn sản phẩm | Chưa làm |
| 5 | Giỏ hàng | Chưa làm |
| 6 | API tạo đơn hàng | Chưa làm |
| 7 | Đăng ký / đăng nhập (JWT) | Chưa làm |
| 8 | Thanh toán không tiền mặt | Chưa làm |
| 9 | Xác nhận, lịch sử đơn và bàn giao | Chưa làm |
| 10 | Nghiệp vụ backend nâng cao | Chưa làm |

Cập nhật bảng này khi hoàn thành từng task (một phần của Definition of Done).

---

## 9. Trạng thái đơn hàng

Luồng thành công: `PENDING → PAID → PREPARING → READY → COMPLETED`.

| Từ | Sang |
|---|---|
| PENDING | PAID, PAYMENT_FAILED, CANCELLED |
| PAYMENT_FAILED | PENDING (thử lại), CANCELLED |
| PAID | PREPARING, CANCELLED |
| PREPARING | READY |
| READY | COMPLETED |
| COMPLETED, CANCELLED | (kết thúc) |

Mọi chuyển tiếp khác bị chặn. `[Cần đối chiếu với hình sơ đồ gốc trong file đề]`

---

## 10. Kiểm thử và chất lượng code

**Backend** (chạy trong thư mục `backend/`):

```bash
npm test              # unit test (Vitest)
npm run test:e2e      # kiểm thử e2e (Vitest + Supertest)
npm run lint          # oxlint
npm run format        # Prettier
npm run build         # biên dịch
```

**Frontend** (chạy trong thư mục `frontend/`):

```bash
npm run lint          # ESLint
npm run build         # build production
```

Hiện có: 2 unit test và 2 e2e test cho `/` và `/health`.

**Bắt buộc theo đề (Task 10):** test chứng minh (a) chặn được chuyển trạng thái sai; (b) gửi 2 lần cùng `Idempotency-Key` chỉ tạo 1 đơn; (c) đặt đồng thời không vượt tồn kho.

---

## 11. Quy ước làm việc nhóm

**Nhánh:** `main` luôn chạy được, không push trực tiếp. Mỗi chức năng một nhánh `feature/task-<số>-<mô-tả-ngắn>` (ví dụ `feature/task-5-cart`); sửa lỗi dùng `fix/<mô-tả-ngắn>`.

**Commit:** thông điệp ngắn, rõ, mỗi commit một việc. Ví dụ: `feat(cart): thêm xóa sản phẩm khỏi giỏ`, `fix(orders): chặn chuyển trạng thái sai`.

**Pull request:** mô tả task nào, đã làm gì, cách kiểm tra; có ít nhất **một người khác** xem trước khi gộp; chỉ gộp khi build không lỗi.

**Definition of Done** (task được tính điểm khi):

- Code chạy được, không lỗi build, đúng tiêu chí chấp nhận.
- Có commit rõ ràng và được review trong nhóm.
- API có validate đầu vào; giao diện xử lý trạng thái loading và lỗi cơ bản.
- Có hướng dẫn chạy trong README.
- Được một thành viên khác nghiệm thu.

---

## 12. Tài liệu Scrum và báo cáo

Bằng chứng Scrum lưu trong `docs/scrum/`: Product Backlog, Sprint Backlog, Burndown (cập nhật mỗi ngày), biên bản Sprint Planning, Review, Retrospective. Thỏa thuận nhóm ở `docs/team-agreement.md`. Thiết kế ở `docs/design/`; báo cáo và slide ở `docs/report/`.

---

## 13. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `npm install` ở backend báo `Cannot read properties of null (reading 'edgesOut')` | Lỗi của npm 10.x khi xử lý peer dependency (gặp với npm 10.9.4) | Backend đã có `.npmrc` với `legacy-peer-deps=true`; dùng đúng file này. Nếu vẫn lỗi, cập nhật npm theo Node bản mới |
| Cảnh báo `EBADENGINE` khi cài | Node thấp hơn yêu cầu của một số gói | Dùng Node 24.15+ (`nvm use`) |
| Frontend báo "Không kết nối được" | Backend chưa chạy hoặc sai `NEXT_PUBLIC_API_URL` | Chạy backend; kiểm tra http://localhost:3001/health |
| Lỗi CORS trên trình duyệt | `FRONTEND_ORIGIN` không khớp địa chỉ frontend | Sửa `FRONTEND_ORIGIN` trong `backend/.env` |
| Cổng bị chiếm (EADDRINUSE) | Tiến trình cũ vẫn chạy ở 3000 hoặc 3001 | Tắt tiến trình đó hoặc đổi cổng |
| Đổi `NEXT_PUBLIC_API_URL` nhưng không có tác dụng | Biến được gắn lúc build | Build lại (`npm run build` hoặc `docker compose up --build`) |
| Docker chạy chậm hoặc lỗi trên Windows | Chưa bật WSL 2 | Bật WSL 2 trong Docker Desktop |

---

## 14. Thành viên nhóm

| Ký hiệu | Họ tên | MSSV | Vai trò |
|---|---|---|---|
| A | | | Scrum Master + Dev nền tảng |
| B | | | Dev backend (dữ liệu, nghiệp vụ lõi) |
| C | | | Dev backend (xác thực, thanh toán, state machine) |
| D | | | Dev frontend, slide |
| E | | | Dev frontend, kiểm thử, PO tạm |

**Giảng viên hướng dẫn:** …………………………………………

---

*README phiên bản 1.1 (sau Task 1). Cập nhật sau mỗi Sprint khi có thay đổi về cài đặt hoặc cách chạy.*
