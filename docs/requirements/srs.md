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
| FR-07 | Đặt đơn | Tạo đơn từ giỏ hàng, trạng thái PENDING, trừ tồn kho trong cùng transaction | Must | Đơn tạo đúng; `stock` giảm; hết hàng thì từ chối và không tạo đơn |
| FR-08 | Thanh toán | Thanh toán Ví hoặc Thẻ mô phỏng; thành công → PAID, thất bại → PAYMENT_FAILED (API trả 200 kèm trạng thái đơn); thử lại được | Must | `POST /payments` đổi trạng thái đúng; thất bại giữ nguyên giỏ hàng |
| FR-09 | Thanh toán | Gửi lại yêu cầu thanh toán với cùng Idempotency-Key không tạo thêm thanh toán/đơn | Must | Hai request cùng khóa cho một kết quả và một bản ghi |
| FR-10 | Trạng thái đơn | Máy trạng thái đơn; chặn chuyển sai trạng thái | Must | PENDING → PAID/PAYMENT_FAILED/CANCELLED; PAID → PREPARING/CANCELLED; PREPARING → READY → COMPLETED; chuyển sai trả lỗi |
| FR-11 | Trạng thái đơn | Nhân viên cập nhật trạng thái đơn | Should | `PATCH /orders/:id/status` chỉ vai trò STAFF thực hiện được |
| FR-12 | Lịch sử | Khách xem lịch sử và chi tiết đơn của mình | Must | `GET /orders/me` chỉ trả đơn của người dùng hiện tại; `GET /orders/:id` chỉ chủ đơn hoặc STAFF xem được (người khác nhận 404) |
| FR-13 | Tồn kho | Đặt đồng thời không làm tồn kho âm; hủy đơn hoàn lại tồn kho | Must | Test chạy N request đồng thời, số đơn thành công ≤ tồn kho |
| FR-14 | Khuyến mãi | Áp mã khuyến mãi hợp lệ để giảm giá | Should | Mã hợp lệ giảm đúng; mã sai/hết hạn bị từ chối |
| FR-15 | Điểm thưởng | Cộng điểm khi đơn thanh toán thành công (PAID): 1 điểm / 10.000đ; hủy đơn đã PAID thì trừ lại; mỗi lần đổi điểm ghi một giao dịch điểm (`LoyaltyTransaction`) | Should | `User.points` tăng đúng số điểm khi đơn PAID và giảm lại khi hủy đơn đã PAID; có bản ghi `LoyaltyTransaction` loại EARN (và REVERSAL khi hủy) tương ứng |
| FR-16 | Quản trị | Giao diện quản lý sản phẩm và khuyến mãi | Could | Ngoài MVP |
| FR-17 | Thanh toán | Kết nối cổng thanh toán thật | Won't | Không thực hiện |

## 2. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận |
|---|---|---|---|---|
| NFR-01 | Hiệu năng | `GET /products` phản hồi nhanh với dữ liệu seed | Should | [điền ngưỡng sau khi đo, ví dụ p95 dưới 500 ms trên môi trường production] |
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

Xem sơ đồ `docs/diagrams/usecase-overview.puml` (cần vẽ). Actor: Customer, Staff, Payment Service (mô phỏng). Use-case: Xem menu, Xem chi tiết, Quản lý giỏ hàng, Đăng ký/Đăng nhập, **Đặt và thanh toán đơn hàng**, Xem lịch sử đơn, Cập nhật trạng thái đơn.

