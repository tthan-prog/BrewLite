# Đặc tả yêu cầu phần mềm rút gọn – SRS (Assignment 2 – Task 1.2)

## 1. Yêu cầu chức năng

| Mã | Nhóm | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|---|
| FR-01 | Menu | Hệ thống hiển thị danh sách sản phẩm có tên, giá, ảnh (nếu có) | Must | `GET /products` trả danh sách; màn hình menu hiển thị đủ sản phẩm có trong seed |
| FR-02 | Menu | Hệ thống hiển thị các trạng thái loading, rỗng và lỗi của menu | Must | Mô phỏng API chậm, trả rỗng, trả lỗi thì UI hiện đúng từng trạng thái |
| FR-03 | Chi tiết | Xem chi tiết sản phẩm; chọn size (S/M/L) và topping | Must | `GET /products/:id` trả đủ tùy chọn; giá cập nhật theo lựa chọn (S +0, M +5.000, L +10.000) |
| FR-04 | Giỏ hàng | Thêm, sửa số lượng, xóa món; hiển thị tổng tiền | Must | Tổng tiền = Σ (đơn giá + phụ phí size + topping) × số lượng |
| FR-05 | Xác thực | Đăng ký và đăng nhập; phát JWT; mật khẩu băm bằng bcrypt | Must | Đăng nhập đúng nhận JWT; sai mật khẩu trả 401; DB không lưu mật khẩu thô |
| FR-06 | Xác thực | Chặn đặt đơn khi chưa đăng nhập | Must | `POST /orders` không có JWT trả 401 |
| FR-07 | Đặt đơn | Tạo đơn từ giỏ hàng, trạng thái PENDING; kiểm tra đủ nguyên liệu cho cả đơn (món có công thức) hoặc trừ `Product.stock` trong cùng transaction (món chưa có công thức) | Must | Đơn tạo đúng; thiếu nguyên liệu hoặc hết hàng thì từ chối (400) và không tạo đơn; với món có công thức, tạo đơn chưa trừ nguyên liệu |
| FR-08 | Thanh toán | Thanh toán Ví hoặc Thẻ mô phỏng; thành công → PAID, thất bại → PAYMENT_FAILED (API trả 200 kèm trạng thái đơn); thử lại được | Must | `POST /payments` đổi trạng thái đúng; thất bại giữ nguyên giỏ hàng |
| FR-09 | Thanh toán | Gửi lại yêu cầu thanh toán với cùng Idempotency-Key không tạo thêm thanh toán/đơn | Must | Hai request cùng khóa cho một kết quả và một bản ghi |
| FR-10 | Trạng thái đơn | Máy trạng thái đơn; chặn chuyển sai trạng thái | Must | PENDING → PAID/PAYMENT_FAILED/CANCELLED; PAID → PREPARING/CANCELLED; PREPARING → READY → COMPLETED; chuyển sai trả lỗi |
| FR-11 | Trạng thái đơn | Nhân viên cập nhật trạng thái đơn | Should | `PATCH /orders/:id/status` chỉ vai trò STAFF thực hiện được |
| FR-12 | Lịch sử | Khách xem lịch sử và chi tiết đơn của mình | Must | `GET /orders/me` chỉ trả đơn của người dùng hiện tại; `GET /orders/:id` chỉ chủ đơn hoặc STAFF xem được (người khác nhận 404) |
| FR-13 | Tồn kho | Nguyên liệu chỉ bị trừ khi thanh toán thành công (cập nhật có điều kiện trong cùng transaction); đặt và thanh toán đồng thời không làm tồn kho âm; hủy đơn chỉ hoàn phần đã trừ | Must | Test chạy N request đồng thời, số đơn thành công ≤ tồn kho; nếu kho hết đúng lúc thanh toán thì không trừ tiền, không trừ kho và đơn chuyển PAYMENT_FAILED; hủy đơn chưa thanh toán không đụng tới kho |
| FR-14 | Khuyến mãi | Áp mã khuyến mãi hợp lệ để giảm giá | Should | Mã hợp lệ giảm đúng; mã sai/hết hạn bị từ chối |
| FR-15 | Điểm thưởng | Cộng điểm khi đơn thanh toán thành công (PAID): 1 điểm / 10.000đ; hủy đơn đã PAID thì trừ lại; mỗi lần đổi điểm ghi một giao dịch điểm (`LoyaltyTransaction`) | Should | `User.points` tăng đúng số điểm khi đơn PAID và giảm lại khi hủy đơn đã PAID; có bản ghi `LoyaltyTransaction` loại EARN (và REVERSAL khi hủy) tương ứng |
| FR-16 | Quản trị | Giao diện quản lý sản phẩm và khuyến mãi | Could | Ngoài MVP |
| FR-17 | Thanh toán | Kết nối cổng thanh toán thật | Won't | Không kết nối cổng thanh toán thật (không có tiền thật). Mặc định thanh toán QR chạy giả lập; chế độ sandbox VNPay đã thử ngày 07/11/2026 đến trạng thái `PAID` qua Return URL; IPN và MoMo sandbox chưa kiểm chứng (xem `docs/as2/payment-qr-ingredients.md`) |

## 2. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|---|
| NFR-01 | Hiệu năng | `GET /products` phản hồi nhanh với dữ liệu seed | Should | Lần chậm thứ 19 trong 20 yêu cầu `GET /products` dưới 500 ms với dữ liệu mẫu (12 sản phẩm), đo cục bộ bằng Docker Compose. Kết quả ngày 24/10/2026: 19,7 ms. Ghi chú production (Render Singapore, gói Free, đo từ Việt Nam, 30 yêu cầu): byte đầu tiên về sau 0,43 đến 0,47 giây ở 24 yêu cầu và 0,74 đến 0,78 giây ở 6 yêu cầu, trong đó khoảng 0,25 giây là độ trễ mạng một vòng |
| NFR-02 | Bảo mật | Mật khẩu băm; JWT có hạn; kiểm tra phân quyền theo vai trò | Must | Test xác thực và phân quyền; không có mật khẩu thô trong DB hoặc log |
| NFR-03 | Bảo mật | Secret không nằm trong repository hoặc log CI | Must | Quét repo/log không thấy secret; `.env` nằm trong `.gitignore` |
| NFR-04 | Bảo mật | Validate dữ liệu đầu vào ở cả frontend và backend | Must | Dữ liệu sai trả lỗi 4xx rõ ràng |
| NFR-05 | Tính khả dụng | Giao diện mobile-first, dùng được trên màn hình điện thoại | Must | Kiểm tra trên viewport 360–414 px, không cuộn ngang |
| NFR-06 | Tính khả dụng | Thông báo lỗi dễ hiểu, không lộ chi tiết kỹ thuật | Should | Lỗi hiển thị bằng tiếng Việt, không in stack trace |
| NFR-07 | Khả năng triển khai | Chạy toàn bộ hệ thống bằng `docker compose up` | Must | Người ngoài nhóm chạy được theo README |
| NFR-08 | Khả năng triển khai | CI chạy lint, test, build cho mọi PR; pipeline CD triển khai và smoke test | Must | Có log pipeline thành công và một lần phát hiện lỗi |
| NFR-09 | Khả năng triển khai | `GET /health` và log để vận hành | Must | Health trả `status: ok`; smoke test gọi health sau deploy |
| NFR-10 | Độ tin cậy | Migration và seed tái tạo được database | Must | Chạy migration + seed trên DB trống cho kết quả giống nhau |
| NFR-11 | Bảo trì | Mã nguồn có lint, định dạng và test tự động | Should | CI chạy lint và test |

## 3. Use-case tổng quát

Xem sơ đồ `docs/diagrams/usecase-overview.puml` (đã có, kèm bản kết xuất `usecase-overview.svg`). Actor: Khách hàng, Nhân viên, Dịch vụ thanh toán (mô phỏng). Use case: Xem menu, Xem chi tiết sản phẩm, Quản lý giỏ hàng, Đăng ký tài khoản, Đăng nhập, **Đặt đơn**, **Thanh toán đơn** (hai use case của UC-01), Xem lịch sử đơn, Đổi quà bằng điểm, Cập nhật trạng thái đơn, Hủy đơn, Quản lý nguyên liệu.

