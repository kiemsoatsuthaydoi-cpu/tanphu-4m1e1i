import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { Search, RotateCw, RotateCcw, Plus, Users, Cpu, FileText, Settings, Heart, BellOff, Bell, Info, ArrowLeft, Camera, Trash2, Edit, Maximize, Minimize, ArrowUp, Share2, Copy, ExternalLink, MessageSquare, Check, X, LogOut, Monitor, BarChart2, Lock, ZoomIn, ZoomOut, Archive, QrCode, Download, Home, ClipboardCheck, Shield, Smartphone, AlertTriangle, CheckSquare, CheckCircle, Cloud } from "lucide-react";
import { QualityReport, Category4M1E1I, User, UserRole, UserStatus, Branch, Company, ChatMessage, QualityReportResolution, QualityReportReplication } from "../types";
import { T } from "./TranslateText";
import { MentionTextArea, MentionInput } from "./MentionTextArea";
import { QRCodeSVG } from "qrcode.react";
import { isSameBranchOrFactory } from "../utils/branchHelpers";
import { AutoImageSlider } from "./AutoImageSlider";
import FirebaseQuotaMonitor from "./FirebaseQuotaMonitor";

function convertModernColorsToRgb(cssValue: string): string {
  if (!cssValue || typeof cssValue !== "string") return cssValue;
  if (!cssValue.includes("oklch") && !cssValue.includes("oklab")) return cssValue;

  let result = cssValue;

  // Convert oklch colors
  if (result.includes("oklch")) {
    result = result.replace(/oklch\(([^)]+)\)/g, (match, content) => {
      try {
        const parts = content.trim().split(/[\s/]+/).filter(Boolean);
        if (parts.length < 3) return "rgba(0,0,0,0)";

        const L = parseFloat(parts[0]);
        const C = parseFloat(parts[1]);
        const H = parseFloat(parts[2]);
        let alpha = 1;
        if (parts.length >= 4) {
          const aPart = parts[3];
          if (aPart.endsWith("%")) {
            alpha = parseFloat(aPart) / 100;
          } else {
            alpha = parseFloat(aPart);
          }
        }

        if (isNaN(L) || isNaN(C) || isNaN(H)) return "rgba(0,0,0,0)";

        const rad = (H * Math.PI) / 180;
        const a = C * Math.cos(rad);
        const b = C * Math.sin(rad);

        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const L_linear = Math.pow(Math.max(0, l_), 3);
        const M_linear = Math.pow(Math.max(0, m_), 3);
        const S_linear = Math.pow(Math.max(0, s_), 3);

        const r = +4.0767416621 * L_linear - 3.3077115913 * M_linear + 0.2309699292 * S_linear;
        const g = -1.2684380046 * L_linear + 2.6097574011 * M_linear - 0.3413193965 * S_linear;
        const b_color = -0.0041960863 * L_linear - 0.7034186147 * M_linear + 1.7076147010 * S_linear;

        const gamma = (c: number) => {
          return c <= 0.0031308
            ? 12.92 * c
            : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        };

        const R = Math.round(Math.min(255, Math.max(0, gamma(r) * 255)));
        const G = Math.round(Math.min(255, Math.max(0, gamma(g) * 255)));
        const B = Math.round(Math.min(255, Math.max(0, gamma(b_color) * 255)));

        if (alpha === 1) {
          return `rgb(${R}, ${G}, ${B})`;
        } else {
          return `rgba(${R}, ${G}, ${B}, ${alpha})`;
        }
      } catch (e) {
        return "rgba(0,0,0,0)";
      }
    });
  }

  // Convert oklab colors
  if (result.includes("oklab")) {
    result = result.replace(/oklab\(([^)]+)\)/g, (match, content) => {
      try {
        const parts = content.trim().split(/[\s/]+/).filter(Boolean);
        if (parts.length < 3) return "rgba(0,0,0,0)";

        const L = parseFloat(parts[0]);
        const a = parseFloat(parts[1]);
        const b = parseFloat(parts[2]);
        let alpha = 1;
        if (parts.length >= 4) {
          const aPart = parts[3];
          if (aPart.endsWith("%")) {
            alpha = parseFloat(aPart) / 100;
          } else {
            alpha = parseFloat(aPart);
          }
        }

        if (isNaN(L) || isNaN(a) || isNaN(b)) return "rgba(0,0,0,0)";

        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const L_linear = Math.pow(Math.max(0, l_), 3);
        const M_linear = Math.pow(Math.max(0, m_), 3);
        const S_linear = Math.pow(Math.max(0, s_), 3);

        const r = +4.0767416621 * L_linear - 3.3077115913 * M_linear + 0.2309699292 * S_linear;
        const g = -1.2684380046 * L_linear + 2.6097574011 * M_linear - 0.3413193965 * S_linear;
        const b_color = -0.0041960863 * L_linear - 0.7034186147 * M_linear + 1.7076147010 * S_linear;

        const gamma = (c: number) => {
          return c <= 0.0031308
            ? 12.92 * c
            : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        };

        const R = Math.round(Math.min(255, Math.max(0, gamma(r) * 255)));
        const G = Math.round(Math.min(255, Math.max(0, gamma(g) * 255)));
        const B = Math.round(Math.min(255, Math.max(0, gamma(b_color) * 255)));

        if (alpha === 1) {
          return `rgb(${R}, ${G}, ${B})`;
        } else {
          return `rgba(${R}, ${G}, ${B}, ${alpha})`;
        }
      } catch (e) {
        return "rgba(0,0,0,0)";
      }
    });
  }

  return result;
}

interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "new_report" | "new_directive" | "update_report";
  targetReportId: string;
  authorName: string;
  factoryName: string;
}

interface MobileFrameProps {
  reports: QualityReport[];
  currentUserId: string;
  onOpenReportForm: () => void;
  onDeleteReport: (id: string, forcePermanent?: boolean) => void;
  onEditReport: (report: QualityReport) => void;
  offlineMode: boolean;
  currentUser?: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  mobileUIConfig?: {
    displayRule?: "clean" | "full" | "custom";
    columns?: number;
    padding?: "compact" | "normal" | "spacious";
    colorTheme?: "blue" | "indigo" | "emerald" | "amber" | "rose" | "slate";
    fontSize?: "xs" | "sm" | "base";
    customAliases?: Record<string, string>;
  };
  onUpdateMobileUIConfig?: (config: any) => void;
  onLogout?: () => void;
  branches?: Branch[];
  onManualRefresh?: (isManual?: boolean) => void;
  users?: User[];
  companies?: Company[];
  onSwitchToDesktop?: () => void;
  chats?: ChatMessage[];
  onAddChatMessage?: (msg: string, reportRefId?: string) => void;
  onUpdateUserStatus?: (id: string, status: UserStatus) => void;
  onUpdateUserRole?: (id: string, role: UserRole) => void;
  isNativeScrollActive?: boolean;
  setIsNativeScrollActive?: (active: boolean, filteredReports?: any[]) => void;
}

function formatTimestampToDMY(tsStr: string): string {
  if (!tsStr) return "";
  try {
    const dates = tsStr.split(" ");
    if (dates.length === 2) {
      const datePart = dates[0].replace(/\/20(\d{2})/, "/$1");
      const timeParts = dates[1].split(":");
      const timePart = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : dates[1];
      return `${timePart} ${datePart}`;
    }
    let cleaned = tsStr.replace(/\/20(\d{2})/, "/$1");
    cleaned = cleaned.replace(/:(\d{2}):(\d{2})/, ":$1");
    return cleaned;
  } catch (error) {
    return tsStr;
  }
}

function MobileDirectiveForm({
  report,
  currentUser,
  users,
  onUpdateReport,
  showToast
}: {
  report: QualityReport;
  currentUser: User | null | undefined;
  users?: User[];
  onUpdateReport?: (report: QualityReport) => void;
  showToast: (msg: string) => void;
}) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = text.trim();
    if (!val) return;

    const dateObj = new Date();
    const currentSingaporeTime = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() + 420) * 60000);
    const yy = String(currentSingaporeTime.getFullYear()).slice(-2);
    const mm = String(currentSingaporeTime.getMonth() + 1).padStart(2, '0');
    const dd = String(currentSingaporeTime.getDate()).padStart(2, '0');
    const timeStr = currentSingaporeTime.toTimeString().split(' ')[0];
    const stamp = `${timeStr} ${dd}/${mm}/${yy}`;

    const newDir = {
      id: Math.random().toString(36).substr(2, 9),
      text: val,
      author: currentUser?.fullName || "Cấp quản lý",
      timestamp: stamp
    };

    const updatedReport = {
      ...report,
      directives: [...(report.directives || []), newDir]
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }
    setText("");
    showToast("Ghi nhận chỉ đạo điều hành thành công! 📑");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="flex-1 flex items-center">
        <MentionTextArea
          users={users}
          value={text}
          onChange={setText}
          placeholder="Chỉ đạo"
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
          className="block w-full bg-slate-50 border border-slate-200 text-[11px] rounded-lg px-2.5 py-1.5 text-slate-800 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all select-text overflow-y-auto thin-scrollbar leading-normal"
        />
      </div>
      <button
        type="submit"
        className="bg-amber-500 hover:bg-amber-600 px-4 text-[10px] text-white font-black flex items-center justify-center rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer uppercase shrink-0 h-[32px]"
      >
        <T>GỬI</T>
      </button>
    </form>
  );
}

interface MobileApprovalViewProps {
  users?: User[];
  currentUser?: User | null;
  theme: {
    bg: string;
    text: string;
    border: string;
    ring: string;
    hoverBg: string;
    lightBg: string;
    lightText: string;
  };
  onUpdateUserStatus?: (id: string, status: UserStatus) => void;
  onUpdateUserRole?: (id: string, role: UserRole) => void;
  showToast: (msg: string) => void;
}

function MobileApprovalView({
  users = [],
  currentUser,
  theme,
  onUpdateUserStatus,
  onUpdateUserRole,
  showToast
}: MobileApprovalViewProps) {
  const [innerSearch, setInnerSearch] = useState("");
  const [subTab, setSubTab] = useState<"CHO_DUYET" | "TAT_CA">("CHO_DUYET");
  const [roleFilter, setRoleFilter] = useState<string>("TẤT CẢ");
  const [statusFilter, setStatusFilter] = useState<string>("TẤT CẢ");

  const isReviewer = currentUser?.role === UserRole.REVIEWER;
  const matchBranch = (uBranch: string) => {
    if (!currentUser) return true;
    return isSameBranchOrFactory(currentUser.branch, uBranch);
  };

  const pendingUsers = users.filter((u) => {
    if (isReviewer && !matchBranch(u.branch)) return false;
    return u.status === UserStatus.PENDING;
  });
  
  const displayedUsers = users
    .filter((u) => {
      if (isReviewer && !matchBranch(u.branch)) return false;
      
      const s = innerSearch.toLowerCase();
      const matchesSearch =
        u.fullName.toLowerCase().includes(s) ||
        u.phone.includes(s) ||
        u.department.toLowerCase().includes(s) ||
        u.branch.toLowerCase().includes(s);

      if (!matchesSearch) return false;

      if (subTab === "CHO_DUYET") {
        return u.status === UserStatus.PENDING;
      }

      if (roleFilter !== "TẤT CẢ" && u.role !== roleFilter) return false;
      if (statusFilter !== "TẤT CẢ" && u.status !== statusFilter) return false;

      return true;
    })
    .sort((a, b) => {
      const now = Date.now();
      const getUserSortRank = (u: any) => {
        if (u.role === UserRole.ADMIN) return 1;
        if (u.status === UserStatus.PENDING) return 2;
        
        const isOnline = u.isOnline || 
          (currentUser && u.id === currentUser.id) || 
          (u.status === UserStatus.ACTIVE && u.lastActive && Math.abs(now - u.lastActive) <= 240000);
        if (isOnline) return 3;
        
        if (u.role === UserRole.REVIEWER) return 4;
        return 5;
      };
      
      const rA = getUserSortRank(a);
      const rB = getUserSortRank(b);
      if (rA !== rB) return rA - rB;
      return a.fullName.localeCompare(b.fullName, "vi");
    });

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 relative select-none">
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl text-white ${theme.bg} flex items-center justify-center`}>
            <ClipboardCheck className="w-4 h-4 text-white" />
          </div>
          <h2 className={`text-xs font-black tracking-tight uppercase ${theme.text}`}>
            <span translate="no" className="notranslate"><T>PHÊ DUYỆT TÀI KHOẢN</T></span>
          </h2>
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          <span translate="no" className="notranslate"><T>Xem xét phê duyệt các tài khoản đăng ký mới, quản lý trạng thái kích hoạt, phân quyền thành viên trong toàn bộ hệ thống vận hành.</T></span>
        </p>
      </div>

      {/* Sub-tabs switch */}
      <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-xl shadow-inner">
        <button
          type="button"
          onClick={() => setSubTab("CHO_DUYET")}
          className={`py-1.5 text-[10.5px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
            subTab === "CHO_DUYET"
              ? "bg-white text-slate-800 shadow"
              : "text-slate-550 hover:bg-slate-300/45 bg-transparent"
          }`}
        >
          <span translate="no" className="notranslate"><T>Yêu Cầu Chờ Duyệt</T></span>
          {pendingUsers.length > 0 && (
            <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[14px]">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab("TAT_CA")}
          className={`py-1.5 text-[10.5px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none bg-transparent ${
            subTab === "TAT_CA"
              ? "bg-white text-slate-800 shadow"
              : "text-slate-550 hover:bg-slate-300/45"
          }`}
        >
          <span translate="no" className="notranslate"><T>Tất Cả Thành Viên</T></span>
          <span className="bg-slate-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[14px]">
            {users.length}
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-3xs space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={innerSearch}
            onChange={(e) => setInnerSearch(e.target.value)}
            placeholder="Tìm theo tên, sđt, phòng ban..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        {subTab === "TAT_CA" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">
                <span translate="no" className="notranslate"><T>Trạng Thái:</T></span>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
              >
                <option value="TẤT CẢ" translate="no" className="notranslate">Tất cả Trạng thái</option>
                <option value={UserStatus.ACTIVE} translate="no" className="notranslate">{UserStatus.ACTIVE}</option>
                <option value={UserStatus.PENDING} translate="no" className="notranslate">{UserStatus.PENDING}</option>
                <option value={UserStatus.LOCKED} translate="no" className="notranslate">{UserStatus.LOCKED}</option>
                <option value={UserStatus.REJECTED} translate="no" className="notranslate">{UserStatus.REJECTED}</option>
              </select>
            </div>

            <div className="space-y-0.5">
              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">
                <span translate="no" className="notranslate"><T>Vai Trò:</T></span>
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
              >
                <option value="TẤT CẢ" translate="no" className="notranslate">Tất cả Vai trò</option>
                <option value={UserRole.ADMIN} translate="no" className="notranslate">{UserRole.ADMIN}</option>
                <option value={UserRole.REVIEWER} translate="no" className="notranslate">{UserRole.REVIEWER}</option>
                <option value={UserRole.STAFF} translate="no" className="notranslate">{UserRole.STAFF}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Member Cards list */}
      <div className="space-y-2">
        {displayedUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-10 px-5 text-center flex flex-col items-center justify-center">
            <span className="text-2xl mb-1">👥</span>
            <p className="text-[10px] text-slate-400 font-bold select-none">
              <span translate="no" className="notranslate"><T>Không tìm thấy thành viên nào khớp bộ lọc.</T></span>
            </p>
          </div>
        ) : (
          displayedUsers.map((u) => {
            const isMe = currentUser?.id === u.id;
            
            let avatarBg = "bg-slate-200 text-slate-600";
            if (u.status === UserStatus.ACTIVE) {
              if (u.role === UserRole.ADMIN) avatarBg = "bg-amber-100 text-amber-700 border border-amber-300";
              else if (u.role === UserRole.REVIEWER) avatarBg = "bg-emerald-100 text-emerald-700 border border-emerald-300";
              else avatarBg = "bg-indigo-100 text-indigo-700 border border-indigo-200";
            } else if (u.status === UserStatus.PENDING) {
              avatarBg = "bg-rose-100 text-rose-700 border border-rose-350 animate-pulse";
            } else if (u.status === UserStatus.LOCKED) {
              avatarBg = "bg-gray-205 text-gray-500 border border-gray-300";
            }

            return (
              <div
                key={u.id}
                className={`bg-white rounded-xl border p-3 shadow-6xs flex flex-col gap-2 transition-all ${
                  u.status === UserStatus.PENDING ? "border-l-4 border-l-rose-500" : "border-slate-200"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 uppercase select-none ${avatarBg}`}>
                    {u.fullName.substring(0, 1) || "U"}
                  </div>
                  <div className="flex-1 min-w-0 font-sans text-left">
                    <div className="flex items-center gap-1.5">
                      <span translate="no" className="notranslate font-black text-slate-800 text-[11px] block truncate leading-tight">
                        {u.fullName}
                      </span>
                      {isMe && (
                        <span className="text-[7px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded-md font-bold uppercase select-none">
                          <span translate="no" className="notranslate"><T>Tôi</T></span>
                        </span>
                      )}
                    </div>
                    <span translate="no" className="notranslate text-[8.5px] text-slate-400 font-bold block mt-0.5">
                      {u.phone} • {u.department} ({u.branch})
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[7.5px] font-black rounded-md px-1.5 py-0.5 leading-none shrink-0 border border-transparent ${
                      u.role === UserRole.ADMIN
                        ? "bg-amber-600 text-white"
                        : u.role === UserRole.REVIEWER
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 text-white"
                    }`}>
                      <span translate="no" className="notranslate">{u.role}</span>
                    </span>

                    <span className={`text-[7.5px] font-black rounded-md px-1.5 py-0.5 leading-none shrink-0 ${
                      u.status === UserStatus.ACTIVE
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : u.status === UserStatus.PENDING
                        ? "bg-rose-50 text-rose-600 border border-rose-250 animate-pulse"
                        : u.status === UserStatus.LOCKED
                        ? "bg-orange-50 text-orange-600 border border-orange-200"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      <span translate="no" className="notranslate">{u.status}</span>
                    </span>
                  </div>
                </div>

                {!isMe && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-0.5">
                    {u.status === UserStatus.PENDING ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateUserStatus) {
                              onUpdateUserStatus(u.id, UserStatus.ACTIVE);
                              showToast(`Đã phê duyệt hoạt động cho ${u.fullName}! 🎉`);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5 pointer-events-none" />
                          <span translate="no" className="notranslate"><T>PHÊ DUYỆT</T></span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateUserStatus) {
                              onUpdateUserStatus(u.id, UserStatus.REJECTED);
                              showToast(`Đã từ chối tài khoản ${u.fullName}! ❌`);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-250 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5 pointer-events-none" />
                          <span translate="no" className="notranslate"><T>TỪ CHỐI</T></span>
                        </button>
                      </>
                    ) : (
                      <>
                        {u.status === UserStatus.ACTIVE ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateUserStatus) {
                                onUpdateUserStatus(u.id, UserStatus.LOCKED);
                                showToast(`Đã khóa tài khoản ${u.fullName}! 🔒`);
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1 text-[8.5px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            <Lock className="w-3 h-3 pointer-events-none" />
                            <span translate="no" className="notranslate"><T>Khóa Tài Khoản</T></span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateUserStatus) {
                                onUpdateUserStatus(u.id, UserStatus.ACTIVE);
                                showToast(`Đã kích hoạt lại tài khoản ${u.fullName}! ✅`);
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-1 text-[8.5px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            <Check className="w-3 h-3 pointer-events-none" />
                            <span translate="no" className="notranslate"><T>Kích Hoạt Lại</T></span>
                          </button>
                        )}

                        <div className="flex-1 flex items-center gap-1 pl-1 bg-slate-50 border border-slate-200 rounded-lg px-2 cursor-pointer relative justify-between">
                          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0 select-none pointer-events-none" />
                          <select
                            value={u.role}
                            onChange={(e) => {
                              if (onUpdateUserRole) {
                                onUpdateUserRole(u.id, e.target.value as UserRole);
                                showToast(`Đã cập nhật vai trò ${e.target.value} cho ${u.fullName}! 🛡️`);
                              }
                            }}
                            className="w-full bg-transparent border-none py-1.5 focus:outline-none text-[8.5px] font-extrabold text-slate-700 cursor-pointer text-center outline-none shrink-0"
                          >
                            <option value={UserRole.ADMIN} translate="no" className="notranslate">{UserRole.ADMIN}</option>
                            <option value={UserRole.REVIEWER} translate="no" className="notranslate">{UserRole.REVIEWER}</option>
                            <option value={UserRole.STAFF} translate="no" className="notranslate">{UserRole.STAFF}</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[localStorage] Failed to save key "${key}" in MobileFrame. Quota exceeded:`, error);
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[localStorage] Failed to read key "${key}" in MobileFrame:`, error);
    return null;
  }
};

export default function MobileFrame({
  reports,
  currentUserId,
  onOpenReportForm,
  onDeleteReport,
  onEditReport,
  offlineMode,
  currentUser,
  onUpdateReport,
  mobileUIConfig,
  onUpdateMobileUIConfig,
  onLogout,
  branches,
  onManualRefresh,
  users,
  companies,
  onSwitchToDesktop,
  chats,
  onAddChatMessage,
  onUpdateUserStatus,
  onUpdateUserRole,
  isNativeScrollActive,
  setIsNativeScrollActive
}: MobileFrameProps) {
  const isRealMobile = typeof window !== "undefined" && (
    window.innerWidth < 1024 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  const config = mobileUIConfig || {};
  const displayRule = config.displayRule || "clean";
  const customAliases = config.customAliases || {};

  const getThemeClasses = (themeId: string | undefined) => {
    switch (themeId) {
      case "indigo":
        return {
          bg: "bg-[#4f46e5]",
          text: "text-[#4f46e5]",
          border: "border-[#4f46e5]",
          ring: "ring-indigo-150",
          hoverBg: "hover:bg-[#4338ca] bg-[#4f46e5]",
          lightBg: "bg-[#f5f3ff]",
          lightText: "text-[#312e81]"
        };
      case "emerald":
        return {
          bg: "bg-[#0d9488]",
          text: "text-[#0d9488]",
          border: "border-[#0d9488]",
          ring: "ring-emerald-150",
          hoverBg: "hover:bg-[#0f766e] bg-[#0d9488]",
          lightBg: "bg-[#f0fdf4]",
          lightText: "text-[#064e3b]"
        };
      case "amber":
        return {
          bg: "bg-[#f59e0b]",
          text: "text-[#f59e0b]",
          border: "border-[#f59e0b]",
          ring: "ring-amber-150",
          hoverBg: "hover:bg-[#d97706] bg-[#f59e0b]",
          lightBg: "bg-[#fffbeb]",
          lightText: "text-[#78350f]"
        };
      case "rose":
        return {
          bg: "bg-[#e11d48]",
          text: "text-[#e11d48]",
          border: "border-[#e11d48]",
          ring: "ring-rose-150",
          hoverBg: "hover:bg-[#be123c] bg-[#e11d48]",
          lightBg: "bg-[#fff1f2]",
          lightText: "text-[#4c0519]"
        };
      case "slate":
        return {
          bg: "bg-[#475569]",
          text: "text-[#475569]",
          border: "border-[#475569]",
          ring: "ring-slate-150",
          hoverBg: "hover:bg-[#334155] bg-[#475569]",
          lightBg: "bg-[#f8fafc]",
          lightText: "text-[#0f172a]"
        };
      case "blue":
      default:
        return {
          bg: "bg-[#1e3a8a]",
          text: "text-[#1e3a8a]",
          border: "border-[#1e3a8a]",
          ring: "ring-blue-150",
          hoverBg: "hover:bg-[#1a306c] bg-[#1e3a8a]",
          lightBg: "bg-[#f0f9ff]",
          lightText: "text-[#1e3a5f]"
        };
    }
  };

  const getFontSizeClass = (size: string | undefined) => {
    switch (size) {
      case "sm": return "text-xs";
      case "base": return "text-sm";
      case "xs":
      default:
        return "text-[10px]";
    }
  };

  const getContentFontSizeClass = (size: string | undefined) => {
    switch (size) {
      case "sm": return "text-xs";
      case "base": return "text-sm";
      case "xs":
      default:
        return "text-[11px]";
    }
  };

  const theme = getThemeClasses(config.colorTheme);
  const fontSizeClass = getFontSizeClass(config.fontSize);
  const contentFontSizeClass = getContentFontSizeClass(config.fontSize);

  const getFactoryDisplayName = (factoryName: string | undefined | null) => {
    if (!factoryName || typeof factoryName !== "string") return "";

    // Find the matching branch
    const foundBranch = branches?.find((b) => {
      const bName = b.name || "";
      const bId = b.id || "";
      const fNameLower = factoryName.toLowerCase();
      const bNameClean = bName.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
      const fNameClean = factoryName.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
      return (
        bName.toLowerCase() === fNameLower ||
        bId.toLowerCase() === fNameLower ||
        fNameLower.includes(bId.toLowerCase()) ||
        bNameClean === fNameClean
      );
    });

    if (foundBranch) {
      return foundBranch.name;
    }
    return factoryName;
  };

  // Tính số lượng người online thực tế kết hợp giả lập thành viên hoạt động
  const getOnlineUsers = () => {
    if (!users || users.length === 0) {
      return [];
    }
    const now = Date.now();
    return users.map((u, idx) => {
      // Chỉ những tài khoản hoạt động mới được hiển thị trực tuyến
      if (u.status !== UserStatus.ACTIVE) {
        return { ...u, isOnlineSimulated: false, lastActiveTime: u.lastActive };
      }

      // Current logged in user is always online
      if (currentUser && u.id === currentUser.id) {
        return { ...u, isOnlineSimulated: true, lastActiveTime: now };
      }
      
      // Determine if they are active from actual Firebase Heartbeat
      const isHeartbeatOnline = u.lastActive && Math.abs(now - u.lastActive) <= 240000;
      if (isHeartbeatOnline) {
        // Last active is between 1 and 3 minutes ago
        return { ...u, isOnlineSimulated: true, lastActiveTime: u.lastActive };
      }

      return { ...u, isOnlineSimulated: false, lastActiveTime: u.lastActive };
    });
  };

  const getOnlineCount = () => {
    return getOnlineUsers().filter(u => u.isOnlineSimulated).length;
  };

  const onlineCount = getOnlineCount();

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const handleRequestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast("Trình duyệt không hỗ trợ thông báo đẩy!");
      return;
    }

    try {
      let permission: NotificationPermission;
      // Some mobile browsers (older iOS/Chrome) do not return a Promise from requestPermission
      // but only accept a callback, or throw an exception in iframe environments.
      const requestResult = Notification.requestPermission();
      if (requestResult && typeof requestResult.then === "function") {
        permission = await requestResult;
      } else {
        permission = await new Promise<NotificationPermission>((resolve) => {
          Notification.requestPermission((res) => {
            resolve(res);
          });
        });
      }

      setNotificationPermission(permission);
      if (permission === 'granted') {
        showToast("Đã kích hoạt quyền thông báo thành công! 🎉");
        try {
          if ("setAppBadge" in navigator) {
            const p = navigator.setAppBadge(1);
            if (p && typeof p.catch === "function") {
              p.catch(() => {});
            }
          }
        } catch (badgeErr) {
          console.warn("Lỗi đặt App Badge khi kích hoạt:", badgeErr);
        }
      } else if (permission === 'denied') {
        showToast("Quyền thông báo bị từ chối. Hãy bật lại trong cài đặt thiết bị!");
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      showToast("Không thể yêu cầu quyền thông báo do giới hạn bảo mật!");
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showQrCodeView, setShowQrCodeView] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [openChatReportId, setOpenChatReportId] = useState<string | null>(null);

  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      if (!openChatReportId) return;
      const target = e.target as HTMLElement;
      if (target.closest(`.chat-box-${openChatReportId}`) || target.closest(`.chat-btn-${openChatReportId}`)) {
        return;
      }
      setOpenChatReportId(null);
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [openChatReportId]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFactoryFilter, setSelectedFactoryFilter] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<"BAO_CAO" | "PHAN_TICH" | "PHE_DUYET">("BAO_CAO");
  const [mobileFeedSubTab, setMobileFeedSubTab] = useState<"FEED" | "PROPOSAL">("FEED");
  const [showTrash, setShowTrash] = useState(false);
  const [mobileBranchFilter, setMobileBranchFilter] = useState<string>("Tất cả");
  const [mobileTimeFilter, setMobileTimeFilter] = useState<"NGAY" | "TUAN" | "THANG">("THANG");

  const filterByTimeRange = (reportDate: Date) => {
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - reportDate.getTime());
    if (mobileTimeFilter === "NGAY") {
      return diffMs <= 24 * 60 * 60 * 1000;
    } else if (mobileTimeFilter === "TUAN") {
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    } else {
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    }
  };

  const getMobileStats = () => {
    const filtered = reports.filter((r) => {
      if (r.isDeleted) return false;
      const matchesBranch = mobileBranchFilter === "Tất cả" || matchSelectedFactory(r.factory, mobileBranchFilter);
      const rDate = parseReportTimestamp(r.timestamp);
      const matchesTime = filterByTimeRange(rDate);
      return matchesBranch && matchesTime;
    });

    const total = filtered.length;
    const kph = filtered.filter((r) => r.reportType === "KPH" || r.isAbnormal).length;
    const dsa = filtered.filter((r) => r.reportType === "DSA" || r.isSpotlight).length;
    const safeRate = total > 0 ? Math.round(((total - kph) / total) * 100) : 100;

    const counts: Record<Category4M1E1I, number> = {
      "CON NGƯỜI": 0,
      "NGUYÊN VẬT LIỆU": 0,
      "MÁY MÓC": 0,
      "PHƯƠNG PHÁP": 0,
      "MÔI TRƯỜNG": 0,
      "THÔNG TIN": 0
    };
    filtered.forEach((r) => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    });

    return { total, kph, dsa, safeRate, counts, filteredReports: filtered };
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileCloudQuota, setShowMobileCloudQuota] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isNativeScrollMode, setIsNativeScrollMode] = useState(false);
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);

  useEffect(() => {
    if (isNativeScrollMode) {
      document.body.classList.add("native-scroll-active");
      document.documentElement.classList.add("native-scroll-active");
      
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyHeight = document.body.style.height;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlHeight = document.documentElement.style.height;

      document.body.style.setProperty("overflow", "visible", "important");
      document.body.style.setProperty("height", "auto", "important");
      document.documentElement.style.setProperty("overflow", "visible", "important");
      document.documentElement.style.setProperty("height", "auto", "important");

      const parent = document.getElementById("mobile-viewport")?.parentElement;
      if (parent) {
        parent.style.setProperty("overflow", "visible", "important");
        parent.style.setProperty("height", "auto", "important");
        parent.style.setProperty("display", "block", "important");
      }

      showToast("Đã bật chế độ Cuộn Hệ Thống! Bạn có thể Chụp cuộn bằng điện thoại của mình ngay bây giờ. 📱📸");

      return () => {
        document.body.classList.remove("native-scroll-active");
        document.documentElement.classList.remove("native-scroll-active");
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.height = originalBodyHeight;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.style.height = originalHtmlHeight;
        if (parent) {
          parent.style.overflow = "";
          parent.style.height = "";
          parent.style.display = "";
        }
      };
    }
  }, [isNativeScrollMode]);
  const [editingDirectiveId, setEditingDirectiveId] = useState<string | null>(null);
  const [editingDirectiveText, setEditingDirectiveText] = useState("");
  const [showLikesListReport, setShowLikesListReport] = useState<QualityReport | null>(null);
  const lastScrollTopRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchTimeRef = useRef(0);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setSelectedCategory(null);
    setSearchTerm("");
    setSelectedFactoryFilter(null);
    
    try {
      if (onManualRefresh) {
        await onManualRefresh(true);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800);
    }
  };

  // Notification states
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showOnlineUsersDrawer, setShowOnlineUsersDrawer] = useState(false);
  const [onlineSearchTerm, setOnlineSearchTerm] = useState("");
  const [onlineTabFilter, setOnlineTabFilter] = useState<"ONLINE" | "ALL">("ONLINE");
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = safeGetItem("4m1e1i_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSetItem("4m1e1i_read_notifications", JSON.stringify(readNotifIds));
  }, [readNotifIds]);

  const [deletedNotifIds, setDeletedNotifIds] = useState<string[]>(() => {
    try {
      const saved = safeGetItem("4m1e1i_deleted_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSetItem("4m1e1i_deleted_notifications", JSON.stringify(deletedNotifIds));
  }, [deletedNotifIds]);

  const [notifIdConfirmDlt, setNotifIdConfirmDlt] = useState<string | null>(null);

  const [likedReports, setLikedReports] = useState<Record<string, boolean>>(() => {
    try {
      const saved = safeGetItem("4m1e1i_liked_reports");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [shareModalReport, setShareModalReport] = useState<QualityReport | null>(null);
  const [directiveToDelete, setDirectiveToDelete] = useState<{ report: QualityReport; dirId: string } | null>(null);

  // Resolution editor states for KPH items
  const [editingResolutionReportId, setEditingResolutionReportId] = useState<string | null>(null);
  const [resDeptName, setResDeptName] = useState<string>("");
  const [resResultText, setResResultText] = useState<string>("");
  const [resStatus, setResStatus] = useState<"Đang xử lý" | "Đã xử lý">("Đang xử lý");

  // Replication editor states for DSA items
  const [editingReplicationReportId, setEditingReplicationReportId] = useState<string | null>(null);
  const [repId, setRepId] = useState<string | null>(null);
  const [repFactoryName, setRepFactoryName] = useState<string>("");
  const [repDeptName, setRepDeptName] = useState<string>("");
  const [repStatus, setRepStatus] = useState<"Đang chuẩn bị" | "Đang triển khai" | "Đã hoàn thành">("Đang chuẩn bị");
  const [repTargetDate, setRepTargetDate] = useState<string>("");
  const [repNotes, setRepNotes] = useState<string>("");
  const [repCurrentState, setRepCurrentState] = useState<string>("");
  const [repSupportRequired, setRepSupportRequired] = useState<string>("");

  useEffect(() => {
    safeSetItem("4m1e1i_liked_reports", JSON.stringify(likedReports));
  }, [likedReports]);

  useEffect(() => {
    if (activeBottomTab === "PHAN_TICH" && currentUser?.role !== UserRole.ADMIN) {
      setActiveBottomTab("BAO_CAO");
    }
  }, [activeBottomTab, currentUser]);

  const toggleLike = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const likerName = currentUser?.fullName || "Kiểm soát viên";
    const currentLikes = report.likedBy || [];
    const isNowLiked = !currentLikes.includes(likerName);

    let updatedLikes: string[];
    if (isNowLiked) {
      updatedLikes = [...currentLikes, likerName];
    } else {
      updatedLikes = currentLikes.filter((name) => name !== likerName);
    }

    const updatedReport: QualityReport = {
      ...report,
      likedBy: updatedLikes,
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    setLikedReports((prev) => ({
      ...prev,
      [reportId]: isNowLiked
    }));

    showToast(isNowLiked ? "Đã thích báo cáo này! ❤️" : "Đã bỏ thích báo cáo! 💔");
  };

  const toggleAcknowledge = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const userName = currentUser?.fullName || "Kiểm soát viên";
    const userDept = currentUser?.department || "BP Liên Quan";
    const label = `${userName} (${userDept})`;

    const currentShares = report.sharedBy || [];
    const isNowAcknowledged = !currentShares.some(name => name.startsWith(userName));

    let updatedShares: string[];
    if (isNowAcknowledged) {
      updatedShares = [...currentShares, label];
    } else {
      updatedShares = currentShares.filter((name) => !name.startsWith(userName));
    }

    const updatedReport: QualityReport = {
      ...report,
      sharedBy: updatedShares,
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    showToast(isNowAcknowledged ? "Đã xác nhận tiếp nhận thông tin! ✅" : "Đã hủy xác nhận tiếp nhận! ↩️");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => current === msg ? null : current);
    }, 2500);
  };

  const handleShare = async (report: QualityReport) => {
    const sharerName = currentUser?.fullName || "Kiểm soát viên";
    const currentShares = report.sharedBy || [];
    
    const updatedShares = currentShares.includes(sharerName)
      ? currentShares
      : [...currentShares, sharerName];

    const updatedReport: QualityReport = {
      ...report,
      sharedBy: updatedShares,
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    const shareText = `🔔 BÁO CÁO THAY ĐỔI 4M1E1I - TÂN PHÚ
---------------------------------
📍 Chi nhánh/Nhà máy: ${report.factory}
🕒 Thời gian: ${report.timestamp}
👤 Người đăng: ${report.uploaderName}
📂 Loại biến động: ${report.category}
📝 Nội dung: ${report.content}
${report.notes ? `✍️ Ghi chú: ${report.notes}\n` : ""}${report.imageUrl ? `📷 Hình ảnh minh chứng: ${report.imageUrl}\n` : ""}
App Link: ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Phần mềm 4M1E1I - Báo cáo từ ${report.uploaderName}`,
          text: shareText,
          url: window.location.href,
        });
        showToast("Chia sẻ thành công! 🚀");
      } catch (err) {
        console.log("Error sharing:", err);
        try {
          await navigator.clipboard.writeText(shareText);
          showToast("Đã sao chép! Bạn có thể gửi Zalo 📋");
        } catch (clipErr) {
          showToast("Không thể chia sẻ báo cáo.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("Đã sao chép! Bạn có thể dán đăng lên Zalo 📋");
      } catch (err) {
        showToast("Có lỗi xảy ra khi sao chép thông tin!");
      }
    }
  };

  const executeShareAction = (type: "copy_zalo_web" | "copy_zalo_app" | "zalo_inline" | "copy_only" | "native") => {
    if (!shareModalReport) return;
    const report = shareModalReport;

    const sharerName = currentUser?.fullName || "Kiểm soát viên";
    const currentShares = report.sharedBy || [];
    const updatedShares = currentShares.includes(sharerName)
      ? currentShares
      : [...currentShares, sharerName];

    const updatedReport: QualityReport = {
      ...report,
      sharedBy: updatedShares,
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    const shareText = `🔔 BÁO CÁO THAY ĐỔI 4M1E1I - TÂN PHÚ
---------------------------------
📍 Chi nhánh/Nhà máy: ${report.factory}
🕒 Thời gian: ${report.timestamp}
👤 Người đăng: ${report.uploaderName}
📂 Loại biến động: ${report.category}
📝 Nội dung: ${report.content}
${report.notes ? `✍️ Ghi chú: ${report.notes}\n` : ""}${report.imageUrl ? `📷 Hình ảnh minh chứng: ${report.imageUrl}\n` : ""}
App Link: ${window.location.origin}`;

    const reportUrl = `${window.location.origin}?reportId=${report.id}`;

    if (type === "copy_zalo_web") {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast("Đã sao chép báo cáo! Đang chuyển tiếp sang Zalo Web... 💬");
        setTimeout(() => {
          window.open("https://chat.zalo.me", "_blank");
        }, 1000);
      }).catch(() => {
        showToast("Không thể sao chép tự động.");
      });
    } else if (type === "copy_zalo_app") {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast("Đã sao chép báo cáo! Đang mở ứng dụng Zalo... 📱");
        setTimeout(() => {
          window.open("zalo://", "_blank");
        }, 1000);
      }).catch(() => {
        showToast("Không thể sao chép tự động.");
      });
    } else if (type === "zalo_inline") {
      showToast("Đang mở hộp thoại chia sẻ Zalo... 🔗");
      setTimeout(() => {
        window.open(`https://sp.zalo.me/share_inline?url=${encodeURIComponent(reportUrl)}`, "_blank");
      }, 800);
    } else if (type === "copy_only") {
      navigator.clipboard.writeText(shareText).then(() => {
        showToast("Đã sao chép toàn bộ thông tin báo cáo! 📋");
      }).catch(() => {
        showToast("Lỗi sao chép.");
      });
    } else if (type === "native") {
      if (navigator.share) {
        navigator.share({
          title: `Phần mềm 4M1E1I - Báo cáo từ ${report.uploaderName}`,
          text: shareText,
          url: reportUrl,
        }).then(() => {
          showToast("Chia sẻ thành công! 🚀");
        }).catch((err) => {
          console.log(err);
          navigator.clipboard.writeText(shareText).then(() => {
            showToast("Đã sao chép báo cáo! Bạn có thể dán Zalo 📋");
          });
        });
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          showToast("Đã sao chép báo cáo! Bạn có thể dán Zalo 📋");
        });
      }
    }

    setShareModalReport(null);
  };

  const parseReportTimestamp = (ts: string): Date => {
    try {
      if (!ts) return new Date();
      if (ts.includes("T") && ts.includes("-")) {
        return new Date(ts);
      }
      
      const parts = ts.trim().split(/\s+/);
      if (parts.length < 2) return new Date(ts);
      
      const timePart = parts[0]; // "HH:mm:ss"
      const datePart = parts[1]; // "DD/MM/YYYY"
      
      const timeSubparts = timePart.split(":");
      const dateSubparts = datePart.split("/");
      
      if (timeSubparts.length >= 2 && dateSubparts.length === 3) {
        const day = parseInt(dateSubparts[0], 10);
        const month = parseInt(dateSubparts[1], 10) - 1;
        const yearStr = dateSubparts[2].trim();
        const year = yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);
        
        const hours = parseInt(timeSubparts[0], 10);
        const minutes = parseInt(timeSubparts[1], 10);
        const seconds = timeSubparts[2] ? parseInt(timeSubparts[2], 10) : 0;
        
        return new Date(year, month, day, hours, minutes, seconds);
      }
    } catch (e) {
      console.error("Error parsing timestamp:", ts, e);
    }
    return new Date();
  };

  const isDeleteAllowed = (report: QualityReport): boolean => {
    if (!currentUser) return false;
    
    // 1. Admin luôn được quyền xóa mọi thứ
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }

    // 2. Duyệt viên (Reviewer) chỉ có quyền xóa đối với các bản tin thuộc đúng chi nhánh của mình
    if (currentUser.role === UserRole.REVIEWER) {
      return isSameBranchOrFactory(currentUser.branch, report.factory);
    }

    // 3. Đặc cách cho Nhân viên / Duyệt viên (canSpeciallyEditDelete) của chi nhánh hiện tại
    if (currentUser.canSpeciallyEditDelete && isSameBranchOrFactory(currentUser.branch, report.factory)) {
      return true;
    }
    
    // 4. Người đăng tin (uploader) chỉ được xóa bài của chính mình trong vòng 5 phút kể từ khi đăng
    if (report.uploaderId === currentUser.id) {
      const reportDate = parseReportTimestamp(report.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - reportDate.getTime();
      const diffMin = diffMs / (1000 * 60);
      return diffMin >= 0 && diffMin <= 5; // Hợp lệ dưới 5 phút
    }
    
    return false;
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setShowScrollTop(scrollTop > 100);
      
      const diff = scrollTop - lastScrollTopRef.current;
      if (scrollTop > 55 && diff > 12) {
        setShowFilters((prev) => {
          if (prev) return false;
          return prev;
        });
      } else if (diff < -12 || scrollTop <= 12) {
        setShowFilters((prev) => {
          if (!prev) return true;
          return prev;
        });
      }
      
      lastScrollTopRef.current = scrollTop;
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen({ navigationUI: "hide" });
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };
  
  const handleCaptureScrollingScreenshot = async () => {
    if (isCapturingScreenshot) return;
    setIsCapturingScreenshot(true);
    showToast("Đang chuẩn bị chụp cuộn màn hình ở mức tối đa... 📸");

    // Đợi 200ms để đảm bảo toast đã hiển thị và các hiệu ứng ổn định
    await new Promise((resolve) => setTimeout(resolve, 200));

    const viewport = document.getElementById("mobile-viewport");
    if (!viewport) {
      showToast("Không tìm thấy giao diện điện thoại để chụp! ❌");
      setIsCapturingScreenshot(false);
      return;
    }

    // Tìm tất cả các phần tử con có overflow cuộn dọc
    const scrollElements = Array.from(viewport.querySelectorAll(".overflow-y-auto, .overflow-y-scroll, [class*='overflow-y-']")) as HTMLElement[];
    if (scrollContainerRef.current && !scrollElements.includes(scrollContainerRef.current)) {
      scrollElements.push(scrollContainerRef.current);
    }

    // Lưu lại style cũ của viewport và các phần tử cuộn để khôi phục sau khi chụp
    const originalViewportStyle = {
      height: viewport.style.height,
      maxHeight: viewport.style.maxHeight,
      overflow: viewport.style.overflow,
      position: viewport.style.position,
    };

    const originalScrollStyles = scrollElements.map(el => ({
      element: el,
      height: el.style.height,
      maxHeight: el.style.maxHeight,
      overflow: el.style.overflow,
      overflowY: el.style.overflowY,
    }));

    const originalGetComputedStyle = window.getComputedStyle;

    try {
      // Tạm thời hook getComputedStyle để chuyển đổi oklch/oklab colors sang rgb/rgba chuẩn tránh lỗi html2canvas
      (window as any).getComputedStyle = function (el: HTMLElement, pseudoElt?: string) {
        const style = originalGetComputedStyle(el, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (typeof prop === "string") {
              if (prop === "getPropertyValue") {
                return function (propertyName: string) {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                    return convertModernColorsToRgb(val);
                  }
                  return val;
                };
              }
              const val = (target as any)[prop];
              if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                return convertModernColorsToRgb(val);
              }
              if (typeof val === "function") {
                return val.bind(target);
              }
              return val;
            }
            const val = (target as any)[prop];
            if (typeof val === "function") {
              return val.bind(target);
            }
            return val;
          }
        });
      };

      // Thiết lập style tạm thời bung hết cỡ cho viewport để chụp cuộn tối đa
      viewport.style.setProperty("height", "auto", "important");
      viewport.style.setProperty("max-height", "none", "important");
      viewport.style.setProperty("overflow", "visible", "important");

      // Thiết lập style tạm thời bung hết cỡ cho toàn bộ các danh sách cuộn bên trong
      scrollElements.forEach(el => {
        el.style.setProperty("height", "auto", "important");
        el.style.setProperty("max-height", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
        el.style.setProperty("overflow-y", "visible", "important");
      });

      // Đợi 250ms để layout vẽ lại hoàn chỉnh với chiều cao tự nhiên mới
      await new Promise((resolve) => setTimeout(resolve, 250));

      const unrolledHeight = viewport.offsetHeight || 1000;
      let optimalScale = 1.8;
      if (unrolledHeight > 6000) {
        optimalScale = 0.85;
      } else if (unrolledHeight > 4000) {
        optimalScale = 1.1;
      } else if (unrolledHeight > 2000) {
        optimalScale = 1.4;
      }

      const canvas = await html2canvas(viewport, {
        useCORS: true,
        allowTaint: false,
        scale: optimalScale,
        backgroundColor: "#f8fafc",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: viewport.offsetWidth,
        windowHeight: unrolledHeight,
      });

      // Tạo đường dẫn tải xuống
      const imageUri = canvas.toDataURL("image/png");
      if (!imageUri || imageUri === "data:," || imageUri.length < 100) {
        throw new Error("Không thể trích xuất dữ liệu ảnh do bộ nhớ thiết bị giới hạn. Vui lòng chuyển sang Chế độ Chụp Cuộn Hệ Thống!");
      }

      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = String(now.getFullYear()).slice(-2);
      const formattedDate = `${d}-${m}-${y}`; // format dd/mm/yy using safe filename hyphens

      const link = document.createElement("a");
      link.href = imageUri;
      link.download = `4M1E1I_ChupCuon_${formattedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Đã chụp cuộn màn hình thành công! 🎉");
    } catch (err: any) {
      console.error("Lỗi khi chụp cuộn màn hình:", err);
      showToast("Có lỗi xảy ra khi chụp cuộn màn hình: " + err.message);
    } finally {
      // Khôi phục getComputedStyle gốc
      window.getComputedStyle = originalGetComputedStyle;

      // Luôn luôn khôi phục lại styles ban đầu
      viewport.style.height = originalViewportStyle.height;
      viewport.style.maxHeight = originalViewportStyle.maxHeight;
      viewport.style.overflow = originalViewportStyle.overflow;
      viewport.style.position = originalViewportStyle.position;

      originalScrollStyles.forEach(item => {
        item.element.style.height = item.height;
        item.element.style.maxHeight = item.maxHeight;
        item.element.style.overflow = item.overflow;
        item.element.style.overflowY = item.overflowY;
      });

      setIsCapturingScreenshot(false);
    }
  };

  const handleViewportDoubleClick = (e?: React.MouseEvent) => {
    if (isFullscreen) {
      e?.stopPropagation();
      toggleFullscreen();
    }
  };

  const handleViewportTouchStart = (e?: React.TouchEvent) => {
    const now = Date.now();
    const gap = now - lastTouchTimeRef.current;
    if (gap > 0 && gap < 300) {
      if (isFullscreen) {
        e?.stopPropagation();
        toggleFullscreen();
      }
    }
    lastTouchTimeRef.current = now;
  };

  // Helper to match selected factory abbreviation to actual database names
  const matchSelectedFactory = (factoryName: string, filterKey: string): boolean => {
    const norm = factoryName.toLowerCase();
    
    // 1. Check if the report's factory name contains the filter key (e.g. "(TPP-BNI)" contains "tpp-bni")
    if (norm.includes(filterKey.toLowerCase())) return true;
    
    // 2. Lookup branch mapping to match full name
    if (branches) {
      const matchBranch = branches.find(b => b.id === filterKey);
      if (matchBranch && norm.includes(matchBranch.name.toLowerCase())) {
        return true;
      }
    }

    if (filterKey === "TPP-BNI") return norm.includes("bắc ninh") || norm.includes("tpp-bni");
    if (filterKey === "TPP-LAN") return norm.includes("long an") || norm.includes("tpp-lan");
    if (filterKey === "TPP-CTY") return norm.includes("văn phòng") || norm.includes("tpp-cty");
    if (filterKey === "TPP-314") return norm.includes("314") || norm.includes("tpp-314");
    if (filterKey === "DNP") return norm.includes("dnp");
    return false;
  };

  // Filter items based on uploader or factory search or description search
  const filteredReports = reports.filter((r) => {
    if (r.isDeleted) return false;

    // Approval status filtering rules
    const isApproved = r.isApproved !== false;
    const isUploader = r.uploaderId === currentUser?.id;

    if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) {
      if (mobileFeedSubTab === "PROPOSAL") {
        if (isApproved) return false;
        // Reviewer can only see pending proposals for their own branch/factory
        if (currentUser.role === UserRole.REVIEWER && r.factory !== currentUser.branch) {
          return false;
        }
      } else {
        if (!isApproved) return false;
      }
    } else {
      // Regular Staff: show approved reports, OR their own pending proposals (which show a "Chờ duyệt" badge)
      if (!isApproved && !isUploader) return false;
    }

    const s = searchTerm.toLowerCase();
    const matchesSearch =
      r.factory.toLowerCase().includes(s) ||
      r.uploaderName.toLowerCase().includes(s) ||
      r.content.toLowerCase().includes(s) ||
      r.category.toLowerCase().includes(s);

    const matchesCategory = selectedCategory ? r.category === selectedCategory : true;
    const matchesFactoryFilter = selectedFactoryFilter ? matchSelectedFactory(r.factory, selectedFactoryFilter) : true;
    
    return matchesSearch && matchesCategory && matchesFactoryFilter;
  });

  // Sort reports according to the prioritized layout:
  // 1. New reports (posted <= 5 minutes ago) are at the absolute top.
  // 2. Reports with new changes/updates (updated <= 5 minutes ago) also automatically jump to the top.
  // 3. Normal reports are ordered by original time descending at the bottom.
  const sortedReports = [...filteredReports].sort((a, b) => {
    const now = new Date().getTime();
    const aCreated = parseReportTimestamp(a.timestamp).getTime();
    const bCreated = parseReportTimestamp(b.timestamp).getTime();
    const aUpdated = a.updatedAt ? parseReportTimestamp(a.updatedAt).getTime() : 0;
    const bUpdated = b.updatedAt ? parseReportTimestamp(b.updatedAt).getTime() : 0;

    const ageA_CreatedMin = (now - aCreated) / (1000 * 60);
    const ageB_CreatedMin = (now - bCreated) / (1000 * 60);

    const ageA_UpdatedMin = a.updatedAt ? (now - aUpdated) / (1000 * 60) : Infinity;
    const ageB_UpdatedMin = b.updatedAt ? (now - bUpdated) / (1000 * 60) : Infinity;

    // A report is "New" if original post is <= 5 mins ago
    const isA_New = ageA_CreatedMin >= 0 && ageA_CreatedMin <= 5;
    const isB_New = ageB_CreatedMin >= 0 && ageB_CreatedMin <= 5;

    // A report is "Recently Changed" if updatedAt of the post is <= 5 mins ago
    const isA_RecentlyUpdated = ageA_UpdatedMin >= 0 && ageA_UpdatedMin <= 5;
    const isB_RecentlyUpdated = ageB_UpdatedMin >= 0 && ageB_UpdatedMin <= 5;

    // High priority group includes either New posts or recently updated/changed posts (within 5 minutes)
    const isA_HighPriority = isA_New || isA_RecentlyUpdated;
    const isB_HighPriority = isB_New || isB_RecentlyUpdated;

    if (isA_HighPriority && !isB_HighPriority) return -1;
    if (!isA_HighPriority && isB_HighPriority) return 1;
    if (isA_HighPriority && isB_HighPriority) {
      // Both are high priority -> sort by the absolute latest action of the report (creation or update) descending
      const aLatest = Math.max(aCreated, aUpdated);
      const bLatest = Math.max(bCreated, bUpdated);
      return bLatest - aLatest;
    }

    // Otherwise, sort remaining older posts by their original creation time descending
    return bCreated - aCreated;
  });

  const isEditAllowed = (report: QualityReport): boolean => {
    if (!currentUser) return false;
    
    // 1. Chỉ Admin mới được quyền chỉnh sửa mặc định mọi bản tin
    if (currentUser.role === UserRole.ADMIN) {
      return true;
    }

    // 2. Duyệt viên (Reviewer) chỉ có quyền chỉnh sửa đối với các bản tin thuộc đúng chi nhánh của mình
    if (currentUser.role === UserRole.REVIEWER) {
      return isSameBranchOrFactory(currentUser.branch, report.factory);
    }

    // 3. Đặc cách cho Nhân viên / Duyệt viên (canSpeciallyEditDelete) của chi nhánh hiện tại
    if (currentUser.canSpeciallyEditDelete && isSameBranchOrFactory(currentUser.branch, report.factory)) {
      return true;
    }

    // 4. Người đăng tin (uploader) chỉ được sửa bài của chính mình trong vòng 5 phút kể từ khi đăng
    if (report.uploaderId === currentUser.id) {
      const reportDate = parseReportTimestamp(report.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - reportDate.getTime();
      const diffMin = diffMs / (1000 * 60);
      return diffMin >= 0 && diffMin <= 5; // Hợp lệ dưới 5 phút
    }
    
    return false;
  };

  const generateNotifications = (): AppNotification[] => {
    const list: AppNotification[] = [];
    
    reports.forEach((report) => {
      // 1. Report post notification
      list.push({
        id: `report-${report.id}`,
        title: "Bản tin 4M1E1I mới",
        description: `Đăng bởi ${report.uploaderName} tại ${report.factory}. Nội dung: "${report.content.substring(0, 45)}..."`,
        timestamp: report.timestamp,
        type: "new_report",
        targetReportId: report.id,
        authorName: report.uploaderName,
        factoryName: report.factory
      });

      // 2. Report edited / updated notification
      if (report.updateLogs && report.updateLogs.length > 0) {
        const guessGenderPrefix = (fullName: string): string => {
          const name = fullName.toLowerCase();
          if (
            name.includes(" thị ") || 
            name.includes(" thị") || 
            name.includes("hông") || 
            name.includes("hồng") || 
            name.includes("phượng") || 
            name.includes("tuyền") || 
            name.includes("vy") || 
            name.includes("hiền") || 
            name.includes("lan") || 
            name.includes("nga") || 
            name.includes("trang") || 
            name.includes("yến") || 
            name.includes("thảo") || 
            name.includes("oanh") || 
            name.includes("dung") || 
            name.includes("hằng") || 
            name.includes("mai") || 
            name.includes("thoại") ||
            name.includes("thanh thiện")
          ) {
            return "Chị";
          }
          return "Anh";
        };

        const getCleanName = (name: string | undefined | null): string => {
          if (!name || typeof name !== "string") return "";
          return name.replace(/\s+/g, " ").trim();
        };

        report.updateLogs.forEach((log, idx) => {
          const timeMatch = log.match(/\((\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{2})\)/);
          const logTimestamp = timeMatch ? timeMatch[1] : report.updatedAt || report.timestamp;

          let description = `Bản tin của ${report.uploaderName} tại ${report.factory} vừa thay đổi thông tin.`;
          
          const likeMatch = log.match(/Lượt thích mới \((.*?)\)/);
          if (likeMatch) {
            const actor = getCleanName(likeMatch[1]);
            const gender = guessGenderPrefix(actor);
            description = `Bản tin của ${report.uploaderName} vừa được ${gender} @${actor} thả 1 lượt like.`;
          } else {
            const shareMatch = log.match(/Chia sẻ mới \((.*?)\)/);
            if (shareMatch) {
              const actor = getCleanName(shareMatch[1]);
              const gender = guessGenderPrefix(actor);
              description = `Bản tin của ${report.uploaderName} vừa được ${gender} @${actor} chia sẻ.`;
            } else {
              const chatMatch = log.match(/Tương tác bình luận mới từ (.*?) \(/) || log.match(/Tương tác bình luận mới từ (.*?)$/);
              if (chatMatch) {
                const actor = getCleanName(chatMatch[1]);
                const gender = guessGenderPrefix(actor);
                description = `Bản tin của ${report.uploaderName} vừa nhận bình luận tương tác từ ${gender} @${actor}.`;
              } else {
                const dirMatch = log.match(/Chỉ đạo mới \((.*?): "(.*?)"\)/);
                if (dirMatch) {
                  const actor = getCleanName(dirMatch[1]);
                  const content = dirMatch[2];
                  const gender = guessGenderPrefix(actor);
                  description = `${gender} @${actor} vừa ban hành chỉ đạo mới trên bản tin của ${report.uploaderName}: "${content}"`;
                } else if (log.includes("Sửa chi tiết") || log.includes("Sửa chi nhánh") || log.includes("Sửa hạng mục 4M1E1I") || log.includes("Sửa ghi chú") || log.includes("Thay đổi mức cảnh báo") || log.includes("Sửa ảnh")) {
                  const cleanPart = log.replace(/\s*\(\d{2}:\d{2}:\d{2}.*?\)\s*$/, "").trim();
                  description = `Bản tin của ${report.uploaderName} tại ${report.factory} vừa thay đổi: ${cleanPart}.`;
                }
              }
            }
          }

          list.push({
            id: `update-${report.id}-${idx}`,
            title: "Bản tin cập nhật",
            description,
            timestamp: logTimestamp,
            type: "update_report",
            targetReportId: report.id,
            authorName: report.uploaderName,
            factoryName: report.factory
          });
        });
      } else if (report.updatedAt) {
        list.push({
          id: `update-${report.id}`,
          title: "Bản tin cập nhật",
          description: `Bản tin của ${report.uploaderName} tại ${report.factory} vừa thay đổi thông tin.`,
          timestamp: report.updatedAt,
          type: "update_report",
          targetReportId: report.id,
          authorName: report.uploaderName,
          factoryName: report.factory
        });
      }

      // 3. Directives notifications
      if (report.directives && report.directives.length > 0) {
        report.directives.forEach((dir, idx) => {
          list.push({
            id: `directive-${report.id}-${idx}`,
            title: "Chỉ đạo chất lượng mới",
            description: `${dir.author} chỉ đạo: "${dir.text.substring(0, 45)}..."`,
            timestamp: dir.timestamp,
            type: "new_directive",
            targetReportId: report.id,
            authorName: dir.author,
            factoryName: report.factory
          });
        });
      }
    });

    // Filter out deleted notifications
    const activeList = list.filter((n) => !deletedNotifIds.includes(n.id));

    // Sort notifications chronologically descending (newest first)
    return activeList.sort((a, b) => {
      const tA = parseReportTimestamp(a.timestamp).getTime();
      const tB = parseReportTimestamp(b.timestamp).getTime();
      return tB - tA;
    });
  };

  const notifications = generateNotifications();
  const unreadNotifications = notifications.filter((n) => !readNotifIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  // Web Badging API - Sync home screen badge on real device / PWA with unreadCount
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      try {
        if ("setAppBadge" in navigator) {
          if (unreadCount > 0) {
            const p = navigator.setAppBadge(unreadCount);
            if (p && typeof p.catch === "function") {
              p.catch((err) => {
                console.warn("Lỗi đặt App Badge (async):", err);
              });
            }
          } else {
            const p = navigator.clearAppBadge();
            if (p && typeof p.catch === "function") {
              p.catch((err) => {
                console.warn("Lỗi xóa App Badge (async):", err);
              });
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi gọi Badging API (sync):", err);
      }
      
      try {
        // Fallback message passing to service worker scope if active
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: unreadCount > 0 ? "SET_BADGE" : "CLEAR_BADGE",
            count: unreadCount
          });
        }
      } catch (err) {
        console.warn("Lỗi gửi tin nhắn cho Service Worker:", err);
      }
    }
  }, [unreadCount]);

  const handleNotificationClick = (notif: AppNotification) => {
    if (!readNotifIds.includes(notif.id)) {
      setReadNotifIds((prev) => [...prev, notif.id]);
    }
    setSearchTerm("");
    setSelectedCategory(null);
    setShowNotifDrawer(false);

    setTimeout(() => {
      const el = document.getElementById(`report-card-${notif.targetReportId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-[#1e3a8a]", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-4", "ring-[#1e3a8a]", "ring-offset-2");
        }, 3000);
      }
    }, 450);
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
  };

  // Category Icon Resolver
  const getCategoryIcon = (cat: Category4M1E1I) => {
    switch (cat) {
      case "CON NGƯỜI":
        return <Users className="w-4 h-4 mr-2 text-indigo-600" />;
      case "MÁY MÓC":
        return <Cpu className="w-4 h-4 mr-2 text-green-600" />;
      case "NGUYÊN VẬT LIỆU":
        return <Settings className="w-4 h-4 mr-2 text-fuchsia-600" />;
      case "PHƯƠNG PHÁP":
        return <FileText className="w-4 h-4 mr-2 text-amber-600" />;
      case "MÔI TRƯỜNG":
        return <Heart className="w-4 h-4 mr-2 text-teal-600" />;
      case "THÔNG TIN":
        return <Info className="w-4 h-4 mr-2 text-slate-600" />;
    }
  };

  if (showQrCodeView) {
    const currentAppUrl = "https://tanphu-4m1e1i.vercel.app/";
    
    const downloadQRCode = () => {
      const svgElement = document.getElementById("app-qr-code-svg");
      if (!svgElement) return;
      
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const globalUrl = window.URL || (window as any).webkitURL;
      const blobURL = globalUrl.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#FFFFFF";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 50, 50, 1100, 1100);
          
          try {
            const pngData = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngData;
            downloadLink.download = "Ma_QR_4M1E1I_TanPhu.png";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } catch (e) {
            const downloadLink = document.createElement("a");
            downloadLink.href = blobURL;
            downloadLink.download = "Ma_QR_4M1E1I_TanPhu.svg";
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            showToast("Đã tải xuống mã QR định dạng vector SVG! 🔗");
          }
        }
      };
      image.src = blobURL;
    };

    return (
      <div 
        id="mobile-viewport" 
        onDoubleClick={handleViewportDoubleClick} 
        onTouchStart={handleViewportTouchStart} 
        className={`w-full flex flex-col relative transition-all duration-300 ${
          isRealMobile 
            ? "max-w-none rounded-none border-0 shadow-none h-[100dvh] overflow-hidden" 
            : "max-w-[440px] lg:w-[375px] h-[100dvh] lg:h-[780px] bg-slate-950 rounded-[18px] lg:rounded-[36px] border-[3px] lg:border-8 border-slate-950 shadow-2xl overflow-hidden"
        }`}
      >
        {/* Main Title Bar / Header */}
        <div className={`text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 select-none ${
          isRealMobile ? "rounded-none" : "rounded-t-[15px] lg:rounded-t-[28px]"
        } ${theme.bg}`}>
          <button
            onClick={() => setShowQrCodeView(false)}
            className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white font-black bg-transparent border-none cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5px]" />
            <T>Sảnh chính</T>
          </button>
          
          <T className="font-extrabold text-[12.5px] uppercase tracking-wider">MÃ QR TRUY CẬP</T>
          
          {/* Dummy element on the right for symmetry as shown in the screenshot */}
          <div className="w-[85px] flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentAppUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
                showToast("Đã sao chép liên kết vào bộ nhớ tạm! 📋");
              }}
              className="p-1 text-white/90 hover:text-white bg-transparent border-none cursor-pointer"
              title="Sao chép liên kết"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scrollbar">
          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="text-center space-y-1">
              <T className="text-sm font-black text-slate-850 uppercase block">Mã QR "Chiến" Ngay</T>
              <T className="text-[10px] text-slate-500 leading-normal block">
                Quét nhanh bằng camera điện thoại để thực hiện bài trắc nghiệm nhanh, khai báo hoặc xem báo cáo 4M1E1I Tân Phú.
              </T>
            </div>

            {/* Warning Box exactly styled like the screenshot */}
            <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-amber-900 text-xs">
              <div className="flex items-center justify-between font-black uppercase text-amber-800 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span>⚠️</span>
                  <T>Lưu ý khi Quét Thử Nghiệm:</T>
                </div>
                {/* Pointer arrow down */}
                <span className="text-[9px] text-amber-500">▼</span>
              </div>
              <p className="text-[9.5px] text-amber-700 leading-relaxed font-semibold">
                <T>Đóng vai trò như chìa khóa truy cập nhanh, hệ thống hỗ trợ quét bằng Camera Zalo, Camera thiết bị IOS/Android hoặc ứng dụng quét mã để truy cập an toàn.</T>
              </p>
            </div>

            {/* QR Connection details input display */}
            <div className="space-y-4">
              <div className="space-y-1 w-full text-left">
                <T className="text-[9px] font-black tracking-wider uppercase text-slate-450 block">LIÊN KẾT NHÚNG QR:</T>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full">
                  <input
                    type="text"
                    readOnly
                    value={currentAppUrl}
                    className="flex-1 bg-transparent border-none text-[10.5px] font-mono text-slate-500 select-all outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentAppUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                      showToast("Đã sao chép liên kết nhúng QR! 📋");
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-all cursor-pointer border-none bg-transparent"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Centered QR code container rounded and bordered */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center justify-center w-[210px] h-[210px]">
                  <QRCodeSVG
                    id="app-qr-code-svg"
                    value={currentAppUrl}
                    size={178}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Bottom duplicate display link input from screenshot query */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl px-3 py-2 text-center text-slate-400 text-[10.5px] font-mono">
                <T>{currentAppUrl}</T>
              </div>

              {/* Download high res blue button */}
              <button
                onClick={downloadQRCode}
                className="w-full bg-[#1e3a8a] hover:bg-[#1a306c] active:scale-98 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Download className="w-4 h-4 text-white stroke-[2.5px]" />
                <T>Tải Mã QR nét cao</T>
              </button>
            </div>
          </div>
        </div>

        {/* Floating HOME Button exactly styled as the screenshot (green circle with white home icon) */}
        <button
          id="float-home-qr"
          type="button"
          onClick={() => {
            setShowQrCodeView(false);
            setActiveBottomTab("BAO_CAO");
            setShowTrash(false);
            setShowNotifDrawer(false);
          }}
          className="absolute bottom-20 right-5 w-[42px] h-[42px] bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-xl transition-all z-50 cursor-pointer border-none"
          title="Trở về Trang Home"
        >
          <Home className="w-[18px] h-[18px] text-white stroke-[2.2px]" />
        </button>
      </div>
    );
  }

  return (
    <div 
      id="mobile-viewport" 
      onDoubleClick={handleViewportDoubleClick} 
      onTouchStart={handleViewportTouchStart} 
      className={`w-full flex flex-col relative transition-all duration-300 ${
        isRealMobile 
          ? "max-w-none rounded-none border-0 shadow-none" 
          : "max-w-[440px] lg:w-[375px] bg-slate-950 rounded-[18px] lg:rounded-[36px] border-[3px] lg:border-8 border-slate-950 shadow-2xl"
      } ${
        isNativeScrollMode 
          ? "h-auto overflow-visible" 
          : "h-[100dvh] lg:h-[780px] overflow-hidden"
      }`}
    >
      {isNativeScrollMode && (
        <style>{`
          /* ONLY target mobile-viewport's own children for natural expansion */
          .native-scroll-active #mobile-viewport {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding-top: 50px !important; /* Space for the yellow fixed banner */
            background: #ffffff !important;
          }
          .native-scroll-active #mobile-viewport .overflow-y-auto,
          .native-scroll-active #mobile-viewport .overflow-y-scroll,
          .native-scroll-active #mobile-viewport [class*='overflow-y-'] {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            overflow-y: visible !important;
          }
          .native-scroll-active #mobile-viewport .flex-1 {
            flex: none !important;
          }

          /* Hide other irrelevant desktop structures and UI chromes entirely when capturing */
          .native-scroll-active .main-app-header,
          .native-scroll-active .dashboard-desktop-wrapper,
          .native-scroll-active .header-mobile-controls,
          .native-scroll-active #mobile-header,
          .native-scroll-active #mobile-bottom-nav,
          .native-scroll-active #float-home-qr,
          .native-scroll-active #float-home-trash,
          .native-scroll-active button[title='Công cụ Chụp ảnh'],
          .native-scroll-active button[title='Tải lại dữ liệu'],
          .native-scroll-active .absolute.bottom-20,
          .native-scroll-active .bg-slate-800\\/90,
          .native-scroll-active #floating-menu-control-bar {
            display: none !important;
          }

          /* Make the containing dock responsive and scroll-transparent */
          .native-scroll-active .mobile-preview-dock {
            width: 100% !important;
            max-width: none !important;
            border: none !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Ensure body and html can grow naturally with zero constraints */
          html.native-scroll-active,
          body.native-scroll-active,
          #root.native-scroll-active,
          .native-scroll-active {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            overflow-x: hidden !important;
            background: #ffffff !important;
            position: relative !important;
          }
          
          /* Remove fixed and overflow-hidden classes of wrapping elements */
          .native-scroll-active .min-h-screen {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
          }
          
          /* Hide other irrelevant background spots and decorative circles */
          .native-scroll-active .min-h-screen > .pointer-events-none,
          .native-scroll-active [class*='bg-cyan-400'],
          .native-scroll-active [class*='bg-[#6366f1]'] {
            display: none !important;
          }
          
          /* Target Admin Mobile Simulator Wrapper overlays in App.tsx */
          .native-scroll-active .fixed.inset-0,
          .native-scroll-active .fixed.inset-0.z-50 {
            position: absolute !important;
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: transparent !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: auto !important;
          }
          .native-scroll-active .fixed.inset-0 > div,
          .native-scroll-active .fixed.inset-0.z-50 > div {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
        `}</style>
      )}

      {isNativeScrollMode && (
        <div 
          onClick={() => setIsNativeScrollMode(false)}
          className="fixed top-0 left-0 right-0 z-[100000] bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-3 text-xs font-black text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-lg select-none border-b border-amber-600 font-sans"
        >
          <span translate="no" className="notranslate">📸 ĐANG TRONG CHẾ ĐỘ CHỤP CUỘN. Hãy dùng phím cứng điện thoại để chụp ngay! [X ĐÓNG]</span>
        </div>
      )}

      {/* Main Appsheet Blue Title Bar */}
      <div id="mobile-header" className={`text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 select-none ${
        isRealMobile ? "rounded-none" : "rounded-t-[15px] lg:rounded-t-[28px]"
      } ${theme.bg}`}>
        <div className="flex items-center gap-2">
          {/* TANPHU simulated logo block */}
          <div className="relative">
            <div className="bg-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center justify-center font-sans tracking-tighter" style={{ color: "var(--color-primary, #1e3a8a)" }}>
              <T>TANPHU</T>
            </div>
          </div>
          <T className="font-bold text-[13.6px] tracking-wide whitespace-nowrap">META 4M1E1I</T>
        </div>
        <div className="flex items-center gap-[9.5px]">
          {currentUser?.role !== UserRole.STAFF && currentUser?.role !== UserRole.REVIEWER && (
            <button
              onClick={() => setShowTrash(true)}
              className="relative hover:scale-115 active:scale-95 transition-transform p-1 cursor-pointer"
              title="Lưu trữ / Thùng rác"
            >
              <Archive className="w-[18px] h-[18px] text-amber-300 hover:text-amber-100" />
              {reports.filter((r) => r.isDeleted).length > 0 && (
                <span className="absolute -top-1 -right-0.5 bg-rose-600 text-[8px] text-white font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 leading-none">
                  <span translate="no" className="notranslate">
                    {reports.filter((r) => r.isDeleted).length}
                  </span>
                </span>
              )}
            </button>
          )}

          {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) && (
            <button
              onClick={() => {
                setShowMobileCloudQuota(true);
                setShowTrash(false);
              }}
              className="relative hover:scale-115 active:scale-95 transition-transform p-1 cursor-pointer"
              title="Giám sát Cloud Quota"
            >
              <Cloud className="w-[19px] h-[19px] text-sky-300 hover:text-sky-100" />
            </button>
          )}

          <button
            onClick={() => setShowNotifDrawer(true)}
            className="relative hover:scale-115 active:scale-95 transition-transform p-1 cursor-pointer"
            title="Thông báo hệ thống"
          >
            <Bell className="w-[19px] h-[19px] text-white" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 bg-rose-600 text-[8px] text-white font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border ${theme.border} animate-pulse`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          
          

          {currentUser?.role !== UserRole.ADMIN && (
            <button 
              onClick={handleRefreshClick} 
              className="hover:scale-115 active:scale-95 transition-transform cursor-pointer"
              title="Tải lại dữ liệu"
              disabled={isRefreshing}
            >
              <RotateCw className={`w-[18px] h-[18px] text-white ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}
          
          {/* Bong bóng số báo tổng số người online */}
          {currentUser?.role !== UserRole.STAFF && currentUser?.role !== UserRole.REVIEWER && (
            <button 
              onClick={() => {
                setOnlineSearchTerm("");
                setOnlineTabFilter("ONLINE");
                setShowOnlineUsersDrawer(true);
              }}
              className="relative hover:scale-115 active:scale-95 transition-all p-1 cursor-pointer bg-transparent border-none outline-none"
              title="Số nhân viên đang online"
            >
              <Users className="w-[18px] h-[18px] text-emerald-300 pointer-events-none" />
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-[8px] text-white font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900 leading-none shadow-sm animate-pulse pointer-events-none">
                <span translate="no" className="notranslate font-mono select-none">
                  {onlineCount}
                </span>
              </span>
            </button>
          )}

          {/* ICON máy ảnh (Công cụ Chụp ảnh) đặt bên phải ICON người online cho tất cả vai trò */}
          {!isNativeScrollMode && (
            <button
              type="button"
              onClick={() => setShowScreenshotMenu(true)}
              className="relative hover:scale-115 active:scale-95 transition-all p-1 cursor-pointer bg-transparent border-none outline-none flex items-center justify-center"
              title="Công cụ Chụp ảnh"
            >
              <Camera className="w-[19px] h-[19px] text-white stroke-[2.2px]" />
            </button>
          )}
        </div>
      </div>

      {/* Internal layout controls (Search inputs) */}
      {activeBottomTab === "BAO_CAO" && (
        <div className={`transition-all duration-300 overflow-hidden shrink-0 ${
          showFilters ? "max-h-[50px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}>
          <div className="bg-white px-3 py-1.5 border-b border-slate-200 shadow-xs flex items-center gap-1.5">
            {/* Search Input */}
            <div className="relative flex-[0.9] min-w-0">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-1 py-1 bg-slate-100 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400 text-slate-700 font-bold border-none"
              />
            </div>

            {/* Branch Dropdown */}
            <div className="flex-[1.1] min-w-0 max-w-[95px]">
              <select
                value={selectedFactoryFilter || "ALL"}
                onChange={(e) => setSelectedFactoryFilter(e.target.value === "ALL" ? null : e.target.value)}
                className="w-full bg-slate-100 text-[10px] font-extrabold text-slate-700 rounded-lg pl-1.5 pr-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none border-none select-none h-7 truncate cursor-pointer"
              >
                <option value="ALL" translate="no" className="notranslate font-extrabold text-[10px]">TẤT CẢ</option>
                {(() => {
                  const activeFactoryChips = branches && branches.length > 0
                    ? branches
                        .filter((b) => b.isScoring)
                        .map((b) => {
                          const label = getFactoryDisplayName(b.name);
                          return { key: b.id, label };
                        })
                    : [
                        { key: "TPP-BNI", label: "TPP-BNI" },
                        { key: "TPP-LAN", label: "TPP-LAN" },
                        { key: "TPP-CTY", label: "TPP-CTY" },
                        { key: "TPP-314", label: "TPP-314" }
                      ];
                  return activeFactoryChips.map((item) => (
                    <option
                      key={item.key}
                      value={item.key}
                      translate="no"
                      className="notranslate font-semibold text-[10px]"
                    >
                      {item.label}
                    </option>
                  ));
                })()}
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex-[1.1] min-w-0 max-w-[95px]">
              <select
                value={selectedCategory || "ALL"}
                onChange={(e) => setSelectedCategory(e.target.value === "ALL" ? null : e.target.value)}
                className="w-full bg-slate-100 text-[10px] font-extrabold text-slate-700 rounded-lg pl-1.5 pr-3 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none border-none select-none h-7 truncate cursor-pointer"
              >
                <option value="ALL" translate="no" className="notranslate font-extrabold text-[10px]">TẤT CẢ</option>
                {(["CON NGƯỜI", "MÁY MÓC", "NGUYÊN VẬT LIỆU", "PHƯƠNG PHÁP", "MÔI TRƯỜNG", "THÔNG TIN"] as Category4M1E1I[]).map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                    translate="no"
                    className="notranslate font-semibold text-[10px]"
                  >
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* QR Code Trigger Button */}
            <button
              type="button"
              onClick={() => setShowQrCodeView(true)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all cursor-pointer shrink-0 border-none flex items-center justify-center w-7 h-7"
              title="Mã QR ứng dụng"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Offline Alert Sticky Banner */}
      {offlineMode && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 text-[10px] px-3 py-1.5 font-bold flex items-center justify-between shrink-0 select-none">
          <T>⚠️ Đang chạy Offline - Lưu báo cáo vào hàng chờ</T>
        </div>
      )}

      {/* Main card list scroll area */}
      {showMobileCloudQuota ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative">
          <div className="flex items-center justify-between mb-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setShowMobileCloudQuota(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <T><span translate="no" className="notranslate">Quay Lại</span></T>
            </button>
            <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase select-none">
              <span translate="no" className="notranslate">Firebase Quota</span>
            </span>
          </div>

          <FirebaseQuotaMonitor
            reports={reports}
            users={users}
            chats={chats}
            onShowToast={(msg) => showToast(msg)}
          />
        </div>
      ) : showTrash ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 relative">
          {/* Trash Header Panel */}
          <div className="bg-slate-900 text-white rounded-xl p-3 shadow-md border-b-4 border-rose-500">
            <div className="flex items-center justify-between mb-1.5">
              <button
                onClick={() => setShowTrash(false)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 flex items-center py-1 rounded-lg border-none cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <T><span translate="no" className="notranslate">Quay Lại</span></T>
              </button>
              <span className="text-[8px] bg-rose-600 px-2 py-0.5 rounded-full font-black uppercase text-white animate-pulse">
                <T><span translate="no" className="notranslate">Thùng Rác</span></T>
              </span>
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              <span>🗑️</span>
              <T><span translate="no" className="notranslate">Bản tin lưu trữ tạm thời</span></T>
            </h2>
            <p className="text-[9px] text-slate-300 leading-normal mt-1">
              <T><span translate="no" className="notranslate">Các bản ghi nhận dưới đây biến mất khỏi luồng làm việc nhưng được lưu lại để khôi phục khi cần.</span></T>
            </p>
          </div>

          {/* Trash Empty Check */}
          {reports.filter((r) => r.isDeleted).length === 0 ? (
            <div className="h-4/5 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
              <span className="text-3xl mb-2">🗑️</span>
              <T className="text-slate-400 text-xs font-semibold"><span translate="no" className="notranslate">Thùng rác trống rỗng.</span></T>
            </div>
          ) : (
            reports
              .filter((r) => r.isDeleted)
              .map((report) => {
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden"
                  >
                    <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <span translate="no" className="notranslate font-black text-slate-800 text-[11px] block truncate leading-tight">
                          {getFactoryDisplayName(report.factory)}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold block mt-0.5">
                          <span translate="no" className="notranslate">{report.timestamp}</span>
                        </span>
                      </div>
                      <div>
                        {report.reportType === "KPH" || report.isAbnormal ? (
                          <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md leading-none select-none">
                            <T><span translate="no" className="notranslate">⚠️ ĐIỂM KPH</span></T>
                          </span>
                        ) : report.reportType === "DSA" || report.isSpotlight ? (
                          <span className="text-[8px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md leading-none select-none">
                            <T><span translate="no" className="notranslate">⭐ ĐIỂM SÁNG (DSA)</span></T>
                          </span>
                        ) : (
                          <span className="text-[8px] font-black bg-slate-400 text-white px-2 py-0.5 rounded-md leading-none select-none">
                            <T><span translate="no" className="notranslate">Chuẩn SOP</span></T>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 text-[10px] text-slate-700 font-bold leading-relaxed whitespace-pre-wrap select-text bg-white">
                      {report.content}
                    </div>

                    {/* Trash Operations panel */}
                    <div className="bg-slate-50 border-t border-slate-100 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (onUpdateReport) {
                            onUpdateReport({ ...report, isDeleted: false });
                            showToast("Đã hoàn tác và phục hồi báo cáo thành công! ♻️");
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <T><span translate="no" className="notranslate">HOÀN TÁC Phục Hồi</span></T>
                      </button>

                      <button
                        onClick={() => {
                          onDeleteReport(report.id, true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 text-[9px] font-black text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1.5 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <T><span translate="no" className="notranslate">XÓA VĨNH VIỄN</span></T>
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      ) : activeBottomTab === "PHAN_TICH" ? (
        <div className={`flex-1 p-4 bg-slate-50 space-y-4 select-none ${isNativeScrollMode ? "overflow-visible h-auto" : "overflow-y-auto"}`}>
          {/* Header Analysis info with custom icon */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className={`p-1.5 rounded-xl text-white ${theme.bg} flex items-center justify-center`}>
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
              <h2 className={`text-xs font-black tracking-tight ${theme.text}`}>
                <T><span translate="no" className="notranslate">Phân Tích Chất Lượng 4M1E1I</span></T>
              </h2>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              <T><span translate="no" className="notranslate">Theo dõi trực quan phân bổ lỗi Không Phù Hợp (KPH) & Điểm Sáng chất lượng (DSA) trên toàn bộ hệ thống Tân Phú.</span></T>
            </p>
          </div>

          {/* Combined Filters Panel for chi nhánh and date ranges */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-6xs space-y-2.5">
            {/* Filter 1: Chọn Chi Nhánh */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span>🏭</span>
                <T><span translate="no" className="notranslate">Chọn Chi Nhánh:</span></T>
              </label>
              <div className="relative">
                <select
                  value={mobileBranchFilter}
                  onChange={(e) => setMobileBranchFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-3xs text-slate-800 transition-all cursor-pointer appearance-none"
                >
                  <option value="Tất cả" translate="no" className="notranslate">
                    Tất cả Chi nhánh
                  </option>
                  {(branches || [])
                    .filter((b) => b.isScoring)
                    .map((b) => (
                      <option key={b.id} value={b.id} translate="no" className="notranslate">
                        {getFactoryDisplayName(b.name)}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                  <span className="text-[8px]">▼</span>
                </div>
              </div>
            </div>

            {/* Filter 2: Định kỳ Thống kê */}
            <div className="space-y-0.5">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>📅</span>
                <T><span translate="no" className="notranslate">Chu Kỳ Thống Kê:</span></T>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100 shadow-inner">
                <button
                  type="button"
                  onClick={() => setMobileTimeFilter("NGAY")}
                  className={`py-1 rounded text-[9px] font-black uppercase transition-all select-none cursor-pointer border-none bg-transparent ${
                    mobileTimeFilter === "NGAY"
                      ? `${theme.bg} text-white shadow-3xs`
                      : "text-slate-550 hover:bg-slate-200/50"
                  }`}
                >
                  <T><span translate="no" className="notranslate">Đọc NGÀY</span></T>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTimeFilter("TUAN")}
                  className={`py-1 rounded text-[9px] font-black uppercase transition-all select-none cursor-pointer border-none bg-transparent ${
                    mobileTimeFilter === "TUAN"
                      ? `${theme.bg} text-white shadow-3xs`
                      : "text-slate-550 hover:bg-slate-200/50"
                  }`}
                >
                  <T><span translate="no" className="notranslate">Đọc TUẦN</span></T>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTimeFilter("THANG")}
                  className={`py-1 rounded text-[9px] font-black uppercase transition-all select-none cursor-pointer border-none bg-transparent ${
                    mobileTimeFilter === "THANG"
                      ? `${theme.bg} text-white shadow-3xs`
                      : "text-slate-550 hover:bg-slate-200/50"
                  }`}
                >
                  <T><span translate="no" className="notranslate">Đọc THÁNG</span></T>
                </button>
              </div>
            </div>
          </div>

          {/* Calculated Statistics block */}
          {(() => {
            const stats = getMobileStats();
            return (
              <>
                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between">
                    <span className="text-[8px] text-slate-550 font-extrabold uppercase tracking-wider block">
                      <T><span translate="no" className="notranslate">Tổng Biến Động</span></T>
                    </span>
                    <span className={`text-lg font-black block mt-0.5 ${theme.text}`}>
                      {stats.total}
                    </span>
                    <span className="text-[7px] text-slate-400 block">
                      <T><span translate="no" className="notranslate">Bản tin ghi nhận</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between border-l-4 border-l-red-500">
                    <span className="text-[8px] text-rose-600 font-extrabold uppercase tracking-wider block">
                      <T><span translate="no" className="notranslate">Lỗi KPH</span></T>
                    </span>
                    <span className="text-lg font-black block text-red-600 mt-0.5">
                      {stats.kph}
                    </span>
                    <span className="text-[7px] text-red-400 block">
                      <T><span translate="no" className="notranslate">Bất thường</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between border-l-4 border-l-emerald-500">
                    <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wider block">
                      <T><span translate="no" className="notranslate">Điểm Sáng DSA</span></T>
                    </span>
                    <span className="text-lg font-black block text-emerald-600 mt-0.5">
                      {stats.dsa}
                    </span>
                    <span className="text-[7px] text-emerald-400 block">
                      <T><span translate="no" className="notranslate">Sáng kiến tốt</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-3xs flex flex-col justify-between border-l-4 border-l-indigo-500">
                    <span className="text-[8px] text-indigo-600 font-extrabold uppercase tracking-wider block">
                      <T><span translate="no" className="notranslate">An Toàn</span></T>
                    </span>
                    <span className="text-lg font-black block text-indigo-650 mt-0.5">
                      {stats.safeRate}%
                    </span>
                    <span className="text-[7px] text-indigo-400 block">
                      <T><span translate="no" className="notranslate">Đạt chuẩn SOP</span></T>
                    </span>
                  </div>
                </div>

                {/* Categories progress */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-3xs space-y-2">
                  <h3 className="text-[9px] font-black uppercase text-slate-600 tracking-wider">
                    <T><span translate="no" className="notranslate">Phân bổ theo M-E-I (4M1E1I)</span></T>
                  </h3>
                  <div className="space-y-2">
                    {(["CON NGƯỜI", "MÁY MÓC", "NGUYÊN VẬT LIỆU", "PHƯƠNG PHÁP", "MÔI TRƯỜNG", "THÔNG TIN"] as Category4M1E1I[]).map((cat) => {
                      const count = stats.counts[cat] || 0;
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      
                      let barColor = "bg-slate-400";
                      if (cat === "CON NGƯỜI") barColor = "bg-indigo-500";
                      else if (cat === "MÁY MÓC") barColor = "bg-green-500";
                      else if (cat === "NGUYÊN VẬT LIỆU") barColor = "bg-fuchsia-400";
                      else if (cat === "PHƯƠNG PHÁP") barColor = "bg-amber-500";
                      else if (cat === "MÔI TRƯỜNG") barColor = "bg-teal-500";
                      else if (cat === "THÔNG TIN") barColor = "bg-slate-500";

                      return (
                        <div key={cat} className="space-y-0.5">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full inline-block bg-slate-300"></span>
                              <T><span translate="no" className="notranslate">{cat}</span></T>
                            </span>
                            <span className="text-slate-505 font-mono">
                              <span translate="no" className="notranslate">{count}</span>
                              <span className="text-[8px] opacity-60 ml-0.5">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30 relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                              style={{ width: `${Math.max(3, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Advice Advisor */}
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 shadow-3xs text-[10px] text-amber-900 leading-relaxed font-semibold">
                  <div className="flex items-center gap-1 font-bold text-amber-800 text-[9px] uppercase mb-1">
                    <span>💡</span>
                    <T><span translate="no" className="notranslate">Khuyến Nghị Cố Vấn QC Độc Lập</span></T>
                  </div>
                  <p>
                    {stats.kph > 0 ? (
                      <T><span translate="no" className="notranslate">Hệ thống phát hiện {stats.kph} điểm lỗi KPH tồn đọng trong chu kỳ. Đề xuất ban kiểm soát ngay lập tức hạ cấp dây chuyền, đánh giá tuân thủ quy chuẩn SOP đối với các yếu tố biến động cao.</span></T>
                    ) : (
                      <T><span translate="no" className="notranslate">Chỉ số an toàn của phân xưởng ghi nhận mức hoàn hảo (100%). Hãy tiếp tục nhân rộng các sáng kiến điểm sáng chất lượng và tuân thủ chặt SOP vận hành mẫu chuẩn.</span></T>
                    )}
                  </p>
                </div>

                {/* Filtered logs */}
                <div className="space-y-1.5 pb-2">
                  <div className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
                    <span>📋</span>
                    <T><span translate="no" className="notranslate">Nhật Ký Biến Động Liên Quan ({stats.filteredReports.length}):</span></T>
                  </div>
                  {stats.filteredReports.length === 0 ? (
                    <div className="text-center py-4 bg-white border border-slate-200 rounded-xl text-[9.5px] italic text-slate-400">
                      <T><span translate="no" className="notranslate">Không có nhật ký phù hợp.</span></T>
                    </div>
                  ) : (
                    stats.filteredReports.slice(0, 5).map((rep) => {
                      let dateDisplay = rep.timestamp;
                      try {
                        const parsed = parseReportTimestamp(rep.timestamp);
                        const d = String(parsed.getDate()).padStart(2, "0");
                        const m = String(parsed.getMonth() + 1).padStart(2, "0");
                        const y = String(parsed.getFullYear()).slice(-2);
                        dateDisplay = `${d}/${m}/${y}`;
                      } catch {
                        // fallback
                      }
                      return (
                        <div 
                          key={rep.id} 
                          className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-3xs flex flex-col gap-1 active:scale-98 transition-all cursor-pointer"
                          onClick={() => {
                            setActiveBottomTab("BAO_CAO");
                            setSearchTerm(rep.uploaderName);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span translate="no" className="notranslate text-[9.5px] font-black text-slate-800 block leading-tight">
                                {getFactoryDisplayName(rep.factory)}
                              </span>
                              <span className="text-[7.5px] font-mono text-slate-405 block mt-0.5">
                                <T><span translate="no" className="notranslate">{dateDisplay}</span></T>
                                <span className="mx-1">|</span>
                                <span translate="no" className="notranslate">{rep.uploaderName}</span>
                              </span>
                            </div>
                            {rep.reportType === "KPH" || rep.isAbnormal ? (
                              <span className="bg-rose-500 text-white font-sans font-black text-[7px] px-1 rounded uppercase tracking-wide">
                                KPH
                              </span>
                            ) : (
                              <span className="bg-emerald-500 text-white font-sans font-black text-[7px] px-1 rounded uppercase tracking-wide">
                                DSA
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] leading-relaxed text-slate-600 font-bold truncate">
                            <T><span translate="no" className="notranslate">{rep.content}</span></T>
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : activeBottomTab === "PHE_DUYET" ? (
        <MobileApprovalView
          users={users}
          currentUser={currentUser}
          theme={theme}
          onUpdateUserStatus={onUpdateUserStatus}
          onUpdateUserRole={onUpdateUserRole}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Top segment control switcher for ADMIN and REVIEWER */}
          {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) && (
            <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-between shrink-0 select-none shadow-3xs">
              <div className="flex bg-slate-100 p-0.5 rounded-lg items-center w-full border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setMobileFeedSubTab("FEED")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-black border-none cursor-pointer transition-all ${
                    mobileFeedSubTab === "FEED"
                      ? `${theme.bg} text-white shadow-sm`
                      : "text-slate-650 hover:text-slate-850 bg-transparent"
                  }`}
                >
                  <T><span translate="no" className="notranslate font-black uppercase">Bản Tin</span></T>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFeedSubTab("PROPOSAL")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black border-none cursor-pointer transition-all relative ${
                    mobileFeedSubTab === "PROPOSAL"
                      ? `${theme.bg} text-white shadow-sm`
                      : "text-slate-650 hover:text-slate-850 bg-transparent"
                  }`}
                >
                  <T><span translate="no" className="notranslate font-black uppercase">Đề Xuất</span></T>
                  {(() => {
                    const pendingCount = reports.filter((r) => {
                      if (r.isDeleted) return false;
                      if (r.isApproved !== false) return false;
                      if (currentUser?.role === UserRole.ADMIN) return true;
                      if (currentUser?.role === UserRole.REVIEWER) {
                        return r.factory === currentUser.branch;
                      }
                      return false;
                    }).length;
                    if (pendingCount === 0) return null;
                    return (
                      <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full block select-none ml-1 animate-pulse leading-none">
                        {pendingCount}
                      </span>
                    );
                  })()}
                </button>
              </div>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex-1 p-3 space-y-3.5 bg-slate-50 relative ${isNativeScrollMode ? "overflow-visible h-auto" : "overflow-y-auto"}`}
          >
        {sortedReports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 bg-opacity-70">
            <T className="text-slate-400 text-xs font-semibold">Không tìm thấy báo cáo nào phù hợp.</T>
          </div>
        ) : (
          sortedReports.map((report) => {
            const isUploader = report.uploaderId === currentUserId;
             return (
              <div
                id={`report-card-${report.id}`}
                key={report.id}
                className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
                  report.reportType === "KPH" || report.isAbnormal
                    ? "border-red-400"
                    : report.reportType === "DSA" || report.isSpotlight
                    ? "border-emerald-400"
                    : "border-blue-500"
                }`}
              >
                {/* Header card info */}
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <T className={`font-black block leading-tight truncate ${theme.text} ${fontSizeClass}`}>{getFactoryDisplayName(report.factory)}</T>
                    <T className="text-[9px] text-slate-400 block font-sans font-semibold mt-0.5">{report.timestamp}</T>
                  </div>
                  <div className="shrink-0">
                    {report.reportType === "KPH" || report.isAbnormal ? (
                      <span className="text-[9px] font-black text-white flex items-center gap-1 bg-red-600 border border-red-700 px-2 py-1 rounded-md leading-none shadow-3xs shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        <T><span translate="no" className="notranslate">⚠️ ĐIỂM KPH</span></T>
                      </span>
                    ) : report.reportType === "DSA" || report.isSpotlight ? (
                      <span className="text-[9px] font-black text-white flex items-center gap-1 bg-emerald-600 border border-emerald-700 px-2 py-1 rounded-md leading-none shadow-3xs shrink-0 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        <T><span translate="no" className="notranslate">⭐ ĐIỂM SÁNG (DSA)</span></T>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Proposal Pending Banner */}
                {report.isApproved === false && (
                  <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-center justify-between select-none">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wide truncate">
                        <T><span translate="no" className="notranslate">Đề xuất chờ phê duyệt</span></T>
                      </span>
                    </div>
                    
                    {/* Reviewer / Admin Action Buttons directly on the mobile card! */}
                    {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Approve button */}
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const hrs = String(now.getHours()).padStart(2, '0');
                            const mns = String(now.getMinutes()).padStart(2, '0');
                            const scs = String(now.getSeconds()).padStart(2, '0');
                            const date = String(now.getDate()).padStart(2, '0');
                            const month = String(now.getMonth() + 1).padStart(2, '0');
                            const year = String(now.getFullYear()).slice(-2);
                            const timeStr = `${hrs}:${mns}:${scs} ${date}/${month}/${year}`;

                            onUpdateReport({
                              ...report,
                              isApproved: true,
                              approvedBy: currentUser?.fullName || "Admin",
                              approvedAt: timeStr,
                              updateLogs: [...(report.updateLogs || []), `Phê duyệt tin bởi ${currentUser?.fullName || "Admin"} (${timeStr})`]
                            });
                            showToast("Đã duyệt đề xuất bài viết này lên Bản tin! 🎉");
                          }}
                          className="bg-emerald-600 active:bg-emerald-700 text-white font-black text-[9px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer uppercase shadow-3xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5px]" />
                          <T><span translate="no" className="notranslate">Duyệt đăng</span></T>
                        </button>

                        {/* Reject / Delete button */}
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteReport(report.id, false);
                            showToast("Đã từ chối bài viết đề xuất! ♻️");
                          }}
                          className="bg-rose-500 active:bg-rose-600 text-white font-black text-[9px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer uppercase shadow-3xs"
                        >
                          <X className="w-3 h-3 stroke-[2.5px]" />
                          <T><span translate="no" className="notranslate">Từ chối</span></T>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Update Information Sub-bar (Hidden in UI as requested, but still recorded in data) */}
                {/* 
                {report.updatedAt && (
                  <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1.5 text-[9px] text-[#065f46]" id={`update-bar-${report.id}`}>
                    <div className="flex items-center gap-1 font-bold">
                      <span>🔄</span>
                      <T>Đã cập nhật lúc:</T>
                      <span translate="no" className="font-mono text-[10px] text-emerald-800 ml-0.5 font-black">{report.updatedAt}</span>
                    </div>
                    {report.updateLogs && report.updateLogs.length > 0 && (
                      <div className="mt-1 flex flex-col gap-0.5 pl-3 border-l-2 border-emerald-200">
                        {report.updateLogs.map((log, idx) => (
                          <div key={idx} translate="no" className="text-[8px] text-emerald-700 leading-normal font-medium">
                            • {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                */}

                {/* Report Image */}
                {report.imageUrl && (
                  <AutoImageSlider
                    imageUrls={report.imageUrls}
                    fallbackUrl={report.imageUrl}
                    isAbnormal={report.isAbnormal}
                    isSpotlight={report.isSpotlight}
                    reportType={report.reportType}
                  />
                )}

                {/* Card Info Section */}
                <div className="p-3 bg-white">
                  {/* Category marker with standard styling */}
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className={`flex items-center font-bold text-xs uppercase select-none ${theme.text}`}>
                      {getCategoryIcon(report.category)}
                      <T>{report.category}</T>
                    </div>
                    {/* Personnel tags */}
                    <div className="text-right">
                      <T className="text-[10px] text-slate-500 font-semibold block">{report.uploaderName}</T>
                    </div>
                  </div>

                  {/* Body description text */}
                  <div className={`pt-2 font-medium leading-relaxed text-slate-705 ${contentFontSizeClass}`}>
                    <T>{report.content}</T>
                  </div>

                  {report.notes && (
                    <div className="mt-2 bg-slate-50 rounded p-2 text-[10px] text-slate-500 italic border-l-2 border-blue-400">
                      <T>Ghi chú: {report.notes}</T>
                    </div>
                  )}

                  {/* Dynamic manager instructions/directives */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 block select-text">
                    {/* List of existing instructions */}
                    {report.directives && report.directives.length > 0 && (
                      <div className="space-y-2 mb-2.5 w-full block">
                        <div className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1 uppercase select-none">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <T>CHỈ ĐẠO:</T>
                        </div>
                        <div className="space-y-1.5 block max-h-48 overflow-y-auto pr-1">
                          {report.directives.map((dir) => (
                            <div key={dir.id} className="bg-amber-50 border border-amber-100 rounded p-2 block text-[11px] leading-relaxed text-amber-900 shadow-3xs">
                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1 select-none">
                                <span className="text-amber-800 font-extrabold flex items-center gap-0.5 animate-shimmer">
                                  <span>🛡️</span>
                                  <T>{dir.author}</T>
                                </span>
                                <span>{dir.timestamp}</span>
                              </div>
                              {editingDirectiveId === dir.id ? (
                                <div className="mt-1.5 space-y-1">
                                  <textarea
                                    value={editingDirectiveText}
                                    onChange={(e) => setEditingDirectiveText(e.target.value)}
                                    className="w-full bg-white border border-amber-200 text-[11px] rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-slate-800 resize-y"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-1.5 select-none">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingDirectiveId(null);
                                        setEditingDirectiveText("");
                                      }}
                                      className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-sans font-black rounded flex items-center gap-0.5 border-none h-6 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                      <T>HỦY</T>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const trimmed = editingDirectiveText.trim();
                                        if (!trimmed) return;
                                        
                                        const updatedDirectives = report.directives.map((d) => {
                                          if (d.id === dir.id) {
                                            return { ...d, text: trimmed };
                                          }
                                          return d;
                                        });
                                        
                                        if (onUpdateReport) {
                                          onUpdateReport({
                                            ...report,
                                            directives: updatedDirectives
                                          });
                                        }
                                        setEditingDirectiveId(null);
                                        setEditingDirectiveText("");
                                      }}
                                      className="p-1 px-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-sans font-black rounded flex items-center gap-0.5 border-none h-6 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      <T>LƯU</T>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start gap-2">
                                  <T className="block font-medium flex-1 break-words">{dir.text}</T>
                                  <div className="flex gap-1 shrink-0 select-none items-center mt-0.5">
                                    {((dir.author === currentUser?.fullName) || currentUser?.role === UserRole.ADMIN) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingDirectiveId(dir.id);
                                          setEditingDirectiveText(dir.text);
                                        }}
                                        className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer border-none bg-transparent p-0.5"
                                        title="Chỉnh sửa chỉ đạo"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    )}
                                    {currentUser?.role === UserRole.ADMIN && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDirectiveToDelete({ report, dirId: dir.id });
                                        }}
                                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border-none bg-transparent p-0.5"
                                        title="Xóa chỉ đạo (Admin)"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input form to submit a new directive */}
                    {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) && (
                      <MobileDirectiveForm
                        report={report}
                        currentUser={currentUser}
                        users={users}
                        onUpdateReport={onUpdateReport}
                        showToast={showToast}
                      />
                    )}
                    {/* BP/ĐV TIẾP NHẬN list display */}
                    {(report.isAbnormal || report.reportType === "KPH") && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5" id={`receivers-section-${report.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-sky-700 uppercase">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          <span translate="no" className="notranslate">BP/ĐV TIẾP NHẬN & XỬ LÝ:</span>
                        </div>
                        {(report.isAbnormal || report.reportType === "KPH") && (
                          <button
                            type="button"
                            onClick={() => {
                              if (editingResolutionReportId === report.id) {
                                setEditingResolutionReportId(null);
                              } else {
                                setEditingResolutionReportId(report.id);
                                setResDeptName(currentUser?.department || "");
                                setResResultText("");
                                setResStatus("Đang xử lý");
                              }
                            }}
                            className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150 cursor-pointer active:scale-95 transition-all"
                          >
                            <span translate="no" className="notranslate">✍️ Ghi nhận kết quả</span>
                          </button>
                        )}
                      </div>

                      {report.sharedBy && report.sharedBy.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {report.sharedBy.map((item, i) => {
                            const deptMatch = item.match(/\(([^)]+)\)/);
                            const deptName = deptMatch ? deptMatch[1] : item;
                            const resForDept = report.resolutions?.find(
                              (r) => r.departmentName.trim().toLowerCase() === deptName.trim().toLowerCase()
                            );
                            
                            return (
                              <span
                                key={i}
                                onClick={() => {
                                  if (report.isAbnormal || report.reportType === "KPH") {
                                    setEditingResolutionReportId(report.id);
                                    setResDeptName(deptName);
                                    setResResultText(resForDept ? resForDept.resultText : "");
                                    setResStatus(resForDept ? resForDept.status : "Đang xử lý");
                                  }
                                }}
                                className={`text-[9px] px-2 py-0.5 rounded border font-bold flex items-center gap-1 cursor-pointer select-none transition-all duration-200 ${
                                  resForDept
                                    ? resForDept.status === "Đã xử lý"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                      : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                    : "bg-sky-50 border-sky-100 text-sky-800 hover:bg-sky-100"
                                }`}
                                title={resForDept ? `Kết quả: ${resForDept.resultText}` : "Click để ghi nhận/cập nhật kết quả"}
                              >
                                <span translate="no" className="notranslate">{item}</span>
                                {resForDept && (
                                  <span className="text-[8px] font-extrabold uppercase ml-0.5">
                                    {resForDept.status === "Đã xử lý" ? "✓" : "⏳"}
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[9px] italic select-none">
                          <span translate="no" className="notranslate">Chưa có bộ phận nào tiếp nhận</span>
                        </span>
                      )}

                      {/* Displaying detailed Resolution logs list */}
                      {(report.isAbnormal || report.reportType === "KPH") && report.resolutions && report.resolutions.length > 0 && (
                        <div className="mt-1.5 p-2 bg-slate-50 border border-slate-150 rounded-lg flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                          <div className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1 select-none">
                            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                            <span translate="no" className="notranslate">KẾT QUẢ XỬ LÝ CHI TIẾT:</span>
                          </div>
                          {report.resolutions.map((res) => (
                            <div key={res.id} className="text-[9px] bg-white p-1.5 rounded border border-slate-100 shadow-3xs relative">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span translate="no" className="notranslate font-bold text-slate-700">
                                  {res.departmentName}
                                </span>
                                <span translate="no" className={`notranslate text-[8px] font-extrabold px-1 py-0.2 rounded border uppercase scale-90 ${
                                  res.status === "Đã xử lý"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {res.status}
                                </span>
                              </div>
                              <p translate="no" className="notranslate text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-slate-200">
                                {res.resultText}
                              </p>
                              <div className="mt-1 text-[7.5px] text-slate-400 font-mono flex items-center justify-between select-none">
                                <span translate="no" className="notranslate">
                                  Đại diện: {res.handlerName}
                                </span>
                                <span>{formatTimestampToDMY(res.updatedAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline form to record or edit resolution */}
                      {editingResolutionReportId === report.id && (
                        <div className="mt-2 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg flex flex-col gap-2 transition-all duration-300">
                          <div className="text-[9.5px] font-bold text-indigo-800 flex items-center justify-between">
                            <span translate="no" className="notranslate">✍️ GHI NHẬN KẾT QUẢ XỬ LÝ KPH:</span>
                            <button
                              type="button"
                              onClick={() => setEditingResolutionReportId(null)}
                              className="text-slate-400 hover:text-slate-600 font-extrabold text-[11px] p-0.5 border-none bg-transparent cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {/* Department input */}
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-extrabold text-indigo-700 uppercase">
                              <span translate="no" className="notranslate">Bộ Phận / Đơn Vị xử lý:</span>
                            </label>
                            <input
                              type="text"
                              value={resDeptName}
                              onChange={(e) => setResDeptName(e.target.value)}
                              placeholder="Ví dụ: Phòng QC, Tổ Cơ Điện..."
                              className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-400"
                            />
                          </div>

                          {/* Status and Action text */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[8px] font-extrabold text-indigo-700 uppercase">
                                <span translate="no" className="notranslate">Trạng thái:</span>
                              </label>
                              <select
                                value={resStatus}
                                onChange={(e) => setResStatus(e.target.value as "Đang xử lý" | "Đã xử lý")}
                                className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1 py-1 focus:outline-none focus:border-indigo-400"
                              >
                                <option value="Đang xử lý">⏳ Đang xử lý</option>
                                <option value="Đã xử lý">✅ Đã xử lý</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[8px] font-extrabold text-indigo-700 uppercase">
                                <span translate="no" className="notranslate">Người thực hiện:</span>
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={currentUser?.fullName || "Kiểm soát viên"}
                                className="w-full text-[9px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-1 focus:outline-none cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Result Description text field */}
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] font-extrabold text-indigo-700 uppercase">
                              <span translate="no" className="notranslate">Nội dung / Kết quả cụ thể:</span>
                            </label>
                            <textarea
                              rows={2}
                              value={resResultText}
                              onChange={(e) => setResResultText(e.target.value)}
                              placeholder="Nhập nội dung xử lý, giải pháp khắc phục..."
                              className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-400 resize-none"
                            />
                          </div>

                          {/* Save & Cancel buttons */}
                          <div className="flex justify-end gap-1.5 pt-1 border-t border-indigo-100/30">
                            <button
                              type="button"
                              onClick={() => setEditingResolutionReportId(null)}
                              className="text-[9px] font-bold text-slate-550 hover:text-slate-700 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer active:scale-95 transition-all"
                            >
                              <span translate="no" className="notranslate">Hủy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!resDeptName.trim()) {
                                  showToast("Vui lòng nhập tên Bộ Phận/ Đơn Vị xử lý! ⚠️");
                                  return;
                                }
                                if (!resResultText.trim()) {
                                  showToast("Vui lòng nhập nội dung kết quả xử lý! ⚠️");
                                  return;
                                }
                                
                                const currentResolutions = report.resolutions ? [...report.resolutions] : [];
                                
                                const getFormattedNow = () => {
                                  const now = new Date();
                                  const d = String(now.getDate()).padStart(2, '0');
                                  const m = String(now.getMonth() + 1).padStart(2, '0');
                                  const y = String(now.getFullYear()).slice(-2);
                                  const h = String(now.getHours()).padStart(2, '0');
                                  const min = String(now.getMinutes()).padStart(2, '0');
                                  const sec = String(now.getSeconds()).padStart(2, '0');
                                  return `${d}/${m}/${y} ${h}:${min}:${sec}`;
                                };

                                const existingIndex = currentResolutions.findIndex(
                                  (r) => r.departmentName.trim().toLowerCase() === resDeptName.trim().toLowerCase()
                                );

                                const newRes: QualityReportResolution = {
                                  id: existingIndex >= 0 ? currentResolutions[existingIndex].id : `res-${Date.now()}`,
                                  departmentName: resDeptName.trim(),
                                  handlerName: currentUser?.fullName || "Kiểm soát viên",
                                  status: resStatus,
                                  resultText: resResultText.trim(),
                                  updatedAt: getFormattedNow()
                                };

                                if (existingIndex >= 0) {
                                  currentResolutions[existingIndex] = newRes;
                                } else {
                                  currentResolutions.push(newRes);
                                }

                                const updatedReport: QualityReport = {
                                  ...report,
                                  resolutions: currentResolutions
                                };

                                if (onUpdateReport) {
                                  onUpdateReport(updatedReport);
                                }

                                setEditingResolutionReportId(null);
                                showToast("Đã lưu kết quả xử lý thành công! ✅");
                              }}
                              className="text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded shadow-xs cursor-pointer active:scale-95 transition-all border-none"
                            >
                              <span translate="no" className="notranslate">Lưu</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* ĐĂNG KÝ NHÂN RỘNG list display */}
                    {(report.reportType === "DSA" || report.isSpotlight) && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1.5" id={`replication-section-${report.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 uppercase">
                            <span>🚀</span>
                            <span translate="no" className="notranslate">ĐĂNG KÝ NHÂN RỘNG:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingReplicationReportId === report.id) {
                                setEditingReplicationReportId(null);
                              } else {
                                setEditingReplicationReportId(report.id);
                                setRepId(null);
                                setRepFactoryName(currentUser?.branch || "");
                                setRepDeptName(currentUser?.department || "");
                                setRepStatus("Đang chuẩn bị");
                                setRepTargetDate("");
                                setRepNotes("");
                                setRepCurrentState("");
                                setRepSupportRequired("");
                              }
                            }}
                            className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 cursor-pointer active:scale-95 transition-all"
                          >
                            <span translate="no" className="notranslate">➕ Đăng ký mới</span>
                          </button>
                        </div>

                        {report.replications && report.replications.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {report.replications.map((rep) => (
                              <span
                                key={rep.id}
                                onClick={() => {
                                  setEditingReplicationReportId(report.id);
                                  setRepId(rep.id);
                                  setRepFactoryName(rep.factoryName);
                                  setRepDeptName(rep.departmentName);
                                  setRepStatus(rep.status);
                                  setRepTargetDate(rep.targetDate);
                                  setRepNotes(rep.notes || "");
                                  setRepCurrentState(rep.currentState || "");
                                  setRepSupportRequired(rep.supportRequired || "");
                                }}
                                className={`text-[9px] px-2 py-0.5 rounded border font-bold flex items-center gap-1 cursor-pointer select-none transition-all duration-200 ${
                                  rep.status === "Đã hoàn thành"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                    : rep.status === "Đang triển khai"
                                    ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                    : "bg-sky-50 border-sky-150 text-sky-800 hover:bg-sky-100"
                                }`}
                                title={`Đại diện: ${rep.registrantName}\nTarget: ${rep.targetDate}\nHiện trạng: ${rep.currentState || rep.notes || ""}\nHỗ trợ: ${rep.supportRequired || ""}`}
                              >
                                <span translate="no" className="notranslate">
                                  {rep.factoryName} - {rep.departmentName}
                                </span>
                                <span className="text-[8px] font-extrabold uppercase ml-0.5">
                                  {rep.status === "Đã hoàn thành" ? "✓" : rep.status === "Đang triển khai" ? "⏳" : "📝"}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[9px] italic select-none">
                            <span translate="no" className="notranslate">Chưa có đơn vị nào đăng ký nhân rộng sáng kiến này</span>
                          </span>
                        )}

                        {/* Detailed Replication logs list */}
                        {report.replications && report.replications.length > 0 && (
                          <div className="mt-1.5 p-2 bg-emerald-50/20 border border-emerald-100 rounded-lg flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                            <div className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1 select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span translate="no" className="notranslate">DANH SÁCH NHÂN RỘNG:</span>
                            </div>
                            {report.replications.map((rep) => (
                              <div key={rep.id} className="text-[9px] bg-white p-1.5 rounded border border-emerald-100/50 shadow-3xs relative">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span translate="no" className="notranslate font-bold text-slate-750">
                                    {rep.factoryName} - {rep.departmentName}
                                  </span>
                                  <span translate="no" className={`notranslate text-[8px] font-extrabold px-1 py-0.2 rounded border uppercase scale-90 ${
                                    rep.status === "Đã hoàn thành"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : rep.status === "Đang triển khai"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-sky-50 text-sky-700 border-sky-200"
                                  }`}>
                                    {rep.status}
                                  </span>
                                </div>
                                {rep.currentState && (
                                  <div translate="no" className="notranslate text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-emerald-200 mb-1">
                                    <strong className="text-emerald-850">1. Hiện trạng:</strong> {rep.currentState}
                                  </div>
                                )}
                                {rep.supportRequired && (
                                  <div translate="no" className="notranslate text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-amber-300">
                                    <strong className="text-amber-850">2. Đề xuất hỗ trợ:</strong> {rep.supportRequired}
                                  </div>
                                )}
                                {!rep.currentState && !rep.supportRequired && rep.notes && (
                                  <p translate="no" className="notranslate text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pl-1.5 border-l border-emerald-200">
                                    {rep.notes}
                                  </p>
                                )}
                                <div className="mt-1 text-[7.5px] text-slate-400 font-mono flex items-center justify-between select-none">
                                  <span translate="no" className="notranslate">
                                    Đăng ký bởi: {rep.registrantName}
                                  </span>
                                  <span translate="no" className="notranslate font-medium bg-emerald-50 px-1 py-0.2 rounded text-emerald-800">
                                    Hạn: {rep.targetDate || "N/A"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline form to record or edit replication */}
                        {editingReplicationReportId === report.id && (
                          <div className="mt-2 p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg flex flex-col gap-2 transition-all duration-300">
                            <div className="text-[9.5px] font-bold text-emerald-800 flex items-center justify-between">
                              <span translate="no" className="notranslate font-black uppercase">
                                {repId ? "📝 CẬP NHẬT ĐĂNG KÝ NHÂN RỘNG" : "🚀 ĐĂNG KÝ NHÂN RỘNG SÁNG KIẾN"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReplicationReportId(null);
                                  setRepId(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 font-extrabold text-[11px] p-0.5 border-none bg-transparent cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                            
                            {/* Branch/Factory & Department in one row */}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                  <span translate="no" className="notranslate">Nhà máy / Chi nhánh:</span>
                                </label>
                                <input
                                  type="text"
                                  value={repFactoryName}
                                  onChange={(e) => setRepFactoryName(e.target.value)}
                                  placeholder="Ví dụ: TPP-TP, TPP-BBM..."
                                  className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                  <span translate="no" className="notranslate">Bộ Phận / Đơn Vị:</span>
                                </label>
                                <input
                                  type="text"
                                  value={repDeptName}
                                  onChange={(e) => setRepDeptName(e.target.value)}
                                  placeholder="Ví dụ: Tổ Cơ Điện, Phòng QC..."
                                  className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            </div>

                            {/* Status, Registrant & Target Date */}
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                  <span translate="no" className="notranslate">Trạng thái:</span>
                                </label>
                                <select
                                  value={repStatus}
                                  onChange={(e) => setRepStatus(e.target.value as any)}
                                  className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1 py-1 focus:outline-none focus:border-emerald-400"
                                >
                                  <option value="Đang chuẩn bị">📝 Chuẩn bị</option>
                                  <option value="Đang triển khai">⏳ Triển khai</option>
                                  <option value="Đã hoàn thành">✅ Hoàn thành</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                  <span translate="no" className="notranslate">Hạn hoàn thành:</span>
                                </label>
                                <input
                                  type="text"
                                  value={repTargetDate}
                                  onChange={(e) => setRepTargetDate(e.target.value)}
                                  placeholder="dd/mm/yy"
                                  className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-emerald-400 font-mono font-bold text-center"
                                />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                  <span translate="no" className="notranslate">Người phụ trách:</span>
                                </label>
                                <input
                                  type="text"
                                  readOnly
                                  value={currentUser?.fullName || "Người đại diện"}
                                  className="w-full text-[9px] font-semibold text-slate-550 bg-slate-100 border border-slate-200 rounded px-1.5 py-1 focus:outline-none cursor-not-allowed"
                                />
                              </div>
                            </div>

                            {/* 1. Mô tả hiện trạng */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                <span translate="no" className="notranslate">1. Mô tả hiện trạng:</span>
                              </label>
                              <textarea
                                rows={2}
                                value={repCurrentState}
                                onChange={(e) => setRepCurrentState(e.target.value)}
                                placeholder="Mô tả chi tiết tình hình thực tế hiện tại ở đơn vị..."
                                className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-emerald-400 resize-none font-sans"
                              />
                            </div>

                            {/* 2. Mong muốn được hỗ trợ */}
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[8px] font-extrabold text-emerald-700 uppercase">
                                <span translate="no" className="notranslate">2. Mong muốn được hỗ trợ:</span>
                              </label>
                              <textarea
                                rows={2}
                                value={repSupportRequired}
                                onChange={(e) => setRepSupportRequired(e.target.value)}
                                placeholder="Đề xuất các nội dung cần điểm sáng, ban chuyên môn điều động nhân sự, công nghệ đến hỗ trợ..."
                                className="w-full text-[9px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-1.5 py-1 focus:outline-none focus:border-emerald-400 resize-none font-sans"
                              />
                            </div>

                            {/* Save & Delete & Cancel buttons */}
                            <div className="flex justify-between items-center pt-1 border-t border-emerald-100/30">
                              <div>
                                {repId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentReps = report.replications ? [...report.replications] : [];
                                      const updatedReps = currentReps.filter((r) => r.id !== repId);
                                      const updatedReport: QualityReport = {
                                        ...report,
                                        replications: updatedReps
                                      };
                                      if (onUpdateReport) {
                                        onUpdateReport(updatedReport);
                                      }
                                      setEditingReplicationReportId(null);
                                      setRepId(null);
                                      showToast("Đã xóa đăng ký nhân rộng! 🗑️");
                                    }}
                                    className="text-[9px] font-bold text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded border border-rose-150 hover:bg-rose-50 cursor-pointer active:scale-95 transition-all bg-transparent"
                                  >
                                    <span translate="no" className="notranslate">Xóa đăng ký</span>
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingReplicationReportId(null);
                                    setRepId(null);
                                  }}
                                  className="text-[9px] font-bold text-slate-550 hover:text-slate-700 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer active:scale-95 transition-all bg-transparent"
                                >
                                  <span translate="no" className="notranslate">Hủy</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!repFactoryName.trim()) {
                                      showToast("Vui lòng nhập tên Chi nhánh/Nhà máy! ⚠️");
                                      return;
                                    }
                                    if (!repDeptName.trim()) {
                                      showToast("Vui lòng nhập tên Bộ Phận/Đơn Vị! ⚠️");
                                      return;
                                    }
                                    if (!repTargetDate.trim()) {
                                      showToast("Vui lòng nhập hạn hoàn thành! ⚠️");
                                      return;
                                    }
                                    
                                    const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
                                    if (!dateRegex.test(repTargetDate.trim())) {
                                      showToast("Định dạng hạn hoàn thành phải là dd/mm/yy (Ví dụ: 30/12/26)! ⚠️");
                                      return;
                                    }

                                    const currentReps = report.replications ? [...report.replications] : [];
                                    
                                    const getFormattedNow = () => {
                                      const now = new Date();
                                      const d = String(now.getDate()).padStart(2, '0');
                                      const m = String(now.getMonth() + 1).padStart(2, '0');
                                      const y = String(now.getFullYear()).slice(-2);
                                      const h = String(now.getHours()).padStart(2, '0');
                                      const min = String(now.getMinutes()).padStart(2, '0');
                                      const sec = String(now.getSeconds()).padStart(2, '0');
                                      return `${d}/${m}/${y} ${h}:${min}:${sec}`;
                                    };

                                    const targetRepId = repId || `rep-${Date.now()}`;
                                    
                                    const newRep: QualityReportReplication = {
                                      id: targetRepId,
                                      factoryName: repFactoryName.trim(),
                                      departmentName: repDeptName.trim(),
                                      registrantName: currentUser?.fullName || "Người đại diện",
                                      status: repStatus,
                                      targetDate: repTargetDate.trim(),
                                      notes: (repCurrentState.trim() + " " + repSupportRequired.trim()).trim(),
                                      currentState: repCurrentState.trim(),
                                      supportRequired: repSupportRequired.trim(),
                                      updatedAt: getFormattedNow()
                                    };

                                    const existingIndex = currentReps.findIndex((r) => r.id === targetRepId);
                                    if (existingIndex >= 0) {
                                      currentReps[existingIndex] = newRep;
                                    } else {
                                      currentReps.push(newRep);
                                    }

                                    const updatedReport: QualityReport = {
                                      ...report,
                                      replications: currentReps
                                    };

                                    if (onUpdateReport) {
                                      onUpdateReport(updatedReport);
                                    }

                                    setEditingReplicationReportId(null);
                                    setRepId(null);
                                    showToast("Đã lưu đăng ký nhân rộng thành công! ✅");
                                  }}
                                  className="text-[9px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded shadow-xs cursor-pointer active:scale-95 transition-all border-none"
                                >
                                  <span translate="no" className="notranslate">Lưu</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer buttons of card (Xóa/Sửa/Like/BP Tiếp Nhận) only for managers or the author */}
                <div className="bg-slate-50 border-t border-slate-100 px-2 py-1.5 flex justify-between items-center select-none text-[10px] font-semibold text-slate-600 gap-1 flex-nowrap">
                  <div className="flex items-center gap-2 shrink-0">
                    {(() => {
                      const isUploader = currentUser?.id === report.uploaderId;
                      const isSpeciallyAuthorized = currentUser?.canSpeciallyEditDelete && isSameBranchOrFactory(currentUser?.branch, report.factory);
                      const isReviewerAtMyBranch = currentUser?.role === UserRole.REVIEWER && isSameBranchOrFactory(currentUser?.branch, report.factory);
                      const isAdmin = currentUser?.role === UserRole.ADMIN;
                      const shouldShow = isUploader || isSpeciallyAuthorized || isReviewerAtMyBranch || isAdmin;

                      if (!shouldShow) return null;

                      const allowed = isDeleteAllowed(report);
                      if (allowed) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteReport(report.id);
                            }}
                            className="flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-110 active:scale-90 text-rose-600 hover:text-rose-800 border-none bg-transparent"
                            title="Xóa bản tin"
                          >
                            <Trash2 className="w-[18px] h-[18px] stroke-[2.2px]" />
                          </button>
                        );
                      } else {
                        return (
                          <button
                            type="button"
                            disabled
                            className="flex items-center justify-center p-1 text-slate-350 opacity-40 cursor-not-allowed select-none border-none bg-transparent"
                            title="Nút xóa đã bị vô hiệu hóa (quá 5 phút)"
                          >
                            <Trash2 className="w-[18px] h-[18px] stroke-[1.8px] text-slate-350" />
                          </button>
                        );
                      }
                    })()}

                    {(() => {
                      const isUploader = currentUser?.id === report.uploaderId;
                      const isSpeciallyAuthorized = currentUser?.canSpeciallyEditDelete && isSameBranchOrFactory(currentUser?.branch, report.factory);
                      const isReviewerAtMyBranch = currentUser?.role === UserRole.REVIEWER && isSameBranchOrFactory(currentUser?.branch, report.factory);
                      const isAdmin = currentUser?.role === UserRole.ADMIN;
                      const shouldShow = isUploader || isSpeciallyAuthorized || isReviewerAtMyBranch || isAdmin;

                      if (!shouldShow) return null;

                      const allowed = isEditAllowed(report);
                      if (allowed) {
                        return (
                          <button
                            type="button"
                            onClick={() => onEditReport(report)}
                            className="flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-110 active:scale-90 text-blue-600 hover:text-blue-800 border-none bg-transparent"
                            title="Chỉnh sửa bản tin"
                          >
                            <Edit className="w-[18px] h-[18px] stroke-[2.2px]" />
                          </button>
                        );
                      } else {
                        return (
                          <button
                            type="button"
                            disabled
                            className="flex items-center justify-center p-1 text-slate-350 opacity-40 cursor-not-allowed select-none border-none bg-transparent"
                            title="Nút chỉnh sửa đã bị vô hiệu hóa (quá 5 phút)"
                          >
                            <Edit className="w-[18px] h-[18px] stroke-[1.8px] text-slate-350" />
                          </button>
                        );
                      }
                    })()}
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto shrink-0">
                    {(() => {
                      const reportChats = (chats || []).filter((c) => c.reportRefId === report.id);
                      const chatCount = reportChats.length;
                      const isOpen = openChatReportId === report.id;
                      
                      return (
                        <div className={`flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg py-0.5 px-1.5 shrink-0 chat-btn-${report.id}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenChatReportId(isOpen ? null : report.id);
                            }}
                            className={`flex items-center justify-center p-1 transition-all hover:scale-115 active:scale-95 cursor-pointer border-none bg-transparent ${
                              isOpen ? "text-blue-600" : "text-slate-400 hover:text-blue-500"
                            }`}
                            title="Thảo luận / Hỏi đáp"
                          >
                            <MessageSquare className={`w-[17px] h-[17px] stroke-[2.3px] ${isOpen ? "fill-blue-500 text-blue-600" : ""}`} />
                          </button>
                          
                          <button
                            type="button"
                            disabled={chatCount === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenChatReportId(isOpen ? null : report.id);
                            }}
                            className={`text-[10px] font-black font-sans px-1.5 py-0.5 rounded cursor-pointer transition-all border-none ${
                              chatCount > 0 
                                ? "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 hover:scale-105" 
                                : "text-slate-300 bg-transparent cursor-default"
                            }`}
                          >
                            <T>{chatCount}</T>
                          </button>
                        </div>
                      );
                    })()}
                    {(() => {
                      const isReportLiked = report.likedBy?.includes(currentUser?.fullName || "Kiểm soát viên") || false;
                      const likesCount = report.likedBy?.length || 0;

                      return (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg py-0.5 px-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleLike(report.id)}
                            className={`flex items-center justify-center p-1 transition-all hover:scale-115 active:scale-90 cursor-pointer border-none bg-transparent ${
                              isReportLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                            }`}
                            title={isReportLiked ? "Bỏ thích" : "Thích"}
                          >
                            <Heart className={`w-[17px] h-[17px] stroke-[2.3px] ${isReportLiked ? "fill-rose-500 text-rose-600" : ""}`} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (likesCount > 0) {
                                setShowLikesListReport(report);
                              }
                            }}
                            disabled={likesCount === 0}
                            className={`text-[10px] font-black font-sans px-1.5 py-0.5 rounded cursor-pointer transition-all border-none ${
                              likesCount > 0 
                                ? "text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 hover:scale-105" 
                                : "text-slate-400 bg-transparent cursor-default"
                            }`}
                            title={likesCount > 0 ? "Xem ai đã thích" : "Chưa có lượt thích"}
                          >
                            <T>{likesCount}</T>
                          </button>
                        </div>
                      );
                    })()}
                    {(() => {
                      const isAcknowledged = report.sharedBy?.some(name => name.startsWith(currentUser?.fullName || "Kiểm soát viên")) || false;
                      return (
                        <button
                          type="button"
                          onClick={() => toggleAcknowledge(report.id)}
                          className={`flex items-center gap-1 p-1 px-1.5 rounded-lg border transition-all hover:scale-110 active:scale-95 cursor-pointer bg-transparent whitespace-nowrap shrink-0 ${
                            isAcknowledged ? "text-sky-700 border-sky-200 bg-sky-50 animate-pulse" : "text-slate-400 hover:text-sky-600 border-slate-200 bg-white"
                          }`}
                          title={isAcknowledged ? "Đã tiếp nhận" : "Tiếp nhận"}
                        >
                          <Check className={`w-3.5 h-3.5 shrink-0 ${isAcknowledged ? "stroke-[3px] text-sky-700" : "stroke-[2px]"}`} />
                          <span className="text-[9.5px] font-black font-sans uppercase tracking-tight whitespace-nowrap"><T>Tiếp nhận/ Xử lý</T></span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Collapsible Chat Box Panel downward drawer */}
                {openChatReportId === report.id && (
                  <div 
                    className={`bg-slate-50 border-t border-slate-100 p-3 flex flex-col gap-2 chat-box-${report.id} select-text`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header line of Active discussion */}
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 select-none">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[10px] tracking-wide uppercase font-sans">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span translate="no" className="notranslate"><T>TRAO ĐỔI THẢO LUẬN</T></span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setOpenChatReportId(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer rounded-full hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Chat Bubble container (Maximum height with scrollbar) */}
                    <div className="max-h-52 overflow-y-auto flex flex-col gap-2.5 p-1">
                      {(() => {
                        const reportChats = (chats || []).filter((c) => c.reportRefId === report.id);
                        if (reportChats.length === 0) {
                          return (
                            <div className="text-center py-6 text-slate-400 italic text-[10px] select-none">
                              <span translate="no" className="notranslate"><T>Chưa có ý kiến thảo luận. Hãy đặt câu hỏi thảo luận tại đây!</T></span>
                            </div>
                          );
                        }
                        return reportChats.map((msg) => {
                          const isMyself = msg.senderName === currentUser?.fullName || msg.senderPhone === currentUser?.phone;
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col max-w-[85%] ${isMyself ? "self-end items-end" : "self-start items-start"}`}
                            >
                              {/* Metadata block containing sender title and role details */}
                              <div className="text-[8.5px] font-bold text-slate-500 mb-0.5 px-0.5 select-none flex items-center gap-1 flex-wrap">
                                <span translate="no" className="notranslate">{msg.senderName}</span>
                                <span className="opacity-60 text-[7px] font-normal font-mono">({msg.senderRole})</span>
                              </div>

                              {/* Rich comment bubble text styled blue for myself and white for others */}
                              <div 
                                className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold leading-normal shadow-xs ${
                                  isMyself 
                                    ? "bg-blue-600 text-white rounded-tr-none text-right" 
                                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none text-left"
                                }`}
                              >
                                <span translate="no" className="notranslate">{msg.message}</span>
                              </div>

                              {/* Formatted Date value displayed as dd/mm/yy */}
                              <div className="text-[7.5px] font-mono text-slate-400 mt-0.5 px-0.5 select-none">
                                {formatTimestampToDMY(msg.timestamp)}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Instant reply send input section */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const input = form.elements.namedItem("messageText") as HTMLInputElement;
                        const text = input.value.trim();
                        if (text && onAddChatMessage) {
                          onAddChatMessage(text, report.id);
                          input.value = "";
                        }
                      }}
                      className="flex items-center gap-1.5 mt-1 border-t border-slate-150 pt-2"
                    >
                      <input 
                        type="text"
                        name="messageText"
                        placeholder="Nhập nội dung trao đổi..."
                        autoComplete="off"
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 font-medium text-slate-800"
                      />
                      <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold rounded-lg py-1 px-3.5 text-[9.5px] font-sans tracking-tight cursor-pointer border-none uppercase transition-all shadow-xs h-[30px] flex items-center justify-center shrink-0"
                      >
                        <span translate="no" className="notranslate"><T>GỬI</T></span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </>)}

      {/* Scroll to Top floating button */}
      {showScrollTop && activeBottomTab === "BAO_CAO" && !showTrash && (
        <button
          type="button"
          onClick={scrollToTop}
          className="absolute bottom-36 right-5 w-10 h-10 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-xl flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}

      {/* Blue Circular float creation trigger */}
      {activeBottomTab === "BAO_CAO" && !showTrash && (
        <button
          onClick={onOpenReportForm}
          className={`absolute bottom-20 right-5 w-10 h-10 text-white rounded-xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-transform z-20 ${theme.hoverBg}`}
        >
          <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}

      {/* Green HOME Floating Action Button on Trash page exactly styled as the screenshot (green circle with white home icon) */}
      {showTrash && (
        <button
          id="float-home-trash"
          type="button"
          onClick={() => {
            setShowTrash(false);
            setActiveBottomTab("BAO_CAO");
            setShowNotifDrawer(false);
            setShowQrCodeView(false);
          }}
          className="absolute bottom-20 right-5 w-[42px] h-[42px] bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-xl transition-all z-50 cursor-pointer border-none"
          title="Trở về Trang Home"
        >
          <Home className="w-[18px] h-[18px] text-white stroke-[2.2px]" />
        </button>
      )}

      {/* Modern bottom navigation tab bar containing Phân Tích & Báo Cáo */}
      <div id="mobile-bottom-nav" className={`bg-slate-50 border-t border-slate-200 grid ${(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) ? "grid-cols-4" : "grid-cols-3"} py-2 text-center text-[9.3px] font-bold select-none shrink-0 font-sans shadow-inner shrink-0`}>
        <button
          type="button"
          onClick={() => {
            if (currentUser?.role === UserRole.ADMIN) {
              setActiveBottomTab("PHAN_TICH");
            } else {
              showToast("Tính năng Phân Tích đang tạm khóa, chỉ dành cho Admin! 🔒");
            }
          }}
          className={`flex flex-col items-center justify-center py-0.5 border-none bg-transparent cursor-pointer transition-colors min-w-0 overflow-hidden ${
            currentUser?.role !== UserRole.ADMIN
              ? "opacity-50 text-slate-400 cursor-not-allowed"
              : activeBottomTab === "PHAN_TICH"
              ? "text-violet-600 font-extrabold"
              : "text-slate-400 hover:text-violet-600"
          }`}
        >
          <div className="relative">
            <BarChart2 className={`w-4 h-4 mx-auto mb-0.5 transition-transform hover:scale-110 ${
              activeBottomTab === "PHAN_TICH" ? "text-violet-600 font-extrabold" : "text-violet-400"
            }`} />
            {currentUser?.role !== UserRole.ADMIN && (
              <Lock className="w-2.5 h-2.5 text-rose-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-200" />
            )}
          </div>
          <T><span translate="no" className="notranslate truncate w-full block text-center">Phân Tích</span></T>
        </button>
        
        <button
          type="button"
          onClick={() => setActiveBottomTab("BAO_CAO")}
          className={`flex flex-col items-center justify-center py-0.5 border-none bg-transparent cursor-pointer transition-colors min-w-0 overflow-hidden ${
            activeBottomTab === "BAO_CAO" ? "text-sky-600 font-extrabold" : "text-slate-400 hover:text-sky-600"
          }`}
        >
          <FileText className={`w-4 h-4 mx-auto mb-0.5 transition-transform hover:scale-110 ${
            activeBottomTab === "BAO_CAO" ? "text-sky-600 font-extrabold" : "text-sky-400"
          }`} />
          <T><span translate="no" className="notranslate truncate w-full block text-center">Home</span></T>
        </button>

        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) && (
          <button
            type="button"
            onClick={() => setActiveBottomTab("PHE_DUYET")}
            className={`flex flex-col items-center justify-center py-0.5 border-none bg-transparent cursor-pointer transition-colors min-w-0 overflow-hidden ${
              activeBottomTab === "PHE_DUYET" ? "text-amber-600 font-extrabold" : "text-slate-400 hover:text-amber-600"
            }`}
          >
            <div className="relative">
              <ClipboardCheck className={`w-4 h-4 mx-auto mb-0.5 transition-transform hover:scale-110 ${
                activeBottomTab === "PHE_DUYET" ? "text-amber-600 font-extrabold" : "text-amber-500"
              }`} />
              {(() => {
                const isRev = currentUser?.role === UserRole.REVIEWER;
                const relevantPending = (users || []).filter((u) => {
                  if (u.status !== UserStatus.PENDING) return false;
                  if (isRev && !isSameBranchOrFactory(currentUser?.branch, u.branch)) return false;
                  return true;
                });
                if (relevantPending.length === 0) return null;
                return (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[7.5px] font-black rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center animate-bounce">
                    {relevantPending.length}
                  </span>
                );
              })()}
            </div>
            <T><span translate="no" className="notranslate truncate w-full block text-center">Duyệt NS</span></T>
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex flex-col items-center justify-center py-0.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer select-none border-none bg-transparent w-full min-w-0 overflow-hidden"
        >
          <LogOut className="w-4 h-4 mx-auto mb-0.5 text-rose-500 hover:text-rose-600 hover:scale-110 transition-transform" />
          <T><span translate="no" className="notranslate truncate w-full block text-center text-[8.3px] font-semibold">{currentUser?.fullName || "Đăng Xuất"}</span></T>
        </button>
      </div>

      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-[#065f46] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-[11px] font-bold z-50 tracking-wide min-w-[280px] justify-center text-center border-2 border-white select-none animate-fadeIn">
          <T>{toastMessage}</T>
        </div>
      )}

      {directiveToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 select-none animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[290px] p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-950 text-sm mb-2">
              <T>Xác nhận xóa chỉ đạo?</T>
            </h3>
            <p className="text-slate-500 text-[11px] mb-5 leading-relaxed">
              <T>Chủ quản có chắc chắn muốn XÓA chỉ đạo này không? Thao tác này không thể khôi phục.</T>
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setDirectiveToDelete(null)}
                className="py-2.5 text-[11px] font-bold border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                <T>QUAY LẠI</T>
              </button>
              <button
                type="button"
                onClick={() => {
                  const { report, dirId } = directiveToDelete;
                  const updatedDirectives = report.directives.filter((d) => d.id !== dirId);
                  if (onUpdateReport) {
                    onUpdateReport({
                      ...report,
                      directives: updatedDirectives
                    });
                    showToast("Đã xóa chỉ đạo thành công! 🗑️");
                  }
                  setDirectiveToDelete(null);
                }}
                className="py-2.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <T>ĐỒNG Ý</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModalReport && (
        <div className="fixed lg:absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 select-none">
          <div className="bg-white rounded-t-3xl w-full max-h-[85%] overflow-y-auto p-5 pb-8 flex flex-col shadow-2xl border-t border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">💬</span>
                <span className="font-extrabold text-[13px] text-slate-800 tracking-tight uppercase">
                  <T>Chia sẻ Zalo & Hệ thống</T>
                </span>
              </div>
              <button
                onClick={() => setShareModalReport(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Explanation box */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-[10px] leading-relaxed text-amber-900 shadow-3xs font-medium shrink-0">
              <span className="font-extrabold text-[#78350f] block mb-1">
                💡 <T>Giải thích hiển thị Zalo</T>
              </span>
              <T>
                Hệ điều hành của bạn không tự động tích hợp Zalo vào danh sách chia sẻ của trình duyệt/Windows. Tân Phú đã thiết kế sẵn tính năng chuyển tiếp tiện dụng dưới đây:
              </T>
            </div>

            {/* Preview text */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 block select-text">
              <div className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider select-none">
                <T>Bản xem trước nội dung sẽ copy:</T>
              </div>
              <div className="text-[10px] text-slate-700 font-mono leading-relaxed whitespace-pre-line max-h-24 overflow-y-auto bg-white p-2 rounded border border-slate-200/60">
                {`🔔 BÁO CÁO THAY ĐỔI 4M1E1I - TÂN PHÚ
---------------------------------
📍 Chi nhánh/Nhà máy: ${shareModalReport.factory}
🕒 Thời gian: ${shareModalReport.timestamp}
👤 Người đăng: ${shareModalReport.uploaderName}
📂 Loại biến động: ${shareModalReport.category}
📝 Nội dung: ${shareModalReport.content}
${shareModalReport.notes ? `✍️ Ghi chú: ${shareModalReport.notes}\n` : ""}${shareModalReport.imageUrl ? `📷 Hình ảnh minh chứng: ${shareModalReport.imageUrl}\n` : ""}
App Link: ${window.location.origin}`}
              </div>
            </div>

            {/* Share action grid */}
            <div className="space-y-2.5 shrink-0">
              {/* Option 1: Zalo Web */}
              <button
                onClick={() => executeShareAction("copy_zalo_web")}
                className="w-full flex items-center gap-3 bg-sky-50 hover:bg-sky-100 border border-sky-150 p-2.5 rounded-xl transition-all active:scale-98 cursor-pointer group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                  ZW
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[11px] text-sky-900 flex items-center gap-1.5">
                    <T>Sao chép & Gửi Zalo Web</T>
                    <span className="bg-sky-200 text-sky-800 text-[8px] font-black px-1 py-0.5 rounded uppercase tracking-wider scale-90 origin-left shrink-0"><T>Khuyên dùng</T></span>
                  </div>
                  <div className="text-[9px] text-sky-700 font-medium truncate">
                    <T>Tự động copy tin nhắn & chuyển sang Zalo Web chat dán vào.</T>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-sky-500 shrink-0 opacity-80" />
              </button>

              {/* Option 2: Zalo App */}
              <button
                onClick={() => executeShareAction("copy_zalo_app")}
                className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-150 p-2.5 rounded-xl transition-all active:scale-98 cursor-pointer group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                  ZA
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[11px] text-blue-900">
                    <T>Mở phần mềm Zalo trên máy</T>
                  </div>
                  <div className="text-[9px] text-blue-700 font-medium truncate">
                    <T>Copy tin nhắn & mở ứng dụng Zalo đang cài đặt để gửi.</T>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0 opacity-80" />
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Option 3: Copy only */}
                <button
                  onClick={() => executeShareAction("copy_only")}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl transition-all active:scale-98 cursor-pointer flex flex-col items-center justify-center text-center gap-1 shadow-3xs"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="font-extrabold text-[10px] text-slate-800"><T>Chỉ copy tin nhắn</T></span>
                  <span className="text-[8px] text-slate-400 font-medium"><T>Lưu clipboard</T></span>
                </button>

                {/* Option 4: Official Zalo Share Inline */}
                <button
                  onClick={() => executeShareAction("zalo_inline")}
                  className="bg-[#e0f2fe] hover:bg-[#bae6fd] border border-[#bae6fd] p-2.5 rounded-xl transition-all active:scale-98 cursor-pointer flex flex-col items-center justify-center text-center gap-1 shadow-3xs"
                >
                  <Share2 className="w-4 h-4 text-sky-600" />
                  <span className="font-extrabold text-[10px] text-sky-850"><T>Gửi liên kết Web</T></span>
                  <span className="text-[8px] text-sky-600 font-medium"><T>Hộp thoại share Zalo</T></span>
                </button>
              </div>

              {/* Option 5: Native OS share */}
              <button
                onClick={() => executeShareAction("native")}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-150 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] py-2.5 rounded-xl transition-all active:scale-98 cursor-pointer border border-slate-250 uppercase"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <T>Chia sẻ qua app khác mặc định</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {showLikesListReport && (() => {
        const activeReport = reports.find(r => r.id === showLikesListReport.id) || showLikesListReport;
        const displayLikes = activeReport.likedBy || [];
        return (
          <div 
            onClick={() => setShowLikesListReport(null)}
            className="fixed lg:absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex items-end justify-center z-50 select-none animate-fadeIn cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-h-[70%] overflow-hidden flex flex-col shadow-2xl border-t border-slate-100 animate-slideUp cursor-default"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-rose-100 shrink-0 bg-rose-50/50">
                <div className="flex items-center gap-1.5 text-rose-600">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-600 animate-pulse" />
                  <span className="font-extrabold text-[12px] uppercase tracking-tight font-sans">
                    <T>DANH SÁCH LƯỢT THÍCH ({displayLikes.length})</T>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLikesListReport(null)}
                  className="w-7 h-7 rounded-full bg-slate-150 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs border-none"
                >
                  ✕
                </button>
              </div>

              {/* List of Who Liked */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30 space-y-2 pb-8">
                {displayLikes.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs font-medium">
                    <T>Chưa có ai yêu thích nội dung này.</T>
                  </div>
                ) : (
                  displayLikes.map((name, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 bg-white shadow-3xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7.5 h-7.5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-xs font-extrabold select-none">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">
                          <T>{name}</T>
                        </span>
                      </div>
                      <span className="text-[9px] bg-rose-50 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-100 tracking-tight flex items-center gap-0.5">
                        ❤️ <T>Thích</T>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Dynamic Notifications System Drawer Overlay */}
      {showNotifDrawer && (
        <div className="fixed lg:absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 select-none animate-fadeIn">
          <div className="bg-white rounded-t-3xl w-full max-h-[85%] overflow-hidden flex flex-col shadow-2xl border-t border-slate-100 animate-slideUp">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1e3a8a] animate-bounce" />
                <span className="font-extrabold text-[13px] text-[#1e3a8a] tracking-tight uppercase">
                  <T>THÔNG BÁO HỆ THỐNG</T>
                </span>
                {unreadCount > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                    <T>MỚI</T> <span translate="no" className="font-mono">{unreadCount}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-blue-600 hover:text-blue-800 text-[10px] font-extrabold transition-colors cursor-pointer mr-1"
                  >
                    <T>ĐỌC TẤT CẢ</T>
                  </button>
                )}
                <button
                  onClick={() => setShowNotifDrawer(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notifications scroll list */}
            <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50/50 space-y-2 pb-8">
              {/* Setup Badging card */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#1e3a8a] flex items-center gap-1 uppercase">
                    ⭐ <T><span translate="no" className="notranslate text-[#1e3a8a] font-extrabold">KÍCH HOẠT BONG BÓNG SỐ</span></T>
                  </span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white flex items-center gap-1 select-none border border-blue-100">
                    <span translate="no" className="notranslate">Huy hiệu:</span>
                    {notificationPermission === "granted" ? (
                      <span translate="no" className="text-emerald-700 font-black notranslate">ĐÃ BẬT</span>
                    ) : notificationPermission === "denied" ? (
                      <span translate="no" className="text-rose-600 font-black notranslate">BỊ KHÓA</span>
                    ) : (
                      <span translate="no" className="text-amber-600 font-black notranslate">CHƯA BẬT</span>
                    )}
                  </span>
                </div>
                
                <p className="text-[9px] text-slate-550 leading-normal">
                  <T><span translate="no" className="notranslate">Để hiển thị bong bóng số thông báo màu đỏ trực tiếp trên biểu tượng ngoài màn hình chính giống như TikTok hoặc Zalo, quý khách cần cài đặt PWA:</span></T>
                </p>

                <div className="space-y-1.5 text-[9px] text-slate-650">
                  <div className="flex gap-1.5 items-start bg-white p-2 rounded-xl border border-blue-50 shadow-3xs">
                    <span className="text-blue-600 font-extrabold shrink-0">1.</span>
                    <div className="leading-relaxed">
                      <span translate="no" className="font-bold text-slate-700 notranslate">Cài đặt Màn hình chính:</span>
                      <span translate="no" className="text-slate-500 notranslate"> Nhấn biểu tượng </span>
                      <span translate="no" className="font-extrabold text-[#1e3a8a] notranslate">Chia sẻ (Safari)</span>
                      <span translate="no" className="text-slate-500 notranslate"> hoặc nút </span>
                      <span translate="no" className="font-extrabold text-[#1e3a8a] notranslate">Menu (Chrome)</span>
                      <span translate="no" className="text-slate-500 notranslate"> rồi chọn </span>
                      <span translate="no" className="font-black text-blue-700 underline notranslate">"Thêm vào Màn hình chính" (Add to Home Screen)</span>
                      <span translate="no" className="text-slate-500 notranslate"> để sử dụng ứng dụng độc lập.</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-start bg-white p-2 rounded-xl border border-blue-50 shadow-3xs">
                    <span className="text-blue-600 font-extrabold shrink-0">2.</span>
                    <div className="flex-1 leading-relaxed">
                      <span translate="no" className="font-bold text-slate-700 notranslate">Cho phép hiển thị số thông báo:</span>
                      <span translate="no" className="text-slate-550 notranslate"> Cấp quyền thông báo cho ứng dụng trên điện thoại của bạn.</span>
                      {notificationPermission !== "granted" ? (
                        <button
                          onClick={handleRequestNotificationPermission}
                          className="mt-1.5 w-full bg-[#1e3a8a] text-white text-[8.5px] font-black py-1.5 px-3 rounded-lg cursor-pointer transition-colors block uppercase shadow-xs border-none"
                        >
                          <T><span translate="no" className="notranslate font-black">YÊU CẦU QUYỀN HIỂN THỊ</span></T>
                        </button>
                      ) : (
                        <div className="mt-1 flex items-center gap-1 text-emerald-700 font-extrabold text-[8.5px]">
                          ✅ <span translate="no" className="notranslate">Đã ủy quyền thành công! Số thông báo sẽ tự động đồng bộ.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <BellOff className="w-7 h-7" />
                  </div>
                  <div className="text-slate-400 text-xs font-bold"><T>Chưa có thông báo nào!</T></div>
                  <div className="text-slate-300 text-[10px] font-medium leading-relaxed max-w-[210px] mx-auto">
                    <T>Mọi thay đổi về bản tin hoặc ý kiến chỉ đạo sẽ xuất hiện tại đây.</T>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isUnread = !readNotifIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 rounded-xl border transition-all active:scale-99 cursor-pointer flex gap-3 relative select-none text-left ${
                        isUnread
                          ? "bg-blue-50/75 border-blue-200 hover:bg-blue-50"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {/* Left Side Icon Indicator */}
                      <div className="shrink-0">
                        {notif.type === "new_report" && (
                          <div className="w-8.5 h-8.5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                            📝
                          </div>
                        )}
                        {notif.type === "new_directive" && (
                          <div className="w-8.5 h-8.5 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                            💬
                          </div>
                        )}
                        {notif.type === "update_report" && (
                          <div className="w-8.5 h-8.5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                            🔄
                          </div>
                        )}
                      </div>

                      {/* Right Side Info */}
                      {notifIdConfirmDlt === notif.id ? (
                        <div className="flex-1 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-rose-650 font-extrabold select-none uppercase tracking-wider">
                            <span translate="no" className="notranslate">Xác nhận xóa?</span>
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setDeletedNotifIds((prev) => [...prev, notif.id]);
                                setNotifIdConfirmDlt(null);
                              }}
                              className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-[9px] px-2.5 py-1 rounded transition-colors cursor-pointer uppercase"
                            >
                              <span translate="no" className="notranslate">Xóa</span>
                            </button>
                            <button
                              onClick={() => setNotifIdConfirmDlt(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[9px] px-2.5 py-1 rounded transition-colors cursor-pointer uppercase"
                            >
                              <span translate="no" className="notranslate">Hủy</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 pr-1 flex justify-between gap-1.5 items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1 flex-wrap">
                              <span className={`text-[10px] tracking-wide block uppercase ${
                                isUnread ? "font-black text-blue-900" : "font-extrabold text-slate-700"
                              }`}>
                                <T>{notif.title}</T>
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold shrink-0 font-mono" translate="no">
                                {notif.timestamp}
                              </span>
                            </div>
                            <p className={`text-[10px] mt-1 leading-normal ${
                              isUnread ? "font-bold text-blue-800" : "font-medium text-slate-500"
                            }`}>
                              <T>{notif.description}</T>
                            </p>
                            {isUnread && (
                              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                            )}
                          </div>
                          
                          {/* Admin Only Delete Trigger */}
                          {currentUser?.role === UserRole.ADMIN && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifIdConfirmDlt(notif.id);
                              }}
                              className="text-slate-400 hover:text-rose-650 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1 mt-0.5"
                              title="Xóa thông báo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {/* Floating HOME Button exactly styled as the screenshot (green circle with white home icon) */}
          <button
            id="float-home-notif"
            type="button"
            onClick={() => {
              setShowNotifDrawer(false);
              setActiveBottomTab("BAO_CAO");
              setShowTrash(false);
              setShowQrCodeView(false);
            }}
            className="absolute bottom-20 right-5 w-[42px] h-[42px] bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-xl transition-all z-50 cursor-pointer border-none"
            title="Trở về Trang Home"
          >
            <Home className="w-[18px] h-[18px] text-white stroke-[2.2px]" />
          </button>
        </div>
      )}

      {/* Online Users Statistics Drawer */}
      {showOnlineUsersDrawer && (
        <div className="fixed lg:absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 select-none animate-fadeIn">
          <div className="bg-white rounded-t-3xl w-full max-h-[85%] overflow-hidden flex flex-col shadow-2xl border-t border-slate-100 animate-slideUp">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 animate-pulse" />
                <span className="font-extrabold text-[13px] text-[#1e3a8a] tracking-tight uppercase">
                  <T>THỐNG KÊ TRỰC TUYẾN</T>
                </span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                  <T>ONLINE</T> <span translate="no" className="font-mono">{onlineCount}</span>
                </span>
              </div>
              <button
                onClick={() => setShowOnlineUsersDrawer(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="p-3 bg-white border-b border-slate-100 space-y-2.5 shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên, Mã nhân sự..."
                  value={onlineSearchTerm}
                  onChange={(e) => setOnlineSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 text-[11px] font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700 font-sans"
                />
                {onlineSearchTerm && (
                  <button
                    onClick={() => setOnlineSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Tab Filters */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setOnlineTabFilter("ONLINE")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    onlineTabFilter === "ONLINE"
                      ? "bg-white text-emerald-750 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <T>ĐANG ONLINE ({onlineCount})</T>
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineTabFilter("ALL")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    onlineTabFilter === "ALL"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <T>TẤT CẢ ({users.length})</T>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 space-y-2 pb-16">
              {(() => {
                const searchClean = onlineSearchTerm.toLowerCase().trim();
                const processedUsers = getOnlineUsers().filter((u) => {
                  const matchesSearch = 
                    u.fullName.toLowerCase().includes(searchClean) ||
                    u.id.includes(searchClean) ||
                    (u.phone && u.phone.includes(searchClean)) ||
                    (u.department && u.department.toLowerCase().includes(searchClean));
                  
                  if (onlineTabFilter === "ONLINE") {
                    return matchesSearch && u.isOnlineSimulated;
                  }
                  return matchesSearch;
                });

                if (processedUsers.length === 0) {
                  return (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-350">
                        <Users className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="text-slate-400 text-xs font-bold leading-normal">
                        <T>Không tìm thấy nhân sự phù hợp!</T>
                      </div>
                    </div>
                  );
                }

                return processedUsers.map((u) => {
                  // Style configurations based on Role
                  let roleColorClasses = "bg-slate-100 text-slate-700";
                  let roleLabel = "Nhân viên";
                  if (u.role === UserRole.ADMIN) {
                    roleColorClasses = "bg-rose-50 text-rose-700 border border-rose-100";
                    roleLabel = "Quản Trị Tối Cao";
                  } else if (u.role === UserRole.REVIEWER) {
                    roleColorClasses = "bg-blue-50 text-blue-700 border border-blue-100";
                    roleLabel = "Ban Kiểm Duyệt";
                  }

                  // Split initials for avatar preview
                  const nameParts = u.fullName.split(" ");
                  const initials = nameParts.length >= 2 
                    ? (nameParts[nameParts.length - 2][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                    : u.fullName.slice(0, 2).toUpperCase();

                  // Random cute theme background for user avatar
                  const colorSeed = u.fullName.charCodeAt(0) + u.fullName.charCodeAt(u.fullName.length - 1);
                  const bgColors = ["bg-blue-600", "bg-indigo-600", "bg-emerald-600", "bg-violet-600", "bg-[#eab308]", "bg-teal-600"];
                  const avatarBg = bgColors[colorSeed % bgColors.length];

                  return (
                    <div 
                      key={u.id}
                      className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 shadow-xs hover:border-slate-200 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full ${avatarBg} text-white flex items-center justify-center font-black text-xs font-sans tracking-tighter`}>
                            <span translate="no" className="notranslate">{initials}</span>
                          </div>
                          
                          {/* Live Pulse status bubble */}
                          {u.isOnlineSimulated ? (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center shadow-md animate-pulse">
                              <span className="w-1.5 h-1.5 bg-green-200 rounded-full animate-ping" />
                            </span>
                          ) : (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-slate-350 rounded-full border border-white shadow-xs" />
                          )}
                        </div>

                        {/* Info details */}
                        <div className="text-left font-sans flex-1">
                          {/* Name heading */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[12px] font-black text-slate-800 tracking-tight leading-tight">
                              <T>{u.fullName}</T>
                            </span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase scale-90 ${roleColorClasses}`}>
                              <T>{roleLabel}</T>
                            </span>
                          </div>

                          {/* ID and branch code info */}
                          <p className="text-[9.5px] text-slate-400 font-bold mt-0.5">
                            <T>Mã NS:</T> <span translate="no" className="font-mono text-slate-500 mr-2">{u.id}</span>
                            <T>SĐT:</T> <span translate="no" className="font-mono text-slate-500">{u.phone || "---"}</span>
                          </p>

                          {/* Department details */}
                          <p className="text-[9px] text-slate-500 font-bold mt-0.5 line-clamp-1 max-w-[190px]">
                            <T>{u.department || u.branch || "---"}</T>
                          </p>
                        </div>
                      </div>

                      {/* Right-side alignment display (Last Active time marker or live badge) */}
                      <div className="text-right flex flex-col items-end shrink-0 select-none">
                        {u.isOnlineSimulated ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[8.5px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse border border-emerald-100">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                            <T>ĐANG HOẠT ĐỘNG</T>
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                            <T>OFFLINE</T>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
          
          {/* Drawer Close Floating Control */}
          <button
            type="button"
            onClick={() => setShowOnlineUsersDrawer(false)}
            className="absolute bottom-20 right-5 w-[42px] h-[42px] bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-xl transition-all z-50 cursor-pointer border-none"
            title="Trở về Trang Home"
          >
            <Home className="w-[18px] h-[18px] text-white stroke-[2.2px]" />
          </button>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed lg:absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] select-none animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-[280px] p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <LogOut className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-extrabold text-[13px] text-slate-800 tracking-tight uppercase mb-1.5">
              <T>Xác nhận Đăng Xuất</T>
            </h3>
            <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed mb-4">
              <T>Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng chất lượng 4M1E1I?</T>
            </p>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] py-2 rounded-xl transition-all cursor-pointer uppercase border-none"
              >
                <T>Quay Lại</T>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] py-2 rounded-xl shadow-md cursor-pointer transition-all uppercase border-none"
              >
                <T>Đăng Xuất</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {showScreenshotMenu && (
        <div className="fixed lg:absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-[70] select-none animate-fadeIn">
          <div className="bg-white rounded-t-3xl w-full max-h-[85%] overflow-hidden flex flex-col shadow-2xl border-t border-slate-100 animate-slideUp">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 animate-pulse" />
                <span className="font-extrabold text-[13px] text-[#1e3a8a] tracking-tight uppercase">
                  <T>CHỤP CUỘN MÀN HÌNH 📸</T>
                </span>
              </div>
              <button
                onClick={() => setShowScreenshotMenu(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Menu options content */}
            <div className="p-4 bg-slate-50/50 space-y-3 pb-8 overflow-y-auto">
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed text-center mb-1">
                <T>Chọn phương thức phù hợp nhất với thiết bị của bạn để chụp lại toàn bộ báo cáo chất lượng 4M1E1I.</T>
              </p>

              {/* Option 1: Auto capture using html2canvas */}
              <button
                onClick={() => {
                  setShowScreenshotMenu(false);
                  handleCaptureScrollingScreenshot();
                }}
                disabled={isCapturingScreenshot}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-start gap-3.5 text-left transition-all active:scale-98 shadow-xs cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11.5px] font-extrabold text-slate-800 flex items-center gap-1.5 leading-tight">
                    <T>PHƯƠNG ÁN 1: CHỤP TỰ ĐỘNG (FILE PNG)</T>
                    {isCapturingScreenshot && <span className="text-[8px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded animate-pulse">RUNNING</span>}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    <T>Hệ thống tự động cuộn hết danh sách báo cáo, chụp lại ảnh nét cao và tự động tải file ảnh PNG về máy bạn.</T>
                  </p>
                </div>
              </button>

              {/* Option 2: Native Scroll Capture */}
              <button
                onClick={() => {
                  setShowScreenshotMenu(false);
                  if (setIsNativeScrollActive) {
                    setIsNativeScrollActive(true, sortedReports);
                  } else {
                    setIsNativeScrollMode(true);
                  }
                }}
                className={`w-full hover:bg-slate-50 border p-3.5 rounded-2xl flex items-start gap-3.5 text-left transition-all active:scale-98 shadow-xs cursor-pointer ${
                  isNativeScrollActive || isNativeScrollMode ? "bg-amber-50/50 border-amber-300" : "bg-white border-slate-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isNativeScrollActive || isNativeScrollMode ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-600"}`}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11.5px] font-extrabold text-slate-800 flex items-center gap-1.5 leading-tight">
                    <T>PHƯƠNG ÁN 2: CHỤP HỆ THỐNG ĐIỆN THOẠI</T>
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded">KHUYÊN DÙNG</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                    <T>Bung dài màn hình tạm thời để bạn sử dụng chức năng "Chụp cuộn" mặc định có sẵn trên điện thoại của mình (bấm phím cứng). Cực kỳ ổn định và sắc nét không giới hạn chiều dài.</T>
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
