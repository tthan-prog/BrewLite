# Kịch bản test backend – BrewLite

- **Mục đích:** kiểm tra API backend (NestJS) theo các yêu cầu của đề, chạy được bằng tay khi demo và chụp kết quả làm minh chứng cho báo cáo.
- **Phạm vi:** các yêu cầu theo đề trong `docs/requirements/srs.md` (FR-01, FR-03, FR-05 đến FR-12, FR-14, FR-15, NFR-02, NFR-04, NFR-09). Chức năng bổ sung ngoài đề (thanh toán QR, đổi quà, quản lý nguyên liệu, tự hủy đơn) không nằm trong kịch bản này. Các yêu cầu chỉ có ở giao diện (FR-02 menu, FR-04 giỏ hàng) được kiểm bằng E2E Playwright.
- **Quan hệ với test tự động:** cột "Test tự động" trỏ tới test tích hợp cùng ý trong `apps/api/test/assign1.e2e-spec.ts` (mã INT-Txx theo `docs/traceability-matrix.md`). Kịch bản này là bản chạy tay trên hệ thống thật; test tự động vẫn là bằng chứng chính trong CI.
- **Tệp đi kèm** (thư mục `docs/as2/postman/`):
  - `brewlite-backend.postman_collection.json`: 46 request, mỗi request có kiểm tra tự động (assertion).
  - `brewlite-local.postman_environment.json`: chạy trên máy (`http://localhost:3001`).
  - `brewlite-production.postman_environment.json`: chạy trên Render (`https://brewlite-api.onrender.com`).

## 1. Chuẩn bị môi trường

### 1.1. Local (khuyến nghị chạy trước)

```bash
cp .env.example .env            # PowerShell: Copy-Item .env.example .env
docker compose up --build
# mở terminal thứ hai, nạp dữ liệu mẫu (xóa sạch dữ liệu cũ):
docker compose exec backend npx prisma db seed --config prisma7.config.ts
```

Kiểm tra http://localhost:3001/health trả `{"status":"ok","service":"brewlite-backend"}`.

Dữ liệu seed dùng trong kịch bản: khách `customer@brewlite.com` và nhân viên `staff@brewlite.com` (mật khẩu `password123`); sản phẩm 1 Cà phê sữa đá 29.000đ, sản phẩm 4 Caramel Latte 45.000đ; phụ thu size S +0, M +5.000đ, L +10.000đ; mã `WELCOME10` giảm 10% cho đơn từ 50.000đ; 1 điểm thưởng cho mỗi 10.000đ.

### 1.2. Production

- Mở https://brewlite-api.onrender.com/health trước và chờ trả `ok` (server gói Free ngủ, lần gọi đầu mất khoảng 50 giây).
- Kịch bản tạo đơn, thanh toán (mô phỏng) và đổi trạng thái **trên dữ liệu thật**: mỗi lần chạy thêm 3 đơn và 1 tài khoản khách mới, cộng điểm cho tài khoản `customer@brewlite.com`. Không xóa dữ liệu nào.
- Nếu BT-25 báo 400 "Không đủ nguyên liệu" thì kho production đã hết nguyên liệu của topping: ghi nhận vào cột kết quả, không phải lỗi của kịch bản.

## 2. Cách chạy

### 2.1. Postman (dùng khi demo và chụp minh chứng)

1. Postman, **Import**, chọn cả 3 tệp trong `docs/as2/postman/`.
2. Góc phải trên, chọn environment **BrewLite Local** (hoặc **BrewLite Production**).
3. Chuột phải collection **BrewLite – Kịch bản test backend**, **Run collection**, giữ thứ tự mặc định, bấm **Run**.
4. Kết quả mong đợi: 46 request, mọi assertion đạt (màu xanh). Chụp màn hình trang kết quả Runner.
5. Muốn demo từng ca: mở request, bấm **Send**, xem tab **Test Results**. Phải chạy theo thứ tự vì request sau dùng token và mã đơn do request trước lưu lại (biến của collection).

Có thể chạy lại nhiều lần: email khách B và các Idempotency-Key được sinh mới mỗi lần chạy.

### 2.2. Dòng lệnh (không cần mở Postman)

```bash
npx newman run docs/as2/postman/brewlite-backend.postman_collection.json \
  -e docs/as2/postman/brewlite-local.postman_environment.json
```

### 2.3. Gọi tay bằng PowerShell (không cần Postman)

Dùng `Invoke-RestMethod` để tránh lỗi dấu ngoặc kép khi gõ JSON. Mỗi lần chạy mới, đổi `demo-001` và `pay-001` thành chuỗi khác; giữ nguyên chuỗi cũ thì API trả lại kết quả lần trước (đúng tính chất idempotent).

```powershell
$api = "http://localhost:3001"   # production: https://brewlite-api.onrender.com

# BT-12: đăng nhập khách A
$login = Invoke-RestMethod -Method Post -Uri "$api/auth/login" -ContentType "application/json" `
  -Body '{"email":"customer@brewlite.com","password":"password123"}'

# BT-20: tạo đơn (Cà phê sữa đá size M, 34.000đ)
$h = @{ Authorization = "Bearer $($login.accessToken)"; "Idempotency-Key" = "demo-001" }
$order = Invoke-RestMethod -Method Post -Uri "$api/orders" -Headers $h -ContentType "application/json" `
  -Body '{"items":[{"productId":1,"quantity":1,"size":"M"}]}'
$order | Select-Object id, status, total          # mong đợi: PENDING, 34000

# BT-27: thanh toán bằng Ví
$hp = @{ Authorization = "Bearer $($login.accessToken)"; "Idempotency-Key" = "pay-001" }
$body = @{ orderId = $order.id; method = "WALLET" } | ConvertTo-Json
$pay = Invoke-RestMethod -Method Post -Uri "$api/payments" -Headers $hp -ContentType "application/json" -Body $body
$pay.order.status; $pay.pointsEarned              # mong đợi: PAID, 3

# BT-28: gửi lại đúng yêu cầu thanh toán với cùng khóa
$again = Invoke-RestMethod -Method Post -Uri "$api/payments" -Headers $hp -ContentType "application/json" -Body $body
$again.replayed; $again.payment.id -eq $pay.payment.id   # mong đợi: True, True
```

Với các ca mong đợi lỗi (400, 401, 403, 404, 409), `Invoke-RestMethod` dừng và in thông báo lỗi có mã trạng thái; đó là kết quả cần xem.

## 3. Các ca test

Ký hiệu trong cột Request: `‹tên›` là biến Postman (lưu từ request trước hoặc lấy từ environment). Cột **Local** và **Production** để nhóm ghi Đạt hoặc Không đạt khi chạy thật.

### 1. Hệ thống

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-01 | Health check | `GET /health`<br>không token | 200; status = ok, service = brewlite-backend | NFR-09 | API e2e `/health` | | |

### 2. Sản phẩm

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-02 | Danh sách sản phẩm | `GET /products`<br>không token | 200; mảng không rỗng, mỗi phần tử có id, name, price, imageUrl (local sau seed: 12 sản phẩm) | FR-01 | INT-T01 | | |
| BT-03 | Chi tiết sản phẩm có | `GET /products/1`<br>không token | 200; name = Cà phê sữa đá, price = 29000 (theo seed) | FR-03 | INT-T02 | | |
| BT-04 | Chi tiết sản phẩm không có | `GET /products/999999`<br>không token | 404 | FR-03 | INT-T02 | | |
| BT-05 | Mã sản phẩm sai kiểu | `GET /products/abc`<br>không token | 400 | FR-03, NFR-04 | INT-T02 | | |
| BT-06 | Danh sách topping | `GET /toppings`<br>không token | 200; mảng topping có id, name, price; lưu topping đầu tiên để dùng ở BT-25 | FR-03 | – | | |

### 3. Xác thực

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-07 | Đăng ký tài khoản mới (khách B) (Email tự sinh theo thời gian để chạy lại nhiều lần không trùng.) | `POST /auth/register`<br>không token; body: `{"name":"Khach B","email":"‹emailB›","password":"secret123"}` | 201; có accessToken; user.role = CUSTOMER; không trả mật khẩu | FR-05, NFR-02 | INT-T03 | | |
| BT-08 | Đăng ký trùng email | `POST /auth/register`<br>không token; body: `{"email":"‹emailB›","password":"secret123"}` | 409; message: Email đã được đăng ký | FR-05 | INT-T03 | | |
| BT-09 | Đăng ký tự gán quyền STAFF | `POST /auth/register`<br>không token; body: `{"email":"evil-‹$timestamp›@test.dev","password":"secret123","role":"STAFF"}` | 400 (trường role bị từ chối) | FR-05, NFR-02 | INT-T03 | | |
| BT-10 | Đăng ký email sai định dạng | `POST /auth/register`<br>không token; body: `{"email":"khong-phai-email","password":"secret123"}` | 400 | FR-05, NFR-04 | INT-T03 | | |
| BT-11 | Đăng nhập sai mật khẩu | `POST /auth/login`<br>không token; body: `{"email":"‹customerEmail›","password":"sai-mat-khau"}` | 401; message: Email hoặc mật khẩu không đúng | FR-05 | INT-T03 | | |
| BT-12 | Đăng nhập khách A | `POST /auth/login`<br>không token; body: `{"email":"‹customerEmail›","password":"‹customerPassword›"}` | 200; có accessToken (lưu tokenA và id của khách A) | FR-05 | INT-T03 | | |
| BT-13 | Đăng nhập nhân viên | `POST /auth/login`<br>không token; body: `{"email":"‹staffEmail›","password":"‹staffPassword›"}` | 200; user.role = STAFF (lưu tokenStaff) | FR-11 | INT-T03 | | |
| BT-14 | Xem thông tin đăng nhập | `GET /auth/me`<br>token: khách A | 200; email = tài khoản khách A | FR-05 | INT-T03 | | |
| BT-15 | Gọi API cần đăng nhập khi thiếu token | `GET /auth/me`<br>không token | 401; message: Thiếu token đăng nhập | FR-06 | INT-T04 | | |

### 4. Đặt đơn

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-16 | Tạo đơn khi chưa đăng nhập | `POST /orders`<br>không token; có `Idempotency-Key`; body: `{"userId":999999,"items":[{"productId":1,"quantity":1,"size":"M"}]}` | 401 | FR-06 | INT-T04 | | |
| BT-17 | Tạo đơn thiếu Idempotency-Key | `POST /orders`<br>token: khách A; body: `{"userId":999999,"items":[{"productId":1,"quantity":1,"size":"M"}]}` | 400; message: Idempotency-Key header is required | FR-09 | INT-T07 | | |
| BT-18 | Tạo đơn size sai | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"items":[{"productId":1,"quantity":1,"size":"XL"}]}` | 400 (size phải là S, M hoặc L) | FR-07, NFR-04 | INT-T05 | | |
| BT-19 | Tạo đơn số lượng 0 | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"items":[{"productId":1,"quantity":0,"size":"S"}]}` | 400 | FR-07, NFR-04 | INT-T05 | | |
| BT-20 | Tạo đơn hợp lệ (đơn 1); userId trong body bị bỏ qua | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"userId":999999,"items":[{"productId":1,"quantity":1,"size":"M"}]}` | 201; status = PENDING; total = 34000 (29.000 + phụ thu size M 5.000); userId = id khách A, không phải 999999 | FR-07, NFR-02 | INT-T05 | | |
| BT-21 | Gửi lại cùng Idempotency-Key, cùng nội dung | `POST /orders`<br>token: khách A; có `Idempotency-Key` (cùng khóa với BT-20); body: `{"userId":999999,"items":[{"productId":1,"quantity":1,"size":"M"}]}` | 201; trả lại đúng đơn 1 (cùng id), không tạo đơn mới | FR-09 | INT-T07 | | |
| BT-22 | Cùng Idempotency-Key, nội dung khác | `POST /orders`<br>token: khách A; có `Idempotency-Key` (cùng khóa với BT-20); body: `{"items":[{"productId":1,"quantity":2,"size":"M"}]}` | 409; message: Idempotency-Key was already used with a different request | FR-09 | INT-T07 | | |
| BT-23 | Mã khuyến mãi không tồn tại | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"items":[{"productId":1,"quantity":1,"size":"M"}],"promoCode":"KHONGCO"}` | 400; message: Promotion code is invalid | FR-14 | – | | |
| BT-24 | Mã khuyến mãi chưa đủ giá trị đơn tối thiểu | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"items":[{"productId":1,"quantity":1,"size":"M"}],"promoCode":"WELCOME10"}` | 400; message: Order does not meet promotion minimum (WELCOME10 cần đơn từ 50.000đ) | FR-14 | – | | |
| BT-25 | Tạo đơn có topping (đơn 3) | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"items":[{"productId":1,"quantity":1,"size":"S","toppings":[{"toppingId":‹toppingId›,"quantity":1}]}]}` | 201; total = 29.000 + giá topping lấy ở BT-06 | FR-03, FR-07 | INT-T05 | | |
| BT-26 | Áp mã WELCOME10 hợp lệ (đơn 2) | `POST /orders`<br>token: khách A; có `Idempotency-Key`; body: `{"items":[{"productId":4,"quantity":1,"size":"L"}],"promoCode":"WELCOME10"}` | 201; subtotal = 55.000 (Caramel Latte 45.000 + size L 10.000); discount = 5.500; total = 49.500 | FR-14 | INT-T12 | | |

### 5. Thanh toán

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-27 | Thanh toán đơn 1 bằng Ví (thành công) | `POST /payments`<br>token: khách A; có `Idempotency-Key`; body: `{"orderId":‹order1Id›,"method":"WALLET"}` | 200; payment.status = SUCCESS; order.status = PAID; pointsEarned = 3 (34.000đ, 1 điểm mỗi 10.000đ) | FR-08, FR-15 | INT-T06, INT-T13 | | |
| BT-28 | Gửi lại thanh toán cùng Idempotency-Key | `POST /payments`<br>token: khách A; có `Idempotency-Key` (cùng khóa với BT-27); body: `{"orderId":‹order1Id›,"method":"WALLET"}` | 200; replayed = true; cùng payment.id với BT-27; pointsBalance không tăng thêm | FR-09 | INT-T07 | | |
| BT-29 | Cùng Idempotency-Key, đổi phương thức | `POST /payments`<br>token: khách A; có `Idempotency-Key` (cùng khóa với BT-27); body: `{"orderId":‹order1Id›,"method":"CARD"}` | 409 | FR-09 | – | | |
| BT-30 | Thanh toán lại đơn đã PAID bằng khóa mới | `POST /payments`<br>token: khách A; có `Idempotency-Key`; body: `{"orderId":‹order1Id›,"method":"WALLET"}` | 400; message: Đơn đang ở trạng thái PAID, không thể thanh toán | FR-08, FR-10 | INT-T06 | | |
| BT-31 | Thanh toán đơn 3 thất bại (giả lập) (Trường simulate chỉ có vì thanh toán là mô phỏng (đề cho phép Ví/Thẻ mô phỏng).) | `POST /payments`<br>token: khách A; có `Idempotency-Key`; body: `{"orderId":‹order3Id›,"method":"CARD","simulate":"FAIL"}` | 200; payment.status = FAILED; order.status = PAYMENT_FAILED | FR-08 | INT-T06 | | |
| BT-32 | Thử lại thanh toán đơn 3 (thành công) | `POST /payments`<br>token: khách A; có `Idempotency-Key`; body: `{"orderId":‹order3Id›,"method":"CARD"}` | 200; order.status = PAID | FR-08, FR-10 | INT-T06 | | |
| BT-33 | Khách B thanh toán đơn của khách A | `POST /payments`<br>token: khách B; có `Idempotency-Key`; body: `{"orderId":‹order2Id›,"method":"WALLET"}` | 404 (đơn của người khác được coi như không tồn tại) | FR-08, NFR-02 | INT-T06 | | |

### 6. Trạng thái đơn

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-34 | Khách hàng tự đổi trạng thái | `PATCH /orders/{{order1Id}}/status`<br>token: khách A; body: `{"status":"PREPARING"}` | 403; message: Không đủ quyền thực hiện thao tác này | FR-11, NFR-02 | INT-T09 | | |
| BT-35 | Nhân viên đặt tay PAID | `PATCH /orders/{{order2Id}}/status`<br>token: nhân viên; body: `{"status":"PAID"}` | 400; message: STAFF không được chuyển đơn sang PAID; dùng POST /payments | FR-10, FR-11 | INT-T09 | | |
| BT-36 | Chuyển sai PENDING sang READY | `PATCH /orders/{{order2Id}}/status`<br>token: nhân viên; body: `{"status":"READY"}` | 400; message: Không thể chuyển đơn từ PENDING sang READY | FR-10 | INT-T08 | | |
| BT-37 | PAID sang PREPARING | `PATCH /orders/{{order1Id}}/status`<br>token: nhân viên; body: `{"status":"PREPARING"}` | 200; status = PREPARING | FR-10, FR-11 | INT-T09 | | |
| BT-38 | PREPARING sang READY | `PATCH /orders/{{order1Id}}/status`<br>token: nhân viên; body: `{"status":"READY"}` | 200; status = READY | FR-10, FR-11 | INT-T09 | | |
| BT-39 | READY sang COMPLETED | `PATCH /orders/{{order1Id}}/status`<br>token: nhân viên; body: `{"status":"COMPLETED"}` | 200; status = COMPLETED | FR-10, FR-11 | INT-T09 | | |
| BT-40 | Hủy đơn đã COMPLETED | `PATCH /orders/{{order1Id}}/status`<br>token: nhân viên; body: `{"status":"CANCELLED"}` | 400 (COMPLETED là trạng thái cuối) | FR-10 | INT-T08 | | |
| BT-41 | Hủy đơn 2 đang PENDING | `PATCH /orders/{{order2Id}}/status`<br>token: nhân viên; body: `{"status":"CANCELLED"}` | 200; status = CANCELLED | FR-10, FR-11 | INT-T11 | | |

### 7. Lịch sử đơn

| Mã | Ca test | Request | Kết quả mong đợi | Yêu cầu | Test tự động | Local | Production |
|---|---|---|---|---|---|---|---|
| BT-42 | Lịch sử đơn của khách A | `GET /orders/me`<br>token: khách A | 200; có đơn 1 (COMPLETED); mọi đơn có userId = khách A | FR-12 | INT-T10 | | |
| BT-43 | Lịch sử đơn của khách B | `GET /orders/me`<br>token: khách B | 200; mảng rỗng (khách B mới đăng ký, chưa đặt đơn) | FR-12 | INT-T10 | | |
| BT-44 | Khách B xem đơn của khách A | `GET /orders/{{order1Id}}`<br>token: khách B | 404 | FR-12, NFR-02 | INT-T10 | | |
| BT-45 | Khách hàng xem tất cả đơn | `GET /orders`<br>token: khách A | 403 | FR-11, NFR-02 | INT-T10 | | |
| BT-46 | Nhân viên xem tất cả đơn | `GET /orders`<br>token: nhân viên | 200; mảng đơn của mọi khách | FR-11 | INT-T10 | | |

## 4. Ca chỉ kiểm được bằng test tự động

Các ca cần nhiều yêu cầu gửi cùng lúc, không làm tay được trong Postman. Chạy bằng `npm run test:e2e` trong `apps/api` (README mục 10) hoặc xem kết quả job `api-e2e` của CI.

| Mã | Ca test | Yêu cầu | Test tự động |
|---|---|---|---|
| BT-A1 | 10 yêu cầu tạo đơn song song cùng Idempotency-Key chỉ tạo 1 đơn | FR-09 | INT-T07 "10 yêu cầu song song cùng key vẫn chỉ tạo 1 đơn" |
| BT-A2 | 20 người đặt song song khi kho còn 5: đúng 5 đơn thành công, kho về 0, không âm | FR-13 | INT-T11 "20 người đặt song song, kho 5 …" |
| BT-A3 | Đơn lỗi giữa chừng được rollback, kho không bị trừ | FR-13 | INT-T11 "đơn thất bại giữa chừng được rollback …" |
| BT-A4 | Hủy đơn đã PAID trừ lại điểm thưởng | FR-15 | INT-T13 "hủy đơn đã PAID trừ lại điểm thưởng" |

## 5. Ghi nhận kết quả chạy

| Lần | Ngày | Người chạy | Môi trường | Commit hoặc phiên bản | Request đạt | Assertion đạt | Ảnh minh chứng |
|---|---|---|---|---|---|---|---|
| 1 | | | Local | | /46 | /78 | `docs/as2/evidence/44-postman-runner-local.png` |
| 2 | | | Production | v0.1.3 | /46 | /78 | `docs/as2/evidence/45-postman-runner-production.png` |

**Chạy thử để kiểm tra kịch bản:** ngày 10/11/2026, collection được chạy bằng newman 2 lần liên tiếp trên bản sao local (commit `51d5cda`, PostgreSQL mới, dữ liệu seed): 46/46 request, 78/78 assertion đạt; thông báo lỗi của các ca 400/401/403/409 khớp với cột "Kết quả mong đợi". Lần chạy này chỉ để kiểm tra kịch bản đúng, không thay cho kết quả chính thức ở bảng trên do nhóm chạy và chụp.
