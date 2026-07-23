import React, { useState, useMemo } from "react";
import { 
  Award, 
  Trophy, 
  Medal, 
  Users, 
  Building, 
  Calendar, 
  Filter, 
  Sparkles, 
  TrendingUp, 
  Search, 
  FileText, 
  CheckCircle2, 
  Star,
  ChevronDown,
  X,
  Check
} from "lucide-react";
import { QualityReport, User, Branch, Department, getBadgeScore } from "../types";
import { T } from "./TranslateText";
import { initialBranches } from "../data";
import { resolveBadgeGiverInfo } from "../utils/userResolver";

interface BadgeStatisticsDashboardProps {
  reports: QualityReport[];
  users: User[];
  branches?: Branch[];
  departments?: Department[];
  isMobile?: boolean;
}

export interface ExtractedBadgeItem {
  key: string;
  badgeId: string;
  badgeName: string;
  badgeCategory: "RED" | "GREEN" | string;
  giverId: string;
  giverName: string;
  giverRole: string;
  giverPosition: string;
  badgeTimestamp: string; // formatted dd/mm/yy or original
  dayStr: string; // dd/mm/yy
  monthStr: string; // MM/YYYY
  recipientName: string;
  recipientDepartment: string;
  recipientFactory: string;
  reportId: string;
  reportCode: string;
  resolutionId?: string;
  content: string;
  targetType: "Bản tin" | "Kết quả xử lý";
  points: number;
  reportType?: string;
}

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  title: string;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  title,
  placeholder = "Chọn..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 flex items-center justify-between outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer shadow-2xs group text-left"
      >
        <span className="flex items-center gap-2 truncate pr-2">
          {selectedOption?.icon && (
            <span className="text-base leading-none shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            <T><span translate="no" className="notranslate">{selectedOption?.label || placeholder}</span></T>
          </span>
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform duration-200" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <T><span translate="no" className="notranslate">{title}</span></T>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 overflow-y-auto space-y-1 divide-y divide-slate-50">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all font-bold text-xs text-left cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 shadow-2xs"
                        : "hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate pr-2">
                      {opt.icon && <span className="text-base leading-none shrink-0">{opt.icon}</span>}
                      <span className="truncate">
                        <T><span translate="no" className="notranslate">{opt.label}</span></T>
                      </span>
                    </span>

                    {isSelected && (
                      <span className="p-1 bg-indigo-600 text-white rounded-full shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function formatNameOrDepartment(str: string): string {
  if (!str) return "";
  return str
    .split(/(\s+|\(|\)|\/|-|\.)/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || /^[\(\)\/\-\.]+$/.test(part)) return part;
      // Preserve acronyms or codes like TPP, BNI, BBM, DNP, LAN, CTY, KPH, DSA...
      if (/^[a-zA-Z]{2,5}$/.test(part) && part === part.toUpperCase()) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join("");
}

// Helper Sub-component for Department Personnel Row
function DepartmentPersonnelRow({ person }: { 
  person: {
    recipientName: string;
    badgeCount: number;
    totalPoints: number;
    badgeItems: ExtractedBadgeItem[];
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 space-y-2">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-1.5 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 text-xs group-hover:text-amber-800 transition-colors">
            👤 <span translate="no" className="notranslate">{person.recipientName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-amber-800">
            <span translate="no" className="notranslate">{person.badgeCount}</span> huy hiệu
          </span>
          <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
            <span translate="no" className="notranslate">+{person.totalPoints}</span>đ
          </span>
          <button 
            type="button" 
            className="text-[10px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 px-2 py-0.5 rounded flex items-center gap-1 border-none cursor-pointer"
          >
            <span>{isExpanded ? "▲ Thu gọn" : "▼ Xem huy hiệu"}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {person.badgeItems.map((bItem, bIdx) => (
            <div key={bIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1 shadow-3xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-950 flex items-center gap-1">
                  🏅 <span translate="no" className="notranslate">{bItem.badgeName}</span>
                </span>
                <span className="font-bold text-emerald-700 text-[10px]">
                  +<span translate="no" className="notranslate">{bItem.points}</span>đ
                </span>
              </div>
              <p className="text-slate-600 font-medium line-clamp-2 italic text-[10.5px]">
                "<span translate="no">{bItem.content}</span>"
              </p>
              <div className="text-[9.5px] text-slate-500 flex items-center justify-between pt-0.5 border-t border-slate-100">
                <span>Trao bởi: <span className="font-bold text-slate-700" translate="no">{bItem.giverName}</span> (<span translate="no">{bItem.giverPosition}</span>)</span>
                <span translate="no">{bItem.badgeTimestamp}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper Sub-component for Department Card
function DepartmentCard({ dept }: { 
  dept: {
    factory: string;
    department: string;
    badgeCount: number;
    totalPoints: number;
    personnelList: Array<{
      recipientName: string;
      badgeCount: number;
      totalPoints: number;
      badgeItems: ExtractedBadgeItem[];
    }>;
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3">
      {/* Dept Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-150 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/80 font-black text-base group-hover:bg-amber-100 transition-colors">
            🏢
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2 group-hover:text-amber-800 transition-colors">
              <span translate="no" className="notranslate">{dept.department}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Chi nhánh / Nhà máy: <span translate="no" className="font-bold text-slate-700">{dept.factory}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-50 text-amber-900 font-black px-3 py-1 rounded-xl border border-amber-200">
            <span translate="no" className="notranslate">{dept.badgeCount}</span> huy hiệu
          </span>
          <span className="bg-emerald-50 text-emerald-800 font-black px-3 py-1 rounded-xl border border-emerald-200 text-sm">
            <span translate="no" className="notranslate">+{dept.totalPoints}</span> <span className="text-xs font-normal">điểm</span>
          </span>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center gap-1 font-extrabold text-xs border-none cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            <span className="hidden sm:inline">{isExpanded ? "Thu gọn" : "Xem chi tiết"}</span>
          </button>
        </div>
      </div>

      {/* Personnel List in Department */}
      {isExpanded ? (
        <div className="space-y-2.5 pt-1">
          <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>👥</span> <T><span translate="no" className="notranslate">DANH SÁCH NHÂN SỰ ĐƯỢC KHEN THƯỞNG IN BỘ PHẬN:</span></T>
          </p>

          <div className="space-y-2.5">
            {dept.personnelList.map((p, pIdx) => (
              <DepartmentPersonnelRow key={pIdx} person={p} />
            ))}
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between px-3 py-2 bg-amber-50/40 hover:bg-amber-50 rounded-xl border border-dashed border-amber-200/80 text-xs font-semibold text-amber-950 cursor-pointer transition-all"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            👥 <T>Danh sách nhân sự khen thưởng:</T> <strong>{dept.personnelList.length} nhân sự</strong>
          </span>
          <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
            <T>Bấm để mở danh sách</T> ▼
          </span>
        </div>
      )}
    </div>
  );
}

// Helper Sub-component for Manager Card
function ManagerCard({ mgr }: { 
  mgr: {
    giverName: string;
    giverPosition: string;
    giverId: string;
    badgeCount: number;
    totalConferredPoints: number;
    badgeItems: ExtractedBadgeItem[];
  };
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white p-4 sm:p-4.5 rounded-2xl border border-indigo-100 shadow-2xs hover:shadow-md transition-all space-y-3">
      {/* Manager Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-150 cursor-pointer select-none group"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200/80 font-black text-base group-hover:bg-indigo-100 transition-colors">
            🎖️
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2 group-hover:text-indigo-900 transition-colors">
              <span translate="no" className="notranslate">{mgr.giverName}</span>
            </h3>
            <p className="text-xs text-indigo-700 font-bold">
              Chức vụ / Vị trí: <span translate="no" className="notranslate">{mgr.giverPosition}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-indigo-50 text-indigo-900 font-black px-3 py-1 rounded-xl border border-indigo-200">
            <span translate="no" className="notranslate">{mgr.badgeCount}</span> lượt trao
          </span>
          <span className="bg-emerald-50 text-emerald-800 font-black px-3 py-1 rounded-xl border border-emerald-200 text-sm">
            <span translate="no" className="notranslate">+{mgr.totalConferredPoints}</span> <span className="text-xs font-normal">điểm trao</span>
          </span>
          <button
            type="button"
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all flex items-center gap-1 font-extrabold text-xs border-none cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            <span className="hidden sm:inline">{isExpanded ? "Thu gọn" : "Chi tiết"}</span>
          </button>
        </div>
      </div>

      {/* List of badges given by manager */}
      {isExpanded ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span> <T><span translate="no" className="notranslate">CHI TIẾT CÁC BẢN TIN & NHÂN SỰ ĐƯỢC TRAO HUY HIỆU:</span></T>
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer border-none bg-transparent"
            >
              ▲ Thu gọn
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {mgr.badgeItems.map((bItem, bIdx) => (
              <div key={bIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 shadow-3xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-950 flex items-center gap-1">
                    🏅 <span translate="no" className="notranslate">{bItem.badgeName}</span>
                  </span>
                  <span className="font-bold text-emerald-700 text-[11px] bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                    +<span translate="no" className="notranslate">{bItem.points}</span>đ
                  </span>
                </div>

                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                  <span>👤 Trao cho:</span>
                  <span className="text-indigo-900 font-extrabold" translate="no">{bItem.recipientName}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600 font-medium" translate="no">{bItem.recipientDepartment} ({bItem.recipientFactory})</span>
                </div>

                <p className="text-[11px] text-slate-700 font-medium leading-tight italic bg-white p-2 rounded-lg border border-slate-200/70 line-clamp-2">
                  "<span translate="no">{bItem.content}</span>"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-700 font-bold" translate="no">Mã: #{bItem.reportCode}</span>
                  <span translate="no">{bItem.badgeTimestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between px-3 py-2 bg-indigo-50/40 hover:bg-indigo-50 rounded-xl border border-dashed border-indigo-200/80 text-xs font-semibold text-indigo-900 cursor-pointer transition-all"
        >
          <span className="flex items-center gap-1.5 text-[11px]">
            📋 <T>Chi tiết các bản tin được trao:</T> <strong>{mgr.badgeItems.length} bản tin & huy hiệu</strong>
          </span>
          <span className="text-indigo-700 font-bold text-[11px] flex items-center gap-1">
            <T>Bấm để xem danh sách</T> ▼
          </span>
        </div>
      )}
    </div>
  );
}

export default function BadgeStatisticsDashboard({
  reports = [],
  users = [],
  branches = initialBranches,
  departments = [],
  isMobile = false
}: BadgeStatisticsDashboardProps) {
  // Current date parts for default filter
  const todayParts = useMemo(() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const yy = String(yyyy).slice(-2);
    return {
      dayStr: `${d}/${m}/${yy}`,
      monthStr: `${m}/${yyyy}`,
      dateInputDefault: `${yyyy}-${m}-${d}`
    };
  }, []);

  // Filter States
  const [filterMode, setFilterMode] = useState<"MONTH" | "DAY">("MONTH");
  const [selectedMonth, setSelectedMonth] = useState<string>(todayParts.monthStr);
  const [selectedDate, setSelectedDate] = useState<string>(todayParts.dateInputDefault); // YYYY-MM-DD
  const [selectedBranch, setSelectedBranch] = useState<string>("TẤT CẢ");
  const [selectedBadgeType, setSelectedBadgeType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"LEADERBOARD" | "LIST">("LEADERBOARD");
  const [listSubTab, setListSubTab] = useState<"REPORTS" | "DEPARTMENTS" | "MANAGERS">("REPORTS");

  // Helper: Format YYYY-MM-DD into dd/mm/yy
  const selectedDateFormatted = useMemo(() => {
    if (!selectedDate) return todayParts.dayStr;
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      const yyyy = parts[0];
      const m = parts[1];
      const d = parts[2];
      return `${d}/${m}/${yyyy.slice(-2)}`;
    }
    return todayParts.dayStr;
  }, [selectedDate, todayParts.dayStr]);

  // Extract all badges across all reports & resolutions
  const allExtractedBadges = useMemo(() => {
    const list: ExtractedBadgeItem[] = [];

    reports.forEach((report) => {
      const reportFactory = report.factory || "Khác";
      const reportDept = formatNameOrDepartment(report.uploaderDepartment || "Khác");
      const reportUploader = formatNameOrDepartment(report.uploaderName || "Ẩn danh");

      // 1. Report level badges
      if (report.badges && Array.isArray(report.badges)) {
        report.badges.forEach((b, idx) => {
          const resolvedGiver = resolveBadgeGiverInfo(users, b);
          const pos = resolvedGiver.position || b.giverPosition || "Quản lý";
          let pts = getBadgeScore(pos);
          if (pts <= 0) pts = 30; // Default standard score per badge

          // Parse badge date
          let day = todayParts.dayStr;
          let month = todayParts.monthStr;

          if (b.timestamp) {
            // Check if dd/mm/yy or dd/mm/yyyy or ISO
            const rawTs = b.timestamp.trim();
            if (rawTs.includes("/")) {
              const segs = rawTs.split("/");
              if (segs.length === 3) {
                const d = segs[0].padStart(2, "0");
                const m = segs[1].padStart(2, "0");
                let y = segs[2];
                if (y.length === 2) y = "20" + y;
                day = `${d}/${m}/${y.slice(-2)}`;
                month = `${m}/${y}`;
              }
            } else if (rawTs.includes("-")) {
              const segs = rawTs.split("T")[0].split("-");
              if (segs.length === 3) {
                const y = segs[0];
                const m = segs[1].padStart(2, "0");
                const d = segs[2].padStart(2, "0");
                day = `${d}/${m}/${y.slice(-2)}`;
                month = `${m}/${y}`;
              }
            }
          }

          list.push({
            key: `report_${report.id}_badge_${idx}_${b.id}`,
            badgeId: b.id,
            badgeName: b.name,
            badgeCategory: b.category || "GREEN",
            giverId: resolvedGiver.id,
            giverName: formatNameOrDepartment(resolvedGiver.fullName),
            giverRole: resolvedGiver.role,
            giverPosition: pos,
            badgeTimestamp: b.timestamp || day,
            dayStr: day,
            monthStr: month,
            recipientName: reportUploader,
            recipientDepartment: reportDept,
            recipientFactory: reportFactory,
            reportId: report.id,
            reportCode: report.reportCode || report.id,
            content: report.content || "",
            targetType: "Bản tin",
            points: pts,
            reportType: report.category || report.reportType
          });
        });
      }

      // 2. Resolution level badges
      if (report.resolutions && Array.isArray(report.resolutions)) {
        report.resolutions.forEach((res, resIdx) => {
          if (res.badges && Array.isArray(res.badges)) {
            res.badges.forEach((b, bIdx) => {
              const resolvedGiver = resolveBadgeGiverInfo(users, b);
              const pos = resolvedGiver.position || b.giverPosition || "Quản lý";
              let pts = getBadgeScore(pos);
              if (pts <= 0) pts = 30;

              let day = todayParts.dayStr;
              let month = todayParts.monthStr;

              if (b.timestamp) {
                const rawTs = b.timestamp.trim();
                if (rawTs.includes("/")) {
                  const segs = rawTs.split("/");
                  if (segs.length === 3) {
                    const d = segs[0].padStart(2, "0");
                    const m = segs[1].padStart(2, "0");
                    let y = segs[2];
                    if (y.length === 2) y = "20" + y;
                    day = `${d}/${m}/${y.slice(-2)}`;
                    month = `${m}/${y}`;
                  }
                } else if (rawTs.includes("-")) {
                  const segs = rawTs.split("T")[0].split("-");
                  if (segs.length === 3) {
                    const y = segs[0];
                    const m = segs[1].padStart(2, "0");
                    const d = segs[2].padStart(2, "0");
                    day = `${d}/${m}/${y.slice(-2)}`;
                    month = `${m}/${y}`;
                  }
                }
              }

              list.push({
                key: `res_${res.id}_badge_${bIdx}_${b.id}`,
                badgeId: b.id,
                badgeName: b.name,
                badgeCategory: b.category || "GREEN",
                giverId: resolvedGiver.id,
                giverName: formatNameOrDepartment(resolvedGiver.fullName),
                giverRole: resolvedGiver.role,
                giverPosition: pos,
                badgeTimestamp: b.timestamp || day,
                dayStr: day,
                monthStr: month,
                recipientName: formatNameOrDepartment(res.handlerName || reportUploader),
                recipientDepartment: formatNameOrDepartment(res.departmentName || reportDept),
                recipientFactory: reportFactory,
                reportId: report.id,
                reportCode: report.reportCode || report.id,
                resolutionId: res.id,
                content: res.resultText || report.content || "",
                targetType: "Kết quả xử lý",
                points: pts,
                reportType: "Kết quả xử lý"
              });
            });
          }
        });
      }
    });

    return list;
  }, [reports, users, todayParts]);

  // Dynamic month list (filtering out empty months before 06/2026)
  const monthOptions = useMemo(() => {
    const set = new Set<string>();

    allExtractedBadges.forEach((b) => {
      if (b.monthStr) {
        set.add(b.monthStr);
      }
    });

    reports.forEach((r) => {
      if (r.timestamp) {
        const parts = r.timestamp.trim().split("/");
        if (parts.length >= 2) {
          const m = parts[1].padStart(2, "0");
          let yStr = parts[2] ? parts[2].split(" ")[0] : "";
          if (yStr) {
            let y = parseInt(yStr, 10);
            if (y < 100) y += 2000;
            if (!isNaN(y)) {
              set.add(`${m}/${y}`);
            }
          }
        }
      }
    });

    // Always include current month and 06/2026
    const now = new Date();
    const curM = String(now.getMonth() + 1).padStart(2, "0");
    const curY = now.getFullYear();
    set.add(`${curM}/${curY}`);
    set.add("06/2026");

    // Filter out months before 06/2026
    const list = Array.from(set).filter((my) => {
      const [mStr, yStr] = my.split("/");
      const m = parseInt(mStr, 10);
      const y = parseInt(yStr, 10);
      if (y < 2026 || (y === 2026 && m < 6)) {
        return false;
      }
      return true;
    });

    // Sort descending
    list.sort((a, b) => {
      const [mA, yA] = a.split("/").map(Number);
      const [mB, yB] = b.split("/").map(Number);
      if (yA !== yB) return yB - yA;
      return mB - mA;
    });

    return list;
  }, [allExtractedBadges, reports]);

  // Options for CustomSelect components
  const monthSelectOptions = useMemo<CustomSelectOption[]>(() => {
    return [
      { value: "ALL", label: "Tất cả các tháng", icon: "🗓️" },
      ...monthOptions.map((m) => ({
        value: m,
        label: `Tháng ${m}`,
        icon: "📅",
      })),
    ];
  }, [monthOptions]);

  const branchSelectOptions = useMemo<CustomSelectOption[]>(() => {
    return [
      { value: "TẤT CẢ", label: "Tất cả chi nhánh", icon: "🏢" },
      ...branches.map((b) => ({
        value: b.name,
        label: b.name,
        icon: "🏭",
      })),
    ];
  }, [branches]);

  const badgeTypeSelectOptions = useMemo<CustomSelectOption[]>(() => {
    return [
      { value: "ALL", label: "Tất cả loại huy hiệu", icon: "🏅" },
      { value: "RED", label: "Huy hiệu Đỏ (KPH)", icon: "🔴" },
      { value: "GREEN", label: "Huy hiệu Xanh (Điểm Sáng DSA)", icon: "🟢" },
      { value: "RESOLUTION", label: "Huy hiệu Kết Quả Xử Lý", icon: "⚙️" },
    ];
  }, []);

  // Filtered Badge Items based on UI state
  const filteredBadges = useMemo(() => {
    return allExtractedBadges.filter((item) => {
      // Date/Month Filter
      if (filterMode === "DAY") {
        if (item.dayStr !== selectedDateFormatted) return false;
      } else {
        if (selectedMonth !== "ALL" && item.monthStr !== selectedMonth) return false;
      }

      // Branch Filter
      if (selectedBranch !== "TẤT CẢ") {
        const itemFactory = item.recipientFactory.toLowerCase();
        const branchClean = selectedBranch.toLowerCase();
        if (!itemFactory.includes(branchClean) && !branchClean.includes(itemFactory)) {
          return false;
        }
      }

      // Badge Category Filter
      if (selectedBadgeType === "RED" && item.badgeCategory !== "RED") return false;
      if (selectedBadgeType === "GREEN" && item.badgeCategory !== "GREEN") return false;
      if (selectedBadgeType === "RESOLUTION" && item.targetType !== "Kết quả xử lý") return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = item.recipientName.toLowerCase().includes(term);
        const matchDept = item.recipientDepartment.toLowerCase().includes(term);
        const matchGiver = item.giverName.toLowerCase().includes(term);
        const matchBadge = item.badgeName.toLowerCase().includes(term);
        const matchContent = item.content.toLowerCase().includes(term);
        const matchId = item.reportId.toLowerCase().includes(term) || item.reportCode.toLowerCase().includes(term);
        if (!matchName && !matchDept && !matchGiver && !matchBadge && !matchContent && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [allExtractedBadges, filterMode, selectedDateFormatted, selectedMonth, selectedBranch, selectedBadgeType, searchTerm]);

  // Key KPI Aggregation
  const kpiStats = useMemo(() => {
    const totalCount = filteredBadges.length;
    const totalPts = filteredBadges.reduce((sum, b) => sum + b.points, 0);

    const distinctReports = new Set(filteredBadges.map((b) => b.reportId)).size;
    const distinctGivers = new Set(filteredBadges.map((b) => b.giverName)).size;

    return {
      totalCount,
      totalPts,
      distinctReports,
      distinctGivers
    };
  }, [filteredBadges]);

  // Leaderboard Aggregations
  // 1. Top Recipients (Cá nhân)
  const topRecipients = useMemo(() => {
    const map = new Map<string, {
      recipientName: string;
      recipientDepartment: string;
      recipientFactory: string;
      badgeCount: number;
      totalPoints: number;
      badges: string[];
    }>();

    filteredBadges.forEach((b) => {
      const key = b.recipientName.trim().toLowerCase();
      const existing = map.get(key) || {
        recipientName: b.recipientName,
        recipientDepartment: b.recipientDepartment,
        recipientFactory: b.recipientFactory,
        badgeCount: 0,
        totalPoints: 0,
        badges: []
      };

      existing.badgeCount += 1;
      existing.totalPoints += b.points;
      if (!existing.badges.includes(b.badgeName)) {
        existing.badges.push(b.badgeName);
      }

      if (b.recipientDepartment && (!existing.recipientDepartment || b.recipientDepartment.length > existing.recipientDepartment.length)) {
        existing.recipientDepartment = b.recipientDepartment;
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints || b.badgeCount - a.badgeCount);
  }, [filteredBadges]);

  // 2. Top Departments (Bộ phận/Nhà máy)
  const topDepartments = useMemo(() => {
    const map = new Map<string, {
      factory: string;
      department: string;
      badgeCount: number;
      totalPoints: number;
    }>();

    filteredBadges.forEach((b) => {
      const key = `${b.recipientFactory} - ${b.recipientDepartment}`;
      const existing = map.get(key) || {
        factory: b.recipientFactory,
        department: b.recipientDepartment,
        badgeCount: 0,
        totalPoints: 0
      };

      existing.badgeCount += 1;
      existing.totalPoints += b.points;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints || b.badgeCount - a.badgeCount);
  }, [filteredBadges]);

  // 3. Top Givers (Lãnh đạo/Quản lý trao huy hiệu)
  const topGivers = useMemo(() => {
    const map = new Map<string, {
      giverName: string;
      giverPosition: string;
      badgeCount: number;
      totalConferredPoints: number;
    }>();

    filteredBadges.forEach((b) => {
      // Group by giverName (or giverId) so same leader is not duplicated if position text varies
      const key = (b.giverId && b.giverId !== "unknown" && b.giverId !== "")
        ? `id_${b.giverId}`
        : `name_${b.giverName.trim().toLowerCase()}`;

      const existing = map.get(key) || {
        giverName: b.giverName,
        giverPosition: formatNameOrDepartment(b.giverPosition || "Quản lý"),
        badgeCount: 0,
        totalConferredPoints: 0
      };

      existing.badgeCount += 1;
      existing.totalConferredPoints += b.points;

      // Keep the most descriptive/specific position title
      const formattedPos = formatNameOrDepartment(b.giverPosition || "");
      if (formattedPos && (!existing.giverPosition || formattedPos.length > existing.giverPosition.length)) {
        existing.giverPosition = formattedPos;
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.badgeCount - a.badgeCount || b.totalConferredPoints - a.totalConferredPoints);
  }, [filteredBadges]);

  // Grouped Reports for Detailed List
  const groupedReportList = useMemo(() => {
    const map = new Map<string, {
      reportId: string;
      reportCode: string;
      recipientName: string;
      recipientDepartment: string;
      recipientFactory: string;
      targetType: string;
      content: string;
      badges: ExtractedBadgeItem[];
      totalReportPoints: number;
    }>();

    filteredBadges.forEach((b) => {
      const itemKey = b.resolutionId ? `res_${b.resolutionId}` : `rep_${b.reportId}`;
      const existing = map.get(itemKey) || {
        reportId: b.reportId,
        reportCode: b.reportCode || b.reportId,
        recipientName: b.recipientName,
        recipientDepartment: b.recipientDepartment,
        recipientFactory: b.recipientFactory,
        targetType: b.targetType,
        content: b.content,
        badges: [],
        totalReportPoints: 0
      };

      existing.badges.push(b);
      existing.totalReportPoints += b.points;
      map.set(itemKey, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalReportPoints - a.totalReportPoints);
  }, [filteredBadges]);

  // Detailed Department List for Sub-tab 🏢 BỘ PHẬN
  const detailedDepartmentList = useMemo(() => {
    const map = new Map<string, {
      factory: string;
      department: string;
      badgeCount: number;
      totalPoints: number;
      personnelMap: Map<string, {
        recipientName: string;
        badgeCount: number;
        totalPoints: number;
        badgeItems: ExtractedBadgeItem[];
      }>;
    }>();

    filteredBadges.forEach((b) => {
      const deptKey = `${b.recipientFactory} - ${b.recipientDepartment}`;
      const existingDept = map.get(deptKey) || {
        factory: b.recipientFactory,
        department: b.recipientDepartment,
        badgeCount: 0,
        totalPoints: 0,
        personnelMap: new Map()
      };

      existingDept.badgeCount += 1;
      existingDept.totalPoints += b.points;

      const personKey = b.recipientName.trim().toLowerCase();
      const existingPerson = existingDept.personnelMap.get(personKey) || {
        recipientName: b.recipientName,
        badgeCount: 0,
        totalPoints: 0,
        badgeItems: []
      };

      existingPerson.badgeCount += 1;
      existingPerson.totalPoints += b.points;
      existingPerson.badgeItems.push(b);

      existingDept.personnelMap.set(personKey, existingPerson);
      map.set(deptKey, existingDept);
    });

    return Array.from(map.values())
      .map((dept) => ({
        ...dept,
        personnelList: Array.from(dept.personnelMap.values()).sort(
          (a, b) => b.totalPoints - a.totalPoints || b.badgeCount - a.badgeCount
        )
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints || b.badgeCount - a.badgeCount);
  }, [filteredBadges]);

  // Detailed Manager List for Sub-tab 🎖️ QUẢN LÝ
  const detailedManagerList = useMemo(() => {
    const map = new Map<string, {
      giverName: string;
      giverPosition: string;
      giverId: string;
      badgeCount: number;
      totalConferredPoints: number;
      badgeItems: ExtractedBadgeItem[];
    }>();

    filteredBadges.forEach((b) => {
      const key = (b.giverId && b.giverId !== "unknown" && b.giverId !== "")
        ? `id_${b.giverId}`
        : `name_${b.giverName.trim().toLowerCase()}`;

      const existing = map.get(key) || {
        giverName: b.giverName,
        giverPosition: formatNameOrDepartment(b.giverPosition || "Quản lý"),
        giverId: b.giverId,
        badgeCount: 0,
        totalConferredPoints: 0,
        badgeItems: []
      };

      existing.badgeCount += 1;
      existing.totalConferredPoints += b.points;
      existing.badgeItems.push(b);

      const formattedPos = formatNameOrDepartment(b.giverPosition || "");
      if (formattedPos && (!existing.giverPosition || formattedPos.length > existing.giverPosition.length)) {
        existing.giverPosition = formattedPos;
      }

      map.set(key, existing);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.badgeCount - a.badgeCount || b.totalConferredPoints - a.totalConferredPoints
    );
  }, [filteredBadges]);

  return (
    <div className="w-full bg-slate-50 min-h-[500px] p-3 md:p-6 rounded-2xl text-slate-800 space-y-6 border border-slate-200/80 shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-5 rounded-2xl shadow-lg border border-indigo-900/40">
        <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-hidden">
          <div className="p-2 sm:p-3 bg-amber-500/20 rounded-xl border border-amber-400/30 text-amber-300 shadow-inner shrink-0">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-base md:text-xl font-black tracking-tight uppercase text-white whitespace-nowrap overflow-hidden text-ellipsis">
              <T><span translate="no" className="notranslate">THỐNG KÊ TRAO HUY HIỆU & VINH DANH</span></T>
            </h2>
            <p className="text-[10px] sm:text-xs text-indigo-200/80 mt-0.5 leading-tight truncate">
              <T><span translate="no" className="notranslate">Tuyên dương cá nhân, tập thể và các sáng kiến, giải pháp xuất sắc</span></T>
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center w-full md:w-auto bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`flex-1 md:flex-initial px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "LEADERBOARD"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5 shrink-0" />
            <T><span translate="no" className="notranslate">BẢNG XẾP HẠNG</span></T>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LIST")}
            className={`flex-1 md:flex-initial px-2 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
              activeTab === "LIST"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <T><span translate="no" className="notranslate">DANH SÁCH CHI TIẾT</span></T>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-indigo-600" />
          <T><span translate="no" className="notranslate">BỘ LỌC THỐNG KÊ TRAO HUY HIỆU</span></T>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Filter Mode: Ngày / Tháng */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              <T><span translate="no" className="notranslate">Chế độ lọc thời gian</span></T>
            </label>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterMode("MONTH")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  filterMode === "MONTH"
                    ? "bg-indigo-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <T><span translate="no" className="notranslate">Theo Tháng</span></T>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("DAY")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  filterMode === "DAY"
                    ? "bg-indigo-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <T><span translate="no" className="notranslate">Theo Ngày</span></T>
              </button>
            </div>
          </div>

          {/* 2. Specific Date or Month Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              {filterMode === "MONTH" ? (
                <T><span translate="no" className="notranslate">Chọn Tháng (MM/YYYY)</span></T>
              ) : (
                <T><span translate="no" className="notranslate">Chọn Ngày (dd/mm/yy)</span></T>
              )}
            </label>

            {filterMode === "MONTH" ? (
              <CustomSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={monthSelectOptions}
                title="Chọn Tháng Báo Cáo"
              />
            ) : (
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                />
                <span className="ml-2 text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 shrink-0">
                  <span translate="no" className="notranslate">{selectedDateFormatted}</span>
                </span>
              </div>
            )}
          </div>

          {/* 3. Branch / Factory Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              <T><span translate="no" className="notranslate">Nhà máy / Chi nhánh</span></T>
            </label>
            <CustomSelect
              value={selectedBranch}
              onChange={setSelectedBranch}
              options={branchSelectOptions}
              title="Chọn Chi Nhánh / Nhà Máy"
            />
          </div>

          {/* 4. Badge Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase">
              <T><span translate="no" className="notranslate">Loại Huy Hiệu</span></T>
            </label>
            <CustomSelect
              value={selectedBadgeType}
              onChange={setSelectedBadgeType}
              options={badgeTypeSelectOptions}
              title="Chọn Loại Huy Hiệu"
            />
          </div>
        </div>

        {/* Search input */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên nhân viên, phòng ban, tên huy hiệu, nội dung bản tin..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* OVERVIEW KEY METRICS (KPI CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Badges */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/50 p-2.5 sm:p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] sm:text-[11px] font-extrabold text-amber-800 uppercase tracking-tight leading-tight">
              <T><span translate="no" className="notranslate">Huy Hiệu Đã Trao</span></T>
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-amber-900 mt-1">
              <span translate="no" className="notranslate">{kpiStats.totalCount}</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-amber-700/80 mt-0.5 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Lượt vinh danh</span></T>
            </p>
          </div>
          <div className="p-1.5 sm:p-2 bg-amber-500/20 text-amber-700 rounded-lg sm:rounded-xl border border-amber-300 shrink-0">
            <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Card 2: Total Points */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-100/50 p-2.5 sm:p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] sm:text-[11px] font-extrabold text-emerald-800 uppercase tracking-tight leading-tight">
              <T><span translate="no" className="notranslate">Tổng Điểm Tích Lũy</span></T>
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-emerald-900 mt-1">
              <span translate="no" className="notranslate">+{kpiStats.totalPts}</span> <span className="text-[10px] sm:text-xs font-bold text-emerald-700">điểm</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-emerald-700/80 mt-0.5 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Cộng dồn thi đua</span></T>
            </p>
          </div>
          <div className="p-1.5 sm:p-2 bg-emerald-500/20 text-emerald-700 rounded-lg sm:rounded-xl border border-emerald-300 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Card 3: Reports Awarded */}
        <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100/50 p-2.5 sm:p-4 rounded-2xl border border-indigo-200/80 shadow-xs flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] sm:text-[11px] font-extrabold text-indigo-800 uppercase tracking-tight leading-tight">
              <T><span translate="no" className="notranslate">Bản Tin & Kết Quả</span></T>
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-indigo-900 mt-1">
              <span translate="no" className="notranslate">{kpiStats.distinctReports}</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-indigo-700/80 mt-0.5 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Mục được tuyên dương</span></T>
            </p>
          </div>
          <div className="p-1.5 sm:p-2 bg-indigo-500/20 text-indigo-700 rounded-lg sm:rounded-xl border border-indigo-300 shrink-0">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Card 4: Active Managers */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-purple-100/50 p-2.5 sm:p-4 rounded-2xl border border-purple-200/80 shadow-xs flex items-center justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] sm:text-[11px] font-extrabold text-purple-800 uppercase tracking-tight leading-tight">
              <T><span translate="no" className="notranslate">Lãnh Đạo Đã Trao</span></T>
            </p>
            <h3 className="text-lg sm:text-2xl font-black text-purple-900 mt-1">
              <span translate="no" className="notranslate">{kpiStats.distinctGivers}</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-purple-700/80 mt-0.5 font-medium leading-tight">
              <T><span translate="no" className="notranslate">Cấp quản lý tham gia</span></T>
            </p>
          </div>
          <div className="p-1.5 sm:p-2 bg-purple-500/20 text-purple-700 rounded-lg sm:rounded-xl border border-purple-300 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: LEADERBOARD */}
      {activeTab === "LEADERBOARD" && (
        <div className="space-y-6">
          {/* Top Individuals Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3.5 sm:px-5 py-2.5 sm:py-3 font-extrabold text-[11.5px] sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-slate-900 shrink-0" />
                <span className="whitespace-nowrap truncate font-black">
                  <T><span translate="no" className="notranslate">TOP CÁ NHÂN VINH DANH</span></T>
                </span>
              </div>
              <span className="text-[10px] sm:text-xs bg-slate-950/10 px-2 sm:px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap shrink-0">
                <span translate="no" className="notranslate">{topRecipients.length}</span> <T><span translate="no" className="notranslate">Cá nhân</span></T>
              </span>
            </div>

            {topRecipients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                <T><span translate="no" className="notranslate">Không tìm thấy dữ liệu trao huy hiệu nào phù hợp với bộ lọc hiện tại.</span></T>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200">
                      <th className="py-2.5 pl-2 sm:pl-4 pr-1 text-center font-black text-[10px] sm:text-xs uppercase tracking-tight w-8 sm:w-12 leading-tight">
                        <T><span translate="no" className="notranslate">HẠNG</span></T>
                      </th>
                      <th className="py-2.5 px-2 sm:px-3 font-black text-[10px] sm:text-xs uppercase tracking-tight leading-tight">
                        <T><span translate="no" className="notranslate">HỌ VÀ TÊN</span></T>
                      </th>
                      <th className="py-2.5 px-2 sm:px-3 font-black text-[10px] sm:text-xs uppercase tracking-tight leading-tight">
                        <T><span translate="no" className="notranslate">BỘ PHẬN</span></T>
                      </th>
                      <th className="py-2.5 px-1.5 sm:px-3 text-center font-black text-[10px] sm:text-xs uppercase tracking-tight leading-tight w-16 sm:w-24">
                        <T><span translate="no" className="notranslate">HUY HIỆU</span></T>
                      </th>
                      <th className="py-2.5 pl-2 pr-4 sm:pr-6 text-right font-black text-[10px] sm:text-xs uppercase tracking-tight leading-tight w-24 sm:w-36">
                        <T><span translate="no" className="notranslate">TỔNG ĐIỂM</span></T>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topRecipients.map((item, idx) => {
                      const rank = idx + 1;
                      const rankBadge = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
                      const isTop3 = rank <= 3;

                      return (
                        <tr 
                          key={idx} 
                          className={`hover:bg-amber-50/40 transition-colors ${
                            isTop3 ? "bg-amber-50/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-2.5 pl-2 sm:pl-4 pr-1 text-center font-black text-xs sm:text-sm whitespace-nowrap">
                            <span translate="no" className="notranslate">{rankBadge}</span>
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 font-bold text-slate-900 text-[11px] sm:text-xs leading-tight">
                            <span translate="no" className="notranslate">{item.recipientName}</span>
                          </td>
                          <td className="py-2.5 px-2 sm:px-3 text-slate-700 font-medium text-[10.5px] sm:text-xs leading-tight">
                            <span translate="no" className="notranslate">{item.recipientDepartment}</span>
                          </td>
                          <td className="py-2.5 px-1.5 sm:px-3 text-center font-black text-amber-700 text-xs sm:text-sm whitespace-nowrap">
                            <span translate="no" className="notranslate">{item.badgeCount}</span> 🏅
                          </td>
                          <td className="py-2.5 pl-2 pr-4 sm:pr-6 text-right font-black text-emerald-700 text-xs sm:text-sm whitespace-nowrap">
                            <span translate="no" className="notranslate">+{item.totalPoints}</span><span className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 ml-0.5">đ</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grid 2 Columns: Top Departments & Top Givers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Departments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-800 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Building className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap truncate">
                    <T><span translate="no" className="notranslate">TOP BỘ PHẬN & TẬP THỂ XUẤT SẮC</span></T>
                  </span>
                </div>
              </div>

              {topDepartments.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs italic">
                  <T><span translate="no" className="notranslate">Chưa có dữ liệu.</span></T>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topDepartments.slice(0, 10).map((dept, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center border border-slate-200">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">
                            <span translate="no" className="notranslate">{dept.department}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            <span translate="no" className="notranslate">{dept.factory}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-700 text-xs">
                          <span translate="no" className="notranslate">+{dept.totalPoints}</span> <span className="text-[10px] font-normal">đ</span>
                        </p>
                        <p className="text-[10px] text-amber-700 font-bold">
                          <span translate="no" className="notranslate">{dept.badgeCount}</span> huy hiệu
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Givers (Active Managers) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-indigo-900 text-white px-3.5 sm:px-4 py-2.5 sm:py-3 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Star className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap truncate">
                    <T><span translate="no" className="notranslate">TOP BAN LÃNH ĐẠO TRAO HUY HIỆU</span></T>
                  </span>
                </div>
              </div>

              {topGivers.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs italic">
                  <T><span translate="no" className="notranslate">Chưa có dữ liệu.</span></T>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {topGivers.slice(0, 10).map((giver, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-800 font-black text-[11px] flex items-center justify-center border border-indigo-200">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">
                            <span translate="no" className="notranslate">{giver.giverName}</span>
                          </p>
                          <p className="text-[10px] text-indigo-700 font-medium">
                            <span translate="no" className="notranslate">{giver.giverPosition}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-700 text-xs">
                          <span translate="no" className="notranslate">{giver.badgeCount}</span> <span className="text-[10px] font-normal">lượt trao</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Tổng điểm confer: <span translate="no" className="notranslate">+{giver.totalConferredPoints}</span>đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DETAILED ITEM LIST */}
      {activeTab === "LIST" && (
        <div className="space-y-4">
          {/* Sub-tabs for DANH SÁCH CHI TIẾT */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setListSubTab("REPORTS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none ${
                listSubTab === "REPORTS"
                  ? "bg-white text-indigo-950 shadow-sm border border-slate-200 scale-[1.01]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <span>📄</span>
              <span translate="no" className="notranslate"><T>BẢN TIN ({groupedReportList.length})</T></span>
            </button>

            <button
              type="button"
              onClick={() => setListSubTab("DEPARTMENTS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none ${
                listSubTab === "DEPARTMENTS"
                  ? "bg-white text-indigo-950 shadow-sm border border-slate-200 scale-[1.01]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <span>🏢</span>
              <span translate="no" className="notranslate"><T>BỘ PHẬN ({detailedDepartmentList.length})</T></span>
            </button>

            <button
              type="button"
              onClick={() => setListSubTab("MANAGERS")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-none ${
                listSubTab === "MANAGERS"
                  ? "bg-white text-indigo-950 shadow-sm border border-slate-200 scale-[1.01]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <span>🎖️</span>
              <span translate="no" className="notranslate"><T>QUẢN LÝ ({detailedManagerList.length})</T></span>
            </button>
          </div>

          {/* SUB-VIEW 1: BẢN TIN (Default) */}
          {listSubTab === "REPORTS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <span>
                  <T><span translate="no" className="notranslate">DANH SÁCH BẢN TIN & KẾT QUẢ ĐƯỢC TRAO HUY HIỆU</span></T>
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 font-extrabold">
                  <span translate="no" className="notranslate">{groupedReportList.length}</span> <T><span translate="no" className="notranslate">mục được vinh danh</span></T>
                </span>
              </div>

              {groupedReportList.length === 0 ? (
                <div className="bg-white p-12 text-center text-slate-500 text-xs italic rounded-2xl border border-slate-200">
                  <T><span translate="no" className="notranslate">Không tìm thấy bản tin/kết quả nào được trao huy hiệu phù hợp với điều kiện tìm kiếm.</span></T>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {groupedReportList.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3"
                    >
                      {/* Top Bar of item card */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                            <span translate="no" className="notranslate">ID: {item.reportCode}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.targetType === "Kết quả xử lý"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            <T><span translate="no" className="notranslate">{item.targetType}</span></T>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <span translate="no" className="notranslate">+{item.totalReportPoints}</span> <span className="text-[10px] font-normal">điểm thưởng</span>
                          </span>
                        </div>
                      </div>

                      {/* Recipient info & Content */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-extrabold text-slate-900">
                            👤 <span translate="no" className="notranslate">{item.recipientName}</span>
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-700 font-medium">
                            <span translate="no" className="notranslate">{item.recipientDepartment}</span>
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10.5px]">
                            🏢 <span translate="no" className="notranslate">{item.recipientFactory}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-800 font-black leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                          <T><span translate="no" className="notranslate">"{(item.content || "").toUpperCase()}"</span></T>
                        </div>
                      </div>

                      {/* Badges List on this item */}
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-2">
                          <T><span translate="no" className="notranslate">HUY HIỆU ĐƯỢC TRAO TẶNG:</span></T>
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {item.badges.map((b, bIdx) => (
                            <div 
                              key={bIdx}
                              className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-xl p-2 text-xs flex items-center gap-2 shadow-2xs"
                            >
                              <span className="text-base">🏅</span>
                              <div>
                                <p className="font-black text-amber-950 text-[11px]">
                                  <T><span translate="no" className="notranslate">{b.badgeName}</span></T>
                                  <span className="ml-1 text-emerald-700 text-[10px] font-bold">
                                    (+<span translate="no" className="notranslate">{b.points}</span>đ)
                                  </span>
                                </p>
                                <p className="text-[9.5px] text-slate-600 font-medium">
                                  Trao bởi: <span className="font-bold text-slate-800" translate="no">{b.giverName}</span> (<span translate="no">{b.giverPosition}</span>) • <span translate="no">{b.badgeTimestamp}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: BỘ PHẬN */}
          {listSubTab === "DEPARTMENTS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <span>
                  <T><span translate="no" className="notranslate">DANH SÁCH BỘ PHẬN ĐƯỢC KHEN THƯỞNG HUY HIỆU</span></T>
                </span>
                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 font-extrabold">
                  <span translate="no" className="notranslate">{detailedDepartmentList.length}</span> <T><span translate="no" className="notranslate">bộ phận</span></T>
                </span>
              </div>

              {detailedDepartmentList.length === 0 ? (
                <div className="bg-white p-12 text-center text-slate-500 text-xs italic rounded-2xl border border-slate-200">
                  <T><span translate="no" className="notranslate">Chưa có dữ liệu bộ phận nào được trao huy hiệu phù hợp với điều kiện tìm kiếm.</span></T>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {detailedDepartmentList.map((dept, idx) => (
                    <DepartmentCard key={idx} dept={dept} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 3: QUẢN LÝ */}
          {listSubTab === "MANAGERS" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <span>
                  <T><span translate="no" className="notranslate">DANH SÁCH CẤP QUẢN LÝ TRAO HUY HIỆU</span></T>
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 font-extrabold">
                  <span translate="no" className="notranslate">{detailedManagerList.length}</span> <T><span translate="no" className="notranslate">quản lý đã khen thưởng</span></T>
                </span>
              </div>

              {detailedManagerList.length === 0 ? (
                <div className="bg-white p-12 text-center text-slate-500 text-xs italic rounded-2xl border border-slate-200">
                  <T><span translate="no" className="notranslate">Chưa có dữ liệu cấp quản lý trao huy hiệu phù hợp với điều kiện tìm kiếm.</span></T>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {detailedManagerList.map((mgr, idx) => (
                    <ManagerCard key={idx} mgr={mgr} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
