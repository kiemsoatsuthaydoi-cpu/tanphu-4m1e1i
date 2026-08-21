import { FestiveBannerTheme, FestiveBannerConfig } from "../types";

export interface FestivePresetMeta {
  id: FestiveBannerTheme;
  label: string;
  badge: string;
  defaultTitle: string;
  defaultSubtitle: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  iconName: string;
  particleType: "blossom" | "star" | "snow" | "lantern" | "flower" | "sparkle" | "none";
}

export const FESTIVE_PRESETS: Record<FestiveBannerTheme, FestivePresetMeta> = {
  TET_NGUYEN_DAN: {
    id: "TET_NGUYEN_DAN",
    label: "Tết Nguyên Đán",
    badge: "Tết Âm Lịch",
    defaultTitle: "CHÚC MỪNG NĂM MỚI - XUÂN THỊNH VƯỢNG",
    defaultSubtitle: "Kính chúc toàn thể Cán bộ Công nhân viên Tân Phú một năm mới An Khang Thịnh Vượng - Vạn Sự Như Ý!",
    bgGradient: "bg-gradient-to-r from-[#7F0000] via-[#B71C1C] to-[#E65100]",
    textColor: "text-amber-100",
    accentColor: "#FFD700",
    iconName: "Sparkles",
    particleType: "blossom",
  },
  QUOC_KHANH_2_9: {
    id: "QUOC_KHANH_2_9",
    label: "Quốc Khánh",
    badge: "2/9",
    defaultTitle: "NHIỆT LIỆT CHÀO MỪNG NGÀY QUỐC KHÁNH 2/9",
    defaultSubtitle: "Tự hào truyền thống dân tộc - Đồng lòng thi đua lao động sản xuất kiến thiết Tân Phú vững mạnh!",
    bgGradient: "bg-gradient-to-r from-[#8B0000] via-[#C62828] to-[#8B0000]",
    textColor: "text-amber-200",
    accentColor: "#FFEB3B",
    iconName: "Flag",
    particleType: "star",
  },
  GIAI_PHONG_30_4: {
    id: "GIAI_PHONG_30_4",
    label: "Giải phóng miền Nam",
    badge: "30/4",
    defaultTitle: "KỶ NIỆM NGÀY GIẢI PHÓNG MIỀN NAM - THỐNG NHẤT ĐẤT NƯỚC 30/4",
    defaultSubtitle: "Hào khí non sông thống nhất - Vững bước tiến tới tương lai phát triển bền vững và thịnh vượng!",
    bgGradient: "bg-gradient-to-r from-[#990000] via-[#D32F2F] to-[#880E4F]",
    textColor: "text-amber-100",
    accentColor: "#FFD54F",
    iconName: "Award",
    particleType: "star",
  },
  QUOC_TE_LAO_DONG_1_5: {
    id: "QUOC_TE_LAO_DONG_1_5",
    label: "Quốc tế Lao động",
    badge: "1/5",
    defaultTitle: "NHIỆT LIỆT CHÀO MỪNG NGÀY QUỐC TẾ LAO ĐỘNG 1/5",
    defaultSubtitle: "Tôn vinh và tri ân những đóng góp miệt mài của toàn thể Cán bộ Công nhân viên Tân Phú!",
    bgGradient: "bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#00838F]",
    textColor: "text-blue-50",
    accentColor: "#64B5F6",
    iconName: "HeartHandshake",
    particleType: "sparkle",
  },
  GIO_TO_HUNG_VUONG: {
    id: "GIO_TO_HUNG_VUONG",
    label: "Giỗ Tổ Hùng Vương",
    badge: "10/3 ÂL",
    defaultTitle: "GIỖ TỔ HÙNG VƯƠNG - UỐNG NƯỚC NHỚ NGUỒN",
    defaultSubtitle: "Tưởng nhớ công đức các Vua Hùng đã có công dựng nước - Đoàn kết phát huy giá trị văn hóa Tân Phú!",
    bgGradient: "bg-gradient-to-r from-[#4E342E] via-[#6D4C41] to-[#8D6E63]",
    textColor: "text-amber-100",
    accentColor: "#FFE082",
    iconName: "Crown",
    particleType: "sparkle",
  },
  TRUNG_THU: {
    id: "TRUNG_THU",
    label: "Tết Trung Thu",
    badge: "15/8 ÂL",
    defaultTitle: "TẾT TRUNG THU - VUI HỘI TRĂNG RẰM ĐOÀN VIÊN",
    defaultSubtitle: "Chúc đại gia đình Tân Phú đón một mùa Trung thu ấm áp, sum vầy và tràn ngập niềm vui!",
    bgGradient: "bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#3B0764]",
    textColor: "text-amber-200",
    accentColor: "#FDE047",
    iconName: "Moon",
    particleType: "lantern",
  },
  GIANG_SINH_NOEL: {
    id: "GIANG_SINH_NOEL",
    label: "Giáng Sinh & Năm Mới",
    badge: "24/12 & 1/1",
    defaultTitle: "GIÁNG SINH AN LÀNH & CHÚC MỪNG NĂM MỚI",
    defaultSubtitle: "Merry Christmas & Happy New Year - Kính chúc mùa lễ hội ngập tràn hạnh phúc và may mắn!",
    bgGradient: "bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#881337]",
    textColor: "text-emerald-100",
    accentColor: "#A7F3D0",
    iconName: "TreePine",
    particleType: "snow",
  },
  NGAY_NHA_GIAO_20_11: {
    id: "NGAY_NHA_GIAO_20_11",
    label: "Ngày Nhà giáo VN",
    badge: "20/11",
    defaultTitle: "CHÚC MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11",
    defaultSubtitle: "Tri ân sâu sắc các Giảng viên nội bộ, Chuyên gia hướng dẫn Kaizen và Đào tạo 4M1E1I Tân Phú!",
    bgGradient: "bg-gradient-to-r from-[#065F46] via-[#0F766E] to-[#1E3A8A]",
    textColor: "text-teal-100",
    accentColor: "#5EEAD4",
    iconName: "GraduationCap",
    particleType: "sparkle",
  },
  PHU_NU_8_3_20_10: {
    id: "PHU_NU_8_3_20_10",
    label: "Ngày Phụ Nữ",
    badge: "8/3 & 20/10",
    defaultTitle: "CHÚC MỪNG NGÀY PHỤ NỮ VIỆT NAM",
    defaultSubtitle: "Kính chúc các Nữ Cán bộ Công nhân viên Tân Phú luôn xinh đẹp, hạnh phúc và thành công rực rỡ!",
    bgGradient: "bg-gradient-to-r from-[#831843] via-[#9D174D] to-[#581C87]",
    textColor: "text-pink-100",
    accentColor: "#F472B6",
    iconName: "Heart",
    particleType: "flower",
  },
  KY_NIEM_TAN_PHU: {
    id: "KY_NIEM_TAN_PHU",
    label: "Thi đua Tân Phú",
    badge: "Tân Phú",
    defaultTitle: "THI ĐUA LAO ĐỘNG SẢN XUẤT & KIỂM SOÁT THAY ĐỔI 4M1E1I",
    defaultSubtitle: "Mỗi nhân viên là một chuyên gia Quản lý chất lượng - Vững vàng nâng tầm vị thế Tân Phú!",
    bgGradient: "bg-gradient-to-r from-[#0F2942] via-[#004B87] to-[#0072CE]",
    textColor: "text-sky-100",
    accentColor: "#38BDF8",
    iconName: "Trophy",
    particleType: "sparkle",
  },
  CUSTOM_IMAGE: {
    id: "CUSTOM_IMAGE",
    label: "Tự tải ảnh Banner",
    badge: "Tùy chọn",
    defaultTitle: "THÔNG ĐIỆP SỰ KIỆN TÂN PHÚ",
    defaultSubtitle: "Hệ thống kiểm soát thay đổi 4M1E1I theo thời gian thực",
    bgGradient: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900",
    textColor: "text-white",
    accentColor: "#E2E8F0",
    iconName: "Image",
    particleType: "none",
  }
};

/**
 * Parses a dd/mm/yy or dd/mm/yyyy date string into a Date object at start of day.
 */
export const parseDdMmYy = (str?: string): Date | null => {
  if (!str) return null;
  const parts = str.trim().split(/[/.-]/);
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000; // yy -> 20yy
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  return d;
};

/**
 * Checks if current date falls within active range of the banner config.
 */
export const isFestiveBannerActive = (config?: FestiveBannerConfig | null): boolean => {
  if (!config || !config.enabled) return false;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (config.startDate) {
    const start = parseDdMmYy(config.startDate);
    if (start && today < start) return false;
  }
  
  if (config.endDate) {
    const end = parseDdMmYy(config.endDate);
    if (end && today > end) return false;
  }
  
  return true;
};
