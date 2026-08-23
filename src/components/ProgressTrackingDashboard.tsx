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
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  // Valid reports (not deleted)
  const activeReports = useMemo(() => {
    return reports.filter(r => !r.isDeleted);
  }, [reports]);

  // Extract unique branches with count
  const branchList = useMemo(() => {
    const map = new Map<string, number>();
    activeReports.forEach(r => {
      if (r.factory) {
        map.set(r.factory, (map.get(r.factory) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [activeReports]);

  // Filter reports based on active filters
  const filteredReports = useMemo(() => {
    return activeReports.filter((r) => {
      // Filter by branch
      if (selectedBranch !== "ALL" && r.factory !== selectedBranch) {
        return false;
      }

      // Filter by category 4M1E1I
      if (selectedCategory !== "ALL" && r.category !== selectedCategory) {
        return false;
      }

      // Filter by status
      const hasResolutions = (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed;
      const isClosed = r.qcConfirmed;
      
      if (selectedStatus === "RESOLVED" && !hasResolutions) return false;
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
    const abnormalReports = filteredReports.filter(r => r.isAbnormal || r.reportType === "KPH" || r.reportType === "RRO");
    const spotlightReports = filteredReports.filter(r => r.isSpotlight || r.reportType === "DSA");
    
    const resolvedCount = filteredReports.filter(r => (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed).length;
    const closedCount = filteredReports.filter(r => r.qcConfirmed).length;
    const pendingCount = total - resolvedCount;
    
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
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
    const closed = baseReports.filter(r => r.qcConfirmed).length;
    const resolved = baseReports.filter(r => (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed).length;
    const pending = total - resolved;

    return { total, closed, resolved, pending };
  }, [activeReports, selectedBranch, selectedCategory, searchTerm]);

  // Category counts based on current other filters (branch, status, search)
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    CATEGORIES.forEach(cat => map.set(cat, 0));

    activeReports.forEach((r) => {
      if (selectedBranch !== "ALL" && r.factory !== selectedBranch) return false;
      const hasResolutions = (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed;
      const isClosed = r.qcConfirmed;
      if (selectedStatus === "RESOLVED" && !hasResolutions) return;
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
        if (selectedBranch !== "ALL" && r.factory !== selectedBranch) return false;
        return r.category === cat;
      });
      const total = catReports.length;
      const resolved = catReports.filter(r => (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed).length;
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
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-sky-300" />
              <T><span translate="no" className="notranslate">GIÁM SÁT TIẾN ĐỘ CẢI TIẾN 4M1E1I & CAPA</span></T>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              <T><span translate="no" className="notranslate">BẢNG TIẾN ĐỘ CẢI TIẾN & KHẮC PHỤC CHẤT LƯỢNG</span></T>
            </h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-2xl font-normal leading-relaxed">
              <T><span translate="no" className="notranslate">Theo dõi tỷ lệ giải quyết bất thường, tiến độ đóng hành động khắc phục phòng ngừa và phân bổ giải pháp 4M1E1I theo thời gian thực.</span></T>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-center">
              <div className="text-xs text-blue-200 uppercase font-bold tracking-wider">
                <T><span translate="no" className="notranslate">TỶ LỆ CẢI TIẾN</span></T>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-300 mt-0.5">
                {metrics.resolutionRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className={`grid gap-3.5 ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
        {/* Card 1: Tổng phát sinh */}
        <div 
          onClick={() => setSelectedStatus("ALL")}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            selectedStatus === "ALL" ? "ring-2 ring-blue-500/40 border-blue-400 bg-blue-50/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">TỔNG BIẾN ĐỘNG / KPH</span></T>
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 mt-1">
              {metrics.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
              <span>Bất thường:</span>
              <span className="font-bold text-rose-600">{metrics.abnormalCount}</span>
              <span className="mx-1">•</span>
              <span>Điểm sáng:</span>
              <span className="font-bold text-emerald-600">{metrics.spotlightCount}</span>
            </div>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Đã có giải pháp cải tiến */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === "RESOLVED" ? "ALL" : "RESOLVED")}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            selectedStatus === "RESOLVED" ? "ring-2 ring-emerald-500/40 border-emerald-400 bg-emerald-50/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">ĐÃ CÓ GIẢI PHÁP / CẢI TIẾN</span></T>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
              {metrics.resolvedCount}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
              {metrics.resolutionRate}% tổng số vụ việc
            </div>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Đã đóng & Nghiệm thu */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === "CLOSED" ? "ALL" : "CLOSED")}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            selectedStatus === "CLOSED" ? "ring-2 ring-indigo-500/40 border-indigo-400 bg-indigo-50/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">ĐÃ NGHIỆM THU ĐẠT CHUẨN</span></T>
            </div>
            <div className="text-2xl font-black font-mono text-indigo-600 mt-1">
              {metrics.closedCount}
            </div>
            <div className="text-[11px] text-indigo-600 mt-1 font-semibold">
              {metrics.closedRate}% hoàn thành toàn diện
            </div>
          </div>
          <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Đang chờ xử lý / Cần hành động */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === "IN_PROGRESS" ? "ALL" : "IN_PROGRESS")}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-between ${
            selectedStatus === "IN_PROGRESS" ? "ring-2 ring-amber-500/40 border-amber-400 bg-amber-50/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">ĐANG CHỜ HÀNH ĐỘNG</span></T>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 mt-1">
              {metrics.pendingCount}
            </div>
            <div className="text-[11px] text-amber-600 mt-1 font-semibold">
              Cần thúc đẩy giải pháp khắc phục
            </div>
          </div>
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
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
          <span className="text-xs text-slate-500 font-medium">
            <T><span translate="no" className="notranslate">Bấm vào từng yếu tố để lọc nhanh</span></T>
          </span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Tất cả */}
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 opacity-80" />
                <T><span translate="no" className="notranslate">Tất cả trạng thái</span></T>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedStatus === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {statusCounts.total}
              </span>
            </button>

            {/* Đã có giải pháp */}
            <button
              type="button"
              onClick={() => setSelectedStatus("RESOLVED")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "RESOLVED"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 opacity-90" />
                <T><span translate="no" className="notranslate">Đã có giải pháp</span></T>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedStatus === "RESOLVED" ? "bg-white/25 text-white" : "bg-emerald-200/80 text-emerald-900"
              }`}>
                {statusCounts.resolved}
              </span>
            </button>

            {/* Đã nghiệm thu (Đóng) */}
            <button
              type="button"
              onClick={() => setSelectedStatus("CLOSED")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "CLOSED"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-indigo-50/60 text-indigo-800 border-indigo-200 hover:bg-indigo-100/80"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 opacity-90" />
                <T><span translate="no" className="notranslate">Đã nghiệm thu</span></T>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                selectedStatus === "CLOSED" ? "bg-white/25 text-white" : "bg-indigo-200/80 text-indigo-900"
              }`}>
                {statusCounts.closed}
              </span>
            </button>

            {/* Đang chờ xử lý */}
            <button
              type="button"
              onClick={() => setSelectedStatus("IN_PROGRESS")}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedStatus === "IN_PROGRESS"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100/80"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-90" />
                <T><span translate="no" className="notranslate">Đang chờ xử lý</span></T>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
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
          <div className="flex flex-wrap gap-2">
            {/* Tất cả 4M */}
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === "ALL"
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>🌐</span>
              <T><span translate="no" className="notranslate">Tất cả 6 yếu tố</span></T>
            </button>

            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat;
              const count = categoryCounts.get(cat) || 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? "ALL" : cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  {getCategoryIcon(cat, "w-3.5 h-3.5")}
                  <T><span translate="no" className="notranslate">{cat}</span></T>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              <T><span translate="no" className="notranslate">DANH SÁCH CHI TIẾT TIẾN TRÌNH CẢI TIẾN ({filteredReports.length})</span></T>
            </h4>
          </div>

          {/* Quick active tags */}
          {isFilterActive && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
              <span className="font-semibold">Đang lọc theo:</span>
              {selectedStatus !== "ALL" && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                  {selectedStatus === "RESOLVED" ? "Đã có giải pháp" : selectedStatus === "CLOSED" ? "Đã nghiệm thu" : "Đang chờ"}
                </span>
              )}
              {selectedCategory !== "ALL" && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                  {selectedCategory}
                </span>
              )}
              {selectedBranch !== "ALL" && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
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
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Mã / Ngày</th>
                  <th className="py-3 px-4">Đơn vị & Yếu tố</th>
                  <th className="py-3 px-4">Nội dung biến động / KPH</th>
                  <th className="py-3 px-4">Phương án Cải tiến / Xử lý</th>
                  <th className="py-3 px-4 text-center">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReports.slice(0, 50).map((r) => {
                  const hasResolutions = r.resolutions && r.resolutions.length > 0;
                  const isClosed = r.qcConfirmed;
                  const latestResolution = hasResolutions ? r.resolutions![r.resolutions!.length - 1] : null;

                  return (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Cột 1: Mã & Thời gian */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-600">
                          {r.reportCode || r.id.substring(0, 8)}
                        </div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          {r.timestamp || "dd/mm/yy"}
                        </div>
                      </td>

                      {/* Cột 2: Đơn vị & 4M1E1I */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-slate-800 text-[11.5px]">
                          {r.factory}
                        </div>
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {getCategoryIcon(r.category)}
                          <span>{r.category}</span>
                        </div>
                      </td>

                      {/* Cột 3: Nội dung */}
                      <td className="py-3 px-4 align-top max-w-xs md:max-w-md">
                        <p className="text-slate-700 line-clamp-2 text-[11.5px] leading-relaxed">
                          {r.content}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Người gửi: <span className="font-medium text-slate-600">{r.uploaderName}</span> ({r.uploaderDepartment})
                        </div>
                      </td>

                      {/* Cột 4: Phương án Cải tiến */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        {latestResolution ? (
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 text-[11px]">
                            <div className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{latestResolution.handlerName || latestResolution.departmentName || "Bộ phận xử lý"}:</span>
                            </div>
                            <p className="text-emerald-900 mt-0.5 line-clamp-2 italic text-[10.5px]">
                              "{latestResolution.resultText}"
                            </p>
                          </div>
                        ) : (
                          <div className="text-amber-600 bg-amber-50/60 px-2 py-1 rounded-md border border-amber-100 text-[10.5px] font-medium inline-block">
                            Chờ đưa ra giải pháp
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Trạng thái & Tiến độ */}
                      <td className="py-3 px-4 align-top text-center whitespace-nowrap">
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 shadow-2xs">
                            <ShieldCheck className="w-3 h-3" />
                            ĐÃ NGHIỆM THU
                          </span>
                        ) : hasResolutions ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3" />
                            ĐÃ CÓ GIẢI PHÁP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 shadow-2xs">
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
