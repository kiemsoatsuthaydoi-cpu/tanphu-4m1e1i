# <span translate="no" class="notranslate">Quy tắc Dự án QUẢN LÝ THAY ĐỔI 4M1E1I</span>

- **<span translate="no" class="notranslate">Dự án:</span>** <span translate="no" class="notranslate">QUẢN LÝ THAY ĐỔI 4M1E1I</span>
- **<span translate="no" class="notranslate">Project ID:</span>** <span translate="no" class="notranslate">tanphu-4m1e1i</span>
- **<span translate="no" class="notranslate">Quy tắc dịch thuật (Chống dịch):</span>** Chỉ bọc các văn bản giao diện người dùng (UI strings) trong mã nguồn ứng dụng. Tuyệt đối KHÔNG bọc văn bản giải thích/hội thoại trong phòng chat (Playground chat) với người dùng.
- **<span translate="no" class="notranslate">Định dạng thời gian:</span>** <span translate="no" class="notranslate">dd/mm/yy</span>

## <span translate="no" class="notranslate">Hướng dẫn hoạt động cho AI Agent</span>

1. **Bảo vệ cấu trúc dịch thuật trong Ứng dụng:** Tất cả các chuỗi ký tự hiển thị trên giao diện người dùng của ứng dụng (UI strings) phải được bọc trong thẻ `<span translate="no" class="notranslate"></span>` (hoặc dùng component `<T>`) để ngăn chặn việc dịch tự động sai lệch.
2. **Không bọc chống dịch trong Hội thoại/Chat:** Khi phản hồi hoặc giải thích cho người dùng trên cổng chat (Playground), AI Agent tuyệt đối KHÔNG được sử dụng bất kỳ thẻ bọc chống dịch nào (`span translate="no"` hoặc `notranslate`). Phải trả lời bằng văn bản Markdown thông thường để người dùng dễ đọc.
3. **Quản lý thời gian:** Mọi cấu phần ngày tháng hiển thị hoặc nhập liệu phải tuân thủ nghiêm ngặt định dạng dd/mm/yy.
4. **Kiểm soát 4M1E1I:** Luôn đảm bảo hệ thống phản ánh đúng thực tế thay đổi các yếu tố ảnh hưởng chất lượng (Manpool, Material, Machine, Method, Environment, Information) của Tân Phú.
