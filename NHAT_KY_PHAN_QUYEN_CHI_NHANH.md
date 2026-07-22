# NHẬT KÝ VÀ HƯỚNG DẪN QUẢN LÝ PHÂN QUYỀN THEO CHI NHÁNH / NHÀ MÁY (4M1E1I)

- **Dự án:** QUẢN LÝ THAY ĐỔI 4M1E1I (Tân Phú)
- **Project ID:** tanphu-4m1e1i
- **Ngày cập nhật:** 22/07/26
- **Tác giả:** AI Assistant & Đội ngũ Phát triển Tân Phú

---

## 1. MỤC TIÊU CẬP NHẬT
Nhằm đảm bảo tính bảo mật, chuyên môn hóa và phân định rõ trách nhiệm xử lý giữa các Chi nhánh / Nhà máy thuộc Tập đoàn Tân Phú, hệ thống đã thiết lập cơ chế **Kiểm soát Phân quyền theo Chi nhánh / Nhà máy (Branch Scope Authorization)** cho các thao tác:
1. **Chỉ đạo của các cấp quản lý** (Thêm, Sửa, Xóa chỉ đạo).
2. **Tiếp nhận / Xử lý bản tin** (Xác nhận tiếp nhận thông tin KPH/Sự cố).
3. **Ghi nhận kết quả xử lý** (Nhập kết quả khắc phục, giải pháp của bộ phận).

---

## 2. MA TRẬN PHÂN QUYỀN CHI TIẾT

| Chức năng / Hành động | Admin / Ban TGĐ / HQ (TPP-CTY & DNP-CTY) | Quản lý / Nhân viên thuộc ĐÚNG Chi nhánh của Bản tin | Quản lý / Nhân viên thuộc CHI NHÁNH KHÁC | Ngoại lệ: Bản tin do Văn Phòng Công Ty (HQ) phát hành |
| :--- | :---: | :---: | :---: | :---: |
| **Xem Bản tin & Chỉ đạo** | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép | ✅ Cho phép |
| **Nhập / Sửa / Xóa Chỉ đạo** | ✅ Cho phép | ✅ Cho phép (Dành cho Quản lý / Reviewer) | 🔒 Khóa (Hiển thị thông báo quyền hạn) | 🔒 Khóa đối với Chi nhánh khác |
| **Bấm "Tiếp nhận / Xử lý"** | ✅ Cho phép | ✅ Cho phép | 🔒 Khóa | ✅ **CHO PHÉP TẤT CẢ CHI NHÁNH** |
| **Bấm "Ghi nhận kết quả"** | ✅ Cho phép | ✅ Cho phép | 🔒 Khóa | ✅ **CHO PHÉP TẤT CẢ CHI NHÁNH** |

> **Ghi chú về Ngoại lệ Văn Phòng Công Ty (TPP-CTY / DNP-CTY):**
> Văn phòng Công ty đóng vai trò trung tâm điều phối của hệ thống (phát hành các thông tin Mua hàng, Khiếu nại khách hàng, Yêu cầu chất lượng,...). Do đó, các bản tin do TPP-CTY hay DNP-CTY đăng tải sẽ cho phép **tất cả các Chi nhánh / Nhà máy địa phương** tiếp nhận xử lý và ghi nhận kết quả.

---

## 3. CÁC HÀM XỬ LÝ NÒNG CỐT (`src/utils/branchHelpers.ts`)

### 3.1. `isSameBranchOrFactory(branchA, branchB)`
- So sánh chuẩn hóa chuỗi và mã định danh giữa hai chi nhánh (ví dụ: `TPP-BNI`, `TPP-LAN`, `TPP-CTY`, `DNP-BBM`, `DNP-BBC`,...).

### 3.2. `canUserManageDirective(currentUser, reportFactory)`
- **Quyền Quản lý Chỉ đạo:**
  - `true` nếu là Admin, Ban TGĐ, Văn phòng Tập đoàn/Công ty (TPP-CTY, DNP-CTY).
  - `true` nếu user có vai trò Quản lý / Reviewer (`DUYỆT VIÊN`, `CHỦ ADMIN`) / Giám đốc / Trưởng phòng / Quản đốc thuộc cùng Chi nhánh với bản tin.
  - `false` nếu thuộc Chi nhánh khác hoặc là tài khoản nhân viên thông thường.

### 3.3. `canUserProcessOrResolveReport(currentUser, reportFactory)`
- **Quyền Tiếp nhận & Ghi nhận kết quả:**
  - `true` nếu user thuộc Admin / HQ (TPP-CTY, DNP-CTY).
  - `true` nếu bản tin thuộc Văn Phòng Công Ty (`reportFactory` chứa `TPP-CTY` hoặc `DNP-CTY`).
  - `true` nếu user thuộc cùng Chi nhánh với bản tin (`isSameBranchOrFactory`).
  - `false` trong các trường hợp còn lại.

---

## 4. TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)
- **Giao diện Chỉ đạo:** 
  - Người dùng thuộc **CÙNG Chi nhánh** có quyền Duyệt viên/Admin: hiển thị form nhập chỉ đạo bình thường.
  - Người dùng thuộc **CÙNG Chi nhánh** là Nhân viên thông thường: ẩn form chỉ đạo (không hiển thị cảnh báo khóa).
  - Người dùng thuộc **CHI NHÁNH KHÁC**: hiển thị thông báo khóa quyền hạn trực quan:
    `🔒 Tài khoản của bạn thuộc [Tên Chi Nhánh User]. Bạn chỉ có quyền xem chỉ đạo của [Tên Chi Nhánh Bản Tin].`
- **Giao diện Tiếp nhận & Kết quả:** Nếu người dùng thuộc Chi nhánh khác bấm vào nút "Tiếp nhận/ Xử lý" hoặc "Ghi nhận kết quả" của bản tin local khác, hệ thống sẽ phát thông báo Toast bảo mật:
  `🔒 Tài khoản thuộc [Tên Chi Nhánh User]. Bạn chỉ được tiếp nhận/xử lý/ghi nhận kết quả cho bản tin của Chi nhánh mình hoặc Văn Phòng Công Ty!`

---

## 5. HƯỚNG DẪN BẢO TRÌ & MỞ RỘNG SAU NÀY
1. Nếu Tân Phú mở thêm Chi nhánh / Nhà máy mới, chỉ cần thêm mã định danh (ví dụ `TPP-XYZ`) vào danh sách `codes` trong file `src/utils/branchHelpers.ts`.
2. Mọi quy tắc phân quyền mới nên được tập trung tại `src/utils/branchHelpers.ts` để đảm bảo tính đồng bộ trên cả giao diện Desktop và Mobile.
