# Báo cáo LaTeX

Giảng viên yêu cầu nộp báo cáo bằng LaTeX, nên bản Word (`BrewLite_BaoCao.docx`) đã được thay bằng hai dự án LaTeX:

| Thư mục | Nội dung |
|---|---|
| `latex/as1` | Báo cáo Assignment 1 (Scrum, 10 task, nghiệm thu chéo) |
| `latex/as2` | Báo cáo Assignment 2 (yêu cầu, thiết kế, CI/CD, triển khai, truy vết) |

## Biên dịch

- Trình biên dịch: **XeLaTeX** (có tiếng Việt qua `babel` + TeX Gyre). File chính: `main.tex`.
- Overleaf: nén thư mục `as1` hoặc `as2` thành zip, tạo dự án mới từ zip, chọn compiler **XeLaTeX**.
- Máy cục bộ: `cd docs/report/latex/as2` rồi `xelatex main.tex` (chạy 2 lần để cập nhật mục lục và tham chiếu).
- Bản này đã bỏ biblatex, tcolorbox, tikz để biên dịch nhanh, tránh quá thời gian của gói Overleaf miễn phí. Tất cả trang đều khổ dọc để in.

## Chưa điền

MSSV, lớp và nhóm còn là chỗ trống `\fillme` trong `config/meta.tex`; điền trước khi nộp.

## Sơ đồ

Nguồn PlantUML, SVG và PNG ở `docs/diagrams/`. Ảnh dùng trong báo cáo nằm ở `latex/*/uml/` và `latex/*/figures/`.
