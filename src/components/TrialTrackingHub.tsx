import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  Plus, 
  ChevronRight, 
  Building2, 
  Filter, 
  Search, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  User as UserIcon, 
  Calendar, 
  Tag, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  CheckCheck,
  XCircle,
  FileText,
  SlidersHorizontal,
  Settings,
  GripVertical,
  Move,
  Trash2,
  Edit,
  Pencil,
  MessageSquare,
  Heart,
  Award,
  Send,
  AtSign,
  X,
  Flame,
  Shield,
  UserCheck,
  Sparkles,
  Cloud,
  CloudOff,
  RefreshCw,
  Activity,
  Zap,
  CheckCircle,
  Copy,
  Lock,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft
} from "lucide-react";
import { TrialTrackingItem, TrialStepKey, TrialStepDetail, User, UserRole, Category4M1E1I, Branch, Department, QualityReportDirective, QualityReportBadge } from "../types";
import { initialTrialTrackings } from "../data/trialTrackings";
import { StepCustomizerModal } from "./StepCustomizerModal";
import { MentionTextArea } from "./MentionTextArea";
import { AutoImageSlider } from "./AutoImageSlider";
import { T } from "./TranslateText";
import { parseReportTimestamp } from "../utils/notificationHelper";
import { GREEN_BADGES, RED_BADGES, initialBranches, initialDepartments } from "../data";
import { 
  subscribeTrialsFromCloud, 
  saveTrialToCloud, 
  deleteTrialFromCloud, 
  autoMigrateLocalTrialsToCloud,
  compressImageToWebP,
  processTrialImageFile
} from "../utils/trialFirebaseSync";
import { filterTrialItemsWithin30Days } from "../utils/storageCleaner";
import { isTrialInScope, getEffectiveCompanyScope } from "../utils/companyScope";

/**
 * Checks if a user has permission to confirm or modify a specific trial step.
 * - Admin (UserRole.ADMIN or canSpeciallyEditDelete) has supreme access.
 * - Staff belonging to the step's responsible BP/ĐV (roleResponsible) have confirmation rights.
 * - Branch / Plant directors and managers have managerial confirmation rights for their branch.
 */
export const checkUserStepPermission = (
  user: User | null,
  item: TrialTrackingItem,
  stepKey: string,
  stepDetail?: TrialStepDetail
): { allowed: boolean; roleName: string; isSuperAdmin: boolean; isBranchManager: boolean } => {
  if (!user) {
    return { allowed: false, roleName: "", isSuperAdmin: false, isBranchManager: false };
  }

  // 1. Super Admin or users with special edit/delete permissions (Admin có quyền tối cao)
  const isSuperAdmin = user.role === UserRole.ADMIN || !!user.canSpeciallyEditDelete;
  if (isSuperAdmin) {
    return { allowed: true, roleName: "Admin", isSuperAdmin: true, isBranchManager: false };
  }

  const step = stepDetail || item.steps?.[stepKey];
  const roleResponsible = (step?.roleResponsible || "").trim();

  // If no specific role is specified, allow any authenticated staff
  if (!roleResponsible) {
    return { allowed: true, roleName: user.department || "", isSuperAdmin: false, isBranchManager: false };
  }

  const userDept = (user.department || "").trim().toLowerCase();
  const userPosition = (user.position || "").trim().toLowerCase();
  const userBranch = (user.branch || "").trim().toLowerCase();
  const targetRole = roleResponsible.toLowerCase();
  const itemFactory = (item.factory || "").trim().toLowerCase();

  // 2. Ban Giám Đốc / Ban Quản Đốc / Ban Tổng Giám Đốc: Managerial rights within their branch or corporate
  const isManager = 
    userDept.includes("ban giám đốc") || 
    userDept.includes("ban quản đốc") || 
    userDept.includes("ban tổng giám đốc") || 
    userPosition.includes("giám đốc") || 
    userPosition.includes("tổng giám đốc") ||
    userPosition.includes("quản đốc");

  if (isManager) {
    const isCorp = userBranch.includes("cty") || userDept.includes("cty") || userBranch.includes("văn phòng công ty");
    const sameBranch = userBranch && itemFactory && (userBranch.includes(itemFactory) || itemFactory.includes(userBranch));
    if (isCorp || sameBranch) {
      return { allowed: true, roleName: user.position || user.department || "Ban Quản lý", isSuperAdmin: false, isBranchManager: true };
    }
  }

  // 3. Exact match
  if (userDept === targetRole) {
    return { allowed: true, roleName: user.department, isSuperAdmin: false, isBranchManager: false };
  }

  // Normalize by stripping codes (TPP-BNI), (TPP-LAN), (TPP-CTY), (DNP-BBM), etc.
  const stripBranchCode = (s: string) => s.replace(/\([^)]+\)/g, "").trim().toLowerCase();
  const cleanUserDept = stripBranchCode(userDept);
  const cleanTargetRole = stripBranchCode(targetRole);

  if (cleanUserDept && cleanTargetRole && cleanUserDept === cleanTargetRole) {
    return { allowed: true, roleName: user.department, isSuperAdmin: false, isBranchManager: false };
  }

  // Keyword-based department semantic groups
  const departmentKeywords = [
    { key: "kế hoạch", aliases: ["kế hoạch", "khsx", "kế hoạch sản xuất", "kế hoạch và dự báo", "kế hoạch vật tư", "p.kế hoạch", "phòng kế hoạch", "p.khsx"] },
    { key: "qlcl", aliases: ["quản lý chất lượng", "chất lượng", "qlcl", "qa", "qc", "p.qlcl", "kiểm tra chất lượng", "phòng quản lý chất lượng", "r&d/qa", "qa/qc", "qa/r&d"] },
    { key: "kỹ thuật", aliases: ["kỹ thuật", "ktcn", "thiết kế kỹ thuật", "kỹ thuật khuôn", "khuôn", "p.kỹ thuật", "phòng kỹ thuật", "p.ktcn"] },
    { key: "liệu", aliases: ["xay trộn", "tổ liệu", "tổ xay trộn", "phối trộn", "nguyên liệu", "trộn nl", "tổ phối trộn"] },
    { key: "kho", aliases: ["kho vận", "kho", "phòng kho", "vận chuyển", "lưu kho", "giao nhận", "tổ bốc xếp", "tổ lái xe"] },
    { key: "sản xuất", aliases: ["sản xuất", "xưởng", "phân xưởng", "dây chuyền", "gmp", "pet", "ép", "thổi", "in", "trưởng ca", "ca trưởng", "hoàn tất", "p.sản xuất"] },
    { key: "r&d", aliases: ["r&d", "nghiên cứu", "nghiên cứu và phát triển", "phát triển sản phẩm", "p.r&d"] },
    { key: "bảo trì", aliases: ["bảo trì", "cơ điện", "cơ khí", "tự động hóa", "p.bảo trì", "p.cơ điện"] },
    { key: "hcns", aliases: ["hành chính nhân sự", "hcns", "nhân sự", "p.hcns"] },
    { key: "tckt", aliases: ["tài chính kế toán", "tckt", "kế toán", "p.tckt"] }
  ];

  for (const group of departmentKeywords) {
    const roleMatchesGroup = group.aliases.some(a => cleanTargetRole.includes(a) || targetRole.includes(a));
    const userMatchesGroup = group.aliases.some(a => cleanUserDept.includes(a) || userDept.includes(a) || userPosition.includes(a));

    if (roleMatchesGroup && userMatchesGroup) {
      // Check branch consistency if both specify branches
      const roleBranchMatch = targetRole.match(/\(([^)]+)\)/);
      const userBranchMatch = userDept.match(/\(([^)]+)\)/);
      if (roleBranchMatch && userBranchMatch) {
        if (roleBranchMatch[1].toLowerCase() === userBranchMatch[1].toLowerCase()) {
          return { allowed: true, roleName: user.department, isSuperAdmin: false, isBranchManager: false };
        }
      } else {
        return { allowed: true, roleName: user.department, isSuperAdmin: false, isBranchManager: false };
      }
    }
  }

  // 4. Substring inclusion match
  if (cleanUserDept.length >= 4 && cleanTargetRole.includes(cleanUserDept)) {
    return { allowed: true, roleName: user.department, isSuperAdmin: false, isBranchManager: false };
  }
  if (cleanTargetRole.length >= 4 && cleanUserDept.includes(cleanTargetRole)) {
    return { allowed: true, roleName: user.department, isSuperAdmin: false, isBranchManager: false };
  }

  return { allowed: false, roleName: user.department || "", isSuperAdmin: false, isBranchManager: false };
};

/**
 * Smartly abbreviates department / workshop strings to fit compactly on 1 line and avoid awkward line breaks
 */
export const abbreviateDepartmentName = (text?: string, departmentsList?: Department[]): string => {
  if (!text) return "";
  const cleanText = text.trim();
  const cleanNoSuffix = cleanText.replace(/\s*\([^)]+\)$/, "").trim();

  // 1. Check passed departments list
  if (departmentsList && departmentsList.length > 0) {
    const found = departmentsList.find(d => 
      d.name === cleanText || 
      d.name.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase() === cleanNoSuffix.toLowerCase() ||
      d.name.toLowerCase() === cleanText.toLowerCase()
    );
    if (found && found.shortName) {
      return found.shortName;
    }
  }

  // 2. Check initialDepartments fallback
  const foundInit = initialDepartments.find(d => 
    d.name === cleanText || 
    d.name.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase() === cleanNoSuffix.toLowerCase() ||
    d.name.toLowerCase() === cleanText.toLowerCase()
  );
  if (foundInit && foundInit.shortName) {
    return foundInit.shortName;
  }

  // 3. Fallback to smart regex abbreviation
  let res = text;
  res = res.replace(/Phòng\s+Quản\s+[Ll][ýí]\s+Chất\s+Lượng/gi, "P.QLCL");
  res = res.replace(/Quản\s+[Ll][ýí]\s+Chất\s+Lượng/gi, "QLCL");
  res = res.replace(/Phòng\s+Quản\s+[Ll][ýí]/gi, "P.QL");
  res = res.replace(/Phòng\s+Kỹ\s+Thuật\s+Công\s+Nghệ/gi, "P.KTCN");
  res = res.replace(/Kỹ\s+Thuật\s+Công\s+Nghệ/gi, "KTCN");
  res = res.replace(/Phòng\s+Kỹ\s+Thuật/gi, "P.Kỹ Thuật");
  res = res.replace(/Kỹ\s+Thuật\s+Khuôn/gi, "KT Khuôn");
  res = res.replace(/Phòng\s+Kế\s+Hoạch\s+Sản\s+Xuất/gi, "P.KHSX");
  res = res.replace(/Kế\s+Hoạch\s+Sản\s+Xuất/gi, "KHSX");
  res = res.replace(/Phòng\s+Kế\s+Hoạch/gi, "P.Kế Hoạch");
  res = res.replace(/Phòng\s+Nghiên\s+Cứu\s*(&|và)\s*Phát\s+Triển/gi, "P.R&D");
  res = res.replace(/Nghiên\s+Cứu\s*(&|và)\s*Phát\s+Triển/gi, "R&D");
  res = res.replace(/Phòng\s+R&D/gi, "P.R&D");
  res = res.replace(/Phòng\s+Hành\s+Chính\s+Nhân\s+Sự/gi, "P.HCNS");
  res = res.replace(/Hành\s+Chính\s+Nhân\s+Sự/gi, "HCNS");
  res = res.replace(/Phòng\s+Cơ\s+Điện\s*(&|và)\s*Tự\s+Động\s+Hóa/gi, "P.Cơ Điện");
  res = res.replace(/Phòng\s+Cơ\s+Điện/gi, "P.Cơ Điện");
  res = res.replace(/Phòng\s+Bảo\s+Trì\s+Cơ\s+Điện/gi, "P.Bảo Trì");
  res = res.replace(/Phòng\s+Bảo\s+Trì/gi, "P.Bảo Trì");
  res = res.replace(/Phòng\s+Kinh\s+Doanh/gi, "P.Kinh Doanh");
  res = res.replace(/Phòng\s+Tài\s+Chính\s+Kế\s+Toán/gi, "P.TCKT");
  res = res.replace(/Tài\s+Chính\s+Kế\s+Toán/gi, "TCKT");
  res = res.replace(/Phòng\s+Kho\s+Vận/gi, "P.Kho Vận");
  res = res.replace(/Phòng\s+Kho/gi, "P.Kho");
  res = res.replace(/Kho\s+Vận/gi, "Kho Vận");
  res = res.replace(/Phòng\s+Sản\s+Xuất/gi, "P.Sản Xuất");
  res = res.replace(/Phòng\s+Dịch\s+Vụ\s+Khách\s+Hàng/gi, "P.DVKH");
  res = res.replace(/Phòng\s+An\s+Toàn\s+Môi\s+Trường/gi, "P.ATMT");
  res = res.replace(/Phòng\s+Xuất\s+Nhập\s+Khẩu/gi, "P.XNK");
  res = res.replace(/Phòng\s+Công\s+Nghệ\s+Thông\s+Tin/gi, "P.CNTT");
  res = res.replace(/Ban\s+Giám\s+Đốc/gi, "BGĐ");
  res = res.replace(/Ban\s+Quản\s+Đốc/gi, "BQĐ");
  res = res.replace(/Ban\s+Tổng\s+Giám\s+Đốc/gi, "BTGĐ");
  res = res.replace(/Sản\s+Xuất\s*\/\s*Trưởng\s+[Cc]a/gi, "SX / Trưởng ca");
  res = res.replace(/Phòng\s+/gi, "P.");
  res = res.replace(/Bộ\s+Phận\s+/gi, "BP.");
  res = res.replace(/Xưởng\s+Sản\s+Xuất/gi, "Xưởng SX");
  res = res.replace(/Chi\s+Nhánh\s+/gi, "CN.");
  return res;
};

interface TrialTrackingHubProps {
  currentUser: User | null;
  selectedCompany?: "TPP" | "DNP" | "ALL";
  onCompanyChange?: (company: "TPP" | "DNP" | "ALL") => void;
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;
  branches?: Branch[];
  departments?: Department[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  statusFilter?: "ALL" | "IN_PROGRESS" | "COMPLETED_PASS" | "COMPLETED_FAIL";
  onStatusFilterChange?: (status: "ALL" | "IN_PROGRESS" | "COMPLETED_PASS" | "COMPLETED_FAIL") => void;
  trialTypeFilter?: "ALL" | "B2B" | "B2C";
  onTrialTypeFilterChange?: (type: "ALL" | "B2B" | "B2C") => void;
  isCreateModalOpen?: boolean;
  onOpenCreateModalChange?: (isOpen: boolean) => void;
  isMobileView?: boolean;
  users?: User[];
  showToast?: (msg: string) => void;
}

export const TrialTrackingHub: React.FC<TrialTrackingHubProps> = ({
  currentUser,
  selectedCompany = "ALL",
  onCompanyChange,
  selectedBranch: externalSelectedBranch = "ALL",
  onBranchChange,
  branches = [],
  departments = [],
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
  statusFilter: externalStatusFilter,
  onStatusFilterChange,
  trialTypeFilter: externalTrialTypeFilter,
  onTrialTypeFilterChange,
  isCreateModalOpen: externalIsCreateModalOpen,
  onOpenCreateModalChange,
  isMobileView = false,
  users = [],
  showToast
}) => {
  const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.canSpeciallyEditDelete;

  // Master lists for branches & departments
  const availableBranches = useMemo(() => {
    return (branches && branches.length > 0) ? branches : initialBranches;
  }, [branches]);

  const availableDepartments = useMemo(() => {
    return (departments && departments.length > 0) ? departments : initialDepartments;
  }, [departments]);

  // Helper: Retrieve all BP/ĐV (departments) belonging to a specific branch
  const getDepartmentsForBranch = useCallback((branchNameOrId?: string): Department[] => {
    if (!branchNameOrId) return availableDepartments;
    const clean = branchNameOrId.trim();
    
    // 1. Exact or name match
    const targetBranch = availableBranches.find(b => 
      b.name === clean || 
      b.id === clean || 
      clean.includes(b.id) ||
      b.name.toLowerCase().includes(clean.toLowerCase()) ||
      clean.toLowerCase().includes(b.name.toLowerCase())
    );
    
    if (targetBranch) {
      const matched = availableDepartments.filter(d => d.branchId === targetBranch.id);
      if (matched.length > 0) return matched;
    }

    // 2. Extract code in parenthesis e.g. "(TPP-BNI)" or "(DNP-BBM)"
    const matchCode = clean.match(/\(([^)]+)\)/);
    const code = matchCode ? matchCode[1] : clean;
    const fallbackMatched = availableDepartments.filter(d => 
      d.branchId.includes(code) || 
      d.name.includes(code)
    );

    return fallbackMatched.length > 0 ? fallbackMatched : availableDepartments;
  }, [availableBranches, availableDepartments]);
  
  // Local state for items
  const [trialItems, setTrialItems] = useState<TrialTrackingItem[]>(() => {
    const saved = localStorage.getItem("tanphu_trial_trackings_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return filterTrialItemsWithin30Days(parsed, 30);
        }
      } catch (e) {}
    }
    return initialTrialTrackings;
  });

  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Auto-migrate & real-time synchronization with Firestore
  useEffect(() => {
    let isMounted = true;

    // 1. Migrate local items to Cloud if Firestore is empty or missing them
    autoMigrateLocalTrialsToCloud(trialItems).catch((err) => {
      console.warn("[TrialHub] Auto-migration to Firestore skipped:", err);
    });

    // 2. Real-time subscription to trial_trackings collection
    const unsubscribe = subscribeTrialsFromCloud((cloudItems) => {
      if (!isMounted) return;
      setIsCloudConnected(true);
      if (Array.isArray(cloudItems) && cloudItems.length > 0) {
        setTrialItems(cloudItems);
        try {
          const retained = filterTrialItemsWithin30Days(cloudItems, 30);
          localStorage.setItem("tanphu_trial_trackings_v1", JSON.stringify(retained));
        } catch (e) {}
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const [internalSelectedBranch, setInternalSelectedBranch] = useState("ALL");
  const selectedBranch = externalSelectedBranch !== undefined ? externalSelectedBranch : internalSelectedBranch;
  const setSelectedBranch = (b: string) => {
    setInternalSelectedBranch(b);
    if (onBranchChange) onBranchChange(b);
  };

  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = (q: string) => {
    setInternalSearchQuery(q);
    if (onSearchQueryChange) onSearchQueryChange(q);
  };

  const [internalStatusFilter, setInternalStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED_PASS" | "COMPLETED_FAIL">("ALL");
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setStatusFilter = (s: "ALL" | "IN_PROGRESS" | "COMPLETED_PASS" | "COMPLETED_FAIL") => {
    setInternalStatusFilter(s);
    if (onStatusFilterChange) onStatusFilterChange(s);
  };

  const [internalTrialTypeFilter, setInternalTrialTypeFilter] = useState<"ALL" | "B2B" | "B2C">("ALL");
  const trialTypeFilter = externalTrialTypeFilter !== undefined ? externalTrialTypeFilter : internalTrialTypeFilter;
  const setTrialTypeFilter = (t: "ALL" | "B2B" | "B2C") => {
    setInternalTrialTypeFilter(t);
    if (onTrialTypeFilterChange) onTrialTypeFilterChange(t);
  };

  const [activeStepModal, setActiveStepModal] = useState<{
    item: TrialTrackingItem;
    stepKey: TrialStepKey;
  } | null>(null);

  // Modal tùy chỉnh / thêm / xóa bước
  const [customizingItem, setCustomizingItem] = useState<TrialTrackingItem | null>(null);

  // Kéo thả sắp xếp bước (Drag & Drop Reordering for Mobile & Desktop)
  const [draggingStepKey, setDraggingStepKey] = useState<string | null>(null);
  const [dragOverStepKey, setDragOverStepKey] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const [stepNoteInput, setStepNoteInput] = useState("");
  const [stepResultStatusInput, setStepResultStatusInput] = useState<"PASS" | "CONDITIONAL" | "FAIL">("PASS");
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [stepImagesInput, setStepImagesInput] = useState<string[]>([]);
  const [isCompressingStepImages, setIsCompressingStepImages] = useState(false);

  // Modal tạo mới
  const [internalIsCreateModalOpen, setInternalIsCreateModalOpen] = useState(false);
  const isCreateModalOpen = externalIsCreateModalOpen !== undefined ? externalIsCreateModalOpen : internalIsCreateModalOpen;
  const setIsCreateModalOpen = (isOpen: boolean) => {
    setInternalIsCreateModalOpen(isOpen);
    if (onOpenCreateModalChange) onOpenCreateModalChange(isOpen);
  };
  const [newTitle, setNewTitle] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newTrialType, setNewTrialType] = useState<"B2B" | "B2C">("B2B");
  const [newCategory, setNewCategory] = useState<Category4M1E1I>("NGUYÊN VẬT LIỆU");
  const [newCompany, setNewCompany] = useState<"TPP" | "DNP">(
    currentUser?.company === "DNP" ? "DNP" : "TPP"
  );
  const [newFactory, setNewFactory] = useState(currentUser?.branch || "Chi Nhánh Bắc Ninh (TPP-BNI)");
  const [newWorkshop, setNewWorkshop] = useState("Xưởng Pet (TPP-BNI)");
  const [newMachineDetail, setNewMachineDetail] = useState("");
  const [customWorkshopInput, setCustomWorkshopInput] = useState("");
  const [newReqDocNo, setNewReqDocNo] = useState("");
  const [newSampleQty, setNewSampleQty] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [isCompressingNewImages, setIsCompressingNewImages] = useState(false);
  const [clonedFromTrial, setClonedFromTrial] = useState<TrialTrackingItem | null>(null);

  // Lightbox Modal state
  const [lightboxImages, setLightboxImages] = useState<{ urls: string[]; index: number; title: string } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Sync initial department when factory changes or opens
  useEffect(() => {
    const depts = getDepartmentsForBranch(newFactory);
    if (depts.length > 0) {
      // Find a production or QC workshop by default, or the first department
      const prodOrQc = depts.find(d => /xưởng|sản xuất|chất lượng|kỹ thuật/i.test(d.name)) || depts[0];
      setNewWorkshop(prodOrQc.name);
    }
  }, [newFactory, getDepartmentsForBranch]);

  // Directives & Comments & Action Modals State
  const [directivesInputMap, setDirectivesInputMap] = useState<Record<string, string>>({});
  const [expandedDirectiveIds, setExpandedDirectiveIds] = useState<Record<string, boolean>>({});
  const [showAckDetails, setShowAckDetails] = useState<Record<string, boolean>>({});
  const [editingDirectiveId, setEditingDirectiveId] = useState<string | null>(null);
  const [editingDirectiveText, setEditingDirectiveText] = useState("");
  
  const [commentModalItem, setCommentModalItem] = useState<TrialTrackingItem | null>(null);
  const [commentInputText, setCommentInputText] = useState("");
  const [likesListModalItem, setLikesListModalItem] = useState<TrialTrackingItem | null>(null);
  const [badgeModalItem, setBadgeModalItem] = useState<TrialTrackingItem | null>(null);
  const [editTrialModalItem, setEditTrialModalItem] = useState<TrialTrackingItem | null>(null);
  const [isCompressingEditImages, setIsCompressingEditImages] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TrialTrackingItem | null>(null);
  const [conclusionModalItem, setConclusionModalItem] = useState<TrialTrackingItem | null>(null);
  const [conclusionStatusInput, setConclusionStatusInput] = useState<"PASS" | "CONDITIONAL" | "FAIL">("PASS");
  const [conclusionTextInput, setConclusionTextInput] = useState("");

  const handleOpenConclusionModal = (item: TrialTrackingItem) => {
    setConclusionModalItem(item);
    let defaultStatus: "PASS" | "CONDITIONAL" | "FAIL" = "PASS";
    if (item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion || "")) {
      defaultStatus = "FAIL";
    } else if (/TẠM CHẤP NHẬN/i.test(item.finalConclusion || "")) {
      defaultStatus = "CONDITIONAL";
    } else {
      defaultStatus = "PASS";
    }
    setConclusionStatusInput(defaultStatus);
    
    if (item.finalConclusion && item.finalConclusion.trim()) {
      setConclusionTextInput(item.finalConclusion);
    } else {
      if (defaultStatus === "FAIL") {
        setConclusionTextInput("KẾT QUẢ KHÔNG ĐẠT TIÊU CHUẨN KỸ THUẬT. Cần hiệu chỉnh nguyên nhân và tiến hành thử nghiệm lại.");
      } else if (defaultStatus === "CONDITIONAL") {
        setConclusionTextInput("KẾT QUẢ TẠM CHẤP NHẬN. Cho phép sản xuất theo dõi với số lượng giới hạn và kiểm soát chặt chẽ chất lượng.");
      } else {
        setConclusionTextInput("KẾT QUẢ ĐẠT TIÊU CHUẨN KỸ THUẬT. Đủ điều kiện đưa vào sản xuất hàng loạt.");
      }
    }
  };

  const handleSelectConclusionStatus = (status: "PASS" | "CONDITIONAL" | "FAIL") => {
    setConclusionStatusInput(status);
    const passTpl = "KẾT QUẢ ĐẠT TIÊU CHUẨN KỸ THUẬT. Đủ điều kiện đưa vào sản xuất hàng loạt.";
    const condTpl = "KẾT QUẢ TẠM CHẤP NHẬN. Cho phép sản xuất theo dõi với số lượng giới hạn và kiểm soát chặt chẽ chất lượng.";
    const failTpl = "KẾT QUẢ KHÔNG ĐẠT TIÊU CHUẨN KỸ THUẬT. Cần hiệu chỉnh nguyên nhân và tiến hành thử nghiệm lại.";
    
    if (!conclusionTextInput.trim() || conclusionTextInput === passTpl || conclusionTextInput === condTpl || conclusionTextInput === failTpl) {
      if (status === "PASS") setConclusionTextInput(passTpl);
      else if (status === "CONDITIONAL") setConclusionTextInput(condTpl);
      else if (status === "FAIL") setConclusionTextInput(failTpl);
    }
  };

  const handleSaveConclusion = () => {
    if (!conclusionModalItem) return;
    const dateStr = formatDateTimeDDMMYY(new Date());
    
    let nextOverallStatus: "COMPLETED_PASS" | "COMPLETED_FAIL" = "COMPLETED_PASS";
    if (conclusionStatusInput === "FAIL") {
      nextOverallStatus = "COMPLETED_FAIL";
    } else {
      nextOverallStatus = "COMPLETED_PASS";
    }

    const updatedItems = trialItems.map((item) => {
      if (item.id === conclusionModalItem.id) {
        return {
          ...item,
          finalConclusion: conclusionTextInput.trim(),
          overallStatus: nextOverallStatus,
          updatedAt: dateStr,
        };
      }
      return item;
    });

    saveItems(updatedItems);
    setConclusionModalItem(null);
  };

  // Time format helper strictly obeying dd/mm/yy
  const formatDateTimeDDMMYY = (d: Date = new Date()) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  // Helper: Process multiple image files with WebP compression (Max 2)
  const processImageFiles = async (files: File[] | FileList, currentList: string[]): Promise<string[]> => {
    if (currentList.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh (Đã đạt giới hạn)!");
      return [];
    }
    const remainingSlots = 2 - currentList.length;
    const filesToProcess = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, remainingSlots);
    if (filesToProcess.length === 0) return [];

    const compressedResults: string[] = [];
    for (const file of filesToProcess) {
      const compressedBase64 = await processTrialImageFile(file);
      if (compressedBase64) {
        compressedResults.push(compressedBase64);
      }
    }
    return compressedResults;
  };

  // Helper: Extract images from ClipboardEvent (Ctrl + V)
  const extractImagesFromClipboard = (e: React.ClipboardEvent | ClipboardEvent): File[] => {
    const items = e.clipboardData?.items;
    if (!items) return [];
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    return imageFiles;
  };

  // Handle uploading and compressing images for active step modal (Max 2 images, 80KB-120KB WebP)
  const handleStepImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (stepImagesInput.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh cho mỗi công đoạn thử nghiệm!");
      return;
    }

    setIsCompressingStepImages(true);
    try {
      const compressedResults = await processImageFiles(files, stepImagesInput);
      if (compressedResults.length > 0) {
        setStepImagesInput(prev => [...prev, ...compressedResults].slice(0, 2));
        if (showToast) showToast(`✓ Đã đính kèm ${compressedResults.length} hình ảnh (chuẩn nén WebP 80KB - 120KB)`);
      }
    } catch (err) {
      console.error("Lỗi nén ảnh công đoạn:", err);
      if (showToast) showToast("Không thể xử lý ảnh. Vui lòng thử lại với định dạng JPEG/PNG/WebP!");
    } finally {
      setIsCompressingStepImages(false);
      e.target.value = "";
    }
  };

  // Handle Paste (Ctrl + V) for Step Modal
  const handleStepPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedFiles = extractImagesFromClipboard(e);
    if (pastedFiles.length === 0) return;

    // Prevent default paste if images are detected
    e.preventDefault();
    if (stepImagesInput.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh cho mỗi công đoạn thử nghiệm!");
      return;
    }

    setIsCompressingStepImages(true);
    try {
      const compressedResults = await processImageFiles(pastedFiles, stepImagesInput);
      if (compressedResults.length > 0) {
        setStepImagesInput(prev => [...prev, ...compressedResults].slice(0, 2));
        if (showToast) showToast(`✓ Đã dán (Ctrl+V) thành công ${compressedResults.length} hình ảnh!`);
      }
    } catch (err) {
      console.error("Lỗi dán ảnh:", err);
      if (showToast) showToast("Không thể dán ảnh. Vui lòng thử lại!");
    } finally {
      setIsCompressingStepImages(false);
    }
  };

  // Handle uploading and compressing images for Create Trial modal (Max 2 images, 80KB-120KB WebP)
  const handleNewTrialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (newImages.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh cho đợt thử nghiệm!");
      return;
    }

    setIsCompressingNewImages(true);
    try {
      const compressedResults = await processImageFiles(files, newImages);
      if (compressedResults.length > 0) {
        setNewImages(prev => [...prev, ...compressedResults].slice(0, 2));
        if (showToast) showToast(`✓ Đã đính kèm ${compressedResults.length} hình ảnh (chuẩn nén WebP 80KB - 120KB)`);
      }
    } catch (err) {
      console.error("Lỗi nén ảnh đợt thử nghiệm:", err);
      if (showToast) showToast("Không thể xử lý ảnh. Vui lòng thử lại với định dạng JPEG/PNG/WebP!");
    } finally {
      setIsCompressingNewImages(false);
      e.target.value = "";
    }
  };

  // Handle Paste (Ctrl + V) for Create Trial Modal
  const handleNewTrialPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pastedFiles = extractImagesFromClipboard(e);
    if (pastedFiles.length === 0) return;

    e.preventDefault();
    if (newImages.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh cho đợt thử nghiệm!");
      return;
    }

    setIsCompressingNewImages(true);
    try {
      const compressedResults = await processImageFiles(pastedFiles, newImages);
      if (compressedResults.length > 0) {
        setNewImages(prev => [...prev, ...compressedResults].slice(0, 2));
        if (showToast) showToast(`✓ Đã dán (Ctrl+V) thành công ${compressedResults.length} hình ảnh!`);
      }
    } catch (err) {
      console.error("Lỗi dán ảnh đợt thử nghiệm:", err);
      if (showToast) showToast("Không thể dán ảnh. Vui lòng thử lại!");
    } finally {
      setIsCompressingNewImages(false);
    }
  };

  // Handle uploading and compressing images for Edit Trial modal (Max 2 images, 80KB-120KB WebP)
  const handleEditTrialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editTrialModalItem) return;
    
    const currentImgs = editTrialModalItem.images || [];
    if (currentImgs.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh cho đợt thử nghiệm!");
      return;
    }

    setIsCompressingEditImages(true);
    try {
      const compressedResults = await processImageFiles(files, currentImgs);
      if (compressedResults.length > 0) {
        const updatedImages = [...currentImgs, ...compressedResults].slice(0, 2);
        setEditTrialModalItem({
          ...editTrialModalItem,
          images: updatedImages,
          imageUrl: updatedImages[0] || ""
        });
        if (showToast) showToast(`✓ Đã đính kèm ${compressedResults.length} hình ảnh (chuẩn nén WebP 80KB - 120KB)`);
      }
    } catch (err) {
      console.error("Lỗi nén ảnh sửa đợt thử nghiệm:", err);
      if (showToast) showToast("Không thể xử lý ảnh. Vui lòng thử lại!");
    } finally {
      setIsCompressingEditImages(false);
      e.target.value = "";
    }
  };

  // Handle Paste (Ctrl + V) for Edit Trial Modal
  const handleEditTrialPaste = async (e: React.ClipboardEvent<HTMLElement>) => {
    const pastedFiles = extractImagesFromClipboard(e);
    if (pastedFiles.length === 0 || !editTrialModalItem) return;

    e.preventDefault();
    const currentImgs = editTrialModalItem.images || [];
    if (currentImgs.length >= 2) {
      if (showToast) showToast("Tối đa 2 hình ảnh cho đợt thử nghiệm!");
      return;
    }

    setIsCompressingEditImages(true);
    try {
      const compressedResults = await processImageFiles(pastedFiles, currentImgs);
      if (compressedResults.length > 0) {
        const updatedImages = [...currentImgs, ...compressedResults].slice(0, 2);
        setEditTrialModalItem({
          ...editTrialModalItem,
          images: updatedImages,
          imageUrl: updatedImages[0] || ""
        });
        if (showToast) showToast(`✓ Đã dán (Ctrl+V) thành công ${compressedResults.length} hình ảnh!`);
      }
    } catch (err) {
      console.error("Lỗi dán ảnh sửa đợt thử nghiệm:", err);
      if (showToast) showToast("Không thể dán ảnh. Vui lòng thử lại!");
    } finally {
      setIsCompressingEditImages(false);
    }
  };

  const capitalizeWords = (str?: string) => {
    if (!str) return "";
    return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const renderTaggedText = (text?: string) => {
    if (!text) return "";
    if (!text.includes("@")) return <span translate="no" className="notranslate">{text}</span>;
    
    const tokens = text.split(/(@[a-zA-Z0-9_À-ỹ. -]+)/g);
    return (
      <span translate="no" className="notranslate">
        {tokens.map((token, i) => {
          if (token.startsWith("@")) {
            return (
              <span key={i} className="font-bold text-blue-600 bg-blue-50/80 px-1 py-0.5 rounded mx-0.5">
                {token}
              </span>
            );
          }
          return token;
        })}
      </span>
    );
  };

  const isDocStep = (stepKey: string, stepName?: string) => {
    return stepKey === "step1_request" || stepKey === "step2_plan" || /đn|đề nghị|lsx|lệnh sản xuất|kế hoạch/i.test(stepName || "");
  };

  const renderStepResultTag = (stepKey: string, stepName: string, resultStatus?: "PASS" | "CONDITIONAL" | "FAIL" | "PENDING") => {
    const isDoc = isDocStep(stepKey, stepName);
    if (resultStatus === "FAIL") {
      return (
        <div className="mt-1 flex items-center">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            <span translate="no" className="notranslate">
              {isDoc ? <T>TỪ CHỐI/HỦY</T> : <T>KHÔNG ĐẠT</T>}
            </span>
          </span>
        </div>
      );
    }
    if (resultStatus === "CONDITIONAL") {
      return (
        <div className="mt-1 flex items-center">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span translate="no" className="notranslate">
              {isDoc ? <T>ĐIỀU CHỈNH</T> : <T>TẠM CHẤP NHẬN</T>}
            </span>
          </span>
        </div>
      );
    }
    // Mặc định khi hoàn thành là ĐẠT hoặc ĐÃ DUYỆT
    return (
      <div className="mt-1 flex items-center">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span translate="no" className="notranslate">
            {isDoc ? <T>ĐÃ DUYỆT</T> : <T>ĐẠT</T>}
          </span>
        </span>
      </div>
    );
  };

  // Save to local storage with 30-day retention pruning and sync to Cloud
  const saveItems = (updated: TrialTrackingItem[], modifiedItem?: TrialTrackingItem) => {
    setTrialItems(updated);
    try {
      const retained = filterTrialItemsWithin30Days(updated, 30);
      localStorage.setItem("tanphu_trial_trackings_v1", JSON.stringify(retained));
    } catch (e) {}

    // Cloud synchronization
    if (modifiedItem) {
      setIsSyncingCloud(true);
      saveTrialToCloud(modifiedItem)
        .then(() => setIsCloudConnected(true))
        .catch(() => setIsCloudConnected(false))
        .finally(() => setIsSyncingCloud(false));
    } else {
      setIsSyncingCloud(true);
      Promise.all(updated.map((item) => saveTrialToCloud(item)))
        .then(() => setIsCloudConnected(true))
        .catch(() => setIsCloudConnected(false))
        .finally(() => setIsSyncingCloud(false));
    }
  };

  // Enforce company security: Non-admin can only see their company
  const effectiveCompany = getEffectiveCompanyScope(currentUser, selectedCompany, branches);

  // Filtered trial items
  const filteredItems = useMemo(() => {
    return trialItems.filter((item) => {
      // 1. Company Scope Filter (Security Enforcement)
      if (!isTrialInScope(item, effectiveCompany, branches)) {
        return false;
      }
      // 2. Branch Filter
      if (selectedBranch !== "ALL" && item.factory !== selectedBranch) {
        return false;
      }
      // 2.5. Phân hệ Thử nghiệm (TN-B2B vs TN-B2C)
      if (trialTypeFilter !== "ALL") {
        const itemType = item.trialType || "B2B";
        if (itemType !== trialTypeFilter) {
          return false;
        }
      }
      // 3. Status Filter
      if (statusFilter !== "ALL" && item.overallStatus !== statusFilter) {
        return false;
      }
      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchFactory = item.factory.toLowerCase().includes(q);
        const matchWorkshop = (item.workshop || "").toLowerCase().includes(q);
        const matchAuthor = item.createdByName.toLowerCase().includes(q);
        if (!matchCode && !matchTitle && !matchProduct && !matchFactory && !matchWorkshop && !matchAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [trialItems, effectiveCompany, branches, selectedBranch, trialTypeFilter, statusFilter, searchQuery]);

  // Counts by trial type within active company & branch scope
  const b2bCount = useMemo(() => {
    return trialItems.filter((item) => {
      if (!isTrialInScope(item, effectiveCompany, branches)) return false;
      if (selectedBranch !== "ALL" && item.factory !== selectedBranch) return false;
      return (item.trialType || "B2B") === "B2B";
    }).length;
  }, [trialItems, effectiveCompany, branches, selectedBranch]);

  const b2cCount = useMemo(() => {
    return trialItems.filter((item) => {
      if (!isTrialInScope(item, effectiveCompany, branches)) return false;
      if (selectedBranch !== "ALL" && item.factory !== selectedBranch) return false;
      return item.trialType === "B2C";
    }).length;
  }, [trialItems, effectiveCompany, branches, selectedBranch]);

  // Reorder steps when dragged and dropped
  const handleReorderSteps = (itemId: string, sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;
    const targetItem = trialItems.find((t) => t.id === itemId);
    if (!targetItem) return;

    const currentOrder = getItemStepList(targetItem).map((s) => s.key);
    const sourceIdx = currentOrder.indexOf(sourceKey);
    const targetIdx = currentOrder.indexOf(targetKey);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const newOrder = [...currentOrder];
    const [movedKey] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, movedKey);

    const updated = trialItems.map((curr) => {
      if (curr.id !== itemId) return curr;
      return {
        ...curr,
        customStepOrder: newOrder,
        updatedAt: new Date().toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit"
        }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
    });

    saveItems(updated);
  };

  // Helper to extract ordered steps for a trial item
  const getItemStepList = (item: TrialTrackingItem): { key: string; label: string; number: string; role: string; isCompleted: boolean; stepData: TrialStepDetail }[] => {
    let keys: string[] = [];
    if (item.customStepOrder && item.customStepOrder.length > 0) {
      keys = item.customStepOrder.filter((k) => !!item.steps[k]);
    } else {
      const defaultOrder = ["step1_request", "step2_plan", "step3a_material", "step3b_mold", "step4_trial", "step5_evaluation"];
      defaultOrder.forEach((k) => {
        if (item.steps[k]) keys.push(k);
      });
      Object.keys(item.steps).forEach((k) => {
        if (!defaultOrder.includes(k) && item.steps[k]) keys.push(k);
      });
    }

    return keys.map((k) => {
      const detail = item.steps[k];
      return {
        key: k,
        label: detail?.name || k,
        number: detail?.stepNumber || "",
        role: detail?.roleResponsible || "QA/QC",
        isCompleted: !!detail?.isCompleted,
        stepData: detail
      };
    });
  };

  // Helper to open step modal and initialize inputs including images
  const handleOpenStepModal = (item: TrialTrackingItem, stepKey: TrialStepKey) => {
    const stepData = item.steps[stepKey];
    setActiveStepModal({ item, stepKey });
    setStepNoteInput(stepData?.notes || "");
    
    // Check if this is Step 1 (ĐN thử nghiệm) or Step 2 (LSX thử) or other steps with custom code
    const isStep1 = stepKey === "step1_request" || stepData?.stepNumber === "1" || /đn|đề nghị/i.test(stepData?.name || "");
    const isStep2 = stepKey === "step2_plan" || stepData?.stepNumber === "2" || /lsx|lệnh/i.test(stepData?.name || "");
    
    if (isStep1) {
      setCustomCodeInput(stepData?.customCode || item.requestDocNo || "");
    } else if (isStep2) {
      setCustomCodeInput(stepData?.customCode || item.planDocNo || "");
    } else {
      setCustomCodeInput(stepData?.customCode || "");
    }

    setStepImagesInput(stepData?.images ? [...stepData.images] : []);
    if (stepData?.resultStatus) {
      setStepResultStatusInput(
        stepData.resultStatus === "FAIL"
          ? "FAIL"
          : stepData.resultStatus === "CONDITIONAL"
          ? "CONDITIONAL"
          : "PASS"
      );
    } else {
      setStepResultStatusInput("PASS");
    }
  };

  // Handle Step Confirmation
  const handleConfirmStep = (item: TrialTrackingItem, stepKey: TrialStepKey) => {
    const targetStep = item.steps[stepKey];
    const perm = checkUserStepPermission(currentUser, item, stepKey, targetStep);

    if (!perm.allowed) {
      if (showToast) {
        showToast(`🔒 Bạn không có quyền xác nhận! Công đoạn này do "${targetStep?.roleResponsible || 'BP chuyên trách'}" phụ trách.`);
      }
      return;
    }

    const isStep1 = stepKey === "step1_request" || targetStep?.stepNumber === "1" || /đn|đề nghị/i.test(targetStep?.name || "");
    const isStep2 = stepKey === "step2_plan" || targetStep?.stepNumber === "2" || /lsx|lệnh/i.test(targetStep?.name || "");

    const updated = trialItems.map((curr) => {
      if (curr.id !== item.id) return curr;

      const dateStr = new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit"
      }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

      const updatedSteps = { ...curr.steps };
      const currentTargetStep = { ...updatedSteps[stepKey] };

      currentTargetStep.isCompleted = true;
      currentTargetStep.completedAt = dateStr;
      currentTargetStep.completedBy = currentUser?.fullName || "Quản lý Hiện trường";
      currentTargetStep.completedByRole = currentUser?.position || currentUser?.department || "Bộ phận thực hiện";
      currentTargetStep.completedByPhone = currentUser?.phone || "";
      if (stepNoteInput.trim()) {
        currentTargetStep.notes = stepNoteInput.trim();
      }

      let updatedReqDocNo = curr.requestDocNo;
      let updatedPlanDocNo = curr.planDocNo;

      if (customCodeInput.trim()) {
        currentTargetStep.customCode = customCodeInput.trim();
        if (isStep1) {
          updatedReqDocNo = customCodeInput.trim();
        } else if (isStep2) {
          updatedPlanDocNo = customCodeInput.trim();
        }
      }

      // Lưu danh sách hình ảnh công đoạn (Tối đa 2 ảnh, đã nén WebP)
      currentTargetStep.images = stepImagesInput && stepImagesInput.length > 0 ? stepImagesInput : undefined;

      // Lưu kết quả đánh giá công đoạn
      currentTargetStep.resultStatus = stepResultStatusInput;

      // Check if this is the evaluation/last step
      const stepItems = getItemStepList(curr);
      const isLastStep = stepItems.length > 0 && stepItems[stepItems.length - 1].key === stepKey;
      const isEvalStep = stepKey === "step5_evaluation" || currentTargetStep.isEvaluationStep || isLastStep;

      updatedSteps[stepKey] = currentTargetStep;

      // Determine next step key
      const currentIdx = stepItems.findIndex((s) => s.key === stepKey);
      let nextStepKey = curr.currentStepKey;
      if (currentIdx !== -1 && currentIdx < stepItems.length - 1) {
        nextStepKey = stepItems[currentIdx + 1].key;
      }

      // Determine next overall status
      let nextOverallStatus = curr.overallStatus;
      let conclusion = curr.finalConclusion;

      if (isEvalStep) {
        if (stepResultStatusInput === "PASS") {
          nextOverallStatus = "COMPLETED_PASS";
          conclusion = `KẾT QUẢ ĐẠT TIÊU CHUẨN (${dateStr} bởi ${currentUser?.fullName || "QA"}). Đủ điều kiện phê duyệt.`;
        } else if (stepResultStatusInput === "FAIL") {
          nextOverallStatus = "COMPLETED_FAIL";
          conclusion = `KẾT QUẢ KHÔNG ĐẠT (${dateStr} bởi ${currentUser?.fullName || "QA"}). Cần hiệu chỉnh nguyên nhân.`;
        } else {
          nextOverallStatus = "COMPLETED_PASS";
          conclusion = `KẾT QUẢ TẠM CHẤP NHẬN (${dateStr} bởi ${currentUser?.fullName || "QA"}). Cho phép tiếp tục theo dõi chất lượng.`;
        }
      } else {
        // If all steps completed
        const allDone = stepItems.every((s) => s.key === stepKey ? true : updatedSteps[s.key]?.isCompleted);
        if (allDone) {
          nextOverallStatus = "COMPLETED_PASS";
        }
      }

      return {
        ...curr,
        requestDocNo: updatedReqDocNo,
        planDocNo: updatedPlanDocNo,
        steps: updatedSteps,
        currentStepKey: nextStepKey,
        overallStatus: nextOverallStatus,
        finalConclusion: conclusion,
        updatedAt: dateStr
      };
    });

    saveItems(updated);
    setActiveStepModal(null);
    setStepNoteInput("");
    setCustomCodeInput("");
    setStepImagesInput([]);
    if (showToast) {
      showToast(`✓ Đã xác nhận công đoạn "${targetStep?.name}" thành công!`);
    }
  };

  // Handle Revert Step (Hoàn tác)
  const handleRevertStep = (item: TrialTrackingItem, stepKey: TrialStepKey) => {
    const targetStep = item.steps[stepKey];
    const perm = checkUserStepPermission(currentUser, item, stepKey, targetStep);
    const isOriginalCompleter = targetStep?.completedBy === currentUser?.fullName;

    if (!perm.allowed && !isOriginalCompleter) {
      if (showToast) {
        showToast(`🔒 Bạn không có quyền hoàn tác! Chỉ nhân sự thuộc "${targetStep?.roleResponsible || 'BP phụ trách'}" hoặc Admin mới có quyền.`);
      }
      return;
    }

    const updated = trialItems.map((curr) => {
      if (curr.id !== item.id) return curr;

      const updatedSteps = { ...curr.steps };
      updatedSteps[stepKey] = {
        ...updatedSteps[stepKey],
        isCompleted: false,
        completedAt: undefined,
        completedBy: undefined,
        resultStatus: "PENDING"
      };

      return {
        ...curr,
        steps: updatedSteps,
        currentStepKey: stepKey,
        overallStatus: "IN_PROGRESS" as const,
        updatedAt: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" })
      };
    });

    saveItems(updated);
    setActiveStepModal(null);
    setStepImagesInput([]);
    if (showToast) {
      showToast(`Đã hoàn tác trạng thái công đoạn "${targetStep?.name}"!`);
    }
  };

  // Directives Handlers
  const handleSendDirective = (itemId: string) => {
    const text = (directivesInputMap[itemId] || "").trim();
    if (!text) return;

    const authorSignature = `${currentUser?.position || currentUser?.department || "Quản lý"} - ${currentUser?.fullName || "Lãnh đạo"}`;
    const newDirective: QualityReportDirective = {
      id: `dir-tn-${Date.now()}`,
      text: text,
      author: authorSignature,
      timestamp: formatDateTimeDDMMYY(),
      isAcknowledged: false,
      acknowledges: []
    };

    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      const prevDirs = item.directives || [];
      return {
        ...item,
        directives: [newDirective, ...prevDirs],
        updatedAt: formatDateTimeDDMMYY()
      };
    });

    saveItems(updated);
    setDirectivesInputMap(prev => ({ ...prev, [itemId]: "" }));
    setExpandedDirectiveIds(prev => ({ ...prev, [newDirective.id]: true }));
    if (showToast) showToast("Đã gửi chỉ đạo điều hành thành công!");
  };

  const handleToggleAcknowledgeDirective = (itemId: string, directiveId: string) => {
    const userSignature = `${currentUser?.department || "Bộ phận"} - ${currentUser?.fullName || "Người nhận"}`;
    const dateStr = formatDateTimeDDMMYY();

    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      const updatedDirs = (item.directives || []).map((dir) => {
        if (dir.id !== directiveId) return dir;
        const prevAcks = dir.acknowledges ? [...dir.acknowledges] : [];
        const existingIdx = prevAcks.findIndex(a => a.by === userSignature);
        let nextAcks = [...prevAcks];

        if (existingIdx !== -1) {
          nextAcks.splice(existingIdx, 1);
        } else {
          nextAcks.push({ by: userSignature, at: dateStr });
        }

        return {
          ...dir,
          isAcknowledged: nextAcks.length > 0,
          acknowledgedBy: nextAcks.length > 0 ? nextAcks[nextAcks.length - 1].by : undefined,
          acknowledgedAt: nextAcks.length > 0 ? nextAcks[nextAcks.length - 1].at : undefined,
          acknowledges: nextAcks
        };
      });

      return {
        ...item,
        directives: updatedDirs,
        updatedAt: dateStr
      };
    });

    saveItems(updated);
    if (showToast) showToast("Đã cập nhật trạng thái tiếp nhận!");
  };

  const handleSaveEditDirective = (itemId: string, directiveId: string, newText: string) => {
    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      const updatedDirs = (item.directives || []).map((dir) => {
        if (dir.id !== directiveId) return dir;
        return {
          ...dir,
          text: newText
        };
      });
      return {
        ...item,
        directives: updatedDirs,
        updatedAt: formatDateTimeDDMMYY()
      };
    });

    saveItems(updated);
    setEditingDirectiveId(null);
    setEditingDirectiveText("");
    if (showToast) showToast("Đã lưu chỉnh sửa chỉ đạo!");
  };

  const handleDeleteDirective = (itemId: string, directiveId: string) => {
    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        directives: (item.directives || []).filter(d => d.id !== directiveId),
        updatedAt: formatDateTimeDDMMYY()
      };
    });

    saveItems(updated);
    if (showToast) showToast("Đã xóa chỉ đạo!");
  };

  // Like Trial
  const handleToggleLikeTrial = (itemId: string) => {
    const userName = currentUser?.fullName || "Ẩn danh";
    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      const prevLikes = item.likedBy || [];
      const hasLiked = prevLikes.includes(userName);
      const nextLikes = hasLiked ? prevLikes.filter(u => u !== userName) : [...prevLikes, userName];
      return {
        ...item,
        likedBy: nextLikes
      };
    });
    saveItems(updated);
  };

  // Comment on Trial
  const handleSendComment = (itemId: string) => {
    if (!commentInputText.trim()) return;
    const authorName = currentUser?.fullName || "Ẩn danh";
    const authorRole = currentUser?.position || currentUser?.department || "Thành viên";
    const newComment = {
      id: `c-tn-${Date.now()}`,
      author: authorName,
      role: authorRole,
      text: commentInputText.trim(),
      timestamp: formatDateTimeDDMMYY()
    };

    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      const prevComments = item.comments || [];
      const nextComments = [...prevComments, newComment];
      return {
        ...item,
        comments: nextComments,
        commentsCount: nextComments.length,
        updatedAt: formatDateTimeDDMMYY()
      };
    });

    saveItems(updated);
    setCommentInputText("");
    if (commentModalItem && commentModalItem.id === itemId) {
      const updatedCurr = updated.find(i => i.id === itemId) || null;
      setCommentModalItem(updatedCurr);
    }
    if (showToast) showToast("Đã gửi bình luận!");
  };

  // Award Badge
  const handleAwardBadge = (itemId: string, badgeDef: any) => {
    const newBadge: QualityReportBadge = {
      id: badgeDef.id,
      name: badgeDef.name,
      category: badgeDef.category || "GREEN",
      giverId: currentUser?.id || "unknown",
      giverName: currentUser?.fullName || "Quản lý",
      giverRole: currentUser?.role || UserRole.STAFF,
      giverPosition: currentUser?.position || currentUser?.department,
      timestamp: formatDateTimeDDMMYY()
    };

    const updated = trialItems.map((item) => {
      if (item.id !== itemId) return item;
      const prevBadges = item.badges || [];
      return {
        ...item,
        badges: [...prevBadges, newBadge],
        updatedAt: formatDateTimeDDMMYY()
      };
    });

    saveItems(updated);
    if (badgeModalItem && badgeModalItem.id === itemId) {
      const updatedCurr = updated.find(i => i.id === itemId) || null;
      setBadgeModalItem(updatedCurr);
    }
    if (showToast) showToast(`Đã trao huy hiệu "${badgeDef.name}"!`);
  };

  // Edit Trial
  const handleSaveEditTrial = (updatedItem: TrialTrackingItem) => {
    const updated = trialItems.map((item) => {
      if (item.id !== updatedItem.id) return item;

      // Đồng bộ Số ĐN và Số LSX vào các bước tương ứng trong steps
      const syncedSteps = { ...(updatedItem.steps || item.steps || {}) };
      const reqDoc = updatedItem.requestDocNo?.trim();
      const planDoc = updatedItem.planDocNo?.trim();

      Object.keys(syncedSteps).forEach((k) => {
        const s = syncedSteps[k];
        if (!s) return;
        if (k === "step1_request" || s.stepNumber === "1" || /đn|đề nghị/i.test(s.name || "")) {
          syncedSteps[k] = { ...s, customCode: reqDoc || s.customCode };
        }
        if (planDoc && (k === "step2_plan" || s.stepNumber === "2" || /lsx|lệnh/i.test(s.name || ""))) {
          syncedSteps[k] = { ...s, customCode: planDoc || s.customCode };
        }
      });

      return {
        ...updatedItem,
        steps: syncedSteps,
        updatedAt: formatDateTimeDDMMYY()
      };
    });

    saveItems(updated);
    setEditTrialModalItem(null);
    if (showToast) showToast("Đã cập nhật thông tin đợt thử nghiệm!");
  };

  // Delete Trial
  const handleConfirmDeleteTrial = (itemId: string) => {
    const updated = trialItems.filter(i => i.id !== itemId);
    setTrialItems(updated);
    try {
      const retained = filterTrialItemsWithin30Days(updated, 30);
      localStorage.setItem("tanphu_trial_trackings_v1", JSON.stringify(retained));
    } catch (e) {}

    deleteTrialFromCloud(itemId).catch((err) => {
      console.warn("[Cloud Delete] Lỗi xóa bản tin thử nghiệm:", err);
    });

    setDeleteConfirmItem(null);
    if (showToast) showToast("Đã xóa đợt thử nghiệm thành công!");
  };

  // Handle Clone / Duplicate Trial
  const handleCloneTrial = (item: TrialTrackingItem) => {
    setClonedFromTrial(item);
    setNewTitle(`${item.title} (Bản sao)`);
    setNewProduct(item.productName || "");
    setNewTrialType(item.trialType || "B2B");
    setNewCategory(item.category4M || "NGUYÊN VẬT LIỆU");
    const targetComp: "TPP" | "DNP" = item.targetCompany === "DNP" ? "DNP" : "TPP";
    setNewCompany(targetComp);
    setNewFactory(item.factory || currentUser?.branch || "Chi Nhánh Bắc Ninh (TPP-BNI)");

    // Parse workshop and machine detail if separated by " - "
    let rawWorkshop = item.workshop || "Xưởng Pet (TPP-BNI)";
    let extractedMachine = "";
    if (rawWorkshop.includes(" - ")) {
      const parts = rawWorkshop.split(" - ");
      rawWorkshop = parts[0];
      extractedMachine = parts.slice(1).join(" - ");
    }
    setNewWorkshop(rawWorkshop);
    setNewMachineDetail(extractedMachine);
    setCustomWorkshopInput("");
    setNewSampleQty(item.sampleQuantity || "");
    setNewReqDocNo("");
    const initialNotes = item.steps?.step1_request?.notes || "";
    setNewNotes(initialNotes);
    setNewImages(item.images ? [...item.images] : []);
    setIsCreateModalOpen(true);
    if (showToast) {
      const stepCount = getItemStepList(item).length;
      showToast(`Đã nạp dữ liệu nhân bản từ "${item.title}". Kế thừa ${stepCount} bước quy trình và đơn vị phụ trách!`);
    }
  };

  // Handle Create New Trial
  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProduct.trim()) return;

    const dateStr = new Date().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const targetBranch = availableBranches.find(b => b.name === newFactory || b.id === newFactory);
    const effectiveCompany = (targetBranch?.companyId || newCompany || (currentUser?.company === "DNP" ? "DNP" : "TPP")) as "TPP" | "DNP";
    const newId = `TN-${effectiveCompany}-${Date.now().toString().slice(-6)}`;

    // Build standardized department / workshop text
    const chosenDept = (newWorkshop === "CUSTOM_OPTION" ? customWorkshopInput.trim() : newWorkshop.trim()) || "Xưởng sản xuất";
    const fullWorkshop = newMachineDetail.trim() 
      ? `${chosenDept} - ${newMachineDetail.trim()}`
      : chosenDept;

    let stepsData: Record<string, TrialStepDetail> = {};
    let customOrderToUse: TrialStepKey[] | undefined = undefined;
    let initialCurrentStepKey: TrialStepKey = "step2_plan";

    if (clonedFromTrial && clonedFromTrial.steps) {
      // Inherit the exact step sequence and departments from cloned trial
      const clonedStepKeys = getItemStepList(clonedFromTrial).map(s => s.key);
      customOrderToUse = clonedFromTrial.customStepOrder ? [...clonedFromTrial.customStepOrder] : (clonedStepKeys.length > 0 ? clonedStepKeys : undefined);

      clonedStepKeys.forEach((k, idx) => {
        const origStep = clonedFromTrial.steps[k];
        if (!origStep) return;

        if (idx === 0) {
          // First step: Mark as completed for request creation
          stepsData[k] = {
            ...origStep,
            isCompleted: true,
            completedAt: dateStr,
            completedBy: currentUser?.fullName || "Người khởi tạo",
            completedByRole: currentUser?.position || "QA Head",
            notes: newNotes.trim() || "Đã khởi tạo yêu cầu thử nghiệm (kế thừa).",
            customCode: newReqDocNo.trim()
          };
        } else {
          // Remaining steps: Reset to fresh pending state
          stepsData[k] = {
            ...origStep,
            isCompleted: false,
            completedAt: undefined,
            completedBy: undefined,
            completedByRole: undefined,
            completedByPhone: undefined,
            notes: undefined,
            customCode: undefined,
            resultStatus: "PENDING"
          };
        }
      });

      // Set currentStepKey to the second step (idx 1) if available, or the first pending step
      if (clonedStepKeys.length > 1) {
        initialCurrentStepKey = clonedStepKeys[1];
      } else if (clonedStepKeys.length > 0) {
        initialCurrentStepKey = clonedStepKeys[0];
      }
    } else {
      // Default 6-step creation
      stepsData = {
        step1_request: {
          key: "step1_request",
          stepNumber: "1",
          name: "ĐN thử nghiệm",
          roleResponsible: "QA/R&D",
          isCompleted: true,
          completedAt: dateStr,
          completedBy: currentUser?.fullName || "Người khởi tạo",
          completedByRole: currentUser?.position || "QA Head",
          notes: newNotes.trim() || "Đã khởi tạo yêu cầu thử nghiệm.",
          customCode: newReqDocNo.trim()
        },
        step2_plan: {
          key: "step2_plan",
          stepNumber: "2",
          name: "LSX thử",
          roleResponsible: "Phòng Kế hoạch",
          isCompleted: false
        },
        step3a_material: {
          key: "step3a_material",
          stepNumber: "3A",
          name: "Trộn NL",
          roleResponsible: "Tổ Liệu",
          isCompleted: false
        },
        step3b_mold: {
          key: "step3b_mold",
          stepNumber: "3B",
          name: "Lên khuôn",
          roleResponsible: "Kỹ thuật Khuôn",
          isCompleted: false
        },
        step4_trial: {
          key: "step4_trial",
          stepNumber: "4",
          name: "Thử nghiệm",
          roleResponsible: "Sản xuất / Trưởng ca",
          isCompleted: false
        },
        step5_evaluation: {
          key: "step5_evaluation",
          stepNumber: "5",
          name: "Đánh giá",
          roleResponsible: "QA / QC",
          isCompleted: false,
          resultStatus: "PENDING"
        }
      };
      initialCurrentStepKey = "step2_plan";
    }

    const newItem: TrialTrackingItem = {
      id: newId,
      code: newId,
      title: newTitle.trim(),
      trialType: newTrialType || "B2B",
      targetCompany: effectiveCompany,
      factory: newFactory,
      workshop: fullWorkshop,
      category4M: newCategory,
      productName: newProduct.trim() || newTitle.trim() || "Thử nghiệm 4M1E1I",
      requestDocNo: newReqDocNo.trim() || `ĐN-TN/${new Date().getFullYear()}/${newId.slice(-4)}`,
      sampleQuantity: newSampleQty.trim() || "Theo kế hoạch",
      images: newImages.length > 0 ? newImages : undefined,
      imageUrl: newImages[0] || "",
      createdAt: dateStr,
      createdTimestamp: Date.now(),
      createdByName: currentUser?.fullName || "Người đề xuất",
      createdByPhone: currentUser?.phone || "",
      createdByRole: currentUser?.position || currentUser?.department || "Chuyên viên QA",
      overallStatus: "IN_PROGRESS",
      currentStepKey: initialCurrentStepKey,
      customStepOrder: customOrderToUse,
      steps: stepsData,
      updatedAt: dateStr,
      commentsCount: 0
    };

    saveItems([newItem, ...trialItems]);
    setIsCreateModalOpen(false);
    setClonedFromTrial(null);
    // Reset inputs
    setNewTitle("");
    setNewProduct("");
    setNewReqDocNo("");
    setNewSampleQty("");
    setNewNotes("");
    setNewImages([]);
    setNewMachineDetail("");
    setCustomWorkshopInput("");
  };

  const stepList: { key: TrialStepKey; label: string; number: string; role: string }[] = [
    { key: "step1_request", label: "ĐN thử nghiệm", number: "1", role: "QA / R&D" },
    { key: "step2_plan", label: "LSX thử", number: "2", role: "Kế hoạch" },
    { key: "step3a_material", label: "Trộn NL", number: "3A", role: "Tổ Liệu" },
    { key: "step3b_mold", label: "Lên khuôn", number: "3B", role: "Khuôn/Máy" },
    { key: "step4_trial", label: "Thử nghiệm", number: "4", role: "Sản xuất" },
    { key: "step5_evaluation", label: "Đánh giá", number: "5", role: "QA/QC" }
  ];

  return (
    <div className={isMobileView ? "p-2 sm:p-3 space-y-3" : "min-h-screen bg-slate-50 py-4 px-2 sm:px-4 md:px-6"}>
      {/* Header Banner & Vibrant Stat Cards (Hidden on Mobile View as requested) */}
      {!isMobileView && (
        <div className="max-w-6xl mx-auto mb-5 space-y-3.5">
          {/* Top Title Bar: Clean, bright, elegant */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  <span translate="no" className="notranslate">TIẾN TRÌNH THỬ NGHIỆM</span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                  <span translate="no" className="notranslate">
                    Theo dõi & xác nhận 1 chạm tiến trình thử nghiệm nguyên liệu, khuôn và sản phẩm mới
                  </span>
                </p>
              </div>
            </div>

            {/* Actions: Create New Trial (+) & Cloud Status Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white shadow-md shadow-teal-600/25 transition-all flex items-center justify-center cursor-pointer border border-teal-500 shrink-0"
                title="Tạo đợt thử nghiệm mới"
                aria-label="Tạo đợt thử nghiệm mới"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs">
                {isSyncingCloud ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span translate="no" className="notranslate">Đang đồng bộ Cloud...</span>
                  </>
                ) : isCloudConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span translate="no" className="notranslate text-emerald-800">Firestore Cloud Active</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                    <span translate="no" className="notranslate text-amber-800">Offline Cache (30 ngày)</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Vibrant Quick Stat Cards (Fully responsive and Zoom-resilient) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Tổng đợt thử (Blue/Indigo gradient card with watermark icon) */}
            <div 
              onClick={() => setStatusFilter("ALL")}
              className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-md transition-all duration-200 cursor-pointer active:scale-98 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 min-w-0 ${
                statusFilter === "ALL" ? "ring-3 ring-blue-400 ring-offset-2 scale-[1.02]" : ""
              }`}
            >
              {/* Background watermark icon */}
              <Activity className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none stroke-[1.5]" />
              <div className="relative z-10 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-blue-100 truncate">
                      <span translate="no" className="notranslate">TỔNG ĐỢT THỬ</span>
                    </div>
                    <div className="text-[11px] text-blue-100/90 font-medium leading-tight truncate">
                      <span translate="no" className="notranslate">Đang quản lý</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight shrink-0">
                  {filteredItems.length}
                </div>
              </div>
            </div>

            {/* Card 2: Đang thực hiện (Vibrant Amber/Orange Card with watermark icon) */}
            <div 
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-md transition-all duration-200 cursor-pointer active:scale-98 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 min-w-0 ${
                statusFilter === "IN_PROGRESS" ? "ring-3 ring-orange-400 ring-offset-2 scale-[1.02]" : ""
              }`}
            >
              <Shield className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none stroke-[1.5]" />
              <div className="relative z-10 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-amber-100 truncate">
                      <span translate="no" className="notranslate">ĐANG THỰC HIỆN</span>
                    </div>
                    <div className="text-[11px] text-amber-100/90 font-medium leading-tight truncate">
                      <span translate="no" className="notranslate">Tiến trình 4M1E</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight shrink-0">
                  {filteredItems.filter((i) => i.overallStatus === "IN_PROGRESS").length}
                </div>
              </div>
            </div>

            {/* Card 3: Đánh giá ĐẠT (Vibrant Emerald/Green Card with watermark icon) */}
            <div 
              onClick={() => setStatusFilter("COMPLETED_PASS")}
              className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-md transition-all duration-200 cursor-pointer active:scale-98 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 min-w-0 ${
                statusFilter === "COMPLETED_PASS" ? "ring-3 ring-emerald-400 ring-offset-2 scale-[1.02]" : ""
              }`}
            >
              <CheckCircle className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none stroke-[1.5]" />
              <div className="relative z-10 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-100 truncate">
                      <span translate="no" className="notranslate">ĐÁNH GIÁ ĐẠT</span>
                    </div>
                    <div className="text-[11px] text-emerald-100/90 font-medium leading-tight truncate">
                      <span translate="no" className="notranslate">Đạt chuẩn ISO</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight shrink-0">
                  {filteredItems.filter((i) => i.overallStatus === "COMPLETED_PASS").length}
                </div>
              </div>
            </div>

            {/* Card 4: Không đạt / Hủy (Vibrant Red/Crimson Card with watermark icon) */}
            <div 
              onClick={() => setStatusFilter("COMPLETED_FAIL")}
              className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 text-white shadow-md transition-all duration-200 cursor-pointer active:scale-98 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 min-w-0 ${
                statusFilter === "COMPLETED_FAIL" ? "ring-3 ring-rose-400 ring-offset-2 scale-[1.02]" : ""
              }`}
            >
              <Zap className="absolute -right-2 -bottom-2 w-20 h-20 text-white/15 pointer-events-none stroke-[1.5]" />
              <div className="relative z-10 flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black uppercase tracking-wider text-rose-100 truncate">
                      <span translate="no" className="notranslate">KHÔNG ĐẠT / HỦY</span>
                    </div>
                    <div className="text-[11px] text-rose-100/90 font-medium leading-tight truncate">
                      <span translate="no" className="notranslate">Cần hiệu chỉnh</span>
                    </div>
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight shrink-0">
                  {filteredItems.filter((i) => i.overallStatus === "COMPLETED_FAIL" || i.overallStatus === "CANCELLED").length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar (Hidden on Mobile View as requested) */}
      {!isMobileView && (
        <div className="max-w-6xl mx-auto mb-5 space-y-2.5">
          <div className="bg-white rounded-xl p-3.5 sm:p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            
            {/* Company Selector (Restricted to Admin for ALL, otherwise fixed) */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span translate="no" className="notranslate">Khối:</span>
              </span>

              {isAdmin ? (
                <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200 flex-wrap">
                  <button
                    onClick={() => onCompanyChange && onCompanyChange("ALL")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedCompany === "ALL" 
                        ? "bg-slate-800 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span translate="no" className="notranslate">🌐 Toàn hệ thống</span>
                  </button>
                  <button
                    onClick={() => onCompanyChange && onCompanyChange("TPP")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedCompany === "TPP" 
                        ? "bg-blue-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span translate="no" className="notranslate">🔵 Khối TPP</span>
                  </button>
                  <button
                    onClick={() => onCompanyChange && onCompanyChange("DNP")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      selectedCompany === "DNP" 
                        ? "bg-amber-600 text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span translate="no" className="notranslate">🟠 Khối DNP</span>
                  </button>
                </div>
              ) : (
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  effectiveCompany === "DNP" 
                    ? "bg-amber-50 text-amber-800 border-amber-300" 
                    : "bg-blue-50 text-blue-800 border-blue-300"
                }`}>
                  <span translate="no" className="notranslate">
                    {effectiveCompany === "DNP" ? "🟠 Khối DNP (Nội bộ)" : "🔵 Khối TPP (Nội bộ)"}
                  </span>
                </span>
              )}
            </div>

            {/* Search, Branch and Status Filter */}
            <div className="flex flex-wrap items-center gap-2 flex-1 lg:max-w-3xl">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đợt, tên sản phẩm, BP/ĐV..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {/* Branch Filter Dropdown */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[130px] flex-1 sm:flex-initial truncate cursor-pointer"
                title="Lọc theo Chi nhánh / Nhà máy"
              >
                <option value="ALL">🏢 Tất cả chi nhánh</option>
                {availableBranches
                  .filter(b => effectiveCompany === "ALL" ? true : b.companyId === effectiveCompany)
                  .map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

          </div>

          {/* Dedicated Segmented Pill Strip for Phân hệ Thử nghiệm (TN-B2B / TN-B2C) on Desktop */}
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-sm border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5 mr-1 select-none">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                <span translate="no" className="notranslate">Phân hệ Thử Nghiệm:</span>
              </span>

              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1 select-none">
                {/* Button ALL */}
                <button
                  type="button"
                  onClick={() => setTrialTypeFilter("ALL")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    trialTypeFilter === "ALL"
                      ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <span translate="no" className="notranslate">TẤT CẢ PHÂN HỆ</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    trialTypeFilter === "ALL" ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"
                  }`}>
                    {b2bCount + b2cCount}
                  </span>
                </button>

                {/* Button B2B */}
                <button
                  type="button"
                  onClick={() => setTrialTypeFilter("B2B")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    trialTypeFilter === "B2B"
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-extrabold"
                      : "text-blue-700 hover:text-blue-900 hover:bg-blue-50/80"
                  }`}
                >
                  <span>🏢</span>
                  <span translate="no" className="notranslate">TN-B2B</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    trialTypeFilter === "B2B" ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-800"
                  }`}>
                    {b2bCount}
                  </span>
                </button>

                {/* Button B2C */}
                <button
                  type="button"
                  onClick={() => setTrialTypeFilter("B2C")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    trialTypeFilter === "B2C"
                      ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-300 font-extrabold"
                      : "text-purple-700 hover:text-purple-900 hover:bg-purple-50/80"
                  }`}
                >
                  <span>🛍️</span>
                  <span translate="no" className="notranslate">TN-B2C</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    trialTypeFilter === "B2C" ? "bg-purple-700 text-white" : "bg-purple-100 text-purple-800"
                  }`}>
                    {b2cCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Helper Text */}
            <div className="text-[11px] text-slate-500 font-medium hidden md:flex items-center gap-1.5 select-none">
              <span className="text-slate-400">💡</span>
              <span translate="no" className="notranslate">
                {trialTypeFilter === "B2B" ? "Đang lọc: Thử nghiệm B2B (Khuôn, Thông số Ép/Thổi, FAI, Khách hàng Công nghiệp)" :
                 trialTypeFilter === "B2C" ? "Đang lọc: Thử nghiệm B2C (Bao bì, Thẩm mỹ, Độ bền, Người tiêu dùng)" :
                 "Hiển thị toàn bộ các đợt thử nghiệm B2B & B2C"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main List of Trial Items (Shopee Cards) */}
      <div className="max-w-6xl mx-auto space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
            <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">
              <span translate="no" className="notranslate">Không tìm thấy đợt thử nghiệm nào</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              <span translate="no" className="notranslate">
                Chưa có đợt thử nghiệm phù hợp với bộ lọc hiện tại. Bấm nút "Tạo Đợt Thử Nghiệm Mới" để bắt đầu.
              </span>
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompletedPass = item.overallStatus === "COMPLETED_PASS";
            const isCompletedFail = item.overallStatus === "COMPLETED_FAIL";

            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
                  isCompletedPass
                    ? "border-emerald-500"
                    : isCompletedFail
                    ? "border-red-500"
                    : "border-amber-500"
                }`}
              >
                {/* Header card info - Đồng bộ 100% layout & màu sắc với Bản tin biến động 4M1E1I */}
                <div className="px-3 py-2 bg-slate-50/90 border-b border-slate-200/90 flex justify-between items-center gap-2 select-none">
                  <div className="flex-1 min-w-0">
                    <span className="font-black block leading-tight truncate text-blue-900 text-xs sm:text-[13px] uppercase">
                      <span translate="no" className="notranslate">{item.factory?.toUpperCase()}</span>
                    </span>
                    <div className="text-[10px] text-slate-600 font-extrabold mt-0.5 flex items-center flex-wrap gap-1">
                      <span className="text-blue-700 font-black flex items-center gap-0.5">
                        <UserIcon className="w-3.5 h-3.5 stroke-[2.5] text-blue-600 shrink-0" />
                        <span translate="no" className="notranslate">{item.createdByName}</span>
                      </span>
                      <span className="text-slate-300 mx-1 font-normal">|</span>
                      <span className="text-[9px] text-slate-400 font-sans font-semibold">
                        <span translate="no" className="notranslate">{item.createdAt}</span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isCompletedPass ? (
                      <span className="text-[9px] font-black text-white flex items-center gap-1 bg-emerald-600 border border-emerald-700 px-2 py-1 rounded-md leading-none shadow-3xs shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        <span translate="no" className="notranslate">🧪 THỬ NGHIỆM ĐẠT</span>
                      </span>
                    ) : isCompletedFail ? (
                      <span className="text-[9px] font-black text-white flex items-center gap-1 bg-rose-600 border border-rose-700 px-2 py-1 rounded-md leading-none shadow-3xs shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        <span translate="no" className="notranslate">✖ KHÔNG ĐẠT</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-white flex items-center gap-1 bg-amber-600 border border-amber-700 px-2 py-1 rounded-md leading-none shadow-3xs shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        <span translate="no" className="notranslate">⏳ ĐANG THỬ NGHIỆM</span>
                      </span>
                    )}
                    {item.code && (
                      <span className="text-[9px] text-slate-400 font-sans font-semibold">
                        <span translate="no" className="notranslate">ID: {item.code}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-bar: Đơn vị gốc, Phân hệ TN-B2B/B2C & Chuyển DNP/TPP đồng bộ với bản tin 4M1E1I */}
                <div className="bg-slate-100/80 border-b border-slate-200/90 px-3 py-1.5 flex items-center justify-between text-[9.5px] select-none flex-wrap gap-1">
                  <div className="flex items-center gap-2 min-w-0 text-slate-600 font-medium flex-wrap">
                    <span>
                      <span translate="no" className="notranslate">Đơn vị gốc:</span>{" "}
                      <strong className="text-slate-800 font-bold">{item.targetCompany || "TPP"}</strong>
                    </span>

                    {/* Phân hệ Thử nghiệm Pill Badge: TN-B2B hoặc TN-B2C */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase border flex items-center gap-1 shrink-0 shadow-3xs ${
                      (item.trialType || "B2B") === "B2C"
                        ? "bg-purple-100/80 text-purple-800 border-purple-300"
                        : "bg-blue-100/80 text-blue-800 border-blue-300"
                    }`}>
                      <span>{(item.trialType || "B2B") === "B2C" ? "🛍️" : "🏢"}</span>
                      <span translate="no" className="notranslate">{(item.trialType || "B2B") === "B2C" ? "TN-B2C" : "TN-B2B"}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextCo: "TPP" | "DNP" = item.targetCompany === "DNP" ? "TPP" : "DNP";
                          const updated = trialItems.map((t) => t.id === item.id ? { ...t, targetCompany: nextCo } : t);
                          saveItems(updated);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-900 border border-slate-200 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-3xs"
                        title="Chuyển công ty thụ lý giữa TPP và DNP"
                      >
                        <span className="text-xs leading-none">🔄</span>
                        <span translate="no" className="notranslate">Chuyển DNP/TPP</span>
                      </button>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[8.5px] font-bold">
                        {item.targetCompany || "TPP"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Khung hình ảnh tự chuyển trên Mobile (AutoImageSlider tràn viền tương tự Bản tin 4M1E1I) */}
                {item.images && item.images.length > 0 && (
                  <div className={isMobileView ? "block" : "md:hidden"}>
                    <AutoImageSlider
                      imageUrls={item.images}
                      fallbackUrl={item.images[0]}
                    />
                  </div>
                )}

                {/* Content Details: Phân tách rõ ràng giữa Mobile (xếp dọc 100% giống Bản tin 4M1E1I) và Desktop (3 cột 35%-30%-35%) */}
                <div className="p-3.5 sm:p-5">
                  {isMobileView ? (
                    /* GIAO DIỆN MOBILE ĐỒNG BỘ 100% VỚI BẢN TIN 4M1E1I (XẾP DỌC HOÀN TOÀN) */
                    <div className="space-y-2.5">
                      {/* 1. Tiêu đề đợt thử nghiệm */}
                      <h2 className="text-[14px] font-extrabold text-slate-900 leading-snug uppercase tracking-tight break-words">
                        <span translate="no" className="notranslate">{item.title}</span>
                      </h2>

                      {/* 2. Tên sản phẩm */}
                      <div>
                        <span className="inline-flex items-start font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md text-xs border border-teal-200/70 max-w-full leading-relaxed break-words">
                          <span translate="no" className="notranslate">Sản phẩm: {item.productName}</span>
                        </span>
                      </div>

                      {/* 3. Mã 4M & Số ĐN & Số LSX (xuống dòng riêng) */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        <span>
                          <span translate="no" className="notranslate">Mã 4M:</span>{" "}
                          <strong className="text-slate-800 font-bold"><span translate="no" className="notranslate">{item.category4M}</span></strong>
                        </span>
                        {item.requestDocNo && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>
                              <span translate="no" className="notranslate">Số ĐN:</span>{" "}
                              <strong className="text-slate-800 font-bold"><span translate="no" className="notranslate">{item.requestDocNo}</span></strong>
                            </span>
                          </>
                        )}
                        {item.planDocNo && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span>
                              <span translate="no" className="notranslate">Số LSX:</span>{" "}
                              <strong className="text-slate-800 font-bold"><span translate="no" className="notranslate">{item.planDocNo}</span></strong>
                            </span>
                          </>
                        )}
                      </div>

                      {/* 4. Vị trí / Phân xưởng */}
                      {item.workshop && (
                        <div className="text-xs text-slate-600 flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-slate-500 font-semibold shrink-0">
                            <span translate="no" className="notranslate">Vị trí / Phân xưởng:</span>
                          </span>
                          <span className="font-bold text-slate-800 leading-tight break-words">
                            <span translate="no" className="notranslate">{abbreviateDepartmentName(item.workshop)}</span>
                          </span>
                        </div>
                      )}

                      {/* 5. Khung Đánh giá & Kết luận chung trên Mobile */}
                      {item.finalConclusion ? (
                        <div className={`mt-2 p-3 rounded-xl text-xs font-medium border flex flex-col gap-2 ${
                          item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion)
                            ? "bg-rose-50/90 text-rose-950 border-rose-200"
                            : /TẠM CHẤP NHẬN/i.test(item.finalConclusion)
                            ? "bg-amber-50/90 text-amber-950 border-amber-300"
                            : "bg-emerald-50/90 text-emerald-950 border-emerald-200"
                        }`}>
                          <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-black/5">
                            <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] tracking-tight min-w-0 truncate">
                              {item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion) ? (
                                <>
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span translate="no" className="notranslate text-rose-700 truncate">KẾT LUẬN: KHÔNG ĐẠT</span>
                                </>
                              ) : /TẠM CHẤP NHẬN/i.test(item.finalConclusion) ? (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span translate="no" className="notranslate text-amber-700 truncate">KẾT LUẬN: TẠM CHẤP NHẬN</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span translate="no" className="notranslate text-emerald-700 truncate">KẾT LUẬN: ĐẠT CHUẨN</span>
                                </>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenConclusionModal(item)}
                              className="p-1 rounded-md bg-white/90 hover:bg-white text-slate-600 hover:text-teal-700 border border-slate-200/80 shadow-3xs cursor-pointer shrink-0"
                              title="Chỉnh sửa kết luận"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11.5px] text-slate-800 leading-relaxed italic break-words">
                            "{item.finalConclusion}"
                          </p>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] text-slate-500 font-medium italic">
                            <span translate="no" className="notranslate">Chưa có kết luận chung</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenConclusionModal(item)}
                            className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-3xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Pencil className="w-3 h-3" />
                            <span translate="no" className="notranslate">Đánh giá kết luận</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* GIAO DIỆN DESKTOP: BỐ CỤC 3 CỘT (35% Thông tin - 30% Khung ảnh - 35% Đánh giá kết luận) */
                    <div className="mb-3.5 flex items-stretch justify-between gap-0">
                      {/* CỘT 1 (TRÁI - 35% trên Desktop): Toàn bộ thông tin đợt thử nghiệm */}
                      <div className="w-[35%] border-r border-slate-200/90 pr-4 min-w-0 flex flex-col justify-between">
                        <div>
                          {/* 1. Tiêu đề đợt thử nghiệm - Hiển thị đầy đủ */}
                          <h2 className="text-[15px] font-extrabold text-slate-900 leading-snug uppercase tracking-tight break-words">
                            <span translate="no" className="notranslate">{item.title}</span>
                          </h2>

                          {/* 2. Tên sản phẩm - Hiển thị đầy đủ */}
                          <div className="mt-2">
                            <span className="inline-flex items-start font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md text-xs border border-teal-200/70 max-w-full leading-relaxed break-words">
                              <span translate="no" className="notranslate">Sản phẩm: {item.productName}</span>
                            </span>
                          </div>

                          {/* 3. Mã 4M & Số ĐN & Số LSX (xuống dòng riêng) */}
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                            <span>
                              <span translate="no" className="notranslate">Mã 4M:</span>{" "}
                              <strong className="text-slate-800 font-bold"><span translate="no" className="notranslate">{item.category4M}</span></strong>
                            </span>
                            {item.requestDocNo && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>
                                  <span translate="no" className="notranslate">Số ĐN:</span>{" "}
                                  <strong className="text-slate-800 font-bold"><span translate="no" className="notranslate">{item.requestDocNo}</span></strong>
                                </span>
                              </>
                            )}
                            {item.planDocNo && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span>
                                  <span translate="no" className="notranslate">Số LSX:</span>{" "}
                                  <strong className="text-slate-800 font-bold"><span translate="no" className="notranslate">{item.planDocNo}</span></strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 4. Vị trí / Phân xưởng (xuống dòng riêng) */}
                        {item.workshop && (
                          <div className="mt-2 text-xs text-slate-600 flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-slate-500 font-semibold shrink-0">
                              <span translate="no" className="notranslate">Vị trí / Phân xưởng:</span>
                            </span>
                            <span className="font-bold text-slate-800 leading-tight break-words">
                              <span translate="no" className="notranslate">{abbreviateDepartmentName(item.workshop)}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CỘT 2 (GIỮA - 30% trên Desktop): Khung hình ảnh tự chuyển Auto Slider */}
                      <div className="w-[30%] px-4 border-r border-slate-200/90 shrink-0 flex flex-col justify-center">
                        {item.images && item.images.length > 0 ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-900 w-full h-[155px] flex items-center justify-center">
                            <AutoImageSlider
                              imageUrls={item.images}
                              fallbackUrl={item.images[0]}
                              className="h-[155px] w-full border-0"
                            />
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 w-full h-[155px] flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5 p-3 text-center">
                            <Camera className="w-6 h-6 text-slate-300" />
                            <span translate="no" className="notranslate text-[11px]">Chưa có hình ảnh thử nghiệm</span>
                          </div>
                        )}
                      </div>

                      {/* CỘT 3 (PHẢI - 35% trên Desktop): Khung Đánh giá & Kết luận chung */}
                      <div className="w-[35%] pl-4 shrink-0 flex flex-col justify-center">
                        {item.finalConclusion ? (
                          <div className={`h-full min-h-[155px] p-3 rounded-xl text-xs font-medium border flex flex-col justify-between transition-all ${
                            item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion)
                              ? "bg-rose-50/90 text-rose-950 border-rose-200"
                              : /TẠM CHẤP NHẬN/i.test(item.finalConclusion)
                              ? "bg-amber-50/90 text-amber-950 border-amber-300"
                              : "bg-emerald-50/90 text-emerald-950 border-emerald-200"
                          }`}>
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1.5 mb-1.5 pb-1 border-b border-black/5">
                                <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] tracking-tight min-w-0 truncate">
                                  {item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion) ? (
                                    <>
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                      <span translate="no" className="notranslate text-rose-700 truncate">KẾT LUẬN: KHÔNG ĐẠT</span>
                                    </>
                                  ) : /TẠM CHẤP NHẬN/i.test(item.finalConclusion) ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                      <span translate="no" className="notranslate text-amber-700 truncate">KẾT LUẬN: TẠM CHẤP NHẬN</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span translate="no" className="notranslate text-emerald-700 truncate">KẾT LUẬN: ĐẠT CHUẨN</span>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenConclusionModal(item)}
                                  className="p-1 rounded-md bg-white/80 hover:bg-white text-slate-600 hover:text-teal-700 border border-slate-200/80 shadow-3xs hover:shadow-2xs transition-all cursor-pointer shrink-0"
                                  title="Chỉnh sửa kết luận"
                                >
                                  <Pencil className="w-3 h-3 text-inherit" />
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-800 line-clamp-3 leading-relaxed break-words italic">
                                "{item.finalConclusion}"
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenConclusionModal(item)}
                              className="mt-2 w-full py-1 px-2 rounded-lg text-[10.5px] font-bold bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-3xs hover:text-teal-700 hover:border-teal-300"
                            >
                              <Pencil className="w-3 h-3 text-teal-600 shrink-0" />
                              <span translate="no" className="notranslate">Xem / Sửa kết luận</span>
                            </button>
                          </div>
                        ) : (
                          <div className="h-full min-h-[155px] p-3 rounded-xl border border-dashed border-teal-300/80 bg-teal-50/40 flex flex-col items-center justify-between text-center gap-1.5">
                            <div className="w-full flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-teal-100/80 flex items-center justify-center text-teal-700 mb-1">
                                <Pencil className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-[11px] font-black text-teal-900 uppercase tracking-tight">
                                <span translate="no" className="notranslate">KẾT LUẬN CHUNG</span>
                              </div>
                              <p className="text-[10px] text-teal-700/80 mt-0.5 leading-snug line-clamp-2">
                                <span translate="no" className="notranslate">Chưa có kết luận tổng kết</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenConclusionModal(item)}
                              className="w-full py-1.5 px-2.5 rounded-lg text-[10.5px] font-black text-white bg-teal-600 hover:bg-teal-700 shadow-3xs hover:shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                            >
                              <Pencil className="w-3 h-3" />
                              <span translate="no" className="notranslate">Đánh Giá Kết Luận</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* SHOPEE STEPPER TIMELINE (DYNAMIC STEPS) */}
                  {/* ------------------------------------------------------------- */}
                  {(() => {
                    const itemSteps = getItemStepList(item);
                    return (
                      <div className="mt-5 pt-3 sm:mt-6 sm:pt-4 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-600 mb-2.5 flex items-center justify-between gap-1 uppercase tracking-wide flex-nowrap">
                          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 shrink-0" />
                            <span translate="no" className="notranslate text-[11px] sm:text-xs">TIẾN TRÌNH</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 flex-nowrap">
                            {/* Nút Nhân bản / Kế thừa đợt thử nghiệm này */}
                            <button
                              type="button"
                              onClick={() => handleCloneTrial(item)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[9px] sm:text-[10px] font-bold transition-all shadow-3xs cursor-pointer active:scale-95 uppercase whitespace-nowrap shrink-0"
                              title="Nhân bản / Sao chép đợt thử nghiệm này (Kế thừa toàn bộ các bước và thông tin)"
                            >
                              <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-700 shrink-0" />
                              <span translate="no" className="notranslate whitespace-nowrap">NHÂN BẢN</span>
                            </button>

                            {/* Nút Tùy chỉnh bước / Thêm / Xóa bước */}
                            <button
                              type="button"
                              onClick={() => setCustomizingItem(item)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[9px] sm:text-[10px] font-bold transition-all shadow-3xs cursor-pointer active:scale-95 uppercase whitespace-nowrap shrink-0"
                              title="Tùy chỉnh, thêm hoặc xóa các bước của đợt thử nghiệm này"
                            >
                              <SlidersHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-teal-700 shrink-0" />
                              <span translate="no" className="notranslate whitespace-nowrap">TÙY CHỈNH</span>
                            </button>
                          </div>
                        </div>

                        {/* Shopee Vertical Timeline (Dành cho Mobile / isMobileView) - Hỗ trợ nhấn im kéo thả sắp xếp */}
                        {isMobileView ? (
                          <div className="space-y-0 relative pl-1 pr-1 select-none">
                            <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200">
                              <span className="flex items-center gap-1">
                                <GripVertical className="w-3 h-3 text-slate-400" />
                                <span translate="no" className="notranslate">Kéo thả icon ⋮⋮ để đảo vị trí các bước</span>
                              </span>
                              <span className="text-[9px] text-teal-700 font-bold">
                                <span translate="no" className="notranslate">{itemSteps.length} bước</span>
                              </span>
                            </div>

                            {itemSteps.map((st, idx) => {
                              const stepData: TrialStepDetail = st.stepData;
                              const isDone = st.isCompleted;
                              const isCurrent = item.currentStepKey === st.key && !isCompletedPass && !isCompletedFail;
                              const isLast = idx === itemSteps.length - 1;
                              const isDragging = draggingStepKey === st.key && draggingItemId === item.id;
                              const isDragOver = dragOverStepKey === st.key && draggingItemId === item.id && !isDragging;

                              return (
                                <div 
                                  key={st.key} 
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggingStepKey(st.key);
                                    setDraggingItemId(item.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", st.key);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (dragOverStepKey !== st.key) {
                                      setDragOverStepKey(st.key);
                                    }
                                  }}
                                  onDragLeave={() => {
                                    if (dragOverStepKey === st.key) {
                                      setDragOverStepKey(null);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const sourceKey = e.dataTransfer.getData("text/plain") || draggingStepKey;
                                    if (sourceKey && sourceKey !== st.key) {
                                      handleReorderSteps(item.id, sourceKey, st.key);
                                    }
                                    setDraggingStepKey(null);
                                    setDragOverStepKey(null);
                                    setDraggingItemId(null);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingStepKey(null);
                                    setDragOverStepKey(null);
                                    setDraggingItemId(null);
                                  }}
                                  className={`relative flex items-start gap-2 pb-4 last:pb-1 transition-all rounded-xl p-1 ${
                                    isDragging 
                                      ? "opacity-40 scale-98 bg-slate-200/60 border border-dashed border-slate-400" 
                                      : isDragOver
                                        ? "bg-teal-50/80 border-2 border-dashed border-teal-500 scale-[1.01]"
                                        : ""
                                  }`}
                                >
                                  {/* Cột icon Drag Handle để nhấn im kéo */}
                                  <div 
                                    className="flex items-center justify-center self-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5 touch-none"
                                    title="Nhấn im để kéo lên/xuống đảo vị trí bước này"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>

                                  {/* Cột trục Timeline kết nối dọc (Shopee style) */}
                                  <div className="flex flex-col items-center shrink-0 w-7">
                                    {/* Nút tròn trạng thái bước */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenStepModal(item, st.key)}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] transition-all z-10 ${
                                        isDone 
                                          ? stepData?.resultStatus === "FAIL"
                                            ? "bg-rose-600 text-white shadow-2xs ring-2 ring-rose-100"
                                            : stepData?.resultStatus === "CONDITIONAL"
                                            ? "bg-amber-500 text-white shadow-2xs ring-2 ring-amber-100"
                                            : "bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-100"
                                          : isCurrent 
                                            ? "bg-amber-500 text-white ring-4 ring-amber-100 shadow-md animate-pulse" 
                                            : "bg-slate-100 text-slate-400 border border-slate-300"
                                      }`}
                                    >
                                      {isDone ? (
                                        stepData?.resultStatus === "FAIL" ? (
                                          <X className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : stepData?.resultStatus === "CONDITIONAL" ? (
                                          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        )
                                      ) : (
                                        st.number
                                      )}
                                    </button>
                                    
                                    {/* Đường kẻ dọc kết nối các bước */}
                                    {!isLast && (
                                      <div className={`w-[2px] grow min-h-[34px] my-1 ${
                                        isDone 
                                          ? stepData?.resultStatus === "FAIL"
                                            ? "bg-rose-300"
                                            : stepData?.resultStatus === "CONDITIONAL"
                                            ? "bg-amber-300"
                                            : "bg-emerald-400"
                                          : "bg-slate-200"
                                      }`} />
                                    )}
                                  </div>

                                  {/* Thẻ nội dung thông tin bước */}
                                  <div className={`flex-1 p-2.5 rounded-xl border transition-all ${
                                    isDone 
                                      ? "bg-emerald-50/40 border-emerald-200" 
                                      : isCurrent 
                                        ? "bg-amber-50/90 border-amber-300 ring-1 ring-amber-300 shadow-xs" 
                                        : "bg-slate-50/70 border-slate-200/80"
                                  }`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[11px] font-black uppercase text-blue-950 tracking-tight">
                                            <span translate="no" className="notranslate">({st.number}) {st.label}</span>
                                          </span>
                                        </div>
                                        <div className="text-[9.5px] text-slate-500 font-semibold mt-0.5 truncate max-w-full" title={st.role}>
                                          <span translate="no" className="notranslate">Phụ trách: {abbreviateDepartmentName(st.role)}</span>
                                        </div>
                                        {/* Hiển thị kết quả từng công đoạn ra ngoài, nằm dưới dòng Phụ trách... */}
                                        {isDone && renderStepResultTag(st.key, st.label, stepData?.resultStatus)}
                                      </div>

                                      {/* Nút hành động */}
                                      {(() => {
                                        const perm = checkUserStepPermission(currentUser, item, st.key, stepData);
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenStepModal(item, st.key)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                                              isDone 
                                                ? "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 shadow-3xs" 
                                                : isCurrent 
                                                  ? perm.allowed
                                                    ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-95" 
                                                    : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                                  : "bg-slate-200/80 text-slate-700 hover:bg-slate-300"
                                            }`}
                                            title={isCurrent && !perm.allowed ? `Công đoạn này do ${st.role} phụ trách` : ""}
                                          >
                                            {isCurrent && !perm.allowed && <Lock className="w-3 h-3 text-amber-700 shrink-0" />}
                                            <span translate="no" className="notranslate">
                                              {isDone ? "Chi tiết" : isCurrent ? (perm.allowed ? "✓ Xác nhận" : "Chờ Xác Nhận") : "Xem"}
                                            </span>
                                          </button>
                                        );
                                      })()}
                                    </div>

                                    {/* Hình ảnh công đoạn (Phương án B) */}
                                    {stepData?.images && stepData.images.length > 0 && (
                                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                                        {stepData.images.map((img, imgIdx) => (
                                          <button
                                            key={imgIdx}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLightboxImages({
                                                urls: stepData.images || [],
                                                index: imgIdx,
                                                title: `Bước ${st.number}: ${st.label} - Ảnh ${imgIdx + 1}/${stepData.images?.length}`
                                              });
                                            }}
                                            className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-300 hover:border-teal-500 hover:scale-105 transition-all shadow-3xs group bg-slate-100 shrink-0 cursor-pointer"
                                            title={`Xem ảnh ${imgIdx + 1} của bước ${st.label}`}
                                          >
                                            <img
                                              src={img}
                                              alt={`Ảnh bước ${st.label}`}
                                              className="w-full h-full object-cover"
                                              referrerPolicy="no-referrer"
                                              loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                              <ZoomIn className="w-3 h-3" />
                                            </div>
                                          </button>
                                        ))}
                                        <span className="text-[9px] text-teal-700 font-bold flex items-center gap-0.5">
                                          <Camera className="w-3 h-3" />
                                          <span>{stepData.images.length} ảnh</span>
                                        </span>
                                      </div>
                                    )}

                                    {/* Thông tin người hoàn thành / Ghi chú */}
                                    {isDone && (
                                      <div className="mt-1.5 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[9px] text-emerald-800 font-medium">
                                        <div className="truncate">
                                          <span className="font-bold">✓ {stepData?.completedBy || "Đã hoàn thành"}</span>
                                          {st.key === "step1_request" || st.number === "1" || /đn|đề nghị/i.test(st.label || "") ? (
                                            (item.requestDocNo || stepData?.customCode) && (
                                              <span className="ml-1 text-blue-900 font-mono font-bold">
                                                (Số ĐN: {item.requestDocNo || stepData?.customCode})
                                              </span>
                                            )
                                          ) : st.key === "step2_plan" || st.number === "2" || /lsx|lệnh/i.test(st.label || "") ? (
                                            (item.planDocNo || stepData?.customCode) && (
                                              <span className="ml-1 text-blue-900 font-mono font-bold">
                                                (Số LSX: {item.planDocNo || stepData?.customCode})
                                              </span>
                                            )
                                          ) : (
                                            stepData?.customCode && (
                                              <span className="ml-1 text-slate-500 font-mono">({stepData.customCode})</span>
                                            )
                                          )}
                                        </div>
                                        <div className="text-emerald-700/80 font-mono shrink-0 ml-1">
                                          {stepData?.completedAt}
                                        </div>
                                      </div>
                                    )}

                                    {isCurrent && stepData?.notes && (
                                      <div className="mt-1 text-[9px] text-amber-800 italic">
                                        {stepData.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            {/* Desktop Stepper (Switch to grid on lg screens, fallback cleanly to stacked cards on zoom/smaller viewports) */}
                            <div className={`hidden lg:grid gap-2 relative ${
                              itemSteps.length <= 4 
                                ? "grid-cols-4" 
                                : itemSteps.length === 5 
                                  ? "grid-cols-5" 
                                  : itemSteps.length === 6 
                                    ? "grid-cols-6" 
                                    : "grid-cols-7"
                            }`}>
                              {/* Connecting Line */}
                              <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0" />

                              {itemSteps.map((st) => {
                                const stepData: TrialStepDetail = st.stepData;
                                const isDone = st.isCompleted;
                                const isCurrent = item.currentStepKey === st.key && !isCompletedPass && !isCompletedFail;

                                return (
                                  <div key={st.key} className="relative z-10 flex flex-col items-center text-center">
                                    {/* Step Circle */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenStepModal(item, st.key)}
                                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                                        isDone 
                                          ? stepData?.resultStatus === "FAIL"
                                            ? "bg-rose-600 text-white ring-4 ring-rose-100 hover:bg-rose-700"
                                            : stepData?.resultStatus === "CONDITIONAL"
                                            ? "bg-amber-500 text-white ring-4 ring-amber-100 hover:bg-amber-600"
                                            : "bg-emerald-600 text-white ring-4 ring-emerald-100 hover:bg-emerald-700" 
                                          : isCurrent 
                                            ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-bounce hover:bg-amber-600"
                                            : "bg-white text-slate-400 border-2 border-slate-300 hover:border-slate-400"
                                      }`}
                                    >
                                      {isDone ? (
                                        stepData?.resultStatus === "FAIL" ? (
                                          <X className="w-4 h-4 stroke-[3]" />
                                        ) : stepData?.resultStatus === "CONDITIONAL" ? (
                                          <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                                        ) : (
                                          <Check className="w-4 h-4 stroke-[3]" />
                                        )
                                      ) : (
                                        st.number
                                      )}
                                    </button>

                                    {/* Step Title & Subtitle */}
                                    <div className="mt-2 text-xs font-black uppercase text-blue-950 leading-tight tracking-tight">
                                      <span translate="no" className="notranslate">({st.number}) {st.label}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-full px-0.5 whitespace-nowrap" title={st.role}>
                                      <span translate="no" className="notranslate">{abbreviateDepartmentName(st.role, departments)}</span>
                                    </div>

                                    {/* Hiển thị kết quả từng công đoạn ra ngoài, nằm dưới dòng Phụ trách... */}
                                    {isDone && (
                                      <div className="mt-1 flex justify-center">
                                        {renderStepResultTag(st.key, st.label, stepData?.resultStatus)}
                                      </div>
                                    )}

                                    {/* Hình ảnh công đoạn trên Desktop Grid (Phương án B) */}
                                    {stepData?.images && stepData.images.length > 0 && (
                                      <div className="mt-1.5 flex items-center justify-center gap-1">
                                        {stepData.images.map((img, imgIdx) => (
                                          <button
                                            key={imgIdx}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setLightboxImages({
                                                urls: stepData.images || [],
                                                index: imgIdx,
                                                title: `Bước ${st.number}: ${st.label} - Ảnh ${imgIdx + 1}/${stepData.images?.length}`
                                              });
                                            }}
                                            className="w-6 h-6 rounded-md overflow-hidden border border-slate-300 hover:border-teal-500 hover:scale-110 transition-all shadow-3xs group bg-slate-100 shrink-0 cursor-pointer"
                                            title={`Xem ảnh ${imgIdx + 1} của bước ${st.label}`}
                                          >
                                            <img
                                              src={img}
                                              alt={`Ảnh ${st.label}`}
                                              className="w-full h-full object-cover"
                                              referrerPolicy="no-referrer"
                                              loading="lazy"
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Completed Status / Button */}
                                    <div className="mt-2">
                                      {isDone ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenStepModal(item, st.key)}
                                          className="text-[10px] bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded px-1.5 py-0.5 leading-tight transition-all cursor-pointer block w-full text-center"
                                        >
                                          <div className="font-bold truncate max-w-[100px] mx-auto">{stepData?.completedBy || "Đã xong"}</div>
                                          <div className="text-[9px] text-slate-500">{stepData?.completedAt?.split(" ")[0]}</div>
                                        </button>
                                      ) : (() => {
                                        const perm = checkUserStepPermission(currentUser, item, st.key, stepData);
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenStepModal(item, st.key)}
                                            className={`text-[10px] font-bold px-2 py-1 rounded transition-all inline-flex items-center gap-1 ${
                                              isCurrent
                                                ? perm.allowed
                                                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                                                  : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                            title={isCurrent && !perm.allowed ? `Công đoạn này do ${st.role} phụ trách` : ""}
                                          >
                                            {isCurrent && !perm.allowed && <Lock className="w-2.5 h-2.5 text-amber-700 shrink-0" />}
                                            <span translate="no" className="notranslate">
                                              {isCurrent ? (perm.allowed ? "✓ Xác nhận" : "Chờ Xác Nhận") : "Chưa làm"}
                                            </span>
                                          </button>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Fluid Vertical Fallback when !isMobileView but screen is zoomed or compact */}
                            <div className="lg:hidden space-y-2">
                              {itemSteps.map((st) => {
                                const stepData: TrialStepDetail = st.stepData;
                                const isDone = st.isCompleted;
                                const isCurrent = item.currentStepKey === st.key && !isCompletedPass && !isCompletedFail;

                                return (
                                  <div 
                                    key={st.key}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                                      isDone 
                                        ? stepData?.resultStatus === "FAIL"
                                          ? "bg-rose-50/50 border-rose-200"
                                          : stepData?.resultStatus === "CONDITIONAL"
                                          ? "bg-amber-50/60 border-amber-200"
                                          : "bg-emerald-50/50 border-emerald-200" 
                                        : isCurrent 
                                          ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-200" 
                                          : "bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenStepModal(item, st.key)}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer ${
                                        isDone 
                                          ? stepData?.resultStatus === "FAIL"
                                            ? "bg-rose-600 text-white"
                                            : stepData?.resultStatus === "CONDITIONAL"
                                            ? "bg-amber-500 text-white"
                                            : "bg-emerald-600 text-white" 
                                          : isCurrent 
                                            ? "bg-amber-500 text-white" 
                                            : "bg-slate-200 text-slate-600"
                                      }`}>
                                        {isDone ? (
                                          stepData?.resultStatus === "FAIL" ? (
                                            <X className="w-3.5 h-3.5 stroke-[3]" />
                                          ) : stepData?.resultStatus === "CONDITIONAL" ? (
                                            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                                          ) : (
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          )
                                        ) : (
                                          st.number
                                        )}
                                      </button>
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-black uppercase text-blue-950 tracking-tight leading-tight">
                                          <span translate="no" className="notranslate">({st.number}) {st.label}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate max-w-full" title={st.role}>
                                          <span translate="no" className="notranslate">Phụ trách: {abbreviateDepartmentName(st.role, departments)}</span>
                                          {isDone && stepData?.completedBy && (
                                            <span className="text-slate-700 font-semibold ml-1 shrink-0">
                                              • {stepData.completedBy}
                                            </span>
                                          )}
                                        </div>
                                        {/* Hiển thị kết quả từng công đoạn ra ngoài, nằm dưới dòng Phụ trách... */}
                                        {isDone && renderStepResultTag(st.key, st.label, stepData?.resultStatus)}
                                        
                                        {/* Hình ảnh công đoạn (Phương án B) */}
                                        {stepData?.images && stepData.images.length > 0 && (
                                          <div className="mt-1 flex items-center gap-1">
                                            {stepData.images.map((img, imgIdx) => (
                                              <button
                                                key={imgIdx}
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setLightboxImages({
                                                    urls: stepData.images || [],
                                                    index: imgIdx,
                                                    title: `Bước ${st.number}: ${st.label} - Ảnh ${imgIdx + 1}/${stepData.images?.length}`
                                                  });
                                                }}
                                                className="w-5 h-5 rounded overflow-hidden border border-slate-300 hover:border-teal-500 hover:scale-110 transition-all shadow-3xs group bg-slate-100 shrink-0 cursor-pointer"
                                                title={`Xem ảnh ${imgIdx + 1} của bước ${st.label}`}
                                              >
                                                <img
                                                  src={img}
                                                  alt={`Ảnh ${st.label}`}
                                                  className="w-full h-full object-cover"
                                                  referrerPolicy="no-referrer"
                                                  loading="lazy"
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {(() => {
                                      const perm = checkUserStepPermission(currentUser, item, st.key, stepData);
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenStepModal(item, st.key)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                                            isDone 
                                              ? "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50" 
                                              : isCurrent 
                                                ? perm.allowed
                                                  ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600" 
                                                  : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                                                : "bg-slate-200 text-slate-700"
                                          }`}
                                          title={isCurrent && !perm.allowed ? `Công đoạn này do ${st.role} phụ trách` : ""}
                                        >
                                          {isCurrent && !perm.allowed && <Lock className="w-3 h-3 text-amber-700 shrink-0" />}
                                          <span translate="no" className="notranslate">
                                            {isDone ? "Xem" : (isCurrent ? (perm.allowed ? "✓ Xác nhận" : "Chờ Xác Nhận") : "Chi tiết")}
                                          </span>
                                        </button>
                                      );
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* Final Conclusion for Mobile (Only visible on Mobile view: md:hidden) */}
                  <div className="md:hidden">
                    {item.finalConclusion ? (
                      <div className={`mt-3 p-2.5 rounded-xl text-xs font-medium border flex items-start justify-between gap-2.5 transition-all ${
                        item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion)
                          ? "bg-rose-50/90 text-rose-950 border-rose-200"
                          : /TẠM CHẤP NHẬN/i.test(item.finalConclusion)
                          ? "bg-amber-50/90 text-amber-950 border-amber-300"
                          : "bg-emerald-50/90 text-emerald-950 border-emerald-200"
                      }`}>
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {item.overallStatus === "COMPLETED_FAIL" || /KHÔNG ĐẠT/i.test(item.finalConclusion) ? (
                            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                          ) : /TẠM CHẤP NHẬN/i.test(item.finalConclusion) ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                          )}
                          <div className="flex-1 min-w-0 leading-relaxed">
                            <strong className="text-slate-900 font-bold">
                              <span translate="no" className="notranslate">Kết luận thử nghiệm:</span>
                            </strong>{" "}
                            <span className="text-slate-800 break-words">{item.finalConclusion}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenConclusionModal(item)}
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-teal-700 border border-slate-200/80 shadow-3xs hover:shadow-2xs transition-all cursor-pointer shrink-0 ml-1"
                          title="Đánh giá / Chỉnh sửa kết luận chung"
                        >
                          <Pencil className="w-3.5 h-3.5 text-inherit" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleOpenConclusionModal(item)}
                          className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-[13px] font-black text-teal-800 bg-teal-50/90 hover:bg-teal-100 border border-teal-300 hover:border-teal-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-3xs hover:shadow-2xs active:scale-[0.99]"
                          title="Đánh giá kết luận thử nghiệm chung"
                        >
                          <Pencil className="w-4 h-4 text-teal-700 shrink-0" />
                          <span translate="no" className="notranslate">ĐÁNH GIÁ KẾT LUẬN CHUNG</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* PHẦN CHỈ ĐẠO CỦA CÁC CẤP QUẢN LÝ (MANAGEMENT DIRECTIVES) */}
                  {/* ------------------------------------------------------------- */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 block select-text">
                    {/* Danh sách chỉ đạo hiện có */}
                    {item.directives && item.directives.length > 0 && (
                      <div className="space-y-2 mb-2.5 w-full block">
                        <div className="text-[11px] text-amber-800 font-black flex items-center gap-1.5 uppercase select-none">
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span translate="no" className="notranslate"><T>CHỈ ĐẠO CỦA CÁC CẤP QUẢN LÝ:</T></span>
                        </div>
                        <div className="space-y-1.5 block max-h-56 overflow-y-auto pr-0.5">
                          {item.directives.map((dir) => {
                            const isExpanded = expandedDirectiveIds[dir.id] !== false;
                            const canManageDirective = isAdmin || currentUser?.role === UserRole.REVIEWER || Boolean(currentUser?.position && /trưởng|phó|quản lý|giám đốc|chỉ huy|supervisor|lead/i.test(currentUser.position));

                            if (!isExpanded) {
                              return (
                                <div 
                                  key={dir.id}
                                  data-directive-container="true"
                                  onClick={() => setExpandedDirectiveIds(prev => ({ ...prev, [dir.id]: true }))}
                                  className="bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/80 rounded-lg p-2 flex items-center justify-between text-[11px] text-amber-900 cursor-pointer transition-all select-none shadow-2xs active:scale-[0.99] gap-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-[11px] text-amber-950 block leading-tight break-words">
                                      <span translate="no" className="notranslate"><T>Chỉ đạo từ:</T> <span className="text-amber-900">{capitalizeWords(dir.author)}</span></span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 select-none">
                                    <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                                      <span translate="no" className="notranslate"><T>Xem chỉ đạo</T></span>
                                      <span className="text-[11px] leading-none">🛡️</span>
                                      <span className="text-[10px] text-amber-700">➔</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            const acknowledgesList = dir.acknowledges ? [...dir.acknowledges] : [];
                            if (acknowledgesList.length === 0 && dir.isAcknowledged) {
                              acknowledgesList.push({
                                by: dir.acknowledgedBy || "Người nhận",
                                at: dir.acknowledgedAt || dir.timestamp
                              });
                            }
                            const currentUserSignature = `${currentUser?.department || "Bộ phận"} - ${currentUser?.fullName || "Người nhận"}`;
                            const hasUserAcknowledged = acknowledgesList.some(itemAck => itemAck.by === currentUserSignature);

                            return (
                              <div key={dir.id} data-directive-container="true" className="bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 block text-[12px] leading-relaxed text-amber-950 shadow-2xs">
                                <div className="flex justify-between items-center text-[9.5px] text-slate-500 font-bold mb-1.5 select-none border-b border-amber-200/60 pb-1.5 gap-1.5">
                                  <span className="text-amber-900 font-extrabold flex items-center gap-1 text-[10.5px] min-w-0 truncate">
                                    <span translate="no" className="notranslate truncate"><T>Chỉ đạo từ:</T> {capitalizeWords(dir.author)}</span>
                                    <span className="text-[10px] leading-none shrink-0">🛡️</span>
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                    <span className="text-[9px] text-slate-500 font-mono font-medium whitespace-nowrap">{dir.timestamp}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedDirectiveIds(prev => ({ ...prev, [dir.id]: false }));
                                      }}
                                      className="text-[10px] text-amber-900 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-300/80 px-1.5 py-0.5 rounded border border-amber-300/80 font-sans cursor-pointer active:scale-95 transition-all font-black leading-none"
                                      title="Thu gọn"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                {editingDirectiveId === dir.id ? (
                                  <div className="mt-1.5 space-y-1.5">
                                    <textarea
                                      value={editingDirectiveText}
                                      onChange={(e) => setEditingDirectiveText(e.target.value)}
                                      className="w-full bg-white border border-amber-300 text-[12px] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans text-slate-800 resize-y"
                                      rows={2}
                                    />
                                    <div className="flex justify-end gap-1.5 select-none">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingDirectiveId(null);
                                          setEditingDirectiveText("");
                                        }}
                                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-sans font-black rounded-lg flex items-center gap-1 border-none cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                        <span translate="no" className="notranslate"><T>HỦY</T></span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const trimmed = editingDirectiveText.trim();
                                          if (!trimmed) return;
                                          handleSaveEditDirective(item.id, dir.id, trimmed);
                                        }}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-sans font-black rounded-lg flex items-center gap-1 border-none cursor-pointer"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span translate="no" className="notranslate"><T>LƯU</T></span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-start gap-2 my-1">
                                      <div className="block font-semibold text-slate-900 text-[12px] leading-relaxed flex-1 break-words">
                                        {renderTaggedText(dir.text)}
                                      </div>
                                      {canManageDirective && (
                                        <div className="flex gap-1 shrink-0 select-none items-center mt-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingDirectiveId(dir.id);
                                              setEditingDirectiveText(dir.text);
                                            }}
                                            className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer border-none bg-transparent p-0.5"
                                            title="Chỉnh sửa chỉ đạo"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDirective(item.id, dir.id)}
                                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent p-0.5"
                                            title="Xóa chỉ đạo"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action button & Acknowledgment tracker */}
                                    <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-amber-200/60">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleAcknowledgeDirective(item.id, dir.id)}
                                        className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-3xs ${
                                          hasUserAcknowledged
                                            ? "bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700"
                                            : "bg-amber-600 hover:bg-amber-700 text-white border border-amber-700"
                                        }`}
                                      >
                                        <span>🤝</span>
                                        <span translate="no" className="notranslate">
                                          {hasUserAcknowledged ? "ĐÃ TIẾP NHẬN" : "TIẾP NHẬN CHỈ ĐẠO"}
                                        </span>
                                      </button>

                                      {acknowledgesList.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAckDetails(prev => ({ ...prev, [dir.id]: !prev[dir.id] }))}
                                          className={`px-2 py-0.5 border rounded-lg text-[9.5px] font-sans font-extrabold flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                                            showAckDetails[dir.id]
                                              ? "bg-emerald-600 text-white border-emerald-600 shadow-3xs"
                                              : "bg-amber-100/90 hover:bg-amber-200 text-amber-900 border-amber-300/80"
                                          }`}
                                          title="Xem danh sách tiếp nhận"
                                        >
                                          <span>🤝</span>
                                          <span>{acknowledgesList.length}</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Danh sách người tiếp nhận (expandable) */}
                                    {showAckDetails[dir.id] && acknowledgesList.length > 0 && (
                                      <div className="mt-1.5 p-2 bg-white border border-emerald-200/80 rounded-lg text-[9.5px] text-slate-700 space-y-1 animate-fadeIn max-h-28 overflow-y-auto">
                                        <div className="font-extrabold text-emerald-800 text-[8.5px] uppercase tracking-wider pb-1 border-b border-slate-100 select-none flex justify-between items-center">
                                          <span translate="no" className="notranslate"><T>Danh Sách Tiếp Nhận:</T></span>
                                          <span className="text-slate-400 font-normal">({acknowledgesList.length})</span>
                                        </div>
                                        {acknowledgesList.map((ack, aIdx) => (
                                          <div key={aIdx} className="flex justify-between items-center gap-1.5 text-slate-700">
                                            <span className="font-semibold text-slate-800 truncate max-w-[170px]"><span translate="no" className="notranslate"><T>{ack.by}</T></span></span>
                                            <span className="text-slate-400 shrink-0 font-mono text-[8.5px] select-none">{ack.at}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Form ghi nhận chỉ đạo điều hành mới */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendDirective(item.id);
                      }} 
                      className="flex gap-2 items-center"
                    >
                      <div className="flex-1 flex items-center">
                        <MentionTextArea
                          users={users}
                          value={directivesInputMap[item.id] || ""}
                          onChange={(val) => setDirectivesInputMap(prev => ({ ...prev, [item.id]: val }))}
                          placeholder="Chỉ đạo của các cấp quản lý"
                          rows={1}
                          style={{ height: '32px', minHeight: '32px', maxHeight: '72px', resize: 'none' }}
                          onInput={(e) => {
                            const target = e.currentTarget;
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 72)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              e.currentTarget.form?.requestSubmit();
                            }
                          }}
                          className="block w-full bg-slate-50 border border-slate-200 text-[11px] rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 placeholder:text-[10px] font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all select-text overflow-y-auto thin-scrollbar leading-normal"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-4 text-[10px] text-white font-black flex items-center justify-center rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer uppercase shrink-0 h-[32px]"
                      >
                        <span translate="no" className="notranslate"><T>GỬI</T></span>
                      </button>
                    </form>
                  </div>

                </div>

                {/* ------------------------------------------------------------- */}
                {/* FOOTER ACTIONS CỦA BẢN TIN THỬ NGHIỆM */}
                {/* ------------------------------------------------------------- */}
                {(() => {
                  const canEditOrDelete = isAdmin || currentUser?.fullName === item.createdByName;
                  return (
                    <div className="bg-slate-50 border-t border-slate-100 px-2.5 py-2 flex justify-between items-center select-none text-[10px] font-semibold text-slate-600 gap-1.5 flex-nowrap rounded-b-2xl">
                      {/* Left: Quick Actions (Clone, Delete, Edit) */}
                      <div className="flex items-center gap-1 shrink-0 flex-nowrap whitespace-nowrap">
                        {/* Nút Nhân bản / Sao chép */}
                        <button
                          type="button"
                          onClick={() => handleCloneTrial(item)}
                          className="flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-110 active:scale-90 text-indigo-600 hover:text-indigo-800 border-none bg-transparent"
                          title="Nhân bản / Sao chép đợt thử nghiệm này (Kế thừa các bước & thông tin)"
                        >
                          <Copy className="w-[17px] h-[17px] stroke-[2.2px]" />
                        </button>

                        {canEditOrDelete && (
                          <>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmItem(item)}
                              className="flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-110 active:scale-90 text-rose-600 hover:text-rose-800 border-none bg-transparent"
                              title="Xóa đợt thử nghiệm"
                            >
                              <Trash2 className="w-[17px] h-[17px] stroke-[2.2px]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditTrialModalItem(item)}
                              className="flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-110 active:scale-90 text-blue-600 hover:text-blue-800 border-none bg-transparent"
                              title="Chỉnh sửa thông tin thử nghiệm"
                            >
                              <Edit className="w-[17px] h-[17px] stroke-[2.2px]" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Middle: Digital Clock count [hh:mm:ss] or [DD | hh:mm:ss] */}
                      {(() => {
                        const isDone = isCompletedPass || isCompletedFail;
                        const startMs = item.createdTimestamp || parseReportTimestamp(item.createdAt).getTime() || Date.now();
                        const endMs = isDone ? parseReportTimestamp(item.updatedAt).getTime() || Date.now() : Date.now();
                        const durationMs = Math.max(0, endMs - startMs);

                        const totalHours = Math.floor(durationMs / (1000 * 60 * 60));
                        const totalMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                        const totalSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

                        const isOver24h = totalHours >= 24;
                        const days = isOver24h ? Math.floor(totalHours / 24) : 0;
                        const remainingHours = isOver24h ? (totalHours % 24) : totalHours;

                        return (
                          <div 
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black font-sans leading-none shadow-3xs select-none border shrink-0 whitespace-nowrap flex-nowrap ${
                              isDone
                                ? (isCompletedPass 
                                    ? "bg-emerald-600 text-white border-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                                    : "bg-rose-600 text-white border-rose-700 shadow-[0_0_8px_rgba(225,29,72,0.3)]")
                                : isOver24h 
                                  ? "bg-amber-600 text-white border-amber-700 animate-pulse" 
                                  : "bg-blue-600 text-white border-blue-700 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                            }`}
                            title={isDone ? "Thời gian hoàn thành thử nghiệm" : "Thời gian thực hiện thử nghiệm"}
                          >
                            <span translate="no" className="notranslate font-sans font-black tracking-wide text-[10px] flex items-center gap-1">
                              {isCompletedPass && <span className="text-[11px] font-bold">✓</span>}
                              {isCompletedFail && <span className="text-[11px] font-bold">✕</span>}
                              {isOver24h ? (
                                <>
                                  <span>{days}D</span>
                                  <span className="mx-1 opacity-40 font-light select-none">|</span>
                                  <span>{String(remainingHours).padStart(2, "0")}:{String(totalMinutes).padStart(2, "0")}:{String(totalSeconds).padStart(2, "0")}</span>
                                </>
                              ) : (
                                <span>{String(totalHours).padStart(2, "0")}:{String(totalMinutes).padStart(2, "0")}:{String(totalSeconds).padStart(2, "0")}</span>
                              )}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Right: Comments, Likes, Badges */}
                      <div className="flex items-center gap-1.5 ml-auto shrink-0 flex-nowrap whitespace-nowrap">
                        {/* Comments */}
                        {(() => {
                          const commentCount = (item.comments?.length || item.commentsCount || 0);
                          return (
                            <button
                              type="button"
                              onClick={() => setCommentModalItem(item)}
                              className="flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-1.5 shrink-0 shadow-3xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap flex-nowrap text-slate-500 hover:text-blue-600"
                              title="Thảo luận / Góp ý thử nghiệm"
                            >
                              <MessageSquare className="w-3.5 h-3.5 stroke-[2.3px]" />
                              <span className="text-[10px] font-black font-sans leading-none">
                                <span translate="no" className="notranslate"><T>{commentCount}</T></span>
                              </span>
                            </button>
                          );
                        })()}

                        {/* Likes */}
                        {(() => {
                          const isLiked = item.likedBy?.includes(currentUser?.fullName || "") || false;
                          const likesCount = item.likedBy?.length || 0;

                          return (
                            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg py-0.5 px-1 shrink-0 shadow-3xs whitespace-nowrap flex-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleLikeTrial(item.id)}
                                className={`flex items-center justify-center p-0.5 transition-all hover:scale-115 active:scale-90 cursor-pointer border-none bg-transparent ${
                                  isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                                }`}
                                title={isLiked ? "Bỏ thích" : "Thích"}
                              >
                                <Heart className={`w-3.5 h-3.5 stroke-[2.3px] ${isLiked ? "fill-rose-500 text-rose-600" : ""}`} />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  if (likesCount > 0) {
                                    setLikesListModalItem(item);
                                  }
                                }}
                                disabled={likesCount === 0}
                                className={`text-[10px] font-black font-sans px-1 py-0.5 rounded cursor-pointer transition-all border-none leading-none ${
                                  likesCount > 0 
                                    ? "text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 hover:scale-105" 
                                    : "text-slate-400 bg-transparent cursor-default"
                                }`}
                                title={likesCount > 0 ? "Xem ai đã thích" : "Chưa có lượt thích"}
                              >
                                <span translate="no" className="notranslate"><T>{likesCount}</T></span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* Badges / Medal */}
                        {(() => {
                          const badgeCount = item.badges?.length || 0;
                          return (
                            <button
                              type="button"
                              onClick={() => setBadgeModalItem(item)}
                              className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg py-1 px-1.5 shrink-0 shadow-3xs transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap flex-nowrap text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                              title="Trao tặng hoặc xem Huy hiệu"
                            >
                              <span className="text-[13px] leading-none">🏅</span>
                              <span translate="no" className="notranslate text-[10px] font-black font-sans leading-none">
                                <T>{badgeCount}</T>
                              </span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL THẢO LUẬN / BÌNH LUẬN (COMMENTS MODAL) */}
      {/* ------------------------------------------------------------- */}
      {commentModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-black text-sm">
                  <span translate="no" className="notranslate">Thảo luận / Góp ý ({commentModalItem.code})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCommentModalItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div className="font-bold text-slate-800 line-clamp-2">{commentModalItem.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">{commentModalItem.productName} • {commentModalItem.factory}</div>
              </div>

              <div className="space-y-2">
                {(!commentModalItem.comments || commentModalItem.comments.length === 0) ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    Chưa có thảo luận nào. Hãy là người đầu tiên đóng góp ý kiến!
                  </div>
                ) : (
                  commentModalItem.comments.map((c) => (
                    <div key={c.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900">{c.author} {c.role && <span className="text-slate-500 font-normal">({c.role})</span>}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.timestamp}</span>
                      </div>
                      <div className="text-slate-700 leading-relaxed break-words">{renderTaggedText(c.text)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendComment(commentModalItem.id);
              }}
              className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={commentInputText}
                onChange={(e) => setCommentInputText(e.target.value)}
                placeholder="Nhập nội dung trao đổi, góp ý..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!commentInputText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span translate="no" className="notranslate">Gửi</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL DANH SÁCH NGƯỜI THÍCH (LIKES LIST MODAL) */}
      {/* ------------------------------------------------------------- */}
      {likesListModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-500 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-white" />
                <h3 className="font-black text-sm">
                  <span translate="no" className="notranslate">Lượt thích ({likesListModalItem.likedBy?.length || 0})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLikesListModalItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-60 overflow-y-auto space-y-2">
              {likesListModalItem.likedBy?.map((name, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-xs font-bold text-slate-800">
                  <span className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black">
                    {name.charAt(0)}
                  </span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL TRAO HUY HIỆU & DANH SÁCH HUY HIỆU (BADGE MODAL) */}
      {/* ------------------------------------------------------------- */}
      {badgeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏅</span>
                <h3 className="font-black text-sm">
                  <span translate="no" className="notranslate">Huy hiệu danh dự ({badgeModalItem.code})</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBadgeModalItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Existing Badges */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Huy hiệu đã nhận ({badgeModalItem.badges?.length || 0}):
                </div>
                {(!badgeModalItem.badges || badgeModalItem.badges.length === 0) ? (
                  <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 italic">
                    Chưa có huy hiệu nào được trao cho đợt thử nghiệm này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {badgeModalItem.badges.map((b, bIdx) => {
                      const badgeDef = [...GREEN_BADGES, ...RED_BADGES].find(x => x.id === b.id);
                      return (
                        <div key={bIdx} className="p-2.5 rounded-xl border flex items-center gap-3 bg-indigo-50/60 border-indigo-200">
                          <span className="text-2xl">{badgeDef?.icon || "🏅"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-black text-indigo-950 truncate">{b.name}</div>
                            <div className="text-[10px] text-slate-500">Trao bởi {b.giverName} • {b.timestamp}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Award New Badge Options */}
              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Trao tặng huy hiệu mới:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[...GREEN_BADGES.slice(0, 4), ...RED_BADGES.slice(0, 2)].map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => handleAwardBadge(badgeModalItem.id, bg)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all cursor-pointer flex items-center gap-2 group"
                    >
                      <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{bg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-800 truncate">{bg.name}</div>
                        <div className="text-[9px] text-indigo-600 font-semibold uppercase">Trao ngay ➔</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL CHỈNH SỬA THÔNG TIN THỬ NGHIỆM (EDIT TRIAL MODAL - OPTIMIZED LAYOUT) */}
      {/* ------------------------------------------------------------- */}
      {editTrialModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] sm:max-h-[90vh] flex flex-col my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    <span translate="no" className="notranslate">Chỉnh sửa thông tin thử nghiệm</span>
                  </h3>
                  <p className="text-[11px] text-blue-100/90 font-mono">
                    <span translate="no" className="notranslate">{editTrialModalItem.code}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditTrialModalItem(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Đóng modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Metadata Sub-bar (Read-only, saving valuable form space) */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span>
                  <span translate="no" className="notranslate">Người tạo: </span>
                  <strong className="text-slate-800 font-semibold">{editTrialModalItem.createdByName || "Hệ thống"}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <span translate="no" className="notranslate">Khởi tạo lúc: </span>
                  <span className="font-mono text-slate-700 font-medium">{editTrialModalItem.createdAt || "dd/mm/yy"}</span>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span translate="no" className="notranslate">4M1E1I</span>
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEditTrial(editTrialModalItem);
              }}
              onPaste={handleEditTrialPaste}
              className="p-3.5 sm:p-5 space-y-3.5 overflow-y-auto text-xs flex-1 overscroll-contain"
            >
              {/* Row 1: Phân hệ Thử nghiệm (TN-B2B vs TN-B2C) & Phân loại yếu tố 4M */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Phân hệ Thử nghiệm:</span> *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditTrialModalItem({ ...editTrialModalItem, trialType: "B2B" })}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
                        (editTrialModalItem.trialType || "B2B") === "B2B"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-blue-50"
                      }`}
                    >
                      <span>🏢</span>
                      <span translate="no" className="notranslate">TN-B2B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTrialModalItem({ ...editTrialModalItem, trialType: "B2C" })}
                      className={`py-2 px-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
                        editTrialModalItem.trialType === "B2C"
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-200"
                          : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-purple-50"
                      }`}
                    >
                      <span>🛍️</span>
                      <span translate="no" className="notranslate">TN-B2C</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Mã 4M (Phân loại yếu tố 4M1E1I):</span> *
                  </label>
                  <select
                    value={editTrialModalItem.category4M || "NGUYÊN VẬT LIỆU"}
                    onChange={(e: any) => setEditTrialModalItem({ ...editTrialModalItem, category4M: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-bold text-amber-900"
                  >
                    <option value="NGUYÊN VẬT LIỆU">NGUYÊN VẬT LIỆU (Material)</option>
                    <option value="MÁY MÓC">MÁY MÓC / KHUÔN (Machine)</option>
                    <option value="PHƯƠNG PHÁP">PHƯƠNG PHÁP (Method)</option>
                    <option value="CON NGƯỜI">CON NGƯỜI (Man)</option>
                    <option value="MÔI TRƯỜNG">MÔI TRƯỜNG (Environment)</option>
                    <option value="THÔNG TIN">THÔNG TIN (Information)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Tên đợt thử nghiệm & Tên sản phẩm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Tên / Mục đích thử nghiệm:</span> *
                  </label>
                  <input
                    type="text"
                    value={editTrialModalItem.title}
                    onChange={(e) => setEditTrialModalItem({ ...editTrialModalItem, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900 bg-white"
                    placeholder="Nhập tên đợt thử nghiệm..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Tên sản phẩm / Bán thành phẩm:</span> *
                  </label>
                  <input
                    type="text"
                    value={editTrialModalItem.productName}
                    onChange={(e) => setEditTrialModalItem({ ...editTrialModalItem, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900 bg-white"
                    placeholder="Nhập tên sản phẩm thử nghiệm..."
                    required
                  />
                </div>
              </div>

              {/* Row 3: Nhà máy / Chi nhánh & BP/ĐV phụ trách */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Nhà máy / Chi nhánh:</span> *
                  </label>
                  <select
                    value={editTrialModalItem.factory || ""}
                    onChange={(e) => {
                      const newFac = e.target.value;
                      const targetBranch = availableBranches.find(b => b.name === newFac || b.id === newFac);
                      const branchDepts = getDepartmentsForBranch(newFac);
                      const defaultDept = branchDepts.length > 0 ? branchDepts[0].name : "";
                      setEditTrialModalItem({
                        ...editTrialModalItem,
                        factory: newFac,
                        targetCompany: (targetBranch?.companyId || editTrialModalItem.targetCompany || "TPP") as "TPP" | "DNP",
                        workshop: defaultDept
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span translate="no" className="notranslate">BP/ĐV phụ trách:</span> *
                    <span className="text-[10px] text-blue-600 font-normal">Sổ ra từ chi nhánh</span>
                  </label>
                  <select
                    value={editTrialModalItem.workshop || ""}
                    onChange={(e) => setEditTrialModalItem({ ...editTrialModalItem, workshop: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
                  >
                    {getDepartmentsForBranch(editTrialModalItem.factory).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    {editTrialModalItem.workshop && !getDepartmentsForBranch(editTrialModalItem.factory).some(d => d.name === editTrialModalItem.workshop) && (
                      <option value={editTrialModalItem.workshop}>
                        {editTrialModalItem.workshop} (Hiện tại / Chi tiết)
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Row 4: Số Đề Nghị (ĐN) & Số lượng mẫu thử */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Số Đề Nghị (ĐN):</span>
                  </label>
                  <input
                    type="text"
                    value={editTrialModalItem.requestDocNo || ""}
                    onChange={(e) => setEditTrialModalItem({ ...editTrialModalItem, requestDocNo: e.target.value })}
                    placeholder="VD: ĐN-TN/2026/08-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Số lượng mẫu thử:</span>
                  </label>
                  <input
                    type="text"
                    value={editTrialModalItem.sampleQuantity || ""}
                    onChange={(e) => setEditTrialModalItem({ ...editTrialModalItem, sampleQuantity: e.target.value })}
                    placeholder="VD: 500 sản phẩm"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Hình ảnh đính kèm đợt thử nghiệm (Tối đa 2 ảnh - WebP 80-120KB) */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Camera className="w-4 h-4 text-blue-700" />
                    <span translate="no" className="notranslate">
                      <T>Hình ảnh đính kèm đợt thử nghiệm (Tối đa 2 ảnh):</T>
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ dán (Ctrl+V)</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {(editTrialModalItem.images?.length || 0)}/2 ảnh • WebP 80-120KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {editTrialModalItem.images?.map((imgUrl, imgIdx) => (
                    <div 
                      key={imgIdx} 
                      className="relative group w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 bg-slate-200 shadow-2xs shrink-0"
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Ảnh ${imgIdx + 1}`} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLightboxImages({
                            urls: editTrialModalItem.images || [],
                            index: imgIdx,
                            title: `Ảnh ${imgIdx + 1} - ${editTrialModalItem.title}`
                          });
                        }}
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                        title="Phóng to xem chi tiết"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = (editTrialModalItem.images || []).filter((_, idx) => idx !== imgIdx);
                          setEditTrialModalItem({
                            ...editTrialModalItem,
                            images: updated,
                            imageUrl: updated[0] || ""
                          });
                        }}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {(!editTrialModalItem.images || editTrialModalItem.images.length < 2) && (
                    <label className={`w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-3xs ${
                      isCompressingEditImages
                        ? "bg-slate-100 border-slate-300 text-slate-400 cursor-wait"
                        : "bg-white hover:bg-blue-50/70 border-slate-300 hover:border-blue-500 text-slate-500 hover:text-blue-700"
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple={!editTrialModalItem.images || editTrialModalItem.images.length === 0}
                        disabled={isCompressingEditImages}
                        onChange={handleEditTrialImageUpload}
                        className="hidden"
                      />
                      {isCompressingEditImages ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-[8.5px] font-bold">Nén...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 text-blue-600" />
                          <span className="text-[9px] font-bold leading-none text-center">
                            <span translate="no" className="notranslate"><T>+ Thêm ảnh</T></span>
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditTrialModalItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-all text-xs cursor-pointer"
                >
                  <span translate="no" className="notranslate">Hủy</span>
                </button>
                <button
                  type="submit"
                  disabled={isCompressingEditImages}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span translate="no" className="notranslate">Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL XÁC NHẬN XÓA THỬ NGHIỆM (DELETE CONFIRM MODAL) */}
      {/* ------------------------------------------------------------- */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 p-4 sm:p-5 space-y-3 sm:space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-sm text-slate-900">Xóa đợt thử nghiệm này?</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa đợt thử nghiệm <strong className="text-slate-800">{deleteConfirmItem.code}</strong> không? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteTrial(deleteConfirmItem.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL XÁC NHẬN BƯỚC TIẾN TRÌNH (ONE-TOUCH POPUP) */}
      {/* ------------------------------------------------------------- */}
      {activeStepModal && (() => {
        const targetStepData = activeStepModal.item.steps[activeStepModal.stepKey];
        const perm = checkUserStepPermission(currentUser, activeStepModal.item, activeStepModal.stepKey, targetStepData);
        const isCompleted = !!targetStepData?.isCompleted;
        const isOriginalCompleter = targetStepData?.completedBy === currentUser?.fullName;
        const canRevert = perm.isSuperAdmin || perm.allowed || isOriginalCompleter;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
              {/* Modal Header */}
              <div className="bg-teal-800 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                    {targetStepData.stepNumber}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base truncate">
                      <span translate="no" className="notranslate">
                        {isCompleted ? "Chi Tiết:" : "Xác Nhận:"} {targetStepData.name}
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-teal-200 truncate">
                      <span translate="no" className="notranslate">
                        BP/ĐV phụ trách: {targetStepData.roleResponsible}
                      </span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveStepModal(null)}
                  className="text-teal-200 hover:text-white text-xl font-bold p-1 shrink-0 leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body - Scrollable on mobile */}
              <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
                {/* Authorization Status Indicator Banner */}
                {perm.isSuperAdmin ? (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-2.5 flex items-center gap-2.5 text-indigo-900 text-[11px] shadow-3xs">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <strong className="text-indigo-950 font-bold">
                        <span translate="no" className="notranslate">Quyền Quản trị viên (Admin):</span>
                      </strong>{" "}
                      <span>
                        <span translate="no" className="notranslate">Có toàn quyền phê duyệt, xác nhận & hoàn tác công đoạn này.</span>
                      </span>
                    </div>
                  </div>
                ) : perm.allowed ? (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2.5 text-emerald-900 text-[11px] shadow-3xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-emerald-950 font-bold">
                        <span translate="no" className="notranslate">Phân quyền hợp lệ:</span>
                      </strong>{" "}
                      <span>
                        <span translate="no" className="notranslate">Bạn thuộc BP/ĐV phụ trách ({currentUser?.department || perm.roleName}) - Đủ điều kiện xác nhận.</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-xl p-3 flex flex-col gap-1 text-rose-950 text-[11px] shadow-3xs">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <span translate="no" className="notranslate">Chỉ nhân sự thuộc BP/ĐV phụ trách mới được xác nhận</span>
                      </span>
                    </div>
                    <div className="text-[10.5px] text-rose-700 leading-snug">
                      Công đoạn này do <strong>{targetStepData.roleResponsible}</strong> đảm nhiệm. Tài khoản hiện tại của bạn (<strong>{currentUser?.fullName || "Khách"}</strong> - <em>{currentUser?.department || "Chưa có phòng ban"}</em>) không có quyền xác nhận công đoạn này.
                    </div>
                    <div className="text-[10px] text-slate-500 italic mt-0.5">
                      👉 Vui lòng liên hệ nhân sự thuộc <strong>{targetStepData.roleResponsible}</strong> hoặc Quản trị viên (Admin) để xác nhận.
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 text-sm">{activeStepModal.item.title}</div>
                  <div className="text-slate-500 mt-1 flex items-center gap-2 flex-wrap text-xs">
                    <span>Mã đợt: <strong className="text-slate-800 font-bold">{activeStepModal.item.code}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>{activeStepModal.item.factory}</span>
                    {activeStepModal.item.requestDocNo && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>Số ĐN: <strong className="text-blue-900 font-bold font-mono">{activeStepModal.item.requestDocNo}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                {/* Đánh giá kết quả công đoạn (3 trạng thái: ĐẠT, TẠM CHẤP NHẬN, KHÔNG ĐẠT) */}
                {(() => {
                  const currentStepName = targetStepData.name || "";
                  const isDoc = isDocStep(activeStepModal.stepKey, currentStepName);
                  
                  return (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-800 mb-2">
                        <span translate="no" className="notranslate">
                          {isDoc ? "Trạng Thái Hồ Sơ / Thủ Tục:" : "Đánh Giá Kết Quả Công Đoạn:"}
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Lựa chọn 1: ĐẠT / DUYỆT */}
                        <button
                          type="button"
                          disabled={!perm.allowed && !isCompleted}
                          onClick={() => setStepResultStatusInput("PASS")}
                          className={`py-2 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            stepResultStatusInput === "PASS"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-inherit" />
                          <span translate="no" className="notranslate text-center text-[11px] leading-tight">
                            {isDoc ? "ĐÃ DUYỆT" : "ĐẠT"}
                          </span>
                        </button>

                        {/* Lựa chọn 2: TẠM CHẤP NHẬN / ĐIỀU CHỈNH */}
                        <button
                          type="button"
                          disabled={!perm.allowed && !isCompleted}
                          onClick={() => setStepResultStatusInput("CONDITIONAL")}
                          className={`py-2 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            stepResultStatusInput === "CONDITIONAL"
                              ? "bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-200"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-300"
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4 text-inherit" />
                          <span translate="no" className="notranslate text-center text-[11px] leading-tight">
                            {isDoc ? "ĐIỀU CHỈNH" : "TẠM CHẤP NHẬN"}
                          </span>
                        </button>

                        {/* Lựa chọn 3: KHÔNG ĐẠT / HỦY */}
                        <button
                          type="button"
                          disabled={!perm.allowed && !isCompleted}
                          onClick={() => setStepResultStatusInput("FAIL")}
                          className={`py-2 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            stepResultStatusInput === "FAIL"
                              ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300"
                          }`}
                        >
                          <XCircle className="w-4 h-4 text-inherit" />
                          <span translate="no" className="notranslate text-center text-[11px] leading-tight">
                            {isDoc ? "TỪ CHỐI/HỦY" : "KHÔNG ĐẠT"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Mã số chứng từ / Số ĐN / Số LSX */}
                {(() => {
                  const isStep1 = activeStepModal.stepKey === "step1_request" || targetStepData.stepNumber === "1" || /đn|đề nghị/i.test(targetStepData.name || "");
                  const isStep2 = activeStepModal.stepKey === "step2_plan" || targetStepData.stepNumber === "2" || /lsx|lệnh/i.test(targetStepData.name || "");

                  return (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        <span translate="no" className="notranslate">
                          {isStep1 
                            ? "Số Đề Nghị (Số ĐN):" 
                            : isStep2 
                            ? "Số Lệnh Sản Xuất (Số LSX):" 
                            : "Mã số / Số phiếu liên quan (tuỳ chọn):"}
                        </span>
                      </label>
                      <input
                        type="text"
                        disabled={!perm.allowed && !isCompleted}
                        value={customCodeInput}
                        onChange={(e) => setCustomCodeInput(e.target.value)}
                        placeholder={
                          isStep1 
                            ? "Nhập số ĐN, VD: ĐN-TN/2026/08-01 hoặc TN1235-2026..." 
                            : isStep2 
                            ? "Nhập số LSX thử, VD: LSX-T992..." 
                            : "Mã phiếu, biên bản kiểm tra..."
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono text-xs"
                      />
                    </div>
                  );
                })()}

                {/* Notes Input */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Ghi chú thực hiện / Thông số kỹ thuật (tuỳ chọn):</span>
                  </label>
                  <textarea
                    disabled={!perm.allowed && !isCompleted}
                    value={stepNoteInput}
                    onChange={(e) => setStepNoteInput(e.target.value)}
                    rows={3}
                    placeholder="Ghi chú chi tiết thông số, nhiệt độ, kết quả test..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Current user auto-stamp indicator */}
                <div className="flex items-center gap-2 text-slate-500 text-[11px] bg-slate-100 p-2.5 rounded-lg">
                  <UserIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>
                    <span translate="no" className="notranslate">Người xác nhận:</span> <strong>{currentUser?.fullName || "Chuyên viên"}</strong> ({currentUser?.position || currentUser?.department || "BP/ĐV"})
                  </span>
                </div>
              </div>

              {/* Modal Actions - Sticky bottom footer */}
              <div className="bg-slate-50 px-4 py-3 sm:px-5 sm:py-3 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
                {isCompleted ? (
                  canRevert ? (
                    <button
                      type="button"
                      onClick={() => handleRevertStep(activeStepModal.item, activeStepModal.stepKey)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span translate="no" className="notranslate">Hoàn tác bước này</span>
                    </button>
                  ) : (
                    <div className="text-[10px] text-slate-400 italic">
                      <span translate="no" className="notranslate">Chỉ Admin hoặc BP phụ trách mới được hoàn tác</span>
                    </div>
                  )
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStepModal(null)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer transition-colors"
                  >
                    <span translate="no" className="notranslate">Đóng</span>
                  </button>

                  <button
                    type="button"
                    disabled={!perm.allowed}
                    onClick={() => handleConfirmStep(activeStepModal.item, activeStepModal.stepKey)}
                    className={`px-4 sm:px-5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      perm.allowed
                        ? "bg-teal-700 hover:bg-teal-800 text-white cursor-pointer active:scale-95"
                        : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-75"
                    }`}
                    title={perm.allowed ? "Xác nhận hoàn thành công đoạn này" : `Chỉ nhân sự thuộc ${targetStepData.roleResponsible} hoặc Admin mới có quyền xác nhận`}
                  >
                    {perm.allowed ? <Check className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span translate="no" className="notranslate">
                      {perm.allowed ? "Xác Nhận Hoàn Thành" : "Không Có Quyền Xác Nhận"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* MODAL TẠO ĐỢT THỬ NGHIỆM MỚI */}
      {/* ------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92dvh] sm:max-h-[90vh] flex flex-col my-auto">
            {/* Header */}
            <div className="bg-teal-800 text-white px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-teal-200" />
                <h3 className="font-bold text-sm sm:text-base">
                  <span translate="no" className="notranslate">Tạo Đợt Thử Nghiệm Mới (4M1E1I)</span>
                </h3>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-teal-200 hover:text-white text-xl font-bold p-1 leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTrial} className="p-3.5 sm:p-5 space-y-3 sm:space-y-3.5 overflow-y-auto text-xs flex-1 overscroll-contain">
              {/* Inherited Clone Banner */}
              {clonedFromTrial && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-3xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-3xs">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-[11px]">
                      <div className="font-bold text-indigo-950 truncate">
                        <span translate="no" className="notranslate">Kế thừa quy trình từ:</span> {clonedFromTrial.title}
                      </div>
                      <div className="text-[10px] text-indigo-700">
                        <span translate="no" className="notranslate">
                          Đã sao chép cấu trúc {getItemStepList(clonedFromTrial).length} bước thử nghiệm & toàn bộ BP/ĐV phụ trách tương ứng.
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setClonedFromTrial(null);
                      if (showToast) showToast("Đã chuyển về quy trình khởi tạo tiêu chuẩn mặc định!");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 text-[10.5px] font-bold shrink-0 cursor-pointer transition-all active:scale-95 shadow-3xs"
                    title="Hủy kế thừa và chuyển về mẫu mặc định"
                  >
                    <span translate="no" className="notranslate">Hủy kế thừa</span>
                  </button>
                </div>
              )}

              {/* Phân hệ Thử nghiệm (TN-B2B vs TN-B2C) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <span translate="no" className="notranslate">Phân hệ Thử Nghiệm: *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTrialType("B2B")}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
                      newTrialType === "B2B"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-200"
                        : "bg-amber-50/50 text-slate-700 border-amber-200 hover:bg-blue-50"
                    }`}
                  >
                    <span>🏢</span>
                    <span translate="no" className="notranslate">TN-B2B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTrialType("B2C")}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
                      newTrialType === "B2C"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-200"
                        : "bg-amber-50/50 text-slate-700 border-amber-200 hover:bg-purple-50"
                    }`}
                  >
                    <span>🛍️</span>
                    <span translate="no" className="notranslate">TN-B2C</span>
                  </button>
                </div>
              </div>

              {/* Tên đợt thử nghiệm, Tên sản phẩm & Phân loại yếu tố 4M */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Tên / Mục đích thử nghiệm: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Thử nghiệm hạt nhựa PET tái sinh 20% cho Chai 500ml..."
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-amber-50/40 text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Tên sản phẩm / Bán thành phẩm: *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    placeholder="VD: Chai Pet 500ml, Nắp 28mm, Thùng rác 60L..."
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-amber-50/40 text-slate-900 font-medium placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Phân loại yếu tố 4M:</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-semibold text-slate-800"
                  >
                    <option value="NGUYÊN VẬT LIỆU">NGUYÊN VẬT LIỆU (Material)</option>
                    <option value="MÁY MÓC">MÁY MÓC / KHUÔN (Machine)</option>
                    <option value="PHƯƠNG PHÁP">PHƯƠNG PHÁP (Method)</option>
                    <option value="CON NGƯỜI">CON NGƯỜI (Man)</option>
                    <option value="MÔI TRƯỜNG">MÔI TRƯỜNG (Environment)</option>
                    <option value="THÔNG TIN">THÔNG TIN (Information)</option>
                  </select>
                </div>
              </div>

              {/* Nhà máy / Chi nhánh & BP/ĐV phụ trách */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    <span translate="no" className="notranslate">Nhà máy / Chi nhánh: *</span>
                  </label>
                  <select
                    value={newFactory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewFactory(val);
                      const targetBranch = availableBranches.find(b => b.name === val || b.id === val);
                      if (targetBranch?.companyId) {
                        setNewCompany(targetBranch.companyId as "TPP" | "DNP");
                      }
                      const depts = getDepartmentsForBranch(val);
                      if (depts.length > 0) {
                        const prodOrQc = depts.find(d => /xưởng|sản xuất|chất lượng|kỹ thuật/i.test(d.name)) || depts[0];
                        setNewWorkshop(prodOrQc.name);
                      }
                    }}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-amber-50/40 font-semibold text-slate-800"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span translate="no" className="notranslate">BP/ĐV phụ trách: *</span>
                    <span className="text-[10px] text-teal-600 font-normal">Sổ ra từ chi nhánh</span>
                  </label>
                  <select
                    value={newWorkshop}
                    onChange={(e) => setNewWorkshop(e.target.value)}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-amber-50/40 font-semibold text-slate-800"
                  >
                    {getDepartmentsForBranch(newFactory).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                    <option value="CUSTOM_OPTION">➕ Nhập BP/ĐV khác...</option>
                  </select>
                  {newWorkshop === "CUSTOM_OPTION" && (
                    <input
                      type="text"
                      placeholder="Nhập tên Bộ phận / Đơn vị..."
                      value={customWorkshopInput}
                      onChange={(e) => setCustomWorkshopInput(e.target.value)}
                      className="w-full mt-1.5 px-3 py-1.5 border border-teal-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-50/50 text-xs font-semibold"
                    />
                  )}
                </div>
              </div>

              {/* Mã số Đề nghị (tuỳ chọn) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <span translate="no" className="notranslate">Mã số Đề Nghị (tuỳ chọn):</span>
                </label>
                <input
                  type="text"
                  value={newReqDocNo}
                  onChange={(e) => setNewReqDocNo(e.target.value)}
                  placeholder="VD: ĐN-TN-08/26..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Đính kèm hình ảnh mẫu thử nghiệm (Tối đa 2 ảnh - Nhỏ gọn, tối ưu di động) */}
              <div onPaste={handleNewTrialPaste}>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                    <span translate="no" className="notranslate">Hình ảnh mẫu / SP thử nghiệm (Tối đa 2 ảnh):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Hỗ trợ dán (Ctrl+V)</span>
                </label>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Danh sách ảnh đã đính kèm */}
                  {newImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-teal-400 bg-slate-100 shrink-0 shadow-3xs">
                      <img 
                        src={imgUrl} 
                        alt={`Ảnh mẫu ${idx + 1}`} 
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxImages({ urls: newImages, index: idx, title: "Ảnh mẫu thử nghiệm" })}
                      />
                      <button
                        type="button"
                        onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow cursor-pointer transition-all active:scale-90"
                        title="Xóa ảnh này"
                      >
                        <X className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                    </div>
                  ))}

                  {/* Nút thêm ảnh */}
                  {newImages.length < 2 && (
                    <label 
                      htmlFor="new-trial-image-upload" 
                      className={`h-14 px-3 border border-dashed rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs font-semibold ${
                        isCompressingNewImages
                          ? "bg-slate-100 border-slate-300 text-slate-400 cursor-wait"
                          : "bg-teal-50/50 hover:bg-teal-100/60 border-teal-400 text-teal-800 active:scale-95"
                      }`}
                    >
                      <input
                        id="new-trial-image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        disabled={isCompressingNewImages}
                        onChange={handleNewTrialImageUpload}
                        className="hidden"
                      />
                      {isCompressingNewImages ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          <span translate="no" className="notranslate">Đang nén WebP...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Camera className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span translate="no" className="notranslate">
                            {newImages.length === 0 ? "Thêm ảnh (Tối đa 2)" : "Thêm ảnh thứ 2"}
                          </span>
                        </span>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Ghi chú khởi tạo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  <span translate="no" className="notranslate">Ghi chú khởi tạo bước 1 (ĐN thử nghiệm):</span>
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú yêu cầu kỹ thuật, tiêu chuẩn test..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  <span translate="no" className="notranslate">Hủy bỏ</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span translate="no" className="notranslate">Khởi Tạo Tiến Trình</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL TÙY CHỈNH / THÊM / XÓA / SỬA BƯỚC TIẾN TRÌNH */}
      {/* ------------------------------------------------------------- */}
      {customizingItem && (
        <StepCustomizerModal
          item={customizingItem}
          isOpen={true}
          branches={availableBranches}
          departments={availableDepartments}
          onClose={() => setCustomizingItem(null)}
          onSave={(updatedItem) => {
            const updated = trialItems.map((curr) =>
              curr.id === updatedItem.id ? updatedItem : curr
            );
            saveItems(updated);
            setCustomizingItem(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL ĐÁNH GIÁ KẾT LUẬN THỬ NGHIỆM CHUNG */}
      {/* ------------------------------------------------------------- */}
      {conclusionModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="bg-teal-800 text-white px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-200" />
                <h3 className="font-bold text-sm sm:text-base">
                  <span translate="no" className="notranslate">Đánh Giá Kết Luận Thử Nghiệm Chung</span>
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setConclusionModalItem(null)}
                className="text-teal-200 hover:text-white text-xl font-bold p-1 leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              {/* Context info banner */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 text-sm">
                  <span translate="no" className="notranslate">{conclusionModalItem.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 flex-wrap text-[11px]">
                  <span>
                    <span translate="no" className="notranslate">Mã đợt:</span> <strong>{conclusionModalItem.code}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <span translate="no" className="notranslate">Phụ trách chung:</span> <strong>{conclusionModalItem.createdByName}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <span translate="no" className="notranslate">Sản phẩm:</span> <strong>{conclusionModalItem.productName}</strong>
                  </span>
                </div>
              </div>

              {/* 3 Đánh giá trạng thái: ĐẠT / TẠM CHẤP NHẬN / KHÔNG ĐẠT */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  <span translate="no" className="notranslate">Lựa Chọn Đánh Giá Kết Quả:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* ĐẠT */}
                  <button
                    type="button"
                    onClick={() => handleSelectConclusionStatus("PASS")}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      conclusionStatusInput === "PASS"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:border-emerald-300"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-inherit" />
                    <span translate="no" className="notranslate text-center text-xs font-black">
                      ĐẠT CHUẨN
                    </span>
                    <span className="text-[9.5px] opacity-90 text-center font-normal">
                      <span translate="no" className="notranslate">Đạt kỹ thuật</span>
                    </span>
                  </button>

                  {/* TẠM CHẤP NHẬN */}
                  <button
                    type="button"
                    onClick={() => handleSelectConclusionStatus("CONDITIONAL")}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      conclusionStatusInput === "CONDITIONAL"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-200"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:border-amber-300"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-inherit" />
                    <span translate="no" className="notranslate text-center text-xs font-black">
                      TẠM CHẤP NHẬN
                    </span>
                    <span className="text-[9.5px] opacity-90 text-center font-normal">
                      <span translate="no" className="notranslate">Theo dõi thêm</span>
                    </span>
                  </button>

                  {/* KHÔNG ĐẠT */}
                  <button
                    type="button"
                    onClick={() => handleSelectConclusionStatus("FAIL")}
                    className={`py-2.5 px-2 rounded-xl font-bold text-xs border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      conclusionStatusInput === "FAIL"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-200"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300"
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-inherit" />
                    <span translate="no" className="notranslate text-center text-xs font-black">
                      KHÔNG ĐẠT
                    </span>
                    <span className="text-[9.5px] opacity-90 text-center font-normal">
                      <span translate="no" className="notranslate">Cần hiệu chỉnh</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Textarea nhập nội dung kết luận */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  <span translate="no" className="notranslate">Nội Dung Kết Luận & Hướng Dẫn Thực Hiện: *</span>
                </label>
                <textarea
                  value={conclusionTextInput}
                  onChange={(e) => setConclusionTextInput(e.target.value)}
                  rows={3}
                  placeholder="Nhập nội dung kết luận thử nghiệm, điều kiện sản xuất hoặc yêu cầu cải tiến..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 leading-relaxed"
                />
              </div>

              {/* Người xác nhận */}
              <div className="flex items-center gap-2 text-slate-500 text-[11px] bg-slate-100 p-2.5 rounded-lg">
                <UserIcon className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  <span translate="no" className="notranslate">Người đánh giá kết luận:</span>{" "}
                  <strong>{currentUser?.fullName || conclusionModalItem.createdByName}</strong>{" "}
                  ({currentUser?.position || "Phụ trách thử nghiệm"})
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-4 py-3 sm:px-5 sm:py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConclusionModalItem(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                <span translate="no" className="notranslate">Hủy bỏ</span>
              </button>
              <button
                type="button"
                onClick={handleSaveConclusion}
                className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span translate="no" className="notranslate">Lưu Kết Luận</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL LIGHTBOX XEM ẢNH FULL-SCREEN (ZOOM & SLIDESHOW) */}
      {/* ------------------------------------------------------------- */}
      {lightboxImages && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => {
            setLightboxImages(null);
            setLightboxZoom(1);
          }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm sm:text-base text-slate-200 truncate max-w-xs sm:max-w-md">
                {lightboxImages.title}
              </span>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-mono">
                {lightboxImages.index + 1} / {lightboxImages.urls.length}
              </span>
            </div>

            {/* Controls: Zoom & Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom(prev => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom(1)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Kích thước gốc"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxImages(null);
                  setLightboxZoom(1);
                }}
                className="p-2 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer ml-2"
                title="Đóng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div 
            className="relative flex-1 flex items-center justify-center overflow-hidden my-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {lightboxImages.urls.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setLightboxImages(prev => {
                    if (!prev) return null;
                    const nextIdx = (prev.index - 1 + prev.urls.length) % prev.urls.length;
                    return { ...prev, index: nextIdx };
                  });
                  setLightboxZoom(1);
                }}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
                title="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="max-w-full max-h-full flex items-center justify-center p-2 overflow-auto">
              <img
                src={lightboxImages.urls[lightboxImages.index]}
                alt="Ảnh đính kèm"
                style={{ transform: `scale(${lightboxZoom})`, transition: "transform 0.15s ease" }}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Next Button */}
            {lightboxImages.urls.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setLightboxImages(prev => {
                    if (!prev) return null;
                    const nextIdx = (prev.index + 1) % prev.urls.length;
                    return { ...prev, index: nextIdx };
                  });
                  setLightboxZoom(1);
                }}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer"
                title="Ảnh tiếp theo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {lightboxImages.urls.length > 1 && (
            <div className="flex items-center justify-center gap-2 z-10 py-1" onClick={(e) => e.stopPropagation()}>
              {lightboxImages.urls.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setLightboxImages(prev => prev ? { ...prev, index: i } : null);
                    setLightboxZoom(1);
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    i === lightboxImages.index ? "border-teal-400 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={u} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
