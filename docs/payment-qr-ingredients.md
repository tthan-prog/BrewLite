# Thanh toán QR, điểm thưởng, quà đổi điểm và nguyên liệu (nhánh `feature/qr-payment-ingredients`)

Tài liệu mô tả phần mở rộng sau Assignment 1. Chưa merge vào `main`; mọi thông tin dưới đây đã được kiểm chứng bằng test trong nhánh này, trừ phần ghi rõ "chưa kiểm chứng".

## 1. Nguyên liệu và công thức

- Bảng `Ingredient` (tên, đơn vị, tồn kho), `RecipeItem` (món X dùng bao nhiêu nguyên liệu Y cho **1 ly size S**), `ToppingRecipeItem` (topping X dùng bao nhiêu nguyên liệu Y cho **1 phần**), `OrderIngredientUse` (lượng đã trừ cho từng đơn, để hoàn đúng khi hủy).
- Khi tạo đơn, hệ thống cộng dồn nhu cầu nguyên liệu của **cả đơn** (các dòng cùng món/khác size cộng lại) rồi trừ bằng `UPDATE ... WHERE stock >= cần` trong cùng transaction (cùng cách ADR-005). Không đủ → `400` "Không đủ nguyên liệu …", không trừ gì cả.
- Hủy đơn hoàn lại đúng lượng nguyên liệu đã trừ (một lần).
- Món **chưa có công thức** vẫn dùng `Product.stock` như cũ (để không phá dữ liệu/test cũ). Seed gán công thức cho cả 12 món.
- **Theo size**: nguyên liệu của món nhân hệ số S 100%, M 125%, L 150%, làm tròn lên (`ceil`). Ví dụ món test: S=30, M=38, L=45.
- **Theo topping**: mỗi phần topping trừ nguyên liệu riêng (không nhân theo size), nhân số phần × số ly.
- `GET /products` trả thêm `recipe` (size S), `recipeBySize {S,M,L}`, `maxQuantity`, `available`; `GET /toppings` trả kèm công thức topping.
- `POST /products/availability` (công khai): gửi giỏ hiện tại + lựa chọn (size, topping) → chỉ trả `{maxAdditional}` (số ly có thể đặt thêm), **không lộ tồn kho**. Trang menu dùng để hiển thị "Có thể đặt thêm tối đa N ly" và chặn nút +/Thêm vào giỏ.
- Trang chi tiết món hiển thị nguyên liệu mỗi ly đã gộp theo size + topping đang chọn.
- STAFF (nhân viên/quản lý; không có vai trò ADMIN riêng): `GET /ingredients` trả `usedBy` (món/topping dùng và định lượng) và `cupsRemaining` (số ly size S còn làm được theo nguyên liệu đó); `PATCH /ingredients/:id/restock {quantity}`; giao diện `/staff/ingredients` có cờ "Sắp hết" (<10 ly) / "Hết". Khách bị từ chối (403 ở API; trang hiện thông báo).

## 2. Tài khoản thanh toán TEST (seed, tiền giả, PIN chung `123456`)

| Nhà cung cấp | Số tài khoản / SĐT | Số dư |
|---|---|---|
| BANK | 0123456789 | 5.000.000 |
| BANK | 0987654321 (số dư thấp, để thử lỗi) | 10.000 |
| MOMO | 0900000001 | 2.000.000 |
| MOMO | 0900000002 (số dư thấp) | 5.000 |
| VNPAY | 0911000001 | 3.000.000 |
| VNPAY | 0911000002 (số dư thấp) | 8.000 |

`GET /payments/test-accounts` liệt kê (không trả PIN). PIN lưu dạng băm bcrypt.

## 3. Luồng thanh toán QR

1. Web tạo đơn (PENDING) rồi gọi `POST /payments/intents {orderId, provider}` → nhận `qrContent`, `expiresAt`, `mode`.
2. Web vẽ QR từ `qrContent` và hỏi `GET /payments/intents/:token` mỗi 2 giây.
3. **Chế độ SIMULATED** (mặc định): QR chứa `PUBLIC_WEB_URL/pay/:token`. Điện thoại quét → trang `/pay/:token` → chọn tài khoản test + PIN → `POST /payments/intents/:token/confirm`. Server trừ số dư tài khoản test, ghi `Payment`, chuyển đơn PAID, cộng điểm; máy tính tự sang trang xác nhận.
4. **Chế độ SANDBOX**: bật khi đặt biến môi trường `VNPAY_TMN_CODE`+`VNPAY_HASH_SECRET` (VNPay) hoặc `MOMO_PARTNER_CODE`+`MOMO_ACCESS_KEY`+`MOMO_SECRET_KEY` (MoMo). Server ký yêu cầu (HMAC), QR trỏ tới cổng sandbox; cổng gọi lại `GET /payments/vnpay/return|ipn`, `POST /payments/momo/ipn`; server xác minh chữ ký và số tiền rồi mới chốt đơn.
5. An toàn: chốt thanh toán bằng `UPDATE ... WHERE status='PENDING'` (gọi lặp/IPN lặp chỉ thắng một lần); QR hết hạn sau `PAYMENT_QR_TTL_MINUTES`; tạo QR mới làm QR cũ vô hiệu; sai PIN và sai tài khoản dùng chung một thông báo.
6. `POST /payments` (Ví/Thẻ mô phỏng cũ) vẫn dùng được và nay trả thêm `pointsEarned`, `pointsBalance`.

**Chạy local và quét bằng điện thoại thật:** đặt `PUBLIC_WEB_URL=http://<IP-LAN-máy-bạn>:3000` (điện thoại cùng Wi-Fi), và `NEXT_PUBLIC_API_URL=http://<IP-LAN>:3001` cho web để điện thoại gọi được API; thêm `FRONTEND_ORIGIN` tương ứng cho CORS. Trên Render, đặt `PUBLIC_WEB_URL=https://brewlite-web.onrender.com`.

**Chưa kiểm chứng:** việc gọi cổng VNPay/MoMo sandbox thật (cần mã đối tác do họ cấp; sandbox không truy cập được từ môi trường phát triển). Phần ký/xác minh được test bằng unit test theo đặc tả công khai của họ; cần thử với khóa thật trước khi tin vào chế độ sandbox.

## 4. Điểm thưởng và đổi quà

- 1 điểm / 10.000 ₫ (như cũ). Điểm cộng khi đơn PAID, trừ lại khi hủy đơn đã PAID.
- `GET /rewards` (công khai), `GET /rewards/me` (điểm, lịch sử, quà đã đổi), `POST /rewards/:id/redeem`: trừ điểm bằng `UPDATE ... WHERE points >= giá` nên không âm điểm kể cả khi bấm đồng thời; trả mã `GIFT-XXXXXXXX` để nhận quà tại quầy.
- Trang `/rewards` và dòng "+N điểm" ở trang xác nhận/trang quét QR.
- Giới hạn: mã quà chưa tự áp dụng vào đơn và chưa có màn hình nhân viên "đánh dấu đã dùng".
- Seed cho `customer@brewlite.com` 40 điểm khởi đầu để demo đổi quà.

## 5. Migration và kiểm thử

- Migration `20261027000000_add_qr_payment_ingredients_rewards` chỉ thêm (không xóa/sửa cột cũ). Mở rộng enum `PaymentMethod` (BANK, MOMO, VNPAY).
- Test mới: `apps/api/test/qr-ingredients.e2e-spec.ts` (22 test, gồm đua đồng thời), `src/payments/gateways/gateways.spec.ts` (6 test), Playwright `E2E-T05` (quét QR bằng trình duyệt thứ hai).
