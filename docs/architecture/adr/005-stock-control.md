# ADR-005: Kiểm soát tồn kho bằng cập nhật có điều kiện trong transaction

- **Trạng thái:** Đã chốt (nhóm tự chọn; đã nêu trong tin nhắn hỏi giảng viên)
- **Ngày:** 20/10/2026

## Bối cảnh

Nhiều khách đặt cùng lúc không được làm tồn kho âm (FR-13). Đề Assignment 1 gợi ý khóa lạc quan (cột version), nhưng không bắt buộc kỹ thuật.

## Quyết định

Trong transaction tạo đơn, với mỗi món chạy `UPDATE product SET stock = stock - n WHERE id = ? AND stock >= n`. Nếu không có dòng nào được cập nhật thì rollback và báo hết hàng. Tồn kho chỉ tính trên `Product.stock`; hoàn lại khi đơn chuyển CANCELLED.

## Hệ quả

- Không cần cột version; PostgreSQL bảo đảm tính nguyên tử của câu lệnh cập nhật.
- Test (c): chạy N yêu cầu đồng thời, số đơn thành công không vượt tồn kho.
- Hạn chế: đơn PAYMENT_FAILED giữ tồn kho đến khi bị hủy; chấp nhận trong phạm vi bài.
