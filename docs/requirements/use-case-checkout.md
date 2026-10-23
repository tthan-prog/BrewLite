# Đặc tả use-case: UC-01 Đặt và thanh toán đơn hàng (Assignment 2 – Task 1.3)

> **Trạng thái: bản nháp để E hoàn thiện.** Đối chiếu với `srs.md` và `docs/diagrams/sequence-checkout.puml`.

| Mục | Nội dung |
|---|---|
| Mã | UC-01 |
| Tên | Đặt và thanh toán đơn hàng |
| Actor chính | Customer (khách hàng) |
| Actor phụ | Payment Service (mô phỏng) |
| Trigger | Khách bấm "Đặt đơn" trong giỏ hàng |
| Mã yêu cầu liên quan | FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10, FR-13, FR-14, FR-15, NFR-02, NFR-04 |

Sơ đồ use-case của phạm vi UC-01: `docs/diagrams/usecase-checkout.puml` (kết xuất `usecase-checkout.svg`); sơ đồ tổng quát toàn hệ thống: `docs/diagrams/usecase-overview.puml`.

## Tiền điều kiện

1. Khách đã đăng nhập (có JWT hợp lệ).
2. Giỏ hàng có ít nhất một món.

## Hậu điều kiện

- **Thành công:** đơn ở trạng thái PAID; tồn kho đã trừ; có bản ghi thanh toán; khách thấy xác nhận đơn.
- **Thanh toán thất bại:** đơn ở trạng thái PAYMENT_FAILED; giỏ hàng được giữ; khách có thể thử lại hoặc hủy.
- **Hết hàng hoặc lỗi:** không tạo đơn, tồn kho không đổi.

## Luồng chính

1. Khách mở giỏ hàng và bấm "Đặt đơn".
2. Giao diện gửi `POST /orders` kèm JWT.
3. API kiểm tra JWT và validate dữ liệu.
4. API mở transaction: kiểm tra và trừ tồn kho theo từng món, tạo `Order` (PENDING) và `OrderItem`, áp khuyến mãi nếu có, rồi commit.
5. API trả mã đơn; giao diện hiển thị màn hình thanh toán.
6. Khách chọn Ví hoặc Thẻ và xác nhận.
7. Giao diện gửi `POST /payments` kèm `Idempotency-Key`.
8. API gọi Payment Service; dịch vụ trả thành công.
9. API ghi `Payment`, chuyển đơn sang PAID.
10. API trả kết quả; giao diện hiển thị xác nhận đơn.

## Luồng thay thế

| # | Điều kiện | Xử lý |
|---|---|---|
| A1 | Khách nhập mã khuyến mãi hợp lệ ở bước 1 | Giá được giảm; tổng tiền cập nhật trước khi đặt đơn |
| A2 | Khách gửi lại thanh toán với cùng Idempotency-Key (mạng chập chờn) | API trả kết quả cũ, không tạo thanh toán thứ hai |
| A3 | Nhân viên (STAFF) hủy đơn ở trạng thái cho phép (PENDING, PAYMENT_FAILED hoặc PAID) | Đơn chuyển CANCELLED; tồn kho được hoàn lại; điểm thưởng đã cộng bị trừ lại |

## Luồng ngoại lệ

| # | Điều kiện | Xử lý |
|---|---|---|
| E1 | Chưa đăng nhập hoặc JWT hết hạn (bước 2–3) | API trả 401; giao diện chuyển sang đăng nhập; giỏ hàng được giữ |
| E2 | Dữ liệu không hợp lệ (bước 3) | API trả 400/422 với thông báo rõ ràng |
| E3 | Một món hết hàng hoặc không đủ số lượng (bước 4) | Transaction rollback; không tạo đơn; báo món nào hết |
| E4 | Mã khuyến mãi sai hoặc hết hạn | Từ chối mã; cho phép đặt đơn không mã |
| E5 | Payment Service trả thất bại (bước 8) | Đơn chuyển PAYMENT_FAILED; thông báo lỗi; giữ giỏ hàng; cho thử lại |
| E6 | Chuyển trạng thái không hợp lệ | API từ chối (400) và đơn giữ nguyên trạng thái |

## Giá trị nghiệp vụ

Đây là luồng sinh doanh thu của hệ thống; sai ở đây gây mất tiền hoặc sai tồn kho, vì vậy là use-case trọng tâm của Assignment 2 và Task 10 của Assignment 1.
