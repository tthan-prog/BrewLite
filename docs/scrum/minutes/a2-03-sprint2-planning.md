# Biên bản Sprint Planning – Assignment 2 – Sprint 2

> **Bản nháp do Nguyễn Lê Nhựt Thắng (Scrum Master) soạn**, vai trò lấy từ `docs/team-agreement.md`.

- **Thời gian họp:** 24/10/2026, 21:00 – 22:00
- **Thời gian Sprint:** 24/10 – 26/10/2026 (Sprint Review và Retrospective: 26/10/2026)
- **Người ghi biên bản:** Nguyễn Lê Nhựt Thắng
- **Có mặt:** 

| Ký hiệu | Họ tên | 
|---|---|
| A | Nguyễn Lê Nhựt Thắng | 
| B | Hồ Thiên Ngân | 
| C | Hà Thiên Long | 
| D | Giản Thiên Lực | 


## 1. Sprint Goal (theo đề Assignment 2, mục 7)

Hoàn thành luồng end-to-end, tự động hóa đóng gói và triển khai, và có một phiên bản production truy cập được.

## 2. Việc chọn vào Sprint (Task 5 của đề)

| Task | Nội dung | Tiêu chí hoàn thành |
|---|---|---|
| 5.1 | Hoàn thiện MVP: chi tiết sản phẩm, size, topping, giỏ hàng, đăng ký/đăng nhập JWT, tạo đơn, thanh toán mô phỏng, xác nhận và lịch sử đơn, xử lý lỗi | Luồng từ menu đến lịch sử đơn chạy trên production |
| 5.2 | Tích hợp và kiểm thử: unit, integration, ít nhất một E2E, migration/seed, `docker-compose.yml`, `/health` | Test đạt trong CI |
| 5.3 | CD: Push/Tag → Lint/Test → Build → Docker Image → Push Registry → Deploy → Smoke Test, có rollback | Tag `v*` kích hoạt pipeline; có minh chứng rollback |
| 5.4 | Bàn giao: URL HTTPS, URL API và health, DB không public, không lộ bí mật, release và notes, README, video demo, Sprint Review/Retro | Đủ các mục theo đề |

## 3. Quy ước làm việc trong Sprint

- Giữ quy tắc của Sprint 1: mọi thay đổi vào `main` qua PR, check `api` và `web` xanh, 1 approval.
- Triển khai bằng tag phiên bản (`v0.1.x`); rollback bằng chạy lại workflow CD với `image_tag`.
- Daily Scrum: hằng ngày 20:00, tối đa 15 phút, qua nhóm chat.
- Định nghĩa hoàn thành: theo `docs/scrum/dod-nghiem-thu.md`.

## 4. Phân công và người nghiệm thu chéo

| Task | Việc | Người làm chính | Người nghiệm thu |
|---|---|---|---|
| 5.1 | Đăng ký, đăng nhập, thanh toán mô phỏng | Hà Thiên Long | Hồ Thiên Ngân |
| 5.1 | Tạo đơn, trạng thái đơn | Hồ Thiên Ngân | Hà Thiên Long |
| 5.1 | Giao diện menu, giỏ hàng, thanh toán, lịch sử đơn | Giản Thiên Lực | Nguyễn Lê Nhựt Thắng |
| 5.2 | Unit, integration, E2E, `docker-compose.yml`, `/health` | Nguyễn Lê Nhựt Thắng, Hà Thiên Long | Hà Thiên Long |
| 5.3 | Pipeline CD, rollback | Nguyễn Lê Nhựt Thắng | Hồ Thiên Ngân |
| 5.4 | Triển khai production, release v0.1.x, README | Nguyễn Lê Nhựt Thắng | Giản Thiên Lực |
| 5.4 | Video demo luồng end-to-end | Giản Thiên Lực | Nguyễn Lê Nhựt Thắng |
| 5.4 | Sprint Review và Retrospective | Nguyễn Lê Nhựt Thắng | Cả nhóm |

Nguyên tắc: người nghiệm thu không phải người viết task đó.
