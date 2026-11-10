# Bằng chứng triển khai và kiểm tra trên production

Thu thập ngày 23/10/2026. Frontend: https://brewlite-web.onrender.com, API: https://brewlite-api.onrender.com.
Sản phẩm triển khai hiện tại: tag `v0.1.3` (commit `ecd11bd`, image `sha-ecd11bd`, từ 07/11/2026). Ảnh 01–29 chụp trên bản `v0.1.2` (commit `7b1ea96`) và vẫn là bằng chứng hợp lệ cho CI/CD, rollback và bảo mật; ảnh 31–42 chụp trên `v0.1.3`.

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

## Rollback và deploy lại (Task 5.3)

Ngày 23/10/2026. Từ `v0.1.2` (`sha-7b1ea96`) lùi về `v0.1.1` (`sha-e445b63`) bằng workflow CD chạy thủ công (`workflow_dispatch`, nhập `image_tag`), rồi triển khai lại `v0.1.2`.

| Ảnh | Nội dung |
|---|---|
| 20-rollback-cd11-bo-qua-build.png | CD #11 chạy thủ công: `quality` và `build-and-push` bị bỏ qua, chỉ chạy `deploy-and-smoke-test` (xanh) |
| 21-rollback-cd11-log-deploy-sha-e445b63.png | Log bước deploy: api và web nhận image `sha-e445b63`, HTTP 200; smoke test chạy 1 phút 4 giây |
| 22-rollback-render-events-sha-e445b63.png | Render Events của `brewlite-web`: "Triggered via Deploy Hook" rồi "Deploy live" với `sha-e445b63` |
| 23-rollback-giao-dien-ban-cu-khong-co-khung-do.png | Sau rollback: thanh toán lỗi chỉ hiện thông báo ở dải trên cùng, không có khung đỏ và nút vẫn ghi "Đặt hàng và thanh toán" (đúng hành vi `v0.1.1`) |
| 24-deploy-lai-cd12-log-sha-7b1ea96.png | CD #12 triển khai lại: api và web nhận image `sha-7b1ea96`, HTTP 200 |
| 25-giao-dien-ban-moi-co-khung-do.png | Sau khi triển khai lại: khung đỏ "Thanh toán thất bại" trở lại (đúng hành vi `v0.1.2`) |

Ghi chú: ở CD #12, smoke test chỉ chạy 1 giây vì API cũ vẫn trả lời `/health` trong lúc Render thay container; việc bản mới đã chạy được xác nhận bằng giao diện (ảnh 25).

## Cơ sở dữ liệu không public (Task 5.4)

Thu thập ngày 02/11/2026.

| Ảnh | Nội dung |
|---|---|
| 26-db-khong-public.png | Trang Info của `brewlite-db`, mục Inbound IP Restrictions: bảng PostgreSQL Inbound IP Rules của database để trống, nên Render chặn mọi kết nối từ Internet vào database (hai rule `0.0.0.0/0` ở cấp Workspace và Environment là mặc định; một IP phải được mọi cấp cho phép mới kết nối được). API kết nối bằng Internal Database URL |

## Secret không nằm trong repository (NFR-03)

Thu thập ngày 02/11/2026.

| Ảnh | Nội dung |
|---|---|
| 27-github-secrets.png | GitHub, Actions secrets: `RENDER_API_DEPLOY_HOOK`, `RENDER_WEB_DEPLOY_HOOK` lưu dạng secret (chỉ hiện tên, không hiện giá trị) |
| 28-github-variables.png | GitHub, Actions variables: `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL` (URL công khai, không nhạy cảm) |
| 29-cd-log-khong-lo-secret.png | Log CD #13 (bước "Kiểm tra cấu hình" và "Deploy api và web lên Render"): chỉ in URL công khai và `HTTP 200`, không in URL Deploy Hook hay khóa |

Quét repository bằng `git grep` ngày 02/11/2026: không có khóa, token hay URL Deploy Hook thật; chỉ có giá trị mẫu trong `.env.example` và giá trị chỉ dùng cho CI (`ci-only-secret`, `ci:ci`). `JWT_SECRET` và `DATABASE_URL` production cấu hình trên Render, không nằm trong repository.

## Thanh toán QR sandbox VNPay và trừ kho nguyên liệu (v0.1.3, Task 5.4)

Thu thập ngày 07/11/2026 trên production (image `sha-ecd11bd`, tag `v0.1.3`). Cổng thanh toán là sandbox của VNPay (tiền thử nghiệm, không có tiền thật); thẻ dùng là thẻ test ngân hàng NCB do VNPay cung cấp.

| Ảnh | Minh họa cho chức năng |
|---|---|
| 31-thanh-toan-chon-vnpay-qr.png | Trang thanh toán có đủ các phương thức: ví và thẻ mô phỏng, MoMo, VNPay, chuyển khoản ngân hàng (đang chọn "VNPay - quét mã QR") |
| 32-qr-vnpay-don11-dang-cho-thanh-toan.png | Sinh mã QR cho đơn #11 (80.000đ): hộp thoại QR, đếm ngược hết hạn "Còn 9:58", trạng thái "đang chờ thanh toán". Đơn này chưa thanh toán nên không trừ kho |
| 33-kho-nguyen-lieu-truoc-khi-thanh-toan.png | Kho nguyên liệu (`/staff/ingredients`) trước khi thanh toán đơn #10: đá viên 59.587 g, cà phê hạt 4.945 g, sữa đặc 2.917 ml |
| 34-kho-nguyen-lieu-sau-khi-thanh-toan.png | Kho sau khi đơn #10 thanh toán thành công: đá viên 59.362 g, cà phê hạt 4.915 g, sữa đặc 2.872 ml |
| 35-lich-su-don-hang-don10-paid.png | Lịch sử đơn hàng: đơn #10 `PAID` 70.000đ (cùng đơn #9 `PAID`, #8 `CANCELLED`) |
| 36-vnpay-sandbox-chon-phuong-thuc.png | Chuyển hướng sang cổng sandbox VNPay: trang chọn phương thức thanh toán (Test) |
| 37-vnpay-sandbox-nhap-the-ncb-test.png | Cổng sandbox: thanh toán qua Ngân hàng NCB, số tiền 70.000 VND, nhập thẻ test |
| 38-vnpay-sandbox-xac-thuc-otp.png | Cổng sandbox: bước xác thực OTP, giao dịch có thời hạn |
| 39-brewlite-thanh-toan-thanh-cong-tren-dien-thoai.png | Quay về BrewLite (Return URL): "Thanh toán thành công", đơn #10 Cà phê sữa đá size L, 70.000đ, +7 điểm (tổng 119) |
| 40-don10-paid-tren-may-tinh-cong-diem.png | Trang xác nhận trên máy tính tự chuyển sang `PAID`, +7 điểm (tổng 119, trước đó 112) |
| 41-cd15-chay-thu-cong-image-tag-xanh.png | CD #15 chạy thủ công với `image_tag=sha-ecd11bd`: xanh, 13 giây. CD chạy từ tag `v0.1.3` đỏ ở bước smoke test (web chưa khởi động xong, HTTP 502 ở `/menu`) |
| 42-render-bien-moi-truong-vnpay-an-gia-tri.png | Render: các biến `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `PUBLIC_API_URL`, `PUBLIC_WEB_URL`, `SEED_IF_EMPTY` có cấu hình (giá trị bị ẩn) |

Số liệu tự kiểm tra: 70.000đ cho 7 điểm (1 điểm mỗi 10.000đ); 112 + 7 = 119. Mức trừ kho của đơn #10 (Cà phê sữa đá size L, hệ số 150% theo `SIZE_RECIPE_PERCENT`): đá 150 g x 1,5 = 225 g (59.587 - 59.362), cà phê 20 g x 1,5 = 30 g (4.945 - 4.915), sữa đặc 30 ml x 1,5 = 45 ml (2.917 - 2.872). Ảnh kho không ghi số đơn nên việc gắn với đơn #10 dựa vào mức trừ khớp công thức.

Phạm vi chứng minh: đơn được chốt `PAID` qua đường Return URL của VNPay. Chưa khai báo IPN URL trên cổng VNPay nên chưa có bằng chứng cho IPN; chưa thử MoMo sandbox; chưa có ảnh trang quản trị Merchant Admin của VNPay.

## Sơ đồ đi kèm

Sơ đồ PlantUML (nguồn, SVG, PNG) nằm ở `docs/diagrams/`; báo cáo LaTeX Assignment 2 dùng các bản PNG trong `docs/as2/report/uml/`.

## Chưa có trong thư mục này

- Bằng chứng IPN của VNPay, MoMo sandbox và trang giao dịch trong Merchant Admin của VNPay (xem mục thanh toán QR sandbox ở trên).
- CD đỏ lần chạy theo tag `v0.1.3` (smoke test 502 vì web chưa khởi động xong): lưu trên tab Actions của GitHub.
- Log chi tiết bước Unit test của run #13 trên GitHub (xem trên tab Actions).
- CD đỏ lần đầu (tag `v0.1.0`, thiếu cấu hình URL và hook): lưu trên tab Actions của GitHub.
