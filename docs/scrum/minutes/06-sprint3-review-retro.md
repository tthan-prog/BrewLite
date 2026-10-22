# Sprint Review và Retrospective – Sprint 3 – 25/10/2026

> **Bản nháp do A soạn trước buổi họp**, dựa trên kết quả đến 23/10/2026. Sau buổi họp, nhóm sửa giờ, danh sách có mặt và nội dung cho đúng thực tế.

- **Thời gian:** 25/10/2026, 21:00 – 22:00
- **Người ghi biên bản:** A
- **Có mặt:** A, B, C, D, E

## Phần 1. Sprint Review

| Task | Demo được? | Đạt DoD? | Người nghiệm thu | Ghi chú |
|---|---|---|---|---|
| 2 (API sản phẩm) | Có | Đạt | Nhóm | `/products`, `/toppings` |
| 7 (Đăng ký, đăng nhập) | Có | Đạt | Nhóm | JWT, bcrypt, phân quyền |
| 8 (Thanh toán) | Có | Đạt | Nhóm | Ví/Thẻ, PAID/PAYMENT_FAILED, thử lại |
| 9 (Xác nhận, lịch sử) | Có | Đạt | Nhóm | Docker chạy 3 dịch vụ |
| 10 (Nghiệp vụ nâng cao) | Có | Đạt | Nhóm | 22 unit + 32 e2e đạt |

- **Sprint Goal đã đạt chưa:** Đạt. Đường găng Task 7 → 8 → 9 → 10 hoàn thành.
- **Increment demo được:** luồng menu, giỏ hàng, đăng nhập, thanh toán, xác nhận đơn, lịch sử; STAFF đổi trạng thái đơn qua API.
- **Điều chỉnh Product Backlog sau Review:** đưa vào backlog sau: giao diện barista, cổng thanh toán thật, lưu đường/đá vào đơn.

## Phần 2. Sprint Retrospective

| Điều làm tốt, nên giữ | Điều chưa tốt, cần cải thiện |
|---|---|
| Làm theo đường găng, có test chứng minh nghiệp vụ Task 10 | Bắt đầu muộn, Sprint 1 trễ 9 điểm |
| README và Docker giúp chạy lại dễ dàng | Chốt mô hình dữ liệu muộn |
| Có nghiệm thu chéo trước khi nộp | Phân bố commit chưa đều giữa các thành viên |

### Hành động cụ thể cho Sprint sau

| Hành động | Người làm | Kiểm tra vào |
|---|---|---|
| Chốt ERD ngay Sprint Planning đầu tiên | B | Đầu Sprint tiếp theo |
| Mỗi thành viên có commit hoặc PR trong từng Sprint | Cả nhóm | Mỗi Daily |
| Review PR trong 24 giờ | Cả nhóm | Mỗi Sprint Review |

## Phần 3. Burndown

- Điểm còn lại cuối Sprint: 0 trên 24 điểm.
- Nhận xét: Sprint 3 bắt đầu bằng 8 điểm tồn từ Sprint 2; toàn bộ hoàn thành ngay từ 23/10 nên đường thực tế nằm dưới đường lý tưởng.
