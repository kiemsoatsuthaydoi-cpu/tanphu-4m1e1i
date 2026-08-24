import React, { useState, useMemo } from "react";
import { 
  QualityReport, 
  User, 
  Category4M1E1I, 
  Branch, 
  Department 
} from "../types";
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Search,
  Filter,
  CheckCircle,
  Building2,
  Cpu,
  Layers,
  Wrench,
  Flame,
  FileSpreadsheet,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { T } from "./TranslateText";

const CATEGORIES: Category4M1E1I[] = [
  "CON NGƯỜI",
  "MÁY MÓC",
  "NGUYÊN VẬT LIỆU",
  "PHƯƠNG PHÁP",
  "MÔI TRƯỜNG",
  "THÔNG TIN"
];

export interface ProgressTrackingDashboardProps {
  reports?: QualityReport[];
  users?: User[];
  branches?: Branch[];
  departments?: Department[];
  currentUser?: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  onAddBroadcast?: (notice: string, type: string) => void;
  showToast?: (message: string, type?: "error" | "info" | "success" | "warning") => void;
  isMobile?: boolean;
}

export default function ProgressTrackingDashboard({
  reports = [],
  currentUser,
  isMobile = false
}: ProgressTrackingDashboardProps) {
  const safeReports = useMemo(() => (Array.isArray(reports) ? reports : []), [reports]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  // Valid reports (not deleted)
  const activeReports = useMemo(() => {
    return safeReports.filter(r => r && !r.isDeleted);
  }, [safeReports]);

  // Extract unique branches with count
  const branchList = useMemo(() => {
    const map = new Map<string, number>();
    activeReports.forEach(r => {
      if (r && r.factory) {
        map.set(r.factory, (map.get(r.factory) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [activeReports]);

  // Filter reports based on active filters
  const filteredReports = useMemo(() => {
    return activeReports.filter((r) => {
      if (!r) return false;
      // Filter by branch
      if (selectedBranch !== "ALL" && r.factory !== selectedBranch) {
        return false;
      }

      // Filter by category 4M1E1I
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) {
        return false;
      }

      // Filter by status
      const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
      const isClosed = (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
      const hasResolutions = resList.length > 0 || !!r.qcConfirmed;
      
      if (selectedStatus === "RESOLVED" && (!hasResolutions || isClosed)) return false;
      if (selectedStatus === "IN_PROGRESS" && (hasResolutions || isClosed)) return false;
      if (selectedStatus === "CLOSED" && !isClosed) return false;

      // Search keyword
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchContent = (r.content || "").toLowerCase().includes(term);
        const matchUploader = (r.uploaderName || "").toLowerCase().includes(term);
        const matchFactory = (r.factory || "").toLowerCase().includes(term);
        const matchId = (r.reportCode || r.id || "").toLowerCase().includes(term);
        if (!matchContent && !matchUploader && !matchFactory && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [activeReports, selectedBranch, selectedCategory, selectedStatus, searchTerm]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = filteredReports.length;
    const abnormalReports = filteredReports.filter(r => r && (r.isAbnormal || r.reportType === "KPH" || r.reportType === "RRO"));
    const spotlightReports = filteredReports.filter(r => r && (r.isSpotlight || r.reportType === "DSA"));
    
    const resolvedCount = filteredReports.filter(r => {
      if (!r) return false;
      const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
      const isClosed = (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
      const hasResolutions = resList.length > 0 || !!r.qcConfirmed;
      return hasResolutions && !isClosed;
    }).length;
    const closedCount = filteredReports.filter(r => {
      if (!r) return false;
      const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
      return (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
    }).length;
    const pendingCount = total - resolvedCount - closedCount;
    
    const resolutionRate = total > 0 ? Math.round(((resolvedCount + closedCount) / total) * 100) : 0;
    const closedRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

    return {
      total,
      abnormalCount: abnormalReports.length,
      spotlightCount: spotlightReports.length,
      resolvedCount,
      closedCount,
      pendingCount,
      resolutionRate,
      closedRate
    };
  }, [filteredReports]);

  // Status counts based on current other filters (branch, category, search)
  const statusCounts = useMemo(() => {
    const baseReports = activeReports.filter((r) => {
      if (!r) return false;
      if (selectedBranch !== "ALL" && r.factory !== selectedBranch) return false;
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchContent = (r.content || "").toLowerCase().includes(term);
        const matchUploader = (r.uploaderName || "").toLowerCase().includes(term);
        const matchFactory = (r.factory || "").toLowerCase().includes(term);
        const matchId = (r.reportCode || r.id || "").toLowerCase().includes(term);
        if (!matchContent && !matchUploader && !matchFactory && !matchId) return false;
      }
      return true;
    });

    const total = baseReports.length;
    const closed = baseReports.filter(r => {
      if (!r) return false;
      const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
      return (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
    }).length;
    const resolved = baseReports.filter(r => {
      if (!r) return false;
      const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
      const isClosed = (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
      const hasResolutions = resList.length > 0 || !!r.qcConfirmed;
      return hasResolutions && !isClosed;
    }).length;
    const pending = total - resolved - closed;

    return { total, closed, resolved, pending };
  }, [activeReports, selectedBranch, selectedCategory, searchTerm]);

  // Category counts based on current other filters (branch, status, search)
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    CATEGORIES.forEach(cat => map.set(cat, 0));

    activeReports.forEach((r) => {
      if (!r) return;
      if (selectedBranch !== "ALL" && r.factory !== selectedBranch) return;
      const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
      const isClosed = (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
      const hasResolutions = resList.length > 0 || !!r.qcConfirmed;
      if (selectedStatus === "RESOLVED" && (!hasResolutions || isClosed)) return;
      if (selectedStatus === "IN_PROGRESS" && (hasResolutions || isClosed)) return;
      if (selectedStatus === "CLOSED" && !isClosed) return;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchContent = (r.content || "").toLowerCase().includes(term);
        const matchUploader = (r.uploaderName || "").toLowerCase().includes(term);
        const matchFactory = (r.factory || "").toLowerCase().includes(term);
        const matchId = (r.reportCode || r.id || "").toLowerCase().includes(term);
        if (!matchContent && !matchUploader && !matchFactory && !matchId) return;
      }

      if (r.category && map.has(r.category)) {
        map.set(r.category, (map.get(r.category) || 0) + 1);
      }
    });

    return map;
  }, [activeReports, selectedBranch, selectedStatus, searchTerm]);

  // Categorized statistics by 4M1E1I
  const categoryStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catReports = activeReports.filter(r => {
        if (!r) return false;
        if (selectedBranch !== "ALL" && r.factory !== selectedBranch) return false;
        return r.category === cat;
      });
      const total = catReports.length;
      const resolved = catReports.filter(r => {
        if (!r) return false;
        const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
        return resList.length > 0 || !!r.qcConfirmed;
      }).length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      return {
        category: cat,
        total,
        resolved,
        pending: total - resolved,
        rate
      };
    });
  }, [activeReports, selectedBranch]);

  // Icon mapping for 4M1E1I
  const getCategoryIcon = (cat: Category4M1E1I, className = "w-4 h-4") => {
    switch (cat) {
      case "CON NGƯỜI":
        return <Building2 className={`${className} text-blue-500`} />;
      case "MÁY MÓC":
        return <Cpu className={`${className} text-amber-500`} />;
      case "NGUYÊN VẬT LIỆU":
        return <Layers className={`${className} text-emerald-500`} />;
      case "PHƯƠNG PHÁP":
        return <Wrench className={`${className} text-purple-500`} />;
      case "MÔI TRƯỜNG":
        return <Flame className={`${className} text-rose-500`} />;
      case "THÔNG TIN":
        return <FileSpreadsheet className={`${className} text-cyan-500`} />;
      default:
        return <TrendingUp className={`${className} text-slate-500`} />;
    }
  };

  const isFilterActive = selectedCategory !== "ALL" || selectedStatus !== "ALL" || selectedBranch !== "ALL" || searchTerm.trim() !== "";

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSelectedBranch("ALL");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className={`flex items-center justify-between gap-2 sm:gap-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white ${
        isMobile ? "p-2.5" : "p-2.5 sm:p-5"
      } rounded-2xl shadow-lg border border-blue-400/30 overflow-hidden relative`}>
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        <div className="relative z-10 flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h2 className="text-[8px] sm:text-xs md:text-sm lg:text-base font-black tracking-tight uppercase text-white leading-tight">
              <T><span translate="no" className="notranslate">BẢNG TIẾN ĐỘ CẢI TIẾN & KHẮC PHỤC CHẤT LƯỢNG</span></T>
            </h2>
            <p className="text-[6.5px] sm:text-[9.5px] text-blue-100/90 mt-0.5 leading-snug">
              <T><span translate="no" className="notranslate">Theo dõi tỷ lệ giải quyết bất thường, tiến độ đóng hành động khắc phục phòng ngừa</span></T>
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center shrink-0">
          <div className="bg-white/15 backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-white/25 text-center flex flex-col items-center justify-center min-w-[56px] sm:min-w-[76px] shadow-sm">
            <div className="p-1 bg-white/20 rounded-lg border border-white/30 text-white shadow-inner mb-0.5 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="text-[5.5px] sm:text-[7.5px] text-blue-100 uppercase font-bold tracking-wider whitespace-nowrap leading-none">
              <T><span translate="no" className="notranslate">TỶ LỆ CẢI TIẾN</span></T>
            </div>
            <div className="text-xs sm:text-base font-black font-mono text-emerald-300 leading-tight mt-0.5">
              {metrics.resolutionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Strictly 2 cards per row on mobile, 4-col on desktop) */}
      <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"} gap-2.5 sm:gap-3.5 select-none`}>
        {/* Card 1: Tổng phát sinh */}
        <div 
          onClick={() => setSelectedStatus("ALL")}
          className={`bg-gradient-to-br from-blue-50 via-white to-blue-100/50 p-2.5 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-1.5 min-w-0 ${
            selectedStatus === "ALL" 
              ? "ring-2 ring-blue-500/50 border-blue-400 shadow-xs" 
              : "border-blue-200/80 hover:border-blue-300"
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-extrabold text-blue-800 uppercase tracking-tight truncate">
              <T><span translate="no" className="notranslate">TỔNG BIẾN ĐỘNG</span></T>
            </p>
            <div className="p-1 sm:p-1.5 bg-blue-500/20 text-blue-700 rounded-lg border border-blue-300 shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-0.5 min-w-0">
            <h3 className="text-lg sm:text-2xl font-black text-blue-900 leading-none shrink-0">
              <span translate="no" className="notranslate">{metrics.total}</span>
            </h3>
            <p className="text-[9px] sm:text-[10.5px] text-blue-700/80 font-bold truncate text-right">
              <T><span translate="no" className="notranslate">Tổng vụ việc</span></T>
            </p>
          </div>
        </div>

        {/* Card 2: Đã có giải pháp cải tiến */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === "RESOLVED" ? "ALL" : "RESOLVED")}
          className={`bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 p-2.5 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-1.5 min-w-0 ${
            selectedStatus === "RESOLVED" 
              ? "ring-2 ring-emerald-500/50 border-emerald-400 shadow-xs" 
              : "border-emerald-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-extrabold text-emerald-800 uppercase tracking-tight truncate">
              <T><span translate="no" className="notranslate">ĐÃ CÓ GIẢI PHÁP</span></T>
            </p>
            <div className="p-1 sm:p-1.5 bg-emerald-500/20 text-emerald-700 rounded-lg border border-emerald-300 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-0.5 min-w-0">
            <h3 className="text-lg sm:text-2xl font-black text-emerald-900 leading-none shrink-0">
              <span translate="no" className="notranslate">{metrics.resolvedCount}</span>
            </h3>
            <p className="text-[9px] sm:text-[10.5px] text-emerald-700/80 font-bold truncate text-right">
              <span translate="no" className="notranslate">{metrics.resolutionRate}%</span> <T><span translate="no" className="notranslate">tiến độ</span></T>
            </p>
          </div>
        </div>

        {/* Card 3: Đã đóng & Nghiệm thu */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === "CLOSED" ? "ALL" : "CLOSED")}
          className={`bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 p-2.5 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-1.5 min-w-0 ${
            selectedStatus === "CLOSED" 
              ? "ring-2 ring-indigo-500/50 border-indigo-400 shadow-xs" 
              : "border-indigo-200/80 hover:border-indigo-300"
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-extrabold text-indigo-800 uppercase tracking-tight truncate">
              <T><span translate="no" className="notranslate">ĐÃ NGHIỆM THU</span></T>
            </p>
            <div className="p-1 sm:p-1.5 bg-indigo-500/20 text-indigo-700 rounded-lg border border-indigo-300 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-0.5 min-w-0">
            <h3 className="text-lg sm:text-2xl font-black text-indigo-900 leading-none shrink-0">
              <span translate="no" className="notranslate">{metrics.closedCount}</span>
            </h3>
            <p className="text-[9px] sm:text-[10.5px] text-indigo-700/80 font-bold truncate text-right">
              <span translate="no" className="notranslate">{metrics.closedRate}%</span> <T><span translate="no" className="notranslate">hoàn thành</span></T>
            </p>
          </div>
        </div>

        {/* Card 4: Đang chờ xử lý / Cần hành động */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`bg-gradient-to-br from-amber-50 via-white to-amber-100/50 p-2.5 sm:p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex flex-col justify-between gap-1.5 min-w-0 ${
            selectedStatus === "IN_PROGRESS" 
              ? "ring-2 ring-amber-500/50 border-amber-400 shadow-xs" 
              : "border-amber-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-extrabold text-amber-800 uppercase tracking-tight truncate">
              <T><span translate="no" className="notranslate">CHỜ HÀNH ĐỘNG</span></T>
            </p>
            <div className="p-1 sm:p-1.5 bg-amber-500/20 text-amber-700 rounded-lg border border-amber-300 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between gap-1 mt-0.5 min-w-0">
            <h3 className="text-lg sm:text-2xl font-black text-amber-900 leading-none shrink-0">
              <span translate="no" className="notranslate">{metrics.pendingCount}</span>
            </h3>
            <p className="text-[9px] sm:text-[10.5px] text-amber-700/80 font-bold truncate text-right">
              <T><span translate="no" className="notranslate">Cần xử lý</span></T>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Phân bổ tiến độ cải tiến theo 6 yếu tố 4M1E1I (Clickable cards to filter) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">TIẾN ĐỘ GIẢI QUYẾT THEO 6 YẾU TỐ 4M1E1I</span></T>
            </h3>
          </div>
        </div>

        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {categoryStats.map(stat => {
            const isSelected = selectedCategory === stat.category;
            return (
              <div 
                key={stat.category} 
                onClick={() => setSelectedCategory(isSelected ? "ALL" : stat.category)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/30 shadow-xs" 
                    : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/80 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(stat.category)}
                    <span className={`text-xs font-bold ${isSelected ? "text-blue-700 font-black" : "text-slate-700"}`}>
                      <T><span translate="no" className="notranslate">{stat.category}</span></T>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-blue-600">
                    {stat.rate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tổng: <strong className="text-slate-700">{stat.total}</strong></span>
                  <span>Đã xử lý: <strong className="text-emerald-600">{stat.resolved}</strong></span>
                  <span>Chờ: <strong className="text-amber-600">{stat.pending}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. TRỰC QUAN HÓA BỘ LỌC TƯƠNG TÁC (INTERACTIVE VISUAL FILTERS) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Header lọc + Nút Reset */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                <T><span translate="no" className="notranslate">BỘ LỌC TƯƠNG TÁC THÔNG MINH</span></T>
              </h4>
              <p className="text-[11px] text-slate-500">
                <T><span translate="no" className="notranslate">Bấm chọn nhanh theo trạng thái, yếu tố 4M1E1I và nhà máy/chi nhánh</span></T>
              </p>
            </div>
          </div>

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <T><span translate="no" className="notranslate">Đặt lại bộ lọc</span></T>
            </button>
          )}
        </div>

        {/* Khối 1: Lọc Trạng thái xử lý (Segmented Buttons / Pills) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            <T><span translate="no" className="notranslate">1. Trạng thái tiến độ:</span></T>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {/* Tất cả */}
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-xl text-[7.5px] sm:text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <FileText className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 opacity-80 shrink-0" />
                <T><span translate="no" className="notranslate">Tất cả trạng thái</span></T>
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[10px] font-mono shrink-0 ${
                selectedStatus === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {statusCounts.total}
              </span>
            </button>

            {/* Đã có giải pháp */}
            <button
              type="button"
              onClick={() => setSelectedStatus("RESOLVED")}
              className={`flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-xl text-[7.5px] sm:text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "RESOLVED"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 opacity-90 shrink-0" />
                <T><span translate="no" className="notranslate">Đã có giải pháp</span></T>
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[10px] font-mono shrink-0 ${
                selectedStatus === "RESOLVED" ? "bg-white/25 text-white" : "bg-emerald-200/80 text-emerald-900"
              }`}>
                {statusCounts.resolved}
              </span>
            </button>

            {/* Đã nghiệm thu (Đóng) */}
            <button
              type="button"
              onClick={() => setSelectedStatus("CLOSED")}
              className={`flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-xl text-[7.5px] sm:text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "CLOSED"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-indigo-50/60 text-indigo-800 border-indigo-200 hover:bg-indigo-100/80"
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 opacity-90 shrink-0" />
                <T><span translate="no" className="notranslate">Đã nghiệm thu</span></T>
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[10px] font-mono shrink-0 ${
                selectedStatus === "CLOSED" ? "bg-white/25 text-white" : "bg-indigo-200/80 text-indigo-900"
              }`}>
                {statusCounts.closed}
              </span>
            </button>

            {/* Đang chờ xử lý */}
            <button
              type="button"
              onClick={() => setSelectedStatus("IN_PROGRESS")}
              className={`flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-xl text-[7.5px] sm:text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "IN_PROGRESS"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100/80"
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <Clock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 opacity-90 shrink-0" />
                <T><span translate="no" className="notranslate">Đang chờ xử lý</span></T>
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-[7.5px] sm:text-[10px] font-mono shrink-0 ${
                selectedStatus === "IN_PROGRESS" ? "bg-white/25 text-white" : "bg-amber-200/80 text-amber-900"
              }`}>
                {statusCounts.pending}
              </span>
            </button>
          </div>
        </div>

        {/* Khối 2: Lọc Yếu tố 4M1E1I (Interactive Chips) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
            <T><span translate="no" className="notranslate">2. Phân loại theo 6 yếu tố 4M1E1I:</span></T>
          </label>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {/* Tất cả 4M */}
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[8.5px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 ${
                selectedCategory === "ALL"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
                <span className="text-xs sm:text-sm shrink-0">🌐</span>
                <span className="truncate"><T><span translate="no" className="notranslate">Tất cả 6 yếu tố</span></T></span>
              </span>
            </button>

            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts.get(cat) || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "ALL" : cat)}
                  className={`px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[8.5px] sm:text-xs font-bold border transition-all cursor-pointer flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-1.5 min-w-0 truncate">
                    <span className="shrink-0">{getCategoryIcon(cat, "w-3 h-3 sm:w-3.5 sm:h-3.5")}</span>
                    <span className="truncate"><T><span translate="no" className="notranslate">{cat}</span></T></span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-mono shrink-0 ${
                    isSelected ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khối 3: Chi nhánh / Nhà máy & Thanh Tìm kiếm */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Lọc Chi nhánh (Visual Select with icon & counter) */}
          <div className="md:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              <T><span translate="no" className="notranslate">3. Nhà máy / Chi nhánh:</span></T>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="ALL">🏢 Tất cả chi nhánh ({activeReports.length})</option>
                {branchList.map(b => (
                  <option key={b.name} value={b.name}>
                    📍 {b.name} ({b.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Ô Tìm kiếm Từ khóa */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              <T><span translate="no" className="notranslate">4. Tìm kiếm nhanh từ khóa:</span></T>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Nhập mã ID, nội dung sự cố, người báo cáo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Data Table / Detailed Tracking List */}
      <div className="bg-white rounded-xl border border-slate-900 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-900 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">{isMobile ? "DS CHI TIẾT TIẾN TRÌNH CẢI TIẾN" : "DANH SÁCH CHI TIẾT TIẾN TRÌNH CẢI TIẾN"} ({filteredReports.length})</span></T>
            </h4>
          </div>

          {/* Quick active tags */}
          {isFilterActive && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
              <span className="font-semibold"><T><span translate="no" className="notranslate">Đang lọc theo:</span></T></span>
              {selectedStatus !== "ALL" && (
                <span className="bg-slate-200 text-slate-900 border border-slate-800 px-2 py-0.5 rounded-md font-bold">
                  {selectedStatus === "RESOLVED" ? "Đã có giải pháp" : selectedStatus === "CLOSED" ? "Đã nghiệm thu" : "Đang chờ"}
                </span>
              )}
              {selectedCategory !== "ALL" && (
                <span className="bg-blue-100 text-blue-900 border border-blue-800 px-2 py-0.5 rounded-md font-bold">
                  {selectedCategory}
                </span>
              )}
              {selectedBranch !== "ALL" && (
                <span className="bg-indigo-100 text-indigo-900 border border-indigo-800 px-2 py-0.5 rounded-md font-bold">
                  {selectedBranch}
                </span>
              )}
            </div>
          )}
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-2">
            <div className="text-2xl">🔍</div>
            <p><T><span translate="no" className="notranslate">Không tìm thấy báo cáo hoặc sự cố nào phù hợp với bộ lọc hiện tại.</span></T></p>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
              >
                <T><span translate="no" className="notranslate">Nhấn vào đây để xem tất cả</span></T>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                  <th className="py-2.5 px-3 border border-slate-900"><T><span translate="no" className="notranslate">Mã / Ngày</span></T></th>
                  <th className="py-2.5 px-3 border border-slate-900"><T><span translate="no" className="notranslate">Đơn vị & Yếu tố</span></T></th>
                  <th className="py-2.5 px-3 border border-slate-900"><T><span translate="no" className="notranslate">Nội dung biến động / KPH</span></T></th>
                  <th className="py-2.5 px-3 border border-slate-900"><T><span translate="no" className="notranslate">Phương án Cải tiến / Xử lý</span></T></th>
                  <th className="py-2.5 px-3 border border-slate-900 text-center"><T><span translate="no" className="notranslate">Tiến độ</span></T></th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredReports.slice(0, 50).map((r) => {
                  const resList = Array.isArray(r.resolutions) ? r.resolutions : [];
                  const isClosed = (resList.length > 0 && resList.every(res => res && res.status === "Đã xử lý")) || !!r.qcConfirmed;
                  const hasResolutions = resList.length > 0 || !!r.qcConfirmed;
                  const latestResolution = resList.length > 0 ? resList[resList.length - 1] : null;

                  return (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Cột 1: Mã & Thời gian */}
                      <td className="py-2.5 px-3 border border-slate-900 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-700">
                          {r.reportCode || r.id.substring(0, 8)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {r.timestamp || "dd/mm/yy"}
                        </div>
                      </td>

                      {/* Cột 2: Đơn vị & 4M1E1I */}
                      <td className="py-2.5 px-3 border border-slate-900 align-top">
                        <div className="font-bold text-slate-900 text-[11px]">
                          {r.factory}
                        </div>
                        <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded border border-slate-800 bg-slate-100 text-slate-800 text-[9.5px] font-semibold">
                          {getCategoryIcon(r.category)}
                          <span>{r.category}</span>
                        </div>
                      </td>

                      {/* Cột 3: Nội dung */}
                      <td className="py-2.5 px-3 border border-slate-900 align-top max-w-xs md:max-w-md">
                        <p className="text-slate-800 line-clamp-2 text-[11px] leading-relaxed">
                          {r.content}
                        </p>
                        <div className="text-[9.5px] text-slate-500 mt-1">
                          Người gửi: <span className="font-medium text-slate-800">{r.uploaderName}</span> ({r.uploaderDepartment})
                        </div>
                      </td>

                      {/* Cột 4: Phương án Cải tiến */}
                      <td className="py-2.5 px-3 border border-slate-900 align-top max-w-xs">
                        {latestResolution ? (
                          <div className="bg-emerald-50 p-2 rounded border border-emerald-800 text-[10.5px]">
                            <div className="font-bold text-emerald-900 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>{latestResolution.handlerName || latestResolution.departmentName || "Bộ phận xử lý"}:</span>
                            </div>
                            <p className="text-emerald-950 mt-0.5 line-clamp-2 italic text-[10px]">
                              "{latestResolution.resultText}"
                            </p>
                          </div>
                        ) : (
                          <div className="text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-800 text-[10px] font-medium inline-block">
                            Chờ đưa ra giải pháp
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Trạng thái & Tiến độ */}
                      <td className="py-2.5 px-3 border border-slate-900 align-top text-center whitespace-nowrap">
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-800 shadow-2xs">
                            <ShieldCheck className="w-3 h-3" />
                            ĐÃ NGHIỆM THU
                          </span>
                        ) : hasResolutions ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-blue-100 text-blue-800 border border-blue-800 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐÃ CÓ GIẢI PHÁP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black bg-amber-100 text-amber-800 border border-amber-800 shadow-2xs">
                            <Clock className="w-3 h-3" />
                            ĐANG CHỜ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
