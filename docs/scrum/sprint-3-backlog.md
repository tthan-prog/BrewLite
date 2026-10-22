# Sprint 3 Backlog

- **Thời gian:** 23/10 – 25/10/2026 (đóng băng code tối 25/10; hoàn thiện 26/10; nộp 27/10)
- **Sprint Goal:** Hoàn thành đường găng Task 7 → 8 → 9 → 10, có test chứng minh nghiệp vụ, docker-compose chạy end-to-end.
- **Daily Scrum:** hằng ngày 21:00 qua nhóm chat.
- **Sprint Review và Retrospective:** 25/10/2026 (nội bộ), chưa diễn ra tại thời điểm cập nhật tài liệu này.
- **Tổng điểm:** 24 điểm = 16 điểm mới (T8 = 5, T9 = 3, T10 = 8) + 8 điểm tồn từ Sprint 2 (T2 API, T7).

## Việc trong Sprint

| # | Việc | Task | Người làm | Điểm | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | `GET /products`, `/products/:id`, `/toppings` | 2 | C | 3 | Code xong 23/10, chờ nghiệm thu | |
| 2 | Auth: register, login, JWT, `JwtAuthGuard`, phân quyền CUSTOMER/STAFF | 7 | C (E) | 5 | Code xong 23/10, chờ nghiệm thu | |
| 3 | Thanh toán mock: Ví/Thẻ, PAID/PAYMENT_FAILED, thử lại | 8 | C (D) | 5 | Code xong 23/10, chờ nghiệm thu | |
| 4 | Xác nhận đơn, lịch sử đơn `GET /orders/me`, docker-compose chạy 3 dịch vụ | 9 | E (D, A) | 3 | Code xong 23/10, chờ nghiệm thu | Docker đã chạy thử trên máy A |
| 5 | State machine, idempotency, tồn kho đồng thời, khuyến mãi, điểm thưởng + test 10a/10b/10c | 10 | B (10b, 10c), C (10a, 10d) | 8 | Code xong 23/10, chờ nghiệm thu | 22 unit test + 32 e2e test đạt |
| 6 | Nghiệm thu chéo từng task (B–E, không tự nghiệm thu) | 2–10 | B, C, D, E | – | **Chưa làm** | Hạn 24/10 |
| 7 | Báo cáo, slide, chụp ảnh minh họa | – | D, E, A | – | Đang làm | |
| 8 | Đóng băng code 25/10 tối; 26/10 rà DoD, tập demo | – | A | – | Chưa đến | |

## Rủi ro

| Ngày | Rủi ro | Người xử lý | Hướng xử lý |
|---|---|---|---|
| 23/10 | Chưa có nghiệm thu chéo nên chưa tính điểm DoD | A | Mỗi người nghiệm thu task do người khác viết, ghi vào PR |
| 23/10 | Thời gian còn ngắn (hạn 27/10) | A | Mốc cắt phạm vi tối 24/10 và 25/10 theo kế hoạch |
