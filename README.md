# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt. Khách xem menu, chọn size và topping, thêm vào giỏ, đăng nhập, thanh toán (giả lập) và theo dõi đơn hàng.

Đây là bài tập lớn môn **Công nghệ Phần mềm** (Trường Đại học Sài Gòn, Khoa Công nghệ Thông tin, học kỳ I năm học 2026–2027), thực hiện theo quy trình **Agile Scrum**.

> **Trạng thái hiện tại (23/10/2026):** đã **hoàn thành code cả 10 task** của Assignment 1, chạy đầu-cuối bằng Docker Compose; 22 unit test và 32 test tích hợp đạt. **Chưa có nghiệm thu chéo** (B–E nghiệm thu task của người khác), nên chưa tính điểm Definition of Done. Chi tiết ở [Mục 8](#8-api-và-tiến-độ-task).

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

Bảng dưới ghi các công nghệ **đã dùng** trong dự án (theo `package.json`).

| Lớp | Công nghệ | Trạng thái |
|---|---|---|
| Frontend | Next.js 16.4, React 19.3, TypeScript, TailwindCSS 4 | Đã có |
| Backend | NestJS 12, TypeScript, REST API | Đã có |
| Kiểm thử backend | Vitest, Supertest | Đã có (không phải Jest) |
| Kiểm tra code | oxlint + Prettier (backend), ESLint (frontend) | Đã có |
| Đóng gói | Docker, Docker Compose | Đã có, đã chạy thử trên Windows |
| CSDL | PostgreSQL 16 (chạy bằng Docker) | Đã có, backend đã dùng |
| ORM | Prisma 7 (adapter pg) | Đã có (Task 2) |
| Xác thực | JWT (`@nestjs/jwt`), bcryptjs | Đã có (Task 7) |
| Validate dữ liệu | class-validator, class-transformer | Đã có (Task 6) |
| State giỏ hàng | React state trong trang menu | Đã có (Task 5) |
| Thanh toán | Mock Payment Service (`/payments`) | Đã có (Task 8) |

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
│   ├── src/                 # mã nguồn: auth, products, orders, payments, prisma
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

`[Đã chạy thử]` trên Windows (Docker Desktop + WSL 2): build thành công, 2 migration tự áp dụng, backend và frontend khởi động, seed chạy được.

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
docker compose up --build
```

Khi backend khởi động, container tự chạy `prisma migrate deploy` (tạo bảng). Dữ liệu mẫu **không** tự nạp. Mở terminal thứ hai và nạp **một lần**:

```bash
docker compose exec backend npx prisma db seed --config prisma7.config.ts
```

> Cảnh báo: `prisma/seed.ts` bắt đầu bằng `deleteMany()` trên mọi bảng. Chạy lại seed sẽ **xóa sạch** dữ liệu hiện có (kể cả đơn hàng). Chỉ chạy khi cần đặt lại về dữ liệu gốc.

Dữ liệu mẫu: 2 tài khoản (`customer@brewlite.com` và `staff@brewlite.com`; mật khẩu mẫu `password123`, đã băm bcrypt, chỉ dùng để phát triển), 12 sản phẩm và 4 topping khớp với giao diện, 2 mã khuyến mãi (`WELCOME10` giảm 10% cho đơn từ 50.000đ, `SAVE20K` giảm 20.000đ cho đơn từ 100.000đ).

> Nếu bạn đã chạy bản cũ: sau khi `docker compose up --build` (tự áp dụng migration mới), hãy chạy lại seed một lần để có sản phẩm và tài khoản mới.

Sau khi chạy xong:

- Frontend: http://localhost:3000 (thực đơn ở `/menu`)
- Backend: http://localhost:3001 (thử `http://localhost:3001/health`)
- PostgreSQL: `localhost:5432`

Dừng hệ thống:

```bash
docker compose down           # giữ lại dữ liệu
docker compose down -v        # xóa cả dữ liệu CSDL
```

Prisma 7: client được sinh vào `backend/src/generated/prisma` (thư mục này nằm trong `.gitignore`); `backend/Dockerfile` tự chạy `prisma generate` khi build. Tệp cấu hình Prisma tên `prisma7.config.ts` nên mọi lệnh Prisma cần thêm `--config prisma7.config.ts`.

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

> Backend đã dùng PostgreSQL (Prisma). Trước khi `npm run start:dev`: chạy `docker compose up -d db`, đặt `DATABASE_URL` trong `backend/.env` (trỏ `localhost:5432`), rồi trong `backend` chạy lần lượt `npx prisma generate --config prisma7.config.ts`, `npx prisma migrate deploy --config prisma7.config.ts` và (một lần) `npx prisma db seed --config prisma7.config.ts`.

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
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL. Trong Docker Compose, host là `db` (tên dịch vụ), không phải `localhost`. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Khóa ký và thời hạn JWT. Phải đổi khỏi giá trị mẫu. |
| `NEXT_PUBLIC_API_URL` | Địa chỉ backend mà **trình duyệt** gọi tới. Biến `NEXT_PUBLIC_*` được gắn lúc **build**, nên đổi giá trị phải build lại |

---

## 8. API và tiến độ task

### 8.1. API

Mọi route (trừ `/`, `/health`, `/products*`, `/toppings`, `/auth/register`, `/auth/login`) cần header `Authorization: Bearer <JWT>`. Cập nhật 23/10/2026; các test tích hợp trong `backend/test/assign1.e2e-spec.ts` kiểm tra từng dòng dưới đây trên PostgreSQL thật.

| Method | Endpoint | Chức năng | Quyền | Task |
|---|---|---|---|---|
| GET | `/` | "Hello BrewLite!" | công khai | 1 |
| GET | `/health` | Kiểm tra backend sống | công khai | 1 |
| GET | `/products`, `/products/:id` | Danh sách / chi tiết sản phẩm (id, name, price, category, imageUrl, stock) | công khai | 2 |
| GET | `/toppings` | Danh sách topping | công khai | 2, 4 |
| POST | `/auth/register` | Đăng ký (bcrypt; luôn tạo CUSTOMER); nhận `email`, `password`, `name` (tùy chọn) | công khai | 7 |
| POST | `/auth/login` | Đăng nhập, trả `accessToken` (JWT) | công khai | 7 |
| GET | `/auth/me` | Thông tin người dùng hiện tại | đăng nhập | 7 |
| POST | `/orders` | Tạo đơn PENDING; bắt buộc header `Idempotency-Key`; giá theo size S/M/L (+0/+5.000/+10.000đ) và topping; trừ kho có điều kiện; mã khuyến mãi; `userId` lấy từ JWT | đăng nhập | 6, 10 |
| GET | `/orders/me` | Lịch sử đơn của người dùng | đăng nhập | 9 |
| GET | `/orders/:id` | Chi tiết đơn (chủ đơn hoặc STAFF) | đăng nhập | 9 |
| GET | `/orders` | Tất cả đơn | STAFF | 6 |
| POST | `/payments` | Thanh toán mô phỏng (`method`: `WALLET` hoặc `CARD`; `simulate: "FAIL"` để ép lỗi khi demo); idempotent theo `Idempotency-Key`; PAID cộng điểm, lỗi thì PAYMENT_FAILED | đăng nhập | 8, 10 |
| PATCH | `/orders/:id/status` | STAFF chuyển PREPARING, READY, COMPLETED, CANCELLED (hủy hoàn kho) | STAFF | 10 |

> `GET /health`, `GET /toppings`, `GET /auth/me`, `GET /orders/:id` và `PATCH /orders/:id/status` là bổ sung của nhóm (đề không nêu).

### 8.2. Tiến độ 10 task

"Xong" nghĩa là chức năng chạy đầu-cuối (đã chạy thử bằng trình duyệt thật và test tích hợp). Task chỉ được tính điểm khi **một thành viên khác nghiệm thu** theo Definition of Done, nên cột cuối ghi rõ.

| # | Task | Trạng thái | Nghiệm thu chéo |
|---|---|---|---|
| 1 | Khởi tạo dự án và cấu trúc | Xong | Rôi |
| 2 | API danh sách sản phẩm | Xong (`/products`, seed 12 sản phẩm + 4 topping) | Rôi |
| 3 | Trang Menu | Xong (gọi API; có loading, lỗi, rỗng) | Rôi |
| 4 | Chi tiết và tùy chọn sản phẩm | Xong (size, topping; giá do server tính lại) | Rôi |
| 5 | Giỏ hàng | Xong (thêm, sửa số lượng, xóa, tổng tiền, badge) | Rôi |
| 6 | API tạo đơn hàng | Xong (JWT, class-validator, lưu PENDING) | Rôi |
| 7 | Đăng ký / đăng nhập (JWT) | Xong (bcrypt, JWT, guard, trang `/login`, `/register`) | Rôi |
| 8 | Thanh toán không tiền mặt | Xong (Ví/Thẻ mô phỏng, PAID/PAYMENT_FAILED, giữ giỏ khi lỗi) | Rôi |
| 9 | Xác nhận, lịch sử đơn và bàn giao | Xong (`/orders/me`, trang xác nhận, Docker, README) | Rôi |
| 10 | Nghiệp vụ backend nâng cao | Xong (state machine, idempotent, tồn kho đồng thời, khuyến mãi, điểm thưởng; test a, b, c) | Chưa |

Giới hạn đã biết: thanh toán chỉ mô phỏng; không có giao diện barista (STAFF thao tác qua API); các trường đường/đá trong giỏ chỉ hiển thị, chưa lưu vào đơn.

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

Test tích hợp (`test:e2e`) chạy trên PostgreSQL thật: cần đã migrate và seed, cùng biến `DATABASE_URL` và `JWT_SECRET` (ví dụ `docker compose up -d db`, rồi `npx prisma migrate deploy --config prisma7.config.ts` và `npx prisma db seed --config prisma7.config.ts` trong `backend/`). Các test tự tạo dữ liệu riêng nên không làm hỏng dữ liệu mẫu, nhưng **không** nên chạy trên CSDL có dữ liệu thật.

Hiện có: 22 unit test (gồm máy trạng thái đơn hàng) và 32 test tích hợp.

**Bắt buộc theo đề (Task 10), nơi nằm các test:**

- (a) chặn chuyển trạng thái sai: `src/orders/order-state.spec.ts` (duyệt toàn bộ cặp trạng thái) và nhóm "Task 8 + 10a" trong `test/assign1.e2e-spec.ts`.
- (b) gửi 2 lần (và 10 lần song song) cùng `Idempotency-Key` chỉ tạo 1 đơn: nhóm "Task 10b".
- (c) 20 yêu cầu đặt song song khi kho chỉ còn 5 thì đúng 5 đơn thành công, kho về 0: nhóm "Task 10c".

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

Bằng chứng Scrum lưu trong `docs/scrum/`: Product Backlog, 3 Sprint Backlog, Burndown (`burndown-sprint-*.csv`), biên bản trong `docs/scrum/minutes/`. Thỏa thuận nhóm ở `docs/team-agreement.md`. Thiết kế ở `docs/design/`; báo cáo ở `docs/report/BrewLite_BaoCao.docx`.

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
| A | Nguyễn Lê Nhựt Thắng | | Scrum Master + Dev nền tảng |
| B | Hồ Thiên Ngân | | Dev backend (dữ liệu, nghiệp vụ lõi) |
| C | Hà Thiên Long | | Dev backend (xác thực, thanh toán, state machine) |
| D | Giản Thiên Lực | | Dev frontend, slide |
| E | Lê Thuận | | Dev frontend, kiểm thử, PO tạm |

**Giảng viên hướng dẫn:** …………………………………………

---

*README phiên bản 1.2 (cập nhật 23/10/2026, code Assignment 1 hoàn thành). Cập nhật sau mỗi Sprint khi có thay đổi về cài đặt hoặc cách chạy.*
