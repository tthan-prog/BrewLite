# Tài liệu Scrum – BrewLite

Thư mục này lưu **bằng chứng làm theo Scrum** (đề yêu cầu quy trình Agile Scrum đầy đủ). Cập nhật đều đặn, không để dồn về cuối.

## Danh sách tài liệu

| File | Nội dung | Người giữ |
|---|---|---|
| `product-backlog.md` | 10 task của đề dưới dạng user story, tiêu chí chấp nhận, ước lượng điểm | A (PO tạm) |
| `sprint-1-backlog.md` | Mục tiêu và việc của Sprint 1 (tạo thêm file cho Sprint 2, 3 bằng cách sao chép) | A |
| `burndown-sprint-1.csv` | Số điểm còn lại mỗi ngày của Sprint 1 | A |
| `meeting-minutes-template.md` | Mẫu biên bản họp (Planning, Daily khi cần, Review) | A |
| `retrospective-template.md` | Mẫu biên bản Sprint Review và Retrospective | A |

## Nhịp Sprint (giả định nộp 27/10/2026, cần xác nhận)

| Sprint | Thời gian | Task theo đề | Sprint Review + Retrospective |
|---|---|---|---|
| 1 | 14–18/10 | 1, 2, 3, 4 | 18/10 |
| 2 | 19–22/10 | 7, 5, 6 | 22/10 |
| 3 | 23–25/10 | 8, 9, 10 | 25/10 |
| Hoàn thiện | 26/10 | rà DoD, test e2e, báo cáo, slide, tập demo | – |
| Nộp / bảo vệ | 27/10 | – | – |

## Sự kiện Scrum và cách ghi lại

- **Sprint Planning** (đầu Sprint): chọn việc từ Product Backlog, chốt Sprint Goal, ghi vào `sprint-N-backlog.md`.
- **Daily Scrum** (mỗi ngày, tối đa 15 phút, có thể qua chat): mỗi người trả lời "đã làm gì / sẽ làm gì / đang vướng gì". Sau đó cập nhật Burndown.
- **Sprint Review** (cuối Sprint): demo Increment; ghi kết quả vào biên bản.
- **Sprint Retrospective** (ngay sau Review): điều làm tốt, điều cần cải thiện, hành động cụ thể cho Sprint sau.

## Cách cập nhật Burndown

1. Sau khi A ước lượng điểm (story points) cho các task, tổng điểm của Sprint là số điểm ở ngày bắt đầu.
2. Đường lý tưởng giảm đều đến 0 vào ngày cuối Sprint. Điền cột `ly_tuong` ngay khi lập Sprint Backlog.
3. Cuối mỗi ngày, A ghi số điểm còn lại vào cột `thuc_te`. Chỉ trừ điểm khi task đạt Definition of Done.
4. Thực tế nằm trên đường lý tưởng là đang chậm; nằm dưới là vượt tiến độ.

## Definition of Done

Một task được tính xong khi: code chạy được và không lỗi build; có commit rõ ràng và được review; API có validate đầu vào, giao diện xử lý loading/lỗi cơ bản; README có hướng dẫn chạy; **được một thành viên khác nghiệm thu**. Chi tiết ở README gốc, Mục 11.

## Bằng chứng đã có (cập nhật 23/10/2026)

| File | Nội dung |
|---|---|
| `sprint-1-backlog.md`, `sprint-2-backlog.md`, `sprint-3-backlog.md` | Backlog từng Sprint, điểm, người làm, rủi ro |
| `burndown-sprint-1.csv`, `-2.csv`, `-3.csv`, `burndown-ghi-chu.md` | Dữ liệu Burndown và cách tính |
| `minutes/01…06-*.md` | Biên bản Planning, Review, Retrospective (bản nháp để nhóm rà soát) |
