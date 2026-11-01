# ADR-005: Kiểm soát tồn kho bằng cập nhật có điều kiện trong transaction

- **Trạng thái:** Đã chốt
- **Ngày:** 20/10/2026 (cập nhật 30/10/2026 theo logic trừ nguyên liệu khi thanh toán)

## Bối cảnh

Nhiều khách đặt cùng lúc không được làm tồn kho âm (FR-13). Đề Assignment 1 gợi ý khóa lạc quan (cột version), nhưng không bắt buộc kỹ thuật.

## Quyết định

Kỹ thuật không đổi: cập nhật có điều kiện `UPDATE ... SET stock = stock - n WHERE id = ? AND stock >= n` trong transaction, nếu không có dòng nào được cập nhật thì rollback.

Thời điểm trừ kho đã thay đổi so với bản đầu (trừ khi tạo đơn):

- Món có công thức: tồn kho là nguyên liệu (`Ingredient.stock`). Khi tạo đơn chỉ kiểm tra đủ nguyên liệu cho cả đơn và ghi nhu cầu vào `OrderIngredientUse` (`consumed=false`). Nguyên liệu chỉ bị trừ khi đơn thanh toán thành công, trong cùng transaction chốt thanh toán, rồi đánh dấu `consumed=true`. Nếu kho vừa hết lúc đó thì giao dịch hủy: không trừ tiền, không trừ kho, đơn chuyển PAYMENT_FAILED.
- Món chưa có công thức: vẫn trừ `Product.stock` khi tạo đơn như bản đầu.
- Hoàn kho khi hủy: chỉ hoàn các dòng đã trừ (`consumed=true`), một lần; hủy đơn chưa thanh toán không đụng tới kho.

## Hệ quả

- Không cần cột version; PostgreSQL bảo đảm tính nguyên tử của câu lệnh cập nhật.
- Test (c): chạy N yêu cầu đồng thời, số đơn thành công không vượt tồn kho.
- Đơn PENDING hoặc PAYMENT_FAILED không giữ nguyên liệu, nên không làm khách khác hết hàng; đổi lại có thể một đơn đã tạo nhưng thanh toán thất bại vì kho vừa hết (đã xử lý như trên).
- Test (c) và các test nguyên liệu nằm ở `apps/api/test/qr-ingredients.e2e-spec.ts` và `assign1.e2e-spec.ts`.
