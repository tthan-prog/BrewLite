# Biên bản Sprint Planning – Assignment 2 – Sprint 1

> **Bản nháp do A (Scrum Master) soạn**, vai trò lấy từ `docs/team-agreement.md`. 

- **Thời gian họp:** 20/10/2026, 20:00 – 21:00
- **Thời gian Sprint:** 20/10 – 23/10/2026 (Sprint Review và Retrospective: 24/10/2026)
- **Người ghi biên bản:** Nguyễn Lê Nhựt Thắng
- **Có mặt:**
| Ký hiệu | Họ tên | 
|---|---|---|---|
| A | Nguyễn Lê Nhựt Thắng | 
| B | Hồ Thiên Ngân | 
| C | Hà Thiên Long | 
| D | Giản Thiên Lực | 
| E | Lê Thuận | 

## 1. Sprint Goal (theo đề Assignment 2, mục 6)

Tạo nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản và một MVP đầu tiên chạy được cho luồng xem menu.

## 2. Việc chọn vào Sprint (Task 4 của đề)

| Task | Nội dung | Tiêu chí hoàn thành |
|---|---|---|
| 4.1 | Thiết lập repository: `apps/web`, `apps/api`, `docs`; chiến lược branch và PR; README, `.gitignore`, `.env.example`; backlog; quy ước commit; DoD | Repo GitHub có đủ các mục trên |
| 4.2 | Quản lý tài liệu: tạo phẩm Task 1–3 nằm trong `docs`, thay đổi đi qua PR | Tag `assign1-final`; thay đổi tài liệu có PR |
| 4.3 | MVP: `GET /products`, `GET /products/:id`, màn hình menu, loading/empty/error, seed, test tối thiểu | Menu chạy được, có test |
| 4.4 | CI: Install → Lint → Unit Test → Build; PR không merge được nếu CI đỏ | Có một lần CI đỏ và một lần CI xanh làm minh chứng |

## 3. Quy ước làm việc trong Sprint

- Nhánh `main` được bảo vệ: phải qua PR, check `api` và `web` phải xanh, cần 1 approval, không force-push.
- Daily Scrum: hằng ngày 21:00, tối đa 15 phút, qua nhóm chat.
- Definition of Done: theo `docs/scrum/dod-nghiem-thu.md`.

## 4. Phân công và người nghiệm thu chéo

| Task | Việc | Người làm chính | Người nghiệm thu |
|---|---|---|---|
| 4.1 | Repo, cấu trúc, README, `.env.example`, branch protection, quy ước commit, DoD | Nguyễn Lê Nhựt Thắng (Scrum Master, dev nền tảng) | Hồ Thiên Ngân |
| 4.2 | Đưa tạo phẩm Task 1–3 vào `docs`, gắn tag `assign1-final`, thay đổi qua PR | Nguyễn Lê Nhựt Thắng, Lê Thuận (viết tài liệu yêu cầu) | Giản Thiên Lực |
| 4.3 | Dữ liệu mẫu, `GET /products`, `GET /products/:id` | Hồ Thiên Ngân (dữ liệu, seed), C (API) | Lê Thuận |
| 4.3 | Màn hình menu mobile-first, loading, empty, error | Giản Thiên Lực (frontend) | Lê Thuận |
| 4.3 | Kiểm thử tối thiểu API và luồng menu | Lê Thuận (kiểm thử) | Hà Thiên Long |
| 4.4 | Pipeline CI và chặn merge khi đỏ | Nguyễn Lê Nhựt Thắng | Hà Thiên Long |

Nguyên tắc: người nghiệm thu không phải người viết task đó (theo `docs/scrum/dod-nghiem-thu.md`).
