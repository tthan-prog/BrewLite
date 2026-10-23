# Bối cảnh, stakeholder và phạm vi (Assignment 2 – Task 1.1)

> **Trạng thái: bản nháp để E hoàn thiện.** Các dòng có `[điền]` cần nhóm bổ sung; phần còn lại là đề xuất đã thống nhất trong tài liệu phân tích.

## 1. Vấn đề nghiệp vụ

Quán cà phê quy mô nhỏ cần để khách đặt món và thanh toán không dùng tiền mặt ngay trên điện thoại, tránh xếp hàng và nhầm đơn. BrewLite là ứng dụng web mobile-first cho phép khách xem menu, chọn size và topping, đặt đơn, thanh toán mô phỏng và theo dõi trạng thái đơn. [điền: bối cảnh cụ thể nhóm chọn]

## 2. Stakeholder

| Stakeholder | Vai trò | Mục tiêu và kỳ vọng | Ảnh hưởng đến yêu cầu |
|---|---|---|---|
| Khách hàng | Người đặt và thanh toán đơn | Đặt nhanh, giá rõ ràng, theo dõi được đơn | Menu, giỏ hàng, thanh toán, lịch sử đơn |
| Nhân viên quầy | Pha chế, cập nhật trạng thái | Nhận đúng đơn đã thanh toán, cập nhật trạng thái đơn giản | Quản lý trạng thái đơn (`PATCH /orders/:id/status`) |
| Quản lý cửa hàng | Quản lý sản phẩm và khuyến mãi | Kiểm soát tồn kho, mã khuyến mãi, doanh thu | Tồn kho, khuyến mãi; giao diện quản trị ngoài MVP |
| Giảng viên / khách hàng nghiệm thu | Người chấm | Sản phẩm chạy được, có tài liệu, quy trình và bằng chứng | Toàn bộ tạo phẩm của Assignment 2 |
| Nhóm phát triển | Xây dựng sản phẩm | Hoàn thành đúng hạn, dễ bảo trì | Ràng buộc công nghệ, CI/CD |
| Đơn vị thanh toán (mô phỏng) | Xử lý Ví/Thẻ | Nhận yêu cầu thanh toán hợp lệ, không trừ tiền lặp | Idempotency, trạng thái thanh toán |

## 3. Phạm vi

### 3.1. Trong phạm vi MVP

- Xem menu và chi tiết sản phẩm (size S/M/L, topping).
- Giỏ hàng và tính tổng tiền.
- Đăng ký, đăng nhập, JWT; phân quyền CUSTOMER và STAFF.
- Tạo đơn hàng; thanh toán mô phỏng bằng Ví hoặc Thẻ.
- Xác nhận đơn, theo dõi trạng thái, lịch sử đơn.
- Nghiệp vụ lõi: máy trạng thái đơn, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi, điểm thưởng.
- Triển khai production qua CI/CD.

### 3.2. Phạm vi mở rộng (nếu còn thời gian)

- PWA cài đặt được đầy đủ (offline, thông báo).
- Giao diện quản lý sản phẩm, khuyến mãi, thống kê.
- Giao diện riêng cho nhân viên quầy.

### 3.3. Không thực hiện (Won't)

- Kết nối cổng thanh toán thật.
- Ứng dụng di động native.
- Giao hàng, bản đồ, nhiều chi nhánh.
- Quản lý nguyên liệu chi tiết (chỉ dùng `Product.stock`).

## 4. Giả định

| # | Giả định |
|---|---|
| G1 | Thanh toán là mô phỏng, có thể thành công hoặc thất bại theo kịch bản kiểm thử |
| G2 | Một cửa hàng duy nhất, một loại tiền (VND) |
| G3 | Phụ phí size: S +0, M +5.000, L +10.000 đồng |
| G4 | Điểm thưởng: 1 điểm cho mỗi 10.000 đồng của đơn hoàn tất |
| G5 | Tồn kho chỉ tính trên `Product.stock`, trừ khi tạo đơn, hoàn lại khi đơn bị hủy |
| G6 | Đơn mới tạo ở trạng thái PENDING; thanh toán chuyển sang PAID hoặc PAYMENT_FAILED |
| G7 | Nhóm tự chọn các điểm đề chưa nêu rõ và báo giảng viên để xác nhận |

## 5. Ràng buộc

| # | Ràng buộc |
|---|---|
| R1 | Bắt buộc Next.js (frontend), NestJS (backend), PostgreSQL; được bổ sung công nghệ khác |
| R2 | Frontend theo hướng mobile-first/PWA |
| R3 | Hạn nộp 27/10/2026 |
| R4 | Nhóm 5 người, làm theo Scrum |
| R5 | Production phải truy cập được qua HTTPS; DB production không public; secret không nằm trong repo |
| R6 | Task làm tuần tự và có lịch sử commit rõ ràng |

## 6. Rủi ro ban đầu

| # | Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|---|
| RK1 | Không kịp triển khai production | Trung bình | Cao | Deploy thử sớm (23/10) |
| RK2 | Hai bài tập lớn chồng lịch | Cao | Trung bình | Dùng chung mã nguồn, ưu tiên theo `plan-2-assignment.md` |
| RK3 | Lỗi đặt đơn đồng thời gây âm tồn kho | Trung bình | Cao | Cập nhật có điều kiện trong transaction, có test |
| RK4 | Sơ đồ và SRS mâu thuẫn nhau | Trung bình | Trung bình | Rà bằng `traceability-matrix.md` |
| RK5 | Thành viên chậm tiến độ | Trung bình | Trung bình | Quy trình trong `team-agreement.md` |
