# Triển khai và rollback (Assignment 2 – Task 3.2 và 5.3–5.4)

> **Trạng thái (23/10/2026):** đã triển khai thật lên Render (ADR-007). Pipeline CD chạy xanh một lần đầy đủ (quality, build, push GHCR, deploy hook, smoke test) từ nhánh `fix/cd-config-check`. Mục nào chưa chạy thử ghi **[Chưa kiểm chứng]**.

## 1. Ba môi trường

| Môi trường | Mục đích | Cách chạy | Dữ liệu |
|---|---|---|---|
| Local | Lập trình, thử nghiệm | `docker compose up --build` hoặc chạy từng dịch vụ (xem README) | DB trong Docker, mất khi `down -v` |
| CI | Kiểm tra tự động mỗi pull request | GitHub Actions (`.github/workflows/ci.yml`) | DB tạm trong job `api-e2e` |
| Production | Bản chạy chấm điểm | Render (2 Web Service chạy image GHCR + PostgreSQL) | PostgreSQL của Render, không public |

## 2. Thông tin production (điền sau khi triển khai)

| Mục | Giá trị |
|---|---|
| URL frontend (HTTPS) | https://brewlite-web.onrender.com |
| URL API | https://brewlite-api.onrender.com |
| Health check | https://brewlite-api.onrender.com/health |
| Nền tảng | Render (gói Free, region Singapore) |
| Registry | GitHub Container Registry (`ghcr.io/tthan-prog/brewlite-api`, `brewlite-web`) |
| Phiên bản hiện tại (tag) | [điền tag phát hành sau khi gắn, ví dụ v0.1.1] |
| Database | Render PostgreSQL 16 (Free); chỉ truy cập qua Internal Database URL, inbound IP rules đã chặn toàn bộ truy cập từ Internet |

**Giới hạn của gói Free (đã thấy trên bảng điều khiển Render ngày 23/10/2026):**
- Web Service tự tắt khi không có truy cập; request đầu tiên sau đó có thể chậm khoảng 50 giây trở lên. Trước khi demo hoặc chấm bài, mở URL web một lần để đánh thức.
- Database Free hết hạn ngày **22/11/2026** và bị xóa nếu không nâng cấp; không có sao lưu.

## 3. Biến môi trường và secret

| Biến | Nơi lưu | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Env của service API trên Render | Dùng **Internal Database URL** của PostgreSQL Render; không đưa vào repo hoặc log |
| `JWT_SECRET` | Env của service API | Chuỗi dài, ngẫu nhiên (tạo bằng `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Env của service API | Ví dụ `1d` |
| `FRONTEND_ORIGIN` | Env của service API | URL web production (CORS), ví dụ `https://brewlite-web.onrender.com` |
| `PORT` | Env của hai service | API: `3001`; Web: `3000` |
| `SEED_IF_EMPTY` | Env của service API | `true` ở lần deploy đầu để nạp dữ liệu mẫu **chỉ khi CSDL rỗng**; sau đó có thể xóa |
| `NEXT_PUBLIC_API_URL` | GitHub **Variable** `PRODUCTION_API_URL` | Gắn lúc build image web; đổi giá trị thì phải build lại (chạy lại CD) |
| `PRODUCTION_WEB_URL` | GitHub Variable | Dùng cho smoke test |
| `RENDER_API_DEPLOY_HOOK`, `RENDER_WEB_DEPLOY_HOOK` | GitHub **Secrets** | Deploy Hook URL của từng service (Settings của service trên Render); là bí mật, không in ra log |

## 4. Thiết lập lần đầu (làm một lần) – đã làm thật ngày 23/10/2026

1. **Đẩy repo lên GitHub** và để hai package GHCR là Public sau lần đẩy image đầu (Packages → brewlite-api/web → Package settings → Change visibility → Public). Image public thì Render không cần credential.
2. **Tạo PostgreSQL trên Render** (New → PostgreSQL, gói Free). Chép **Internal Database URL**.
3. **Chạy CD lần đầu để có image:** đặt trước GitHub Variables `PRODUCTION_API_URL` (URL dự kiến của API) rồi đẩy tag `v0.1.0` (hoặc chạy tay workflow CD). Bước deploy sẽ lỗi vì chưa có hook, nhưng image đã lên GHCR.
4. **Tạo hai Web Service trên Render** (New → Web Service → *Existing image*):
   - API: image `ghcr.io/<owner-viết-thường>/brewlite-api:<tag>`; env như mục 3; Health Check Path `/health`.
   - Web: image `ghcr.io/<owner>/brewlite-web:<tag>`; env `PORT=3000`.
5. **Lấy Deploy Hook** của từng service (Settings → Deploy Hook) và lưu vào GitHub Secrets như mục 3. Lưu URL API/Web vào GitHub Variables.
6. **Chạy lại CD** (đẩy tag mới, hoặc Actions → CD → Run workflow). Pipeline sẽ build, đẩy image, gọi hook, rồi smoke test.
7. Mở URL web, đăng nhập tài khoản mẫu `customer@brewlite.com` / `password123` (nếu đã bật `SEED_IF_EMPTY=true`) và chụp ảnh làm bằng chứng. **Đổi hoặc xóa tài khoản mẫu trước khi để lâu trên production** vì mật khẩu mẫu công khai trong README.

**Những điểm đã vấp khi làm thật (để người sau tránh):**
- GitHub **Variables** `PRODUCTION_API_URL`, `PRODUCTION_WEB_URL` phải tạo riêng từng biến, giá trị chỉ là một URL (không có tên biến, dấu `=`, hay `/` cuối). Nếu sai, smoke test lỗi `curl: (3) URL rejected`. Bước "Kiểm tra cấu hình" trong `cd.yml` in ra giá trị để phát hiện nhanh.
- Biến môi trường của API phải nhập **trước** lần deploy đầu, nếu không container báo `datasource.url property is required` (thiếu `DATABASE_URL`) và khởi động lại liên tục.
- Mặc định Render cho phép database nhận kết nối từ mọi IP (`0.0.0.0/0`); đã xóa rule này (Block All Inbound IPs) để database không public.
- Chạy CD từ nhánh có dấu `/` (ví dụ `fix/abc`) từng làm hỏng tag Docker; `cd.yml` hiện đã đổi `/` thành `-`.
- Package GHCR phải để Public để Render kéo image không cần credential.

## 5. Pipeline CD

Push tag `v*` → Lint, Test, Build (api và web) → Build Docker image (tag `sha-<7 ký tự>` và tag phiên bản) → Push GHCR → Deploy Hook Render với `imgURL` → Smoke test.

1. **Quality gate:** lint, test, build phải qua; lỗi thì dừng, không build image.
2. **Image:** tag bằng commit SHA (bất biến) và tag phiên bản; nền tảng `linux/amd64`.
3. **Deploy:** chỉ dùng secret của GitHub (hook URL); không có secret trong repo.
4. **Migration:** `apps/api/Dockerfile` chạy `prisma migrate deploy` khi container API khởi động, **trước** khi nhận request. Chỉ viết migration thêm (thêm bảng/cột), tránh xóa/đổi tên cột, để bản image cũ vẫn chạy được trên schema mới khi rollback.
5. **Smoke test:** chờ `GET /health` trả `{"status":"ok"}` tối đa 5 phút, rồi gọi `GET /products` và `GET /menu` của web.
6. **Thất bại:** nếu hook trả lỗi, pipeline dừng và bản đang chạy giữ nguyên; nếu smoke test lỗi, log in cảnh báo và hướng dẫn rollback (mục 6).

## 6. Rollback

1. Tìm tag ổn định trước đó: GitHub → Releases/Tags, hoặc Packages → brewlite-api → danh sách tag `sha-...`.
2. Actions → **CD** → **Run workflow** → nhập `image_tag` (ví dụ `sha-1a2b3c4`). Workflow bỏ qua build và deploy lại đúng tag đó cho cả api và web, rồi chạy smoke test.
3. Cách thủ công: Render → service → Manual Deploy → chọn tag cũ.
4. Migration đã chạy: vì migration chỉ thêm, bản cũ vẫn chạy được. Nếu thật sự phải lùi dữ liệu, khôi phục từ sao lưu (gói miễn phí **không có** sao lưu: [điền kế hoạch nếu dùng gói trả phí]).
5. Chạy lại smoke test để xác nhận.

## 7. Kiểm tra bàn giao

- [ ] Người ngoài nhóm clone repo, chạy theo README được.
- [ ] URL frontend và API truy cập được qua HTTPS.
- [ ] DB production chỉ dùng Internal URL, không mở truy cập từ Internet.
- [ ] Secret không có trong repository hoặc log CI.
- [ ] Có release/tag và release notes.
- [ ] Có ảnh/log một lần CI **đạt** và một lần CI **phát hiện lỗi** (mở PR cố ý lỗi lint, chụp, rồi sửa).
- [ ] Có ảnh/log một lần CD chạy thành công.
