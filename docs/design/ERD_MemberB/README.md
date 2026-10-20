# ERD - BrewLite

Đây là bản ERD (sơ đồ quan hệ dữ liệu) cho phần database (cơ sở dữ liệu) của Member B.

## Quan hệ chính
- User 1-N Order.
- Order 1-N OrderItem.
- Product 1-N OrderItem.
- OrderItem N-N Topping thông qua OrderItemTopping.
- Promotion có thể được áp dụng cho Order.

## Điểm cần team xác nhận
- Có dùng `OrderItemTopping` đúng như bản thiết kế này hay không.
- Kiểu dữ liệu ID.
- Enum cho role/status/type.
- Cách lưu size và giá sau khi cộng phụ thu.
- Cách liên kết Promotion với Order: qua `promoCode` hay `promotionId`.

Các điểm trên nên được chốt trước khi migration chính thức.
