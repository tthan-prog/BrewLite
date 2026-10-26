# Khung báo cáo LaTeX dùng chung cho nhiều môn

Khung chỉ chứa **cấu trúc, hướng dẫn và ô trống**. Không có nội dung báo cáo, không điền sẵn tên, trường, MSSV, giảng viên hay nguồn tham khảo.

## Biên dịch
- Trình biên dịch: **XeLaTeX** (mặc định) hoặc **LuaLaTeX**. Không dùng pdfLaTeX (preamble sẽ báo lỗi rõ ràng).
- Trích dẫn: **Biber** (biblatex).
- Máy cá nhân: `latexmk main.tex` (tệp `latexmkrc` đã cấu hình; muốn LuaLaTeX đổi `$pdf_mode = 4;`).
- Overleaf: Menu → Compiler = XeLaTeX hoặc LuaLaTeX; Main document = `main.tex`.
- Font mặc định: TeX Gyre Termes (có sẵn trong TeX Live/Overleaf). Muốn Times New Roman: sửa `\MainFont` trong `config/options.tex` (máy phải có font).
- Đã biên dịch thử với XeLaTeX và LuaLaTeX trên TeX Live bản Ubuntu: không lỗi, không cảnh báo (ngoài "bibliography rỗng" khi chưa có nguồn). Chưa thử trên Overleaf.

## Cấu trúc
```
main.tex                  tệp chính (thường không cần sửa)
config/options.tex        CÔNG TẮC: profile, hộp hướng dẫn, trang đầu, phụ lục, lề, cỡ chữ, kiểu trích dẫn
config/meta.tex           thông tin bìa (các ô \fillme{...} chưa điền)
config/preamble.tex       gói lệnh, font tiếng Việt, tiêu đề, trích dẫn, cleveref
config/macros.tex         \fillme, \chuaxm, \nguon, \hinh, môi trường huongdan
frontmatter/              bìa, cam đoan, cảm ơn, tóm tắt, từ viết tắt + thuật ngữ
profiles/general|se|paper bộ chương theo loại môn (mỗi bộ có chapters.tex)
appendices/               đối chiếu đề bài, phân công, khai báo công cụ, tư liệu bổ sung
figures/  uml/            hình; sơ đồ UML đã xuất sẵn (PDF/PNG)
references.bib            nguồn tham khảo (chỉ thêm nguồn thật đã đọc)
```

## Dùng cho một môn mới
1. Sao chép cả thư mục, đặt tên theo môn.
2. `config/options.tex`: chọn `\Profile` (general / se / paper), bật/tắt trang đầu và phụ lục, đặt lề/cỡ chữ/giãn dòng/kiểu trích dẫn **theo quy định của môn**. Các số mặc định chỉ là giá trị tạm.
3. `config/meta.tex`: điền thông tin bìa. Nếu có mẫu bìa riêng, sửa `frontmatter/cover.tex`.
4. Trong `profiles/<tên>/chapters.tex`: xóa/thêm/đổi thứ tự `\include` cho khớp đề.
5. Điền `appendices/app-doichieu.tex` ngay từ đầu để bám đề.
6. Khi nộp: `\guidefalse` (ẩn hộp hướng dẫn), tìm toàn bộ `\fillme` còn sót (chữ đỏ), bỏ phụ lục không dùng.

## Thêm profile mới
Tạo `profiles/<tên>/chapters.tex` với các dòng `\include{profiles/<tên>/chXX-...}`, viết từng chương theo mẫu có sẵn (`\chapter`, `\section`, khối `huongdan`), rồi đặt `\Profile{<tên>}`.

## Lệnh hay dùng
- Hình: `\hinh{tệp}{0.8\linewidth}{Chú thích}{fig:nhan}` rồi `\nguon{...}`. Tệp lấy từ `figures/` hoặc `uml/`.
- Bảng: đặt `\caption` **trên** bảng; bảng dài dùng `longtable` (xem phụ lục mẫu).
- Tham chiếu: `\cref{fig:nhan}` tự ra "Hình 1.2", "Bảng ...", "Chương ...", "Phụ lục ...".
- Trích dẫn: `\cite{khoa}`; mục dữ liệu trong `references.bib`.
- Đánh dấu chưa kiểm chứng: `\chuaxm`. Ô chưa điền: `\fillme{...}`.
- Sơ đồ UML: xuất từ PlantUML/draw.io ra PDF hoặc PNG rồi chèn bằng `\hinh` (không cần shell-escape, Inkscape hay Java).

## Lưu ý và giới hạn
- Bố cục chương trong profile `se` và `paper` là gợi ý, **chưa đối chiếu từng task của một đề cụ thể**; hãy chỉnh theo đề.
- Lề 3,5/2/2,5/2,5 cm, 13 pt, giãn dòng 1,3 là giá trị tạm lấy từ hướng dẫn của một khoa khác, không phải quy định của trường bạn.
- Kiểu trích dẫn `apa`/`ieee` cần gói biblatex bổ sung; mặc định là `numeric`.
- Chuỗi thư mục (và, tr., truy cập...) đã Việt hóa một phần qua ánh xạ sang tiếng Anh; kiểm tra danh mục tham khảo thực tế.
- Overleaf gói miễn phí chỉ cho thêm 1 cộng tác viên mỗi dự án.
