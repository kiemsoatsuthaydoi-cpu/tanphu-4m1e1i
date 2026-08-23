import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Award,
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp,
  FileText,
  AlertTriangle,
  ExternalLink,
  Layers,
  Factory,
  Building2,
  Flame,
  ChevronDown,
  Filter,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Calendar,
  Tag,
  Upload
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { T } from "./TranslateText";
import {
  User,
  QualityReport,
  Company,
  Branch,
  Department
} from "../types";

interface AchievementPhoto {
  id: string;
  url: string;
  title: string;
  date: string; // dd/mm/yy
  notes?: string;
  badgeName?: string;
  uploadedAt: number;
}

interface PersonalContributionTabProps {
  currentUser: User;
  reports: QualityReport[];
  users: User[];
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  onSwitchToTasks?: () => void;
  onUpdateReport?: (report: QualityReport) => void;
  onDeleteReport?: (id: string, isPermanent?: boolean) => void;
  onShowToast?: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

const PIE_COLORS = {
  my: "#2563eb", // Blue
  others: "#e2e8f0", // Light slate
  kph: "#e11d48", // Rose
  dsa: "#10b981", // Emerald
  rro: "#f59e0b" // Amber
};

export const parseReportDate = (timestamp?: string | number) => {
  if (!timestamp) return null;
  if (typeof timestamp === "number") {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const fullYear = String(d.getFullYear());
      const year = fullYear.slice(-2);
      const day = String(d.getDate()).padStart(2, "0");
      return { day, month, year, fullYear };
    }
  }

  const str = String(timestamp).trim();

  // Pattern 1: dd/mm/yyyy or dd/mm/yy anywhere in the string
  const dmyMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let yr = dmyMatch[3];
    const fullYear = yr.length === 2 ? `20${yr}` : yr;
    const year = fullYear.slice(-2);
    return { day, month, year, fullYear };
  }

  // Pattern 2: yyyy-mm-dd or yyyy/mm/dd
  const ymdMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const fullYear = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    const year = fullYear.slice(-2);
    return { day, month, year, fullYear };
  }

  // Pattern 3: standard JS date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const fullYear = String(parsed.getFullYear());
    const year = fullYear.slice(-2);
    const day = String(parsed.getDate()).padStart(2, "0");
    return { day, month, year, fullYear };
  }

  return null;
};

const getTodayFormatted = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${yr}`;
};

export const PersonalContributionTab: React.FC<PersonalContributionTabProps> = ({
  currentUser,
  reports,
  onSwitchToTasks,
  onShowToast
}) => {
  // --- Filter states for Month & Year ---
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL"); // "ALL" or "01", "02", ..., "12"
  const [selectedYear, setSelectedYear] = useState<string>("ALL"); // "ALL" or "2025", "2026", etc.

  // --- Achievement Photos (Album Khoảnh Khắc Vinh Danh) ---
  const storageKey = useMemo(() => {
    const uid = currentUser?.id || currentUser?.phone || currentUser?.fullName || "default_user";
    return `tanphu_4m1e1i_achievement_photos_${uid}`;
  }, [currentUser?.id, currentUser?.phone, currentUser?.fullName]);

  // Load photos helper with fallback migration from legacy keys
  const loadPhotosFromStorage = useCallback((key: string): AchievementPhoto[] => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Check legacy/fallback keys if current key is empty
      const legacyKeys = [
        "tanphu_4m1e1i_achievement_photos_default_user",
        "tanphu_4m1e1i_achievement_photos_all",
        "tanphu_4m1e1i_achievement_photos"
      ];
      for (const legacyKey of legacyKeys) {
        if (legacyKey !== key) {
          const legacySaved = localStorage.getItem(legacyKey);
          if (legacySaved) {
            const parsed = JSON.parse(legacySaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Copy to current user key
              localStorage.setItem(key, JSON.stringify(parsed));
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not load photos from storage", e);
    }
    return [];
  }, []);

  const [photos, setPhotos] = useState<AchievementPhoto[]>(() => loadPhotosFromStorage(storageKey));

  // Reload photos whenever storageKey (e.g. logged-in user) changes
  useEffect(() => {
    const loaded = loadPhotosFromStorage(storageKey);
    setPhotos(loaded);
  }, [storageKey, loadPhotosFromStorage]);

  // Save photos to storage whenever photos change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(photos));
      // Also sync to global backup key to prevent accidental loss
      if (photos.length > 0) {
        localStorage.setItem("tanphu_4m1e1i_achievement_photos_backup", JSON.stringify(photos));
      }
    } catch (e) {
      console.warn("Could not save photos to storage (quota might be full)", e);
    }
  }, [photos, storageKey]);

  // Modal states for photos
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState<boolean>(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>("");
  const [newPhotoTitle, setNewPhotoTitle] = useState<string>("");
  const [newPhotoDate, setNewPhotoDate] = useState<string>(getTodayFormatted());
  const [newPhotoNotes, setNewPhotoNotes] = useState<string>("");
  const [newPhotoBadge, setNewPhotoBadge] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [viewingPhoto, setViewingPhoto] = useState<AchievementPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      if (onShowToast) onShowToast("Vui lòng chọn file hình ảnh hợp lệ", "warning");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 900; // Optimal size for crisp mobile display & fast storage
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const base64 = canvas.toDataURL("image/jpeg", 0.78);
            setNewPhotoUrl(base64);
          } else {
            setNewPhotoUrl(event.target?.result as string);
          }
          setIsUploading(false);
        };
        img.onerror = () => {
          setNewPhotoUrl(event.target?.result as string);
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      if (onShowToast) onShowToast("Không thể tải ảnh", "error");
    }
  };

  const handleSavePhoto = () => {
    if (!newPhotoUrl) {
      if (onShowToast) onShowToast("Vui lòng chọn hình ảnh", "warning");
      return;
    }
    const item: AchievementPhoto = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: newPhotoUrl,
      title: newPhotoTitle.trim() || "Khoảnh khắc vinh danh",
      date: newPhotoDate.trim() || getTodayFormatted(),
      notes: newPhotoNotes.trim() || undefined,
      badgeName: newPhotoBadge.trim() || undefined,
      uploadedAt: Date.now()
    };

    setPhotos((prev) => {
      const next = [item, ...prev];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
      return next;
    });
    setIsAddPhotoOpen(false);
    setNewPhotoUrl("");
    setNewPhotoTitle("");
    setNewPhotoDate(getTodayFormatted());
    setNewPhotoNotes("");
    setNewPhotoBadge("");

    if (onShowToast) onShowToast("Đã lưu hình ảnh khoảnh khắc vinh danh", "success");
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    if (viewingPhoto?.id === id) setViewingPhoto(null);
    if (onShowToast) onShowToast("Đã xóa ảnh", "info");
  };

  // Filter photos by selectedMonth and selectedYear
  const filteredPhotos = useMemo(() => {
    if (selectedMonth === "ALL" && selectedYear === "ALL") return photos;
    return photos.filter((p) => {
      const parsed = parseReportDate(p.date) || parseReportDate(p.uploadedAt);
      if (!parsed) return true;
      if (selectedMonth !== "ALL" && parsed.month !== selectedMonth) return false;
      if (selectedYear !== "ALL" && parsed.fullYear !== selectedYear) return false;
      return true;
    });
  }, [photos, selectedMonth, selectedYear]);

  // Extract available years strictly from valid reports that actually have data
  const availableYears = useMemo(() => {
    const yearsMap = new Map<string, number>();

    reports.forEach((r) => {
      if (r.isDeleted) return;
      const parsed = parseReportDate(r.timestamp);
      if (parsed && parsed.fullYear) {
        yearsMap.set(parsed.fullYear, (yearsMap.get(parsed.fullYear) || 0) + 1);
      }
    });

    return Array.from(yearsMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [reports]);

  // Extract available months strictly from valid reports that have data (and match selectedYear if a year is selected)
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, number>();

    reports.forEach((r) => {
      if (r.isDeleted) return;
      const parsed = parseReportDate(r.timestamp);
      if (!parsed || !parsed.month) return;

      if (selectedYear !== "ALL" && parsed.fullYear !== selectedYear) {
        return;
      }

      monthsMap.set(parsed.month, (monthsMap.get(parsed.month) || 0) + 1);
    });

    return Array.from(monthsMap.entries())
      .map(([month, count]) => ({
        month,
        label: `Tháng ${month}`,
        count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [reports, selectedYear]);

  // Auto-reset month if selected month is no longer available in the current year
  useEffect(() => {
    if (selectedMonth !== "ALL") {
      const exists = availableMonths.some((m) => m.month === selectedMonth);
      if (!exists) {
        setSelectedMonth("ALL");
      }
    }
  }, [availableMonths, selectedMonth]);

  // Date helper for filtering reports
  const matchMonthYear = (timestamp?: string | number) => {
    if (selectedMonth === "ALL" && selectedYear === "ALL") return true;
    if (!timestamp) return false;
    const parsed = parseReportDate(timestamp);
    if (!parsed) return false;

    if (selectedMonth !== "ALL" && parsed.month !== selectedMonth) {
      return false;
    }

    if (selectedYear !== "ALL" && parsed.fullYear !== selectedYear) {
      return false;
    }

    return true;
  };

  // --- 1. Filter reports created, assigned, and resolved by currentUser ---
  const isMyCreated = (r: QualityReport) => {
    if (!r || r.isDeleted) return false;
    return (
      (currentUser?.id && r.uploaderId === currentUser.id) ||
      (currentUser?.phone && r.uploaderPhone === currentUser.phone) ||
      (currentUser?.fullName && r.uploaderName?.toLowerCase() === currentUser.fullName.toLowerCase())
    );
  };

  const isMyResolved = (r: QualityReport) => {
    if (!r || r.isDeleted) return false;
    const userName = (currentUser?.fullName || "").toLowerCase();
    const userDept = (currentUser?.department || "").toLowerCase();

    const inResolutions = (r.resolutions || []).some((res) => {
      const handler = (res.handlerName || "").toLowerCase();
      const dept = (res.departmentName || "").toLowerCase();
      return (userName && handler.includes(userName)) || (userDept && dept.includes(userDept));
    });

    const inReplications = (r.replications || []).some((rep) => {
      const reg = (rep.registrantName || "").toLowerCase();
      const dept = (rep.departmentName || "").toLowerCase();
      return (userName && reg.includes(userName)) || (userDept && dept.includes(userDept));
    });

    return inResolutions || inReplications;
  };

  // Active reports filtered by month and year
  const validReports = useMemo(() => {
    return reports.filter((r) => !r.isDeleted && matchMonthYear(r.timestamp));
  }, [reports, selectedMonth, selectedYear]);

  const myCreatedReports = useMemo(() => validReports.filter((r) => isMyCreated(r)), [validReports, currentUser]);
  const myResolvedReports = useMemo(() => validReports.filter((r) => isMyResolved(r)), [validReports, currentUser]);

  // --- 2. Contribution Ratios Calculation (Company, Branch, Dept) ---
  // A. Company / System Level
  const totalSystemCount = Math.max(1, validReports.length);
  const myTotalCount = myCreatedReports.length;
  const systemRatio = Number(((myTotalCount / totalSystemCount) * 100).toFixed(1));

  // B. Branch / Factory Level
  const userBranchClean = (currentUser?.branch || "").toLowerCase().trim();
  const branchReports = useMemo(() => {
    if (!userBranchClean) return validReports;
    return validReports.filter((r) => {
      const rFactory = (r.factory || "").toLowerCase().trim();
      return rFactory && (userBranchClean.includes(rFactory) || rFactory.includes(userBranchClean));
    });
  }, [validReports, userBranchClean]);

  const myBranchCount = myCreatedReports.length;
  const totalBranchCount = Math.max(1, branchReports.length);
  const branchRatio = Number(((myBranchCount / totalBranchCount) * 100).toFixed(1));

  // C. Department Level
  const userDeptClean = (currentUser?.department || "").toLowerCase().trim();
  const deptReports = useMemo(() => {
    if (!userDeptClean) return branchReports;
    return validReports.filter((r) => {
      const rDept = (r.uploaderDepartment || "").toLowerCase().trim();
      return rDept && (userDeptClean.includes(rDept) || rDept.includes(userDeptClean));
    });
  }, [validReports, userDeptClean, branchReports]);

  const myDeptCount = myCreatedReports.length;
  const totalDeptCount = Math.max(1, deptReports.length);
  const deptRatio = Number(((myDeptCount / totalDeptCount) * 100).toFixed(1));

  // --- 3. KPH & DSA Statistics ---
  const myKphReports = useMemo(
    () => myCreatedReports.filter((r) => r.reportType !== "DSA"),
    [myCreatedReports]
  );
  const myDsaReports = useMemo(
    () => myCreatedReports.filter((r) => r.reportType === "DSA" || r.isSpotlight),
    [myCreatedReports]
  );

  const kphInternalCount = useMemo(
    () => myKphReports.filter((r) => r.kphSubtype === "NB" || !r.kphSubtype).length,
    [myKphReports]
  );
  const kphExternalCount = useMemo(
    () => myKphReports.filter((r) => r.kphSubtype === "BN").length,
    [myKphReports]
  );
  const rroCount = useMemo(
    () => myKphReports.filter((r) => r.reportType === "RRO" || (r.content && r.content.includes("RRRO"))).length,
    [myKphReports]
  );
  const kphResolvedCount = useMemo(
    () => myKphReports.filter((r) => (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed).length,
    [myKphReports]
  );
  const kphResolutionRate = myKphReports.length > 0 ? Math.round((kphResolvedCount / myKphReports.length) * 100) : 100;

  const dsaApprovedCount = useMemo(
    () => myDsaReports.filter((r) => r.isApproved || (r.badges && r.badges.length > 0)).length,
    [myDsaReports]
  );
  const dsaReplicatedCount = useMemo(
    () => myDsaReports.filter((r) => r.replications && r.replications.length > 0).length,
    [myDsaReports]
  );

  // --- 4. Badges & Directives Awarded from Management ---
  const managementBadges = useMemo(() => {
    const list: { badge: any; reportCode: string; reportId: string; content: string }[] = [];
    myCreatedReports.forEach((r) => {
      if (r.badges && r.badges.length > 0) {
        r.badges.forEach((b) => {
          if (b.timestamp && !matchMonthYear(b.timestamp)) return;
          list.push({
            badge: b,
            reportCode: r.reportCode || r.id.substring(0, 8).toUpperCase(),
            reportId: r.id,
            content: r.content
          });
        });
      }
    });
    // Also check resolutions
    validReports.forEach((r) => {
      (r.resolutions || []).forEach((res) => {
        const handler = (res.handlerName || "").toLowerCase();
        const userName = (currentUser?.fullName || "").toLowerCase();
        if (userName && handler.includes(userName) && res.badges && res.badges.length > 0) {
          res.badges.forEach((b) => {
            if (b.timestamp && !matchMonthYear(b.timestamp)) return;
            list.push({
              badge: b,
              reportCode: r.reportCode || r.id.substring(0, 8).toUpperCase(),
              reportId: r.id,
              content: `Giải pháp cho: ${r.content}`
            });
          });
        }
      });
    });
    return list;
  }, [myCreatedReports, validReports, currentUser, selectedMonth, selectedYear]);

  // Fast resolutions & Praised Tasks
  const fastResolutions = useMemo(() => {
    return myResolvedReports.filter((r) => {
      const hasDirectivesWithPraise = (r.directives || []).some((d) => {
        const txt = (d.text || "").toLowerCase();
        return (
          txt.includes("khen") ||
          txt.includes("tốt") ||
          txt.includes("xuất sắc") ||
          txt.includes("nhanh") ||
          txt.includes("hoan nghênh") ||
          txt.includes("chuẩn")
        );
      });
      const hasLikes = (r.likedBy || []).length >= 2;
      return hasDirectivesWithPraise || hasLikes || r.qcConfirmed;
    });
  }, [myResolvedReports]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 0. BỘ LỌC THỜI GIAN THỐNG KÊ (ĐẶT Ở ĐẦU TRANG ĐỂ ĐIỀU KHIỂN TOÀN BỘ SỐ LIỆU) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <Filter className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 flex-wrap">
              <T><span translate="no" className="notranslate">BỘ LỌC THỜI GIAN THỐNG KÊ</span></T>
              {(selectedMonth !== "ALL" || selectedYear !== "ALL") && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  <T><span translate="no" className="notranslate">Đang lọc</span></T>
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
              <T><span translate="no" className="notranslate">Lọc toàn bộ dữ liệu tổng hợp, hồ sơ đóng góp, tỷ trọng và thành tích theo tháng/năm</span></T>
            </p>
          </div>
        </div>

        {/* 2 nút lọc nằm dòng riêng bên dưới */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 flex-wrap">
          {/* Year dropdown */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              <T><span translate="no" className="notranslate">Năm:</span></T>
            </label>
            <div className="relative flex-1">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-300 hover:border-blue-500 focus:border-blue-600 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 focus:outline-hidden shadow-3xs cursor-pointer transition-all"
              >
                <option value="ALL">-- Tất cả năm --</option>
                {availableYears.map((yr) => (
                  <option key={yr.year} value={yr.year}>
                    Năm {yr.year}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Month dropdown */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[130px]">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
              <T><span translate="no" className="notranslate">Tháng:</span></T>
            </label>
            <div className="relative flex-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-white border border-slate-300 hover:border-blue-500 focus:border-blue-600 rounded-xl px-3 py-1.5 pr-8 text-xs font-bold text-slate-800 focus:outline-hidden shadow-3xs cursor-pointer transition-all"
              >
                <option value="ALL">
                  {availableMonths.length > 0 ? "-- Tất cả tháng --" : "-- Không có tháng --"}
                </option>
                {availableMonths.map((m) => (
                  <option key={m.month} value={m.month}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reset button if filter is active */}
          {(selectedMonth !== "ALL" || selectedYear !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSelectedMonth("ALL");
                setSelectedYear("ALL");
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs active:scale-95 whitespace-nowrap shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <T><span translate="no" className="notranslate">Đặt lại</span></T>
            </button>
          )}
        </div>
      </div>

      {/* 1. Header Banner & Profile Summary Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-3.5 sm:p-5 md:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-2.5 sm:gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] sm:text-[11px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <T><span translate="no" className="notranslate">HỒ SƠ ĐÓNG GÓP & THÀNH TÍCH 4M1E1I</span></T>
              {(selectedMonth !== "ALL" || selectedYear !== "ALL") && (
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30">
                  {selectedMonth !== "ALL" ? `T${selectedMonth}` : ""} {selectedYear !== "ALL" ? `${selectedYear}` : ""}
                </span>
              )}
            </div>
            <h2 className="text-[11px] sm:text-sm md:text-base font-black tracking-tight flex items-center gap-1.5 flex-wrap">
              <span>{currentUser.fullName}</span>
              <span className="text-[7.5px] sm:text-[9px] px-1.5 py-0.2 rounded-full font-extrabold bg-emerald-500 text-white shadow-xs uppercase whitespace-nowrap">
                {currentUser.position || currentUser.role}
              </span>
            </h2>
            <p className="text-[9px] sm:text-[10px] text-slate-300 leading-tight max-w-3xl hidden sm:block">
              <T><span translate="no" className="notranslate">Đóng góp tích cực vào chuỗi kiểm soát chất lượng 4M1E1I, phát hiện kịp thời sự cố KPH và đề xuất sáng kiến cải tiến DSA tại</span></T>{" "}
              <strong className="text-white font-semibold">{currentUser.branch || "Tân Phú"}</strong>.
            </p>
          </div>

          {/* Quick Summary Badges - Hàng riêng biệt bên dưới */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 pt-2 sm:pt-3 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl py-1.5 px-1 sm:py-2.5 sm:px-2 text-center shadow-xs hover:bg-white/15 transition-all">
              <span className="text-[10.5px] sm:text-[12px] text-slate-300 uppercase font-extrabold block mb-1 tracking-tight truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">Bản tin</span></T>
              </span>
              <span className="text-base sm:text-lg md:text-xl font-black text-white leading-none">{myCreatedReports.length}</span>
            </div>
            <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-xl py-1.5 px-1 sm:py-2.5 sm:px-2 text-center shadow-xs hover:bg-rose-500/30 transition-all">
              <span className="text-[10.5px] sm:text-[12px] text-rose-200 uppercase font-extrabold block mb-1 tracking-tight truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">KPH</span></T>
              </span>
              <span className="text-base sm:text-lg md:text-xl font-black text-rose-300 leading-none">{myKphReports.length}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-xl py-1.5 px-1 sm:py-2.5 sm:px-2 text-center shadow-xs hover:bg-emerald-500/30 transition-all">
              <span className="text-[10.5px] sm:text-[12px] text-emerald-200 uppercase font-extrabold block mb-1 tracking-tight truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">DSA</span></T>
              </span>
              <span className="text-base sm:text-lg md:text-xl font-black text-emerald-300 leading-none">{myDsaReports.length}</span>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-xl py-1.5 px-1 sm:py-2.5 sm:px-2 text-center shadow-xs hover:bg-amber-500/30 transition-all">
              <span className="text-[10.5px] sm:text-[12px] text-amber-200 uppercase font-extrabold block mb-1 tracking-tight truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">Huy hiệu</span></T>
              </span>
              <span className="text-base sm:text-lg md:text-xl font-black text-amber-300 leading-none">{managementBadges.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHỐI 1: TỶ TRỌNG ĐÓNG GÓP CỦA TÔI (3 BIỂU ĐỒ BÁNH / DONUT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
        {/* Header Tỷ trọng */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                <T><span translate="no" className="notranslate">TỶ TRỌNG ĐÓNG GÓP BẢN TIN 4M1E1I CỦA BẠN</span></T>
              </h3>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                <T><span translate="no" className="notranslate">Tỷ lệ phần trăm đóng góp của bạn so với toàn Công ty, Nhà máy và Bộ phận</span></T>
                {(selectedMonth !== "ALL" || selectedYear !== "ALL") && (
                  <span className="font-bold text-blue-700 ml-1">
                    ({selectedMonth !== "ALL" ? `Tháng ${selectedMonth}` : ""} {selectedYear !== "ALL" ? `Năm ${selectedYear}` : ""})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Thẻ biểu đồ: Mỗi thẻ 1 dòng trên Mobile (grid-cols-1), 3 cột trên Desktop (md:grid-cols-3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
          {/* Chart 1: So với Toàn Công ty */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-between text-center relative hover:border-blue-300 transition-all shadow-xs">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <T><span translate="no" className="notranslate">Toàn Tập đoàn / Công ty</span></T>
              </span>
              <span className="text-blue-700 font-black text-xs px-2 py-0.5 bg-blue-100/70 rounded-md shrink-0">
                {myTotalCount}/{totalSystemCount}
              </span>
            </div>

            <div className="w-32 h-32 sm:w-36 sm:h-36 relative my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} bản tin`,
                      name === "my" ? "Của bạn" : "Hệ thống khác"
                    ]}
                  />
                  <Pie
                    data={[
                      { name: "my", value: myTotalCount },
                      { name: "others", value: Math.max(0, totalSystemCount - myTotalCount) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={PIE_COLORS.my} />
                    <Cell fill={PIE_COLORS.others} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-800">{systemRatio}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase"><T><span translate="no" className="notranslate">Tỷ lệ</span></T></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Đóng góp</span></T> <strong className="text-blue-700 font-black">{systemRatio}%</strong> <T><span translate="no" className="notranslate">tổng lượng bản tin toàn hệ thống</span></T>
            </p>
          </div>

          {/* Chart 2: So với Chi nhánh / Nhà máy */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-between text-center relative hover:border-indigo-300 transition-all shadow-xs">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <Factory className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <T><span translate="no" className="notranslate">Chi nhánh / Nhà máy</span></T>
              </span>
              <span className="text-indigo-700 font-black text-xs px-2 py-0.5 bg-indigo-100/70 rounded-md shrink-0">
                {myBranchCount}/{totalBranchCount}
              </span>
            </div>

            <div className="w-32 h-32 sm:w-36 sm:h-36 relative my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} bản tin`,
                      name === "my" ? "Của bạn" : "Nhà máy khác"
                    ]}
                  />
                  <Pie
                    data={[
                      { name: "my", value: myBranchCount },
                      { name: "others", value: Math.max(0, totalBranchCount - myBranchCount) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill={PIE_COLORS.others} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-800">{branchRatio}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase"><T><span translate="no" className="notranslate">Nhà máy</span></T></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Tại</span></T> <strong className="text-indigo-700 font-bold">{currentUser.branch || "Chi nhánh"}</strong>: <strong className="text-indigo-700 font-black">{branchRatio}%</strong>
            </p>
          </div>

          {/* Chart 3: So với Bộ phận / Đơn vị */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-between text-center relative hover:border-emerald-300 transition-all shadow-xs">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <T><span translate="no" className="notranslate">Phòng ban / Bộ phận</span></T>
              </span>
              <span className="text-emerald-700 font-black text-xs px-2 py-0.5 bg-emerald-100/70 rounded-md shrink-0">
                {myDeptCount}/{totalDeptCount}
              </span>
            </div>

            <div className="w-32 h-32 sm:w-36 sm:h-36 relative my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} bản tin`,
                      name === "my" ? "Của bạn" : "Đồng nghiệp BP"
                    ]}
                  />
                  <Pie
                    data={[
                      { name: "my", value: myDeptCount },
                      { name: "others", value: Math.max(0, totalDeptCount - myDeptCount) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#059669" />
                    <Cell fill={PIE_COLORS.others} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-800">{deptRatio}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase"><T><span translate="no" className="notranslate">Bộ phận</span></T></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Tại BP</span></T> <strong className="text-emerald-700 font-bold">{currentUser.department || "Bộ phận"}</strong>: <strong className="text-emerald-700 font-black">{deptRatio}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 3. KHỐI 2: CHI TIẾT SỰ CỐ KPH & ĐIỂM SÁNG DSA (TÁCH 2 DÒNG RIÊNG CHỒNG LÊN NHAU) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Card KPH & Rủi ro */}
        <div className="bg-white border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-rose-900 uppercase tracking-wide">
                  <T><span translate="no" className="notranslate">THỐNG KÊ SỰ CỐ KPH & RỦI RO</span></T>
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                  <T><span translate="no" className="notranslate">Các vấn đề không phù hợp bạn đã kịp thời phát hiện & cảnh báo</span></T>
                </p>
              </div>
            </div>
            <span className="text-sm sm:text-base font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 shrink-0 whitespace-nowrap">
              {myKphReports.length} <span className="text-[10px] font-bold"><T><span translate="no" className="notranslate">vụ</span></T></span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-2.5 text-center">
              <span className="text-[10.5px] sm:text-xs text-slate-700 font-extrabold block mb-0.5 truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">KPH (NB)</span></T>
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-700 leading-tight block">{kphInternalCount}</span>
            </div>
            <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-2.5 text-center">
              <span className="text-[10.5px] sm:text-xs text-slate-700 font-extrabold block mb-0.5 truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">KPH (BN)</span></T>
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-800 leading-tight block">{kphExternalCount}</span>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-2.5 text-center">
              <span className="text-[10.5px] sm:text-xs text-slate-700 font-extrabold block mb-0.5 truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">RRO</span></T>
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-700 leading-tight block">{rroCount}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] sm:text-xs min-w-0 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate"><T><span translate="no" className="notranslate">Tỷ lệ KPH đã giải quyết:</span></T></span>
            </span>
            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 text-xs whitespace-nowrap">
              {kphResolvedCount}/{myKphReports.length} ({kphResolutionRate}%)
            </span>
          </div>
        </div>

        {/* Card Điểm sáng DSA (Kaizen) */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-900 uppercase tracking-wide">
                  <T><span translate="no" className="notranslate">THỐNG KÊ ĐIỂM SÁNG DSA (KAIZEN)</span></T>
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                  <T><span translate="no" className="notranslate">Các sáng kiến cải tiến, kinh nghiệm hay và đổi mới bạn đóng góp</span></T>
                </p>
              </div>
            </div>
            <span className="text-sm sm:text-base font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0 whitespace-nowrap">
              {myDsaReports.length} <span className="text-[10px] font-bold"><T><span translate="no" className="notranslate">sáng kiến</span></T></span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 text-center">
              <span className="text-[8.5px] sm:text-[10px] text-slate-600 font-bold block mb-0.5 truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">ĐÃ ĐƯỢC PHÊ DUYỆT</span></T>
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-700">{dsaApprovedCount}</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 text-center">
              <span className="text-[8.5px] sm:text-[10px] text-slate-600 font-bold block mb-0.5 truncate whitespace-nowrap">
                <T><span translate="no" className="notranslate">ĐÃ ĐƯỢC NHÂN RỘNG</span></T>
              </span>
              <span className="text-base sm:text-lg font-black text-teal-700">{dsaReplicatedCount}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] sm:text-xs min-w-0 truncate">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate"><T><span translate="no" className="notranslate">Đóng góp giá trị gia tăng:</span></T></span>
            </span>
            <span className="text-slate-600 font-medium text-[11px] sm:text-xs shrink-0 whitespace-nowrap">
              <T><span translate="no" className="notranslate">Tiết kiệm thời gian & nâng cao năng suất</span></T>
            </span>
          </div>
        </div>
      </div>

      {/* 4. KHỐI 3: HUY HIỆU TỰ HÀO & CÔNG VIỆC XỬ LÝ THẦN TỐC / ĐƯỢC KHEN TẶNG */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                <T><span translate="no" className="notranslate">BẢNG HUY HIỆU TỰ HÀO & KHEN TẶNG CỦA CẤP QUẢN LÝ</span></T>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                <T><span translate="no" className="notranslate">Huy hiệu vinh danh và các chỉ đạo đánh giá xuất sắc từ Ban Giám đốc / Quản lý</span></T>
              </p>
            </div>
          </div>
        </div>

        {/* Badges Grid: Đúng 2 thẻ / 1 dòng trên mobile */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500 shrink-0" />
            <T><span translate="no" className="notranslate">Huy hiệu được trao tặng</span></T> ({managementBadges.length})
          </h4>

          {managementBadges.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
              <T><span translate="no" className="notranslate">Chưa có huy hiệu trao tặng trực tiếp nào. Hãy tiếp tục phát hiện KPH và đề xuất DSA để nhận huy hiệu từ Ban Giám đốc!</span></T>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
              {managementBadges.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 bg-gradient-to-br from-amber-50/90 to-orange-50/60 border border-amber-200/90 rounded-xl flex items-center gap-2 sm:gap-3 shadow-xs hover:border-amber-300 transition-all"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[11px] sm:text-xs font-black text-amber-950 truncate leading-tight">
                      {item.badge?.name || <T><span translate="no" className="notranslate">Huy hiệu Xuất sắc</span></T>}
                    </h5>
                    <span className="text-[8.5px] sm:text-[9px] font-bold text-amber-700 block mt-0.5">
                      {item.badge?.timestamp || "dd/mm/yy"}
                    </span>
                    <p className="text-[9px] sm:text-[9.5px] text-amber-900/80 truncate mt-0.5 leading-tight">
                      <T><span translate="no" className="notranslate">Người trao:</span></T> <strong className="text-amber-950 font-bold">{item.badge?.giverName || "Ban Giám đốc"}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fast Resolutions & Praised directives */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <T><span translate="no" className="notranslate">Công việc xử lý nhanh & nhận lời khen ngợi</span></T> ({fastResolutions.length})
          </h4>

          {fastResolutions.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
              <T><span translate="no" className="notranslate">Chưa có ghi nhận công việc khen thưởng riêng. Hệ thống tự động ghi nhận khi có chỉ đạo biểu dương hoặc giải pháp hoàn tất.</span></T>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fastResolutions.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="p-3 bg-slate-50 hover:bg-blue-50/30 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-blue-700 text-[11px]">
                        {r.reportCode || r.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <T><span translate="no" className="notranslate">Đã khắc phục tốt</span></T>
                      </span>
                    </div>
                    <p className="text-slate-800 line-clamp-1 font-medium">{r.content}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">{r.timestamp}</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. KHỐI 4: KHOẢNH KHẮC & ALBUM ẢNH THÀNH TÍCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => {
              setNewPhotoUrl("");
              setNewPhotoTitle("");
              setNewPhotoDate(getTodayFormatted());
              setNewPhotoNotes("");
              setNewPhotoBadge("");
              setIsAddPhotoOpen(true);
            }}
            className="p-1.5 sm:p-2 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 rounded-xl shrink-0 transition-all active:scale-95 cursor-pointer shadow-3xs flex items-center justify-center group"
            title="Thêm ảnh khoảnh khắc mới"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
              <T><span translate="no" className="notranslate">KHOẢNH KHẮC & ALBUM ẢNH THÀNH TÍCH</span></T>
            </h3>
            <p className="text-[10.5px] sm:text-[11px] text-slate-500">
              <T><span translate="no" className="notranslate">Lưu giữ hình ảnh nhận giải, lễ vinh danh, sáng kiến Kaizen và trao thưởng 4M1E1I</span></T>
            </p>
          </div>
        </div>

        {/* Danh sách ảnh */}
        {filteredPhotos.length === 0 ? (
          <div className="py-8 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-3xs">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <p className="text-xs font-bold text-slate-700">
                <T><span translate="no" className="notranslate">Chưa có ảnh khoảnh khắc nào được lưu</span></T>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <T><span translate="no" className="notranslate">Lưu lại những bức ảnh kỷ niệm nhận cờ thi đua, chứng nhận Kaizen hoặc khen thưởng tại nhà máy</span></T>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPhotoUrl("");
                setNewPhotoTitle("");
                setNewPhotoDate(getTodayFormatted());
                setNewPhotoNotes("");
                setNewPhotoBadge("");
                setIsAddPhotoOpen(true);
              }}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs font-bold"
              title="Thêm ảnh"
            >
              <Camera className="w-4 h-4" />
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setViewingPhoto(photo)}
                className="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200/90 aspect-4/3 cursor-pointer shadow-3xs hover:shadow-md transition-all"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity flex flex-col justify-end p-2 sm:p-2.5 text-white">
                  {photo.badgeName && (
                    <span className="self-start text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 mb-1 shadow-3xs truncate max-w-full">
                      {photo.badgeName}
                    </span>
                  )}
                  <h5 className="text-[11px] font-black leading-tight truncate text-white drop-shadow-xs">
                    {photo.title}
                  </h5>
                  <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5">
                    <span className="font-semibold">{photo.date}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL THÊM ẢNH (KHÔNG CÓ CHỮ 'Thêm ảnh thành tích') */}
      {isAddPhotoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-3xs">
                  <Camera className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
                  <T><span translate="no" className="notranslate">KHOẢNH KHẮC & HÌNH ẢNH VINH DANH</span></T>
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vùng chọn ảnh */}
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {newPhotoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group">
                  <img
                    src={newPhotoUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 transition-all"
                  >
                    <Camera className="w-3 h-3" />
                    <T><span translate="no" className="notranslate">Đổi ảnh</span></T>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/30 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 group-hover:scale-110 flex items-center justify-center transition-transform">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      <T><span translate="no" className="notranslate">Chọn ảnh từ thư viện hoặc chụp trực tiếp</span></T>
                    </span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WEBP</span>
                  </div>
                </div>
              )}

              {/* Tiêu đề ảnh */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <T><span translate="no" className="notranslate">Tiêu đề / Sự kiện:</span></T>
                </label>
                <input
                  type="text"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  placeholder="Ví dụ: Khen thưởng Kaizen Tháng 5, Cờ thi đua..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden transition-all"
                />
              </div>

              {/* Ngày diễn ra */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <T><span translate="no" className="notranslate">Ngày diễn ra (dd/mm/yy):</span></T>
                </label>
                <input
                  type="text"
                  value={newPhotoDate}
                  onChange={(e) => setNewPhotoDate(e.target.value)}
                  placeholder="dd/mm/yy"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden transition-all"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  <T><span translate="no" className="notranslate">Ghi chú thêm:</span></T>
                </label>
                <textarea
                  value={newPhotoNotes}
                  onChange={(e) => setNewPhotoNotes(e.target.value)}
                  placeholder="Người trao tặng, bài học kinh nghiệm hoặc chi tiết vinh danh..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden transition-all resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddPhotoOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <T><span translate="no" className="notranslate">Hủy</span></T>
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={!newPhotoUrl || isUploading}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wide shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <T><span translate="no" className="notranslate">Lưu khoảnh khắc</span></T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX XEM ẢNH FULL */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800 text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-black/40 flex items-center justify-between border-b border-white/10">
              <div className="min-w-0 flex-1 pr-2">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">{viewingPhoto.title}</h4>
                <span className="text-[10px] text-amber-400 font-bold">{viewingPhoto.date}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(viewingPhoto.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors"
                  title="Xóa ảnh này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingPhoto(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2 sm:p-4 bg-black/60 flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={viewingPhoto.url}
                alt={viewingPhoto.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            {viewingPhoto.notes && (
              <div className="p-3.5 bg-slate-900/90 border-t border-white/10 text-xs text-slate-300">
                <strong className="text-amber-400 font-bold block mb-0.5"><T><span translate="no" className="notranslate">Ghi chú:</span></T></strong>
                {viewingPhoto.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. KHỐI ĐIỀU HƯỚNG NHANH ĐẾN DANH SÁCH VIỆC TÁC NGHIỆP */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
            <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
              <T><span translate="no" className="notranslate">XEM & QUẢN LÝ CHI TIẾT TOÀN BỘ CÔNG VIỆC / BÁO CÁO CỦA BẠN</span></T>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              <T><span translate="no" className="notranslate">Chuyển sang tab "Danh sách chi tiết việc của tôi" để lọc trạng thái, tìm kiếm, xuất file Excel hoặc chỉnh sửa nội dung.</span></T>
            </p>
          </div>
        </div>

        {/* Nút "Xem việc của tôi" cho xuống một dòng riêng */}
        {onSwitchToTasks && (
          <div className="pt-3 border-t border-blue-100 flex items-center justify-end">
            <button
              type="button"
              onClick={onSwitchToTasks}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
            >
              <T><span translate="no" className="notranslate">XEM VIỆC CỦA TÔI</span></T>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalContributionTab;
