# Nhiệm vụ và phân công Assignment 2 (đồ án cuối kì)

- **Hạn nộp:** chưa có dữ liệu (giảng viên chưa thông báo; đã yêu cầu bắt đầu viết báo cáo).
- **Nhóm:** 4 thành viên: A Nguyễn Lê Nhựt Thắng, B Hồ Thiên Ngân, C Hà Thiên Long, D Giản Thiên Lực.
- **Nguyên tắc chia (kế hoạch lập 23/10/2026):** A lo toàn bộ code (cấu trúc, CI/CD, E2E, deploy); B, C, D lo tài liệu và sơ đồ; A nhận thêm các việc tài liệu yêu cầu, truy vết, backlog trước đây giao cho thành viên E. Mỗi việc có người nghiệm thu khác người làm.
- **Nguồn dữ liệu:** `docs/scrum/minutes/a2-01…a2-04`, kế hoạch phân công Assignment 2 (23/10), đề Assignment 2. Mốc: Sprint 1 là 20–23/10, Sprint 2 là 24–26/10/2026. Nội dung `[đề xuất]` cần nhóm duyệt; `[ước lượng]` là phần trăm do người lập ước lượng.

## A. Nguyễn Lê Nhựt Thắng (code, CI/CD, triển khai, yêu cầu, kiểm thử)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 4.1: Cấu trúc `apps/api`, `apps/web`, repo, branch protection | Repo, README, `.env.example`, quy ước commit | 20/10/2026 | 23/10/2026 | Hoàn thành (Review 24/10) | 100 | Nghiệm thu: B |
| Task 4.2: Đưa tài liệu Task 1–3 vào `docs`, tag `assign1-final` | `docs/`, tag `assign1-final` | 20/10/2026 | 24/10/2026 | Hoàn thành | 100 | Phần viết tài liệu yêu cầu nhận từ thành viên E cũ; nghiệm thu: D |
| Task 4.4: Pipeline CI chặn merge khi đỏ | `.github/workflows/ci.yml`, ảnh 16–19 | 20/10/2026 | 25/10/2026 | Hoàn thành | 100 | Nghiệm thu: C |
| Task 5.2: Test E2E, unit, tích hợp, `docker-compose.yml`, `/health` | Test đạt trong CI (36 unit, 81 tích hợp, 10 E2E) | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | Phần kiểm thử nhận từ thành viên E cũ |
| Task 5.3: Pipeline CD, rollback | `cd.yml`, ảnh 12–14, 20–25 | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | Nghiệm thu: B |
| Task 5.4: Triển khai production, release, README | Web và API trên Render, tag `v0.1.2`, `docs/deployment.md` | 24/10/2026 | 26/10/2026 | Gần đạt (Review 26/10) | 90 `[ước lượng]` | Nghiệm thu: D |
| Task 5.4: Xác nhận video demo | Liên kết video, biên bản nghiệm thu | 26/10/2026 | chưa có dữ liệu | Chờ nghiệm thu | chưa có dữ liệu | Nhận từ thành viên E cũ |
| Rà context-and-scope, SRS (đo NFR-01), use-case | `docs/requirements/` | 23/10/2026 | 24/10/2026 | Hoàn thành | 100 | Nhận từ thành viên E cũ; NFR-01 đo thủ công 24/10 |
| Ma trận truy vết | `docs/traceability-matrix.md` | 23/10/2026 | 25/10/2026 | Hoàn thành (cập nhật 23/10) | 100 | NFR-03 chưa rà đủ, NFR-07 chưa có người ngoài nhóm chạy thử |
| Product Backlog, Sprint Backlog, biên bản Assignment 2 | `docs/scrum/minutes/a2-01…a2-04` | 20/10/2026 | 26/10/2026 | Hoàn thành (bản nháp) | 100 | Nhận từ thành viên E cũ |
| Cập nhật tài liệu theo logic trừ nguyên liệu khi thanh toán (SRS, use-case, ADR-005, sequence, activity, truy vết) | Tài liệu và sơ đồ khớp mã nguồn | `[đề xuất]` 30/10/2026 | `[đề xuất]` 01/11/2026 | Chưa làm | 0 | Đang chờ nhóm duyệt; không thêm phạm vi mới |
| Báo cáo LaTeX Assignment 2 theo mẫu SGU | `docs/report/latex/as2/main.tex` | 29/10/2026 | chưa có dữ liệu | Bản đầu đã soạn; chờ MSSV | 85 `[ước lượng]` | Hạn phụ thuộc thông báo của giảng viên |

## B. Hồ Thiên Ngân (mô hình dữ liệu, kiến trúc)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2.3: Rà class diagram với `schema.prisma` | `docs/diagrams/class-domain.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Cập nhật ERD khớp schema | `docs/design`, `docs/diagrams/erd.puml` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Task 3.1: Rà kiến trúc và ADR 001–005 | `docs/architecture/architecture.md`, ADR | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | Nghiệm thu: D |
| Task 4.3 và 5.1: Dữ liệu seed, tạo đơn, trạng thái đơn | Seed, `POST /orders` | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Nghiệm thu: C |

## C. Hà Thiên Long (sequence, triển khai, thanh toán)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2.2: Rà sequence diagram với `orders.service.ts`, `payments.service.ts` | `docs/diagrams/sequence-checkout.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Hoàn thành (commit 25/10) | 100 | |
| Task 3.2: Rà deployment diagram, ADR-006, ADR-007 | `docs/diagrams/`, ADR | 23/10/2026 | 25/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Task 4.3 và 5.1: API sản phẩm, đăng ký/đăng nhập, thanh toán mô phỏng | API trên production | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Nghiệm thu: B (5.1) |
| Task 4.4: Minh chứng CI đỏ rồi xanh | PR #30, CI #13 và #14, ảnh 16–19 | 23/10/2026 | 25/10/2026 | Hoàn thành | 100 | |
| Task 5.3 và 5.4: `deployment.md`, release notes | `docs/deployment.md`, `docs/release-notes` | 25/10/2026 | 26/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Nghiệm thu chéo Task 5.2 | Kết quả trong biên bản Review | 26/10/2026 | 26/10/2026 | Đạt | 100 | |

## D. Giản Thiên Lực (activity, use-case, giao diện, video, slide)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2.1: Rà activity diagram (swimlane, 3 nhánh lỗi) | `docs/diagrams/activity-order-flow.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Task 1.3: Rà use-case diagram khớp SRS | `docs/diagrams/usecase-overview.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Task 4.3 và 5.1: Giao diện menu, giỏ, thanh toán, lịch sử | Trang web trên production | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Nghiệm thu: A |
| Task 5.4: Ảnh mobile cho báo cáo và README | `docs/evidence` (ảnh 01–11) | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | |
| Task 5.4: Quay video demo end-to-end | Video (liên kết trong biên bản a2-04) | 25/10/2026 | 26/10/2026 | Có liên kết; chờ nghiệm thu | 100 | Nghiệm thu: A |
| Slide Assignment 2 | Bộ slide thuyết trình | 24/10/2026 | 26/10/2026 | chưa có dữ liệu | chưa có dữ liệu | Cần D cập nhật tiến độ |
