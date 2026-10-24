# ERD - BrewLite

Đây là bản ERD (Entity Relationship Diagram) cho phần database của Member B, được cập nhật để khớp với Prisma schema hiện tại trong `apps/api/prisma/schema.prisma`.

## Quan hệ chính

- User 1-N Order.
- User 1-N Payment.
- User 1-N LoyaltyTransaction.
- User 1-N IdempotencyRecord.
- Order 1-N OrderItem.
- Order 1-N Payment.
- Order 1-N LoyaltyTransaction.
- Order 1-0..1 IdempotencyRecord.
- Product 1-N OrderItem.
- OrderItem N-N Topping thông qua OrderItemTopping.
- Promotion được áp dụng cho Order thông qua `promoCode` (không sử dụng `promotionId`).

## Các điểm đã chốt theo schema hiện tại

- `OrderItemTopping` được sử dụng để biểu diễn quan hệ N-N giữa `OrderItem` và `Topping`.
- ID sử dụng kiểu `Int`.
- `role`, `status`, `type` được biểu diễn bằng các enum tương ứng trong Prisma schema.
- `OrderItem.size` được lưu dưới dạng `String`.
- `OrderItem.unitPrice` lưu giá của sản phẩm tại thời điểm đặt hàng.
- `Payment` lưu thông tin phương thức, trạng thái, số tiền và idempotency/request hash.
- `User.points` lưu số dư điểm hiện tại.
- `LoyaltyTransaction` lưu lịch sử cộng/trừ điểm.
- `IdempotencyRecord` dùng để chống tạo đơn trùng.
- `Promotion` được xác định thông qua `Order.promoCode`; hiện tại `Order` không có foreign key `promotionId`.

## Các bảng chính

- `USER`
- `PRODUCT`
- `TOPPING`
- `ORDER`
- `ORDER_ITEM`
- `ORDER_ITEM_TOPPING`
- `PAYMENT`
- `PROMOTION`
- `LOYALTY_TRANSACTION`
- `IDEMPOTENCY_RECORD`

## Nguồn đối chiếu

ERD được đối chiếu với:

`apps/api/prisma/schema.prisma`

File sơ đồ:

`BrewLite_ERD_MemberB.mmd`

File ảnh ERD được render từ Mermaid.