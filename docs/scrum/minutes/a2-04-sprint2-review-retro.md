# Biên bản Sprint Review và Retrospective – Assignment 2 – Sprint 2

> **Bản nháp do Nguyễn Lê Nhựt Thắng (Scrum Master) soạn theo trạng thái ngày 24/10/2026**, từ lịch sử PR, CI, tag, Release trên GitHub và vai trò trong `docs/team-agreement.md`. Trước buổi họp 26/10, Nguyễn Lê Nhựt Thắng cập nhật một việc còn mở (video demo).
- **Thời gian:** 26/10/2026, 20:00 – 21:00
- **Người ghi biên bản:** Nguyễn Lê Nhựt Thắng
- **Có mặt:** 

| Ký hiệu | Họ tên | 
|---|---|
| A | Nguyễn Lê Nhựt Thắng | 
| B | Hồ Thiên Ngân | 
| C | Hà Thiên Long | 
| D | Giản Thiên Lực | 


## Phần 1. Sprint Review

| Task | Demo được? | Đạt DoD? | Người nghiệm thu | Bằng chứng | Ghi chú |
|---|---|---|---|---|---|
| 5.1 Hoàn thiện MVP | Có | Có | Hồ Thiên Ngân , Hà Thiên Long, Nguyễn Lê Nhựt Thắng (theo phân công) | `docs/evidence/` ảnh 01–11; production `https://brewlite-web.onrender.com/menu` | Luồng menu → size → giỏ → thanh toán → xác nhận → lịch sử; có thanh toán thất bại và thử lại |
| 5.2 Tích hợp và kiểm thử | Có | Có | Hà Thiên Long | CI 4 job (api, api-e2e, web, e2e-browser); 7 test E2E Playwright | `/health` trả `{"status":"ok","service":"brewlite-backend"}` |
| 5.3 CD và rollback | Có | Có | Hồ Thiên Ngân  | `.github/workflows/cd.yml`; ảnh 12–14 và 20–25 | CD từ tag `v0.1.1`, `v0.1.2`; rollback về `sha-e445b63` (CD #11) và triển khai lại `sha-7b1ea96` (CD #12) |
| 5.4 Production, release, README | Có | Gần đạt | Giản Thiên Lực  | Release `v0.1.2`; `docs/deployment.md`; README 2.2 | – |
| 5.4 Video demo | Có | Chờ nghiệm thu | Nguyễn Lê Nhựt Thắng | https://drive.google.com/file/d/1uxrJSc9OkNkD-68vCTKXsPb0DcUudtat/view?usp=sharing | Giản Thiên Lực quay; Nguyễn Lê Nhựt Thắng xác nhận sau khi xem |
| 5.4 Sprint Review/Retro | Có | Có | Cả nhóm | `docs/scrum/minutes/a2-*` | Biên bản này |

- **Sprint Goal đã đạt chưa:** Phần lớn đạt: có URL production HTTPS, CI/CD chạy, rollback đã chứng minh. Video demo đã có liên kết, chờ Nguyễn Lê Nhựt Thắng xác nhận.
- **Increment demo được:** phiên bản `v0.1.2` trên production.
- **Điều chỉnh Product Backlog sau Review:** việc còn lại chuyển sang giai đoạn hoàn thiện trước 27/10: rà soát lần cuối.

## Phần 2. Sprint Retrospective

| Điều làm tốt, nên giữ | Điều chưa tốt, cần cải thiện |
|---|---|
| Rollback bằng `image_tag` chạy được và có minh chứng | CD lần đầu (tag `v0.1.0`) đỏ vì thiếu cấu hình URL và hook; mất thời gian dò lỗi |
| Smoke test và `/health` bắt lỗi sau khi triển khai | Render Free: web ngủ sau thời gian không dùng (request đầu ~50 giây), DB Free hết hạn 22/11/2026 và không có backup |
| Bằng chứng ảnh được thu thập và đặt tên có thứ tự trong `docs/evidence/` | Nghiệm thu chéo chưa ghi trên PR (cột Reviews trống) |
| Mọi thay đổi vào `main` đi qua PR và CI | Một lần tạo PR nhầm nhánh đích; một lần gõ sai mã khuyến mãi khi thử (`WELCOM10`) làm tưởng lỗi giao diện |

### Hành động cụ thể sau Sprint

| Hành động | Người làm | Kiểm tra vào |
|---|---|---|
| Quay video demo end-to-end (đã có liên kết, xem Phần 1) | Giản Thiên Lực  | 26/10 |
| Mở web production một lần trước giờ chấm để tránh chờ khởi động | Nguyễn Lê Nhựt Thắng | 27/10 |
| Ghi kết quả nghiệm thu chéo vào PR (comment hoặc Approve) | Người nghiệm thu theo bảng Review | 26/10 |
| Sao lưu dữ liệu hoặc cập nhật DB trước 22/11 nếu còn dùng | Nguyễn Lê Nhựt Thắng | Sau khi nộp |

## Phần 3. Burndown

- Điểm còn lại cuối Sprint: 2 việc (video demo). Repo chưa có file Burndown riêng cho Assignment 2, nên số này tính theo số việc, không phải story point.
- Nhận xét: phần kỹ thuật hoàn tất trước hạn; hai việc còn lại là phần tài liệu và video.
