# Nhiệm vụ và phân công Assignment 1 (giữa kì)

- **Hạn nộp:** 02/11/2026 (giảng viên đã đổi từ 27/10/2026).
- **Nhóm:** 4 thành viên: A Nguyễn Lê Nhựt Thắng, B Hồ Thiên Ngân, C Hà Thiên Long, D Giản Thiên Lực.
- **Nguồn dữ liệu:** `docs/scrum/product-backlog.md`, `sprint-1/2/3-backlog.md`, `dod-nghiem-thu.md`, `docs/progress/tien-do-assign1.md`.
- **Cách đọc:** ngày bắt đầu và hạn lấy từ Sprint Backlog (Sprint 1: 14–18/10; Sprint 2: 19–22/10; Sprint 3: 23–25/10/2026). Nội dung ghi `[đề xuất]` là mốc chưa có trong tài liệu cũ, cần nhóm duyệt. Phần trăm hoàn thành là 100% khi task đã đạt DoD theo biên bản nhóm; phần dở ghi `[ước lượng]`.
- **Điều kiện chấm:** mỗi task đạt Definition of Done được 1 điểm (10 task, tổng 10 điểm). Nghiệm thu chéo hiện mới ghi trong tài liệu nhóm, chưa có Approve trên từng Pull Request.

## A. Nguyễn Lê Nhựt Thắng (Scrum Master, nền tảng, kiểm thử, Product Owner tạm)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 1: Khởi tạo dự án và cấu trúc | Monorepo, README, `.env.example`, `/health`, Docker Compose | 13/10/2026 | 18/10/2026 | Hoàn thành (13/10) | 100 | Commit "Initial commit" 13/10 |
| Task 9: Xác nhận, lịch sử đơn, bàn giao | Trang xác nhận, `GET /orders/me`, docker-compose chạy 3 dịch vụ, README, demo | 23/10/2026 | 25/10/2026 | Hoàn thành (23/10) | 100 | Nhận thêm phần của thành viên E cũ; Docker chạy thử trên máy A |
| Product Vision, FR/NFR, user story (báo cáo chương 1 và 3) | Nội dung yêu cầu trong báo cáo | 14/10/2026 | 02/11/2026 | Đã đưa vào báo cáo LaTeX | 100 | Việc của thành viên E cũ, nay do A phụ trách |
| Kiểm thử: chạy test, kiểm tra yêu cầu | Kết quả unit, tích hợp, E2E (36, 81, 10 test) | 14/10/2026 | 25/10/2026 | Hoàn thành | 100 | Việc của thành viên E cũ; số test lấy từ lần chạy trên `main` |
| Product Owner tạm: ước lượng điểm, ưu tiên Product Backlog | `product-backlog.md` | 14/10/2026 | 18/10/2026 | Hoàn thành | 100 | Việc của thành viên E cũ |
| Nghiệm thu chéo Task 3 (Trang Menu của D) | Dòng nghiệm thu trong `dod-nghiem-thu.md` | 23/10/2026 | 24/10/2026 | Đạt (23/10) | 100 | Chưa có Approve trên PR |
| Scrum Master: biên bản Sprint, Burndown | `docs/scrum/minutes/01–06`, `burndown-*.csv` | 14/10/2026 | 25/10/2026 | Hoàn thành (bản nháp) | 100 | Biên bản cần nhóm đọc lại cho đúng thực tế |
| Báo cáo LaTeX Assignment 1 (2–3 trang, theo mẫu SGU) | `docs/report/latex/as1/main.tex` | 29/10/2026 | 02/11/2026 | Bản đầu đã soạn; chờ MSSV | 90 `[ước lượng]` | Còn điền MSSV 4 thành viên và nhóm đọc lại |

## B. Hồ Thiên Ngân (Backend: dữ liệu, đơn hàng)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2 (phần dữ liệu): Prisma schema, migration, seed | `schema.prisma`, `prisma/migrations`, seed 12 sản phẩm | 20/10/2026 | 22/10/2026 | Hoàn thành (21/10) | 100 | ERD chốt muộn nên bắt đầu 20/10 |
| Task 6: API tạo đơn | `POST /orders`: JWT, validate, PENDING | 19/10/2026 | 22/10/2026 | Hoàn thành (22/10) | 100 | Có idempotency và kiểm soát tồn kho |
| Task 10 (10b, 10c): thanh toán idempotent, tồn kho đồng thời | Test (b) cùng khóa chỉ một đơn; test (c) 20 yêu cầu song song, kho 5 | 23/10/2026 | 25/10/2026 | Hoàn thành (23/10) | 100 | Cùng C làm Task 10 |
| Nghiệm thu chéo Task 1, 5, 7, 8 | Dòng nghiệm thu trong `dod-nghiem-thu.md` | 23/10/2026 | 24/10/2026 | Đạt (23/10) | 100 | Chưa có Approve trên PR |

## C. Hà Thiên Long (Backend: xác thực, thanh toán, state machine)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2 (phần API): danh sách sản phẩm | `GET /products`, `/products/:id`, `/toppings` | 19/10/2026 | 22/10/2026 | Hoàn thành (23/10) | 100 | Chuyển từ Sprint 2 sang Sprint 3 |
| Task 7: Đăng ký, đăng nhập (JWT) | `POST /auth/register`, `/auth/login`, bcrypt, `JwtAuthGuard` | 19/10/2026 | 22/10/2026 | Hoàn thành (23/10) | 100 | Giao diện đăng nhập do A phụ trách (thay thành viên E cũ) |
| Task 8: Thanh toán không tiền mặt | `POST /payments`, PAID hoặc PAYMENT_FAILED, thử lại | 23/10/2026 | 25/10/2026 | Hoàn thành (23/10) | 100 | |
| Task 10 (10a, 10d): máy trạng thái, khuyến mãi, điểm thưởng | Test (a) chặn chuyển trạng thái sai; `WELCOME10`; 1 điểm / 10.000 đồng | 23/10/2026 | 25/10/2026 | Hoàn thành (23/10) | 100 | |
| Nghiệm thu chéo Task 4, 9 | Dòng nghiệm thu trong `dod-nghiem-thu.md` | 23/10/2026 | 24/10/2026 | Đạt (23/10) | 100 | Chưa có Approve trên PR |

## D. Giản Thiên Lực (Frontend, slide)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 3: Trang Menu | Lưới sản phẩm, loading, rỗng, lỗi | 14/10/2026 | 18/10/2026 | Hoàn thành giao diện (22/10) | 100 | Thực tế gộp vào Sprint 2 |
| Task 4: Chi tiết, size, topping | Chọn size S/M/L và topping, tính giá | 14/10/2026 | 18/10/2026 | Hoàn thành giao diện (22/10) | 100 | Thực tế gộp vào Sprint 2 |
| Task 5: Giỏ hàng | Thêm, sửa, xóa, tổng tiền, badge | 19/10/2026 | 22/10/2026 | Hoàn thành giao diện (22/10) | 100 | |
| Slide, ảnh minh họa cho báo cáo | Bộ slide và ảnh chụp màn hình | 23/10/2026 | 25/10/2026 | Đang làm (theo Sprint 3 Backlog) | chưa có dữ liệu | Cần D cập nhật tiến độ |
| Nghiệm thu chéo Task 2, 6, 10 | Dòng nghiệm thu trong `dod-nghiem-thu.md` | 23/10/2026 | 24/10/2026 | Đạt (23/10) | 100 | Chưa có Approve trên PR |
