# ADR-003: JWT và phân quyền theo vai trò

- **Trạng thái:** Đã chốt
- **Ngày:** 20/10/2026

## Bối cảnh

Cần xác thực khách hàng và nhân viên (FR-05, FR-06, FR-11), phù hợp mô hình frontend và backend tách riêng.

## Quyết định

Đăng nhập bằng email và mật khẩu; mật khẩu băm bằng bcrypt; backend phát JWT có hạn (`JWT_EXPIRES_IN`, mặc định 1 ngày); guard kiểm tra JWT và vai trò (CUSTOMER, STAFF). Khóa ký `JWT_SECRET` đọc từ biến môi trường, không đưa vào repository.

## Hệ quả

- Backend không giữ session phía máy chủ.
- Hết hạn token thì người dùng phải đăng nhập lại; không làm refresh token trong phạm vi bài này.
- Frontend lưu token theo cách do nhóm chọn và ghi rõ trong tài liệu khi triển khai.

## Phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Session cookie phía máy chủ | Cần lưu session; phức tạp hơn khi tách web/api khác nguồn |
| Đăng nhập bên thứ ba (OAuth) | Ngoài phạm vi, tốn thời gian cấu hình |
