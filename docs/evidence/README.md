# Bằng chứng triển khai và kiểm tra trên production

Thu thập ngày 23/10/2026. Frontend: https://brewlite-web.onrender.com, API: https://brewlite-api.onrender.com.
Sản phẩm triển khai: tag `v0.1.2` (commit `7b1ea96`, image `sha-7b1ea96`).

## Luồng người dùng trên production

| Ảnh | Nội dung |
|---|---|
| 01-menu.png | Thực đơn tải từ API, đã đăng nhập `customer@brewlite.com` |
| 02-chon-size.png | Chọn size, mức đường, mức đá |
| 03-gio-hang.png | Giỏ hàng: 10 ly, 34.000đ/ly, tạm tính 340.000đ |
| 04-thanh-toan.png | Trang thanh toán (thẻ mô phỏng, mã `WELCOME10`) |
| 05-xac-nhan-don1-paid.png | Đơn #1 `PAID`, tổng 306.000đ (340.000đ trừ 10%) |
| 06-lich-su-don1.png | Lịch sử đơn có đơn #1 |
| 09-thanh-toan-that-bai.png | Giả lập thanh toán thất bại: đơn #2 `PAYMENT_FAILED`, khung lỗi và nút "Thử thanh toán lại" |
| 10-thu-lai-don2-paid.png | Thử lại thành công: đơn #2 `PAID`, tổng 585.000đ (650.000đ trừ 10%) |
| 11-lich-su-2-don.png | Lịch sử có đúng hai đơn #1, #2, không tạo đơn trùng khi thử lại |

## HTTPS và API

| Ảnh | Nội dung |
|---|---|
| 07-https-ket-noi-an-toan.png | Trình duyệt báo "Connection is secure" cho brewlite-web.onrender.com |
| 08-health-ok.png | `https://brewlite-api.onrender.com/health` trả `{"status":"ok","service":"brewlite-backend"}` |

## CI/CD

| Ảnh | Nội dung |
|---|---|
| 15-ci-xanh-merge-pr22.png | CI xanh 4/4 job (api, api-e2e, web, e2e-browser) sau khi merge PR #22 |
| 12-cd-v0.1.1-xanh.png | CD chạy từ tag `v0.1.1`: quality, build-and-push, deploy-and-smoke-test đều xanh |
| 13-cd-v0.1.2-xanh.png | CD chạy từ tag `v0.1.2` (commit `7b1ea96`) xanh |
| 14-render-events-deploy-sha-7b1ea96.png | Render Events: "Deploy started ... Triggered via Deploy Hook" rồi "Deploy live" cho image `sha-7b1ea96` |

## CI chặn merge khi test sai (Task 4.4)

PR thử nghiệm #30 (đóng, không merge): cố ý đổi kỳ vọng một test trong `apps/api/src/orders/order-state.spec.ts`
(đơn `PAID` không được nhảy thẳng sang `COMPLETED`), rồi sửa lại.

| Ảnh | Nội dung |
|---|---|
| 19-test-loi-chay-o-may.png | Chạy test ở máy: `expected false to be true`, 1 test lỗi |
| 16-ci-do-run13-job-api-loi.png | CI run #13 **đỏ**: job `api` lỗi, các job còn lại xanh |
| 17-pr30-merge-bi-chan.png | PR #30: check `api` (Required) đỏ, "Merging is blocked", nút Merge bị làm mờ, thêm yêu cầu Review |
| 18-ci-xanh-run14-sau-khi-sua.png | Sau commit khôi phục test, CI run #14 **xanh** cả 4 job |

## Chưa có trong thư mục này

- Log chi tiết bước Unit test của run #13 trên GitHub (xem trên tab Actions).
- CD đỏ lần đầu (tag `v0.1.0`, thiếu cấu hình URL và hook): lưu trên tab Actions của GitHub.
- Ảnh cấu hình database chặn truy cập từ Internet (inbound IP rules trống): bổ sung từ trang Render, che các giá trị nhạy cảm.
