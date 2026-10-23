# ADR-004: Thanh toán mô phỏng và Idempotency-Key

- **Trạng thái:** Đã chốt
- **Ngày:** 20/10/2026

## Bối cảnh

Đề yêu cầu thanh toán Ví/Thẻ mô phỏng (FR-08) và chống thanh toán lặp khi client gửi lại (FR-09). Sequence diagram có lifeline "Payment Service".

## Quyết định

- Payment Service là một **module riêng trong NestJS**, có giao diện nội bộ `charge(orderId, amount, method)` trả thành công hoặc thất bại theo kịch bản (ví dụ theo số thẻ hoặc cờ cấu hình để kiểm thử).
- `POST /payments` bắt buộc header `Idempotency-Key`. Bảng `payment` có ràng buộc duy nhất trên khóa này; cùng khóa thì trả kết quả đã lưu, không gọi dịch vụ lần hai.
- Đơn chuyển PAID hoặc PAYMENT_FAILED chỉ qua máy trạng thái (ADR liên quan: FR-10).

## Hệ quả

- Chạy được test (b): cùng Idempotency-Key chỉ tạo một thanh toán và một đơn.
- Không phản ánh lỗi mạng của dịch vụ ngoài thật; chấp nhận vì cổng thật nằm ngoài phạm vi (Won't).
