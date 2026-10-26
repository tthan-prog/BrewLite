# Bảng tiến độ Assignment 1 (cập nhật 23/10/2026)

Hạn nộp: 27/10/2026. Điểm: 10 task, mỗi task 1 điểm, tổng 10 điểm.

## 1. Tiến độ 10 task

| # | Task | Sprint | Người làm chính | Điểm ước lượng | Code | Test | Nghiệm thu chéo | Bằng chứng |
|---|---|---|---|---|---|---|---|---|
| 1 | Khởi tạo dự án | 1 | A | 2 | Xong | Có | Đạt (nhóm xác nhận 23/10) | Commit "Initial commit" 13/10; `/health` |
| 2 | API sản phẩm | 1 | C (B: schema, seed) | 3 | Xong | e2e đạt | Đạt | `GET /products`, `/toppings`; seed 12 sản phẩm |
| 3 | Trang Menu | 1 | D | 3 | Xong | Chạy thử trình duyệt | Đạt | Trang `/menu` gọi API |
| 4 | Chi tiết, size, topping | 1 | D | 3 | Xong | e2e đạt (giá server) | Đạt | Size +0/+5.000/+10.000đ |
| 5 | Giỏ hàng | 2 | D | 3 | Xong | Chạy thử trình duyệt | Đạt | Thêm, sửa, xóa, tổng tiền, badge |
| 6 | API tạo đơn | 2 | B | 5 | Xong | e2e đạt | Đạt | `POST /orders` (JWT, validate, PENDING) |
| 7 | Đăng ký, đăng nhập | 2 | C | 5 | Xong | e2e đạt | Đạt | bcrypt, JWT, guard, `/login`, `/register` |
| 8 | Thanh toán | 3 | C | 5 | Xong | e2e đạt | Đạt | `POST /payments`, PAID/PAYMENT_FAILED, thử lại |
| 9 | Xác nhận, lịch sử, bàn giao | 3 | E | 3 | Xong | Chạy thử trình duyệt | Đạt | `/orders/me`, trang xác nhận, Docker |
| 10 | Nghiệp vụ nâng cao | 3 | B, C | 8 | Xong | 3 test bắt buộc đạt | Đạt | State machine, idempotency, tồn kho, khuyến mãi, điểm |

Tổng: 10/10 task xong code; nghiệm thu chéo ghi nhận Đạt theo xác nhận của nhóm.

## 2. Chất lượng

| Hạng mục | Kết quả |
|---|---|
| Unit test (Vitest) | 22 đạt |
| Tích hợp e2e (Supertest, PostgreSQL thật) | 32 đạt |
| Test bắt buộc Task 10 | (a) chặn chuyển trạng thái sai, (b) cùng Idempotency-Key chỉ 1 đơn, (c) 20 yêu cầu song song khi kho còn 5 thì đúng 5 thành công: **đạt cả ba** |
| Lint, build backend | Sạch |
| Lint, build frontend | Đạt |
| Docker Compose | Chạy được 3 dịch vụ |

## 3. Scrum

| Sprint | Thời gian | Điểm đầu | Điểm còn lại cuối Sprint | Ghi chú |
|---|---|---|---|---|
| 1 | 14–18/10 | 11 | 9 | Trễ: chỉ xong Task 1 |
| 2 | 19–22/10 | 22 (13 mới + 9 tồn) | 8 | Còn Task 7 backend và API products |
| 3 | 23–25/10 | 24 (16 mới + 8 tồn) | 0 | Code xong 23/10 |

Tài liệu: Product Backlog, 3 Sprint Backlog, Burndown, 6 biên bản (bản nháp), quy trình DoD, README 2.0, báo cáo LaTeX (`docs/report/latex/as1`).

## 4. Việc còn lại trước khi nộp

| Việc | Người | Hạn | Trạng thái |
|---|---|---|---|
| Merge PR, B, C, D, E Approve hoặc comment nghiệm thu trên GitHub | B, C, D, E | 24/10 | Cần làm |
| Ghi tên người nghiệm thu thật vào `dod-nghiem-thu.md` và báo cáo mục 6.4 | A | 24/10 | Cần làm |
| E có ít nhất một commit hoặc PR | E | 25/10 | Cần làm |
| Điền MSSV, lớp, nhóm vào báo cáo LaTeX (ảnh đã được chèn) | A, D | 26/10 | Cần làm |
| Cả nhóm đọc và sửa 6 biên bản họp cho đúng thực tế | Cả nhóm | 25/10 | Cần làm |
| Họp Sprint 3 Review và Retrospective, cập nhật biên bản 06 | Cả nhóm | 25/10 | Chưa đến |
| Đóng băng code tối 25/10; rà soát 26/10; nộp 27/10 | Cả nhóm | 25–27/10 | Chưa đến |

## 5. Rủi ro

| Rủi ro | Mức | Xử lý |
|---|---|---|
| Bằng chứng nghiệm thu chỉ là xác nhận chung, thiếu Approve trên GitHub | Cao | Nhờ từng người Approve hoặc comment trên PR |
| Phân bố commit lệch (E chưa có) | Trung bình | Giao việc cụ thể cho E |
| Burndown Sprint 1 trễ | Thấp | Đã ghi trung thực trong Retrospective |
| Làm song song Assignment 2 cùng hạn | Cao | Dùng chung mã nguồn; xem kế hoạch Assignment 2 |
