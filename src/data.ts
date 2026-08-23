import { User, UserRole, UserStatus, QualityReport, Company, Branch, Department, BroadcastNotice, ChatMessage, CatalogProduct, CatalogMold, ProductionRequest, OrderImplementation, ProductionRequestStatus, ErrorCatalogItem, KnowledgeDoc } from "./types";

// Standardize the term "Phòng Quản Lý Chất Lượng"
export const STANDARDIZED_QC_DEPT = "Phòng Quản Lý Chất Lượng";

// Base64 or Unsplash URLs to act as realistic, high-quality factory quality concern photos
const svgManIcon = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
const svgMaterialIcon = "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=800&q=80";
const svgMachineIcon = "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80";
const svgMethodIcon = "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80";
const svgEnvIcon = "https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=800&q=80";
const svgInfoIcon = "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80";

export const initialCompanies: Company[] = [
  { id: "TPP", name: "TÂN PHÚ VIỆT NAM" },
  { id: "DNP", name: "DNP" }
];

export const initialBranches: Branch[] = [
  { id: "TPP-CTY", name: "Văn Phòng Công Ty (TPP-CTY)", companyId: "TPP", isScoring: true },
  { id: "TPP-BNI", name: "Chi Nhánh Bắc Ninh (TPP-BNI)", companyId: "TPP", isScoring: true },
  { id: "TPP-LAN", name: "Chi Nhánh Long An (TPP-LAN)", companyId: "TPP", isScoring: true },
  { id: "TPP-314", name: "Nhà máy 314 (TPP-314)", companyId: "TPP", isScoring: true },
  { id: "DNP-BBM", name: "Nhà máy BBM (DNP-BBM)", companyId: "DNP", isScoring: true },
  { id: "DNP-BBC", name: "Nhà máy BBC (DNP-BBC)", companyId: "DNP", isScoring: true }
];

export const initialDepartments: Department[] = [
  // Văn Phòng Công Ty (TPP-CTY)
  { id: "cty-1", name: "Ban Tổng Giám Đốc (TPP-CTY)", shortName: "BTGĐ", branchId: "TPP-CTY" },
  { id: "cty-2", name: "Kênh Bán lẻ (TPP-CTY)", shortName: "K.Bán lẻ", branchId: "TPP-CTY" },
  { id: "cty-3", name: "Kênh Dự án (TPP-CTY)", shortName: "K.Dự án", branchId: "TPP-CTY" },
  { id: "cty-4", name: "Kênh GT (TPP-CTY)", shortName: "Kênh GT", branchId: "TPP-CTY" },
  { id: "cty-5", name: "Kênh MT (TPP-CTY)", shortName: "Kênh MT", branchId: "TPP-CTY" },
  { id: "cty-6", name: "Khối quản lý chuỗi cung ứng (TPP-CTY)", shortName: "Chuỗi Cung Ứng", branchId: "TPP-CTY" },
  { id: "cty-7", name: "Phòng Hành chính nhân sự (TPP-CTY)", shortName: "HCNS", branchId: "TPP-CTY" },
  { id: "cty-8", name: "Phòng Kế hoạch và dự báo (TPP-CTY)", shortName: "KH&DB", branchId: "TPP-CTY" },
  { id: "cty-9", name: "Phòng kinh doanh công nghiệp (TPP-CTY)", shortName: "KDCN", branchId: "TPP-CTY" },
  { id: "cty-10", name: "Phòng Kinh doanh quốc tế (TPP-CTY)", shortName: "KDQT", branchId: "TPP-CTY" },
  { id: "cty-11", name: "Phòng Kinh doanh quốc tế 2 (TPP-CTY)", shortName: "KDQT 2", branchId: "TPP-CTY" },
  { id: "cty-12", name: "Phòng Kinh doanh quốc tế BBM (TPP-CTY)", shortName: "KDQT BBM", branchId: "TPP-CTY" },
  { id: "cty-13", name: "Phòng Marketing - Truyền thông (TPP-CTY)", shortName: "MKT", branchId: "TPP-CTY" },
  { id: "cty-14", name: "Phòng Mua hàng (TPP-CTY)", shortName: "Mua Hàng", branchId: "TPP-CTY" },
  { id: "cty-15", name: "Phòng Nghiên cứu và phát triển sản phẩm (TPP-CTY)", shortName: "R&D", branchId: "TPP-CTY" },
  { id: "cty-16", name: "Phòng phân phối (TPP-CTY)", shortName: "Phân Phối", branchId: "TPP-CTY" },
  { id: "cty-17", name: "Phòng Quản Lý Chất Lượng (TPP-CTY)", shortName: "QLCL", branchId: "TPP-CTY" },
  { id: "cty-18", name: "Phòng Tài chính Kế toán (TPP-CTY)", shortName: "TCKT", branchId: "TPP-CTY" },
  { id: "cty-19", name: "Phòng Thiết kế kỹ thuật (TPP-CTY)", shortName: "TKKT", branchId: "TPP-CTY" },
  { id: "cty-20", name: "Ban trợ lý + KSTC (TPP-CTY)", shortName: "Trợ Lý & KSTC", branchId: "TPP-CTY" },

  // Chi Nhánh Bắc Ninh (TPP-BNI)
  { id: "bn-1", name: "Ban Giám đốc (TPP-BNI)", shortName: "BGĐ", branchId: "TPP-BNI" },
  { id: "bn-2", name: "Ban Quản đốc (TPP-BNI)", shortName: "BQĐ", branchId: "TPP-BNI" },
  { id: "bn-3", name: "Dây chuyền nước (TPP-BNI)", shortName: "DC Nước", branchId: "TPP-BNI" },
  { id: "bn-4", name: "Phòng Hành chính nhân sự (TPP-BNI)", shortName: "HCNS", branchId: "TPP-BNI" },
  { id: "bn-5", name: "Phòng Kế hoạch sản xuất (TPP-BNI)", shortName: "KHSX", branchId: "TPP-BNI" },
  { id: "bn-6", name: "Phòng Kho vận (TPP-BNI)", shortName: "Kho Vận", branchId: "TPP-BNI" },
  { id: "bn-7", name: "Phòng Kỹ Thuật (TPP-BNI)", shortName: "Kỹ Thuật", branchId: "TPP-BNI" },
  { id: "bn-8", name: "Phòng Quản Lý Chất Lượng (TPP-BNI)", shortName: "QLCL", branchId: "TPP-BNI" },
  { id: "bn-9", name: "Phòng Tài chính Kế toán (TPP-BNI)", shortName: "TCKT", branchId: "TPP-BNI" },
  { id: "bn-10", name: "Sản xuất (TPP-BNI)", shortName: "Sản Xuất", branchId: "TPP-BNI" },
  { id: "bn-11", name: "Tổ bốc xếp (TPP-BNI)", shortName: "Tổ Bốc Xếp", branchId: "TPP-BNI" },
  { id: "bn-12", name: "Tổ lái xe tải (TPP-BNI)", shortName: "Tổ Lái Xe", branchId: "TPP-BNI" },
  { id: "bn-13", name: "Tổ Xay trộn (TPP-BNI)", shortName: "Tổ Xay Trộn", branchId: "TPP-BNI" },
  { id: "bn-14", name: "Xưởng GMP (TPP-BNI)", shortName: "Xưởng GMP", branchId: "TPP-BNI" },
  { id: "bn-15", name: "Xưởng Pet (TPP-BNI)", shortName: "Xưởng PET", branchId: "TPP-BNI" },

  // Chi Nhánh Long An (TPP-LAN)
  { id: "la-1", name: "Ban Giám đốc (TPP-LAN)", shortName: "BGĐ", branchId: "TPP-LAN" },
  { id: "la-2", name: "Ban Quản đốc (TPP-LAN)", shortName: "BQĐ", branchId: "TPP-LAN" },
  { id: "la-3", name: "Phân Xưởng 1 (TPP-LAN)", shortName: "PX 1", branchId: "TPP-LAN" },
  { id: "la-4", name: "Phân xưởng 2 (TPP-LAN)", shortName: "PX 2", branchId: "TPP-LAN" },
  { id: "la-5", name: "Phòng Hành chính nhân sự (TPP-LAN)", shortName: "HCNS", branchId: "TPP-LAN" },
  { id: "la-6", name: "Phòng Kế hoạch vật tư (TPP-LAN)", shortName: "KHVT", branchId: "TPP-LAN" },
  { id: "la-7", name: "Phòng Kho vận (TPP-LAN)", shortName: "Kho Vận", branchId: "TPP-LAN" },
  { id: "la-8", name: "Phòng Kỹ Thuật (TPP-LAN)", shortName: "Kỹ Thuật", branchId: "TPP-LAN" },
  { id: "la-9", name: "Phòng Quản Lý Chất Lượng (TPP-LAN)", shortName: "QLCL", branchId: "TPP-LAN" },
  { id: "la-10", name: "Phòng Tài chính Kế toán (TPP-LAN)", shortName: "TCKT", branchId: "TPP-LAN" },
  { id: "la-11", name: "Tổ hoàn tất (TPP-LAN)", shortName: "Tổ Hoàn Tất", branchId: "TPP-LAN" },
  { id: "la-12", name: "Tổ Xay trộn (TPP-LAN)", shortName: "Tổ Xay Trộn", branchId: "TPP-LAN" },
  { id: "la-13", name: "Xưởng Cơ khí (TPP-LAN)", shortName: "Xưởng Cơ Khí", branchId: "TPP-LAN" },

  // Nhà máy 314 (TPP-314)
  { id: "nm-1", name: "Phân xưởng sản xuất (TPP-314)", shortName: "PX SX", branchId: "TPP-314" },
  { id: "nm-2", name: "Phòng Tài chính Kế toán (TPP-314)", shortName: "TCKT", branchId: "TPP-314" },

  // Nhà máy BBM (DNP-BBM)
  { id: "bbm-1", name: "Phòng Quản Lý Chất Lượng (DNP-BBM)", shortName: "QLCL", branchId: "DNP-BBM" },
  { id: "bbm-2", name: "Phòng Tài chính Kế toán (DNP-BBM)", shortName: "TCKT", branchId: "DNP-BBM" },

  // Nhà máy BBC (DNP-BBC)
  { id: "bbc-1", name: "Phòng Quản Lý Chất Lượng (DNP-BBC)", shortName: "QLCL", branchId: "DNP-BBC" },
  { id: "bbc-2", name: "Phòng Tài chính Kế toán (DNP-BBC)", shortName: "TCKT", branchId: "DNP-BBC" }
];

export const defaultAdmin: User = {
  id: "2018.00281",
  fullName: "Lê Nhật Trường",
  phone: "0907767304",
  department: "Phòng Quản Lý Chất Lượng (TPP-CTY)",
  branch: "Văn Phòng Công Ty (TPP-CTY)",
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  password: "111222",
  position: "Trưởng Phòng Quản Lý Chất Lượng",
  isOnline: true
};

export const initialUsers: User[] = [
  defaultAdmin,
  {
    id: "2021.00126",
    fullName: "Trần Đức Huy",
    phone: "0901123456",
    department: "Ban Tổng Giám Đốc (TPP-CTY)",
    branch: "Văn Phòng Công Ty (TPP-CTY)",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Ban Tổng Giám Đốc"
  },
  {
    id: "2025.01840",
    fullName: "Phan Anh Tuấn",
    phone: "0945482999",
    department: "Ban Tổng Giám Đốc (TPP-CTY)",
    branch: "Văn Phòng Công Ty (TPP-CTY)",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Ban Tổng Giám Đốc"
  },
  {
    id: "2025.01841",
    fullName: "Ngô Đức Trung",
    phone: "0913885674",
    department: "Ban Tổng Giám Đốc (TPP-CTY)",
    branch: "Văn Phòng Công Ty (TPP-CTY)",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Ban Tổng Giám Đốc"
  },
  {
    id: "2025.01842",
    fullName: "Nguyễn Thị Thoại",
    phone: "0932153993",
    department: "Ban Tổng Giám Đốc (TPP-CTY)",
    branch: "Văn Phòng Công Ty (TPP-CTY)",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Ban Tổng Giám Đốc"
  },
  {
    id: "2025.01857",
    fullName: "Lương Xuân Cường",
    phone: "0933782622",
    department: "Ban Giám đốc (TPP-BNI)",
    branch: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    role: UserRole.REVIEWER,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Ban Giám Đốc"
  },
  {
    id: "2011.00134",
    fullName: "Nguyễn Đức Thắng",
    phone: "0988090398",
    department: "Ban Giám đốc (TPP-BNI)",
    branch: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    role: UserRole.REVIEWER,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Ban Giám Đốc"
  },
  {
    id: "2020.00354",
    fullName: "Quách Thuỷ Vân",
    phone: "0968020386",
    department: "Ban Quản đốc (TPP-BNI)",
    branch: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    role: UserRole.REVIEWER,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Trưởng Ca"
  },
  {
    id: "2022.00129",
    fullName: "Trương Thị Thanh Thiện",
    phone: "0907123456",
    department: "Phòng Quản Lý Chất Lượng (TPP-LAN)",
    branch: "Chi Nhánh Long An (TPP-LAN)",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Nhân Viên"
  },
  {
    id: "2023.00481",
    fullName: "Bùi Thanh Dung",
    phone: "0908877665",
    department: "Phòng Quản Lý Chất Lượng (TPP-BNI)",
    branch: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Nhân Viên"
  },
  {
    id: "2024.00912",
    fullName: "Kim Thị Bích Tuyền",
    phone: "0919922883",
    department: "Phòng Quản Lý Chất Lượng (DNP-BBM)",
    branch: "Nhà máy BBM (DNP-BBM)",
    role: UserRole.REVIEWER,
    status: UserStatus.ACTIVE,
    password: "123456",
    position: "Trưởng Phòng"
  }
];

export const initialErrorCatalog: ErrorCatalogItem[] = [
  {
    code: "ERM0001",
    category: "BBM",
    name: "Lỗi xước màng",
    description: "Màng ghép bị cào xước vật lý, xước cơ học dọc theo hướng cuộn hoặc ngang cuộn do ma sát với thành máy, lô dẫn hoặc do thiết lập sức căng màng sai lệch.",
    createdAt: "18/07/26"
  },
  {
    code: "ERM0002",
    category: "BBM",
    name: "Lỗi bong tách lớp màng",
    description: "Hiện tượng hai hoặc nhiều lớp màng ghép bị bong rộp hoặc tách rời hoàn toàn do lực ghép keo không đủ, sấy không khô, hoặc thành phần hóa học của keo không tương thích với màng.",
    createdAt: "18/07/26"
  },
  {
    code: "ERM0003",
    category: "BBM",
    name: "Lỗi rò rỉ mối hàn nhiệt",
    description: "Đường hàn nhiệt ở đáy, lưng hoặc biên túi bị hở, rò khí do nhiệt độ hàn quá thấp, áp lực hàn yếu, hoặc thời gian hàn không đủ dài.",
    createdAt: "18/07/26"
  },
  {
    code: "ERM0004",
    category: "BBM",
    name: "Lỗi nhăn màng cuộn",
    description: "Màng ghép xuất hiện các vết nhăn lồi lõm không đều do lực căng màng không cân đối giữa các trục xả hoặc do chênh lệch nhiệt độ lô sấy/trục ép.",
    createdAt: "18/07/26"
  },
  {
    code: "ERC0001",
    category: "BBC",
    name: "Lỗi bavia nhựa",
    description: "Phần nhựa thừa bám ở mép phân khuôn, chân sản phẩm nhựa cứng do lực kẹp khuôn yếu, khe hở khuôn quá lớn hoặc do áp suất phun nhựa quá cao.",
    createdAt: "18/07/26"
  },
  {
    code: "ERC0002",
    category: "BBC",
    name: "Lỗi thiếu liệu",
    description: "Sản phẩm nhựa cứng bị khuyết góc, khuyết cạnh do nhựa nóng chảy điền đầy lòng khuôn không đủ, áp suất phun yếu hoặc thời gian phun quá ngắn.",
    createdAt: "18/07/26"
  },
  {
    code: "ERC0003",
    category: "BBC",
    name: "Lỗi biến dạng/cong vênh",
    description: "Sản phẩm bị biến dạng hình học, cong vênh, co ngót không đều sau khi ra khỏi khuôn do làm mát không đủ hoặc phân bố độ dày thành sản phẩm không đều.",
    createdAt: "18/07/26"
  },
  {
    code: "ERC0004",
    category: "BBC",
    name: "Lỗi vết cháy khét",
    description: "Xuất hiện các đốm đen hoặc dải màu vàng sẫm trên bề mặt sản phẩm do nhiệt độ xy lanh quá cao hoặc nhựa bị kẹt phân hủy trong đầu đùn.",
    createdAt: "18/07/26"
  }
];

export const initialReports: QualityReport[] = [
  {
    id: "R-1",
    factory: "Chi Nhánh Long An (TPP-LAN)",
    timestamp: "15:05:34 27/05/2026",
    category: "THÔNG TIN",
    content: "Tiếp đoàn khách hàng Ngọc Tùng tham quan nhà máy.",
    imageUrl: svgInfoIcon,
    compressedSizeKb: 135,
    originalSizeKb: 340,
    uploaderName: "Trương Thị Thanh Thiện",
    uploaderPhone: "0907123456",
    uploaderId: "2022.00129",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: false,
    isSpotlight: true,
    reportType: "DSA",
    notes: "Đoàn khách đánh giá cao khâu vệ sinh 5S."
  },
  {
    id: "R-2",
    factory: "Nhà máy BBM (DNP-BBM)",
    timestamp: "20:38:53 27/05/2026",
    category: "CON NGƯỜI",
    content: "CÔNG NHÂN TỰ Ý TĂNG TÚI (Vượt định mức quy định 21/20 túi). Không tuân thủ hướng dẫn kỹ thuật trên máy.",
    imageUrl: svgManIcon,
    compressedSizeKb: 142,
    originalSizeKb: 412,
    uploaderName: "Trương Thị Thanh Thiện",
    uploaderPhone: "0907123456",
    uploaderId: "2022.00129",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: true,
    isSpotlight: false,
    reportType: "KPH",
    notes: "Lập biên bản chấn chỉnh khẩn cấp tổ sản xuất."
  },
  {
    id: "R-3",
    factory: "Nhà máy BBM (DNP-BBM)",
    timestamp: "11:11:19 29/05/2026",
    category: "PHƯƠNG PHÁP",
    content: "Chuẩn hóa quy trình dán nhãn Barcode cho 3 size S-M-L trên cuộn bao gói ngoài.",
    imageUrl: svgMethodIcon,
    compressedSizeKb: 110,
    originalSizeKb: 280,
    uploaderName: "Kim Thị Bích Tuyền",
    uploaderPhone: "0919922883",
    uploaderId: "2024.00912",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: false,
    isSpotlight: false,
    reportType: "NORMAL",
    notes: "Đã truyền thông cho toàn bộ tổ trưởng sản xuất."
  },
  {
    id: "R-4",
    factory: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    timestamp: "15:46:41 06/06/2026",
    category: "MÔI TRƯỜNG",
    content: "Khảo sát và làm việc với nhà thầu năng lượng Tasco về dự án lắp đặt điện mặt trời.",
    imageUrl: svgEnvIcon,
    compressedSizeKb: 124,
    originalSizeKb: 310,
    uploaderName: "Bùi Thanh Dung",
    uploaderPhone: "0908877665",
    uploaderId: "2023.00481",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: false,
    isSpotlight: true,
    reportType: "DSA",
    notes: "Chuẩn bị mặt bằng thi công xưởng chính."
  },
  {
    id: "R-5",
    factory: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    timestamp: "15:57:21 06/06/2026",
    category: "MÁY MÓC",
    content: "Bảo dưỡng khẩn cấp các đầu cắm phôi máy thổi phích chai TĐ04 phát hiện bám bụi bẩn.",
    imageUrl: svgMachineIcon,
    compressedSizeKb: 153,
    originalSizeKb: 395,
    uploaderName: "Bùi Thanh Dung",
    uploaderPhone: "0908877665",
    uploaderId: "2023.00481",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: true,
    isSpotlight: false,
    reportType: "KPH",
    notes: "Phát hiện gioăng bị mòn nhẹ, đề xuất thay thế tuần tới."
  },
  {
    id: "R-6",
    factory: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    timestamp: "16:01:11 06/06/2026",
    category: "CON NGƯỜI",
    content: "Báo cáo lao động: Nhân sự chính thức nghỉ 6 người, thời vụ nghỉ 1 người khiến chuyền bị thiếu lao động vận hành.",
    imageUrl: svgManIcon,
    compressedSizeKb: 148,
    originalSizeKb: 388,
    uploaderName: "Bùi Thanh Dung",
    uploaderPhone: "0908877665",
    uploaderId: "2023.00481",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: true,
    isSpotlight: false,
    reportType: "KPH",
    notes: "Điều chuyển nhân lực từ bộ phận bọc màng bù đắp tạm thời."
  },
  {
    id: "R-7",
    factory: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    timestamp: "16:00:38 06/06/2026",
    category: "NGUYÊN VẬT LIỆU",
    content: "Thử nghiệm phôi 670g có pha thêm 3% hạt nhựa tái sinh PET xanh làm mẫu bình ra lò bị đục màu hơn chuẩn.",
    imageUrl: svgMaterialIcon,
    compressedSizeKb: 122,
    originalSizeKb: 298,
    uploaderName: "Bùi Thanh Dung",
    uploaderPhone: "0908877665",
    uploaderId: "2023.00481",
    uploaderDepartment: STANDARDIZED_QC_DEPT,
    isAbnormal: true,
    isSpotlight: false,
    reportType: "KPH",
    notes: "Mẫu không đạt chất lượng kiểm định ngoại quan ngoại quan bình."
  },
  {
    id: "R-8",
    factory: "Văn Phòng Công Ty (TPP-CTY)",
    timestamp: "09:30:00 10/06/2026",
    category: "PHƯƠNG PHÁP",
    content: "Ban hành và chuẩn hóa quy trình kiểm soát thay đổi 4M1E1I trên toàn bộ các cụm nhà máy Tân Phú và DNP.",
    imageUrl: svgMethodIcon,
    compressedSizeKb: 145,
    originalSizeKb: 360,
    uploaderName: "Lê Nhật Trường",
    uploaderPhone: "0907767304",
    uploaderId: "2018.00281",
    uploaderDepartment: "Phòng Quản Lý Chất Lượng (TPP-CTY)",
    isAbnormal: false,
    isSpotlight: true,
    reportType: "DSA",
    notes: "Đã truyền thông và gửi tài liệu hướng dẫn đến toàn thể cán bộ quản lý.",
    resolutions: [
      {
        id: "res-r8-1",
        departmentName: "Phòng Quản Lý Chất Lượng (TPP-CTY)",
        handlerName: "Lê Nhật Trường",
        status: "Đã xử lý",
        resultText: "Hoàn tất tài liệu và video đào tạo trực tuyến 4M1E1I.",
        updatedAt: "11:00:00 11/06/2026"
      }
    ],
    qcConfirmed: true,
    qcConfirmedBy: "Lê Nhật Trường",
    qcConfirmedAt: "11:30:00 11/06/2026"
  },
  {
    id: "R-9",
    factory: "Chi Nhánh Long An (TPP-LAN)",
    timestamp: "14:15:20 12/06/2026",
    category: "MÁY MÓC",
    content: "Đánh giá nghiệm thu và hiệu chuẩn cánh tay robot gắp sản phẩm tự động chuyền ép 02.",
    imageUrl: svgMachineIcon,
    compressedSizeKb: 160,
    originalSizeKb: 410,
    uploaderName: "Lê Nhật Trường",
    uploaderPhone: "0907767304",
    uploaderId: "2018.00281",
    uploaderDepartment: "Phòng Quản Lý Chất Lượng (TPP-CTY)",
    isAbnormal: false,
    isSpotlight: false,
    reportType: "NORMAL",
    notes: "Đạt độ chính xác 99.8%, chuẩn bị áp dụng nhân rộng.",
    resolutions: [
      {
        id: "res-r9-1",
        departmentName: "Phòng Kỹ Thuật (TPP-LAN)",
        handlerName: "Lê Nhật Trường",
        status: "Đang xử lý",
        resultText: "Theo dõi chạy thử liên tục trong 72 giờ ca sản xuất.",
        updatedAt: "16:00:00 12/06/2026"
      }
    ]
  },
  {
    id: "R-10",
    factory: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    timestamp: "08:45:10 15/06/2026",
    category: "CON NGƯỜI",
    content: "Kiểm tra chéo và tập huấn an toàn 5S - nhận diện điểm nguy cơ biến động nhân sự ca đêm.",
    imageUrl: svgManIcon,
    compressedSizeKb: 138,
    originalSizeKb: 350,
    uploaderName: "Lê Nhật Trường",
    uploaderPhone: "0907767304",
    uploaderId: "2018.00281",
    uploaderDepartment: "Phòng Quản Lý Chất Lượng (TPP-CTY)",
    isAbnormal: true,
    isSpotlight: false,
    reportType: "KPH",
    notes: "Cần phân bổ thêm 2 giám sát viên hỗ trợ ca 3.",
    resolutions: []
  }
];

export const initialBroadcastNotice: BroadcastNotice[] = [
  {
    id: "B-1",
    type: "Quản trị viên phát sóng",
    content: "Yêu cầu tất cả ca kíp cập nhật đầy đủ thông tin thay đổi thông số máy trước 17h00 hàng ngày.",
    sender: "Lê Nhật Trường",
    timestamp: "17/06/2026"
  },
  {
    id: "B-2",
    type: "Hệ thống",
    content: "Tự hào hoàn thành đánh giá thực địa tiêu chuẩn xưởng sạch BRC tại Nhà Máy Đất Đỏ.",
    sender: "Hệ thống",
    timestamp: "16/06/2026"
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: "C-1",
    senderName: "Bùi Thanh Dung",
    senderRole: "Nhân viên QC",
    senderPhone: "0908877665",
    message: "Hôm nay phôi PET xanh về Bắc Ninh bị trễ 2 tiếng, chúng em đang theo dõi kỹ quy trình sấy phôi.",
    timestamp: "17/06/2026 09:12:00"
  },
  {
    id: "C-2",
    senderName: "Lê Nhật Trường",
    senderRole: "Chủ Admin",
    senderPhone: "0907767304",
    message: "Dung bám sát nhiệt độ sấy nhé. Tuyệt đối không để xảy ra bọt khí trên thân sản phẩm.",
    timestamp: "17/06/2026 09:30:15"
  }
];

// Initial Products Catalog (Khai báo mã hóa)
export const initialProductsCatalog: CatalogProduct[] = [
  { code: "HIN.TRCQ.0027HHC", barcode: "8935275213218", name: "Bộ thau rổ có quai xách Yoko 27cm - Hồng nhạt", unit: "Bộ" },
  { code: "HIN.TRCQ.0027OHC", barcode: "8935275213218", name: "Bộ thau rổ có quai xách Yoko 27cm - Xanh bơ", unit: "Bộ" },
  { code: "HIN.TRCQ.0027GHC", barcode: "8935275213218", name: "Bộ thau rổ có quai xách Yoko 27cm - Ghi sữa", unit: "Bộ" },
  { code: "HIN.KEDD.TOKYGHC", barcode: "8935275200065", name: "Kệ di động Tokyo - Ghi sữa", unit: "Cái" },
  { code: "HIN.KEDD.TOKYTHC", barcode: "8935275200065", name: "Kệ di động Tokyo - Trắng", unit: "Cái" },
  { code: "HIN.CHAB.YOKO30", barcode: "8935275200112", name: "Chậu tắm bé Yoko 30L", unit: "Cái" },
  { code: "HIN.HOCH.YOKO50", barcode: "8935275200256", name: "Hộp đựng thực phẩm Yoko 500ml", unit: "Cái" }
];

// Initial Molds Catalog (Danh mục khuôn mẫu)
export const initialMoldsCatalog: CatalogMold[] = [
  { code: "MOLD-YOKO27-TRCQ", name: "Khuôn Thau Rổ Yoko 27cm", description: "Khuôn cốt đúc 2 lòng rời, ép quai xách" },
  { code: "MOLD-TOKYO-KEDD", name: "Khuôn Kệ Di Động Tokyo", description: "Khuôn dập khung chân di động đa năng" },
  { code: "MOLD-CHAB-YOKO30", name: "Khuôn Chậu Tắm Bé Yoko", description: "Khuôn siêu trường ép nhựa PP nguyên sinh" }
];

// Initial Production Requests (Phiếu Yêu Cầu Sản Xuất)
export const initialProductionRequests: ProductionRequest[] = [
  {
    id: "PR-20251217-01",
    requestNo: "05-12NGU/KDGD/CNBN",
    requestDate: "17/12/2025",
    targetBranch: "Chi Nhánh Bắc Ninh (TPP-BNI)",
    contact: "Lương Xuân Cường (BGĐ Chi nhánh)",
    department: "Kênh Dự án (TPP-CTY)",
    uploaderName: "Võ Thị Hồng Sương",
    uploaderPhone: "0907123456",
    uploaderId: "2022.00129", // simulated salesperson id
    status: ProductionRequestStatus.IMPLEMENTED,
    balanceNotes: "Khối SCM đã kiểm tra tồn kho: Tồn kho Yoko 27cm trống, Kệ Tokyo trống. Chuyền ép sẵn sàng phục vụ. Chuyển giao kế hoạch sản xuất Bắc Ninh chuẩn bị.",
    inventoryChecked: true,
    implementationId: "OI-20251217-01"
  },
  {
    id: "PR-20260618-02",
    requestNo: "06-18DA/KDD/CNLA",
    requestDate: "18/06/2026",
    targetBranch: "Chi Nhánh Long An (TPP-LAN)",
    contact: "Trần Giám Đốc",
    department: "Kênh Dự án (TPP-CTY)",
    uploaderName: "Vũ Văn Minh",
    uploaderPhone: "0901234567",
    uploaderId: "2023.00481",
    status: ProductionRequestStatus.PENDING,
    inventoryChecked: false
  }
];

// Initial Production Request Items
export const initialProductionRequestItemsMap: Record<string, any[]> = {
  "PR-20251217-01": [
    {
      id: "PRI-01",
      productCode: "HIN.TRCQ.0027HHC",
      barcode: "8935275213218",
      productName: "Bộ thau rổ có quai xách Yoko 27cm - Hồng nhạt (Hùng Cường - Nutricare)",
      unit: "Bộ",
      quantity: 4660,
      notes: "Không dùng đai quấn. Dùng tem dán ngoài thau và tem phụ. Decal nổi logo khách: ngang 70 x cao 20.8mm dán ngoài thau chính giữa cạnh không vướng quai cách miệng 4cm. Đóng gói & quy cách: như hàng Inochi. TG giao: 10/01/2026."
    },
    {
      id: "PRI-02",
      productCode: "HIN.TRCQ.0027OHC",
      barcode: "8935275213218",
      productName: "Bộ thau rổ có quai xách Yoko 27cm - Xanh bơ (Hùng Cường - Nutricare)",
      unit: "Bộ",
      quantity: 4660,
      notes: "Không dùng đai quấn. Dùng tem dán ngoài thau và tem phụ. Decal nổi logo khách: ngang 70 x cao 20.8mm dán ngoài thau chính giữa cạnh không vướng quai cách miệng 4cm. Đóng gói & quy cách: như hàng Inochi. TG giao: 10/01/2026."
    },
    {
      id: "PRI-03",
      productCode: "HIN.TRCQ.0027GHC",
      barcode: "8935275213218",
      productName: "Bộ thau rổ có quai xách Yoko 27cm - Ghi sữa (Hùng Cường - Nutricare)",
      unit: "Bộ",
      quantity: 4640,
      notes: "Không dùng đai quấn. Dùng tem dán ngoài thau và tem phụ. Decal nổi logo khách dán chính giữa cạnh không vướng quai xách cách miệng thau 4cm."
    },
    {
      id: "PRI-04",
      productCode: "HIN.KEDD.TOKYGHC",
      barcode: "8935275200065",
      productName: "Kệ di động Tokyo - Ghi sữa (Hùng Cường - Nutricare)",
      unit: "Cái",
      quantity: 2140,
      notes: "Hàng theo tiêu chuẩn Inochi. Dán thêm decal nổi logo khách: ngang 50 x cao 14.7mm sát tay cầm. Đóng gói: 1 cái/túi PE/thùng. TG giao: 10/01/2026."
    },
    {
      id: "PRI-05",
      productCode: "HIN.KEDD.TOKYTHC",
      barcode: "8935275200065",
      productName: "Kệ di động Tokyo - Trắng (Hùng Cường - Nutricare)",
      unit: "Cái",
      quantity: 2147,
      notes: "Dán nhãn decal nổi logo ngang 50 x cao 14.7mm. Đóng gói 1 cái/túi PE. TG giao: 10/01/2026."
    }
  ],
  "PR-20260618-02": [
    {
      id: "PRI-06",
      productCode: "HIN.CHAB.YOKO30",
      barcode: "8935275200112",
      productName: "Chậu tắm bé Yoko 30L - Xanh dương",
      unit: "Cái",
      quantity: 1500,
      notes: "Thêm in lụa logo đối tác sữa tắm Enfa ở quai chậu. Đóng gói 5 cái/thùng."
    }
  ]
};

// Initial Projects Implementation Order Requests (Phiếu yêu cầu triển khai đơn hàng Kênh dự án)
export const initialOrderImplementations: OrderImplementation[] = [
  {
    id: "OI-20251217-01",
    requestId: "PR-20251217-01",
    requestNo: "05-12NGU/KDGD/CNBN",
    productName: "Bộ thau rổ Yoko 27cm & Kệ di động Tokyo",
    customerName: "Hùng Cường - Nutricare",
    
    moldOption: "SỬA_KHUÔN",
    moldDetail: "Sửa khuôn/ insert thêm logo khách hàng ngang 70 x cao 20.8mm dán ngoài thau chính giữa cạnh không vướng quai cách miệng thau 4cm.",
    
    formulaOption: "NHƯ_INOCHI",
    formulaDetail: "Nhựa nguyên sinh PP không phế phẩm, bảo đảm màu sắc đồng đều.",
    
    colorOption: "MÀU_MỚI",
    colorPantone1: "Pantone 2365C (Hồng nhạt)",
    colorPantone2: "Pantone 365C (Xanh bơ)",
    colorName1: "Hồng nhạt",
    colorName2: "Xanh bơ & Ghi sữa",
    
    printOption: "CÓ_IN",
    printDetail: "In nổi logo bạc phủ bảo vệ cao cấp chống bay màu dán trên tay vịn và thau chính giữa.",
    
    packagingOption: "MỚI",
    packagingDetail: "Lồng chặt bộ thau vào rổ gập quai xách xuống, dán tem phụ ngoài đáy thau và tem ngoài rổ.",
    
    pkgMaterialOption: "MỚI",
    pkgMaterialDetail: "Tìm mua thùng carton C2 sóng dày, phủ chống thấm ẩm theo tiêu chuẩn xuất khẩu, in ấn thương hiệu Nutricare.",
    
    sampleOption: "NHÀ_MÁY_TRIỂN_KHAI",
    sampleDetail: "Nhà máy Bắc Ninh triển khai vật tư bao gói, túi PE đục lỗ hơi thoát nước tránh ẩm mốc sản phẩm.",
    
    approvalOption: "ONLINE_KÝ_MẪU_SAU",
    approvalDetail: "Sản xuất trước 5 bộ mẫu gửi qua bưu điện cho Sales kiểm duyệt trực quan và phản hồi ký trực tuyến.",
    
    qcStandardOption: "TIÊU_CHUẨN_KHÁCH_HÀNG",
    qcStandardDetail: "Yêu cầu nghiêm ngặt 0% bụi bẩn, không dính hạt nhựa thừa xước tay cầm, ngoại quan bóng bẩy, quai xách chắc chắn chịu tải 5kg.",
    
    safetyStandardOption: "THEO_TIÊU_CHUẨN_INOCHI",
    safetyStandardDetail: "Bảo đảm tiêu chuẩn vệ sinh an toàn thực phẩm, nhựa PP nguyên sinh không hóa chất Bisphenol-A (BPA Free).",
    
    creatorName: "Lê Nhật Trường (Khối SCM)",
    createdAt: "18/12/2025"
  }
];

export interface BadgeDefinition {
  id: string;
  icon: string;
  name: string;
  category: "RED" | "GREEN";
  description: string;
  target: string;
}

export const RED_BADGES: BadgeDefinition[] = [
  {
    id: "CANH_BAO_KIP_THOI",
    icon: "🚨",
    name: "CẢNH BÁO KỊP THỜI",
    category: "RED",
    description: "Trao cho bản tin KPH được đăng ngay lập tức khi sự cố vừa xảy ra, giúp ngăn chặn hậu quả dây chuyền.",
    target: "Mục tiêu: Đánh giá tầm quan trọng của việc phát hiện vấn đề."
  },
  {
    id: "CON_MAT_TINH_TUONG",
    icon: "🔍",
    name: "CON MẮT TINH TƯỜNG",
    category: "RED",
    description: "Trao cho bản tin mô tả những lỗi cực nhỏ, khó thấy bằng mắt thường hoặc những lỗi tiềm ẩn sâu trong quy trình.",
    target: "Mục tiêu: Đánh giá tầm quan trọng của việc phát hiện vấn đề."
  },
  {
    id: "CHOT_CHAN_RUI_RO",
    icon: "🛡️",
    name: "CHỐT CHẶN RỦI RO",
    category: "RED",
    description: "Trao cho bản tin KPH về những lỗi nghiêm trọng có thể gây hỏng lô hàng lớn hoặc ảnh hưởng trực tiếp đến an toàn.",
    target: "Mục tiêu: Đánh giá tầm quan trọng của việc phát hiện vấn đề."
  },
  {
    id: "THONG_TIN_CHUAN_MUC",
    icon: "📊",
    name: "THÔNG TIN CHUẨN MỰC",
    category: "RED",
    description: "Trao cho bản tin có mô tả 4M1E1I cực kỳ chi tiết, hình ảnh rõ nét, thông tin chính xác, không cần hỏi lại.",
    target: "Mục tiêu: Đánh giá tầm quan trọng của việc phát hiện vấn đề."
  },
  {
    id: "BAC_SI_MAY_MOC",
    icon: "🦾",
    name: "BÁC SĨ MÁY MÓC",
    category: "RED",
    description: "Trao cho các ca sửa chữa máy \"thần tốc\", giúp dây chuyền hoạt động trở lại sớm hơn dự kiến.",
    target: "Mục tiêu: Đánh giá hiệu quả sửa chữa & khôi phục máy móc."
  },
  {
    id: "CHOT_CHAN_5WHY",
    icon: "🔍",
    name: "CHỐT CHẶN 5-WHY",
    category: "RED",
    description: "Trao cho bản tin KPH mà người xử lý đã tìm ra nguyên nhân gốc rễ (Root Cause) cực kỳ thuyết phục, giúp lỗi không bao giờ tái diễn.",
    target: "Mục tiêu: Phân tích nguyên nhân gốc rễ để triệt tiêu lỗi."
  },
  {
    id: "HO_VE_DAY_CHUYEN",
    icon: "🛡️",
    name: "HỘ VỆ DÂY CHUYỀN",
    category: "RED",
    description: "Trao cho những hành động bảo trì phòng ngừa (Maintenance) phát hiện ra nguy cơ hỏng máy trước khi nó thực sự xảy ra.",
    target: "Mục tiêu: Bảo trì phòng ngừa & ngăn ngừa sự cố."
  },
  {
    id: "CHIEN_BINH_PHAN_UNG_NHANH",
    icon: "⚡",
    name: "CHIẾN BINH PHẢN ỨNG NHANH",
    category: "RED",
    description: "Trao cho cá nhân hoặc đội ngũ có mặt và xử lý sự cố khẩn cấp tại dây chuyền trong thời gian ngắn nhất kể từ khi nhận tin báo.",
    target: "Mục tiêu: Phản ứng nhanh & cấp cứu dây chuyền sản xuất."
  },
  {
    id: "BAC_THAY_DU_DOAN",
    icon: "🔮",
    name: "BẬC THẦY DỰ ĐOÁN",
    category: "RED",
    description: "Trao cho người có kỹ năng vận hành hoặc bảo trì chuyên sâu, chỉ cần \"nghe tiếng máy, ngửi mùi nhiệt\" hoặc nhìn thông số là đoán chính xác bệnh của máy trước khi hệ thống cảnh báo.",
    target: "Mục tiêu: Kỹ năng chẩn đoán & cảnh báo sớm sự cố máy."
  }
];

export const GREEN_BADGES: BadgeDefinition[] = [
  {
    id: "DIEM_SANG_TIEU_BIEU",
    icon: "🌟",
    name: "ĐIỂM SÁNG TIÊU BIỂU",
    category: "GREEN",
    description: "Huy hiệu mặc định cho các bản tin DSA có giá trị học hỏi cao cho toàn bộ nhà máy.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "CO_HOI_VANG",
    icon: "🤝",
    name: "CƠ HỘI VÀNG",
    category: "GREEN",
    description: "Trao cho bản tin về tiếp khách, audit, hoặc các thông tin có tiềm năng mang lại hợp đồng/mối quan hệ kinh doanh mới (Dành cho TH WATER).",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "SANG_KIEN_LAN_TOA",
    icon: "🚀",
    name: "SÁNG KIẾN LAN TỎA",
    category: "GREEN",
    description: "Trao cho bản tin DSA mà sau khi đăng, có nhiều đơn vị khác vào nút 'Đăng ký nhân rộng'.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "VUOT_TROI_NANG_SUAT",
    icon: "💎",
    name: "VƯỢT TRỘI NĂNG SUẤT",
    category: "GREEN",
    description: "Trao cho các bản tin ghi nhận việc phá kỷ lục sản xuất, rút ngắn thời gian làm việc mà vẫn đảm bảo chất lượng.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "CHAT_LUONG_VUOT_TROI",
    icon: "🛡️",
    name: "CHẤT LƯỢNG VƯỢT TRỘI",
    category: "GREEN",
    description: "Dành cho Cải thiện chất lượng, tượng trưng cho việc bảo vệ uy tín chất lượng của Tân Phú/DNP.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "MOI_TRUONG_5_SAO",
    icon: "✨",
    name: "MÔI TRƯỜNG 5 SAO",
    category: "GREEN",
    description: "Dành cho Cải tiến môi trường, tượng trưng cho sự sạch sẽ, gọn gàng, an toàn.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "THONG_TIN_RO_RANG",
    icon: "📜",
    name: "THÔNG TIN RÕ RÀNG",
    category: "GREEN",
    description: "Dành cho Chuẩn hóa thông tin đầu vào/ra.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "VAN_HANH_BEN_BI",
    icon: "🦾",
    name: "VẬN HÀNH BỀN BỈ",
    category: "GREEN",
    description: "Dành cho Ổn định chất lượng máy móc.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  },
  {
    id: "BAO_CHUNG_HE_THONG",
    icon: "🔄",
    name: "BẢO CHỨNG HỆ THỐNG",
    category: "GREEN",
    description: "Dành cho Duy trì và cải tiến hệ thống, tượng trưng cho sự cải tiến liên tục không ngừng nghỉ.",
    target: "Mục tiêu: Tôn vinh các thành tựu, sáng kiến và cơ hội kinh doanh."
  }
];

export const initialKnowledgeDocs: KnowledgeDoc[] = [
  {
    id: "KN-ISO-9001",
    factory: "TẤT_CẢ",
    branchId: "ALL",
    standardType: "ISO_9001",
    category: "STANDARD",
    code: "ISO-9001:2015",
    title: "Tiêu chuẩn ISO 9001:2015 - Điều khoản 8.5 & 8.7: Kiểm soát sản xuất & Xử lý KPH",
    summary: "Quy chuẩn quốc tế về hệ thống quản lý chất lượng, bắt buộc kiểm soát chặt chẽ các yếu tố 4M1E1I và cô lập tức thì sản phẩm lỗi không phù hợp.",
    effectiveDate: "01/01/24",
    version: "2024.1",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["ISO 9001", "KPH", "4M1E1I", "Sản xuất", "Chất lượng"],
    keywords: ["ISO 9001", "KPH", "4M1E1I", "Sản xuất", "Chất lượng", "Kiểm soát", "8.5", "8.7"],
    updatedBy: "Phòng Quản Lý Chất Lượng",
    updatedAt: "15/01/24 08:30:00",
    createdByName: "Phòng Quản Lý Chất Lượng",
    content: `# TIÊU CHUẨN ISO 9001:2015 - HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG

## 1. ĐIỀU KHOẢN 8.5: SẢN XUẤT VÀ CUNG CẤP DỊCH VỤ
- **8.5.1 Kiểm soát sản xuất:** Tổ chức phải thực hiện sản xuất trong các điều kiện được kiểm soát, bao gồm:
  + Sẵn có thông tin dạng văn bản xác định đặc tính sản phẩm (bản vẽ kỹ thuật, thông số ép/thổi/in, bảng màu chuẩn).
  + Sẵn có và sử dụng các thiết bị theo dõi và đo lường phù hợp (thước kẹp, panme, máy đo màu, cân điện tử).
  + Thực hiện các hoạt động theo dõi và đo lường tại các giai đoạn thích hợp (IPQC đầu ca, giữa ca, cuối ca).
  + Sử dụng cơ sở hạ tầng và môi trường phù hợp cho việc vận hành các quá trình.
  + Bổ nhiệm người có năng lực, bao gồm cả trình độ chuyên môn cần thiết (Công nhân vận hành máy phải được đào tạo và cấp chứng chỉ tay nghề).
- **8.5.6 Kiểm soát các thay đổi (MOC):** Tổ chức phải xem xét và kiểm soát các thay đổi đối với quá trình sản xuất (thay đổi khuôn, đổi hạt nhựa, thay đổi thông số máy, thay đổi nhân sự đứng chuyền) để đảm bảo duy trì sự phù hợp liên tục với các yêu cầu.

## 2. ĐIỀU KHOẢN 8.7: KIỂM SOÁT ĐẦU RA KHÔNG PHÙ HỢP (KPH)
- **8.7.1 Nguyên tắc xử lý KPH:** Tổ chức phải đảm bảo rằng các đầu ra không phù hợp với các yêu cầu của chúng phải được nhận biết và kiểm soát để ngăn chặn việc sử dụng hoặc chuyển giao vô tình.
  + Hành động khắc phục: Phải tiến hành cô lập lô hàng lỗi, dán thẻ nhận diện màu đỏ (Thẻ KPH).
  + Phân loại xử lý: Tái chế, phân loại lại, hạ cấp, sửa đổi hoặc tiêu hủy.
  + Đánh giá tác động: Khi đầu ra không phù hợp được phát hiện sau khi giao hàng hoặc trong quá trình sử dụng, tổ chức phải thực hiện hành động thích hợp tương ứng với các tác động hoặc tác động tiềm ẩn.
- **8.7.2 Lưu trữ hồ sơ:** Bắt buộc lưu giữ thông tin dạng văn bản mô tả sự không phù hợp, các hành động đã thực hiện, mọi sự nhượng bộ đạt được và thẩm quyền quyết định hành động xử lý.`
  },
  {
    id: "KN-BRCGS-PKG",
    factory: "TPP-BNI",
    branchId: "TPP-BNI",
    standardType: "BRCGS",
    category: "STANDARD",
    code: "BRCGS-PKG-V6",
    title: "Tiêu chuẩn BRCGS Bao bì & Vật liệu tiếp xúc Thực phẩm (Issue 6)",
    summary: "Tiêu chuẩn toàn cầu về an toàn vệ sinh và chất lượng bao bì thực phẩm áp dụng nghiêm ngặt cho nhà máy Bắc Ninh & Long An.",
    effectiveDate: "15/03/24",
    version: "Issue 6",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["BRCGS", "Bao bì thực phẩm", "Vệ sinh", "An toàn", "HACCP"],
    keywords: ["BRCGS", "Bao bì thực phẩm", "Vệ sinh", "An toàn", "HACCP", "Dị vật", "OPRP", "CCP"],
    updatedBy: "Phòng Quản Lý Chất Lượng",
    updatedAt: "20/03/24 09:15:00",
    createdByName: "Phòng Quản Lý Chất Lượng",
    content: `# TIÊU CHUẨN TOÀN CẦU BRCGS PACKAGING MATERIALS (ISSUE 6)

## 1. CAM KẾT CỦA LÃNH ĐẠO VÀ CẢI TIẾN LIÊN TỤC (Phần 1)
- Thiết lập chính sách an toàn sản phẩm và văn hóa chất lượng minh bạch.
- Đảm bảo các nguồn lực tài chính và con người để duy trì điều kiện phòng sạch, khu vực sản xuất đạt chuẩn vệ sinh thực phẩm.

## 2. HỆ THỐNG QUẢN LÝ MỐI NGUY VÀ RỦI RO (HACCP/HARA - Phần 2)
- Xác định tất cả các mối nguy tiềm ẩn:
  + Mối nguy Vật lý: Dị vật kim loại, mảnh nhựa vỡ, tóc, côn trùng, bụi cát, ốc vít rơi vào sản phẩm bao bì thực phẩm.
  + Mối nguy Hóa học: Thôi nhiễm mực in, dung môi tồn dư, dầu mỡ máy bôi trơn tiếp xúc mặt trong hộp/chai nhựa.
  + Mối nguy Vi sinh: Nấm mốc, vi khuẩn do độ ẩm cao hoặc công nhân không sát khuẩn tay trước khi thao tác.
- Thiết lập Điểm kiểm soát tới hạn (CCP) và Điểm kiểm soát kiểm soát tiên quyết (OPRP) tại các công đoạn ép, thổi, chia cuộn, đóng thùng.

## 3. QUẢN LÝ MÔI TRƯỜNG NHÀ XƯỞNG & VỆ SINH CÁ NHÂN (Phần 4 & 6)
- **Kiểm soát cửa ra vào & Đèn bẫy côn trùng:** Toàn bộ cửa xưởng phải đóng kín (cửa cuốn nhanh/màn nhựa chắn côn trùng). Đèn bắt côn trùng đặt cách xa dây chuyền hở ít nhất 3m và kiểm tra bóng đèn/bẫy keo hàng tuần.
- **Quy tắc Vệ sinh cá nhân:**
  + Công nhân phải mặc bảo hộ lao động đạt chuẩn: Mũ trùm kín tóc, khẩu trang, quần áo chuyên dụng không có túi trên ngực, giày bảo hộ sạch.
  + Cấm mang trang sức, đồng hồ, móng tay giả, bút bi bấm vào khu vực sản xuất hở.
  + Rửa tay và sát trùng cồn 70 độ trước khi vào xưởng sản xuất.`
  },
  {
    id: "KN-BSCI-COC",
    factory: "TPP-LAN",
    branchId: "TPP-LAN",
    standardType: "BSCI",
    category: "STANDARD",
    code: "BSCI-2024",
    title: "Bộ quy tắc Trách nhiệm Xã hội & Đạo đức Lao động amfori BSCI",
    summary: "Bộ quy tắc ứng xử xã hội về quyền của người lao động, an toàn sức khỏe nghề nghiệp (EHS) và bảo vệ môi trường.",
    effectiveDate: "01/02/24",
    version: "2024",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["BSCI", "Trách nhiệm xã hội", "EHS", "An toàn lao động"],
    keywords: ["BSCI", "Trách nhiệm xã hội", "EHS", "An toàn lao động", "PPE", "PCCC", "MSDS"],
    updatedBy: "Phòng Hành chính nhân sự",
    updatedAt: "10/02/24 14:00:00",
    createdByName: "Phòng Hành chính nhân sự",
    content: `# BỘ QUY TẮC TRÁCH NHIỆM XÃ HỘI AMFORI BSCI

## 1. NGUYÊN TẮC CỐT LÕI CỦA BSCI
- **Tự do lập hội và quyền thương lượng tập thể:** Tôn trọng quyền của người lao động được bầu đại diện và tham gia đối thoại định kỳ.
- **Không phân biệt đối xử:** Đảm bảo cơ hội bình đẳng về tuyển dụng, tiền lương, đào tạo, thăng tiến không phân biệt giới tính, độ tuổi, tôn giáo, dân tộc.
- **Thù lao công bằng:** Chi trả lương tối thiểu trở lên đúng hạn, đóng đầy đủ bảo hiểm xã hội, thưởng năng suất minh bạch.
- **Giờ làm việc hợp lý:** Tuân thủ Luật Lao động Việt Nam, làm thêm giờ tối đa không quá 40 giờ/tháng và trên tinh thần tự nguyện.

## 2. AN TOÀN VÀ SỨC KHỎE NGHỀ NGHIỆP (EHS)
- **Thiết bị bảo hộ cá nhân (PPE):** Cung cấp đầy đủ nút tai chống ồn (khu vực máy nghiền/máy ép), kính bảo hộ, găng tay chống cắt, găng tay chịu nhiệt.
- **PCCC & Thoát hiểm:** Lối thoát hiểm phải thông thoáng 100%, không để pallet/hàng hóa cản trở. Bình chữa cháy, chuông báo động, đèn sự cố kiểm tra định kỳ hàng tháng.
- **An toàn hóa chất:** Hóa chất vệ sinh, dung môi in phải có bảng chỉ dẫn an toàn hóa chất (MSDS) bằng tiếng Việt dán tại vị trí sử dụng, có khay chống tràn.`
  },
  {
    id: "KN-SCAN-SECURITY",
    factory: "TẤT_CẢ",
    branchId: "ALL",
    standardType: "SCAN",
    category: "STANDARD",
    code: "SCAN-CTPAT",
    title: "Tiêu chuẩn An ninh Chuỗi Cung ứng Toàn cầu SCAN (Supplier Compliance Audit Network)",
    summary: "Tiêu chuẩn an ninh nhà máy, an ninh container và vận chuyển hàng hóa xuất khẩu đi thị trường Mỹ/Âu.",
    effectiveDate: "01/01/24",
    version: "v3.0",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["SCAN", "C-TPAT", "An ninh chuỗi cung ứng", "Xuất khẩu", "Kiểm soát kho"],
    keywords: ["SCAN", "C-TPAT", "An ninh", "Container", "Seal", "7-Point", "VVTT"],
    updatedBy: "Phòng Kho vận & An ninh",
    updatedAt: "12/01/24 10:00:00",
    createdByName: "Phòng Kho vận & An ninh",
    content: `# TIÊU CHUẨN AN NINH CHUỖI CUNG ỨNG XUẤT KHẨU SCAN

## 1. AN NINH CƠ SỞ VẬT CHẤT & KIỂM SOÁT RA VÀO
- Toàn bộ cổng ra vào nhà máy phải có bảo vệ túc trực 24/7, ghi nhật ký khách ra vào và cấp thẻ khách có ảnh.
- Hệ thống camera an ninh giám sát (CCTV) bao phủ 100% các khu vực trọng yếu: Cổng chính, kho nguyên liệu, kho thành phẩm, bãi đóng hàng xuất khẩu, khu vực niêm phong container. Dữ liệu camera lưu trữ tối thiểu 45 ngày.
- Hàng rào chu vi nhà máy kiên cố, có hệ thống chiếu sáng đầy đủ vào ban đêm.

## 2. QUY TRÌNH KIỂM TRA 7 ĐIỂM XE CONTAINER (7-Point Inspection)
Trước khi đóng hàng xuất khẩu, nhân viên QA/Kho phải kiểm tra đủ 7 điểm trên container:
1. Thành trước (Front wall).
2. Thành bên trái (Left side).
3. Thành bên phải (Right side).
4. Sàn xe (Floor).
5. Trần xe / Nóc (Ceiling/Roof).
6. Cửa trong và ngoài / Khóa (Inside/Outside doors & locks).
7. Gầm xe / Khung gầm (Undercarriage).

## 3. QUY TRÌNH NIÊM PHONG SEAL AN NINH (VVTT - View, Verify, Tug, Twist)
- Sử dụng Seal cối chuẩn ISO 17712 High Security Seal.
- Sau khi bấm seal, nhân viên phải thực hiện quy trình VVTT (Nhìn mã số, Đối chiếu chứng từ, Giật mạnh kiểm tra độ ngậm, Vặn xoay kiểm tra).`
  },
  {
    id: "KN-MOC-4M1E1I",
    factory: "TPP-CTY",
    branchId: "TPP-CTY",
    standardType: "MOC_4M1E",
    category: "PROCEDURE",
    code: "QT-MOC-4M1E1I-2026",
    title: "Quy trình Kiểm soát Thay đổi 4M1E1I (Management of Change - MOC)",
    summary: "Quy trình cốt lõi của Tân Phú bắt buộc tuân thủ khi có bất kỳ biến động nào về Con người, Vật liệu, Máy móc, Phương pháp, Môi trường hoặc Thông tin.",
    effectiveDate: "01/01/26",
    version: "v4.0-2026",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["4M1E1I", "MOC", "Thay đổi", "Tân Phú", "Quy trình"],
    keywords: ["4M1E1I", "MOC", "Thay đổi", "FAI", "Risk Assessment", "FMEA", "Quy trình"],
    updatedBy: "Phòng Quản Lý Chất Lượng",
    updatedAt: "05/01/26 08:00:00",
    createdByName: "Phòng Quản Lý Chất Lượng",
    content: `# QUY TRÌNH KIỂM SOÁT THAY ĐỔI 4M1E1I (MOC) - TÂN PHÚ VIỆT NAM

## 1. MỤC ĐÍCH & PHẠM VI ÁP DỤNG
- **Mục đích:** Nhận diện sớm các rủi ro phát sinh khi có sự thay đổi tại hiện trường sản xuất, ngăn ngừa phế phẩm, sự cố thiết bị và khiếu nại khách hàng.
- **Phạm vi:** Áp dụng cho toàn bộ các nhà máy TPP-BNI, TPP-LAN, TPP-314, DNP-BBM, DNP-BBC và các phòng ban liên quan.

## 2. PHÂN LOẠI CÁC YẾU TỐ THAY ĐỔI (4M1E1I)
1. **MAN (Con người):** Thay đổi công nhân mới đứng máy, chuyển đổi tổ trưởng/quản đốc ca, nhân sự chưa qua đào tạo chuẩn thao tác.
2. **MATERIAL (Nguyên vật liệu):** Thay đổi nhà cung cấp hạt nhựa, đổi mã hạt nhựa, đổi phụ gia hạt màu, sử dụng nhựa tái sinh/nhựa xay tỷ lệ cao hơn quy định.
3. **MACHINE (Máy móc thiết bị):** Thay đổi khuôn mới, chuyển khuôn sang máy ép/thổi khác, đại tu trục vít, thay điện trở gia nhiệt, hỏng cảm biến nhiệt độ/áp suất.
4. **METHOD (Phương pháp/Quy trình):** Thay đổi chu kỳ ép (Cycle time), thay đổi nhiệt độ nòng xilanh, thay đổi áp suất phun/định hình, thay đổi quy cách đóng gói.
5. **ENVIRONMENT (Môi trường):** Thời tiết nồm ẩm cao làm ẩm hạt nhựa, nhiệt độ xưởng tăng cao làm giảm hiệu quả giải nhiệt khuôn, bụi bẩn trong không khí.
6. **INFORMATION (Thông tin):** Thay đổi lệnh sản xuất, thay đổi tiêu chuẩn kiểm tra (Inspection Standard), cập nhật bản vẽ hoặc yêu cầu đặc biệt mới từ khách hàng.

## 3. QUY TRÌNH THỰC HIỆN KHI CÓ THAY ĐỔI
- **Bước 1: Báo cáo Andon 4M1E1I:** Kỹ thuật/QC/Quản đốc đăng ngay báo cáo lên hệ thống 4M1E1I trong vòng 15 phút kể từ khi phát sinh thay đổi.
- **Bước 2: Đánh giá Rủi ro (Risk Assessment):** Tổ chức đánh giá nhanh rủi ro FMEA, đối chiếu với tiêu chuẩn ISO 9001/BRCGS của nhà máy.
- **Bước 3: Chạy thử & Đo kiểm mẫu FAI (First Article Inspection):** Chạy thử 50-100 sản phẩm, đo kích thước biên dạng 3D, thử độ bền kéo, thử độ kín, so màu quang phổ.
- **Bước 4: Phê duyệt từ Khách hàng & QA:** Chỉ được sản xuất hàng loạt khi có biên bản ký duyệt mẫu FAI của QA và sự đồng thuận của khách hàng đối với các sản phẩm OEM/Xuất khẩu.
- **Bước 5: Theo dõi lô sản xuất đầu tiên (Intensive Monitoring):** Đội ngũ QC tăng tần suất lấy mẫu gấp đôi (mỗi 30 phút/lần) trong suốt ca đầu tiên áp dụng thay đổi.`
  },
  {
    id: "KN-CAPA-KPH",
    factory: "TẤT_CẢ",
    branchId: "ALL",
    standardType: "CAPA_SOP",
    category: "PROCEDURE",
    code: "QT-CAPA-02",
    title: "Quy trình Xử lý Sự Không Phù Hợp & Hành động Khắc phục Phòng ngừa (CAPA)",
    summary: "Hướng dẫn thực hiện 5-Why, xác định nguyên nhân gốc rễ và thiết lập biện pháp phòng ngừa triệt để không tái diễn.",
    effectiveDate: "10/01/25",
    version: "v3.2",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["CAPA", "5-Why", "KPH", "Cải tiến", "Phòng ngừa"],
    keywords: ["CAPA", "5-Why", "KPH", "Cải tiến", "Phòng ngừa", "8D", "Containment"],
    updatedBy: "Phòng Quản Lý Chất Lượng",
    updatedAt: "15/01/25 10:30:00",
    createdByName: "Phòng Quản Lý Chất Lượng",
    content: `# QUY TRÌNH XỬ LÝ KPH VÀ HÀNH ĐỘNG KHẮC PHỤC PHÒNG NGỪA (CAPA)

## 1. CÁC BƯỚC XỬ LÝ KHI PHÁT HIỆN LỖI KPH
1. **Dừng máy & Cô lập tức thì (Containment Action):**
   - Dán nhãn "HÀNG CHỜ XỬ LÝ - KHÔNG PHÙ HỢP" màu đỏ lên toàn bộ kiện hàng nghi ngờ.
   - Khoanh vùng thời gian từ lần kiểm tra đạt gần nhất tới thời điểm phát hiện lỗi.
2. **Thành lập nhóm giải quyết vấn đề (8D Team):**
   - Bao gồm: Quản đốc xưởng, Kỹ thuật công nghệ máy, Nhân viên QC phụ trách, Công nhân vận hành trực tiếp.
3. **Phân tích nguyên nhân gốc rễ bằng 5-Why (Root Cause Analysis):**
   - Đặt câu hỏi "Tại sao" liên tiếp đến khi tìm ra nguyên nhân bản chất về mặt hệ thống/quy trình (không đổ lỗi cho cá nhân).
   - Ví dụ:
     * Why 1: Tại sao sản phẩm bị bavia (Flash)? -> Do áp suất phun quá cao và lực kẹp khuôn bị yếu.
     * Why 2: Tại sao áp suất phun quá cao? -> Do công nhân tự ý tăng áp suất để khắc phục lỗi thiếu liệu trước đó.
     * Why 3: Tại sao sản phẩm bị thiếu liệu? -> Do nhiệt độ nòng xilanh vùng 2 bị tụt 20 độ C.
     * Why 4: Tại sao nhiệt độ bị tụt? -> Do vòng nhiệt bị đứt dây nhưng đồng hồ báo nhiệt độ ảo.
     * Why 5: Tại sao không phát hiện sớm vòng nhiệt hỏng? -> Do chưa có checklist đo điện trở định kỳ hàng tuần của bảo trì.
4. **Đưa ra Hành động Khắc phục (Corrective Action) & Hành động Phòng ngừa (Preventive Action):**
   - Thay thế vòng nhiệt mới (Khắc phục trước mắt).
   - Bổ sung hạng mục đo dòng điện trở nhiệt vào biểu mẫu bảo trì dự phòng PM hàng tuần (Phòng ngừa lâu dài).
5. **Đánh giá hiệu quả sau 30 ngày:**
   - QA kiểm tra lại tỷ lệ lỗi tương tự trong 30 ngày tiếp theo. Nếu tỷ lệ lỗi = 0% mới cho phép đóng hồ sơ CAPA.`
  },
  {
    id: "KN-WI-INJECTION-QC",
    factory: "TPP-314",
    branchId: "TPP-314",
    standardType: "FACTORY_INTERNAL",
    category: "WORK_INSTRUCTION",
    code: "HD-QC-EP-314",
    title: "Hướng dẫn kiểm tra chất lượng & Nhận diện khuyết tật sản phẩm ép nhựa",
    summary: "Bảng nhận diện lỗi ngoại quan ép nhựa: Thiếu liệu, Bavia, Co ngót (Sink mark), Đốm đen (Black speck), Cong vênh (Warpage), Vết dòng chảy (Flow mark).",
    effectiveDate: "20/02/25",
    version: "v2.0",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["Ép nhựa", "SOP", "QC", "Khuyết tật", "Nhà máy 314"],
    keywords: ["Ép nhựa", "SOP", "QC", "Khuyết tật", "Thiếu liệu", "Bavia", "Co ngót", "Đốm đen", "Cong vênh"],
    updatedBy: "Phòng Quản Lý Chất Lượng",
    updatedAt: "25/02/25 15:45:00",
    createdByName: "Phòng Quản Lý Chất Lượng",
    content: `# HƯỚNG DẪN KIỂM TRA CHẤT LƯỢNG SẢN PHẨM ÉP NHỰA (SOP/WI)

## 1. CÁC TIÊU CHÍ KIỂM TRA ĐẦU CA (START-UP INSPECTION)
- Kiểm tra 5 sản phẩm đầu tiên của ca:
  1. Ngoại quan: Bề mặt bóng đều, không bọt khí, không đốm đen, không trầy xước.
  2. Kích thước quan trọng: Đo bằng thước kẹp điện tử sai số cho phép ±0.1mm.
  3. Trọng lượng sản phẩm: Cân bằng cân phân tích điện tử chính xác đến 0.01g.
  4. Lắp ghép thử: Thử nắp vào thân hoặc khớp nối với linh kiện đối ứng.

## 2. BẢNG HƯỚNG DẪN XỬ LÝ KHUYẾT TẬT NGOẠI QUAN ÉP NHỰA
| Tên khuyết tật | Hiện tượng | Nguyên nhân chính (4M1E1I) | Biện pháp xử lý chuẩn |
| --- | --- | --- | --- |
| **Thiếu liệu (Short Shot)** | Nhựa không điền đầy lòng khuôn | Áp suất/tốc độ phun thấp, nhiệt độ nhựa thấp, nghẹt cổng phun | Tăng áp suất phun, tăng nhiệt độ vòi phun, vệ sinh đường keo |
| **Bavia (Flash)** | Màng nhựa mỏng thừa ở đường phân khuôn | Lực kẹp khuôn yếu, áp suất phun quá lớn, khuôn bị mòn/hở | Tăng lực kẹp khuôn, giảm áp suất giữ, bảo dưỡng làm phẳng mặt khuôn |
| **Co ngót (Sink Mark)** | Vết lõm bề mặt ở vị trí gân/thành dày | Áp suất giữ thấp, thời gian giữ áp ngắn, làm nguội không đủ | Tăng áp suất giữ áp, kéo dài thời gian làm nguội, hạ nhiệt độ nước làm mát khuôn |
| **Đốm đen / Cháy nhựa** | Hạt đen li ti bám trên thân sản phẩm | Nhựa lưu trong xilanh quá lâu bị cháy, lẫn tạp chất, keo thu hồi bẩn | Bắn sạch xilanh (Purging), giảm nhiệt độ nòng, kiểm tra sàng lọc keo xay |
| **Cong vênh (Warpage)** | Sản phẩm bị méo, biến dạng sau khi nhả khuôn | Nhiệt độ 2 nửa khuôn chênh lệch lớn, giải nhiệt không đều | Điều chỉnh cân bằng nhiệt độ nước làm mát giữa nửa đực và nửa cái |`
  },
  {
    id: "KN-WI-FLEXIBLE-DNP",
    factory: "DNP-BBM",
    branchId: "DNP-BBM",
    standardType: "FACTORY_INTERNAL",
    category: "WORK_INSTRUCTION",
    code: "HD-SX-BBM-DNP",
    title: "Hướng dẫn kiểm soát chất lượng In ống đồng & Ghép màng phức hợp (BBM)",
    summary: "Quy chuẩn kiểm soát độ bám dính mực in, độ bền ghép màng, tồn dư dung môi và sai lệch bước in cho nhà máy BBM.",
    effectiveDate: "15/01/25",
    version: "v2.5",
    status: "ĐANG_ÁP_DỤNG",
    isActive: true,
    tags: ["Bao bì mềm", "In ống đồng", "Ghép màng", "DNP-BBM", "Dung môi"],
    keywords: ["Bao bì mềm", "In ống đồng", "Ghép màng", "DNP-BBM", "Dung môi", "Zahn Cup", "Cross-mark"],
    updatedBy: "Phòng Kỹ thuật BBM DNP",
    updatedAt: "18/01/25 11:20:00",
    createdByName: "Phòng Kỹ thuật BBM DNP",
    content: `# HƯỚNG DẪN KIỂM SOÁT CHẤT LƯỢNG IN & GHÉP MÀNG PHỨC HỢP (DNP-BBM)

## 1. KIỂM SOÁT CÔNG ĐOẠN IN ỐNG ĐỒNG
- **Độ nhớt mực in:** Đo bằng chén Zahn Cup số 3 mỗi 60 phút/lần. Tiêu chuẩn độ nhớt: 14 - 16 giây.
- **Tỷ lệ pha dung môi:** Sử dụng đúng tỷ lệ dung môi bay hơi nhanh (EA) và dung môi chậm (IPA/PMA) theo quy định nhiệt độ môi trường.
- **Độ chồng màu (Register):** Kiểm tra dấu cross-mark sai lệch màu không vượt quá ±0.15mm.
- **Thử nghiệm độ bám dính mực:** Dùng băng keo 3M chuyên dụng dán lên bề mặt in, miết chặt và giật 90 độ. Tiêu chuẩn: Mực không được bong tróc quá 2%.

## 2. KIỂM SOÁT CÔNG ĐOẠN GHÉP MÀNG (DRY LAMINATION / EXTRUSION)
- **Lượng tráng keo (Coating Weight):** Cân định lượng keo tráng khô đạt từ 2.0 - 2.5 g/m² đối với bao bì thường, 3.0 - 3.5 g/m² đối với bao bì thanh trùng.
- **Độ bền bóc tách màng (Peel Strength):** Cắt mẫu thử chiều rộng 15mm, kéo trên máy thử lực vạn năng. Tiêu chuẩn lực bóc tách > 2.5 N/15mm.
- **Kiểm soát dung môi tồn dư (Retained Solvent):** Phân tích bằng máy sắc ký khí GC định kỳ mỗi lô sản xuất. Tiêu chuẩn tổng dung môi tồn dư < 10 mg/m², đảm bảo tuyệt đối an toàn cho bao bì đóng gói thực phẩm.`
  }
];

