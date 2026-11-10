# Product Backlog – Assignment 2

- **Nguồn:** tổng hợp ngày 10/11/2026 từ biên bản `minutes/a2-01` (Sprint 1 Planning), `a2-02` (Sprint 1 Review), `a2-03` (Sprint 2 Planning), `a2-04` (Sprint 2 Review). Không thêm việc mới; nội dung, người làm và trạng thái lấy nguyên từ biên bản.
- **Product Owner tạm:** Hà Thiên Long. **Scrum Master:** Nguyễn Lê Nhựt Thắng.
- **Cách ước lượng:** Assignment 2 không dùng story point; tiến độ tính theo số việc (ghi chú trong biên bản a2-02, a2-04).
- **Thứ tự ưu tiên:** theo thứ tự task của đề (Task 4 trước Task 5), vì đề yêu cầu task sau chỉ được nghiệm thu khi tạo phẩm của task trước đã có trên kho mã.

## 1. Danh sách hạng mục

| Ưu tiên | Mã | Hạng mục | Tiêu chí hoàn thành (theo biên bản Planning) | Sprint |
|---|---|---|---|---|
| 1 | 4.1 | Thiết lập repository: `apps/web`, `apps/api`, `docs`; chiến lược branch và PR; README, `.gitignore`, `.env.example`; backlog; quy ước commit; DoD | Repo GitHub có đủ các mục trên | 1 (20–23/10) |
| 2 | 4.2 | Quản lý tài liệu: tạo phẩm Task 1–3 nằm trong `docs`, thay đổi đi qua PR | Tag `assign1-final`; thay đổi tài liệu có PR | 1 |
| 3 | 4.3 | MVP: `GET /products`, `GET /products/:id`, màn hình menu, loading/empty/error, seed, test tối thiểu | Menu chạy được, có test | 1 |
| 4 | 4.4 | CI: Install → Lint → Unit Test → Build; PR không merge được nếu CI đỏ | Có một lần CI đỏ và một lần CI xanh làm minh chứng | 1 |
| 5 | 5.1 | Hoàn thiện MVP: chi tiết sản phẩm, size, topping, giỏ hàng, đăng ký/đăng nhập JWT, tạo đơn, thanh toán mô phỏng, xác nhận và lịch sử đơn, xử lý lỗi | Luồng từ menu đến lịch sử đơn chạy trên production | 2 (24–26/10) |
| 6 | 5.2 | Tích hợp và kiểm thử: unit, integration, ít nhất một E2E, migration/seed, `docker-compose.yml`, `/health` | Test đạt trong CI | 2 |
| 7 | 5.3 | CD: Push/Tag → Lint/Test → Build → Docker Image → Push Registry → Deploy → Smoke Test, có rollback | Tag `v*` kích hoạt pipeline; có minh chứng rollback | 2 |
| 8 | 5.4 | Bàn giao: URL HTTPS, URL API và health, DB không public, không lộ bí mật, release và notes, README, video demo, Sprint Review/Retro | Đủ các mục theo đề | 2 |

## 2. Sprint Backlog và kết quả

### Sprint 1 (20–23/10/2026; Review 24/10/2026)

Sprint Goal: tạo nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản và một MVP đầu tiên chạy được cho luồng xem menu.

| Mã | Việc | Người làm chính | Người nghiệm thu | Kết quả Review (`a2-02`) |
|---|---|---|---|---|
| 4.1 | Repo, cấu trúc, README, `.env.example`, branch protection, quy ước commit, DoD | Nguyễn Lê Nhựt Thắng | Hồ Thiên Ngân | Đạt DoD |
| 4.2 | Đưa tạo phẩm Task 1–3 vào `docs`, gắn tag `assign1-final`, thay đổi qua PR | Nguyễn Lê Nhựt Thắng; Hà Thiên Long (viết tài liệu yêu cầu) | Giản Thiên Lực | Đạt DoD |
| 4.3 | Dữ liệu mẫu, `GET /products`, `GET /products/:id` | Hồ Thiên Ngân (dữ liệu, seed); Nguyễn Lê Nhựt Thắng (API) | Hà Thiên Long | Đạt DoD |
| 4.3 | Màn hình menu mobile-first, loading, empty, error | Giản Thiên Lực | Nguyễn Lê Nhựt Thắng | Đạt DoD |
| 4.3 | Kiểm thử tối thiểu API và luồng menu | Hà Thiên Long | Nguyễn Lê Nhựt Thắng | Đạt DoD |
| 4.4 | Pipeline CI và chặn merge khi đỏ | Nguyễn Lê Nhựt Thắng | Hà Thiên Long | Đạt DoD |

Kết thúc Sprint 1: 0 việc còn lại (4/4 việc của Task 4 hoàn thành); Sprint Goal đạt (biên bản `a2-02`).

### Sprint 2 (24–26/10/2026; Review 26/10/2026)

Sprint Goal: hoàn thành luồng end-to-end, tự động hóa đóng gói và triển khai, và có một phiên bản production truy cập được.

| Mã | Việc | Người làm chính | Người nghiệm thu | Kết quả Review (`a2-04`) |
|---|---|---|---|---|
| 5.1 | Đăng ký, đăng nhập, thanh toán mô phỏng | Nguyễn Lê Nhựt Thắng | Hồ Thiên Ngân | Đạt DoD |
| 5.1 | Tạo đơn, trạng thái đơn | Hồ Thiên Ngân | Hà Thiên Long | Đạt DoD |
| 5.1 | Giao diện menu, giỏ hàng, thanh toán, lịch sử đơn | Giản Thiên Lực | Nguyễn Lê Nhựt Thắng | Đạt DoD |
| 5.2 | Unit, integration, E2E | Hà Thiên Long | Hồ Thiên Ngân | Đạt DoD |
| 5.3 | Pipeline CD, rollback | Nguyễn Lê Nhựt Thắng | Hồ Thiên Ngân | Đạt DoD |
| 5.4 | Triển khai production, release `v0.1.x`, README | Nguyễn Lê Nhựt Thắng | Giản Thiên Lực | Gần đạt |
| 5.4 | Video demo luồng end-to-end | Giản Thiên Lực | Hà Thiên Long | Chờ nghiệm thu |
| 5.4 | Sprint Review và Retrospective | Nguyễn Lê Nhựt Thắng | Cả nhóm | Đạt DoD |

Kết thúc Sprint 2: còn 2 việc (video demo), theo biên bản `a2-04`. Sau Sprint 2, bản bàn giao cuối là `v0.1.3` (07/11/2026, xem `docs/as2/release-notes/v0.1.3.md`).
