# Bảng đóng góp của các thành viên

- **Nhóm:** 4 thành viên (A Nguyễn Lê Nhựt Thắng, B Hồ Thiên Ngân, C Hà Thiên Long, D Giản Thiên Lực).
- **Trạng thái:** bản đề xuất để nhóm xác nhận; ô MSSV và chữ ký xác nhận của từng người để trống cho tới khi nhóm thống nhất.
- **Nguồn:** `assignment1-phan-cong.md`, `assignment2-phan-cong.md`, `product-backlog.md` (điểm từng task), lịch sử commit trên GitHub.

## 1. Cách tính

1. **Assignment 1: theo điểm ước lượng của Product Backlog** (tổng 40 điểm: T1 = 2, T2 = 3, T3 = 3, T4 = 3, T5 = 3, T6 = 5, T7 = 5, T8 = 5, T9 = 3, T10 = 8). Mỗi task tính cho người viết chính. Hai trường hợp có hai người: Task 2 (B làm schema/seed, C làm API) và Task 10 (B làm 10b, 10c; C làm 10a, 10d) chia đều 50/50 `[quy ước, vì tài liệu không ghi tỷ lệ]`. Việc của thành viên E cũ (Task 9) tính cho A.
2. **Assignment 2: theo số hạng mục trong kế hoạch phân công** (tổng 27 hạng mục, mỗi hạng mục tính 1 đơn vị vì Assignment 2 chưa có điểm ước lượng riêng). A có 13 hạng mục: 7 việc code, CI/CD, triển khai, Scrum Master và 6 việc yêu cầu, truy vết, backlog nhận từ thành viên E cũ; B có 4; C có 5; D có 5.
3. **Tổng:** trung bình của hai tỷ lệ, vì mỗi bài tập lớn có trọng số 10 điểm như nhau.
4. **Hạn chế:** đây là khối lượng được giao, không phải số giờ làm. Số commit chỉ để tham khảo và không đưa vào công thức, vì commit nhiều hay ít chưa phản ánh độ khó.

## 2. Kết quả

| Thành viên | Assignment 1 (điểm) | Tỷ lệ AS1 | Assignment 2 (hạng mục) | Tỷ lệ AS2 | Tổng đề xuất |
|---|---|---|---|---|---|
| A Nguyễn Lê Nhựt Thắng | 5 | 12,5% | 13 | 48,1% | **30,3%** |
| B Hồ Thiên Ngân | 10,5 | 26,3% | 4 | 14,8% | **20,5%** |
| C Hà Thiên Long | 15,5 | 38,8% | 5 | 18,5% | **28,6%** |
| D Giản Thiên Lực | 9 | 22,5% | 5 | 18,5% | **20,5%** |
| Cộng | 40 | 100% | 27 | 100% | 99,9% (do làm tròn) |

## 3. Số liệu tham khảo (không dùng trong công thức)

| Thành viên | Số commit trên GitHub (mọi nhánh) | Ghi chú |
|---|---|---|
| A | 113 | Gồm hai tên tài khoản "Le Thang" (110) và "Nhựt Thắng" (3) |
| B | 6 | Hồ Thiên Ngân |
| C | 3 | hathienlong |
| D | 2 | "Thành viên D" |

Số commit lệch rõ rệt: phần lớn mã của Assignment 2 và việc gộp nhánh do A thực hiện trực tiếp. Bảng ở mục 2 phản ánh việc được giao theo kế hoạch, nên không thay cho nhận xét này; nhóm cần xác nhận chính thức trước khi nộp.

## 4. Đề xuất cân đối công việc (chỉ gồm việc có thật còn mở)

Không điều chỉnh số cho đẹp. Muốn tỷ lệ của A nhỉnh hơn một chút mà vẫn hợp lý, cách tự nhiên là để các việc dưới đây do chính người phụ trách mảng đó làm và ghi nhận bằng commit hoặc Pull Request:

| Việc còn mở | Đề xuất người làm | Lý do |
|---|---|---|
| Cập nhật `sequence-checkout` theo logic trừ nguyên liệu khi thanh toán | C | C phụ trách sequence diagram |
| Cập nhật `activity-order-flow` theo logic mới | D | D phụ trách activity diagram |
| Cập nhật ADR-005 và viết ADR cho cơ chế mới | B | B phụ trách ADR và dữ liệu |
| Ghi Approve hoặc comment nghiệm thu trên các PR | Người nghiệm thu theo `dod-nghiem-thu.md` (B, C, D) | Bằng chứng DoD mục D2 còn thiếu |
| Người ngoài nhóm chạy hệ thống theo README (NFR-07) | B hoặc C tìm người thử | Chưa có bằng chứng |
| Rà secret (NFR-03) | B | Mới dò sơ bộ |
| Hoàn thiện slide Assignment 1 và 2 | D | Còn ghi "Đang làm" |
| SRS, use-case, ma trận truy vết, báo cáo LaTeX | A | Đã thuộc phần của A |

Sau khi các việc trên thật sự hoàn thành, cập nhật lại hai bảng phân công và tính lại bảng này.
