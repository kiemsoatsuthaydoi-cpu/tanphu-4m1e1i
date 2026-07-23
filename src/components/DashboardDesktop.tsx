import React, { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import ReactMarkdown from "react-markdown";
import {
  Users,
  Settings,
  BarChart4,
  Database,
  FileSpreadsheet,
  AlertOctagon,
  MessageSquare,
  UserCheck,
  Building,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  FileX,
  Sliders,
  Download,
  Upload,
  Smartphone,
  CloudLightning,
  UserMinus,
  Check,
  X,
  Zap,
  Lock,
  Unlock,
  Send,
  Bell,
  Sparkles,
  Bot,
  Brain,
  Search,
  Eye,
  EyeOff,
  Camera,
  Package,
  ShoppingCart,
  FileText,
  CheckSquare,
  Info,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Globe,
  Megaphone,
  Pencil,
  Clock,
  Heart,
  Share2,
  Pin,
  Tag,
  MessageCircle,
  Filter,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  Award
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Line,
  ComposedChart
} from "recharts";
import { T } from "./TranslateText";
import {
  User,
  UserRole,
  UserStatus,
  QualityReport,
  Category4M1E1I,
  Company,
  Branch,
  Department,
  BroadcastNotice,
  ChatMessage,
  ProductionRequest,
  OrderImplementation,
  CatalogProduct,
  CatalogMold,
  ProductionRequestStatus,
  ProductionRequestItem,
  AppNotification,
  ForumTopic,
  ForumReply,
  ForumTopicCategory,
  ForumTopicStatus,
  ErrorCatalogItem,
  BadgePointConfigItem,
  getBadgeScore
} from "../types";
import { parseReportTimestamp } from "../utils/notificationHelper";
import { STANDARDIZED_QC_DEPT } from "../data";
import { generateDailyReportPDF } from "../utils/pdfGenerator";
import { formatNameCapitalized, canUserManageDirective, isSameBranchOrFactory } from "../utils/branchHelpers";
import OrderPipeline from "./OrderPipeline";
import { MentionInput, MentionTextArea } from "./MentionTextArea";
import FirebaseQuotaMonitor from "./FirebaseQuotaMonitor";
import StatisticsDashboard from "./StatisticsDashboard";
import ProgressTrackingDashboard from "./ProgressTrackingDashboard";
import BadgeStatisticsDashboard from "./BadgeStatisticsDashboard";
import { compressAvatar, getCategoryFallbackImage } from "../utils/imageProcessor";
import { findUser, resolveUploaderInfo, resolveBadgeGiverInfo, resolveEvaluatorInfo, resolveSenderInfo } from "../utils/userResolver";


interface DashboardDesktopProps {
  currentUser: User;
  users: User[];
  reports: QualityReport[];
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  broadcasts: BroadcastNotice[];
  chats: ChatMessage[];
  offlineMode: boolean;
  onUpdateUserStatus: (id: string, status: UserStatus) => void;
  onUpdateUserRole: (id: string, role: UserRole) => void;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onAddCompany: (c: Company) => void;
  onAddBranch: (b: Branch) => void;
  onAddDepartment: (d: Department) => void;
  onUpdateCompany?: (oldId: string, c: Company) => void;
  onUpdateBranch?: (oldId: string, b: Branch) => void;
  onUpdateDepartment?: (oldId: string, d: Department) => void;
  onDeleteCompany: (id: string) => void;
  onDeleteBranch: (id: string) => void;
  onDeleteDepartment: (id: string) => void;
  onAddBroadcast: (notice: string, type: string) => void;
  onAddChatMessage: (
    msg: string,
    reportRefId?: string,
    threadId?: string,
    threadTitle?: string,
    threadCategory?: string
  ) => void;
  onLogout: () => void;
  onToggleMobilePreview: () => void;

  // SCM pipeline props
  productionRequests: ProductionRequest[];
  setProductionRequests: React.Dispatch<React.SetStateAction<ProductionRequest[]>>;
  productionRequestItemsMap: Record<string, ProductionRequestItem[]>;
  setProductionRequestItemsMap: React.Dispatch<React.SetStateAction<Record<string, ProductionRequestItem[]>>>;
  orderImplementations: OrderImplementation[];
  setOrderImplementations: React.Dispatch<React.SetStateAction<OrderImplementation[]>>;
  productsCatalog: CatalogProduct[];
  setProductsCatalog: React.Dispatch<React.SetStateAction<CatalogProduct[]>>;
  moldsCatalog: CatalogMold[];
  setMoldsCatalog: React.Dispatch<React.SetStateAction<CatalogMold[]>>;
  onUpdateReport?: (report: QualityReport) => void;
  onUpdateUser?: (updatedUser: User, oldId?: string) => void;
  onForceSyncMetadata?: () => Promise<void>;
  onForceSyncUsers?: () => Promise<void>;
  onDeleteReport?: (id: string, forcePermanent?: boolean) => void;
  onShowToast?: (message: string, type?: "success" | "error" | "warning" | "info") => void;
  onDeleteBroadcast?: (id: string) => void;
  tickerConfig?: { text: string; speed: number; spacing: number };
  onUpdateTickerConfig?: (config: { text: string; speed: number; spacing: number }) => void;
  aiKnowledgeText?: string;
  onUpdateAiKnowledge?: (newText: string) => void;
  systemNotifications?: AppNotification[];
  onDeleteNotification?: (id: string) => void;
  readNotifIds?: string[];
  setReadNotifIds?: React.Dispatch<React.SetStateAction<string[]>>;
  onExportBackup?: () => void;
  onImportBackup?: (jsonData: string) => Promise<boolean>;

  // Forum properties
  topics?: ForumTopic[];
  replies?: ForumReply[];
  onAddForumTopic?: (title: string, description: string, category: ForumTopicCategory) => void;
  onAddForumReply?: (topicId: string, message: string) => void;
  onUpdateForumTopicStatus?: (topicId: string, status: ForumTopicStatus) => void;
  onToggleForumTopicPin?: (topicId: string) => void;

  // Error Catalog properties
  errorCatalog?: ErrorCatalogItem[];
  onAddErrorCatalogItem?: (item: ErrorCatalogItem) => void;
  onUpdateErrorCatalogItem?: (code: string, updated: ErrorCatalogItem) => void;
  onDeleteErrorCatalogItem?: (code: string) => void;

  isQcFeatureEnabled?: boolean;
  onToggleQcFeature?: (enabled: boolean) => void;
}

interface DesktopThumbnailSliderProps {
  imageUrls?: string[];
  fallbackUrl: string;
}

function DesktopThumbnailSlider({ imageUrls, fallbackUrl }: DesktopThumbnailSliderProps) {
  const list = imageUrls && imageUrls.length > 0 ? imageUrls : [fallbackUrl];
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  // States for zoom and pan
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % list.length);
    resetZoom();
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + list.length) % list.length);
    resetZoom();
  };

  const selectImage = (i: number) => {
    setIndex(i);
    resetZoom();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = prev - 0.5;
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleToggleZoom = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = prev - 0.25;
        if (next <= 1) {
          setPosition({ x: 0, y: 0 });
          return 1;
        }
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Bounds limit based on scale
    const limit = (scale - 1) * 200;
    setPosition({
      x: Math.max(-limit, Math.min(limit, newX)),
      y: Math.max(-limit, Math.min(limit, newY))
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (list.length <= 1 || zoomOpen) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [list, zoomOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetZoom();
          setZoomOpen(true);
        }}
        className="inline-block border border-slate-200 rounded p-0.5 bg-slate-50 relative group overflow-hidden focus:outline-none hover:border-blue-500"
      >
        <div className="w-10 h-8 relative overflow-hidden">
          {list.map((url, i) => (
            <img
              key={url + i}
              src={url}
              alt="Thumb"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover rounded cursor-zoom-in group-hover:scale-110 transition-all duration-1000 ${
                i === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-0"
              }`}
            />
          ))}
        </div>
        {list.length > 1 && (
          <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[8px] font-black px-1 rounded-tl leading-none scale-90 z-20">
            {list.length}
          </span>
        )}
      </button>

      {/* Elegant lightbox Zoom overlay modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 bg-slate-950/90 z-[1000] flex flex-col items-center justify-center p-4 backdrop-blur-md transition-opacity select-none"
          onClick={() => setZoomOpen(false)}
        >
          <div
            className="bg-slate-900 rounded-3xl p-5 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Info and Actions */}
            <div className="flex items-center justify-between mb-3 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 font-mono">
                  <span translate="no" className="notranslate">{index + 1} / {list.length}</span>
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  <T><span translate="no" className="notranslate">Kéo chuột để di chuyển • Cuộn chuột để Thu phóng • Click đúp để đặt lại</span></T>
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* Zoom out */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 1}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 focus:outline-none transition-all disabled:opacity-40 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                {/* Current scale display */}
                <span className="text-xs font-mono bg-slate-800 rounded-xl border border-slate-700 px-2.5 py-1.5 min-w-[50px] text-center font-bold">
                  <span translate="no" className="notranslate">{scale.toFixed(1)}x</span>
                </span>
                {/* Zoom in */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 4}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 focus:outline-none transition-all disabled:opacity-40 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                {/* Reset Zoom */}
                <button
                  type="button"
                  onClick={resetZoom}
                  disabled={scale === 1 && position.x === 0 && position.y === 0}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-500 rounded-xl border border-slate-700 focus:outline-none transition-all disabled:opacity-40 cursor-pointer"
                  title="Đặt lại"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                {/* Close Button */}
                <button
                  onClick={() => setZoomOpen(false)}
                  className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white flex items-center justify-center transition-all shadow-lg font-black ml-2 cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main view container where dragging and zooming takes place */}
            <div 
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onDoubleClick={handleToggleZoom}
              className={`flex-1 overflow-hidden min-h-[420px] max-h-[68vh] relative rounded-2xl bg-black flex items-center justify-center border border-slate-850 select-none ${
                scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
              }`}
            >
              <img
                src={list[index]}
                alt="Zoomable detailed view"
                referrerPolicy="no-referrer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                className="max-h-[66vh] max-w-full object-contain pointer-events-none"
              />

              {/* Prev image button */}
              {list.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-3 w-10 h-10 rounded-full bg-slate-900/70 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-805 transition-all font-bold text-lg select-none z-30 cursor-pointer"
                >
                  ◀
                </button>
              )}

              {/* Next image button */}
              {list.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-3 w-10 h-10 rounded-full bg-slate-900/70 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-805 transition-all font-bold text-lg select-none z-30 cursor-pointer"
                >
                  ▶
                </button>
              )}
            </div>

            {/* Bottom dots list */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-2">
                <span translate="no" className="notranslate">📂</span> <T><span translate="no" className="notranslate">Xem ảnh minh chứng thực tế:</span></T>
              </span>
              <div className="flex gap-1.5 overflow-x-auto max-w-lg px-2">
                {list.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => selectImage(i)}
                    className={`h-5 px-2.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                      i === index 
                        ? "bg-blue-600 text-white ring-2 ring-blue-400 scale-105" 
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    <span translate="no" className="notranslate">{i + 1}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-black rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  <T><span translate="no" className="notranslate">◀ TRƯỚC</span></T>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-lg transition-all cursor-pointer"
                >
                  <T><span translate="no" className="notranslate">TIẾP ▶</span></T>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DesktopDirectiveForm({
  r,
  currentUser,
  users,
  onUpdateReport
}: {
  r: QualityReport;
  currentUser: User;
  users: User[];
  onUpdateReport?: (report: QualityReport) => void;
}) {
  const [text, setText] = useState("");
  const canManage = canUserManageDirective(currentUser, r.factory);

  if (!canManage) {
    const roleUpper = (currentUser?.role || "").toString().toUpperCase();
    const isManagerRole =
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.REVIEWER ||
      roleUpper.includes("DUYỆT") ||
      roleUpper.includes("ADMIN");

    if (!isManagerRole) return null;

    const isSameBranch = isSameBranchOrFactory(currentUser?.branch, r.factory);
    if (isSameBranch) return null;

    const userBranchName = currentUser?.branch || "Chi nhánh khác";
    const reportBranchName = r.factory || "Chi nhánh này";

    return (
      <div className="mt-2 p-2 bg-amber-50/90 border border-amber-200/90 rounded flex items-center gap-2 text-[10px] text-amber-900 font-medium select-none shadow-3xs">
        <span className="text-xs shrink-0">🔒</span>
        <span className="leading-snug">
          <T>Tài khoản của bạn thuộc</T> <strong className="text-amber-950 font-bold">{userBranchName}</strong>. <T>Bạn chỉ có quyền xem chỉ đạo của</T> <strong className="text-amber-950 font-bold">{reportBranchName}</strong>.
        </span>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = text.trim();
    if (!val) return;

    const dateObj = new Date();
    const currentSingaporeTime = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() + 420) * 60000);
    const yy = String(currentSingaporeTime.getFullYear()).slice(-2);
    const mm = String(currentSingaporeTime.getMonth() + 1).padStart(2, "0");
    const dd = String(currentSingaporeTime.getDate()).padStart(2, "0");
    const timeStr = currentSingaporeTime.toTimeString().split(" ")[0];
    const stamp = `${timeStr} ${dd}/${mm}/${yy}`;

    const newDir = {
      id: Math.random().toString(36).substr(2, 9),
      text: val,
      author: currentUser?.fullName || "Cấp quản lý",
      timestamp: stamp
    };

    const updatedReport = {
      ...r,
      directives: [...(r.directives || []), newDir]
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-1 items-center">
      <MentionInput
        users={users}
        value={text}
        onChange={setText}
        placeholder="Chỉ đạo (mặc định ghi mờ bên trong ô)..."
        className="flex-1 bg-slate-50 border border-slate-200 text-[10px] rounded px-2 py-1 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all select-text"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 px-3.5 py-1 text-[9px] text-white font-black rounded uppercase cursor-pointer shrink-0 flex items-center justify-center"
      >
        <T>GỬI</T>
      </button>
    </form>
  );
}

function DesktopQCConfirmation({
  r,
  reports = [],
  currentUser,
  errorCatalog,
  onUpdateReport,
  onAddErrorCatalogItem
}: {
  r: QualityReport;
  reports?: QualityReport[];
  currentUser: User;
  errorCatalog: ErrorCatalogItem[];
  onUpdateReport?: (report: QualityReport) => void;
  onAddErrorCatalogItem?: (item: ErrorCatalogItem) => void;
}) {
  // Check if current user is authorized to confirm.
  // "Trưởng bộ phận/ đơn vị Phòng Quản lý chất lượng của chi nhánh đó xác nhận."
  const isAuthorized = currentUser.role === UserRole.ADMIN ||
    currentUser.department?.toUpperCase().includes("QUẢN LÝ CHẤT LƯỢNG") ||
    currentUser.department?.toUpperCase().includes("QC") ||
    currentUser.role === UserRole.REVIEWER;

  const [selectedCode, setSelectedCode] = useState(r.errorCode || "");
  const [isOpen, setIsOpen] = useState(false);

  // States for adding a new error code
  const [showAddModal, setShowAddModal] = useState(false);
  const [newErrorCode, setNewErrorCode] = useState("");
  const [newErrorName, setNewErrorName] = useState("");
  const [newErrorDesc, setNewErrorDesc] = useState("");

  const isRepeated = React.useMemo(() => {
    const codeToCheck = selectedCode || r.errorCode;
    if (!codeToCheck) return false;
    const sameCodeReports = (reports || []).filter(item => !item.isDeleted && item.errorCode === codeToCheck);
    if (r.errorCode === codeToCheck) {
      return sameCodeReports.length > 1;
    } else {
      return sameCodeReports.length > 0;
    }
  }, [selectedCode, r.errorCode, reports]);

  const repeatCount = React.useMemo(() => {
    const codeToCheck = selectedCode || r.errorCode;
    if (!codeToCheck) return 0;
    return (reports || []).filter(item => !item.isDeleted && item.errorCode === codeToCheck).length;
  }, [selectedCode, r.errorCode, reports]);



  const handleConfirm = () => {
    if (!selectedCode) {
      alert("Vui lòng chọn một mã lỗi để xác nhận.");
      return;
    }

    const dateObj = new Date();
    const hrs = String(dateObj.getHours()).padStart(2, '0');
    const mns = String(dateObj.getMinutes()).padStart(2, '0');
    const scs = String(dateObj.getSeconds()).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    const stamp = `${hrs}:${mns}:${scs} ${dd}/${mm}/${yy}`;

    const updated = {
      ...r,
      errorCode: selectedCode,
      qcConfirmed: true,
      qcConfirmedBy: currentUser.fullName,
      qcConfirmedAt: stamp
    };

    if (onUpdateReport) {
      onUpdateReport(updated);
    }
  };

  const handleCancelConfirm = () => {
    const updated = {
      ...r,
      qcConfirmed: false,
      qcConfirmedBy: undefined,
      qcConfirmedAt: undefined
    };
    if (onUpdateReport) {
      onUpdateReport(updated);
    }
  };

  const { detectedIsBBM, detectedIsBBC } = React.useMemo(() => {
    let isBBM = r.factory?.toUpperCase().includes("BBM") || r.uploaderDepartment?.toUpperCase().includes("BBM");
    let isBBC = r.factory?.toUpperCase().includes("BBC") || r.uploaderDepartment?.toUpperCase().includes("BBC");

    if (!isBBM && !isBBC) {
      const textToSearch = `${r.content || ""} ${r.notes || ""} ${r.directives?.map(d => d.text).join(" ") || ""}`.toLowerCase();
      
      const bbmKeywords = [
        "màng", "túi", "cuộn", "ghép", "chia", "cắt", "mềm", "film", "opp", "cpp", "laminat", "quai", "đế túi", "hàn nhiệt", "nhăn màng", "xước màng", "bong tách", "lỗi in"
      ];
      const bbcKeywords = [
        "cứng", "nhựa", "hộp", "chai", "nắp", "bavia", "phôi", "thổi", "ép", "biến dạng", "cong vênh", "cháy khét", "vết cháy", "thiếu liệu", "nhựa bavia"
      ];

      const bbmScore = bbmKeywords.filter(kw => textToSearch.includes(kw)).length;
      const bbcScore = bbcKeywords.filter(kw => textToSearch.includes(kw)).length;

      if (bbmScore > bbcScore) {
        isBBM = true;
      } else if (bbcScore > bbmScore) {
        isBBC = true;
      }
    }

    return { detectedIsBBM: !!isBBM, detectedIsBBC: !!isBBC };
  }, [r]);

  const [qcCategoryFilter, setQcCategoryFilter] = useState<"BBM" | "BBC" | "ALL" | "AUTO">("AUTO");
  const [descExpanded, setDescExpanded] = useState(false);

  const actualCategoryFilter = React.useMemo(() => {
    if (qcCategoryFilter !== "AUTO") return qcCategoryFilter;
    if (detectedIsBBM && !detectedIsBBC) return "BBM";
    if (detectedIsBBC && !detectedIsBBM) return "BBC";
    return "ALL";
  }, [qcCategoryFilter, detectedIsBBM, detectedIsBBC]);

  const [newErrorCategory, setNewErrorCategory] = useState<"BBM" | "BBC">(() => {
    if (detectedIsBBC && !detectedIsBBM) return "BBC";
    return "BBM";
  });

  const filteredErrors = errorCatalog.filter(x => {
    if (actualCategoryFilter === "BBM") return x.category === "BBM";
    if (actualCategoryFilter === "BBC") return x.category === "BBC";
    return true;
  });

  const matchedErr = errorCatalog.find(x => x.code === (r.errorCode || selectedCode));

  const showPulse = isAuthorized && !r.qcConfirmed && !selectedCode;
  const showConfirmPulse = isAuthorized && !r.qcConfirmed && selectedCode;

  return (
    <div className="mt-2 text-xs">
      {r.qcConfirmed ? (
        <div className="p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="space-y-0.5 bg-white p-1.5 rounded border border-slate-100 relative pr-12">
            <div className="text-[10px] text-slate-750 leading-normal font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-emerald-600 mr-0.5">🛡️</span>
                <span translate="no" className="notranslate">QC xác nhận: </span>
                <span className="font-black text-rose-700">[{r.errorCode}]</span> - {matchedErr?.name || <span translate="no" className="notranslate">Lỗi chung</span>}
                {isRepeated && (
                  <span className="text-[8.5px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none select-none uppercase shadow-3xs scale-95">
                    <AlertTriangle className="w-2 h-2 drop-shadow-[0_0_6px_rgba(255,229,0,1)] animate-[pulse_0.4s_infinite] shrink-0 scale-110" fill="#FFE500" stroke="#000000" strokeWidth={2.5} />
                    <T><span translate="no" className="notranslate">LẶP LẠI ({repeatCount})</span></T>
                  </span>
                )}
              </div>
              {isAuthorized && (
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  className="absolute top-1 right-1 text-[8.5px] text-rose-600 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1 py-0.5 rounded transition-all cursor-pointer shadow-3xs"
                >
                  <span translate="no" className="notranslate">Hủy</span>
                </button>
              )}
            </div>
            {matchedErr?.description && (
              <div 
                onClick={() => setDescExpanded(!descExpanded)}
                className={`text-[9.5px] text-slate-500 italic cursor-pointer hover:text-slate-700 transition-colors ${descExpanded ? "" : "line-clamp-1"}`}
                title="Bấm để xem đầy đủ / thu gọn diễn giải"
              >
                <span translate="no" className="notranslate">Diễn giải: </span>{matchedErr.description}
                {!descExpanded && matchedErr.description.length > 50 && (
                  <span className="text-[8.5px] text-blue-600 ml-1 select-none font-bold notranslate" translate="no"> (xem thêm)</span>
                )}
                {descExpanded && (
                  <span className="text-[8.5px] text-blue-600 ml-1 select-none font-bold notranslate" translate="no"> (thu gọn)</span>
                )}
              </div>
            )}
            <div className="text-[8.5px] text-slate-400 font-medium select-none border-t border-slate-100 pt-0.5 mt-0.5 flex justify-between items-center">
              <span translate="no" className="notranslate">Duyệt: {r.qcConfirmedBy} ({r.qcConfirmedAt})</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {isAuthorized ? (
            <div className="space-y-1.5">
              {/* Segmented control to let QC switch categories or override auto detection */}
              <div className="flex items-center justify-between gap-1 w-full flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase select-none"><T>Danh mục:</T></span>
                  <div className="flex rounded bg-slate-100 p-0.5 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setQcCategoryFilter("AUTO")}
                      className={`px-1 rounded text-[8px] py-0.5 font-black cursor-pointer transition-all ${
                        qcCategoryFilter === "AUTO"
                          ? "bg-emerald-600 text-white shadow-3xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                      title="Hệ thống tự động phân tích và lọc lỗi tương thích với nội dung báo cáo"
                    >
                      <span className="notranslate" translate="no">Tự động ({actualCategoryFilter})</span>
                    </button>
                    {(["BBM", "BBC", "ALL"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setQcCategoryFilter(cat)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black cursor-pointer transition-all ${
                          qcCategoryFilter === cat
                            ? "bg-blue-600 text-white shadow-3xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span className="notranslate" translate="no">
                          {cat === "ALL" ? "Tất cả" : cat}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {isRepeated && (
                  <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-1 rounded flex items-center gap-1 leading-none select-none uppercase animate-[pulse_2s_infinite] shadow-[0_0_10px_rgba(225,29,72,0.35)] shrink-0">
                    <AlertTriangle className="w-2.5 h-2.5 drop-shadow-[0_0_6px_rgba(255,229,0,1)] animate-[pulse_0.4s_infinite] shrink-0 scale-110" fill="#FFE500" stroke="#000000" strokeWidth={2.5} />
                    <T><span translate="no" className="notranslate">LẶP LẠI ({repeatCount})</span></T>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 relative w-full">
                <div className="relative flex-1 min-w-0 h-[32px]">
                  {/* Visual design layer representing the chosen state or placeholder */}
                  <div
                    className={`absolute inset-0 bg-white border rounded text-[8.5px] font-bold p-1 flex items-center justify-between gap-1 leading-tight pointer-events-none transition-all ${
                      selectedCode 
                        ? "text-slate-900 font-extrabold" 
                        : "text-slate-600 font-semibold italic"
                    } ${
                      showPulse 
                        ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/25 shadow-[0_0_10px_rgba(16,185,129,0.35)] animate-[pulse_2s_infinite]' 
                        : 'border-slate-300'
                    }`}
                  >
                    <span className="line-clamp-2 notranslate flex-1 pr-3" translate="no">
                      {selectedCode ? `[${selectedCode}] ${matchedErr?.name || ""}` : "Phụ trách P.QLCL Chi Nhánh chọn mã lỗi"}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0 text-slate-500 absolute right-1" />
                  </div>

                  {/* Completely transparent select laid on top */}
                  <select
                    value={selectedCode}
                    onChange={(e) => setSelectedCode(e.target.value)}
                    translate="no"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer notranslate"
                  >
                    <option value="" translate="no" className="notranslate font-semibold italic text-slate-500">
                      Phụ trách P.QLCL Chi Nhánh chọn mã lỗi
                    </option>
                    {filteredErrors.map(x => (
                      <option key={x.code} value={x.code} translate="no" className="notranslate font-bold text-slate-800">
                        [{x.code}] {x.name}
                      </option>
                    ))}
                  </select>
                </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="p-1 h-[32px] w-[32px] bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-300 cursor-pointer flex items-center justify-center shrink-0 hover:text-blue-600 hover:border-blue-300 transition-colors"
                title="Khai báo thêm mã lỗi mới trực tiếp"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className={`px-2 h-[32px] text-white font-extrabold text-[9.5px] rounded border cursor-pointer uppercase transition-all shadow-3xs flex items-center justify-center gap-0.5 shrink-0 ${showConfirmPulse ? 'bg-emerald-500 border-emerald-400 hover:bg-emerald-600 animate-[pulse_1.5s_infinite] shadow-[0_0_12px_rgba(16,185,129,0.55)] font-black' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'}`}
              >
                <span translate="no" className="notranslate">Xác nhận</span>
              </button>
            </div>
          </div>
          ) : (
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[9px] text-slate-500 italic flex items-center gap-1.5">
              <span>⏳</span>
              <span translate="no" className="notranslate">Chờ Trưởng phòng QC chọn và xác nhận mã lỗi này...</span>
            </div>
          )}
          {selectedCode && !r.qcConfirmed && matchedErr && (
            <div className="text-[9px] text-slate-650 bg-white p-1.5 rounded border border-slate-200 leading-normal">
              <span className="font-bold text-slate-700 block notranslate" translate="no">Diễn giải:</span>
              {matchedErr.description}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider notranslate" translate="no">Thêm mã lỗi mới</span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Form content */}
            <div className="p-4 space-y-3 overflow-y-auto text-left">
              {/* Category */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase mb-1 notranslate" translate="no">Phân loại ngành</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewErrorCategory("BBM");
                      if (!newErrorCode || newErrorCode.startsWith("ERM") || newErrorCode.startsWith("ERC")) {
                        const num = String(errorCatalog.filter(x => x.category === "BBM").length + 1).padStart(4, "0");
                        setNewErrorCode(`ERM${num}`);
                      }
                    }}
                    className={`py-1.5 px-2 rounded border text-[10px] font-bold text-center cursor-pointer transition-all ${newErrorCategory === "BBM" ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="notranslate" translate="no">Bao bì mềm (BBM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewErrorCategory("BBC");
                      if (!newErrorCode || newErrorCode.startsWith("ERM") || newErrorCode.startsWith("ERC")) {
                        const num = String(errorCatalog.filter(x => x.category === "BBC").length + 1).padStart(4, "0");
                        setNewErrorCode(`ERC${num}`);
                      }
                    }}
                    className={`py-1.5 px-2 rounded border text-[10px] font-bold text-center cursor-pointer transition-all ${newErrorCategory === "BBC" ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className="notranslate" translate="no">Bao bì cứng (BBC)</span>
                  </button>
                </div>
              </div>

              {/* Code */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9.5px] font-black text-slate-500 uppercase notranslate" translate="no">Mã lỗi</label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = newErrorCategory === "BBM" ? "ERM" : "ERC";
                      const num = String(errorCatalog.filter(x => x.category === newErrorCategory).length + 1).padStart(4, "0");
                      setNewErrorCode(`${prefix}${num}`);
                    }}
                    className="text-[9px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    <span className="notranslate" translate="no">Gợi ý mã</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={newErrorCode}
                  onChange={(e) => setNewErrorCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: ERM0105"
                  className="w-full border border-slate-200 rounded p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-800"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase mb-1 notranslate" translate="no">Tên lỗi</label>
                <input
                  type="text"
                  value={newErrorName}
                  onChange={(e) => setNewErrorName(e.target.value)}
                  placeholder="Ví dụ: Co màng, Bavia, Trầy xước"
                  className="w-full border border-slate-200 rounded p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[9.5px] font-black text-slate-500 uppercase mb-1 notranslate" translate="no">Diễn giải chi tiết</label>
                <textarea
                  value={newErrorDesc}
                  onChange={(e) => setNewErrorDesc(e.target.value)}
                  placeholder="Mô tả cụ thể về biểu hiện lỗi hoặc cách nhận biết..."
                  rows={3}
                  className="w-full border border-slate-200 rounded p-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 leading-normal"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded text-[10px] font-bold transition-all cursor-pointer"
              >
                <span className="notranslate" translate="no">Hủy</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newErrorCode.trim()) {
                    alert("Vui lòng điền mã lỗi!");
                    return;
                  }
                  if (!newErrorName.trim()) {
                    alert("Vui lòng điền tên lỗi!");
                    return;
                  }
                  if (errorCatalog.some(x => x.code.toUpperCase() === newErrorCode.trim().toUpperCase())) {
                    alert(`Mã lỗi [${newErrorCode.trim().toUpperCase()}] đã tồn tại trong danh mục!`);
                    return;
                  }

                  const dateObj = new Date();
                  const dd = String(dateObj.getDate()).padStart(2, '0');
                  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const yy = String(dateObj.getFullYear()).slice(-2);
                  const createdAtStr = `${dd}/${mm}/${yy}`;

                  const newItem: ErrorCatalogItem = {
                    code: newErrorCode.trim().toUpperCase(),
                    category: newErrorCategory,
                    name: newErrorName.trim(),
                    description: newErrorDesc.trim() || `Lỗi ${newErrorName.trim()} ngành ${newErrorCategory}`,
                    createdAt: createdAtStr
                  };

                  if (onAddErrorCatalogItem) {
                    onAddErrorCatalogItem(newItem);
                    setSelectedCode(newItem.code);
                  }
                  setShowAddModal(false);
                  setNewErrorCode("");
                  setNewErrorName("");
                  setNewErrorDesc("");
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded text-[10px] font-bold transition-all shadow-sm cursor-pointer"
              >
                <span className="notranslate" translate="no">Thêm mới</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[localStorage] Failed to save key "${key}" in DashboardDesktop. Quota exceeded:`, error);
  }
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[localStorage] Failed to read key "${key}" in DashboardDesktop:`, error);
    return null;
  }
};

export default function DashboardDesktop({
  currentUser,
  users,
  reports,
  companies,
  branches,
  departments,
  broadcasts,
  chats,
  offlineMode,
  onUpdateUserStatus,
  onUpdateUserRole,
  onAddUser,
  onDeleteUser,
  onAddCompany,
  onAddBranch,
  onAddDepartment,
  onUpdateCompany,
  onUpdateBranch,
  onUpdateDepartment,
  onDeleteCompany,
  onDeleteBranch,
  onDeleteDepartment,
  onAddBroadcast,
  onAddChatMessage,
  onLogout,
  onToggleMobilePreview,

  productionRequests,
  setProductionRequests,
  productionRequestItemsMap,
  setProductionRequestItemsMap,
  orderImplementations,
  setOrderImplementations,
  productsCatalog,
  setProductsCatalog,
  moldsCatalog,
  setMoldsCatalog,
  onUpdateReport,
  onUpdateUser,
  onForceSyncMetadata,
  onForceSyncUsers,
  onDeleteReport,
  onShowToast,
  onDeleteBroadcast,
  tickerConfig,
  onUpdateTickerConfig,
  aiKnowledgeText,
  onUpdateAiKnowledge,
  systemNotifications = [],
  onDeleteNotification,
  readNotifIds: readNotifIdsProp,
  setReadNotifIds: setReadNotifIdsProp,
  onExportBackup,
  onImportBackup,

  // Forum props
  topics = [],
  replies = [],
  onAddForumTopic,
  onAddForumReply,
  onUpdateForumTopicStatus,
  onToggleForumTopicPin,

  // Error Catalog props
  errorCatalog = [],
  onAddErrorCatalogItem,
  onUpdateErrorCatalogItem,
  onDeleteErrorCatalogItem,

  isQcFeatureEnabled = true,
  onToggleQcFeature
}: DashboardDesktopProps) {
  const [activeTab, setActiveTab] = useState<
    "PHÊ_DUYỆT" | "MÃ_HÓA" | "THỐNG_KÊ" | "DỮ_LIỆU" | "QUY_CHẾ" | "CÁ_NHÂN" | "THÔNG_BÁO" | "TRAO_ĐỔI" | "TRIỂN_KHAI" | "ĐỀ_XUẤT" | "QUOTA_CLOUD"
  >(() => {
    if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER) {
      return "PHÊ_DUYỆT";
    }
    return "MÃ_HÓA";
  });
  const [statsSubTab, setStatsSubTab] = useState<"NHAN_SU" | "CHAT_LUONG" | "TIEN_DO" | "HUY_HIEU">("NHAN_SU");
  const [maHoaSubTab, setMaHoaSubTab] = useState<"SO_DO" | "MA_LOI">("SO_DO");
  
  // Error Catalog UI States
  const [errorCodeFilter, setErrorCodeFilter] = useState("");
  const [errorCategoryFilter, setErrorCategoryFilter] = useState<"ALL" | "BBM" | "BBC">("ALL");
  const [editingErrorItem, setEditingErrorItem] = useState<ErrorCatalogItem | null>(null);
  
  // States for new/edit form
  const [errorFormCode, setErrorFormCode] = useState("");
  const [errorFormCategory, setErrorFormCategory] = useState<"BBM" | "BBC">("BBM");
  const [errorFormName, setErrorFormName] = useState("");
  const [errorFormDescription, setErrorFormDescription] = useState("");

  // Helper to auto-suggest next error code
  const getNextErrorCode = (cat: "BBM" | "BBC") => {
    const list = errorCatalog || [];
    const prefix = cat === "BBM" ? "ERM" : "ERC";
    const codes = list
      .filter((x) => x.category === cat && x.code.toUpperCase().startsWith(prefix))
      .map((x) => {
        const numPart = x.code.substring(3);
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
    const maxNum = codes.length > 0 ? Math.max(...codes) : 0;
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, "0")}`;
  };

  const [showAckDetailsDesktop, setShowAckDetailsDesktop] = useState<Record<string, boolean>>({});
  const [expandedDirectiveIdsDesktop, setExpandedDirectiveIdsDesktop] = useState<Record<string, boolean>>({});

  const handleExportExcelWithImages = async () => {
    // Helper function to fetch external image URLs and convert them to Base64
    const urlToBase64 = async (url: string): Promise<{ base64: string; ext: string } | null> => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const match = base64data.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
            if (match) {
              resolve({ ext: match[1] === "jpg" ? "jpeg" : match[1], base64: match[2] });
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error("Lỗi chuyển đổi URL sang Base64:", err);
        return null;
      }
    };

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Báo cáo 4M1E1I");

      worksheet.columns = [
        { header: "Mã báo cáo", key: "reportCode", width: 15 },
        { header: "Thời gian", key: "timestamp", width: 20 },
        { header: "Chi nhánh/Nhà máy", key: "factory", width: 22 },
        { header: "Yếu tố 4M1E1I", key: "category", width: 18 },
        { header: "Nội dung ghi nhận", key: "content", width: 35 },
        { header: "Ghi chú bổ sung", key: "notes", width: 25 },
        { header: "Phân loại", key: "reportType", width: 12 },
        { header: "Người báo cáo", key: "uploaderName", width: 20 },
        { header: "Số điện thoại", key: "uploaderPhone", width: 15 },
        { header: "Bộ phận", key: "uploaderDepartment", width: 18 },
        { header: "Trạng thái duyệt", key: "status", width: 16 },
        { header: "Chỉ đạo từ cấp trên", key: "directives", width: 35 },
        { header: "Ảnh đính kèm", key: "image", width: 25 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4F46E5" }
        };
        cell.font = {
          name: "Arial",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" }
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD1D5DB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          bottom: { style: "medium", color: { argb: "FF111827" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } }
        };
      });

      const activeReports = reports.filter(r => !r.isDeleted);

      for (let i = 0; i < activeReports.length; i++) {
        const r = activeReports[i];
        const rowIndex = i + 2;
        const row = worksheet.getRow(rowIndex);

        // Tìm ảnh chụp thật từ mảng imageUrls hoặc trường imageUrl
        let targetImg: string | undefined = undefined;
        if (r.imageUrls && r.imageUrls.length > 0) {
          const realImg = r.imageUrls.find(url => url && (url.startsWith("data:image/") && !url.includes("svg") || url.startsWith("http")));
          targetImg = realImg || r.imageUrls[0];
        }
        if (!targetImg && r.imageUrl) {
          targetImg = r.imageUrl;
        }

        const isSvgStatic = targetImg && targetImg.startsWith("data:image/svg+xml");
        const hasImage = targetImg && !isSvgStatic;
        row.height = hasImage ? 110 : 22;

        const directiveTexts = (r.directives || []).map(d => `[${d.author}]: ${d.text}`).join("; ");

        // Giải quyết nhầm Bộ phận bằng cách tra cứu thông tin người dùng mới nhất từ props
        const userObj = users.find(u => u.id === r.uploaderId || u.phone === r.uploaderPhone || u.fullName === r.uploaderName);
        const resolvedDept = userObj ? userObj.department : (r.uploaderDepartment || "");

        // Đồng bộ trạng thái duyệt: chỉ có r.isApproved === false mới hiển thị Chờ duyệt, còn lại (true hoặc undefined) là Đã duyệt
        const isApproved = r.isApproved !== false;

        row.values = {
          reportCode: r.reportCode || r.id,
          timestamp: r.timestamp,
          factory: r.factory,
          category: r.category,
          content: r.content,
          notes: r.notes || "",
          reportType: r.reportType || (r.isAbnormal ? "KPH" : "NORMAL"),
          uploaderName: userObj ? userObj.fullName : r.uploaderName,
          uploaderPhone: r.uploaderPhone,
          uploaderDepartment: resolvedDept,
          status: isApproved ? "Đã duyệt" : "Chờ duyệt",
          directives: directiveTexts,
          image: ""
        };

        row.eachCell((cell, colNumber) => {
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber === 1 || colNumber === 2 || colNumber === 7 || colNumber === 9 || colNumber === 11 ? "center" : "left",
            wrapText: true
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } }
          };

          if (colNumber === 11) {
            cell.font = {
              name: "Arial",
              size: 10,
              bold: true,
              color: { argb: isApproved ? "FF047857" : "FFB45309" }
            };
          }
        });

        if (hasImage && targetImg) {
          try {
            let base64Data: string | null = null;
            let ext = "jpeg";

            if (targetImg.startsWith("data:")) {
              const match = targetImg.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
              if (match) {
                ext = match[1] === "jpg" ? "jpeg" : match[1];
                base64Data = match[2];
              }
            } else if (targetImg.startsWith("http")) {
              const imgData = await urlToBase64(targetImg);
              if (imgData) {
                ext = imgData.ext;
                base64Data = imgData.base64;
              }
            }

            if (base64Data) {
              const imageId = workbook.addImage({
                base64: base64Data,
                extension: ext as any
              });

              worksheet.addImage(imageId, {
                tl: { col: 12, row: rowIndex - 1 } as any,
                br: { col: 13, row: rowIndex } as any,
                editAs: "oneCell"
              });
            }
          } catch (imgErr) {
            console.error("Lỗi khi chèn ảnh vào Excel:", imgErr);
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yy = String(today.getFullYear()).slice(-2);
      const dateStr = `${dd}_${mm}_${yy}`;

      link.download = `Bantin_4M1E1I_KemAnh_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onShowToast) {
        onShowToast("Đã xuất Excel đính kèm hình ảnh thành công! 📸📊", "success");
      }
    } catch (err) {
      console.error("Lỗi xuất file Excel đính kèm ảnh:", err);
      if (onShowToast) {
        onShowToast("Có lỗi xảy ra khi xuất file Excel kèm ảnh!", "error");
      }
    }
  };

  const [aiAnalysisReport, setAiAnalysisReport] = useState<QualityReport | null>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  const [aiChatMessages, setAiChatMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [aiChatInput, setAiChatInput] = useState<string>("");
  const [isAiSendingChat, setIsAiSendingChat] = useState<boolean>(false);
  const [activeAiTab, setActiveAiTab] = useState<'analysis' | 'chat'>('analysis');

  const handleAIAnalyze = async (report: QualityReport) => {
    const currentUserName = currentUser?.fullName || currentUser?.id || "";
    let targetReport = report;
    if (currentUserName && !report.aiUsedBy?.includes(currentUserName)) {
      const updatedAiUsedBy = [...(report.aiUsedBy || []), currentUserName];
      targetReport = { ...report, aiUsedBy: updatedAiUsedBy };
      if (onUpdateReport) {
        onUpdateReport(targetReport);
      }
    }
    setAiAnalysisReport(targetReport);
    setAiAnalysisText("");
    setIsAnalyzing(true);
    setActiveAiTab('analysis');
    
    const isReportDnp = report && (
      report.factory?.includes("DNP") || 
      report.factory?.includes("BBM") || 
      report.factory?.includes("BBC")
    );
    const companyLabel = isReportDnp ? "DNP" : "Tân Phú";
    
    setAiChatMessages([
      {
        role: 'model',
        content: `Chào bạn! Tôi là Chuyên gia Trợ lý AI của **${companyLabel}**. Tôi đang tiến hành phân tích sự cố này bằng phương pháp 5-Why và đề xuất các giải pháp cải tiến tối ưu. Sau khi xem kết quả phân tích 5-Why bên tab kế bên, bạn có thể gửi tin nhắn đặt câu hỏi, phân tích thêm, hoặc thảo luận chi tiết với tôi ngay tại khung chat này!`
      }
    ]);

    try {
      const response = await fetch("/api/analyze-kph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factory: report.factory,
          category: report.category,
          content: report.content,
          notes: report.notes,
          directives: report.directives,
          aiKnowledgeText: aiKnowledgeText || "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysisText(data.analysis);
      } else {
        setAiAnalysisText(`### ❌ Có lỗi xảy ra khi phân tích:\n${data.error || "Không rõ nguyên nhân."}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysisText(`### ❌ Lỗi kết nối máy chủ:\n${err.message || "Không thể gửi yêu cầu phân tích."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIDsaAnalyze = async (report: QualityReport) => {
    const currentUserName = currentUser?.fullName || currentUser?.id || "";
    let targetReport = report;
    if (currentUserName && !report.aiUsedBy?.includes(currentUserName)) {
      const updatedAiUsedBy = [...(report.aiUsedBy || []), currentUserName];
      targetReport = { ...report, aiUsedBy: updatedAiUsedBy };
      if (onUpdateReport) {
        onUpdateReport(targetReport);
      }
    }
    setAiAnalysisReport(targetReport);
    setAiAnalysisText("");
    setIsAnalyzing(true);
    setActiveAiTab('analysis');
    
    const isReportDnp = report && (
      report.factory?.includes("DNP") || 
      report.factory?.includes("BBM") || 
      report.factory?.includes("BBC")
    );
    const companyLabel = isReportDnp ? "DNP" : "Tân Phú";
    
    setAiChatMessages([
      {
        role: 'model',
        content: `Chào bạn! Tôi là Chuyên gia Trợ lý AI của **${companyLabel}**. Tôi đang tiến hành rà soát các RỦI RO TIỀM ẨN liên quan tới Điểm Sáng này (chẳng hạn như sai lệch kích thước khi chế tạo khuôn mới, rủi ro khách hàng phản đối và quy tắc nghiêm ngặt **TUÂN THỦ TIÊU CHUẨN và YÊU CẦU KHÁCH HÀNG** khi có sự thay đổi). Sau khi đọc kết quả đánh giá rủi ro bên tab kế bên, bạn có thể gửi tin nhắn để hỏi đáp hoặc thảo luận thêm với tôi!`
      }
    ]);

    try {
      const response = await fetch("/api/analyze-dsa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          factory: report.factory,
          category: report.category,
          content: report.content,
          notes: report.notes,
          directives: report.directives,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiAnalysisText(data.analysis);
      } else {
        setAiAnalysisText(`### ❌ Có lỗi xảy ra khi phân tích:\n${data.error || "Không rõ nguyên nhân."}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysisText(`### ❌ Lỗi kết nối máy chủ:\n${err.message || "Không thể gửi yêu cầu phân tích."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendAiChatMessage = async () => {
    if (!aiChatInput.trim() || isAiSendingChat || !aiAnalysisReport) return;
    const currentUserName = currentUser?.fullName || currentUser?.id || "";
    if (currentUserName && !aiAnalysisReport.aiUsedBy?.includes(currentUserName)) {
      const updatedReport = {
        ...aiAnalysisReport,
        aiUsedBy: [...(aiAnalysisReport.aiUsedBy || []), currentUserName]
      };
      setAiAnalysisReport(updatedReport);
      if (onUpdateReport) {
        onUpdateReport(updatedReport);
      }
    }
    const userText = aiChatInput.trim();
    setAiChatInput("");
    
    const updatedMessages = [
      ...aiChatMessages,
      { role: 'user' as const, content: userText }
    ];
    setAiChatMessages(updatedMessages);
    setIsAiSendingChat(true);

    try {
      const response = await fetch("/api/chat-5whys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report: {
            factory: aiAnalysisReport.factory,
            category: aiAnalysisReport.category,
            content: aiAnalysisReport.content,
            notes: aiAnalysisReport.notes,
            directives: aiAnalysisReport.directives,
            reportType: aiAnalysisReport.reportType,
            isSpotlight: aiAnalysisReport.isSpotlight,
          },
          messages: updatedMessages,
          aiKnowledgeText: aiKnowledgeText || "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setAiChatMessages([
          ...updatedMessages,
          { role: 'model' as const, content: data.reply }
        ]);
      } else {
        setAiChatMessages([
          ...updatedMessages,
          { role: 'model' as const, content: `❌ Lỗi từ máy chủ: ${data.error || "Không thể phản hồi."}` }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setAiChatMessages([
        ...updatedMessages,
        { role: 'model' as const, content: `❌ Lỗi kết nối: ${err.message || "Không thể gửi tin nhắn."}` }
      ]);
    } finally {
      setIsAiSendingChat(false);
    }
  };

  useEffect(() => {
    function handleGlobalClick(e: Event) {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hasExpanded = Object.values(expandedDirectiveIdsDesktop).some(Boolean);
      if (hasExpanded) {
        if (!target.closest('[data-directive-container-desktop="true"]')) {
          setExpandedDirectiveIdsDesktop({});
          setShowAckDetailsDesktop({});
        }
      }
    }

    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [expandedDirectiveIdsDesktop]);

  const handleAcknowledgeDirectiveDesktop = (report: QualityReport, dirId: string) => {
    const currentSingaporeTime = new Date();
    const yy = String(currentSingaporeTime.getFullYear()).slice(-2);
    const mm = String(currentSingaporeTime.getMonth() + 1).padStart(2, '0');
    const dd = String(currentSingaporeTime.getDate()).padStart(2, '0');
    const timeStr = currentSingaporeTime.toTimeString().split(' ')[0];
    const stamp = `${timeStr} ${dd}/${mm}/${yy}`;

    const userSig = `${currentUser?.department || "Bộ phận"} - ${currentUser?.fullName || "Người nhận"}`;

    const updatedDirectives = (report.directives || []).map((d) => {
      if (d.id === dirId) {
        const currentList = d.acknowledges ? [...d.acknowledges] : [];
        if (currentList.length === 0 && d.isAcknowledged) {
          currentList.push({
            by: d.acknowledgedBy || "Người nhận",
            at: d.acknowledgedAt || d.timestamp
          });
        }
        const isAlreadyAdded = currentList.some(item => item.by === userSig);
        const newList = isAlreadyAdded 
          ? currentList 
          : [...currentList, { by: userSig, at: stamp }];

        return {
          ...d,
          isAcknowledged: true,
          acknowledgedBy: userSig,
          acknowledgedAt: stamp,
          acknowledges: newList
        };
      }
      return d;
    });

    if (onUpdateReport) {
      onUpdateReport({
        ...report,
        directives: updatedDirectives
      });
    }
    if (onShowToast) {
      onShowToast("Đã xác nhận tiếp nhận chỉ đạo! 🤝", "success");
    }
  };

  // Forum states
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>("TOPIC-1");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<ForumTopicCategory>("Góp ý chức năng");
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [forumReplyMessage, setForumReplyMessage] = useState("");
  const [forumSearchQuery, setForumSearchQuery] = useState("");
  const [forumCategoryFilter, setForumCategoryFilter] = useState<string>("ALL");

  const [localReadNotifIds, setLocalReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = safeGetItem("4m1e1i_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const readNotifIds = readNotifIdsProp !== undefined ? readNotifIdsProp : localReadNotifIds;
  const setReadNotifIds = setReadNotifIdsProp !== undefined ? setReadNotifIdsProp : setLocalReadNotifIds;

  useEffect(() => {
    if (readNotifIdsProp === undefined) {
      safeSetItem("4m1e1i_read_notifications", JSON.stringify(localReadNotifIds));
    }
  }, [localReadNotifIds, readNotifIdsProp]);

  const combinedBroadcastsAndNotifications = React.useMemo(() => {
    const list: Array<{
      id: string;
      isBroadcast: boolean;
      type: string;
      content: string;
      sender: string;
      timestamp: string;
    }> = [];

    broadcasts.forEach((b) => {
      list.push({
        id: b.id,
        isBroadcast: true,
        type: b.type,
        content: b.content,
        sender: b.sender,
        timestamp: b.timestamp
      });
    });

    if (Array.isArray(systemNotifications)) {
      systemNotifications.forEach((n) => {
        list.push({
          id: n.id,
          isBroadcast: false,
          type: n.title,
          content: n.description,
          sender: n.authorName || "Hệ thống",
          timestamp: n.timestamp
        });
      });
    }

    return list.sort((a, b) => {
      const tA = parseReportTimestamp(a.timestamp).getTime();
      const tB = parseReportTimestamp(b.timestamp).getTime();
      return tB - tA;
    });
  }, [broadcasts, systemNotifications]);

  const unreadCount = React.useMemo(() => {
    if (!Array.isArray(systemNotifications)) return 0;
    return systemNotifications.filter((n) => !readNotifIds.includes(n.id)).length;
  }, [systemNotifications, readNotifIds]);

  const myBroadcasts = React.useMemo(() => {
    if (!broadcasts || !currentUser) return [];
    const currentFullName = currentUser.fullName.toLowerCase().trim();
    return broadcasts.filter((b) => (b.sender || "").toLowerCase().trim() === currentFullName);
  }, [broadcasts, currentUser]);

  // Helper functions for auto-generating clean, consistent, neat IDs
  const generateAutoCompanyId = (name: string): string => {
    const bracketMatch = name.match(/\(([^)]+)\)/);
    if (bracketMatch) {
      return bracketMatch[1].trim().toUpperCase();
    }
    const upper = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let cleanWords = upper.split(/\s+/).filter(w => !["CONG", "TY", "TNHH", "CP", "CO", "PHAN", "DAU", "TU", "MEMBER"].includes(w));
    if (cleanWords.length === 0) {
      cleanWords = upper.split(/\s+/);
    }
    const initials = cleanWords.map(w => w[0]).join("");
    return initials || "COMP";
  };

  const generateAutoBranchId = (name: string, companyId: string): string => {
    const bracketMatch = name.match(/\(([^)]+)\)/);
    if (bracketMatch) {
      const code = bracketMatch[1].trim().toUpperCase();
      if (code.startsWith(`${companyId}-`)) {
        return code;
      }
      return `${companyId}-${code}`;
    }
    const upper = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let cleanWords = upper.split(/\s+/).filter(w => !["CHI", "NHANH", "NHA", "MAY", "VAN", "PHONG"].includes(w));
    if (cleanWords.length === 0) {
      cleanWords = upper.split(/\s+/);
    }
    const initials = cleanWords.map(w => w[0]).join("");
    return `${companyId}-${initials || "BR"}`;
  };

  const generateAutoDeptId = (bId: string, deptName: string): string => {
    const activeBranch = branches.find(b => b.id === bId);
    const companyId = activeBranch ? (activeBranch.companyId || "TPP") : "TPP";
    
    let base = bId;
    if (base.startsWith(`${companyId}-`)) {
      base = base.substring(companyId.length + 1);
    }
    let prefix = base.toLowerCase();
    if (prefix === "bni") prefix = "bn";
    if (prefix === "lan") prefix = "la";
    if (prefix === "314" || bId.includes("314")) prefix = "nm";
    
    // Check if prefix conflicts with another branch's departments
    const prefixConflict = departments.some(otherD => {
      if (otherD.branchId === bId) return false;
      return otherD.id.startsWith(`${prefix}-`);
    });
    
    if (prefixConflict) {
      prefix = `${companyId.toLowerCase()}-${prefix}`;
    }
    
    // Find next index
    let maxIdx = 0;
    departments.forEach(d => {
      if (d.branchId === bId && d.id.startsWith(`${prefix}-`)) {
        const numPart = d.id.substring(prefix.length + 1);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxIdx) {
          maxIdx = num;
        }
      }
    });
    
    return `${prefix}-${maxIdx + 1}`;
  };
  
  const [badgeConfigs, setBadgeConfigs] = useState<BadgePointConfigItem[]>(() => {
    try {
      const saved = localStorage.getItem("4m1e1i_badge_points_config");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return [
      { id: "1", keywords: ["tổng giám đốc", "tgđ", "tổng gđ"], displayName: "Ban Tổng Giám Đốc", points: 100 },
      { id: "2", keywords: ["giám đốc", "gđ", "ban giám đốc"], displayName: "Ban Giám Đốc", points: 50 },
      { id: "3", keywords: ["trưởng phòng", "phó phòng", "trưởng phân xưởng", "phó phân xưởng"], displayName: "Trưởng / Phó Phòng", points: 30 },
      { id: "4", keywords: ["trưởng ca", "phó ca", "ca trưởng", "ca phó"], displayName: "Trưởng / Phó Ca", points: 10 }
    ];
  });

  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [badgeFormDisplayName, setBadgeFormDisplayName] = useState("");
  const [badgeFormKeywords, setBadgeFormKeywords] = useState("");
  const [badgeFormPoints, setBadgeFormPoints] = useState<number>(10);
  const [isAddingBadge, setIsAddingBadge] = useState(false);

  const handleSaveBadgeConfigs = (updated: BadgePointConfigItem[]) => {
    setBadgeConfigs(updated);
    try {
      localStorage.setItem("4m1e1i_badge_points_config", JSON.stringify(updated));
      onShowToast?.("Đã cập nhật cấu hình cộng điểm huy hiệu thành công! 🏆", "success");
    } catch (e) {
      onShowToast?.("Lỗi lưu cấu hình điểm!", "error");
    }
  };

  const handleAddOrUpdateBadge = () => {
    if (!badgeFormDisplayName.trim()) {
      onShowToast?.("Vui lòng nhập tên hiển thị cho vị trí!", "warning");
      return;
    }
    if (!badgeFormKeywords.trim()) {
      onShowToast?.("Vui lòng nhập ít nhất một từ khóa!", "warning");
      return;
    }

    const keywordsArray = badgeFormKeywords
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);

    if (editingBadgeId) {
      const updated = badgeConfigs.map(item => {
        if (item.id === editingBadgeId) {
          return {
            ...item,
            displayName: badgeFormDisplayName.trim(),
            keywords: keywordsArray,
            points: badgeFormPoints
          };
        }
        return item;
      });
      handleSaveBadgeConfigs(updated);
      setEditingBadgeId(null);
    } else {
      const newBadge: BadgePointConfigItem = {
        id: "badge_" + Date.now(),
        displayName: badgeFormDisplayName.trim(),
        keywords: keywordsArray,
        points: badgeFormPoints
      };
      handleSaveBadgeConfigs([...badgeConfigs, newBadge]);
    }

    setIsAddingBadge(false);
    setBadgeFormDisplayName("");
    setBadgeFormKeywords("");
    setBadgeFormPoints(10);
  };

  const handleEditBadge = (item: BadgePointConfigItem) => {
    setEditingBadgeId(item.id);
    setBadgeFormDisplayName(item.displayName);
    setBadgeFormKeywords(item.keywords.join(", "));
    setBadgeFormPoints(item.points);
    setIsAddingBadge(true);
  };

  const handleDeleteBadge = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa cấu hình điểm của vị trí này?")) {
      const updated = badgeConfigs.filter(item => item.id !== id);
      handleSaveBadgeConfigs(updated);
    }
  };

  const [isEditingTicker, setIsEditingTicker] = useState(false);
  const [editTickerText, setEditTickerText] = useState("");
  const [editTickerSpeed, setEditTickerSpeed] = useState(35);
  const [editTickerSpacing, setEditTickerSpacing] = useState(50);

  const [isEditingKnowledge, setIsEditingKnowledge] = useState(false);
  const [editKnowledgeText, setEditKnowledgeText] = useState("");

  const handleStartEditKnowledge = () => {
    setEditKnowledgeText(aiKnowledgeText || "");
    setIsEditingKnowledge(true);
  };

  const handleSaveKnowledgeConfig = () => {
    if (onUpdateAiKnowledge) {
      onUpdateAiKnowledge(editKnowledgeText);
      if (onShowToast) {
        onShowToast("Đã cập nhật kho tri thức tiêu chuẩn AI thành công!", "success");
      }
    }
    setIsEditingKnowledge(false);
  };

  const handleStartEditTicker = () => {
    setEditTickerText(tickerConfig?.text !== undefined ? tickerConfig.text : "");
    setEditTickerSpeed(tickerConfig?.speed || 35);
    setEditTickerSpacing(tickerConfig?.spacing || 50);
    setIsEditingTicker(true);
  };

  const handleSaveTickerConfig = () => {
    if (onUpdateTickerConfig) {
      onUpdateTickerConfig({
        text: editTickerText,
        speed: Number(editTickerSpeed) || 35,
        spacing: Number(editTickerSpacing) || 50
      });
    }
    setIsEditingTicker(false);
  };

  const [showTrashLogs, setShowTrashLogs] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notifIdConfirmDlt, setNotifIdConfirmDlt] = useState<string | null>(null);
  const [showDesktopOnlinePopover, setShowDesktopOnlinePopover] = useState(false);
  const [desktopOnlineSearch, setDesktopOnlineSearch] = useState("");

  const [forceSyncState, setForceSyncState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [forceSyncUsersState, setForceSyncUsersState] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [branchNameFormat, setBranchNameFormat] = useState<'standard' | 'with-company-id'>(() => {
    return (safeGetItem("4m1e1i_branch_format") as any) || 'standard';
  });
  const [deptNameFormat, setDeptNameFormat] = useState<'standard' | 'with-branch-id'>(() => {
    return (safeGetItem("4m1e1i_dept_format") as any) || 'standard';
  });

  useEffect(() => {
    safeSetItem("4m1e1i_branch_format", branchNameFormat);
  }, [branchNameFormat]);

  useEffect(() => {
    safeSetItem("4m1e1i_dept_format", deptNameFormat);
  }, [deptNameFormat]);

  // Local entry inputs for Mã hóa lookup creation
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyId, setNewCompanyId] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptId, setNewDeptId] = useState("");

  // States for hierarchical company-branch-department mapping
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("TPP");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("TPP-CTY");

  // Editing states for company, branch, and department
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState<string>("");
  const [editingCompanyIdInput, setEditingCompanyIdInput] = useState<string>("");
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingBranchName, setEditingBranchName] = useState<string>("");
  const [editingBranchIdInput, setEditingBranchIdInput] = useState<string>("");
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState<string>("");
  const [editingDeptIdInput, setEditingDeptIdInput] = useState<string>("");

  const [companyIdConfirmDlt, setCompanyIdConfirmDlt] = useState<string | null>(null);
  const [branchIdConfirmDlt, setBranchIdConfirmDlt] = useState<string | null>(null);
  const [deptIdConfirmDlt, setDeptIdConfirmDlt] = useState<string | null>(null);
  const [userIdConfirmDlt, setUserIdConfirmDlt] = useState<string | null>(null);

  // States for PHÊ DUYỆT Personnel search & filtering
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userBranchFilter, setUserBranchFilter] = useState("all");
  const [userDepartmentFilter, setUserDepartmentFilter] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPastedText, setImportPastedText] = useState("");

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserId, setEditUserId] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editRole, setEditRole] = useState<UserRole>(UserRole.STAFF);
  const [editStatus, setEditStatus] = useState<UserStatus>(UserStatus.PENDING);
  const [editPassword, setEditPassword] = useState("");
  const [editCompany, setEditCompany] = useState("");

  const getFormattedUserBranch = (userBranchText: string | undefined | null, companyId?: string) => {
    if (!userBranchText) return "";
    const cleanUserBranchText = String(userBranchText);
    if (/\([^)]+\)$/.test(cleanUserBranchText)) {
      return cleanUserBranchText;
    }
    const foundBranch = branches?.find((b) => {
      const bName = b.name || "";
      const bNameClean = bName.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
      const fNameClean = cleanUserBranchText.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
      return bName === userBranchText || bNameClean === fNameClean;
    });
    if (foundBranch) {
      return `${cleanUserBranchText} (${foundBranch.companyId})`;
    }
    if (companyId) {
      return `${cleanUserBranchText} (${companyId})`;
    }
    return cleanUserBranchText;
  };

  const isDeleteReportAllowed = (report: QualityReport): boolean => {
    if (!currentUser) return false;
    const roleStr = currentUser.role as unknown as string;
    if (
      roleStr === "QUAN_LY_TRUONG" ||
      roleStr === "BAN_GIAM_DOC" ||
      roleStr === "ADMIN" ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.REVIEWER
    ) {
      return true;
    }
    if (report.uploaderName === currentUser.fullName || report.uploaderPhone === currentUser.phone) {
      return true;
    }
    if (currentUser.canSpeciallyEditDelete && currentUser.branch === report.factory) {
      return true;
    }
    return false;
  };

  const getFormattedUserDept = (userDeptText: string | undefined | null, userBranchText: string | undefined | null) => {
    if (!userDeptText) return "";
    const cleanUserDeptText = String(userDeptText);
    if (/\([^)]+\)$/.test(cleanUserDeptText)) {
      return cleanUserDeptText;
    }
    const cleanUserBranchText = userBranchText ? String(userBranchText).replace(/\s*\([^)]+\)$/, "").trim() : "";
    const foundBranch = branches?.find((b) => {
      const bName = b.name || "";
      const bNameClean = bName.replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
      const fNameClean = cleanUserBranchText.toLowerCase();
      return bName === userBranchText || bNameClean === fNameClean;
    });
    if (foundBranch) {
      return `${cleanUserDeptText} (${foundBranch.id})`;
    }
    return cleanUserDeptText;
  };

  const getFactoryDisplayName = (factoryName: string) => {
    if (!factoryName) return "";
    
    // Find the company suffix
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

  const handleStartEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserId(u.id);
    setEditFullName(u.fullName);
    setEditPhone(u.phone);

    // Find representing company based on the user's branch
    const userBranch = branches.find((b) => b.name === u.branch);
    const userCompany = userBranch ? companies.find((c) => c.id === userBranch.companyId) : null;
    const initialCompanyVal = u.company || (userCompany ? userCompany.name : (companies[0]?.name || "TÂN PHÚ VIỆT NAM"));
    setEditCompany(initialCompanyVal);

    setEditBranch(getFormattedUserBranch(u.branch, userCompany?.id || ""));
    setEditDepartment(getFormattedUserDept(u.department, u.branch));
    setEditPosition(u.position || "");
    setEditPassword(u.password || "123456");

    setEditRole(u.role);
    setEditStatus(u.status);
  };

  // Cascade link: Company -> Branch -> Department
  useEffect(() => {
    if (editingUser && editCompany) {
      let currentCompany = editCompany;
      const exists = companies.some((c) => c.name === editCompany);
      if (!exists && companies.length > 0) {
        currentCompany = companies[0].name;
        setEditCompany(companies[0].name);
      }
      
      const selectedC = companies.find((c) => c.name === currentCompany);
      if (selectedC) {
        const companyBranches = branches.filter((b) => b.companyId === selectedC.id);
        if (companyBranches.length > 0) {
          const hasCurrentBranch = companyBranches.some((b) => {
            const bName = b.name || "";
            const nameWithSuffix = bName.includes(`(${b.id})`) 
              ? bName 
              : bName.includes(`(${b.companyId})`)
              ? bName
              : `${bName.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
            return bName === editBranch || nameWithSuffix === editBranch;
          });
          if (!hasCurrentBranch) {
            const firstBranch = companyBranches[0];
            const fbName = firstBranch.name || "";
            const nameWithSuffix = fbName.includes(`(${firstBranch.id})`) 
              ? fbName 
              : fbName.includes(`(${firstBranch.companyId})`)
              ? fbName
              : `${fbName.replace(/\s*\([^)]+\)$/, "").trim()} (${firstBranch.companyId})`;
            setEditBranch(nameWithSuffix);
          }
        } else {
          setEditBranch("");
        }
      }
    }
  }, [editCompany, companies, branches, editingUser, editBranch]);

  useEffect(() => {
    if (editingUser && editBranch) {
      const selectedB = branches.find((b) => {
        const bName = b.name || "";
        const nameWithSuffix = bName.includes(`(${b.id})`) 
          ? bName 
          : bName.includes(`(${b.companyId})`)
          ? bName
          : `${bName.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
        return bName === editBranch || nameWithSuffix === editBranch;
      });
      if (selectedB) {
        const branchDepts = departments.filter((d) => d.branchId === selectedB.id);
        if (branchDepts.length > 0) {
          const hasCurrentDept = branchDepts.some((d) => {
            const dName = d.name || "";
            const nameWithSuffix = dName.includes(`(${selectedB.id})`)
              ? dName
              : `${dName.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
            return dName === editDepartment || nameWithSuffix === editDepartment;
          });
          if (!hasCurrentDept) {
            const firstDept = branchDepts[0];
            const fdName = firstDept.name || "";
            const nameWithSuffix = fdName.includes(`(${selectedB.id})`)
              ? fdName
              : `${fdName.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
            setEditDepartment(nameWithSuffix);
          }
        } else {
          setEditDepartment("");
        }
      }
    }
  }, [editBranch, branches, departments, editingUser]);

  const handleSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const trimmedNewId = editUserId.trim();
    if (!trimmedNewId) {
      if (onShowToast) {
        onShowToast("Mã nhân sự không được để trống!", "error");
      } else {
        alert("Mã nhân sự không được để trống!");
      }
      return;
    }

    // Check conflict
    if (trimmedNewId !== editingUser.id && users.some((u) => u.id === trimmedNewId)) {
      if (onShowToast) {
        onShowToast("Mã nhân sự này đã tồn tại trong hệ thống!", "error");
      } else {
        alert("Mã nhân sự này đã tồn tại trong hệ thống!");
      }
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      id: trimmedNewId,
      fullName: editFullName.trim(),
      phone: editPhone.trim(),
      department: editDepartment,
      branch: editBranch,
      position: editPosition,
      role: editRole,
      status: editStatus,
      password: editPassword,
      company: editCompany,
    };
    if (onUpdateUser) {
      onUpdateUser(updatedUser, editingUser.id);
    }
    setEditingUser(null);
  };

  // States for Trang cá nhân (User profile)
  const [profileFullName, setProfileFullName] = useState(currentUser?.fullName || "");
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || "");
  const [profilePassword, setProfilePassword] = useState(currentUser?.password || "");
  const [profileCompany, setProfileCompany] = useState(() => {
    const raw = currentUser?.company || "";
    const matched = companies.find((c) => c.name.toLowerCase() === raw.toLowerCase() || c.id === raw);
    return matched ? matched.id : raw;
  });
  const [profileBranch, setProfileBranch] = useState(currentUser?.branch || "");
  const [profileDept, setProfileDept] = useState(currentUser?.department || "");
  const [profilePosition, setProfilePosition] = useState(currentUser?.position || "");
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || "");
  const [profileShowPassword, setProfileShowPassword] = useState(false);

  // States for inline quality report editing under Trang cá nhân
  const [editingPersonalReportId, setEditingPersonalReportId] = useState<string | null>(null);
  const [editingPersonalReportText, setEditingPersonalReportText] = useState("");
  // Tab for personal broadcasts vs reports
  const [personalTab, setPersonalTab] = useState<"4M1E1I" | "SYSTEM">("4M1E1I");

  useEffect(() => {
    if (currentUser) {
      setProfileFullName(currentUser.fullName);
      setProfilePhone(currentUser.phone);
      setProfilePassword(currentUser.password || "");
      const raw = currentUser.company || "";
      const matched = companies.find((c) => c.name.toLowerCase() === raw.toLowerCase() || c.id === raw);
      setProfileCompany(matched ? matched.id : raw);
      setProfileBranch(currentUser.branch || "");
      setProfileDept(currentUser.department || "");
      setProfilePosition(currentUser.position || "");
      setProfileAvatar(currentUser.avatar || "");
    }
  }, [currentUser, companies]);

  // Sync profile branch when profile company changes
  useEffect(() => {
    if (profileCompany) {
      const companyBranches = branches.filter((b) => b.companyId === profileCompany);
      if (companyBranches.length > 0) {
        const hasCurrentBranch = companyBranches.some((b) => {
          const bName = b.name || "";
          const nameWithSuffix = bName.includes(`(${b.id})`) 
            ? bName 
            : bName.includes(`(${b.companyId})`)
            ? bName
            : `${bName.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
          return bName === profileBranch || nameWithSuffix === profileBranch;
        });
        if (!hasCurrentBranch) {
          const firstBranch = companyBranches[0];
          const fbName = firstBranch.name || "";
          const nameWithSuffix = fbName.includes(`(${firstBranch.id})`) 
            ? fbName 
            : fbName.includes(`(${firstBranch.companyId})`)
            ? fbName
            : `${fbName.replace(/\s*\([^)]+\)$/, "").trim()} (${firstBranch.companyId})`;
          setProfileBranch(nameWithSuffix);
        }
      } else {
        setProfileBranch("");
      }
    }
  }, [profileCompany, companies, branches]);

  // Sync profile department when profile branch changes
  useEffect(() => {
    if (profileBranch) {
      const selectedB = branches.find((b) => {
        const bName = b.name || "";
        const nameWithSuffix = bName.includes(`(${b.id})`) 
          ? bName 
          : bName.includes(`(${b.companyId})`)
          ? bName
          : `${bName.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
        return bName === profileBranch || nameWithSuffix === profileBranch;
      });
      if (selectedB) {
        const branchDepts = departments.filter((d) => d.branchId === selectedB.id);
        if (branchDepts.length > 0) {
          const hasCurrentDept = branchDepts.some((d) => {
            const dName = d.name || "";
            const nameWithSuffix = dName.includes(`(${selectedB.id})`)
              ? dName
              : `${dName.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
            return dName === profileDept || nameWithSuffix === profileDept;
          });
          if (!hasCurrentDept) {
            const firstDept = branchDepts[0];
            const fdName = firstDept.name || "";
            const nameWithSuffix = fdName.includes(`(${selectedB.id})`)
              ? fdName
              : `${fdName.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
            setProfileDept(nameWithSuffix);
          }
        } else {
          setProfileDept("");
        }
      }
    }
  }, [profileBranch, branches, departments]);

  const getLocalBranchCodeSuffix = (branchId: string) => {
    const activeBranch = branches.find((b) => b.id === branchId);
    if (!activeBranch) return "";
    const brName = activeBranch.name;
    const match = brName.match(/\(([^)]+)\)/);
    let code = match ? match[1] : "";
    if (!code) {
      const nameWithoutAccents = brName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z40-9\s]/g, "");
      const words = nameWithoutAccents.split(/\s+/).filter(Boolean);
      const lastWord = words[words.length - 1];
      if (lastWord && lastWord === lastWord.toUpperCase() && lastWord.length >= 2) {
        code = lastWord;
      } else {
        code = words.map(w => w[0]?.toUpperCase()).join("");
      }
    }
    if (!code || code.startsWith("BRANCH-") || code.startsWith("DEPT-") || code.length > 10) {
      return "";
    }
    return ` (${code})`;
  };

  const handleSelectCompany = (compId: string) => {
    setSelectedCompanyId(compId);
    const relatedBranches = branches.filter(b => b.companyId === compId);
    if (relatedBranches.length > 0) {
      setSelectedBranchId(relatedBranches[0].id);
    } else {
      setSelectedBranchId("");
    }
  };

  const activeCompanyBranches = branches.filter((b) => b.companyId === selectedCompanyId);
  const isSelectedBranchValid = activeCompanyBranches.some((b) => b.id === selectedBranchId);
  const activeBranchId = isSelectedBranchValid 
    ? selectedBranchId 
    : (activeCompanyBranches[0]?.id || "");

  const activeBranchDepartments = departments.filter((d) => d.branchId === activeBranchId);

  // Broadcast creators state
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const [noticeType, setNoticeType] = useState("Quản trị viên phát sóng");

  // Chat input
  const [chatInput, setChatInput] = useState("");

  // PDF controls
  const [selectedReportFactory, setSelectedReportFactory] = useState("Tất cả nhà máy");
  const [selectedReportDate, setSelectedReportDate] = useState("17/06/2026");
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [driveSyncLogs, setDriveSyncLogs] = useState<string[]>([]);

  // Logs filters state
  const [logsSearch, setLogsSearch] = useState("");
  const [logsFactory, setLogsFactory] = useState("Tất cả");
  const [logsCategory, setLogsCategory] = useState("Tất cả");
  const [logsAbnormalOnly, setLogsAbnormalOnly] = useState(false);

  // Proposal filters state
  const [proposalSearch, setProposalSearch] = useState("");
  const [proposalFactory, setProposalFactory] = useState("Tất cả");
  const [proposalCategory, setProposalCategory] = useState("Tất cả");

  // Stats calculation
  const totalReportsCount = reports.filter((r) => !r.isDeleted).length;
  const abnormalReportsCount = reports.filter((r) => r.isAbnormal && !r.isDeleted).length;
  const safeReportsCount = totalReportsCount - abnormalReportsCount;
  const activeStaffCount = users.filter((u) => u.status === UserStatus.ACTIVE).length;
  const pendingApprovalsCount = users.filter((u) => u.status === UserStatus.PENDING).length;

  const pendingReportsCount = reports.filter((r) => {
    if (r.isDeleted) return false;
    if (r.isApproved !== false) return false;
    if (currentUser?.role === UserRole.ADMIN) return true;
    if (currentUser?.role === UserRole.REVIEWER) {
      const clean = (s: string) => (s || "").replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
      return clean(r.factory) === clean(currentUser.branch || "") || r.factory.toLowerCase() === (currentUser.branch || "").toLowerCase();
    }
    return false;
  }).length;

  // Pie chart variables
  const colorMap: Record<Category4M1E1I, string> = {
    "CON NGƯỜI": "#4f46e5",
    "MÁY MÓC": "#10b981",
    "NGUYÊN VẬT LIỆU": "#d946ef",
    "PHƯƠNG PHÁP": "#f59e0b",
    "MÔI TRƯỜNG": "#0d9488",
    "THÔNG TIN": "#64748b"
  };

  const getCategoryStats = () => {
    const counts: Record<Category4M1E1I, number> = {
      "CON NGƯỜI": 0,
      "NGUYÊN VẬT LIỆU": 0,
      "MÁY MÓC": 0,
      "PHƯƠNG PHÁP": 0,
      "MÔI TRƯỜNG": 0,
      "THÔNG TIN": 0
    };
    reports.filter((r) => !r.isDeleted).forEach((r) => {
      if (counts[r.category] !== undefined) counts[r.category]++;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key as Category4M1E1I]
    }));
  };

  const getFactoryStats = () => {
    const map: Record<string, { total: number; abnormal: number }> = {};
    branches.forEach((b) => {
      if (b.isScoring) {
        map[b.name] = { total: 0, abnormal: 0 };
      }
    });

    reports.filter((r) => !r.isDeleted).forEach((r) => {
      if (map[r.factory]) {
        map[r.factory].total++;
        if (r.isAbnormal) map[r.factory].abnormal++;
      }
    });

    return Object.keys(map).map((name) => ({
      name: name.replace("Chi Nhánh ", "").replace("Nhà máy ", ""),
      "Tổng Biến Động": map[name].total,
      "Sự Cố Bất Thường": map[name].abnormal
    }));
  };

  // --- STATS FILTER BY BRANCH & ADVANCED STATISTICAL FUNCTIONS ---
  const [statsBranchFilter, setStatsBranchFilter] = useState("Tất cả");

  const matchFactory = (factoryName: string, filterKey: string): boolean => {
    if (!factoryName) return false;
    const norm = factoryName.toLowerCase();
    if (filterKey === "Tất cả") return true;
    const filterLower = filterKey.toLowerCase();
    if (norm === filterLower || norm.includes(filterLower) || filterLower.includes(norm)) return true;
    const clean = (s: string) => (s || "").replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
    if (clean(factoryName) === clean(filterKey)) return true;
    const extractId = (s: string) => {
      const match = s.match(/\(([^)]+)\)/);
      return match ? match[1].trim().toUpperCase() : "";
    };
    const id1 = extractId(factoryName);
    const id2 = extractId(filterKey);
    if (id1 && id2 && id1 === id2) return true;
    if (id1 && filterLower.includes(id1.toLowerCase())) return true;
    if (id2 && norm.includes(id2.toLowerCase())) return true;
    if (filterLower.includes("bắc ninh") || filterLower.includes("tpp-bni")) {
      return norm.includes("bắc ninh") || norm.includes("tpp-bni");
    }
    if (filterLower.includes("long an") || filterLower.includes("tpp-lan")) {
      return norm.includes("long an") || norm.includes("tpp-lan");
    }
    if (filterLower.includes("văn phòng") || filterLower.includes("tpp-cty") || filterLower.includes("vp cty")) {
      return norm.includes("văn phòng") || norm.includes("tpp-cty") || norm.includes("vp cty");
    }
    if (filterLower.includes("314") || filterLower.includes("tpp-314")) {
      return norm.includes("314") || norm.includes("tpp-314");
    }
    if (filterLower.includes("bbm") || filterLower.includes("dnp-bbm")) {
      return norm.includes("bbm") || norm.includes("dnp-bbm");
    }
    if (filterLower.includes("bbc") || filterLower.includes("dnp-bbc")) {
      return norm.includes("bbc") || norm.includes("dnp-bbc");
    }
    return false;
  };

  const getFilteredStatsReports = () => {
    const nonDeleted = reports.filter((r) => !r.isDeleted);
    if (statsBranchFilter === "Tất cả") return nonDeleted;
    return nonDeleted.filter((r) => matchFactory(r.factory, statsBranchFilter));
  };

  // Helper values for current dynamic filter stats
  const getStatsCountersValue = () => {
    const sReports = getFilteredStatsReports();
    const total = sReports.length;
    const kph = sReports.filter((r) => r.reportType === "KPH" || r.isAbnormal).length;
    const dsa = sReports.filter((r) => r.reportType === "DSA" || r.isSpotlight).length;
    const safeRate = total > 0 ? Math.round(((total - kph) / total) * 100) : 100;
    return { total, kph, dsa, safeRate };
  };

  // 1. Radar data: Số lượng sự cố KPH (Không Phù Hợp) phát sinh theo từng yếu tố 4M1E1I
  const getRadarKphData = () => {
    const sReports = getFilteredStatsReports();
    const counts: Record<Category4M1E1I, number> = {
      "CON NGƯỜI": 0,
      "NGUYÊN VẬT LIỆU": 0,
      "MÁY MÓC": 0,
      "PHƯƠNG PHÁP": 0,
      "MÔI TRƯỜNG": 0,
      "THÔNG TIN": 0
    };
    let hasData = false;
    sReports.forEach((r) => {
      const isKph = r.reportType === "KPH" || r.isAbnormal;
      if (isKph && counts[r.category] !== undefined) {
        counts[r.category]++;
        hasData = true;
      }
    });
    // In case of 0, fill with very tiny fractions or zeros to keep Radar beautifully visible
    return Object.keys(counts).map((key) => ({
      subject: key,
      "Không Phù Hợp (KPH)": counts[key as Category4M1E1I],
      fullMark: 10
    }));
  };

  // 2. So sánh các Chi nhánh: số lượng DSA (Điểm Sáng) vs KPH (Không Phù Hợp)
  const getBranchComparisonData = () => {
    const map: Record<string, { kph: number; dsa: number }> = {};
    branches.forEach((b) => {
      if (b.isScoring) {
        map[b.id] = { kph: 0, dsa: 0 };
      }
    });

    reports.filter((r) => !r.isDeleted).forEach((r) => {
      const matchedBranch = branches.find(b => b.isScoring && matchFactory(r.factory, b.id));
      if (matchedBranch && map[matchedBranch.id]) {
        if (r.reportType === "KPH" || r.isAbnormal) {
          map[matchedBranch.id].kph++;
        } else if (r.reportType === "DSA" || r.isSpotlight) {
          map[matchedBranch.id].dsa++;
        }
      }
    });

    return branches.filter(b => b.isScoring).map((b) => {
      const match = b.name.match(/\(([^)]+)\)/);
      const shortName = match ? match[1] : b.name.replace("Chi Nhánh ", "").replace("Nhà máy ", "").replace("Văn phòng ", "VP ");
      return {
        name: shortName,
        "Không Phù Hợp (KPH)": map[b.id].kph,
        "Điểm Sáng (DSA)": map[b.id].dsa,
        branchId: b.id,
        fullName: b.name
      };
    });
  };

  // 3. Phân tích Pareto cho các nguyên nhân / danh mục sự cố Không Phù Hợp (KPH)
  const getParetoData = () => {
    const sReports = getFilteredStatsReports();
    const counts: Record<Category4M1E1I, number> = {
      "CON NGƯỜI": 0,
      "NGUYÊN VẬT LIỆU": 0,
      "MÁY MÓC": 0,
      "PHƯƠNG PHÁP": 0,
      "MÔI TRƯỜNG": 0,
      "THÔNG TIN": 0
    };
    
    let totalKph = 0;
    sReports.forEach((r) => {
      const isKph = r.reportType === "KPH" || r.isAbnormal;
      if (isKph && counts[r.category] !== undefined) {
        counts[r.category]++;
        totalKph++;
      }
    });

    // Sort in descending order
    const sorted = Object.keys(counts)
      .map((key) => ({
        category: key,
        frequency: counts[key as Category4M1E1I]
      }))
      .sort((a, b) => b.frequency - a.frequency);

    let accum = 0;
    return sorted.map((item) => {
      accum += item.frequency;
      const percentage = totalKph > 0 ? Math.round((item.frequency / totalKph) * 100) : 0;
      const cumulativePercentage = totalKph > 0 ? Math.round((accum / totalKph) * 100) : 0;
      return {
        category: item.category,
        "Số lỗi (Tần suất)": item.frequency,
        "Phần trăm lũy kế (%)": cumulativePercentage,
        percentage
      };
    });
  };

  // 4. Phòng cố vấn AI Chuyên Gia Chất Lượng 4M1E1I recommendations
  const getAiExpertRecommendations = () => {
    const sReports = getFilteredStatsReports();
    const kphReports = sReports.filter((r) => r.reportType === "KPH" || r.isAbnormal);
    const dsaReports = sReports.filter((r) => r.reportType === "DSA" || r.isSpotlight);

    const recons: { id: string; title: string; content: string; level: "CRITICAL" | "WARNING" | "INFO"; action: string }[] = [];

    // Category with highest KPH count
    const counts: Record<string, number> = {};
    kphReports.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    
    let topCategory = "";
    let maxCount = 0;
    Object.keys(counts).forEach((cat) => {
      if (counts[cat] > maxCount) {
        maxCount = counts[cat];
        topCategory = cat;
      }
    });

    if (topCategory && maxCount > 0) {
      const pct = Math.round((maxCount / kphReports.length) * 100);
      recons.push({
        id: "REC-PARETO",
        title: `Phân tích Pareto khuyên cải tiến nhóm: ${topCategory}`,
        content: `Hệ thống thống kê Pareto chỉ ra nhóm yếu tố ${topCategory} hiện chiếm tỷ lệ cao nhất (${pct}% tổng lỗi KPH của ${statsBranchFilter}). Cần ưu tiên dồn tài nguyên cải tiến điểm này để đạt hiệu quả cao nhất (Nguyên lý 80/20).`,
        level: "CRITICAL",
        action: `Thực hiện đánh giá nội bộ đột xuất khu sản xuất và tổ chức đợt huấn luyện nghiệp vụ liên quan đến ${topCategory}.`
      });
    } else {
      recons.push({
        id: "REC-STABLE",
        title: "Chỉ số vận hành an toàn đạt mức Tuyệt đối",
        content: `Không phát hiện bất kỳ điểm nào Không Phù Hợp (KPH) tại ${statsBranchFilter}. Chất lượng đang được duy trì đặc biệt tốt.`,
        level: "INFO",
        action: "Khuyến khích duy trì hoạt động 5S và lưu trữ báo cáo định kỳ theo đúng quy chuẩn chung."
      });
    }

    // Individual KPH scan for critical severity keywords
    kphReports.slice(0, 3).forEach((r) => {
      const hasDirectives = r.directives && r.directives.length > 0;
      const descText = r.content?.toLowerCase() || "";
      let isSevere = r.isAbnormal;
      let reason = "Mức độ khẩn cấp đỏ";

      if (descText.includes("dừng máy") || descText.includes("hỏng") || descText.includes("trục trặc") || descText.includes("phế phẩm")) {
        isSevere = true;
        reason = "Rủi ro đình trệ dây chuyền máy móc";
      }
      if (descText.includes("chấn thương") || descText.includes("nguy hiểm") || descText.includes("an toàn") || descText.includes("điện")) {
        isSevere = true;
        reason = "Rủi ro an toàn lao động";
      }

      recons.push({
        id: `REC-KPH-${r.id}`,
        title: `Rủi ro cao từ điểm lỗi tại ${r.factory}`,
        content: `Phát hiện điểm KPH "${r.content}" (Yếu tố: ${r.category}) thuộc nhóm nguy cơ cao: [${reason}]. ${hasDirectives ? "Đã được ghi nhận chỉ đạo điều hành." : "Cảnh báo chưa có chỉ đạo tức thời từ Quản lý chi nhánh."}`,
        level: isSevere ? "CRITICAL" : "WARNING",
        action: `Đề xuất BP QA/QC chi nhánh cử giám sát xuống hiện trường xác minh và lập biểu kiểm soát khắc phục CAPA.`
      });
    });

    // Praise top DSA
    if (dsaReports.length > 0) {
      const topDsa = dsaReports[dsaReports.length - 1];
      recons.push({
        id: "REC-DSA",
        title: `Sáng kiến Điểm Sáng (DSA) xuất sắc từ ${topDsa.uploaderName}`,
        content: `Ghi nhận sáng kiến đột phá tại ${topDsa.factory}: "${topDsa.content}". Định hướng cải tiến thuộc nhóm ${topDsa.category} mang lại giá trị tích cực cho môi trường vận hành sạch và tinh gọn.`,
        level: "INFO",
        action: `Biên soạn sáng kiến này thành cẩm nang đào tạo SOP mẫu để nhân rộng áp dụng cho toàn bộ các chi nhánh/vpđd còn lại.`
      });
    }

    return recons;
  };

  // Handler to export daily reports and simulate uploading file to Drive
  const handleExportPDF = async () => {
    setDriveSyncLogs([]);
    setPdfProgress("Chuẩn bị biên dịch báo cáo chất lượng...");
    
    // Simulate steps
    const steps = [
      "Bộ vi xử lý: Tổng hợp dữ liệu thô...",
      "Đang tối ưu hóa tài nguyên hình ảnh WebP đính kèm...",
      "Đang kết xuất sơ đồ thống kê chi tiết từng nhà máy...",
      "Đang lập tệp PDF chữ ký số Phòng Quản Lý Chất Lượng...",
      "Khởi chạy tải xuống hệ thống..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPdfProgress(steps[i]);
    }

    try {
      // Filter reports by selected factory
      const filtered = reports.filter((r) => {
        const matchesFactory =
          selectedReportFactory === "Tất cả nhà máy" ? true : r.factory === selectedReportFactory;
        // In real cases comparing logs by selected date if matched
        return matchesFactory;
      });

      const { fileName } = await generateDailyReportPDF({
        factoryName: selectedReportFactory,
        dateString: selectedReportDate,
        reports: filtered,
        authorName: currentUser.fullName
      });

      setPdfProgress("Bản PDF đã tải xuống phần cứng thành công!");

      // Start Google Drive Auto-Storage Simulation
      setDriveSyncLogs((prev) => [
        ...prev,
        "🔄 Bắt đầu đồng bộ lưu trữ đám mây tự động...",
        `🔗 Kết nối máy chủ Google Drive xác thực tài khoản Tân Phú...`,
        `📂 Đang tìm kiếm thư mực: "My Drive > 4M1E1I Reports > Thống kê ngày ${selectedReportDate}"`,
        "⚠️ Thư mục trống. Đang tạo mới đường dẫn lưu trữ...",
        `📤 Đang truyền tải tệp tin: ${fileName} lên Drive...`
      ]);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setDriveSyncLogs((prev) => [
        ...prev,
        `✅ Đồng bộ thành công 100%!`,
        `🔗 File đã được lưu trữ tuyệt đối an toàn tại: My Drive > 4M1E1I Reports > ${selectedReportDate} > ${fileName}`
      ]);
    } catch (e) {
      setPdfProgress("Gặp sự cố phát sinh trong quá trình xuất PDF.");
    }
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
        return { ...u, isOnlineSimulated: true, lastActiveTime: u.lastActive };
      }

      return { ...u, isOnlineSimulated: false, lastActiveTime: u.lastActive };
    });
  };

  const getOnlineCount = () => {
    return getOnlineUsers().filter(u => u.isOnlineSimulated).length;
  };

  const onlineCount = getOnlineCount();

  const hasActiveTicker = !!(tickerConfig?.text && tickerConfig.text.trim() !== "");

  return (
    <div className="flex-1 bg-[#F7F9FC] text-slate-800 flex flex-col min-h-0 font-sans">
      {/* Upper Main Broadcast Marquee Bar with specific ticker text */}
      {hasActiveTicker && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 border-b border-amber-600 flex items-center select-none overflow-hidden shrink-0">
          <div className="bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded mr-3 uppercase tracking-wider animate-pulse flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white block" />
            <T>BẢNG TIN NÓNG (TICKER):</T>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div 
              className="animate-marquee whitespace-nowrap text-xs flex font-mono"
              style={{ 
                animationDuration: `${tickerConfig?.speed || 35}s`,
                gap: `${tickerConfig?.spacing || 50}px`
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <span className="text-red-700 font-extrabold">✦</span>
                  <T className="font-semibold">{tickerConfig.text}</T>
                </div>
              ))}
            </div>
          </div>
          {/* Connection status indicator */}
          <div className="flex items-center gap-2 ml-4 shrink-0 bg-[#1E293B] text-white rounded-full px-3 py-0.5 text-[10px] font-bold">
            <span className={`w-2 h-2 rounded-full ${offlineMode ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
            <T>{offlineMode ? "MẤT KẾT NỐI (LƯU LỌC COIL)" : "ĐANG TRỰC TUYẾN"}</T>
          </div>
        </div>
      )}

      {/* Main Admin Header Panel */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm text-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-md tracking-wider">
              <T>TÂN PHÚ 4M1E1I</T>
            </div>
            <T className="text-xs text-slate-500 font-bold tracking-wide uppercase">HỆ THỐNG KIỂM SOÁT THAY ĐỔI THEO THỜI GIAN THỰC</T>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            <T>Trang Quản Trị Hệ Thống Tân Phú Group</T>
            <span className="text-xs font-medium text-slate-400 block">v4.1.3</span>
          </h1>
        </div>

        {/* Corporate Header Info Credentials */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <T>Quản trị tối cao: Lê Nhật Trường</T>
            </div>
            <T className="text-[10px] text-slate-500 block font-semibold mt-0.5">
              Bộ phận: {STANDARDIZED_QC_DEPT}
            </T>
          </div>
          {currentUser.role !== UserRole.STAFF && currentUser.role !== UserRole.REVIEWER && (
            <>
              <div className="border-l border-slate-300 h-8 self-center" />
              
              {/* Nút hiển thị số người online cực đẹp */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDesktopOnlineSearch("");
                    setShowDesktopOnlinePopover(!showDesktopOnlinePopover);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold rounded-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Nhấp để hiển thị danh sách người đang hoạt động trực tuyến"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse pointer-events-none" />
                  <T>ONLINE:</T>
                  <span className="font-mono text-[11px] font-black pointer-events-none">{onlineCount}</span>
                </button>

                {/* Popover danh sách người online (bản Desktop) */}
                {showDesktopOnlinePopover && (
                  <div className="absolute right-0 top-11 bg-white border border-slate-200 w-72 rounded-xl shadow-2xl p-4 z-50 animate-fadeIn text-left">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10.5px] font-extrabold text-[#1e3a8a] flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <T>TRỰC TUYẾN THỜI GIAN THỰC</T>
                      </span>
                      <button
                        onClick={() => setShowDesktopOnlinePopover(false)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-xs"
                        title="Đóng bản tin"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Ô tìm kiếm nhỏ */}
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhân sự..."
                      value={desktopOnlineSearch}
                      onChange={(e) => setDesktopOnlineSearch(e.target.value)}
                      className="w-full px-2.5 py-1 bg-slate-50 text-[10px] font-sans font-bold border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 mb-2"
                    />

                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {(() => {
                        const searchClean = desktopOnlineSearch.toLowerCase().trim();
                        const processed = getOnlineUsers().filter(
                          (u) =>
                            u.isOnlineSimulated &&
                            (u.fullName.toLowerCase().includes(searchClean) ||
                              u.id.includes(searchClean) ||
                              (u.department && u.department.toLowerCase().includes(searchClean)))
                        );

                        if (processed.length === 0) {
                          return (
                            <div className="text-center py-4 text-[9.5px] text-slate-400 font-bold">
                              <T>Không có nhân sự trùng khớp</T>
                            </div>
                          );
                        }

                        return processed.map((u) => {
                          const nameParts = u.fullName.split(" ");
                          const initials =
                            nameParts.length >= 2
                              ? (nameParts[nameParts.length - 2][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                              : u.fullName.slice(0, 2).toUpperCase();

                          return (
                            <div
                              key={u.id}
                              className="flex items-center gap-2.5 p-1.5 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors"
                            >
                              <div className="relative shrink-0">
                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black font-sans">
                                  {initials}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                              </div>
                              
                              <div className="flex-1 min-w-0 font-sans text-left">
                                <div className="text-[10px] font-extrabold text-slate-800 truncate leading-tight">
                                  <T>{u.fullName}</T>
                                </div>
                                <div className="text-[8.5px] text-slate-400 font-semibold truncate mt-0.5">
                                  <span className="font-mono">{u.id}</span>
                                  <span className="mx-1">|</span>
                                  <T>{u.department || u.branch}</T>
                                </div>
                              </div>

                              <div className="bg-emerald-500/10 text-emerald-600 text-[7px] font-black px-1 py-0.5 rounded animate-pulse shrink-0">
                                <T>LIVE</T>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="border-l border-slate-300 h-8 self-center" />
          <button
            onClick={onToggleMobilePreview}
            className="px-3.5 py-2 bg-blue-650 text-white rounded-lg text-xs font-sans font-black bg-blue-600 hover:bg-blue-600 active:scale-95 transition-all text-center flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <T>XEM MOBILE LIVE</T>
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <T>Đăng xuất</T>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Navigation panel */}
        <nav className="w-full md:w-64 bg-[#1E293B] border-r border-[#1E293B] p-4 shrink-0 overflow-y-auto select-none space-y-2 text-white">
          <T className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-3 block mb-3">PANEL ĐIỀU HÀNH</T>
          {[
            ...(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER
              ? [
                  { id: "PHÊ_DUYỆT", label: "Phê duyệt nhân sự", icon: UserCheck, count: pendingApprovalsCount, color: "text-amber-400" },
                  { id: "QUOTA_CLOUD", label: "Giám sát Cloud Quota", icon: CloudLightning, color: "text-amber-300" }
                ]
              : []),
            { id: "MÃ_HÓA", label: "Khai báo mã hóa", icon: Sliders, color: "text-purple-400" },
            { id: "TRIỂN_KHAI", label: "Triển khai đơn hàng", icon: Package, color: "text-rose-400" },
            { id: "THỐNG_KÊ", label: "Báo cáo thống kê", icon: BarChart4, color: "text-emerald-400" },
            ...(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER
              ? [{ id: "ĐỀ_XUẤT", label: "Đề xuất chờ duyệt", icon: CheckSquare, count: pendingReportsCount, color: "text-sky-400" }]
              : []),
            ...(currentUser.role === UserRole.ADMIN
              ? [{ id: "DỮ_LIỆU", label: "Nhật ký dữ liệu & PDF", icon: Database, color: "text-blue-450" }]
              : []),
            { id: "THÔNG_BÁO", label: "Phát sóng & Ticker", icon: Bell, count: unreadCount, color: "text-yellow-400" },
            { id: "TRAO_ĐỔI", label: "Trao đổi diễn đàn", icon: MessageSquare, color: "text-pink-400" },
            { id: "QUY_CHẾ", label: "Quy chế & Quy trình", icon: FileSpreadsheet, color: "text-teal-400" },
            { id: "CÁ_NHÂN", label: "Trang cá nhân", icon: Users, color: "text-slate-300" }
          ].map((item) => {
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isSel
                    ? "bg-[#0F172A] text-blue-400 font-bold border-l-4 border-blue-500 shadow-inner"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <T>{item.label}</T>
                </div>
                {item.count && item.count > 0 ? (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full block animate-bounce">
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="pt-6 border-t border-slate-800/60">
            <div className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800/80">
              <T className="text-xs font-bold text-white block">Tóm tắt số liệu 4M1E1I</T>
              <div className="grid grid-cols-2 gap-2 mt-2 select-none">
                <div className="bg-[#1E293B] p-2 rounded border border-slate-700 text-center">
                  <T className="text-[10px] text-slate-400 block font-bold leading-none uppercase">Đóng góp</T>
                  <T className="text-base font-bold text-blue-400 block mt-1">{totalReportsCount}</T>
                </div>
                <div className="bg-[#1E293B] p-2 rounded border border-slate-700 text-center">
                  <T className="text-[10px] text-red-400 block font-bold leading-none uppercase">Bất thường</T>
                  <T className="text-base font-bold text-red-400 block mt-1">{abnormalReportsCount}</T>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Dynamic workspace container */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#F7F9FC]">
          {/* TAB 1: PHÊ DUYỆT (Personnel management) */}
          {activeTab === "PHÊ_DUYỆT" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-500" />
                    <T>Phê duyệt hoạt động Nhân viên</T>
                  </h2>
                  <T className="text-xs text-slate-500 mt-1 block">Quản lý duyệt cấp phép truy cập, chỉnh sửa phân quyền và kích hoạt tài khoản của nhân viên các xưởng.</T>
                </div>

                <div translate="no" className="notranslate shrink-0 self-start md:self-center">
                  <button
                    onClick={async () => {
                      if (onForceSyncUsers) {
                        try {
                          setForceSyncUsersState("syncing");
                          await onForceSyncUsers();
                          setForceSyncUsersState("success");
                          setTimeout(() => setForceSyncUsersState("idle"), 3000);
                        } catch (err) {
                          console.error(err);
                          setForceSyncUsersState("error");
                          setTimeout(() => setForceSyncUsersState("idle"), 3000);
                        }
                      }
                    }}
                    disabled={forceSyncUsersState === "syncing" || offlineMode}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl shadow-md border transition-all cursor-pointer select-none uppercase tracking-wide shrink-0 ${
                      forceSyncUsersState === "syncing"
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : forceSyncUsersState === "success"
                        ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700"
                        : forceSyncUsersState === "error"
                        ? "bg-rose-600 border-rose-700 text-white hover:bg-rose-700"
                        : "bg-purple-600 hover:bg-purple-700 text-white border-purple-700 hover:shadow-lg transform active:scale-95"
                    }`}
                  >
                    {forceSyncUsersState === "syncing" ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span translate="no" className="notranslate">Đang đồng bộ phong tỏa...</span>
                      </>
                    ) : forceSyncUsersState === "success" ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-white shrink-0" />
                        <span translate="no" className="notranslate">Đồng bộ Đám mây OK</span>
                      </>
                    ) : forceSyncUsersState === "error" ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                        <span translate="no" className="notranslate">Lỗi đồng bộ đám mây</span>
                      </>
                    ) : (
                      <>
                        <CloudLightning className="w-4 h-4 text-white shrink-0" />
                        <span translate="no" className="notranslate">Lưu cưỡng bức lên Đám mây</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Header panel styled exactly as the screenshot */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4.5 h-4.5 text-[#1e3a8a]" />
                        <T className="notranslate">DANH SÁCH CBNV ĐĂNG KÝ HỆ THỐNG</T>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <T>Với tư cách Admin tối cao, bạn có thể phê duyệt quyền vào sảnh học tập cho CBNV quốc gia.</T>
                      </p>
                    </div>

                    {/* Right side controls matching screenshot: MOBILE, XUẤT EXCEL, NHẬP EXCEL, REFRESH */}
                    <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end flex-wrap">
                      <button
                        onClick={onToggleMobilePreview}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg shadow-sm transition-all border-none cursor-pointer select-none"
                        title="Xem chế độ Mobile Live"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-white" />
                        <T>MOBILE</T>
                      </button>

                      <button
                        onClick={() => {
                          const exportUsers = [...users];
                          const headers = [
                            "Mã nhân sự",
                            "Họ tên",
                            "Số điện thoại",
                            "Chức vụ",
                            "Chi nhánh",
                            "Bộ phận",
                            "Vai trò",
                            "Trạng thái"
                          ];
                          const rows = exportUsers.map(u => [
                            u.id,
                            u.fullName,
                            u.phone,
                            u.position || "Nhân Viên",
                            u.branch,
                            u.department,
                            u.role,
                            u.status
                          ]);
                          const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.setAttribute("href", url);
                          link.setAttribute("download", `DANH_SACH_CBNV_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          if (onShowToast) {
                            onShowToast("Đã xuất dữ liệu CBNV ra file CSV thành công!", "success");
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 active:scale-95 font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer bg-white"
                        title="Xuất file Excel/CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <T>XUẤT EXCEL</T>
                      </button>

                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95 font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer bg-white"
                        title="Nhập file Excel/CSV"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <T>NHẬP EXCEL</T>
                      </button>

                      <button
                        onClick={async () => {
                          if (onForceSyncUsers) {
                            try {
                              setForceSyncUsersState("syncing");
                              await onForceSyncUsers();
                              setForceSyncUsersState("success");
                              setTimeout(() => setForceSyncUsersState("idle"), 3000);
                              if (onShowToast) onShowToast("Đồng bộ danh sách nhân sự thành công!", "success");
                            } catch (err) {
                              console.error(err);
                              setForceSyncUsersState("error");
                              setTimeout(() => setForceSyncUsersState("idle"), 3000);
                              if (onShowToast) onShowToast("Lỗi đồng bộ danh sách!", "error");
                            }
                          }
                        }}
                        disabled={forceSyncUsersState === "syncing" || offlineMode}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-lg transition-all cursor-pointer bg-white flex items-center justify-center disabled:opacity-50"
                        title="Đồng bộ / Làm mới"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${forceSyncUsersState === "syncing" ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Filter Row exactly matching screenshot */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-200/60">
                    {/* Search Input */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Tìm tên, SĐT, mã số..."
                        className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-full text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white transition-all shadow-2xs"
                      />
                      {userSearchQuery && (
                        <button
                          onClick={() => setUserSearchQuery("")}
                          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-sans"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Role dropdown */}
                    <div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '1.75rem' }}
                      >
                        <option value="all">Mọi vai trò</option>
                        <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
                        <option value={UserRole.REVIEWER}>{UserRole.REVIEWER}</option>
                        <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
                      </select>
                    </div>

                    {/* Status dropdown */}
                    <div>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '1.75rem' }}
                      >
                        <option value="all">Mọi trạng thái</option>
                        <option value={UserStatus.ACTIVE}>{UserStatus.ACTIVE}</option>
                        <option value={UserStatus.PENDING}>{UserStatus.PENDING}</option>
                        <option value={UserStatus.LOCKED}>{UserStatus.LOCKED}</option>
                        <option value={UserStatus.REJECTED}>{UserStatus.REJECTED}</option>
                      </select>
                    </div>

                    {/* Branch dropdown */}
                    <div>
                      <select
                        value={userBranchFilter}
                        onChange={(e) => setUserBranchFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '1.75rem' }}
                      >
                        <option value="all">Mọi chi nhánh</option>
                        {Array.from(new Set(users.map(u => u.branch).filter(Boolean))).map((br) => (
                          <option key={br} value={br}>{getFormattedUserBranch(br)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department dropdown */}
                    <div>
                      <select
                        value={userDepartmentFilter}
                        onChange={(e) => setUserDepartmentFilter(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '1.75rem' }}
                      >
                        <option value="all">Mọi bộ phận</option>
                        {Array.from(new Set(users.map(u => u.department).filter(Boolean))).map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                        <th className="p-4"><T>Họ tên nhân viên / SĐT</T></th>
                        <th className="p-4"><T>Thuộc bộ phận / Chi nhánh</T></th>
                        <th className="p-4"><T>Vai trò phân cấp</T></th>
                        <th className="p-4"><T>Phê duyệt trạng thái</T></th>
                        <th className="p-4 text-center"><T>Phân bổ thao tác</T></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {(() => {
                        let filteredUsers = [...users];
                        // If current user is REVIEWER (approver/Trưởng nhóm), only show users in their branch
                        if (currentUser.role === UserRole.REVIEWER) {
                          filteredUsers = filteredUsers.filter((u) => u.branch === currentUser.branch);
                        }

                        // Apply Search & Filter States
                        if (userSearchQuery.trim() !== "") {
                          const query = userSearchQuery.toLowerCase().trim();
                          filteredUsers = filteredUsers.filter(
                            (u) =>
                              (u.fullName && u.fullName.toLowerCase().includes(query)) ||
                              (u.phone && u.phone.toLowerCase().includes(query)) ||
                              (u.id && u.id.toLowerCase().includes(query))
                          );
                        }

                        if (userRoleFilter !== "all") {
                          filteredUsers = filteredUsers.filter((u) => u.role === userRoleFilter);
                        }

                        if (userStatusFilter !== "all") {
                          filteredUsers = filteredUsers.filter((u) => u.status === userStatusFilter);
                        }

                        if (userBranchFilter !== "all") {
                          filteredUsers = filteredUsers.filter((u) => u.branch === userBranchFilter);
                        }

                        if (userDepartmentFilter !== "all") {
                          filteredUsers = filteredUsers.filter((u) => u.department === userDepartmentFilter);
                        }
                        
                        // Sort users by priorities: 
                        // 1. Admin (role === UserRole.ADMIN)
                        // 2. Pending approval (status === UserStatus.PENDING)
                        // 3. Online (isOnline || current user || heartbeat active within 4 minutes/240000ms)
                        // 4. Reviewer (role === UserRole.REVIEWER)
                        // 5. Staff (role === UserRole.STAFF or others)
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

                        filteredUsers.sort((a, b) => {
                          const rA = getUserSortRank(a);
                          const rB = getUserSortRank(b);
                          if (rA !== rB) return rA - rB;
                          return a.fullName.localeCompare(b.fullName, "vi");
                        });
                        
                        if (filteredUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold select-none">
                                <T>Không tìm thấy danh sách nhân sự cần thao tác thuộc chi nhánh của bạn.</T>
                              </td>
                            </tr>
                          );
                        }

                        return filteredUsers.map((u) => {
                          const isSelf = u.id === currentUser.id;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {u.avatar ? (
                                    <img 
                                      src={u.avatar} 
                                      alt="User Avatar" 
                                      className="w-8 h-8 rounded-full object-cover shrink-0 select-none border border-slate-200"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 select-none border border-slate-200">
                                      {u.fullName.charAt(0)}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <T className="font-extrabold text-slate-800 text-[12px] uppercase">{u.fullName}</T>
                                      {isSelf && (
                                        <span className="bg-slate-100 text-slate-600 rounded px-1 py-0.2 text-[8px] font-black uppercase">
                                          <T>Bạn</T>
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <span className="font-black text-slate-400 select-none uppercase tracking-wider text-[10px]">MS:</span>
                                      <span className="font-mono font-bold text-blue-600">{u.id}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <span className="font-black text-slate-400 select-none uppercase tracking-wider text-[10px]">ĐT:</span>
                                      <span className="font-mono font-semibold text-slate-700">{u.phone}</span>
                                    </div>
                                    <div className="pt-0.5">
                                      <span className="font-sans font-black text-indigo-700 uppercase text-[9.5px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md inline-block tracking-wide select-none notranslate" translate="no">
                                        {u.position || "Nhân Viên"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 leading-relaxed">
                                <div className="text-slate-800 font-extrabold text-[11.5px]">{getFormattedUserDept(u.department, u.branch)}</div>
                                <div className="text-slate-400 text-[10.5px] font-medium">{getFormattedUserBranch(u.branch, u.company)}</div>
                              </td>
                              <td className="p-4 select-none">
                                <select
                                  value={u.role}
                                  disabled={isSelf}
                                  onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserRole)}
                                  className={`px-2 py-1 rounded text-[10px] font-extrabold cursor-pointer border ${
                                    u.role === UserRole.ADMIN
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : u.role === UserRole.REVIEWER
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  } focus:outline-none`}
                                >
                                  <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
                                  <option value={UserRole.REVIEWER}>{UserRole.REVIEWER}</option>
                                  <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
                                </select>
                              </td>
                              <td className="p-4 select-none">
                                {u.status === UserStatus.ACTIVE ? (
                                  <span className="bg-[#DEF7EC] text-[#03543F] text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-100 inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                                    <T>{UserStatus.ACTIVE}</T>
                                  </span>
                                ) : u.status === UserStatus.PENDING ? (
                                  <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold px-2 py-1 rounded-full border border-amber-150 inline-flex items-center gap-1.5 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" />
                                    <T>{UserStatus.PENDING}</T>
                                  </span>
                                ) : u.status === UserStatus.REJECTED ? (
                                  <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full border border-red-150 inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 block" />
                                    <T>{UserStatus.REJECTED}</T>
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 block" />
                                    <T>{UserStatus.LOCKED}</T>
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center items-center gap-1.5 select-none">
                                  {/* Button 1: Đặc cách (Zap) */}
                                  {u.role !== UserRole.ADMIN && onUpdateUser && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUpdateUser({
                                          ...u,
                                          canSpeciallyEditDelete: !u.canSpeciallyEditDelete
                                        });
                                      }}
                                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                                        u.canSpeciallyEditDelete
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100/80"
                                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                                      }`}
                                      title={u.canSpeciallyEditDelete ? "Hủy đặt cách Sửa/Xóa bản tin chi nhánh" : "Đặt cách Sửa/Xóa bản tin chi nhánh"}
                                    >
                                      <Zap className={`w-3.5 h-3.5 ${u.canSpeciallyEditDelete ? "fill-indigo-600 font-extrabold text-indigo-700" : ""}`} />
                                    </button>
                                  )}

                                  {/* Button 1.5: Đặc cách Đăng tin không cần duyệt (Sparkles) */}
                                  {u.role === UserRole.STAFF && onUpdateUser && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onUpdateUser({
                                          ...u,
                                          bypassApproval: !u.bypassApproval
                                        });
                                      }}
                                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                                        u.bypassApproval
                                          ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100/80"
                                          : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-amber-600"
                                      }`}
                                      title={u.bypassApproval ? "Hủy đặc cách Đăng tin không duyệt" : "Đặc cách Đăng tin không duyệt (Nhân viên lâu năm)"}
                                    >
                                      <Sparkles className={`w-3.5 h-3.5 ${u.bypassApproval ? "fill-amber-500 text-amber-650" : ""}`} />
                                    </button>
                                  )}

                                  {/* Button 2: Khóa/Mở khóa (Lock/Unlock) */}
                                  {u.status === UserStatus.ACTIVE && !isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateUserStatus(u.id, UserStatus.LOCKED)}
                                      className="p-1.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 transition-all cursor-pointer shadow-xs active:scale-95"
                                      title="Khóa tài khoản thành viên"
                                    >
                                      <Unlock className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {u.status === UserStatus.LOCKED && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateUserStatus(u.id, UserStatus.ACTIVE)}
                                      className="p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all cursor-pointer shadow-xs active:scale-95"
                                      title="Mở khóa kích hoạt tài khoản"
                                    >
                                      <Lock className="w-3.5 h-3.5 fill-amber-500/10 text-amber-600" />
                                    </button>
                                  )}

                                  {/* Button 3: Kích hoạt (Check) & Từ chối (X) when PENDING */}
                                  {u.status === UserStatus.PENDING && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateUserStatus(u.id, UserStatus.ACTIVE)}
                                        className="p-1.5 bg-[#DEF7EC] text-[#03543F] border border-emerald-250 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95 flex items-center justify-center animate-bounce"
                                        title="Phê duyệt kích hoạt tài khoản ngay"
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onUpdateUserStatus(u.id, UserStatus.REJECTED)}
                                        className="p-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95 flex items-center justify-center"
                                        title="Từ chối yêu cầu đăng ký"
                                      >
                                        <X className="w-3.5 h-3.5 stroke-[3px]" />
                                      </button>
                                    </>
                                  )}

                                  {/* Active re-trigger for rejected users */}
                                  {u.status === UserStatus.REJECTED && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateUserStatus(u.id, UserStatus.ACTIVE)}
                                      className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-150 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95 flex items-center justify-center"
                                      title="Phê duyệt tái kích hoạt tài khoản"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                                    </button>
                                  )}

                                  {/* Button 4: Sửa thành viên (Edit) */}
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditUser(u)}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95 flex items-center justify-center"
                                    title="Chỉnh sửa thông tin thành viên"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                {/* Button 5: Xóa thành viên (Delete/Trash) */}
                                {!isSelf && (
                                  userIdConfirmDlt === u.id ? (
                                    <div className="flex items-center gap-1 select-none shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteUser(u.id);
                                          setUserIdConfirmDlt(null);
                                        }}
                                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[9px] px-2 py-1 rounded-md transition-all cursor-pointer uppercase shadow-xs shrink-0"
                                      >
                                        <T>Xóa</T>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setUserIdConfirmDlt(null)}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[9px] px-2 py-1 rounded-md transition-all cursor-pointer uppercase shadow-xs shrink-0"
                                      >
                                        <T>Hủy</T>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUserIdConfirmDlt(u.id);
                                      }}
                                      className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-250 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-all shadow-xs active:scale-95 flex items-center justify-center"
                                      title="Xóa nhân sự khỏi hệ thống"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit User Modal */}
              {editingUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] transition-all">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full relative">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      title="Đóng"
                    >
                      ✕
                    </button>

                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Edit className="w-4 h-4 text-[#1e3a8a]" />
                      <T>CHỈNH SỬA THÔNG TIN NHÂN VIÊN</T>
                    </h3>

                    <form onSubmit={handleSaveEditedUser} className="space-y-4">
                      {/* Họ và Tên */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>Họ và Tên</T>
                        </label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Số Điện Thoại & Mã Nhân Sự */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                            <T>Số Điện Thoại</T>
                          </label>
                          <input
                            type="text"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                            <T>Mã Nhân Sự</T>
                          </label>
                          <input
                            type="text"
                            required
                            value={editUserId}
                            onChange={(e) => setEditUserId(e.target.value.trim())}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      {/* Mật khẩu đăng nhập */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>Mật khẩu đăng nhập (Mới hoặc cũ)</T>
                        </label>
                        <input
                          type="text"
                          required
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Công Ty Thành Viên */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>Công Ty Thành Viên</T>
                        </label>
                        <select
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer"
                        >
                          {companies.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CHI NHÁNH/ VĂN PHÒNG ĐẠI DIỆN */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>CHI NHÁNH/ VĂN PHÒNG ĐẠI DIỆN</T>
                        </label>
                        <select
                          value={editBranch}
                          onChange={(e) => setEditBranch(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer"
                        >
                          {(() => {
                            const selectedC = companies.find((c) => c.name === editCompany);
                            const companyBranches = selectedC
                              ? branches.filter((b) => b.companyId === selectedC.id)
                              : [];
                            if (companyBranches.length === 0) {
                              return <option value="">Chưa có chi nhánh</option>;
                            }
                            return companyBranches.map((br) => {
                              const nameWithSuffix = br.name.includes("(") 
                                ? br.name 
                                : `${br.name.replace(/\s*\([^)]+\)$/, "").trim()} (${br.companyId})`;
                              return (
                                <option key={br.id} value={nameWithSuffix}>
                                  {nameWithSuffix}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>

                      {/* BỘ PHẬN/ ĐƠN VỊ */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>BỘ PHẬN/ ĐƠN VỊ</T>
                        </label>
                        <select
                          value={editDepartment}
                          onChange={(e) => setEditDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer"
                        >
                          {(() => {
                            const selectedB = branches.find((b) => {
                              const nameWithSuffix = b.name.includes("(") 
                                ? b.name 
                                : `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
                              return b.name === editBranch || nameWithSuffix === editBranch;
                            });
                            const filteredDepts = selectedB
                              ? departments.filter((d) => d.branchId === selectedB.id)
                              : [];
                            if (filteredDepts.length === 0) {
                              return <option value="">Chưa có bộ phận</option>;
                            }
                            return filteredDepts.map((dept) => {
                              const branchSuffix = selectedB ? selectedB.id : dept.branchId;
                              const nameWithSuffix = dept.name.includes("(")
                                ? dept.name
                                : `${dept.name.replace(/\s*\([^)]+\)$/, "").trim()} (${branchSuffix})`;
                              return (
                                <option key={dept.id} value={nameWithSuffix}>
                                  {nameWithSuffix}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>

                      {/* Chức vụ */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>Chức vụ (Tính điểm huy hiệu)</T>
                        </label>
                        <input
                          type="text"
                          required
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          placeholder="Ví dụ: Nhân Viên, Trưởng Ca, Trưởng Phòng..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                        />
                      </div>

                      {/* Vai trò hệ thống & Trạng thái tài khoản */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                            <T>Vai trò hệ thống</T>
                          </label>
                          <select
                            value={editRole}
                            disabled={editingUser.id === currentUser.id}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer"
                          >
                            <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
                            <option value={UserRole.REVIEWER}>{UserRole.REVIEWER}</option>
                            <option value={UserRole.STAFF}>{UserRole.STAFF}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                            <T>Trạng thái tài khoản</T>
                          </label>
                          <select
                            value={editStatus}
                            disabled={editingUser.id === currentUser.id}
                            onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer"
                          >
                            <option value={UserStatus.ACTIVE}>{UserStatus.ACTIVE}</option>
                            <option value={UserStatus.PENDING}>{UserStatus.PENDING}</option>
                            <option value={UserStatus.LOCKED}>{UserStatus.LOCKED}</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase"
                        >
                          <T>HỦY BỎ</T>
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#152862] text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer uppercase flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <T>CẬP NHẬT</T>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Import Users Modal */}
              {showImportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] transition-all">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-xl w-full relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportPastedText("");
                      }}
                      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold transition-all cursor-pointer border-none"
                      title="Đóng"
                    >
                      ✕
                    </button>

                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <T>NHẬP DANH SÁCH CBNV TỪ EXCEL / CSV</T>
                    </h3>

                    <div className="space-y-4">
                      <div className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100/60">
                        <strong className="text-blue-700 block mb-1">💡 Hướng dẫn định dạng dữ liệu:</strong>
                        <T>Bạn có thể kéo thả file .csv, hoặc copy trực tiếp các hàng từ Excel và dán vào ô văn bản phía dưới.</T>
                        <ul className="list-disc pl-4 mt-1.5 space-y-1 font-semibold text-slate-600">
                          <li><T>Thứ tự các cột: Mã nhân sự | Họ và Tên | Số điện thoại | Chi nhánh | Bộ phận | Vai trò | Trạng thái</T></li>
                          <li><T>Ví dụ: 2018.00281, Lê Nhật Trường, 0907767304, TPP-CTY, Phòng Quản Lý Chất Lượng, NHÂN VIÊN, Đã hoạt động</T></li>
                        </ul>
                      </div>

                      {/* File Drag and Drop Zone */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                          <T>Tải lên File CSV / Text</T>
                        </label>
                        <div 
                          className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer relative"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const files = e.dataTransfer.files;
                            if (files && files[0]) {
                              const file = files[0];
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setImportPastedText(evt.target.result as string);
                                  if (onShowToast) onShowToast(`Đã đọc nội dung file: ${file.name}`, "info");
                                }
                              };
                              reader.readAsText(file);
                            }
                          }}
                        >
                          <input 
                            type="file" 
                            accept=".csv, .txt, text/csv, text/plain"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  if (evt.target?.result) {
                                    setImportPastedText(evt.target.result as string);
                                    if (onShowToast) onShowToast(`Đã đọc nội dung file: ${file.name}`, "info");
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                          />
                          <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs font-bold text-slate-700">
                            <T>Kéo thả file CSV vào đây hoặc click để chọn file</T>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            <T>Hỗ trợ định dạng .csv hoặc .txt mã hóa UTF-8</T>
                          </p>
                        </div>
                      </div>

                      {/* Paste Area */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 flex justify-between">
                          <span><T>Nội dung dữ liệu đã đọc hoặc dán</T></span>
                          {importPastedText && (
                            <button 
                              type="button"
                              onClick={() => setImportPastedText("")}
                              className="text-red-500 hover:text-red-700 text-[9px] font-bold cursor-pointer border-none bg-transparent"
                            >
                              [Xóa hết]
                            </button>
                          )}
                        </label>
                        <textarea
                          rows={6}
                          value={importPastedText}
                          onChange={(e) => setImportPastedText(e.target.value)}
                          placeholder="Nhập hoặc dán các dòng dữ liệu tại đây...&#10;Mã nhân sự, Họ tên, Số điện thoại..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                        />
                      </div>

                      <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowImportModal(false);
                            setImportPastedText("");
                          }}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer uppercase"
                        >
                          <T>HỦY BỎ</T>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!importPastedText.trim()) {
                              if (onShowToast) onShowToast("Vui lòng nhập nội dung cần nhập!", "error");
                              return;
                            }

                            const lines = importPastedText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
                            let successCount = 0;
                            let duplicateCount = 0;

                            lines.forEach(line => {
                              let parts = line.split(/[\t,;]/).map(p => p.trim());
                              if (parts[0] && (parts[0].toLowerCase().includes("mã") || parts[0].toLowerCase().includes("id") || parts[0].toLowerCase().includes("họ tên"))) {
                                return;
                              }

                              if (parts.length >= 3) {
                                const id = parts[0];
                                const fullName = parts[1];
                                const phone = parts[2];
                                
                                let position = "Nhân Viên";
                                let branch = "TPP-CTY";
                                let department = "Phòng Quản Lý Chất Lượng";
                                let role = UserRole.STAFF;
                                let status = UserStatus.ACTIVE;

                                if (parts.length >= 8) {
                                  position = parts[3] || "Nhân Viên";
                                  branch = parts[4] || "TPP-CTY";
                                  department = parts[5] || "Phòng Quản Lý Chất Lượng";
                                  role = (parts[6] as UserRole) || UserRole.STAFF;
                                  status = (parts[7] as UserStatus) || UserStatus.ACTIVE;
                                } else {
                                  // Legacy format: ID, Họ tên, SĐT, Chi nhánh, Bộ phận, Vai trò, Trạng thái
                                  branch = parts[3] || "TPP-CTY";
                                  department = parts[4] || "Phòng Quản Lý Chất Lượng";
                                  role = (parts[5] as UserRole) || UserRole.STAFF;
                                  status = (parts[6] as UserStatus) || UserStatus.ACTIVE;
                                }

                                if (!id || !fullName || !phone) return;

                                const exists = users.some(u => u.id === id);
                                if (exists) {
                                  duplicateCount++;
                                  return;
                                }

                                const newUser: User = {
                                  id,
                                  fullName: formatNameCapitalized(fullName),
                                  phone,
                                  position,
                                  branch,
                                  department,
                                  role,
                                  status
                                };

                                onAddUser(newUser);
                                successCount++;
                              }
                            });

                            if (onShowToast) {
                              if (successCount > 0) {
                                onShowToast(`Đã nhập thành công ${successCount} nhân sự! ${duplicateCount > 0 ? `(Bỏ qua ${duplicateCount} mã trùng lặp)` : ""}`, "success");
                              } else {
                                onShowToast("Không tìm thấy dòng dữ liệu hợp lệ. Vui lòng kiểm tra định dạng!", "warning");
                              }
                            }

                            setShowImportModal(false);
                            setImportPastedText("");
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer uppercase flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <T>BẮT ĐẦU NHẬP</T>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MÃ HÓA (Encoding structural registries) */}
          {activeTab === "MÃ_HÓA" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-purple-500" />
                    <span translate="no" className="notranslate">Khai báo và Mã hóa Dữ liệu Đồng bộ</span>
                  </h2>
                  <div className="mt-2 bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 leading-relaxed font-medium">
                    <span translate="no" className="notranslate">
                      {"Cấu trúc danh mục gồm 3 Cấp (Cột 1: Công ty -> Cột 2: Chi nhánh/VPĐD -> Cột 3: Bộ phận/Đơn vị) đã được cập nhật hoàn chỉnh, đồng bộ trực tiếp lên Cloud Firestore (config/company_mappings) và bộ nhớ đệm localStorage của trình duyệt:"}
                    </span>
                  </div>
                </div>

                <div translate="no" className="notranslate shrink-0 self-start sm:self-center">
                  <button
                    onClick={async () => {
                      if (onForceSyncMetadata) {
                        try {
                          setForceSyncState("syncing");
                          await onForceSyncMetadata();
                          setForceSyncState("success");
                          setTimeout(() => setForceSyncState("idle"), 3000);
                        } catch (err) {
                          console.error(err);
                          setForceSyncState("error");
                          setTimeout(() => setForceSyncState("idle"), 3000);
                        }
                      }
                    }}
                    disabled={forceSyncState === "syncing" || offlineMode}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl shadow-md border transition-all cursor-pointer select-none uppercase tracking-wide shrink-0 ${
                      forceSyncState === "syncing"
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : forceSyncState === "success"
                        ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700"
                        : forceSyncState === "error"
                        ? "bg-rose-600 border-rose-700 text-white hover:bg-rose-700"
                        : "bg-purple-600 hover:bg-purple-700 text-white border-purple-700 hover:shadow-lg transform active:scale-95"
                    }`}
                  >
                    {forceSyncState === "syncing" ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span translate="no" className="notranslate">Đang đồng bộ phong tỏa...</span>
                      </>
                    ) : forceSyncState === "success" ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-white shrink-0" />
                        <span translate="no" className="notranslate">Đồng bộ Đám mây OK</span>
                      </>
                    ) : forceSyncState === "error" ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                        <span translate="no" className="notranslate">Lỗi đồng bộ đám mây</span>
                      </>
                    ) : (
                      <>
                        <CloudLightning className="w-4 h-4 text-white shrink-0" />
                        <span translate="no" className="notranslate">Lưu cưỡng bức lên Đám mây</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-tabs selector for MA_HOA */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setMaHoaSubTab("SO_DO")}
                  className={`px-5 py-3 text-xs font-black select-none uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 border-none outline-none ${
                    maHoaSubTab === "SO_DO"
                      ? "border-b-2 border-purple-600 text-purple-700 font-extrabold"
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span translate="no" className="notranslate">1. Sơ đồ cơ cấu tổ chức</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMaHoaSubTab("MA_LOI");
                    // Pre-populate code suggestion
                    setErrorFormCode(getNextErrorCode("BBM"));
                  }}
                  className={`px-5 py-3 text-xs font-black select-none uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 border-none outline-none ${
                    maHoaSubTab === "MA_LOI"
                      ? "border-b-2 border-purple-600 text-purple-700 font-extrabold"
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span translate="no" className="notranslate">2. Danh mục mã lỗi 4M1E (ERM / ERC)</span>
                </button>
              </div>

              {maHoaSubTab === "SO_DO" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. CÔNG TY THÀNH VIÊN CARD BOARD */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 select-none">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-500" />
                      <span translate="no" className="notranslate font-bold text-xs uppercase tracking-wider text-purple-700">1. Công ty thành viên</span>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold font-mono">
                      {companies.length}
                    </span>
                  </div>

                  <div className="flex-1 mt-4 space-y-2.5 overflow-y-auto pr-1">
                    {companies.map((c) => {
                      const isSelected = selectedCompanyId === c.id;
                      const isEditing = editingCompanyId === c.id;

                      return (
                        <div
                          key={c.id}
                          onClick={() => !isEditing && handleSelectCompany(c.id)}
                          className={`p-3 rounded-lg flex justify-between items-center border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-50 border-purple-300 shadow-sm font-bold text-purple-900"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-2 flex-1 w-full p-2 bg-white rounded border border-purple-200" onClick={(e) => e.stopPropagation()}>
                              <div>
                                <label className="text-[10px] text-purple-700 font-bold block mb-1">TÊN CÔNG TY</label>
                                <input
                                  type="text"
                                  value={editingCompanyName}
                                  onChange={(e) => setEditingCompanyName(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-purple-500 font-normal animate-none"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-purple-700 font-bold block mb-1">MÃ ID CÔNG TY</label>
                                <input
                                  type="text"
                                  value={editingCompanyIdInput}
                                  onChange={(e) => setEditingCompanyIdInput(e.target.value.replace(/\s+/g, ""))}
                                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-purple-500 font-normal font-mono"
                                />
                              </div>
                              <div className="flex gap-2 justify-end mt-1">
                                <button
                                  onClick={() => {
                                    if (!editingCompanyName.trim()) return;
                                    const finalId = editingCompanyIdInput.trim() || c.id;
                                    if (onUpdateCompany) {
                                      onUpdateCompany(c.id, { id: finalId, name: editingCompanyName.trim() });
                                    }
                                    setEditingCompanyId(null);
                                  }}
                                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                >
                                  <span translate="no" className="notranslate">Lưu</span>
                                </button>
                                <button
                                  onClick={() => setEditingCompanyId(null)}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                >
                                  <span translate="no" className="notranslate">Hủy</span>
                                </button>
                              </div>
                            </div>
                          ) : companyIdConfirmDlt === c.id ? (
                            <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 min-w-0 mr-1.5">
                                <span className="text-[10px] text-rose-600 font-extrabold select-none uppercase tracking-wider">
                                  <span translate="no" className="notranslate">Xác nhận xóa?</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    onDeleteCompany(c.id);
                                    if (selectedCompanyId === c.id) {
                                      const remaining = companies.filter(item => item.id !== c.id);
                                      if (remaining.length > 0) {
                                        handleSelectCompany(remaining[0].id);
                                      } else {
                                        setSelectedCompanyId("");
                                        setSelectedBranchId("");
                                      }
                                    }
                                    setCompanyIdConfirmDlt(null);
                                  }}
                                  className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer uppercase shrink-0"
                                >
                                  <span translate="no" className="notranslate">Xóa</span>
                                </button>
                                <button
                                  onClick={() => setCompanyIdConfirmDlt(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer uppercase shrink-0"
                                >
                                  <span translate="no" className="notranslate">Hủy</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2 min-w-0 mr-2">
                                {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                                <span translate="no" className="notranslate text-xs font-bold leading-normal truncate block">{c.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <span translate="no" className="notranslate text-[9px] text-slate-400 font-mono">ID: {c.id}</span>
                                <button
                                  onClick={() => {
                                    setEditingCompanyId(c.id);
                                    setEditingCompanyName(c.name);
                                    setEditingCompanyIdInput(c.id);
                                  }}
                                  className="text-slate-400 hover:text-purple-650 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
                                  title="Chỉnh sửa tên và ID Công ty"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setCompanyIdConfirmDlt(c.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-650 p-1 rounded hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
                                  title="Xóa vĩnh viễn Công ty"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên Công ty..."
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="Mã ID (tùy chọn)..."
                        value={newCompanyId}
                        onChange={(e) => setNewCompanyId(e.target.value.replace(/\s+/g, ""))}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm font-mono"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newCompanyName.trim()) return;
                        const finalId = newCompanyId.trim() || generateAutoCompanyId(newCompanyName.trim());
                        onAddCompany({ id: finalId, name: newCompanyName.trim() });
                        setSelectedCompanyId(finalId);
                        setNewCompanyName("");
                        setNewCompanyId("");
                      }}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span translate="no" className="notranslate">Thêm Công ty</span>
                    </button>
                  </div>
                </div>

                {/* 2. CHI NHÁNH / VĂN PHÒNG ĐẠI DIỆN CARD BOARD */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 select-none">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-emerald-500" />
                      <span translate="no" className="notranslate font-bold text-xs uppercase tracking-wider text-emerald-700">2. Chi nhánh / VPĐD</span>
                    </div>

                    {/* FORMAT SWITCHER BUTTON GROUP FOR COLUMN 2 */}
                    <div translate="no" className="notranslate flex bg-slate-105/90 p-0.5 rounded-lg text-[9px] font-bold shrink-0 border border-slate-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBranchNameFormat('standard');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] leading-tight select-none cursor-pointer transition-all ${
                          branchNameFormat === 'standard' 
                            ? 'bg-white shadow text-emerald-700 font-extrabold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Định dạng nguyên bản gốc"
                      >
                        <span translate="no" className="notranslate">Gốc</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBranchNameFormat('with-company-id');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] leading-tight select-none cursor-pointer transition-all ${
                          branchNameFormat === 'with-company-id' 
                            ? 'bg-white shadow text-emerald-700 font-extrabold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Định dạng kèm ID công ty thành viên"
                      >
                        <span translate="no" className="notranslate">+ID Cty</span>
                      </button>
                    </div>

                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">
                      {activeCompanyBranches.length}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
                    <span translate="no" className="notranslate">
                      * Nhấp chọn chi nhánh dưới đây để xem các bộ phận trực thuộc ở Cột 3.
                    </span>
                  </div>

                  <div className="flex-1 mt-2 space-y-2.5 overflow-y-auto pr-1">
                    {activeCompanyBranches.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium">
                        <span translate="no" className="notranslate">Chưa có chi nhánh nào thuộc công ty này.</span>
                      </div>
                    ) : (
                      activeCompanyBranches.map((b) => {
                        const isSelected = activeBranchId === b.id;
                        const isEditing = editingBranchId === b.id;

                        return (
                          <div
                            key={b.id}
                            onClick={() => !isEditing && setSelectedBranchId(b.id)}
                            className={`p-3 rounded-lg flex justify-between items-center border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-300 shadow-sm font-bold text-emerald-900"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-2 flex-1 w-full p-2 bg-white rounded border border-emerald-200" onClick={(e) => e.stopPropagation()}>
                                <div>
                                  <label className="text-[10px] text-emerald-700 font-bold block mb-1">TÊN CHI NHÁNH / VPĐD</label>
                                  <input
                                    type="text"
                                    value={editingBranchName}
                                    onChange={(e) => setEditingBranchName(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-emerald-700 font-bold block mb-1">MÃ ID CHI NHÁNH</label>
                                  <input
                                    type="text"
                                    value={editingBranchIdInput}
                                    onChange={(e) => setEditingBranchIdInput(e.target.value.replace(/\s+/g, ""))}
                                    className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 font-normal font-mono"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end mt-1">
                                  <button
                                    onClick={() => {
                                      if (!editingBranchName.trim()) return;
                                      const finalId = editingBranchIdInput.trim() || b.id;
                                      if (onUpdateBranch) {
                                        onUpdateBranch(b.id, { ...b, id: finalId, name: editingBranchName.trim() });
                                      }
                                      setEditingBranchId(null);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Lưu</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingBranchId(null)}
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Hủy</span>
                                  </button>
                                </div>
                              </div>
                            ) : branchIdConfirmDlt === b.id ? (
                              <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 min-w-0 mr-1.5">
                                  <span className="text-[10px] text-rose-600 font-extrabold select-none uppercase tracking-wider">
                                    <span translate="no" className="notranslate">Xác nhận xóa?</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      onDeleteBranch(b.id);
                                      if (selectedBranchId === b.id) {
                                        const remaining = activeCompanyBranches.filter(item => item.id !== b.id);
                                        if (remaining.length > 0) {
                                          setSelectedBranchId(remaining[0].id);
                                        } else {
                                          setSelectedBranchId("");
                                        }
                                      }
                                      setBranchIdConfirmDlt(null);
                                    }}
                                    className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer uppercase shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Xóa</span>
                                  </button>
                                  <button
                                    onClick={() => setBranchIdConfirmDlt(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer uppercase shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Hủy</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                    <span translate="no" className="notranslate text-xs font-bold text-slate-800 block truncate leading-normal">
                                      {branchNameFormat === 'with-company-id' 
                                        ? `${b.name.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})` 
                                        : b.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 select-none">
                                    <span translate="no" className="notranslate text-[9px] text-slate-400 font-mono font-medium">ID: {b.id}</span>
                                    {b.isScoring && (
                                      <span translate="no" className="notranslate text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-1 rounded uppercase tracking-wide">
                                        ĐÁNH GIÁ 4M1E1I
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      if (onUpdateBranch) {
                                        onUpdateBranch(b.id, { ...b, isScoring: !b.isScoring });
                                      }
                                    }}
                                    className={`p-1.5 rounded hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0 ${
                                      b.isScoring ? "text-rose-600 hover:text-rose-700" : "text-slate-400 hover:text-emerald-600"
                                    }`}
                                    title={b.isScoring ? "Tắt Đánh Giá 4M1E1I" : "Bật Đánh Giá 4M1E1I"}
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingBranchId(b.id);
                                      setEditingBranchName(b.name);
                                      setEditingBranchIdInput(b.id);
                                    }}
                                    className="text-slate-400 hover:text-emerald-650 p-1.5 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
                                    title="Chỉnh sửa Chi nhánh"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setBranchIdConfirmDlt(b.id);
                                    }}
                                    className="text-slate-400 hover:text-rose-650 p-1.5 rounded hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
                                    title="Xóa Chi nhánh"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên Chi nhánh..."
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                      />
                      <input
                        type="text"
                        placeholder="Mã ID (tùy chọn)..."
                        value={newBranchId}
                        onChange={(e) => setNewBranchId(e.target.value.replace(/\s+/g, ""))}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-mono"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newBranchName.trim()) return;
                        const finalId = newBranchId.trim() || generateAutoBranchId(newBranchName.trim(), selectedCompanyId);
                        onAddBranch({
                           id: finalId,
                           name: newBranchName.trim(),
                           companyId: selectedCompanyId,
                           isScoring: true
                        });
                        setSelectedBranchId(finalId);
                        setNewBranchName("");
                        setNewBranchId("");
                      }}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span translate="no" className="notranslate">Thêm Chi nhánh</span>
                    </button>
                  </div>
                </div>

                {/* 3. BỘ PHẬN / ĐƠN VỊ CARD BOARD */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 select-none">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-amber-500" />
                      <span translate="no" className="notranslate font-bold text-xs uppercase tracking-wider text-amber-700">3. Bộ phận / Đơn vị</span>
                    </div>

                    {/* FORMAT SWITCHER BUTTON GROUP FOR COLUMN 3 */}
                    <div translate="no" className="notranslate flex bg-slate-105/90 p-0.5 rounded-lg text-[9px] font-bold shrink-0 border border-slate-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeptNameFormat('standard');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] leading-tight select-none cursor-pointer transition-all ${
                          deptNameFormat === 'standard' 
                            ? 'bg-white shadow text-amber-700 font-extrabold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Định dạng nguyên bản gốc"
                      >
                        <span translate="no" className="notranslate">Gốc</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeptNameFormat('with-branch-id');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[8px] leading-tight select-none cursor-pointer transition-all ${
                          deptNameFormat === 'with-branch-id' 
                            ? 'bg-white shadow text-amber-700 font-extrabold' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Định dạng kèm ID chi nhánh/VPĐD"
                      >
                        <span translate="no" className="notranslate">+ID CN</span>
                      </button>
                    </div>

                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-mono">
                      {activeBranchDepartments.length}
                    </span>
                  </div>

                  <div className="flex-1 mt-4 space-y-2.5 overflow-y-auto pr-1 max-h-[480px]">
                    {activeBranchId === "" ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">
                        <span translate="no" className="notranslate">Vui lòng nhấp chọn một chi nhánh ở Cột 2.</span>
                      </div>
                    ) : activeBranchDepartments.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs font-medium">
                        <span translate="no" className="notranslate">Chưa có bộ phận nào thuộc chi nhánh này.</span>
                      </div>
                    ) : (
                      activeBranchDepartments.map((d) => {
                        const isEditing = editingDeptId === d.id;
                        return (
                          <div key={d.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg flex justify-between items-center border border-slate-200">
                            {isEditing ? (
                              <div className="flex flex-col gap-2 flex-1 w-full p-2 bg-white rounded border border-amber-200" onClick={(e) => e.stopPropagation()}>
                                <div>
                                  <label className="text-[10px] text-amber-700 font-bold block mb-1">TÊN BỘ PHẬN / ĐƠN VỊ</label>
                                  <input
                                    type="text"
                                    value={editingDeptName}
                                    onChange={(e) => setEditingDeptName(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-amber-500 font-normal"
                                    autoFocus
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-amber-700 font-bold block mb-1">MÃ ID BỘ PHẬN</label>
                                  <input
                                    type="text"
                                    value={editingDeptIdInput}
                                    onChange={(e) => setEditingDeptIdInput(e.target.value.replace(/\s+/g, ""))}
                                    className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-amber-500 font-normal font-mono"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end mt-1">
                                  <button
                                    onClick={() => {
                                      if (!editingDeptName.trim()) return;
                                      let cleanName = editingDeptName.trim();
                                      const suffix = getLocalBranchCodeSuffix(d.branchId);
                                      if (!cleanName.endsWith(suffix)) {
                                        cleanName = cleanName.replace(/\s\([A-Z0-9-]+\)$/, "").trim();
                                        cleanName = `${cleanName}${suffix}`;
                                      }
                                      const finalId = editingDeptIdInput.trim() || d.id;
                                      if (onUpdateDepartment) {
                                        onUpdateDepartment(d.id, { ...d, id: finalId, name: cleanName });
                                      }
                                      setEditingDeptId(null);
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Lưu</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingDeptId(null)}
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Hủy</span>
                                  </button>
                                </div>
                              </div>
                            ) : deptIdConfirmDlt === d.id ? (
                              <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 min-w-0 mr-1.5">
                                  <span className="text-[10px] text-rose-600 font-extrabold select-none uppercase tracking-wider">
                                    <span translate="no" className="notranslate">Xác nhận xóa?</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      onDeleteDepartment(d.id);
                                      setDeptIdConfirmDlt(null);
                                    }}
                                    className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer uppercase shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Xóa</span>
                                  </button>
                                  <button
                                    onClick={() => setDeptIdConfirmDlt(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[9px] px-2 py-1 rounded transition-colors cursor-pointer uppercase shrink-0"
                                  >
                                    <span translate="no" className="notranslate">Hủy</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="min-w-0 flex-1 pr-2">
                                  <span translate="no" className="notranslate text-xs font-bold text-slate-800 block leading-normal break-words">
                                    {deptNameFormat === 'with-branch-id' 
                                      ? `${d.name.replace(/\s*\([^)]+\)$/, "").trim()} (${d.branchId})` 
                                      : d.name}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-1 select-none flex-wrap">
                                    <span translate="no" className="notranslate text-[9px] text-slate-400 font-mono font-medium">ID: {d.id}</span>
                                    {d.name.startsWith(STANDARDIZED_QC_DEPT) && (
                                      <span translate="no" className="notranslate text-[8px] bg-blue-50 text-blue-700 px-1 py-[0.5px] rounded border border-blue-200 tracking-wider font-mono font-bold">
                                        BP TIÊU CHUẨN
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      const suffix = getLocalBranchCodeSuffix(d.branchId);
                                      let displayName = d.name;
                                      if (displayName.endsWith(suffix)) {
                                        displayName = displayName.substring(0, displayName.length - suffix.length);
                                      } else {
                                        displayName = displayName.replace(/\s\([A-Z0-9-]+\)$/, "").trim();
                                      }
                                      setEditingDeptId(d.id);
                                      setEditingDeptName(displayName);
                                      setEditingDeptIdInput(d.id);
                                    }}
                                    className="text-slate-400 hover:text-amber-650 p-1.5 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
                                    title="Chỉnh sửa Bộ phận"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeptIdConfirmDlt(d.id);
                                    }}
                                    className="text-slate-400 hover:text-rose-650 p-1.5 rounded hover:bg-slate-200/50 transition-colors cursor-pointer shrink-0"
                                    disabled={d.name.startsWith(STANDARDIZED_QC_DEPT)} // Cannot delete default standardized
                                    title="Xóa Bộ phận"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 disabled:opacity-30" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nhập tên Bộ phận..."
                        value={newDeptName}
                        disabled={activeBranchId === ""}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm disabled:opacity-55"
                      />
                      <input
                        type="text"
                        placeholder="Mã ID (tùy chọn)..."
                        value={newDeptId}
                        disabled={activeBranchId === ""}
                        onChange={(e) => setNewDeptId(e.target.value.replace(/\s+/g, ""))}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm font-mono disabled:opacity-55"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newDeptName.trim() || activeBranchId === "") return;
                        const finalId = newDeptId.trim() || generateAutoDeptId(activeBranchId, newDeptName.trim());
                        onAddDepartment({
                          id: finalId,
                          name: newDeptName.trim(),
                          branchId: activeBranchId
                        });
                        setNewDeptName("");
                        setNewDeptId("");
                      }}
                      disabled={activeBranchId === ""}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1 disabled:opacity-55"
                    >
                      <Plus className="w-4 h-4" />
                      <span translate="no" className="notranslate">Thêm Bộ phận</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ERROR CATALOG VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: List & Filters */}
                <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[450px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-850 uppercase tracking-wider">
                          <span translate="no" className="notranslate">Danh sách mã lỗi hiện hành</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">
                          <span translate="no" className="notranslate">Phân loại lỗi chuẩn hóa cho Bao Bì Mềm (BBM) và Bao Bì Cứng (BBC)</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-black font-mono self-start sm:self-center">
                      <span translate="no" className="notranslate">Tổng: {errorCatalog?.length || 0}</span>
                    </span>
                  </div>

                  {/* Search & Filters */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm mã lỗi, tên hoặc diễn giải..."
                        value={errorCodeFilter}
                        onChange={(e) => setErrorCodeFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-sm"
                      />
                      {errorCodeFilter && (
                        <button
                          onClick={() => setErrorCodeFilter("")}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs border-none bg-transparent cursor-pointer"
                        >
                          <span translate="no" className="notranslate">Xóa</span>
                        </button>
                      )}
                    </div>

                    {/* Category Pills */}
                    <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black select-none border border-slate-200 shadow-inner">
                      {(["ALL", "BBM", "BBC"] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setErrorCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer border-none outline-none ${
                            errorCategoryFilter === cat
                              ? "bg-purple-600 text-white shadow-md font-extrabold"
                              : "text-slate-600 hover:text-slate-800 bg-transparent"
                          }`}
                        >
                          <span translate="no" className="notranslate">
                            {cat === "ALL" ? "TẤT CẢ" : cat === "BBM" ? "BBM (MỀM)" : "BBC (CỨNG)"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catalog List */}
                  <div className="mt-4 flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-3">
                    {(() => {
                      const filtered = (errorCatalog || []).filter((item) => {
                        const matchSearch =
                          item.code.toLowerCase().includes(errorCodeFilter.toLowerCase()) ||
                          item.name.toLowerCase().includes(errorCodeFilter.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(errorCodeFilter.toLowerCase()));
                        const matchCat = errorCategoryFilter === "ALL" || item.category === errorCategoryFilter;
                        return matchSearch && matchCat;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                            <AlertTriangle className="w-12 h-12 text-slate-300 animate-pulse mb-3" />
                            <p className="text-xs font-bold text-slate-500">
                              <span translate="no" className="notranslate">Không tìm thấy mã lỗi nào phù hợp</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              <span translate="no" className="notranslate">Thử thay đổi bộ lọc hoặc thêm một mã lỗi mới ở bảng bên phải</span>
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                          {filtered.map((item) => {
                            const isBBM = item.category === "BBM";
                            return (
                              <div key={item.code} className="p-3 bg-white hover:bg-slate-50/55 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  {/* Error Code Badge */}
                                  <div className={`px-2.5 py-1.5 rounded-lg text-center shrink-0 shadow-sm ${
                                    isBBM
                                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                      : "bg-blue-50 border border-blue-200 text-blue-700"
                                  }`}>
                                    <p className="font-mono text-xs font-black tracking-wider uppercase">
                                      <span translate="no" className="notranslate">{item.code}</span>
                                    </p>
                                    <p className="text-[8px] font-bold uppercase mt-0.5 opacity-80">
                                      <span translate="no" className="notranslate">{item.category}</span>
                                    </p>
                                  </div>

                                  {/* Text Info */}
                                  <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-slate-850">
                                      <span translate="no" className="notranslate">{item.name}</span>
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                      <span translate="no" className="notranslate">{item.description}</span>
                                    </p>
                                    <p className="text-[8px] text-slate-400 font-semibold font-mono">
                                      <span translate="no" className="notranslate">Khai báo: {item.createdAt}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Actions (Only Admin or Reviewer) */}
                                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER) && (
                                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingErrorItem(item);
                                        setErrorFormCode(item.code);
                                        setErrorFormCategory(item.category);
                                        setErrorFormName(item.name);
                                        setErrorFormDescription(item.description || "");
                                      }}
                                      className="p-1.5 bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-500 rounded-lg border border-slate-200 hover:border-amber-200 transition-all cursor-pointer"
                                      title="Sửa mã lỗi"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Bạn có chắc chắn muốn xóa mã lỗi ${item.code}?`)) {
                                          if (onDeleteErrorCatalogItem) {
                                            onDeleteErrorCatalogItem(item.code);
                                          }
                                          if (editingErrorItem?.code === item.code) {
                                            setEditingErrorItem(null);
                                            setErrorFormName("");
                                            setErrorFormDescription("");
                                            setErrorFormCode(getNextErrorCode(errorFormCategory));
                                          }
                                        }
                                      }}
                                      className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                                      title="Xóa mã lỗi"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Column: Add / Edit Form */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER) ? (
                      <div className="space-y-4">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-bold text-xs uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                            {editingErrorItem ? (
                              <>
                                <Pencil className="w-4 h-4 text-amber-500" />
                                <span translate="no" className="notranslate">Cập nhật mã lỗi</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 text-purple-500" />
                                <span translate="no" className="notranslate">Khai báo mã lỗi mới</span>
                              </>
                            )}
                          </h3>
                          {editingErrorItem && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingErrorItem(null);
                                setErrorFormName("");
                                setErrorFormDescription("");
                                setErrorFormCode(getNextErrorCode(errorFormCategory));
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold border-none bg-transparent cursor-pointer"
                            >
                              <span translate="no" className="notranslate">Hủy bỏ sửa</span>
                            </button>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            <span translate="no" className="notranslate">Mảng Sản phẩm</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingErrorItem) {
                                  setErrorFormCategory("BBM");
                                  setErrorFormCode(getNextErrorCode("BBM"));
                                }
                              }}
                              disabled={!!editingErrorItem}
                              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 border-none outline-none cursor-pointer ${
                                errorFormCategory === "BBM"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-black shadow-sm"
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                              }`}
                            >
                              <span translate="no" className="notranslate">Bao Bì Mềm (BBM)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingErrorItem) {
                                  setErrorFormCategory("BBC");
                                  setErrorFormCode(getNextErrorCode("BBC"));
                                }
                              }}
                              disabled={!!editingErrorItem}
                              className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 border-none outline-none cursor-pointer ${
                                errorFormCategory === "BBC"
                                  ? "bg-blue-50 border-blue-300 text-blue-800 font-black shadow-sm"
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                              }`}
                            >
                              <span translate="no" className="notranslate">Bao Bì Cứng (BBC)</span>
                            </button>
                          </div>
                        </div>

                        {/* Error Code */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            <span translate="no" className="notranslate">Mã Lỗi (Định dạng: {errorFormCategory === "BBM" ? "ERMXXXX" : "ERCXXXX"})</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={7}
                              placeholder={errorFormCategory === "BBM" ? "ERM0001" : "ERC0001"}
                              value={errorFormCode}
                              onChange={(e) => setErrorFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                              disabled={!!editingErrorItem}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-400 shadow-sm"
                            />
                            {!editingErrorItem && (
                              <button
                                type="button"
                                onClick={() => setErrorFormCode(getNextErrorCode(errorFormCategory))}
                                className="absolute right-2.5 top-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-md text-[9px] font-extrabold text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                title="Khôi phục mã đề xuất"
                              >
                                <span translate="no" className="notranslate">Gợi ý mã</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Error Name */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            <span translate="no" className="notranslate">Tên Lỗi kỹ thuật</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Lỗi xước màng..."
                            value={errorFormName}
                            onChange={(e) => setErrorFormName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm font-medium"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            <span translate="no" className="notranslate">Diễn giải chi tiết / Biện pháp phòng ngừa</span>
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Nhập diễn giải chi tiết lỗi, hiện tượng và tác hại nếu kéo dài..."
                            value={errorFormDescription}
                            onChange={(e) => setErrorFormDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm font-medium leading-relaxed"
                          />
                        </div>

                        {/* Action Submit */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!errorFormCode.trim()) {
                              alert("Vui lòng điền Mã Lỗi!");
                              return;
                            }
                            if (errorFormCode.trim().length !== 7) {
                              alert("Mã lỗi phải dài đúng 7 ký tự (Ví dụ: ERM0001, ERC0001) theo đúng quy chuẩn!");
                              return;
                            }
                            if (!errorFormName.trim()) {
                              alert("Vui lòng điền Tên Lỗi!");
                              return;
                            }

                            const today = new Date();
                            const dd = String(today.getDate()).padStart(2, "0");
                            const mm = String(today.getMonth() + 1).padStart(2, "0");
                            const yy = String(today.getFullYear()).slice(-2);
                            const dateStr = `${dd}/${mm}/${yy}`;

                            if (editingErrorItem) {
                              const updated: ErrorCatalogItem = {
                                ...editingErrorItem,
                                name: errorFormName.trim(),
                                description: errorFormDescription.trim()
                              };
                              if (onUpdateErrorCatalogItem) {
                                onUpdateErrorCatalogItem(editingErrorItem.code, updated);
                              }
                              setEditingErrorItem(null);
                            } else {
                              if ((errorCatalog || []).some((x) => x.code.toUpperCase() === errorFormCode.toUpperCase())) {
                                alert(`Mã lỗi ${errorFormCode} đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
                                return;
                              }
                              const newItem: ErrorCatalogItem = {
                                code: errorFormCode.toUpperCase().trim(),
                                category: errorFormCategory,
                                name: errorFormName.trim(),
                                description: errorFormDescription.trim(),
                                createdAt: dateStr
                              };
                              if (onAddErrorCatalogItem) {
                                onAddErrorCatalogItem(newItem);
                              }
                            }

                            setErrorFormName("");
                            setErrorFormDescription("");
                            setErrorFormCode(getNextErrorCode(errorFormCategory));
                          }}
                          className={`w-full py-2.5 rounded-xl text-xs font-black text-white cursor-pointer select-none transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 border-none outline-none ${
                            editingErrorItem ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"
                          }`}
                        >
                          {editingErrorItem ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span translate="no" className="notranslate">Cập nhật mã lỗi</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span translate="no" className="notranslate">Thêm vào Danh mục</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Non-admin read-only summary card */
                      <div className="space-y-4 select-none">
                        <div className="pb-3 border-b border-slate-100">
                          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-blue-500" />
                            <span translate="no" className="notranslate">Thông tin quy chuẩn mã lỗi</span>
                          </h3>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                          <div className="text-[11px] text-slate-600 font-medium leading-relaxed">
                            <span translate="no" className="notranslate">
                              Hệ thống quản trị chất lượng 4M1E1I áp dụng quy định chuẩn hóa danh mục mã lỗi phục vụ việc truy xuất tự động và chạy phân tích AI phòng ngừa rủi ro lặp lại:
                            </span>
                          </div>
                          <ul className="text-[10px] text-slate-500 space-y-2 font-medium list-disc pl-4 leading-relaxed font-sans">
                            <li>
                              <span translate="no" className="notranslate">
                                <b>ER</b>: Ký tự định danh sự cố (ERROR).
                              </span>
                            </li>
                            <li>
                              <span translate="no" className="notranslate">
                                <b>M / C</b>: M đại diện cho Bao Bì Mềm (BBM), C đại diện cho Bao Bì Cứng (BBC).
                              </span>
                            </li>
                            <li>
                              <span translate="no" className="notranslate">
                                <b>XXXX</b>: Số thứ tự tăng dần từ 0001 (Ví dụ: ERM0001, ERC0001).
                              </span>
                            </li>
                          </ul>
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-[10px] text-blue-700 leading-relaxed font-semibold">
                            <span translate="no" className="notranslate">
                              💡 Chỉ Quản lý chất lượng (Reviewer) hoặc Quản trị viên (Admin) mới có quyền tạo mới, chỉnh sửa thông tin hoặc xóa các danh mục lỗi kỹ thuật.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "TRIỂN_KHAI" && (
            <OrderPipeline
              currentUser={currentUser}
              branches={branches}
              departments={departments}
              productionRequests={productionRequests}
              setProductionRequests={setProductionRequests}
              productionRequestItemsMap={productionRequestItemsMap}
              setProductionRequestItemsMap={setProductionRequestItemsMap}
              orderImplementations={orderImplementations}
              setOrderImplementations={setOrderImplementations}
              productsCatalog={productsCatalog}
              setProductsCatalog={setProductsCatalog}
              moldsCatalog={moldsCatalog}
              setMoldsCatalog={setMoldsCatalog}
            />
          )}

          {/* TAB 3: THỐNG KÊ (Business Analytics) */}
          {activeTab === "THỐNG_KÊ" && (() => {
            const { total, kph, dsa, safeRate } = getStatsCountersValue();
            const aiRecons = getAiExpertRecommendations();

            return (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-black text-slate-850 flex items-center gap-2">
                      <BarChart4 className="w-6 h-6 text-emerald-600" />
                      <T><span translate="no" className="notranslate">Trung tâm Thống kê & Phân tích 4M1E1I</span></T>
                    </h2>
                    <T className="text-xs text-slate-500 mt-1 block">
                      <span translate="no" className="notranslate">Hệ thống vận hành thống kê thông minh: tích hợp trạng thái nhân sự, ma trận chất lượng, và cố vấn tự động.</span>
                    </T>
                  </div>

                  {/* Sub-tab Switcher matching the app styling */}
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-black select-none border border-slate-200 shadow-sm shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("NHAN_SU")}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none outline-none ${
                        statsSubTab === "NHAN_SU"
                          ? "bg-blue-600 text-white shadow-md font-extrabold"
                          : "text-slate-600 hover:text-slate-800 bg-transparent"
                      }`}
                    >
                      <span>👥</span>
                      <T><span translate="no" className="notranslate">THỐNG KÊ NHÂN SỰ ONLINE</span></T>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("CHAT_LUONG")}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none outline-none ${
                        statsSubTab === "CHAT_LUONG"
                          ? "bg-blue-600 text-white shadow-md font-extrabold"
                          : "text-slate-600 hover:text-slate-800 bg-transparent"
                      }`}
                    >
                      <span>📊</span>
                      <T><span translate="no" className="notranslate">PHÂN TÍCH CHẤT LƯỢNG 4M</span></T>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("TIEN_DO")}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none outline-none ${
                        statsSubTab === "TIEN_DO"
                          ? "bg-blue-600 text-white shadow-md font-extrabold"
                          : "text-slate-600 hover:text-slate-800 bg-transparent"
                      }`}
                    >
                      <span>🎯</span>
                      <T><span translate="no" className="notranslate">TIẾN ĐỘ CẢI TIẾN</span></T>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("HUY_HIEU")}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none outline-none ${
                        statsSubTab === "HUY_HIEU"
                          ? "bg-amber-600 text-white shadow-md font-extrabold"
                          : "text-slate-600 hover:text-slate-800 bg-transparent"
                      }`}
                    >
                      <span>🏅</span>
                      <T><span translate="no" className="notranslate">TRAO HUY HIỆU & VINH DANH</span></T>
                    </button>
                  </div>
                </div>

                {statsSubTab === "NHAN_SU" ? (
                  <StatisticsDashboard 
                    users={users} 
                    branches={branches} 
                    departments={departments} 
                    reports={reports}
                    chats={chats}
                    topics={topics}
                    topicReplies={replies}
                  />
                ) : statsSubTab === "TIEN_DO" ? (
                  <ProgressTrackingDashboard
                    reports={reports}
                    users={users}
                    currentUser={currentUser}
                    onUpdateReport={onUpdateReport}
                    onAddBroadcast={onAddBroadcast}
                    showToast={onShowToast}
                  />
                ) : statsSubTab === "HUY_HIEU" ? (
                  <BadgeStatisticsDashboard
                    reports={reports}
                    users={users}
                    branches={branches}
                    departments={departments}
                    isMobile={false}
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Branch / VP segment selector */}
                    <div className="flex flex-col gap-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-slate-200/40 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span translate="no" className="notranslate text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                        LỌC CHI NHÁNH / ĐƠN VỊ THÀNH VIÊN:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setStatsBranchFilter("Tất cả")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border ${
                          statsBranchFilter === "Tất cả"
                            ? "bg-slate-800 border-slate-850 text-white shadow-xs font-black"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <span translate="no" className="notranslate">Tất cả</span>
                      </button>
                      {branches.filter(b => b.isScoring).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setStatsBranchFilter(b.name)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border ${
                            statsBranchFilter === b.name
                              ? "bg-indigo-600 border-indigo-650 text-white shadow-xs font-black"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          <span translate="no" className="notranslate">{b.name.replace("Chi Nhánh ", "").replace("Nhà máy ", "").replace("Văn phòng ", "VP ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                {/* Status board relative to selected filter */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-widest">
                      <T><span translate="no" className="notranslate">TỔNG BIẾN ĐỘNG PHÁT SINH</span></T>
                    </span>
                    <span className="text-3xl font-black block text-blue-600 mt-1.5">
                      {total}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1">
                      <T><span translate="no" className="notranslate">Toàn bộ hồ sơ nhật ký dữ liệu</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-red-600">
                    <span className="text-[10px] text-red-500 block font-bold uppercase tracking-widest">
                      <T><span translate="no" className="notranslate">KHÔNG PHÙ HỢP KPH</span></T>
                    </span>
                    <span className="text-3xl font-black block mt-1.5">
                      {kph}
                    </span>
                    <span className="text-[9px] text-red-400 block mt-1">
                      <T><span translate="no" className="notranslate">Sự cố khuyết tật, bất thường</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-emerald-600">
                    <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-widest">
                      <T><span translate="no" className="notranslate">ĐIỂM SÁNG CHẤT LƯỢNG (DSA)</span></T>
                    </span>
                    <span className="text-3xl font-black block mt-1.5">
                      {dsa}
                    </span>
                    <span className="text-[9px] text-emerald-400 block mt-1">
                      <T><span translate="no" className="notranslate">Sáng kiến cải tiến thực tiễn tốt</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-indigo-650">
                    <span className="text-[10px] text-indigo-600 block font-bold uppercase tracking-widest">
                      <T><span translate="no" className="notranslate">CHỈ SỐ AN TOÀN VẬN HÀNH</span></T>
                    </span>
                    <span className="text-3xl font-black block text-indigo-650 mt-1.5">
                      {safeRate}%
                    </span>
                    <span className="text-[9px] text-indigo-400 block mt-1">
                      <T><span translate="no" className="notranslate">Tỉ số không sai hỏng mục tiêu</span></T>
                    </span>
                  </div>
                </div>

                {/* Analytical charts grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CHART 1: RADAR CHART analyses KPH distribution across 4M1E1I */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#ef4444] pb-2 border-b border-slate-100 block mb-4">
                        <T><span translate="no" className="notranslate">1. Biểu Đồ Radar: Thống Kê Điểm Không Phù Hợp (KPH) theo 4M1E1I</span></T>
                      </span>
                      <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                        <T><span translate="no" className="notranslate">Xác định phân hệ phân bố lỗi chất lượng để biết yếu tố nào trong 6 trụ cột (Con người, Nguyên vật liệu, Máy móc, Phương pháp, Môi trường, Thông tin) đang suy giảm nặng nề nhất.</span></T>
                      </p>
                    </div>
                    <div className="h-64 mt-4">
                      {kph > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarKphData()}>
                            <PolarGrid stroke="#cbd5e1" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 9, fontWeight: 700 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 8 }} />
                            <Radar name="Số lỗi KPH" dataKey="Không Phù Hợp (KPH)" stroke="#ef4444" fill="#f87171" fillOpacity={0.35} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                          <p className="text-xs text-slate-400 italic">
                            <T><span translate="no" className="notranslate">Không có dữ liệu lỗi KPH để vẽ giản đồ Radar</span></T>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHART 2: PARETO CHART */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-650 pb-2 border-b border-slate-100 block mb-4">
                        <T><span translate="no" className="notranslate">2. Sơ Đồ Pareto: Tầng Lỗi & Phần Trăm Lũy Kế 80/20</span></T>
                      </span>
                      <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                        <T><span translate="no" className="notranslate">Sắp xếp lỗi theo tần suất xuất hiện giảm dần cùng đường tích lũy phần trăm. Giúp nhà quản lý dồn sức xử lý đúng 20% nguyên nhân cốt lõi để loại bỏ 80% phế phẩm chất lượng.</span></T>
                      </p>
                    </div>
                    <div className="h-64 mt-4">
                      {kph > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={getParetoData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="category" interval={0} angle={-15} textAnchor="end" height={45} tick={{ fill: '#475569', fontSize: 7.5, fontWeight: 700 }} />
                            <YAxis yAxisId="left" label={{ value: 'Tần suất lỗi', angle: -90, position: 'insideLeft', style: { fontSize: 8, fill: '#475569' } }} tick={{ fill: '#64748b', fontSize: 9 }} />
                            <YAxis yAxisId="right" orientation="right" label={{ value: 'Lũy kế (%)', angle: 90, position: 'insideRight', style: { fontSize: 8, fill: '#d97706' } }} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: "10px" }} />
                            <Bar yAxisId="left" dataKey="Số lỗi (Tần suất)" fill="#3b82f6" barSize={25} radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="Phần trăm lũy kế (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                          <p className="text-xs text-slate-400 italic">
                            <T><span translate="no" className="notranslate">Không có dữ liệu lỗi sản xuất để vẽ đồ thị Pareto</span></T>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CHART 3: PERFORMANCE GRAPH (DSA vs KPH comparativeness) */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between lg:col-span-2">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-[#0d9488] pb-2 border-b border-slate-100 block mb-4">
                        <T><span translate="no" className="notranslate">3. So Sánh Hiệu Suất Chất Lũơng: Điểm Sáng (DSA) Vs Điểm Lỗi (KPH) Giữa Các Chi Nhánh</span></T>
                      </span>
                      <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                        <T><span translate="no" className="notranslate">Biểu hiện của tính đối sáng thi đua giữa tất cả xưởng và văn phòng toàn bộ lãnh thổ Tân Phú. Cho thấy ngay đơn vị nào đang có tỷ lệ cải tiến DSA xuất sắc đột phá và đơn vị nào còn tồn vướng nhiều điểm Không Phù Hợp KPH để ban giám đốc QC giám sát chỉ đạo.</span></T>
                      </p>
                    </div>
                    <div className="h-72 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getBranchComparisonData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                          <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={45} tick={{ fill: '#334155', fontSize: 8, fontWeight: 700 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                          <Bar dataKey="Điểm Sáng (DSA)" fill="#10b981" barSize={35} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Không Phù Hợp (KPH)" fill="#ef4444" barSize={35} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* AI ADVICE PANEL */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-600 rounded-full filter blur-[100px] opacity-20 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 p-8 transform -translate-x-12 translate-y-12 w-64 h-64 bg-emerald-600 rounded-full filter blur-[100px] opacity-15 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-850">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <h3 className="text-base font-black uppercase tracking-wider text-slate-100">
                          <T><span translate="no" className="notranslate">Phòng Tham Mưu Cố Vấn Tri Thức Trí Tuệ Nhân Tạo (Advanced AI Quality Advisor)</span></T>
                        </h3>
                      </div>
                      <span className="bg-indigo-900 text-indigo-200 border border-indigo-700 text-[9px] px-2 py-0.5 rounded font-mono font-bold">
                        <T><span translate="no" className="notranslate">LIVE DIAGNOSTICS ACTIVE</span></T>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                      <T><span translate="no" className="notranslate">Dưới đây là các khuyến nghị chất lượng được huấn luyện riêng biệt dựa trên thuật toán rà soát dữ liệu thô KPH/DSA, so sánh tần suất Pareto và phân tích sắc thái nghiêm trọng thông qua hội thoại trao đổi thực tế của nhân viên kỹ thuật:</span></T>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {aiRecons.map((item, idx) => (
                        <div 
                          key={item.id} 
                          className={`p-4 rounded-2xl border transition-all hover:bg-opacity-100 ${
                            item.level === "CRITICAL"
                              ? "bg-red-950/40 border-red-900/60 hover:bg-red-950/60"
                              : item.level === "WARNING"
                              ? "bg-amber-950/30 border-amber-900/50 hover:bg-amber-950/50"
                              : "bg-indigo-950/30 border-indigo-900/50 hover:bg-indigo-950/50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              item.level === "CRITICAL"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : item.level === "WARNING"
                                ? "bg-amber-500/25 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              <T><span translate="no" className="notranslate">{item.level === "CRITICAL" ? "KHẨN CẤP" : item.level === "WARNING" ? "CẢNH BÁO" : "THÔNG TIN"}</span></T>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">#{item.id}</span>
                          </div>

                          <h4 className="text-sm font-extrabold text-slate-100 mt-2 flex items-center gap-1.5">
                            {item.level === "CRITICAL" && <span>🚨</span>}
                            {item.level === "WARNING" && <span>⚠️</span>}
                            {item.level === "INFO" && <span>💡</span>}
                            <T><span translate="no" className="notranslate">{item.title}</span></T>
                          </h4>

                          <p className="text-xs text-slate-300 mt-1 pb-3 border-b border-slate-800/60 leading-relaxed font-normal">
                            <T><span translate="no" className="notranslate">{item.content}</span></T>
                          </p>

                          <div className="pt-2 text-[11px] text-indigo-300 space-y-1">
                            <strong className="text-indigo-400 block font-black uppercase text-[10px] tracking-wide">
                              <T><span translate="no" className="notranslate">» HÀNH ĐỘNG QC KHUYẾN NGHỊ:</span></T>
                            </strong>
                            <p className="leading-snug">
                              <T><span translate="no" className="notranslate">{item.action}</span></T>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
              </div>
            );
          })()}

          {/* TAB: ĐỀ XUẤT CHỜ DUYỆT */}
          {activeTab === "ĐỀ_XUẤT" && (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-sky-500" />
                    <T><span translate="no" className="notranslate">Hệ thống Đề xuất chờ phê duyệt</span></T>
                  </h2>
                  <T className="text-xs text-slate-500 mt-1 block">
                    <span translate="no" className="notranslate">Xem xét, kiểm duyệt và phê duyệt các tin bài đề xuất của nhân viên trước khi phát hành lên Bản tin chính (Home).</span>
                  </T>
                </div>
              </div>

              {/* Filtering block for proposals */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3 select-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      <T><span translate="no" className="notranslate">Phân loại 4M1E1I:</span></T>
                    </label>
                    <select
                      value={proposalCategory}
                      onChange={(e) => setProposalCategory(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Tất cả" translate="no" className="notranslate">Tất cả phân tố</option>
                      <option value="CON NGƯỜI" translate="no" className="notranslate">CON NGƯỜI</option>
                      <option value="NGUYÊN VẬT LIỆU" translate="no" className="notranslate">NGUYÊN VẬT LIỆU</option>
                      <option value="MÁY MÓC" translate="no" className="notranslate">MÁY MÓC</option>
                      <option value="PHƯƠNG PHÁP" translate="no" className="notranslate">PHƯƠNG PHÁP</option>
                      <option value="MÔI TRƯỜNG" translate="no" className="notranslate">MÔI TRƯỜNG</option>
                      <option value="THÔNG TIN" translate="no" className="notranslate">THÔNG TIN</option>
                    </select>
                  </div>

                  {/* Factory Filter */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      <T><span translate="no" className="notranslate">Nhà máy / Xưởng:</span></T>
                    </label>
                    <select
                      value={proposalFactory}
                      onChange={(e) => setProposalFactory(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 shadow-3xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Tất cả" translate="no" className="notranslate">Tất cả chi nhánh</option>
                      {branches.filter((b) => b.isScoring).map((b) => (
                        <option key={b.id} value={b.name} translate="no" className="notranslate">
                          {getFactoryDisplayName(b.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      <T><span translate="no" className="notranslate">Tìm kiếm nhanh:</span></T>
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={proposalSearch}
                        onChange={(e) => setProposalSearch(e.target.value)}
                        placeholder="Tìm theo người đăng, nội dung đề xuất..."
                        className="w-full bg-white border border-slate-250 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-750 shadow-3xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-505 font-extrabold uppercase tracking-wider">
                        <th className="p-4 w-12 text-center border border-slate-200"><T><span translate="no" className="notranslate">STT</span></T></th>
                        <th className="p-4 min-w-[180px] border border-slate-200"><T><span translate="no" className="notranslate">Thông tin ghi nhận</span></T></th>
                        <th className="p-4 w-[28%] border border-slate-200"><T><span translate="no" className="notranslate">Nội dung đề xuất</span></T></th>
                        <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Hình ảnh</span></T></th>
                        <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Trạng thái</span></T></th>
                        <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Thao tác</span></T></th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-medium text-slate-700">
                      {(() => {
                        const filteredProposals = reports.filter((r) => {
                          if (r.isDeleted) return false;
                          if (r.isApproved !== false) return false;

                          // Reviewer checks
                          if (currentUser?.role === UserRole.REVIEWER) {
                            const clean = (s: string) => (s || "").replace(/\s*\([^)]+\)$/, "").trim().toLowerCase();
                            const isMatch = clean(r.factory) === clean(currentUser.branch || "") || r.factory.toLowerCase() === (currentUser.branch || "").toLowerCase();
                            if (!isMatch) return false;
                          }

                          const s = proposalSearch.toLowerCase();
                          const matchesSearch =
                            r.uploaderName.toLowerCase().includes(s) ||
                            r.content.toLowerCase().includes(s) ||
                            r.category.toLowerCase().includes(s);

                          const matchesFactory = proposalFactory === "Tất cả" ? true : r.factory === proposalFactory;
                          const matchesCategory = proposalCategory === "Tất cả" ? true : r.category === proposalCategory;

                          return matchesSearch && matchesFactory && matchesCategory;
                        });

                        if (filteredProposals.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                <T><span translate="no" className="notranslate">Không có đề xuất nào đang chờ phê duyệt.</span></T>
                              </td>
                            </tr>
                          );
                        }

                        return filteredProposals.map((r, index) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-center font-mono text-slate-400 border border-slate-200">{index + 1}</td>
                            <td className="p-4 space-y-1.5 min-w-[180px] border border-slate-200">
                              <div className="text-[10.5px] text-slate-600 leading-snug">
                                <span className="font-extrabold text-slate-700 block">{formatNameCapitalized(resolveUploaderInfo(users, r).fullName)}</span>
                                <span className="text-[9.5px] text-slate-400 font-mono block"><span translate="no" className="notranslate">{r.uploaderPhone}</span></span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-400 select-none">
                                <span translate="no" className="notranslate">🕒 {r.timestamp}</span>
                              </div>
                              <div className="font-bold text-slate-800 text-[11px] leading-tight">
                                <span translate="no" className="notranslate">{getFactoryDisplayName(r.factory)}</span>
                              </div>
                              <div className="select-none w-fit">
                                <span
                                  className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase text-white block tracking-wider leading-none"
                                  style={{ backgroundColor: colorMap[r.category] }}
                                >
                                  <T><span translate="no" className="notranslate">{r.category}</span></T>
                                </span>
                              </div>
                            </td>
                            <td className="p-4 leading-relaxed text-slate-900 max-w-sm font-bold border border-slate-200">
                              <T><span translate="no" className="notranslate">{(r.content || "").toUpperCase()}</span></T>
                              {r.notes && (
                                <div className="mt-1 text-[10.5px] text-slate-800 font-medium italic block border-l-2 border-amber-500 pl-1.5">
                                  <T><span translate="no" className="notranslate">Ghi chú: {r.notes}</span></T>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center border border-slate-200">
                              <DesktopThumbnailSlider 
                                imageUrls={r.imageUrls && r.imageUrls.length > 0 ? r.imageUrls : [r.imageUrl || getCategoryFallbackImage(r.category)]} 
                                fallbackUrl={r.imageUrl || getCategoryFallbackImage(r.category)} 
                              />
                            </td>
                            <td className="p-4 text-center select-none whitespace-nowrap border border-slate-200">
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] px-2.5 py-1 rounded tracking-wider animate-pulse inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block animate-ping" />
                                <T><span translate="no" className="notranslate">Chờ duyệt</span></T>
                              </span>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap border border-slate-200">
                              <div className="flex items-center justify-center gap-2">
                                {/* Duyệt Đăng button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onUpdateReport) {
                                      const now = new Date();
                                      const hrs = String(now.getHours()).padStart(2, '0');
                                      const mns = String(now.getMinutes()).padStart(2, '0');
                                      const scs = String(now.getSeconds()).padStart(2, '0');
                                      const date = String(now.getDate()).padStart(2, '0');
                                      const month = String(now.getMonth() + 1).padStart(2, '0');
                                      const year = String(now.getFullYear()).slice(-2);
                                      const timeStr = `${hrs}:${mns}:${scs} ${date}/${month}/${year}`;

                                      onUpdateReport({
                                        ...r,
                                        isApproved: true,
                                        approvedBy: currentUser?.fullName || "Admin",
                                        approvedAt: timeStr,
                                        updateLogs: [...(r.updateLogs || []), `Phê duyệt tin bởi ${currentUser?.fullName || "Admin"} (${timeStr})`]
                                      });
                                      onShowToast("Đã phê duyệt và phát hành đề xuất lên Bản tin chính! 🎉", "success");
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-[#DEF7EC] hover:bg-emerald-100 border border-emerald-250 text-[#03543F] font-black rounded-lg cursor-pointer transition-all text-[10px] uppercase flex items-center gap-1 shadow-3xs"
                                  title="Phê duyệt bài viết"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-[#03543F]" />
                                  <T><span translate="no" className="notranslate">Duyệt đăng</span></T>
                                </button>

                                {/* Từ chối button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteReport(r.id, false);
                                    onShowToast("Đã từ chối đề xuất bài viết thành công! ♻️", "warning");
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-lg cursor-pointer transition-all text-[10px] uppercase flex items-center gap-1 shadow-3xs"
                                  title="Từ chối đề xuất"
                                >
                                  <FileX className="w-3.5 h-3.5 text-rose-700" />
                                  <T><span translate="no" className="notranslate">Từ chối</span></T>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DỮ LIỆU (Database history & PDF exports) */}
          {activeTab === "DỮ_LIỆU" && (
            <div className="space-y-6">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    <T><span translate="no" className="notranslate">Sổ nhật ký Biến động & Trực quan PDF</span></T>
                  </h2>
                  <T className="text-xs text-slate-500 mt-1 block"><span translate="no" className="notranslate">Khung rà soát dữ liệu sự cố toàn cục, xuất báo cáo ngày PDF tự động lưu trữ lên thư mục Drive.</span></T>

                  {/* Desktop Active vs Trash logs toggles */}
                  <div className="flex bg-slate-200/60 p-0.5 rounded-lg items-center mt-3 w-fit border border-slate-300/40 select-none">
                    <button
                      onClick={() => setShowTrashLogs(false)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black border-none cursor-pointer transition-all ${
                        !showTrashLogs
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-600 hover:text-slate-800 bg-transparent"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <T><span translate="no" className="notranslate">NHẬT KÝ BIẾN ĐỘNG</span></T>
                    </button>
                    <button
                      onClick={() => setShowTrashLogs(true)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black border-none cursor-pointer transition-all relative ${
                        showTrashLogs
                          ? "bg-white text-rose-700 shadow-sm"
                          : "text-slate-600 hover:text-rose-805 bg-transparent"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <T><span translate="no" className="notranslate">THÙNG RÁC TẠM THỜI</span></T>
                      {reports.filter((r) => r.isDeleted).length > 0 && (
                        <span className="bg-rose-600 text-[9px] text-white font-black px-1.5 py-0.5 rounded-full select-none ml-1 animate-pulse">
                          {reports.filter((r) => r.isDeleted).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* PDF compilation controls */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <div className="select-none">
                    <label className="text-[9px] text-slate-550 font-bold block uppercase mb-1"><T>Chọn Nhà máy xuất PDF:</T></label>
                    <select
                      value={selectedReportFactory}
                      onChange={(e) => setSelectedReportFactory(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded p-1.5 focus:outline-none w-36 select-none shadow-sm cursor-pointer"
                    >
                      <option value="Tất cả nhà máy">Tất cả nhà máy</option>
                      {branches.filter((b) => b.isScoring).map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="select-none">
                    <label className="text-[9px] text-slate-550 font-bold block uppercase mb-1"><T>Ngày báo cáo:</T></label>
                    <input
                      type="text"
                      value={selectedReportDate}
                      onChange={(e) => setSelectedReportDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded p-1.5 focus:outline-none w-28 text-center font-mono shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleExportPDF}
                    className="self-end px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto xl:ml-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <T>XUẤT REPORT NGAY & DRIVE</T>
                  </button>
                </div>
              </div>

              {/* QUẢN LÝ SAO LƯU & XUẤT DỮ LIỆU */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                      <span translate="no" className="notranslate">QUẢN LÝ SAO LƯU & XUẤT DỮ LIỆU</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <span translate="no" className="notranslate">Trích xuất báo cáo thay đổi 4M1E1I và bản tin phát sóng dưới dạng JSON hoặc Excel (CSV) để lưu trữ ngoại tuyến.</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CỘT 1: BÁO CÁO BIẾN ĐỘNG 4M1E1I */}
                  <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-150 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                          <span translate="no" className="notranslate">Bản tin Biến động 4M1E1I</span>
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                        <span translate="no" className="notranslate">Xuất toàn bộ danh sách {reports.filter(r => !r.isDeleted).length} báo cáo 4M1E1I (bao gồm thông tin chi tiết người viết, phân loại, ghi chú và lịch sử chỉ đạo từ cấp quản lý).</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/40">
                      <button
                        onClick={onExportBackup}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-100" />
                        <span translate="no" className="notranslate">Sao lưu toàn bộ (Kèm ảnh)</span>
                      </button>

                      <label className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span translate="no" className="notranslate">Khôi phục dữ liệu (Import)</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const content = event.target?.result as string;
                              if (onImportBackup) {
                                await onImportBackup(content);
                              }
                            };
                            reader.readAsText(file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      <button
                        onClick={() => {
                          const headers = [
                            "Mã báo cáo",
                            "Thời gian",
                            "Chi nhánh/Nhà máy",
                            "Yếu tố 4M1E1I",
                            "Nội dung ghi nhận",
                            "Ghi chú bổ sung",
                            "Phân loại",
                            "Người báo cáo",
                            "Số điện thoại",
                            "Bộ phận",
                            "Trạng thái duyệt",
                            "Chỉ đạo từ cấp trên"
                          ];

                          const escapeCSV = (val: any) => {
                            if (val === undefined || val === null) return "";
                            let str = String(val);
                            if (str.includes(",") || str.includes("\n") || str.includes('"') || str.includes(";")) {
                              str = '"' + str.replace(/"/g, '""') + '"';
                            }
                            return str;
                          };

                          const rows = reports.filter(r => !r.isDeleted).map(r => {
                            const directiveTexts = (r.directives || []).map(d => `[${d.author}]: ${d.text}`).join("; ");
                            const userObj = users.find(u => u.id === r.uploaderId || u.phone === r.uploaderPhone || u.fullName === r.uploaderName);
                            const resolvedDept = userObj ? userObj.department : (r.uploaderDepartment || "");
                            const isApproved = r.isApproved !== false;
                            return [
                              r.reportCode || r.id,
                              r.timestamp,
                              r.factory,
                              r.category,
                              r.content,
                              r.notes || "",
                              r.reportType || (r.isAbnormal ? "KPH" : "NORMAL"),
                              userObj ? userObj.fullName : r.uploaderName,
                              r.uploaderPhone,
                              resolvedDept,
                              isApproved ? "Đã duyệt" : "Chờ duyệt",
                              directiveTexts
                            ];
                          });

                          const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(","), ...rows.map(row => row.map(escapeCSV).join(","))].join("\n");
                          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          const today = new Date();
                          const dd = String(today.getDate()).padStart(2, '0');
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const yy = String(today.getFullYear()).slice(-2);
                          const dateStr = `${dd}_${mm}_${yy}`;
                          link.download = `Bantin_4M1E1I_${dateStr}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          if (onShowToast) {
                            onShowToast("Đã xuất bản tin 4M1E1I ra file Excel (CSV) thành công! 📊", "success");
                          }
                        }}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-100" />
                        <span translate="no" className="notranslate">Xuất Excel (CSV)</span>
                      </button>

                      <button
                        onClick={handleExportExcelWithImages}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                        <span translate="no" className="notranslate">Xuất Excel (.xlsx Kèm Ảnh)</span>
                      </button>
                    </div>
                  </div>

                  {/* CỘT 2: BẢN TIN PHÁT SÓNG & TICKER */}
                  <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-150 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Megaphone className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                          <span translate="no" className="notranslate">Bản tin Phát sóng & Ticker</span>
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                        <span translate="no" className="notranslate">Xuất toàn bộ danh sách {broadcasts.length} bản tin phát sóng, tin đỏ và thông báo khẩn từ quản trị viên gửi đến toàn hệ thống.</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/40">
                      <button
                        onClick={() => {
                          const jsonStr = JSON.stringify(broadcasts, null, 2);
                          const blob = new Blob([jsonStr], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          const today = new Date();
                          const dd = String(today.getDate()).padStart(2, '0');
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const yy = String(today.getFullYear()).slice(-2);
                          const dateStr = `${dd}_${mm}_${yy}`;
                          link.download = `Saoluu_Bantin_Phatsong_${dateStr}.json`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          if (onShowToast) {
                            onShowToast("Đã sao lưu bản tin phát sóng ra file JSON thành công! 💾", "success");
                          }
                        }}
                        className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span translate="no" className="notranslate">Sao lưu JSON</span>
                      </button>

                      <button
                        onClick={() => {
                          const headers = [
                            "Mã ID",
                            "Người phát sóng",
                            "Phân loại tin",
                            "Nội dung thông báo",
                            "Thời gian gửi"
                          ];

                          const escapeCSV = (val: any) => {
                            if (val === undefined || val === null) return "";
                            let str = String(val);
                            if (str.includes(",") || str.includes("\n") || str.includes('"') || str.includes(";")) {
                              str = '"' + str.replace(/"/g, '""') + '"';
                            }
                            return str;
                          };

                          const rows = broadcasts.map(b => [
                            b.id,
                            b.sender,
                            b.type,
                            b.content,
                            b.timestamp
                          ]);

                          const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(","), ...rows.map(row => row.map(escapeCSV).join(","))].join("\n");
                          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          const today = new Date();
                          const dd = String(today.getDate()).padStart(2, '0');
                          const mm = String(today.getMonth() + 1).padStart(2, '0');
                          const yy = String(today.getFullYear()).slice(-2);
                          const dateStr = `${dd}_${mm}_${yy}`;
                          link.download = `Bantin_Phatsong_${dateStr}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          if (onShowToast) {
                            onShowToast("Đã xuất bản tin phát sóng ra file Excel (CSV) thành công! 📊", "success");
                          }
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-3xs cursor-pointer active:scale-95"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-amber-100" />
                        <span translate="no" className="notranslate">Xuất Excel (CSV)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress feedback for compiled reports */}
              {pdfProgress && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-sm animate-fade-in space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                    <T className="text-xs font-bold text-blue-800 block">{pdfProgress}</T>
                  </div>

                  {driveSyncLogs.length > 0 && (
                    <div className="bg-slate-50 rounded p-3 font-mono text-[10px] text-slate-700 space-y-1 block border border-slate-200">
                      {driveSyncLogs.map((log, index) => (
                        <div key={index}>
                          <T>{log}</T>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showTrashLogs ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Trash Title banner */}
                  <div className="bg-slate-900 border-l-4 border-rose-600 rounded-xl p-5 shadow-sm text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🗑️</span>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-rose-400">
                            <T><span translate="no" className="notranslate">Thùng Rác Hệ Thống (Lưu Trữ Tạm Thời 4M1E1I)</span></T>
                          </h3>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            <T><span translate="no" className="notranslate">Nơi lưu trữ các bản ghi nhận bất thường/điểm sáng bị xóa. Cho phép Cấp quản lý hoặc Người viết Phục hồi (Hoàn tác) hoặc Xóa vĩnh viễn khỏi Cloud Firestore.</span></T>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-rose-600/30 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-bold uppercase select-none animate-pulse">
                        <T><span translate="no" className="notranslate">THÙNG RÁC</span></T>
                      </span>
                    </div>
                  </div>

                  {/* Trash items table */}
                  <div className="bg-white rounded-xl border border-rose-100 overflow-hidden shadow-sm">
                    {reports.filter((r) => r.isDeleted).length === 0 ? (
                      <div className="p-16 text-center flex flex-col items-center justify-center bg-slate-50/50">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                          <Trash2 className="w-8 h-8" />
                        </div>
                        <T className="text-slate-400 text-xs font-black uppercase tracking-wider"><span translate="no" className="notranslate">Thùng rác trống rỗng. Không có bản tin nào bị xóa tạm thời.</span></T>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left border border-slate-200">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] text-slate-505 font-extrabold uppercase tracking-wider">
                              <th className="p-4 w-12 text-center border border-slate-200"><T><span translate="no" className="notranslate">STT</span></T></th>
                              <th className="p-4 min-w-[180px] border border-slate-200"><T><span translate="no" className="notranslate">Thông tin ghi nhận</span></T></th>
                              <th className="p-4 w-[28%] border border-slate-200"><T><span translate="no" className="notranslate">Nội dung chi tiết bị xóa</span></T></th>
                              <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Phân loại</span></T></th>
                              <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Hành động Phục hồi / Xóa</span></T></th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-medium text-slate-700">
                            {reports
                              .filter((r) => r.isDeleted)
                              .map((r, index) => (
                                <tr key={r.id} className="hover:bg-rose-50/20 transition-colors">
                                  <td className="p-4 text-center font-mono text-slate-400 border border-slate-200">{index + 1}</td>
                                  <td className="p-4 space-y-1.5 min-w-[180px] border border-slate-200">
                                    <div className="text-[10.5px] text-slate-600 leading-snug">
                                      <span className="font-extrabold text-slate-700 block">{formatNameCapitalized(resolveUploaderInfo(users, r).fullName)}</span>
                                      <span className="text-[9.5px] text-slate-400 font-mono block"><span translate="no" className="notranslate">{r.uploaderPhone}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-400 select-none">
                                      <span translate="no" className="notranslate">🕒 {r.timestamp}</span>
                                    </div>
                                    <div className="font-bold text-slate-800 text-[11px] leading-tight">
                                      <span translate="no" className="notranslate">{getFactoryDisplayName(r.factory)}</span>
                                    </div>
                                    <div className="select-none w-fit">
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase text-white block tracking-wider leading-none"
                                        style={{ backgroundColor: colorMap[r.category] }}
                                      >
                                        <T><span translate="no" className="notranslate">{r.category}</span></T>
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 leading-relaxed text-slate-600 max-w-sm border border-slate-200">
                                    <div className="line-through text-slate-400">
                                      <T><span translate="no" className="notranslate">{(r.content || "").toUpperCase()}</span></T>
                                    </div>
                                    {r.notes && (
                                      <div className="mt-1 text-[10px] text-slate-400 italic block border-l-2 border-slate-300 pl-1.5">
                                        <T><span translate="no" className="notranslate">Ghi chú: {r.notes}</span></T>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center select-none whitespace-nowrap font-mono font-bold text-xs font-black border border-slate-200">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      {r.reportType === "KNN" ? (
                                        <span className="bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">KNN</span></T>
                                        </span>
                                      ) : r.reportType === "KPH" || r.isAbnormal ? (
                                        <span className="bg-red-50 text-red-700 border border-red-200 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">KPH</span></T>
                                        </span>
                                      ) : r.reportType === "DSA" || r.isSpotlight ? (
                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">DSA</span></T>
                                        </span>
                                      ) : (
                                        <span className="bg-slate-50 text-slate-605 border border-slate-200 font-bold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">NORMAL</span></T>
                                        </span>
                                      )}
                                      {r.reportCode && (
                                        <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold mt-0.5">
                                          <T><span translate="no" className="notranslate">{r.reportCode}</span></T>
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 text-center whitespace-nowrap border border-slate-200">
                                    {isDeleteReportAllowed(r) ? (
                                      <div className="flex justify-center items-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            if (onUpdateReport) {
                                              onUpdateReport({ ...r, isDeleted: false });
                                              if (onShowToast) {
                                                onShowToast("Đã khôi phục báo cáo thành công! ♻️", "success");
                                              }
                                            }
                                          }}
                                          className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black cursor-pointer transition-all uppercase flex items-center gap-1 shadow-sm"
                                          title="Khôi phục"
                                        >
                                          <RotateCcw className="w-3.5 h-3.5" />
                                          <T><span translate="no" className="notranslate font-black">Khôi phục</span></T>
                                        </button>

                                        {confirmDeleteId === r.id ? (
                                          <div className="flex items-center gap-1 animate-fade-in">
                                            <button
                                              onClick={() => {
                                                if (onDeleteReport) {
                                                  onDeleteReport(r.id, true);
                                                  setConfirmDeleteId(null);
                                                  if (onShowToast) {
                                                    onShowToast("Đã xóa báo cáo vĩnh viễn khỏi Cloud Firestore! 🔥", "success");
                                                  }
                                                }
                                              }}
                                              className="p-1 px-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold border border-red-700 rounded text-[10px] cursor-pointer transition-all uppercase flex items-center gap-1"
                                            >
                                              <T><span translate="no" className="notranslate font-black">Có, Xóa!</span></T>
                                            </button>
                                            <button
                                              onClick={() => setConfirmDeleteId(null)}
                                              className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold border border-slate-300 rounded text-[10px] cursor-pointer transition-all uppercase"
                                            >
                                              <T><span translate="no" className="notranslate">Hủy</span></T>
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => setConfirmDeleteId(r.id)}
                                            className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-black cursor-pointer transition-all uppercase flex items-center gap-1 shadow-sm"
                                            title="Xóa hoàn toàn"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <T><span translate="no" className="notranslate font-black">Xóa vĩnh viễn</span></T>
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic">
                                        <T><span translate="no" className="notranslate">Không có quyền</span></T>
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Filter controls panel */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <label className="text-[9px] text-slate-555 font-extrabold uppercase block mb-1">Từ khóa tìm kiếm:</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Nội dung, người ghi..."
                          value={logsSearch}
                          onChange={(e) => setLogsSearch(e.target.value)}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded px-8 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="select-none">
                      <label className="text-[9px] text-slate-555 font-extrabold uppercase block mb-1">Xưởng/Nhà máy:</label>
                      <select
                        value={logsFactory}
                        onChange={(e) => setLogsFactory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded p-1.5 text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Tất cả">Tất cả</option>
                        {branches.filter((b) => b.isScoring).map((b) => (
                          <option key={b.id} value={b.name}>{getFactoryDisplayName(b.name)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="select-none">
                      <label className="text-[9px] text-slate-555 font-extrabold uppercase block mb-1">Yếu tố 4M1E1I:</label>
                      <select
                        value={logsCategory}
                        onChange={(e) => setLogsCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded p-1.5 text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="Tất cả">Tất cả</option>
                        <option value="CON NGƯỜI">CON NGƯỜI</option>
                        <option value="MÁY MÓC">MÁY MÓC</option>
                        <option value="NGUYÊN VẬT LIỆU">NGUYÊN VẬT LIỆU</option>
                        <option value="PHƯƠNG PHÁP">PHƯƠNG PHÁP</option>
                        <option value="MÔI TRƯỜNG">MÔI TRƯỜNG</option>
                        <option value="THÔNG TIN">THÔNG TIN</option>
                      </select>
                    </div>

                    <div className="flex items-center h-full pt-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={logsAbnormalOnly}
                          onChange={(e) => setLogsAbnormalOnly(e.target.checked)}
                          className="rounded border-slate-300 bg-slate-50 accent-red-600 block"
                        />
                        <T className="text-xs font-bold text-red-600">CHỈ XEM BẤT THƯỜNG (RED)</T>
                      </label>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left border border-slate-200">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] text-slate-505 font-extrabold uppercase tracking-wider">
                            <th className="p-4 w-12 text-center border border-slate-200"><T><span translate="no" className="notranslate">STT</span></T></th>
                            <th className="p-4 min-w-[180px] border border-slate-200"><T><span translate="no" className="notranslate">Thông tin ghi nhận</span></T></th>
                            <th className="p-4 w-[28%] border border-slate-200"><T><span translate="no" className="notranslate">Nội dung chi tiết</span></T></th>
                            <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Hình ảnh</span></T></th>
                            <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Phân loại</span></T></th>
                            <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Trạng thái</span></T></th>
                            <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Thích & Tiếp nhận / Nhân rộng</span></T></th>
                            <th className="p-4 text-center border border-slate-200"><T><span translate="no" className="notranslate">Thao tác</span></T></th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-medium text-slate-700">
                          {reports
                            .filter((r) => {
                              if (r.isDeleted) return false;
                              if (r.isApproved === false) return false;
                              const s = logsSearch.toLowerCase();
                              const matchesSearch =
                                r.uploaderName.toLowerCase().includes(s) ||
                                r.content.toLowerCase().includes(s) ||
                                r.category.toLowerCase().includes(s);

                              const matchesFactory = logsFactory === "Tất cả" ? true : r.factory === logsFactory;
                              const matchesCategory = logsCategory === "Tất cả" ? true : r.category === logsCategory;
                              const matchesAbnormal = logsAbnormalOnly ? r.isAbnormal : true;

                              return matchesSearch && matchesFactory && matchesCategory && matchesAbnormal;
                            })
                            .map((r, index) => (
                              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 text-center font-mono text-slate-400 border border-slate-200">{index + 1}</td>
                                <td className="p-4 space-y-1.5 min-w-[180px] border border-slate-200">
                                  <div className="text-[10.5px] text-slate-600 leading-snug">
                                    <span className="font-extrabold text-slate-700 block">{formatNameCapitalized(resolveUploaderInfo(users, r).fullName)}</span>
                                    <span className="text-[9.5px] text-slate-400 font-mono block"><span translate="no" className="notranslate">{r.uploaderPhone}</span></span>
                                  </div>
                                  <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-400 select-none">
                                    <span translate="no" className="notranslate">🕒 {r.timestamp}</span>
                                  </div>
                                  <div className="font-bold text-slate-800 text-[11px] leading-tight">
                                    <span translate="no" className="notranslate">{getFactoryDisplayName(r.factory)}</span>
                                  </div>
                                  <div className="select-none w-fit">
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase text-white block tracking-wider leading-none"
                                      style={{ backgroundColor: colorMap[r.category] }}
                                    >
                                      <T><span translate="no" className="notranslate">{r.category}</span></T>
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 leading-relaxed text-slate-900 max-w-sm font-bold border border-slate-200">
                                  <T>{(r.content || "").toUpperCase()}</T>
                                  {r.notes && (
                                    <div className="mt-1 text-[10.5px] text-slate-800 font-medium italic block border-l-2 border-emerald-500 pl-1.5">
                                      <T>Ghi chú: {r.notes}</T>
                                    </div>
                                  )}

                                  {(r.reportType === "KPH" || r.isAbnormal) && isQcFeatureEnabled && (
                                    <DesktopQCConfirmation
                                      r={r}
                                      currentUser={currentUser}
                                      errorCatalog={errorCatalog}
                                      onUpdateReport={onUpdateReport}
                                      onAddErrorCatalogItem={onAddErrorCatalogItem}
                                    />
                                  )}

                                  {(r.reportType === "KPH" || r.isAbnormal) && (
                                    <button
                                      onClick={() => handleAIAnalyze(r)}
                                      className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm border border-blue-500/10 cursor-pointer hover:shadow active:scale-95 transition-all select-none uppercase tracking-wide"
                                    >
                                      <Bot className="w-3.5 h-3.5 text-blue-100" />
                                      <span translate="no" className="notranslate">5-WHYs & CƠ HỘI CẢI TIẾN</span>
                                    </button>
                                  )}

                                  {(r.reportType === "DSA" || r.isSpotlight) && (
                                    <button
                                      onClick={() => handleAIDsaAnalyze(r)}
                                      className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm border border-emerald-500/10 cursor-pointer hover:shadow active:scale-95 transition-all select-none uppercase tracking-wide"
                                    >
                                      <Bot className="w-3.5 h-3.5 text-emerald-100" />
                                      <span translate="no" className="notranslate">Phân tích Cơ hội & Rủi ro</span>
                                    </button>
                                  )}

                                  {/* Display directives history in Nhật ký table row */}
                                  {r.directives && r.directives.length > 0 && (
                                    <div className="mt-2 space-y-1.5 block border-l-2 border-amber-500 pl-1.5 bg-amber-50/50 p-1.5 rounded">
                                      <div className="text-[9px] font-extrabold text-[#78350f] uppercase flex items-center gap-1 mb-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        <T>Chỉ đạo / Điều hành:</T>
                                      </div>
                                      {r.directives.map((dir) => {
                                        const isExpanded = !!expandedDirectiveIdsDesktop[dir.id];
                                        if (!isExpanded) {
                                          return (
                                            <div 
                                              key={dir.id}
                                              data-directive-container-desktop="true"
                                              onClick={() => setExpandedDirectiveIdsDesktop(prev => ({ ...prev, [dir.id]: true }))}
                                              className="bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100/60 rounded p-1 flex items-center justify-between text-[10px] text-amber-900 cursor-pointer transition-all select-none shadow-3xs active:scale-[0.98]"
                                            >
                                              <span className="flex items-center gap-1 font-bold text-[9.5px]">
                                                <span>🛡️</span>
                                                <T>Chỉ đạo từ: {dir.author}</T>
                                              </span>
                                              <span className="text-[8.5px] text-slate-400 font-bold flex items-center gap-0.5 shrink-0">
                                                <T>Xem chỉ đạo</T>
                                                <span>➔</span>
                                              </span>
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
                                        const hasUserAcknowledged = acknowledgesList.some(item => item.by === currentUserSignature);

                                        return (
                                          <div key={dir.id} data-directive-container-desktop="true" className="text-[10px] text-amber-800 leading-normal border border-amber-150 bg-amber-50/30 p-2 rounded mb-1 last:mb-0">
                                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mb-1 select-none border-b border-amber-155/40 pb-1">
                                              <span className="text-amber-800 font-extrabold flex items-center gap-0.5">
                                                <span>🛡️</span>
                                                <T>{dir.author}</T>
                                              </span>
                                              <div className="flex items-center gap-2">
                                                <span>{dir.timestamp}</span>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedDirectiveIdsDesktop(prev => ({ ...prev, [dir.id]: false }));
                                                  }}
                                                  className="text-[8px] text-amber-800 hover:text-amber-950 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 font-sans cursor-pointer active:scale-95 transition-all"
                                                >
                                                  <T>Thu gọn</T>
                                                </button>
                                              </div>
                                            </div>

                                            <div className="text-[10px] text-amber-900 leading-relaxed font-semibold break-words py-1">
                                              <T>{dir.text}</T>
                                            </div>

                                            {/* Receipt Row */}
                                            <div className="mt-1.5 pt-1.5 border-t border-amber-200/50 flex items-center justify-between select-none">
                                              <button
                                                type="button"
                                                onClick={() => handleAcknowledgeDirectiveDesktop(r, dir.id)}
                                                disabled={hasUserAcknowledged}
                                                className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-bold flex items-center gap-0.5 transition-all ${
                                                  hasUserAcknowledged
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed opacity-85"
                                                    : "bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 hover:border-emerald-400 active:scale-95 cursor-pointer shadow-3xs"
                                                }`}
                                              >
                                                <span>{hasUserAcknowledged ? "✓ Đã Tiếp Nhận" : "📥 Tiếp Nhận Chỉ Đạo"}</span>
                                              </button>

                                              {acknowledgesList.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => setShowAckDetailsDesktop(prev => ({ ...prev, [dir.id]: !prev[dir.id] }))}
                                                    className={`px-1.5 py-0.5 border rounded text-[9px] font-sans font-extrabold flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                                                      showAckDetailsDesktop[dir.id]
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-3xs"
                                                        : "bg-amber-100/70 hover:bg-amber-200/70 text-amber-900 border-amber-200/60"
                                                    }`}
                                                    title="Xem danh sách tiếp nhận"
                                                  >
                                                    <span>🤝</span>
                                                    <span>{acknowledgesList.length}</span>
                                                  </button>
                                                </div>
                                              )}
                                            </div>

                                            {/* Details drawer */}
                                            {showAckDetailsDesktop[dir.id] && acknowledgesList.length > 0 && (
                                              <div className="mt-1.5 p-1.5 bg-white border border-emerald-200/60 rounded text-[9px] text-slate-700 space-y-1 animate-fadeIn max-h-24 overflow-y-auto">
                                                <div className="font-extrabold text-emerald-800 text-[8px] uppercase tracking-wider pb-0.5 border-b border-slate-100 select-none flex justify-between items-center">
                                                  <T>Danh Sách Tiếp Nhận:</T>
                                                  <span className="text-slate-400 font-normal">({acknowledgesList.length})</span>
                                                </div>
                                                {acknowledgesList.map((ack, aIdx) => (
                                                  <div key={aIdx} className="flex justify-between items-center gap-1.5 text-slate-700">
                                                    <span className="font-semibold text-slate-800 truncate max-w-[200px]"><T>{ack.by}</T></span>
                                                    <span className="text-slate-400 shrink-0 font-mono text-[8px] select-none">{ack.at}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Simple mini-form to input direct directive right inside the log table cell for leaders! */}
                                  <DesktopDirectiveForm
                                    r={r}
                                    currentUser={currentUser}
                                    users={users}
                                    onUpdateReport={onUpdateReport}
                                  />
                                </td>
                                <td className="p-4 text-center border border-slate-200">
                                  <DesktopThumbnailSlider 
                                    imageUrls={r.imageUrls && r.imageUrls.length > 0 ? r.imageUrls : [r.imageUrl || getCategoryFallbackImage(r.category)]} 
                                    fallbackUrl={r.imageUrl || getCategoryFallbackImage(r.category)} 
                                  />
                                </td>
                                <td className="p-4 text-center select-none whitespace-nowrap font-mono font-bold text-xs font-black border border-slate-200">
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    {r.reportType === "KNN" ? (
                                      <span className="bg-amber-100 text-amber-900 border border-amber-200 font-black text-[10px] px-2.5 py-1 rounded tracking-wider">
                                        <T>KNN</T>
                                      </span>
                                    ) : r.reportType === "KPH" || r.isAbnormal ? (
                                      <span className="bg-red-100 text-red-800 border border-red-200 font-black text-[10px] px-2.5 py-1 rounded tracking-wider">
                                        <T>KPH</T>
                                      </span>
                                    ) : r.reportType === "DSA" || r.isSpotlight ? (
                                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-black text-[10px] px-2.5 py-1 rounded tracking-wider">
                                        <T>DSA</T>
                                      </span>
                                    ) : (
                                      <span className="bg-slate-100 text-slate-600 border border-slate-205 font-bold text-[10px] px-2.5 py-1 rounded tracking-wide">
                                        <T>NORMAL</T>
                                      </span>
                                    )}
                                    {r.reportCode && (
                                      <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold">
                                        <T><span translate="no" className="notranslate">{r.reportCode}</span></T>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-center select-none whitespace-nowrap border border-slate-200">
                                  {r.isAbnormal ? (
                                    <T className="bg-red-50 text-red-770 border border-red-200 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase block">
                                      BẤT THƯỜNG
                                    </T>
                                  ) : (
                                    <T className="bg-emerald-50 text-emerald-770 border border-emerald-200 font-bold text-[9px] px-2 py-0.5 rounded uppercase block">
                                      BÌNH THƯỜNG
                                    </T>
                                  )}
                                </td>
                                {/* Merged likes and shares column - placed after TRẠNG THÁI */}
                                <td className="p-4 space-y-3 min-w-[180px] max-w-[220px] border border-slate-200">
                                  {/* Likes Section */}
                                  <div>
                                    <div className="text-[9px] font-extrabold text-rose-600 uppercase mb-1.5 flex items-center gap-1.5 border-b border-rose-100/50 pb-0.5">
                                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                      <T><span translate="no" className="notranslate">Người Thích</span></T>
                                    </div>
                                    {r.likedBy && r.likedBy.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                        {r.likedBy.map((name, i) => (
                                          <span key={i} className="bg-rose-50 text-rose-700 text-[9px] px-1.5 py-0.5 rounded border border-rose-100 font-bold whitespace-nowrap">
                                            <T><span translate="no" className="notranslate">{name}</span></T>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] italic"><T><span translate="no" className="notranslate">Chưa có</span></T></span>
                                    )}
                                  </div>

                                  {/* Shares/Replications Section */}
                                  <div className="mt-2.5">
                                    <div className={`text-[9px] font-extrabold uppercase mb-1.5 flex items-center gap-1.5 border-b pb-0.5 ${
                                      r.reportType === "DSA" || r.isSpotlight
                                        ? "text-emerald-700 border-emerald-100/50"
                                        : "text-blue-700 border-blue-100/50"
                                    }`}>
                                      {r.reportType === "DSA" || r.isSpotlight ? (
                                        <Award className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Share2 className="w-3.5 h-3.5 text-blue-500" />
                                      )}
                                      <span translate="no" className="notranslate">
                                        {r.reportType === "DSA" || r.isSpotlight ? "Biểu dương / Nhân rộng" : "Tiếp nhận / Nhân rộng"}
                                      </span>
                                    </div>
                                    {r.reportType === "KPH" || r.isAbnormal ? (
                                      <div className="space-y-1.5">
                                        {r.sharedBy && r.sharedBy.length > 0 ? (
                                        <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                                          {r.sharedBy.map((name, i) => {
                                            let deptName = name;
                                            const firstParenIndex = name.indexOf(" (");
                                            if (firstParenIndex !== -1) {
                                              let rawDept = name.substring(firstParenIndex + 2).trim();
                                              if (rawDept.endsWith(")")) {
                                                rawDept = rawDept.slice(0, -1).trim();
                                              }
                                              deptName = rawDept;
                                            } else {
                                              const firstParenIndexNoSpace = name.indexOf("(");
                                              if (firstParenIndexNoSpace !== -1) {
                                                let rawDept = name.substring(firstParenIndexNoSpace + 1).trim();
                                                if (rawDept.endsWith(")")) {
                                                  rawDept = rawDept.slice(0, -1).trim();
                                                }
                                                deptName = rawDept;
                                              }
                                            }
                                            const resForDept = r.resolutions?.find(
                                              (res) => res.departmentName.trim().toLowerCase() === deptName.trim().toLowerCase()
                                            );

                                            return (
                                              <div key={i} className="flex flex-col gap-0.5 bg-slate-50 p-1.5 rounded border border-slate-150 text-[9.5px]">
                                                <div className="flex items-center justify-between gap-1.5">
                                                  <span translate="no" className="notranslate font-bold text-slate-700 truncate max-w-[120px]" title={name}>
                                                    {name}
                                                  </span>
                                                  {resForDept ? (
                                                    <span translate="no" className={`notranslate text-[8px] font-black px-1 py-0.2 rounded border uppercase scale-90 ${
                                                      resForDept.status === "Đã xử lý"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`} title={`Nội dung: ${resForDept.resultText} (Cập nhật lúc: ${resForDept.updatedAt})`}>
                                                      {resForDept.status === "Đã xử lý" ? "✓ Xong" : "⏳ Trì"}
                                                    </span>
                                                  ) : (
                                                    <span translate="no" className="notranslate text-[7.5px] text-slate-400 italic">
                                                      Chưa xử lý
                                                    </span>
                                                  )}
                                                </div>
                                                {resForDept && (
                                                  <div translate="no" className="notranslate text-[8px] text-slate-500 font-medium pl-1 border-l border-slate-200 mt-0.5 max-w-[160px] truncate" title={resForDept.resultText}>
                                                    {resForDept.resultText}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span translate="no" className="notranslate text-slate-400 text-[10px] italic">Chưa tiếp nhận</span>
                                      )}

                                      {/* KPH replications list (if has replications) */}
                                      {r.replications && r.replications.length > 0 && (
                                        <div className="pt-1.5 border-t border-slate-100 space-y-1">
                                          <div className="text-[8px] font-extrabold text-emerald-700 uppercase tracking-wider select-none">
                                            Nhân rộng biện pháp:
                                          </div>
                                          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                                            {r.replications.map((rep) => (
                                              <div key={rep.id} className="flex flex-col gap-0.5 bg-emerald-50/30 p-1.5 rounded border border-emerald-100 text-[9.5px]">
                                                <div className="flex items-center justify-between gap-1.5">
                                                  <span translate="no" className="notranslate font-bold text-emerald-900 truncate max-w-[120px]" title={`${rep.factoryName} - ${rep.departmentName}`}>
                                                    {rep.factoryName} - {rep.departmentName}
                                                  </span>
                                                  <span translate="no" className={`notranslate text-[8px] font-black px-1 py-0.2 rounded border uppercase scale-90 ${
                                                    rep.status === "Đã hoàn thành"
                                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                      : rep.status === "Đang triển khai"
                                                      ? "bg-amber-100 text-amber-800 border-amber-300"
                                                      : "bg-sky-100 text-sky-800 border-sky-300"
                                                  }`} title={`Hiện trạng: ${rep.currentState || rep.notes || ""}\nHỗ trợ: ${rep.supportRequired || ""}\n(Cập nhật lúc: ${rep.updatedAt})`}>
                                                    {rep.status === "Đã hoàn thành" ? "✓ Xong" : rep.status === "Đang triển khai" ? "⏳ Chạy" : "📝 Chuẩn"}
                                                  </span>
                                                </div>
                                                <div className="text-[7.5px] text-slate-400 font-mono mt-0.5 flex justify-between select-none">
                                                  <span translate="no" className="notranslate">{rep.registrantName} {rep.phoneNumber ? `(SĐT: ${rep.phoneNumber})` : ""}</span>
                                                  <span translate="no" className="notranslate">Hạn: {rep.targetDate}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>) : (
                                      /* DSA replications list */
                                      r.replications && r.replications.length > 0 ? (
                                        <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                                          {r.replications.map((rep) => (
                                            <div key={rep.id} className="flex flex-col gap-0.5 bg-emerald-50/30 p-1.5 rounded border border-emerald-100 text-[9.5px]">
                                              <div className="flex items-center justify-between gap-1.5">
                                                <span translate="no" className="notranslate font-bold text-emerald-900 truncate max-w-[120px]" title={`${rep.factoryName} - ${rep.departmentName}`}>
                                                  {rep.factoryName} - {rep.departmentName}
                                                </span>
                                                <span translate="no" className={`notranslate text-[8px] font-black px-1 py-0.2 rounded border uppercase scale-90 ${
                                                  rep.status === "Đã hoàn thành"
                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                    : rep.status === "Đang triển khai"
                                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                                    : "bg-sky-100 text-sky-800 border-sky-300"
                                                }`} title={`Hiện trạng: ${rep.currentState || rep.notes || ""}\nHỗ trợ: ${rep.supportRequired || ""}\n(Cập nhật lúc: ${rep.updatedAt})`}>
                                                  {rep.status === "Đã hoàn thành" ? "✓ Xong" : rep.status === "Đang triển khai" ? "⏳ Chạy" : "📝 Chuẩn"}
                                                </span>
                                              </div>
                                              {rep.currentState && (
                                                <div translate="no" className="notranslate text-[8px] text-slate-600 font-medium pl-1 border-l border-emerald-200 mt-0.5 max-w-[160px] truncate" title={`Hiện trạng: ${rep.currentState}`}>
                                                  <strong>1. HT:</strong> {rep.currentState}
                                                </div>
                                              )}
                                              {rep.supportRequired && (
                                                <div translate="no" className="notranslate text-[8px] text-slate-600 font-medium pl-1 border-l border-amber-300 mt-0.5 max-w-[160px] truncate" title={`Hỗ trợ: ${rep.supportRequired}`}>
                                                  <strong>2. HTợ:</strong> {rep.supportRequired}
                                                </div>
                                              )}
                                              {!rep.currentState && !rep.supportRequired && rep.notes && (
                                                <div translate="no" className="notranslate text-[8px] text-slate-500 font-medium pl-1 border-l border-emerald-200 mt-0.5 max-w-[160px] truncate" title={rep.notes}>
                                                  {rep.notes}
                                                </div>
                                              )}
                                              <div className="text-[7.5px] text-slate-400 font-mono mt-0.5 flex justify-between select-none">
                                                <span translate="no" className="notranslate">{rep.registrantName} {rep.phoneNumber ? `(SĐT: ${rep.phoneNumber})` : ""}</span>
                                                <span translate="no" className="notranslate">Hạn: {rep.targetDate}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span translate="no" className="notranslate text-slate-400 text-[10px] italic">Chưa có nhân rộng</span>
                                      )
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-center select-none whitespace-nowrap border border-slate-200">
                                  {isDeleteReportAllowed(r) ? (
                                    <button
                                      onClick={() => {
                                        if (onDeleteReport) {
                                          onDeleteReport(r.id, false);
                                          if (onShowToast) {
                                            onShowToast("Đã chuyển báo cáo vào Thùng rác lưu trữ tạm thời! 🗑️", "warning");
                                          }
                                        }
                                      }}
                                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-850 border border-rose-200 rounded text-[10px] font-extrabold cursor-pointer transition-all uppercase flex items-center justify-center gap-1 mx-auto"
                                      title="Chuyển vào Thùng rác"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <T><span translate="no" className="notranslate font-black">Xóa</span></T>
                                    </button>
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: QUY CHẾ (Guidelines bylaws) */}
          {activeTab === "QUY_CHẾ" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-500" />
                  <T>Quy chế và Quy trình Vận hành 4M1E1I</T>
                </h2>
                <T className="text-xs text-slate-500 mt-1 block">Tài liệu chỉ đạo nghiệp vụ chính thức từ Phòng Quản Lý Chất Lượng Tân Phú Group về quy ước quản lý biến động chất lượng xưởng.</T>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 leading-relaxed text-sm text-slate-700 shadow-sm">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-l-2 border-emerald-500 pl-2">
                    <T>Mục Tiêu Chỉ Đạo Vận Hành</T>
                  </h3>
                  <T className="block text-justify text-xs text-slate-655 leading-relaxed">
                    Để đáp ứng nghiêm ngặt các chứng chỉ chất lượng quốc tế lớn gồm BRC, ISO 9001, và ISO 22000, ban giám đốc phê chuẩn quy chế vận hành 4M1E1I làm kim chỉ nam.
                  </T>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CÁ NHÂN (User profile) */}
          {activeTab === "CÁ_NHÂN" && (() => {
            const myReports = reports.filter(
              (r) =>
                !r.isDeleted &&
                (r.uploaderPhone === currentUser?.phone || r.uploaderName === currentUser?.fullName)
            );
            return (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-500" />
                    <T>Trang cá nhân</T>
                  </h2>
                  <T className="text-xs text-slate-550 mt-1 block">Cập nhật thông tin đăng ký, mật khẩu bảo mật và ảnh đại diện của bạn.</T>
                </div>

                {/* Redesigned Horizontally-Optimized Profile Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans w-full space-y-6">
                  
                  {/* Compact Horizontal Profile Header (Avatar and controls inline) */}
                  <div className="flex flex-col md:flex-row items-center gap-6 border-b border-slate-100 pb-5">
                    {/* Small, sleek, non-intrusive avatar container */}
                    <div className="relative group cursor-pointer select-none shrink-0">
                      {profileAvatar ? (
                        <img 
                          src={profileAvatar} 
                          alt="Profile Avatar" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white flex items-center justify-center font-black text-2xl border-2 border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
                          {currentUser.fullName.charAt(0)}
                        </div>
                      )}
                      
                      <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full cursor-pointer shadow-md border border-white hover:scale-110 transition-all">
                        <Upload className="w-3 h-3" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                if (onShowToast) onShowToast("Đang tải và nén ảnh đại diện để tối ưu dung lượng...", "info");
                                const compressedDataUrl = await compressAvatar(file);
                                setProfileAvatar(compressedDataUrl);
                                if (onShowToast) onShowToast("Đã nén và cập nhật ảnh đại diện thành công!", "success");
                              } catch (err: any) {
                                console.error(err);
                                if (onShowToast) onShowToast("Không thể nén ảnh đại diện: " + (err.message || err), "error");
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Horizontal Information & Inputs */}
                    <div className="flex-1 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <T className="text-base font-extrabold text-slate-800">{formatNameCapitalized(profileFullName || currentUser.fullName)}</T>
                          <T className="text-[10px] text-emerald-800 bg-[#DEF7EC] px-2 py-0.5 rounded border border-emerald-200 font-extrabold uppercase tracking-wider">
                            {currentUser.role}
                          </T>
                        </div>
                        <T className="text-[11px] text-slate-500 mt-1 block">Chi nhánh: {currentUser.branch || "N/A"} • Bộ phận: {currentUser.department || "N/A"}</T>
                        
                        {profileAvatar && (
                          <button
                            type="button"
                            onClick={() => setProfileAvatar("")}
                            className="mt-1 text-[10px] font-extrabold text-rose-600 hover:text-rose-700 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1 cursor-pointer select-none"
                          >
                            <Trash2 className="w-3 h-3" />
                            <T>Xóa ảnh đại diện</T>
                          </button>
                        )}
                      </div>

                      {/* Integrated image URL horizontal input (max width, low height) */}
                      <div className="w-full md:max-w-md bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          <T>Đường dẫn ảnh đại diện (URL):</T>
                        </label>
                        <input 
                          type="text"
                          placeholder="https://example.com/avatar.jpg"
                          value={profileAvatar.startsWith("data:") ? "" : profileAvatar}
                          onChange={(e) => setProfileAvatar(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 shadow-sm focus:outline-none font-sans font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form fields in a wide 3-column layout */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!profileFullName.trim()) {
                        onShowToast?.("Họ và tên không được để trống!", "error");
                        return;
                      }
                      if (!profilePhone.trim()) {
                        onShowToast?.("Số điện thoại không được để trống!", "error");
                        return;
                      }
                      const updatedUser: User = {
                        ...currentUser,
                        fullName: profileFullName.trim(),
                        phone: profilePhone.trim(),
                        password: profilePassword,
                        company: profileCompany,
                        branch: profileBranch,
                        department: profileDept,
                        position: profilePosition,
                        avatar: profileAvatar,
                      };
                      if (onUpdateUser) {
                        onUpdateUser(updatedUser);
                        onShowToast?.("Đã cập nhật thông tin cá nhân và đồng bộ ngược lên 'Phê duyệt nhân sự' thành công!", "success");
                      }
                    }} 
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                      {/* Read-Only Employee ID */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                          <T>Mã nhân sự quản lý (ID) *</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            disabled 
                            value={currentUser.id}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-500 font-bold font-mono focus:outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                          <T>Họ và tên đầy đủ *</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Users className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            value={profileFullName}
                            onChange={(e) => setProfileFullName(e.target.value)}
                            placeholder="Nhập họ và tên..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold focus:outline-none shadow-xs transition-colors"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                          <T>Số điện thoại đăng ký *</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            placeholder="Nhập số điện thoại..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold font-mono focus:outline-none shadow-xs transition-colors"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                          <T>Mật khẩu đăng nhập mới</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type={profileShowPassword ? "text" : "password"} 
                            value={profilePassword}
                            onChange={(e) => setProfilePassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-850 font-semibold focus:outline-none shadow-xs transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setProfileShowPassword(!profileShowPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer select-none"
                          >
                            {profileShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Chức vụ */}
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                          <T>Chức vụ (Gamification)</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Users className="w-4 h-4" />
                          </div>
                          <input 
                            type="text" 
                            required
                            value={profilePosition}
                            onChange={(e) => setProfilePosition(e.target.value)}
                            placeholder="Ví dụ: Nhân Viên, Trưởng Ca, Trưởng Phòng..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold focus:outline-none shadow-xs transition-colors"
                          />
                        </div>
                      </div>

                      {/* Tập đoàn / Công ty */}
                      <div>
                        <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1">
                          <T>Tập đoàn chủ quản</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Building className="w-4 h-4" />
                          </div>
                          <select
                            value={profileCompany}
                            onChange={(e) => {
                              setProfileCompany(e.target.value);
                              setProfileBranch("");
                              setProfileDept("");
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold cursor-pointer appearance-none focus:outline-none"
                          >
                            <option value="">--- Chọn tập đoàn ---</option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Chi nhánh trực thuộc */}
                      <div>
                        <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1">
                          <T>Chi nhánh trực thuộc</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Building className="w-4 h-4" />
                          </div>
                          <select
                            value={profileBranch}
                            onChange={(e) => {
                              setProfileBranch(e.target.value);
                              setProfileDept("");
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold cursor-pointer appearance-none focus:outline-none"
                          >
                            <option value="">--- Chọn chi nhánh ---</option>
                            {branches
                              .filter((b) => !profileCompany || b.companyId === profileCompany)
                              .map((b) => {
                                const bName = b.name || "";
                                const nameWithSuffix = bName.includes(`(${b.id})`) 
                                  ? bName 
                                  : bName.includes(`(${b.companyId})`)
                                  ? bName
                                  : `${bName.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
                                return (
                                  <option key={b.id} value={nameWithSuffix}>{nameWithSuffix}</option>
                                );
                              })}
                          </select>
                        </div>
                      </div>

                      {/* Bộ phận tiêu chuẩn */}
                      <div>
                        <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1">
                          <T>Bộ phận tiêu chuẩn</T>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Building className="w-4 h-4" />
                          </div>
                          <select
                            value={profileDept}
                            onChange={(e) => setProfileDept(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold cursor-pointer appearance-none focus:outline-none"
                          >
                            <option value="">--- Chọn bộ phận ---</option>
                            {(() => {
                              const selectedB = branches.find((b) => {
                                const bName = b.name || "";
                                const nameWithSuffix = bName.includes(`(${b.id})`) 
                                  ? bName 
                                  : bName.includes(`(${b.companyId})`)
                                  ? bName
                                  : `${bName.replace(/\s*\([^)]+\)$/, "").trim()} (${b.companyId})`;
                                return bName === profileBranch || nameWithSuffix === profileBranch;
                              });
                              if (!selectedB) return null;
                              return departments
                                .filter((d) => d.branchId === selectedB.id)
                                .map((d) => {
                                  const dName = d.name || "";
                                  const nameWithSuffix = dName.includes(`(${selectedB.id})`)
                                    ? dName
                                    : `${dName.replace(/\s*\([^)]+\)$/, "").trim()} (${selectedB.id})`;
                                  return (
                                    <option key={d.id} value={nameWithSuffix}>{nameWithSuffix}</option>
                                  );
                                });
                            })()}
                          </select>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="md:col-span-2 flex items-end justify-end pt-4">
                        <button
                          type="submit"
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-[#1e3a8a] hover:bg-blue-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer select-none py-2.5 h-10"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <T>LƯU THAY ĐỔI & ĐỒNG BỘ NGƯỢC</T>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Redesigned Tabbed Management Area: Personal 4M1E1I Reports & Announcements */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans w-full space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPersonalTab("4M1E1I")}
                        className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase cursor-pointer transition-all ${
                          personalTab === "4M1E1I" 
                            ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs" 
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <T>BẢN TIN 4M1E1I CỦA BẠN</T> ({myReports.length})
                      </button>
                      
                      {currentUser.role === UserRole.ADMIN && (
                        <button
                          onClick={() => setPersonalTab("SYSTEM")}
                          className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase cursor-pointer transition-all ${
                            personalTab === "SYSTEM" 
                              ? "bg-rose-50 text-rose-700 border border-rose-200 shadow-xs" 
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <T>THÔNG BÁO HỆ THỐNG</T> ({myBroadcasts.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {personalTab === "4M1E1I" ? (
                    myReports.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 opacity-40 text-slate-400" />
                        <span className="text-xs font-bold">
                          <T>Bạn chưa gửi báo cáo biến động chất lượng 4M1E1I nào.</T>
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myReports.map((r) => {
                          const isEditing = editingPersonalReportId === r.id;
                          return (
                            <div 
                              key={r.id} 
                              className="p-4 bg-slate-50/50 border border-slate-200/80 rounded-xl relative hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                                  <span className="px-2.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider text-blue-700 bg-blue-50 border-blue-150">
                                    {r.category}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                                    <span>{r.timestamp}</span>
                                    <span>•</span>
                                    <span className={`font-bold ${r.isApproved ? "text-emerald-600" : "text-amber-500"}`}>
                                      {r.isApproved ? <T>ĐÃ DUYỆT</T> : <T>CHỜ DUYỆT</T>}
                                    </span>
                                  </div>
                                </div>
                                
                                {isEditing ? (
                                  <textarea
                                    value={editingPersonalReportText}
                                    onChange={(e) => setEditingPersonalReportText(e.target.value)}
                                    className="w-full text-xs font-semibold font-sans p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    rows={3}
                                  />
                                ) : (
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap font-sans break-words leading-relaxed">
                                    {(r.content || "").toUpperCase()}
                                  </p>
                                )}
                                
                                {r.notes && (
                                  <div className="mt-2 text-[11px] text-slate-500 bg-white border border-slate-100 rounded p-1.5">
                                    <span className="font-extrabold text-[9px] uppercase text-slate-400 block"><T>GHI CHÚ PHÊ DUYỆT:</T></span>
                                    {r.notes}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                {/* Edit or Save Button */}
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!editingPersonalReportText.trim()) return;
                                        if (onUpdateReport) {
                                          onUpdateReport({
                                            ...r,
                                            content: editingPersonalReportText.trim().toUpperCase()
                                          });
                                          onShowToast?.("Đã cập nhật nội dung báo cáo thành công! 💾", "success");
                                        }
                                        setEditingPersonalReportId(null);
                                      }}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                    >
                                      <T>LƯU</T>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPersonalReportId(null)}
                                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      <T>HỦY</T>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPersonalReportId(r.id);
                                      setEditingPersonalReportText(r.content);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black border border-blue-200 transition-all cursor-pointer"
                                  >
                                    <Edit className="w-3 h-3 text-blue-600" />
                                    <T>SỬA NỘI DUNG</T>
                                  </button>
                                )}

                                {/* Delete Report Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onDeleteReport) {
                                      onDeleteReport(r.id, false);
                                      onShowToast?.("Đã xóa báo cáo 4M1E1I của bạn! 🗑️", "success");
                                    }
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <T>XÓA BÁO CÁO</T>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    // Admin Announcements list
                    myBroadcasts.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Bell className="w-8 h-8 opacity-40 text-slate-400" />
                        <span className="text-xs font-bold">
                          <T>Bạn chưa đăng thông báo hệ thống nào.</T>
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myBroadcasts.map((b) => (
                          <div 
                            key={b.id} 
                            className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl relative group hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                                <span className="px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider text-rose-600 bg-rose-50 border-rose-100">
                                  {b.type || <T>Bản tin</T>}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">
                                  {b.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap font-sans break-words leading-relaxed">
                                {b.content}
                              </p>
                            </div>

                            <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onDeleteBroadcast) {
                                    onDeleteBroadcast(b.id);
                                    onShowToast?.("Xóa bản tin thành công! 🗑️", "success");
                                  }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-extrabold border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <T>XÓA THÔNG BÁO</T>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 7: THÔNG BÁO (Broadcast ticker manager & bulletin board creator) */}
          {activeTab === "THÔNG_BÁO" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
                  <T>Trung tâm Cấu hình & Phát sóng Bảng tin</T>
                </h2>
                <T className="text-xs text-slate-500 mt-1 block">Quản trị toàn quyền thông báo chữ chạy (Ticker) khẩn cấp trên đỉnh hệ thống và đăng tin tức trực tuyến tới toàn bộ cán bộ công nhân viên.</T>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left side configurations */}
                {currentUser?.role === UserRole.ADMIN && (
                  <div className="xl:col-span-5 space-y-6">
                  {/* Card 1: THÔNG BÁO CHỮ CHẠY HỆ THỐNG */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sliders className="w-5 h-5 text-amber-500" />
                      <T>THÔNG BÁO CHỮ CHẠY HỆ THỐNG</T>
                    </h3>

                    <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-4 space-y-3">
                      <T className="text-amber-800 text-[10px] font-black block uppercase tracking-wider">DÒNG CHỮ CHẠY HIỆN TẠI (MARQUEE):</T>
                      <div className="text-xs text-slate-700 leading-relaxed font-sans font-medium whitespace-pre-wrap break-words">
                        <T>{tickerConfig?.text && tickerConfig.text.trim() !== "" ? tickerConfig.text : "ĐANG TRỐNG (KHÔNG PHÁT SÓNG)"}</T>
                      </div>
                      <div className="border-t border-amber-200/55 pt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <T>Tốc độ: {tickerConfig?.speed || 35} giây/vòng</T>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
                          <T>Khoảng cách: {tickerConfig?.spacing || 50}px</T>
                        </div>
                      </div>
                    </div>

                    {isEditingTicker ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                        <T className="text-slate-700 text-xs font-black uppercase tracking-wide block">CHỈNH SỬA THÔNG SỐ CHỮ CHẠY</T>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Nội dung thông báo chữ chạy:</T></label>
                          <textarea
                            value={editTickerText}
                            onChange={(e) => setEditTickerText(e.target.value)}
                            rows={3}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            placeholder="Nhập nội dung thông báo chữ chạy phát sóng..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Tốc độ (giây/vòng):</T></label>
                            <input
                              type="number"
                              value={editTickerSpeed}
                              onChange={(e) => setEditTickerSpeed(Math.max(5, Number(e.target.value)))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Khoảng cách (px):</T></label>
                            <input
                              type="number"
                              value={editTickerSpacing}
                              onChange={(e) => setEditTickerSpacing(Math.max(10, Number(e.target.value)))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSaveTickerConfig}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <T>LƯU CẤU HÌNH</T>
                          </button>
                          <button
                            onClick={() => setEditTickerText("")}
                            className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer border border-rose-200"
                            title="Xóa trống dòng chữ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <T>XÓA CHỮ</T>
                          </button>
                          <button
                            onClick={() => setIsEditingTicker(false)}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <T>HỦY</T>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartEditTicker}
                        className="w-full py-2.5 bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FCD34D] text-slate-800 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <T>Chỉnh Sửa Thông Báo Chữ Chạy</T>
                      </button>
                    )}
                  </div>

                  {/* Card 1B: KHO TRI THỨC TIÊU CHUẨN AI */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Brain className="w-5 h-5 text-[#8B5CF6] animate-pulse" />
                      <T>🧠 KHO TRI THỨC TIÊU CHUẨN AI</T>
                    </h3>

                    <div className="bg-[#F3E8FF] border border-[#E9D5FF] rounded-xl p-4 space-y-3">
                      <T className="text-[#6B21A8] text-[10px] font-black block uppercase tracking-wider">TRI THỨC TIÊU CHUẨN HIỆN TẠI:</T>
                      <div className="text-xs text-slate-750 leading-relaxed font-sans font-medium whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                        <T>{aiKnowledgeText && aiKnowledgeText.trim() !== "" ? aiKnowledgeText : "CHƯA CUNG CẤP TRI THỨC TIÊU CHUẨN (AI SẼ DÙNG TRI THỨC CHUNG CHẤT LƯỢNG)"}</T>
                      </div>
                    </div>

                    {isEditingKnowledge ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                        <T className="text-slate-700 text-xs font-black uppercase tracking-wide block">CẬP NHẬT KHO TRI THỨC AI</T>
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Nội dung thông tin / Tiêu chuẩn mới:</T></label>
                          <textarea
                            value={editKnowledgeText}
                            onChange={(e) => setEditKnowledgeText(e.target.value)}
                            rows={8}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-[#8B5CF6] focus:outline-none"
                            placeholder="Ví dụ:&#10;- Công ty vừa chứng nhận ISO 9001:2015, BRCGS, BSCI, SCAN.&#10;- Lỗi không nhất quán phiếu kiểm tra vi phạm điều khoản 7.5 của ISO 9001.&#10;- Mất an ninh nhà xưởng vi phạm tiêu chuẩn SCAN mục an ninh vật lý."
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleSaveKnowledgeConfig}
                            className="flex-1 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <T>LƯU TRI THỨC</T>
                          </button>
                          <button
                            onClick={() => setIsEditingKnowledge(false)}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <T>HỦY</T>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleStartEditKnowledge}
                        className="w-full py-2.5 bg-[#F3E8FF] hover:bg-[#E9D5FF] border border-[#D8B4FE] text-slate-800 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                        <T>Cập Nhật Kho Tri Thức AI</T>
                      </button>
                    )}
                  </div>

                  {/* Card 1C: CẤU HÌNH HỆ THỐNG PHÊ DUYỆT QC */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sliders className="w-5 h-5 text-emerald-500" />
                      <span translate="no" className="notranslate font-bold text-slate-800">Cấu hình chức năng Phê duyệt QC</span>
                    </h3>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <span translate="no" className="notranslate font-extrabold text-slate-800 text-xs block">Phê duyệt mã lỗi QC</span>
                          <span translate="no" className="notranslate text-[10px] text-slate-500 block mt-1 leading-normal">Bật hoặc tạm ẩn tính năng xác nhận mã lỗi QC và cảnh báo lỗi lặp lại đối với các báo cáo Không Phù Hợp (KPH).</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleQcFeature) {
                              onToggleQcFeature(!isQcFeatureEnabled);
                              onShowToast?.(
                                !isQcFeatureEnabled 
                                  ? "Đã kích hoạt chức năng Phê duyệt mã lỗi QC! 🛡️" 
                                  : "Đã tạm ẩn chức năng Phê duyệt mã lỗi QC! 👁️‍🗨️",
                                "info"
                              );
                            }
                          }}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shrink-0 ${isQcFeatureEnabled ? "bg-emerald-500" : "bg-slate-300"}`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isQcFeatureEnabled ? "translate-x-6" : "translate-x-0"}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] pt-1.5 border-t border-slate-200/50">
                        {isQcFeatureEnabled ? (
                          <span translate="no" className="notranslate flex items-center gap-1 text-emerald-600 font-bold">🟢 Đang hoạt động bình thường</span>
                        ) : (
                          <span translate="no" className="notranslate flex items-center gap-1 text-amber-600 font-bold">🟡 Đang tạm thời ẩn khỏi màn hình</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 1D: CẤU HÌNH CỘNG ĐIỂM HUY HIỆU */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                        <T>CẤU HÌNH CỘNG ĐIỂM HUY HIỆU</T>
                      </span>
                      {!isAddingBadge && (
                        <button
                          onClick={() => {
                            setEditingBadgeId(null);
                            setBadgeFormDisplayName("");
                            setBadgeFormKeywords("");
                            setBadgeFormPoints(10);
                            setIsAddingBadge(true);
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <T>THÊM VỊ TRÍ</T>
                        </button>
                      )}
                    </h3>

                    <T className="text-[11px] text-slate-500 leading-normal block">
                      Thiết lập quy tắc cộng điểm tự động khi nhân sự thuộc các chức vụ này tiến hành trao tặng huy hiệu (Gamification). Hệ thống sẽ tự động so khớp từ khóa chức vụ không phân biệt hoa thường để tính điểm.
                    </T>

                    {isAddingBadge && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fadeIn">
                        <T className="text-slate-800 text-xs font-black uppercase tracking-wide block">
                          {editingBadgeId ? "CẬP NHẬT CẤU HÌNH ĐIỂM" : "THÊM CẤU HÌNH ĐIỂM MỚI"}
                        </T>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Tên vị trí hiển thị:</T></label>
                          <input
                            type="text"
                            required
                            value={badgeFormDisplayName}
                            onChange={(e) => setBadgeFormDisplayName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold"
                            placeholder="Ví dụ: Trưởng Phòng / Phó Phòng"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Từ khóa so khớp (ngăn cách bằng dấu phẩy):</T></label>
                          <input
                            type="text"
                            required
                            value={badgeFormKeywords}
                            onChange={(e) => setBadgeFormKeywords(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Ví dụ: trưởng phòng, phó phòng, trưởng phân xưởng"
                          />
                          <T className="text-[9px] text-slate-400 block"><T>Hệ thống sẽ cộng điểm nếu chức vụ của người tặng chứa một trong các từ khóa này.</T></T>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 block font-bold uppercase"><T>Điểm cộng tương ứng:</T></label>
                          <input
                            type="number"
                            required
                            min={0}
                            max={1000}
                            value={badgeFormPoints}
                            onChange={(e) => setBadgeFormPoints(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono font-bold"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={handleAddOrUpdateBadge}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <T>XÁC NHẬN</T>
                          </button>
                          <button
                            onClick={() => {
                              setIsAddingBadge(false);
                              setEditingBadgeId(null);
                              setBadgeFormDisplayName("");
                              setBadgeFormKeywords("");
                              setBadgeFormPoints(10);
                            }}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <T>HỦY</T>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {badgeConfigs.map((item) => (
                        <div key={item.id} className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-start justify-between gap-3 hover:border-slate-300 transition-colors">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-750 text-xs tracking-tight uppercase select-none notranslate" translate="no">
                                {item.displayName}
                              </span>
                              <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-[9.5px] font-black font-mono">
                                +{item.points}đ
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.keywords.map((kw, idx) => (
                                <span key={idx} className="bg-slate-200 text-slate-600 text-[8.5px] font-bold px-1.5 py-0.2 rounded font-mono uppercase notranslate" translate="no">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditBadge(item)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBadge(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {badgeConfigs.length === 0 && (
                        <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          <T className="text-[11px] text-slate-400 font-bold"><T>Chưa có cấu hình nào. Sẽ sử dụng luật mặc định.</T></T>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: ĐĂNG TIN THÔNG BÁO MỚI */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Megaphone className="w-5 h-5 text-blue-500" />
                      <T>ĐĂNG TIN THÔNG BÁO MỚI</T>
                    </h3>

                    <div className="select-none space-y-1">
                      <label className="text-[10px] text-slate-500 block font-extrabold uppercase tracking-wider"><T>PHÂN LOẠI HIỂN THỊ:</T></label>
                      <select
                        value={noticeType}
                        onChange={(e) => setNoticeType(e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-lg p-2.5 focus:outline-none w-full shadow-xs font-semibold"
                      >
                        <option value="Quản trị viên phát sóng">📢 Quản trị viên phát sóng (Đỏ nổi bật)</option>
                        <option value="Biểu dương">🌟 Biểu dương (Xanh lá cây)</option>
                        <option value="Chỉ thị khẩn">🚨 Chỉ thị khẩn (Đỏ tươi)</option>
                        <option value="Hệ thống tự động">⚙️ Hệ thống tự động (Xám dịu)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 block font-extrabold uppercase tracking-wider"><T>NỘI DUNG CHI TIẾT:</T></label>
                      <MentionTextArea
                        users={users}
                        rows={4}
                        value={newNoticeContent}
                        onChange={setNewNoticeContent}
                        placeholder="Nhập nội dung thông báo gửi tới bảng tin toàn bộ CBNV..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-850 placeholder-slate-400 focus:outline-none shadow-xs leading-relaxed"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!newNoticeContent.trim()) return;
                        onAddBroadcast(newNoticeContent, noticeType);
                        setNewNoticeContent("");
                        if (onShowToast) onShowToast("Đăng thông báo lên bảng tin thành công!", "success");
                      }}
                      className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md tracking-wider uppercase"
                    >
                      <Globe className="w-4 h-4" />
                      <T>ĐĂNG LÊN BẢNG TIN</T>
                    </button>
                  </div>
                </div>
                )}

                {/* Right side: THÔNG BÁO */}
                <div className={currentUser?.role === UserRole.ADMIN ? "xl:col-span-7" : "xl:col-span-12"}>
                  <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col h-[650px] xl:h-[1200px]">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-500" />
                        <span translate="no" className="notranslate"><T>THÔNG BÁO</T></span>
                      </h3>
                      <div className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono text-[10.5px] font-black">
                        <span translate="no" className="notranslate">{combinedBroadcastsAndNotifications.length} <T>thông báo</T></span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
                      {combinedBroadcastsAndNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2">
                          <Info className="w-8 h-8 opacity-55 text-slate-400" />
                          <T className="text-xs font-semibold"><T>Chưa có thông báo nào được tạo.</T></T>
                        </div>
                      ) : (
                        combinedBroadcastsAndNotifications.map((item) => {
                          const isUnread = !item.isBroadcast && !readNotifIds.includes(item.id);

                          // Determine custom styles and tags based on type or content
                          let cardBg = "bg-slate-50/70 border-slate-200";
                          let tag1Text = "📢 THÔNG BÁO";
                          let tag1Class = "text-slate-700 bg-slate-100 border-slate-200";
                          let tag2Text = `Người tạo: ${item.sender}`;
                          let tag2Class = "text-slate-600 bg-slate-100/50 border-slate-200";

                          const typeL = item.type ? item.type.toLowerCase() : "";
                          const contentL = item.content ? item.content.toLowerCase() : "";

                          if (item.isBroadcast) {
                            if (typeL.includes("phát sóng") || typeL.includes("broadcast")) {
                              cardBg = "bg-rose-50/50 border-rose-100 hover:bg-rose-50";
                              tag1Text = "📢 PHÁT SÓNG";
                              tag1Class = "text-[#E11D48] bg-[#FFE4E6] border-[#FECDD3]";
                              tag2Text = "BAN QUẢN TRỊ";
                              tag2Class = "text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]";
                            } else if (typeL.includes("biểu dương") || contentL.includes("đại gia đình") || contentL.includes("chúc mừng") || contentL.includes("ngân hàng đề thi")) {
                              cardBg = "bg-[#F0FDF4] border-[#DCFCE7] hover:bg-[#E8FDF0]";
                              tag1Text = "📢 BIỂU DƯƠNG";
                              tag1Class = "text-[#16A34A] bg-[#DCFCE7] border-[#BBF7D0]";
                              tag2Text = item.sender === "Hệ thống" ? "Người tạo: Hệ thống" : `Người tạo: ${item.sender}`;
                              tag2Class = "text-slate-700 bg-slate-100 border-slate-200";
                            } else if (typeL.includes("khẩn") || contentL.includes("khẩn") || typeL.includes("chỉ thị")) {
                              cardBg = "bg-[#FFF5F5] border-red-200 hover:bg-[#FFEBEB]";
                              tag1Text = "🚨 CHỈ THỊ KHẨN";
                              tag1Class = "text-white bg-[#EF4444] border-[#EF4444] animate-pulse";
                              tag2Text = "BAN QUẢN TRỊ";
                              tag2Class = "text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]";
                            } else if (item.sender === "Hệ thống") {
                              cardBg = "bg-slate-50/70 border-slate-200 hover:bg-slate-100/40";
                              tag1Text = "⚙️ HỆ THỐNG";
                              tag1Class = "text-slate-700 bg-slate-100 border-slate-200";
                              tag2Text = "Người tạo: Hệ thống";
                              tag2Class = "text-slate-600 bg-slate-100/50 border-slate-200";
                            }
                          } else {
                            // System Notifications (activity/updates)
                            if (isUnread) {
                              cardBg = "bg-blue-50/80 border-blue-250 hover:bg-blue-100/70 border-l-4 border-l-blue-600 shadow-sm shadow-blue-100/50";
                              tag1Class = "text-blue-700 bg-blue-100 border-blue-300 font-extrabold";
                            } else {
                              cardBg = "bg-white border-slate-200 hover:bg-slate-50";
                              tag1Class = "text-slate-500 bg-slate-100 border-slate-200 font-medium";
                            }
                            tag1Text = "🔔 HỆ THỐNG";

                            if (typeL.includes("chỉ đạo") || typeL.includes("directive")) {
                              tag1Text = "🚨 CHỈ ĐẠO";
                              tag1Class = isUnread
                                ? "text-amber-800 bg-amber-100 border-amber-300 font-black"
                                : "text-amber-700 bg-amber-50 border-amber-100 font-medium";
                            } else if (typeL.includes("cập nhật") || typeL.includes("sửa")) {
                              tag1Text = "📝 CẬP NHẬT";
                              tag1Class = isUnread
                                ? "text-indigo-800 bg-indigo-100 border-indigo-300 font-black"
                                : "text-indigo-700 bg-indigo-50 border-indigo-100 font-medium";
                            } else if (typeL.includes("nhắc đến") || typeL.includes("mention") || typeL.includes("tag")) {
                              tag1Text = "📌 ĐƯỢC NHẮC ĐẾN";
                              tag1Class = isUnread
                                ? "text-rose-800 bg-rose-100 border-rose-300 font-black"
                                : "text-rose-700 bg-rose-50 border-rose-100 font-medium";
                            }
                          }

                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                if (isUnread) {
                                  setReadNotifIds((prev) => prev.includes(item.id) ? prev : [...prev, item.id]);
                                }
                              }}
                              className={`p-4 ${cardBg} border rounded-xl shadow-xs transition-all hover:shadow-md relative group ${
                                isUnread ? "cursor-pointer" : ""
                              }`}
                            >
                              {isUnread && (
                                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                              )}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/60 pb-2 mb-2.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-black border uppercase tracking-wider ${tag1Class}`}>
                                    <T>{tag1Text}</T>
                                  </span>
                                  {isUnread && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider text-rose-700 bg-rose-100 border-rose-200 animate-pulse">
                                      <T>MỚI</T>
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border ${tag2Class}`}>
                                    <T>{tag2Text}</T>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className="text-[10px] text-slate-400 font-bold font-mono">
                                    <T>{item.timestamp}</T>
                                  </span>
                                  {currentUser?.role === UserRole.ADMIN && (
                                    notifIdConfirmDlt === item.id ? (
                                      <div className="flex items-center gap-1 animate-fade-in">
                                        <span translate="no" className="notranslate text-[9px] text-rose-600 font-black uppercase mr-1">Xóa?</span>
                                        <button
                                          onClick={() => {
                                            if (item.isBroadcast) {
                                              if (onDeleteBroadcast) {
                                                onDeleteBroadcast(item.id);
                                                if (onShowToast) onShowToast("Xóa bản tin thành công! 🗑️", "success");
                                              }
                                            } else {
                                              if (onDeleteNotification) {
                                                onDeleteNotification(item.id);
                                                if (onShowToast) onShowToast("Xóa thông báo thành công! 🗑️", "success");
                                              }
                                            }
                                            setNotifIdConfirmDlt(null);
                                          }}
                                          className="p-1 px-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded text-[9px] cursor-pointer transition-colors uppercase leading-none"
                                        >
                                          <span translate="no" className="notranslate font-black">Xóa</span>
                                        </button>
                                        <button
                                          onClick={() => setNotifIdConfirmDlt(null)}
                                          className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold border border-slate-300 rounded text-[9px] cursor-pointer transition-colors uppercase leading-none"
                                        >
                                          <span translate="no" className="notranslate font-black">Hủy</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setNotifIdConfirmDlt(item.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                                        title="Xóa thông báo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-slate-800 font-medium font-sans leading-relaxed break-words whitespace-pre-wrap">
                                <T>{item.content}</T>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: KÊNH TRAO ĐỔI (Forum / Diễn đàn Ban Quản Trị) */}
          {activeTab === "TRAO_ĐỔI" && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-pink-500" />
                    <T>Kênh Trao Đổi & Ý Kiến Cải Tiến</T>
                  </h2>
                  <T className="text-xs text-slate-500 mt-1 block">
                    Nơi gửi ý kiến đóng góp, đề xuất cải tiến 4M1E1I và thảo luận trực tiếp với Ban Quản Trị.
                  </T>
                </div>
                <button
                  onClick={() => setIsCreatingTopic(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <T>TẠO CHỦ ĐỀ MỚI</T>
                </button>
              </div>

              {/* Main Forum Split Layout */}
              <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
                {/* Left Pane - List of Topics (35% -> col-span-4) */}
                <div className="col-span-4 bg-white border border-slate-200 rounded-lg flex flex-col min-h-0 shadow-sm overflow-hidden">
                  {/* Search and Filters */}
                  <div className="p-3 border-b border-slate-100 space-y-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm chủ đề..."
                        value={forumSearchQuery}
                        onChange={(e) => setForumSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1">
                      {["ALL", "Góp ý chức năng", "Cải tiến 4M1E", "Sự cố chất lượng", "Khác"].map((cat) => {
                        const isSelected = forumCategoryFilter === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setForumCategoryFilter(cat)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <T>{cat === "ALL" ? "TẤT CẢ" : cat}</T>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Topic Items List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {(() => {
                      // Filter and sort topics
                      const filtered = topics.filter((t) => {
                        const matchesQuery =
                          t.title.toLowerCase().includes(forumSearchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(forumSearchQuery.toLowerCase()) ||
                          t.creatorName.toLowerCase().includes(forumSearchQuery.toLowerCase());
                        const matchesCat = forumCategoryFilter === "ALL" || t.category === forumCategoryFilter;
                        return matchesQuery && matchesCat;
                      });

                      // Sort: pinned first, then by timestamp decending
                      const sorted = [...filtered].sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return b.timestamp.localeCompare(a.timestamp);
                      });

                      if (sorted.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <T>Không tìm thấy chủ đề nào</T>
                          </div>
                        );
                      }

                      return sorted.map((t) => {
                        const isSelected = selectedTopicId === t.id;
                        const replyCount = replies.filter((r) => r.topicId === t.id).length;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className={`p-3 text-left transition-all cursor-pointer border-l-4 ${
                              isSelected
                                ? "bg-blue-50/50 border-l-blue-600 border-y border-slate-100"
                                : "border-l-transparent hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              {/* Category Badge */}
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <T>{t.category}</T>
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                                  t.status === "OPEN"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : t.status === "PROCESSING"
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : t.status === "RESOLVED"
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                              >
                                <T>
                                  {t.status === "OPEN"
                                    ? "Mở"
                                    : t.status === "PROCESSING"
                                    ? "Đang xử lý"
                                    : t.status === "RESOLVED"
                                    ? "Đã giải quyết"
                                    : "Đóng"}
                                </T>
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="font-bold text-slate-800 text-xs mb-1 line-clamp-1 flex items-center gap-1">
                              {t.isPinned && <Pin className="w-3 h-3 text-red-500 shrink-0 fill-red-500" />}
                              <T>{t.title}</T>
                            </h4>

                            {/* Description snippet */}
                            <p className="text-slate-500 text-[10px] line-clamp-2 leading-relaxed mb-2">
                              <T>{t.description}</T>
                            </p>

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-[9px] text-slate-400">
                              <span className="flex items-center gap-1 font-medium">
                                <UserIcon className="w-2.5 h-2.5" />
                                <T>{t.creatorName}</T>
                              </span>
                              <span className="flex items-center gap-1.5">
                                <T>{t.timestamp.split(" ")[0]}</T>
                                <span className="flex items-center gap-0.5 bg-slate-100 px-1 py-0.5 rounded-md text-slate-500 font-bold border border-slate-150">
                                  <MessageCircle className="w-2.5 h-2.5" />
                                  {replyCount}
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Pane - Conversation Details (65% -> col-span-8) */}
                <div className="col-span-8 bg-white border border-slate-200 rounded-lg flex flex-col min-h-0 shadow-sm overflow-hidden">
                  {(() => {
                    const topic = topics.find((t) => t.id === selectedTopicId);
                    if (!topic) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                          <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
                          <T className="text-xs">Vui lòng chọn một chủ đề thảo luận từ danh sách bên trái</T>
                        </div>
                      );
                    }

                    const topicReplies = replies.filter((r) => r.topicId === topic.id);
                    const isAdminOrReviewer =
                      currentUser.role === "CHỦ ADMIN" || currentUser.role === "DUYỆT VIÊN";

                    return (
                      <>
                        {/* Topic Header details */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                <T>{topic.category}</T>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  topic.status === "OPEN"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : topic.status === "PROCESSING"
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : topic.status === "RESOLVED"
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                              >
                                <T>
                                  {topic.status === "OPEN"
                                    ? "Mở"
                                    : topic.status === "PROCESSING"
                                    ? "Đang xử lý"
                                    : topic.status === "RESOLVED"
                                    ? "Đã giải quyết"
                                    : "Đóng"}
                                </T>
                              </span>
                              {topic.isPinned && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 border border-rose-200 rounded-md text-[9px] font-bold text-rose-600">
                                  <Pin className="w-2.5 h-2.5 fill-rose-600" />
                                  <T>Ghim</T>
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm leading-snug">
                              <T>{topic.title}</T>
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <T className="font-medium">
                                {topic.creatorName} ({topic.creatorRole})
                              </T>
                              <span>•</span>
                              <T>{topic.timestamp}</T>
                            </div>
                          </div>

                          {/* Administrative controls */}
                          {isAdminOrReviewer && (
                            <div className="flex items-center gap-2 shrink-0 bg-white p-2 border border-slate-200 rounded-lg">
                              {/* Toggle Pin */}
                              <button
                                onClick={() => onToggleForumTopicPin?.(topic.id)}
                                className={`p-1.5 rounded-md border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  topic.isPinned
                                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                                title="Ghim/Bỏ ghim chủ đề"
                              >
                                <Pin className={`w-3.5 h-3.5 ${topic.isPinned ? "fill-rose-600" : ""}`} />
                                <T>{topic.isPinned ? "Bỏ Ghim" : "Ghim"}</T>
                              </button>

                              {/* Status Select */}
                              <select
                                value={topic.status}
                                onChange={(e) => onUpdateForumTopicStatus?.(topic.id, e.target.value as any)}
                                className="bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-2 py-1.5 text-xs font-bold focus:outline-none"
                              >
                                <option value="OPEN">🟢 Mở</option>
                                <option value="PROCESSING">🟡 Đang xử lý</option>
                                <option value="RESOLVED">🔵 Đã giải quyết</option>
                                <option value="CLOSED">⚪ Đóng</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Stream (First post + replies) */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {/* First Post (Topic Description) */}
                          <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-md font-bold flex items-center justify-center shrink-0 text-xs">
                                {topic.creatorName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-850 text-xs">
                                    <T>{topic.creatorName}</T>
                                  </span>
                                  <span className="text-[9px] bg-slate-200 border border-slate-300 px-1 py-0.2 rounded-md text-slate-600 font-bold">
                                    <T>{topic.creatorRole}</T>
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    <T>{topic.timestamp}</T>
                                  </span>
                                </div>
                                <p className="text-slate-700 text-xs mt-2 leading-relaxed break-words whitespace-pre-wrap font-medium">
                                  <T>{topic.description}</T>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Replies Divider */}
                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-100"></div>
                            <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                              <T>Ý kiến phản hồi ({topicReplies.length})</T>
                            </span>
                            <div className="flex-grow border-t border-slate-100"></div>
                          </div>

                          {/* Replies List */}
                          {topicReplies.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 text-xs font-medium">
                              <T>Chưa có ý kiến phản hồi nào. Hãy là người đầu tiên đóng góp ý kiến!</T>
                            </div>
                          ) : (
                            topicReplies
                              .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                              .map((r) => {
                                const resolvedSender = resolveSenderInfo(users, r.senderPhone, r.senderName, r.senderRole);
                                const isBQT = r.senderRole === "CHỦ ADMIN" || r.senderPhone === "BQT" || resolvedSender.role === "ADMIN";
                                return (
                                  <div
                                    key={r.id}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                      isBQT
                                        ? "bg-amber-50/40 border-amber-200 shadow-sm"
                                        : "bg-white border-slate-150"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div
                                        className={`w-7 h-7 rounded-md font-bold flex items-center justify-center shrink-0 text-xs ${
                                          isBQT ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
                                        }`}
                                      >
                                        {resolvedSender.fullName.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-slate-800 text-xs">
                                            <T>{resolvedSender.fullName}</T>
                                          </span>
                                          <span
                                            className={`text-[9px] px-1 py-0.2 rounded-md font-bold border ${
                                              isBQT
                                                ? "bg-amber-100 border-amber-300 text-amber-700"
                                                : "bg-slate-100 border-slate-250 text-slate-600"
                                            }`}
                                          >
                                            <T>{resolvedSender.position || resolvedSender.role || r.senderRole}</T>
                                          </span>
                                          <span className="text-[9px] text-slate-400">
                                            <T>{r.timestamp}</T>
                                          </span>
                                        </div>
                                        <p className="text-slate-700 text-xs mt-1.5 leading-relaxed break-words whitespace-pre-wrap font-medium">
                                          <T>{r.message}</T>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>

                        {/* Reply editor input */}
                        <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                          <MentionTextArea
                            users={users}
                            placeholder="Mời nhập phản hồi ý kiến đóng góp tại đây..."
                            value={forumReplyMessage}
                            onChange={setForumReplyMessage}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey && forumReplyMessage.trim()) {
                                e.preventDefault();
                                onAddForumReply?.(topic.id, forumReplyMessage);
                                setForumReplyMessage("");
                              }
                            }}
                            className="flex-1 min-h-[40px] max-h-[100px] bg-white text-slate-800 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 shadow-sm resize-none"
                            rows={1}
                          />
                          <button
                            onClick={() => {
                              if (!forumReplyMessage.trim()) return;
                              onAddForumReply?.(topic.id, forumReplyMessage);
                              setForumReplyMessage("");
                            }}
                            className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <T>GỬI</T>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Create Topic Modal */}
              {isCreatingTopic && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-lg border border-slate-200 w-full max-w-[500px] p-5 shadow-xl flex flex-col space-y-4 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-pink-500" />
                        <T>Tạo Chủ Đề Trao Đổi Mới</T>
                      </h3>
                      <button
                        onClick={() => {
                          setIsCreatingTopic(false);
                          setNewTopicTitle("");
                          setNewTopicDesc("");
                        }}
                        className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {/* Category Selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          <T>Phân loại ý kiến</T>
                        </label>
                        <select
                          value={newTopicCategory}
                          onChange={(e) => setNewTopicCategory(e.target.value as any)}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="Góp ý chức năng">💡 Góp ý chức năng</option>
                          <option value="Cải tiến 4M1E">🚀 Cải tiến 4M1E</option>
                          <option value="Sự cố chất lượng">⚠️ Sự cố chất lượng</option>
                          <option value="Khác">📁 Khác</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          <T>Tiêu đề chủ đề</T>
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập tiêu đề ngắn gọn về đề xuất, ý kiến..."
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          <T>Nội dung chi tiết</T>
                        </label>
                        <MentionTextArea
                          users={users}
                          placeholder="Mô tả cụ thể ý kiến hoặc giải pháp cải tiến của bạn để Ban Quản Trị xem xét..."
                          value={newTopicDesc}
                          onChange={setNewTopicDesc}
                          className="w-full h-32 bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
                          rows={4}
                        />
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsCreatingTopic(false);
                          setNewTopicTitle("");
                          setNewTopicDesc("");
                        }}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <T>HỦY BỎ</T>
                      </button>
                      <button
                        onClick={() => {
                          if (!newTopicTitle.trim() || !newTopicDesc.trim()) return;
                          onAddForumTopic?.(newTopicTitle, newTopicDesc, newTopicCategory);
                          setIsCreatingTopic(false);
                          setNewTopicTitle("");
                          setNewTopicDesc("");
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <T>ĐĂNG CHỦ ĐỀ</T>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "QUOTA_CLOUD" && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] overflow-y-auto pr-2">
              <FirebaseQuotaMonitor
                reports={reports}
                users={users}
                chats={chats}
                broadcasts={broadcasts}
                productionRequests={productionRequests}
                onShowToast={onShowToast}
              />
            </div>
          )}

          {aiAnalysisReport && (() => {
            const isReportDnp = aiAnalysisReport && (
              aiAnalysisReport.factory?.includes("DNP") || 
              aiAnalysisReport.factory?.includes("BBM") || 
              aiAnalysisReport.factory?.includes("BBC")
            );
            const aiAssistantTitle = isReportDnp ? "Chuyên gia Trợ lý AI DNP" : "Chuyên gia Trợ lý AI Tân Phú";
            const companyName = isReportDnp ? "DNP" : "Tân Phú";

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-all animate-fadeIn">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full flex flex-col h-[85vh] overflow-hidden animate-scaleIn select-text">
                  {/* Header */}
                  <div className={`p-5 border-b border-slate-150 ${
                    aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                      ? "bg-gradient-to-r from-emerald-50 to-teal-50"
                      : "bg-gradient-to-r from-blue-50 to-indigo-50"
                  } flex items-center justify-between select-none`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                        aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                          ? "from-emerald-600 to-teal-600 shadow-emerald-500/20"
                          : "from-blue-600 to-indigo-600 shadow-blue-500/20"
                      } flex items-center justify-center text-white shadow-md`}>
                        <Bot className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
                          <span translate="no" className="notranslate">{aiAssistantTitle}</span>
                        </h3>
                        <p className={`text-[10px] font-bold ${
                          aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                            ? "text-emerald-600"
                            : "text-indigo-600"
                        } uppercase tracking-wider`}>
                          <span translate="no" className="notranslate">
                            {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                              ? "Phân tích Cơ hội & Rủi ro 4M1E1I"
                              : "5-WHYs & CƠ HỘI CẢI TIẾN"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAiAnalysisReport(null);
                        setAiAnalysisText("");
                      }}
                      className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Tabs bar */}
                  <div className="flex border-b border-slate-200 bg-white px-5 select-none">
                    <button
                      onClick={() => setActiveAiTab('analysis')}
                      className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeAiTab === 'analysis'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Brain className="w-4 h-4" />
                      <span translate="no" className="notranslate">
                        {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                          ? "Bảng Phân tích Cơ hội & Rủi ro"
                          : "5-WHYs & CƠ HỘI CẢI TIẾN"}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveAiTab('chat')}
                      className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                        activeAiTab === 'chat'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span translate="no" className="notranslate">Hỏi đáp & Thảo luận AI</span>
                      {aiChatMessages.length > 1 && (
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center">
                          {aiChatMessages.length - 1}
                        </span>
                      )}
                    </button>
                  </div>

                  {activeAiTab === 'analysis' ? (
                    /* Content area */
                    <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/40">
                      {/* Input report summary card */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                          <span translate="no" className="notranslate">
                            {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight 
                              ? "Thông tin điểm sáng phân tích:" 
                              : (aiAnalysisReport?.reportType === "KNN" ? "Thông tin khiếu nại phân tích:" : "Thông tin sự cố phân tích:")}
                          </span>
                          {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded">DSA</span>
                          ) : aiAnalysisReport?.reportType === "KNN" ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">KNN</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded">KPH</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block select-none">
                              <span translate="no" className="notranslate">Xưởng/Nhà máy:</span>
                            </span>
                            <span translate="no" className="notranslate font-bold text-slate-700">{getFactoryDisplayName(aiAnalysisReport.factory)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block select-none">
                              <span translate="no" className="notranslate">Phân loại 4M1E1I:</span>
                            </span>
                            <span translate="no" className="notranslate font-black text-slate-700 uppercase block" style={{ color: colorMap[aiAnalysisReport.category] }}>{aiAnalysisReport.category}</span>
                          </div>
                        </div>
                        <div className="text-xs pt-1.5 border-t border-slate-200/60">
                          <span className="text-slate-400 block select-none">
                            <span translate="no" className="notranslate">
                              {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight ? "Nội dung sáng kiến:" : "Nội dung chi tiết lỗi:"}
                            </span>
                          </span>
                          <p className="text-slate-700 font-medium leading-relaxed">{aiAnalysisReport.content}</p>
                        </div>
                      </div>

                      {/* Analysis outcome */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm min-h-[250px] relative">
                        {isAnalyzing ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 select-none">
                            <div className="relative">
                              <div className={`w-14 h-14 rounded-full border-4 ${
                                aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                  ? "border-emerald-100 border-t-emerald-600"
                                  : "border-indigo-100 border-t-indigo-600"
                              } animate-spin`}></div>
                              <div className={`absolute inset-0 flex items-center justify-center ${
                                aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                  ? "text-emerald-600"
                                  : "text-indigo-600"
                              }`}>
                                <Brain className="w-6 h-6 animate-pulse" />
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-black text-slate-750 animate-pulse">
                                <span translate="no" className="notranslate">
                                  {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                    ? "Trí tuệ nhân tạo đang phân tích cơ hội & rủi ro..."
                                    : "Trí tuệ nhân tạo đang phân tích lỗi..."}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                <span translate="no" className="notranslate">
                                  {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                    ? "Đang rà soát cơ hội, rủi ro và đánh giá quy tắc nghiêm ngặt 4M1E1I"
                                    : `Đang áp dụng mô hình 5-Why và đề xuất giải pháp cho ${companyName}`}
                                </span>
                              </p>
                            </div>
                          </div>
                        ) : aiAnalysisText ? (
                          <div className="prose max-w-none text-xs text-slate-700 leading-relaxed [&_h1]:text-base [&_h1]:font-black [&_h1]:text-slate-850 [&_h1]:mb-3 [&_h1]:mt-5 [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:text-slate-800 [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-slate-755 [&_h3]:mb-1.5 [&_h3]:mt-3 [&_p]:mb-2.5 [&_p]:text-justify [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:text-slate-900 [&_strong]:font-bold [&_code]:bg-slate-100 [&_code]:p-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-[11px]">
                            <ReactMarkdown>{aiAnalysisText}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 select-none">
                            <Bot className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-xs">
                              <span translate="no" className="notranslate">
                                {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                  ? "Bấm nút \"Phân tích Cơ hội & Rủi ro\" để bắt đầu"
                                  : "Bấm nút \"5-WHYs & CƠ HỘI CẢI TIẾN\" để bắt đầu"}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Chat Tab content */
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/40">
                      {/* Top banner */}
                      <div className={`p-3 border-b flex items-center gap-2 select-none flex-shrink-0 ${
                        aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                          : "bg-indigo-50 border-indigo-100 text-indigo-700"
                      }`}>
                        <Sparkles className={`w-4 h-4 animate-bounce ${
                          aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight ? "text-emerald-600" : "text-indigo-600"
                        }`} />
                        <span className="text-[11px] font-bold">
                          <span translate="no" className="notranslate">
                            {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                              ? "Khung thảo luận AI chuyên sâu: Bạn có thể đặt câu hỏi hoặc phân tích thêm về các rủi ro của Điểm Sáng này."
                              : "Khung thảo luận AI chuyên sâu: Bạn có thể đặt câu hỏi về nguyên nhân 4M1E1I hoặc cải tiến sự cố này."}
                          </span>
                        </span>
                      </div>

                      {/* Message list */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {aiChatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.role !== 'user' && (
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                                aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                  ? "from-emerald-600 to-teal-600 shadow-emerald-500/10"
                                  : "from-blue-600 to-indigo-600 shadow-blue-500/10"
                              } flex items-center justify-center text-white flex-shrink-0 shadow`}>
                                <Bot className="w-4 h-4" />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                                msg.role === 'user'
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none prose max-w-none [&_p]:mb-2 [&_p]:last:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-0.5'
                              }`}
                            >
                              {msg.role === 'user' ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              ) : (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              )}
                            </div>
                            {msg.role === 'user' && (
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-xs">
                                <span translate="no" className="notranslate font-extrabold text-[10px]">USER</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {isAiSendingChat && (
                          <div className="flex gap-3 justify-start items-center">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${
                              aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                ? "from-emerald-600 to-teal-600 shadow-emerald-500/10"
                                : "from-blue-600 to-indigo-600 shadow-blue-500/10"
                            } flex items-center justify-center text-white flex-shrink-0 shadow`}>
                              <Bot className="w-4 h-4 animate-spin" />
                            </div>
                            <div className="bg-white border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-xs rounded-tl-none shadow-xs flex items-center gap-1.5 select-none">
                              <span translate="no" className="notranslate font-medium">Trợ lý AI đang suy nghĩ</span>
                              <span className="flex gap-0.5 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat input form */}
                      <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-2 flex-shrink-0">
                        <textarea
                          value={aiChatInput}
                          onChange={(e) => setAiChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendAiChatMessage();
                            }
                          }}
                          placeholder="Nhập câu hỏi của bạn cho Chuyên gia AI tại đây..."
                          rows={1}
                          disabled={isAiSendingChat}
                          className="flex-1 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all resize-none max-h-24 min-h-[38px] leading-relaxed"
                        />
                        <button
                          onClick={handleSendAiChatMessage}
                          disabled={isAiSendingChat || !aiChatInput.trim()}
                          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl shadow-md disabled:shadow-none hover:shadow-lg transition-all cursor-pointer flex-shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end select-none flex-shrink-0">
                    <button
                      onClick={() => {
                        setAiAnalysisReport(null);
                        setAiAnalysisText("");
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer shadow-sm hover:shadow transition-all select-none uppercase tracking-wide"
                    >
                      <span translate="no" className="notranslate">Đóng cửa sổ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
}
