# Biên bản Sprint Review và Retrospective – Assignment 2 – Sprint 1

> **Bản nháp do A (Scrum Master) soạn từ lịch sử PR, CI, tag trên GitHub và vai trò trong `docs/team-agreement.md`.** 

- **Thời gian:** 24/10/2026, 20:00 – 21:00
- **Người ghi biên bản:** Nguyễn Lê Nhựt Thắng
- **Có mặt:**
  
| Ký hiệu | Họ tên | 
|---|---|
| A | Nguyễn Lê Nhựt Thắng | 
| B | Hồ Thiên Ngân | 
| C | Hà Thiên Long | 
| D | Giản Thiên Lực | 
| E | Lê Thuận | 


## Phần 1. Sprint Review

| Task | Demo được? | Đạt DoD? | Người nghiệm thu | Bằng chứng | Ghi chú |
|---|---|---|---|---|---|
| 4.1 Repository | Có | Có | Hồ Thiên Ngân | Repo `tthan-prog/BrewLite`, README, `.env.example`, `docs/scrum` | Branch protection trên `main` |
| 4.2 Quản lý tài liệu | Có | Có | Giản Thiên Lực | Tag `assign1-final` (e7a627a); thay đổi tài liệu qua PR | |
| 4.3 API sản phẩm | Có | Có | Lê Thuận | `GET /products`, `GET /products/:id` trên `https://brewlite-api.onrender.com` | |
| 4.3 Màn hình menu | Có | Có | Lê Thuận | `https://brewlite-web.onrender.com/menu` | Có loading, empty, error |
| 4.3 Kiểm thử tối thiểu | Có | Có | Hà Thiên Long | 7 test E2E Playwright và test API đạt trong CI | |
| 4.4 CI | Có | Có | Hà Thiên Long | `.github/workflows/ci.yml`; `docs/evidence/` ảnh 16–19 | CI #13 đỏ (job `api`), PR #30 bị chặn merge, #14 xanh sau khi sửa |

- **Sprint Goal đã đạt chưa:** Đạt. Căn cứ: repo, CI chặn merge và menu chạy được đều có bằng chứng ở bảng trên.
- **Increment demo được:** menu sản phẩm tải từ API, chạy trên production.
- **Điều chỉnh Product Backlog sau Review:** đưa việc ghi nhận review PR và quay lại mục tiêu Sprint 2 (hoàn thiện luồng end-to-end, CD, triển khai) lên đầu backlog.

## Phần 2. Sprint Retrospective

| Điều làm tốt, nên giữ | Điều chưa tốt, cần cải thiện |
|---|---|
| CI chặn merge hoạt động và có bằng chứng đỏ/xanh | Review PR chưa được ghi nhận trên GitHub (cột Reviews của các PR đã đóng đang trống) |
| Mọi thay đổi vào `main` đi qua PR | Lỗi tạo PR nhầm nhánh đích (`Thành-viên-A` thay vì `main`) |
| Tag phiên bản và release notes rõ ràng | CD lần đầu đỏ vì thiếu cấu hình URL và hook, mất thời gian dò lỗi |
| B, C làm xong API và seed đúng phần việc, D đưa giao diện menu lên đúng hạn | Việc song song giữa các vai trò chưa đồng đều, phần backend và frontend gộp muộn trong ngày |
| E kiểm thử và kiểm tra yêu cầu | Nghiệm thu chéo chưa ghi lại bằng comment hoặc Approve trên PR |

### Hành động cụ thể cho Sprint 2

| Hành động | Người làm | Kiểm tra vào |
|---|---|---|
| Mỗi PR có ít nhất 1 review trước khi merge | B, C, D, E (mỗi người review PR của người khác) | Mỗi PR của Sprint 2 |
| Tạo PR bằng đường dẫn `compare/main...<nhánh>` để đúng nhánh đích | A | Mỗi PR |
| Ghi kết quả nghiệm thu chéo vào PR (comment hoặc Approve) | Người nghiệm thu theo bảng Review | 26/10 |
| Merge PR sớm trong ngày, tránh dồn cuối ngày | B, C, D, E | Daily Scrum 21:00 |

## Phần 3. Burndown

- Điểm còn lại cuối Sprint: 0 (4/4 việc Task 4 hoàn thành). Repo chưa có file Burndown riêng cho Assignment 2, nên số này theo số việc, không phải story point.
- Nhận xét: tiến độ bám mục tiêu Sprint; phần CI và bằng chứng hoàn tất vào cuối Sprint.
