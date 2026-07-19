export enum UserRole {
  ADMIN = "CHỦ ADMIN",
  REVIEWER = "DUYỆT VIÊN",
  STAFF = "NHÂN VIÊN"
}

export enum UserStatus {
  ACTIVE = "Đã hoạt động",
  PENDING = "Chờ phê duyệt",
  LOCKED = "Đã khóa",
  REJECTED = "Bị từ chối"
}

export interface User {
  id: string; // Mã nhân sự
  fullName: string;
  phone: string;
  department: string;
  branch: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  position?: string;
  isOnline?: boolean;
  lastActive?: number;
  company?: string;
  canSpeciallyEditDelete?: boolean;
  bypassApproval?: boolean;
  activeLogs?: number[];
  avatar?: string;
}

export type Category4M1E1I = 
  | "CON NGƯỜI" 
  | "NGUYÊN VẬT LIỆU" 
  | "MÁY MÓC" 
  | "PHƯƠNG PHÁP" 
  | "MÔI TRƯỜNG" 
  | "THÔNG TIN";

export interface QualityReportDirective {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  isAcknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  acknowledges?: { by: string; at: string }[];
}

export interface QualityReportResolution {
  id: string;
  departmentName: string;
  handlerName: string;
  status: "Đang xử lý" | "Đã xử lý";
  resultText: string;
  updatedAt: string;
}

export interface QualityReportReplication {
  id: string;
  factoryName: string;
  departmentName: string;
  registrantName: string;
  status: "Đang chuẩn bị" | "Đang triển khai" | "Đã hoàn thành";
  targetDate: string; // Must be dd/mm/yy
  notes?: string;
  currentState: string;
  supportRequired: string;
  updatedAt: string;
}

export interface QualityReport {
  id: string;
  factory: string;
  timestamp: string;
  category: Category4M1E1I;
  content: string;
  imageUrl: string; // Base64 of compressed WebP
  imageUrls?: string[]; // Array of up to 3 compressed image Base64s
  compressedSizeKb: number;
  originalSizeKb: number;
  uploaderName: string;
  uploaderPhone: string;
  uploaderId: string;
  uploaderDepartment: string;
  notes?: string;
  isAbnormal: boolean; // Is abnormal/alert report (Không phù hợp - KPH)
  isSpotlight?: boolean; // Is spotlight (Điểm sáng - DSA)
  reportType?: "KPH" | "DSA" | "NORMAL"; // Classification of the report
  googleDrivePath?: string;
  directives?: QualityReportDirective[];
  likedBy?: string[];
  sharedBy?: string[];
  updatedAt?: string;
  updateLogs?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  resolutions?: QualityReportResolution[];
  replications?: QualityReportReplication[];
  reportCode?: string;
  errorCode?: string; // Mã lỗi từ danh mục (ví dụ ERM0001, ERC0001)
  qcConfirmed?: boolean;
  qcConfirmedBy?: string;
  qcConfirmedAt?: string;
  ratings?: QualityReportRating[];
  badges?: QualityReportBadge[];
  assignedPersonId?: string;
  assignedPersonName?: string;
  assignedPersonRole?: string;
}

export interface QualityReportBadge {
  id: string; // unique badge type key
  name: string; // Display name
  category: "RED" | "GREEN"; // Red for KPH, Green for DSA
  giverId: string;
  giverName: string;
  giverRole: string;
  giverPosition?: string;
  timestamp: string; // dd/mm/yy
}

export interface BadgePointConfigItem {
  id: string;
  keywords: string[];
  displayName: string;
  points: number;
}

export function getBadgeScore(position?: string): number {
  if (!position) return 0;
  const clean = position.toLowerCase().normalize("NFC").trim();
  
  // Try to load custom badge configs from localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem("4m1e1i_badge_points_config");
      if (saved) {
        const customConfigs: BadgePointConfigItem[] = JSON.parse(saved);
        if (customConfigs && Array.isArray(customConfigs) && customConfigs.length > 0) {
          for (const config of customConfigs) {
            if (config.keywords && Array.isArray(config.keywords)) {
              for (const kw of config.keywords) {
                const kwClean = kw.toLowerCase().normalize("NFC").trim();
                if (kwClean && clean.includes(kwClean)) {
                  return config.points;
                }
              }
            }
          }
          // If we have custom configs defined but none matches, we fallback to 0
          return 0;
        }
      }
    }
  } catch (e) {
    // ignore
  }

  if (clean.includes("tổng giám đốc") || clean.includes("tgđ") || clean.includes("tổng gđ")) {
    return 100;
  }
  if (clean.includes("giám đốc") || clean.includes("gđ") || clean.includes("ban giám đốc")) {
    return 50;
  }
  if (clean.includes("trưởng phòng") || clean.includes("phó phòng") || clean.includes("trưởng phân xưởng") || clean.includes("phó phân xưởng")) {
    return 30;
  }
  if (clean.includes("trưởng ca") || clean.includes("phó ca") || clean.includes("ca trưởng") || clean.includes("ca phó")) {
    return 10;
  }
  return 0;
}

export interface QualityReportRating {
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  imagesRating: number; // 1-5 stars
  infoRating: number; // 1-5 stars
  timelinessRating: number; // 1-5 stars
  timestamp: string; // dd/mm/yy
  comment?: string; // Ghi chú thêm
}

export interface Company {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  companyId: string;
  isScoring?: boolean; // Tính điểm
}

export interface Department {
  id: string;
  name: string;
  branchId: string;
  isScoring?: boolean; // Tính điểm
}

export interface BroadcastNotice {
  id: string;
  type: string; // e.g. "Quản trị viên phát sóng", "Thông báo đỏ"
  content: string;
  sender: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "new_report" | "new_directive" | "update_report" | "broadcast";
  targetReportId?: string;
  authorName: string;
  factoryName: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderPhone: string;
  message: string;
  timestamp: string;
  reportRefId?: string; // Reference to a quality report
  threadId?: string; // Reference to a forum topic/thread
  threadTitle?: string; // If thread starter, the title of the topic
  threadCategory?: string; // Category of the thread (e.g. "Góp ý", "Cải tiến")
}

export interface OfflineQueueItem {
  id: string;
  reportData: Omit<QualityReport, "id" | "googleDrivePath">;
  queuedAt: string;
}

export interface CatalogProduct {
  code: string;
  barcode: string;
  name: string;
  unit: string;
}

export interface CatalogMold {
  code: string;
  name: string;
  description: string;
}

export interface ProductionRequestItem {
  id: string; // unique item id
  productCode: string;
  barcode: string;
  productName: string;
  unit: string;
  quantity: number;
  notes: string;
  imageUrl?: string; // illustration image
  imageAnnotations?: string; // annotated guidelines on image
}

export enum ProductionRequestStatus {
  PENDING = "Chờ xem xét",
  BALANCED = "Đã cân đối (Chuẩn bị triển khai)",
  IMPLEMENTED = "Đã triển khai",
  REJECTED = "Từ chối"
}

export interface ProductionRequest {
  id: string;
  requestNo: string; // BM01-QT.01/KD ...
  requestDate: string; // Ngày yêu cầu
  targetBranch: string; // Kính gửi (CN Bắc Ninh, CN Long An...)
  contact: string; // Liên hệ
  department: string; // Phòng kinh doanh yêu cầu (Kênh dự án, Kênh lẻ...)
  items?: ProductionRequestItem[];
  uploaderName: string;
  uploaderPhone: string;
  uploaderId: string;
  status: ProductionRequestStatus;
  balanceNotes?: string; // Ghi chú cân đối tồn kho / hàng hóa của SC
  inventoryChecked?: boolean; // Đã kiểm tra tồn kho
  implementationId?: string; // Reference to OrderImplementation if created
}

export interface OrderImplementation {
  id: string;
  requestId: string; // Refer to ProductionRequest
  requestNo: string;
  productName: string;
  customerName: string; // Tên khách hàng (Hùng Cường - Nutricare,...)
  
  // Mold Requirements
  moldOption: "MỚI" | "SỬA_KHUÔN" | "NHƯ_INOCHI";
  moldDetail: string; // Mô tả sửa khuôn / insert logo
  
  // Plastic Formula
  formulaOption: "MỚI" | "NHƯ_INOCHI";
  formulaDetail: string; // Mô tả phế xoay vòng, kháng khuẩn...
  
  // Product Color
  colorOption: "MÀU_MỚI" | "NHƯ_INOCHI";
  colorPantone1: string;
  colorPantone2: string;
  colorName1: string;
  colorName2: string;
  
  // Printing on product
  printOption: "CÓ_IN" | "KHÔNG_IN";
  printDetail: string; // File đính kèm, pantone
  
  // Packaging Spec
  packagingOption: "MỚI" | "NHƯ_INOCHI";
  packagingDetail: string; // SP/túi, hộp x số túi...
  
  // Packings (Bao bì)
  pkgMaterialOption: "MỚI" | "NHƯ_INOCHI";
  pkgMaterialDetail: string; // tem nhãn, thùng C2, màng PET,...
  
  // Sample production
  sampleOption: "KD_TỰ_TÌM" | "NHÀ_MÁY_TRIỂN_KHAI";
  sampleDetail: string; // loại bao bì
  
  // Sample Approval
  approvalOption: "TRỰC_TIẾP_NCC" | "ONLINE_KÝ_MẪU_SAU" | "CHỊU_CHI_PHÍ";
  approvalDetail: string;
  
  // Quality Standards - Appearance
  qcStandardOption: "TIÊU_CHUẨN_KHÁCH_HÀNG" | "THEO_TIÊU_CHUẨN_TÂN_PHÚ";
  qcStandardDetail: string; // vb bụi bẩn, côn trùng...
  
  // Quality Standards - Safety
  safetyStandardOption: "TIÊU_CHUẨN_KHÁCH_HÀNG" | "THEO_TIÊU_CHUẨN_INOCHI";
  safetyStandardDetail: string; // FDA, EU...
  
  creatorName: string; // uploader từ Khối SCM (TPP-CTY)
  createdAt: string; 
}

export type IncidentCategory = "mechanical" | "electrical" | "quality" | "material" | "safety";
export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "active" | "acknowledged" | "resolved";

export interface Incident {
  id: string;
  lineId: string;
  lineName: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  description: string;
  reportedBy: string;
  createdAt: string;
  status: IncidentStatus;
  assignedTo?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export type LineStatus = "normal" | "warning" | "stopped";

export interface ProductionLine {
  id: string;
  name: string;
  manager: string;
  status: LineStatus;
  targetOutput: number;
  actualOutput: number;
  oee?: number;
}

export interface FactoryMetrics {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  mttr: number;
  activeIncidents: number;
}

export type ForumTopicCategory = "Góp ý chức năng" | "Cải tiến 4M1E" | "Kiến nghị khác";
export type ForumTopicStatus = "OPEN" | "PROCESSING" | "RESOLVED";

export interface ForumTopic {
  id: string;
  title: string;
  description: string;
  category: ForumTopicCategory;
  creatorName: string;
  creatorPhone: string;
  creatorRole: string;
  timestamp: string;
  status: ForumTopicStatus;
  isPinned: boolean;
}

export interface ForumReply {
  id: string;
  topicId: string;
  senderName: string;
  senderPhone: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export interface ErrorCatalogItem {
  code: string;        // Ví dụ: ERM0001, ERC0001
  category: "BBM" | "BBC"; // BBM (Bao bì mềm), BBC (Bao bì cứng)
  name: string;        // Tên lỗi (ví dụ: Xước màng, Bavia, Thiếu liệu)
  description: string; // Diễn giải lỗi rõ ràng
  createdAt: string;   // dd/mm/yy
}


