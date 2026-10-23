# Ma trận truy vết

> **Cập nhật 23/10/2026.** Cột "Code / API" và "Test" trỏ tới mã và test **đã có thật** trong repo (tên test lấy từ `apps/api/test/assign1.e2e-spec.ts` và `apps/api/src/orders/order-state.spec.ts`). Ô ghi "Chưa có" nghĩa là chưa làm, không điền trước.

Quy ước mã: US = user story, UC = use-case, Activity/Sequence/Class = sơ đồ trong `docs/diagrams`, `API-Txx` = unit test, `INT-Txx` = integration test (e2e trên PostgreSQL), `E2E-Txx` = end-to-end trên trình duyệt.

| Mã yêu cầu | Use-case / User story | Thiết kế / Sơ đồ | Code / API | Test |
|---|---|---|---|---|
| FR-01 Hiển thị danh sách sản phẩm | US-01 Xem menu | Activity-01, Class-01 (Product) | `GET /products` (`apps/api/src/products`); trang `apps/web/src/app/menu` | INT-T01: "GET /products trả danh sách có id, name, price, imageUrl" |
| FR-02 Trạng thái loading/rỗng/lỗi | US-01 Xem menu | Activity-01 | Trang menu (`apps/web`) | E2E-T01a/T01b (Playwright, `tests/e2e/brewlite-flow.spec.ts`) |
| FR-03 Chi tiết, size, topping | US-02 Xem chi tiết | Class-01 (Product, Topping, Size) | `GET /products/:id`, `GET /toppings` | INT-T02: "GET /products/:id: có -> 200, không có -> 404, id sai -> 400" |
| FR-04 Giỏ hàng, tổng tiền | US-03 Quản lý giỏ hàng | Activity-01 | Giỏ hàng trong trang menu (`apps/web`) | E2E-T01a/T01b (Playwright, `tests/e2e/brewlite-flow.spec.ts`) |
| FR-05 Đăng ký, đăng nhập | US-04 Xác thực | Class-01 (User) | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | INT-T03: "hash mật khẩu bằng bcrypt…", "trùng email -> 409; sai mật khẩu -> 401…", "đăng nhập đúng trả JWT dùng được" |
| FR-06 Chặn đặt đơn khi chưa đăng nhập | UC-01 (E1) | Activity-01, Sequence-01 | `JwtAuthGuard` trên `POST /orders` | INT-T04: "cần đăng nhập (401 khi thiếu token)" |
| FR-07 Tạo đơn, trừ tồn kho | UC-01 | Sequence-01, Class-01 (Order, OrderItem) | `POST /orders` (`apps/api/src/orders`) | INT-T05: "tính giá theo size…", "validate: thiếu items…", "userId trong body bị bỏ qua" |
| FR-08 Thanh toán Ví/Thẻ | UC-01 | Sequence-01, Class-01 (Payment) | `POST /payments` (`apps/api/src/payments`) | INT-T06: "thanh toán thành công -> PAID…", "thanh toán lỗi -> PAYMENT_FAILED, thử lại được rồi PAID" |
| FR-09 Idempotency | UC-01 (A2) | Sequence-01, ADR-004 | `Idempotency-Key` ở `POST /orders` và `POST /payments` | INT-T07: "gửi 2 lần cùng key chỉ tạo 1 đơn…", "10 yêu cầu song song cùng key…", "gửi lại cùng Idempotency-Key không thanh toán lần hai" |
| FR-10 Máy trạng thái đơn | UC-01, UC-02 | Class-01 (OrderStatus) | `apps/api/src/orders/order-state.ts` | API-T01: `order-state.spec.ts` (mọi cặp trạng thái); INT-T08: "chuyển trạng thái sai bị chặn (400)…" |
| FR-11 STAFF cập nhật trạng thái | UC-02 | Class-01 (Role) | `PATCH /orders/:id/status` | INT-T09: "STAFF đi hết luồng PAID -> PREPARING -> READY -> COMPLETED", "…CUSTOMER không được gọi PATCH (403)" |
| FR-12 Lịch sử đơn | US-05 Xem lịch sử | Class-01 | `GET /orders/me`, `GET /orders/:id`, `GET /orders` (STAFF); trang `/orders/history` | INT-T10: "GET /orders/me chỉ trả đơn của mình", "GET /orders/:id: chủ đơn 200, người khác 404…" |
| FR-13 Tồn kho đồng thời | UC-01 (E3) | Sequence-01, ADR-005 | Cập nhật có điều kiện trong transaction tạo đơn | INT-T11: "20 người đặt song song, kho 5 -> đúng 5 đơn…", "đơn thất bại giữa chừng được rollback…", "hủy đơn hoàn lại tồn kho…" |
| FR-14 Khuyến mãi | UC-01 (A1) | Class-01 (Promotion) | Xử lý trong `orders.service.ts` (`promoCode`) | INT-T12: "mã khuyến mãi: WELCOME10 giảm 10% khi đủ điều kiện" |
| FR-15 Điểm thưởng | UC-02 | Class-01 (User.points) | `pointsForTotal` trong `order-state.ts`; cộng khi PAID | API-T02: "gives 1 point per full 10.000đ"; INT-T13: "thanh toán thành công -> PAID và cộng điểm", "hủy đơn đã PAID trừ lại điểm thưởng" |
| NFR-02 Bảo mật mật khẩu, phân quyền | – | ADR-003 | bcrypt, `JwtAuthGuard`, `@Roles` | INT-T03, INT-T09 |
| NFR-04 Validate đầu vào | – | – | class-validator, whitelist DTO | INT-T05: "validate: thiếu items, size sai, số lượng <= 0 -> 400" |
| NFR-07 Chạy bằng Docker Compose | – | Deployment diagram | `docker-compose.yml`, `apps/*/Dockerfile` | Đã chạy tay trên máy nhóm |
| NFR-08 CI/CD | – | Deployment diagram, ADR-006 | `.github/workflows/ci.yml`, `cd.yml` | Chưa có: cần log lần chạy thật trên GitHub (xem `deployment.md`) |
| NFR-09 Health check | – | Deployment diagram | `GET /health` | Smoke test trong `cd.yml` |
| NFR-10 Migration và seed tái tạo được | – | ADR-002 | `apps/api/prisma/migrations`, `prisma/seed.ts` | Job `api-e2e` trong `ci.yml` chạy migrate + seed trên DB trống |

## Quy tắc cập nhật

1. Mỗi PR thêm tính năng phải sửa dòng tương ứng trong ma trận.
2. E rà ma trận trước khi nộp: mọi FR mức Must phải có thiết kế, code và test.
3. Nếu tạo phẩm của task trước thiếu, ghi rõ ở đây thay vì bỏ trống im lặng.
4. FR-02 và FR-04 được kiểm bằng test E2E Playwright (`tests/e2e`, job `e2e-browser` trong CI); trạng thái loading/lỗi chưa có test riêng, chỉ kiểm thủ công.
