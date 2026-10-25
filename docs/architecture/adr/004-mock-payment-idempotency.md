# ADR-004: Thanh toán mô phỏng và Idempotency-Key

- **Trạng thái:** Đã chốt
- **Ngày:** 20/10/2026

## Bối cảnh

Đề yêu cầu thanh toán Ví/Thẻ mô phỏng (FR-08) và chống thanh toán lặp khi client gửi lại (FR-09). Sequence diagram có lifeline "Payment Service".

## Quyết định

- Payment Service được triển khai dưới dạng **module trong NestJS**, chịu trách nhiệm xử lý thanh toán mô phỏng Ví/Thẻ.
- `POST /payments` bắt buộc header `Idempotency-Key`.
- Mỗi payment lưu `userId`, `idempotencyKey` và `requestHash`. Cơ sở dữ liệu đặt ràng buộc duy nhất trên cặp `userId + idempotencyKey`.
- Nếu cùng `userId` và `Idempotency-Key` được gửi lại với cùng nội dung request, hệ thống trả lại kết quả payment đã lưu và không tạo payment mới.
- Nếu cùng `userId` và `Idempotency-Key` nhưng nội dung request khác (`requestHash` khác), hệ thống từ chối request do xung đột idempotency.
- Payment có thể được mô phỏng thành công hoặc thất bại thông qua tham số `simulate`.
- Khi payment thành công, order chuyển sang `PAID`; khi payment thất bại, order chuyển sang `PAYMENT_FAILED`. Việc chuyển trạng thái được thực hiện thông qua máy trạng thái của `OrdersService`.
- Cơ chế idempotency của payment độc lập với cơ chế idempotency khi tạo order (`IdempotencyRecord`).

## Hệ quả

- Cùng một `userId` và `Idempotency-Key` không tạo nhiều payment cho cùng một request.
- Request dùng lại idempotency key nhưng có nội dung khác sẽ bị phát hiện và từ chối.
- Payment có thể kiểm thử được cả kịch bản thành công và thất bại mà không cần cổng thanh toán thật.
- Không phản ánh đầy đủ độ trễ hoặc lỗi mạng của dịch vụ thanh toán bên ngoài; chấp nhận vì cổng thanh toán thật nằm ngoài phạm vi (Won't).
