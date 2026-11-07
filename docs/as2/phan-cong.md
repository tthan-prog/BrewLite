# Nhiệm vụ và phân công Assignment 2 (đồ án cuối kì)

- **Hạn nộp:** chưa có dữ liệu (giảng viên chưa thông báo; đã yêu cầu bắt đầu viết báo cáo).
- **Nhóm:** 4 thành viên: A Nguyễn Lê Nhựt Thắng, B Hồ Thiên Ngân, C Hà Thiên Long, D Giản Thiên Lực.
- **Nguyên tắc chia (kế hoạch lập 23/10/2026):** A lo code (cấu trúc, CI/CD, E2E, triển khai) cùng sequence diagram, kiến trúc triển khai và tài liệu vận hành; B lo mô hình dữ liệu, kiến trúc; C lo tài liệu yêu cầu, truy vết, backlog và kiểm thử; D lo activity, use-case, giao diện, video, slide. Mỗi việc có người nghiệm thu khác người làm.
- **Nguồn dữ liệu:** `docs/as2/scrum/minutes/a2-01…a2-04`, kế hoạch phân công Assignment 2 (23/10), đề Assignment 2. Mốc: Sprint 1 là 20–23/10, Sprint 2 là 24–26/10/2026. Nội dung `[đề xuất]` cần nhóm duyệt; `[ước lượng]` là phần trăm do người lập ước lượng.

## A. Nguyễn Lê Nhựt Thắng (code, CI/CD, triển khai, sequence diagram, ADR triển khai)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 4.1: Cấu trúc `apps/api`, `apps/web`, repo, branch protection | Repo, README, `.env.example`, quy ước commit | 20/10/2026 | 23/10/2026 | Hoàn thành (Review 24/10) | 100 | Nghiệm thu: Hồ Thiên Ngân |
| Task 4.2: Đưa tài liệu Task 1–3 vào `docs`, tag `assign1-final` | `docs/`, tag `assign1-final` | 20/10/2026 | 24/10/2026 | Hoàn thành | 100 | Nghiệm thu: Giản Thiên Lực |
| Task 4.4: Pipeline CI chặn merge khi đỏ | `.github/workflows/ci.yml` | 20/10/2026 | 25/10/2026 | Hoàn thành | 100 | Nghiệm thu: Hà Thiên Long |
| Task 4.4: Minh chứng CI đỏ rồi xanh | PR #30, CI #13 và #14, ảnh 16–19 | 23/10/2026 | 25/10/2026 | Hoàn thành | 100 | |
| Task 4.3 và 5.1: API sản phẩm, đăng ký/đăng nhập, thanh toán mô phỏng | API trên production | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Nghiệm thu: Hồ Thiên Ngân (5.1); Hà Thiên Long (4.3) |
| Task 5.2: `docker-compose.yml` (web, API, DB), `/health` | `docker-compose.yml`, `GET /health` | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | Làm sẵn từ Assignment 1 (Task 9); nghiệm thu: Hồ Thiên Ngân |
| Task 5.3: Pipeline CD, rollback | `cd.yml`, ảnh 12–14, 20–25 | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | Nghiệm thu: Hồ Thiên Ngân |
| Task 5.4: Triển khai production, release, README | Web và API trên Render, tag `v0.1.2` | 24/10/2026 | 26/10/2026 | Gần đạt (Review 26/10) | 90 `[ước lượng]` | Nghiệm thu: Giản Thiên Lực |
| Task 5.3 và 5.4: `deployment.md`, release notes | `docs/deployment.md`, `docs/as2/release-notes` | 25/10/2026 | 26/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Task 2.2: Rà sequence diagram với `orders.service.ts`, `payments.service.ts` | `docs/diagrams/sequence-order.puml`, `sequence-payment.puml` và `.svg` | 23/10/2026 | 24/10/2026 | Hoàn thành (commit 25/10) | 100 | Nghiệm thu: Giản Thiên Lực |
| Task 3.2: Rà deployment diagram, ADR-006, ADR-007 | `docs/diagrams/`, `docs/architecture/` | 23/10/2026 | 25/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | Nghiệm thu: Hồ Thiên Ngân |
| Cập nhật tài liệu theo logic trừ nguyên liệu khi thanh toán (SRS, use-case, ADR-005, sequence, activity, truy vết) | Tài liệu và sơ đồ khớp mã nguồn | 30/10/2026 | 02/11/2026 | Hoàn thành | 100 | Đã đối chiếu SRS, ADR-005, sequence, activity và ma trận truy vết với mã nguồn (logic trừ nguyên liệu khi thanh toán); chờ nhóm xác nhận; không thêm phạm vi mới |
| Task 5.4: Sprint Review và Retrospective Sprint 1, 2 | `docs/as2/scrum/minutes/a2-02`, `a2-04` | 24/10/2026 | 26/10/2026 | Hoàn thành | 100 | Scrum Master; nghiệm thu: cả nhóm |
| Báo cáo LaTeX Assignment 2 theo mẫu SGU: tổng hợp, chương Scrum, CI/CD, triển khai, bàn giao | `docs/as2/report/main.tex` | 29/10/2026 | chưa có dữ liệu | Bản đầu đã soạn; chờ MSSV | 85 `[ước lượng]` | Hạn phụ thuộc thông báo của giảng viên |

Scrum Master: Nguyễn Lê Nhựt Thắng ghi biên bản `a2-01…a2-04` và điều phối Sprint. Việc "người ngoài nhóm chạy thử theo README" (tiêu chí nghiệm thu Task 5.4) chưa có bằng chứng; Hồ Thiên Ngân tìm người thử.

## B. Hồ Thiên Ngân (mô hình dữ liệu, kiến trúc)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2.3: Rà class diagram với `schema.prisma` | `docs/diagrams/class-domain.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | Nghiệm thu: Hà Thiên Long |
| Cập nhật ERD khớp schema | `docs/chung/ERD_MemberB`, `docs/diagrams/erd.puml` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | |
| Task 3.1: Rà kiến trúc và ADR 001–005 | `docs/architecture/architecture.md`, ADR | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | Nghiệm thu: Giản Thiên Lực |
| Task 4.3 và 5.1: Dữ liệu seed, tạo đơn, trạng thái đơn | Seed, `POST /orders` | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Nghiệm thu: Hà Thiên Long |
| Báo cáo LaTeX: mô hình dữ liệu, class diagram, kiến trúc và ADR | Các mục tương ứng trong `docs/as2/report/main.tex` | 29/10/2026 | chưa có dữ liệu | Nội dung đã có trong báo cáo; chờ người làm xác nhận | chưa có dữ liệu | |

## C. Hà Thiên Long (yêu cầu, truy vết, backlog, kiểm thử, Product Owner tạm)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 4.2: Viết tài liệu yêu cầu Task 1–3 | `docs/requirements/` (bản nộp Assignment 1) | 20/10/2026 | 24/10/2026 | Hoàn thành | 100 | Nghiệm thu: Giản Thiên Lực |
| Rà context-and-scope, SRS (đo NFR-01), use-case | `docs/requirements/` | 23/10/2026 | 24/10/2026 | Hoàn thành | 100 | NFR-01 đo thủ công 24/10; nghiệm thu: Hồ Thiên Ngân |
| Ma trận truy vết | `docs/traceability-matrix.md` | 23/10/2026 | 25/10/2026 | Hoàn thành (cập nhật 23/10) | 100 | NFR-03 chưa rà đủ, NFR-07 chưa có người ngoài nhóm chạy thử |
| Product Backlog, Sprint Backlog Assignment 2 | `docs/as2/scrum/minutes/a2-01…a2-04` (mục việc chọn vào Sprint) | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Product Owner tạm; Nguyễn Lê Nhựt Thắng ghi biên bản |
| Task 5.2: Test unit, tích hợp, E2E | Test đạt trong CI (36 unit, 81 tích hợp, 10 E2E) | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | `docker-compose.yml` và `/health` đã có từ Assignment 1; nghiệm thu: Hồ Thiên Ngân |
| Task 5.4: Xác nhận video demo | Liên kết video, biên bản nghiệm thu | 26/10/2026 | chưa có dữ liệu | Chờ nghiệm thu | chưa có dữ liệu | |
| Báo cáo LaTeX: yêu cầu (FR/NFR, use case), kiểm thử, ma trận truy vết | Các mục tương ứng trong `docs/as2/report/main.tex` | 29/10/2026 | chưa có dữ liệu | Nội dung đã có trong báo cáo; chờ người làm xác nhận | chưa có dữ liệu | |

## D. Giản Thiên Lực (activity, use-case, giao diện, video, slide)

| Nhiệm vụ | Sản phẩm đầu ra | Ngày bắt đầu | Hạn hoàn thành | Trạng thái | % | Ghi chú |
|---|---|---|---|---|---|---|
| Task 2.1: Rà activity diagram (swimlane, 3 nhánh lỗi) | `docs/diagrams/activity-order-flow.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | Nghiệm thu: Hồ Thiên Ngân |
| Task 1.3: Rà use-case diagram khớp SRS | `docs/diagrams/usecase-overview.puml`, `.svg` | 23/10/2026 | 24/10/2026 | Tạo phẩm có trong repo; chờ người làm xác nhận | chưa có dữ liệu | Nghiệm thu: Nguyễn Lê Nhựt Thắng |
| Task 4.3 và 5.1: Giao diện menu, giỏ, thanh toán, lịch sử | Trang web trên production | 20/10/2026 | 26/10/2026 | Hoàn thành | 100 | Nghiệm thu: Nguyễn Lê Nhựt Thắng |
| Task 5.4: Ảnh mobile cho báo cáo và README | `docs/as2/evidence` (ảnh 01–11) | 24/10/2026 | 25/10/2026 | Hoàn thành | 100 | |
| Task 5.4: Quay video demo end-to-end | Video (liên kết trong biên bản a2-04) | 25/10/2026 | 26/10/2026 | Có liên kết; chờ nghiệm thu | 100 | Nghiệm thu: Hà Thiên Long |
| Báo cáo LaTeX: activity, use-case, giao diện, minh chứng ảnh | Các mục tương ứng trong `docs/as2/report/main.tex` | 29/10/2026 | chưa có dữ liệu | Nội dung đã có trong báo cáo; chờ người làm xác nhận | chưa có dữ liệu | |
| Slide Assignment 2 | Bộ slide thuyết trình | 24/10/2026 | 26/10/2026 | chưa có dữ liệu | chưa có dữ liệu | Cần Giản Thiên Lực cập nhật tiến độ |
