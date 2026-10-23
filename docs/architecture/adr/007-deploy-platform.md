# ADR-007: Nền tảng triển khai production

- **Trạng thái:** Đã chọn mặc định: **Render** (23/10/2026). A xác nhận hoặc đổi trước khi deploy thật.
- **Người phụ trách:** A

## Bối cảnh

Cần URL frontend và API truy cập qua HTTPS, DB không public, secret ngoài repository. Không có URL production hoạt động lúc chấm thì phần triển khai của A2-Task 5 không được tính.

## Tiêu chí

| Tiêu chí | Lý do |
|---|---|
| Chạy được container Docker (API và web) | Dự án đã có Dockerfile |
| DB PostgreSQL quản lý sẵn, kết nối nội bộ, không public | Yêu cầu của đề |
| HTTPS tự động | Yêu cầu của đề |
| Triển khai từ CI bằng secret | Pipeline CD |
| Chi phí trong khoảng miễn phí hoặc rất thấp | Sinh viên |
| Có health check và xem log | Smoke test, vận hành |
| Thời gian thiết lập ngắn | Còn dưới 1 tuần |

## Quyết định

Dùng **Render**: hai Web Service chạy **image Docker lấy từ GHCR** (`brewlite-api`, `brewlite-web`) và một **PostgreSQL** của Render, kết nối bằng Internal Database URL. CD gọi **Deploy Hook** của từng service kèm `imgURL` (tag `sha-...`) rồi chạy smoke test. HTTPS do Render cấp tự động.

## Điều khoản gói miễn phí (kiểm tra ngày 23/10/2026, nguồn: docs.render.com/free)

- Web service miễn phí **tự tắt sau 15 phút không có truy cập**, khởi động lại mất khoảng 1 phút.
- 750 giờ chạy miễn phí mỗi tháng cho cả workspace. Hai service chạy liên tục sẽ vượt 750 giờ, nhưng vì có tự tắt khi rảnh nên đủ cho đợt chấm; cần theo dõi.
- Một PostgreSQL miễn phí, tối đa 1 GB, **hết hạn sau 30 ngày** (có 14 ngày để nâng cấp trước khi xóa), không có sao lưu.
- Image-backed service **không tự deploy** khi có image mới: phải dùng Deploy Hook (đã đưa vào `cd.yml`). Image public trên GHCR không cần credential.
- Trang tài liệu không nêu hạn chế nào cho image deploy trên gói miễn phí, nhưng cũng không xác nhận rõ; cần thử thật.

## Hệ quả và rủi ro

- Lần gọi đầu có thể chậm do khởi động nguội: smoke test chờ tối đa 5 phút; trước khi demo nên mở trang web một lần để "làm nóng".
- DB hết hạn sau 30 ngày: đủ cho đợt chấm; nếu giảng viên chấm muộn thì tạo DB mới hoặc nâng cấp.
- Phương án dự phòng nếu Render không phù hợp: VPS tự quản chạy Docker Compose + reverse proxy (Caddy) lấy HTTPS tự động; khi đó phải cập nhật `cd.yml`, `deployment.md` và sơ đồ deployment.
- Chưa deploy thử thật: mọi bước trong `deployment.md` ghi **[Chưa kiểm chứng]** cho đến khi A chạy xong và điền kết quả.
