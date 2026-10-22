# Quy trình nghiệm thu chéo theo Definition of Done (DoD)

Mục đích: mỗi task trong 10 task của Assignment 1 có **bằng chứng** đạt DoD để được tính 1 điểm. Hạn hoàn thành: **tối 24/10/2026**. Điều phối: A.

## 1. Quy tắc

- Người nghiệm thu **không** phải người viết task đó.
- Mỗi người nghiệm thu từ 2 đến 3 task theo bảng phân công ở mục 2.
- Kết quả ghi vào bảng mục 5 và vào Pull Request (comment hoặc Approve). Chụp ảnh màn hình làm bằng chứng nếu được.
- Task không đạt: ghi rõ lý do, báo A để người viết sửa, sau đó nghiệm thu lại.

## 2. Phân công người nghiệm thu

| Task | Nội dung | Người viết chính | Người nghiệm thu |
|---|---|---|---|
| 1 | Khởi tạo dự án | A | B |
| 2 | API sản phẩm | C (B: schema, seed) | D |
| 3 | Trang Menu | D | E |
| 4 | Chi tiết, size, topping | D | C |
| 5 | Giỏ hàng | D | B |
| 6 | API tạo đơn | B | D |
| 7 | Đăng ký, đăng nhập | C | E |
| 8 | Thanh toán | C | B |
| 9 | Xác nhận, lịch sử đơn | E | C |
| 10 | Nghiệp vụ nâng cao | B, C | E |

## 3. Chuẩn bị (mỗi người nghiệm thu làm một lần)

```powershell
git checkout main
git pull
cp .env.example .env            # PowerShell: Copy-Item .env.example .env
docker compose up --build
# terminal thứ hai, chỉ chạy lần đầu:
docker compose exec backend npx prisma db seed --config prisma7.config.ts
```

Mở http://localhost:3000/menu. Tài khoản mẫu: `customer@brewlite.com` và `staff@brewlite.com`, mật khẩu `password123`. Mã khuyến mãi: `WELCOME10`, `SAVE20K`.

## 4. Bốn mục DoD áp dụng cho mọi task

| Mục | Cách kiểm tra |
|---|---|
| D1. Chạy được, không lỗi build | Docker chạy đủ 3 dịch vụ; hoặc `cd backend; npm run build` và `cd frontend; npm run build` không lỗi |
| D2. Commit rõ ràng, được review | Có commit của task trong `git log`; Pull Request có ít nhất 1 Approve của người khác (không phải người viết) |
| D3. Validate và loading/lỗi | API trả 400 khi gửi dữ liệu sai; giao diện hiển thị loading và thông báo lỗi |
| D4. README có hướng dẫn chạy | Làm theo README mục 6 chạy được task đó |

## 5. Bảng kiểm tra riêng từng task

Cách thử nhanh API (PowerShell, dùng `curl.exe`; hoặc dùng Postman):

```powershell
curl.exe http://localhost:3001/products
curl.exe -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d "{\"email\":\"customer@brewlite.com\",\"password\":\"password123\"}"
```

| Task | Việc cần thử (đạt khi...) |
|---|---|
| 1 | `http://localhost:3001/` trả "Hello BrewLite!"; `/health` trả `{"status":"ok",...}`; frontend mở được |
| 2 | `GET /products` trả 12 sản phẩm có id, name, price, imageUrl; `GET /products/:id` trả đúng sản phẩm; id không tồn tại trả 404 |
| 3 | Trang `/menu` hiển thị lưới sản phẩm từ API; có trạng thái loading; tắt backend thì hiện thông báo lỗi |
| 4 | Mở chi tiết, chọn size S/M/L và topping thì giá thay đổi (M +5.000, L +10.000, cộng topping) |
| 5 | Thêm, sửa số lượng, xóa sản phẩm trong giỏ; tổng tiền và số lượng trên biểu tượng giỏ cập nhật đúng |
| 6 | Đăng nhập, đặt hàng thì tạo đơn PENDING và trả mã đơn; thiếu `Idempotency-Key` hoặc dữ liệu sai trả 400; chưa đăng nhập trả 401 |
| 7 | Đăng ký tài khoản mới rồi đăng nhập được; sai mật khẩu bị từ chối; email trùng bị từ chối; token dùng được cho `GET /auth/me` |
| 8 | Thanh toán bằng Ví hoặc Thẻ thì đơn thành PAID; chọn mô phỏng lỗi thì thành PAYMENT_FAILED và thử lại được; giỏ được giữ khi lỗi |
| 9 | Sau khi thanh toán hiện trang xác nhận có mã đơn và trạng thái; `/orders/history` liệt kê đơn của tôi; `docker compose up --build` chạy ổn |
| 10 | Chạy `npm test` và `npm run test:e2e` trong `backend` thì đạt. Xem 3 nhóm test: 10a chặn chuyển trạng thái sai, 10b cùng `Idempotency-Key` chỉ tạo 1 đơn, 10c đặt đồng thời không vượt tồn kho. Thử thủ công: STAFF chuyển PAID, PREPARING, READY, COMPLETED đúng thứ tự, chuyển sai bị từ chối |

## 6. Ghi kết quả

Người nghiệm thu điền bảng này (hoặc gửi cho A điền). Cập nhật tiếp vào README mục 8.2 và báo cáo mục 6.4.

| Task | Người nghiệm thu | Ngày | D1 | D2 | D3 | D4 | Kết luận | Ghi chú / link PR |
|---|---|---|---|---|---|---|---|---|
| 1 | B | | | | | | | |
| 2 | D | | | | | | | |
| 3 | E | | | | | | | |
| 4 | C | | | | | | | |
| 5 | B | | | | | | | |
| 6 | D | | | | | | | |
| 7 | E | | | | | | | |
| 8 | B | | | | | | | |
| 9 | C | | | | | | | |
| 10 | E | | | | | | | |

Điền "Đạt" hoặc "Chưa đạt" cho từng cột D1 đến D4. Kết luận "Đạt" khi cả 4 cột đều đạt.

## 7. Tiến trình

| Mốc | Việc | Người làm |
|---|---|---|
| Sáng 23/10 | A mở Pull Request, gửi bảng phân công vào nhóm chat | A |
| 23/10 đến trưa 24/10 | Mỗi người nghiệm thu task của mình, Approve PR, ghi kết quả | B, C, D, E |
| Chiều 24/10 | A tổng hợp, cập nhật README mục 8.2 và báo cáo mục 6.4 | A |
| Tối 24/10 | Mốc cắt phạm vi: task chưa đạt thì sửa hoặc đưa vào backlog | Cả nhóm |
| 25/10 | Sprint 3 Review và Retrospective, đóng băng code tối | Cả nhóm |
