import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ExcelJS from "exceljs";
import ReactMarkdown from "react-markdown";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { COLLECTIONS, saveDocument, deleteDocument } from "../utils/firebaseSync";
import {
  Users,
  Settings,
  Cpu,
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
  Crown,
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
  AtSign,
  MessageCircle,
  Filter,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CornerUpLeft,
  User as UserIcon,
  Award,
  ExternalLink,
  ListTodo,
  Target,
  Copy,
  RotateCw,
  CheckCircle2,
  BookOpen,
  FlaskConical,
  Image as ImageIcon,
  Flame,
  BellRing,
  ClipboardCheck,
  Activity,
  Shield,
  LogOut
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
  QualityReportResolution,
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
  DirectMessageItem,
  ForumTopic,
  ForumReply,
  ForumTopicCategory,
  ForumTopicStatus,
  ErrorCatalogItem,
  BadgePointConfigItem,
  getBadgeScore,
  KnowledgeDoc,
  FestiveBannerConfig
} from "../types";
import { parseReportTimestamp } from "../utils/notificationHelper";
import { STANDARDIZED_QC_DEPT } from "../data";
import { generateDailyReportPDF } from "../utils/pdfGenerator";
import { formatNameCapitalized, canUserManageDirective, isSameBranchOrFactory, canUserProcessOrResolveReport, canUserTransferDnpTpp, canUserEditReport, canUserDeleteReport, isReportWithin15Days } from "../utils/branchHelpers";
import { MobileReportRatingContainer } from "./MobileReportRatingSection";
import { MentionInput, MentionTextArea } from "./MentionTextArea";
import { RichChatInputBox, AttachedImage } from "./RichChatInputBox";
import { renderFormattedMessage } from "../utils/formatMessage";
import FirebaseQuotaMonitor from "./FirebaseQuotaMonitor";
import StatisticsDashboard from "./StatisticsDashboard";
import ProgressTrackingDashboard from "./ProgressTrackingDashboard";
import BadgeStatisticsDashboard from "./BadgeStatisticsDashboard";
import PersonalContributionTab from "./PersonalContributionTab";
import { compressAvatar, getCategoryFallbackImage } from "../utils/imageProcessor";
import { findUser, resolveUploaderInfo, resolveBadgeGiverInfo, resolveEvaluatorInfo, resolveSenderInfo, isCurrentUserSender, getDefaultMembersForReport, extractTaggedUserIds } from "../utils/userResolver";
import CapaManagementHub from "./CapaManagementHub";
import { AiKnowledgeBaseHub } from "./AiKnowledgeBaseHub";
import { TrialTrackingHub } from "./TrialTrackingHub";
import { TaskStructuredContent } from "./TaskStructuredContent";
import { FestiveBannerConfigCard } from "./FestiveBannerConfigCard";
import {
  CompanyScope,
  getUserCompany,
  getReportCompany,
  getBranchCompany,
  isReportInScope,
  isUserInScope,
  isBranchInScope,
  isKnowledgeDocInScope,
  isTrialInScope,
  isTopicInScope,
  isUserAllowedToViewTopic,
  getEffectiveCompanyScope
} from "../utils/companyScope";


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
  showMobilePreview?: boolean;

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
  onEditReport?: (report: QualityReport) => void;
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
  onAddForumTopic?: (title: string, description: string, category: ForumTopicCategory, reportId?: string, invitedUserIds?: string[]) => string | void;
  onAddForumReply?: (topicId: string, message: string, extraData?: Partial<ForumReply>) => void;
  onEditForumReply?: (replyId: string, updatedData: string | Partial<ForumReply>) => void;
  onDeleteForumReply?: (replyId: string) => void;
  onLikeForumReply?: (replyId: string) => void;
  onUpdateForumTopicStatus?: (topicId: string, status: ForumTopicStatus) => void;
  onToggleForumTopicPin?: (topicId: string) => void;
  onEditForumTopic?: (topicId: string, title: string, description: string, category: ForumTopicCategory) => void;
  onUpdateTopicInvitedUsers?: (topicId: string, invitedUserIds: string[]) => void;
  onDeleteForumTopic?: (topicId: string) => void;

  // Error Catalog properties
  errorCatalog?: ErrorCatalogItem[];
  onAddErrorCatalogItem?: (item: ErrorCatalogItem) => void;
  onUpdateErrorCatalogItem?: (code: string, updated: ErrorCatalogItem) => void;
  onDeleteErrorCatalogItem?: (code: string) => void;

  isQcFeatureEnabled?: boolean;
  onToggleQcFeature?: (enabled: boolean) => void;

  // Knowledge Base properties
  knowledgeDocs?: KnowledgeDoc[];
  onAddKnowledgeDoc?: (doc: Omit<KnowledgeDoc, "id" | "updatedAt">) => void;
  onUpdateKnowledgeDoc?: (doc: KnowledgeDoc) => void;
  onDeleteKnowledgeDoc?: (id: string) => void;

  // Festive Banner
  festiveBannerConfig?: FestiveBannerConfig | null;
  onUpdateFestiveBannerConfig?: (config: FestiveBannerConfig) => Promise<void> | void;
}

const desktopTheme = {
  bg: "bg-[#1e3a8a]",
  text: "text-[#1e3a8a]",
  lightBg: "bg-blue-50",
  border: "border-[#1e3a8a]"
};

const getCategoryIcon = (cat: Category4M1E1I | string) => {
  switch (cat) {
    case "CON NGƯỜI":
      return <Users className="w-4 h-4 mr-2 text-indigo-600 shrink-0 inline-block" />;
    case "MÁY MÓC":
      return <Cpu className="w-4 h-4 mr-2 text-green-600 shrink-0 inline-block" />;
    case "NGUYÊN VẬT LIỆU":
      return <Settings className="w-4 h-4 mr-2 text-fuchsia-600 shrink-0 inline-block" />;
    case "PHƯƠNG PHÁP":
      return <FileText className="w-4 h-4 mr-2 text-amber-600 shrink-0 inline-block" />;
    case "MÔI TRƯỜNG":
      return <Heart className="w-4 h-4 mr-2 text-teal-600 shrink-0 inline-block" />;
    case "THÔNG TIN":
      return <Info className="w-4 h-4 mr-2 text-slate-600 shrink-0 inline-block" />;
    default:
      return <Cpu className="w-4 h-4 mr-2 text-slate-600 shrink-0 inline-block" />;
  }
};

const isHQOrManagerUser = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === UserRole.ADMIN || user.role === UserRole.REVIEWER) return true;
  const dept = (user.department || "").toUpperCase();
  const pos = (user.position || "").toUpperCase();
  return (
    dept.includes("BAN TGĐ") ||
    dept.includes("QUẢN TRỊ") ||
    dept.includes("QLCL") ||
    pos.includes("TRƯỞNG") ||
    pos.includes("GIÁM ĐỐC") ||
    pos.includes("QUẢN ĐỐC")
  );
};

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
        className="w-full aspect-[16/9] max-h-[220px] border border-slate-200/90 rounded-xl p-1 bg-slate-100 relative group overflow-hidden focus:outline-none hover:border-blue-500 block shadow-2xs hover:shadow-md transition-all cursor-zoom-in"
        title="Nhấp để phóng to / xem chi tiết hình ảnh"
      >
        <div className="w-full h-full relative overflow-hidden rounded-lg bg-slate-950">
          {list.map((url, i) => (
            <img
              key={url + i}
              src={url}
              alt="Thumb"
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover rounded-lg group-hover:scale-105 transition-all duration-700 ${
                i === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-0"
              }`}
            />
          ))}

          {/* Hover Zoom Overlay */}
          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center pointer-events-none">
            <span className="bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-lg border border-white/20">
              <ZoomIn className="w-3.5 h-3.5" />
              <T><span translate="no" className="notranslate">Phóng to xem ảnh</span></T>
            </span>
          </div>
        </div>

        {list.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 text-white text-[9px] font-black px-2 py-0.5 rounded-full leading-none shadow-md z-30 border border-white/20 flex items-center gap-1">
            <ImageIcon className="w-2.5 h-2.5" />
            <span translate="no" className="notranslate">{index + 1}/{list.length}</span>
          </div>
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
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5 bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-lg p-1 transition-all w-full shadow-2xs">
      <div className="flex-1 min-w-0">
        <MentionInput
          users={users}
          value={text}
          onChange={setText}
          placeholder="Nhập chỉ đạo (@ nhắc tên)..."
          className="w-full bg-transparent border-none text-[10.5px] px-2 py-0.5 placeholder:text-slate-400 placeholder:italic focus:outline-none select-text"
        />
      </div>
      <button
        type="submit"
        disabled={!text.trim()}
        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-[10px] rounded-md shadow-2xs cursor-pointer transition-all shrink-0 flex items-center gap-1.5 active:scale-95 select-none"
      >
        <Send className="w-3 h-3" />
        <T><span translate="no" className="notranslate">GỬI</span></T>
      </button>
    </form>
  );
}

function DesktopIncidentTimeline({
  report,
  currentUser,
  onUpdateReport,
  onAddBroadcast,
  onShowToast
}: {
  report: QualityReport;
  currentUser: User;
  onUpdateReport?: (report: QualityReport) => void;
  onAddBroadcast?: (content: string, type: string) => void;
  onShowToast?: (msg: string) => void;
}) {
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const [editingResolutionId, setEditingResolutionId] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<"Đang xử lý" | "Đã xử lý">("Đang xử lý");
  const [resResultText, setResResultText] = useState("");
  const [showAcksList, setShowAcksList] = useState(false);
  const [showResolutionsList, setShowResolutionsList] = useState(false);

  const ackCount = report.sharedBy?.length || 0;
  const resCount = report.resolutions?.length || 0;
  const isResolved = resCount > 0 && (report.resolutions?.some(r => r.status === "Đã xử lý" || !!r.resultText) ?? true);
  const isDsa = report.reportType === "DSA" || report.isSpotlight;
  const isAcknowledged = report.sharedBy?.some(name => name.startsWith(currentUser?.fullName || "Kiểm soát viên")) || false;

  const aiUsedList = report.aiUsedBy || [];
  const receiversAndHandlers = [
    ...(report.sharedBy || []),
    ...(report.resolutions?.map(r => r.handlerName) || [])
  ];
  const hasReceiverUsedAi = aiUsedList.some(aiUser =>
    receiversAndHandlers.length > 0
      ? receiversAndHandlers.some(rh =>
          rh.toLowerCase().includes(aiUser.toLowerCase()) ||
          aiUser.toLowerCase().includes(rh.toLowerCase())
        )
      : (ackCount > 0 || resCount > 0)
  );

  const reportDateObj = parseReportTimestamp(report.timestamp);
  const elapsedHours = (new Date().getTime() - reportDateObj.getTime()) / (1000 * 60 * 60);
  const isOver24h = elapsedHours > 24;

  const toast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      alert(msg);
    }
  };

  const handleToggleAcknowledge = () => {
    if (!canUserProcessOrResolveReport(currentUser, report.factory)) {
      const userBranchName = currentUser?.branch || "Chi nhánh khác";
      toast(`🔒 Tài khoản thuộc ${userBranchName}. Bạn chỉ được tiếp nhận/xử lý bản tin của Chi nhánh mình hoặc Văn Phòng Công Ty!`);
      return;
    }

    const userName = currentUser?.fullName || "Kiểm soát viên";
    const userDept = currentUser?.department || "BP Liên Quan";
    const label = `${userName} (${userDept})`;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const nowStr = `${d}/${m}/${y} ${h}:${min}:${sec}`;

    const currentShares = report.sharedBy || [];
    const isNowAcknowledged = !currentShares.some(name => name.startsWith(userName));
    const currentTimestamps = { ...(report.receiverTimestamps || {}) };

    let updatedShares: string[];
    if (isNowAcknowledged) {
      updatedShares = [...currentShares, label];
      currentTimestamps[label] = nowStr;
    } else {
      updatedShares = currentShares.filter((name) => !name.startsWith(userName));
      delete currentTimestamps[label];
      Object.keys(currentTimestamps).forEach(k => {
        if (k.startsWith(userName)) delete currentTimestamps[k];
      });
    }

    const updatedReport: QualityReport = {
      ...report,
      sharedBy: updatedShares,
      receiverTimestamps: currentTimestamps,
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    if (isNowAcknowledged && isDsa && onAddBroadcast) {
      const isDnp = report.factory && (report.factory.includes("DNP") || report.factory.includes("BBM") || report.factory.includes("BBC"));
      const companyLabel = isDnp ? "DNP" : "Tân Phú";
      onAddBroadcast(
        `Vinh danh Sáng Kiến Điểm Sáng (DSA): Tại ${report.factory} (Nhóm ${report.category}) đã ghi nhận cải tiến xuất sắc: "${report.content}" góp phần nâng cao hiệu suất, chất lượng sản phẩm ${companyLabel}! ⭐`,
        "Biểu dương sáng kiến (DSA)"
      );
    }

    if (isDsa) {
      toast(isNowAcknowledged ? "Đã ghi nhận & biểu dương sáng kiến! ⭐" : "Đã hủy ghi nhận & biểu dương! ↩️");
    } else {
      toast(isNowAcknowledged ? "Đã xác nhận tiếp nhận thông tin! ✅" : "Đã hủy xác nhận tiếp nhận! ↩️");
    }
  };

  const handleSaveResolution = () => {
    if (!resResultText.trim()) {
      toast("Vui lòng nhập nội dung kết quả xử lý! ⚠️");
      return;
    }

    const resolvedDept = currentUser?.department || currentUser?.position || "Bộ phận xử lý";
    const currentResolutions = report.resolutions ? [...report.resolutions] : [];

    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = String(now.getFullYear()).slice(-2);
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const sec = String(now.getSeconds()).padStart(2, "0");
    const formattedNow = `${d}/${m}/${y} ${h}:${min}:${sec}`;

    let existingIndex = -1;
    if (editingResolutionId) {
      existingIndex = currentResolutions.findIndex((r) => r.id === editingResolutionId);
    } else {
      existingIndex = currentResolutions.findIndex(
        (r) => r.departmentName.trim().toLowerCase() === resolvedDept.toLowerCase()
      );
    }

    const newRes: QualityReportResolution = {
      id: existingIndex >= 0 ? currentResolutions[existingIndex].id : `res-${Date.now()}`,
      departmentName: resolvedDept,
      handlerName: existingIndex >= 0 ? currentResolutions[existingIndex].handlerName : (currentUser?.fullName || "Kiểm soát viên"),
      status: resStatus,
      resultText: resResultText.trim(),
      updatedAt: formattedNow
    };

    let updatedList: QualityReportResolution[];
    if (existingIndex >= 0) {
      updatedList = currentResolutions.map((item, idx) => (idx === existingIndex ? newRes : item));
    } else {
      updatedList = [...currentResolutions, newRes];
    }

    const updatedReport: QualityReport = {
      ...report,
      resolutions: updatedList
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    setIsEditingResolution(false);
    setEditingResolutionId(null);
    setResResultText("");
    setShowResolutionsList(true);
    toast("Đã lưu kết quả xử lý thành công! ✅");
  };

  const handleDeleteResolution = (resId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa kết quả xử lý này?")) return;
    const updatedResolutions = (report.resolutions || []).filter(r => r.id !== resId);
    const updatedReport: QualityReport = {
      ...report,
      resolutions: updatedResolutions
    };
    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }
    toast("Đã xóa kết quả xử lý!");
  };

  return (
    <div className="mt-2.5 p-2.5 bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 rounded-xl flex flex-col gap-2 shadow-2xs">
      <div className="flex items-center justify-between text-[9px] font-black text-slate-500 uppercase tracking-tight select-none px-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span translate="no" className="notranslate" style={{ color: "var(--color-primary, #1e3a8a)" }}>
            <T>TIẾN TRÌNH XỬ LÝ (TIMELINE)</T>
          </span>

          {/* Đồng bộ đồng hồ số [Ngày D | hh:mm:ss] từ thời điểm tạo báo cáo đến khi 'Đã xử lý' */}
          {(report.reportType === "KPH" || report.reportType === "KNN" || report.reportType === "RRO" || report.isAbnormal) && (
            (() => {
              const processedResList = report.resolutions?.filter(res => res.status === "Đã xử lý") || [];
              const isProcessed = processedResList.length > 0;
              
              let startMs = 0;
              try {
                startMs = parseReportTimestamp(report.timestamp).getTime();
              } catch (e) {
                startMs = Date.now();
              }

              let endMs = Date.now();
              if (isProcessed) {
                let latestProcessedMs = 0;
                processedResList.forEach(res => {
                  try {
                    const parsed = parseReportTimestamp(res.updatedAt).getTime();
                    if (parsed > latestProcessedMs) latestProcessedMs = parsed;
                  } catch (e) {}
                });
                if (latestProcessedMs > 0) {
                  endMs = latestProcessedMs;
                } else if (report.updatedAt) {
                  try {
                    const repU = parseReportTimestamp(report.updatedAt).getTime();
                    if (!isNaN(repU) && repU > 0) endMs = repU;
                  } catch (e) {}
                }
              }

              const durationMs = Math.max(0, endMs - startMs);
              const totalHours = Math.floor(durationMs / (1000 * 60 * 60));
              const totalMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
              const totalSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

              const isOver24h = totalHours >= 24;
              const days = isOver24h ? Math.floor(totalHours / 24) : 0;
              const remainingHours = isOver24h ? (totalHours % 24) : totalHours;

              return (
                <div 
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-mono font-black border transition-all ${
                    isProcessed 
                      ? "bg-emerald-50/95 text-emerald-700 border-emerald-300 shadow-3xs" 
                      : isOver24h
                        ? "bg-rose-50/95 text-rose-700 border-rose-300 ring-1 ring-rose-400/50 animate-pulse shadow-3xs"
                        : "bg-blue-50/95 text-blue-700 border-blue-300 shadow-3xs"
                  }`}
                  title={isProcessed ? "Đã xử lý xong - Thời gian giải quyết sự cố" : "Thời gian tính từ lúc phát sinh bản tin đến hiện tại"}
                >
                  <Clock className={`w-2.5 h-2.5 stroke-[2.5px] shrink-0 ${isProcessed ? "text-emerald-600" : isOver24h ? "text-rose-600" : "text-blue-600"}`} />
                  <span translate="no" className="notranslate tracking-wide flex items-center">
                    {isProcessed && <span className="text-[10px] font-bold text-emerald-600 mr-0.5">✓</span>}
                    {isOver24h ? (
                      <>
                        <span className="font-extrabold">{days}D</span>
                        <span className="mx-0.5 opacity-40 font-light select-none">|</span>
                        <span>{String(remainingHours).padStart(2, "0")}:{String(totalMinutes).padStart(2, "0")}:{String(totalSeconds).padStart(2, "0")}</span>
                      </>
                    ) : (
                      <span>{String(totalHours).padStart(2, "0")}:{String(totalMinutes).padStart(2, "0")}:{String(totalSeconds).padStart(2, "0")}</span>
                    )}
                  </span>
                  {isProcessed && (
                    <span className="text-[7.5px] font-sans font-black text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded border border-emerald-200 uppercase ml-0.5">
                      <span translate="no" className="notranslate"><T>Xong</T></span>
                    </span>
                  )}
                </div>
              );
            })()
          )}
        </div>
        <div>
          {isResolved ? (
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[8.5px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5 stroke-[3px] text-emerald-600" />
              <span translate="no" className="notranslate"><T>Đã xử lý xong</T></span>
            </span>
          ) : ackCount > 0 ? (
            <span className={`px-1.5 py-0.5 rounded border flex items-center gap-1 text-[8.5px] font-bold ${
              isOver24h 
                ? "text-amber-900 bg-amber-100 border-amber-300 ring-1 ring-amber-400" 
                : "text-amber-700 bg-amber-50 border-amber-200"
            }`}>
              <Clock className="w-2.5 h-2.5 stroke-[3px] text-amber-600 animate-pulse" />
              <span translate="no" className="notranslate"><T>Đang xử lý</T></span>
            </span>
          ) : isOver24h ? (
            <div title="Báo động: Quá 24h chưa tiếp nhận" className="flex items-center justify-center p-1 rounded-full bg-amber-100/90 border border-amber-300 ring-2 ring-amber-400/60 shadow-3xs cursor-pointer active:scale-95 transition-all">
              <BellRing className="w-5 h-5 text-amber-600 animate-bell-shake stroke-[2.5px]" />
            </div>
          ) : (
            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 text-[8.5px] font-bold">
              <Bell className="w-3 h-3 text-blue-600 animate-bell-gentle stroke-[2.5px]" />
              <span translate="no" className="notranslate"><T>{"Mới ghi nhận (<24h)"}</T></span>
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-start justify-between mt-3 px-1 py-0.5">
        {/* Connector Line Background */}
        <div className="absolute top-4 left-8 right-8 h-1.5 bg-slate-200 rounded-full z-0 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isResolved
                ? "bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 w-full shadow-xs"
                : ackCount > 0
                  ? "bg-gradient-to-r from-red-500 to-amber-500 w-1/2 shadow-xs"
                  : "bg-red-500 w-0"
            }`}
          />
        </div>

        {/* AI Badge if used */}
        {aiUsedList.length > 0 && (
          <div
            className={`absolute top-4 -translate-y-1/2 z-20 inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[8px] font-black shadow-2xs border border-white ${
              ackCount > 0 
                ? "left-2/3 -translate-x-1/2" 
                : "left-1/3 -translate-x-1/2"
            }`}
            title={`Đã có ${aiUsedList.length} nhân sự dùng AI hỗ trợ`}
          >
            <span translate="no" className="notranslate"><T>Ai</T></span>
          </div>
        )}

        {/* Step 1: Ghi nhận sự cố */}
        <div className="flex flex-col items-center text-center relative z-10 w-1/3">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold shadow-sm border-2 border-white ring-2 ring-red-300 text-[10px]" title="Khởi tạo sự cố">
              <AlertTriangle className="w-4 h-4 stroke-[2.5px] text-white" />
            </div>
          </div>
          <span className="text-[9.5px] font-black text-red-700 mt-1 leading-tight flex items-center gap-0.5">
            <span translate="no" className="notranslate"><T>Ghi nhận sự cố</T></span>
          </span>
          <span className="text-[8px] font-semibold text-slate-500 mt-0.5">
            {report.timestamp ? report.timestamp.split(' ')[0] || "Khởi tạo" : "Khởi tạo"}
          </span>
        </div>

        {/* Step 2: Tiếp nhận / Xử lý */}
        <div className="flex flex-col items-center text-center relative z-10 w-1/3">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={handleToggleAcknowledge}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white text-[10px] transition-all cursor-pointer active:scale-90 ${
                ackCount > 0
                  ? hasReceiverUsedAi
                    ? "bg-amber-500 text-white ring-2 ring-purple-400 hover:bg-amber-600"
                    : "bg-amber-500 text-white ring-2 ring-amber-300 hover:bg-amber-600 shadow-amber-200"
                  : "bg-amber-100 text-amber-700 border-2 border-amber-400 hover:bg-amber-200 ring-2 ring-amber-200 animate-pulse"
              }`}
              title={
                isAcknowledged
                  ? (isDsa ? "Đã ghi nhận & biểu dương! Click để thay đổi" : "Bạn đã tiếp nhận bản tin này! Click để thay đổi")
                  : ackCount > 0
                    ? (isDsa ? "Đã biểu dương! Click để tiếp nhận/biểu dương thêm" : `Đã có ${ackCount} người tiếp nhận! Click để tiếp nhận thêm`)
                    : (isDsa ? "Click để GHI NHẬN & BIỂU DƯƠNG ngay!" : "Click để TIẾP NHẬN / XỬ LÝ ngay!")
              }
            >
              {ackCount > 0 ? (
                <Check className="w-4 h-4 stroke-[3px] text-white" />
              ) : (
                <Clock className="w-4 h-4 stroke-[2.5px] text-amber-700 animate-pulse" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleAcknowledge}
            className={`mt-1 text-[9.5px] font-black leading-tight flex items-center gap-0.5 border-none bg-transparent cursor-pointer hover:underline ${
              ackCount > 0 ? "text-amber-800" : "text-amber-700"
            }`}
          >
            <span translate="no" className="notranslate">
              <T>{ackCount > 0 ? (isDsa ? "Đã biểu dương" : "Đã tiếp nhận") : (isDsa ? "Biểu dương" : "Tiếp nhận/ Xử lý")}</T>
            </span>
          </button>

          <div className="mt-0.5 flex flex-col items-center gap-0.5">
            {ackCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAcksList(prev => !prev)}
                className="text-[8px] text-amber-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.2 rounded-full font-extrabold border border-amber-300/60 inline-block cursor-pointer active:scale-95 transition-all"
                title="Click xem danh sách chi tiết"
              >
                <span translate="no" className="notranslate">{ackCount} <T>người</T></span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleAcknowledge}
                className="text-[8px] text-amber-800 font-extrabold bg-amber-100 hover:bg-amber-200 px-1.5 py-0.2 rounded-full border border-amber-300 cursor-pointer active:scale-95 transition-all"
              >
                <span translate="no" className="notranslate"><T>+ Tiếp nhận ngay</T></span>
              </button>
            )}
          </div>
        </div>

        {/* Step 3: Ghi nhận kết quả */}
        <div className="flex flex-col items-center text-center relative z-10 w-1/3">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (!canUserProcessOrResolveReport(currentUser, report.factory)) {
                  const userBranchName = currentUser?.branch || "Chi nhánh khác";
                  toast(`🔒 Tài khoản thuộc ${userBranchName}. Bạn chỉ được ghi nhận kết quả cho bản tin của Chi nhánh mình hoặc Văn Phòng Công Ty!`);
                  return;
                }
                setIsEditingResolution(prev => !prev);
                setEditingResolutionId(null);
                setResResultText("");
                setResStatus("Đang xử lý");
              }}
              className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-white text-[10px] transition-all cursor-pointer active:scale-90 ${
                isResolved
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-300"
                  : resCount > 0
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-300"
                    : "bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100 ring-1 ring-emerald-200"
              }`}
              title={
                resCount > 0
                  ? `Đã có ${resCount} kết quả xử lý. Click để ghi nhận thêm hoặc cập nhật`
                  : "Click để GHI NHẬN KẾT QUẢ XỬ LÝ ngay!"
              }
            >
              {isResolved ? (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5px] text-white" />
              ) : (
                <ClipboardCheck className="w-4 h-4 stroke-[2.5px] text-emerald-700" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!canUserProcessOrResolveReport(currentUser, report.factory)) {
                const userBranchName = currentUser?.branch || "Chi nhánh khác";
                toast(`🔒 Tài khoản thuộc ${userBranchName}. Bạn chỉ được ghi nhận kết quả cho bản tin của Chi nhánh mình hoặc Văn Phòng Công Ty!`);
                return;
              }
              setIsEditingResolution(prev => !prev);
              setEditingResolutionId(null);
              setResResultText("");
              setResStatus("Đang xử lý");
            }}
            className={`mt-1 text-[9.5px] font-black leading-tight flex items-center gap-0.5 border-none bg-transparent cursor-pointer hover:underline ${
              isResolved ? "text-emerald-800" : resCount > 0 ? "text-emerald-700" : "text-emerald-600"
            }`}
          >
            <span translate="no" className="notranslate">
              <T>{isResolved ? "Đã xử lý" : "Ghi nhận kết quả"}</T>
            </span>
          </button>

          <div className="mt-0.5 flex flex-col items-center gap-0.5">
            {resCount > 0 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowResolutionsList(prev => !prev)}
                  className="text-[8px] text-emerald-700 bg-emerald-100/90 hover:bg-emerald-200/90 px-1.5 py-0.2 rounded-full font-extrabold border border-emerald-200/60 inline-flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
                  title="Click để ẩn/hiện danh sách kết quả xử lý"
                >
                  <span translate="no" className="notranslate">{resCount} <T>kết quả</T></span>
                  {showResolutionsList ? (
                    <ChevronDown className="w-2.5 h-2.5 stroke-[3px]" />
                  ) : (
                    <ChevronRight className="w-2.5 h-2.5 stroke-[3px]" />
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!canUserProcessOrResolveReport(currentUser, report.factory)) {
                    const userBranchName = currentUser?.branch || "Chi nhánh khác";
                    toast(`🔒 Tài khoản thuộc ${userBranchName}. Bạn chỉ được ghi nhận kết quả cho bản tin của Chi nhánh mình hoặc Văn Phòng Công Ty!`);
                    return;
                  }
                  setIsEditingResolution(true);
                  setEditingResolutionId(null);
                  setResResultText("");
                  setResStatus("Đang xử lý");
                }}
                className="text-[8px] text-emerald-700 font-extrabold bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-300 cursor-pointer active:scale-95 transition-all"
              >
                <span translate="no" className="notranslate"><T>+ Ghi nhận ngay</T></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List of Acknowledged Users (if expanded) */}
      {showAcksList && ackCount > 0 && (
        <div className="mt-2 p-2 bg-amber-50/60 border border-amber-200/80 rounded-lg text-[9.5px]">
          <div className="flex items-center justify-between font-bold text-amber-900 mb-1 pb-1 border-b border-amber-200/60">
            <span translate="no" className="notranslate">👥 Danh sách người đã tiếp nhận ({ackCount}):</span>
            <button
              type="button"
              onClick={() => setShowAcksList(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-0.5 border-none bg-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {(report.sharedBy || []).map((name, idx) => {
              const time = report.receiverTimestamps?.[name] || "";
              return (
                <div key={idx} className="flex items-center justify-between gap-1 bg-white/80 p-1 rounded border border-amber-100">
                  <span translate="no" className="notranslate font-semibold text-amber-950 truncate">
                    {name}
                  </span>
                  {time && (
                    <span className="text-[8px] text-slate-500 shrink-0 font-medium">{time}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline form to record or edit resolution */}
      {isEditingResolution && (
        <div className="mt-2 p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg flex flex-col gap-2 transition-all">
          <div className="text-[11px] font-bold text-indigo-800 flex items-center justify-between">
            <span translate="no" className="notranslate">
              <T>{editingResolutionId ? "✏️ CẬP NHẬT KẾT QUẢ XỬ LÝ KPH:" : "✍️ GHI NHẬN KẾT QUẢ XỬ LÝ KPH:"}</T>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsEditingResolution(false);
                setEditingResolutionId(null);
              }}
              className="text-slate-400 hover:text-slate-600 font-extrabold text-[12px] p-0.5 border-none bg-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Status picker */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-indigo-700 uppercase">
              <span translate="no" className="notranslate"><T>Trạng thái:</T></span>
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setResStatus("Đang xử lý")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded border text-[9.5px] font-extrabold transition-all cursor-pointer ${
                  resStatus === "Đang xử lý"
                    ? "bg-amber-50 text-amber-700 border-amber-400 shadow-3xs"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>⏳</span>
                <span translate="no" className="notranslate"><T>Đang xử lý</T></span>
              </button>
              <button
                type="button"
                onClick={() => setResStatus("Đã xử lý")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 px-1 rounded border text-[9.5px] font-extrabold transition-all cursor-pointer ${
                  resStatus === "Đã xử lý"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-400 shadow-3xs"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>✅</span>
                <span translate="no" className="notranslate"><T>Đã xử lý</T></span>
              </button>
            </div>
          </div>

          {/* Result Description text field */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[9px] font-extrabold text-indigo-700 uppercase">
              <span translate="no" className="notranslate"><T>Mô tả/ Ghi chú kết quả:</T></span>
            </label>
            <textarea
              rows={2}
              value={resResultText}
              onChange={(e) => {
                const val = e.target.value;
                setResResultText(val);
                if (val.trim().length > 0) {
                  setResStatus("Đã xử lý");
                }
              }}
              placeholder="Nhập nội dung xử lý, giải pháp khắc phục..."
              className="w-full text-[10px] font-semibold text-slate-800 bg-white border border-slate-250 rounded px-2 py-1 focus:outline-none focus:border-indigo-400 resize-none font-sans"
            />
          </div>

          {/* Executor info & Save/Cancel buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-100/40">
            <div className="flex items-center gap-1 min-w-0 truncate text-[10px] font-semibold text-slate-600">
              <span className="text-[10px] leading-none shrink-0">👤</span>
              <span translate="no" className="notranslate truncate">
                {currentUser?.fullName ? formatNameCapitalized(currentUser.fullName) : "Kiểm soát viên"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsEditingResolution(false);
                  setEditingResolutionId(null);
                }}
                className="text-[9.5px] font-bold text-slate-600 hover:text-slate-800 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-100 cursor-pointer active:scale-95 transition-all"
              >
                <span translate="no" className="notranslate"><T>Hủy</T></span>
              </button>
              <button
                type="button"
                onClick={handleSaveResolution}
                className="text-[9.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-0.5 rounded shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <span translate="no" className="notranslate"><T>Lưu kết quả</T></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of recorded Resolutions */}
      {showResolutionsList && resCount > 0 && (
        <div className="mt-2 p-2 bg-emerald-50/50 border border-emerald-200/80 rounded-lg text-[9.5px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-bold text-emerald-900 pb-1 border-b border-emerald-200/60">
            <span translate="no" className="notranslate">📋 Kết quả xử lý đã ghi nhận ({resCount}):</span>
            <button
              type="button"
              onClick={() => {
                if (!canUserProcessOrResolveReport(currentUser, report.factory)) {
                  const userBranchName = currentUser?.branch || "Chi nhánh khác";
                  toast(`🔒 Tài khoản thuộc ${userBranchName}. Bạn chỉ được ghi nhận kết quả cho bản tin của Chi nhánh mình hoặc Văn Phòng Công Ty!`);
                  return;
                }
                setIsEditingResolution(true);
                setEditingResolutionId(null);
                setResResultText("");
                setResStatus("Đang xử lý");
              }}
              className="text-[8.5px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300 cursor-pointer"
            >
              <span translate="no" className="notranslate"><T>+ Thêm</T></span>
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {(report.resolutions || []).map((res) => {
              const canEdit = currentUser?.role === UserRole.ADMIN || currentUser?.fullName === res.handlerName;
              return (
                <div key={res.id} className="p-1.5 bg-white rounded border border-emerald-150 flex flex-col gap-1 shadow-3xs">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-bold text-slate-800 text-[9.5px] truncate" translate="no">{res.handlerName}</span>
                      <span className="text-[8px] text-slate-500 truncate">({res.departmentName})</span>
                    </div>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded border shrink-0 ${
                      res.status === "Đã xử lý"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}>
                      <span translate="no" className="notranslate">{res.status}</span>
                    </span>
                  </div>
                  <div className="text-[9.5px] text-slate-700 whitespace-pre-wrap font-medium">
                    {res.resultText}
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-slate-400 pt-0.5 border-t border-slate-100">
                    <span>{res.updatedAt}</span>
                    {canEdit && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingResolution(true);
                            setEditingResolutionId(res.id);
                            setResStatus(res.status);
                            setResResultText(res.resultText);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold border-none bg-transparent cursor-pointer"
                        >
                          <span translate="no" className="notranslate"><T>Sửa</T></span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResolution(res.id)}
                          className="text-red-500 hover:text-red-700 font-bold border-none bg-transparent cursor-pointer"
                        >
                          <span translate="no" className="notranslate"><T>Xóa</T></span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
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
  } catch (error: any) {
    const isQuota = error && (error.name === "QuotaExceededError" || error.code === 22 || error.message?.includes("quota"));
    if (isQuota) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("4m1e1i_img_") || k.startsWith("4m1e1i_img_urls_"))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(key, value);
      } catch (retryErr) {
        // Silent fail for quota error
      }
    }
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

export const SIDEBAR_THEMES = [
  {
    id: "white",
    name: "Trắng Sáng (Light)",
    dotBg: "#FFFFFF",
    dotBorder: "border border-slate-300 ring-1 ring-slate-200",
    navBg: "bg-white",
    navBorder: "border-slate-200",
    titleColor: "text-slate-400",
    itemText: "text-slate-600",
    itemHover: "hover:bg-slate-100 hover:text-slate-900",
    itemActiveBg: "bg-blue-50",
    itemActiveText: "text-blue-700 font-bold",
    itemActiveBorder: "border-l-4 border-blue-600 shadow-xs",
    summaryCardBg: "bg-slate-50",
    summaryCardBorder: "border-slate-200",
    summarySubBg: "bg-white",
    summarySubBorder: "border-slate-200",
    profileCardBg: "bg-slate-50",
    profileCardBorder: "border-slate-200",
    profileTextColor: "text-slate-900",
    profileSubTextColor: "text-blue-600",
    isLight: true
  },
  {
    id: "purple",
    name: "Tím Oải Hương (Lavender)",
    dotBg: "#E9D5FF",
    dotBorder: "border border-purple-300",
    navBg: "bg-[#F3E8FF]",
    navBorder: "border-purple-200",
    titleColor: "text-purple-700",
    itemText: "text-purple-900",
    itemHover: "hover:bg-purple-200/70 hover:text-purple-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-purple-800 font-bold",
    itemActiveBorder: "border-l-4 border-purple-500 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-purple-200",
    summarySubBg: "bg-purple-50/80",
    summarySubBorder: "border-purple-200/60",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-purple-200",
    profileTextColor: "text-purple-950",
    profileSubTextColor: "text-purple-600",
    isLight: true
  },
  {
    id: "sky",
    name: "Xanh Da Trời (Sky Blue)",
    dotBg: "#BAE6FD",
    dotBorder: "border border-sky-300",
    navBg: "bg-[#E0F2FE]",
    navBorder: "border-sky-200",
    titleColor: "text-sky-700",
    itemText: "text-sky-900",
    itemHover: "hover:bg-sky-200/70 hover:text-sky-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-sky-800 font-bold",
    itemActiveBorder: "border-l-4 border-sky-500 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-sky-200",
    summarySubBg: "bg-sky-50/80",
    summarySubBorder: "border-sky-200/60",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-sky-200",
    profileTextColor: "text-sky-950",
    profileSubTextColor: "text-sky-600",
    isLight: true
  },
  {
    id: "emerald",
    name: "Xanh Ngọc Bích (Emerald)",
    dotBg: "#A7F3D0",
    dotBorder: "border border-emerald-300",
    navBg: "bg-[#D1FAE5]",
    navBorder: "border-emerald-200",
    titleColor: "text-emerald-800",
    itemText: "text-emerald-950",
    itemHover: "hover:bg-emerald-200/70 hover:text-emerald-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-emerald-800 font-bold",
    itemActiveBorder: "border-l-4 border-emerald-500 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-emerald-200",
    summarySubBg: "bg-emerald-50/80",
    summarySubBorder: "border-emerald-200/60",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-emerald-200",
    profileTextColor: "text-emerald-950",
    profileSubTextColor: "text-emerald-700",
    isLight: true
  },
  {
    id: "slateLight",
    name: "Xám Bạc Tinh Tế (Soft Slate)",
    dotBg: "#E2E8F0",
    dotBorder: "border border-slate-300",
    navBg: "bg-[#F1F5F9]",
    navBorder: "border-slate-300",
    titleColor: "text-slate-500",
    itemText: "text-slate-700",
    itemHover: "hover:bg-slate-200/80 hover:text-slate-900",
    itemActiveBg: "bg-white",
    itemActiveText: "text-blue-700 font-bold",
    itemActiveBorder: "border-l-4 border-blue-600 shadow-xs",
    summaryCardBg: "bg-white",
    summaryCardBorder: "border-slate-200",
    summarySubBg: "bg-slate-100",
    summarySubBorder: "border-slate-200",
    profileCardBg: "bg-white",
    profileCardBorder: "border-slate-200",
    profileTextColor: "text-slate-900",
    profileSubTextColor: "text-blue-600",
    isLight: true
  },
  {
    id: "slateDark",
    name: "Xám Titan (Titanium Slate)",
    dotBg: "#CBD5E1",
    dotBorder: "border border-slate-400",
    navBg: "bg-[#E2E8F0]",
    navBorder: "border-slate-300",
    titleColor: "text-slate-600",
    itemText: "text-slate-800",
    itemHover: "hover:bg-slate-300/70 hover:text-slate-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-slate-900 font-bold",
    itemActiveBorder: "border-l-4 border-slate-500 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-slate-300",
    summarySubBg: "bg-slate-100",
    summarySubBorder: "border-slate-200",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-slate-300",
    profileTextColor: "text-slate-900",
    profileSubTextColor: "text-slate-600",
    isLight: true
  },
  {
    id: "amber",
    name: "Cam Hổ Phách (Warm Amber)",
    dotBg: "#FED7AA",
    dotBorder: "border border-amber-300",
    navBg: "bg-[#FFEDD5]",
    navBorder: "border-amber-200",
    titleColor: "text-amber-800",
    itemText: "text-amber-950",
    itemHover: "hover:bg-amber-200/70 hover:text-amber-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-amber-900 font-bold",
    itemActiveBorder: "border-l-4 border-amber-500 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-amber-200",
    summarySubBg: "bg-amber-50/80",
    summarySubBorder: "border-amber-200/60",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-amber-200",
    profileTextColor: "text-amber-950",
    profileSubTextColor: "text-amber-700",
    isLight: true
  },
  {
    id: "navy",
    name: "Xanh Navy Tinh Tế (Royal Navy)",
    dotBg: "#BFDBFE",
    dotBorder: "border border-blue-300",
    navBg: "bg-[#DBEAFE]",
    navBorder: "border-blue-200",
    titleColor: "text-blue-800",
    itemText: "text-blue-950",
    itemHover: "hover:bg-blue-200/70 hover:text-blue-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-blue-800 font-bold",
    itemActiveBorder: "border-l-4 border-blue-600 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-blue-200",
    summarySubBg: "bg-blue-50/80",
    summarySubBorder: "border-blue-200/60",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-blue-200",
    profileTextColor: "text-blue-950",
    profileSubTextColor: "text-blue-600",
    isLight: true
  },
  {
    id: "indigo",
    name: "Xanh Chàm (Deep Indigo)",
    dotBg: "#C7D2FE",
    dotBorder: "border border-indigo-300",
    navBg: "bg-[#E0E7FF]",
    navBorder: "border-indigo-200",
    titleColor: "text-indigo-800",
    itemText: "text-indigo-950",
    itemHover: "hover:bg-indigo-200/70 hover:text-indigo-950",
    itemActiveBg: "bg-white",
    itemActiveText: "text-indigo-800 font-bold",
    itemActiveBorder: "border-l-4 border-indigo-600 shadow-xs",
    summaryCardBg: "bg-white/90",
    summaryCardBorder: "border-indigo-200",
    summarySubBg: "bg-indigo-50/80",
    summarySubBorder: "border-indigo-200/60",
    profileCardBg: "bg-white/90",
    profileCardBorder: "border-indigo-200",
    profileTextColor: "text-indigo-950",
    profileSubTextColor: "text-indigo-600",
    isLight: true
  }
];

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
  showMobilePreview = false,

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
  onEditReport,
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
  onEditForumReply,
  onDeleteForumReply,
  onLikeForumReply,
  onUpdateForumTopicStatus,
  onToggleForumTopicPin,
  onEditForumTopic,
  onUpdateTopicInvitedUsers,
  onDeleteForumTopic,

  // Error Catalog props
  errorCatalog = [],
  onAddErrorCatalogItem,
  onUpdateErrorCatalogItem,
  onDeleteErrorCatalogItem,

  isQcFeatureEnabled = true,
  onToggleQcFeature,

  // Knowledge Base props
  knowledgeDocs = [],
  onAddKnowledgeDoc,
  onUpdateKnowledgeDoc,
  onDeleteKnowledgeDoc,

  // Festive Banner
  festiveBannerConfig,
  onUpdateFestiveBannerConfig
}: DashboardDesktopProps) {
  const [activeTab, setActiveTab] = useState<
    "PHÊ_DUYỆT" | "MÃ_HÓA" | "THỐNG_KÊ" | "DỮ_LIỆU" | "FORM_CAPA" | "THỬ_NGHIỆM" | "QUY_CHẾ" | "CÁ_NHÂN" | "THÔNG_BÁO" | "TRAO_ĐỔI" | "ĐỀ_XUẤT" | "QUOTA_CLOUD"
  >(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("print") === "true" || urlParams.get("tab") === "capa" || urlParams.get("reportId")) {
      return "FORM_CAPA";
    }
    return "DỮ_LIỆU";
  });

  const [sidebarThemeId, setSidebarThemeId] = useState<string>(() => {
    try {
      return localStorage.getItem("tanphu_desktop_sidebar_theme") || "navy";
    } catch {
      return "navy";
    }
  });

  const handleSelectSidebarTheme = (themeId: string) => {
    setSidebarThemeId(themeId);
    try {
      localStorage.setItem("tanphu_desktop_sidebar_theme", themeId);
    } catch (e) {
      console.warn("Could not save sidebar theme", e);
    }
  };

  const currentSidebarTheme = useMemo(() => {
    return SIDEBAR_THEMES.find((t) => t.id === sidebarThemeId) || SIDEBAR_THEMES[7]; // default to navy
  }, [sidebarThemeId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("print") === "true" || urlParams.get("tab") === "capa" || urlParams.get("reportId")) {
      setActiveTab("FORM_CAPA");
    }
  }, []);
  const [statsSubTab, setStatsSubTab] = useState<"NHAN_SU" | "CHAT_LUONG" | "TIEN_DO" | "HUY_HIEU">(() => {
    return currentUser?.role === UserRole.ADMIN ? "NHAN_SU" : "CHAT_LUONG";
  });
  const [maHoaSubTab, setMaHoaSubTab] = useState<"SO_DO" | "MA_LOI">("SO_DO");
  const [desktopPreviewImage, setDesktopPreviewImage] = useState<string | null>(null);
  
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
  const [isBackupCollapsed, setIsBackupCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("tanphu_desktop_backup_collapsed_v2");
      if (saved !== null) {
        return saved === "true";
      }
      return true;
    } catch {
      return true;
    }
  });

  const toggleBackupCollapsed = () => {
    setIsBackupCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("tanphu_desktop_backup_collapsed_v2", String(next));
      } catch (e) {
        console.warn("Could not save backup collapsed state", e);
      }
      return next;
    });
  };

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
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<ForumTopicCategory>("Góp ý chức năng");
  const [newTopicReportId, setNewTopicReportId] = useState<string>("");
  const [newTopicInvitedUserIds, setNewTopicInvitedUserIds] = useState<string[]>([]);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [forumReplyMessage, setForumReplyMessage] = useState("");
  const [forumSearchQuery, setForumSearchQuery] = useState("");
  const [forumCategoryFilter, setForumCategoryFilter] = useState<string>("ALL");

  // Emergency Discussion Modal states
  const [emergencyDiscussionReport, setEmergencyDiscussionReport] = useState<QualityReport | null>(null);
  const [emergencyTitle, setEmergencyTitle] = useState<string>("");
  const [emergencyDesc, setEmergencyDesc] = useState<string>("");
  const [emergencyCategory, setEmergencyCategory] = useState<ForumTopicCategory>("Thảo luận KPH");
  const [emergencyInvitedUserIds, setEmergencyInvitedUserIds] = useState<string[]>([]);
  const [invitedSearchQuery, setInvitedSearchQuery] = useState<string>("");

  // 1:1 Direct Chat & Online states
  const [forumSubTab, setForumSubTab] = useState<"TOPICS" | "INBOX">("TOPICS");
  const [directFilterTab, setDirectFilterTab] = useState<"INBOX" | "ONLINE" | "ALL">("INBOX");
  const [directSearchTerm, setDirectSearchTerm] = useState("");
  const [activeDirectChatUser, setActiveDirectChatUser] = useState<User | null>(null);
  const [directMessageInput, setDirectMessageInput] = useState("");
  const [confirmDeletePartnerUserDesktop, setConfirmDeletePartnerUserDesktop] = useState<User | null>(null);
  const directChatScrollRefDesktop = useRef<HTMLDivElement | null>(null);
  const directMessageInputRefDesktop = useRef<HTMLInputElement | null>(null);

  const [directMessages, setDirectMessages] = useState<DirectMessageItem[]>(() => {
    try {
      const saved = safeGetItem("4m1e1i_direct_messages_v1");
      if (saved) {
        const parsed: DirectMessageItem[] = JSON.parse(saved);
        return parsed.filter(m => !m.id?.startsWith("dm-reply-") && !m.content?.includes("Dạ em chào anh/chị"));
      }
    } catch {}
    return [
      {
        id: "dm-1",
        senderId: "USR-ADMIN",
        senderName: "BAN QUẢN TRỊ (ADMIN)",
        receiverId: "USR-001",
        receiverName: "MAI VY",
        content: "Chào bạn, tiến độ kiểm tra lô hàng KPH thế nào rồi?",
        timestamp: "25/07/26 12:08",
        createdAt: Date.now() - 432000000
      }
    ];
  });

  useEffect(() => {
    try {
      safeSetItem("4m1e1i_direct_messages_v1", JSON.stringify(directMessages));
    } catch {}
  }, [directMessages]);

  useEffect(() => {
    if (!db) return;
    try {
      const unsubscribe = onSnapshot(
        collection(db, COLLECTIONS.DIRECT_MESSAGES),
        (snapshot) => {
          const list: DirectMessageItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as DirectMessageItem;
            if (data && data.id) {
              list.push(data);
            }
          });
          if (list.length > 0) {
            setDirectMessages(list);
          }
        },
        (err) => {
          console.warn("[Firestore] Desktop direct_messages realtime sync error:", err);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("[Firestore] Failed to subscribe direct_messages:", e);
    }
  }, []);

  const [readDirectMsgIds, setReadDirectMsgIds] = useState<string[]>(() => {
    try {
      const saved = safeGetItem("4m1e1i_read_direct_msg_ids_v1");
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return parsed.filter((id) => typeof id === "string" && id.includes("::"));
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      safeSetItem("4m1e1i_read_direct_msg_ids_v1", JSON.stringify(readDirectMsgIds));
    } catch {}
  }, [readDirectMsgIds]);

  const getUserKey = useCallback((u: User | null | undefined): string => {
    if (!u) return "GUEST";
    const isUserAdmin = u.role === UserRole.ADMIN || u.id === "USR-ADMIN" || u.fullName?.toUpperCase().includes("ADMIN");
    if (isUserAdmin) return "USR-ADMIN";
    return u.id || u.fullName || "GUEST";
  }, []);

  const isMsgReadByUser = useCallback((msgId: string, u: User | null | undefined): boolean => {
    if (!u) return true;
    const userKey = getUserKey(u);
    return readDirectMsgIds.includes(`${userKey}::${msgId}`);
  }, [readDirectMsgIds, getUserKey]);

  const markMsgAsReadForUser = useCallback((msgIds: string[], u: User | null | undefined) => {
    if (!u || msgIds.length === 0) return;
    const userKey = getUserKey(u);
    setReadDirectMsgIds((prev) => {
      const newKeys = msgIds.map((id) => `${userKey}::${id}`);
      const newSet = new Set([...prev, ...newKeys]);
      return Array.from(newSet);
    });
  }, [getUserKey]);

  const isMsgFromUser = useCallback((m: DirectMessageItem, u: User | null | undefined): boolean => {
    return isCurrentUserSender(u, undefined, m.senderName, m.senderId);
  }, []);

  const isMsgToUser = useCallback((m: DirectMessageItem, u: User | null | undefined): boolean => {
    return isCurrentUserSender(u, undefined, m.receiverName, m.receiverId);
  }, []);

  const unreadDirectMessagesCount = useMemo(() => {
    return directMessages.filter((m) => {
      const isToMe = isMsgToUser(m, currentUser);
      const isFromMe = isMsgFromUser(m, currentUser);
      return isToMe && !isFromMe && !isMsgReadByUser(m.id, currentUser);
    }).length;
  }, [directMessages, currentUser, isMsgToUser, isMsgFromUser, isMsgReadByUser]);

  const markPartnerMessagesAsRead = useCallback((partner: User) => {
    const partnerMsgIds = directMessages
      .filter((m) => isMsgFromUser(m, partner) && isMsgToUser(m, currentUser))
      .map((m) => m.id);
    markMsgAsReadForUser(partnerMsgIds, currentUser);
  }, [directMessages, currentUser, isMsgFromUser, isMsgToUser, markMsgAsReadForUser]);

  useEffect(() => {
    if (activeTab === "TRAO_ĐỔI" && forumSubTab === "INBOX" && activeDirectChatUser) {
      markPartnerMessagesAsRead(activeDirectChatUser);
    }
  }, [activeTab, forumSubTab, activeDirectChatUser, directMessages, markPartnerMessagesAsRead]);

  const handleSendDirectMessage = useCallback((msgText?: string, attachedImagesList?: AttachedImage[]) => {
    const content = (msgText !== undefined ? msgText : directMessageInput).trim();
    if (!activeDirectChatUser || (!content && (!attachedImagesList || attachedImagesList.length === 0)) || !currentUser) return;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${day}/${month}/${year} ${hours}:${mins}`;

    const senderName = (currentUser.role === UserRole.ADMIN || currentUser.fullName?.toUpperCase().includes("ADMIN"))
      ? "BAN QUẢN TRỊ (ADMIN)"
      : currentUser.fullName;

    const newMsg: DirectMessageItem = {
      id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: currentUser.id || "USR-ADMIN",
      senderName: senderName,
      senderRole: currentUser.role,
      receiverId: activeDirectChatUser.id,
      receiverName: activeDirectChatUser.fullName,
      content: content,
      timestamp: formattedTime,
      createdAt: Date.now(),
      attachments: attachedImagesList && attachedImagesList.length > 0 ? attachedImagesList.map(img => ({
        type: "image",
        url: img.url,
        name: img.name,
        sizeKb: img.sizeKb
      })) : undefined
    };

    setDirectMessages(prev => [...prev, newMsg]);
    saveDocument(COLLECTIONS.DIRECT_MESSAGES, newMsg.id, newMsg);
    markMsgAsReadForUser([newMsg.id], currentUser);
    setDirectMessageInput("");

    setTimeout(() => {
      if (directChatScrollRefDesktop.current) {
        directChatScrollRefDesktop.current.scrollTop = directChatScrollRefDesktop.current.scrollHeight;
      }
      directMessageInputRefDesktop.current?.focus();
    }, 50);
  }, [activeDirectChatUser, directMessageInput, currentUser, markMsgAsReadForUser]);

  const handleClearDirectMessages = useCallback(() => {
    if (!activeDirectChatUser || !currentUser) return;
    directMessages.forEach(m => {
      if ((isMsgFromUser(m, currentUser) && isMsgToUser(m, activeDirectChatUser)) ||
          (isMsgFromUser(m, activeDirectChatUser) && isMsgToUser(m, currentUser))) {
        deleteDocument(COLLECTIONS.DIRECT_MESSAGES, m.id);
      }
    });
    setDirectMessages(prev => prev.filter(m => 
      !(
        (isMsgFromUser(m, currentUser) && isMsgToUser(m, activeDirectChatUser)) ||
        (isMsgFromUser(m, activeDirectChatUser) && isMsgToUser(m, currentUser))
      )
    ));
  }, [activeDirectChatUser, currentUser, directMessages, isMsgFromUser, isMsgToUser]);

  const handleDeleteConversation = useCallback((partner: User) => {
    if (!currentUser) return;
    const partnerNameClean = partner.fullName?.trim().toLowerCase();
    
    directMessages.forEach(m => {
      const isFromMe = isMsgFromUser(m, currentUser);
      const isToMe = isMsgToUser(m, currentUser);
      const isFromPartner = isMsgFromUser(m, partner) || (partnerNameClean && m.senderName?.trim().toLowerCase() === partnerNameClean);
      const isToPartner = isMsgToUser(m, partner) || (partnerNameClean && m.receiverName?.trim().toLowerCase() === partnerNameClean);

      const isBetweenUs = (isFromMe && isToPartner) || (isFromPartner && isToMe);
      if (isBetweenUs) {
        deleteDocument(COLLECTIONS.DIRECT_MESSAGES, m.id);
      }
    });

    setDirectMessages(prev => prev.filter(m => {
      const isFromMe = isMsgFromUser(m, currentUser);
      const isToMe = isMsgToUser(m, currentUser);
      const isFromPartner = isMsgFromUser(m, partner) || (partnerNameClean && m.senderName?.trim().toLowerCase() === partnerNameClean);
      const isToPartner = isMsgToUser(m, partner) || (partnerNameClean && m.receiverName?.trim().toLowerCase() === partnerNameClean);

      const isBetweenUs = (isFromMe && isToPartner) || (isFromPartner && isToMe);
      return !isBetweenUs;
    }));

    if (activeDirectChatUser && (
      (partner.id && activeDirectChatUser.id === partner.id) ||
      (partner.fullName && activeDirectChatUser.fullName?.toLowerCase() === partner.fullName.toLowerCase())
    )) {
      setActiveDirectChatUser(null);
    }
  }, [currentUser, activeDirectChatUser, directMessages, isMsgFromUser, isMsgToUser]);

  const handleOpenDirectChatWithSender = useCallback((reply: ForumReply, resolvedSender: any) => {
    const partnerUser = users.find(
      (u) =>
        (reply.senderPhone && (u.phone === reply.senderPhone || u.id === reply.senderPhone)) ||
        (reply.senderName && u.fullName?.toLowerCase() === reply.senderName?.toLowerCase()) ||
        (resolvedSender.phone && (u.phone === resolvedSender.phone || u.id === resolvedSender.phone)) ||
        (resolvedSender.fullName && u.fullName?.toLowerCase() === resolvedSender.fullName?.toLowerCase())
    );
    if (partnerUser) {
      setActiveDirectChatUser(partnerUser);
    } else {
      setActiveDirectChatUser({
        id: reply.senderPhone || `usr-${Date.now()}`,
        fullName: resolvedSender.fullName || reply.senderName || "Nhân viên",
        phone: reply.senderPhone || resolvedSender.phone || "",
        department: resolvedSender.department || "Nhà máy",
        branch: "Tân Phú",
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        avatar: (resolvedSender as any)?.avatar || undefined
      });
    }
    setForumSubTab("INBOX");
  }, [users]);

  const handleOpenDirectChatByName = useCallback((target: string | User | { fullName: string; phone?: string; id?: string }) => {
    if (!target) return;
    if (typeof target === "object") {
      const existingUser = users.find(
        (u) =>
          (target.id && u.id === target.id) ||
          (target.fullName && u.fullName && u.fullName.toLowerCase() === target.fullName.toLowerCase()) ||
          (target.phone && u.phone === target.phone)
      );
      if (existingUser) {
        setActiveDirectChatUser(existingUser);
      } else {
        setActiveDirectChatUser({
          id: target.id || `usr-${Date.now()}`,
          fullName: target.fullName || "Đồng nghiệp",
          phone: target.phone || "",
          department: (target as any).department || "Nhà máy",
          branch: (target as any).branch || "Tân Phú",
          role: (target as any).role || UserRole.STAFF,
          status: (target as any).status || UserStatus.ACTIVE
        });
      }
      setForumSubTab("INBOX");
      return;
    }

    const rawName = target;
    const cleanName = rawName.replace(/^@/, "").trim().toLowerCase();
    const partnerUser = users.find(
      (u) =>
        (u.fullName && u.fullName.toLowerCase() === cleanName) ||
        (u.fullName && u.fullName.toLowerCase().includes(cleanName)) ||
        (u.fullName && cleanName.includes(u.fullName.toLowerCase())) ||
        (u.id && u.id.toLowerCase() === cleanName) ||
        (u.phone && u.phone === cleanName)
    );

    if (partnerUser) {
      setActiveDirectChatUser(partnerUser);
    } else {
      const displayName = rawName.replace(/^@/, "").trim();
      setActiveDirectChatUser({
        id: `usr-${Date.now()}`,
        fullName: displayName,
        phone: "",
        department: "Nhà máy",
        branch: "Tân Phú",
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE
      });
    }
    setForumSubTab("INBOX");
  }, [users]);

  // Edit & Delete topic state for Desktop
  const [editingDesktopTopic, setEditingDesktopTopic] = useState<ForumTopic | null>(null);
  const [editDesktopTopicTitle, setEditDesktopTopicTitle] = useState("");
  const [editDesktopTopicDesc, setEditDesktopTopicDesc] = useState("");
  const [editDesktopTopicCategory, setEditDesktopTopicCategory] = useState<ForumTopicCategory>("Góp ý chức năng");
  const [deletingDesktopTopic, setDeletingDesktopTopic] = useState<ForumTopic | null>(null);

  // Desktop Forum Chat enhancement states
  const [isDesktopDescExpanded, setIsDesktopDescExpanded] = useState(false);
  const [desktopReplyingTo, setDesktopReplyingTo] = useState<{ id: string; senderName: string; message: string } | null>(null);
  const [editingDesktopReplyId, setEditingDesktopReplyId] = useState<string | null>(null);
  const [editingDesktopReplyText, setEditingDesktopReplyText] = useState("");
  const [activeDesktopReplyId, setActiveDesktopReplyId] = useState<string | null>(null);

  // Desktop Task / Action Assignment states
  const [desktopConvertModalReply, setDesktopConvertModalReply] = useState<ForumReply | null>(null);
  const [desktopActionTypeChoice, setDesktopActionTypeChoice] = useState<"DIRECTIVE" | "TASK">("DIRECTIVE");
  const [desktopTaskAssignedUser, setDesktopTaskAssignedUser] = useState<User | null>(null);
  const [desktopTaskDeadline, setDesktopTaskDeadline] = useState("");
  const [desktopTaskNote, setDesktopTaskNote] = useState("");

  const [desktopEditingActionReply, setDesktopEditingActionReply] = useState<ForumReply | null>(null);
  const [desktopEditActionType, setDesktopEditActionType] = useState<"DIRECTIVE" | "TASK">("DIRECTIVE");
  const [desktopEditTaskAssignedUser, setDesktopEditTaskAssignedUser] = useState<User | null>(null);
  const [desktopEditTaskDeadline, setDesktopEditTaskDeadline] = useState("");
  const [desktopEditTaskNote, setDesktopEditTaskNote] = useState("");
  const [desktopEditTaskStatus, setDesktopEditTaskStatus] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [desktopDeletingActionReplyId, setDesktopDeletingActionReplyId] = useState<string | null>(null);

  // Staff picker modal state
  const [showDesktopStaffPickerModal, setShowDesktopStaffPickerModal] = useState(false);
  const [desktopStaffPickerSearchQuery, setDesktopStaffPickerSearchQuery] = useState("");
  const [desktopStaffPickerTarget, setDesktopStaffPickerTarget] = useState<"CONVERT" | "EDIT">("CONVERT");

  // Actions catalog modal state
  const [showDesktopActionsCatalogModal, setShowDesktopActionsCatalogModal] = useState(false);
  const [desktopActionsCatalogScope, setDesktopActionsCatalogScope] = useState<"CURRENT_TOPIC" | "ALL_TOPICS">("CURRENT_TOPIC");
  const [desktopActionsCatalogTypeFilter, setDesktopActionsCatalogTypeFilter] = useState<"ALL" | "DIRECTIVE" | "TASK">("ALL");
  const [desktopActionsCatalogStatusFilter, setDesktopActionsCatalogStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [desktopActionsCatalogOnlyMine, setDesktopActionsCatalogOnlyMine] = useState(false);
  const [desktopActionsCatalogSearchQuery, setDesktopActionsCatalogSearchQuery] = useState("");

  // AI Summary modal state
  const [showDesktopAiSummaryModal, setShowDesktopAiSummaryModal] = useState(false);
  const [desktopIsAiSummarizing, setDesktopIsAiSummarizing] = useState(false);
  const [desktopCopiedSummaryToast, setDesktopCopiedSummaryToast] = useState(false);
  const [desktopLocalPinnedAiSummary, setDesktopLocalPinnedAiSummary] = useState(false);
  const [desktopAiSummariesMap, setDesktopAiSummariesMap] = useState<
    Record<string, { keyPoints: string[]; consensus: string; directivesAndTasks: string[]; updatedAt: string }>
  >({});

  // Topic Members modal state
  const [showDesktopMembersModal, setShowDesktopMembersModal] = useState(false);
  const [desktopMemberSearchQuery, setDesktopMemberSearchQuery] = useState("");
  const [desktopMemberModalTab, setDesktopMemberModalTab] = useState<"MEMBERS" | "ADD">("MEMBERS");

  // Header status dropdown
  const [showDesktopStatusDropdown, setShowDesktopStatusDropdown] = useState(false);

  // Handler: Save Convert Action (Chuyển thành Chỉ đạo / Task)
  const handleSaveConvertActionDesktop = () => {
    if (!desktopConvertModalReply) return;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = String(now.getFullYear()).slice(-2);
    const timeStr = `${d}/${m}/${y}`;

    const newActionData = {
      assignedToName: desktopActionTypeChoice === "TASK" ? (desktopTaskAssignedUser?.fullName || "") : undefined,
      assignedToId: desktopActionTypeChoice === "TASK" ? (desktopTaskAssignedUser?.id || desktopTaskAssignedUser?.phone || "") : undefined,
      deadline: desktopActionTypeChoice === "TASK" ? (desktopTaskDeadline.trim() || timeStr) : undefined,
      status: (desktopActionTypeChoice === "TASK" ? "PENDING" : undefined) as "PENDING" | "COMPLETED" | undefined,
      note: desktopTaskNote.trim() || undefined,
      createdByName: currentUser?.fullName || currentUser?.id || "Ban Quản Trị",
      createdAt: timeStr
    };

    onEditForumReply?.(desktopConvertModalReply.id, {
      actionType: desktopActionTypeChoice,
      actionData: newActionData
    });

    if (onShowToast) {
      onShowToast(
        desktopActionTypeChoice === "DIRECTIVE"
          ? "Đã chuyển thành Chỉ đạo hành động thành công!"
          : "Đã phân công Đầu việc (Task) thành công!",
        "success"
      );
    }

    setDesktopConvertModalReply(null);
    setDesktopTaskAssignedUser(null);
    setDesktopTaskDeadline("");
    setDesktopTaskNote("");
  };

  // Handler: Save Edit Action (Cập nhật Chỉ đạo / Task)
  const handleSaveEditActionDesktop = () => {
    if (!desktopEditingActionReply) return;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = String(now.getFullYear()).slice(-2);
    const timeStr = `${d}/${m}/${y}`;

    const updatedActionData = {
      ...(desktopEditingActionReply.actionData || {}),
      assignedToName: desktopEditActionType === "TASK" ? (desktopEditTaskAssignedUser?.fullName || "") : undefined,
      assignedToId: desktopEditActionType === "TASK" ? (desktopEditTaskAssignedUser?.id || desktopEditTaskAssignedUser?.phone || "") : undefined,
      deadline: desktopEditActionType === "TASK" ? (desktopEditTaskDeadline.trim() || timeStr) : undefined,
      status: (desktopEditActionType === "TASK" ? desktopEditTaskStatus : undefined) as "PENDING" | "COMPLETED" | undefined,
      note: desktopEditTaskNote.trim() || undefined,
    };

    onEditForumReply?.(desktopEditingActionReply.id, {
      actionType: desktopEditActionType,
      actionData: updatedActionData
    });

    if (onShowToast) {
      onShowToast("Đã cập nhật Chỉ đạo / Task thành công!", "success");
    }

    setDesktopEditingActionReply(null);
    setDesktopEditTaskAssignedUser(null);
    setDesktopEditTaskDeadline("");
    setDesktopEditTaskNote("");
  };

  // Handler: Remove Action (Bỏ chỉ đạo / task)
  const handleRemoveActionDesktop = (replyId: string) => {
    onEditForumReply?.(replyId, {
      actionType: undefined,
      actionData: undefined
    });
    if (onShowToast) {
      onShowToast("Đã gỡ bỏ Chỉ đạo / Task khỏi tin nhắn.", "info");
    }
  };

  // Handler: Toggle Task Status (Đang làm <-> Hoàn thành)
  const handleToggleTaskStatusDesktop = (replyId: string) => {
    const targetReply = replies.find(r => r.id === replyId);
    if (!targetReply || !targetReply.actionData) return;
    const currentStatus = targetReply.actionData.status;
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";

    onEditForumReply?.(replyId, {
      actionData: {
        ...targetReply.actionData,
        status: newStatus
      }
    });

    if (onShowToast) {
      onShowToast(
        newStatus === "COMPLETED"
          ? "Đã đánh dấu Hoàn thành task! 🎉"
          : "Đã chuyển trạng thái sang Đang thực hiện.",
        "success"
      );
    }
  };

  const handleOpenEmergencyDiscussionModal = (report: QualityReport) => {
    setEmergencyDiscussionReport(report);
    const codePrefix = report.reportCode ? `[${report.reportCode}] ` : `[${report.reportType || "KPH"}] `;
    let fullText = (report.content || "").replace(/\s+/g, " ").trim();
    if (report.notes && report.notes.trim()) {
      const notesClean = report.notes.replace(/\s+/g, " ").trim();
      if (!fullText.toLowerCase().includes(notesClean.toLowerCase())) {
        fullText = `${fullText} - ${notesClean}`;
      }
    }
    
    // Smart summary
    const maxChars = 145;
    let titleContent = fullText;
    if (fullText.length > maxChars) {
      const truncated = fullText.slice(0, maxChars);
      const lastSpace = truncated.lastIndexOf(" ");
      const wordBoundaryText = lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated;
      titleContent = `${wordBoundaryText.replace(/[,;:\-–—\.\s]+$/, "")}...`;
    }

    setEmergencyTitle(`🔥 ${codePrefix}${titleContent}`);
    
    const desc = `THẢO LUẬN KHẨN CẤP VỀ SỰ CỐ / KPH:
• Mã bản tin: ${report.reportCode || report.id}
• Phân loại: ${report.category} (${report.reportType || "KPH"})
• Nhà máy / Bộ phận: ${report.factory} (${report.uploaderDepartment})
• Người tạo bản tin: ${report.uploaderName}
• Thời gian ghi nhận: ${report.timestamp}
• Nội dung sự cố: ${report.content}
${report.notes ? `• Ghi chú: ${report.notes}` : ""}`;

    setEmergencyDesc(desc);
    setEmergencyCategory("Thảo luận KPH");
    
    // Auto pre-select default participants: Topic creator, Report uploader, and Tagged people in report
    const repDefaults = getDefaultMembersForReport(report, users, currentUser);
    setEmergencyInvitedUserIds(repDefaults.memberIds);
  };

  const handleCreateEmergencyDiscussion = () => {
    if (!emergencyDiscussionReport || !emergencyTitle.trim()) return;
    
    if (onAddForumTopic) {
      const createdId = onAddForumTopic(
        emergencyTitle.trim(),
        emergencyDesc.trim() || emergencyTitle.trim(),
        emergencyCategory,
        emergencyDiscussionReport.id,
        emergencyInvitedUserIds
      );
      
      if (createdId) {
        setSelectedTopicId(createdId);
      }
    }

    setEmergencyDiscussionReport(null);
    setEmergencyTitle("");
    setEmergencyDesc("");
    setEmergencyInvitedUserIds([]);
    setActiveTab("TRAO_ĐỔI");
    setForumSubTab("TOPICS");
  };

  // Helper: Check if user is Topic Leader (Creator of discussion group)
  const checkIsTopicLeader = (topic?: ForumTopic | null, user?: User | null): boolean => {
    if (!topic || !user) return false;
    return Boolean(
      (topic.authorPhone && (user.phone === topic.authorPhone || user.id === topic.authorPhone)) ||
      (topic.author && user.fullName?.toLowerCase() === topic.author?.toLowerCase()) ||
      (topic.authorId && (user.id === topic.authorId || user.phone === topic.authorId)) ||
      (topic.creatorPhone && (user.phone === topic.creatorPhone || user.id === topic.creatorPhone)) ||
      (topic.creatorName && user.fullName?.toLowerCase() === topic.creatorName?.toLowerCase())
    );
  };

  // Handler: Remove user from Topic (Quyền Trưởng nhóm / Admin)
  const handleRemoveUserFromTopicDesktop = (userToRemove: User, currentTopic: ForumTopic) => {
    const currentInvited = currentTopic.invitedUserIds || [];
    const uId = userToRemove.id || "";
    const uPhone = userToRemove.phone || "";
    const uName = userToRemove.fullName || "";

    const newInvited = currentInvited.filter(id => id !== uId && id !== uPhone && id !== uName);
    onUpdateTopicInvitedUsers?.(currentTopic.id, newInvited);
    if (onShowToast) {
      onShowToast(`Đã mời ${userToRemove.fullName} rời khỏi nhóm thảo luận.`, "info");
    }
  };

  // Handler: Toggle Topic Participant Invite
  const handleToggleUserInviteDesktop = (userToToggle: User, currentTopic: ForumTopic) => {
    const currentInvited = currentTopic.invitedUserIds || [];
    const userIdOrPhone = userToToggle.id || userToToggle.phone || "";
    if (!userIdOrPhone) return;

    let newInvited: string[];
    if (currentInvited.includes(userIdOrPhone)) {
      newInvited = currentInvited.filter(id => id !== userIdOrPhone);
    } else {
      newInvited = [...currentInvited, userIdOrPhone];
    }

    onUpdateTopicInvitedUsers?.(currentTopic.id, newInvited);
  };

  // Helper function to capitalize words
  const capitalizeWords = (str: string): string => {
    if (!str) return "";
    return formatNameCapitalized(str);
  };

  // Helper function to render @mentions in chat bubbles
  const renderMentionText = (text: string | undefined | null, isDarkBg: boolean = false): React.ReactNode => {
    if (!text || typeof text !== "string" || !text.includes("@")) {
      return text || "";
    }

    const candidatesSet = new Set<string>();
    if (users && users.length > 0) {
      users.forEach((u) => {
        if (u.fullName && u.fullName.trim()) {
          candidatesSet.add(u.fullName.trim());
          const parts = u.fullName.trim().split(/\s+/);
          if (parts.length >= 2) {
            candidatesSet.add(parts.slice(-2).join(" "));
          }
          if (parts[parts.length - 1].length >= 2) {
            candidatesSet.add(parts[parts.length - 1]);
          }
        }
        if (u.department && u.department.trim()) {
          candidatesSet.add(u.department.trim());
          const cleanDept = u.department.replace(/^Phòng\s+/i, "").trim();
          if (cleanDept.length >= 2) candidatesSet.add(cleanDept);
        }
        if (u.id && u.id.trim()) candidatesSet.add(u.id.trim());
      });
    }

    candidatesSet.add("Tất cả");
    candidatesSet.add("All");
    candidatesSet.add("Mọi người");
    candidatesSet.add("Ban Giám Đốc");
    candidatesSet.add("QLCL");
    candidatesSet.add("QC");
    candidatesSet.add("R&D");

    const candidates = Array.from(candidatesSet).sort((a, b) => b.length - a.length);

    type Range = { start: number; end: number; matchText: string };
    const ranges: Range[] = [];
    const lowerText = text.toLowerCase();

    for (const cand of candidates) {
      if (!cand) continue;
      const searchTarget = `@${cand.toLowerCase()}`;
      let pos = 0;
      while ((pos = lowerText.indexOf(searchTarget, pos)) !== -1) {
        const end = pos + searchTarget.length;
        const overlaps = ranges.some((r) => !(end <= r.start || pos >= r.end));
        if (!overlaps) {
          ranges.push({
            start: pos,
            end: end,
            matchText: text.substring(pos, end),
          });
        }
        pos = end;
      }
    }

    const genericRegex = /@([\p{L}\w\-_]+(?:\s+[\p{L}\w\-_]+)*)/gu;
    let match: RegExpExecArray | null;
    while ((match = genericRegex.exec(text)) !== null) {
      const namePart = match[1];
      let cleanName = namePart.split(/[,.:;!?\n\r]/)[0].trim();
      const stopWords = ["dạ", "nhưng", "em", "anh", "chị", "của", "với", "cho", "nhờ", "đã", "rồi", "và", "khi", "là", "được", "này", "ạ", "ơi"];
      const words = cleanName.split(/\s+/);
      const filteredWords: string[] = [];
      for (const w of words) {
        if (stopWords.includes(w.toLowerCase()) && filteredWords.length > 0) {
          break;
        }
        filteredWords.push(w);
      }
      if (filteredWords.length > 0) {
        cleanName = filteredWords.join(" ");
        const finalTag = `@${cleanName}`;
        const pos = match.index;
        const end = pos + finalTag.length;
        const overlaps = ranges.some((r) => !(end <= r.start || pos >= r.end));
        if (!overlaps) {
          ranges.push({
            start: pos,
            end: end,
            matchText: text.substring(pos, end),
          });
        }
      }
    }

    if (ranges.length === 0) return text;

    ranges.sort((a, b) => a.start - b.start);

    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    ranges.forEach((r, idx) => {
      if (r.start > currentIndex) {
        elements.push(text.substring(currentIndex, r.start));
      }
      const rawTag = r.matchText;
      let displayTag = rawTag;
      if (rawTag.startsWith("@")) {
        displayTag = `@${capitalizeWords(rawTag.slice(1))}`;
      } else {
        displayTag = capitalizeWords(rawTag);
      }

      elements.push(
        <button
          key={`tag-${idx}`}
          type="button"
          translate="no"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDirectChatByName(displayTag);
          }}
          className={
            isDarkBg
              ? "notranslate text-sky-200 font-extrabold bg-blue-800/90 hover:bg-blue-700 px-1.5 py-0.5 rounded border border-blue-400/50 mx-0.5 inline-block text-[11px] shadow-2xs cursor-pointer transition-all hover:scale-105"
              : "notranslate text-blue-600 font-extrabold bg-blue-50 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-300 px-1.5 py-0.5 rounded border border-blue-200/80 mx-0.5 inline-block text-[11px] shadow-2xs cursor-pointer transition-all hover:scale-105"
          }
          title={`Bấm để mở hộp thoại chat 1:1 với ${displayTag}`}
        >
          {displayTag}
        </button>
      );
      currentIndex = r.end;
    });

    if (currentIndex < text.length) {
      elements.push(text.substring(currentIndex));
    }

    return <>{elements}</>;
  };

  // Helper to format topic title cleanly without mid-word cuts or redundant brackets
  const cleanDisplayTitle = (title: string, description?: string, report?: QualityReport | null): string => {
    if (!title) return "";
    let cleaned = title.replace(/^🔥\s*/, "");
    cleaned = cleaned.replace(/^\[[A-Za-z0-9_-]+\]\s*/i, "");
    cleaned = cleaned.replace(/^Thảo luận:\s*/gi, "");
    cleaned = cleaned.replace(/\bPHẢN H\.\.\.$/gi, "PHẢN HỒI...");
    cleaned = cleaned.replace(/\s+[A-Za-zÀ-ỹ]{1,2}\.\.\.$/gi, "...");

    if ((cleaned.endsWith("...") || cleaned.endsWith("…")) && cleaned.length < 110) {
      const sourceText = report?.content || description || "";
      if (sourceText) {
        const cleanSource = sourceText.replace(/\s+/g, " ").trim();
        const baseTitle = cleaned.replace(/[\.\s]+$/, "");
        const pureTitleText = baseTitle.replace(/^(🔥\s*)?(\[[A-Z0-9_-]+\]\s*)?/, "").trim();
        
        if (pureTitleText && cleanSource.toLowerCase().includes(pureTitleText.toLowerCase().slice(0, 15))) {
          let expandedText = cleanSource;
          if (report?.notes && report.notes.trim()) {
            const notesClean = report.notes.replace(/\s+/g, " ").trim();
            if (!expandedText.toLowerCase().includes(notesClean.toLowerCase())) {
              expandedText = `${expandedText} - ${notesClean}`;
            }
          }
          
          const maxChars = 145;
          if (expandedText.length > maxChars) {
            const truncated = expandedText.slice(0, maxChars);
            const lastSpace = truncated.lastIndexOf(" ");
            const wordBoundary = lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated;
            expandedText = `${wordBoundary.replace(/[,;:\-–—\.\s]+$/, "")}...`;
          }
          cleaned = expandedText;
        }
      }
    }

    return cleaned.trim() || title;
  };

  const getTopicReportCode = (topic: ForumTopic, report?: QualityReport): string | null => {
    if (report?.reportCode) return report.reportCode;
    if (topic.reportId) {
      const match = topic.reportId.match(/B\d+/i);
      if (match) return match[0].toUpperCase();
      return topic.reportId;
    }
    const matchInTitle = topic.title.match(/\[([A-Za-z0-9_-]+)\]/);
    if (matchInTitle) return matchInTitle[1];
    return null;
  };

  const parseKphDescription = (desc: string) => {
    if (!desc || !desc.includes("THẢO LUẬN KHẨN CẤP VỀ SỰ CỐ")) return null;
    const lines = desc.split("\n").map(l => l.trim()).filter(Boolean);
    const data: Record<string, string> = {};
    let currentKey = "";
    lines.forEach(line => {
      if (line.startsWith("• ")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > -1) {
          const key = line.slice(2, colonIdx).trim();
          const val = line.slice(colonIdx + 1).trim();
          currentKey = key;
          data[key] = val;
        }
      } else if (currentKey && data[currentKey]) {
        data[currentKey] += "\n" + line;
      }
    });
    return {
      reportCode: data["Mã bản tin"] || "",
      category: data["Phân loại"] || "",
      factoryDept: data["Nhà máy / Bộ phận"] || "",
      creator: data["Người tạo bản tin"] || "",
      timestamp: data["Thời gian ghi nhận"] || "",
      content: data["Nội dung sự cố"] || "",
      notes: data["Ghi chú"] || ""
    };
  };

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
  const [newDeptShortName, setNewDeptShortName] = useState("");
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
  const [editingDeptShortName, setEditingDeptShortName] = useState<string>("");
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
    return canUserDeleteReport(currentUser, report);
  };

  const isEditReportAllowed = (report: QualityReport): boolean => {
    return canUserEditReport(currentUser, report);
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

  const matchFactory = (factoryName?: string, filterKey?: string): boolean => {
    if (!filterKey || filterKey === "Tất cả") return true;
    if (!factoryName) return false;
    if (factoryName.trim().toLowerCase() === filterKey.trim().toLowerCase()) return true;
    return isSameBranchOrFactory(factoryName, filterKey);
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tanphu_desktop_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
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
  // Tab for personal broadcasts vs reports vs my tasks
  const [personalTab, setPersonalTab] = useState<"4M1E1I" | "MY_TASKS" | "SYSTEM">("4M1E1I");
  const [personalTaskScope, setPersonalTaskScope] = useState<"ALL" | "CREATED" | "ASSIGNED" | "RESOLVED">("ALL");
  const [personalTaskStatusFilter, setPersonalTaskStatusFilter] = useState<string>("ALL");
  const [personalTaskCategoryFilter, setPersonalTaskCategoryFilter] = useState<string>("ALL");
  const [personalTaskTypeFilter, setPersonalTaskTypeFilter] = useState<string>("ALL");
  const [personalTaskSearchTerm, setPersonalTaskSearchTerm] = useState<string>("");
  const [selectedPersonalTaskReport, setSelectedPersonalTaskReport] = useState<QualityReport | null>(null);

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
  const [logsFactories, setLogsFactories] = useState<string[]>([]);
  const [isLogsFactoryDropdownOpen, setIsLogsFactoryDropdownOpen] = useState(false);
  const logsFactoryDropdownRef = useRef<HTMLDivElement>(null);
  const [logsCategory, setLogsCategory] = useState("Tất cả");
  const [logsAbnormalOnly, setLogsAbnormalOnly] = useState(false);
  const [logsProcessStatusFilter, setLogsProcessStatusFilter] = useState<"ALL" | "UNACKNOWLEDGED" | "PROCESSING" | "RESOLVED">("ALL");
  const [logsOnlyTransferredFilter, setLogsOnlyTransferredFilter] = useState(false);
  const [logsOnlyTaggedFilter, setLogsOnlyTaggedFilter] = useState(false);
  const [logsReportTypeFilter, setLogsReportTypeFilter] = useState<"ALL" | "KPH" | "KPH_BN" | "KPH_NB" | "RRO" | "DSA">("ALL");

  // Transfer Company Modal state
  const [transferCompanyModalReport, setTransferCompanyModalReport] = useState<QualityReport | null>(null);
  const [transferTargetCompany, setTransferTargetCompany] = useState<"TPP" | "DNP" | "ALL">("DNP");
  const [transferCompanyNote, setTransferCompanyNote] = useState("");

  // Proposal filters state
  const [proposalSearch, setProposalSearch] = useState("");
  const [proposalFactories, setProposalFactories] = useState<string[]>([]);
  const [isProposalFactoryDropdownOpen, setIsProposalFactoryDropdownOpen] = useState(false);
  const proposalFactoryDropdownRef = useRef<HTMLDivElement>(null);
  const [proposalCategory, setProposalCategory] = useState("Tất cả");

  // Close custom branch dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (logsFactoryDropdownRef.current && !logsFactoryDropdownRef.current.contains(e.target as Node)) {
        setIsLogsFactoryDropdownOpen(false);
      }
      if (proposalFactoryDropdownRef.current && !proposalFactoryDropdownRef.current.contains(e.target as Node)) {
        setIsProposalFactoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // --- COMPANY SCOPING (SINGLE SOURCE OF TRUTH) ---
  const [adminScopePreference, setAdminScopePreference] = useState<CompanyScope>(() => {
    const saved = safeGetItem("4m1e1i_admin_scope_preference");
    return (saved === "TPP" || saved === "DNP" || saved === "ALL") ? (saved as CompanyScope) : "ALL";
  });

  const handleSetAdminScope = (scope: CompanyScope) => {
    setAdminScopePreference(scope);
    safeSetItem("4m1e1i_admin_scope_preference", scope);
  };

  const effectiveCompany = getEffectiveCompanyScope(currentUser, adminScopePreference, branches);
  const isSuperAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.id === "USR-ADMIN" || (currentUser?.role as string)?.toUpperCase().includes("ADMIN");

  // Scoped collections according to effective company scope
  const scopedReports = useMemo(() => {
    return reports.filter((r) => isReportInScope(r, effectiveCompany, branches));
  }, [reports, effectiveCompany, branches]);

  const scopedBranches = useMemo(() => {
    return branches.filter((b) => isBranchInScope(b, effectiveCompany));
  }, [branches, effectiveCompany]);

  const scopedUsers = useMemo(() => {
    return users.filter((u) => isUserInScope(u, effectiveCompany, branches));
  }, [users, effectiveCompany, branches]);

  const scopedTopics = useMemo(() => {
    return topics.filter((t) => {
      if (!isTopicInScope(t, effectiveCompany, branches)) return false;
      return isUserAllowedToViewTopic(t, currentUser, replies, reports);
    });
  }, [topics, effectiveCompany, branches, currentUser, replies, reports]);

  useEffect(() => {
    if (scopedTopics.length > 0) {
      if (!selectedTopicId || !scopedTopics.some((t) => t.id === selectedTopicId)) {
        setSelectedTopicId(scopedTopics[0].id);
      }
    } else {
      setSelectedTopicId(null);
    }
  }, [scopedTopics, selectedTopicId]);

  // Helper to determine company ownership & target transfer
  const getReportCompanyOwnership = useCallback((r: QualityReport) => {
    const isDnpFactory = !!(r.factory && (r.factory.includes("DNP") || r.factory.includes("BBM") || r.factory.includes("BBC")));
    const isTargetDnp = r.targetCompany === "DNP" || (r.assignedCompany && r.assignedCompany.includes("DNP"));
    const isTargetTpp = r.targetCompany === "TPP" || (r.assignedCompany && r.assignedCompany.includes("TPP"));
    const isTargetAll = r.targetCompany === "ALL" || r.assignedCompany === "ALL";

    const belongsToDnp = isDnpFactory || !!isTargetDnp || !!isTargetAll;
    const belongsToTpp = !isDnpFactory || !!isTargetTpp || !!isTargetAll;
    const isTransferred = !!r.targetCompany || !!r.assignedCompany || (r.transferHistory && r.transferHistory.length > 0);

    return { isDnpFactory, belongsToDnp, belongsToTpp, isTransferred };
  }, []);

  const checkDirectUserTagged = useCallback((r: QualityReport, u: User): boolean => {
    if (!u) return false;

    // Direct assignment
    if (r.assignedPersonId && r.assignedPersonId === u.id) return true;
    if (r.assignedPersonName && u.fullName && r.assignedPersonName.toLowerCase() === u.fullName.toLowerCase()) return true;

    // Helper to check text for @mention
    const checkText = (text?: string): boolean => {
      if (!text) return false;
      const lower = text.toLowerCase();
      if (!lower.includes("@")) return false;

      if (u.fullName && lower.includes(`@${u.fullName.toLowerCase()}`)) return true;
      if (u.id && lower.includes(`@${u.id.toLowerCase()}`)) return true;

      if (u.fullName) {
        const parts = u.fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          const shortName = parts.slice(-2).join(" ").toLowerCase();
          if (lower.includes(`@${shortName}`)) return true;
        }
        const lastName = parts[parts.length - 1].toLowerCase();
        if (lastName.length >= 2 && lower.includes(`@${lastName}`)) return true;
      }

      return false;
    };

    if (checkText(r.notes)) return true;
    if (checkText(r.content)) return true;
    if (r.directives && r.directives.some((d) => checkText(d.text))) return true;
    if (r.resolutions && r.resolutions.some((res) => checkText(res.resultText) || (res.handlerName && u.fullName && res.handlerName.toLowerCase() === u.fullName.toLowerCase()))) return true;

    return false;
  }, []);

  const checkUserTaskInDiscussion = useCallback((r: QualityReport, u: User | null): boolean => {
    if (!u || !topics || topics.length === 0 || !replies || replies.length === 0) return false;

    const topic = topics.find((t) => t.reportId === r.id || (r.reportCode && t.reportId === r.reportCode));
    if (!topic) return false;

    const topicReplies = replies.filter((reply) => reply.topicId === topic.id);
    if (topicReplies.length === 0) return false;

    const userId = u.id ? u.id.toLowerCase() : "";
    const userFullName = u.fullName ? u.fullName.toLowerCase() : "";
    const userDept = u.department ? u.department.trim().toLowerCase() : "";
    const shortDept = userDept ? userDept.replace(/^(phòng|bộ phận|ban|xưởng|khối)\s+/i, "").trim() : "";

    let shortName = "";
    let lastName = "";
    if (u.fullName) {
      const parts = u.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        shortName = parts.slice(-2).join(" ").toLowerCase();
      }
      lastName = parts[parts.length - 1].toLowerCase();
    }

    return topicReplies.some((reply) => {
      // 1. Direct task/directive assigned to user
      if (reply.actionData) {
        const assignedId = reply.actionData.assignedToId ? reply.actionData.assignedToId.toLowerCase() : "";
        const assignedName = reply.actionData.assignedToName ? reply.actionData.assignedToName.toLowerCase() : "";
        const note = reply.actionData.note ? reply.actionData.note.toLowerCase() : "";

        if (assignedId && userId && assignedId === userId) return true;
        if (assignedName && userFullName && (assignedName.includes(userFullName) || userFullName.includes(assignedName))) return true;
        if (assignedName && shortName && assignedName.includes(shortName)) return true;
        if (assignedName && userDept && (assignedName.includes(userDept) || (shortDept && assignedName.includes(shortDept)))) return true;
        
        if (note && note.includes("@")) {
          if (userFullName && note.includes(`@${userFullName}`)) return true;
          if (shortName && note.includes(`@${shortName}`)) return true;
          if (lastName && lastName.length >= 2 && note.includes(`@${lastName}`)) return true;
          if (userDept && note.includes(`@${userDept}`)) return true;
          if (shortDept && shortDept.length >= 2 && note.includes(`@${shortDept}`)) return true;
        }
      }

      // 2. Check reply message for @mentions or task assignment
      const msg = reply.message ? reply.message.toLowerCase() : "";
      if (msg.includes("@")) {
        if (userFullName && msg.includes(`@${userFullName}`)) return true;
        if (userId && msg.includes(`@${userId}`)) return true;
        if (shortName && msg.includes(`@${shortName}`)) return true;
        if (lastName && lastName.length >= 2 && msg.includes(`@${lastName}`)) return true;
        if (userDept && msg.includes(`@${userDept}`)) return true;
        if (shortDept && shortDept.length >= 2 && msg.includes(`@${shortDept}`)) return true;
      }

      return false;
    });
  }, [topics, replies]);

  const isUserTaggedInReport = useCallback((r: QualityReport, user: User | null): boolean => {
    if (!user) return false;

    if (checkDirectUserTagged(r, user)) return true;
    if (checkUserTaskInDiscussion(r, user)) return true;

    if (user.department) {
      const deptClean = user.department.trim().toLowerCase();
      if (deptClean) {
        const checkDeptText = (text?: string): boolean => {
          if (!text) return false;
          const lower = text.toLowerCase();
          if (!lower.includes("@")) return false;
          if (lower.includes(`@${deptClean}`)) return true;
          const shortDept = deptClean.replace(/^(phòng|bộ phận|ban|xưởng|khối)\s+/i, "").trim();
          if (shortDept.length >= 2 && lower.includes(`@${shortDept}`)) return true;
          return false;
        };
        if (checkDeptText(r.notes) || checkDeptText(r.content)) return true;
        if (r.directives && r.directives.some((d) => checkDeptText(d.text))) return true;
      }
    }

    const pos = (user.position || "").toLowerCase();
    const role = (user.role || "").toLowerCase();
    const isDeptHead = pos.includes("trưởng") || pos.includes("phó") || pos.includes("quản lý") || pos.includes("giám đốc") || pos.includes("gđ") || pos.includes("chủ nhiệm") || pos.includes("leader") || pos.includes("head") || role.includes("duyệt") || role.includes("admin");

    if (isDeptHead && user.department && users && users.length > 0) {
      const userDeptClean = user.department.trim().toLowerCase();
      if (userDeptClean) {
        const deptMembers = users.filter((u) => u.id !== user.id && u.department && u.department.trim().toLowerCase() === userDeptClean);
        for (const member of deptMembers) {
          if (checkDirectUserTagged(r, member)) return true;
        }
      }
    }

    return false;
  }, [users, checkDirectUserTagged, checkUserTaskInDiscussion]);

  // Logs Scope Filtered Reports (search, factory, category, abnormal - without reportType filter for KPI cards calculation)
  const logsScopeFilteredReports = useMemo(() => {
    return scopedReports.filter((r) => {
      if (r.isDeleted) return false;
      if (r.isApproved === false) return false;

      if (logsSearch) {
        const s = logsSearch.toLowerCase();
        const matchesSearch =
          r.uploaderName.toLowerCase().includes(s) ||
          r.content.toLowerCase().includes(s) ||
          r.category.toLowerCase().includes(s) ||
          (r.reportCode && r.reportCode.toLowerCase().includes(s)) ||
          (r.notes && r.notes.toLowerCase().includes(s));
        if (!matchesSearch) return false;
      }

      if (logsFactories.length > 0) {
        const matchesAnyFactory = logsFactories.some((f) => matchFactory(r.factory, f) || r.factory === f);
        if (!matchesAnyFactory) return false;
      }
      if (logsCategory !== "Tất cả" && r.category !== logsCategory) return false;
      if (logsAbnormalOnly && !r.isAbnormal) return false;

      return true;
    });
  }, [scopedReports, logsSearch, logsFactories, logsCategory, logsAbnormalOnly]);

  // KPI Counts for 5 cards: Tổng, KPH (BN), KPH (NB), RRO, DSA
  const logsReportTypeCounts = useMemo(() => {
    let total = 0;
    let kphBn = 0;
    let kphNb = 0;
    let rro = 0;
    let dsa = 0;

    logsScopeFilteredReports.forEach((r) => {
      total++;
      const isDsa = r.reportType === "DSA" || !!r.isSpotlight;
      const isRro = r.reportType === "RRO";
      const isKphBn = r.reportType === "KNN" || (r.reportType === "KPH" && r.kphSubtype === "BN");

      if (isDsa) {
        dsa++;
      } else if (isRro) {
        rro++;
      } else if (isKphBn) {
        kphBn++;
      } else {
        kphNb++;
      }
    });

    return { total, kphBn, kphNb, rro, dsa };
  }, [logsScopeFilteredReports]);

  // Logs Context-Filtered Reports (incorporating logsReportTypeFilter)
  const logsContextFilteredReports = useMemo(() => {
    return logsScopeFilteredReports.filter((r) => {
      if (logsReportTypeFilter !== "ALL") {
        const isDsa = r.reportType === "DSA" || !!r.isSpotlight;
        const isRro = r.reportType === "RRO";
        const isKphBn = r.reportType === "KNN" || (r.reportType === "KPH" && r.kphSubtype === "BN");
        const isKphNb = !isDsa && !isRro && !isKphBn;

        if (logsReportTypeFilter === "DSA" && !isDsa) return false;
        if (logsReportTypeFilter === "RRO" && !isRro) return false;
        if (logsReportTypeFilter === "KPH_BN" && !isKphBn) return false;
        if (logsReportTypeFilter === "KPH_NB" && !isKphNb) return false;
        if (logsReportTypeFilter === "KPH" && !(isKphBn || isKphNb)) return false;
      }

      return true;
    });
  }, [logsScopeFilteredReports, logsReportTypeFilter]);

  // Transferred count recalculated dynamically based on active filters
  const logsTransferredReportsCount = useMemo(() => {
    return logsContextFilteredReports.filter((r) => {
      const { isTransferred } = getReportCompanyOwnership(r);
      return isTransferred;
    }).length;
  }, [logsContextFilteredReports, getReportCompanyOwnership]);

  // Tagged count for current user
  const logsTaggedReportsCount = useMemo(() => {
    return logsContextFilteredReports.filter((r) => isUserTaggedInReport(r, currentUser)).length;
  }, [logsContextFilteredReports, currentUser, isUserTaggedInReport]);

  const logsTaggedCounts = useMemo(() => {
    let unacked = 0;
    let processing = 0;
    let resolved = 0;

    logsContextFilteredReports.forEach((r) => {
      if (!isUserTaggedInReport(r, currentUser)) return;
      const isDsa = r.reportType === "DSA" || !!r.isSpotlight;
      if (isDsa) return;

      const ackCount = r.sharedBy?.length || 0;
      const resCount = r.resolutions?.length || 0;
      const isResolved = resCount > 0 && (r.resolutions?.some((res) => res.status === "Đã xử lý" || !!res.resultText) ?? true);

      if (isResolved) {
        resolved++;
      } else if (ackCount > 0) {
        processing++;
      } else {
        unacked++;
      }
    });

    return {
      all: logsTaggedReportsCount,
      unacked,
      processing,
      resolved,
    };
  }, [logsContextFilteredReports, currentUser, isUserTaggedInReport, logsTaggedReportsCount]);

  const logsStatusCounts = useMemo(() => {
    let unacked = 0;
    let processing = 0;
    let resolved = 0;

    logsContextFilteredReports.forEach((r) => {
      const isDsa = r.reportType === "DSA" || !!r.isSpotlight;
      if (isDsa) return; // Skip DSA reports for status workflow counts

      const ackCount = r.sharedBy?.length || 0;
      const resCount = r.resolutions?.length || 0;
      const isResolved = resCount > 0 && (r.resolutions?.some((res) => res.status === "Đã xử lý" || !!res.resultText) ?? true);

      if (isResolved) {
        resolved++;
      } else if (ackCount > 0) {
        processing++;
      } else {
        unacked++;
      }
    });

    return {
      all: logsContextFilteredReports.length,
      unacked,
      processing,
      resolved,
    };
  }, [logsContextFilteredReports]);

  // Base reports list considering the transferred-only or tagged-only filter toggle
  const logsBaseFilteredReports = useMemo(() => {
    if (logsOnlyTaggedFilter) {
      return logsContextFilteredReports.filter((r) => isUserTaggedInReport(r, currentUser));
    }
    if (logsOnlyTransferredFilter) {
      return logsContextFilteredReports.filter((r) => {
        const { isTransferred } = getReportCompanyOwnership(r);
        return isTransferred;
      });
    }
    return logsContextFilteredReports;
  }, [logsContextFilteredReports, logsOnlyTaggedFilter, logsOnlyTransferredFilter, currentUser, isUserTaggedInReport, getReportCompanyOwnership]);

  // Final filtered reports considering logsProcessStatusFilter and sorted identically to mobile
  const finalLogsFilteredReports = useMemo(() => {
    const list = logsBaseFilteredReports.filter((r) => {
      if (logsProcessStatusFilter === "ALL") return true;

      const isDsa = r.reportType === "DSA" || !!r.isSpotlight;
      if (isDsa) return false;

      const ackCount = r.sharedBy?.length || 0;
      const resCount = r.resolutions?.length || 0;
      const isResolved = resCount > 0 && (r.resolutions?.some((res) => res.status === "Đã xử lý" || !!res.resultText) ?? true);

      if (logsProcessStatusFilter === "UNACKNOWLEDGED") {
        return ackCount === 0 && !isResolved;
      }
      if (logsProcessStatusFilter === "PROCESSING") {
        return ackCount > 0 && !isResolved;
      }
      if (logsProcessStatusFilter === "RESOLVED") {
        return isResolved;
      }
      return true;
    });

    // Sort reports according to the prioritized layout (identical to mobile):
    // 1. New reports (posted <= 5 minutes ago) are at the absolute top.
    // 2. Reports with new changes/updates (updated <= 5 minutes ago) also automatically jump to the top.
    // 3. Normal reports are ordered by original time descending at the bottom.
    return [...list].sort((a, b) => {
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
  }, [logsBaseFilteredReports, logsProcessStatusFilter]);

  // Stats calculation
  const totalReportsCount = scopedReports.filter((r) => !r.isDeleted).length;
  const abnormalReportsCount = scopedReports.filter((r) => r.isAbnormal && !r.isDeleted).length;
  const safeReportsCount = totalReportsCount - abnormalReportsCount;
  const activeStaffCount = scopedUsers.filter((u) => u.status === UserStatus.ACTIVE).length;
  const pendingApprovalsCount = scopedUsers.filter((u) => u.status === UserStatus.PENDING).length;

  const pendingReportsCount = scopedReports.filter((r) => {
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
    scopedReports.filter((r) => !r.isDeleted).forEach((r) => {
      if (counts[r.category] !== undefined) counts[r.category]++;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key as Category4M1E1I]
    }));
  };

  const getFactoryStats = () => {
    const map: Record<string, { total: number; abnormal: number }> = {};
    scopedBranches.forEach((b) => {
      if (b.isScoring) {
        map[b.name] = { total: 0, abnormal: 0 };
      }
    });

    scopedReports.filter((r) => !r.isDeleted).forEach((r) => {
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

  const getFilteredStatsReports = () => {
    const nonDeleted = scopedReports.filter((r) => !r.isDeleted);
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

  // 2. So sánh các Chi nhánh: số lượng DSA (Điểm Sáng) vs KPH (Không Phù Hợp) vs RRO
  const getBranchComparisonData = () => {
    const map: Record<string, { kphNb: number; kphBn: number; dsa: number; rro: number }> = {};
    scopedBranches.forEach((b) => {
      if (b.isScoring) {
        map[b.id] = { kphNb: 0, kphBn: 0, dsa: 0, rro: 0 };
      }
    });

    scopedReports.filter((r) => !r.isDeleted).forEach((r) => {
      const matchedBranch = scopedBranches.find(b => b.isScoring && matchFactory(r.factory, b.id));
      if (matchedBranch && map[matchedBranch.id]) {
        if (r.reportType === "RRO") {
          map[matchedBranch.id].rro++;
        } else if (r.reportType === "DSA" || r.isSpotlight) {
          map[matchedBranch.id].dsa++;
        } else if (r.reportType === "KNN" || (r.reportType === "KPH" && r.kphSubtype === "BN")) {
          map[matchedBranch.id].kphBn++;
        } else if (r.reportType === "KPH" || r.isAbnormal) {
          map[matchedBranch.id].kphNb++;
        }
      }
    });

    return scopedBranches.filter(b => b.isScoring).map((b) => {
      const match = b.name.match(/\(([^)]+)\)/);
      const shortName = match ? match[1] : b.name.replace("Chi Nhánh ", "").replace("Nhà máy ", "").replace("Văn phòng ", "VP ");
      return {
        name: shortName,
        "KPH (Nội Bộ)": map[b.id]?.kphNb || 0,
        "KPH (Bên Ngoài)": map[b.id]?.kphBn || 0,
        "Cảnh Báo (RRO)": map[b.id]?.rro || 0,
        "Điểm Sáng (DSA)": map[b.id]?.dsa || 0,
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
    <div className="flex-1 bg-[#F7F9FC] text-slate-800 flex flex-col min-h-0 h-full overflow-hidden font-sans">
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
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-xs text-slate-800">
        {/* Main Title Bar (Compact single line layout) */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <img 
              src="/logo_meta.svg" 
              alt="META ANDON Logo" 
              className="w-10 h-10 object-contain drop-shadow-xs rounded-xl cursor-pointer hover:scale-105 transition-transform shrink-0" 
            />
            <div className="min-w-0">
              <div className="text-[10.5px] text-slate-500 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <T>HỆ THỐNG KIỂM SOÁT THAY ĐỔI THEO THỜI GIAN THỰC</T>
              </div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
                <T>Trang Quản Trị Hệ Thống META ANDON</T>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">v4.1.3</span>
              </h1>
            </div>
          </div>

          {/* Right: Cụm công cụ điều hành nhanh */}
          <div className="flex items-center gap-2.5 flex-wrap ml-auto">
            {/* Scope Switcher cho Super Admin */}
            {isSuperAdmin && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-250 shadow-2xs">
                <span className="text-[9.5px] font-black uppercase text-slate-500 px-2 py-0.5 select-none font-mono">
                  <T>NGỮ CẢNH:</T>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSetAdminScope("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      adminScopePreference === "ALL"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-slate-600 hover:text-slate-900 bg-transparent hover:bg-slate-200/60"
                    }`}
                    title="Xem toàn bộ dữ liệu TPP & DNP"
                  >
                    <span>🌐</span>
                    <T>ALL</T>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetAdminScope("TPP")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      adminScopePreference === "TPP"
                        ? "bg-blue-600 text-white shadow-xs font-black"
                        : "text-blue-700 hover:text-blue-900 bg-transparent hover:bg-blue-50"
                    }`}
                    title="Chỉ xem dữ liệu khối Tân Phú (TPP)"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <T>TPP</T>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetAdminScope("DNP")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      adminScopePreference === "DNP"
                        ? "bg-amber-600 text-white shadow-xs font-black"
                        : "text-amber-700 hover:text-amber-900 bg-transparent hover:bg-amber-50"
                    }`}
                    title="Chỉ xem dữ liệu khối Đồng Nai (DNP)"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <T>DNP</T>
                  </button>
                </div>
              </div>
            )}

            {/* Nút hiển thị số người online (Icon style tương đồng Mobile) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setDesktopOnlineSearch("");
                    setShowDesktopOnlinePopover(!showDesktopOnlinePopover);
                  }}
                  className="relative p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
                  title="Số nhân viên đang trực tuyến (Nhấp để xem chi tiết)"
                >
                  <Users className="w-[18px] h-[18px] text-emerald-600 pointer-events-none" />
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-[9px] text-white font-black px-1.5 min-w-[18px] h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs font-mono pointer-events-none animate-pulse">
                    {onlineCount}
                  </span>
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

              {/* Nút Xem / Thu gọn Mobile Live (Icon chiếc điện thoại) */}
              <button
                onClick={onToggleMobilePreview}
                className={`p-2 rounded-lg text-xs font-sans font-black active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  showMobilePreview
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/30"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title={showMobilePreview ? "Thu gọn xem trước giao diện điện thoại (Mobile Live)" : "Mở xem trước giao diện điện thoại (Mobile Live)"}
              >
                <Smartphone className="w-[18px] h-[18px] text-white shrink-0" />
                {showMobilePreview && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0" />
                )}
              </button>
            </div>
        </div>
      </header>

      {/* Main Admin Workspace Container */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 h-full overflow-hidden">
        {/* Navigation panel */}
        <nav className={`relative w-full ${isSidebarCollapsed ? "md:w-[76px] px-2" : "md:w-64 p-3"} ${currentSidebarTheme.navBg} border-r ${currentSidebarTheme.navBorder} shrink-0 select-none flex flex-col justify-between transition-all duration-300 ease-in-out h-full overflow-visible z-20`}>
          {/* Floating Collapse / Expand Button on border */}
          <button
            type="button"
            onClick={() => {
              setIsSidebarCollapsed(prev => {
                const next = !prev;
                try {
                  localStorage.setItem("tanphu_desktop_sidebar_collapsed", String(next));
                } catch (e) {
                  // ignore
                }
                return next;
              });
            }}
            className={`hidden md:flex absolute top-5 -right-3.5 w-7 h-7 rounded-full bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-md items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer z-30 ${
              currentSidebarTheme.isLight ? "bg-white text-slate-700" : "bg-slate-800 text-slate-200 border-slate-700"
            }`}
            title={isSidebarCollapsed ? "Mở rộng thanh Menu" : "Thu gọn thanh Menu"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <div className="space-y-1 flex-1 min-h-0 overflow-y-auto pr-1 thin-scrollbar">
            {!isSidebarCollapsed && (
              <T className={`text-[10px] ${currentSidebarTheme.titleColor} font-extrabold uppercase tracking-widest pl-3 block mb-2 transition-opacity duration-200`}>PANEL ĐIỀU HÀNH</T>
            )}
            {[
              ...(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER
                ? [
                    { id: "PHÊ_DUYỆT", label: "Phê duyệt nhân sự", icon: UserCheck, count: pendingApprovalsCount, color: "text-amber-400" },
                  ]
                : []),
              ...(currentUser.role === UserRole.ADMIN
                ? [
                    { id: "QUOTA_CLOUD", label: "Giám sát Cloud Quota", icon: CloudLightning, color: "text-amber-300" },
                    { id: "MÃ_HÓA", label: "Khai báo mã hóa", icon: Sliders, color: "text-purple-400" },
                  ]
                : []),
              { id: "THỐNG_KÊ", label: "Báo cáo thống kê", icon: BarChart4, color: "text-emerald-400" },
              ...(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REVIEWER
                ? [{ id: "ĐỀ_XUẤT", label: "Đề xuất chờ duyệt", icon: CheckSquare, count: pendingReportsCount, color: "text-sky-400" }]
                : []),
              { id: "DỮ_LIỆU", label: "Sổ nhật ký biến động 4M1E1I", icon: Database, color: "text-blue-450" },
              { id: "FORM_CAPA", label: "Lập CAPA", icon: FileText, color: "text-indigo-400" },
              { id: "THỬ_NGHIỆM", label: "Sổ nhật ký thử nghiệm", icon: FlaskConical, color: "text-teal-400" },
              { id: "THÔNG_BÁO", label: "Phát sóng & Ticker", icon: Bell, count: unreadCount, color: "text-yellow-400" },
              { id: "TRAO_ĐỔI", label: "Trao đổi & Hộp thoại 1:1", icon: MessageSquare, count: unreadDirectMessagesCount, color: "text-pink-400" },
              { id: "QUY_CHẾ", label: "Kho Tri thức Ai", icon: BookOpen, color: "text-teal-400" },
              { id: "CÁ_NHÂN", label: "Trang cá nhân", icon: Users, color: currentSidebarTheme.isLight ? "text-slate-600" : "text-slate-300" }
            ].map((item) => {
              const isSel = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2"} rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer relative group ${
                    isSel
                      ? `${currentSidebarTheme.itemActiveBg} ${currentSidebarTheme.itemActiveText} ${currentSidebarTheme.itemActiveBorder}`
                      : `${currentSidebarTheme.itemText} ${currentSidebarTheme.itemHover}`
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2.5"} min-w-0 relative`}>
                    <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                    {!isSidebarCollapsed && (
                      <T className="truncate">{item.label}</T>
                    )}
                  </div>
                  {item.count && item.count > 0 ? (
                    isSidebarCollapsed ? (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-xs">
                        {item.count > 99 ? "99+" : item.count}
                      </span>
                    ) : (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full block animate-bounce shrink-0">
                        {item.count}
                      </span>
                    )
                  ) : null}
                </button>
              );
            })}

            {!isSidebarCollapsed && (
              <div className="pt-2">
                <div className={`${currentSidebarTheme.summaryCardBg} p-2.5 rounded-xl border ${currentSidebarTheme.summaryCardBorder}`}>
                  <T className={`text-[11px] font-bold ${currentSidebarTheme.isLight ? "text-slate-800" : "text-white"} block`}>Tóm tắt số liệu 4M1E1I</T>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 select-none">
                    <div className={`${currentSidebarTheme.summarySubBg} p-1.5 rounded border ${currentSidebarTheme.summarySubBorder} text-center`}>
                      <T className={`text-[9.5px] ${currentSidebarTheme.isLight ? "text-slate-500" : "text-slate-400"} block font-bold leading-none uppercase`}>Đóng góp</T>
                      <T className="text-sm font-bold text-blue-400 block mt-0.5">{totalReportsCount}</T>
                    </div>
                    <div className={`${currentSidebarTheme.summarySubBg} p-1.5 rounded border ${currentSidebarTheme.summarySubBorder} text-center`}>
                      <T className="text-[9.5px] text-red-400 block font-bold leading-none uppercase">Bất thường</T>
                      <T className="text-sm font-bold text-red-400 block mt-0.5">{abnormalReportsCount}</T>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DÃY NÚT CHỌN MÀU SLIDEBAR VÀ THẺ USER PROFILE BOTTOM */}
          <div className="pt-2 mt-2 shrink-0 border-t border-black/5 dark:border-white/5">
            {isSidebarCollapsed ? (
              /* Collapsed Profile & Actions (Vertical compact layout) */
              <div className="flex flex-col items-center gap-2.5 py-1">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm shrink-0 cursor-pointer"
                  title={`${currentUser.fullName} (${currentUser.role})`}
                  onClick={() => setActiveTab("CÁ_NHÂN")}
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {currentUser.fullName?.charAt(0) || "U"}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-rose-600 hover:text-white text-slate-400 border border-black/10 dark:border-white/15 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-xs"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Expanded Full Profile & Theme Picker */
              <div className={`p-2.5 rounded-2xl border ${currentSidebarTheme.profileCardBg} ${currentSidebarTheme.profileCardBorder} shadow-sm backdrop-blur-xs`}>
                {/* Dãy nút màu tròn */}
                <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-black/10 dark:border-white/10">
                  {SIDEBAR_THEMES.map((theme) => {
                    const isSelected = theme.id === currentSidebarTheme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectSidebarTheme(theme.id)}
                        className={`w-4 h-4 rounded-full transition-all cursor-pointer shrink-0 ${theme.dotBorder || ""} ${
                          isSelected 
                            ? "scale-125 ring-2 ring-blue-600 ring-offset-2 ring-offset-white shadow-md" 
                            : "hover:scale-115 opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: theme.dotBg }}
                        title={theme.name}
                      />
                    );
                  })}
                </div>

                {/* Thông tin User & Nút Logout */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      {currentUser.avatar ? (
                        <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{currentUser.fullName?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-black truncate leading-tight ${currentSidebarTheme.profileTextColor}`}>
                        <T>{currentUser.fullName}</T>
                      </div>
                      <div className={`text-[9.5px] font-bold uppercase tracking-wider truncate mt-0.5 ${currentSidebarTheme.profileSubTextColor}`}>
                        <T>{currentUser.role}</T>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-rose-600/20 text-slate-400 hover:text-rose-500 border border-black/10 dark:border-white/15 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Dynamic workspace container */}
        <main className={`flex-1 ${showMobilePreview ? "p-3.5 sm:p-4 lg:p-5" : "p-4 sm:p-6"} overflow-y-auto bg-[#F7F9FC] h-full transition-all duration-300`}>
          {/* TAB 1: PHÊ DUYỆT (Personnel management) */}
          {activeTab === "PHÊ_DUYỆT" && (
            <div className="space-y-6">
              {/* Header Banner - White, bright & elegant style matching TIẾN TRÌNH THỬ NGHIỆM */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      <T>PHÊ DUYỆT HOẠT ĐỘNG NHÂN VIÊN</T>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                      <T>Quản lý duyệt cấp phép truy cập, chỉnh sửa phân quyền và kích hoạt tài khoản của nhân viên các xưởng.</T>
                    </p>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div translate="no" className="notranslate flex items-center gap-2.5 ml-auto flex-wrap">
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
                      className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black rounded-xl shadow-xs border transition-all cursor-pointer select-none uppercase tracking-wide shrink-0 ${
                        forceSyncUsersState === "syncing"
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : forceSyncUsersState === "success"
                          ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                          : forceSyncUsersState === "error"
                          ? "bg-rose-600 border-rose-700 text-white hover:bg-rose-700"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-blue-700 shadow-blue-500/20 transform active:scale-95"
                      }`}
                    >
                      {forceSyncUsersState === "syncing" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span translate="no" className="notranslate">Đang đồng bộ phong tỏa...</span>
                        </>
                      ) : forceSyncUsersState === "success" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                          <span translate="no" className="notranslate">Đồng bộ Đám mây OK</span>
                        </>
                      ) : forceSyncUsersState === "error" ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
                          <span translate="no" className="notranslate">Lỗi đồng bộ đám mây</span>
                        </>
                      ) : (
                        <>
                          <CloudLightning className="w-3.5 h-3.5 text-white shrink-0" />
                          <span translate="no" className="notranslate">Lưu cưỡng bức lên Đám mây</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
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
                        <T>
                          {isSuperAdmin
                            ? "Với tư cách Admin tối cao, bạn có thể phê duyệt quyền vào sảnh học tập cho CBNV quốc gia."
                            : "Danh sách nhân sự thuộc phạm vi chi nhánh của bạn để quản lý và phê duyệt quyền truy cập."}
                        </T>
                      </p>
                    </div>

                    {/* Right side controls matching screenshot: MOBILE, XUẤT EXCEL, NHẬP EXCEL, REFRESH (Chỉ Admin mới thấy) */}
                    {isSuperAdmin && (
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
                            const exportUsers = [...scopedUsers];
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
                    )}
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
                        {Array.from(new Set(scopedUsers.map(u => u.branch).filter(Boolean))).map((br) => (
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
                        {Array.from(new Set(scopedUsers.map(u => u.department).filter(Boolean))).map((dept) => (
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
                        let filteredUsers = [...scopedUsers];
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
              {/* Header Banner - White, bright & elegant style */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                    <Sliders className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      <T><span translate="no" className="notranslate">KHAI BÁO VÀ MÃ HÓA DỮ LIỆU ĐỒNG BỘ</span></T>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                      <T><span translate="no" className="notranslate">Cấu trúc danh mục gồm 3 Cấp (Công ty → Chi nhánh/VPĐD → Bộ phận/Đơn vị) đồng bộ trực tiếp lên Cloud Firestore và bộ nhớ đệm.</span></T>
                    </p>
                  </div>
                </div>

                <div translate="no" className="notranslate flex items-center gap-2.5 ml-auto flex-wrap">
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
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black rounded-xl shadow-xs border transition-all cursor-pointer select-none uppercase tracking-wide shrink-0 ${
                      forceSyncState === "syncing"
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : forceSyncState === "success"
                        ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                        : forceSyncState === "error"
                        ? "bg-rose-600 border-rose-700 text-white hover:bg-rose-700"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-purple-700 shadow-purple-500/20 transform active:scale-95"
                    }`}
                  >
                    {forceSyncState === "syncing" ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span translate="no" className="notranslate">Đang đồng bộ phong tỏa...</span>
                      </>
                    ) : forceSyncState === "success" ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />
                        <span translate="no" className="notranslate">Đồng bộ Đám mây OK</span>
                      </>
                    ) : forceSyncState === "error" ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-white shrink-0" />
                        <span translate="no" className="notranslate">Lỗi đồng bộ đám mây</span>
                      </>
                    ) : (
                      <>
                        <CloudLightning className="w-3.5 h-3.5 text-white shrink-0" />
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-amber-700 font-bold block mb-1">
                                      <span translate="no" className="notranslate">TÊN BỘ PHẬN / ĐƠN VỊ</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={editingDeptName}
                                      onChange={(e) => setEditingDeptName(e.target.value)}
                                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-amber-500 font-normal"
                                      autoFocus
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-amber-700 font-bold block mb-1">
                                      <span translate="no" className="notranslate">TÊN VIẾT TẮT (VD: QLCL, R&D)</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={editingDeptShortName}
                                      onChange={(e) => setEditingDeptShortName(e.target.value)}
                                      placeholder="VD: QLCL, R&D..."
                                      className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 w-full focus:outline-none focus:ring-1 focus:ring-amber-500 font-normal"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-amber-700 font-bold block mb-1">
                                    <span translate="no" className="notranslate">MÃ ID BỘ PHẬN</span>
                                  </label>
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
                                        onUpdateDepartment(d.id, { 
                                          ...d, 
                                          id: finalId, 
                                          name: cleanName,
                                          shortName: editingDeptShortName.trim() || undefined
                                        });
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
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span translate="no" className="notranslate text-xs font-bold text-slate-800 leading-normal break-words">
                                      {deptNameFormat === 'with-branch-id' 
                                        ? `${d.name.replace(/\s*\([^)]+\)$/, "").trim()} (${d.branchId})` 
                                        : d.name}
                                    </span>
                                    {d.shortName && (
                                      <span translate="no" className="notranslate text-[9px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200 font-bold">
                                        {d.shortName}
                                      </span>
                                    )}
                                  </div>
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
                                      setEditingDeptShortName(d.shortName || "");
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                        placeholder="Tên viết tắt (VD: QLCL)..."
                        value={newDeptShortName}
                        disabled={activeBranchId === ""}
                        onChange={(e) => setNewDeptShortName(e.target.value)}
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
                          shortName: newDeptShortName.trim() || undefined,
                          branchId: activeBranchId
                        });
                        setNewDeptName("");
                        setNewDeptShortName("");
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

          {/* TAB 3: THỐNG KÊ (Business Analytics) */}
          {activeTab === "THỐNG_KÊ" && (() => {
            const { total, kph, dsa, safeRate } = getStatsCountersValue();
            const aiRecons = getAiExpertRecommendations();

            return (
              <div className="space-y-6 animate-fadeIn">
                {/* Header Banner - White, bright & elegant style */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                      <BarChart4 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        <T><span translate="no" className="notranslate">TRUNG TÂM THỐNG KÊ & PHÂN TÍCH 4M1E1I</span></T>
                      </h1>
                      <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                        <T><span translate="no" className="notranslate">Hệ thống vận hành thống kê thông minh: tích hợp trạng thái nhân sự, ma trận chất lượng, và cố vấn tự động.</span></T>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Row 2: Sub-tab Switcher Toolbar (Dedicated line) */}
                <div className="pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs font-black select-none border border-slate-200 shadow-sm w-fit gap-1">
                    {currentUser?.role === UserRole.ADMIN && (
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
                    )}
                    <button
                      type="button"
                      onClick={() => setStatsSubTab("CHAT_LUONG")}
                      className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border-none outline-none ${
                        statsSubTab === "CHAT_LUONG" || (statsSubTab === "NHAN_SU" && currentUser?.role !== UserRole.ADMIN)
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

                {statsSubTab === "NHAN_SU" && currentUser?.role === UserRole.ADMIN ? (
                  <StatisticsDashboard 
                    users={scopedUsers} 
                    branches={scopedBranches} 
                    departments={departments} 
                    reports={scopedReports}
                    chats={chats}
                    topics={scopedTopics}
                    topicReplies={replies}
                  />
                ) : statsSubTab === "TIEN_DO" ? (
                  <ProgressTrackingDashboard
                    reports={scopedReports}
                    users={scopedUsers}
                    branches={scopedBranches}
                    departments={departments}
                    currentUser={currentUser}
                    onUpdateReport={onUpdateReport}
                    onAddBroadcast={onAddBroadcast}
                    showToast={onShowToast}
                  />
                ) : statsSubTab === "HUY_HIEU" ? (
                  <BadgeStatisticsDashboard
                    reports={scopedReports}
                    users={scopedUsers}
                    branches={scopedBranches}
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
                      {scopedBranches.filter(b => b.isScoring).map((b) => (
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

                {/* Status board relative to selected filter - Zoom-resilient responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md min-w-0">
                    <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-widest truncate">
                      <T><span translate="no" className="notranslate">TỔNG BIẾN ĐỘNG PHÁT SINH</span></T>
                    </span>
                    <span className="text-2xl sm:text-3xl font-black block text-blue-600 mt-1.5">
                      {total}
                    </span>
                    <span className="text-[9px] text-slate-400 block mt-1 truncate">
                      <T><span translate="no" className="notranslate">Toàn bộ hồ sơ nhật ký dữ liệu</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-red-600 min-w-0">
                    <span className="text-[10px] text-red-500 block font-bold uppercase tracking-widest truncate">
                      <T><span translate="no" className="notranslate">KHÔNG PHÙ HỢP KPH</span></T>
                    </span>
                    <span className="text-2xl sm:text-3xl font-black block mt-1.5">
                      {kph}
                    </span>
                    <span className="text-[9px] text-red-400 block mt-1 truncate">
                      <T><span translate="no" className="notranslate">Sự cố khuyết tật, bất thường</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-emerald-600 min-w-0">
                    <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-widest truncate">
                      <T><span translate="no" className="notranslate">ĐIỂM SÁNG CHẤT LƯỢNG (DSA)</span></T>
                    </span>
                    <span className="text-2xl sm:text-3xl font-black block mt-1.5">
                      {dsa}
                    </span>
                    <span className="text-[9px] text-emerald-400 block mt-1 truncate">
                      <T><span translate="no" className="notranslate">Sáng kiến cải tiến thực tiễn tốt</span></T>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md text-indigo-650 min-w-0">
                    <span className="text-[10px] text-indigo-600 block font-bold uppercase tracking-widest truncate">
                      <T><span translate="no" className="notranslate">CHỈ SỐ AN TOÀN VẬN HÀNH</span></T>
                    </span>
                    <span className="text-2xl sm:text-3xl font-black block text-indigo-650 mt-1.5">
                      {safeRate}%
                    </span>
                    <span className="text-[9px] text-indigo-400 block mt-1 truncate">
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
                        <T><span translate="no" className="notranslate">3. So Sánh Hiệu Suất Chất Lượng: DSA vs KPH (Nội Bộ / Bên Ngoài) vs RRO Giữa Các Chi Nhánh</span></T>
                      </span>
                      <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                        <T><span translate="no" className="notranslate">Biểu hiện của tính đối sáng thi đua giữa tất cả xưởng và văn phòng toàn bộ lãnh thổ Tân Phú. Cho thấy ngay đơn vị nào đang có tỷ lệ cải tiến DSA xuất sắc đột phá, điểm Không Phù Hợp KPH và các điểm Cảnh Báo Phòng Ngừa Rủi Ro (RRO).</span></T>
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
                          <Bar dataKey="Điểm Sáng (DSA)" fill="#10b981" barSize={28} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="KPH (Nội Bộ)" stackId="kph" fill="#f97316" barSize={28} />
                          <Bar dataKey="KPH (Bên Ngoài)" stackId="kph" fill="#dc2626" barSize={28} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Cảnh Báo (RRO)" fill="#2563eb" barSize={28} radius={[4, 4, 0, 0]} />
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
              {/* Header Banner - White, bright & elegant style */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      <T><span translate="no" className="notranslate">HỆ THỐNG ĐỀ XUẤT CHỜ PHÊ DUYỆT</span></T>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                      <T><span translate="no" className="notranslate">Xem xét, kiểm duyệt và phê duyệt các tin bài đề xuất của nhân viên trước khi phát hành lên Bản tin chính (Home).</span></T>
                    </p>
                  </div>
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
                  <div className="space-y-1 relative select-none" ref={proposalFactoryDropdownRef}>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      <T><span translate="no" className="notranslate">Nhà máy / Xưởng:</span></T>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsProposalFactoryDropdownOpen(!isProposalFactoryDropdownOpen)}
                      className={`w-full bg-white border rounded-lg px-3 py-2 text-xs font-bold transition-all shadow-3xs focus:outline-none flex items-center justify-between gap-1.5 cursor-pointer ${
                        proposalFactories.length > 0
                          ? "border-sky-500 ring-1 ring-sky-300 bg-sky-50/50 text-sky-900"
                          : "border-slate-250 text-slate-700 hover:border-slate-350"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 truncate">
                        <Building className={`w-3.5 h-3.5 shrink-0 ${proposalFactories.length > 0 ? "text-sky-600" : "text-slate-400"}`} />
                        <span className="truncate text-left font-semibold">
                          <T>
                            <span translate="no" className="notranslate">
                              {proposalFactories.length === 0
                                ? "Tất cả chi nhánh"
                                : proposalFactories.length === 1
                                ? getFactoryDisplayName(proposalFactories[0])
                                : `${proposalFactories.length} chi nhánh đã chọn`}
                            </span>
                          </T>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {proposalFactories.length > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setProposalFactories([]);
                            }}
                            title="Xóa chọn chi nhánh"
                            className="w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-200 hover:text-rose-700 text-slate-600 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            ✕
                          </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProposalFactoryDropdownOpen ? "rotate-180 text-sky-600" : ""}`} />
                      </div>
                    </button>

                    {isProposalFactoryDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-500">
                          <T><span translate="no" className="notranslate">Lọc chi nhánh:</span></T>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const all = scopedBranches.filter((b) => b.isScoring).map((b) => b.name);
                                setProposalFactories(all);
                              }}
                              className="text-sky-600 hover:text-sky-800 hover:underline cursor-pointer font-bold lowercase first-letter:uppercase"
                            >
                              <T><span translate="no" className="notranslate">Tất cả</span></T>
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => setProposalFactories([])}
                              className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer font-bold lowercase first-letter:uppercase"
                            >
                              <T><span translate="no" className="notranslate">Bỏ chọn</span></T>
                            </button>
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {scopedBranches.filter((b) => b.isScoring).map((b) => {
                            const isSelected = proposalFactories.some((f) => f === b.name || f === b.id || isSameBranchOrFactory(b.name, f));
                            return (
                              <div
                                key={b.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setProposalFactories((prev) => {
                                    const exists = prev.some((f) => f === b.name || f === b.id || isSameBranchOrFactory(b.name, f));
                                    if (exists) {
                                      return prev.filter((f) => f !== b.name && f !== b.id && !isSameBranchOrFactory(b.name, f));
                                    } else {
                                      return [...prev, b.name];
                                    }
                                  });
                                }}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
                                  isSelected
                                    ? "bg-sky-50 text-sky-950 font-bold border border-sky-200/80"
                                    : "hover:bg-slate-50 text-slate-700 font-medium border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pointer-events-none">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 pointer-events-none"
                                  />
                                  <span className="truncate">
                                    <T><span translate="no" className="notranslate">{getFactoryDisplayName(b.name)}</span></T>
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 px-1 font-medium">
                          <span>
                            <T><span translate="no" className="notranslate">Đang chọn:</span></T>{" "}
                            <strong className="text-sky-700">{proposalFactories.length === 0 ? "Tất cả" : `${proposalFactories.length}/${scopedBranches.filter(b => b.isScoring).length}`}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsProposalFactoryDropdownOpen(false)}
                            className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
                          >
                            <T><span translate="no" className="notranslate">Đóng</span></T>
                          </button>
                        </div>
                      </div>
                    )}
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
                        <th className="py-3 px-2 w-12 min-w-[48px] max-w-[48px] text-center border border-slate-200"><T><span translate="no" className="notranslate">STT</span></T></th>
                        <th className="py-3 px-3 w-[210px] min-w-[190px] max-w-[230px] border border-slate-200"><T><span translate="no" className="notranslate">Thông tin ghi nhận</span></T></th>
                        <th className="py-3 px-4 min-w-[260px] border border-slate-200"><T><span translate="no" className="notranslate">Nội dung đề xuất</span></T></th>
                        <th className="py-2 px-1 w-[116px] min-w-[116px] max-w-[116px] text-center border border-slate-200"><T><span translate="no" className="notranslate">Hình ảnh</span></T></th>
                        <th className="py-3 px-2 w-[95px] min-w-[90px] max-w-[105px] text-center border border-slate-200 align-middle">
                          <T><span translate="no" className="notranslate">Trạng thái</span></T>
                        </th>
                        <th className="py-3 px-3 w-[150px] min-w-[140px] max-w-[160px] text-center border border-slate-200"><T><span translate="no" className="notranslate">Thao tác</span></T></th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-medium text-slate-700">
                      {(() => {
                        const filteredProposals = scopedReports.filter((r) => {
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

                          const matchesFactory =
                            proposalFactories.length === 0
                              ? true
                              : proposalFactories.some((f) => matchFactory(r.factory, f) || r.factory === f);
                          const matchesCategory = proposalCategory === "Tất cả" ? true : r.category === proposalCategory;

                          return matchesSearch && matchesFactory && matchesCategory;
                        }).sort((a, b) => parseReportTimestamp(b.timestamp).getTime() - parseReportTimestamp(a.timestamp).getTime());

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
                            <td className="py-3 px-2 text-center font-mono text-slate-400 border border-slate-200 w-12 min-w-[48px] max-w-[48px]">{index + 1}</td>
                            <td className="p-3 space-y-1.5 w-[210px] min-w-[190px] max-w-[230px] border border-slate-200">
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
                            <td className="p-3 leading-relaxed text-slate-900 min-w-[260px] font-bold border border-slate-200">
                              <div className="line-clamp-5">
                                <T><span translate="no" className="notranslate">{(r.content || "").toUpperCase()}</span></T>
                              </div>
                              {r.notes && (
                                <div className="mt-1 text-[10.5px] text-slate-800 font-medium italic block border-l-2 border-amber-500 pl-1.5 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto thin-scrollbar">
                                  <T><span translate="no" className="notranslate">Ghi chú: {r.notes}</span></T>
                                </div>
                              )}
                            </td>
                            <td className="p-1 text-center border border-slate-200 w-[116px] min-w-[116px] max-w-[116px]">
                              <DesktopThumbnailSlider 
                                imageUrls={r.imageUrls && r.imageUrls.length > 0 ? r.imageUrls : [r.imageUrl || getCategoryFallbackImage(r.category)]} 
                                fallbackUrl={r.imageUrl || getCategoryFallbackImage(r.category)} 
                              />
                            </td>
                            <td className="py-2 px-2 text-center select-none border border-slate-200 w-[95px] min-w-[90px] max-w-[105px] align-middle">
                              <div className="flex items-center justify-center mx-auto">
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[9px] px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap shadow-2xs">
                                  <T><span translate="no" className="notranslate">Chờ duyệt</span></T>
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center whitespace-nowrap border border-slate-200 w-[140px] min-w-[130px] max-w-[150px]">
                              <div className="flex flex-col items-center justify-center gap-1.5 w-full max-w-[115px] mx-auto">
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
                                  className="w-full justify-center px-2.5 py-1.5 bg-[#DEF7EC] hover:bg-emerald-100 border border-emerald-250 text-[#03543F] font-black rounded-lg cursor-pointer transition-all text-[10px] uppercase flex items-center gap-1 shadow-3xs"
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
                                  className="w-full justify-center px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-lg cursor-pointer transition-all text-[10px] uppercase flex items-center gap-1 shadow-3xs"
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
              {/* Header Banner - White, bright & elegant style */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      <T><span translate="no" className="notranslate">SỔ NHẬT KÝ BIẾN ĐỘNG 4M1E1I</span></T>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                      <T><span translate="no" className="notranslate">Khung rà soát, tra cứu và sao lưu dữ liệu biến động toàn cục của hệ thống.</span></T>
                    </p>
                  </div>
                </div>

                {/* Desktop Active vs Trash logs toggles (Chỉ Admin mới có quyền truy cập Thùng rác) */}
                {isSuperAdmin && (
                  <div className="flex bg-slate-100 p-1 rounded-xl items-center border border-slate-200 select-none shrink-0">
                    <button
                      onClick={() => setShowTrashLogs(false)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black border-none cursor-pointer transition-all ${
                        !showTrashLogs
                          ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-800 bg-transparent"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <T><span translate="no" className="notranslate">NHẬT KÝ</span></T>
                    </button>
                    <button
                      onClick={() => setShowTrashLogs(true)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black border-none cursor-pointer transition-all relative ${
                        showTrashLogs
                          ? "bg-white text-rose-700 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-rose-800 bg-transparent"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <T><span translate="no" className="notranslate">THÙNG RÁC</span></T>
                      {scopedReports.filter((r) => r.isDeleted).length > 0 && (
                        <span className="bg-rose-600 text-[9px] text-white font-black px-1.5 py-0.5 rounded-full select-none ml-1 animate-pulse">
                          {scopedReports.filter((r) => r.isDeleted).length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* QUẢN LÝ SAO LƯU & XUẤT DỮ LIỆU (Chỉ Admin tối cao mới thấy) */}
              {isSuperAdmin && (
                <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 animate-fadeIn ${
                  isBackupCollapsed ? "p-4 sm:p-5" : "p-5 sm:p-6 space-y-4"
                }`}>
                  <div className={`flex items-center justify-between gap-3 ${isBackupCollapsed ? "" : "border-b border-slate-100 pb-3"}`}>
                    <div 
                      onClick={toggleBackupCollapsed}
                      className="flex items-center gap-3 cursor-pointer select-none group flex-1"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide group-hover:text-blue-700 transition-colors flex items-center gap-2">
                          <span translate="no" className="notranslate">QUẢN LÝ SAO LƯU & XUẤT DỮ LIỆU</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <span translate="no" className="notranslate">Trích xuất báo cáo thay đổi 4M1E1I và bản tin phát sóng dưới dạng JSON hoặc Excel (CSV) để lưu trữ ngoại tuyến.</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleBackupCollapsed}
                      className="p-2 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/60 text-slate-600 hover:text-blue-700 transition-all cursor-pointer shadow-3xs active:scale-95 shrink-0 flex items-center justify-center"
                      title={isBackupCollapsed ? "Mở rộng nội dung" : "Thu gọn nội dung"}
                    >
                      {isBackupCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>

                  {!isBackupCollapsed && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
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
                  )}
                </div>
              )}

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
                    {scopedReports.filter((r) => r.isDeleted).length === 0 ? (
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
                            {scopedReports
                              .filter((r) => r.isDeleted)
                              .sort((a, b) => parseReportTimestamp(b.timestamp).getTime() - parseReportTimestamp(a.timestamp).getTime())
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
                                      <div className="mt-1 text-[10px] text-slate-400 italic block border-l-2 border-slate-300 pl-1.5 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto thin-scrollbar">
                                        <T><span translate="no" className="notranslate">Ghi chú: {r.notes}</span></T>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-center select-none whitespace-nowrap font-mono font-bold text-xs font-black border border-slate-200">
                                    <div className="flex flex-col items-center justify-center gap-1">
                                      {r.reportType === "RRO" ? (
                                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">RRO</span></T>
                                        </span>
                                      ) : r.reportType === "KNN" || (r.reportType === "KPH" && r.kphSubtype === "BN") ? (
                                        <span className="bg-red-100 text-red-800 border border-red-300 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">KPH (BN)</span></T>
                                        </span>
                                      ) : r.reportType === "KPH" || r.isAbnormal ? (
                                        <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[9px] px-2 py-0.5 rounded uppercase block">
                                          <T><span translate="no" className="notranslate">KPH (NB)</span></T>
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
                <div className="space-y-4">
                  {/* 5 THẺ THỐNG KÊ KPI CARDS (TỔNG, KPH (BN), KPH (NB), RRO, DSA) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {/* THẺ 1: TỔNG */}
                    <div
                      onClick={() => setLogsReportTypeFilter("ALL")}
                      className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md active:scale-98 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white min-h-[74px] ${
                        logsReportTypeFilter === "ALL"
                          ? "border-2 border-white ring-2 ring-blue-500 shadow-md scale-[1.02] z-10"
                          : "border border-white/20 hover:brightness-105"
                      }`}
                    >
                      <Activity className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 pointer-events-none stroke-1" />
                      <div className="flex items-center justify-between gap-1.5 z-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
                            <Activity className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-wider leading-tight whitespace-nowrap">
                            <span translate="no" className="notranslate">TỔNG</span>
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 z-1 leading-none">
                          {logsReportTypeCounts.total}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/90 font-bold mt-1.5 z-1 leading-tight">
                        <T><span translate="no" className="notranslate">Đang theo dõi</span></T>
                      </div>
                    </div>

                    {/* THẺ 2: KPH (BN) */}
                    <div
                      onClick={() => setLogsReportTypeFilter(prev => prev === "KPH_BN" ? "ALL" : "KPH_BN")}
                      className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md active:scale-98 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white min-h-[74px] ${
                        logsReportTypeFilter === "KPH_BN"
                          ? "border-2 border-white ring-2 ring-rose-500 shadow-md scale-[1.02] z-10"
                          : "border border-white/20 hover:brightness-105"
                      }`}
                    >
                      <AlertOctagon className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 pointer-events-none stroke-1" />
                      <div className="flex items-center justify-between gap-1.5 z-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
                            <AlertOctagon className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-wider leading-none truncate">
                            <T><span translate="no" className="notranslate">KPH (BN)</span></T>
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 z-1 leading-none">
                          {logsReportTypeCounts.kphBn}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/90 font-bold mt-1.5 z-1 leading-tight">
                        <T><span translate="no" className="notranslate">Khách hàng / BN</span></T>
                      </div>
                    </div>

                    {/* THẺ 3: KPH (NB) */}
                    <div
                      onClick={() => setLogsReportTypeFilter(prev => prev === "KPH_NB" ? "ALL" : "KPH_NB")}
                      className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md active:scale-98 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white min-h-[74px] ${
                        logsReportTypeFilter === "KPH_NB"
                          ? "border-2 border-white ring-2 ring-amber-500 shadow-md scale-[1.02] z-10"
                          : "border border-white/20 hover:brightness-105"
                      }`}
                    >
                      <AlertTriangle className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 pointer-events-none stroke-1" />
                      <div className="flex items-center justify-between gap-1.5 z-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
                            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-wider leading-none truncate">
                            <T><span translate="no" className="notranslate">KPH (NB)</span></T>
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 z-1 leading-none">
                          {logsReportTypeCounts.kphNb}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/90 font-bold mt-1.5 z-1 leading-tight">
                        <T><span translate="no" className="notranslate">Sự cố nội bộ</span></T>
                      </div>
                    </div>

                    {/* THẺ 4: RRO */}
                    <div
                      onClick={() => setLogsReportTypeFilter(prev => prev === "RRO" ? "ALL" : "RRO")}
                      className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md active:scale-98 bg-gradient-to-r from-sky-500 via-blue-600 to-blue-700 text-white min-h-[74px] ${
                        logsReportTypeFilter === "RRO"
                          ? "border-2 border-white ring-2 ring-sky-500 shadow-md scale-[1.02] z-10"
                          : "border border-white/20 hover:brightness-105"
                      }`}
                    >
                      <Shield className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 pointer-events-none stroke-1" />
                      <div className="flex items-center justify-between gap-1.5 z-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
                            <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-wider leading-none truncate">
                            <T><span translate="no" className="notranslate">RRO</span></T>
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 z-1 leading-none">
                          {logsReportTypeCounts.rro}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/90 font-bold mt-1.5 z-1 leading-tight">
                        <T><span translate="no" className="notranslate">Rủi ro & Cơ hội</span></T>
                      </div>
                    </div>

                    {/* THẺ 5: DSA */}
                    <div
                      onClick={() => setLogsReportTypeFilter(prev => prev === "DSA" ? "ALL" : "DSA")}
                      className={`relative overflow-hidden rounded-xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md active:scale-98 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white min-h-[74px] ${
                        logsReportTypeFilter === "DSA"
                          ? "border-2 border-white ring-2 ring-emerald-500 shadow-md scale-[1.02] z-10"
                          : "border border-white/20 hover:brightness-105"
                      }`}
                    >
                      <Sparkles className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 pointer-events-none stroke-1" />
                      <div className="flex items-center justify-between gap-1.5 z-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                          <span className="text-[12px] font-black uppercase tracking-wider leading-none truncate">
                            <T><span translate="no" className="notranslate">DSA</span></T>
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight shrink-0 z-1 leading-none">
                          {logsReportTypeCounts.dsa}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/90 font-bold mt-1.5 z-1 leading-tight">
                        <T><span translate="no" className="notranslate">Điểm sáng / Kaizen</span></T>
                      </div>
                    </div>
                  </div>

                  {/* Filter controls panel */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    {/* Top Row: Search, Factory, Category, My Tagged Tasks Button */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                      <div className="relative lg:col-span-4">
                        <label className="text-[9px] text-slate-555 font-extrabold uppercase block mb-1"><T><span translate="no" className="notranslate">Từ khóa tìm kiếm:</span></T></label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Nội dung, người ghi, mã..."
                            value={logsSearch}
                            onChange={(e) => setLogsSearch(e.target.value)}
                            className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded px-8 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="select-none relative lg:col-span-3" ref={logsFactoryDropdownRef}>
                        <label className="text-[9px] text-slate-555 font-extrabold uppercase block mb-1"><T><span translate="no" className="notranslate">Xưởng/Nhà máy:</span></T></label>
                        <button
                          type="button"
                          onClick={() => setIsLogsFactoryDropdownOpen(!isLogsFactoryDropdownOpen)}
                          className={`w-full bg-slate-50 border transition-all text-xs rounded px-2.5 py-1.5 text-slate-800 focus:outline-none cursor-pointer flex items-center justify-between gap-1.5 h-[30px] ${
                            logsFactories.length > 0
                              ? "border-sky-500 ring-1 ring-sky-300 bg-sky-50/50 font-bold text-sky-900"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <Building className={`w-3.5 h-3.5 shrink-0 ${logsFactories.length > 0 ? "text-sky-600" : "text-slate-400"}`} />
                            <span className="truncate text-left text-xs font-semibold">
                              <T>
                                <span translate="no" className="notranslate">
                                  {logsFactories.length === 0
                                    ? "Tất cả chi nhánh"
                                    : logsFactories.length === 1
                                    ? getFactoryDisplayName(logsFactories[0])
                                    : `${logsFactories.length} chi nhánh đã chọn`}
                                </span>
                              </T>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {logsFactories.length > 0 && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLogsFactories([]);
                                }}
                                title="Xóa chọn chi nhánh"
                                className="w-4 h-4 rounded-full bg-slate-200 hover:bg-rose-200 hover:text-rose-700 text-slate-600 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                ✕
                              </span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isLogsFactoryDropdownOpen ? "rotate-180 text-sky-600" : ""}`} />
                          </div>
                        </button>

                        {/* Dropdown Popover */}
                        {isLogsFactoryDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-500">
                              <T><span translate="no" className="notranslate">Chọn chi nhánh lọc:</span></T>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allBranchNames = scopedBranches.filter((b) => b.isScoring).map((b) => b.name);
                                    setLogsFactories(allBranchNames);
                                  }}
                                  className="text-sky-600 hover:text-sky-800 hover:underline cursor-pointer font-bold lowercase first-letter:uppercase"
                                >
                                  <T><span translate="no" className="notranslate">Tất cả</span></T>
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => setLogsFactories([])}
                                  className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer font-bold lowercase first-letter:uppercase"
                                >
                                  <T><span translate="no" className="notranslate">Bỏ chọn</span></T>
                                </button>
                              </div>
                            </div>

                            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {scopedBranches.filter((b) => b.isScoring).map((b) => {
                                const isSelected = logsFactories.some((f) => f === b.name || f === b.id || isSameBranchOrFactory(b.name, f));
                                const count = scopedReports.filter((r) => !r.isDeleted && r.isApproved !== false && matchFactory(r.factory, b.name)).length;

                                return (
                                  <div
                                    key={b.id}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setLogsFactories((prev) => {
                                        const exists = prev.some((f) => f === b.name || f === b.id || isSameBranchOrFactory(b.name, f));
                                        if (exists) {
                                          return prev.filter((f) => f !== b.name && f !== b.id && !isSameBranchOrFactory(b.name, f));
                                        } else {
                                          return [...prev, b.name];
                                        }
                                      });
                                    }}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
                                      isSelected
                                        ? "bg-sky-50 text-sky-950 font-bold border border-sky-200/80"
                                        : "hover:bg-slate-50 text-slate-700 font-medium border border-transparent"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pointer-events-none">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 pointer-events-none"
                                      />
                                      <span className="truncate">
                                        <T><span translate="no" className="notranslate">{getFactoryDisplayName(b.name)}</span></T>
                                      </span>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ml-1 pointer-events-none ${
                                      isSelected ? "bg-sky-200/70 text-sky-900" : "bg-slate-100 text-slate-500"
                                    }`}>
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-555 px-1 font-medium">
                              <span>
                                <T><span translate="no" className="notranslate">Đang chọn:</span></T>{" "}
                                <strong className="text-sky-700">{logsFactories.length === 0 ? "Tất cả" : `${logsFactories.length}/${scopedBranches.filter(b => b.isScoring).length}`}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsLogsFactoryDropdownOpen(false)}
                                className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
                              >
                                <T><span translate="no" className="notranslate">Đóng</span></T>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="select-none lg:col-span-2">
                        <label className="text-[9px] text-slate-555 font-extrabold uppercase block mb-1"><T><span translate="no" className="notranslate">Yếu tố 4M1E1I:</span></T></label>
                        <select
                          value={logsCategory}
                          onChange={(e) => setLogsCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs rounded p-1.5 text-slate-800 focus:outline-none cursor-pointer h-[30px]"
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

                      <div className="lg:col-span-3">
                        <button
                          type="button"
                          onClick={() => {
                            setLogsOnlyTaggedFilter(!logsOnlyTaggedFilter);
                            setLogsOnlyTransferredFilter(false);
                            setLogsProcessStatusFilter("ALL");
                          }}
                          className={`w-full h-[34px] px-2.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 leading-normal text-xs select-none ${
                            logsOnlyTaggedFilter
                              ? "bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-400 font-black scale-[1.02]"
                              : logsTaggedReportsCount > 0
                              ? "bg-purple-600 text-white border-purple-600 font-extrabold shadow-md ring-2 ring-purple-300 animate-bounce hover:bg-purple-700"
                              : "bg-purple-600 text-white border-purple-600 font-extrabold shadow-sm hover:bg-purple-700 animate-bounce"
                          }`}
                          title={`Việc của tôi: ${logsTaggedReportsCount} tổng số việc / ${logsTaggedCounts.resolved} việc đã hoàn thành (${logsTaggedCounts.unacked + logsTaggedCounts.processing} việc chưa hoàn thành)`}
                        >
                          <span className="text-yellow-300 font-black text-sm shrink-0 font-mono">@</span>
                          <span className="font-extrabold uppercase tracking-wide whitespace-nowrap leading-tight">
                            <span translate="no" className="notranslate">VIỆC CỦA TÔI</span>
                          </span>
                          <span className="text-[11px] font-mono font-black bg-purple-900/70 text-yellow-200 px-2 py-0.5 rounded-full shrink-0 border border-purple-400/30 shadow-inner">
                            <span title="Tổng số việc">{logsTaggedReportsCount}</span>
                            <span className="text-purple-300 font-normal mx-0.5">/</span>
                            <span className="text-emerald-300 font-black" title="Số việc đã hoàn thành">{logsTaggedCounts.resolved}</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Active Selected Branches Chip Indicator */}
                    {logsFactories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1 text-[11px] select-none">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                          <Building className="w-3 h-3 text-sky-600" />
                          <T><span translate="no" className="notranslate">Chi nhánh đang lọc:</span></T>
                        </span>
                        {logsFactories.map((fName) => (
                          <span
                            key={fName}
                            className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md font-bold text-[10px]"
                          >
                            <span translate="no" className="notranslate">{getFactoryDisplayName(fName)}</span>
                            <button
                              type="button"
                              onClick={() => setLogsFactories(logsFactories.filter(f => f !== fName))}
                              className="hover:text-red-600 text-sky-500 font-black cursor-pointer ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Data Table */}
                  <div className="bg-white rounded-xl border-2 border-slate-300 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100/90 text-[10.5px] text-slate-700 font-black uppercase tracking-wider border-b border-slate-300">
                            <th className="py-3.5 px-2 w-12 min-w-[48px] max-w-[48px] text-center border border-slate-300"><T><span translate="no" className="notranslate">STT</span></T></th>
                            <th className="py-3.5 px-3 w-[450px] min-w-[420px] max-w-[510px] text-center border border-slate-300"><T><span translate="no" className="notranslate">Thông tin ghi nhận</span></T></th>
                            <th className="py-3.5 px-4 min-w-[280px] text-center border border-slate-300"><T><span translate="no" className="notranslate">HÌNH ẢNH & TIẾN TRÌNH XỬ LÝ</span></T></th>
                            <th className="py-3.5 px-2 w-[85px] min-w-[80px] max-w-[95px] text-center border border-slate-300"><T><span translate="no" className="notranslate">Thao tác</span></T></th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-medium text-slate-700">
                          {finalLogsFilteredReports.length === 0 && (
                            <tr>
                              <td colSpan={4} className="py-12 text-center text-slate-400 text-xs italic border border-slate-300">
                                <T><span translate="no" className="notranslate">Không có bản tin nào phù hợp với bộ lọc hiện tại.</span></T>
                              </td>
                            </tr>
                          )}
                          {finalLogsFilteredReports
                            .map((r, index) => (
                              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-2 text-center font-mono font-bold text-slate-500 border border-slate-300 w-12 min-w-[48px] max-w-[48px] align-top bg-slate-50/30">{index + 1}</td>
                                
                                {/* Cột THÔNG TIN GHI NHẬN TÍCH HỢP TOÀN DIỆN (Logic từ trên xuống dưới tương tự mobile) */}
                                <td className="p-3 space-y-2.5 w-[450px] min-w-[420px] max-w-[510px] border border-slate-300 align-top">
                                  {/* 1. Header Information Box: Đơn vị + Phân loại badge + Người ghi nhận & Thời gian + Mã ID + Thanh chuyển giao liên công ty */}
                                  <div className="rounded-xl border border-slate-300 bg-gradient-to-b from-slate-50 to-white overflow-hidden shadow-2xs">
                                    {/* Top banner: Chi nhánh / Xưởng + Tag phân loại & Mã ID */}
                                    <div className="px-2.5 py-2 bg-transparent flex justify-between items-start gap-1.5">
                                      <div className="flex-1 min-w-0">
                                        <span className="font-black block leading-tight truncate text-[#1e3a8a] text-[11px]">
                                          <T><span translate="no" className="notranslate">{getFactoryDisplayName(r.factory)?.toUpperCase()}</span></T>
                                        </span>
                                        <div className="text-[10px] text-slate-600 font-extrabold mt-1 flex items-center flex-wrap gap-1">
                                          <div className="text-blue-700 font-black flex items-center gap-0.5">
                                            <UserIcon className="w-3 h-3 stroke-[2.5] text-blue-600 shrink-0" />
                                            <span translate="no" className="notranslate">{formatNameCapitalized(resolveUploaderInfo(users, r).fullName)}</span>
                                          </div>
                                          <span className="text-slate-300 font-normal">|</span>
                                          <span className="text-[9px] text-slate-400 font-mono font-semibold select-none">{r.timestamp}</span>
                                        </div>
                                      </div>

                                      <div className="shrink-0 flex flex-col items-end gap-1">
                                        {r.reportType === "RRO" ? (
                                          <span className="text-[8.5px] font-black text-white flex items-center gap-1 bg-blue-600 border border-blue-700 px-1.5 py-0.5 rounded-md leading-none shadow-3xs shrink-0 select-none">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                                            <T><span translate="no" className="notranslate">⚠️ RỦI RO (RRO)</span></T>
                                          </span>
                                        ) : r.reportType === "KNN" || (r.reportType === "KPH" && r.kphSubtype === "BN") ? (
                                          <span className="text-[8.5px] font-black text-white flex items-center gap-1 bg-red-600 border border-red-700 px-1.5 py-0.5 rounded-md leading-none shadow-3xs shrink-0 select-none">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                                            <T><span translate="no" className="notranslate">🚨 ĐIỂM KPH (BN)</span></T>
                                          </span>
                                        ) : r.reportType === "KPH" || r.isAbnormal ? (
                                          <span className="text-[8.5px] font-black text-white flex items-center gap-1 bg-amber-600 border border-amber-700 px-1.5 py-0.5 rounded-md leading-none shadow-3xs shrink-0 select-none">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                                            <T><span translate="no" className="notranslate">⚠️ ĐIỂM KPH (NB)</span></T>
                                          </span>
                                        ) : r.reportType === "DSA" || r.isSpotlight ? (
                                          <span className="text-[8.5px] font-black text-white flex items-center gap-1 bg-emerald-600 border border-emerald-700 px-1.5 py-0.5 rounded-md leading-none shadow-3xs shrink-0 select-none">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                                            <T><span translate="no" className="notranslate">⭐ ĐIỂM SÁNG (DSA)</span></T>
                                          </span>
                                        ) : (
                                          <span className="text-[8.5px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded select-none">
                                            <T><span translate="no" className="notranslate">NORMAL</span></T>
                                          </span>
                                        )}

                                        {r.reportCode && (
                                          <span className="text-[9px] text-slate-400 font-mono font-semibold select-none">
                                            <span translate="no" className="notranslate">ID: {r.reportCode}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Proposal Pending Banner */}
                                    {r.isApproved === false && (
                                      <div className="mx-2 mb-1.5 bg-amber-50/90 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center justify-between select-none">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                          <span className="text-[9px] font-black text-amber-800 uppercase tracking-wide truncate">
                                            <T><span translate="no" className="notranslate">Đề xuất chờ phê duyệt</span></T>
                                          </span>
                                        </div>
                                        
                                        {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER || isHQOrManagerUser(currentUser)) && (
                                          <div className="flex items-center gap-1 shrink-0">
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

                                                if (onUpdateReport) {
                                                  onUpdateReport({
                                                    ...r,
                                                    isApproved: true,
                                                    approvedBy: currentUser?.fullName || "Admin",
                                                    approvedAt: timeStr,
                                                    updateLogs: [...(r.updateLogs || []), `Phê duyệt tin bởi ${currentUser?.fullName || "Admin"} (${timeStr})`]
                                                  });
                                                }
                                                onShowToast?.("Đã duyệt đề xuất bài viết này lên Bản tin! 🎉", "success");
                                              }}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8.5px] px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer uppercase shadow-3xs border-none"
                                            >
                                              <Check className="w-2.5 h-2.5 stroke-[2.5px]" />
                                              <T><span translate="no" className="notranslate">Duyệt đăng</span></T>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (onDeleteReport) {
                                                  onDeleteReport(r.id, false);
                                                }
                                                onShowToast?.("Đã từ chối bài viết đề xuất! ♻️", "info");
                                              }}
                                              className="bg-rose-500 hover:bg-rose-600 text-white font-black text-[8.5px] px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer uppercase shadow-3xs border-none"
                                            >
                                              <X className="w-2.5 h-2.5 stroke-[2.5px]" />
                                              <T><span translate="no" className="notranslate">Từ chối</span></T>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Cross-Company Transfer Bar */}
                                    {(r.targetCompany || r.assignedCompany || (r.transferHistory && r.transferHistory.length > 0)) ? (
                                      <div className="border-t border-slate-150/80 bg-indigo-50/40 px-2.5 py-1 flex items-center justify-between text-[9px] select-none">
                                        <div className="flex items-center gap-1 min-w-0">
                                          <span className="px-1 py-0.2 rounded bg-indigo-600 text-white text-[7.5px] font-black uppercase tracking-wider shrink-0">
                                            🔄 Liên CTY
                                          </span>
                                          <span className="font-extrabold text-indigo-900 truncate text-[9px]">
                                            {r.targetCompany === "DNP" ? "Đã chuyển ➔ DNP thụ lý" : r.targetCompany === "TPP" ? "Đã chuyển ➔ TPP thụ lý" : `Đã chuyển ➔ ${r.targetCompany || r.assignedCompany} thụ lý`}
                                          </span>
                                        </div>
                                        {(() => {
                                          const isAllowed = canUserTransferDnpTpp(currentUser, r);
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!isAllowed) {
                                                  onShowToast?.("🔒 Chỉ người đăng, Trưởng bộ phận người đăng hoặc Admin mới có quyền đổi đơn vị!", "warning");
                                                  return;
                                                }
                                                setTransferCompanyModalReport(r);
                                                setTransferTargetCompany(r.targetCompany || "DNP");
                                              }}
                                              className={`font-extrabold text-[8px] border px-1.5 py-0.5 rounded transition-colors shrink-0 shadow-3xs ${
                                                isAllowed
                                                  ? "text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 border-indigo-300 cursor-pointer"
                                                  : "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-75"
                                              }`}
                                              title={isAllowed ? "Đổi đơn vị thụ lý liên công ty" : "Chỉ người đăng, Trưởng bộ phận người đăng hoặc Admin mới có quyền"}
                                            >
                                              ⚙️ Đổi đơn vị {!isAllowed && "🔒"}
                                            </button>
                                          );
                                        })()}
                                      </div>
                                    ) : (
                                      <div className="border-t border-slate-150/80 bg-slate-50/40 px-2.5 py-1 flex items-center justify-between text-[8.5px] select-none">
                                        <span className="text-slate-400 font-bold">
                                          Đơn vị gốc: <span className="text-slate-600 font-extrabold">{r.factory.includes("DNP") || r.factory.includes("BBM") || r.factory.includes("BBC") ? "DNP / BBM" : "TPP"}</span>
                                        </span>
                                        {(() => {
                                          const isAllowed = canUserTransferDnpTpp(currentUser, r);
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (!isAllowed) {
                                                  onShowToast?.("🔒 Chỉ người đăng, Trưởng bộ phận người đăng hoặc Admin mới có quyền chuyển DNP/TPP!", "warning");
                                                  return;
                                                }
                                                setTransferCompanyModalReport(r);
                                                const defaultTarget = (r.factory.includes("DNP") || r.factory.includes("BBM") || r.factory.includes("BBC")) ? "TPP" : "DNP";
                                                setTransferTargetCompany(defaultTarget);
                                              }}
                                              className={`font-bold text-[8px] border px-1.5 py-0.2 rounded transition-colors shrink-0 ${
                                                isAllowed
                                                  ? "text-slate-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border-slate-250 hover:border-indigo-300 cursor-pointer"
                                                  : "text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-75"
                                              }`}
                                              title={isAllowed ? "Chuyển DNP/TPP" : "Chỉ người đăng, Trưởng bộ phận người đăng hoặc Admin mới có quyền"}
                                            >
                                              🔄 Chuyển DNP/TPP {!isAllowed && "🔒"}
                                            </button>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>

                                  {/* 2. 4M1E1I Category Marker + Rating Trigger */}
                                  <div className="pb-0.5">
                                    <MobileReportRatingContainer
                                      report={r}
                                      currentUser={currentUser}
                                      onUpdateReport={onUpdateReport}
                                      categoryIcon={getCategoryIcon(r.category)}
                                      theme={desktopTheme}
                                      users={users}
                                    />
                                  </div>

                                  {/* 3. Tên sự vụ / Nội dung & Ghi chú */}
                                  <div className="space-y-1 pt-0.5">
                                    <div className="font-bold text-slate-900 text-xs leading-snug">
                                      <T>{(r.content || "").toUpperCase()}</T>
                                    </div>
                                    {r.notes && (
                                      <div className="text-[10px] text-slate-700 font-medium italic block border-l-2 border-emerald-500 pl-1.5 whitespace-pre-wrap break-words max-h-[100px] overflow-y-auto thin-scrollbar">
                                        <T>Ghi chú: {r.notes}</T>
                                      </div>
                                    )}
                                  </div>

                                  {/* 4. Cụm nút Phân tích AI & Thảo luận chuyên đề & Chỉ đạo điều hành */}
                                  <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                                    {(r.reportType === "KPH" || r.isAbnormal) && (
                                      <button
                                        onClick={() => handleAIAnalyze(r)}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm border border-blue-500/10 cursor-pointer hover:shadow active:scale-95 transition-all select-none uppercase tracking-wide"
                                      >
                                        <Bot className="w-3.5 h-3.5 text-blue-100" />
                                        <span translate="no" className="notranslate">5-WHYs & CƠ HỘI CẢI TIẾN</span>
                                      </button>
                                    )}

                                    {(r.reportType === "DSA" || r.isSpotlight) && (
                                      <button
                                        onClick={() => handleAIDsaAnalyze(r)}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[10px] rounded-lg shadow-sm border border-emerald-500/10 cursor-pointer hover:shadow active:scale-95 transition-all select-none uppercase tracking-wide"
                                      >
                                        <Bot className="w-3.5 h-3.5 text-emerald-100" />
                                        <span translate="no" className="notranslate">PHÂN TÍCH CƠ HỘI & THÁCH THỨC</span>
                                      </button>
                                    )}

                                    {/* Action Button: 🔥 Thảo luận chuyên đề */}
                                    {(() => {
                                      const existingTopic = topics.find(t => t.reportId === r.id || (r.reportCode && t.reportId === r.reportCode));
                                      const replyCount = existingTopic ? replies.filter(reply => reply.topicId === existingTopic.id).length : 0;
                                      const hasUserTaskInTopic = checkUserTaskInDiscussion(r, currentUser);

                                      if (existingTopic) {
                                        const isResolved = existingTopic.status === "RESOLVED";

                                        if (isResolved) {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedTopicId(existingTopic.id);
                                                setActiveTab("TRAO_ĐỔI");
                                                setForumSubTab("TOPICS");
                                              }}
                                              className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-300/80 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95 select-none uppercase tracking-wide"
                                              title="Chủ đề thảo luận đã được giải quyết / kết thúc"
                                            >
                                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <T>Đã giải quyết</T>
                                              <span className="bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full text-[9px] font-black">
                                                {replyCount}
                                              </span>
                                            </button>
                                          );
                                        }

                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedTopicId(existingTopic.id);
                                              setActiveTab("TRAO_ĐỔI");
                                              setForumSubTab("TOPICS");
                                            }}
                                            className={`w-full py-1.5 px-3 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95 select-none uppercase tracking-wide ${
                                              hasUserTaskInTopic
                                                ? "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white border border-red-400 shadow-sm animate-pulse"
                                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400/50 shadow-sm"
                                            }`}
                                            title={hasUserTaskInTopic ? "Bạn có đầu việc/được tag trong thảo luận này!" : "Mở phòng thảo luận chuyên đề của bản tin này"}
                                          >
                                            <Flame className="w-3.5 h-3.5 text-amber-100 shrink-0 animate-bounce" />
                                            <T>{hasUserTaskInTopic ? "Cần xử lý task" : "Vào thảo luận"}</T>
                                            <span className="bg-white/25 text-white px-1.5 py-0.2 rounded-full text-[9px] font-black">
                                              {replyCount}
                                            </span>
                                          </button>
                                        );
                                      }

                                      // Chưa có topic -> Cho phép tạo thảo luận
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEmergencyDiscussionModal(r)}
                                          className="w-full py-1.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer border border-rose-400/30 select-none uppercase tracking-wide"
                                          title="Khởi tạo thảo luận chuyên đề cho sự cố này"
                                        >
                                          <Flame className="w-3.5 h-3.5 text-rose-100 shrink-0" />
                                          <T>Thảo luận chuyên đề</T>
                                        </button>
                                      );
                                    })()}

                                    {/* Display directives history in Nhật ký table row */}
                                    {r.directives && r.directives.length > 0 && (
                                      <div className="space-y-1.5 block border-l-2 border-amber-500 pl-1.5 bg-amber-50/50 p-1.5 rounded">
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
                                  </div>

                                  {/* 6. Thích & Tiếp nhận / Nhân rộng */}
                                  <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                                    {/* Người thích */}
                                    <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                                      <span className="font-extrabold text-rose-600 uppercase flex items-center gap-1 shrink-0">
                                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                                        <T><span translate="no" className="notranslate">Người Thích:</span></T>
                                      </span>
                                      {r.likedBy && r.likedBy.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                                          {r.likedBy.map((name, i) => (
                                            <span key={i} className="bg-rose-50 text-rose-700 text-[8px] px-1.5 py-0.2 rounded border border-rose-100 font-bold truncate max-w-[130px]" title={name}>
                                              <T><span translate="no" className="notranslate">{name}</span></T>
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic text-[9px]"><T><span translate="no" className="notranslate">Chưa có</span></T></span>
                                      )}
                                    </div>

                                    {/* Tiếp nhận / Nhân rộng */}
                                    <div className="text-[9px]">
                                      <div className={`font-extrabold uppercase mb-1 flex items-center gap-1 ${
                                        r.reportType === "DSA" || r.isSpotlight ? "text-emerald-700" : "text-blue-700"
                                      }`}>
                                        {r.reportType === "DSA" || r.isSpotlight ? (
                                          <Award className="w-3 h-3 text-emerald-500 shrink-0" />
                                        ) : (
                                          <Share2 className="w-3 h-3 text-blue-500 shrink-0" />
                                        )}
                                        <span translate="no" className="notranslate">
                                          {r.reportType === "DSA" || r.isSpotlight ? "Biểu dương / Nhân rộng" : "Tiếp nhận / Nhân rộng"}
                                        </span>
                                      </div>

                                      {r.reportType === "KPH" || r.isAbnormal ? (
                                        r.sharedBy && r.sharedBy.length > 0 ? (
                                          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                                            {r.sharedBy.map((name, i) => {
                                              let deptName = name;
                                              const firstParenIndex = name.indexOf(" (");
                                              if (firstParenIndex !== -1) {
                                                let rawDept = name.substring(firstParenIndex + 2).trim();
                                                if (rawDept.endsWith(")")) rawDept = rawDept.slice(0, -1).trim();
                                                deptName = rawDept;
                                              } else {
                                                const firstParenIndexNoSpace = name.indexOf("(");
                                                if (firstParenIndexNoSpace !== -1) {
                                                  let rawDept = name.substring(firstParenIndexNoSpace + 1).trim();
                                                  if (rawDept.endsWith(")")) rawDept = rawDept.slice(0, -1).trim();
                                                  deptName = rawDept;
                                                }
                                              }
                                              const resForDept = r.resolutions?.find(
                                                (res) => res.departmentName.trim().toLowerCase() === deptName.trim().toLowerCase()
                                              );

                                              return (
                                                <div key={i} className="flex items-center justify-between gap-1 bg-slate-50 p-1 rounded border border-slate-150 text-[8.5px]">
                                                  <span translate="no" className="notranslate font-bold text-slate-700 truncate max-w-[130px]" title={name}>
                                                    {name}
                                                  </span>
                                                  {resForDept ? (
                                                    <span translate="no" className={`notranslate text-[7.5px] font-black px-1 py-0.2 rounded border uppercase shrink-0 ${
                                                      resForDept.status === "Đã xử lý"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`} title={`Nội dung: ${resForDept.resultText} (Cập nhật lúc: ${resForDept.updatedAt})`}>
                                                      {resForDept.status === "Đã xử lý" ? "✓ Xong" : "⏳ Trì"}
                                                    </span>
                                                  ) : (
                                                    <span translate="no" className="notranslate text-[7.5px] text-slate-400 italic shrink-0">
                                                      Chưa xử lý
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <span translate="no" className="notranslate text-slate-400 text-[8.5px] italic">Chưa tiếp nhận</span>
                                        )
                                      ) : (
                                        r.replications && r.replications.length > 0 ? (
                                          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                                            {r.replications.map((rep) => (
                                              <div key={rep.id} className="flex items-center justify-between gap-1 bg-emerald-50/30 p-1 rounded border border-emerald-100 text-[8.5px]">
                                                <span translate="no" className="notranslate font-bold text-emerald-900 truncate max-w-[130px]" title={`${rep.factoryName} - ${rep.departmentName}`}>
                                                  {rep.factoryName} - {rep.departmentName}
                                                </span>
                                                <span translate="no" className={`notranslate text-[7.5px] font-black px-1 py-0.2 rounded border uppercase shrink-0 ${
                                                  rep.status === "Đã hoàn thành"
                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                    : rep.status === "Đang triển khai"
                                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                                    : "bg-sky-100 text-sky-800 border-sky-300"
                                                }`}>
                                                  {rep.status === "Đã hoàn thành" ? "✓ Xong" : rep.status === "Đang triển khai" ? "⏳ Chạy" : "📝 Chuẩn"}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span translate="no" className="notranslate text-slate-400 text-[8.5px] italic">Chưa tiếp nhận</span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3 leading-relaxed text-slate-900 min-w-[280px] border border-slate-300 align-top">
                                  {/* Hình ảnh minh chứng đặt phía trên nội dung (tương tự giao diện điện thoại) */}
                                  <div className="w-full">
                                    <DesktopThumbnailSlider 
                                      imageUrls={r.imageUrls && r.imageUrls.length > 0 ? r.imageUrls : [r.imageUrl || getCategoryFallbackImage(r.category)]} 
                                      fallbackUrl={r.imageUrl || getCategoryFallbackImage(r.category)} 
                                    />
                                  </div>

                                  {/* TIẾN TRÌNH XỬ LÝ (TIMELINE) bên dưới hình ảnh */}
                                  <DesktopIncidentTimeline
                                    report={r}
                                    currentUser={currentUser}
                                    onUpdateReport={onUpdateReport}
                                    onAddBroadcast={onAddBroadcast}
                                    onShowToast={(msg) => onShowToast && onShowToast(msg, "info")}
                                  />

                                  {(r.reportType === "KPH" || r.isAbnormal) && isQcFeatureEnabled && (
                                    <div className="mt-2.5">
                                      <DesktopQCConfirmation
                                        r={r}
                                        currentUser={currentUser}
                                        errorCatalog={errorCatalog}
                                        onUpdateReport={onUpdateReport}
                                        onAddErrorCatalogItem={onAddErrorCatalogItem}
                                      />
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-2 text-center select-none whitespace-nowrap border border-slate-300 w-[85px] min-w-[80px] max-w-[95px] align-top bg-slate-50/20">
                                  <div className="flex flex-col items-center justify-center gap-1.5 mx-auto">
                                    {isDeleteReportAllowed(r) && (
                                      <button
                                        onClick={() => {
                                          if (onDeleteReport) {
                                            onDeleteReport(r.id, false);
                                            if (onShowToast) {
                                              onShowToast("Đã chuyển báo cáo vào Thùng rác lưu trữ tạm thời! 🗑️", "warning");
                                            }
                                          }
                                        }}
                                        className="w-full p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-850 border border-rose-200 rounded text-[10px] font-extrabold cursor-pointer transition-all uppercase flex items-center justify-center gap-1 mx-auto shadow-2xs"
                                        title="Chuyển vào Thùng rác"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <T><span translate="no" className="notranslate font-black">Xóa</span></T>
                                      </button>
                                    )}

                                    {isEditReportAllowed(r) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onEditReport) {
                                            onEditReport(r);
                                          }
                                        }}
                                        className="w-full p-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 border border-blue-200 rounded text-[10px] font-extrabold cursor-pointer transition-all uppercase flex items-center justify-center gap-1 mx-auto shadow-2xs"
                                        title="Chỉnh sửa bản tin 4M1E1I"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <T><span translate="no" className="notranslate font-black">Sửa</span></T>
                                      </button>
                                    )}

                                    {!isDeleteReportAllowed(r) && !isEditReportAllowed(r) && (
                                      <span className="text-slate-400 text-[10px] italic">-</span>
                                    )}
                                  </div>
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

          {/* TAB 4.5: FORM CAPA (ISO Management Hub) */}
          {activeTab === "FORM_CAPA" && (
            <CapaManagementHub
              reports={scopedReports}
              currentUser={currentUser}
              users={scopedUsers}
              branches={scopedBranches}
              onShowToast={onShowToast}
            />
          )}

          {/* TAB: TIẾN TRÌNH THỬ NGHIỆM (Shopee Stepper Hub) */}
          {activeTab === "THỬ_NGHIỆM" && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] overflow-y-auto pr-1">
              <TrialTrackingHub
                currentUser={currentUser}
                branches={scopedBranches}
                departments={departments}
                users={scopedUsers}
                showToast={(msg) => onShowToast && onShowToast(msg, "info")}
              />
            </div>
          )}

          {/* TAB 5: KHO TRI THỨC AI (Tiêu chuẩn quốc tế & Quy trình nội bộ từng nhà máy) */}
          {activeTab === "QUY_CHẾ" && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] overflow-y-auto pr-1">
              <AiKnowledgeBaseHub
                knowledgeDocs={knowledgeDocs}
                branches={scopedBranches}
                currentUser={currentUser}
                onAddDoc={onAddKnowledgeDoc || (() => {})}
                onUpdateDoc={onUpdateKnowledgeDoc || (() => {})}
                onDeleteDoc={onDeleteKnowledgeDoc || (() => {})}
                onShowToast={onShowToast}
              />
            </div>
          )}

          {/* TAB 6: CÁ NHÂN (User profile) */}
          {activeTab === "CÁ_NHÂN" && (() => {
            const isMyCreated = (r: QualityReport) => {
              if (!r || r.isDeleted) return false;
              return (
                (currentUser?.id && r.uploaderId === currentUser.id) ||
                (currentUser?.phone && r.uploaderPhone === currentUser.phone) ||
                (currentUser?.fullName && r.uploaderName?.toLowerCase() === currentUser.fullName.toLowerCase())
              );
            };

            const isMyAssigned = (r: QualityReport) => {
              if (!r || r.isDeleted) return false;
              const userName = (currentUser?.fullName || "").toLowerCase();
              const userDept = (currentUser?.department || "").toLowerCase();
              const userPhone = currentUser?.phone || "";
              const userId = (currentUser?.id || "").toLowerCase();

              return (r.directives || []).some((d) => {
                const dText = (d.text || "").toLowerCase();
                const dAuthor = (d.author || "").toLowerCase();
                const dAckBy = (d.acknowledgedBy || "").toLowerCase();
                return (
                  (userName && (dText.includes(userName) || dAckBy.includes(userName))) ||
                  (userDept && (dText.includes(userDept) || dAckBy.includes(userDept))) ||
                  (userId && dText.includes(userId))
                );
              });
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

            const myReports = reports.filter((r) => isMyCreated(r));
            const myAllTasks = reports.filter((r) => !r.isDeleted && (isMyCreated(r) || isMyAssigned(r) || isMyResolved(r)));
            const myBroadcasts = (broadcasts || []).filter(
              (b) => b.sender === currentUser?.fullName || currentUser?.role === UserRole.ADMIN
            );

            const handleExportPersonalTasksToExcel = async (tasksToExport: QualityReport[]) => {
              if (!tasksToExport || tasksToExport.length === 0) {
                onShowToast?.("Không có dữ liệu đầu việc nào để xuất Excel!", "warning");
                return;
              }

              try {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("DS Viec Cua Toi");

                worksheet.columns = [
                  { header: "STT", key: "stt", width: 8 },
                  { header: "Mã báo cáo", key: "reportCode", width: 16 },
                  { header: "Phân loại 4M1E1I", key: "category", width: 18 },
                  { header: "Loại hình", key: "reportType", width: 14 },
                  { header: "Vai trò của tôi", key: "role", width: 22 },
                  { header: "Nội dung vấn đề", key: "content", width: 42 },
                  { header: "Ghi chú bổ sung", key: "notes", width: 26 },
                  { header: "Chi nhánh / Nhà máy", key: "factory", width: 22 },
                  { header: "Bộ phận", key: "department", width: 18 },
                  { header: "Người tạo", key: "uploaderName", width: 20 },
                  { header: "SĐT Người tạo", key: "uploaderPhone", width: 16 },
                  { header: "Thời gian (dd/mm/yy)", key: "timestamp", width: 20 },
                  { header: "Trạng thái", key: "status", width: 18 },
                  { header: "Số chỉ đạo", key: "directivesCount", width: 14 },
                  { header: "Số giải pháp", key: "resolutionsCount", width: 14 }
                ];

                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 };
                headerRow.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FF1E3A8A" }
                };
                headerRow.alignment = { vertical: "middle", horizontal: "center" };
                headerRow.height = 26;

                tasksToExport.forEach((r, idx) => {
                  const isCreated = isMyCreated(r);
                  const isAssigned = isMyAssigned(r);
                  const isResolved = isMyResolved(r);
                  const roleStr: string[] = [];
                  if (isCreated) roleStr.push("Người tạo");
                  if (isAssigned) roleStr.push("Được chỉ đạo");
                  if (isResolved) roleStr.push("Tham gia GP");
                  const myRole = roleStr.join(" & ") || "Người liên quan";

                  const hasResolutions = (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed;
                  const isClosed = r.qcConfirmed;
                  const statusStr = isClosed ? "Đã đóng hoàn tất" : hasResolutions ? "Đã có giải pháp" : "Đang xử lý";

                  const row = worksheet.addRow({
                    stt: idx + 1,
                    reportCode: r.reportCode || r.id.substring(0, 8).toUpperCase(),
                    category: r.category || "",
                    reportType: r.reportType || "KPH",
                    role: myRole,
                    content: r.content || "",
                    notes: r.notes || "",
                    factory: r.factory || "",
                    department: r.uploaderDepartment || "",
                    uploaderName: r.uploaderName || "",
                    uploaderPhone: r.uploaderPhone || "",
                    timestamp: r.timestamp || "",
                    status: statusStr,
                    directivesCount: r.directives?.length || 0,
                    resolutionsCount: r.resolutions?.length || 0
                  });

                  row.font = { name: "Arial", size: 9 };
                  row.alignment = { vertical: "middle", wrapText: true };
                });

                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const now = new Date();
                const dd = String(now.getDate()).padStart(2, "0");
                const mm = String(now.getMonth() + 1).padStart(2, "0");
                const yy = String(now.getFullYear()).slice(-2);
                a.download = `Danh_sach_viec_cua_toi_${dd}_${mm}_${yy}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);
                onShowToast?.("Đã xuất danh sách việc của bạn ra file Excel thành công! 📊", "success");
              } catch (err: any) {
                console.error("Lỗi xuất Excel:", err);
                onShowToast?.("Không thể xuất file Excel: " + (err.message || "Lỗi không xác định"), "error");
              }
            };
            return (
              <div className="space-y-6">
                {/* Header Banner - White, bright & elegant style */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                        <T>TRANG CÁ NHÂN & HỒ SƠ TÀI KHOẢN</T>
                      </h1>
                      <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                        <T>Cập nhật thông tin đăng ký, mật khẩu bảo mật và ảnh đại diện của bạn.</T>
                      </p>
                    </div>
                  </div>
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
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-500 font-bold focus:outline-none cursor-not-allowed"
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
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-850 font-semibold focus:outline-none shadow-xs transition-colors"
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

                {/* Redesigned Tabbed Management Area: Personal 4M1E1I Reports, My Tasks Table & Announcements */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans w-full space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setPersonalTab("4M1E1I")}
                        className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                          personalTab === "4M1E1I" 
                            ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs" 
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <T>ĐÓNG GÓP CỦA TÔI</T> ({myReports.length})
                      </button>

                      <button
                        onClick={() => setPersonalTab("MY_TASKS")}
                        className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
                          personalTab === "MY_TASKS" 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold" 
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <T>DANH SÁCH CHI TIẾT VIỆC CỦA TÔI</T> ({myAllTasks.length})
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
                    <PersonalContributionTab
                      currentUser={currentUser}
                      reports={reports}
                      users={users}
                      companies={companies}
                      branches={branches}
                      departments={departments}
                      onSwitchToTasks={() => setPersonalTab("MY_TASKS")}
                      onUpdateReport={onUpdateReport}
                      onDeleteReport={onDeleteReport}
                      onShowToast={onShowToast}
                    />
                  ) : personalTab === "MY_TASKS" ? (
                    // DANH SÁCH CHI TIẾT VIỆC CỦA TÔI
                    (() => {
                      // 1. Filter by Scope
                      const scopedReports = myAllTasks.filter((r) => {
                        if (personalTaskScope === "CREATED") return isMyCreated(r);
                        if (personalTaskScope === "ASSIGNED") return isMyAssigned(r);
                        if (personalTaskScope === "RESOLVED") return isMyResolved(r);
                        return true; // "ALL"
                      });

                      // 2. Filter by Status, Category, Type, Search
                      const filteredMyReports = scopedReports.filter((r) => {
                        const hasResolutions = (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed;
                        const isClosed = r.qcConfirmed;

                        // Status filter
                        if (personalTaskStatusFilter === "RESOLVED" && !hasResolutions) return false;
                        if (personalTaskStatusFilter === "IN_PROGRESS" && (hasResolutions || isClosed)) return false;
                        if (personalTaskStatusFilter === "CLOSED" && !isClosed) return false;

                        // Category filter
                        if (personalTaskCategoryFilter !== "ALL" && r.category !== personalTaskCategoryFilter) return false;

                        // Type filter
                        if (personalTaskTypeFilter !== "ALL") {
                          const rType = r.reportType || "KPH";
                          if (personalTaskTypeFilter === "KPH" && rType !== "KPH") return false;
                          if (personalTaskTypeFilter === "DSA" && rType !== "DSA") return false;
                          if (personalTaskTypeFilter === "OTHER" && (rType === "KPH" || rType === "DSA")) return false;
                        }

                        // Search term
                        if (personalTaskSearchTerm.trim()) {
                          const term = personalTaskSearchTerm.toLowerCase();
                          const matchContent = (r.content || "").toLowerCase().includes(term);
                          const matchFactory = (r.factory || "").toLowerCase().includes(term);
                          const matchDepartment = (r.uploaderDepartment || "").toLowerCase().includes(term);
                          const matchCategory = (r.category || "").toLowerCase().includes(term);
                          const matchUploader = (r.uploaderName || "").toLowerCase().includes(term);
                          const matchId = (r.reportCode || r.id || "").toLowerCase().includes(term);
                          const matchNotes = (r.notes || "").toLowerCase().includes(term);
                          if (!matchContent && !matchFactory && !matchDepartment && !matchCategory && !matchUploader && !matchId && !matchNotes) {
                            return false;
                          }
                        }
                        return true;
                      });

                      // Counts for quick KPI stats
                      const countTotal = scopedReports.length;
                      const countInProgress = scopedReports.filter((r) => !(r.resolutions && r.resolutions.length > 0) && !r.qcConfirmed).length;
                      const countResolved = scopedReports.filter((r) => (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed).length;
                      const countClosed = scopedReports.filter((r) => r.qcConfirmed).length;
                      const countDSA = scopedReports.filter((r) => r.reportType === "DSA").length;

                      const resetFilters = () => {
                        setPersonalTaskScope("ALL");
                        setPersonalTaskStatusFilter("ALL");
                        setPersonalTaskCategoryFilter("ALL");
                        setPersonalTaskTypeFilter("ALL");
                        setPersonalTaskSearchTerm("");
                      };

                      return (
                        <div className="space-y-4">
                          {/* Scope Tabs: Tất cả / Tôi tạo / Được chỉ đạo / Tham gia GP */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setPersonalTaskScope("ALL")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  personalTaskScope === "ALL"
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <ListTodo className="w-3.5 h-3.5" />
                                <T>Tất cả việc của tôi</T> ({myAllTasks.length})
                              </button>

                              <button
                                type="button"
                                onClick={() => setPersonalTaskScope("CREATED")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  personalTaskScope === "CREATED"
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <T>Tôi đã tạo</T> ({myReports.length})
                              </button>

                              <button
                                type="button"
                                onClick={() => setPersonalTaskScope("ASSIGNED")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  personalTaskScope === "ASSIGNED"
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <T>Được chỉ đạo / Phân công</T> ({myAllTasks.filter(isMyAssigned).length})
                              </button>

                              <button
                                type="button"
                                onClick={() => setPersonalTaskScope("RESOLVED")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  personalTaskScope === "RESOLVED"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <T>Tôi tham gia giải pháp</T> ({myAllTasks.filter(isMyResolved).length})
                              </button>
                            </div>

                            {/* Export Excel & Reset Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleExportPersonalTasksToExcel(filteredMyReports)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                                title="Xuất danh sách đang lọc ra file Excel"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                <T>Xuất Excel</T>
                              </button>
                              {(personalTaskStatusFilter !== "ALL" || personalTaskCategoryFilter !== "ALL" || personalTaskTypeFilter !== "ALL" || personalTaskSearchTerm.trim() !== "" || personalTaskScope !== "ALL") && (
                                <button
                                  type="button"
                                  onClick={resetFilters}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  title="Đặt lại tất cả bộ lọc"
                                >
                                  <RotateCcw className="w-3 h-3 text-slate-500" />
                                  <T>Đặt lại</T>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* KPI Summary Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <T>Tổng việc</T>
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-slate-800">{countTotal}</span>
                                <span className="text-[10px] text-slate-400 font-semibold"><T>hồ sơ</T></span>
                              </div>
                            </div>

                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-col justify-between">
                              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                                <T>Đang xử lý</T>
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-amber-800">{countInProgress}</span>
                                <span className="text-[10px] text-amber-600 font-semibold"><T>chưa GP</T></span>
                              </div>
                            </div>

                            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex flex-col justify-between">
                              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                                <T>Đã có giải pháp</T>
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-emerald-800">{countResolved}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold"><T>có GP</T></span>
                              </div>
                            </div>

                            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-col justify-between">
                              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                                <T>Đã đóng hoàn tất</T>
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-blue-800">{countClosed}</span>
                                <span className="text-[10px] text-blue-600 font-semibold"><T>đã duyệt</T></span>
                              </div>
                            </div>

                            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
                              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                                <T>Điểm sáng DSA</T>
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-xl font-black text-purple-800">{countDSA}</span>
                                <span className="text-[10px] text-purple-600 font-semibold"><T>cải tiến</T></span>
                              </div>
                            </div>
                          </div>

                          {/* Multi-Filter Bar: Status + Category + Type + Search */}
                          <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap flex-1">
                              {/* Status Filter */}
                              <div className="inline-flex rounded-lg p-0.5 bg-slate-200 border border-slate-300/70 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setPersonalTaskStatusFilter("ALL")}
                                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    personalTaskStatusFilter === "ALL"
                                      ? "bg-white text-slate-800 shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  <T>Tất cả</T>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPersonalTaskStatusFilter("IN_PROGRESS")}
                                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    personalTaskStatusFilter === "IN_PROGRESS"
                                      ? "bg-amber-500 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  <T>Đang xử lý</T>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPersonalTaskStatusFilter("RESOLVED")}
                                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    personalTaskStatusFilter === "RESOLVED"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  <T>Có giải pháp</T>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPersonalTaskStatusFilter("CLOSED")}
                                  className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                    personalTaskStatusFilter === "CLOSED"
                                      ? "bg-blue-600 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  <T>Đã đóng</T>
                                </button>
                              </div>

                              {/* Category Filter */}
                              <select
                                value={personalTaskCategoryFilter}
                                onChange={(e) => setPersonalTaskCategoryFilter(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="ALL">-- Tất cả 4M1E1I --</option>
                                <option value="CON NGƯỜI">Con người (Man)</option>
                                <option value="MÁY MÓC">Máy móc (Machine)</option>
                                <option value="NGUYÊN VẬT LIỆU">Nguyên vật liệu (Material)</option>
                                <option value="PHƯƠNG PHÁP">Phương pháp (Method)</option>
                                <option value="MÔI TRƯỜNG">Môi trường (Environment)</option>
                                <option value="THÔNG TIN">Thông tin (Information)</option>
                              </select>

                              {/* Type Filter */}
                              <select
                                value={personalTaskTypeFilter}
                                onChange={(e) => setPersonalTaskTypeFilter(e.target.value)}
                                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="ALL">-- Tất cả loại hình --</option>
                                <option value="KPH">Sự cố KPH</option>
                                <option value="DSA">Điểm sáng DSA</option>
                                <option value="OTHER">Khác</option>
                              </select>
                            </div>

                            {/* Search box */}
                            <div className="relative w-full md:w-64 shrink-0">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={personalTaskSearchTerm}
                                onChange={(e) => setPersonalTaskSearchTerm(e.target.value)}
                                placeholder="Tìm mã, nội dung, bộ phận..."
                                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                              />
                              {personalTaskSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setPersonalTaskSearchTerm("")}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Table Container */}
                          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                            <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                  <T>DANH SÁCH CHI TIẾT VIỆC CỦA TÔI ({filteredMyReports.length})</T>
                                </h3>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                <T>Hiển thị</T> <strong className="text-slate-800">{filteredMyReports.length}</strong> / <strong className="text-slate-600">{scopedReports.length}</strong> <T>báo cáo</T>
                              </span>
                            </div>

                            {filteredMyReports.length === 0 ? (
                              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                                <FileText className="w-8 h-8 opacity-40 text-slate-400" />
                                <span className="text-xs font-bold">
                                  <T>Không tìm thấy báo cáo nào khớp với bộ lọc hiện tại.</T>
                                </span>
                                {(personalTaskStatusFilter !== "ALL" || personalTaskCategoryFilter !== "ALL" || personalTaskTypeFilter !== "ALL" || personalTaskSearchTerm.trim() !== "" || personalTaskScope !== "ALL") && (
                                  <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    <T>Đặt lại bộ lọc</T>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                      <th className="py-2.5 px-3">#</th>
                                      <th className="py-2.5 px-3"><T>MÃ BÁO CÁO</T></th>
                                      <th className="py-2.5 px-3"><T>PHÂN LOẠI 4M1E1I</T></th>
                                      <th className="py-2.5 px-3"><T>VAI TRÒ CỦA TÔI</T></th>
                                      <th className="py-2.5 px-3 min-w-[220px]"><T>NỘI DUNG VẤN ĐỀ</T></th>
                                      <th className="py-2.5 px-3"><T>NHÀ MÁY / BỘ PHẬN</T></th>
                                      <th className="py-2.5 px-3"><T>NGÀY GỬI (dd/mm/yy)</T></th>
                                      <th className="py-2.5 px-3"><T>TIẾN ĐỘ / TRẠNG THÁI</T></th>
                                      <th className="py-2.5 px-3 text-center"><T>CHỈ ĐẠO & GP</T></th>
                                      <th className="py-2.5 px-3 text-right"><T>THAO TÁC</T></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {filteredMyReports.map((r, index) => {
                                      const isCreated = isMyCreated(r);
                                      const isAssigned = isMyAssigned(r);
                                      const isResolved = isMyResolved(r);
                                      const hasResolutions = (r.resolutions && r.resolutions.length > 0) || r.qcConfirmed;
                                      const isClosed = r.qcConfirmed;
                                      const directivesCount = r.directives?.length || 0;
                                      const resolutionsCount = r.resolutions?.length || 0;

                                      return (
                                        <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                                          {/* STT */}
                                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                                            {index + 1}
                                          </td>

                                          {/* Mã báo cáo & Loại hình */}
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => setSelectedPersonalTaskReport(r)}
                                                className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline text-[11px] text-left cursor-pointer"
                                                title="Xem chi tiết báo cáo"
                                              >
                                                {r.reportCode || r.id.substring(0, 8).toUpperCase()}
                                              </button>
                                              {r.reportType === "DSA" ? (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                                                  DSA
                                                </span>
                                              ) : (
                                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                                                  KPH
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Phân loại 4M1E1I */}
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-700">
                                              {getCategoryIcon(r.category)}
                                              <span>{r.category}</span>
                                            </span>
                                          </td>

                                          {/* Vai trò của tôi */}
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1 flex-wrap">
                                              {isCreated && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                  <T>Người tạo</T>
                                                </span>
                                              )}
                                              {isAssigned && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                  <T>Được chỉ đạo</T>
                                                </span>
                                              )}
                                              {isResolved && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  <T>Đã đăng GP</T>
                                                </span>
                                              )}
                                              {!isCreated && !isAssigned && !isResolved && (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-slate-500 bg-slate-100">
                                                  <T>Liên quan</T>
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Nội dung vấn đề */}
                                          <td className="py-2.5 px-3">
                                            <p
                                              onClick={() => setSelectedPersonalTaskReport(r)}
                                              className="text-slate-800 font-medium line-clamp-2 leading-relaxed max-w-md cursor-pointer hover:text-blue-700"
                                              title={r.content}
                                            >
                                              {r.content}
                                            </p>
                                          </td>

                                          {/* Nhà máy / Bộ phận */}
                                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                                            <span className="font-semibold text-slate-700">{r.factory || "—"}</span>
                                            {r.uploaderDepartment && (
                                              <span className="text-slate-400 text-[10px] block">
                                                {r.uploaderDepartment}
                                              </span>
                                            )}
                                          </td>

                                          {/* Ngày gửi (dd/mm/yy) */}
                                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[10px] text-slate-500">
                                            {r.timestamp || "—"}
                                          </td>

                                          {/* Tiến độ / Trạng thái */}
                                          <td className="py-2.5 px-3 whitespace-nowrap">
                                            {isClosed ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                                <CheckCircle className="w-3 h-3 text-blue-600" />
                                                <T>Đã đóng</T>
                                              </span>
                                            ) : hasResolutions ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <T>Đã có GP</T>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                                <Clock className="w-3 h-3 text-amber-600" />
                                                <T>Đang xử lý</T>
                                              </span>
                                            )}
                                          </td>

                                          {/* Chỉ đạo & Giải pháp counters */}
                                          <td className="py-2.5 px-3 whitespace-nowrap text-center">
                                            <div className="inline-flex items-center gap-1 text-[10px] font-bold">
                                              <span
                                                className={`px-1.5 py-0.5 rounded border ${
                                                  directivesCount > 0
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                }`}
                                                title={`${directivesCount} chỉ đạo`}
                                              >
                                                ⚡ {directivesCount}
                                              </span>
                                              <span
                                                className={`px-1.5 py-0.5 rounded border ${
                                                  resolutionsCount > 0
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                                }`}
                                                title={`${resolutionsCount} giải pháp`}
                                              >
                                                💡 {resolutionsCount}
                                              </span>
                                            </div>
                                          </td>

                                          {/* Thao tác */}
                                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                              {/* Xem chi tiết */}
                                              <button
                                                type="button"
                                                onClick={() => setSelectedPersonalTaskReport(r)}
                                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 transition-colors cursor-pointer"
                                                title="Xem chi tiết báo cáo"
                                              >
                                                <Eye className="w-3 h-3" />
                                              </button>

                                              {/* Sửa (chỉ nếu có quyền & trong thời hạn 15 ngày) */}
                                              {isEditReportAllowed(r) && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingPersonalReportId(r.id);
                                                    setEditingPersonalReportText(r.content);
                                                    setPersonalTab("4M1E1I");
                                                  }}
                                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors cursor-pointer"
                                                  title="Sửa nội dung"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </button>
                                              )}

                                              {/* Xóa (chỉ nếu có quyền & trong thời hạn 15 ngày) */}
                                              {isDeleteReportAllowed(r) && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (onDeleteReport) {
                                                      onDeleteReport(r.id, false);
                                                      onShowToast?.("Đã xóa báo cáo 4M1E1I của bạn! 🗑️", "success");
                                                    }
                                                  }}
                                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                                                  title="Xóa báo cáo"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Quick-View Modal for Selected Personal Task Report */}
                          {selectedPersonalTaskReport && (
                            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {/* Modal Header */}
                                <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                                      <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-sm sm:text-base font-black tracking-tight text-white font-mono">
                                          {selectedPersonalTaskReport.reportCode || selectedPersonalTaskReport.id.substring(0, 8).toUpperCase()}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                          selectedPersonalTaskReport.reportType === "DSA"
                                            ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                                            : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                                        }`}>
                                          {selectedPersonalTaskReport.reportType || "KPH"}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-300 mt-0.5">
                                        <T>Chi tiết đầu việc & tiến độ giải quyết 4M1E1I</T>
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPersonalTaskReport(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-5 overflow-y-auto space-y-5 flex-1 font-sans text-xs">
                                  {/* Info Badges Grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        <T>Phân loại 4M1E1I</T>
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800">
                                        {getCategoryIcon(selectedPersonalTaskReport.category)}
                                        <span>{selectedPersonalTaskReport.category}</span>
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        <T>Trạng thái</T>
                                      </span>
                                      <div className="mt-1">
                                        {selectedPersonalTaskReport.qcConfirmed ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                            <CheckCircle className="w-3 h-3 text-blue-600" />
                                            <T>Đã đóng hoàn tất</T>
                                          </span>
                                        ) : (selectedPersonalTaskReport.resolutions && selectedPersonalTaskReport.resolutions.length > 0) ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <T>Đã có giải pháp</T>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                            <Clock className="w-3 h-3 text-amber-600" />
                                            <T>Đang xử lý</T>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        <T>Chi nhánh / Bộ phận</T>
                                      </span>
                                      <span className="font-semibold text-slate-800 mt-1 block">
                                        {selectedPersonalTaskReport.factory || "—"}
                                        {selectedPersonalTaskReport.uploaderDepartment ? ` / ${selectedPersonalTaskReport.uploaderDepartment}` : ""}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        <T>Ngày gửi (dd/mm/yy)</T>
                                      </span>
                                      <span className="font-mono text-slate-700 mt-1 block">
                                        {selectedPersonalTaskReport.timestamp || "—"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Người gửi */}
                                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                        {selectedPersonalTaskReport.uploaderName ? selectedPersonalTaskReport.uploaderName.charAt(0).toUpperCase() : "U"}
                                      </div>
                                      <div>
                                        <span className="font-bold text-slate-800 block text-xs">
                                          {selectedPersonalTaskReport.uploaderName || "Người dùng"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          {selectedPersonalTaskReport.uploaderPhone || "—"}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      <T>Tác giả báo cáo</T>
                                    </span>
                                  </div>

                                  {/* Nội dung vấn đề */}
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                                      <T>Nội dung chi tiết biến động / sự cố</T>
                                    </h4>
                                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                                      {selectedPersonalTaskReport.content}
                                    </div>
                                  </div>

                                  {/* Ghi chú bổ sung (nếu có) */}
                                  {selectedPersonalTaskReport.notes && (
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5 text-slate-500" />
                                        <T>Ghi chú bổ sung</T>
                                      </h4>
                                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 text-amber-900 leading-relaxed whitespace-pre-wrap text-xs">
                                        {selectedPersonalTaskReport.notes}
                                      </div>
                                    </div>
                                  )}

                                  {/* Hình ảnh đính kèm (nếu có) */}
                                  {(() => {
                                    const images = (selectedPersonalTaskReport.imageUrls && selectedPersonalTaskReport.imageUrls.length > 0)
                                      ? selectedPersonalTaskReport.imageUrls
                                      : (selectedPersonalTaskReport.imageUrl ? [selectedPersonalTaskReport.imageUrl] : []);
                                    if (images.length === 0) return null;
                                    return (
                                      <div>
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                          <T>Hình ảnh đính kèm</T>
                                        </h4>
                                        <div className="flex flex-wrap gap-2.5">
                                          {images.filter(Boolean).map((imgUrl: string, idx: number) => (
                                            <a
                                              key={idx}
                                              href={imgUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity relative group"
                                            >
                                              <img
                                                src={imgUrl}
                                                alt={`Ảnh đính kèm ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                              />
                                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <ExternalLink className="w-4 h-4" />
                                              </div>
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Danh sách Chỉ đạo (Directives) */}
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                                        <T>Ý kiến chỉ đạo từ Ban Giám đốc / Quản lý</T> ({selectedPersonalTaskReport.directives?.length || 0})
                                      </span>
                                    </h4>
                                    {(!selectedPersonalTaskReport.directives || selectedPersonalTaskReport.directives.length === 0) ? (
                                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-center italic">
                                        <T>Chưa có ý kiến chỉ đạo nào cho báo cáo này.</T>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {selectedPersonalTaskReport.directives.map((d: any, dIdx: number) => (
                                          <div key={dIdx} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1.5">
                                            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                                              <span className="flex items-center gap-1">
                                                <Crown className="w-3 h-3 text-amber-600" />
                                                {d.author || <T>Cấp Quản lý</T>}
                                              </span>
                                              <span className="font-mono text-amber-700 text-[10px]">
                                                {d.timestamp || "dd/mm/yy"}
                                              </span>
                                            </div>
                                            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                                              {d.text}
                                            </p>
                                            {d.acknowledgedBy && (
                                              <div className="text-[10px] text-slate-500 pt-1 border-t border-amber-200/50 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <T>Đã xác nhận:</T> <strong className="text-slate-700">{d.acknowledgedBy}</strong>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Danh sách Giải pháp (Resolutions) */}
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                        <T>Giải pháp khắc phục & phòng ngừa</T> ({selectedPersonalTaskReport.resolutions?.length || 0})
                                      </span>
                                    </h4>
                                    {(!selectedPersonalTaskReport.resolutions || selectedPersonalTaskReport.resolutions.length === 0) ? (
                                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-center italic">
                                        <T>Chưa có giải pháp nào được đăng ký cho sự cố này.</T>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {selectedPersonalTaskReport.resolutions.map((res: any, resIdx: number) => (
                                          <div key={resIdx} className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5">
                                            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                                              <span className="flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                {res.handlerName || <T>Người xử lý</T>} {res.departmentName ? `(${res.departmentName})` : ""}
                                              </span>
                                              <span className="font-mono text-emerald-700 text-[10px]">
                                                {res.updatedAt || "dd/mm/yy"}
                                              </span>
                                            </div>
                                            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                                              {res.resultText || ""}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    ID: {selectedPersonalTaskReport.id}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isMyCreated(selectedPersonalTaskReport) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const rep = selectedPersonalTaskReport;
                                          setSelectedPersonalTaskReport(null);
                                          setEditingPersonalReportId(rep.id);
                                          setEditingPersonalReportText(rep.content);
                                          setPersonalTab("4M1E1I");
                                        }}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        <T>Sửa nội dung</T>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedPersonalTaskReport(null)}
                                      className="px-4 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                                    >
                                      <T>Đóng</T>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
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
              {/* Header Banner - White, bright & elegant style */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                    <Bell className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      <T>TRUNG TÂM CẤU HÌNH & PHÁT SÓNG BẢNG TIN</T>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                      <T>Quản trị toàn quyền thông báo chữ chạy (Ticker) khẩn cấp trên đỉnh hệ thống và đăng tin tức trực tuyến tới toàn bộ cán bộ công nhân viên.</T>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left side configurations */}
                {currentUser?.role === UserRole.ADMIN && (
                  <div className="xl:col-span-5 space-y-6">
                  {/* Card 0: CẤU HÌNH BANNER LỄ HỘI & SỰ KIỆN */}
                  <FestiveBannerConfigCard
                    bannerConfig={festiveBannerConfig}
                    onSaveConfig={onUpdateFestiveBannerConfig || (() => {})}
                  />

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

          {/* TAB 8: KÊNH TRAO ĐỔI & HỘP THOẠI 1:1 (Forum & Direct Chat) */}
          {activeTab === "TRAO_ĐỔI" && (
            <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col space-y-3">
              {/* Header & Sub-Tabs Switcher - White, bright & elegant banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      <T>KÊNH TRAO ĐỔI & HỘP THOẠI TIN NHẮN 1:1</T>
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
                      <T>Nơi thảo luận chuyên đề KPH, góp ý cải tiến 4M1E1I và trao đổi trực tiếp riêng tư giữa các bộ phận.</T>
                    </p>
                  </div>
                </div>
              </div>

              {/* View 1: Topics Discussion Forum */}
              {forumSubTab === "TOPICS" && (
              <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
                {/* Left Pane - List of Topics (35% -> col-span-4) */}
                <div className="col-span-4 bg-white border border-slate-200 rounded-lg flex flex-col min-h-0 shadow-sm overflow-hidden">
                  {/* Search and Filters */}
                  <div className="p-3 border-b border-slate-100 space-y-3">
                    {/* 2 Main Sub-Tabs Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between bg-white text-blue-700 shadow-xs border border-slate-200/80 rounded-lg p-0.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => setForumSubTab("TOPICS")}
                          className="flex-1 py-1.5 px-1.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate"><T>CHỦ ĐỀ ({scopedTopics.length})</T></span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCreatingTopic(true);
                          }}
                          title="Tạo chủ đề mới"
                          className="w-6 h-6 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs mr-0.5"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForumSubTab("INBOX")}
                        className="py-2 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer relative text-slate-600 hover:text-slate-900 min-w-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate"><T>TIN NHẮN 1:1</T></span>
                        {unreadDirectMessagesCount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce shrink-0">
                            {unreadDirectMessagesCount}
                          </span>
                        )}
                      </button>
                    </div>

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
                  </div>

                  {/* Topic Items List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {(() => {
                      // Filter and sort topics
                      const filtered = scopedTopics.filter((t) => {
                        const q = forumSearchQuery.toLowerCase();
                        const matchesQuery =
                          !forumSearchQuery.trim() ||
                          (t.title || "").toLowerCase().includes(q) ||
                          (t.description || "").toLowerCase().includes(q) ||
                          (t.creatorName || "").toLowerCase().includes(q) ||
                          (t.topicCode || "").toLowerCase().includes(q) ||
                          (t.reportId || "").toLowerCase().includes(q);
                        const matchesCat =
                          forumCategoryFilter === "ALL" ||
                          t.category === forumCategoryFilter ||
                          (forumCategoryFilter === "Kiến nghị khác" && ((t.category as string) === "Khác" || t.category === "Kiến nghị khác" || !t.category));
                        return matchesQuery && matchesCat;
                      });

                      // Sort: pinned first, then by timestamp decending
                      const sorted = [...filtered].sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return (b.timestamp || "").localeCompare(a.timestamp || "");
                      });

                      if (sorted.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            <T>Không tìm thấy chủ đề nào</T>
                          </div>
                        );
                      }

                      const isAdminOrReviewer =
                        currentUser.role === UserRole.ADMIN ||
                        currentUser.role === UserRole.REVIEWER ||
                        (currentUser.role as string) === "ADMIN" ||
                        (currentUser.role as string) === "REVIEWER" ||
                        (currentUser.role as string) === "CHỦ ADMIN" ||
                        (currentUser.role as string) === "DUYỆT VIÊN";

                      return sorted.map((t) => {
                        const isSelected = selectedTopicId === t.id;
                        const replyCount = replies.filter((r) => r.topicId === t.id).length;
                        const isKphDiscussion = t.category === "Thảo luận KPH" || Boolean(t.reportId);
                        const matchedReport = t.reportId
                          ? reports.find((r) => r.id === t.reportId || (r.reportCode && r.reportCode === t.reportId))
                          : reports.find((r) => r.reportCode && t.title.includes(r.reportCode));
                        const reportCode = getTopicReportCode(t, matchedReport);
                        const displayTitle = cleanDisplayTitle(t.title, t.description, matchedReport);

                        // Card background & border style by topic status
                        const getStatusCardStyle = () => {
                          if (t.status === "RESOLVED") {
                            return isSelected
                              ? "bg-emerald-50/90 border-l-emerald-600 border-y border-emerald-200 shadow-xs"
                              : "bg-emerald-50/30 hover:bg-emerald-50/60 border-l-emerald-500 border-y border-emerald-100/50";
                          }
                          if (t.status === "PROCESSING") {
                            return isSelected
                              ? "bg-amber-50/90 border-l-amber-600 border-y border-amber-200 shadow-xs"
                              : "bg-amber-50/30 hover:bg-amber-50/60 border-l-amber-500 border-y border-amber-100/50";
                          }
                          // OPEN (Default) -> Blue
                          return isSelected
                            ? "bg-blue-50/90 border-l-blue-600 border-y border-blue-200 shadow-xs"
                            : "bg-blue-50/30 hover:bg-blue-50/60 border-l-blue-500 border-y border-blue-100/50";
                        };

                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className={`p-3 text-left transition-all cursor-pointer border-l-4 ${getStatusCardStyle()}`}
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {t.topicCode && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                    <span translate="no" className="notranslate">{t.topicCode}</span>
                                  </span>
                                )}
                                {reportCode && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                    <span translate="no" className="notranslate">{reportCode}</span>
                                  </span>
                                )}
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                    isKphDiscussion
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-white/80 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  <T>{t.category || "Thảo luận"}</T>
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Pin & Delete Action Buttons */}
                                {isAdminOrReviewer && (
                                  <div className="flex items-center gap-0.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleForumTopicPin?.(t.id);
                                      }}
                                      className={`p-1 rounded border text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center ${
                                        t.isPinned
                                          ? "bg-rose-50 border-rose-200 text-rose-600 shadow-2xs"
                                          : "bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                      }`}
                                      title="Ghim/Bỏ ghim chủ đề"
                                    >
                                      <Pin className={`w-3 h-3 ${t.isPinned ? "fill-rose-600 text-rose-600" : ""}`} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingDesktopTopic(t);
                                      }}
                                      className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center"
                                      title="Xóa chủ đề"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="font-bold text-slate-850 text-xs mb-1.5 line-clamp-2 leading-relaxed flex items-start gap-1">
                              {t.isPinned && <Pin className="w-3 h-3 text-red-500 shrink-0 fill-red-500 mt-0.5" />}
                              <T>{displayTitle}</T>
                            </h4>

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              {(() => {
                                const creatorUser = findUser(users, t.creatorId, t.creatorPhone, t.creatorName);
                                return (
                                  <span className="flex items-center gap-1.5 font-medium text-slate-600 truncate max-w-[170px]">
                                    {creatorUser?.avatar ? (
                                      <img src={creatorUser.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                                    ) : (
                                      <UserIcon className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    )}
                                    <span className="truncate notranslate" translate="no"><T>{t.creatorName}</T></span>
                                  </span>
                                );
                              })()}
                              <span className="flex items-center gap-1.5">
                                <T>{(t.timestamp || "").split(" ")[0]}</T>
                                <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
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
                <div className="col-span-8 bg-white border border-slate-200 rounded-lg flex flex-col h-[calc(100vh-190px)] min-h-[620px] shadow-sm overflow-hidden">
                  {(() => {
                    const topic = scopedTopics.find((t) => t.id === selectedTopicId);
                    if (!topic || !isUserAllowedToViewTopic(topic, currentUser, replies, reports)) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                          <MessageSquare className="w-12 h-12 mb-2 text-slate-300" />
                          <T className="text-xs">Vui lòng chọn một chủ đề thảo luận từ danh sách bên trái hoặc bạn chưa có quyền tham gia chủ đề này.</T>
                        </div>
                      );
                    }

                    const topicReplies = replies.filter((r) => r.topicId === topic.id);
                    const isAdminOrReviewer =
                      currentUser.role === UserRole.ADMIN ||
                      currentUser.role === UserRole.REVIEWER ||
                      (currentUser.role as string) === "ADMIN" ||
                      (currentUser.role as string) === "REVIEWER" ||
                      (currentUser.role as string) === "CHỦ ADMIN" ||
                      (currentUser.role as string) === "DUYỆT VIÊN";

                    const linkedReport = topic.reportId
                      ? reports.find((r) => r.id === topic.reportId || (r.reportCode && r.reportCode === topic.reportId))
                      : reports.find((r) => r.reportCode && topic.title.includes(r.reportCode));

                    const reportCode = getTopicReportCode(topic, linkedReport);
                    const cleanTitle = cleanDisplayTitle(topic.title, topic.description, linkedReport);

                    const handleSendDesktopReply = (msgText?: string, attachedImagesList?: AttachedImage[]) => {
                      const finalMsg = (msgText !== undefined ? msgText : forumReplyMessage).trim();
                      if (!finalMsg && (!attachedImagesList || attachedImagesList.length === 0)) return;
                      const extraData: Partial<ForumReply> = {};
                      if (desktopReplyingTo) {
                        extraData.quotedReply = {
                          id: desktopReplyingTo.id,
                          senderName: desktopReplyingTo.senderName,
                          message: desktopReplyingTo.message
                        };
                      }
                      if (attachedImagesList && attachedImagesList.length > 0) {
                        extraData.attachments = attachedImagesList.map(img => ({
                          type: "image",
                          url: img.url,
                          name: img.name,
                          sizeKb: img.sizeKb
                        }));
                      }
                      onAddForumReply?.(topic.id, finalMsg, extraData);
                      setForumReplyMessage("");
                      setDesktopReplyingTo(null);
                    };

                    return (
                      <>
                        {/* Polished Multi-Row Chat Header */}
                        <div className="border-b border-slate-200 bg-white shrink-0 shadow-2xs">
                          {/* Row 1: Topic Title & Info */}
                          <div className="px-5 pt-3.5 pb-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {(() => {
                                const creatorUser = findUser(users, topic.creatorId, topic.creatorPhone, topic.creatorName);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDirectChatByName(topic.creatorName)}
                                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-pink-500 hover:to-rose-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0 cursor-pointer transition-all hover:scale-105 overflow-hidden"
                                    title={`Nhắn tin 1:1 với tác giả ${topic.creatorName}`}
                                  >
                                    {creatorUser?.avatar ? (
                                      <img src={creatorUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                      topic.creatorName.charAt(0)
                                    )}
                                  </button>
                                );
                              })()}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-slate-900 text-sm md:text-[15px] leading-snug">
                                    <T>{cleanTitle}</T>
                                  </h3>
                                </div>
                                <p className="text-[11.5px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDirectChatByName(topic.creatorName)}
                                    className="text-slate-700 font-semibold hover:text-pink-600 hover:underline cursor-pointer transition-colors"
                                    title={`Bấm để mở hộp thoại chat 1:1 với ${topic.creatorName}`}
                                  >
                                    <T>{topic.creatorName}</T>
                                  </button>
                                  <span>•</span>
                                  <span className="text-slate-500"><T>{topicReplies.length} phản hồi</T></span>
                                  {topic.timestamp && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-slate-500"><T>{topic.timestamp}</T></span>
                                    </>
                                  )}
                                  {linkedReport && (
                                    <>
                                      <span>•</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveTab("FORM_CAPA");
                                          if (onShowToast) onShowToast(`Chuyển đến Báo cáo CAPA: ${reportCode}`, "info");
                                        }}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                        title="Mở Báo cáo CAPA liên kết"
                                      >
                                        <ExternalLink className="w-3 h-3 text-blue-600" />
                                        <span className="font-mono text-[11px] font-semibold"><T>{reportCode || "Xem CAPA"}</T></span>
                                      </button>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Row 2: Dedicated Action Toolbar (Dòng công cụ chuyên biệt) */}
                          <div className="px-5 py-2 bg-slate-50/80 border-t border-slate-150 flex items-center justify-between gap-2.5 flex-wrap">
                            {/* Left Group: Topic Status & Linked CAPA */}
                            <div className="flex items-center gap-2">
                              {/* Status selector dropdown */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setShowDesktopStatusDropdown(!showDesktopStatusDropdown)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-black border flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                                    topic.status === "RESOLVED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                      : topic.status === "PROCESSING"
                                      ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                      : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                  }`}
                                  title="Trạng thái xử lý của chủ đề thảo luận"
                                >
                                  <span className={`w-2 h-2 rounded-full ${
                                    topic.status === "RESOLVED" ? "bg-emerald-500" : topic.status === "PROCESSING" ? "bg-amber-500" : "bg-blue-500"
                                  }`} />
                                  <T>
                                    {topic.status === "RESOLVED"
                                      ? "ĐÃ XONG"
                                      : topic.status === "PROCESSING"
                                      ? "ĐANG XỬ LÝ"
                                      : "ĐANG MỞ"}
                                  </T>
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                </button>

                                {showDesktopStatusDropdown && (
                                  <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 animate-scaleUp">
                                    <div className="px-3 py-1.5 text-[9.5px] font-bold text-slate-400 uppercase border-b border-slate-100">
                                      <T>Đổi trạng thái chủ đề</T>
                                    </div>
                                    {[
                                      { key: "OPEN", label: "ĐANG MỞ", color: "text-blue-600 hover:bg-blue-50" },
                                      { key: "PROCESSING", label: "ĐANG XỬ LÝ", color: "text-amber-600 hover:bg-amber-50" },
                                      { key: "RESOLVED", label: "ĐÃ XONG / ĐÃ GIẢI QUYẾT", color: "text-emerald-600 hover:bg-emerald-50" }
                                    ].map((st) => (
                                      <button
                                        key={st.key}
                                        type="button"
                                        onClick={() => {
                                          onUpdateForumTopicStatus?.(topic.id, st.key as ForumTopicStatus);
                                          setShowDesktopStatusDropdown(false);
                                          if (onShowToast) {
                                            onShowToast(`Đã chuyển trạng thái sang "${st.label}"`, "success");
                                          }
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${st.color} ${
                                          topic.status === st.key ? "bg-slate-50 font-black" : ""
                                        }`}
                                      >
                                        <T>{st.label}</T>
                                        {topic.status === st.key && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Group: AI-SUM, TASK Catalog, Members */}
                            <div className="flex items-center gap-2">
                              {/* AI-SUM Button */}
                              <button
                                type="button"
                                onClick={() => setShowDesktopAiSummaryModal(true)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                title="Xem tóm tắt AI cho cuộc thảo luận này"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <T>AI-SUM</T>
                              </button>

                              {/* TASK Button */}
                              {(() => {
                                const topicTasks = topicReplies.filter(r => r.actionType);
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDesktopActionsCatalogScope("CURRENT_TOPIC");
                                      setShowDesktopActionsCatalogModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                    title="Danh mục Chỉ đạo & Đầu việc (Task) trong thảo luận này"
                                  >
                                    <ListTodo className="w-3.5 h-3.5 text-amber-600 stroke-[2.5px]" />
                                    <T>TASK</T>
                                    {topicTasks.length > 0 && (
                                      <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                                        {topicTasks.length}
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}

                              {/* Members Button */}
                              <button
                                type="button"
                                onClick={() => setShowDesktopMembersModal(true)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                                title="Mời & Xem danh sách thành viên tham gia"
                              >
                                <Users className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-xs font-bold"><T>Thành viên ({topic.invitedUserIds?.length || 0})</T></span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Topic Context / Description Banner */}
                        {topic.description && (
                          <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-2 flex items-center justify-between text-xs text-slate-700">
                            <div className="flex items-center gap-2 min-w-0">
                              <Info className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className={`font-medium ${isDesktopDescExpanded ? "" : "truncate"}`}>
                                <T>{topic.description}</T>
                              </span>
                            </div>
                            {topic.description.length > 60 && (
                              <button
                                type="button"
                                onClick={() => setIsDesktopDescExpanded(!isDesktopDescExpanded)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold shrink-0 ml-2 flex items-center gap-0.5 cursor-pointer"
                              >
                                <T>{isDesktopDescExpanded ? "Thu gọn" : "Xem thêm"}</T>
                                {isDesktopDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Chat Stream (Khung Chat Gọn Gàng & Cân Đối) */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#f8fafc] select-text">
                          {topicReplies.length === 0 ? (
                            <div className="py-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                              <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                                <MessageCircle className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-xs font-semibold text-slate-600">
                                <T>Chưa có ý kiến trao đổi nào.</T>
                              </p>
                              <p className="text-[11px] text-slate-400 max-w-xs">
                                <T>Hãy là người đầu tiên đóng góp ý kiến hoặc phản hồi chuyên môn bên dưới!</T>
                              </p>
                            </div>
                          ) : (
                            topicReplies
                              .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""))
                              .map((r, rIdx, arr) => {
                                const resolvedSender = resolveSenderInfo(users, r.senderPhone, r.senderName, r.senderRole);
                                const isMe = isCurrentUserSender(currentUser, r.senderPhone, r.senderName, (r as any).senderId, r.senderRole);
                                const prevReply = rIdx > 0 ? arr[rIdx - 1] : null;
                                const isConsecutive =
                                  prevReply &&
                                  prevReply.senderName === r.senderName &&
                                  prevReply.senderPhone === r.senderPhone;
                                const likesCount = r.likedBy ? r.likedBy.length : (r.likes || 0);
                                const hasLiked = currentUser && r.likedBy?.includes(currentUser.phone || currentUser.id);

                                const isTopicLeader = checkIsTopicLeader(topic, currentUser);
                                const isSenderTopicLeader = checkIsTopicLeader(topic, resolvedSender as any);
                                const canManageReply =
                                  isAdminOrReviewer ||
                                  isTopicLeader ||
                                  isMe ||
                                  (currentUser && (r.senderPhone === currentUser.phone || r.senderPhone === currentUser.id || r.senderName === currentUser.fullName));

                                return (
                                  <div
                                    key={r.id}
                                    className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} ${isConsecutive ? "mt-1" : "mt-3"}`}
                                  >
                                    {/* Sender Info (Chỉ hiện khi đổi người gửi và không phải liên tiếp) */}
                                    {!isMe && !isConsecutive && (
                                      <div className="flex items-center gap-1.5 ml-10 mb-1">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenDirectChatWithSender(r, resolvedSender)}
                                          className="font-semibold text-slate-800 text-[11px] hover:text-pink-600 hover:underline cursor-pointer transition-colors flex items-center gap-1 group/name"
                                          title={`Bấm để mở hộp thoại chat 1:1 với ${formatNameCapitalized(resolvedSender.fullName || r.senderName)}`}
                                        >
                                          <T>{formatNameCapitalized(resolvedSender.fullName || r.senderName)}</T>
                                          <MessageCircle className="w-3 h-3 text-pink-500 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                                        </button>
                                      </div>
                                    )}

                                    {isMe && !isConsecutive && (
                                      <div className="flex items-center justify-end gap-1.5 mr-10 mb-1">
                                        <span className="font-semibold text-slate-800 text-[11px]">
                                          <T>{currentUser?.fullName ? `TÔI (${formatNameCapitalized(currentUser.fullName)})` : "TÔI"}</T>
                                        </span>
                                      </div>
                                    )}

                                    {/* Message Bubble + Side Action Buttons + Avatar (Natural responsive width up to 80%) */}
                                    <div className={`flex items-end gap-1.5 max-w-[80%] group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                      {/* Left Avatar for Others */}
                                      {!isMe && (
                                        <div className="w-8 h-8 shrink-0">
                                          {!isConsecutive ? (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenDirectChatWithSender(r, resolvedSender)}
                                              className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 hover:from-blue-600 hover:to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs cursor-pointer transition-all hover:scale-110 overflow-hidden"
                                              title={`Nhắn tin 1:1 với ${resolvedSender.fullName}`}
                                            >
                                              {resolvedSender.avatar ? (
                                                <img src={resolvedSender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                              ) : (
                                                resolvedSender.fullName.charAt(0).toUpperCase()
                                              )}
                                            </button>
                                          ) : (
                                            <div className="w-8 h-8" />
                                          )}
                                        </div>
                                      )}

                                      {/* Right Avatar for Current User */}
                                      {isMe && (
                                        <div className="w-8 h-8 shrink-0">
                                          {!isConsecutive ? (
                                            <div
                                              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs overflow-hidden"
                                              title={currentUser?.fullName || "Tôi"}
                                            >
                                              {currentUser?.avatar ? (
                                                <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                              ) : (
                                                (currentUser?.fullName || "T").charAt(0).toUpperCase()
                                              )}
                                            </div>
                                          ) : (
                                            <div className="w-8 h-8" />
                                          )}
                                        </div>
                                      )}

                                      {/* Main Chat Bubble (Fits text width dynamically and expands smoothly up to container max-width) */}
                                      <div
                                        className={`relative px-4 py-2.5 rounded-2xl shadow-2xs text-[15px] leading-relaxed text-left transition-all break-words w-fit max-w-full ${
                                          isMe
                                            ? "bg-[#e9f2fd] text-slate-800 font-normal rounded-tr-xs border border-blue-200/80 shadow-2xs"
                                            : "bg-white text-slate-850 font-normal rounded-tl-xs border border-slate-200/90"
                                        }`}
                                      >
                                        {/* Task / Directive Badge attached to bubble corner */}
                                        {r.actionType && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDesktopEditingActionReply(r);
                                              setDesktopEditActionType(r.actionType || "DIRECTIVE");
                                              setDesktopEditTaskNote(r.actionData?.note || "");
                                              setDesktopEditTaskDeadline(r.actionData?.deadline || "");
                                              setDesktopEditTaskStatus(r.actionData?.status || "PENDING");
                                              const foundUser = users.find(
                                                (u) => (r.actionData?.assignedToId && (u.id === r.actionData.assignedToId || u.phone === r.actionData.assignedToId)) ||
                                                       (r.actionData?.assignedToName && u.fullName === r.actionData.assignedToName)
                                              );
                                              setDesktopEditTaskAssignedUser(foundUser || null);
                                            }}
                                            className={`absolute -top-2.5 ${isMe ? "-left-2.5" : "-right-2.5"} flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md cursor-pointer border transition-transform hover:scale-105 z-10 select-none ${
                                              r.actionType === "DIRECTIVE"
                                                ? "bg-amber-500 text-white border-amber-300"
                                                : r.actionData?.status === "COMPLETED"
                                                ? "bg-emerald-600 text-white border-emerald-400"
                                                : "bg-blue-600 text-white border-blue-400"
                                            }`}
                                            title="Bấm để xem/sửa chi tiết chỉ đạo hoặc đầu việc (Task)"
                                          >
                                            {r.actionType === "DIRECTIVE" ? (
                                              <Zap className="w-3 h-3 fill-amber-200 text-amber-200" />
                                            ) : (
                                              <ListTodo className="w-3 h-3 text-white stroke-[2.5px]" />
                                            )}
                                            <span>
                                              {r.actionType === "DIRECTIVE"
                                                ? "CHỈ ĐẠO"
                                                : r.actionData?.status === "COMPLETED"
                                                ? "TASK ✓"
                                                : "TASK"}
                                            </span>
                                          </button>
                                        )}

                                        {/* Quoted Message Box (theo phong cách Zalo mềm mại) */}
                                        {r.quotedReply && (
                                          <div
                                            className={`p-2 px-2.5 rounded-r-lg rounded-l-xs mb-2 text-[13px] border-l-[3px] transition-all ${
                                              isMe
                                                ? "bg-[#dbe9fa] text-slate-800 border-[#0068ff]"
                                                : "bg-slate-100 text-slate-700 border-amber-500"
                                            }`}
                                          >
                                            <div className="font-semibold text-[12px] text-slate-800">
                                              <T>{r.quotedReply.senderName}</T>
                                            </div>
                                            <div className="truncate mt-0.5 text-[12.5px] text-slate-600">
                                              <T>{r.quotedReply.message}</T>
                                            </div>
                                          </div>
                                        )}

                                        {/* Inline Editing Mode */}
                                        {editingDesktopReplyId === r.id ? (
                                          <div className="space-y-2 min-w-[240px]">
                                            <textarea
                                              value={editingDesktopReplyText}
                                              onChange={(e) => setEditingDesktopReplyText(e.target.value)}
                                              className="w-full bg-white text-slate-900 border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                              rows={3}
                                            />
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                onClick={() => {
                                                  setEditingDesktopReplyId(null);
                                                  setEditingDesktopReplyText("");
                                                }}
                                                className="px-2 py-0.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                                              >
                                                <T>Hủy</T>
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (editingDesktopReplyText.trim()) {
                                                    onEditForumReply?.(r.id, editingDesktopReplyText.trim());
                                                    setEditingDesktopReplyId(null);
                                                    setEditingDesktopReplyText("");
                                                  }
                                                }}
                                                className="px-2 py-0.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                                              >
                                                <T>Lưu</T>
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Message Content with rich formatting & mentions styling */}
                                            <div className="whitespace-pre-wrap break-words select-text font-normal text-[15px] leading-relaxed text-slate-900">
                                              {renderFormattedMessage(r.message, {
                                                isMe,
                                                users,
                                                onOpenDirectChat: handleOpenDirectChatByName
                                              })}
                                            </div>

                                            {/* Attached Images */}
                                            {r.attachments && r.attachments.length > 0 && (
                                              <div className="mt-2.5 flex flex-wrap gap-2">
                                                {r.attachments.map((att, attIdx) => (
                                                  <div
                                                    key={attIdx}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setDesktopPreviewImage(att.url);
                                                    }}
                                                    className="relative group rounded-xl overflow-hidden border border-black/10 cursor-pointer shadow-2xs hover:shadow-md transition-all max-w-[240px]"
                                                  >
                                                    <img
                                                      src={att.url}
                                                      alt={att.name || "Hình ảnh"}
                                                      className="max-h-48 w-auto object-cover rounded-xl hover:scale-102 transition-transform duration-200"
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs gap-1">
                                                      <Eye className="w-4 h-4" />
                                                      <span><T>Xem ảnh</T></span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Timestamp & Like count badge */}
                                            <div className="flex items-center justify-end gap-1.5 mt-1 select-none">
                                              {likesCount > 0 && (
                                                <span
                                                  className="flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs"
                                                >
                                                  <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                                                  <span>{likesCount}</span>
                                                </span>
                                              )}
                                              <span className="text-[11px] font-mono text-slate-400">
                                                <T>{r.timestamp}</T>
                                              </span>
                                              {isMe && <Check className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />}
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Hover Action Toolbar (Thả tim, Trả lời trích dẫn, Chuyển thành Chỉ đạo/Task, Sửa, Xóa) */}
                                      <div
                                        className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-xs shrink-0 ${
                                          isMe ? "mr-1" : "ml-1"
                                        }`}
                                      >
                                        <button
                                          onClick={() => onLikeForumReply?.(r.id)}
                                          className={`p-1 rounded-full hover:bg-slate-100 cursor-pointer ${
                                            hasLiked ? "text-rose-600" : "text-slate-400 hover:text-rose-500"
                                          }`}
                                          title="Thích phản hồi"
                                        >
                                          <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-rose-600" : ""}`} />
                                        </button>

                                        <button
                                          onClick={() => {
                                            setDesktopReplyingTo({
                                              id: r.id,
                                              senderName: resolvedSender.fullName,
                                              message: r.message,
                                            });
                                          }}
                                          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 cursor-pointer"
                                          title="Trả lời trích dẫn trong diễn đàn"
                                        >
                                          <CornerUpLeft className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Nhắn riêng 1:1 button */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const partnerUser = users.find(
                                              (u) =>
                                                (r.senderPhone && (u.phone === r.senderPhone || u.id === r.senderPhone)) ||
                                                (r.senderName && u.fullName?.toLowerCase() === r.senderName?.toLowerCase()) ||
                                                (resolvedSender.phone && u.phone === resolvedSender.phone)
                                            );
                                            if (partnerUser) {
                                              setActiveDirectChatUser(partnerUser);
                                            } else {
                                              setActiveDirectChatUser({
                                                id: r.senderPhone || `usr-${Date.now()}`,
                                                fullName: resolvedSender.fullName,
                                                phone: r.senderPhone || resolvedSender.phone || "",
                                                department: resolvedSender.department || "Nhà máy",
                                                branch: "Tân Phú",
                                                role: UserRole.STAFF,
                                                status: UserStatus.ACTIVE,
                                                avatar: (resolvedSender as any)?.avatar || undefined
                                              });
                                            }
                                            setForumSubTab("INBOX");
                                            setDirectMessageInput(`[Trích đoạn KPH - ${topic.title}]: "${r.message.substring(0, 100)}..."\n`);
                                          }}
                                          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-pink-600 cursor-pointer"
                                          title="Nhắn tin riêng 1:1 cho bạn này"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Convert to Directive / Task Button */}
                                        <button
                                          onClick={() => {
                                            setDesktopConvertModalReply(r);
                                            setDesktopActionTypeChoice(r.actionType || "DIRECTIVE");
                                            setDesktopTaskNote(r.actionData?.note || "");
                                            setDesktopTaskDeadline(r.actionData?.deadline || "");
                                            const foundUser = users.find(
                                              (u) => (r.actionData?.assignedToId && (u.id === r.actionData.assignedToId || u.phone === r.actionData.assignedToId)) ||
                                                     (r.actionData?.assignedToName && u.fullName === r.actionData.assignedToName)
                                            );
                                            setDesktopTaskAssignedUser(foundUser || null);
                                          }}
                                          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-amber-600 cursor-pointer"
                                          title="Chuyển thành Chỉ đạo / Phân công đầu việc (Task)"
                                        >
                                          <Zap className="w-3.5 h-3.5" />
                                        </button>

                                        {canManageReply && (
                                          <>
                                            <button
                                              onClick={() => {
                                                setEditingDesktopReplyId(r.id);
                                                setEditingDesktopReplyText(r.message);
                                              }}
                                              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-amber-600 cursor-pointer"
                                              title="Sửa tin nhắn"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (onDeleteForumReply) {
                                                  onDeleteForumReply(r.id);
                                                  if (onShowToast) {
                                                    onShowToast(
                                                      isMe
                                                        ? "Đã xóa tin nhắn của bạn."
                                                        : "Đã xóa tin nhắn không phù hợp (Quyền Trưởng nhóm / Admin).",
                                                      "info"
                                                    );
                                                  }
                                                }
                                              }}
                                              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                                              title={isMe ? "Xóa tin nhắn của tôi" : "Xóa tin nhắn không phù hợp (Quyền Trưởng nhóm / Admin)"}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                          )}
                        </div>

                        {/* Bottom Reply Area (Thân thiện, gọn gàng, liền mạch) */}
                        <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2">
                          {/* Active Replying Quote Banner */}
                          {desktopReplyingTo && (
                            <div className="bg-blue-50/90 border border-blue-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-blue-900 animate-fadeIn">
                              <div className="flex items-center gap-1.5 truncate">
                                <CornerUpLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="font-bold shrink-0 text-[11px]">
                                  <T>Đang trả lời {desktopReplyingTo.senderName}:</T>
                                </span>
                                <span className="truncate opacity-80 italic text-[11px]">
                                  "{desktopReplyingTo.message}"
                                </span>
                              </div>
                              <button
                                onClick={() => setDesktopReplyingTo(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-blue-100 cursor-pointer shrink-0 ml-2"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Rich Chat Input Box matching Zalo-like toolbar with emojis and image uploads */}
                          <RichChatInputBox
                            users={users}
                            value={forumReplyMessage}
                            onChange={setForumReplyMessage}
                            onSend={(text, images) => handleSendDesktopReply(text, images)}
                            placeholder="Nhập phản hồi trao đổi... (Gõ @ để gắn thẻ đồng nghiệp, Enter để gửi)"
                            themeColor="blue"
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              )}

              {/* View 2: Direct 1:1 Messages & Inbox */}
              {forumSubTab === "INBOX" && (
                <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
                  {/* Left Column: Direct Message Contacts & Online List (col-span-4) */}
                  <div className="col-span-4 bg-white border border-slate-200 rounded-xl flex flex-col min-h-0 shadow-xs overflow-hidden">
                    {/* Top Search & Sub-Filter Bar */}
                    <div className="p-3 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
                      {/* 2 Main Sub-Tabs Switcher */}
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-slate-600 hover:text-slate-900 rounded-lg p-0.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => setForumSubTab("TOPICS")}
                            className="flex-1 py-1.5 px-1.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate"><T>CHỦ ĐỀ ({scopedTopics.length})</T></span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForumSubTab("TOPICS");
                              setIsCreatingTopic(true);
                            }}
                            title="Tạo chủ đề mới"
                            className="w-6 h-6 rounded-md bg-slate-300 hover:bg-blue-600 hover:text-white active:scale-95 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs mr-0.5"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setForumSubTab("INBOX")}
                          className="py-2 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer relative bg-pink-600 text-white shadow-xs min-w-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate"><T>TIN NHẮN 1:1</T></span>
                          {unreadDirectMessagesCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce shrink-0">
                              {unreadDirectMessagesCount}
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Tìm theo tên, phòng ban..."
                          value={directSearchTerm}
                          onChange={(e) => setDirectSearchTerm(e.target.value)}
                          className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-pink-500 shadow-2xs"
                        />
                      </div>

                      {/* 3 Sub-tabs: Hộp thoại | Online | Tất cả */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setDirectFilterTab("INBOX")}
                          className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            directFilterTab === "INBOX"
                              ? "bg-white text-pink-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <MessageCircle className="w-3 h-3" />
                          <T>Hộp thoại</T>
                          {unreadDirectMessagesCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1 rounded-full">
                              {unreadDirectMessagesCount}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirectFilterTab("ONLINE")}
                          className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            directFilterTab === "ONLINE"
                              ? "bg-white text-emerald-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <T>Online</T>
                          <span className="text-[10px] opacity-75">
                            ({scopedUsers.filter(u => u.status === UserStatus.ACTIVE && u.id !== currentUser.id && u.phone !== currentUser.phone).length})
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDirectFilterTab("ALL")}
                          className={`py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            directFilterTab === "ALL"
                              ? "bg-white text-blue-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Users className="w-3 h-3" />
                          <T>Tất cả</T>
                          <span className="text-[10px] opacity-75">({scopedUsers.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Contact List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                      {(() => {
                        // Compute conversation partner list
                        if (directFilterTab === "INBOX") {
                          const partnerMap = new Map<string, { user: User; lastMsg: DirectMessageItem; unreadCount: number }>();
                          
                          // Sort direct messages latest first
                          const sortedDMs = [...directMessages].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                          
                          sortedDMs.forEach((msg) => {
                            const isFromMe = isMsgFromUser(msg, currentUser);
                            const isToMe = isMsgToUser(msg, currentUser);
                            if (!isFromMe && !isToMe) return;

                            const partnerKey = isFromMe
                              ? (msg.receiverId || msg.receiverName)
                              : (msg.senderId || msg.senderName);
                            if (!partnerKey) return;

                            if (!partnerMap.has(partnerKey)) {
                              let partnerUser = users.find(
                                (u) =>
                                  (u.id && u.id === partnerKey) ||
                                  (u.fullName && u.fullName.toLowerCase() === partnerKey.toLowerCase()) ||
                                  (u.phone && u.phone === partnerKey)
                              );

                              if (!partnerUser) {
                                partnerUser = {
                                  id: partnerKey,
                                  fullName: isFromMe ? msg.receiverName : msg.senderName,
                                  phone: "",
                                  department: "Nhà máy",
                                  branch: "Tân Phú",
                                  role: (isFromMe ? undefined : msg.senderRole as any) || UserRole.STAFF,
                                  status: UserStatus.ACTIVE
                                };
                              }

                              partnerMap.set(partnerKey, {
                                user: partnerUser,
                                lastMsg: msg,
                                unreadCount: 0
                              });
                            }

                            // Count unread incoming messages
                            if (isToMe && !isFromMe && !isMsgReadByUser(msg.id, currentUser)) {
                              const item = partnerMap.get(partnerKey)!;
                              item.unreadCount += 1;
                            }
                          });

                          let list = Array.from(partnerMap.values());
                          if (directSearchTerm.trim()) {
                            const term = directSearchTerm.toLowerCase();
                            list = list.filter(
                              (item) =>
                                item.user.fullName?.toLowerCase().includes(term) ||
                                item.user.department?.toLowerCase().includes(term) ||
                                item.lastMsg.content?.toLowerCase().includes(term)
                            );
                          }

                          if (list.length === 0) {
                            return (
                              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                                <MessageCircle className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                                <p className="font-semibold text-slate-500"><T>Chưa có cuộc trò chuyện 1:1 nào</T></p>
                                <p className="text-[11px] text-slate-400">
                                  <T>Chuyển sang tab "Online" hoặc bấm "Nhắn riêng" trên diễn đàn để bắt đầu.</T>
                                </p>
                              </div>
                            );
                          }

                          return list.map(({ user: partner, lastMsg, unreadCount }) => {
                            const isSelected = activeDirectChatUser && (
                              (activeDirectChatUser.id && activeDirectChatUser.id === partner.id) ||
                              (activeDirectChatUser.fullName && activeDirectChatUser.fullName.toLowerCase() === partner.fullName.toLowerCase())
                            );
                            const isOnline = partner.status === UserStatus.ACTIVE;

                            return (
                              <div
                                key={partner.id || partner.fullName}
                                onClick={() => {
                                  setActiveDirectChatUser(partner);
                                  markPartnerMessagesAsRead(partner);
                                }}
                                className={`p-3 transition-colors cursor-pointer flex items-center justify-between group relative ${
                                  isSelected
                                    ? "bg-pink-50/80 border-l-4 border-pink-500"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className="relative shrink-0">
                                    {partner.avatar ? (
                                      <img src={partner.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                        {partner.fullName.charAt(0)}
                                      </div>
                                    )}
                                    {isOnline && (
                                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-xs font-bold truncate ${unreadCount > 0 ? "text-slate-900 font-extrabold" : "text-slate-700"}`}>
                                        <T>{partner.fullName}</T>
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                        {lastMsg.timestamp?.split(" ")[1] || lastMsg.timestamp?.split(" ")[0] || ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 mt-0.5">
                                      <p className={`text-[11px] truncate ${unreadCount > 0 ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                                        {isMsgFromUser(lastMsg, currentUser) && <span className="text-slate-400 mr-1"><T>Bạn:</T></span>}
                                        {lastMsg.content}
                                      </p>
                                      {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                                          {unreadCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeletePartnerUserDesktop(partner);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 transition-opacity ml-1 cursor-pointer"
                                  title="Xóa hội thoại này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          });
                        }

                        // Online / All Users tab
                        let userList = scopedUsers.filter((u) => u.id !== currentUser.id && u.phone !== currentUser.phone);
                        if (directFilterTab === "ONLINE") {
                          userList = userList.filter((u) => u.status === UserStatus.ACTIVE);
                        }
                        if (directSearchTerm.trim()) {
                          const term = directSearchTerm.toLowerCase();
                          userList = userList.filter(
                            (u) =>
                              u.fullName?.toLowerCase().includes(term) ||
                              u.department?.toLowerCase().includes(term) ||
                              u.phone?.includes(term) ||
                              u.branch?.toLowerCase().includes(term)
                          );
                        }

                        if (userList.length === 0) {
                          return (
                            <div className="p-8 text-center text-slate-400 text-xs">
                              <T>Không tìm thấy nhân sự phù hợp</T>
                            </div>
                          );
                        }

                        return userList.map((partner) => {
                          const isSelected = activeDirectChatUser && (
                            (activeDirectChatUser.id && activeDirectChatUser.id === partner.id) ||
                            (activeDirectChatUser.fullName && activeDirectChatUser.fullName.toLowerCase() === partner.fullName.toLowerCase())
                          );
                          const isOnline = partner.status === UserStatus.ACTIVE;

                          return (
                            <div
                              key={partner.id || partner.phone || partner.fullName}
                              onClick={() => {
                                setActiveDirectChatUser(partner);
                                markPartnerMessagesAsRead(partner);
                              }}
                              className={`p-3 transition-colors cursor-pointer flex items-center justify-between group ${
                                isSelected
                                  ? "bg-pink-50/80 border-l-4 border-pink-500"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  {partner.avatar ? (
                                    <img src={partner.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                      {partner.fullName.charAt(0)}
                                    </div>
                                  )}
                                  {isOnline && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      <T>{partner.fullName}</T>
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      <T>{partner.role || "Nhân sự"}</T>
                                    </span>
                                  </div>
                                  <div className="text-[10.5px] text-slate-400 truncate mt-0.5">
                                    <T>{partner.department} - {partner.branch || "Tân Phú"}</T>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="px-2.5 py-1 bg-pink-50 text-pink-700 hover:bg-pink-600 hover:text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <T>Nhắn tin</T>
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Active Conversation (col-span-8) */}
                  <div className="col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-0 shadow-xs overflow-hidden">
                    {activeDirectChatUser ? (
                      <>
                        {/* Direct Chat Header */}
                        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {activeDirectChatUser.avatar ? (
                                <img src={activeDirectChatUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                                  {activeDirectChatUser.fullName.charAt(0)}
                                </div>
                              )}
                              {activeDirectChatUser.status === UserStatus.ACTIVE && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <T>{activeDirectChatUser.fullName}</T>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                                  <T>{activeDirectChatUser.role || "Nhân sự"}</T>
                                </span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                <T>{activeDirectChatUser.department} • {activeDirectChatUser.branch || "Tân Phú"}</T>
                                {activeDirectChatUser.status === UserStatus.ACTIVE ? (
                                  <span className="text-emerald-600 font-bold ml-2">● Online (Trực tuyến)</span>
                                ) : (
                                  <span className="text-slate-400 ml-2">● Ngoại tuyến</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => markPartnerMessagesAsRead(activeDirectChatUser)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 bg-white"
                              title="Đánh dấu tất cả tin nhắn từ người này là đã đọc"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <T>Đã đọc</T>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePartnerUserDesktop(activeDirectChatUser)}
                              className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-rose-200 bg-white"
                              title="Xóa cuộc trò chuyện này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <T>Xóa hội thoại</T>
                            </button>
                          </div>
                        </div>

                        {/* Messages Stream */}
                        <div ref={directChatScrollRefDesktop} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc] select-text">
                          {(() => {
                            const currentPartnerClean = activeDirectChatUser.fullName?.trim().toLowerCase();
                            const conversationMessages = directMessages.filter((m) => {
                              const isFromMe = isMsgFromUser(m, currentUser);
                              const isToMe = isMsgToUser(m, currentUser);
                              const isFromPartner = isMsgFromUser(m, activeDirectChatUser) || (currentPartnerClean && m.senderName?.trim().toLowerCase() === currentPartnerClean);
                              const isToPartner = isMsgToUser(m, activeDirectChatUser) || (currentPartnerClean && m.receiverName?.trim().toLowerCase() === currentPartnerClean);

                              return (isFromMe && isToPartner) || (isFromPartner && isToMe);
                            }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

                            if (conversationMessages.length === 0) {
                              return (
                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-12">
                                  <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500">
                                    <MessageCircle className="w-6 h-6" />
                                  </div>
                                  <p className="text-xs font-bold text-slate-700">
                                    <T>Bắt đầu cuộc trò chuyện với {activeDirectChatUser.fullName}</T>
                                  </p>
                                  <p className="text-[11px] text-slate-400 max-w-xs">
                                    <T>Tin nhắn được lưu trữ bảo mật và đồng bộ thời gian thực qua Cloud Firestore.</T>
                                  </p>
                                </div>
                              );
                            }

                            return conversationMessages.map((msg, msgIdx, arr) => {
                              const isMe = isMsgFromUser(msg, currentUser);
                              const prevMsg = msgIdx > 0 ? arr[msgIdx - 1] : null;
                              const isConsecutive =
                                prevMsg &&
                                isMsgFromUser(prevMsg, currentUser) === isMe &&
                                prevMsg.senderName === msg.senderName;

                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col w-full ${isMe ? "items-end" : "items-start"} ${
                                    isConsecutive ? "mt-1" : "mt-3"
                                  }`}
                                >
                                  {/* Sender Info (Chỉ hiện khi đổi người gửi và không phải liên tiếp) */}
                                  {!isMe && !isConsecutive && (
                                    <div className="flex items-center gap-1.5 ml-10 mb-1">
                                      <span className="font-semibold text-slate-800 text-[11px]">
                                        <T>{formatNameCapitalized(msg.senderName || activeDirectChatUser.fullName)}</T>
                                      </span>
                                    </div>
                                  )}

                                  {isMe && !isConsecutive && (
                                    <div className="flex items-center justify-end gap-1.5 mr-10 mb-1">
                                      <span className="font-semibold text-slate-800 text-[11px]">
                                        <T>{currentUser?.fullName ? `TÔI (${formatNameCapitalized(currentUser.fullName)})` : "TÔI"}</T>
                                      </span>
                                    </div>
                                  )}

                                  {/* Message Bubble + Avatar Row (Natural responsive width up to 80%) */}
                                  <div
                                    className={`flex items-end gap-1.5 max-w-[80%] group ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                  >
                                    {/* Left Avatar for Others */}
                                    {!isMe && (
                                      <div className="w-8 h-8 shrink-0">
                                        {!isConsecutive ? (
                                          <div
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs overflow-hidden"
                                            title={msg.senderName || activeDirectChatUser.fullName}
                                          >
                                            {(() => {
                                              const senderUser = users.find(u => (msg.senderId && (u.id === msg.senderId || u.phone === msg.senderId)) || (msg.senderName && u.fullName === msg.senderName) || ((msg as any).senderPhone && u.phone === (msg as any).senderPhone)) || activeDirectChatUser;
                                              return senderUser?.avatar ? (
                                                <img src={senderUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                              ) : (
                                                (msg.senderName || activeDirectChatUser.fullName || "U").charAt(0).toUpperCase()
                                              );
                                            })()}
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8" />
                                        )}
                                      </div>
                                    )}

                                    {/* Right Avatar for Current User */}
                                    {isMe && (
                                      <div className="w-8 h-8 shrink-0">
                                        {!isConsecutive ? (
                                          <div
                                            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs overflow-hidden"
                                            title={currentUser?.fullName || "Tôi"}
                                          >
                                            {currentUser?.avatar ? (
                                              <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                              (currentUser?.fullName || "T").charAt(0).toUpperCase()
                                            )}
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8" />
                                        )}
                                      </div>
                                    )}

                                    {/* Main Chat Bubble */}
                                    <div
                                      className={`relative px-4 py-2.5 rounded-2xl shadow-2xs text-[15px] leading-relaxed text-left transition-all break-words w-fit max-w-full ${
                                        isMe
                                          ? "bg-[#e9f2fd] text-slate-800 font-normal rounded-tr-xs border border-blue-200/80 shadow-2xs"
                                          : "bg-white text-slate-850 font-normal rounded-tl-xs border border-slate-200/90"
                                      }`}
                                    >
                                      {/* Optional quoted/report reference snippet (Zalo style) */}
                                      {msg.quotedText && (
                                        <div
                                          className={`p-2 px-2.5 rounded-r-lg rounded-l-xs mb-2 text-[13px] border-l-[3px] transition-all ${
                                            isMe
                                              ? "bg-[#dbe9fa] text-slate-800 border-[#0068ff]"
                                              : "bg-slate-100 text-slate-700 border-pink-500"
                                          }`}
                                        >
                                          <T>{msg.quotedText}</T>
                                        </div>
                                      )}

                                      {/* Message Content with rich formatting & mentions styling */}
                                      <div className="whitespace-pre-wrap break-words select-text font-normal text-[15px] leading-relaxed text-slate-900">
                                        {renderFormattedMessage(msg.content, {
                                          isMe,
                                          users
                                        })}
                                      </div>

                                      {/* Attached Images */}
                                      {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="mt-2.5 flex flex-wrap gap-2">
                                          {msg.attachments.map((att, attIdx) => (
                                            <div
                                              key={attIdx}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDesktopPreviewImage(att.url);
                                              }}
                                              className="relative group rounded-xl overflow-hidden border border-black/10 cursor-pointer shadow-2xs hover:shadow-md transition-all max-w-[240px]"
                                            >
                                              <img
                                                src={att.url}
                                                alt={att.name || "Hình ảnh"}
                                                className="max-h-48 w-auto object-cover rounded-xl hover:scale-102 transition-transform duration-200"
                                              />
                                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs gap-1">
                                                <Eye className="w-4 h-4" />
                                                <span><T>Xem ảnh</T></span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Timestamp and Sent Status Checkmark */}
                                      <div className="flex items-center justify-end gap-1.5 mt-1 select-none text-[11px] font-mono text-slate-400">
                                        <T>{msg.timestamp}</T>
                                        {isMe && <Check className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Bottom Chat Input Bar */}
                        <div className="p-3 border-t border-slate-200 bg-white">
                          {/* Quick attach KPH Report selector */}
                          <div className="mb-2 flex items-center gap-2">
                            <div className="relative group">
                              <button
                                type="button"
                                className="px-2.5 py-1 text-xs text-slate-600 hover:text-pink-600 hover:bg-pink-50 bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200 font-semibold flex items-center gap-1.5"
                                title="Đính kèm mã KPH vào tin nhắn"
                              >
                                <Tag className="w-3.5 h-3.5 text-pink-500" />
                                <span><T>Tham chiếu KPH</T></span>
                              </button>
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-20 max-h-56 overflow-y-auto">
                                <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 border-b border-slate-100">
                                  <T>Đính kèm sự cố KPH gần đây</T>
                                </div>
                                {reports.slice(0, 6).map((rep) => (
                                  <button
                                    key={rep.id}
                                    type="button"
                                    onClick={() => {
                                      setDirectMessageInput((prev) => `[Tham chiếu KPH #${rep.reportCode || rep.id} - ${rep.category}]: ` + prev);
                                    }}
                                    className="w-full text-left p-1.5 hover:bg-slate-50 rounded text-[11px] truncate block text-slate-700 cursor-pointer"
                                  >
                                    <span className="font-bold text-pink-600 font-mono">#{rep.reportCode || rep.id}</span> - {rep.content}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <RichChatInputBox
                            users={users}
                            value={directMessageInput}
                            onChange={setDirectMessageInput}
                            onSend={(text, images) => handleSendDirectMessage(text, images)}
                            placeholder={`Nhắn tin cho ${activeDirectChatUser.fullName}...`}
                            themeColor="pink"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-[#f8fafc]">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-pink-500">
                          <MessageCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">
                          <T>Trung Tâm Tin Nhắn Trực Tiếp 1:1</T>
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm">
                          <T>Vui lòng chọn một đồng nghiệp từ danh sách bên trái hoặc bấm nút "Nhắn riêng" ở các bài viết diễn đàn để mở cửa sổ trò chuyện bảo mật.</T>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Confirm Delete Direct Conversation Modal */}
              {confirmDeletePartnerUserDesktop && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-xl border border-slate-200 w-full max-w-[400px] p-5 shadow-xl flex flex-col space-y-4 animate-scaleUp">
                    <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                      <Trash2 className="w-4 h-4" />
                      <T>Xác nhận xóa cuộc trò chuyện</T>
                    </div>
                    <p className="text-xs text-slate-600">
                      <T>Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn với <strong>{confirmDeletePartnerUserDesktop.fullName}</strong> không? Hành động này không thể hoàn tác.</T>
                    </p>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePartnerUserDesktop(null)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        <T>HỦY BỎ</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteConversation(confirmDeletePartnerUserDesktop);
                          setConfirmDeletePartnerUserDesktop(null);
                          if (onShowToast) onShowToast("Đã xóa cuộc trò chuyện 1:1!");
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm"
                      >
                        <T>XÓA VĨNH VIỄN</T>
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                          onChange={(e) => {
                            const newCat = e.target.value as any;
                            setNewTopicCategory(newCat);
                            if (newCat === "Thảo luận KPH" && !newTopicReportId && scopedReports.length > 0) {
                              const firstRep = scopedReports[0];
                              setNewTopicReportId(firstRep.id);
                              if (!newTopicTitle.trim()) {
                                setNewTopicTitle(`[KPH - ${firstRep.reportCode || firstRep.category}] ${firstRep.content.slice(0, 50)}`);
                              }
                              if (!newTopicDesc.trim()) {
                                setNewTopicDesc(`Thảo luận chuyên đề KPH ${firstRep.reportCode || ""}. Người đăng: ${firstRep.uploaderName}. Nội dung: ${firstRep.content}`);
                              }
                              const def = getDefaultMembersForReport(firstRep, users, currentUser);
                              setNewTopicInvitedUserIds(def.memberIds);
                            }
                          }}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="Thảo luận KPH">🔥 Thảo luận KPH</option>
                          <option value="Góp ý chức năng">💡 Góp ý chức năng</option>
                          <option value="Cải tiến 4M1E">🚀 Cải tiến 4M1E</option>
                          <option value="Kiến nghị khác">📁 Kiến nghị khác</option>
                        </select>
                      </div>

                      {/* Link to Report / Bản tin selector */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                            <T>Liên kết Bản tin KPH / Chuyên đề</T>
                          </label>
                          {newTopicReportId && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewTopicReportId("");
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                            >
                              <T>Bỏ chọn liên kết</T>
                            </button>
                          )}
                        </div>
                        <select
                          value={newTopicReportId}
                          onChange={(e) => {
                            const repId = e.target.value;
                            setNewTopicReportId(repId);
                            if (repId) {
                              const foundRep = reports.find((r) => r.id === repId || r.reportCode === repId);
                              if (foundRep) {
                                setNewTopicTitle(`[KPH - ${foundRep.reportCode || foundRep.category}] ${foundRep.content.slice(0, 50)}`);
                                setNewTopicDesc(`Thảo luận chuyên đề KPH ${foundRep.reportCode || ""}. Người đăng: ${foundRep.uploaderName} (${foundRep.uploaderDepartment}). Nội dung: ${foundRep.content}`);
                                const def = getDefaultMembersForReport(foundRep, users, currentUser);
                                setNewTopicInvitedUserIds(def.memberIds);
                              }
                            }
                          }}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                        >
                          <option value="">-- Không liên kết bản tin cụ thể --</option>
                          {scopedReports
                            .filter((r) => !r.isDeleted)
                            .slice(0, 60)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.reportCode ? `[${r.reportCode}] ` : ""}{r.category} - {r.uploaderName} ({r.timestamp?.split(" ")[0] || ""}): {r.content.substring(0, 45)}...
                              </option>
                            ))}
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
                        <textarea
                          placeholder="Mô tả cụ thể vấn đề, đề xuất hoặc tình huống cần thảo luận..."
                          value={newTopicDesc}
                          onChange={(e) => setNewTopicDesc(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                      {/* Members / Invite List */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <T>Thành viên nhóm thảo luận</T> ({newTopicInvitedUserIds.length + 1})
                          </label>
                          <span className="text-[10px] text-slate-400">
                            <T>Chỉ thành viên được chọn mới thấy chủ đề này</T>
                          </span>
                        </div>

                        {/* Summary of default members when report is linked */}
                        {newTopicReportId && (
                          <div className="p-2 bg-blue-50/80 border border-blue-200/80 rounded-lg text-[11px] text-blue-900 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-blue-800">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <T>Thành viên mặc định được chọn sẵn:</T>
                            </div>
                            <div className="text-[10.5px] text-slate-600 pl-4 space-y-0.5">
                              <div>• <strong>Người tạo chủ đề:</strong> {currentUser.fullName} <span className="text-blue-600 font-bold">(Bạn)</span></div>
                              {(() => {
                                const linkedRep = reports.find((r) => r.id === newTopicReportId || r.reportCode === newTopicReportId);
                                if (!linkedRep) return null;
                                const repDefaults = getDefaultMembersForReport(linkedRep, users, currentUser);
                                const uploaderUser = findUser(users, linkedRep.uploaderId, linkedRep.uploaderPhone, linkedRep.uploaderName);
                                return (
                                  <>
                                    <div>• <strong>Người đăng bản tin:</strong> {linkedRep.uploaderName} {uploaderUser ? `(${uploaderUser.department || uploaderUser.role})` : ""}</div>
                                    {repDefaults.memberNames.filter(n => n !== currentUser.fullName && n !== linkedRep.uploaderName).length > 0 && (
                                      <div>• <strong>Người được tag / liên quan:</strong> {repDefaults.memberNames.filter(n => n !== currentUser.fullName && n !== linkedRep.uploaderName).join(", ")}</div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-slate-50 space-y-1">
                          {/* Current User (Creator) - Always selected */}
                          <div className="w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between bg-blue-100/60 border border-blue-300 text-blue-900 font-bold">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold bg-blue-600 text-white shrink-0 overflow-hidden">
                                {currentUser.avatar ? (
                                  <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  currentUser.fullName.charAt(0)
                                )}
                              </div>
                              <span className="truncate notranslate" translate="no">{currentUser.fullName}</span>
                              <span className="text-[10px] text-blue-700 font-bold">(Khởi tạo chủ đề)</span>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                              <T>Người tạo ✓</T>
                            </span>
                          </div>

                          {users
                            .filter((u) => u.id !== currentUser.id && u.phone !== currentUser.phone)
                            .map((u) => {
                              const uKey = u.id || u.phone || u.fullName;
                              const isSelected = newTopicInvitedUserIds.includes(uKey) || newTopicInvitedUserIds.includes(u.id || "") || (u.phone && newTopicInvitedUserIds.includes(u.phone));
                              
                              // Check role in linked report
                              const linkedRep = newTopicReportId ? reports.find(r => r.id === newTopicReportId || r.reportCode === newTopicReportId) : null;
                              const isUploader = linkedRep && (
                                (linkedRep.uploaderId && (u.id === linkedRep.uploaderId || u.phone === linkedRep.uploaderId)) ||
                                (linkedRep.uploaderPhone && u.phone === linkedRep.uploaderPhone) ||
                                (linkedRep.uploaderName && u.fullName === linkedRep.uploaderName)
                              );
                              
                              return (
                                <button
                                  key={u.id || u.phone}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setNewTopicInvitedUserIds(newTopicInvitedUserIds.filter(id => id !== uKey && id !== u.id && id !== u.phone));
                                    } else {
                                      setNewTopicInvitedUserIds([...newTopicInvitedUserIds, uKey]);
                                    }
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer border ${
                                    isSelected
                                      ? "bg-blue-50 border-blue-200 text-blue-800 font-bold"
                                      : "bg-white border-slate-100 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 overflow-hidden ${
                                      isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                                    }`}>
                                      {u.avatar ? (
                                        <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        u.fullName.charAt(0)
                                      )}
                                    </div>
                                    <span className="truncate notranslate" translate="no">{u.fullName}</span>
                                    <span className="text-[10px] text-slate-400 truncate">({u.department || u.position || u.role})</span>
                                    {isUploader && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                                        <T>Người đăng tin</T>
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    <T>{isSelected ? "Đã chọn ✓" : "+ Mời"}</T>
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsCreatingTopic(false);
                          setNewTopicTitle("");
                          setNewTopicDesc("");
                          setNewTopicReportId("");
                          setNewTopicInvitedUserIds([]);
                        }}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <T>HỦY BỎ</T>
                      </button>
                      <button
                        onClick={() => {
                          if (!newTopicTitle.trim()) return;
                          onAddForumTopic?.(
                            newTopicTitle,
                            newTopicDesc || newTopicTitle,
                            newTopicCategory,
                            newTopicReportId || undefined,
                            newTopicInvitedUserIds
                          );
                          setIsCreatingTopic(false);
                          setNewTopicTitle("");
                          setNewTopicDesc("");
                          setNewTopicReportId("");
                          setNewTopicInvitedUserIds([]);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <T>ĐĂNG CHỦ ĐỀ</T>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Topic Modal */}
              {editingDesktopTopic && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-lg border border-slate-200 w-full max-w-[500px] p-5 shadow-xl flex flex-col space-y-4 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Edit className="w-4 h-4 text-blue-600" />
                        <T>Chỉnh Sửa Chủ Đề Thảo Luận</T>
                      </h3>
                      <button
                        onClick={() => setEditingDesktopTopic(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Category */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          <T>Chuyên mục</T>
                        </label>
                        <select
                          value={editDesktopTopicCategory}
                          onChange={(e) => setEditDesktopTopicCategory(e.target.value as ForumTopicCategory)}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500"
                        >
                          <option value="Thảo luận KPH">🔥 Thảo luận KPH</option>
                          <option value="Góp ý chức năng">💡 Góp ý chức năng</option>
                          <option value="Cải tiến 4M1E">🚀 Cải tiến 4M1E</option>
                          <option value="Kiến nghị khác">📁 Kiến nghị khác</option>
                        </select>
                      </div>

                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          <T>Tiêu đề chủ đề</T>
                        </label>
                        <input
                          type="text"
                          placeholder="Tiêu đề thảo luận..."
                          value={editDesktopTopicTitle}
                          onChange={(e) => setEditDesktopTopicTitle(e.target.value)}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          <T>Nội dung chi tiết</T>
                        </label>
                        <textarea
                          placeholder="Mô tả cụ thể..."
                          value={editDesktopTopicDesc}
                          onChange={(e) => setEditDesktopTopicDesc(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingDesktopTopic(null)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <T>HỦY BỎ</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!editDesktopTopicTitle.trim()) return;
                          if (onEditForumTopic) {
                            onEditForumTopic(editingDesktopTopic.id, editDesktopTopicTitle, editDesktopTopicDesc || editDesktopTopicTitle, editDesktopTopicCategory);
                            if (onShowToast) onShowToast("Đã cập nhật chủ đề thảo luận thành công!");
                          }
                          setEditingDesktopTopic(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        <T>LƯU CẬP NHẬT</T>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Topic Confirmation Modal */}
              {deletingDesktopTopic && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-xl border border-slate-200 w-full max-w-[400px] p-5 shadow-xl flex flex-col space-y-4 text-center animate-scaleUp">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        <T>Xác Nhận Xóa Chủ Đề Thảo Luận</T>
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                        <T>Bạn có chắc chắn muốn xóa chủ đề</T> <br />
                        <strong className="notranslate text-slate-800" translate="no">"{deletingDesktopTopic.title}"</strong>? <br />
                        <T>Tất cả các ý kiến phản hồi thuộc chủ đề này cũng sẽ bị xóa vĩnh viễn.</T>
                      </p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDeletingDesktopTopic(null)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <T>HỦY BỎ</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onDeleteForumTopic) {
                            onDeleteForumTopic(deletingDesktopTopic.id);
                            setSelectedTopicId(null);
                            if (onShowToast) onShowToast("Đã xóa chủ đề thảo luận thành công!");
                          }
                          setDeletingDesktopTopic(null);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm border-none"
                      >
                        <T>XÓA VĨNH VIỄN</T>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Convert To Action Modal (Chuyển thành Chỉ đạo / Task) */}
              {desktopConvertModalReply && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[520px] p-5 shadow-2xl flex flex-col space-y-4 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                          <Zap className="w-4 h-4 fill-amber-600 text-amber-600" />
                        </div>
                        <T>Chuyển Đổi Thành Chỉ Đạo / Phân Công Task</T>
                      </h3>
                      <button
                        onClick={() => setDesktopConvertModalReply(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Original Message Preview */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        <T>Nội dung tin nhắn gốc:</T>
                      </div>
                      <p className="text-slate-700 line-clamp-3 italic">
                        "{desktopConvertModalReply.message}"
                      </p>
                    </div>

                    {/* Action Type Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDesktopActionTypeChoice("DIRECTIVE")}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          desktopActionTypeChoice === "DIRECTIVE"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <T>⚡ CHỈ ĐẠO HÀNH ĐỘNG</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDesktopActionTypeChoice("TASK")}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          desktopActionTypeChoice === "TASK"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <ListTodo className="w-3.5 h-3.5 stroke-[2.5px]" />
                        <T>🎯 ĐẦU VIỆC (TASK)</T>
                      </button>
                    </div>

                    {/* Task Specific Fields */}
                    {desktopActionTypeChoice === "TASK" && (
                      <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                        {/* Assignee Picker */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            <T>Người chịu trách nhiệm thực hiện (Assignee) *</T>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopStaffPickerTarget("CONVERT");
                              setShowDesktopStaffPickerModal(true);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs hover:border-blue-400 transition-colors cursor-pointer text-left shadow-2xs"
                          >
                            {desktopTaskAssignedUser ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
                                  {desktopTaskAssignedUser.avatar ? (
                                    <img src={desktopTaskAssignedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    desktopTaskAssignedUser.fullName.charAt(0)
                                  )}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 notranslate" translate="no">
                                    {desktopTaskAssignedUser.fullName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 ml-1.5">
                                    ({desktopTaskAssignedUser.position || desktopTaskAssignedUser.role})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">
                                <T>Bấm để chọn nhân sự thực hiện...</T>
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            <T>Thời hạn hoàn thành (Deadline)</T>
                          </label>
                          <input
                            type="text"
                            placeholder="dd/mm/yy (Ví dụ: 25/08/26)"
                            value={desktopTaskDeadline}
                            onChange={(e) => setDesktopTaskDeadline(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Note Field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        <T>Ghi chú / Yêu cầu chi tiết</T>
                      </label>
                      <textarea
                        rows={2}
                        placeholder={
                          desktopActionTypeChoice === "DIRECTIVE"
                            ? "Ghi chú cụ thể cho chỉ đạo này..."
                            : "Yêu cầu kết quả đầu ra của task..."
                        }
                        value={desktopTaskNote}
                        onChange={(e) => setDesktopTaskNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDesktopConvertModalReply(null)}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <T>HỦY</T>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveConvertActionDesktop}
                        className={`px-4 py-2 rounded-lg text-xs font-black text-white transition-all cursor-pointer shadow-sm ${
                          desktopActionTypeChoice === "DIRECTIVE"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        <T>{desktopActionTypeChoice === "DIRECTIVE" ? "LƯU CHỈ ĐẠO" : "PHÂN CÔNG TASK"}</T>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Edit Action Modal (Xem & Sửa Chỉ đạo / Task) */}
              {desktopEditingActionReply && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[520px] p-5 shadow-2xl flex flex-col space-y-4 animate-scaleUp">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                          <Target className="w-4 h-4 text-blue-600" />
                        </div>
                        <T>Chi Tiết Chỉ Đạo / Phân Công Task</T>
                      </h3>
                      <button
                        onClick={() => setDesktopEditingActionReply(null)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Original Message Preview */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        <T>Nội dung tin nhắn:</T>
                      </div>
                      <p className="text-slate-700 line-clamp-3 italic">
                        "{desktopEditingActionReply.message}"
                      </p>
                    </div>

                    {/* Action Type Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDesktopEditActionType("DIRECTIVE")}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          desktopEditActionType === "DIRECTIVE"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <T>⚡ CHỈ ĐẠO HÀNH ĐỘNG</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDesktopEditActionType("TASK")}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          desktopEditActionType === "TASK"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <ListTodo className="w-3.5 h-3.5 stroke-[2.5px]" />
                        <T>🎯 ĐẦU VIỆC (TASK)</T>
                      </button>
                    </div>

                    {/* Task Details */}
                    {desktopEditActionType === "TASK" && (
                      <div className="space-y-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                        {/* Status Toggle */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            <T>Trạng thái thực hiện</T>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setDesktopEditTaskStatus("PENDING")}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                desktopEditTaskStatus === "PENDING"
                                  ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <span>⏳</span>
                              <T>Đang thực hiện</T>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDesktopEditTaskStatus("COMPLETED")}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                desktopEditTaskStatus === "COMPLETED"
                                  ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              <span>✓</span>
                              <T>Đã hoàn thành</T>
                            </button>
                          </div>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            <T>Người chịu trách nhiệm thực hiện</T>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setDesktopStaffPickerTarget("EDIT");
                              setShowDesktopStaffPickerModal(true);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs hover:border-blue-400 transition-colors cursor-pointer text-left shadow-2xs"
                          >
                            {desktopEditTaskAssignedUser ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
                                  {desktopEditTaskAssignedUser.avatar ? (
                                    <img src={desktopEditTaskAssignedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    desktopEditTaskAssignedUser.fullName.charAt(0)
                                  )}
                                </div>
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 notranslate" translate="no">
                                    {desktopEditTaskAssignedUser.fullName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 ml-1.5">
                                    ({desktopEditTaskAssignedUser.position || desktopEditTaskAssignedUser.role})
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">
                                <T>Bấm để chọn nhân sự thực hiện...</T>
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          </button>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            <T>Thời hạn hoàn thành (Deadline)</T>
                          </label>
                          <input
                            type="text"
                            placeholder="dd/mm/yy"
                            value={desktopEditTaskDeadline}
                            onChange={(e) => setDesktopEditTaskDeadline(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Note Field */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        <T>Ghi chú / Yêu cầu chi tiết</T>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Ghi chú cụ thể..."
                        value={desktopEditTaskNote}
                        onChange={(e) => setDesktopEditTaskNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveActionDesktop(desktopEditingActionReply.id);
                          setDesktopEditingActionReply(null);
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <T>GỠ BỎ TASK</T>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDesktopEditingActionReply(null)}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <T>HỦY</T>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditActionDesktop}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-sm"
                        >
                          <T>LƯU CẬP NHẬT</T>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Staff Picker Modal (Chọn Nhân Sự) */}
              {showDesktopStaffPickerModal && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[460px] p-5 shadow-2xl flex flex-col space-y-3 animate-scaleUp max-h-[85vh]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                        <T>Chọn Nhân Sự Thực Hiện Task</T>
                      </h3>
                      <button
                        onClick={() => setShowDesktopStaffPickerModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm theo tên, bộ phận hoặc số điện thoại..."
                        value={desktopStaffPickerSearchQuery}
                        onChange={(e) => setDesktopStaffPickerSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    {/* Staff List */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[360px]">
                      {users
                        .filter((u) => {
                          const q = desktopStaffPickerSearchQuery.toLowerCase();
                          return (
                            u.fullName.toLowerCase().includes(q) ||
                            (u.position && u.position.toLowerCase().includes(q)) ||
                            (u.role && u.role.toLowerCase().includes(q)) ||
                            (u.department && u.department.toLowerCase().includes(q)) ||
                            (u.phone && u.phone.includes(q))
                          );
                        })
                        .map((u) => (
                          <button
                            key={u.id || u.phone}
                            type="button"
                            onClick={() => {
                              if (desktopStaffPickerTarget === "CONVERT") {
                                setDesktopTaskAssignedUser(u);
                              } else {
                                setDesktopEditTaskAssignedUser(u);
                              }
                              setShowDesktopStaffPickerModal(false);
                              setDesktopStaffPickerSearchQuery("");
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer text-left border border-transparent hover:border-blue-200 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 overflow-hidden">
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  u.fullName.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate notranslate" translate="no">
                                  {u.fullName}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {u.position || u.role} • {u.department || u.branch || "Tân Phú"}
                                </div>
                              </div>
                            </div>
                            <Check className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop Actions Catalog Modal (Danh mục Chỉ đạo & Đầu việc TASK) */}
              {showDesktopActionsCatalogModal && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[850px] p-6 shadow-2xl flex flex-col space-y-4 animate-scaleUp max-h-[90vh]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                          <ListTodo className="w-5 h-5 stroke-[2.5px]" />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-base">
                            <T>Danh Mục Chỉ Đạo & Đầu Việc (Tasks)</T>
                          </h3>
                          <p className="text-xs text-slate-400">
                            <T>Theo dõi, đôn đốc và hoàn thành các chỉ đạo, nhiệm vụ trong các cuộc thảo luận</T>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDesktopActionsCatalogModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      {/* Scope Toggle */}
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setDesktopActionsCatalogScope("CURRENT_TOPIC")}
                          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                            desktopActionsCatalogScope === "CURRENT_TOPIC"
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <T>Chủ đề hiện tại</T>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDesktopActionsCatalogScope("ALL_TOPICS")}
                          className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                            desktopActionsCatalogScope === "ALL_TOPICS"
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <T>Toàn bộ chủ đề</T>
                        </button>
                      </div>

                      {/* Type Filter */}
                      <div className="flex items-center gap-1">
                        {(["ALL", "TASK", "DIRECTIVE"] as const).map((tp) => (
                          <button
                            key={tp}
                            type="button"
                            onClick={() => setDesktopActionsCatalogTypeFilter(tp)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              desktopActionsCatalogTypeFilter === tp
                                ? "bg-slate-800 text-white border-slate-800"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <T>{tp === "ALL" ? "Tất cả loại" : tp === "TASK" ? "🎯 Đầu việc (Task)" : "⚡ Chỉ đạo"}</T>
                          </button>
                        ))}
                      </div>

                      {/* Status Filter */}
                      <div className="flex items-center gap-1">
                        {(["ALL", "PENDING", "COMPLETED"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDesktopActionsCatalogStatusFilter(st)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              desktopActionsCatalogStatusFilter === st
                                ? "bg-amber-600 text-white border-amber-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <T>{st === "ALL" ? "Tất cả trạng thái" : st === "PENDING" ? "⏳ Đang thực hiện" : "✓ Hoàn thành"}</T>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions List */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[480px]">
                      {(() => {
                        const targetTopicId = selectedTopicId || (topics[0]?.id);
                        const filteredReplies = replies.filter((r) => {
                          if (!r.actionType) return false;
                          if (desktopActionsCatalogScope === "CURRENT_TOPIC" && r.topicId !== targetTopicId) return false;
                          if (desktopActionsCatalogTypeFilter !== "ALL" && r.actionType !== desktopActionsCatalogTypeFilter) return false;
                          if (desktopActionsCatalogStatusFilter !== "ALL") {
                            if (r.actionType === "TASK" && r.actionData?.status !== desktopActionsCatalogStatusFilter) return false;
                          }
                          return true;
                        });

                        if (filteredReplies.length === 0) {
                          return (
                            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <ListTodo className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="text-xs font-bold text-slate-600">
                                <T>Chưa có chỉ đạo hoặc đầu việc (Task) nào trong danh mục này.</T>
                              </p>
                              <p className="text-[11px] text-slate-400 max-w-sm">
                                <T>Bạn có thể di chuột vào bất kỳ tin nhắn phản hồi nào và nhấn biểu tượng ⚡ để tạo chỉ đạo hoặc giao việc.</T>
                              </p>
                            </div>
                          );
                        }

                        return filteredReplies.map((r) => {
                          const topicOfReply = topics.find((t) => t.id === r.topicId);
                          const isDone = r.actionData?.status === "COMPLETED";

                          return (
                            <div
                              key={r.id}
                              className={`p-3.5 rounded-xl border transition-all ${
                                r.actionType === "DIRECTIVE"
                                  ? "bg-amber-50/40 border-amber-200"
                                  : isDone
                                  ? "bg-emerald-50/30 border-emerald-200"
                                  : "bg-white border-slate-200 hover:border-blue-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                                        r.actionType === "DIRECTIVE"
                                          ? "bg-amber-500 text-white border-amber-400"
                                          : isDone
                                          ? "bg-emerald-600 text-white border-emerald-500"
                                          : "bg-blue-600 text-white border-blue-500"
                                      }`}
                                    >
                                      {r.actionType === "DIRECTIVE" ? (
                                        <Zap className="w-3 h-3 fill-current" />
                                      ) : (
                                        <ListTodo className="w-3 h-3 stroke-[2.5px]" />
                                      )}
                                      <span>{r.actionType === "DIRECTIVE" ? "CHỈ ĐẠO" : "TASK"}</span>
                                    </span>

                                    {topicOfReply && (
                                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-xs bg-slate-100 px-2 py-0.5 rounded">
                                        <T>{topicOfReply.title}</T>
                                      </span>
                                    )}

                                    {r.actionType === "TASK" && r.actionData?.assignedToName && (
                                      <span className="text-[12px] text-blue-800 font-bold bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs">
                                        <T>Giao cho:</T> <strong className="notranslate text-blue-900 font-black text-[12.5px]" translate="no">{r.actionData.assignedToName}</strong>
                                      </span>
                                    )}

                                    {r.actionType === "DIRECTIVE" && r.actionData?.note && (
                                      <span className="text-[12px] text-amber-900 font-bold bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                                        <T>Chỉ đạo:</T> <strong className="notranslate text-amber-950 font-black text-[12.5px]" translate="no">{r.actionData.note}</strong>
                                      </span>
                                    )}

                                    {r.actionData?.deadline && (
                                      <span className="text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                        <T>Hạn:</T> {r.actionData.deadline}
                                      </span>
                                    )}
                                  </div>

                                  {/* Structured Message Text with AI Summary Bullets */}
                                  <TaskStructuredContent text={r.message} type={r.actionType} />

                                  {/* Action Note / Yêu cầu chỉ đạo nổi bật */}
                                  {r.actionData?.note && (
                                    <div className="p-2.5 px-3 rounded-xl bg-amber-50/90 border-2 border-amber-300/90 text-amber-950 flex items-start gap-2 shadow-2xs mt-2">
                                      <Zap className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                                      <div className="text-[13px] leading-snug">
                                        <span className="font-extrabold text-amber-900 text-[11.5px] uppercase tracking-wide mr-1.5 inline-block">
                                          <T>Yêu cầu:</T>
                                        </span>
                                        <strong className="font-black text-slate-900 text-[13.5px] notranslate" translate="no">
                                          "{r.actionData.note}"
                                        </strong>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Actions on Right */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {r.actionType === "TASK" && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTaskStatusDesktop(r.id)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                        isDone
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                                          : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-emerald-50"
                                      }`}
                                    >
                                      {isDone ? "✓ Xong" : "⏳ Đang làm"}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDesktopEditingActionReply(r);
                                      setDesktopEditActionType(r.actionType || "DIRECTIVE");
                                      setDesktopEditTaskNote(r.actionData?.note || "");
                                      setDesktopEditTaskDeadline(r.actionData?.deadline || "");
                                      setDesktopEditTaskStatus(r.actionData?.status || "PENDING");
                                      const foundUser = users.find(
                                        (u) => (r.actionData?.assignedToId && (u.id === r.actionData.assignedToId || u.phone === r.actionData.assignedToId)) ||
                                               (r.actionData?.assignedToName && u.fullName === r.actionData.assignedToName)
                                      );
                                      setDesktopEditTaskAssignedUser(foundUser || null);
                                    }}
                                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer transition-colors"
                                    title="Sửa / Xem chi tiết"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop AI Summary Modal (Tóm Tắt AI) */}
              {showDesktopAiSummaryModal && (() => {
                const topic = topics.find((t) => t.id === selectedTopicId) || topics[0];
                if (!topic) return null;
                const topicReplies = replies.filter((r) => r.topicId === topic.id);
                const cachedSummary = desktopAiSummariesMap[topic.id];

                const summaryKeyPoints = cachedSummary?.keyPoints || [
                  `Cuộc thảo luận đã thu hút ${topicReplies.length} ý kiến phản hồi chuyên môn từ các nhân sự tham gia.`,
                  topic.description ? `Bối cảnh trọng tâm: ${topic.description}` : "Nội dung phản ánh được ghi nhận rõ ràng trên hệ thống.",
                  "Các đề xuất tập trung vào việc ổn định các yếu tố 4M1E và hạn chế tối đa tái diễn lỗi chất lượng."
                ];

                const summaryConsensus = cachedSummary?.consensus || (
                  topic.status === "RESOLVED"
                    ? "Tất cả các bên đã thống nhất phương án xử lý và hoàn tất khắc phục triệt để."
                    : "Đang trong tiến trình trao đổi và triển khai các bước khắc phục theo kế hoạch."
                );

                const summaryDirectives = topicReplies
                  .filter((r) => r.actionType)
                  .map((r) => `${r.actionType === "DIRECTIVE" ? "⚡ Chỉ đạo:" : "🎯 Task:"} ${r.message.slice(0, 70)}...`);

                return (
                  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[620px] p-6 shadow-2xl flex flex-col space-y-4 animate-scaleUp max-h-[85vh]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base">
                              <T>Tóm Tắt AI Cuộc Thảo Luận</T>
                            </h3>
                            <p className="text-xs text-slate-400 notranslate" translate="no">
                              {topic.title}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDesktopAiSummaryModal(false)}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                        {/* Key Points */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase">
                            <Info className="w-3.5 h-3.5 text-blue-600" />
                            <T>Các Điểm Thảo Luận Then Chốt</T>
                          </div>
                          <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700 leading-relaxed">
                            {summaryKeyPoints.map((pt, idx) => (
                              <li key={idx}>
                                <T>{pt}</T>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Consensus */}
                        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <T>Đồng Thuận / Kết Luận Chung</T>
                          </div>
                          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                            <T>{summaryConsensus}</T>
                          </p>
                        </div>

                        {/* Directives & Tasks in Topic */}
                        {summaryDirectives.length > 0 && (
                          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 uppercase">
                              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                              <T>Chỉ Đạo & Đầu Việc Đã Giao ({summaryDirectives.length})</T>
                            </div>
                            <ul className="space-y-1 text-xs text-amber-950">
                              {summaryDirectives.map((d, idx) => (
                                <li key={idx} className="truncate">
                                  <T>{d}</T>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const fullText = `TÓM TẮT THẢO LUẬN: ${topic.title}\n\n1. Các điểm then chốt:\n${summaryKeyPoints.map(p => `- ${p}`).join("\n")}\n\n2. Kết luận:\n${summaryConsensus}`;
                            navigator.clipboard.writeText(fullText);
                            if (onShowToast) onShowToast("Đã sao chép tóm tắt vào clipboard!", "success");
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <T>Sao chép</T>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowDesktopAiSummaryModal(false)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <T>Đóng</T>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Desktop Members Modal (Thành viên tham gia & Quản lý Trưởng nhóm) */}
              {showDesktopMembersModal && (() => {
                const topic = topics.find((t) => t.id === selectedTopicId) || topics[0];
                if (!topic) return null;
                const invitedIds = topic.invitedUserIds || [];

                // Check if current user is Topic Leader or Admin
                const isCurrentUserLeader = checkIsTopicLeader(topic, currentUser) || currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER;

                // Identify Leader user object
                const leaderUser = users.find(
                  (u) =>
                    (topic.authorPhone && (u.phone === topic.authorPhone || u.id === topic.authorPhone)) ||
                    (topic.author && u.fullName?.toLowerCase() === topic.author?.toLowerCase()) ||
                    (topic.authorId && (u.id === topic.authorId || u.phone === topic.authorId)) ||
                    (topic.creatorPhone && (u.phone === topic.creatorPhone || u.id === topic.creatorPhone)) ||
                    (topic.creatorName && u.fullName?.toLowerCase() === topic.creatorName?.toLowerCase())
                );

                // Split into Joined Members and Available Non-members
                const joinedMembers = users.filter((u) => {
                  const uid = u.id || "";
                  const uphone = u.phone || "";
                  const uname = u.fullName || "";
                  const isLeader = leaderUser && (u.id === leaderUser.id || (u.phone && u.phone === leaderUser.phone));
                  return (
                    isLeader ||
                    invitedIds.includes(uid) ||
                    invitedIds.includes(uphone) ||
                    invitedIds.includes(uname)
                  );
                }).sort((a, b) => {
                  // Leader always on top
                  const aIsLeader = leaderUser && (a.id === leaderUser.id || (a.phone && a.phone === leaderUser.phone));
                  const bIsLeader = leaderUser && (b.id === leaderUser.id || (b.phone && b.phone === leaderUser.phone));
                  if (aIsLeader) return -1;
                  if (bIsLeader) return 1;
                  return a.fullName.localeCompare(b.fullName);
                });

                const nonMembers = users.filter((u) => {
                  const uid = u.id || "";
                  const uphone = u.phone || "";
                  const uname = u.fullName || "";
                  const isLeader = leaderUser && (u.id === leaderUser.id || (u.phone && u.phone === leaderUser.phone));
                  return (
                    !isLeader &&
                    !invitedIds.includes(uid) &&
                    !invitedIds.includes(uphone) &&
                    !invitedIds.includes(uname)
                  );
                });

                // Filter based on search query
                const q = desktopMemberSearchQuery.toLowerCase().trim();
                const filteredJoined = joinedMembers.filter((u) => {
                  if (!q) return true;
                  return (
                    u.fullName.toLowerCase().includes(q) ||
                    (u.position && u.position.toLowerCase().includes(q)) ||
                    (u.role && u.role.toLowerCase().includes(q)) ||
                    (u.department && u.department.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q))
                  );
                });

                const filteredNonMembers = nonMembers.filter((u) => {
                  if (!q) return true;
                  return (
                    u.fullName.toLowerCase().includes(q) ||
                    (u.position && u.position.toLowerCase().includes(q)) ||
                    (u.role && u.role.toLowerCase().includes(q)) ||
                    (u.department && u.department.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q))
                  );
                });

                return (
                  <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[540px] p-5 shadow-2xl flex flex-col space-y-3.5 animate-scaleUp max-h-[88vh]">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <T>Thành Viên & Phân Quyền Nhóm Thảo Luận</T>
                          </h3>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                              <T>Trưởng nhóm:</T> <span translate="no" className="notranslate">{topic.author || topic.creatorName || leaderUser?.fullName || "Chưa gán"}</span>
                            </span>
                            {isCurrentUserLeader && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                                <T>(Bạn có quyền Trưởng nhóm)</T>
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowDesktopMembersModal(false);
                            setDesktopMemberSearchQuery("");
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 2 Tabs Switcher */}
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setDesktopMemberModalTab("MEMBERS")}
                          className={`py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            desktopMemberModalTab === "MEMBERS"
                              ? "bg-white text-blue-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span><T>Thành viên trong nhóm</T> ({joinedMembers.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDesktopMemberModalTab("ADD")}
                          className={`py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            desktopMemberModalTab === "ADD"
                              ? "bg-white text-emerald-700 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span><T>Thêm thành viên mới</T> ({nonMembers.length})</span>
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder={
                            desktopMemberModalTab === "MEMBERS"
                              ? "Tìm kiếm thành viên trong nhóm..."
                              : "Tìm nhân sự để mời vào nhóm (tên, mã NV, phòng ban)..."
                          }
                          value={desktopMemberSearchQuery}
                          onChange={(e) => setDesktopMemberSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                        />
                        {desktopMemberSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setDesktopMemberSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Tab 1: Current Joined Members (Được đưa lên TOP ĐẦU) */}
                      {desktopMemberModalTab === "MEMBERS" && (
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px]">
                          {filteredJoined.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                              <T>Không tìm thấy thành viên nào phù hợp trong nhóm.</T>
                            </div>
                          ) : (
                            filteredJoined.map((u) => {
                              const isLeader = leaderUser && (u.id === leaderUser.id || (u.phone && u.phone === leaderUser.phone));
                              const isMe = currentUser && (u.id === currentUser.id || (u.phone && u.phone === currentUser.phone));

                              return (
                                <div
                                  key={u.id || u.phone}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                    isLeader
                                      ? "bg-amber-50/70 border-amber-200/90 shadow-2xs"
                                      : "bg-white hover:bg-slate-50/80 border-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0 ${
                                        isLeader
                                          ? "bg-gradient-to-tr from-amber-500 to-amber-700 ring-2 ring-amber-300"
                                          : "bg-gradient-to-tr from-blue-600 to-indigo-600"
                                      }`}
                                    >
                                      {u.avatar ? (
                                        <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        u.fullName.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-900 text-xs truncate notranslate" translate="no">
                                          {u.fullName}
                                        </span>
                                        {isLeader && (
                                          <span className="text-[9.5px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                            <T>Trưởng nhóm</T>
                                          </span>
                                        )}
                                        {isMe && (
                                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                            <T>Tôi</T>
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {u.position || u.role} • {u.department || u.branch || "Tân Phú"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isLeader ? (
                                      <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 select-none">
                                        <T>Chủ trì</T>
                                      </span>
                                    ) : isCurrentUserLeader ? (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveUserFromTopicDesktop(u, topic)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                        title="Mời thành viên này ra khỏi nhóm thảo luận"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" />
                                        <T>Mời ra khỏi nhóm</T>
                                      </button>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 select-none">
                                        <T>Thành viên ✓</T>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* Tab 2: Add New Members */}
                      {desktopMemberModalTab === "ADD" && (
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px]">
                          {filteredNonMembers.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-xs font-semibold">
                              <T>Tất cả nhân sự phù hợp đã có trong nhóm thảo luận.</T>
                            </div>
                          ) : (
                            filteredNonMembers.map((u) => {
                              return (
                                <div
                                  key={u.id || u.phone}
                                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                                      {u.avatar ? (
                                        <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        u.fullName.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-900 text-xs truncate notranslate" translate="no">
                                        {u.fullName}
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {u.position || u.role} • {u.department || u.branch || "Tân Phú"}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserInviteDesktop(u, topic)}
                                    className="px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white flex items-center gap-1 shadow-2xs"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <T>+ Thêm vào nhóm</T>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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
                              ? "Phân tích Cơ hội & Thách thức 4M1E1I"
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
                          ? "Bảng Phân tích Cơ hội & Thách thức"
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
                                    ? "Trí tuệ nhân tạo đang phân tích cơ hội & thách thức..."
                                    : "Trí tuệ nhân tạo đang phân tích lỗi..."}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                <span translate="no" className="notranslate">
                                  {aiAnalysisReport?.reportType === "DSA" || aiAnalysisReport?.isSpotlight
                                    ? "Đang rà soát cơ hội, thách thức và đánh giá quy tắc nghiêm ngặt 4M1E1I"
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
                                  ? "Bấm nút \"PHÂN TÍCH CƠ HỘI & THÁCH THỨC\" để bắt đầu"
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

      {/* Fullscreen Image Preview Lightbox */}
      {desktopPreviewImage && (
        <div
          onClick={() => setDesktopPreviewImage(null)}
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center cursor-default"
          >
            <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-white">
              <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-300">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <T>Xem hình ảnh đính kèm</T>
              </span>
              <button
                type="button"
                onClick={() => setDesktopPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 max-h-[calc(90vh-60px)] overflow-auto flex items-center justify-center">
              <img
                src={desktopPreviewImage}
                alt="Full preview"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Khởi tạo Thảo luận Chuyên đề Khẩn cấp (Desktop) */}
      {emergencyDiscussionReport && (
        <div
          data-desktop-emergency-modal="true"
          className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white shadow-md">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                    <T>Khởi tạo Thảo luận Chuyên đề</T>
                    <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-black">
                      {emergencyDiscussionReport.reportType || "KPH"}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    <T>Mở phòng trao đổi và phân công xử lý cho sự cố này</T>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmergencyDiscussionReport(null);
                  setEmergencyInvitedUserIds([]);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  <T>Tiêu đề chủ đề:</T>
                </label>
                <input
                  type="text"
                  value={emergencyTitle}
                  onChange={(e) => setEmergencyTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thảo luận..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  <T>Phân loại chủ đề:</T>
                </label>
                <select
                  value={emergencyCategory}
                  onChange={(e) => setEmergencyCategory(e.target.value as ForumTopicCategory)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all font-medium text-slate-800 cursor-pointer"
                >
                  <option value="Thảo luận KPH">Thảo luận KPH (Sự cố không phù hợp)</option>
                  <option value="Góp ý chức năng">Góp ý chức năng</option>
                  <option value="Đổi mới sáng tạo">Đổi mới sáng tạo</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  <T>Tóm tắt bối cảnh sự cố:</T>
                </label>
                <textarea
                  value={emergencyDesc}
                  onChange={(e) => setEmergencyDesc(e.target.value)}
                  rows={4}
                  placeholder="Nội dung tóm tắt sự cố..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl focus:bg-white focus:border-rose-500 outline-none transition-all text-slate-700 font-mono resize-none leading-relaxed"
                />
              </div>

              {/* Tag / Invite Members Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <T>Thành viên tham gia thảo luận ({emergencyInvitedUserIds.length}):</T>
                  </label>
                  {emergencyInvitedUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEmergencyInvitedUserIds([])}
                      className="text-[10px] text-slate-400 hover:text-red-500 font-bold cursor-pointer"
                    >
                      <T>Xóa chọn</T>
                    </button>
                  )}
                </div>

                <div className="relative mb-2">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={invitedSearchQuery}
                    onChange={(e) => setInvitedSearchQuery(e.target.value)}
                    placeholder="Tìm nhân sự hoặc phòng ban để mời tham gia..."
                    className="w-full pl-7 pr-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-rose-500 outline-none transition-all"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-1.5 space-y-1 bg-slate-50/50">
                  {users
                    ?.filter((u) => {
                      if (!invitedSearchQuery.trim()) return true;
                      const q = invitedSearchQuery.toLowerCase();
                      return (
                        u.fullName?.toLowerCase().includes(q) ||
                        u.department?.toLowerCase().includes(q) ||
                        u.branch?.toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const uId = u.id || u.phone || "";
                      const isSelected = emergencyInvitedUserIds.includes(uId);
                      return (
                        <div
                          key={uId || u.phone}
                          onClick={() => {
                            if (isSelected) {
                              setEmergencyInvitedUserIds(prev => prev.filter(id => id !== uId));
                            } else {
                              setEmergencyInvitedUserIds(prev => [...prev, uId]);
                            }
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors text-[11px] ${
                            isSelected
                              ? "bg-rose-50 border border-rose-200 text-rose-900 font-bold"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${
                              isSelected ? "bg-rose-500" : "bg-slate-400"
                            }`}>
                              {u.fullName?.slice(0, 1) || "U"}
                            </div>
                            <span className="truncate">{u.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-normal truncate">
                              ({u.department || u.branch || "Tân Phú"})
                            </span>
                          </div>
                          <div className="shrink-0 ml-2">
                            {isSelected ? (
                              <CheckCircle className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEmergencyDiscussionReport(null);
                  setEmergencyInvitedUserIds([]);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-250 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                <T>Hủy</T>
              </button>
              <button
                type="button"
                disabled={!emergencyTitle.trim()}
                onClick={handleCreateEmergencyDiscussion}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md hover:shadow-lg active:scale-95 cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-wide"
              >
                <Flame className="w-3.5 h-3.5" />
                <T>Bắt đầu thảo luận</T>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
