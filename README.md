# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt: khách xem menu, chọn size và topping, thêm vào giỏ, đăng nhập, thanh toán (mô phỏng) và theo dõi đơn hàng; nhân viên (STAFF) xử lý đơn qua API.

Bài tập lớn môn **Công nghệ Phần mềm**, Trường Đại học Sài Gòn, học kỳ I năm học 2026–2027, làm theo quy trình **Agile Scrum**. Hạn nộp: 27/10/2026.

## Trạng thái dự án (cập nhật 23/10/2026)

| Hạng mục | Tình trạng |
|---|---|
| Assignment 1 (10 task) | **Hoàn thành code cả 10 task**, chạy đầu-cuối từ giao diện đến CSDL |
| Kiểm thử | 22 unit test và 32 test tích hợp đạt (PostgreSQL thật); lint và build backend, frontend sạch |
| Docker Compose | Chạy được 3 dịch vụ (db, backend, frontend); đã chạy thử trên Windows (Docker Desktop + WSL 2) |
| Nghiệm thu chéo (điều kiện tính điểm) | **Đã nghiệm thu, cả 10 task đạt DoD** (xác nhận 23/10/2026, xem `docs/scrum/dod-nghiem-thu.md`) |
| Bằng chứng Scrum | Product Backlog, 3 Sprint Backlog, Burndown, biên bản (`docs/scrum/`) |
| Báo cáo | `docs/report/BrewLite_BaoCao.docx`; còn chèn ảnh và điền MSSV |
| Assignment 2 (Requirements to Deployment) | Đã có SRS, use-case, sơ đồ, ADR, ma trận truy vết, CI/CD; **chưa deploy production** (xem [Mục 15](#15-assignment-2-từ-yêu-cầu-đến-triển-khai)) |
| Sprint 3 Review và Retrospective | Dự kiến 25/10/2026; đã soạn bản nháp biên bản |

Chi tiết từng task ở [Mục 8](#8-api-và-tiến-độ-task).

---

## Mục lục

1. [Giới thiệu và phạm vi](#1-giới-thiệu-và-phạm-vi)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Môi trường phát triển](#3-môi-trường-phát-triển)
4. [Công cụ làm việc](#4-công-cụ-làm-việc)
5. [Cấu trúc thư mục](#5-cấu-trúc-thư-mục)
6. [Cài đặt và chạy](#6-cài-đặt-và-chạy)
7. [Biến môi trường](#7-biến-môi-trường)
8. [API và tiến độ task](#8-api-và-tiến-độ-task)
9. [Nghiệp vụ đơn hàng](#9-nghiệp-vụ-đơn-hàng)
10. [Kiểm thử và chất lượng code](#10-kiểm-thử-và-chất-lượng-code)
11. [Quy ước làm việc nhóm](#11-quy-ước-làm-việc-nhóm)
12. [Tài liệu Scrum và báo cáo](#12-tài-liệu-scrum-và-báo-cáo)
13. [Xử lý sự cố thường gặp](#13-xử-lý-sự-cố-thường-gặp)
14. [Thành viên nhóm](#14-thành-viên-nhóm)
15. [Assignment 2: từ yêu cầu đến triển khai](#15-assignment-2-từ-yêu-cầu-đến-triển-khai)

---

## 1. Giới thiệu và phạm vi

**Product Vision:** BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và hạn chế sai sót khi nhiều người đặt cùng lúc.

**Luồng chính:**

```
Xem menu → Chọn sản phẩm (size, topping) → Thêm vào giỏ → Xem giỏ, nhập mã khuyến mãi
        → Đăng nhập → Thanh toán (Ví/Thẻ mô phỏng) → Xác nhận đơn → Xem lịch sử đơn
```

**Đã làm:** menu từ API, chi tiết sản phẩm, giỏ hàng, đăng ký và đăng nhập (JWT, phân quyền CUSTOMER/STAFF), tạo đơn, thanh toán mô phỏng, xác nhận và lịch sử đơn, máy trạng thái đơn hàng, Idempotency-Key, kiểm soát tồn kho đồng thời, mã khuyến mãi, điểm thưởng.

**Ngoài phạm vi:** giao diện cho barista (STAFF thao tác qua API), cổng thanh toán thật, quản lý kho nguyên liệu, quên mật khẩu, hồ sơ cá nhân.

---

## 2. Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Frontend | Next.js 16.4, React 19.3, TypeScript, TailwindCSS 4 |
| Backend | NestJS 12, TypeScript, REST API |
| CSDL và ORM | PostgreSQL 16, Prisma 7 (adapter pg) |
| Xác thực | JWT (`@nestjs/jwt`), bcryptjs |
| Validate dữ liệu | class-validator, class-transformer (whitelist DTO) |
| Kiểm thử | Vitest, Supertest (e2e trên PostgreSQL thật) |
| Chất lượng code | oxlint và Prettier (backend), ESLint (frontend) |
| Đóng gói | Docker, Docker Compose |

---

## 3. Môi trường phát triển

### 3.1. Yêu cầu phần mềm

| Công cụ | Yêu cầu |
|---|---|
| Node.js | 24.15 trở lên (khuyến nghị, có trong `.nvmrc`), hoặc 22.22.3 trở lên |
| npm | Đi kèm Node.js; cả nhóm chỉ dùng npm |
| Git | Bản mới |
| Docker Desktop | Có lệnh `docker compose`; trên Windows nên bật WSL 2 |
| Trình duyệt | Chrome hoặc Edge bản mới |

Một số gói của NestJS CLI yêu cầu `node: ^22.22.3 || ^24.15.0 || >=26.0.0`; Node thấp hơn vẫn chạy nhưng npm cảnh báo `EBADENGINE`. Dùng `nvm use` để thống nhất.

### 3.2. Cổng mặc định

| Dịch vụ | Cổng |
|---|---|
| Frontend | 3000 |
| Backend | 3001 |
| PostgreSQL | 5432 |

---

## 4. Công cụ làm việc

| Nhóm | Công cụ | Cách dùng |
|---|---|---|
| Mã nguồn | Git, GitHub | Mỗi chức năng một nhánh, gộp qua Pull Request vào `main` |
| Liên lạc | Nhóm chat | Daily Scrum, đăng biên bản |
| Tài liệu | Google Drive, thư mục `docs/` | Báo cáo, slide, bản nháp |
| Sơ đồ | Mermaid, draw.io | ERD (`docs/design/ERD_MemberB`), state machine |
| Chạy và đóng gói | Docker Compose | `docker compose up --build` |
| Kiểm thử | Vitest, Supertest | Unit, e2e, test bắt buộc Task 10 |

Phạm vi chạy: bằng docker-compose trên máy nhóm hoặc máy giảng viên để demo.

---

## 5. Cấu trúc thư mục

```
brewlite/
├── apps/
│   ├── api/                       # NestJS (backend)
│   │   ├── src/                   # auth, products, orders, payments, prisma
│   │   ├── prisma/                # schema.prisma, migrations/, seed.ts
│   │   ├── scripts/               # seed-if-empty.mjs (seed an toàn khi deploy)
│   │   ├── test/                  # e2e: assign1.e2e-spec.ts, app.e2e-spec.ts
│   │   ├── prisma7.config.ts
│   │   └── Dockerfile
│   └── web/                       # Next.js (frontend)
│       └── src/app/               # menu, login, register, orders/confirmation, orders/history
├── docs/
│   ├── requirements/              # context-and-scope, srs, use-case-checkout (Assignment 2, Task 1)
│   ├── diagrams/                  # activity, sequence, class, use-case (.puml + .svg/.png) (Task 2)
│   ├── architecture/              # architecture.md, adr/, deployment-diagram (Task 3)
│   ├── traceability-matrix.md     # ma trận truy vết
│   ├── deployment.md              # triển khai, rollback
│   ├── scrum/                     # backlog, burndown, biên bản, quy trình DoD
│   ├── progress/                  # bảng tiến độ
│   ├── design/                    # ERD
│   ├── report/                    # báo cáo (BrewLite_BaoCao.docx)
│   ├── team-agreement.md
│   └── message-to-lecturer.md
├── tests/                         # (Assignment 2) integration/E2E bổ sung nếu có
├── .github/workflows/             # ci.yml, cd.yml
├── docker-compose.yml
├── .env.example
├── .nvmrc
└── README.md
```

---

## 6. Cài đặt và chạy

### 6.1. Lấy mã nguồn

```bash
git clone https://github.com/tthan-prog/BrewLite.git
cd BrewLite
nvm use            # nếu dùng nvm
```

### 6.2. Cách 1: chạy toàn bộ bằng Docker Compose

```bash
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
docker compose up --build
```

Khi backend khởi động, container tự chạy `prisma migrate deploy` (tạo bảng). Dữ liệu mẫu **không** tự nạp; mở terminal thứ hai và nạp **một lần**:

```bash
docker compose exec backend npx prisma db seed --config prisma7.config.ts
```

> Cảnh báo: `prisma/seed.ts` bắt đầu bằng `deleteMany()` trên mọi bảng. Chạy lại seed sẽ **xóa sạch** dữ liệu hiện có (kể cả đơn hàng).

**Dữ liệu mẫu:**

| Loại | Nội dung |
|---|---|
| Tài khoản | `customer@brewlite.com` (CUSTOMER) và `staff@brewlite.com` (STAFF); mật khẩu `password123` (chỉ dùng phát triển) |
| Sản phẩm, topping | 12 sản phẩm, 4 topping |
| Mã khuyến mãi | `WELCOME10` (giảm 10%, đơn từ 50.000đ), `SAVE20K` (giảm 20.000đ, đơn từ 100.000đ) |

**Sau khi chạy:**

- Frontend: http://localhost:3000 (menu ở `/menu`)
- Backend: http://localhost:3001 (kiểm tra `/health`)
- PostgreSQL: `localhost:5432`

**Dừng hệ thống:**

```bash
docker compose down           # giữ dữ liệu
docker compose down -v        # xóa cả dữ liệu CSDL
```

Nếu đổi mã nguồn, chạy lại `docker compose up --build` (lệnh `exec` không tự build lại). Prisma 7 sinh client vào `apps/api/src/generated/prisma`; `apps/api/Dockerfile` tự chạy `prisma generate` khi build. Mọi lệnh Prisma cần thêm `--config prisma7.config.ts`.

### 6.3. Cách 2: chạy từng phần để phát triển

**CSDL và backend (terminal 1):**

```bash
docker compose up -d db
cd apps/api
cp .env.example .env          # kiểm tra DATABASE_URL trỏ localhost:5432
npm install
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npx prisma db seed --config prisma7.config.ts      # một lần
npm run start:dev
```

Kiểm tra: http://localhost:3001/health trả `{"status":"ok","service":"brewlite-backend"}`.

**Frontend (terminal 2):**

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Mở http://localhost:3000/menu.

---

## 7. Biến môi trường

Không đưa `.env` hoặc `.env.local` lên Git; chỉ đưa các file `.env.example`.

**`.env.example` (thư mục gốc, cho docker-compose):**

```env
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=change_me
POSTGRES_DB=brewlite
JWT_SECRET=change_me_to_a_long_random_string
```

**`apps/api/.env.example`:**

```env
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://brewlite:change_me@localhost:5432/brewlite
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=1d
```

**`apps/web/.env.example`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng backend (mặc định 3001) |
| `FRONTEND_ORIGIN` | Địa chỉ frontend được phép gọi API (CORS); nhiều địa chỉ cách nhau bằng dấu phẩy |
| `DATABASE_URL` | Chuỗi kết nối PostgreSQL. Trong Docker Compose, host là `db`, không phải `localhost` |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Khóa ký và thời hạn JWT; phải đổi khỏi giá trị mẫu |
| `NEXT_PUBLIC_API_URL` | Địa chỉ backend mà trình duyệt gọi; gắn lúc build nên đổi giá trị phải build lại |

---

## 8. API và tiến độ task

### 8.1. API

Mọi route (trừ `/`, `/health`, `/products*`, `/toppings`, `/auth/register`, `/auth/login`) cần header `Authorization: Bearer <JWT>`. Test tích hợp `apps/api/test/assign1.e2e-spec.ts` kiểm tra từng dòng dưới đây.

| Method | Endpoint | Chức năng | Quyền | Task |
|---|---|---|---|---|
| GET | `/` | "Hello BrewLite!" | công khai | 1 |
| GET | `/health` | Kiểm tra backend sống | công khai | 1 |
| GET | `/products`, `/products/:id` | Danh sách, chi tiết sản phẩm | công khai | 2 |
| GET | `/toppings` | Danh sách topping | công khai | 2, 4 |
| POST | `/auth/register` | Đăng ký (bcrypt; luôn tạo CUSTOMER) | công khai | 7 |
| POST | `/auth/login` | Đăng nhập, trả `accessToken` | công khai | 7 |
| GET | `/auth/me` | Thông tin người dùng hiện tại | đăng nhập | 7 |
| POST | `/orders` | Tạo đơn PENDING; bắt buộc `Idempotency-Key`; giá theo size S/M/L (+0/+5.000/+10.000đ) và topping; trừ kho có điều kiện; mã khuyến mãi; `userId` lấy từ JWT | đăng nhập | 6, 10 |
| GET | `/orders/me` | Lịch sử đơn của tôi | đăng nhập | 9 |
| GET | `/orders/:id` | Chi tiết đơn (chủ đơn hoặc STAFF) | đăng nhập | 9 |
| GET | `/orders` | Tất cả đơn | STAFF | 6 |
| POST | `/payments` | Thanh toán mô phỏng (`WALLET` hoặc `CARD`; `simulate: "FAIL"` để ép lỗi khi demo); idempotent; PAID cộng điểm, lỗi thì PAYMENT_FAILED | đăng nhập | 8, 10 |
| PATCH | `/orders/:id/status` | STAFF chuyển PREPARING, READY, COMPLETED, CANCELLED (hủy hoàn kho) | STAFF | 10 |

`GET /health`, `GET /toppings`, `GET /auth/me`, `GET /orders/:id` và `PATCH /orders/:id/status` là bổ sung của nhóm (đề không nêu).

### 8.2. Tiến độ 10 task

"Xong" nghĩa là chức năng chạy đầu-cuối và có test. Task được tính điểm khi đạt Definition of Done và được nghiệm thu chéo.

| # | Task | Sprint | Người làm chính | Trạng thái | Nghiệm thu chéo |
|---|---|---|---|---|---|
| 1 | Khởi tạo dự án | 1 | A | Xong | Đạt |
| 2 | API danh sách sản phẩm | 1 | C (B: schema, seed) | Xong | Đạt |
| 3 | Trang Menu | 1 | D | Xong (gọi API; loading, lỗi, rỗng) | Đạt |
| 4 | Chi tiết, size, topping | 1 | D | Xong (giá do server tính lại) | Đạt |
| 5 | Giỏ hàng | 2 | D | Xong (thêm, sửa, xóa, tổng tiền, badge) | Đạt |
| 6 | API tạo đơn | 2 | B | Xong (JWT, validate, PENDING) | Đạt |
| 7 | Đăng ký, đăng nhập | 2 | C | Xong (bcrypt, JWT, guard, trang `/login`, `/register`) | Đạt |
| 8 | Thanh toán không tiền mặt | 3 | C | Xong (Ví/Thẻ mô phỏng, PAID/PAYMENT_FAILED, thử lại) | Đạt |
| 9 | Xác nhận, lịch sử đơn, bàn giao | 3 | E | Xong (`/orders/me`, trang xác nhận, Docker, README) | Đạt |
| 10 | Nghiệp vụ nâng cao | 3 | B, C | Xong (state machine, idempotency, tồn kho, khuyến mãi, điểm; test a, b, c) | Đạt |

**Giới hạn đã biết:** thanh toán chỉ mô phỏng; không có giao diện barista; trường đường/đá trong giỏ chỉ hiển thị, chưa lưu vào đơn; migration của các bảng bổ sung viết tay, cần đối chiếu với Prisma khi đổi môi trường.

Kết quả nghiệm thu chi tiết: `docs/scrum/dod-nghiem-thu.md`.

---

## 9. Nghiệp vụ đơn hàng

### 9.1. Trạng thái đơn hàng

Luồng thành công: `PENDING → PAID → PREPARING → READY → COMPLETED`.

| Từ | Sang |
|---|---|
| PENDING | PAID, PAYMENT_FAILED, CANCELLED |
| PAYMENT_FAILED | PENDING (thử lại), CANCELLED |
| PAID | PREPARING, CANCELLED |
| PREPARING | READY |
| READY | COMPLETED |
| COMPLETED, CANCELLED | (kết thúc) |

Mọi chuyển tiếp khác bị chặn (lỗi 4xx). Mã nguồn: `apps/api/src/orders/order-state.ts`.

### 9.2. Quy tắc nghiệp vụ

| Quy tắc | Cách làm |
|---|---|
| Giá | Server tính lại từ CSDL: giá gốc + phụ thu size (S +0, M +5.000, L +10.000đ) + topping; không tin giá từ client |
| Tồn kho | Trừ bằng `updateMany` có điều kiện (stock ≥ số lượng) trong transaction; hủy đơn hoàn kho |
| Idempotency | Header `Idempotency-Key` bắt buộc khi tạo đơn và thanh toán; ràng buộc unique, gửi lại cùng khóa trả về kết quả cũ |
| Khuyến mãi | `WELCOME10`, `SAVE20K` (điều kiện đơn tối thiểu ở Mục 6.2) |
| Điểm thưởng | 1 điểm cho mỗi 10.000đ, cộng khi đơn PAID, thu hồi khi hủy đơn đã PAID |

---

## 10. Kiểm thử và chất lượng code

**Backend (trong `apps/api/`):**

```bash
npm test              # unit test (Vitest)
npm run test:e2e      # kiểm thử tích hợp (Vitest + Supertest)
npm run lint          # oxlint
npm run format        # Prettier
npm run build         # biên dịch
```

**Frontend (trong `apps/web/`):**

```bash
npm run lint
npm run build
```

Test tích hợp chạy trên PostgreSQL thật, cần đã migrate và seed cùng `DATABASE_URL` và `JWT_SECRET` (ví dụ `docker compose up -d db`, rồi migrate và seed như Mục 6.3). Các test tự tạo dữ liệu riêng nhưng **không** nên chạy trên CSDL có dữ liệu thật.

**Kết quả (23/10/2026, nhánh main):** 22 unit test và 32 test tích hợp đạt; build và lint backend sạch; lint và build frontend đạt.

**Ba test bắt buộc của Task 10:**

| Test | Nội dung | Vị trí |
|---|---|---|
| (a) | Chặn chuyển trạng thái sai | `src/orders/order-state.spec.ts`; nhóm "Task 8 + 10a" trong `test/assign1.e2e-spec.ts` |
| (b) | Gửi 2 lần (và 10 lần song song) cùng `Idempotency-Key` chỉ tạo 1 đơn | nhóm "Task 10b" |
| (c) | 20 yêu cầu song song khi kho còn 5: đúng 5 đơn thành công, kho về 0 | nhóm "Task 10c" |

---

## 11. Quy ước làm việc nhóm

**Nhánh:** `main` luôn chạy được, không push trực tiếp. Mỗi chức năng một nhánh `feature/<mô-tả-ngắn>`; sửa lỗi dùng `fix/<mô-tả-ngắn>`.

**Commit:** thông điệp ngắn, rõ, mỗi commit một việc (ví dụ `feat(cart): thêm xóa sản phẩm khỏi giỏ`).

**Pull Request:** mô tả task, việc đã làm, cách kiểm tra; có ít nhất một người khác xem trước khi gộp; chỉ gộp khi build không lỗi.

**Definition of Done** (task được tính điểm khi):

- Code chạy được, không lỗi build, đúng tiêu chí chấp nhận.
- Có commit rõ ràng và được review trong nhóm.
- API có validate đầu vào; giao diện xử lý loading và lỗi cơ bản.
- Có hướng dẫn chạy trong README.
- Được một thành viên khác nghiệm thu (không tự nghiệm thu task mình viết).

---

## 12. Tài liệu Scrum và báo cáo

| Nội dung | Vị trí |
|---|---|
| Product Backlog (10 task, điểm, trạng thái) | `docs/scrum/product-backlog.md` |
| Sprint Backlog 1, 2, 3 | `docs/scrum/sprint-1-backlog.md`, `sprint-2-backlog.md`, `sprint-3-backlog.md` |
| Burndown và cách tính | `docs/scrum/burndown-sprint-*.csv`, `burndown-ghi-chu.md` |
| Biên bản Planning, Review, Retrospective | `docs/scrum/minutes/` |
| Mẫu biên bản | `docs/scrum/meeting-minutes-template.md`, `retrospective-template.md` |
| Thỏa thuận nhóm | `docs/team-agreement.md` |
| ERD | `docs/design/ERD_MemberB/` |
| Báo cáo | `docs/report/BrewLite_BaoCao.docx` |

**Nhịp Sprint:**

| Sprint | Thời gian | Task theo kế hoạch | Kết quả |
|---|---|---|---|
| 1 | 14–18/10 | 1, 2, 3, 4 | Xong Task 1; còn 9/11 điểm |
| 2 | 19–22/10 | 5, 6, 7 + tồn | Còn 8/22 điểm |
| 3 | 23–25/10 | 8, 9, 10 + tồn | Hoàn thành, đạt DoD; Review ngày 25/10 |
| Hoàn thiện | 26/10 | Rà DoD, tập demo | – |
| Nộp | 27/10 | – | – |

---

## 13. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `Cannot find module src/generated/prisma/client` | Chưa sinh Prisma client hoặc image cũ | Chạy `npx prisma generate --config prisma7.config.ts`; với Docker chạy `docker compose down` rồi `docker compose up --build` |
| Seed hoặc API báo bảng không tồn tại | Chưa migrate | `npx prisma migrate deploy --config prisma7.config.ts` (Docker tự migrate khi backend khởi động) |
| Đăng nhập báo sai mật khẩu với tài khoản mẫu | Chưa seed | Chạy seed (Mục 6.2) |
| `npm install` ở backend báo `Cannot read properties of null (reading 'edgesOut')` | Lỗi npm 10.x với peer dependency | Dùng `.npmrc` có `legacy-peer-deps=true`; nếu vẫn lỗi, cập nhật npm |
| Cảnh báo `EBADENGINE` | Node thấp hơn yêu cầu | Dùng Node 24.15+ (`nvm use`) |
| Frontend báo "Không kết nối được" | Backend chưa chạy hoặc sai `NEXT_PUBLIC_API_URL` | Chạy backend; kiểm tra http://localhost:3001/health |
| Lỗi CORS trên trình duyệt | `FRONTEND_ORIGIN` không khớp | Sửa `FRONTEND_ORIGIN` trong `apps/api/.env` |
| Cổng bị chiếm (EADDRINUSE) | Tiến trình cũ ở 3000 hoặc 3001 | Tắt tiến trình đó hoặc đổi cổng |
| Đổi `NEXT_PUBLIC_API_URL` không có tác dụng | Biến được gắn lúc build | Build lại (`docker compose up --build`) |
| Docker chạy chậm hoặc lỗi trên Windows | Chưa bật WSL 2 | Bật WSL 2 trong Docker Desktop |
| Cảnh báo "LF will be replaced by CRLF" khi `git add` | Khác kiểu xuống dòng giữa Windows và Linux | Có thể bỏ qua |

---

## 14. Thành viên nhóm

| Ký hiệu | Họ tên | MSSV | Vai trò |
|---|---|---|---|
| A | Nguyễn Lê Nhựt Thắng | | Scrum Master, Dev nền tảng |
| B | Hồ Thiên Ngân | | Dev backend (dữ liệu, đơn hàng, nghiệp vụ lõi) |
| C | Hà Thiên Long | | Dev backend (xác thực, thanh toán, state machine) |
| D | Giản Thiên Lực | | Dev frontend, slide |
| E | Lê Thuận | | Dev frontend, kiểm thử, Product Owner tạm |

**Giảng viên hướng dẫn:** …………………………………………


---

## 15. Assignment 2: từ yêu cầu đến triển khai

Dùng chung mã nguồn với Assignment 1. Hạn nộp 27/10/2026. Năm task, mỗi task 2 điểm; task sau chỉ được nghiệm thu khi tạo phẩm của task trước đã có trên Git.

| Task | Nội dung | Tạo phẩm | Trạng thái |
|---|---|---|---|
| 1 | Khai thác và đặc tả yêu cầu | `docs/requirements/` (context-and-scope, srs, use-case-checkout) | Có bản đầy đủ, cần E rà |
| 2 | Mô hình hóa | `docs/diagrams/` (activity, sequence, class, use-case; `.puml` và `.svg`) | Đã vẽ lại khớp code |
| 3 | Kiến trúc | `docs/architecture/` (architecture.md, 7 ADR, deployment diagram) | Đã chốt Prisma và Render |
| 4 | Sprint 1 | Cấu trúc `apps/api`, `apps/web`; MVP menu; CI (`ci.yml`) | Code có; cần minh chứng CI chạy trên GitHub (một lần đạt, một lần lỗi) |
| 5 | Sprint 2, CI/CD, production | `cd.yml`, `docs/deployment.md`, release notes | Pipeline đã viết; **chưa deploy, chưa có URL production** |

Ma trận truy vết: `docs/traceability-matrix.md`. Hướng dẫn triển khai và rollback: `docs/deployment.md`.

Điều kiện chấm cần nhớ: **không có URL production hoạt động lúc chấm thì phần triển khai của Task 5 không được tính.**

---

*README phiên bản 2.1, cập nhật ngày 23/10/2026: cấu trúc `apps/api`, `apps/web` và tài liệu Assignment 2. Cập nhật khi có thay đổi về cài đặt, cách chạy hoặc trạng thái nghiệm thu.*
