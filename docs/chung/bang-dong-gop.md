# Bảng đóng góp của các thành viên

- **Nhóm:** 4 thành viên (A Nguyễn Lê Nhựt Thắng, B Hồ Thiên Ngân, C Hà Thiên Long, D Giản Thiên Lực).
- **Trạng thái:** bản đề xuất để nhóm xác nhận; ô MSSV và chữ ký xác nhận của từng người để trống cho tới khi nhóm thống nhất.
- **Nguồn:** `docs/as1/phan-cong.md`, `docs/as2/phan-cong.md`, `docs/as1/scrum/product-backlog.md` (điểm từng task), lịch sử commit trên GitHub.

## 1. Cách tính

1. **Assignment 1: theo điểm ước lượng của Product Backlog** (tổng 40 điểm: T1 = 2, T2 = 3, T3 = 3, T4 = 3, T5 = 3, T6 = 5, T7 = 5, T8 = 5, T9 = 3, T10 = 8). Mỗi task tính cho người viết chính. Các task có hai người chia đều 50/50 `[quy ước, vì tài liệu không ghi tỷ lệ]`: Task 2 (A làm API, B làm schema, seed), Task 7 (A làm backend, C làm giao diện), Task 9 (C làm giao diện, A làm API, Docker, README) và Task 10 (B làm 10b, 10c; A làm 10a, 10d). Task 1, 8 tính cho A; Task 3, 4, 5 cho D; Task 6 cho B.
2. **Assignment 2: theo số hạng mục trong kế hoạch phân công** (tổng 32 hạng mục, mỗi hạng mục tính 1 đơn vị vì Assignment 2 chưa có điểm ước lượng riêng). A có 14 hạng mục (code, CI/CD, triển khai, Docker, sequence diagram, ADR triển khai, tài liệu vận hành, Sprint Review/Retro, báo cáo); B có 5; C có 7 (yêu cầu, truy vết, backlog, kiểm thử, video, báo cáo); D có 6. Mỗi người có một phần báo cáo riêng, tính là một hạng mục.
3. **Tổng:** trung bình của hai tỷ lệ, vì mỗi bài tập lớn có trọng số 10 điểm như nhau.
4. **Hạn chế:** đây là khối lượng được giao, không phải số giờ làm. Số commit chỉ để tham khảo và không đưa vào công thức, vì commit nhiều hay ít chưa phản ánh độ khó.

## 2. Kết quả

| Thành viên | Assignment 1 (điểm) | Tỷ lệ AS1 | Assignment 2 (hạng mục) | Tỷ lệ AS2 | Tổng đề xuất |
|---|---|---|---|---|---|
| A Nguyễn Lê Nhựt Thắng | 16,5 | 41,3% | 14 | 43,8% | **42,5%** |
| B Hồ Thiên Ngân | 10,5 | 26,3% | 5 | 15,6% | **20,9%** |
| C Hà Thiên Long | 4 | 10,0% | 7 | 21,9% | **15,9%** |
| D Giản Thiên Lực | 9 | 22,5% | 6 | 18,8% | **20,6%** |
| Cộng | 40 | 100% | 32 | 100,1% (làm tròn) | 99,9% (làm tròn) |

## 3. Số liệu tham khảo (không dùng trong công thức)

| Thành viên | Số commit trên GitHub (mọi nhánh) | Ghi chú |
|---|---|---|
| A | 113 | Nguyễn Lê Nhựt Thắng |
| B | 6 | Hồ Thiên Ngân |
| C | 3 | Hà Thiên Long |
| D | 2 | Giản Thiên Lực|

Số commit lệch rõ rệt: phần lớn mã của Assignment 2 và việc gộp nhánh do A thực hiện trực tiếp. Bảng ở mục 2 phản ánh việc được giao theo kế hoạch, nên không thay cho nhận xét này; nhóm cần xác nhận chính thức trước khi nộp.

## 4. Đề xuất cân đối công việc (chỉ gồm việc có thật còn mở)

Không điều chỉnh số cho đẹp. Muốn tỷ lệ của A nhỉnh hơn một chút mà vẫn hợp lý, cách tự nhiên là để các việc dưới đây do chính người phụ trách mảng đó làm và ghi nhận bằng commit hoặc Pull Request:

| Việc còn mở | Đề xuất người làm | Lý do |
|---|---|---|
| Cập nhật `sequence-order`, `sequence-payment` theo logic trừ nguyên liệu khi thanh toán | A | A phụ trách sequence diagram |
| Cập nhật `activity-order-flow` theo logic mới | D | D phụ trách activity diagram |
| Cập nhật ADR-005 và viết ADR cho cơ chế mới | B | B phụ trách ADR và dữ liệu |
| Người ngoài nhóm chạy hệ thống theo README (NFR-07) | B hoặc C tìm người thử | Chưa có bằng chứng |
| Rà secret (NFR-03) | B | Mới dò sơ bộ |
| Slide Assignment 2 (cuối kì) | D | Đã có (Assignment 1 chỉ cần báo cáo, không cần slide) |
| SRS, use-case, ma trận truy vết | C | Đã thuộc phần của C |
| Báo cáo LaTeX Assignment 2 | A | Đã thuộc phần của A |

Sau khi các việc trên thật sự hoàn thành, cập nhật lại hai bảng phân công và tính lại bảng này.
