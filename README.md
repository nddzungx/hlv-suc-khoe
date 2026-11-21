# 💪 HLV Sức Khỏe – Huấn luyện viên sức khỏe cá nhân cho người Việt

Ứng dụng web cài được lên điện thoại (PWA), chạy cả khi không có mạng. Ứng dụng giúp bạn thay đổi từ **những thói quen nhỏ nhất** đến một cơ thể khỏe mạnh lâu dài. Dùng được cho nam và nữ từ 12 tuổi, nhiều hồ sơ cho cả gia đình.

**👉 Mở ứng dụng: https://nddzungx.github.io/hlv-suc-khoe/**

Mở link trên điện thoại → iPhone: Safari → Chia sẻ → *Thêm vào MH chính* · Android: Chrome → *Cài đặt ứng dụng*.

## Tính năng chính
- **Lập kế hoạch cá nhân:** dựa trên thể trạng, bệnh lý, thể lực, quỹ thời gian, dụng cụ, cách ăn uống và mục tiêu. Nếu mục tiêu không an toàn, HLV đánh giá khả thi và gợi ý điều chỉnh.
- **Lộ trình 4 giai đoạn:** bắt đầu chỉ 10 phút/ngày và tăng dần. Chỉ lên giai đoạn mới khi đã làm đều ≥80%.
- **48 bài tập minh họa 3D:** xoay 360°, tô sáng cơ chính và cơ phụ, có các bước làm, hơi thở, lỗi sai và an toàn. Gồm sức mạnh, cơ lõi, tim mạch, linh hoạt, **dây kháng lực, xà đơn, bơi, cầu lông, dưỡng sinh (Bát đoạn cẩm), sàn chậu sau sinh**.
- **15 nhóm cơ** chạm trực tiếp trên mô hình 3D và **14 bài học** sức khỏe.
- **Dinh dưỡng món Việt:** 64 món, thực đơn gợi ý tự co giãn theo mục tiêu calo, ghi bữa ăn.
- **Ăn chay theo âm lịch:** tự nhận mùng 1, rằm (hoặc 4 ngày / thập trai), nhắc trước 1 ngày và tự đổi thực đơn sang món chay.
- **Ảnh tiến độ:** chụp định kỳ, có nhắc, so sánh trước–sau kiểu cạnh nhau hoặc trượt.
- **Hướng dẫn khi tập:** đếm giờ, giọng đọc tiếng Việt, chấm độ khó (RPE).
- **Báo cáo** tuần / tháng / năm: biểu đồ, lịch chăm chỉ, nhận xét HLV, huy hiệu, in PDF.
- Sao lưu và khôi phục (kèm ảnh). **Không quảng cáo, không thu thập dữ liệu:** mọi thứ lưu trên máy người dùng.

## Dành cho người phát triển: đưa lên GitHub Pages
1. Đăng nhập GitHub → **New repository** → đặt tên `hlv-suc-khoe` → chọn **Public** → **Create repository**.
2. Trong repo vừa tạo: **Add file → Upload files** → kéo **toàn bộ nội dung** thư mục này vào (gồm `index.html`, `sw.js`, `manifest.webmanifest`, `README.md`, `LICENSE`, `.nojekyll` và các thư mục `js/`, `icons/`, `img/`) → **Commit changes**.
   - Tệp `.nojekyll` bị ẩn trên Windows/macOS. Nếu không kéo được, tạo tệp mới tên `.nojekyll` (để trống) ngay trên GitHub.
3. **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main**, thư mục **/(root)** → **Save**.
4. Đợi 1–2 phút. Ứng dụng chạy tại `https://nddzungx.github.io/hlv-suc-khoe/`.
5. **Cài lên điện thoại**
   - iPhone: mở bằng **Safari** → Chia sẻ → **Thêm vào MH chính**.
   - Android: mở bằng **Chrome** → **Cài đặt ứng dụng**.

**Cập nhật phiên bản mới:** tải đè các tệp mới lên repo (Upload files → Commit). Người dùng mở app khi có mạng, đóng hẳn rồi mở lại là nhận bản mới.

## Cấu trúc mã
| Tệp | Vai trò |
|---|---|
| `index.html` | Khung trang, giao diện (CSS) |
| `js/app.js` | Giao diện & tương tác |
| `js/engine.js` | Bộ não HLV: chỉ số, khả thi, lộ trình, lịch tập, thực đơn, báo cáo |
| `js/data.js` | Nội dung: bài tập (kèm tư thế 3D), nhóm cơ, thói quen, món ăn, bài học |
| `js/viewer3d.js` | Mô hình người 3D (three.js) |
| `js/lunar.js` | Âm lịch Việt Nam |
| `js/photos.js` | Lưu ảnh tiến độ (IndexedDB) |
| `sw.js`, `manifest.webmanifest`, `icons/` | Chạy offline & cài như app |

## Liên hệ – góp ý
📧 **nddzungx@gmail.com** · Báo lỗi trên GitHub: https://github.com/nddzungx/hlv-suc-khoe/issues

## Ủng hộ
Nếu thấy hữu ích, bạn có thể mời người phát triển một ly cà phê qua VietQR trong mục **Giới thiệu & ủng hộ** của ứng dụng (BIDV · 3210256468 · NGUYEN DUC DUNG).

## Miễn trừ trách nhiệm
Ứng dụng cung cấp hướng dẫn giáo dục sức khỏe chung, **không thay thế** tư vấn, chẩn đoán hay điều trị của bác sĩ. Hãy hỏi ý kiến bác sĩ trước khi tập luyện nếu bạn có bệnh lý, đang mang thai/sau sinh hoặc dưới 18 tuổi. Xem đầy đủ trong ứng dụng.

## Phiên bản
**1.1.1** (21/11/2026) – thêm ăn chay theo âm lịch, ảnh tiến độ, 18 bài tập mới (dây kháng lực, xà đơn, bơi, cầu lông, dưỡng sinh, sàn chậu sau sinh), hướng dẫn sử dụng, trang giới thiệu & ủng hộ, nút chia sẻ ứng dụng.

## Bản quyền
© 2026 Nguyễn Đức Dũng. Bảo lưu mọi quyền – xem [LICENSE](LICENSE).
