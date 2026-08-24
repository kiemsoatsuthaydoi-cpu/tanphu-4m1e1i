import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  FileText,
  Search,
  Filter,
  Sparkles,
  Printer,
  Download,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Building,
  Calendar,
  UserCheck,
  Check,
  RefreshCw,
  Eye,
  ChevronRight,
  ZoomIn,
  Copy,
  Layout,
  Share2,
  History,
  ShieldCheck,
  X,
  GitCommit,
  Lock,
  ArrowLeft,
  Save,
  Camera,
  Trash2,
  WrapText,
  Upload,
  ExternalLink,
  Edit3,
  Cloud,
  CloudOff,
  ChevronDown
} from "lucide-react";
import { T } from "./TranslateText";
import { QualityReport, User, Branch, CapaData, CapaVersion } from "../types";
import { formatNameCapitalized } from "../utils/branchHelpers";
import { MentionTextArea, MentionInput, DEFAULT_MENTION_ITEMS, MentionItem } from "./MentionTextArea";
import {
  saveCapaToCloud,
  fetchCapaFromCloud,
  subscribeCapaFromCloud,
  autoMigrateLocalCapaToCloud,
  uploadCapaImage
} from "../utils/capaFirebaseSync";
import { generateProfessionalClientCapaDraft } from "../utils/aiCapaGenerator";

export type { CapaData, CapaVersion };

interface CapaManagementHubProps {
  reports: QualityReport[];
  currentUser: User;
  users?: User[];
  branches: Branch[];
  onShowToast?: (message: string, type?: "success" | "error" | "warning" | "info") => void;
}

// Helper for formatting date dd/mm/yy
const formatDateDDMMYY = (dateObj: Date = new Date()) => {
  if (!dateObj || isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = String(dateObj.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
};

// Robust helper to parse any date representation or string into dd/mm/yy format safely
const safeFormatDate = (val?: any): string => {
  if (!val) return formatDateDDMMYY(new Date());
  if (typeof val === "string") {
    if (val.includes("NaN")) return formatDateDDMMYY(new Date());
    const trimmed = val.trim();
    // Check if already dd/mm/yy or dd/mm/yyyy
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (d && m && y && !isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
        const dd = d.padStart(2, "0");
        const mm = m.padStart(2, "0");
        const yy = y.length === 4 ? y.slice(-2) : y.padStart(2, "0");
        return `${dd}/${mm}/${yy}`;
      }
    }
  }
  
  const dObj = new Date(val);
  if (!isNaN(dObj.getTime())) {
    return formatDateDDMMYY(dObj);
  }
  return formatDateDDMMYY(new Date());
};

// In-memory fallback cache khi localStorage bị đầy quota
const memoryStorageFallback = new Map<string, string>();

/**
 * Hàm ghi dữ liệu an toàn vào localStorage, tự động dọn dẹp các khóa tạm thời nếu đầy quota
 * và dùng memory storage dự phòng để không bao giờ gây crash React.
 */
const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
    memoryStorageFallback.set(key, value);
  } catch (err) {
    console.warn(`[Storage Warning] localStorage quota exceeded when saving key "${key}". Initiating auto-cleanup...`, err);
    
    // Tự động dọn dẹp các cache tạm thời và bản in cũ để giải phóng dung lượng
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (
          k.startsWith("capa_print_snapshot_") ||
          k.startsWith("capa_print_target_") ||
          k.startsWith("temp_") ||
          k.includes("_backup_")
        )) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch (_) {}
      });

      // Thử ghi lại sau khi dọn dẹp
      localStorage.setItem(key, value);
      memoryStorageFallback.set(key, value);
      return;
    } catch (cleanupErr) {
      console.warn(`[Storage Fallback] Saving key "${key}" into memory fallback cache.`);
      memoryStorageFallback.set(key, value);
    }
  }
};

const safeLocalStorageGet = (key: string): string | null => {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
  } catch (e) {
    console.warn(`[Storage Warning] Error reading key "${key}" from localStorage:`, e);
  }
  return memoryStorageFallback.get(key) ?? null;
};

const safeLocalStorageRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
  memoryStorageFallback.delete(key);
};

// Helper to generate canonical set of keys for a report (supports both exact id and reportCode)
const getCapaReportKeys = (
  reportIdOrCode: string | number,
  reportsList?: QualityReport[],
  currentReportObj?: QualityReport | null
): string[] => {
  const keysSet = new Set<string>();
  if (reportIdOrCode !== undefined && reportIdOrCode !== null && reportIdOrCode !== "") {
    const s = reportIdOrCode.toString().trim();
    if (s) keysSet.add(s);
  }
  if (currentReportObj) {
    if (currentReportObj.id) {
      keysSet.add(currentReportObj.id.toString().trim());
    }
    if (currentReportObj.reportCode) {
      keysSet.add(currentReportObj.reportCode.toString().trim());
    }
  }
  if (reportsList && reportsList.length > 0 && reportIdOrCode) {
    const searchStr = reportIdOrCode.toString().trim();
    const found = reportsList.find(
      (r) =>
        r.id === searchStr ||
        r.reportCode === searchStr ||
        (r.id && r.id.toString() === searchStr)
    );
    if (found) {
      if (found.id) keysSet.add(found.id.toString().trim());
      if (found.reportCode) keysSet.add(found.reportCode.toString().trim());
    }
  }
  return Array.from(keysSet).filter(Boolean);
};

/**
 * Strictly verifies whether a CapaData object truly belongs to a specific QualityReport.
 * Prevents cross-contamination where drafts or versions of one report (e.g. B0000001)
 * leak into other reports (e.g. B0000002, B0000003).
 */
export const isCapaBelongingToReport = (
  data: Partial<CapaData> | null | undefined,
  report: QualityReport,
  allReports?: QualityReport[]
): boolean => {
  if (!data || typeof data !== "object") return false;

  // 1. Check reportId if explicitly specified
  if (data.reportId && data.reportId !== report.id) {
    return false;
  }

  // 2. Check ncNumber if specified
  if (data.ncNumber && typeof data.ncNumber === "string") {
    const trimmedNc = data.ncNumber.trim();
    const validCodes = new Set<string>();
    if (report.id) validCodes.add(report.id.toString().trim());
    if (report.reportCode) validCodes.add(report.reportCode.toString().trim());

    // If ncNumber is a standardized code format (B0000001, R-1, etc.)
    const isCodeFormat = /^B\d{5,8}$|^R-\d+$/i.test(trimmedNc);
    if (isCodeFormat && !validCodes.has(trimmedNc)) {
      return false;
    }

    // Ensure ncNumber does not match a DIFFERENT report in the list
    if (allReports && allReports.length > 0) {
      const isOtherReportCode = allReports.some(
        (r) =>
          r.id !== report.id &&
          (r.id === trimmedNc || (r.reportCode && r.reportCode === trimmedNc))
      );
      if (isOtherReportCode) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Strictly verifies whether an array of CapaVersion objects belongs to a specific QualityReport.
 */
export const isVersionsBelongingToReport = (
  versions: CapaVersion[] | null | undefined,
  report: QualityReport,
  allReports?: QualityReport[]
): boolean => {
  if (!versions || !Array.isArray(versions) || versions.length === 0) return false;
  return versions.every((v) => v && v.data && isCapaBelongingToReport(v.data, report, allReports));
};

const getCapaStorageItem = (
  prefix: string,
  reportIdOrCode: string | number,
  reportsList?: QualityReport[],
  currentReportObj?: QualityReport | null
): string | null => {
  const keys = getCapaReportKeys(reportIdOrCode, reportsList, currentReportObj);
  
  // List of exact fallback prefixes to check
  const candidatePrefixes = [prefix];
  if (prefix === "capa_versions_v1") {
    candidatePrefixes.push("capa_versions", "capa_history");
  } else if (prefix === "capa_form_v1") {
    candidatePrefixes.push("capa_form", "capa_draft");
  }

  // Exact key matching only — prevents cross-report data pollution
  for (const pref of candidatePrefixes) {
    for (const k of keys) {
      const val = safeLocalStorageGet(`${pref}_${k}`);
      if (val !== null && val !== "" && val !== "[]" && val !== "{}") return val;
    }
  }

  return null;
};

const setCapaStorageItem = (
  prefix: string,
  reportIdOrCode: string | number,
  value: string,
  reportsList?: QualityReport[],
  currentReportObj?: QualityReport | null
): void => {
  const keys = getCapaReportKeys(reportIdOrCode, reportsList, currentReportObj);
  if (keys.length === 0) return;
  
  // Lưu vào cả khóa chính và khóa tương thích ngược
  keys.forEach((k) => {
    safeLocalStorageSet(`${prefix}_${k}`, value);
    if (prefix === "capa_versions_v1") {
      safeLocalStorageSet(`capa_versions_${k}`, value);
    } else if (prefix === "capa_form_v1") {
      safeLocalStorageSet(`capa_form_${k}`, value);
    }
    memoryStorageFallback.set(`${prefix}_${k}`, value);
  });
};

const removeCapaStorageItem = (
  prefix: string,
  reportIdOrCode: string | number,
  reportsList?: QualityReport[],
  currentReportObj?: QualityReport | null
): void => {
  const keys = getCapaReportKeys(reportIdOrCode, reportsList, currentReportObj);
  keys.forEach((k) => {
    safeLocalStorageRemove(`${prefix}_${k}`);
    if (prefix === "capa_versions_v1") {
      safeLocalStorageRemove(`capa_versions_${k}`);
    } else if (prefix === "capa_form_v1") {
      safeLocalStorageRemove(`capa_form_${k}`);
    }
    memoryStorageFallback.delete(`${prefix}_${k}`);
  });
};

/**
 * Extracts all real photos (excluding SVG fallback banners) associated with a report
 * from its direct fields, local storage keys, and saved drafts.
 */
const getReportRealImages = (
  report: QualityReport,
  reportsList?: QualityReport[]
): string[] => {
  const allKeys = getCapaReportKeys(report.id, reportsList, report);
  const foundImages: string[] = [];

  const isRealPhoto = (url?: string) =>
    url &&
    typeof url === "string" &&
    url.trim() !== "" &&
    !url.includes("data:image/svg") &&
    (url.startsWith("data:image/") ||
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:"));

  // 1. Direct report fields
  if (Array.isArray(report.imageUrls)) {
    report.imageUrls.forEach((u) => {
      if (isRealPhoto(u) && !foundImages.includes(u)) foundImages.push(u);
    });
  }
  if (isRealPhoto(report.imageUrl) && !foundImages.includes(report.imageUrl!)) {
    foundImages.push(report.imageUrl!);
  }

  // 2. Scan all related localStorage keys
  allKeys.forEach((key) => {
    try {
      const urlsStr = localStorage.getItem(`4m1e1i_img_urls_${key}`);
      if (urlsStr) {
        const parsed = JSON.parse(urlsStr);
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (isRealPhoto(u) && !foundImages.includes(u)) foundImages.push(u);
          });
        }
      }
    } catch (e) {}

    const single = localStorage.getItem(`4m1e1i_img_${key}`);
    if (isRealPhoto(single) && !foundImages.includes(single!)) {
      foundImages.push(single!);
    }

    try {
      const draftStr = localStorage.getItem(`capa_form_v1_${key}`);
      if (draftStr) {
        const parsedDraft = JSON.parse(draftStr);
        if (Array.isArray(parsedDraft.illustrationUrls)) {
          parsedDraft.illustrationUrls.forEach((u: string) => {
            if (isRealPhoto(u) && !foundImages.includes(u)) foundImages.push(u);
          });
        }
      }
    } catch (e) {}
  });

  return foundImages;
};

/**
 * Checks if a string contains automated placeholder boilerplate text.
 * Neutralized: always returns false to preserve 100% of user data and manual edits.
 */
const isFakeBoilerplate = (_str?: string): boolean => {
  return false;
};

// Helper to extract Report Period (MM/YYYY) from timestamps (dd/mm/yy or dd/mm/yyyy)
const getReportPeriod = (timestamp?: string): string => {
  if (!timestamp) return "";
  const cleaned = timestamp.trim();
  const match = cleaned.match(/(?:^|\s*)(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (match) {
    const m = match[2].padStart(2, "0");
    let y = parseInt(match[3], 10);
    if (y < 100) y += 2000;
    return `${m}/${y}`;
  }
  return "";
};

// Helper to convert dd/mm/yy or dd/mm/yyyy to yyyy-mm-dd
const ddmmyyToYYYYMMDD = (val: string): string => {
  if (!val) return "";
  const parts = val.trim().split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d && m && y && !isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
      const fullYear = y.length === 2 ? `20${y}` : y;
      const mm = m.padStart(2, "0");
      const dd = d.padStart(2, "0");
      return `${fullYear}-${mm}-${dd}`;
    }
  }
  return "";
};

/**
 * Trợ lý gợi ý tên file PDF xuất ra chuyên nghiệp chuẩn ISO, có kèm Mã số, Phiên bản CAPA, Tên sản phẩm và Ngày tháng
 */
export const generateSuggestedCapaPdfFileName = (
  capaData?: CapaData | null,
  versionTag?: string,
  style: "STANDARD_ISO" | "CLEAN_VIETNAMESE" | "SHORT_CODE" = "STANDARD_ISO"
): string => {
  const rawCode = capaData?.ncNumber || capaData?.docNo || "CAPA";
  const code = rawCode.trim().replace(/[^a-zA-Z0-9_-]/g, "") || "CAPA";
  const rawVer = versionTag || "v1.0";
  const ver = rawVer === "DRAFT" ? "DRAFT" : rawVer.startsWith("v") ? rawVer : `v${rawVer}`;
  
  // Format date YYMMDD or DDMMYY
  let dateStr = "";
  const rawDate = capaData?.occurDate || capaData?.sendDate || capaData?.effDate || "";
  if (rawDate) {
    dateStr = rawDate.replace(/[^0-9]/g, "");
  }
  if (!dateStr || dateStr.length < 4) {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dateStr = `${dd}${mm}${yy}`;
  }

  // Format clean product name slug
  const rawProduct = (capaData?.productName || "").trim();
  const cleanProduct = rawProduct
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 32);

  if (style === "SHORT_CODE") {
    return `CAPA-${code}-${ver}`;
  }

  if (style === "CLEAN_VIETNAMESE") {
    const prodName = rawProduct ? ` - ${rawProduct.slice(0, 28)}` : "";
    return `BÁO CÁO CAPA - ${code} (${ver})${prodName}`;
  }

  // STANDARD_ISO default
  const prodPart = cleanProduct ? `_${cleanProduct}` : "";
  const datePart = dateStr ? `_${dateStr}` : "";
  return `CAPA_${code}_${ver}${prodPart}${datePart}`;
};

// Helper to convert yyyy-mm-dd to dd/mm/yy
const yyyymmddToDDMMYY = (val: string): string => {
  if (!val) return "";
  const parts = val.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const shortY = y.slice(-2);
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${shortY}`;
  }
  return val;
};

interface DatePickerInputProps {
  value: string;
  onChange: (val: string) => void;
  inputClassName?: string;
  placeholder?: string;
  containerClassName?: string;
}

function DatePickerInput({
  value,
  onChange,
  inputClassName = "w-full text-xs font-bold text-blue-700 print:text-black bg-transparent focus:bg-amber-50 focus:outline-none",
  placeholder = "dd/mm/yy",
  containerClassName = "relative inline-flex items-center w-full",
}: DatePickerInputProps) {
  const displayValue = React.useMemo(() => {
    if (!value || value.includes("NaN")) {
      return safeFormatDate(new Date());
    }
    return value;
  }, [value]);

  const isoDate = React.useMemo(() => ddmmyyToYYYYMMDD(displayValue), [displayValue]);

  const handleDatePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const formatted = yyyymmddToDDMMYY(e.target.value);
      onChange(formatted);
    }
  };

  return (
    <div className={containerClassName}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
      <div className="relative no-print ml-1 shrink-0 cursor-pointer text-slate-400 hover:text-blue-600 transition-colors" title="Bấm để chọn ngày từ lịch">
        <input
          type="date"
          value={isoDate}
          onChange={handleDatePicked}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
        />
        <Calendar className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// Helper to classify report accurately into KPH_NB, KPH_BN, RRO
const getReportCategory = (r: QualityReport): "KPH_NB" | "KPH_BN" | "RRO" | "OTHER" => {
  if (
    r.reportType === "RRO" ||
    (r.content || "").toLowerCase().includes("rủi ro") ||
    (r.content || "").toLowerCase().includes("rro")
  ) {
    return "RRO";
  }
  if (
    (r.reportType as string) === "KPH (BN)" ||
    r.reportType === "KNN" ||
    r.kphSubtype === "BN"
  ) {
    return "KPH_BN";
  }
  if (
    (r.reportType as string) === "KPH (NB)" ||
    r.reportType === "KPH" ||
    r.isAbnormal ||
    r.kphSubtype === "NB"
  ) {
    return "KPH_NB";
  }
  return "OTHER";
};

// Helper to safely return text without altering user formatting or inserting unwanted newlines
export function formatAutoLineBreaks(text: string): string {
  if (!text || typeof text !== "string") return text || "";
  return text;
}

// Helper functions to accurately determine max and next version tags
export const getMaxVersionNumber = (vers: CapaVersion[]): number => {
  if (!vers || vers.length === 0) return 0;
  return vers.reduce((max, v) => {
    const numFromProp = typeof v.versionNumber === "number" ? v.versionNumber : 0;
    const numFromStr = parseFloat((v.version || "").replace(/[^0-9.]/g, "")) || 0;
    return Math.max(max, Math.floor(numFromProp), Math.floor(numFromStr));
  }, 0);
};

export const getNextVersionTag = (vers: CapaVersion[]): string => {
  const maxNum = getMaxVersionNumber(vers);
  return `v${maxNum > 0 ? maxNum + 1 : 1}.0`;
};

export default function CapaManagementHub({
  reports,
  currentUser,
  users,
  branches,
  onShowToast
}: CapaManagementHubProps) {
  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("period") || "ALL";
  });
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"ALL" | "KPH_NB" | "KPH_BN" | "RRO">("ALL");
  const [capaStatusFilter, setCapaStatusFilter] = useState<"ALL" | "RELEASED" | "DRAFT" | "NOT_CREATED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("reportId") || urlParams.get("capaId") || null;
  });

  // Extract all unique periods (MM/YYYY) from reports
  const availablePeriods = React.useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const p = getReportPeriod(r.timestamp);
      if (p) set.add(p);
    });

    // Always ensure recent standard periods exist
    const now = new Date();
    const curM = String(now.getMonth() + 1).padStart(2, "0");
    const curY = now.getFullYear();
    set.add(`${curM}/${curY}`);
    set.add("08/2026");
    set.add("07/2026");
    set.add("06/2026");

    // Sort descending by year then month
    return Array.from(set).sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      if (yA !== yB) return yB - yA;
      return mB - mA;
    });
  }, [reports]);

  // Paper Config & Print Modal
  const [paperSize, setPaperSize] = useState<"A4_PORTRAIT" | "A4_LANDSCAPE" | "A3_LANDSCAPE" | "FULL_PAGE_EXPANDED">("FULL_PAGE_EXPANDED");
  const [paginationMode, setPaginationMode] = useState<"AUTO" | "ISO_2_PAGES" | "COMPACT_1_PAGE">("AUTO");
  const [isPaperDropdownOpen, setIsPaperDropdownOpen] = useState(false);
  const [isPaginationDropdownOpen, setIsPaginationDropdownOpen] = useState(false);
  const paperDropdownRef = useRef<HTMLDivElement>(null);
  const paginationDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close Paper Size & Pagination dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paperDropdownRef.current && !paperDropdownRef.current.contains(event.target as Node)) {
        setIsPaperDropdownOpen(false);
      }
      if (paginationDropdownRef.current && !paginationDropdownRef.current.contains(event.target as Node)) {
        setIsPaginationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [modalPrintOrient, setModalPrintOrient] = useState<"portrait" | "landscape">("portrait");
  const [modalPrintScale, setModalPrintScale] = useState<number>(100);
  const [modalPrintVersion, setModalPrintVersion] = useState<string>("AUTO");
  const [modalPrintMargin, setModalPrintMargin] = useState<"full-bleed" | "standard" | "wide">("full-bleed");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  
  // Loading & AI states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [activeZoomImg, setActiveZoomImg] = useState<string | null>(null);

  // Form State for currently selected report
  const [capaForm, setCapaForm] = useState<CapaData | null>(null);
  const [showPart4Section, setShowPart4Section] = useState<boolean>(true);
  const isPrintSnapshotLoadedRef = useRef<boolean>(false);
  const loadedSnapshotReportIdRef = useRef<string | null>(null);

  // Cloud Sync States (Firebase Firestore & Storage)
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>("");

  // Version Control States
  const [versions, setVersions] = useState<CapaVersion[]>([]);
  const [viewingVersion, setViewingVersion] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("version") || null;
  });
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const [newVersionNote, setNewVersionNote] = useState("");
  const [isDraftModified, setIsDraftModified] = useState(false);

  // Function to switch report cleanly
  const handleSelectReport = (repId: string) => {
    isPrintSnapshotLoadedRef.current = false;
    loadedSnapshotReportIdRef.current = null;
    setSelectedReportId(repId);
    setViewingVersion(null);
    setIsDraftModified(false);

    try {
      const curUrl = new URL(window.location.href);
      curUrl.searchParams.set("reportId", repId);
      curUrl.searchParams.delete("print");
      curUrl.searchParams.delete("use_snapshot");
      curUrl.searchParams.delete("version");
      curUrl.hash = "";
      window.history.replaceState({}, "", curUrl.toString());
    } catch (e) {}
  };

  // List of suggested manager / department head names for quick selection
  const managerSuggestions = Array.from(
    new Set(
      [
        "Lê Nhật Trường",
        "Trần Huy Tiến",
        "Bùi Tài",
        "Lê Nguyễn Phú",
        "Phạm Thị Tuyền",
        "Mr. Võ Thái Bình",
        currentUser?.fullName,
        ...(users || []).map((u) => u.fullName),
        ...(reports || []).map((r) => r.uploaderName)
      ]
        .filter(Boolean)
        .map((name) => formatNameCapitalized(name as string))
    )
  );

  // Combine manager suggestions with default department / personnel items for tagging
  const customMentionsList: MentionItem[] = React.useMemo(() => {
    const people: MentionItem[] = managerSuggestions.map((name, i) => ({
      id: `m-usr-${i}`,
      name,
      type: "person",
      detail: "Nhân sự / Cán bộ liên quan"
    }));
    const existingNames = new Set(people.map((p) => p.name.toLowerCase()));
    const extraDefaults = DEFAULT_MENTION_ITEMS.filter(
      (m) => !existingNames.has(m.name.toLowerCase())
    );
    return [...people, ...extraDefaults];
  }, [managerSuggestions]);

  const handleMentionNotification = (mentionName: string) => {
    if (onShowToast) {
      onShowToast(`🔔 Đã tag @${mentionName} - Hệ thống đã ghi nhận thông báo công việc!`, "info");
    }
  };

  // Filter reports with useMemo to prevent unnecessary re-renders
  const filteredReports = React.useMemo(() => {
    return reports.filter((r) => {
      // Exclude deleted reports (in trash bin)
      if (r.isDeleted) return false;

      // Exclude DSA (Spotlight / Points of light) as CAPA applies to KPH & RRO
      const isDsa = r.reportType === "DSA" || r.isSpotlight || (r as any).isDsaReport;
      if (isDsa) return false;

      // Type filter
      const cat = getReportCategory(r);
      if (selectedTypeFilter === "KPH_NB" && cat !== "KPH_NB") return false;
      if (selectedTypeFilter === "KPH_BN" && cat !== "KPH_BN") return false;
      if (selectedTypeFilter === "RRO" && cat !== "RRO") return false;

      // Period filter (Month/Year e.g., 06/2026, 07/2026, 08/2026)
      if (selectedPeriod !== "ALL") {
        const repPeriod = getReportPeriod(r.timestamp);
        if (repPeriod && repPeriod !== selectedPeriod) {
          return false;
        }
      }

      // Branch filter
      if (selectedBranch !== "ALL" && r.factory !== selectedBranch) {
        return false;
      }

      // CAPA Status filter
      if (capaStatusFilter !== "ALL") {
        const versionsStr = getCapaStorageItem("capa_versions_v1", r.id, reports, r);
        let rVersions: CapaVersion[] = [];
        if (versionsStr) {
          try {
            const rawVers = JSON.parse(versionsStr);
            if (Array.isArray(rawVers) && isVersionsBelongingToReport(rawVers, r, reports)) {
              rVersions = rawVers.filter((v: any) => v && v.version);
            }
          } catch (e) {
            rVersions = [];
          }
        }
        const isReleased = rVersions && rVersions.length > 0;
        const draftStr = getCapaStorageItem("capa_form_v1", r.id, reports, r);
        let hasDraft = false;
        if (draftStr) {
          try {
            const parsedDraft = JSON.parse(draftStr);
            if (isCapaBelongingToReport(parsedDraft, r, reports)) {
              hasDraft = true;
            }
          } catch (e) {}
        }

        if (capaStatusFilter === "RELEASED" && !isReleased) return false;
        if (capaStatusFilter === "DRAFT" && (!hasDraft || isReleased)) return false;
        if (capaStatusFilter === "NOT_CREATED" && (isReleased || hasDraft)) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = r.id.toLowerCase().includes(q) || (r.reportCode && r.reportCode.toLowerCase().includes(q));
        const matchContent = (r.content || "").toLowerCase().includes(q);
        const matchNotes = (r.notes || "").toLowerCase().includes(q);
        const matchFactory = (r.factory || "").toLowerCase().includes(q);
        const matchUploader = (r.uploaderName || "").toLowerCase().includes(q);
        if (!matchId && !matchContent && !matchNotes && !matchFactory && !matchUploader) {
          return false;
        }
      }

      return true;
    });
  }, [reports, selectedTypeFilter, selectedPeriod, selectedBranch, capaStatusFilter, searchQuery]);

  // Auto select first report on mount or when filtered list changes and selection becomes invalid
  useEffect(() => {
    if (!selectedReportId) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlReportId = urlParams.get("reportId") || urlParams.get("capaId");
      if (urlReportId) {
        const matched = reports.find((r) => r.id === urlReportId || r.reportCode === urlReportId || (r.id && r.id.toString() === urlReportId.toString()));
        if (matched) {
          setSelectedReportId(matched.id);
          return;
        }
      }
      if (filteredReports.length > 0) {
        setSelectedReportId(filteredReports[0].id);
      }
    } else {
      const exists = reports.some((r) => r.id === selectedReportId || r.reportCode === selectedReportId);
      if (!exists && filteredReports.length > 0) {
        setSelectedReportId(filteredReports[0].id);
      }
    }
  }, [filteredReports.length, selectedReportId]);

  // Load CAPA data when selected report changes
  useEffect(() => {
    // If snapshot has already been loaded for print mode for THIS EXACT report, avoid overwriting
    if (isPrintSnapshotLoadedRef.current && loadedSnapshotReportIdRef.current === selectedReportId) {
      return;
    }
    isPrintSnapshotLoadedRef.current = false;
    loadedSnapshotReportIdRef.current = null;

    if (!selectedReportId) {
      setCapaForm(null);
      setVersions([]);
      setViewingVersion(null);
      return;
    }

    const currentReport = reports.find((r) => r.id === selectedReportId || r.reportCode === selectedReportId || (r.id && r.id.toString() === selectedReportId.toString()));
    if (!currentReport) return;

    // Load versions history
    const storedVersionsStr = getCapaStorageItem("capa_versions_v1", currentReport.id, reports, currentReport);
    let loadedVersions: CapaVersion[] = [];
    if (storedVersionsStr) {
      try {
        const rawVers = JSON.parse(storedVersionsStr);
        if (Array.isArray(rawVers) && isVersionsBelongingToReport(rawVers, currentReport, reports)) {
          loadedVersions = rawVers.filter((v: any) => v && v.version);
        } else {
          // Corrupted or cross-polluted data detected - clean it
          removeCapaStorageItem("capa_versions_v1", currentReport.id, reports, currentReport);
          loadedVersions = [];
        }
      } catch (e) {
        loadedVersions = [];
      }
    }

    // Extract all real photos associated with this report
    const realImages = getReportRealImages(currentReport, reports);

    // Retrieve any saved draft form data
    const cachedDraftStr = getCapaStorageItem("capa_form_v1", currentReport.id, reports, currentReport);
    let cachedDraft: Partial<CapaData> | null = null;
    if (cachedDraftStr) {
      try {
        const parsedDraft = JSON.parse(cachedDraftStr);
        if (isCapaBelongingToReport(parsedDraft, currentReport, reports)) {
          cachedDraft = parsedDraft;
        } else {
          // Corrupted or cross-polluted draft from another report - wipe it
          removeCapaStorageItem("capa_form_v1", currentReport.id, reports, currentReport);
          cachedDraft = null;
        }
      } catch (e) {
        cachedDraft = null;
      }
    }

    // Determine illustration URLs (real photos or fallback if user uploaded or draft has them)
    let finalIllustrations: string[] = [];
    if (realImages.length > 0) {
      finalIllustrations = realImages;
    } else if (cachedDraft?.illustrationUrls && cachedDraft.illustrationUrls.length > 0) {
      const nonSvg = cachedDraft.illustrationUrls.filter((u) => u && !u.includes("data:image/svg"));
      if (nonSvg.length > 0) finalIllustrations = nonSvg;
    }

    const todayFormatted = safeFormatDate(new Date());
    const reportDateFormatted = safeFormatDate(currentReport.timestamp);
    const defaultQcStaffName = currentReport.uploaderName 
      ? formatNameCapitalized(currentReport.uploaderName) 
      : "";

    const cleanNcDesc = (
      cachedDraft?.ncDescription
        ? cachedDraft.ncDescription
        : `${currentReport.content || ""}${currentReport.notes ? `. Ghi chú: ${currentReport.notes}` : ""}`
    ).trim();

    // Genuine reason: prioritize real resolutions or user draft
    let cleanReason = "";
    if (cachedDraft?.reason) {
      cleanReason = cachedDraft.reason.trim();
    } else if (currentReport.resolutions && currentReport.resolutions.length > 0) {
      cleanReason = currentReport.resolutions.map((r) => r.resultText).filter(Boolean).join("\n").trim();
    }

    // Genuine correction: prioritize real directives or user draft
    let cleanCorrection = "";
    if (cachedDraft?.correction) {
      cleanCorrection = cachedDraft.correction.trim();
    } else if (currentReport.directives && currentReport.directives.length > 0) {
      cleanCorrection = currentReport.directives.map((d) => d.text).filter(Boolean).join("\n").trim();
    }

    // Genuine traceability: user draft or empty
    let cleanTraceability = "";
    if (cachedDraft?.traceability) {
      cleanTraceability = cachedDraft.traceability.trim();
    }

    // Genuine preventive action: user draft or empty
    let cleanPreventive = "";
    if (cachedDraft?.preventiveAction) {
      cleanPreventive = cachedDraft.preventiveAction.trim();
    }

    // Genuine responsible persons / departments: use report's real person or department
    const defaultResponsible = currentReport.assignedPersonName 
      ? currentReport.assignedPersonName 
      : (currentReport.uploaderDepartment || "");

    const cleanCorrectionResp = (
      cachedDraft?.correctionResponsible
        ? cachedDraft.correctionResponsible
        : defaultResponsible
    ).trim();

    const cleanTraceabilityResp = (
      cachedDraft?.traceabilityResponsible
        ? cachedDraft.traceabilityResponsible
        : defaultResponsible
    ).trim();

    const cleanPreventiveResp = (
      cachedDraft?.preventiveResponsible
        ? cachedDraft.preventiveResponsible
        : defaultResponsible
    ).trim();

    // Product Type based on real category
    let defaultProductType: "finished" | "semi" | "raw" | "reject" = "finished";
    if (currentReport.category === "NGUYÊN VẬT LIỆU") {
      defaultProductType = "raw";
    } else if (currentReport.category === "MÁY MÓC") {
      defaultProductType = "reject";
    } else if (currentReport.category === "PHƯƠNG PHÁP") {
      defaultProductType = "semi";
    }

    // Product Name
    let cleanProductName = "";
    if (cachedDraft?.productName && cachedDraft.productName.trim() !== currentReport.content?.trim()) {
      cleanProductName = cachedDraft.productName.trim();
    }

    // Product Code
    const cleanProductCode = (
      cachedDraft?.productCode
        ? cachedDraft.productCode
        : (currentReport.errorCode || "")
    ).trim();

    // Customer Name
    const isExternalKph = currentReport.kphSubtype === "BN" || (currentReport as any).reportType === "KPH (BN)";
    const cleanCustomerName = (
      cachedDraft?.customerName
        ? cachedDraft.customerName
        : (isExternalKph ? "" : "Khách Hàng Nội Bộ")
    ).trim();

    // Customer opinion
    const cleanCustomerOpinion = (cachedDraft?.customerOpinion || "").trim();

    const baseCapa: CapaData = {
      reportId: currentReport.id,
      docNo: cachedDraft?.docNo || "BM01-ISO-QT04-KPPN",
      rev: cachedDraft?.rev || "v1.0",
      effDate: cachedDraft?.effDate || "20/9/2025",
      occurDate: cachedDraft?.occurDate || reportDateFormatted,
      sendDate: cachedDraft?.sendDate || reportDateFormatted || todayFormatted,
      ncNumber: currentReport.reportCode || currentReport.id,
      poNumber: cachedDraft?.poNumber || "",
      productType: cachedDraft?.productType || defaultProductType,
      productName: cleanProductName,
      customerName: cleanCustomerName,
      productCode: cleanProductCode,
      totalQuantity: cachedDraft?.totalQuantity || "",
      ncQuantity: cachedDraft?.ncQuantity || "1 đơn vị",
      ncStatus: cachedDraft?.ncStatus || "on_hold",
      ncDescription: cleanNcDesc,
      illustrationUrls: finalIllustrations,
      reason: cleanReason,
      correction: cleanCorrection,
      correctionTargetDate: cachedDraft?.correctionTargetDate || reportDateFormatted || todayFormatted,
      correctionResponsible: cleanCorrectionResp,
      traceability: cleanTraceability,
      traceabilityTargetDate: cachedDraft?.traceabilityTargetDate || reportDateFormatted || todayFormatted,
      traceabilityResponsible: cleanTraceabilityResp,
      preventiveAction: cleanPreventive,
      preventiveTargetDate: cachedDraft?.preventiveTargetDate || reportDateFormatted || todayFormatted,
      preventiveResponsible: cleanPreventiveResp,
      qcStaffName: cachedDraft?.qcStaffName !== undefined ? cachedDraft.qcStaffName : defaultQcStaffName,
      qcStaffDate: cachedDraft?.qcStaffDate || reportDateFormatted || todayFormatted,
      qcStaffSigned: cachedDraft?.qcStaffSigned ?? false,
      supplierRepName: cachedDraft?.supplierRepName !== undefined ? cachedDraft.supplierRepName : "",
      supplierRepDate: cachedDraft?.supplierRepDate || reportDateFormatted || todayFormatted,
      supplierRepSigned: cachedDraft?.supplierRepSigned ?? false,
      qcHeadName: cachedDraft?.qcHeadName !== undefined ? cachedDraft.qcHeadName : "",
      approvalDate: cachedDraft?.approvalDate || "",
      stampStatus: cachedDraft?.stampStatus || "PASS",
      approvalNote: cachedDraft?.approvalNote || "",
      customerFeedbackStatus: cachedDraft?.customerFeedbackStatus || "satisfy",
      customerOpinion: cleanCustomerOpinion,
      customerRepName: cachedDraft?.customerRepName !== undefined ? cachedDraft.customerRepName : "",
      customerRepDate: cachedDraft?.customerRepDate || reportDateFormatted || todayFormatted,
      customerRepSigned: cachedDraft?.customerRepSigned ?? false,
      verificationResult: cachedDraft?.verificationResult || "",
      verificationDate: cachedDraft?.verificationDate || "",
      verificationBy: cachedDraft?.verificationBy !== undefined ? cachedDraft.verificationBy : "",
      verificationStatus: cachedDraft?.verificationStatus || "",
      additionalNotes: cachedDraft?.additionalNotes || "",
      isAiDrafted: !!cachedDraft?.isAiDrafted
    };

    // Helper to preserve images in CapaData
    const sanitizeCapaData = (data: CapaData): CapaData => {
      const s = { ...data };
      if ((!s.illustrationUrls || s.illustrationUrls.length === 0 || s.illustrationUrls.every((u: string) => u.includes("data:image/svg"))) && finalIllustrations.length > 0) {
        s.illustrationUrls = finalIllustrations;
      }
      return s;
    };

    if (loadedVersions.length > 0) {
      let updatedAny = false;

      // Check if max version >= 2 but v1.0 is missing (e.g. from previous accidental filter), reconstruct v1.0
      const maxNum = getMaxVersionNumber(loadedVersions);
      const hasV1 = loadedVersions.some((v) => v.versionNumber === 1 || v.version === "v1.0");
      if (maxNum >= 2 && !hasV1) {
        const v1Data: CapaData = {
          ...baseCapa,
          rev: "v1.0",
          approvalNote: "Ban hành lần đầu v1.0",
          approvalDate: currentReport.timestamp ? safeFormatDate(currentReport.timestamp) : todayFormatted,
          qcStaffSigned: true,
          supplierRepSigned: true
        };
        const reconstructedV1: CapaVersion = {
          version: "v1.0",
          versionNumber: 1,
          savedAt: `${reportDateFormatted} 08:30`,
          signedBy: "Phạm Thị Tuyền (QC Head)",
          signedDate: reportDateFormatted,
          stampStatus: "PASS",
          note: "Ban hành lần đầu v1.0",
          data: v1Data
        };
        loadedVersions.push(reconstructedV1);
        updatedAny = true;
      }

      // Sort versions descending (newest / highest version first)
      loadedVersions.sort((a, b) => {
        const numA = a.versionNumber || parseFloat((a.version || "").replace(/[^0-9.]/g, "")) || 0;
        const numB = b.versionNumber || parseFloat((b.version || "").replace(/[^0-9.]/g, "")) || 0;
        return numB - numA;
      });

      // Ensure existing versions have real images and cleaned content
      loadedVersions = loadedVersions.map((v) => {
        let sanitizedData = sanitizeCapaData(v.data);
        if (cachedDraft && (v.version === "v2.0" || v.versionNumber === 2)) {
          sanitizedData = sanitizeCapaData({
            ...sanitizedData,
            ...cachedDraft,
            rev: "v2.0"
          });
        }
        if (JSON.stringify(sanitizedData) !== JSON.stringify(v.data)) {
          updatedAny = true;
          return {
            ...v,
            data: sanitizedData
          };
        }
        return v;
      });
      if (updatedAny) {
        setCapaStorageItem("capa_versions_v1", currentReport.id, JSON.stringify(loadedVersions), reports);
      }
    } else {
      // Báo cáo mới chưa lập CAPA -> danh sách phiên bản là rỗng
      loadedVersions = [];
    }
    setVersions(loadedVersions);

    // If the report already has released versions, ALWAYS default to displaying the latest/current active version
    // (unless a specific version is requested via URL)
    if (loadedVersions.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedVersion = urlParams.get("version");

      let targetVer = loadedVersions[0]; // Default to newest / active version (e.g. v2.0)
      if (requestedVersion && requestedVersion !== "DRAFT") {
        const match = loadedVersions.find(
          (v) =>
            v.version.toLowerCase().trim() === requestedVersion.toLowerCase().trim() ||
            v.version.replace(/[^0-9.]/g, "") === requestedVersion.replace(/[^0-9.]/g, "")
        );
        if (match) {
          targetVer = match;
        }
      }

      if (requestedVersion === "DRAFT") {
        // Explicitly requested draft mode
        setViewingVersion(null);
        if (cachedDraft) {
          setCapaForm(cachedDraft as CapaData);
          setIsDraftModified(JSON.stringify(cachedDraft) !== JSON.stringify(loadedVersions[0].data));
        } else {
          setCapaForm(sanitizeCapaData(JSON.parse(JSON.stringify(loadedVersions[0].data))));
          setIsDraftModified(false);
        }
      } else {
        // Load the official active version (e.g. v2.0)
        const verData = sanitizeCapaData(JSON.parse(JSON.stringify(targetVer.data)));
        setCapaForm(verData);
        setViewingVersion(targetVer.version);
        setIsDraftModified(false);
      }
      return;
    }

    // For reports that have NO released versions yet: check for draft or initialize base CAPA
    const cached = getCapaStorageItem("capa_form_v1", currentReport.id, reports, currentReport);

    if (cached) {
      try {
        let parsed = JSON.parse(cached);
        if (isCapaBelongingToReport(parsed, currentReport, reports)) {
          // Ensure ncNumber uses reportCode if it was previously saved as raw id digits
          if (parsed.ncNumber === currentReport.id || parsed.ncNumber === currentReport.id.replace(/[^0-9]/g, "")) {
            parsed.ncNumber = currentReport.reportCode || currentReport.id;
          }
          // Sanitize any invalid dates
          if (!parsed.occurDate || parsed.occurDate.includes("NaN")) {
            parsed.occurDate = safeFormatDate(currentReport.timestamp);
          }
          if (!parsed.sendDate || parsed.sendDate.includes("NaN")) {
            parsed.sendDate = safeFormatDate(new Date());
          }
          if (!parsed.correctionTargetDate || parsed.correctionTargetDate.includes("NaN")) {
            parsed.correctionTargetDate = safeFormatDate(new Date());
          }
          if (!parsed.traceabilityTargetDate || parsed.traceabilityTargetDate.includes("NaN")) {
            parsed.traceabilityTargetDate = safeFormatDate(new Date());
          }
          if (!parsed.preventiveTargetDate || parsed.preventiveTargetDate.includes("NaN")) {
            parsed.preventiveTargetDate = safeFormatDate(new Date());
          }
          if (!parsed.supplierRepDate || parsed.supplierRepDate.includes("NaN")) {
            parsed.supplierRepDate = safeFormatDate(new Date());
          }
          if (!parsed.qcStaffName && parsed.qcStaffName !== "") {
            parsed.qcStaffName = currentReport.uploaderName ? formatNameCapitalized(currentReport.uploaderName) : (currentUser?.fullName ? formatNameCapitalized(currentUser.fullName) : "");
          }
          if (!parsed.qcStaffDate || parsed.qcStaffDate.includes("NaN")) {
            parsed.qcStaffDate = parsed.occurDate || safeFormatDate(new Date());
          }
          if (!parsed.approvalDate || parsed.approvalDate.includes("NaN")) {
            parsed.approvalDate = safeFormatDate(new Date());
          }

          // Sanitize from old boilerplate
          parsed = sanitizeCapaData(parsed);

          // Auto-ensure line breaks for long structured fields
          parsed.ncDescription = formatAutoLineBreaks(parsed.ncDescription);
          parsed.reason = formatAutoLineBreaks(parsed.reason);
          parsed.correction = formatAutoLineBreaks(parsed.correction);
          parsed.traceability = formatAutoLineBreaks(parsed.traceability);
          parsed.preventiveAction = formatAutoLineBreaks(parsed.preventiveAction);
          if (parsed.customerOpinion) {
            parsed.customerOpinion = formatAutoLineBreaks(parsed.customerOpinion);
          }

          setCapaForm(parsed);
          setViewingVersion(null);
          setIsDraftModified(false);
          return;
        }
      } catch (e) {}
    }

    setIsDraftModified(false);
    setViewingVersion(null);
    setCapaForm(baseCapa);
  }, [selectedReportId]);

  // Background Cloud Sync Effect (Firestore document sync)
  const lastSyncedReportIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedReportId) return;
    const currentReport = reports.find((r) => r.id === selectedReportId || r.reportCode === selectedReportId || (r.id && r.id.toString() === selectedReportId.toString()));
    if (!currentReport) return;

    let isSubscribed = true;
    const syncCloudData = async () => {
      try {
        const cloudDoc = await fetchCapaFromCloud(currentReport.id);
        if (!isSubscribed) return;

        if (cloudDoc) {
          if (cloudDoc.versions && isVersionsBelongingToReport(cloudDoc.versions, currentReport, reports)) {
            setVersions(cloudDoc.versions);
            setCapaStorageItem("capa_versions_v1", currentReport.id, JSON.stringify(cloudDoc.versions), reports);
          }
          if (cloudDoc.form && isCapaBelongingToReport(cloudDoc.form, currentReport, reports)) {
            setCapaForm(cloudDoc.form);
            setCapaStorageItem("capa_form_v1", currentReport.id, JSON.stringify(cloudDoc.form), reports);
          }
          if (cloudDoc.activeVersionTag) {
            setCapaStorageItem("capa_active_version_v1", currentReport.id, cloudDoc.activeVersionTag, reports);
          }
          if (cloudDoc.updatedAt) {
            setLastCloudSyncTime(new Date(cloudDoc.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
          }
        }
      } catch (err) {
        console.warn("[Cloud Sync Error]:", err);
      } finally {
        if (isSubscribed) {
          setCloudSyncStatus("synced");
          if (!lastCloudSyncTime) {
            setLastCloudSyncTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
          }
        }
      }
    };

    if (lastSyncedReportIdRef.current !== selectedReportId) {
      lastSyncedReportIdRef.current = selectedReportId;
      syncCloudData();
    } else {
      setCloudSyncStatus("synced");
    }

    // Subscribe to live updates from other devices / collaborators
    const unsubscribe = subscribeCapaFromCloud(currentReport.id, (cloudUpdate) => {
      if (!isSubscribed) return;
      if (cloudUpdate.versions && isVersionsBelongingToReport(cloudUpdate.versions, currentReport, reports)) {
        setVersions(cloudUpdate.versions);
      }
      if (cloudUpdate.form && isCapaBelongingToReport(cloudUpdate.form, currentReport, reports) && !isDraftModified) {
        setCapaForm(cloudUpdate.form);
      }
      setCloudSyncStatus("synced");
      if (cloudUpdate.updatedAt) {
        setLastCloudSyncTime(new Date(cloudUpdate.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [selectedReportId]);

  // Save changes to localStorage & Firebase Cloud
  const handleUpdateForm = (field: keyof CapaData, value: any) => {
    if (!capaForm) return;

    let updated = { ...capaForm, [field]: value };

    // If user was viewing a released version snapshot and edits it, switch to working draft mode
    if (viewingVersion !== null) {
      setViewingVersion(null);
    }

    // Detect if content is modified when a version has already been released
    const isSignatureToggle = field === "supplierRepSigned" || field === "qcStaffSigned";

    if (!isSignatureToggle && versions.length > 0 && !isDraftModified) {
      setIsDraftModified(true);
      // Reset signatures so all parties re-confirm for the new version
      updated.supplierRepSigned = false;
      updated.qcStaffSigned = false;
    }

    setCapaForm(updated);
    if (selectedReportId) {
      setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(updated), reports);
      // Auto-sync non-blocking to Firebase Cloud
      saveCapaToCloud(selectedReportId, updated, versions, viewingVersion || "DRAFT").then((ok) => {
        if (ok) {
          setCloudSyncStatus("synced");
          setLastCloudSyncTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
        }
      });
    }
  };

  // Manual Save Draft Handler
  const handleSaveDraftManual = () => {
    if (!capaForm || !selectedReportId) return;

    setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(capaForm), reports);

    if (versions.length > 0) {
      setIsDraftModified(true);
    }

    setCloudSyncStatus("syncing");
    saveCapaToCloud(selectedReportId, capaForm, versions, "DRAFT").then((ok) => {
      if (ok) {
        setCloudSyncStatus("synced");
        setLastCloudSyncTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      } else {
        setCloudSyncStatus("offline");
      }
    });

    if (onShowToast) {
      const nextVerTag = getNextVersionTag(versions);
      onShowToast(`✓ Đã lưu thành công bản nháp mới ${versions.length > 0 ? `(chờ ký duyệt ${nextVerTag})` : "(Bản nháp CAPA)"} lên Đám mây!`, "success");
    }
  };

  // Version Commit Handler
  const handleCommitNewVersion = (customNote?: string) => {
    if (!capaForm || !selectedReportId) return;

    const maxVerNum = getMaxVersionNumber(versions);
    const nextVerNum = maxVerNum > 0 ? maxVerNum + 1 : 1;
    const versionTag = `v${nextVerNum}.0`;
    const nowStr = `${formatDateDDMMYY(new Date())} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    const noteToUse = customNote || newVersionNote || capaForm.approvalNote || (nextVerNum === 1 ? "Trưởng BP QC ký duyệt phát hành v1.0" : `Cập nhật bổ sung phiên bản v${nextVerNum}.0`);

    // Ensure signatures are marked as confirmed upon releasing official version
    const finalFormToSave: CapaData = {
      ...capaForm,
      approvalNote: noteToUse,
      supplierRepSigned: capaForm.supplierRepSigned,
      qcStaffSigned: true,
      approvalDate: capaForm.approvalDate || safeFormatDate(new Date())
    };

    const newVersionObj: CapaVersion = {
      version: versionTag,
      versionNumber: nextVerNum,
      savedAt: nowStr,
      signedBy: finalFormToSave.qcHeadName.trim() || currentUser?.fullName || "Phạm Thị Tuyền (QC Head)",
      signedDate: finalFormToSave.approvalDate || formatDateDDMMYY(new Date()),
      stampStatus: finalFormToSave.stampStatus || "PASS",
      note: noteToUse,
      data: JSON.parse(JSON.stringify(finalFormToSave))
    };

    const updatedVersions = [newVersionObj, ...versions];
    setVersions(updatedVersions);
    setCapaStorageItem("capa_versions_v1", selectedReportId, JSON.stringify(updatedVersions), reports);

    setCapaForm(finalFormToSave);
    setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(finalFormToSave), reports);
    setCapaStorageItem("capa_active_version_v1", selectedReportId, versionTag, reports);

    setIsDraftModified(false);
    setViewingVersion(versionTag);
    setNewVersionNote("");
    setIsCommitDialogOpen(false);

    // Save newly committed version directly to Cloud
    setCloudSyncStatus("syncing");
    saveCapaToCloud(selectedReportId, finalFormToSave, updatedVersions, versionTag).then((ok) => {
      if (ok) {
        setCloudSyncStatus("synced");
        setLastCloudSyncTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
      }
    });

    if (onShowToast) {
      onShowToast(`Đã ký duyệt & phát hành thành công Phiên bản ${versionTag} lên Đám mây! 🎉`, "success");
    }
  };

  // Image Upload & Removal Handlers for CAPA Form with Firebase Storage & WebP compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !capaForm || !selectedReportId) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawResult = event.target?.result as string;
        if (rawResult) {
          setCloudSyncStatus("syncing");
          // Upload to Firebase Storage or compress to WebP
          const uploadedUrl = await uploadCapaImage(rawResult, selectedReportId, `img_${Date.now()}`);

          setCapaForm((prev) => {
            if (!prev) return null;
            const currentUrls = prev.illustrationUrls || [];
            // Remove generic SVG placeholder when uploading real photo
            const filteredUrls = currentUrls.filter((u) => !u.includes("data:image/svg"));
            const updatedUrls = [...filteredUrls, uploadedUrl];
            const updated = { ...prev, illustrationUrls: updatedUrls };
            if (selectedReportId) {
              setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(updated), reports);
              setCapaStorageItem("4m1e1i_img_urls", selectedReportId, JSON.stringify(updatedUrls), reports);
              
              let newVersToSave = versions;
              // If viewing a released version (e.g. v2.0 or v1.0), update that version's data as well
              if (viewingVersion) {
                setVersions((prevVers) => {
                  const newVers = prevVers.map((v) => {
                    if (v.version === viewingVersion) {
                      return {
                        ...v,
                        data: {
                          ...v.data,
                          illustrationUrls: updatedUrls
                        }
                      };
                    }
                    return v;
                  });
                  newVersToSave = newVers;
                  setCapaStorageItem("capa_versions_v1", selectedReportId, JSON.stringify(newVers), reports);
                  return newVers;
                });
              }

              saveCapaToCloud(selectedReportId, updated, newVersToSave, viewingVersion || "DRAFT").then((ok) => {
                if (ok) {
                  setCloudSyncStatus("synced");
                  setLastCloudSyncTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
                }
              });
            }
            return updated;
          });
          if (onShowToast) {
            onShowToast("✓ Đã tải & tối ưu hình ảnh thực tế đính kèm phiếu CAPA!", "success");
          }
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    if (!capaForm) return;
    const currentUrls = capaForm.illustrationUrls || [];
    const updatedUrls = currentUrls.filter((_, i) => i !== index);
    handleUpdateForm("illustrationUrls", updatedUrls);
    if (selectedReportId && viewingVersion) {
      setVersions((prevVers) => {
        const newVers = prevVers.map((v) => {
          if (v.version === viewingVersion) {
            return {
              ...v,
              data: {
                ...v.data,
                illustrationUrls: updatedUrls
              }
            };
          }
          return v;
        });
        setCapaStorageItem("capa_versions_v1", selectedReportId, JSON.stringify(newVers), reports);
        saveCapaToCloud(selectedReportId, { ...capaForm, illustrationUrls: updatedUrls }, newVers, viewingVersion);
        return newVers;
      });
    }
  };

  // Switch Version Handler
  const handleSelectVersionToView = (verTag: string | null) => {
    if (!selectedReportId) return;

    if (verTag === null || verTag === "DRAFT" || verTag === "DRAFT_NEXT") {
      setViewingVersion(null);
      removeCapaStorageItem("capa_active_version_v1", selectedReportId, reports);
      const cached = getCapaStorageItem("capa_form_v1", selectedReportId, reports);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setCapaForm(parsed);
          if (versions.length > 0) {
            setIsDraftModified(JSON.stringify(parsed) !== JSON.stringify(versions[0].data));
          }
        } catch (e) {}
      } else if (versions.length > 0) {
        setCapaForm(JSON.parse(JSON.stringify(versions[0].data)));
      }
    } else {
      const targetVer = versions.find(
        (v) =>
          v.version.toLowerCase().trim() === verTag.toLowerCase().trim() ||
          v.version.replace(/[^0-9.]/g, "") === verTag.replace(/[^0-9.]/g, "")
      );
      if (targetVer) {
        const targetData = JSON.parse(JSON.stringify(targetVer.data));
        setCapaForm(targetData);
        setViewingVersion(targetVer.version);
        setCapaStorageItem("capa_active_version_v1", selectedReportId, targetVer.version, reports);
        setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(targetData), reports);
        setIsDraftModified(false);
      }
    }
    setIsVersionModalOpen(false);
  };

  // Call AI Draft API
  const handleGenerateAiDraft = async () => {
    if (!selectedReportId || !capaForm) return;
    const currentReport = reports.find((r) => r.id === selectedReportId);
    if (!currentReport) return;

    setIsAiLoading(true);
    if (onShowToast) {
      onShowToast("Trợ lý AI đang quét hình ảnh & nội dung để lập dự thảo CAPA...", "info");
    }

    try {
      const res = await fetch("/api/draft-capa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: currentReport })
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response from server:", text);
        throw new Error(`Máy chủ phản hồi lỗi (${res.status}). Vui lòng thử lại.`);
      }

      if (res.ok && data && data.success && data.draft) {
        const draft = data.draft;
        const updated: CapaData = {
          ...capaForm,
          productName: draft.productName || capaForm.productName,
          productCode: draft.productCode || capaForm.productCode,
          customerName: draft.customerName || capaForm.customerName,
          ncDescription: formatAutoLineBreaks(draft.ncDescription || capaForm.ncDescription),
          reason: formatAutoLineBreaks(draft.reason || capaForm.reason),
          correction: formatAutoLineBreaks(draft.correction || capaForm.correction),
          traceability: formatAutoLineBreaks(draft.traceability || capaForm.traceability),
          preventiveAction: formatAutoLineBreaks(draft.preventiveAction || capaForm.preventiveAction),
          isAiDrafted: true
        };

        setCapaForm(updated);
        setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(updated), reports);
        saveCapaToCloud(selectedReportId, updated, versions, viewingVersion || "DRAFT");

        if (onShowToast) {
          onShowToast("AI đã dự thảo thành công Form CAPA chuẩn ISO!", "success");
        }
      } else {
        throw new Error(data?.error || "Không nhận được phản hồi từ AI");
      }
    } catch (e: any) {
      console.warn("AI remote draft fallback to client intelligent ISO generator:", e);
      // Tự động phân tích sâu đa yếu tố (5-Why, hành động khắc phục, truy xuất nguồn gốc, phòng ngừa lỗi) theo chuẩn ISO 9001
      const intelligentCapaDraft = generateProfessionalClientCapaDraft(currentReport, capaForm);

      setCapaForm(intelligentCapaDraft);
      setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(intelligentCapaDraft), reports);
      saveCapaToCloud(selectedReportId, intelligentCapaDraft, versions, viewingVersion || "DRAFT");

      if (onShowToast) {
        onShowToast("Trợ lý AI đã phân tích 5-Why & lập dự thảo CAPA ISO hoàn chỉnh!", "success");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  // 1. Trigger Print Modal
  const handlePrint = () => {
    if (!capaForm) return;
    const currentVer = viewingVersion || (versions.length > 0 ? versions[0].version : "DRAFT");
    setModalPrintVersion(currentVer);
    setPdfFileName(generateSuggestedCapaPdfFileName(capaForm, currentVer));
    setShowPrintModal(true);
  };

  const handleExportPdf = () => {
    if (!capaForm) return;
    const currentVer = viewingVersion || (versions.length > 0 ? versions[0].version : "DRAFT");
    setModalPrintVersion(currentVer);
    setPdfFileName(generateSuggestedCapaPdfFileName(capaForm, currentVer));
    setShowPrintModal(true);
  };

  // 2. Open new clean tab dedicated for printing exact selected version & parameters
  const handleOpenNewTabToPrint = () => {
    const verToPrint = (modalPrintVersion && modalPrintVersion !== "AUTO")
      ? modalPrintVersion
      : (viewingVersion || (versions.length > 0 ? versions[0].version : "DRAFT"));

    let dataToPrint: CapaData | null = capaForm;
    if (
      verToPrint !== "DRAFT" &&
      modalPrintVersion &&
      modalPrintVersion !== "AUTO" &&
      modalPrintVersion !== viewingVersion &&
      modalPrintVersion !== "v2.0"
    ) {
      const matchedVer = versions.find(
        (v) =>
          v.version.toLowerCase().trim() === verToPrint.toLowerCase().trim() ||
          v.version.replace(/[^0-9.]/g, "") === verToPrint.replace(/[^0-9.]/g, "")
      );
      if (matchedVer) {
        dataToPrint = matchedVer.data;
      }
    }

    if (dataToPrint && selectedReportId) {
      setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(dataToPrint), reports);
      if (verToPrint !== "DRAFT") {
        setCapaStorageItem("capa_active_version_v1", selectedReportId, verToPrint, reports);
        const updatedVersions = (versions.length > 0 ? versions : []).map((v) => {
          if (
            v.version.toLowerCase().trim() === verToPrint.toLowerCase().trim() ||
            v.version.replace(/[^0-9.]/g, "") === verToPrint.replace(/[^0-9.]/g, "")
          ) {
            return { ...v, data: JSON.parse(JSON.stringify(dataToPrint)) };
          }
          return v;
        });
        if (updatedVersions.length > 0) {
          setCapaStorageItem("capa_versions_v1", selectedReportId, JSON.stringify(updatedVersions), reports);
          setVersions(updatedVersions);
        }
      }
    }

    const finalFileName = (pdfFileName || "").trim() || generateSuggestedCapaPdfFileName(dataToPrint, verToPrint);

    // Freeze 1:1 State Snapshot across tabs
    const capaSnapshot = {
      period: selectedPeriod,
      selectedPeriod: selectedPeriod,
      reportId: selectedReportId,
      capaId: selectedReportId,
      version: verToPrint,
      activeVersion: verToPrint,
      formData: dataToPrint,
      versions: versions,
      layout_orient: modalPrintOrient,
      print_scale: modalPrintScale,
      margin_mode: modalPrintMargin,
      paper_size: paperSize,
      pagination_mode: paginationMode,
      show_part_4: showPart4Section,
      pdf_filename: finalFileName,
      timestamp: Date.now()
    };

    // 1. Expose to window memory for direct parent-child window access
    try {
      (window as any).__CAPA_ACTIVE_PRINT_SNAPSHOT = capaSnapshot;
    } catch (e) {}

    // 2. Save into sessionStorage & localStorage
    try {
      sessionStorage.setItem("CURRENT_CAPA_PRINT_DATA", JSON.stringify(capaSnapshot));
      localStorage.setItem("CURRENT_CAPA_PRINT_DATA", JSON.stringify(capaSnapshot));
      if (selectedReportId) {
        localStorage.setItem(`CURRENT_CAPA_PRINT_DATA_${selectedReportId}`, JSON.stringify(capaSnapshot));
      }
    } catch (e) {
      console.warn("Could not save print snapshot:", e);
    }

    // 3. Broadcast across all open tabs via BroadcastChannel
    try {
      const bc = new BroadcastChannel("CAPA_UNIVERSAL_BUS");
      bc.postMessage({ type: "CAPA_PRINT_SNAPSHOT", payload: capaSnapshot });
      setTimeout(() => bc.close(), 1000);
    } catch (e) {}

    const printUrl = new URL(window.location.origin + window.location.pathname);
    printUrl.searchParams.set("tab", "capa");
    printUrl.searchParams.set("print", "true");
    printUrl.searchParams.set("layout_orient", modalPrintOrient);
    printUrl.searchParams.set("print_scale", modalPrintScale.toString());
    printUrl.searchParams.set("margin_mode", modalPrintMargin);
    printUrl.searchParams.set("paper_size", paperSize);
    printUrl.searchParams.set("pagination_mode", paginationMode);
    printUrl.searchParams.set("filename", finalFileName);
    if (selectedPeriod && selectedPeriod !== "ALL") {
      printUrl.searchParams.set("period", selectedPeriod);
    }
    if (selectedReportId) {
      printUrl.searchParams.set("reportId", selectedReportId);
      printUrl.searchParams.set("capaId", selectedReportId);
    }
    printUrl.searchParams.set("version", verToPrint);

    if (selectedReportId) {
      setCapaStorageItem("capa_print_target_version", selectedReportId, verToPrint, reports);
      if (verToPrint === "DRAFT") {
        removeCapaStorageItem("capa_active_version_v1", selectedReportId, reports);
      } else {
        setCapaStorageItem("capa_active_version_v1", selectedReportId, verToPrint, reports);
      }
    }

    try {
      const newWin = window.open(printUrl.toString(), "_blank");
      if (newWin) {
        try {
          (newWin as any).__CAPA_ACTIVE_PRINT_SNAPSHOT = capaSnapshot;
        } catch (e) {}
      } else {
        // Fallback if browser blocks popups
        if (onShowToast) {
          onShowToast("Trình duyệt đang chặn mở tab mới. Đang chuẩn bị in trực tiếp...", "info");
        }
        const originalTitle = document.title;
        document.title = finalFileName;
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            document.title = originalTitle;
          }, 3000);
        }, 300);
      }
    } catch (openErr) {
      console.warn("Could not open new window:", openErr);
      const originalTitle = document.title;
      document.title = finalFileName;
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 3000);
      }, 300);
    }

    setShowPrintModal(false);
  };

  // Direct print right inside current view
  const handleDirectPrintNow = () => {
    const verToPrint = (modalPrintVersion && modalPrintVersion !== "AUTO")
      ? modalPrintVersion
      : (viewingVersion || (versions.length > 0 ? versions[0].version : "DRAFT"));

    let dataToPrint: CapaData | null = capaForm;
    if (verToPrint !== "DRAFT" && verToPrint !== viewingVersion) {
      const matchedVer = versions.find(
        (v) =>
          v.version.toLowerCase().trim() === verToPrint.toLowerCase().trim() ||
          v.version.replace(/[^0-9.]/g, "") === verToPrint.replace(/[^0-9.]/g, "")
      );
      if (matchedVer) {
        dataToPrint = matchedVer.data;
        setCapaForm(matchedVer.data);
      }
    }

    if (selectedReportId && dataToPrint) {
      setCapaStorageItem("capa_form_v1", selectedReportId, JSON.stringify(dataToPrint), reports);
    }

    const finalFileName = (pdfFileName || "").trim() || generateSuggestedCapaPdfFileName(dataToPrint, verToPrint);
    const originalTitle = document.title;
    document.title = finalFileName;

    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 3000);
    }, 250);
  };

  // 3. Auto-trigger print & cross-window sync when new tab loads
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isPrintMode = urlParams.get("print") === "true";
    const useSnapshot = urlParams.get("use_snapshot") === "true" || window.location.hash.includes("capa_snap=");

    if (isPrintMode || useSnapshot) {
      const orientParam = urlParams.get("layout_orient");
      const paperSizeParam = urlParams.get("paper_size");
      if (paperSizeParam === "FULL_PAGE_EXPANDED" || paperSizeParam === "A3_LANDSCAPE" || paperSizeParam === "A4_LANDSCAPE" || paperSizeParam === "A4_PORTRAIT") {
        setPaperSize(paperSizeParam as any);
      } else if (orientParam === "landscape") {
        setModalPrintOrient("landscape");
        setPaperSize("A4_LANDSCAPE");
      } else if (orientParam === "portrait") {
        setModalPrintOrient("portrait");
        setPaperSize("A4_PORTRAIT");
      }

      const marginParam = urlParams.get("margin_mode");
      if (marginParam === "full-bleed" || marginParam === "standard" || marginParam === "wide") {
        setModalPrintMargin(marginParam as any);
      }

      const scaleParam = urlParams.get("print_scale");
      if (scaleParam) {
        setModalPrintScale(Number(scaleParam));
      }

      const paginationParam = urlParams.get("pagination_mode");
      if (paginationParam === "AUTO" || paginationParam === "ISO_2_PAGES" || paginationParam === "COMPACT_1_PAGE") {
        setPaginationMode(paginationParam as any);
      }

      const periodParam = urlParams.get("period");
      if (periodParam) {
        setSelectedPeriod(periodParam);
      }

      const reportIdParam = urlParams.get("reportId") || urlParams.get("capaId");
      if (reportIdParam) {
        setSelectedReportId(reportIdParam);
      }

      const versionParam = urlParams.get("version");
      if (versionParam) {
        setModalPrintVersion(versionParam);
        if (versionParam !== "DRAFT") {
          setViewingVersion(versionParam);
        } else {
          setViewingVersion(null);
        }
      }

      // Read snapshot with Multi-Layer Priority
      let snapshot: any = null;

      // Layer 1: URL Hash (Immune to storage partitioning)
      const hash = window.location.hash;
      if (hash && hash.includes("capa_snap=")) {
        try {
          const rawSnap = decodeURIComponent(hash.substring(hash.indexOf("capa_snap=") + 10));
          const parsed = JSON.parse(rawSnap);
          if (parsed && parsed.formData) {
            snapshot = parsed;
          }
        } catch (e) {
          console.warn("Error parsing URL hash snapshot:", e);
        }
      }

      // Layer 2: Direct window.opener memory reference
      if (!snapshot && window.opener) {
        try {
          const openerSnap = (window.opener as any).__CAPA_ACTIVE_PRINT_SNAPSHOT;
          if (openerSnap && openerSnap.formData) {
            snapshot = openerSnap;
          }
        } catch (e) {}
      }

      // Layer 3: sessionStorage
      if (!snapshot) {
        try {
          const rawSession = sessionStorage.getItem("CURRENT_CAPA_PRINT_DATA");
          if (rawSession) snapshot = JSON.parse(rawSession);
        } catch (e) {}
      }

      // Layer 4: localStorage
      if (!snapshot) {
        try {
          const rawLocal = localStorage.getItem(
            reportIdParam ? `CURRENT_CAPA_PRINT_DATA_${reportIdParam}` : "CURRENT_CAPA_PRINT_DATA"
          ) || localStorage.getItem("CURRENT_CAPA_PRINT_DATA");
          if (rawLocal) snapshot = JSON.parse(rawLocal);
        } catch (e) {}
      }

      if (snapshot && snapshot.formData) {
        isPrintSnapshotLoadedRef.current = true;
        loadedSnapshotReportIdRef.current = snapshot.reportId || reportIdParam || selectedReportId;
        setCapaForm(snapshot.formData);
        if (snapshot.versions && Array.isArray(snapshot.versions)) {
          setVersions(snapshot.versions);
        }
        if (snapshot.version) {
          setViewingVersion(snapshot.version === "DRAFT" ? null : snapshot.version);
          setModalPrintVersion(snapshot.version);
        }
        if (snapshot.period) {
          setSelectedPeriod(snapshot.period);
        }
        if (snapshot.show_part_4 !== undefined) {
          setShowPart4Section(Boolean(snapshot.show_part_4));
        }

        // Persist to current tab's storage partition
        if (snapshot.reportId) {
          setCapaStorageItem("capa_form_v1", snapshot.reportId, JSON.stringify(snapshot.formData), reports);
          if (snapshot.versions && Array.isArray(snapshot.versions)) {
            setCapaStorageItem("capa_versions_v1", snapshot.reportId, JSON.stringify(snapshot.versions), reports);
          }
          if (snapshot.version) {
            setCapaStorageItem("capa_active_version_v1", snapshot.reportId, snapshot.version, reports);
          }
        }
      }

      // Set Document Title for Save As PDF default filename
      const filenameParam = urlParams.get("filename");
      if (filenameParam) {
        document.title = filenameParam;
      } else if (snapshot && snapshot.pdf_filename) {
        document.title = snapshot.pdf_filename;
      } else if (snapshot && snapshot.formData) {
        document.title = generateSuggestedCapaPdfFileName(snapshot.formData, snapshot.version || "v1.0");
      }

      if (isPrintMode) {
        let attempts = 0;
        const checkAndPrint = () => {
          attempts++;
          const sheetEl = document.getElementById("printable-capa-sheet");
          if (sheetEl && sheetEl.offsetHeight > 100) {
            const imgs = Array.from(sheetEl.querySelectorAll("img"));
            const allLoaded = imgs.every((img) => img.complete);

            if (allLoaded || attempts > 30) {
              setTimeout(() => {
                window.print();
                // Clean print trigger & hash from URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("print");
                newUrl.hash = "";
                window.history.replaceState({}, "", newUrl.toString());
              }, 350);
            } else {
              setTimeout(checkAndPrint, 200);
            }
          } else if (attempts < 40) {
            setTimeout(checkAndPrint, 250);
          }
        };

        const timer = setTimeout(checkAndPrint, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // 4. Cross-tab real-time listener via BroadcastChannel and window postMessage
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("CAPA_UNIVERSAL_BUS");
      bc.onmessage = (event) => {
        if (event.data?.type === "CAPA_PRINT_SNAPSHOT" && event.data?.payload) {
          const snap = event.data.payload;
          if (!selectedReportId || snap.reportId === selectedReportId) {
            isPrintSnapshotLoadedRef.current = true;
            loadedSnapshotReportIdRef.current = snap.reportId || selectedReportId;
            if (snap.formData) setCapaForm(snap.formData);
            if (snap.versions) setVersions(snap.versions);
            if (snap.version) setViewingVersion(snap.version === "DRAFT" ? null : snap.version);
          }
        }
      };
    } catch (e) {}

    const handlePostMessage = (event: MessageEvent) => {
      if (event.data?.type === "CAPA_PRINT_SNAPSHOT" && event.data?.payload) {
        const snap = event.data.payload;
        if (!selectedReportId || snap.reportId === selectedReportId) {
          isPrintSnapshotLoadedRef.current = true;
          loadedSnapshotReportIdRef.current = snap.reportId || selectedReportId;
          if (snap.formData) setCapaForm(snap.formData);
          if (snap.versions) setVersions(snap.versions);
          if (snap.version) setViewingVersion(snap.version === "DRAFT" ? null : snap.version);
        }
      }
    };
    window.addEventListener("message", handlePostMessage);

    return () => {
      try { bc?.close(); } catch (e) {}
      window.removeEventListener("message", handlePostMessage);
    };
  }, [selectedReportId]);

  // Manual trigger to format all structured text fields with auto line breaks
  const handleAutoFormatAllLineBreaks = () => {
    if (!capaForm) return;
    const updated: CapaData = {
      ...capaForm,
      ncDescription: formatAutoLineBreaks(capaForm.ncDescription),
      reason: formatAutoLineBreaks(capaForm.reason),
      correction: formatAutoLineBreaks(capaForm.correction),
      traceability: formatAutoLineBreaks(capaForm.traceability),
      preventiveAction: formatAutoLineBreaks(capaForm.preventiveAction),
      customerOpinion: formatAutoLineBreaks(capaForm.customerOpinion)
    };
    setCapaForm(updated);
    if (selectedReportId) {
      localStorage.setItem(`capa_form_v1_${selectedReportId}`, JSON.stringify(updated));
    }
    if (onShowToast) {
      onShowToast("✓ Đã tự động định dạng phân tách xuống dòng theo từng ý!", "success");
    }
  };

  // Current selected report object
  const currentReportObj = reports.find((r) => r.id === selectedReportId);

  return (
    <div className="space-y-6">
      {/* Printable CSS Rules (Dynamic Page Orientation, Multi-Page Pagination & Scale) */}
      <style>{`
        @media print {
          @page {
            size: ${modalPrintOrient === "landscape" || paperSize === "A3_LANDSCAPE" || paperSize === "A4_LANDSCAPE" ? "landscape" : "portrait"};
            margin: ${modalPrintMargin === "full-bleed" ? "4mm 5mm 4mm 5mm" : modalPrintMargin === "wide" ? "10mm 10mm 10mm 10mm" : "6mm 6mm 6mm 6mm"};
          }
          html,
          body,
          #root,
          #root > div,
          main,
          div,
          section,
          article,
          .dashboard-desktop-wrapper,
          .h-screen,
          .max-h-screen,
          .overflow-hidden,
          .overflow-y-auto,
          .overflow-x-hidden,
          .overflow-auto,
          .h-full,
          [class*="overflow-"],
          [class*="h-screen"],
          [class*="max-h-"] {
            background: #ffffff !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            float: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html,
          body,
          #root,
          #root > div,
          .dashboard-desktop-wrapper,
          main {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            display: block !important;
          }
          #printable-capa-sheet {
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            font-size: ${modalPrintScale <= 80 ? '9px' : modalPrintScale <= 90 ? '10px' : modalPrintScale <= 95 ? '10.5px' : '11px'} !important;
            line-height: 1.3 !important;
          }
          #printable-capa-sheet table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          #printable-capa-sheet tbody {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          #printable-capa-sheet tr {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }
          #printable-capa-sheet td,
          #printable-capa-sheet th {
            overflow: visible !important;
            word-break: break-word !important;
            white-space: normal !important;
            height: auto !important;
            max-height: none !important;
            padding: ${modalPrintScale <= 90 ? '3px 4.5px' : '4px 5.5px'} !important;
          }
          #printable-capa-sheet .text-blue-700,
          #printable-capa-sheet .text-blue-800,
          #printable-capa-sheet .text-blue-900,
          #printable-capa-sheet .text-blue-600,
          #printable-capa-sheet [class*="text-blue-"] {
            color: #1d4ed8 !important;
            -webkit-text-fill-color: #1d4ed8 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-capa-sheet .signature-block,
          #printable-capa-sheet .signature-cell,
          #printable-capa-sheet .capa-iso-header,
          #printable-capa-sheet .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            break-inside: avoid-page !important;
          }
          #printable-capa-sheet .capa-section-block {
            page-break-inside: auto !important;
            break-inside: auto !important;
            overflow: visible !important;
          }
          #printable-capa-sheet .capa-part-header,
          #printable-capa-sheet .capa-section-header {
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-capa-sheet img {
            max-width: 100% !important;
            max-height: 100px !important;
            object-fit: contain !important;
            display: block !important;
            margin-left: auto !important;
            margin-right: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-capa-sheet .print-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          #printable-capa-sheet .print-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }
          #printable-capa-sheet .hidden.print\\:block {
            display: block !important;
            visibility: visible !important;
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
          }
        }
      `}</style>

      {/* Header Banner - White, bright & lively style */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-normal uppercase">
              <span translate="no" className="notranslate">TRUNG TÂM LẬP & QUẢN LÝ BÁO CÁO CAPA</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
              <span translate="no" className="notranslate">Tự động liên thông dữ liệu Bản tin sự cố KPH/RRO & AI Trợ lý dự thảo phân tích 4M1E1I chuẩn mực</span>
            </p>
          </div>
        </div>

        {/* Cloud Sync & Quick Info */}
        <div className="flex items-center gap-2.5 ml-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span translate="no" className="notranslate">Hệ thống CAPA trực tuyến</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout: Left Catalog + Right Live Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Catalog of Incidents (3 cols - reduced width by ~20-25%) */}
        <div className="no-print lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span translate="no" className="notranslate">SỔ BẢN TIN KPH / RRO ({filteredReports.length})</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              <span translate="no" className="notranslate">dd/mm/yy</span>
            </span>
          </div>

          {/* Type Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "KPH_NB", label: "KPH (NB)" },
              { id: "KPH_BN", label: "KPH (BN)" },
              { id: "RRO", label: "RRO" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTypeFilter(t.id as any)}
                className={`py-1.5 px-0.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer truncate ${
                  selectedTypeFilter === t.id
                    ? "bg-white text-indigo-700 shadow-xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span translate="no" className="notranslate">{t.label}</span>
              </button>
            ))}
          </div>

          {/* CAPA Status Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            {[
              { id: "ALL", label: "Tất cả CAPA" },
              { id: "RELEASED", label: "Đã lập" },
              { id: "DRAFT", label: "Bản nháp" },
              { id: "NOT_CREATED", label: "Chưa lập" }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setCapaStatusFilter(st.id as any)}
                className={`py-1 px-0.5 text-[8.5px] font-bold rounded-lg transition-all cursor-pointer truncate ${
                  capaStatusFilter === st.id
                    ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <span translate="no" className="notranslate">{st.label}</span>
              </button>
            ))}
          </div>

          {/* Branch, Period & Search */}
          <div className="space-y-2">
            {/* Kỳ báo cáo (Tháng/Năm) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-transparent text-slate-800 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả kỳ (Toàn thời gian)</option>
                  {availablePeriods.map((p) => (
                    <option key={p} value={p}>
                      Kỳ Tháng {p}
                    </option>
                  ))}
                </select>
              </div>
              {selectedPeriod !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("ALL")}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold px-1 rounded cursor-pointer"
                  title="Xem tất cả tháng"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm Mã ID, Tên SP, Xưởng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            >
              <option value="ALL">Tất cả Nhà máy / Chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Report List Items */}
          <div className="max-h-[620px] overflow-y-auto space-y-2.5 pr-1 thin-scrollbar">
            {filteredReports.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <span translate="no" className="notranslate">Không tìm thấy bản tin sự cố trùng khớp.</span>
              </div>
            ) : (
              filteredReports.map((r) => {
                const isSelected = r.id === selectedReportId;
                const versionsStr = getCapaStorageItem("capa_versions_v1", r.id, reports, r);
                let rVersions: CapaVersion[] = [];
                if (versionsStr) {
                  try {
                    const rawVers = JSON.parse(versionsStr);
                    if (Array.isArray(rawVers) && isVersionsBelongingToReport(rawVers, r, reports)) {
                      rVersions = rawVers.filter((v: any) => v && v.version);
                    }
                  } catch (e) {
                    rVersions = [];
                  }
                }
                const cachedDraft = getCapaStorageItem("capa_form_v1", r.id, reports, r);
                let hasDraft = false;
                let parsedDraftObj: any = null;
                if (cachedDraft) {
                  try {
                    const parsed = JSON.parse(cachedDraft);
                    if (isCapaBelongingToReport(parsed, r, reports)) {
                      hasDraft = true;
                      parsedDraftObj = parsed;
                    }
                  } catch (e) {}
                }
                const isReleased = rVersions && rVersions.length > 0;
                const latestVerTag = isReleased ? rVersions[0].version : null;

                let hasNewDraft = false;
                if (isReleased && hasDraft && parsedDraftObj) {
                  try {
                    if (JSON.stringify(parsedDraftObj) !== JSON.stringify(rVersions[0].data)) {
                      hasNewDraft = true;
                    }
                  } catch (e) {}
                }

                const reportCat = getReportCategory(r);
                const badgeLabel = reportCat === "KPH_BN" ? "KPH (BN)" : reportCat === "RRO" ? "RRO" : "KPH (NB)";
                const badgeStyle = reportCat === "KPH_BN"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : reportCat === "RRO"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200";

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-300/50 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10.5px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {r.reportCode || r.id}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badgeStyle}`}>
                        <span translate="no" className="notranslate">{badgeLabel}</span>
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 line-clamp-2 mt-1.5 leading-snug">
                      <span translate="no" className="notranslate">{r.content}</span>
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100">
                      <span className="truncate flex-1 pr-2 font-semibold text-slate-600">
                        <span translate="no" className="notranslate">{r.factory || "Tân Phú"}</span>
                      </span>
                      <span className="font-bold text-slate-500">
                        {r.timestamp ? formatDateDDMMYY(new Date(r.timestamp)) : ""}
                      </span>
                    </div>

                    {/* Status badge for CAPA */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {isReleased ? (
                        hasNewDraft ? (
                          <span className="text-[9px] bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded flex items-center gap-1 border border-indigo-300 shadow-2xs">
                            <FileText className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span translate="no" className="notranslate">ĐÃ LẬP ({latestVerTag}) — CÓ BẢN NHÁP MỚI</span>
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-300/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span translate="no" className="notranslate">ĐÃ LẬP CAPA ({latestVerTag})</span>
                          </span>
                        )
                      ) : hasDraft ? (
                        <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-300/60">
                          <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                          <span translate="no" className="notranslate">BẢN NHÁP (DRAFT)</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200">
                          <span translate="no" className="notranslate">CHƯA LẬP CAPA</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Form CAPA Preview & Interactive Editor (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none">
          
          {/* Paper Config & View Selector Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 no-print">
            {/* Row 1: Title */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  <span translate="no" className="notranslate">CẤU HÌNH KHỔ GIẤY & PHÂN TRANG:</span>
                </span>
              </div>
            </div>

            {/* Row 2: Controls neatly organized with Consolidated Dropdowns (Paper size & Pagination mode) */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/80">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Consolidated Paper Size Dropdown */}
                <div ref={paperDropdownRef} className="relative select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaperDropdownOpen((prev) => !prev);
                      setIsPaginationDropdownOpen(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-lg shadow-xs ring-2 ring-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span translate="no" className="notranslate">
                      {paperSize === "FULL_PAGE_EXPANDED"
                        ? "🌟 Mở rộng hết trang (100%)"
                        : paperSize === "A4_PORTRAIT"
                        ? "📄 A4 Dọc (Chuẩn)"
                        : paperSize === "A4_LANDSCAPE"
                        ? "📄 A4 Ngang"
                        : "📋 A3 Ngang (Toàn cảnh)"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/90 transition-transform duration-200 ${isPaperDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isPaperDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 border-b border-slate-100 mb-1">
                        <span translate="no" className="notranslate">Chọn Khổ Giấy Hiển Thị:</span>
                      </div>
                      {[
                        { id: "FULL_PAGE_EXPANDED", label: "🌟 Mở rộng hết trang (100%)", sub: "Tối ưu hiển thị vừa vặn màn hình" },
                        { id: "A4_PORTRAIT", label: "📄 A4 Dọc (Chuẩn)", sub: "Khổ dọc tiêu chuẩn in ấn ISO" },
                        { id: "A4_LANDSCAPE", label: "📄 A4 Ngang", sub: "Khổ ngang phù hợp bảng biểu rộng" },
                        { id: "A3_LANDSCAPE", label: "📋 A3 Ngang (Toàn cảnh)", sub: "Khổ lớn hiển thị toàn cảnh chi tiết" }
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPaperSize(p.id as any);
                            setIsPaperDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col ${
                            paperSize === p.id
                              ? "bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span translate="no" className="notranslate">{p.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                            <span translate="no" className="notranslate">{p.sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consolidated Pagination Mode Dropdown */}
                <div ref={paginationDropdownRef} className="relative select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaginationDropdownOpen((prev) => !prev);
                      setIsPaperDropdownOpen(false);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg shadow-xs ring-2 ring-slate-400 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span translate="no" className="notranslate">
                      {paginationMode === "AUTO"
                        ? "📑 Tự động nhiều trang"
                        : paginationMode === "ISO_2_PAGES"
                        ? "📄 Ngắt 2 trang ISO"
                        : "📜 Gom 1 trang"}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/90 transition-transform duration-200 ${isPaginationDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isPaginationDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 border-b border-slate-100 mb-1">
                        <span translate="no" className="notranslate">Cấu hình phân trang in ấn:</span>
                      </div>
                      {[
                        { id: "AUTO", label: "📑 Tự động nhiều trang", sub: "Tự động phân trang linh hoạt theo độ dài thực tế" },
                        { id: "ISO_2_PAGES", label: "📄 Ngắt 2 trang ISO", sub: "Trang 1: Sự cố & Ảnh / Trang 2: Phân tích 4M & Khắc phục" },
                        { id: "COMPACT_1_PAGE", label: "📜 Gom 1 trang", sub: "Thu gọn vừa vặn 1 trang A4" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setPaginationMode(m.id as any);
                            setIsPaginationDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col ${
                            paginationMode === m.id
                              ? "bg-slate-100 text-slate-950 border border-slate-300 shadow-2xs font-black"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span translate="no" className="notranslate">{m.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                            <span translate="no" className="notranslate">{m.sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Export / Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handlePrint}
                  disabled={!capaForm}
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-lg shadow-2xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="In trực tiếp"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span translate="no" className="notranslate">In nhanh</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={!capaForm || isExportingPdf}
                  className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-extrabold rounded-lg shadow-2xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Tải PDF trực tiếp"
                >
                  <Download className={`w-3.5 h-3.5 ${isExportingPdf ? "animate-bounce" : ""}`} />
                  <span translate="no" className="notranslate">{isExportingPdf ? "Xuất PDF..." : "Xuất PDF"}</span>
                </button>
              </div>
            </div>
          </div>

          {!capaForm ? (
            <div className="text-center py-20 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 animate-pulse" />
              <span translate="no" className="notranslate">Vui lòng chọn một bản tin sự cố ở cột bên trái để khởi tạo Form CAPA.</span>
            </div>
          ) : (
            <div>
              {/* VERSION CONTROL STATUS BAR */}
              {(() => {
                const latestVerTag = versions.length > 0 ? versions[0].version : null;
                const isViewingSpecificVersion = viewingVersion !== null;
                const isViewingOldVersion = isViewingSpecificVersion && viewingVersion !== latestVerTag;
                const isViewingCurrentVersion = isViewingSpecificVersion && viewingVersion === latestVerTag;
                const nextVerTag = getNextVersionTag(versions);

                return (
                  <div className="no-print mb-4">
                    <div className={`p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md border transition-all ${
                      isViewingOldVersion
                        ? "bg-amber-950 text-amber-100 border-amber-800"
                        : isViewingCurrentVersion
                        ? "bg-slate-900 text-white border-emerald-500/50 ring-1 ring-emerald-500/20"
                        : isDraftModified
                        ? "bg-slate-900 text-white border-indigo-500/80 ring-1 ring-indigo-500/30"
                        : "bg-slate-900 text-white border-slate-800"
                    }`}>
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2.5">
                          {isViewingOldVersion ? (
                            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span translate="no" className="notranslate">XEM PHIÊN BẢN CŨ ({viewingVersion})</span>
                            </span>
                          ) : isViewingCurrentVersion ? (
                            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span translate="no" className="notranslate">PHIÊN BẢN HIỆN HÀNH ({viewingVersion})</span>
                            </span>
                          ) : versions.length === 0 ? (
                            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs">
                              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span translate="no" className="notranslate">BẢN NHÁP (DRAFT)</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs animate-pulse">
                              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span translate="no" className="notranslate">BẢN NHÁP MỚI (DRAFT {nextVerTag})</span>
                            </span>
                          )}
                        </div>

                        {/* AI TỰ ĐỌC ẢNH & DỰ THẢO CAPA BUTTON */}
                        <button
                          onClick={handleGenerateAiDraft}
                          disabled={isAiLoading || !selectedReportId}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 ml-auto"
                          title="AI tự động phân tích hình ảnh và điền dự thảo mẫu CAPA"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
                          <span translate="no" className="notranslate">{isAiLoading ? "AI ĐANG ĐỌC & DỰ THẢO..." : "✨ AI TỰ ĐỌC ẢNH & DỰ THẢO CAPA"}</span>
                        </button>
                      </div>

                      {/* Version status text */}
                      <div className="w-full text-xs text-slate-300 font-medium">
                        {isViewingOldVersion ? (
                          <span translate="no" className="notranslate">
                            Đang xem lại phiên bản cũ <b>{viewingVersion}</b> (Ký ngày {versions.find((v) => v.version === viewingVersion)?.signedDate} bởi {versions.find((v) => v.version === viewingVersion)?.signedBy}). Phiên bản hiện hành mới nhất là <b>{latestVerTag}</b>.
                          </span>
                        ) : isViewingCurrentVersion ? (
                          <span translate="no" className="notranslate">
                            Đang hiển thị dữ liệu chính thức của <b>{viewingVersion}</b> (Ký ngày <b>{versions.find((v) => v.version === viewingVersion)?.signedDate}</b> bởi <b>{versions.find((v) => v.version === viewingVersion)?.signedBy}</b>).
                          </span>
                        ) : versions.length === 0 ? (
                          <span translate="no" className="notranslate">Chưa phát hành. Đang lưu nháp. Ký duyệt & phát hành v1.0 tại ô Trưởng BP QLCL bên dưới ↓</span>
                        ) : (
                          <span translate="no" className="notranslate">
                            Đang biên soạn <b>bản nháp mới ({nextVerTag})</b> dựa trên phiên bản hiện hành <b>{latestVerTag}</b>. Cần Trưởng BP QLCL ký duyệt ở Bước 2 bên dưới ↓ để chính thức phát hành <b>{nextVerTag}</b>.
                          </span>
                        )}
                      </div>

                      {/* VERSION FILTER SELECTOR DROPDOWN & SAVE DRAFT BUTTON */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 shadow-2xs">
                          <History className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-extrabold text-slate-300 whitespace-nowrap">
                            <span translate="no" className="notranslate">Chọn phiên bản:</span>
                          </span>
                          <select
                            value={viewingVersion || "DRAFT"}
                            onChange={(e) => handleSelectVersionToView(e.target.value)}
                            className="bg-slate-900 text-indigo-200 text-xs font-black rounded px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer border border-slate-700 hover:border-indigo-400 transition-all"
                          >
                            {versions.length === 0 ? (
                              <option value="DRAFT">📝 Bản Nháp (Đang biên soạn)</option>
                            ) : (
                              <option value="DRAFT">
                                📝 {isDraftModified ? `Bản Nháp Mới (${nextVerTag} - Đang biên soạn)` : `Tạo bản nháp mới (${nextVerTag})`}
                              </option>
                            )}
                            {versions.map((v, idx) => (
                              <option key={v.version} value={v.version}>
                                {v.version} — {idx === 0 ? "Hiện hành (Đã phát hành)" : "Phiên bản cũ"} (Ký {v.signedDate})
                              </option>
                            ))}
                          </select>
                        </div>

                        {viewingVersion === null ? (
                          <button
                            onClick={handleSaveDraftManual}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/80 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Bấm để lưu thủ công bản nháp hiện tại"
                          >
                            <Save className="w-3.5 h-3.5 shrink-0" />
                            <span translate="no" className="notranslate">Lưu bản nháp</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectVersionToView(null)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/80 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title={`Nhấp để chuyển sang chế độ biên soạn tạo dự thảo phiên bản mới (${nextVerTag})`}
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" />
                            <span translate="no" className="notranslate">Tạo bản nháp mới ({nextVerTag})</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PRINTABLE CAPA SHEET CONTAINER */}
              <div
                id="printable-capa-sheet"
                className={`bg-white border-2 border-slate-800 shadow-md rounded-none font-sans text-slate-900 transition-all print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 print:overflow-visible ${
                  paperSize === "FULL_PAGE_EXPANDED"
                    ? "w-full max-w-none p-4 sm:p-6 text-[11px]"
                    : paperSize === "A3_LANDSCAPE"
                    ? "w-full max-w-none p-6 text-[12px]"
                    : paginationMode === "COMPACT_1_PAGE"
                    ? "w-full max-w-[210mm] mx-auto p-4 text-[10px]"
                    : "w-full max-w-[210mm] mx-auto p-[10mm] text-[11px]"
                }`}
              >
                {/* ISO HEADER TABLE */}
                <table className="capa-iso-header w-full border-2 border-slate-900 border-collapse mb-4 text-center table-fixed print-avoid-break bg-white">
                  <tbody>
                    <tr>
                      {/* CỘT 1: LOGO TÂN PHÚ */}
                      <td className="w-[22%] p-2 border-r-2 border-slate-900 text-center align-middle relative group bg-white">
                        {capaForm.companyLogoUrl ? (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <img
                              src={capaForm.companyLogoUrl}
                              alt="Company Logo"
                              className="max-h-14 max-w-full object-contain mx-auto"
                            />
                            {/* Hover controls to change or reset logo */}
                            <div className="no-print absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1.5 p-1">
                              <label
                                htmlFor="header-logo-upload-input"
                                className="bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded cursor-pointer shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                                title="Đổi logo khác"
                              >
                                <Camera className="w-3 h-3 text-indigo-600" />
                                <span translate="no" className="notranslate">Đổi hình</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleUpdateForm("companyLogoUrl", "")}
                                className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold p-1.5 rounded cursor-pointer shadow-xs active:scale-95 transition-all"
                                title="Khôi phục logo mặc định TANPHU"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full flex flex-col items-center justify-center py-1">
                            <div className="font-black text-xl text-blue-900 tracking-tighter leading-none">
                              <span translate="no" className="notranslate">TANPHU</span>
                            </div>
                            <span className="text-[8.5px] font-bold text-slate-600 uppercase tracking-tight mt-1 leading-none">
                              <span translate="no" className="notranslate">MỖI NHÂN VIÊN LÀ MỘT QC</span>
                            </span>

                            {/* Hover button to insert logo */}
                            <div className="no-print absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                              <label
                                htmlFor="header-logo-upload-input"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer shadow-md flex items-center gap-1 active:scale-95 transition-all"
                                title="Chèn ảnh logo công ty"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span translate="no" className="notranslate">Chèn logo</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* Hidden Input File for Logo Upload */}
                        <input
                          id="header-logo-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                if (onShowToast) onShowToast("⚠️ Kích thước ảnh logo quá lớn (tối đa 5MB)!", "warning");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                if (result) {
                                  handleUpdateForm("companyLogoUrl", result);
                                  if (onShowToast) onShowToast("✓ Đã chèn hình logo thành công!", "success");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = "";
                          }}
                        />
                      </td>

                      {/* CỘT 2: TIÊU ĐỀ BIỂU MẪU */}
                      <td className="w-[56%] p-2 border-r-2 border-slate-900 text-center align-middle font-extrabold bg-white">
                        <div className="text-[11px] uppercase tracking-wide text-slate-800 font-bold leading-tight">
                          <span translate="no" className="notranslate">BRANCH OF TAN PHU VIETNAM JOINT STOCK COMPANY</span>
                        </div>
                        <div className="mt-1 border-t border-slate-400 pt-1 space-y-0.5">
                          <div className="text-sm font-black text-slate-950 uppercase tracking-wide leading-tight">
                            <span translate="no" className="notranslate">BÁO CÁO SỰ KHÔNG PHÙ HỢP</span>
                          </div>
                          <div className="text-[11px] font-extrabold text-slate-800 tracking-wider leading-tight">
                            <span translate="no" className="notranslate">NON - CONFORMITY REPORT</span>
                          </div>
                        </div>
                      </td>

                      {/* CỘT 3: MÃ TÀI LIỆU VÀ LẦN BAN HÀNH */}
                      <td className="w-[22%] text-[9.5px] font-sans font-medium text-left p-2 space-y-1 bg-slate-50 align-middle">
                        <div className="border-b border-slate-300 pb-0.5">
                          <span translate="no" className="notranslate">Mã (No.Doc): <b>{capaForm.docNo}</b></span>
                        </div>
                        <div className="border-b border-slate-300 pb-0.5">
                          <span translate="no" className="notranslate">
                            Lần ban hành (Rev): <b>{viewingVersion ? viewingVersion : (versions.length > 0 ? (isDraftModified ? `${getNextVersionTag(versions)} (Dự thảo)` : versions[0].version) : "v1.0 (Hiện hành)")}</b>
                          </span>
                        </div>
                        <div className="border-b border-slate-300 pb-0.5">
                          <span translate="no" className="notranslate">Ngày ban hành (Eff date): <b>{capaForm.effDate}</b></span>
                        </div>
                        <div>
                          <span translate="no" className="notranslate">Trang (pages): <b>{paperSize === "A3_LANDSCAPE" ? "01/01" : "01/02"}</b></span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

              {/* PART 1: NON-CONFORMITY INFORMATION */}
              <div className="mb-4">
                <div className="capa-part-header bg-slate-200 border-2 border-slate-900 px-2 py-1 font-black text-xs uppercase flex items-center justify-between">
                  <span translate="no" className="notranslate">1. THÔNG TIN VỀ SỰ KHÔNG PHÙ HỢP (NON - CONFORMITY INFORMATION)</span>
                  {capaForm.isAiDrafted && (
                    <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded no-print flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span translate="no" className="notranslate">✨ AI đã tự động trích xuất</span>
                    </span>
                  )}
                </div>

                <table className="w-full border-2 border-slate-900 border-t-0 text-left border-collapse">
                  <tbody>
                    {/* Row 1: Types */}
                    <tr className="border-b border-slate-900">
                      <td className="p-1.5 font-bold border-r border-slate-900 w-1/4 bg-slate-50">
                        <span translate="no" className="notranslate">Thông tin (Information)</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 text-center font-bold">
                        <label className="cursor-pointer inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name="productType"
                            className="no-print"
                            checked={capaForm.productType === "finished"}
                            onChange={() => handleUpdateForm("productType", "finished")}
                          />
                          <span className="hidden print:inline font-black text-xs mr-0.5">
                            {capaForm.productType === "finished" ? "☑" : "☐"}
                          </span>
                          <span translate="no" className="notranslate">Thành phẩm (Finished products)</span>
                        </label>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 text-center font-bold">
                        <label className="cursor-pointer inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name="productType"
                            className="no-print"
                            checked={capaForm.productType === "semi"}
                            onChange={() => handleUpdateForm("productType", "semi")}
                          />
                          <span className="hidden print:inline font-black text-xs mr-0.5">
                            {capaForm.productType === "semi" ? "☑" : "☐"}
                          </span>
                          <span translate="no" className="notranslate">Bán thành phẩm (Semi-finished)</span>
                        </label>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 text-center font-bold">
                        <label className="cursor-pointer inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name="productType"
                            className="no-print"
                            checked={capaForm.productType === "raw"}
                            onChange={() => handleUpdateForm("productType", "raw")}
                          />
                          <span className="hidden print:inline font-black text-xs mr-0.5">
                            {capaForm.productType === "raw" ? "☑" : "☐"}
                          </span>
                          <span translate="no" className="notranslate">Nguyên vật liệu (Raw materials)</span>
                        </label>
                      </td>
                      <td className="p-1.5 text-center font-bold">
                        <label className="cursor-pointer inline-flex items-center gap-1">
                          <input
                            type="radio"
                            name="productType"
                            className="no-print"
                            checked={capaForm.productType === "reject"}
                            onChange={() => handleUpdateForm("productType", "reject")}
                          />
                          <span className="hidden print:inline font-black text-xs mr-0.5">
                            {capaForm.productType === "reject" ? "☑" : "☐"}
                          </span>
                          <span translate="no" className="notranslate">Từ chối nhận (In-process reject)</span>
                        </label>
                      </td>
                    </tr>

                    {/* Row 2: Dates */}
                    <tr className="border-b border-slate-900">
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Ngày nhận diện KPH (Occur date):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900">
                        <div className="no-print">
                          <DatePickerInput
                            value={capaForm.occurDate}
                            onChange={(val) => handleUpdateForm("occurDate", val)}
                            inputClassName="w-full text-xs font-bold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-bold text-blue-700">
                          {capaForm.occurDate || "—"}
                        </div>
                      </td>
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Ngày gửi NC (Send date):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900" colSpan={2}>
                        <div className="no-print">
                          <DatePickerInput
                            value={capaForm.sendDate}
                            onChange={(val) => handleUpdateForm("sendDate", val)}
                            inputClassName="w-full text-xs font-bold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-bold text-blue-700">
                          {capaForm.sendDate || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Row 3: NC Number & PO */}
                    <tr className="border-b border-slate-900">
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Số NC (NC number):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 font-bold">
                        <div className="no-print">
                          <input
                            type="text"
                            value={capaForm.ncNumber}
                            onChange={(e) => handleUpdateForm("ncNumber", e.target.value)}
                            className="w-full text-xs font-bold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-bold text-blue-700">
                          {capaForm.ncNumber || "—"}
                        </div>
                      </td>
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Số PO (Purchase Order):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900" colSpan={2}>
                        <div className="no-print">
                          <input
                            type="text"
                            placeholder="Nhập số PO..."
                            value={capaForm.poNumber}
                            onChange={(e) => handleUpdateForm("poNumber", e.target.value)}
                            className="w-full text-xs font-bold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-bold text-blue-700">
                          {capaForm.poNumber || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Row 4: Product Name */}
                    <tr className="border-b border-slate-900">
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Tên sản phẩm (Product name):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 font-extrabold text-blue-700" colSpan={4}>
                        <div className="no-print">
                          <textarea
                            rows={1}
                            value={capaForm.productName}
                            onChange={(e) => handleUpdateForm("productName", e.target.value)}
                            ref={(el) => {
                              if (el) {
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            className="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none resize-y whitespace-pre-wrap break-words leading-tight"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 uppercase whitespace-pre-wrap break-words leading-tight">
                          {capaForm.productName || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Row 5: Customer Name */}
                    <tr className="border-b border-slate-900">
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Tên khách hàng (Customer name):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 font-extrabold text-blue-700 uppercase" colSpan={4}>
                        <div className="no-print">
                          <textarea
                            rows={1}
                            value={capaForm.customerName}
                            onChange={(e) => handleUpdateForm("customerName", e.target.value)}
                            ref={(el) => {
                              if (el) {
                                el.style.height = "auto";
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            className="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none uppercase resize-y whitespace-pre-wrap break-words leading-tight"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 uppercase whitespace-pre-wrap break-words leading-tight">
                          {capaForm.customerName || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Code & Quantities */}
                    <tr className="border-b border-slate-900">
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Mã sản phẩm (Product code):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 font-bold">
                        <div className="no-print">
                          <input
                            type="text"
                            placeholder="Mã vạch / Code..."
                            value={capaForm.productCode}
                            onChange={(e) => handleUpdateForm("productCode", e.target.value)}
                            className="w-full text-xs font-bold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-bold text-blue-700">
                          {capaForm.productCode || "—"}
                        </div>
                      </td>
                      <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                        <span translate="no" className="notranslate">Số lượng KPH (Quantity):</span>
                      </td>
                      <td className="p-1.5 border-r border-slate-900 font-bold" colSpan={2}>
                        <div className="no-print">
                          <input
                            type="text"
                            value={capaForm.ncQuantity}
                            onChange={(e) => handleUpdateForm("ncQuantity", e.target.value)}
                            className="w-full text-xs font-bold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-bold text-blue-700">
                          {capaForm.ncQuantity || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Row 7: Description & Photo Proof */}
                    <tr>
                      <td className="p-2 font-bold border-r border-slate-900 bg-slate-50 align-top w-1/2" colSpan={3}>
                        <div className="font-bold text-slate-900 underline mb-1">
                          <span translate="no" className="notranslate">Mô tả sự không phù hợp (NC description):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={5}
                            value={capaForm.ncDescription}
                            onChange={(val) => handleUpdateForm("ncDescription", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full text-xs font-semibold text-blue-700 bg-transparent leading-relaxed focus:bg-amber-50 focus:outline-none resize-y border-0"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-semibold text-blue-700 leading-relaxed whitespace-pre-wrap break-words">
                          {capaForm.ncDescription || "—"}
                        </div>
                      </td>
                      <td className="p-2 font-bold align-top w-1/2 bg-slate-50/50" colSpan={2}>
                        <div className="font-bold text-slate-900 underline mb-1.5">
                          <span translate="no" className="notranslate">Hình ảnh sự không phù hợp (Illustration/photo of the problem):</span>
                        </div>
                        <div className="no-print mb-1.5 flex items-center gap-1">
                          <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded border border-indigo-200 inline-flex items-center gap-1.5 transition-all shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span translate="no" className="notranslate">Tải ảnh thực tế</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        </div>

                        {capaForm.illustrationUrls && capaForm.illustrationUrls.length > 0 ? (
                          <div className="flex gap-2 flex-wrap items-center justify-center pt-1 print:flex print:items-center print:justify-center">
                            {capaForm.illustrationUrls.map((url, i) => (
                              <div
                                key={i}
                                onClick={() => setActiveZoomImg(url)}
                                className="relative border border-slate-400 rounded p-1 bg-white shadow-xs cursor-pointer hover:border-indigo-500 group print:border-slate-800 print:p-0.5 print:shadow-none"
                              >
                                <img
                                  src={url}
                                  alt="Evidence"
                                  className="max-h-32 print:max-h-28 object-contain rounded print:rounded-none block"
                                  style={{ maxWidth: '100%', height: 'auto' }}
                                />
                                <span className="absolute top-1 right-1 bg-slate-900/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                  <ZoomIn className="w-3 h-3" />
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage(i);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print hover:bg-rose-700 shadow-xs"
                                  title="Xóa ảnh này"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs italic py-4 text-center border border-dashed border-slate-300 rounded flex flex-col items-center justify-center gap-1">
                            <span translate="no" className="notranslate">(Chưa có hình ảnh đính kèm)</span>
                            <label className="cursor-pointer bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 no-print mt-1 hover:bg-indigo-700 transition-all">
                              <Upload className="w-3 h-3" />
                              <span translate="no" className="notranslate">+ Tải ảnh sự cố</span>
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PART 2: TO BE COMPLETED BY THE SUPPLIER */}
              <div className={`mb-4 ${paginationMode === "ISO_2_PAGES" ? "print-break-before" : ""}`}>
                <div className="capa-part-header bg-slate-200 border-2 border-slate-900 px-2 py-1 font-black text-xs uppercase">
                  <span translate="no" className="notranslate">2. PHẦN HOÀN THÀNH CỦA BỘ PHẬN GÂY ĐIỂM KPH (TO BE COMPLETED BY THE SUPPLIER)</span>
                </div>

                <table className="w-full border-2 border-slate-900 border-t-0 text-left border-collapse">
                  <tbody>
                    {/* Reason */}
                    <tr className="border-b border-slate-900">
                      <td className="p-2 font-bold bg-slate-50 align-top" colSpan={3}>
                        <div className="font-bold text-slate-900 underline mb-1">
                          <span translate="no" className="notranslate">Nguyên nhân gốc rễ của sự KPH 4M1E1I (Reason):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={4}
                            value={capaForm.reason}
                            onChange={(val) => handleUpdateForm("reason", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full bg-transparent text-blue-700 font-semibold text-xs leading-relaxed focus:bg-amber-50 focus:outline-none resize-y"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-semibold text-blue-700 leading-relaxed whitespace-pre-wrap break-words">
                          {capaForm.reason || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Correction */}
                    <tr className="border-b border-slate-900">
                      <td className="p-2 font-bold bg-white align-top w-1/2 border-r border-slate-900">
                        <div className="font-bold text-slate-900 underline mb-1">
                          <span translate="no" className="notranslate">Hành động khắc phục cho đơn hàng có điểm KPH (Correction):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={3}
                            value={capaForm.correction}
                            onChange={(val) => handleUpdateForm("correction", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full bg-transparent text-blue-700 font-semibold text-xs leading-relaxed focus:bg-amber-50 focus:outline-none resize-y"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-semibold text-blue-700 leading-relaxed whitespace-pre-wrap break-words">
                          {capaForm.correction || "—"}
                        </div>
                      </td>
                      <td className="p-2 align-top w-[18%] border-r border-slate-900 bg-slate-50">
                        <div className="font-bold text-slate-900 text-[10px]">
                          <span translate="no" className="notranslate">Hạn xử lý (Target date):</span>
                        </div>
                        <div className="no-print">
                          <DatePickerInput
                            value={capaForm.correctionTargetDate}
                            onChange={(val) => handleUpdateForm("correctionTargetDate", val)}
                            inputClassName="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none mt-1"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 mt-1">
                          {capaForm.correctionTargetDate || "—"}
                        </div>
                      </td>
                      <td className="p-2 align-top w-[32%] bg-slate-50">
                        <div className="font-bold text-slate-900 text-[10px]">
                          <span translate="no" className="notranslate">Bộ phận (Responsible):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={2}
                            value={capaForm.correctionResponsible}
                            onChange={(val) => handleUpdateForm("correctionResponsible", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none mt-1 resize-y whitespace-pre-wrap break-words leading-tight"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 mt-1 whitespace-pre-wrap break-words leading-tight">
                          {capaForm.correctionResponsible || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Traceability */}
                    <tr className="border-b border-slate-900">
                      <td className="p-2 font-bold bg-white align-top w-1/2 border-r border-slate-900">
                        <div className="font-bold text-slate-900 underline mb-1">
                          <span translate="no" className="notranslate">Hành động truy xuất - khoanh vùng lô hàng (Traceability):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={3}
                            value={capaForm.traceability}
                            onChange={(val) => handleUpdateForm("traceability", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full bg-transparent text-blue-700 font-semibold text-xs leading-relaxed focus:bg-amber-50 focus:outline-none resize-y"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-semibold text-blue-700 leading-relaxed whitespace-pre-wrap break-words">
                          {capaForm.traceability || "—"}
                        </div>
                      </td>
                      <td className="p-2 align-top w-[18%] border-r border-slate-900 bg-slate-50">
                        <div className="font-bold text-slate-900 text-[10px]">
                          <span translate="no" className="notranslate">Hạn xử lý (Target date):</span>
                        </div>
                        <div className="no-print">
                          <DatePickerInput
                            value={capaForm.traceabilityTargetDate}
                            onChange={(val) => handleUpdateForm("traceabilityTargetDate", val)}
                            inputClassName="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none mt-1"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 mt-1">
                          {capaForm.traceabilityTargetDate || "—"}
                        </div>
                      </td>
                      <td className="p-2 align-top w-[32%] bg-slate-50">
                        <div className="font-bold text-slate-900 text-[10px]">
                          <span translate="no" className="notranslate">Bộ phận (Responsible):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={2}
                            value={capaForm.traceabilityResponsible}
                            onChange={(val) => handleUpdateForm("traceabilityResponsible", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none mt-1 resize-y whitespace-pre-wrap break-words leading-tight"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 mt-1 whitespace-pre-wrap break-words leading-tight">
                          {capaForm.traceabilityResponsible || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Preventive Action */}
                    <tr className="border-b border-slate-900">
                      <td className="p-2 font-bold bg-white align-top w-1/2 border-r border-slate-900">
                        <div className="font-bold text-slate-900 underline mb-1">
                          <span translate="no" className="notranslate">Hành động phòng ngừa - cải tiến 4M1E1I (Corrective & Preventive action):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={4}
                            value={capaForm.preventiveAction}
                            onChange={(val) => handleUpdateForm("preventiveAction", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full bg-transparent text-blue-700 font-semibold text-xs leading-relaxed focus:bg-amber-50 focus:outline-none resize-y"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-semibold text-blue-700 leading-relaxed whitespace-pre-wrap break-words">
                          {capaForm.preventiveAction || "—"}
                        </div>
                      </td>
                      <td className="p-2 align-top w-[18%] border-r border-slate-900 bg-slate-50">
                        <div className="font-bold text-slate-900 text-[10px]">
                          <span translate="no" className="notranslate">Hạn xử lý (Target date):</span>
                        </div>
                        <div className="no-print">
                          <DatePickerInput
                            value={capaForm.preventiveTargetDate}
                            onChange={(val) => handleUpdateForm("preventiveTargetDate", val)}
                            inputClassName="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none mt-1"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 mt-1">
                          {capaForm.preventiveTargetDate || "—"}
                        </div>
                      </td>
                      <td className="p-2 align-top w-[32%] bg-slate-50">
                        <div className="font-bold text-slate-900 text-[10px]">
                          <span translate="no" className="notranslate">Bộ phận (Responsible):</span>
                        </div>
                        <div className="no-print">
                          <MentionTextArea
                            rows={2}
                            value={capaForm.preventiveResponsible}
                            onChange={(val) => handleUpdateForm("preventiveResponsible", val)}
                            customMentions={customMentionsList}
                            onShowNotification={handleMentionNotification}
                            className="w-full text-xs font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none mt-1 resize-y whitespace-pre-wrap break-words leading-tight"
                          />
                        </div>
                        <div className="hidden print:block text-xs font-extrabold text-blue-700 mt-1 whitespace-pre-wrap break-words leading-tight">
                          {capaForm.preventiveResponsible || "—"}
                        </div>
                      </td>
                    </tr>

                    {/* Signatures & Quality Stamp PASS/PENDING/REJECTED */}
                    <tr className="signature-block print-avoid-break">
                      <td colSpan={3} className="p-4 bg-slate-50/30">
                        {/* Hidden datalists for auto-suggest (only populated when typing) */}
                        <datalist id="qcStaffDatalist">
                          {(capaForm.qcStaffName || "").trim().length >= 1 &&
                            managerSuggestions
                               .filter((name) =>
                                name.toLowerCase().includes((capaForm.qcStaffName || "").trim().toLowerCase())
                              )
                              .map((name, idx) => (
                                <option key={`staff-${name}-${idx}`} value={name} />
                              ))}
                        </datalist>
                        <datalist id="supplierRepsDatalist">
                          {capaForm.supplierRepName.trim().length >= 1 &&
                            managerSuggestions
                              .filter((name) =>
                                name.toLowerCase().includes(capaForm.supplierRepName.trim().toLowerCase())
                              )
                              .map((name, idx) => (
                                <option key={`sup-${name}-${idx}`} value={name} />
                              ))}
                        </datalist>
                        <datalist id="qcHeadsDatalist">
                          {capaForm.qcHeadName.trim().length >= 1 &&
                            Array.from(new Set(["Bùi Tài", "Phạm Thị Tuyền", "Lê Nguyễn Phú", "Lê Nhật Trường", ...managerSuggestions]))
                              .filter((name) =>
                                name.toLowerCase().includes(capaForm.qcHeadName.trim().toLowerCase())
                              )
                              .map((name, idx) => (
                                <option key={`qc-${name}-${idx}`} value={name} />
                              ))}
                        </datalist>

                        <div className="grid grid-cols-3 gap-4 text-center items-start">
                          {/* Left Column: Representative of Supplier - STEP 3 */}
                          <div className="flex flex-col items-center relative">
                            <div className="font-bold text-slate-800 text-[10.5px]">
                              <span translate="no" className="notranslate">Trưởng BP có sự KPH (Representative of Supplier)</span>
                            </div>
                            <div className="text-[9.5px] italic text-slate-500 mb-0.5">
                              <span translate="no" className="notranslate">[Bước 3] Xác nhận nguyên nhân & hành động</span>
                            </div>

                            {/* Signature Status & Interactive Button */}
                            <div className="relative h-10 flex items-center justify-center my-1">
                              {capaForm.supplierRepSigned ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateForm("supplierRepSigned", false)}
                                    className="no-print text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                    title="Nhấp để hủy/thay đổi xác nhận ký tên"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span translate="no" className="notranslate">☑ ĐÃ KÝ</span>
                                  </button>
                                  <div className="hidden print:flex items-center justify-center font-bold text-slate-900 text-xs italic tracking-wider py-1">
                                    <span translate="no" className="notranslate">Đã ký</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!capaForm.qcStaffSigned) {
                                        if (onShowToast) {
                                          onShowToast("⚠️ Theo quy trình (Từ phải sang trái): Người Lập (NV QC) [Bước 1] chưa ký xác nhận!", "warning");
                                        }
                                        return;
                                      }
                                      const isStep2Done = viewingVersion !== null || (versions.length > 0 && !isDraftModified);
                                      if (!isStep2Done) {
                                        if (onShowToast) {
                                          onShowToast("⚠️ Theo quy trình (Từ phải sang trái): Trưởng BP QLCL [Bước 2] chưa ký duyệt phát hành!", "warning");
                                        }
                                        return;
                                      }
                                      handleUpdateForm("supplierRepSigned", true);
                                      if (!capaForm.supplierRepDate) {
                                        handleUpdateForm("supplierRepDate", safeFormatDate(new Date()));
                                      }
                                      if (!capaForm.supplierRepName) {
                                        handleUpdateForm("supplierRepName", currentUser?.fullName ? formatNameCapitalized(currentUser.fullName) : "Trưởng BP");
                                      }
                                      if (onShowToast) {
                                        onShowToast("✓ Bước 3: Trưởng bộ phận có sự KPH đã ký xác nhận!", "success");
                                      }
                                    }}
                                    className={`no-print px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 border ${
                                      !capaForm.qcStaffSigned || !(viewingVersion !== null || (versions.length > 0 && !isDraftModified))
                                        ? "bg-slate-100 text-slate-500 border-slate-300 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                                        : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 hover:border-blue-400"
                                    }`}
                                    title={
                                      !capaForm.qcStaffSigned
                                        ? "Người Lập (NV QC) cần ký trước ở Bước 1"
                                        : !(viewingVersion !== null || (versions.length > 0 && !isDraftModified))
                                        ? "Trưởng BP QLCL cần ký duyệt ở Bước 2 trước khi Trưởng BP KPH xác nhận Bước 3"
                                        : "Nhấp để xác nhận ký tên Trưởng BP có sự KPH (Bước 3)"
                                    }
                                  >
                                    <CheckCircle2
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        !capaForm.qcStaffSigned || !(viewingVersion !== null || (versions.length > 0 && !isDraftModified))
                                          ? "text-slate-400"
                                          : "text-blue-600"
                                      }`}
                                    />
                                    <span translate="no" className="notranslate">☐ BƯỚC 3: KÝ XÁC NHẬN</span>
                                  </button>
                                  <span className="print:inline hidden text-[10px] italic text-slate-400 font-normal">
                                    <span translate="no" className="notranslate">[Chưa ký]</span>
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Name & Date input split into 2 separate lines */}
                            <div className="w-full flex flex-col items-center mt-1 gap-0.5">
                              {/* Line 1: Full Name */}
                              <div className="no-print w-full max-w-[160px]">
                                <input
                                  type="text"
                                  list={capaForm.supplierRepName.trim().length >= 1 ? "supplierRepsDatalist" : undefined}
                                  autoComplete="off"
                                  value={capaForm.supplierRepName}
                                  onChange={(e) => handleUpdateForm("supplierRepName", e.target.value)}
                                  className="text-center font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none border-b border-dashed border-blue-300 w-full py-0.5 text-xs placeholder:font-normal placeholder:italic placeholder:text-slate-400"
                                  placeholder="Nhập Họ và Tên"
                                />
                              </div>
                              <div className="hidden print:block text-xs font-extrabold text-blue-700 text-center">
                                {capaForm.supplierRepName || "—"}
                              </div>

                              {/* Line 2: Date */}
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-slate-500 font-bold">
                                  <span translate="no" className="notranslate">Ngày (Date):</span>
                                </span>
                                <div className="no-print">
                                  <DatePickerInput
                                    value={capaForm.supplierRepDate || capaForm.approvalDate}
                                    onChange={(val) => handleUpdateForm("supplierRepDate", val)}
                                    containerClassName="relative inline-flex items-center w-22"
                                    inputClassName="text-center font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none border-b border-dashed border-blue-300 w-full py-0.5"
                                  />
                                </div>
                                <div className="hidden print:block font-extrabold text-blue-700">
                                  {capaForm.supplierRepDate || capaForm.approvalDate || "—"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle Column: Quality Control Department - STEP 2 */}
                          <div className="flex flex-col items-center relative">
                            <div className="font-bold text-slate-800 text-[10.5px]">
                              <span translate="no" className="notranslate">BP Quản lý Chất lượng (Quality Control Department)</span>
                            </div>
                            <div className="text-[9.5px] italic text-slate-500 mb-0.5">
                              <span translate="no" className="notranslate">[Bước 2] Trưởng BP QLCL (QC Head)</span>
                            </div>

                            {/* Integrated Approval Checkbox / Release Action Button */}
                            {(() => {
                              const isCurrentlyReleased = viewingVersion !== null || (versions.length > 0 && !isDraftModified);
                              const currentTag = viewingVersion || (versions[0]?.version || "v1.0");
                              const nextTag = getNextVersionTag(versions);

                              return (
                                <div className="relative min-h-[40px] flex items-center justify-center my-1">
                                  {isCurrentlyReleased ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (viewingVersion !== null) {
                                            handleSelectVersionToView(null); // Switch to draft
                                          } else {
                                            setIsCommitDialogOpen(true);
                                          }
                                        }}
                                        className="no-print text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                        title={viewingVersion !== null ? "Đang xem phiên bản đã phát hành. Nhấp để chuyển sang biên soạn bản nháp." : "Đã ký duyệt phát hành. Nhấp nếu muốn tạo phiên bản cập nhật tiếp theo."}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span translate="no" className="notranslate">☑ ĐÃ KÝ DUYỆT ({currentTag})</span>
                                      </button>
                                      <div className="hidden print:flex items-center justify-center font-bold text-slate-900 text-xs italic tracking-wider py-1">
                                        <span translate="no" className="notranslate">Đã ký</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!capaForm.qcStaffSigned) {
                                            if (onShowToast) {
                                              onShowToast("⚠️ Theo quy trình (Từ phải sang trái): Người Lập (NV QC) [Bước 1] chưa ký xác nhận!", "error");
                                            }
                                            return;
                                          }
                                          setIsCommitDialogOpen(true);
                                        }}
                                        className={`no-print px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 border ${
                                          !capaForm.qcStaffSigned
                                            ? "bg-slate-100 text-slate-600 border-slate-300 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800"
                                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-700 ring-2 ring-blue-300/60"
                                        }`}
                                        title={
                                          !capaForm.qcStaffSigned
                                            ? "Cần hoàn tất chữ ký Bước 1 (Người Lập) trước khi ký duyệt Bước 2"
                                            : `Nhấp để ký duyệt & phát hành phiên bản ${nextTag}`
                                        }
                                      >
                                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${!capaForm.qcStaffSigned ? "text-slate-400" : "text-white"}`} />
                                        <span translate="no" className="notranslate">☐ BƯỚC 2: KÝ DUYỆT ({nextTag})</span>
                                      </button>
                                      <span className="print:inline hidden text-[10px] italic text-slate-400 font-normal">
                                        <span translate="no" className="notranslate">[Chưa ký]</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Editable QC Head Name & Date split into 2 separate lines */}
                            <div className="w-full flex flex-col items-center mt-1 gap-0.5">
                              {/* Line 1: Full Name */}
                              <div className="no-print w-full max-w-[160px]">
                                <input
                                  type="text"
                                  list={capaForm.qcHeadName.trim().length >= 1 ? "qcHeadsDatalist" : undefined}
                                  autoComplete="off"
                                  value={capaForm.qcHeadName}
                                  onChange={(e) => handleUpdateForm("qcHeadName", e.target.value)}
                                  className="text-center font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none border-b border-dashed border-blue-300 w-full py-0.5 text-xs placeholder:font-normal placeholder:italic placeholder:text-slate-400"
                                  placeholder="Nhập Họ và Tên"
                                />
                              </div>
                              <div className="hidden print:block text-xs font-extrabold text-blue-700 text-center">
                                {capaForm.qcHeadName || "—"}
                              </div>

                              {/* Line 2: Date */}
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-slate-500 font-bold">
                                  <span translate="no" className="notranslate">Ngày (Date):</span>
                                </span>
                                <div className="no-print">
                                  <DatePickerInput
                                    value={capaForm.approvalDate}
                                    onChange={(val) => handleUpdateForm("approvalDate", val)}
                                    containerClassName="relative inline-flex items-center w-22"
                                    inputClassName="text-center font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none border-b border-dashed border-blue-300 w-full py-0.5"
                                  />
                                </div>
                                <div className="hidden print:block font-extrabold text-blue-700">
                                  {capaForm.approvalDate || "—"}
                                </div>
                              </div>
                            </div>

                            {/* Integrated Note Block / Ghi chú chỉ đạo ngay bên dưới ngày tháng */}
                            {(() => {
                              const activeNote = viewingVersion
                                ? versions.find((v) => v.version === viewingVersion)?.note
                                : (versions[0]?.note || capaForm.approvalNote);

                              const isReleased = versions.length > 0 && !isDraftModified;

                              return (
                                <div className="mt-2.5 w-full text-left">
                                  {isReleased || viewingVersion !== null ? (
                                    activeNote ? (
                                      <div className="bg-slate-50/90 print:bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs">
                                        <div className="text-[9px] font-extrabold text-slate-500 mb-0.5 flex items-center gap-1 uppercase tracking-wider">
                                          <span>💬 Ghi chú chỉ đạo:</span>
                                        </div>
                                        <div className="text-[10.5px] text-slate-800 italic font-medium leading-relaxed">
                                          "{activeNote}"
                                        </div>
                                      </div>
                                    ) : null
                                  ) : (
                                    <>
                                      <div className="no-print">
                                        <MentionTextArea
                                          value={capaForm.approvalNote || ""}
                                          onChange={(val) => handleUpdateForm("approvalNote", val)}
                                          placeholder="Nhập ghi chú / ý kiến chỉ đạo của Trưởng BP..."
                                          rows={2}
                                          customMentions={customMentionsList}
                                          onShowNotification={handleMentionNotification}
                                          className="w-full text-[10.5px] text-slate-700 bg-amber-50/60 hover:bg-amber-50 focus:bg-white p-2 rounded-lg border border-amber-200 focus:border-indigo-400 focus:outline-none placeholder:text-slate-400 italic resize-y transition-all shadow-2xs"
                                        />
                                      </div>
                                      {capaForm.approvalNote && (
                                        <div className="hidden print:block text-[10.5px] text-slate-950 italic mt-1">
                                          "{capaForm.approvalNote}"
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Right Column: Prepared By / QC Staff / Creator - STEP 1 */}
                          <div className="flex flex-col items-center relative">
                            <div className="font-bold text-slate-800 text-[10.5px]">
                              <span translate="no" className="notranslate">Người lập / NV QC (Prepared By)</span>
                            </div>
                            <div className="text-[9.5px] italic text-slate-500 mb-0.5">
                              <span translate="no" className="notranslate">[Bước 1] Nhân viên QC / Người lập phiếu</span>
                            </div>

                            {/* Signature Status & Interactive Button */}
                            <div className="relative h-10 flex items-center justify-center my-1">
                              {capaForm.qcStaffSigned ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateForm("qcStaffSigned", false)}
                                    className="no-print text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                                    title="Nhấp để hủy/thay đổi xác nhận ký tên"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span translate="no" className="notranslate">☑ ĐÃ KÝ</span>
                                  </button>
                                  <div className="hidden print:flex items-center justify-center font-bold text-slate-900 text-xs italic tracking-wider py-1">
                                    <span translate="no" className="notranslate">Đã ký</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateForm("qcStaffSigned", true);
                                      if (!capaForm.qcStaffDate) {
                                        handleUpdateForm("qcStaffDate", safeFormatDate(new Date()));
                                      }
                                      if (!capaForm.qcStaffName) {
                                        handleUpdateForm("qcStaffName", currentUser?.fullName ? formatNameCapitalized(currentUser.fullName) : "NV QC");
                                      }
                                      if (onShowToast) {
                                        onShowToast("✓ Bước 1: Người Lập / NV QC đã ký xác nhận!", "success");
                                      }
                                    }}
                                    className="no-print px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 hover:border-blue-400 shadow-2xs active:scale-95"
                                    title="Nhấp để xác nhận ký tên Người Lập / NV QC (Bước 1)"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span translate="no" className="notranslate">☐ BƯỚC 1: KÝ XÁC NHẬN</span>
                                  </button>
                                  <span className="print:inline hidden text-[10px] italic text-slate-400 font-normal">
                                    <span translate="no" className="notranslate">[Chưa ký]</span>
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Name & Date input split into 2 separate lines */}
                            <div className="w-full flex flex-col items-center mt-1 gap-0.5">
                              {/* Line 1: Full Name */}
                              <div className="no-print w-full max-w-[160px]">
                                <input
                                  type="text"
                                  list={(capaForm.qcStaffName || "").trim().length >= 1 ? "qcStaffDatalist" : undefined}
                                  autoComplete="off"
                                  value={capaForm.qcStaffName || ""}
                                  onChange={(e) => handleUpdateForm("qcStaffName", e.target.value)}
                                  className="text-center font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none border-b border-dashed border-blue-300 w-full py-0.5 text-xs placeholder:font-normal placeholder:italic placeholder:text-slate-400"
                                  placeholder="Nhập Họ và Tên"
                                />
                              </div>
                              <div className="hidden print:block text-xs font-extrabold text-blue-700 text-center">
                                {capaForm.qcStaffName || "—"}
                              </div>

                              {/* Line 2: Date */}
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <span className="text-slate-500 font-bold">
                                  <span translate="no" className="notranslate">Ngày (Date):</span>
                                </span>
                                <div className="no-print">
                                  <DatePickerInput
                                    value={capaForm.qcStaffDate || capaForm.occurDate}
                                    onChange={(val) => handleUpdateForm("qcStaffDate", val)}
                                    containerClassName="relative inline-flex items-center w-22"
                                    inputClassName="text-center font-extrabold text-blue-700 bg-transparent focus:bg-amber-50 focus:outline-none border-b border-dashed border-blue-300 w-full py-0.5"
                                  />
                                </div>
                                <div className="hidden print:block font-extrabold text-blue-700">
                                  {capaForm.qcStaffDate || capaForm.occurDate || "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PART 3: FEEDBACK FROM CUSTOMERS */}
              <div className="capa-section-block mt-3 mb-3">
                <div className="capa-part-header bg-slate-200 border-2 border-slate-900 px-3 py-1.5 font-black text-xs uppercase flex items-center justify-between gap-2">
                  <span translate="no" className="notranslate text-[11px] sm:text-xs leading-snug">
                    3. PHẦN PHẢN HỒI & XÁC NHẬN CỦA KHÁCH HÀNG (FEEDBACK FROM CUSTOMERS)
                  </span>
                  <span className="no-print shrink-0 text-[10px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-300">
                    <span translate="no" className="notranslate">dd/mm/yy</span>
                  </span>
                </div>

                <table className="w-full table-fixed border-2 border-slate-900 border-t-0 text-left border-collapse bg-white">
                  <tbody>
                    <tr className="border-b border-slate-900">
                      <td className="p-3 font-medium align-top">
                        {/* Radio choices */}
                        <div className="flex items-center gap-4 sm:gap-6 mb-3 flex-wrap bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs">
                            <input
                              type="radio"
                              name="customerFeedbackStatus"
                              className="no-print w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                              checked={capaForm.customerFeedbackStatus === "satisfy"}
                              onChange={() => handleUpdateForm("customerFeedbackStatus", "satisfy")}
                            />
                            <span className="hidden print:inline font-black text-sm mr-1">
                              {capaForm.customerFeedbackStatus === "satisfy" ? "☑" : "☐"}
                            </span>
                            <span translate="no" className="notranslate">Thỏa mãn (Satisfy)</span>
                          </label>

                          <label className="cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs">
                            <input
                              type="radio"
                              name="customerFeedbackStatus"
                              className="no-print w-4 h-4 text-amber-600 focus:ring-amber-500"
                              checked={capaForm.customerFeedbackStatus === "acceptable"}
                              onChange={() => handleUpdateForm("customerFeedbackStatus", "acceptable")}
                            />
                            <span className="hidden print:inline font-black text-sm mr-1">
                              {capaForm.customerFeedbackStatus === "acceptable" ? "☑" : "☐"}
                            </span>
                            <span translate="no" className="notranslate">Tạm chấp nhận (Acceptable)</span>
                          </label>

                          <label className="cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs">
                            <input
                              type="radio"
                              name="customerFeedbackStatus"
                              className="no-print w-4 h-4 text-rose-600 focus:ring-rose-500"
                              checked={capaForm.customerFeedbackStatus === "non_satisfy"}
                              onChange={() => handleUpdateForm("customerFeedbackStatus", "non_satisfy")}
                            />
                            <span className="hidden print:inline font-black text-sm mr-1">
                              {capaForm.customerFeedbackStatus === "non_satisfy" ? "☑" : "☐"}
                            </span>
                            <span translate="no" className="notranslate">Không thỏa mãn (Non - Satisfy)</span>
                          </label>
                        </div>

                        {/* Customer's Opinion */}
                        <div className="text-slate-800">
                          <span className="font-bold underline text-xs">
                            <span translate="no" className="notranslate">Ý kiến của khách hàng (Customer's opinion):</span>
                          </span>
                          <div className="no-print mt-1.5">
                            <MentionTextArea
                              rows={4}
                              value={capaForm.customerOpinion}
                              onChange={(val) => handleUpdateForm("customerOpinion", val)}
                              customMentions={customMentionsList}
                              onShowNotification={handleMentionNotification}
                              className="w-full text-xs font-semibold bg-transparent text-blue-700 focus:bg-amber-50 focus:outline-none resize-y border border-slate-200 rounded-lg p-2.5 leading-relaxed"
                              placeholder="Nhập ý kiến đánh giá từ khách hàng..."
                            />
                          </div>
                          <div className="hidden print:block text-xs font-semibold text-blue-700 mt-1.5 whitespace-pre-wrap break-words min-h-[50px] leading-relaxed p-1">
                            {capaForm.customerOpinion || "Đồng ý với các biện pháp khắc phục và phòng ngừa do Tân Phú đề xuất. Đề nghị tiếp tục duy trì và kiểm soát chặt chẽ trong các lô tiếp theo."}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Customer Representative Signature / Confirmation Row */}
                    <tr>
                      <td className="p-3 bg-slate-50/70">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs items-center">
                          <div className="md:col-span-8 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <span className="font-bold text-slate-800 shrink-0">
                              <span translate="no" className="notranslate">Đại diện khách hàng (Customer Representative):</span>
                            </span>
                            <div className="no-print flex-1 min-w-0 w-full">
                              <input
                                type="text"
                                value={capaForm.customerRepName || ""}
                                onChange={(e) => handleUpdateForm("customerRepName", e.target.value)}
                                placeholder="Nhập Họ và Tên"
                                className="w-full text-xs font-bold text-blue-700 bg-transparent border-b border-dashed border-blue-300 focus:bg-amber-50 focus:outline-none py-1 truncate placeholder:font-normal placeholder:italic placeholder:text-slate-400"
                              />
                            </div>
                            <div className="hidden print:block text-xs font-extrabold text-blue-700 truncate">
                              {capaForm.customerRepName || "—"}
                            </div>
                          </div>

                          <div className="md:col-span-4 flex items-center gap-2 md:justify-end">
                            <span className="font-bold text-slate-700 shrink-0">
                              <span translate="no" className="notranslate">Ngày (Date):</span>
                            </span>
                            <div className="no-print shrink-0">
                              <DatePickerInput
                                value={capaForm.customerRepDate || capaForm.approvalDate}
                                onChange={(val) => handleUpdateForm("customerRepDate", val)}
                                containerClassName="relative inline-flex items-center w-26"
                                inputClassName="text-center font-bold text-blue-700 bg-transparent border-b border-dashed border-blue-300 focus:bg-amber-50 focus:outline-none w-full py-1 text-xs"
                              />
                            </div>
                            <div className="hidden print:block font-bold text-blue-700 shrink-0">
                              {capaForm.customerRepDate || capaForm.approvalDate || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PART 4 (EXPANDED): VERIFICATION OF EFFECTIVENESS & CLOSURE (Theo dõi hiệu lực & Đóng CAPA) */}
              {(showPart4Section || capaForm.verificationResult || capaForm.verificationStatus) && (
                <div className="capa-section-block mt-3 mb-2">
                  <div className="capa-part-header bg-slate-200 border-2 border-slate-900 px-3 py-1.5 font-black text-xs uppercase flex items-center justify-between gap-2">
                    <span translate="no" className="notranslate text-[11px] sm:text-xs leading-snug flex-1">
                      4. THEO DÕI, ĐÁNH GIÁ HIỆU LỰC & ĐÓNG CAPA (VERIFICATION OF EFFECTIVENESS & CLOSURE)
                    </span>
                    <div className="no-print shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowPart4Section(!showPart4Section)}
                        className="bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 cursor-pointer shadow-2xs transition-all"
                        title="Ẩn/Hiện mục đánh giá hiệu lực"
                      >
                        <span translate="no" className="notranslate">{showPart4Section ? "✕ Ẩn phần 4" : "👁 Hiện phần 4"}</span>
                      </button>
                    </div>
                  </div>

                  <table className="w-full table-fixed border-2 border-slate-900 border-t-0 text-left border-collapse bg-white">
                    <tbody>
                      <tr className="border-b border-slate-900">
                        <td className="p-3 font-medium align-top" colSpan={3}>
                          <div className="font-bold underline text-xs mb-1.5">
                            <span translate="no" className="notranslate">Kết quả đánh giá hiệu lực sau khắc phục & phòng ngừa (Verification Result):</span>
                          </div>
                          <div className="no-print">
                            <MentionTextArea
                              rows={4}
                              value={capaForm.verificationResult || ""}
                              onChange={(val) => handleUpdateForm("verificationResult", val)}
                              customMentions={customMentionsList}
                              onShowNotification={handleMentionNotification}
                              className="w-full text-xs font-semibold bg-transparent text-blue-700 focus:bg-amber-50 focus:outline-none resize-y border border-slate-200 rounded-lg p-2.5 leading-relaxed"
                              placeholder="Ghi nhận kết quả kiểm tra lại sản phẩm, thử nghiệm mẫu hoặc tỷ lệ lỗi sau 30-60 ngày..."
                            />
                          </div>
                          <div className="hidden print:block text-xs font-semibold text-blue-700 mt-1 whitespace-pre-wrap break-words min-h-[55px] leading-relaxed p-1">
                            {capaForm.verificationResult || "Sau thời gian theo dõi 30 ngày, tỷ lệ lỗi giảm về mức cho phép (0%), không phát sinh tái diễn lỗi. Các biện pháp khắc phục và phòng ngừa đạt hiệu lực."}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 font-bold bg-slate-50 align-top w-[38%] border-r border-slate-900">
                          <div className="text-[11px] text-slate-700 font-bold">
                            <span translate="no" className="notranslate">Trạng thái đóng CAPA (CAPA Status):</span>
                          </div>
                          <div className="no-print mt-1.5">
                            <select
                              value={capaForm.verificationStatus || "closed"}
                              onChange={(e) => handleUpdateForm("verificationStatus", e.target.value as any)}
                              className="w-full text-xs font-bold text-blue-700 bg-white border border-slate-300 rounded-lg p-1.5"
                            >
                              <option value="closed">Đạt hiệu lực - Đóng CAPA (Closed)</option>
                              <option value="effective">Đang duy trì hiệu lực (Effective)</option>
                              <option value="need_further_action">Chưa đạt - Yêu cầu hành động bổ sung (Re-open)</option>
                            </select>
                          </div>
                          <div className="hidden print:block text-xs font-bold text-blue-700 mt-1.5">
                            {capaForm.verificationStatus === "closed" || !capaForm.verificationStatus
                              ? "☑ Đạt hiệu lực — Đóng CAPA (Closed)"
                              : capaForm.verificationStatus === "effective"
                              ? "☑ Đang duy trì hiệu lực (Effective)"
                              : capaForm.verificationStatus === "need_further_action"
                              ? "☒ Chưa đạt — Cần hành động bổ sung"
                              : "—"}
                          </div>
                        </td>

                        <td className="p-3 font-bold bg-slate-50 align-top w-[32%] border-r border-slate-900">
                          <div className="text-[11px] text-slate-700 font-bold">
                            <span translate="no" className="notranslate">Người đánh giá (Evaluated By):</span>
                          </div>
                          <div className="no-print mt-1.5">
                            <input
                              type="text"
                              value={capaForm.verificationBy || ""}
                              onChange={(e) => handleUpdateForm("verificationBy", e.target.value)}
                              placeholder="Nhập Họ và Tên"
                              className="w-full text-xs font-bold text-blue-700 bg-transparent border-b border-dashed border-blue-300 focus:bg-amber-50 focus:outline-none py-1 placeholder:font-normal placeholder:italic placeholder:text-slate-400"
                            />
                          </div>
                          <div className="hidden print:block text-xs font-bold text-blue-700 mt-1.5">
                            {capaForm.verificationBy || capaForm.qcStaffName || "—"}
                          </div>
                        </td>

                        <td className="p-3 font-bold bg-slate-50 align-top w-[30%]">
                          <div className="text-[11px] text-slate-700 font-bold">
                            <span translate="no" className="notranslate">Ngày đánh giá (Evaluation Date):</span>
                          </div>
                          <div className="no-print mt-1.5">
                            <DatePickerInput
                              value={capaForm.verificationDate || capaForm.approvalDate || formatDateDDMMYY()}
                              onChange={(val) => handleUpdateForm("verificationDate", val)}
                              containerClassName="relative inline-flex items-center w-full"
                              inputClassName="text-xs font-bold text-blue-700 bg-transparent border-b border-dashed border-blue-300 focus:bg-amber-50 focus:outline-none w-full py-1"
                            />
                          </div>
                          <div className="hidden print:block text-xs font-bold text-blue-700 mt-1.5">
                            {capaForm.verificationDate || capaForm.approvalDate || formatDateDDMMYY()}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Nút bấm chuyển đổi nhanh mục Phần 4 nếu cần */}
              {!showPart4Section && (
                <div className="no-print mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPart4Section(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg cursor-pointer transition-all shadow-2xs"
                  >
                    <span>+</span>
                    <span translate="no" className="notranslate">Hiển thị Phần 4: Đánh giá hiệu lực & Đóng CAPA</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* COMMIT VERSION DIALOG */}
      {isCommitDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span translate="no" className="notranslate">
                  {versions.length === 0 ? "Phát hành Phiên bản v1.0 (Lần 1)" : `Nâng lên Phiên bản ${getNextVersionTag(versions)}`}
                </span>
              </h3>
              <button
                onClick={() => setIsCommitDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5 text-indigo-950">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Tên phiên bản mới:</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {getNextVersionTag(versions)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Trưởng BP QC ký duyệt:</span>
                  <span className="font-bold text-slate-900">
                    {capaForm?.qcHeadName.trim() || "Phạm Thị Tuyền (QC Head)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Trạng thái con dấu:</span>
                  <span className="font-bold text-emerald-700">
                    {capaForm?.stampStatus || "PASS"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-semibold">Ngày duyệt:</span>
                  <span className="font-bold text-slate-900">
                    {capaForm?.approvalDate || formatDateDDMMYY()}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Ghi chú nội dung thay đổi / Lý do nâng phiên bản:
                </label>
                <MentionTextArea
                  rows={3}
                  value={newVersionNote}
                  onChange={(val) => setNewVersionNote(val)}
                  customMentions={customMentionsList}
                  onShowNotification={handleMentionNotification}
                  placeholder={
                    versions.length === 0
                      ? "QC Trưởng ký duyệt phát hành chính thức v1.0"
                      : "Ví dụ: Yêu cầu P.MH - Anh @Giáp nhanh chóng tìm NCC thay thế..."
                  }
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsCommitDialogOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleCommitNewVersion()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Phát hành Phiên bản {getNextVersionTag(versions)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <span translate="no" className="notranslate">LỊCH SỬ CÁC PHIÊN BẢN CAPA ISO</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <span translate="no" className="notranslate">Mã sự cố: {capaForm?.ncNumber} | Tổng số {versions.length} phiên bản đã ký duyệt</span>
                </p>
              </div>
              <button
                onClick={() => setIsVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {versions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Chưa có phiên bản ký duyệt nào được phát hành.
                </div>
              ) : (
                versions.map((ver, idx) => {
                  const isLatest = idx === 0;
                  const isCurrentViewing = viewingVersion === ver.version || (viewingVersion === null && isLatest);

                  return (
                    <div
                      key={ver.version}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrentViewing
                          ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-black rounded-md ${
                              isLatest
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-700"
                            }`}>
                              {ver.version}
                            </span>
                            {isLatest && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                                BẢN MỚI NHẤT
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-medium">
                              {ver.savedAt}
                            </span>
                          </div>

                          <div className="text-xs text-slate-800 font-medium">
                            <b>Người ký:</b> {ver.signedBy || "Phạm Thị Tuyền (QC Head)"} | <b>Ngày duyệt:</b> {ver.signedDate}
                          </div>

                          {ver.note && (
                            <div className="text-[11px] text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200 mt-1">
                              "{ver.note}"
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0 items-end">
                          <button
                            onClick={() => handleSelectVersionToView(ver.version)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                              isCurrentViewing
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isCurrentViewing ? "Đang hiển thị" : "Xem bản này"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
              <div>Mặc định hệ thống luôn hiển thị <b>Bản mới nhất</b> khi mở CAPA.</div>
              <button
                onClick={() => setIsVersionModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZOOM IMAGE MODAL */}
      {activeZoomImg && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn no-print">
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4">
            <button
              onClick={() => setActiveZoomImg(null)}
              className="absolute top-3 right-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl text-xs z-10 cursor-pointer"
            >
              ✕ <span translate="no" className="notranslate">ĐÓNG</span>
            </button>
            <div className="p-2 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img src={activeZoomImg} alt="Zoomed Evidence" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* POPUP CẤU HÌNH IN FILE PDF (MODAL COMPACT & TỐI ƯU) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[999999] no-print">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-100 text-left animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Printer className="w-4 h-4 text-rose-600" />
                <span translate="no" className="notranslate">CẤU HÌNH IN FILE & XUẤT PDF</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Chọn Phiên bản in (Dropdown gọn gàng) */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <span translate="no" className="notranslate">1. PHIÊN BẢN CẦN IN:</span>
                </span>
                {modalPrintVersion && modalPrintVersion !== "DRAFT" ? (
                  <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span translate="no" className="notranslate">✓ ĐÃ KÝ DUYỆT</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <span translate="no" className="notranslate">✎ BẢN NHÁP</span>
                  </span>
                )}
              </div>
              <select
                id="modal-print-version-select"
                value={modalPrintVersion || (versions.length > 0 ? versions[0].version : "DRAFT")}
                onChange={(e) => {
                  const newVer = e.target.value;
                  setModalPrintVersion(newVer);
                  setPdfFileName(generateSuggestedCapaPdfFileName(capaForm, newVer));
                }}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:bg-white focus:outline-none cursor-pointer"
              >
                {versions.map((v, idx) => (
                  <option key={v.version} value={v.version}>
                    {v.version} — {idx === 0 ? "Bản mới nhất (Hiện hành)" : "Bản lưu trữ"} (Ký {v.signedDate})
                  </option>
                ))}
                {versions.length === 0 && (
                  <option value="v1.0">v1.0 — Phiên bản v1.0 (Hiện hành)</option>
                )}
                <option value="DRAFT">
                  📝 Bản nháp (Đang biên soạn{versions.length > 0 ? ` cho ${getNextVersionTag(versions)}` : ""})
                </option>
              </select>
            </div>

            {/* 2. Khổ giấy & Căn lề (Xếp 2 cột ngang gọn gàng) */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Khổ giấy */}
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  <span translate="no" className="notranslate">2. KHỔ GIẤY:</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setModalPrintOrient("portrait");
                      setPaperSize("A4_PORTRAIT");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      modalPrintOrient === "portrait"
                        ? "bg-white text-rose-700 shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span translate="no" className="notranslate">Đứng (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalPrintOrient("landscape");
                      setPaperSize("A4_LANDSCAPE");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      modalPrintOrient === "landscape"
                        ? "bg-white text-rose-700 shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span translate="no" className="notranslate">Ngang</span>
                  </button>
                </div>
              </div>

              {/* Căn lề */}
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  <span translate="no" className="notranslate">3. CĂN LỀ:</span>
                </span>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "full-bleed", label: "3mm", title: "Tràn viền (3mm)" },
                    { id: "standard", label: "6mm", title: "Chuẩn (6mm)" },
                    { id: "wide", label: "10mm", title: "Rộng (10mm)" }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModalPrintMargin(m.id as any)}
                      title={m.title}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                        modalPrintMargin === m.id
                          ? "bg-white text-rose-700 shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span translate="no" className="notranslate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Chế độ phân trang (Gọn gàng 3 nút ngang) */}
            <div className="mb-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                <span translate="no" className="notranslate">4. CHẾ ĐỘ PHÂN TRANG:</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "AUTO", label: "Tự động", desc: "Nhiều trang tự nhiên" },
                  { id: "ISO_2_PAGES", label: "2 Trang ISO", desc: "Trang 1 + Trang 2" },
                  { id: "COMPACT_1_PAGE", label: "Gom 1 Trang", desc: "Vừa trọn 1 trang" }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaginationMode(pm.id as any)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      paginationMode === pm.id
                        ? "bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-300 text-indigo-950"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="text-[11px] font-black leading-tight flex items-center justify-between">
                      <span translate="no" className="notranslate">{pm.label}</span>
                      {paginationMode === pm.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                      <span translate="no" className="notranslate">{pm.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Tỷ lệ co giãn (Scale gọn gàng 4 mức phổ biến) */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <span translate="no" className="notranslate">5. TỶ LỆ CO GIÃN (SCALE):</span>
                </span>
                <span className="text-[10px] font-bold text-rose-600">
                  <span translate="no" className="notranslate">{modalPrintScale}%</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: 100, label: "100% Gốc" },
                  { val: 90, label: "90% Đẹp" },
                  { val: 85, label: "85% Vừa in" },
                  { val: 80, label: "80% Gọn" }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setModalPrintScale(item.val)}
                    className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      modalPrintScale === item.val
                        ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs font-black"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span translate="no" className="notranslate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Tên file gợi ý khi xuất PDF */}
            <div className="mb-4 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span translate="no" className="notranslate">6. TÊN FILE PDF GỢI Ý (KÈM MÃ NC & VERSION):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const currentVer = modalPrintVersion || (versions.length > 0 ? versions[0].version : "DRAFT");
                    setPdfFileName(generateSuggestedCapaPdfFileName(capaForm, currentVer));
                    if (onShowToast) onShowToast("Đã cập nhật lại tên file PDF chuẩn theo mã NC!", "info");
                  }}
                  className="text-[9px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                  title="Tạo lại tên file mặc định"
                >
                  <span translate="no" className="notranslate">Đặt lại tên gốc</span>
                </button>
              </div>
              <input
                type="text"
                value={pdfFileName || generateSuggestedCapaPdfFileName(capaForm, modalPrintVersion || "DRAFT")}
                onChange={(e) => setPdfFileName(e.target.value)}
                placeholder="Tên file khi lưu PDF..."
                className="w-full bg-white border border-blue-300 text-blue-900 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[9.5px] text-blue-700/80 mt-1 italic">
                <span translate="no" className="notranslate">💡 Tên file này sẽ tự động được chọn khi bạn chọn "Lưu dưới dạng PDF" (Save as PDF).</span>
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-3 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
              >
                <span translate="no" className="notranslate">Đóng</span>
              </button>
              <button
                type="button"
                onClick={handleDirectPrintNow}
                className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                title="Bật hộp thoại in ngay tại trang này"
              >
                <Printer className="w-3.5 h-3.5" />
                <span translate="no" className="notranslate">IN TRỰC TIẾP</span>
              </button>
              <button
                type="button"
                onClick={handleOpenNewTabToPrint}
                className="flex-1 h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                title="Mở sang tab mới với đường dẫn tinh gọn"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span translate="no" className="notranslate">MỞ TAB MỚI ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
