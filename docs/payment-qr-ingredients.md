# Thanh toán QR, điểm thưởng, quà đổi điểm và nguyên liệu (nhánh `feature/qr-payment-ingredients`)

Tài liệu mô tả phần mở rộng sau Assignment 1. Chưa merge vào `main`; mọi thông tin dưới đây đã được kiểm chứng bằng test trong nhánh này, trừ phần ghi rõ "chưa kiểm chứng".

## 1. Nguyên liệu và công thức

- Bảng `Ingredient` (tên, đơn vị, tồn kho), `RecipeItem` (món X dùng bao nhiêu nguyên liệu Y cho **1 ly size S**), `ToppingRecipeItem` (topping X dùng bao nhiêu nguyên liệu Y cho **1 phần**), `OrderIngredientUse` (lượng đã trừ cho từng đơn, để hoàn đúng khi hủy).
- **Nguyên liệu chỉ bị trừ khi thanh toán thành công.** Tạo đơn chỉ *kiểm tra* (cộng dồn nhu cầu của cả đơn, các dòng cùng món/khác size cộng lại; thiếu → `400` "Không đủ nguyên liệu …") và ghi nhu cầu vào `OrderIngredientUse` (`consumed=false`). Đơn đang chờ thanh toán, thanh toán thất bại hoặc bị hủy **không giữ và không làm mất nguyên liệu**.
- Khi đơn chuyển sang PAID, hệ thống trừ bằng `UPDATE ... WHERE stock >= cần` (cùng transaction với việc chốt thanh toán, cùng cách ADR-005) rồi đánh dấu `consumed=true`. Nếu lúc đó kho vừa hết (do đơn khác thanh toán trước): giao dịch bị hủy nên **không trừ tiền, không trừ kho**, đơn chuyển PAYMENT_FAILED với lý do (`failureReason` ở Ví/Thẻ, lỗi 400 ở xác nhận QR); khách thử lại khi có hàng. Cổng sandbox (VNPay/MoMo) đã thu tiền ở cổng nên trường hợp này cần hoàn tiền thủ công (chưa kiểm chứng với cổng thật).
- Hủy đơn chỉ hoàn nguyên liệu của các dòng đã trừ (`consumed=true`), một lần; hủy đơn chưa thanh toán không đụng tới kho.
- Món **chưa có công thức** vẫn dùng `Product.stock` như cũ (để không phá dữ liệu/test cũ). Seed gán công thức cho cả 12 món.
- **Theo size**: nguyên liệu của món nhân hệ số S 100%, M 125%, L 150%, làm tròn lên (`ceil`). Ví dụ món test: S=30, M=38, L=45.
- **Theo topping**: mỗi phần topping trừ nguyên liệu riêng (không nhân theo size), nhân số phần × số ly.
- `GET /products` trả thêm `recipe` (size S), `recipeBySize {S,M,L}`, `maxQuantity`, `available`; `GET /toppings` trả kèm công thức topping.
- `POST /products/availability` (công khai): gửi giỏ hiện tại + lựa chọn (size, topping) → chỉ trả `{maxAdditional, perCup}` (số ly có thể đặt thêm và nguyên liệu mỗi ly), **không lộ tồn kho**. Trang menu dùng để hiển thị "Có thể đặt thêm tối đa N ly" và chặn nút +/Thêm vào giỏ.
- **Đường theo % (mới)**: nguyên liệu có `sugarScaled=true` (hiện chỉ "Đường") nhân theo mức đường chọn (100% = công thức, làm tròn lên). Tương tự, "Đá viên" (`iceScaled=true`) nhân theo mức đá (0% = không trừ). Mọi món có công thức đường/đá; mức đường/đá chọn được lưu vào `OrderItem.sugar/ice`.
- **Giới hạn 50 ly/dòng** (`MAX_ITEM_QUANTITY`) áp dụng ở API (DTO) và giỏ hàng. `POST /products/cart-check` (công khai) trả số ly tối đa cho từng dòng giỏ; giỏ hàng dùng nó nên không thể bấm + vượt mức đặt được. `POST /products/quote` (công khai) trả tạm tính/giảm giá/tổng và lý do mã khuyến mãi không hợp lệ — giá cuối do máy chủ tính.
- **Đơn chưa thanh toán tự hủy** sau `UNPAID_ORDER_TTL_MINUTES` (mặc định 15; quét mỗi 60 giây; bỏ qua đơn còn QR đang chờ) và trả lại lượt dùng mã khuyến mãi (nguyên liệu không bị giữ nên không cần hoàn). Hủy đơn đã PAID hoàn tiền vào tài khoản TEST đã dùng, trừ lại điểm, hoàn nguyên liệu.
- Ô "Giả lập thanh toán thất bại" chỉ hiện với Ví/Thẻ (chức năng kiểm thử). Với QR, muốn thất bại thì dùng tài khoản ít tiền, sai PIN hoặc để QR hết hạn. Giao diện thanh toán không hiện chú thích demo; mô tả nằm ở tài liệu này.
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

**Chạy local và quét bằng điện thoại thật (điện thoại cùng Wi-Fi, mở cổng 3000 và 3001 trên tường lửa):** không cần sửa `.env` khi đổi mạng.
- API tự dò IP mạng nội bộ của máy (ưu tiên `192.168.x.x`, rồi `10.x.x.x`, rồi `172.16-31.x.x`; bỏ card ảo Docker/WSL/VPN) và dùng cho mã QR khi `PUBLIC_WEB_URL` trống hoặc là `localhost`. Tắt bằng `PUBLIC_WEB_AUTO=false`. Không áp dụng khi `NODE_ENV=production`.
- Web tự gọi API ở **cùng máy chủ với trang đang mở** (cổng 3001) nếu `NEXT_PUBLIC_API_URL` để trống — nên đừng đặt biến này khi chạy local.
- CORS: khi không phải production, API cho phép origin `localhost` và IP mạng nội bộ; `next dev` tự cho phép mọi IP LAN của máy (`allowedDevOrigins`).
- Giới hạn: máy có nhiều card mạng thật có thể dò nhầm IP (khi đó đặt tay `PUBLIC_WEB_URL=http://<IP>:3000`); Wi-Fi bật cách ly thiết bị thì điện thoại không vào được laptop. Trên Render, đặt `PUBLIC_WEB_URL=https://brewlite-web.onrender.com` và `NEXT_PUBLIC_API_URL` tới API công khai.

**Chưa kiểm chứng:** việc gọi cổng VNPay/MoMo sandbox thật (cần mã đối tác do họ cấp; sandbox không truy cập được từ môi trường phát triển). Phần ký/xác minh được test bằng unit test theo đặc tả công khai của họ; cần thử với khóa thật trước khi tin vào chế độ sandbox.

## 4. Điểm thưởng và đổi quà

- 1 điểm / 10.000 ₫ (như cũ). Điểm cộng khi đơn PAID, trừ lại khi hủy đơn đã PAID.
- `GET /rewards` (công khai), `GET /rewards/me` (điểm, lịch sử, quà đã đổi), `POST /rewards/:id/redeem`: trừ điểm bằng `UPDATE ... WHERE points >= giá` nên không âm điểm kể cả khi bấm đồng thời; trả mã `GIFT-XXXXXXXX` để nhận quà tại quầy.
- Trang `/rewards` và dòng "+N điểm" ở trang xác nhận/trang quét QR.
- Giới hạn: mã quà chưa tự áp dụng vào đơn và chưa có màn hình nhân viên "đánh dấu đã dùng".
- Seed cho `customer@brewlite.com` 40 điểm khởi đầu để demo đổi quà.

## 5. Migration và kiểm thử

- Migration `20261029020000_consume_ingredients_on_payment`: cột `OrderIngredientUse.consumed` (đơn cũ chưa hủy coi như đã trừ).
- Migration `20261029010000_add_ice_scaling`: cột `Ingredient.iceScaled`, nguyên liệu "Đá viên", công thức đá cho 12 món, thêm đường cho 5 món.
- Migration `20261029000000_add_item_options_and_sugar_scaling` thêm `OrderItem.sugar/ice`, `Ingredient.sugarScaled`.
- Migration `20261027000000_add_qr_payment_ingredients_rewards` chỉ thêm (không xóa/sửa cột cũ). Mở rộng enum `PaymentMethod` (BANK, MOMO, VNPAY).
- Test mới: `apps/api/test/qr-ingredients.e2e-spec.ts` (22 test, gồm đua đồng thời), `src/payments/gateways/gateways.spec.ts` (6 test), Playwright `E2E-T05` (quét QR bằng trình duyệt thứ hai).
- Bổ sung: `apps/api/test/realism.e2e-spec.ts` (16 test: đường, giỏ, quote, tự hủy, hoàn tiền). Kết quả lần chạy gần nhất: API unit 36, API e2e 81, Playwright 10 (thêm E2E-T06 giới hạn giỏ, E2E-T07 ô thất bại).
