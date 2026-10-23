# ADR-006: CI/CD bằng GitHub Actions và registry GHCR

- **Trạng thái:** Đã chốt; workflow đã viết, **chưa chạy thật trên GitHub**
- **Ngày:** 20/10/2026

## Bối cảnh

Đề yêu cầu CI chạy khi mở pull request (Install → Lint → Unit Test → Build) và CD đầy đủ: lint+test → build → Docker image → push registry → deploy → smoke test, có rollback (NFR-08).

## Quyết định

- Mã nằm trên GitHub nên dùng **GitHub Actions**.
- Image Docker đẩy lên **GitHub Container Registry (GHCR)**, gắn tag bằng commit SHA hoặc semantic version.
- Secret triển khai lưu ở GitHub Secrets; không in ra log.
- CI chặn merge khi lint, test hoặc build lỗi (bật required status checks `api`, `web`).

## Việc cần kiểm chứng

[Chưa kiểm chứng] Với repo Private ở gói miễn phí, tùy chọn bắt buộc status check trước khi merge có thể bị giới hạn. Kiểm tra trong Settings → Branches ngay khi push repo. Nếu bị giới hạn, đặt repo Public hoặc ghi rõ quy ước nhóm và dùng log CI làm bằng chứng.

## Hệ quả

- `ci.yml` (api, api-e2e, web) chạy cho pull request vào `main`; `cd.yml` chạy khi đẩy tag `v*` hoặc chạy tay: quality → build image (tag `sha-<7 ký tự>` và tag phiên bản) → push GHCR → gọi Deploy Hook của Render → smoke test (`/health`, `/products`, `/menu`).
- Rollback bằng cách triển khai lại image tag trước đó (mô tả trong `docs/deployment.md`).
