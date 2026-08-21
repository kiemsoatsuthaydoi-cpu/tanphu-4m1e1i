import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  ForumTopic, 
  ForumReply, 
  ForumReplyAttachment,
  ForumTopicCategory, 
  ForumTopicStatus, 
  User, 
  UserRole,
  QualityReport,
  QualityReportResolution 
} from "../types";
import { isTopicInScope, getEffectiveCompanyScope, isUserAllowedToViewTopic } from "../utils/companyScope";
import { resolveSenderInfo, isCurrentUserSender } from "../utils/userResolver";
import { loadImage, processImage } from "../utils/imageProcessor";
import { 
  Search, 
  Pin, 
  MessageSquare, 
  Plus, 
  ArrowLeft, 
  Send,
  Clock,
  User as UserIcon,
  MessageCircle,
  Home,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  X,
  ExternalLink,
  Check,
  Users,
  UserCheck,
  Zap,
  Target,
  Sparkles,
  Copy,
  RotateCw,
  CheckCircle2,
  ListTodo,
  Calendar,
  CornerUpLeft,
  Crown,
  UserMinus,
  Smile,
  Image as ImageIcon,
  Paperclip,
  FileText,
  Download,
  Eye,
  Heart,
  Camera,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter
} from "lucide-react";
import { T } from "./TranslateText";
import { MentionTextArea, MentionInput } from "./MentionTextArea";
import { TaskStructuredContent } from "./TaskStructuredContent";
import { renderFormattedMessage } from "../utils/formatMessage";
import { formatNameCapitalized } from "../utils/branchHelpers";
import { EMOJI_CATEGORIES } from "./RichChatInputBox";

interface MobileForumViewProps {
  topics: ForumTopic[];
  replies: ForumReply[];
  currentUser: User | null;
  users?: User[];
  reports?: QualityReport[];
  onUpdateReport?: (report: QualityReport) => void;
  showToast?: (msg: string) => void;
  onAddForumTopic?: (title: string, description: string, category: ForumTopicCategory, reportId?: string, invitedUserIds?: string[]) => void;
  onAddForumReply?: (topicId: string, message: string, extraData?: Partial<ForumReply>) => void;
  onUpdateForumTopicStatus?: (topicId: string, status: ForumTopicStatus) => void;
  onToggleForumTopicPin?: (topicId: string) => void;
  onEditForumTopic?: (topicId: string, title: string, description: string, category: ForumTopicCategory) => void;
  onUpdateTopicInvitedUsers?: (topicId: string, invitedUserIds: string[]) => void;
  onDeleteForumTopic?: (topicId: string) => void;
  theme: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    lightBg: string;
    lightText: string;
  };
  onGoHome?: (reportId?: string) => void;
  initialSelectedTopicId?: string | null;
  autoOpenActionsCatalogTopicId?: string | null;
  onClearAutoOpenActionsCatalog?: () => void;
  onTopicSelect?: (topicId: string | null) => void;
  onEditForumReply?: (replyId: string, updatedData: string | Partial<ForumReply>) => void;
  onDeleteForumReply?: (replyId: string) => void;
  onLikeForumReply?: (replyId: string) => void;
  onOpenDirectChat?: (user: User) => void;
}

export default function MobileForumView({
  topics,
  replies,
  currentUser,
  users = [],
  reports = [],
  onUpdateReport,
  showToast,
  onAddForumTopic,
  onAddForumReply,
  onUpdateForumTopicStatus,
  onToggleForumTopicPin,
  onEditForumTopic,
  onUpdateTopicInvitedUsers,
  onDeleteForumTopic,
  onEditForumReply,
  onDeleteForumReply,
  onLikeForumReply,
  theme,
  onGoHome,
  initialSelectedTopicId,
  autoOpenActionsCatalogTopicId,
  onClearAutoOpenActionsCatalog,
  onTopicSelect,
  onOpenDirectChat
}: MobileForumViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialSelectedTopicId || null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const titlePopRef = useRef<HTMLDivElement>(null);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCloseTopicModal, setShowCloseTopicModal] = useState(false);
  const [conclusionText, setConclusionText] = useState("");
  const [syncToReport, setSyncToReport] = useState(true);

  const handleSelectTopic = (topicId: string | null) => {
    setSelectedTopicId(topicId);
    if (onTopicSelect) {
      onTopicSelect(topicId);
    }
  };

  useEffect(() => {
    setSelectedTopicId(initialSelectedTopicId || null);
  }, [initialSelectedTopicId]);

  useEffect(() => {
    if (autoOpenActionsCatalogTopicId) {
      if (selectedTopicId !== autoOpenActionsCatalogTopicId) {
        setSelectedTopicId(autoOpenActionsCatalogTopicId);
        if (onTopicSelect) onTopicSelect(autoOpenActionsCatalogTopicId);
      }
      setActionsCatalogScope("CURRENT_TOPIC");
      setShowActionsCatalogModal(true);
      if (onClearAutoOpenActionsCatalog) {
        onClearAutoOpenActionsCatalog();
      }
    }
  }, [autoOpenActionsCatalogTopicId, selectedTopicId, onTopicSelect, onClearAutoOpenActionsCatalog]);

  useEffect(() => {
    setIsDescExpanded(false);
  }, [selectedTopicId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (titlePopRef.current && !titlePopRef.current.contains(event.target as Node)) {
        setIsDescExpanded(false);
      }
    };

    if (isDescExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDescExpanded]);

  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<ForumTopicCategory>("Góp ý chức năng");
  const [newInvitedUserIds, setNewInvitedUserIds] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [forumScrollTop, setForumScrollTop] = useState(0);

  // Edit & Delete topic state
  const [editingTopic, setEditingTopic] = useState<ForumTopic | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCategory, setEditCategory] = useState<ForumTopicCategory>("Góp ý chức năng");
  const [deletingTopic, setDeletingTopic] = useState<ForumTopic | null>(null);

  // Reply state
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState("");
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
  const [localReplies, setLocalReplies] = useState<ForumReply[]>(replies);

  // Members invitation modal state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberModalTab, setMemberModalTab] = useState<"MEMBERS" | "ADD">("MEMBERS");

  // Feature 4: Convert Chat to Action state
  const [convertModalReply, setConvertModalReply] = useState<ForumReply | null>(null);
  const [actionTypeChoice, setActionTypeChoice] = useState<"DIRECTIVE" | "TASK">("DIRECTIVE");
  const [taskAssignedUser, setTaskAssignedUser] = useState<User | null>(null);
  const [taskDeadline, setTaskDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  });
  const [taskNote, setTaskNote] = useState("");

  // Directives & Tasks Catalog state
  const [showActionsCatalogModal, setShowActionsCatalogModal] = useState(false);
  const [actionsCatalogScope, setActionsCatalogScope] = useState<"ALL_TOPICS" | "CURRENT_TOPIC">("ALL_TOPICS");
  const [actionsCatalogTypeFilter, setActionsCatalogTypeFilter] = useState<"ALL" | "DIRECTIVE" | "TASK">("ALL");
  const [actionsCatalogStatusFilter, setActionsCatalogStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [actionsCatalogOnlyMine, setActionsCatalogOnlyMine] = useState(false);
  const [actionsCatalogSearchQuery, setActionsCatalogSearchQuery] = useState("");

  // Edit Action (Directive / Task) modal state
  const [editingActionReply, setEditingActionReply] = useState<ForumReply | null>(null);
  const [editActionType, setEditActionType] = useState<"DIRECTIVE" | "TASK">("DIRECTIVE");
  const [editTaskAssignedUser, setEditTaskAssignedUser] = useState<User | null>(null);
  const [editTaskDeadline, setEditTaskDeadline] = useState<string>("");
  const [editTaskNote, setEditTaskNote] = useState<string>("");
  const [editTaskStatus, setEditTaskStatus] = useState<"PENDING" | "COMPLETED">("PENDING");

  // Delete Action confirmation state
  const [deletingActionReplyId, setDeletingActionReplyId] = useState<string | null>(null);

  // Custom Compact Staff Picker Modal state
  const [showStaffPickerModal, setShowStaffPickerModal] = useState(false);
  const [staffPickerSearchQuery, setStaffPickerSearchQuery] = useState("");
  const [staffPickerTarget, setStaffPickerTarget] = useState<"CONVERT" | "EDIT">("CONVERT");

  // Feature 4: AI Discussion Summarizer state
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [localPinnedAiSummary, setLocalPinnedAiSummary] = useState(false);
  const [copiedSummaryToast, setCopiedSummaryToast] = useState(false);
  const [aiSummariesMap, setAiSummariesMap] = useState<Record<string, {
    keyPoints: string[];
    consensus: string;
    directivesAndTasks: string[];
    updatedAt: string;
  }>>({});

  // Zalo-style Quoted Reply state
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; message: string } | null>(null);

  // Active / Selected Message ID on mobile tap
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  // Zalo-style Emoji Quick Picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeForumEmojiTab, setActiveForumEmojiTab] = useState<string>("ALL");
  const [showForumSizeDropdown, setShowForumSizeDropdown] = useState(false);
  const [forumTextSize, setForumTextSize] = useState<"S" | "M" | "L">("M");
  const EMOJI_LIST = ["👍", "👏", "💪", "❤️", "😊", "🎉", "🤝", "💡", "✅", "🔥", "📌", "🎯", "🙏", "🙌", "⭐", "✨", "🚀", "😅", "😍", "🍻"];

  // Compressed Image Attachments state
  const [attachedImages, setAttachedImages] = useState<{ base64: string; sizeKb: number; name?: string }[]>([]);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // PDF Document Attachment state
  const [attachedPdf, setAttachedPdf] = useState<{ name: string; url: string; sizeKb: number } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Image Lightbox Modal state
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Helper to process array of image files with client-side canvas compression under 100KB
  const processAndAttachImageFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsCompressingImages(true);
    try {
      const newImgs: { base64: string; sizeKb: number; name?: string }[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const img = await loadImage(file);
        const res = await processImage(img, { rotationAngle: 0, targetMaxKb: 100 });
        newImgs.push({
          base64: res.compressedBase64,
          sizeKb: res.compressedSizeKb,
          name: file.name || `Image_${newImgs.length + 1}.png`
        });
      }
      if (newImgs.length > 0) {
        setAttachedImages(prev => [...prev, ...newImgs].slice(0, 5));
      }
    } catch (err) {
      console.error("Lỗi xử lý dán/nén hình ảnh:", err);
    } finally {
      setIsCompressingImages(false);
    }
  };

  const handleImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    await processAndAttachImageFiles(fileArray);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Clipboard Paste Event Handler (Ctrl + V / Cmd + V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const imageFiles: File[] = [];

    // 1. Check clipboard files
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file.type.startsWith("image/")) {
          imageFiles.push(file);
        }
      }
    }

    // 2. Check clipboard items
    if (imageFiles.length === 0 && clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await processAndAttachImageFiles(imageFiles);
    }
  };

  const handlePdfSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Vui lòng chọn tập tin định dạng PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File PDF có dung lượng lớn hơn 5MB. Vui lòng chọn file nhẹ hơn.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const sizeKb = Math.round(file.size / 1024);
      setAttachedPdf({
        name: file.name,
        url: base64,
        sizeKb
      });
    };
    reader.readAsDataURL(file);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const scrollToReply = (replyId: string) => {
    const el = document.getElementById(`reply-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-400", "bg-amber-100");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-amber-400", "bg-amber-100");
      }, 2000);
    }
  };

  // Helper to format topic title cleanly without mid-word cuts, allowing up to 2 full lines of context (~145 chars)
  const cleanDisplayTitle = (title: string, description?: string, report?: QualityReport | null): string => {
    if (!title) return "";
    let cleaned = title.replace(/Thảo luận:\s*/gi, "");
    cleaned = cleaned.replace(/\bPHẢN H\.\.\.$/gi, "PHẢN HỒI...");
    cleaned = cleaned.replace(/\s+[A-Za-zÀ-ỹ]{1,2}\.\.\.$/gi, "...");

    // If title was truncated with "..." at the end (under 110 chars), enrich it using report or description if available
    if ((cleaned.endsWith("...") || cleaned.endsWith("…")) && cleaned.length < 110) {
      const sourceText = report?.content || description || "";
      if (sourceText) {
        const cleanSource = sourceText.replace(/\s+/g, " ").trim();
        const baseTitle = cleaned.replace(/[\.\s]+$/, "");
        const pureTitleText = baseTitle.replace(/^(🔥\s*)?(\[[A-Z0-9_-]+\]\s*)?/, "").trim();
        
        if (pureTitleText && cleanSource.toLowerCase().includes(pureTitleText.toLowerCase().slice(0, 15))) {
          const prefixMatch = baseTitle.match(/^(🔥\s*)?(\[[A-Z0-9_-]+\]\s*)?/);
          const prefix = prefixMatch ? prefixMatch[0] : "";
          
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
          cleaned = `${prefix}${expandedText}`;
        }
      }
    }

    return cleaned;
  };

  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  const forumScrollRef = useRef<HTMLDivElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const effectiveCompany = getEffectiveCompanyScope(currentUser, "ALL");

  const scopedTopics = useMemo(() => {
    return topics.filter(t => {
      if (!isTopicInScope(t, effectiveCompany)) {
        return false;
      }
      return isUserAllowedToViewTopic(t, currentUser, replies, reports);
    });
  }, [topics, effectiveCompany, currentUser, replies, reports]);

  const selectedTopic = scopedTopics.find(t => t.id === selectedTopicId) || null;
  const matchedReport = selectedTopic?.reportId ? reports.find(r => r.id === selectedTopic.reportId || r.reportCode === selectedTopic.reportId) : null;
  const topicReplies = localReplies
    .filter(r => r.topicId === selectedTopicId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Helper: Check if user is Topic Leader
  const checkIsTopicLeader = (topic?: ForumTopic | null, user?: User | null): boolean => {
    if (!topic || !user) return false;
    return Boolean(
      (topic.creatorPhone && (user.phone === topic.creatorPhone || user.id === topic.creatorPhone)) ||
      (topic.creatorName && user.fullName?.trim().toLowerCase() === topic.creatorName?.trim().toLowerCase()) ||
      (topic.authorPhone && (user.phone === topic.authorPhone || user.id === topic.authorPhone)) ||
      (topic.author && user.fullName?.trim().toLowerCase() === topic.author?.trim().toLowerCase()) ||
      (topic.authorId && (user.id === topic.authorId || user.phone === topic.authorId))
    );
  };

  const checkUserJoined = (user: User) => {
    if (!selectedTopic) return false;
    if (checkIsTopicLeader(selectedTopic, user)) {
      return true;
    }
    const invitedList = selectedTopic.invitedUserIds || [];
    return (
      invitedList.includes(user.id) ||
      invitedList.includes(user.phone) ||
      invitedList.includes(user.fullName)
    );
  };

  // Handler: Kick / Remove member from Topic (Leader / Admin)
  const handleRemoveUserFromTopic = (user: User) => {
    if (!selectedTopic) return;
    const currentList = selectedTopic.invitedUserIds || [];
    const newList = currentList.filter(
      id => id !== user.id && id !== user.phone && id !== user.fullName
    );
    if (onUpdateTopicInvitedUsers) {
      onUpdateTopicInvitedUsers(selectedTopic.id, newList);
    }
  };

  const handleToggleUserInvite = (user: User) => {
    if (!selectedTopic) return;
    const currentList = selectedTopic.invitedUserIds || [];
    const isJoined = checkUserJoined(user);
    const userIdKey = user.id || user.phone || user.fullName;

    let newList: string[];
    if (isJoined) {
      newList = currentList.filter(
        id => id !== user.id && id !== user.phone && id !== user.fullName
      );
    } else {
      newList = Array.from(new Set([...currentList, userIdKey]));
    }

    if (onUpdateTopicInvitedUsers) {
      onUpdateTopicInvitedUsers(selectedTopic.id, newList);
    }
  };

  const joinedUserCount = users.filter(u => checkUserJoined(u)).length;

  const filteredUsers = users.filter(u => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase().trim();
    return (
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const handleSaveEditedReply = (replyId: string) => {
    if (!editingReplyText.trim()) return;
    setLocalReplies(prev => prev.map(r => r.id === replyId ? { ...r, message: editingReplyText.trim() } : r));
    if (onEditForumReply) {
      onEditForumReply(replyId, editingReplyText.trim());
    }
    setEditingReplyId(null);
    setEditingReplyText("");
  };

  const handleDeleteReplyConfirm = (replyId: string) => {
    setLocalReplies(prev => prev.filter(r => r.id !== replyId));
    if (onDeleteForumReply) {
      onDeleteForumReply(replyId);
    }
    setDeletingReplyId(null);
  };

  const handleToggleLikeReply = (replyId: string) => {
    if (!currentUser) return;
    setLocalReplies(prev => prev.map(r => {
      if (r.id !== replyId) return r;
      const userPhone = currentUser.phone || currentUser.id;
      const likedBy = r.likedBy || [];
      const hasLiked = likedBy.includes(userPhone);
      const newLikedBy = hasLiked ? likedBy.filter(p => p !== userPhone) : [...likedBy, userPhone];
      return {
        ...r,
        likes: newLikedBy.length,
        likedBy: newLikedBy
      };
    }));
    if (onLikeForumReply) {
      onLikeForumReply(replyId);
    }
  };

  // Action Conversion Handlers
  const handleSaveConvertAction = () => {
    if (!convertModalReply) return;

    const creatorName = currentUser?.fullName || "Chủ trì";
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}/${month}/${year}`;

    const updatedReply: ForumReply = {
      ...convertModalReply,
      actionType: actionTypeChoice,
      actionData: {
        createdByName: creatorName,
        createdAt: dateStr,
        note: taskNote.trim() || undefined,
        ...(actionTypeChoice === "TASK" ? {
          assignedToName: taskAssignedUser?.fullName || "Chưa phân công",
          assignedToId: taskAssignedUser?.id || taskAssignedUser?.phone || "",
          deadline: taskDeadline,
          status: "PENDING"
        } : {})
      }
    };

    setLocalReplies(prev => prev.map(r => r.id === convertModalReply.id ? updatedReply : r));
    if (onEditForumReply) {
      onEditForumReply(convertModalReply.id, updatedReply);
    }

    setConvertModalReply(null);
    setTaskNote("");
  };

  const handleRemoveAction = (replyId: string) => {
    let updatedReply: ForumReply | null = null;
    setLocalReplies(prev => prev.map(r => {
      if (r.id !== replyId) return r;
      const copy = { ...r };
      delete copy.actionType;
      delete copy.actionData;
      updatedReply = copy;
      return copy;
    }));
    if (onEditForumReply && updatedReply) {
      onEditForumReply(replyId, updatedReply);
    }
  };

  const handleSaveEditAction = () => {
    if (!editingActionReply) return;

    const creatorName = editingActionReply.actionData?.createdByName || currentUser?.fullName || "Chủ trì";
    const createdAt = editingActionReply.actionData?.createdAt || "28/07/26";

    const updatedReply: ForumReply = {
      ...editingActionReply,
      actionType: editActionType,
      actionData: {
        createdByName: creatorName,
        createdAt: createdAt,
        note: editTaskNote.trim() || undefined,
        ...(editActionType === "TASK" ? {
          assignedToName: editTaskAssignedUser?.fullName || "Chưa phân công",
          assignedToId: editTaskAssignedUser?.id || editTaskAssignedUser?.phone || "",
          deadline: editTaskDeadline || taskDeadline,
          status: editTaskStatus
        } : {})
      }
    };

    setLocalReplies(prev => prev.map(r => r.id === editingActionReply.id ? updatedReply : r));
    if (onEditForumReply) {
      onEditForumReply(editingActionReply.id, updatedReply);
    }

    setEditingActionReply(null);
  };

  const handleDeleteActionConfirm = (replyId: string) => {
    handleRemoveAction(replyId);
    setDeletingActionReplyId(null);
  };

  const handleToggleTaskStatus = (replyId: string) => {
    let updatedReply: ForumReply | null = null;
    setLocalReplies(prev => prev.map(r => {
      if (r.id !== replyId || !r.actionData) return r;
      const newStatus = r.actionData.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      updatedReply = {
        ...r,
        actionData: {
          ...r.actionData,
          status: newStatus
        }
      };
      return updatedReply;
    }));
    if (onEditForumReply && updatedReply) {
      onEditForumReply(replyId, updatedReply);
    }
  };

  // Helper function to capitalize words
  const capitalizeWords = (str: string): string => {
    if (!str) return "";
    return formatNameCapitalized(str);
  };

  // Helper function to render @mentions in blue
  const renderMentionText = (text: string | undefined | null, isDarkBg: boolean = false): React.ReactNode => {
    if (!text || typeof text !== "string" || !text.includes("@")) {
      return text || "";
    }

    // Collect candidates from users prop and common system tags
    const candidatesSet = new Set<string>();
    if (users && users.length > 0) {
      users.forEach((u) => {
        if (u.fullName && u.fullName.trim()) {
          candidatesSet.add(u.fullName.trim());
          const parts = u.fullName.trim().split(/\s+/);
          if (parts.length >= 2) {
            candidatesSet.add(parts.slice(-2).join(" ")); // e.g. "Nhật Trường"
          }
          if (parts[parts.length - 1].length >= 2) {
            candidatesSet.add(parts[parts.length - 1]); // e.g. "Trường"
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

    // 1. Check known candidates
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

    // 2. Fallback regex for generic @mentions (capturing capitalized names or words following @)
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
        <span
          key={`tag-${idx}`}
          translate="no"
          className={
            isDarkBg
              ? "notranslate text-sky-200 font-extrabold bg-blue-800/90 px-1.5 py-0.5 rounded border border-blue-400/50 mx-0.5 inline-block text-[11.5px] shadow-2xs"
              : "notranslate text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80 mx-0.5 inline-block text-[11.5px] shadow-2xs"
          }
        >
          {displayTag}
        </span>
      );
      currentIndex = r.end;
    });

    if (currentIndex < text.length) {
      elements.push(text.substring(currentIndex));
    }

    return elements;
  };

  // AI Summary Generator
  const cleanSalutationsAndGreetings = (rawMsg: string): string => {
    if (!rawMsg) return "";
    let msg = rawMsg.replace(/\s+/g, ' ').trim();

    // Pattern for leading greetings, acknowledgements and conversational pleasantries
    const leadGreetingRegex = /^(hello|hi|dear\s+all|good\s+morning|good\s+afternoon|chào\s+(anh|chị|em|mọi\s+người|cả\s+nhà|sếp|ban|sếp\s+và\s+các\s+anh\s+chị|qc|p\.?\s*qlcl|qlcl)|dạ\s+vâng|dạ|thưa\s+sếp|kính\s+gửi|thân\s+gửi|cho\s+(mình|em)\s+hỏi|dạ\s+cho\s+em\s+hỏi)[.,!:-]?\s*/i;
    const leadAckRegex = /^(ok\s+(em|anh|chị|cả\s+nhà|mọi\s+người|sếp)|ok|tks\s+(em|anh|chị)|thanks|cảm\s+ơn\s+(anh|chị|em|mọi\s+người)|nhờ\s+(em|anh|chị))[.,!:-]?\s*/i;

    let prev = "";
    while (msg !== prev) {
      prev = msg;
      msg = msg.replace(leadGreetingRegex, "").trim();
      msg = msg.replace(leadAckRegex, "").trim();
    }

    // Trailing thanks / salutations
    msg = msg.replace(/\s*(tks\s*(em|anh|chị)?|thanks(\s*all)?|cảm\s+ơn(\s*(anh|chị|em))?)[.,!]?$/i, "").trim();

    if (msg.length > 0) {
      msg = msg.charAt(0).toUpperCase() + msg.slice(1);
    }

    return msg;
  };

  const generateAiSummaryForTopic = () => {
    if (!selectedTopic) return;
    setIsAiSummarizing(true);

    setTimeout(() => {
      const repliesList = topicReplies;
      const directives = repliesList.filter(r => r.actionType === "DIRECTIVE");
      const tasks = repliesList.filter(r => r.actionType === "TASK");

      const keyPoints: string[] = [];

      // 1. Full Topic & Problem Description details
      const fullTitle = cleanDisplayTitle(selectedTopic.title);
      keyPoints.push(`Chủ đề: "${fullTitle}" (Phân loại: ${selectedTopic.category || "Thảo luận"}).`);

      if (matchedReport) {
        const reportCode = matchedReport.reportCode || selectedTopic.reportId;
        const prodName = (matchedReport as any).productName || "";
        const errName = (matchedReport as any).errorName || (matchedReport as any).description || matchedReport.content || "";
        const notes = matchedReport.notes || "";
        
        let reportDetail = `Báo cáo KPH liên quan: ${reportCode}`;
        if (prodName) reportDetail += ` | Sản phẩm: ${prodName}`;
        if (errName) reportDetail += ` | Lỗi/Hiện tượng: ${errName}`;
        if (notes) reportDetail += ` (${notes})`;
        keyPoints.push(reportDetail);
      } else if (selectedTopic.description) {
        const cleanDesc = cleanSalutationsAndGreetings(selectedTopic.description);
        if (cleanDesc) {
          keyPoints.push(`Vấn đề ban đầu: ${cleanDesc}`);
        }
      }

      // 2. Overview of thread activity & participants
      const uniqueSenders = Array.from(new Set(repliesList.map(r => r.senderName).filter(Boolean)));
      if (uniqueSenders.length > 0) {
        keyPoints.push(`Số lượng trao đổi: ${repliesList.length} ý kiến từ ${uniqueSenders.length} nhân sự tham gia (${uniqueSenders.join(", ")}).`);
      } else {
        keyPoints.push(`Số lượng trao đổi: ${repliesList.length} ý kiến từ các thành viên.`);
      }

      // 3. Highlight main core ideas from members (stripped of pure greetings/filler)
      if (repliesList.length > 0) {
        const highlightsByAuthor: Record<string, string[]> = {};
        
        repliesList.forEach(r => {
          if (r.message.startsWith("📌 Đã chuyển tin nhắn thành")) return;
          const cleanedMsg = cleanSalutationsAndGreetings(r.message);
          // Filter out empty messages or ultra-short acknowledgements like "Ok", "Đã rõ"
          if (cleanedMsg && cleanedMsg.length > 3 && !/^(đã rõ|rõ rồi|đã nhận|ok|xong)$/i.test(cleanedMsg)) {
            const author = r.senderName || "Thành viên";
            if (!highlightsByAuthor[author]) highlightsByAuthor[author] = [];
            highlightsByAuthor[author].push(cleanedMsg);
          }
        });

        Object.entries(highlightsByAuthor).forEach(([author, msgs]) => {
          const combined = msgs.join(" | ");
          const displayText = combined.length > 250 ? combined.slice(0, 250) + "..." : combined;
          keyPoints.push(`Ý kiến từ ${author}: "${displayText}"`);
        });
      }

      // Consensus / Final Conclusion
      let consensus = "Các bên đã trao đổi, phân tích nguyên nhân và thống nhất phương án xử lý theo quy trình 4M1E1I, phân công rõ người phụ trách và hạn hoàn thành.";
      if (repliesList.length > 0) {
        const conclusionReplies = repliesList.filter(r => {
          const m = r.message.toLowerCase();
          return m.includes("ok") || m.includes("đồng ý") || m.includes("thống nhất") || m.includes("kết luận") || m.includes("xử lý") || m.includes("theo dõi") || m.includes("phản hồi");
        });

        if (conclusionReplies.length > 0) {
          const latestConc = conclusionReplies[conclusionReplies.length - 1];
          const cleanMsg = cleanSalutationsAndGreetings(latestConc.message) || latestConc.message.replace(/\s+/g, ' ').trim();
          consensus = `Kết luận gần nhất (${latestConc.senderName}): "${cleanMsg}"`;

          if (conclusionReplies.length >= 2) {
            const prevConc = conclusionReplies[conclusionReplies.length - 2];
            if (prevConc.id !== latestConc.id) {
              const prevMsg = cleanSalutationsAndGreetings(prevConc.message) || prevConc.message.replace(/\s+/g, ' ').trim();
              consensus += `\n• Ý kiến thống nhất (${prevConc.senderName}): "${prevMsg}"`;
            }
          }
        } else {
          const lastReply = repliesList[repliesList.length - 1];
          if (lastReply) {
            const cleanMsg = cleanSalutationsAndGreetings(lastReply.message) || lastReply.message.replace(/\s+/g, ' ').trim();
            consensus = `Kết luận gần nhất (${lastReply.senderName}): "${cleanMsg}"`;
          }
        }
      }

      // Directives & Tasks - Strip salutations for clean action items
      const actionItems: string[] = [];
      directives.forEach(d => {
        const cleanMsg = cleanSalutationsAndGreetings(d.message) || d.message.replace(/\s+/g, ' ').trim();
        actionItems.push(`⚡ Chỉ đạo (${d.senderName}): ${cleanMsg}`);
      });
      tasks.forEach(t => {
        const cleanMsg = cleanSalutationsAndGreetings(t.message) || t.message.replace(/\s+/g, ' ').trim();
        const statusText = t.actionData?.status === "COMPLETED" ? "[Đã xong]" : "[Đang làm]";
        actionItems.push(`📌 Đầu việc (${t.actionData?.assignedToName || "Nhân sự"}): ${cleanMsg} - Hạn: ${t.actionData?.deadline || "N/A"} ${statusText}`);
      });

      if (actionItems.length === 0) {
        actionItems.push("Chưa có chỉ đạo hoặc đầu việc (Task) giao trực tiếp nào trong lượt thảo luận này.");
      }

      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const timeStr = `${day}/${month}/${year} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setAiSummariesMap(prev => ({
        ...prev,
        [selectedTopic.id]: {
          keyPoints,
          consensus,
          directivesAndTasks: actionItems,
          updatedAt: timeStr
        }
      }));

      setIsAiSummarizing(false);
    }, 350);
  };

  const currentAiSummary = selectedTopic ? aiSummariesMap[selectedTopic.id] : null;

  const copyAiSummaryToClipboard = () => {
    if (!currentAiSummary || !selectedTopic) return;
    const textToCopy = `🤖 AI TÓM TẮT THẢO LUẬN: ${selectedTopic.title}
1. Ý CHÍNH:
${currentAiSummary.keyPoints.map(p => `• ${p}`).join("\n")}

2. PHƯƠNG ÁN THỐNG NHẤT:
• ${currentAiSummary.consensus}

3. CHỈ ĐẠO & ĐẦU VIỆC (TASKS):
${currentAiSummary.directivesAndTasks.map(a => `• ${a}`).join("\n")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSummaryToast(true);
    setTimeout(() => setCopiedSummaryToast(false), 2000);
  };

  useEffect(() => {
    if (selectedTopicId) {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTopicId, topicReplies.length]);

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onAddForumTopic) {
      onAddForumTopic(newTitle, newDesc.trim() || newTitle, newCategory, undefined, newInvitedUserIds);
    }
    setNewTitle("");
    setNewDesc("");
    setNewCategory("Góp ý chức năng");
    setNewInvitedUserIds([]);
    setIsCreatingTopic(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = replyMessage.trim().length > 0;
    const hasImages = attachedImages.length > 0;
    const hasPdf = Boolean(attachedPdf);

    if ((!hasText && !hasImages && !hasPdf) || !selectedTopicId) return;

    const attachmentsList: ForumReplyAttachment[] = [
      ...attachedImages.map(img => ({ type: "image" as const, url: img.base64, name: img.name, sizeKb: img.sizeKb })),
      ...(attachedPdf ? [{ type: "pdf" as const, url: attachedPdf.url, name: attachedPdf.name, sizeKb: attachedPdf.sizeKb }] : [])
    ];

    const extraData: Partial<ForumReply> = {
      ...(replyingTo ? { quotedReply: replyingTo } : {}),
      ...(attachmentsList.length > 0 ? { attachments: attachmentsList } : {})
    };

    if (onAddForumReply) {
      onAddForumReply(selectedTopicId, replyMessage.trim(), extraData);
    }

    setReplyMessage("");
    setReplyingTo(null);
    setAttachedImages([]);
    setAttachedPdf(null);
    setShowEmojiPicker(false);
  };

  const getStatusLabel = (status: ForumTopicStatus) => {
    switch (status) {
      case "OPEN": return "Đang mở";
      case "PROCESSING": return "Đang xử lý";
      case "RESOLVED": return "Đã giải quyết";
      default: return status;
    }
  };

  const getStatusColor = (status: ForumTopicStatus) => {
    switch (status) {
      case "OPEN": return "bg-blue-50 text-blue-700 border-blue-200";
      case "PROCESSING": return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredTopics = scopedTopics
    .filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "ALL" || t.category === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const categories: { value: string; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "Thảo luận KPH", label: "🔥 Thảo luận KPH" },
    { value: "Góp ý chức năng", label: "Góp ý chức năng" },
    { value: "Cải tiến 4M1E", label: "Cải tiến 4M1E" },
    { value: "Kiến nghị khác", label: "Kiến nghị khác" }
  ];

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isTopicCreator = Boolean(
    selectedTopic && currentUser && (
      (currentUser.phone && selectedTopic.creatorPhone && currentUser.phone === selectedTopic.creatorPhone) ||
      (currentUser.fullName && selectedTopic.creatorName && currentUser.fullName.trim().toLowerCase() === selectedTopic.creatorName.trim().toLowerCase())
    )
  );
  const canManageTopicStatus = isAdmin || isTopicCreator;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden select-none">
      {/* Search and Category Filter Header */}
      <div className="bg-white border-b border-slate-200 p-3 shrink-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm chủ đề thảo luận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs outline-none placeholder:text-slate-400 text-slate-700 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setActionsCatalogScope("ALL_TOPICS");
              setShowActionsCatalogModal(true);
            }}
            title="Xem Danh mục Chỉ đạo & Task"
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-[11px] font-black shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            <ListTodo className="w-3.5 h-3.5 text-amber-200" />
            <T>Danh mục Task</T>
          </button>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap cursor-pointer transition-colors ${
                categoryFilter === cat.value
                  ? `${theme.bg} text-white border-transparent`
                  : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <T>{cat.label}</T>
            </button>
          ))}
        </div>
      </div>

      {/* Topics List Container */}
      <div 
        ref={forumScrollRef}
        onScroll={(e) => setForumScrollTop(e.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-20 forum-scroll-container"
      >
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
            <T>Chưa có chủ đề nào trong chuyên mục này.</T>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const replyCount = replies.filter(r => r.topicId === topic.id).length;
            const getMobileStatusCardStyle = () => {
              if (topic.status === "RESOLVED") {
                return "bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-400";
              }
              if (topic.status === "PROCESSING") {
                return "bg-amber-50/40 border-amber-200/90 hover:border-amber-400";
              }
              return "bg-blue-50/40 border-blue-200/90 hover:border-blue-400";
            };

            return (
              <div
                key={topic.id}
                onClick={() => handleSelectTopic(topic.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                  topic.isPinned 
                    ? "border-amber-300 ring-1 ring-amber-300/50 " + getMobileStatusCardStyle()
                    : getMobileStatusCardStyle()
                }`}
              >
                {/* Topic Code & Category Row */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[9px] font-extrabold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    <span translate="no" className="notranslate">{topic.category}</span>
                  </span>
                  {topic.topicCode && (
                    <span className="text-[9.5px] font-mono font-black text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                      <span translate="no" className="notranslate">Mã: {topic.topicCode}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-extrabold text-[12px] text-blue-700 leading-snug line-clamp-2 break-words mb-1">
                  {topic.isPinned && (
                    <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 inline mr-1 -mt-0.5" />
                  )}
                  <span translate="no" className="notranslate">
                    {cleanDisplayTitle(topic.title, topic.description, reports.find(r => r.id === topic.reportId || r.reportCode === topic.reportId))}
                  </span>
                </h4>


                {/* Footer metrics */}
                <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-bold border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <UserIcon className="w-2.5 h-2.5 text-slate-400" />
                      <span translate="no" className="notranslate">{topic.creatorName}</span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span translate="no" className="notranslate">{topic.timestamp}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Admin quick card actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTopic(topic);
                            setEditTitle(topic.title);
                            setEditDesc(topic.description);
                            setEditCategory(topic.category);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                          title="Sửa chủ đề"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTopic(topic);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors border-none bg-transparent cursor-pointer"
                          title="Xóa chủ đề"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <span className="flex items-center gap-1 text-[10px] text-blue-600 font-black">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-50/50" />
                      <span translate="no" className="notranslate">{replyCount}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) to create topic - stacked above HOME button */}
      {!isCreatingTopic && !selectedTopicId && (
        <button
          onClick={() => setIsCreatingTopic(true)}
          className={`absolute bottom-[72px] right-4 w-11 h-11 rounded-full ${theme.bg} text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-90 transition-all cursor-pointer z-20 border-none`}
          title="Tạo chủ đề thảo luận"
        >
          <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}

      {/* Floating HOME Button on Forum Page - stacked at the bottom right */}
      {!isCreatingTopic && !selectedTopicId && (
        <button
          id="float-home-forum"
          type="button"
          onClick={() => onGoHome && onGoHome()}
          className="absolute bottom-4 right-4 w-11 h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer border-none"
          title="Trở về Trang Home"
        >
          <Home className="w-5 h-5 text-white stroke-[2.2px]" />
        </button>
      )}

      {/* Floating Scroll to Top Button on Forum Page - stacked above Create button when scrolled */}
      {!isCreatingTopic && !selectedTopicId && forumScrollTop > 100 && (
        <button
          type="button"
          onClick={() => forumScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="absolute bottom-[124px] right-4 w-11 h-11 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer border-none"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}

      {/* Slide-over Detail View */}
      {selectedTopic && (
        <div className="absolute inset-0 bg-white z-40 flex flex-col animate-slideIn">
            {/* Slide-over Header */}
            <div className={`px-3 py-2 text-white flex items-center gap-2 shrink-0 ${theme.bg}`}>
              <button
                type="button"
                onClick={() => handleSelectTopic(null)}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white p-1 rounded-md shadow-2xs border-none cursor-pointer flex items-center justify-center transition-all shrink-0"
                title="Quay lại danh sách thảo luận"
              >
                <ArrowLeft className="w-5 h-5 text-white stroke-[2.5px]" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-[13px] uppercase tracking-wide truncate">
                  <T>Chi tiết trao đổi</T>
                </h3>
              </div>
            </div>

            {/* Slide-over Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
              {/* Main Topic Information Card */}
              <div className="bg-white border-b border-slate-200 px-3 py-2 space-y-1.5 shrink-0 select-text relative z-20">
                {/* Top Meta & Controls Row */}
                <div className="flex items-center justify-between gap-1 text-[10.5px] text-slate-500 font-bold pb-0.5 border-b border-slate-100 relative">
                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                    <div className="flex flex-col justify-center gap-0.5 shrink-0">
                      <span className="flex items-center gap-1 text-slate-700 font-extrabold max-w-[100px] truncate">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span translate="no" className="notranslate truncate">{selectedTopic.creatorName}</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-400 text-[7.5px] font-sans font-medium pl-3.5 whitespace-nowrap">
                        <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span translate="no" className="notranslate">{selectedTopic.timestamp}</span>
                      </span>
                    </div>

                    {/* Abbreviated Status Badge / Dropdown Button */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        title="Bấm để chọn trạng thái (ĐANG MỞ -> ĐANG XL -> ĐÃ XONG)"
                        className={`h-6.5 px-1.5 rounded-md text-[9px] font-black border shadow-2xs cursor-pointer active:scale-95 transition-all shrink-0 flex items-center justify-center gap-0.5 whitespace-nowrap overflow-hidden ${getStatusColor(selectedTopic.status)}`}
                      >
                        <span className="notranslate whitespace-nowrap text-[9px] font-black tracking-tight" translate="no">
                          <T>{selectedTopic.status === "OPEN" ? "ĐANG MỞ" : selectedTopic.status === "PROCESSING" ? "ĐANG XL" : "ĐÃ XONG"}</T>
                        </span>
                        <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
                      </button>

                      {/* Dropdown Menu for Status */}
                      {showStatusDropdown && (
                        <div 
                          className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                            <span><T>Trạng thái thảo luận</T></span>
                            <button onClick={() => setShowStatusDropdown(false)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateForumTopicStatus) onUpdateForumTopicStatus(selectedTopic.id, "OPEN");
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-blue-50 transition-colors border-none cursor-pointer bg-transparent ${selectedTopic.status === "OPEN" ? "font-bold text-blue-700 bg-blue-50/50" : "text-slate-700"}`}
                          >
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              <T>Mở (ĐANG MỞ)</T>
                            </span>
                            {selectedTopic.status === "OPEN" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateForumTopicStatus) onUpdateForumTopicStatus(selectedTopic.id, "PROCESSING");
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-amber-50 transition-colors border-none cursor-pointer bg-transparent ${selectedTopic.status === "PROCESSING" ? "font-bold text-amber-700 bg-amber-50/50" : "text-slate-700"}`}
                          >
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              <T>Đang xử lý (ĐANG XL)</T>
                            </span>
                            {selectedTopic.status === "PROCESSING" && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateForumTopicStatus) {
                                onUpdateForumTopicStatus(selectedTopic.id, "RESOLVED");
                              }

                              if (selectedTopic.reportId && onUpdateReport && reports) {
                                const targetReport = reports.find(
                                  r => r.id === selectedTopic.reportId || r.reportCode === selectedTopic.reportId
                                );
                                if (targetReport) {
                                  const timeStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                  const newResolution: QualityReportResolution = {
                                    id: `res_forum_${Date.now()}`,
                                    departmentName: currentUser?.department || selectedTopic.category || "Ban Thảo luận",
                                    handlerName: currentUser?.fullName || selectedTopic.creatorName || "Chủ trì Thảo luận",
                                    status: "Đã xử lý",
                                    resultText: `[Chốt từ Thảo luận Chuyên đề] Đã hoàn tất thảo luận chuyên đề.`,
                                    updatedAt: timeStr
                                  };

                                  const updatedResolutions = [...(targetReport.resolutions || []), newResolution];
                                  const updatedReport: QualityReport = {
                                    ...targetReport,
                                    resolutions: updatedResolutions,
                                    updateLogs: [
                                      ...(targetReport.updateLogs || []),
                                      `Đã đồng bộ kết luận từ Thảo luận Chuyên đề bởi ${currentUser?.fullName || "Admin"} (${timeStr})`
                                    ]
                                  };

                                  onUpdateReport(updatedReport);
                                }
                              }

                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-emerald-50 transition-colors border-none cursor-pointer bg-transparent ${selectedTopic.status === "RESOLVED" ? "font-bold text-emerald-700 bg-emerald-50/50" : "text-slate-700"}`}
                          >
                            <span className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <T>Chốt kết luận & Đóng (ĐÃ XONG)</T>
                            </span>
                            {selectedTopic.status === "RESOLVED" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-auto whitespace-nowrap">
                    {/* "Xem bản tin" Icon Button */}
                    {selectedTopic.reportId && onGoHome && (
                      <button
                        type="button"
                        onClick={() => onGoHome(selectedTopic.reportId)}
                        title="Xem bản tin sự cố liên quan"
                        className="w-6.5 h-6.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-md shadow-2xs border-none cursor-pointer flex items-center justify-center transition-all shrink-0"
                      >
                        <ExternalLink className="w-3 h-3 stroke-[2.5px]" />
                      </button>
                    )}

                    {/* "🤖 AI Tóm tắt" Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAiSummaryModal(true);
                        if (!currentAiSummary) {
                          generateAiSummaryForTopic();
                        }
                      }}
                      title="AI Tóm tắt nội dung thảo luận"
                      className="h-6.5 px-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-md shadow-2xs border-none cursor-pointer flex items-center gap-0.5 text-[9.5px] font-black transition-all shrink-0 whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
                      <span className="notranslate whitespace-nowrap" translate="no"><T>AI-SUM</T></span>
                    </button>

                    {/* "Task" Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setActionsCatalogScope("CURRENT_TOPIC");
                        setShowActionsCatalogModal(true);
                      }}
                      title="Xem Danh mục Chỉ đạo / Task thuộc thảo luận này"
                      className="h-6.5 px-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-md shadow-2xs border-none cursor-pointer flex items-center gap-0.5 text-[9.5px] font-black transition-all shrink-0 whitespace-nowrap"
                    >
                      <ListTodo className="w-3 h-3 text-amber-200 stroke-[2.5px] shrink-0" />
                      <span className="notranslate whitespace-nowrap" translate="no"><T>TASK</T></span>
                    </button>

                    {/* "+" Button: Mời & Xem danh sách người tham gia nhóm */}
                    <button
                      type="button"
                      onClick={() => setShowMembersModal(true)}
                      title="Mời & Danh sách người tham gia nhóm"
                      className="h-6.5 w-6.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md shadow-2xs border-none cursor-pointer flex items-center justify-center transition-all shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                  </div>
              </div>

              {/* Clean Title Banner with Expandable Description & Context */}
              <div className="pt-1 relative" ref={titlePopRef}>
                <div 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="p-2.5 rounded-lg bg-rose-50 hover:bg-rose-100/80 active:scale-[0.99] border border-rose-200/80 transition-all select-none cursor-pointer flex items-end justify-between gap-2 shadow-2xs group"
                  title="Bấm để xem/ẩn nội dung chi tiết & bối cảnh thảo luận"
                >
                  <h2 className="font-black text-[13px] text-rose-900 leading-snug break-words flex-1 min-w-0">
                    <span translate="no" className="notranslate">
                      {cleanDisplayTitle(selectedTopic.title, selectedTopic.description, matchedReport)}
                    </span>
                  </h2>
                  <div className="shrink-0 flex items-center justify-center mb-0.5 text-rose-700">
                    {isDescExpanded ? (
                      <ChevronUp className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                    )}
                  </div>
                </div>

                {/* Expanded Detailed Description & Context Popover */}
                {isDescExpanded && (
                  <div className="mt-1.5 p-3 bg-white border border-rose-200 rounded-xl shadow-xl space-y-2.5 animate-fadeIn z-30 select-text">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
                      <span className="text-[9.5px] font-extrabold text-rose-900 uppercase tracking-wide flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        <T>Nội dung chi tiết & Bối cảnh</T>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDescExpanded(false);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-700 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Detailed Description */}
                    <div className="space-y-1">
                      <div className="text-[10.5px] text-slate-800 leading-relaxed font-medium bg-rose-50/60 p-2.5 rounded-lg border border-rose-100/80 break-words whitespace-pre-wrap">
                        {selectedTopic.description ? (
                          <span translate="no" className="notranslate">
                            {renderMentionText(selectedTopic.description, false)}
                          </span>
                        ) : (
                          <em className="text-slate-400 text-[9.5px]"><T>Không có diễn giải chi tiết ban đầu.</T></em>
                        )}
                      </div>
                    </div>

                    {/* Context metadata */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[9px] text-slate-600">
                      <div>
                        <span className="text-slate-400 font-medium"><T>Người tạo:</T> </span>
                        <strong className="text-slate-800" translate="no">{selectedTopic.creatorName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium"><T>Thời gian:</T> </span>
                        <span className="text-slate-700" translate="no">{selectedTopic.timestamp}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium"><T>Chuyên mục:</T> </span>
                        <span className="text-rose-800 font-bold" translate="no">{selectedTopic.category}</span>
                      </div>
                      {matchedReport && (
                        <div>
                          <span className="text-slate-400 font-medium"><T>Mã báo cáo:</T> </span>
                          <strong className="text-amber-700" translate="no">{matchedReport.reportCode}</strong>
                        </div>
                      )}
                    </div>

                    {/* Linked Report details if available */}
                    {matchedReport && (
                      <div className="p-2 bg-amber-50/70 border border-amber-200/80 rounded-lg space-y-1 text-[9px]">
                        <div className="font-bold text-amber-900 flex items-center justify-between">
                          <span><T>Báo cáo KPH liên quan:</T></span>
                          <span translate="no" className="notranslate font-extrabold">{matchedReport.reportCode}</span>
                        </div>
                        {(matchedReport as any).productName && (
                          <div className="text-slate-700">
                            <span className="font-semibold"><T>Sản phẩm:</T> </span>
                            <span translate="no">{(matchedReport as any).productName}</span>
                          </div>
                        )}
                        {((matchedReport as any).errorName || (matchedReport as any).description || matchedReport.content) && (
                          <div className="text-slate-700">
                            <span className="font-semibold"><T>Hiện tượng / Lỗi:</T> </span>
                            <span translate="no">{(matchedReport as any).errorName || (matchedReport as any).description || matchedReport.content}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>

            {/* Conversation Replies List */}
            <div className="flex-1 p-3 space-y-3.5 overflow-y-auto bg-slate-50/60 select-text">
              {/* Pinned AI Summary Banner if active */}
              {localPinnedAiSummary && currentAiSummary && (
                <div className="p-3 bg-gradient-to-br from-indigo-50 via-blue-50 to-amber-50/60 border border-indigo-200 rounded-2xl shadow-sm space-y-2 select-text animate-fadeIn mb-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-900 border-b border-indigo-200/80 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-400" />
                      <T>AI TÓM TẮT THẢO LUẬN (ĐÃ GHIM)</T>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLocalPinnedAiSummary(false)}
                      className="text-slate-400 hover:text-indigo-700 text-[10px] font-bold border-none bg-transparent cursor-pointer p-0.5"
                      title="Bỏ ghim tóm tắt"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-800 leading-relaxed font-medium">
                    <div>
                      <strong className="text-indigo-950 font-black"><T>Ý chính:</T></strong>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 pt-0.5 text-slate-700">
                        {currentAiSummary.keyPoints.map((pt, idx) => (
                          <li key={idx} translate="no" className="notranslate">{renderMentionText(pt, false)}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-1 border-t border-indigo-100/80">
                      <strong className="text-indigo-950 font-black"><T>Thống nhất:</T> </strong>
                      <span translate="no" className="notranslate">{renderMentionText(currentAiSummary.consensus, false)}</span>
                    </div>

                    {currentAiSummary.directivesAndTasks.length > 0 && (
                      <div className="pt-1 border-t border-indigo-100/80">
                        <strong className="text-indigo-950 font-black"><T>Chỉ đạo & Đầu việc:</T></strong>
                        <ul className="space-y-0.5 pl-1 pt-0.5 font-bold text-[10.5px]">
                          {currentAiSummary.directivesAndTasks.map((act, idx) => (
                            <li key={idx} className="text-amber-900" translate="no">{renderMentionText(act, false)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {topicReplies.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-200 shadow-3xs select-none">
                  <T>Chưa có ý kiến trao đổi nào. Hãy là người đầu tiên thảo luận!</T>
                </div>
              ) : (
                topicReplies.map((reply, idx) => {
                  const resolvedSender = resolveSenderInfo(users, reply.senderPhone, reply.senderName, reply.senderRole);
                  const isMe = isCurrentUserSender(currentUser, reply.senderPhone, reply.senderName, (reply as any).senderId, reply.senderRole);
                  const isTopicLeader = checkIsTopicLeader(selectedTopic, currentUser);
                  const isSenderTopicLeader = checkIsTopicLeader(selectedTopic, resolvedSender as any);
                  const canManage = isMe || (currentUser?.role === UserRole.ADMIN) || isTopicLeader;
                  const hasLiked = currentUser && reply.likedBy?.includes(currentUser.phone || currentUser.id);
                  const likeCount = reply.likes || (reply.likedBy ? reply.likedBy.length : 0);
                  const isEditingThis = editingReplyId === reply.id;
                  const isActiveMessage = activeMessageId === reply.id;

                  // Check if previous message was sent by the same sender to group consecutive messages
                  const prevReply = idx > 0 ? topicReplies[idx - 1] : null;
                  const isConsecutive = Boolean(
                    prevReply && (
                      (prevReply.senderPhone && reply.senderPhone && prevReply.senderPhone === reply.senderPhone) ||
                      (prevReply.senderName && reply.senderName && prevReply.senderName === reply.senderName)
                    )
                  );
                  // Only show sender header for incoming messages (!isMe) AND if not consecutive from same sender
                  const showSenderHeader = !isMe && !isConsecutive;

                  return (
                    <div key={reply.id} className={`group ${isConsecutive ? "space-y-0.5 mt-0.5" : "space-y-1 mt-2"}`}>
                      {/* Sender Name above message bubble - On first message of a group */}
                      {showSenderHeader && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold px-1 justify-start text-slate-700 pt-1">
                          <span translate="no" className="notranslate font-black text-slate-800">
                            {formatNameCapitalized(resolvedSender.fullName || reply.senderName)}
                          </span>
                        </div>
                      )}

                      {isMe && !isConsecutive && (
                        <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold px-1 justify-end text-slate-700 pt-1">
                          <span translate="no" className="notranslate font-black text-slate-800">
                            TÔI ({formatNameCapitalized(currentUser?.fullName || "BẠN")})
                          </span>
                        </div>
                      )}

                      {/* Chat Bubble Container */}
                      <div className={`flex items-center gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                        {/* Quick Reply Arrow Button on Hover (Left side for sent messages) */}
                        {isMe && !isEditingThis && (
                          <div className={`flex items-center gap-1 transition-all duration-200 shrink-0 ${
                            isActiveMessage ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100"
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLikeReply(reply.id);
                              }}
                              className={`p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 cursor-pointer border border-slate-200 transition-transform hover:scale-110 active:scale-95 ${
                                hasLiked ? "text-rose-500 bg-rose-50 border-rose-200" : "text-slate-400 hover:text-rose-600"
                              }`}
                              title="Thích tin nhắn"
                            >
                              <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo({
                                  id: reply.id,
                                  senderName: resolvedSender.fullName,
                                  message: reply.message || (reply.attachments?.length ? "[Tệp đính kèm]" : "")
                                });
                              }}
                              className="p-1.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-700 shadow-xs cursor-pointer border border-slate-200 hover:scale-110 active:scale-95"
                              title="Trả lời tin nhắn này (Quote)"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {isEditingThis ? (
                          <div className="w-full bg-white border border-blue-400 rounded-2xl p-2.5 shadow-md space-y-2">
                            <MentionTextArea
                              users={users}
                              value={editingReplyText}
                              onChange={setEditingReplyText}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[13px] font-medium outline-none focus:bg-white focus:border-blue-500"
                              rows={2}
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingReplyId(null)}
                                className="px-2.5 py-1 text-[10.5px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border-none cursor-pointer"
                              >
                                <T>Hủy</T>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedReply(reply.id)}
                                className="px-2.5 py-1 text-[10.5px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg border-none cursor-pointer"
                              >
                                <T>Lưu</T>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            id={`reply-${reply.id}`}
                            onClick={() => setActiveMessageId(prev => prev === reply.id ? null : reply.id)}
                            className={`p-3.5 w-fit max-w-[85%] text-[15px] leading-relaxed break-words shadow-2xs relative transition-all rounded-2xl cursor-pointer select-none ${
                              likeCount > 0 ? "pb-3.5 mb-1" : ""
                            } ${
                              isActiveMessage
                                ? isMe
                                  ? "ring-2 ring-amber-300 ring-offset-1 shadow-md scale-[1.01]"
                                  : "ring-2 ring-blue-400 ring-offset-1 shadow-md scale-[1.01]"
                                : "hover:brightness-98"
                            } ${
                              isMe
                                ? "bg-[#e9f2fd] text-slate-800 font-normal rounded-tr-none border border-blue-200/80 shadow-2xs"
                                : "bg-white text-slate-800 font-normal rounded-tl-none border border-slate-200/90"
                            }`}
                          >
                            {/* Distinct Task Icon Badge for Converted Messages */}
                            {(reply.actionType === "DIRECTIVE" || reply.actionType === "TASK") && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingActionReply(reply);
                                  setEditActionType(reply.actionType || "DIRECTIVE");
                                  setEditTaskNote(reply.actionData?.note || "");
                                  setEditTaskDeadline(reply.actionData?.deadline || taskDeadline);
                                  setEditTaskStatus(reply.actionData?.status || "PENDING");
                                  if (reply.actionData?.assignedToName && users.length > 0) {
                                    const m = users.find(u => u.fullName === reply.actionData?.assignedToName);
                                    setEditTaskAssignedUser(m || null);
                                  } else {
                                    setEditTaskAssignedUser(null);
                                  }
                                }}
                                className={`absolute z-20 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 bg-orange-500 text-white ${
                                  isMe ? "-top-2 -left-2" : "-top-2 -right-2"
                                }`}
                                title={reply.actionType === "DIRECTIVE" ? "Chỉ đạo hành động - Bấm để xem/chỉnh sửa" : "Đầu việc (Task) - Bấm để xem/chỉnh sửa"}
                              >
                                <ListTodo className="w-3 h-3 stroke-[2.5px]" />
                              </div>
                            )}

                            {/* Quoted Message Box inside Chat Bubble (Zalo style) */}
                            {reply.quotedReply && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollToReply(reply.quotedReply!.id);
                                }}
                                className={`mb-2 p-2 px-2.5 rounded-r-lg rounded-l-xs border-l-[3px] text-[12.5px] cursor-pointer transition-opacity hover:opacity-90 ${
                                  isMe ? "bg-[#dbe9fa] text-slate-800 border-[#0068ff]" : "bg-slate-100 text-slate-700 border-amber-500"
                                }`}
                              >
                                <div className={`flex items-center gap-1 font-semibold text-[11.5px] pb-0.5 ${isMe ? "text-slate-800" : "opacity-90"}`}>
                                  <CornerUpLeft className="w-3 h-3" />
                                  <span translate="no" className="notranslate">{formatNameCapitalized(reply.quotedReply.senderName)}</span>
                                </div>
                                <div className="line-clamp-2 italic text-[12px] text-slate-600">
                                  "{renderFormattedMessage(reply.quotedReply.message, { isMe, users, onOpenDirectChat })}"
                                </div>
                              </div>
                            )}

                            {/* Text message */}
                            {reply.message && (
                              <div className="text-[14.5px] leading-relaxed text-slate-900 font-sans">
                                {renderFormattedMessage(reply.message, {
                                  isMe,
                                  users,
                                  onOpenDirectChat
                                })}
                              </div>
                            )}

                            {/* Attachments inside Chat Bubble */}
                            {reply.attachments && reply.attachments.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {/* Image attachments */}
                                {reply.attachments.filter(a => a.type === "image").length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {reply.attachments.filter(a => a.type === "image").map((att, idx) => (
                                      <div
                                        key={idx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPreviewImageModal(att.url);
                                        }}
                                        className="relative w-28 h-28 rounded-xl overflow-hidden border border-black/10 cursor-pointer group shadow-2xs"
                                      >
                                        <img src={att.url} alt="Attached photo" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                          <Eye className="w-5 h-5" />
                                        </div>
                                        {att.sizeKb && (
                                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-mono">
                                            {att.sizeKb}KB
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* PDF attachments */}
                                {reply.attachments.filter(a => a.type === "pdf").map((att, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                                      isMe ? "bg-white/80 border-blue-200 text-slate-800" : "bg-rose-50/90 border-rose-200 text-slate-800"
                                    }`}
                                  >
                                     <div className="flex items-center gap-2 min-w-0">
                                       <div className="p-1.5 rounded-lg bg-rose-500 text-white shrink-0">
                                         <FileText className="w-4 h-4" />
                                       </div>
                                       <div className="flex flex-col min-w-0">
                                         <span translate="no" className="notranslate font-bold truncate text-[11px]">{att.name || "Tài liệu.pdf"}</span>
                                         <span className="text-[9.5px] opacity-80">{att.sizeKb ? `${att.sizeKb} KB` : "PDF"}</span>
                                       </div>
                                     </div>
                                     <a
                                       href={att.url}
                                       download={att.name || "Tai_Lieu.pdf"}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       onClick={(e) => e.stopPropagation()}
                                       className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 no-underline cursor-pointer ${
                                         isMe ? "bg-blue-100 hover:bg-blue-200 text-blue-800" : "bg-white/20 hover:bg-white/30 text-current"
                                       }`}
                                     >
                                       <Download className="w-3 h-3" />
                                       <T>Tải về</T>
                                     </a>
                                   </div>
                                ))}
                              </div>
                            )}

                            {/* Reaction Badge attached to bottom corner when likes > 0 */}
                            {likeCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLikeReply(reply.id);
                                }}
                                className={`absolute -bottom-2.5 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold border cursor-pointer transition-all shadow-2xs hover:scale-105 active:scale-90 ${
                                  isMe ? "left-2.5" : "right-2.5"
                                } ${
                                  hasLiked
                                    ? "bg-rose-50 text-rose-600 border-rose-200 ring-2 ring-white"
                                    : "bg-white text-slate-600 border-slate-200 ring-2 ring-white hover:bg-rose-50 hover:text-rose-500"
                                }`}
                                title="Bấm để thả tim / bỏ thích"
                              >
                                <span className="text-[10px] leading-none">❤️</span>
                                <span translate="no" className="notranslate text-[9px] font-extrabold leading-none">
                                  {likeCount}
                                </span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Quick Action Buttons on Hover (Right side for received messages) */}
                        {!isMe && !isEditingThis && (
                          <div className={`flex items-center gap-1 transition-all duration-200 shrink-0 ${
                            isActiveMessage ? "opacity-100 scale-100" : "opacity-0 group-hover:opacity-100"
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLikeReply(reply.id);
                              }}
                              className={`p-1.5 rounded-full bg-slate-100 hover:bg-rose-100 cursor-pointer border border-slate-200 transition-transform hover:scale-110 active:scale-95 ${
                                hasLiked ? "text-rose-500 bg-rose-50 border-rose-200" : "text-slate-400 hover:text-rose-600"
                              }`}
                              title="Thích tin nhắn"
                            >
                              <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo({
                                  id: reply.id,
                                  senderName: resolvedSender.fullName,
                                  message: reply.message || (reply.attachments?.length ? "[Tệp đính kèm]" : "")
                                });
                              }}
                              className="p-1.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-700 shadow-xs cursor-pointer border border-slate-200 hover:scale-110 active:scale-95"
                              title="Trả lời tin nhắn này (Quote)"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action & Meta Row below message bubble */}
                      <div className={`flex items-center gap-1.5 pt-2.5 px-1 text-[8.5px] font-sans transition-all duration-200 ${
                        isEditingThis || isActiveMessage
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100"
                      } ${isMe ? "justify-end" : "justify-start"}`}>
                        <span translate="no" className="notranslate text-slate-400 text-[8.5px] font-sans font-medium">
                          {reply.timestamp}
                        </span>

                        {/* Like Button in Meta Row */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLikeReply(reply.id);
                          }}
                          className={`p-1 rounded-md border cursor-pointer transition-colors flex items-center gap-1 ${
                            hasLiked
                              ? "bg-rose-50 text-rose-600 border-rose-200"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-500"
                          }`}
                          title="Thích ý kiến"
                        >
                          <Heart className={`w-3 h-3 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                          <span translate="no" className="notranslate text-[9px] font-bold">
                            {likeCount > 0 ? likeCount : "Thích"}
                          </span>
                        </button>

                        {/* Convert to Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConvertModalReply(reply);
                            setActionTypeChoice(reply.actionType || "DIRECTIVE");
                            setTaskNote(reply.actionData?.note || "");
                            if (reply.actionData?.assignedToName && users.length > 0) {
                              const matchU = users.find(u => u.fullName === reply.actionData?.assignedToName);
                              if (matchU) setTaskAssignedUser(matchU);
                            }
                          }}
                          className={`p-1 rounded-md border cursor-pointer transition-colors ${
                            reply.actionType
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700"
                          }`}
                          title="Chuyển thảo luận này thành Chỉ đạo hoặc Đầu việc phân công (Task)"
                        >
                          <Zap className="w-3 h-3" />
                        </button>

                        {/* Edit & Delete buttons */}
                        {canManage && !isEditingThis && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReplyId(reply.id);
                                setEditingReplyText(reply.message);
                              }}
                              className="p-1 hover:bg-amber-100 text-amber-700 rounded-md border border-amber-200 bg-amber-50/80 cursor-pointer transition-colors"
                              title="Sửa ý kiến"
                            >
                              <Edit className="w-3 h-3 text-amber-600" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingReplyId(reply.id);
                              }}
                              className="p-1 hover:bg-rose-100 text-rose-700 rounded-md border border-rose-200 bg-rose-50/80 cursor-pointer transition-colors"
                              title="Xóa ý kiến"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={repliesEndRef} />
            </div>

            {/* Reply Input Box Bar */}
            <div className="border-t border-slate-200 bg-white shrink-0 select-none">
              {/* Quoted Message Banner */}
              {replyingTo && (
                <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 text-slate-700">
                    <CornerUpLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate font-semibold text-[11px]">
                      <T>Đang trả lời</T> <strong translate="no" className="notranslate text-blue-900">{replyingTo.senderName}</strong>: "<span translate="no" className="notranslate">{replyingTo.message}</span>"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-blue-100 rounded-full text-slate-500 cursor-pointer"
                    title="Hủy trả lời"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Attached Files Banner */}
              {(attachedImages.length > 0 || isCompressingImages) && (
                <div className="p-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
                  {isCompressingImages && (
                    <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      <T>Đang nén hình ảnh siêu nhẹ...</T>
                    </div>
                  )}
                  {attachedImages.map((img, idx) => (
                    <div key={idx} className="relative w-12 h-12 rounded-lg border border-slate-300 overflow-hidden shrink-0 group">
                      <img src={img.base64} alt="Thumb" className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-white text-[8px] font-mono text-center">
                        {img.sizeKb}KB
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachedImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5 cursor-pointer shadow-xs"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formatting Toolbar (B I U Size Highlight + Quick Smileys) */}
              <div className="flex items-center justify-between px-2 pt-1.5 pb-1 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-1">
                  {/* B I U Pill */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setReplyMessage(prev => prev ? `**${prev}**` : "**văn bản**")}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition-colors font-black text-xs cursor-pointer active:scale-95"
                      title="In đậm (Ctrl+B)"
                    >
                      <span className="font-extrabold text-xs">B</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyMessage(prev => prev ? `*${prev}*` : "*văn bản*")}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition-colors italic text-xs cursor-pointer active:scale-95"
                      title="In nghiêng (Ctrl+I)"
                    >
                      <span className="font-serif italic font-bold text-xs">I</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyMessage(prev => prev ? `<u>${prev}</u>` : "<u>văn bản</u>")}
                      className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-700 hover:text-blue-600 transition-colors text-xs cursor-pointer active:scale-95"
                      title="Gạch chân (Ctrl+U)"
                    >
                      <span className="underline decoration-1 underline-offset-2 font-bold text-xs">U</span>
                    </button>
                  </div>

                  <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

                  {/* Size Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowForumSizeDropdown(prev => !prev)}
                      className="h-6 px-1.5 flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                      title="Kích thước chữ"
                    >
                      <span>{forumTextSize}</span>
                      <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                    </button>

                    {showForumSizeDropdown && (
                      <div className="absolute left-0 bottom-7 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 min-w-[110px] animate-scaleUp">
                        <button
                          type="button"
                          onClick={() => {
                            setForumTextSize("S");
                            setShowForumSizeDropdown(false);
                            setReplyMessage(prev => prev ? `[size=S]${prev}[/size]` : "[size=S]văn bản[/size]");
                          }}
                          className="w-full text-left px-2 py-1 rounded-md text-xs hover:bg-slate-50 hover:text-blue-600 font-medium flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-[11px]"><T>Nhỏ (S)</T></span>
                          {forumTextSize === "S" && <span className="text-blue-600 font-bold">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForumTextSize("M");
                            setShowForumSizeDropdown(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded-md text-xs hover:bg-slate-50 hover:text-blue-600 font-medium flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-xs"><T>Vừa (M)</T></span>
                          {forumTextSize === "M" && <span className="text-blue-600 font-bold">✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForumTextSize("L");
                            setShowForumSizeDropdown(false);
                            setReplyMessage(prev => prev ? `[size=L]${prev}[/size]` : "[size=L]văn bản[/size]");
                          }}
                          className="w-full text-left px-2 py-1 rounded-md text-xs hover:bg-slate-50 hover:text-blue-600 font-medium flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-sm font-bold"><T>Lớn (L)</T></span>
                          {forumTextSize === "L" && <span className="text-blue-600 font-bold">✓</span>}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Highlight */}
                  <button
                    type="button"
                    onClick={() => setReplyMessage(prev => prev ? `==${prev}==` : "==nội dung nổi bật==")}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-amber-100 border border-slate-200 rounded-lg text-slate-700 hover:text-amber-800 transition-colors text-xs cursor-pointer shadow-2xs"
                    title="Đánh dấu nổi bật (==nội dung==)"
                  >
                    <div className="w-3 h-2.5 bg-amber-400 rounded-xs border border-amber-500 shadow-2xs" />
                  </button>
                </div>

                {/* Quick Smileys Bar */}
                <div className="flex items-center gap-1">
                  {["👍", "😊", "❤️", "🎉"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setReplyMessage(prev => prev + emoji)}
                      className="w-6 h-6 flex items-center justify-center text-sm rounded-md hover:bg-white active:scale-125 transition-transform cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emoji Picker Popover Modal */}
              {showEmojiPicker && (
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 animate-fadeIn">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
                    <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span><T>Biểu tượng cảm xúc vui vẻ</T></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveForumEmojiTab("ALL")}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        activeForumEmojiTab === "ALL"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      <T>Tất cả</T>
                    </button>
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveForumEmojiTab(cat.name)}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 ${
                          activeForumEmojiTab === cat.name
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span translate="no" className="notranslate">{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {EMOJI_CATEGORIES.filter(c => activeForumEmojiTab === "ALL" || activeForumEmojiTab === c.name).map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span translate="no" className="notranslate">{cat.name}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {cat.emojis.map((emoji, eIdx) => (
                            <button
                              key={eIdx}
                              type="button"
                              onClick={() => setReplyMessage(prev => prev + emoji)}
                              className="w-8 h-8 rounded-lg hover:bg-white active:scale-125 text-lg flex items-center justify-center transition-all cursor-pointer border-none bg-transparent"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Form Inputs */}
              <form
                onSubmit={handleSendReply}
                className="p-1.5 sm:p-2 flex gap-1.5 items-center"
              >
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImagesSelected}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <div className="flex items-center gap-0.5 text-slate-500 shrink-0 h-9">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(prev => !prev)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      showEmojiPicker ? "bg-amber-100 text-amber-700" : "hover:bg-slate-100 text-slate-600"
                    }`}
                    title="Thêm biểu tượng cảm xúc (Emoji)"
                  >
                    <Smile className="w-4.5 h-4.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Đính kèm hình ảnh từ tập tin (Nén siêu nhẹ)"
                  >
                    <ImageIcon className="w-4.5 h-4.5" />
                  </button>
                </div>

                <MentionInput
                  users={users}
                  placeholder="Nhập ý kiến trao đổi..."
                  value={replyMessage}
                  onChange={setReplyMessage}
                  onPaste={handlePaste}
                  className="bg-slate-100 border border-slate-200 outline-none px-3 py-2 rounded-xl text-[13px] font-medium placeholder:text-slate-400 focus:bg-white focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!replyMessage.trim() && attachedImages.length === 0}
                  className={`w-9 h-9 rounded-xl ${theme.bg} hover:opacity-90 active:scale-95 text-white disabled:bg-slate-300 disabled:opacity-50 transition-all border-none cursor-pointer flex items-center justify-center shrink-0 shadow-xs`}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reply Confirmation Modal */}
      {deletingReplyId && (
        <div 
          onClick={() => setDeletingReplyId(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 max-w-xs w-full shadow-2xl border border-slate-200 space-y-3 text-center cursor-default animate-scaleUp"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 uppercase">
              <T>Xác nhận xóa ý kiến này?</T>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <T>Ý kiến trao đổi sau khi xóa sẽ không thể khôi phục.</T>
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingReplyId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-none cursor-pointer"
              >
                <T>Hủy</T>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReplyConfirm(deletingReplyId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs border-none cursor-pointer"
              >
                <T>Xóa ngay</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Topic Drawer/Modal */}
      {isCreatingTopic && (
        <div 
          onClick={() => setIsCreatingTopic(false)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center select-none animate-fadeIn cursor-pointer p-0 sm:p-2"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateTopic}
            className="bg-white rounded-t-xl sm:rounded-xl w-full max-h-[85vh] flex flex-col shadow-2xl border-t sm:border border-slate-200 animate-slideUp cursor-default overflow-hidden"
          >
            {/* Header */}
            <div className={`px-3.5 py-2.5 text-white flex justify-between items-center shrink-0 rounded-t-xl ${theme.bg}`}>
              <h3 className="font-extrabold text-[12px] uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-white stroke-[2.5px]" />
                <T>Tạo chủ đề trao đổi</T>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingTopic(false)}
                className="text-white hover:bg-white/15 p-1 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-3 overflow-y-auto space-y-3 max-h-[60vh]">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  <T>Chuyên mục</T>
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  {(["Thảo luận KPH", "Góp ý chức năng", "Cải tiến 4M1E", "Kiến nghị khác"] as ForumTopicCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10.5px] font-bold shrink-0 transition-all cursor-pointer border ${
                        newCategory === cat
                          ? `${theme.bg} text-white border-transparent shadow-2xs`
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <T>{cat}</T>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  <T>Tiêu đề</T>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tiêu đề thảo luận rõ ràng, ngắn gọn..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Members Selection */}
              {users && users.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <T>Mời thành viên</T> ({newInvitedUserIds.length})
                    </label>
                    <span className="text-[9.5px] text-slate-400">
                      <T>Chỉ người được mời mới thấy</T>
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    {users
                      .filter((u) => u.id !== currentUser?.id && u.phone !== currentUser?.phone)
                      .map((u) => {
                        const uKey = u.id || u.phone || u.fullName;
                        const isSelected =
                          newInvitedUserIds.includes(uKey) ||
                          newInvitedUserIds.includes(u.id || "") ||
                          (u.phone && newInvitedUserIds.includes(u.phone));
                        return (
                          <div
                            key={u.id || u.phone}
                            onClick={() => {
                              if (isSelected) {
                                setNewInvitedUserIds(
                                  newInvitedUserIds.filter(
                                    (id) => id !== uKey && id !== u.id && id !== u.phone
                                  )
                                );
                              } else {
                                setNewInvitedUserIds([...newInvitedUserIds, uKey]);
                              }
                            }}
                            className={`p-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer border select-none ${
                              isSelected
                                ? "bg-blue-50 border-blue-200 text-blue-800 font-bold"
                                : "bg-white border-slate-100 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {u.fullName ? u.fullName.charAt(0) : "U"}
                              </div>
                              <span className="truncate notranslate" translate="no">
                                {u.fullName}
                              </span>
                              <span className="text-[9.5px] text-slate-400 truncate">
                                ({u.department || u.position || u.role})
                              </span>
                            </div>
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <T>{isSelected ? "Đã chọn ✓" : "+ Mời"}</T>
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="bg-slate-50 border-t border-slate-200/80 p-2.5 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingTopic(false)}
                className="flex-1 py-2 text-center text-slate-700 border border-slate-300 rounded-lg text-xs font-extrabold hover:bg-slate-100 cursor-pointer bg-white transition-all active:scale-98"
              >
                <T>QUAY LẠI</T>
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className={`flex-1 py-2 text-center text-white rounded-lg text-xs font-extrabold ${theme.bg} disabled:bg-slate-300 disabled:opacity-50 cursor-pointer border-none shadow-2xs transition-all active:scale-98`}
              >
                <T>TẠO CHỦ ĐỀ</T>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Topic Drawer/Modal */}
      {editingTopic && (
        <div 
          onClick={() => setEditingTopic(null)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center select-none animate-fadeIn cursor-pointer p-0 sm:p-2"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTitle.trim()) return;
              if (onEditForumTopic) {
                onEditForumTopic(editingTopic.id, editTitle, editDesc || editTitle, editCategory);
              }
              setEditingTopic(null);
            }}
            className="bg-white rounded-t-xl sm:rounded-xl w-full max-h-[85vh] flex flex-col shadow-2xl border-t sm:border border-slate-200 animate-slideUp cursor-default overflow-hidden"
          >
            {/* Header */}
            <div className={`px-3.5 py-2.5 text-white flex justify-between items-center shrink-0 rounded-t-xl ${theme.bg}`}>
              <h3 className="font-extrabold text-[12px] uppercase tracking-wide flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-white" />
                <T>Chỉnh sửa chủ đề thảo luận</T>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="text-white hover:bg-white/15 p-1 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-3 overflow-y-auto space-y-3 max-h-[60vh]">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  <T>Chuyên mục</T>
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  {(["Thảo luận KPH", "Góp ý chức năng", "Cải tiến 4M1E", "Kiến nghị khác"] as ForumTopicCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10.5px] font-bold shrink-0 transition-all cursor-pointer border ${
                        editCategory === cat
                          ? `${theme.bg} text-white border-transparent shadow-2xs`
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <T>{cat}</T>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  <T>Tiêu đề</T>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tiêu đề thảo luận..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>


            </div>

            {/* Footer actions */}
            <div className="bg-slate-50 border-t border-slate-200/80 p-2.5 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="flex-1 py-2 text-center text-slate-700 border border-slate-300 rounded-lg text-xs font-extrabold hover:bg-slate-100 cursor-pointer bg-white transition-all active:scale-98"
              >
                <T>HỦY BỎ</T>
              </button>
              <button
                type="submit"
                disabled={!editTitle.trim() || !editDesc.trim()}
                className={`flex-1 py-2 text-center text-white rounded-lg text-xs font-extrabold ${theme.bg} disabled:bg-slate-300 disabled:opacity-50 cursor-pointer border-none shadow-2xs transition-all active:scale-98`}
              >
                <T>LƯU CẬP NHẬT</T>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Topic Confirmation Modal */}
      {deletingTopic && (
        <div 
          onClick={() => setDeletingTopic(null)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-xs w-full p-4 space-y-3 shadow-2xl border border-slate-100 text-center animate-scaleUp cursor-default"
          >
            <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                <T>Xác nhận xóa chủ đề</T>
              </h3>
              <p className="text-[11.5px] text-slate-600 mt-1 font-medium leading-relaxed">
                <T>Bạn có chắc chắn muốn xóa chủ đề</T> <br />
                <span className="font-bold text-blue-700 notranslate" translate="no">"{cleanDisplayTitle(deletingTopic.title)}"</span>? <br />
                <T>Tất cả các ý kiến thảo luận thuộc chủ đề này cũng sẽ bị xóa.</T>
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingTopic(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border-none"
              >
                <T>HỦY BỎ</T>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteForumTopic) {
                    onDeleteForumTopic(deletingTopic.id);
                    if (selectedTopicId === deletingTopic.id) {
                      handleSelectTopic(null);
                    }
                  }
                  setDeletingTopic(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border-none shadow-sm"
              >
                <T>XÓA NGAY</T>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Member Selection / Invitation Modal (Quản lý thành viên & Trưởng nhóm) */}
      {showMembersModal && selectedTopic && (() => {
        const invitedIds = selectedTopic.invitedUserIds || [];
        const isCurrentUserLeader = checkIsTopicLeader(selectedTopic, currentUser) || (currentUser?.role === UserRole.ADMIN);

        // Identify Topic Leader user object
        const leaderUser = users.find(
          (u) =>
            (selectedTopic.creatorPhone && (u.phone === selectedTopic.creatorPhone || u.id === selectedTopic.creatorPhone)) ||
            (selectedTopic.creatorName && u.fullName?.trim().toLowerCase() === selectedTopic.creatorName?.trim().toLowerCase()) ||
            (selectedTopic.authorPhone && (u.phone === selectedTopic.authorPhone || u.id === selectedTopic.authorPhone)) ||
            (selectedTopic.author && u.fullName?.trim().toLowerCase() === selectedTopic.author?.trim().toLowerCase()) ||
            (selectedTopic.authorId && (u.id === selectedTopic.authorId || u.phone === selectedTopic.authorId))
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
        const q = memberSearchQuery.toLowerCase().trim();
        const filteredJoined = joinedMembers.filter((u) => {
          if (!q) return true;
          return (
            u.fullName.toLowerCase().includes(q) ||
            (u.position && u.position.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q)) ||
            (u.department && u.department.toLowerCase().includes(q)) ||
            (u.phone && u.phone.includes(q)) ||
            (u.id && u.id.toLowerCase().includes(q))
          );
        });

        const filteredNonMembers = nonMembers.filter((u) => {
          if (!q) return true;
          return (
            u.fullName.toLowerCase().includes(q) ||
            (u.position && u.position.toLowerCase().includes(q)) ||
            (u.role && u.role.toLowerCase().includes(q)) ||
            (u.department && u.department.toLowerCase().includes(q)) ||
            (u.phone && u.phone.includes(q)) ||
            (u.id && u.id.toLowerCase().includes(q))
          );
        });

        return (
          <div 
            onClick={() => {
              setShowMembersModal(false);
              setMemberSearchQuery("");
            }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 animate-fadeIn cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-slate-200 animate-slideUp cursor-default overflow-hidden"
            >
              {/* Modal Header */}
              <div className={`px-3.5 py-2.5 text-white flex justify-between items-center shrink-0 rounded-t-2xl sm:rounded-t-2xl ${theme.bg}`}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-[12px] uppercase tracking-wide">
                      <T>Thành viên nhóm thảo luận</T>
                    </h3>
                    <div className="text-[10px] text-white/90 font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                      <T>Trưởng nhóm:</T> <span translate="no" className="notranslate font-bold">{selectedTopic.creatorName || selectedTopic.author || leaderUser?.fullName || "Chưa gán"}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMembersModal(false);
                    setMemberSearchQuery("");
                  }}
                  className="text-white hover:bg-white/15 p-1 rounded-lg cursor-pointer border-none bg-transparent transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-3 flex flex-col min-h-0 flex-1 space-y-2.5 overflow-hidden">
                {/* 2 Tabs Switcher */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMemberModalTab("MEMBERS")}
                    className={`py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      memberModalTab === "MEMBERS"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span><T>Trong nhóm</T> ({joinedMembers.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberModalTab("ADD")}
                    className={`py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      memberModalTab === "ADD"
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span><T>Mời thêm</T> ({nonMembers.length})</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      memberModalTab === "MEMBERS"
                        ? "Tìm kiếm trong nhóm (tên, mã NV, phòng ban)..."
                        : "Tìm nhân sự để mời vào nhóm..."
                    }
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tab 1: Current Joined Members (Được xếp TOP ĐẦU) */}
                {memberModalTab === "MEMBERS" && (
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-[220px] max-h-[50vh]">
                    {filteredJoined.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                        <T>Không tìm thấy thành viên nào phù hợp.</T>
                      </div>
                    ) : (
                      filteredJoined.map((u) => {
                        const isLeader = leaderUser && (u.id === leaderUser.id || (u.phone && u.phone === leaderUser.phone));
                        const isMe = currentUser && (u.id === currentUser.id || (u.phone && u.phone === currentUser.phone));

                        return (
                          <div
                            key={u.id || u.phone}
                            className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2.5 select-none ${
                              isLeader
                                ? "bg-amber-50/80 border-amber-200/90 shadow-2xs"
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Avatar */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isLeader
                                  ? "bg-gradient-to-tr from-amber-500 to-amber-700 text-white ring-2 ring-amber-300"
                                  : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                              }`}>
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-bold text-xs text-slate-850 truncate notranslate" translate="no">
                                    {u.fullName}
                                  </span>
                                  {isLeader && (
                                    <span className="text-[8px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.2 rounded border border-amber-300 uppercase flex items-center gap-0.5">
                                      <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                                      <T>Trưởng nhóm</T>
                                    </span>
                                  )}
                                  {isMe && (
                                    <span className="text-[8px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                                      <T>Tôi</T>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9.5px] text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                                  <span translate="no" className="notranslate">{u.id}</span>
                                  {u.department && (
                                    <>
                                      <span>•</span>
                                      <span translate="no" className="notranslate">{u.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action: Leader Badge or Kick Button */}
                            <div className="shrink-0 flex items-center pr-1">
                              {isLeader ? (
                                <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-amber-100 text-amber-800 border border-amber-300 select-none">
                                  <T>Chủ trì</T>
                                </span>
                              ) : isCurrentUserLeader ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUserFromTopic(u)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg text-[10px] font-extrabold border border-rose-200 hover:border-rose-600 cursor-pointer flex items-center gap-1 transition-all shadow-2xs"
                                  title="Mời thành viên này ra khỏi nhóm"
                                >
                                  <UserMinus className="w-3 h-3" />
                                  <T>Mời ra</T>
                                </button>
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                                  <Check className="w-4 h-4 stroke-[3px]" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab 2: Add New Members */}
                {memberModalTab === "ADD" && (
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-[220px] max-h-[50vh]">
                    {filteredNonMembers.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                        <T>Tất cả nhân viên đã tham gia nhóm thảo luận.</T>
                      </div>
                    ) : (
                      filteredNonMembers.map((u) => {
                        return (
                          <div
                            key={u.id || u.phone}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-between gap-2.5 select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-850 truncate notranslate" translate="no">
                                  {u.fullName}
                                </div>
                                <div className="text-[9.5px] text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                                  <span translate="no" className="notranslate">{u.id}</span>
                                  {u.department && (
                                    <>
                                      <span>•</span>
                                      <span translate="no" className="notranslate">{u.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleUserInvite(u)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg text-[10px] font-extrabold border border-emerald-300 hover:border-emerald-600 cursor-pointer flex items-center gap-1 transition-all shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <T>+ Mời</T>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 border-t border-slate-200/80 p-2.5 shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowMembersModal(false);
                    setMemberSearchQuery("");
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-extrabold cursor-pointer border-none shadow-2xs transition-all"
                >
                  <T>XONG</T>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Feature 4: Convert Chat to Action Modal */}
      {convertModalReply && (
        <div
          onClick={() => setConvertModalReply(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn cursor-pointer select-text"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wide">
                    <T>Chuyển Thảo luận thành Hành động</T>
                  </h3>
                  <p className="text-[10px] text-amber-100 font-medium">
                    <T>Tạo Chỉ đạo hoặc Phân công công việc (Task)</T>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalReply(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Selected message preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  <T>Nội dung thảo luận gốc:</T>
                </span>
                <p className="text-slate-800 font-medium italic text-[11px] leading-relaxed line-clamp-3" translate="no">
                  "<span translate="no" className="notranslate">{convertModalReply.message}</span>"
                </p>
                <div className="text-[9.5px] text-slate-400 font-medium text-right">
                  — <span translate="no" className="notranslate">{convertModalReply.senderName}</span> ({convertModalReply.timestamp})
                </div>
              </div>

              {/* Type selection */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 text-[11px]">
                  <T>Chọn loại hình hành động:</T>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setActionTypeChoice("DIRECTIVE")}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center select-none ${
                      actionTypeChoice === "DIRECTIVE"
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-2xs font-extrabold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-amber-300 font-semibold"
                    }`}
                  >
                    <Zap className={`w-5 h-5 ${actionTypeChoice === "DIRECTIVE" ? "text-amber-600 fill-amber-500" : "text-slate-400"}`} />
                    <span className="text-[11px]"><T>Chỉ đạo hành động</T></span>
                  </div>

                  <div
                    onClick={() => setActionTypeChoice("TASK")}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center select-none ${
                      actionTypeChoice === "TASK"
                        ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-extrabold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 font-semibold"
                    }`}
                  >
                    <Target className={`w-5 h-5 ${actionTypeChoice === "TASK" ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="text-[11px]"><T>Đầu việc (Task)</T></span>
                  </div>
                </div>
              </div>

              {/* Task Fields if TASK selected */}
              {actionTypeChoice === "TASK" && (
                <div className="space-y-2.5 bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 animate-fadeIn">
                  <div>
                    <label className="font-extrabold text-blue-900 text-[10.5px] block mb-1">
                      <T>Phân công nhân sự thực hiện:</T>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffPickerTarget("CONVERT");
                        setStaffPickerSearchQuery("");
                        setShowStaffPickerModal(true);
                      }}
                      className="w-full bg-white border border-slate-300 hover:border-blue-500 rounded-xl p-2 text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs transition-all cursor-pointer"
                    >
                      {taskAssignedUser ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {taskAssignedUser.avatar ? (
                              <img src={taskAssignedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              taskAssignedUser.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="font-extrabold text-xs text-slate-850 truncate" translate="no">
                              {taskAssignedUser.fullName}
                            </div>
                            <div className="text-[9.5px] text-slate-500 truncate font-semibold" translate="no">
                              {taskAssignedUser.id} • {taskAssignedUser.department || taskAssignedUser.role}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs"><T>-- Bấm chọn nhân sự thực hiện --</T></span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="font-extrabold text-blue-900 text-[10.5px] block mb-1">
                      <T>Hạn hoàn thành (dd/mm/yy):</T>
                    </label>
                    <input
                      type="text"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      placeholder="dd/mm/yy"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Note / Instruction textarea */}
              <div>
                <label className="font-extrabold text-slate-800 text-[10.5px] block mb-1">
                  <T>Ghi chú / Yêu cầu chi tiết bổ sung:</T>
                </label>
                <textarea
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  placeholder="Nhập yêu cầu bổ sung hoặc lưu ý triển khai..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:bg-white focus:border-amber-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200/80 p-2.5 flex items-center justify-between gap-2 shrink-0">
              {convertModalReply.actionType && (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveAction(convertModalReply.id);
                    setConvertModalReply(null);
                  }}
                  className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold border border-rose-200 cursor-pointer"
                >
                  <T>Bỏ hành động</T>
                </button>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setConvertModalReply(null)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold border-none cursor-pointer"
                >
                  <T>Hủy</T>
                </button>
                <button
                  type="button"
                  onClick={handleSaveConvertAction}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-black border-none shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <T>XÁC NHẬN</T>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 4: AI Discussion Summarizer Modal */}
      {showAiSummaryModal && selectedTopic && (
        <div
          onClick={() => setShowAiSummaryModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn cursor-pointer select-text"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400/20 border border-amber-300/40 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wide flex items-center gap-1">
                    <T>AI Tóm tắt nội dung thảo luận</T>
                  </h3>
                  <p className="text-[9.5px] text-indigo-200 font-medium">
                    <T>Cô đọng ý chính, phương án & hành động</T>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiSummaryModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
              {/* Controls bar in modal */}
              <div className="flex items-center justify-between bg-indigo-50/80 p-2 rounded-xl border border-indigo-100 text-[10px]">
                <span className="text-indigo-900 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <T>Cập nhật:</T> <span translate="no" className="notranslate">{currentAiSummary?.updatedAt || "Vừa xong"}</span>
                </span>
                <button
                  type="button"
                  onClick={generateAiSummaryForTopic}
                  disabled={isAiSummarizing}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg border-none cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <RotateCw className={`w-3 h-3 ${isAiSummarizing ? "animate-spin" : ""}`} />
                  <T>Tóm tắt lại</T>
                </button>
              </div>

              {isAiSummarizing ? (
                <div className="py-12 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-600 animate-bounce mx-auto" />
                  <p className="text-xs font-bold text-indigo-900">
                    <T>AI đang tổng hợp ý kiến và cô đọng nội dung thảo luận...</T>
                  </p>
                </div>
              ) : currentAiSummary ? (
                <div className="space-y-3">
                  {/* Section 1: Key Points */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="font-extrabold text-[11px] text-indigo-950 flex items-center gap-1 border-b border-slate-200 pb-1 uppercase">
                      📌 <T>1. Các ý chính thảo luận</T>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-800 pl-1 font-medium leading-relaxed">
                      {currentAiSummary.keyPoints.map((pt, idx) => (
                        <li key={idx} translate="no" className="notranslate">{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Section 2: Consensus */}
                  <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 space-y-1">
                    <h4 className="font-extrabold text-[11px] text-blue-950 flex items-center gap-1 border-b border-blue-200 pb-1 uppercase">
                      💡 <T>2. Phương án xử lý thống nhất</T>
                    </h4>
                    <p className="text-[11px] text-blue-900 font-bold leading-relaxed pt-0.5" translate="no">
                      <span translate="no" className="notranslate">{currentAiSummary.consensus}</span>
                    </p>
                  </div>

                  {/* Section 3: Directives & Tasks */}
                  <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                    <h4 className="font-extrabold text-[11px] text-amber-950 flex items-center gap-1 border-b border-amber-200 pb-1 uppercase">
                      ⚡ <T>3. Chỉ đạo & Đầu việc (Tasks)</T>
                    </h4>
                    <ul className="space-y-1 text-[11px] text-amber-950 pl-1 font-bold">
                      {currentAiSummary.directivesAndTasks.map((act, idx) => (
                        <li key={idx} className="flex items-start gap-1" translate="no">
                          <span translate="no" className="notranslate">• {act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200/80 p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLocalPinnedAiSummary(!localPinnedAiSummary);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-extrabold border cursor-pointer transition-all flex items-center gap-1 ${
                    localPinnedAiSummary
                      ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-indigo-50"
                  }`}
                >
                  <Pin className="w-3 h-3 text-indigo-600" />
                  {localPinnedAiSummary ? <T>Đã ghim lên phòng chat</T> : <T>Ghim tóm tắt</T>}
                </button>

                <button
                  type="button"
                  onClick={copyAiSummaryToClipboard}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-[10.5px] font-extrabold border border-slate-300 cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3 text-slate-600" />
                  {copiedSummaryToast ? <T>Đã chép!</T> : <T>Sao chép</T>}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowAiSummaryModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black border-none cursor-pointer shadow-2xs ml-auto"
              >
                <T>HOÀN TẤT</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Compact Staff Picker Modal */}
      {showStaffPickerModal && (
        <div
          onClick={() => setShowStaffPickerModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className={`px-3.5 py-2.5 text-white flex justify-between items-center shrink-0 ${theme.bg}`}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white" />
                <h3 className="font-extrabold text-xs uppercase tracking-wide">
                  <T>Danh Sách Cán Bộ Nhân Viên</T>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStaffPickerModal(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body with Search Filter */}
            <div className="p-3 space-y-2.5 flex-1 overflow-hidden flex flex-col">
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, mã NV, phòng ban..."
                  value={staffPickerSearchQuery}
                  onChange={(e) => setStaffPickerSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl pl-8 pr-7 py-2 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                  autoFocus
                />
                {staffPickerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStaffPickerSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Clear selection option */}
              <button
                type="button"
                onClick={() => {
                  if (staffPickerTarget === "CONVERT") {
                    setTaskAssignedUser(null);
                  } else {
                    setEditTaskAssignedUser(null);
                  }
                  setShowStaffPickerModal(false);
                }}
                className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-200 text-center transition-colors cursor-pointer shrink-0"
              >
                🚫 <T>Bỏ chọn nhân sự</T>
              </button>

              {/* Filtered Staff List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-[200px] max-h-[50vh]">
                {users.filter(u => {
                  if (!staffPickerSearchQuery.trim()) return true;
                  const q = staffPickerSearchQuery.toLowerCase().trim();
                  return (
                    (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                    (u.id && u.id.toLowerCase().includes(q)) ||
                    (u.department && u.department.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q)) ||
                    (u.role && u.role.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                    <T>Không tìm thấy nhân viên nào phù hợp.</T>
                  </div>
                ) : (
                  users.filter(u => {
                    if (!staffPickerSearchQuery.trim()) return true;
                    const q = staffPickerSearchQuery.toLowerCase().trim();
                    return (
                      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
                      (u.id && u.id.toLowerCase().includes(q)) ||
                      (u.department && u.department.toLowerCase().includes(q)) ||
                      (u.phone && u.phone.includes(q)) ||
                      (u.role && u.role.toLowerCase().includes(q))
                    );
                  }).map((u) => {
                    const currentSelected = staffPickerTarget === "CONVERT" ? taskAssignedUser : editTaskAssignedUser;
                    const isSelected = currentSelected && (currentSelected.id === u.id || currentSelected.phone === u.phone);

                    return (
                      <div
                        key={u.id || u.phone}
                        onClick={() => {
                          if (staffPickerTarget === "CONVERT") {
                            setTaskAssignedUser(u);
                          } else {
                            setEditTaskAssignedUser(u);
                          }
                          setShowStaffPickerModal(false);
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-bold"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                          }`}>
                            {u.avatar ? (
                              <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              u.fullName ? u.fullName.charAt(0).toUpperCase() : "U"
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-850 truncate" translate="no">
                              {u.fullName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                              <span translate="no" className="notranslate">{u.id}</span>
                              {u.department && (
                                <>
                                  <span>•</span>
                                  <span translate="no" className="notranslate">{u.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3px]" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowStaffPickerModal(false)}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs border-none cursor-pointer"
              >
                <T>Đóng</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh mục Chỉ đạo / Task Modal */}
      {showActionsCatalogModal && (
        <div
          onClick={() => setShowActionsCatalogModal(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn cursor-pointer select-text"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <ListTodo className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wide">
                    <T>Danh Mục Chỉ Đạo / Task</T>
                  </h3>
                  <p className="text-[10px] text-amber-100 font-medium">
                    <T>Quản lý, chỉnh sửa & theo dõi tiến độ các chỉ đạo & đầu việc</T>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActionsCatalogModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scope Switcher & Search & Filters */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 shrink-0">
              {/* Scope Tabs if inside a selected topic */}
              {selectedTopic && (
                <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-[10.5px] font-extrabold">
                  <button
                    type="button"
                    onClick={() => setActionsCatalogScope("CURRENT_TOPIC")}
                    className={`flex-1 py-1 text-center rounded-lg cursor-pointer transition-all border-none ${
                      actionsCatalogScope === "CURRENT_TOPIC"
                        ? "bg-white text-slate-900 shadow-2xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <T>Chủ đề hiện tại</T>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionsCatalogScope("ALL_TOPICS")}
                    className={`flex-1 py-1 text-center rounded-lg cursor-pointer transition-all border-none ${
                      actionsCatalogScope === "ALL_TOPICS"
                        ? "bg-white text-slate-900 shadow-2xs font-black"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <T>Tất cả thảo luận</T>
                  </button>
                </div>
              )}

              {/* Search Filter Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm chỉ đạo, task, người thực hiện, ghi chú..."
                  value={actionsCatalogSearchQuery}
                  onChange={(e) => setActionsCatalogSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-amber-500 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400"
                />
                {actionsCatalogSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setActionsCatalogSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Single Compact Row Filters */}
              <div className="flex items-center justify-between gap-1.5 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  {/* Category Type Filter Dropdown */}
                  <select
                    value={actionsCatalogTypeFilter}
                    onChange={(e) => setActionsCatalogTypeFilter(e.target.value as "ALL" | "DIRECTIVE" | "TASK")}
                    className={`h-7 px-2 rounded-lg text-[10px] font-extrabold border outline-none cursor-pointer transition-all shadow-2xs ${
                      actionsCatalogTypeFilter !== "ALL"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                    title="Lọc theo loại chỉ đạo / task"
                  >
                    <option value="ALL" className="bg-white text-slate-800">Tất cả loại</option>
                    <option value="DIRECTIVE" className="bg-white text-slate-800">⚡ Chỉ đạo</option>
                    <option value="TASK" className="bg-white text-slate-800">📌 Task</option>
                  </select>

                  {/* Status Filter Dropdown */}
                  <select
                    value={actionsCatalogStatusFilter}
                    onChange={(e) => setActionsCatalogStatusFilter(e.target.value as "ALL" | "PENDING" | "COMPLETED")}
                    className={`h-7 px-2 rounded-lg text-[10px] font-extrabold border outline-none cursor-pointer transition-all shadow-2xs ${
                      actionsCatalogStatusFilter !== "ALL"
                        ? actionsCatalogStatusFilter === "COMPLETED"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                    title="Lọc theo trạng thái"
                  >
                    <option value="ALL" className="bg-white text-slate-800">Tất cả T/Thái</option>
                    <option value="PENDING" className="bg-white text-slate-800">⏳ Đang thực hiện</option>
                    <option value="COMPLETED" className="bg-white text-slate-800">✓ Hoàn thành</option>
                  </select>
                </div>

                {/* @ My Tasks Quick Filter Button (Far Right) */}
                <button
                  type="button"
                  onClick={() => setActionsCatalogOnlyMine((prev) => !prev)}
                  className={`h-7 px-2.5 rounded-lg text-[10px] font-black border flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ml-auto ${
                    actionsCatalogOnlyMine
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  }`}
                  title="Lọc việc/chỉ đạo liên quan đến tôi"
                >
                  <span className="text-xs font-black">@</span>
                  <T>Của tôi</T>
                </button>
              </div>
            </div>

            {/* List Container */}
            <div className="p-3 space-y-2.5 overflow-y-auto flex-1 bg-slate-100/60">
              {(() => {
                const actionReplies = localReplies.filter(r => {
                  if (!r.actionType) return false;
                  if (actionsCatalogScope === "CURRENT_TOPIC" && selectedTopic && r.topicId !== selectedTopic.id) return false;

                  // Filter by My Tasks (@)
                  if (actionsCatalogOnlyMine && currentUser) {
                    const myName = (currentUser.fullName || "").toLowerCase();
                    const myPhone = currentUser.phone || "";
                    const myId = currentUser.id || "";

                    const assignedName = (r.actionData?.assignedToName || "").toLowerCase();
                    const assignedId = r.actionData?.assignedToId || "";

                    const senderName = (r.senderName || "").toLowerCase();
                    const senderPhone = r.senderPhone || "";

                    const isAssignedToMe = (myName && assignedName === myName) || (assignedId && (assignedId === myId || assignedId === myPhone));
                    const isCreatedByMe = (myName && senderName === myName) || (senderPhone && (senderPhone === myPhone || senderPhone === myId));

                    if (!isAssignedToMe && !isCreatedByMe) return false;
                  }

                  if (actionsCatalogTypeFilter !== "ALL" && r.actionType !== actionsCatalogTypeFilter) return false;
                  if (actionsCatalogStatusFilter !== "ALL") {
                    if (r.actionType !== "TASK" || r.actionData?.status !== actionsCatalogStatusFilter) return false;
                  }
                  if (actionsCatalogSearchQuery.trim()) {
                    const q = actionsCatalogSearchQuery.toLowerCase().trim();
                    const topicObj = topics.find(t => t.id === r.topicId);
                    const topicTitle = topicObj?.title || "";
                    const msg = r.message || "";
                    const note = r.actionData?.note || "";
                    const assigned = r.actionData?.assignedToName || "";
                    const creator = r.senderName || "";
                    return (
                      topicTitle.toLowerCase().includes(q) ||
                      msg.toLowerCase().includes(q) ||
                      note.toLowerCase().includes(q) ||
                      assigned.toLowerCase().includes(q) ||
                      creator.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                if (actionReplies.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-white rounded-2xl border border-slate-200">
                      <T>Chưa có Chỉ đạo hoặc Đầu việc nào phù hợp.</T>
                    </div>
                  );
                }

                return actionReplies.map(reply => {
                  const parentTopic = topics.find(t => t.id === reply.topicId);
                  const isDirective = reply.actionType === "DIRECTIVE";
                  const isCompleted = reply.actionData?.status === "COMPLETED";

                  return (
                    <div
                      key={reply.id}
                      className="bg-white rounded-xl p-3 border-2 border-slate-800 shadow-sm space-y-2 transition-all hover:border-slate-900"
                    >
                      {/* Header row: Badge, status & edit/delete controls */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isDirective ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                              <T>CHỈ ĐẠO</T>
                            </span>
                          ) : (
                            <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                              <Target className="w-3 h-3 text-blue-600" />
                              <T>ĐẦU VIỆC (TASK)</T>
                            </span>
                          )}

                          {!isDirective && (
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(reply.id)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black border cursor-pointer transition-all ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-emerald-50"
                              }`}
                            >
                              {isCompleted ? "✓ Hoàn thành" : "⏳ Đang thực hiện"}
                            </button>
                          )}
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingActionReply(reply);
                              setEditActionType(reply.actionType || "DIRECTIVE");
                              setEditTaskNote(reply.actionData?.note || "");
                              setEditTaskDeadline(reply.actionData?.deadline || taskDeadline);
                              setEditTaskStatus(reply.actionData?.status || "PENDING");
                              if (reply.actionData?.assignedToName && users.length > 0) {
                                const m = users.find(u => u.fullName === reply.actionData?.assignedToName);
                                setEditTaskAssignedUser(m || null);
                              } else {
                                setEditTaskAssignedUser(null);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                            title="Sửa Chỉ đạo/Task này"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingActionReplyId(reply.id)}
                            className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                            title="Xóa Chỉ đạo/Task này"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </div>

                      {/* Parent Topic Title */}
                      {parentTopic && (
                        <div className="text-[10px] font-extrabold text-blue-800 flex items-center gap-1 truncate">
                          <MessageSquare className="w-3 h-3 text-blue-600 shrink-0" />
                          <span translate="no" className="notranslate truncate">{cleanDisplayTitle(parentTopic.title)}</span>
                        </div>
                      )}

                      {/* Content / Note with Structured Bullets and AI Summarizer */}
                      <TaskStructuredContent text={reply.message} type={reply.actionType} />

                      {/* Directive Note / Yêu cầu chỉ đạo */}
                      {isDirective && reply.actionData?.note && (
                        <div className="p-2 px-2.5 rounded-xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 flex items-start gap-1.5 shadow-2xs">
                          <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0 mt-0.5" />
                          <div className="text-[12px] leading-snug">
                            <span className="font-extrabold text-amber-900 text-[10.5px] uppercase tracking-wide mr-1 inline-block">
                              <T>Yêu cầu:</T>
                            </span>
                            <strong className="font-black text-slate-900 text-[12.5px] notranslate" translate="no">
                              "{reply.actionData.note}"
                            </strong>
                          </div>
                        </div>
                      )}

                      {/* Task Details Row */}
                      {!isDirective && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-700 bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                          <span><T>Phân công:</T> <strong translate="no" className="notranslate text-blue-950 font-black">{reply.actionData?.assignedToName || "Chưa giao"}</strong></span>
                          <span><T>Hạn chót:</T> <span translate="no" className="notranslate text-slate-900 font-mono">{reply.actionData?.deadline || "dd/mm/yy"}</span></span>
                        </div>
                      )}

                      {/* Footer Creator & Date */}
                      <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                        <span><T>Tạo bởi:</T> <span translate="no" className="notranslate font-semibold text-slate-600">{reply.actionData?.createdByName || reply.senderName}</span></span>
                        <span translate="no" className="notranslate">{reply.actionData?.createdAt || reply.timestamp}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowActionsCatalogModal(false)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs border-none cursor-pointer shadow-2xs"
              >
                <T>ĐÓNG DANH MỤC</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Action (Directive/Task) Modal */}
      {editingActionReply && (
        <div
          onClick={() => setEditingActionReply(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn cursor-pointer select-text"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp cursor-default"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wide">
                    <T>Chỉnh Sửa Chỉ Đạo / Task</T>
                  </h3>
                  <p className="text-[10px] text-amber-100 font-medium">
                    <T>Cập nhật nhân sự, hạn hoàn thành hoặc nội dung</T>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingActionReply(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* Action Type Selection */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 text-[11px]">
                  <T>Loại hình hành động:</T>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setEditActionType("DIRECTIVE")}
                    className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center select-none ${
                      editActionType === "DIRECTIVE"
                        ? "bg-amber-50 border-amber-500 text-amber-900 font-extrabold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-amber-300 font-semibold"
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${editActionType === "DIRECTIVE" ? "text-amber-600 fill-amber-500" : "text-slate-400"}`} />
                    <span className="text-[11px]"><T>Chỉ đạo</T></span>
                  </div>

                  <div
                    onClick={() => setEditActionType("TASK")}
                    className={`p-2 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-1.5 text-center select-none ${
                      editActionType === "TASK"
                        ? "bg-blue-50 border-blue-500 text-blue-900 font-extrabold"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 font-semibold"
                    }`}
                  >
                    <Target className={`w-4 h-4 ${editActionType === "TASK" ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="text-[11px]"><T>Task (Đầu việc)</T></span>
                  </div>
                </div>
              </div>

              {/* Task Fields if TASK */}
              {editActionType === "TASK" && (
                <div className="space-y-2.5 bg-blue-50/60 p-3 rounded-xl border border-blue-200/80 animate-fadeIn">
                  <div>
                    <label className="font-extrabold text-blue-900 text-[10.5px] block mb-1">
                      <T>Phân công nhân sự thực hiện:</T>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffPickerTarget("EDIT");
                        setStaffPickerSearchQuery("");
                        setShowStaffPickerModal(true);
                      }}
                      className="w-full bg-white border border-slate-300 hover:border-blue-500 rounded-xl p-2 text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs transition-all cursor-pointer"
                    >
                      {editTaskAssignedUser ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {editTaskAssignedUser.avatar ? (
                              <img src={editTaskAssignedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              editTaskAssignedUser.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="font-extrabold text-xs text-slate-850 truncate" translate="no">
                              {editTaskAssignedUser.fullName}
                            </div>
                            <div className="text-[9.5px] text-slate-500 truncate font-semibold" translate="no">
                              {editTaskAssignedUser.id} • {editTaskAssignedUser.department || editTaskAssignedUser.role}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs"><T>-- Bấm chọn nhân sự thực hiện --</T></span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="font-extrabold text-blue-900 text-[10.5px] block mb-1">
                      <T>Hạn hoàn thành (dd/mm/yy):</T>
                    </label>
                    <input
                      type="text"
                      value={editTaskDeadline}
                      onChange={(e) => setEditTaskDeadline(e.target.value)}
                      placeholder="dd/mm/yy"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-blue-900 text-[10.5px] block mb-1">
                      <T>Trạng thái thực hiện:</T>
                    </label>
                    <select
                      value={editTaskStatus}
                      onChange={(e) => setEditTaskStatus(e.target.value as "PENDING" | "COMPLETED")}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="PENDING">⏳ Đang thực hiện</option>
                      <option value="COMPLETED">✓ Hoàn thành</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Note / Detail Input */}
              <div>
                <label className="font-extrabold text-slate-800 text-[10.5px] block mb-1">
                  <T>Nội dung ghi chú / Yêu cầu chi tiết:</T>
                </label>
                <textarea
                  value={editTaskNote}
                  onChange={(e) => setEditTaskNote(e.target.value)}
                  placeholder="Nhập yêu cầu chi tiết..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium outline-none focus:bg-white focus:border-amber-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-2.5 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingActionReply(null)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold border-none cursor-pointer"
              >
                <T>Hủy</T>
              </button>
              <button
                type="button"
                onClick={handleSaveEditAction}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-black border-none shadow-2xs cursor-pointer"
              >
                <T>LƯU CẬP NHẬT</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Action Confirmation Modal */}
      {deletingActionReplyId && (
        <div
          onClick={() => setDeletingActionReplyId(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl border border-slate-100 text-center cursor-default animate-scaleUp"
          >
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 uppercase">
              <T>Xác nhận xóa Chỉ đạo/Task?</T>
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <T>Chỉ đạo/Task này sẽ bị gỡ bỏ khỏi thảo luận. Nội dung tin nhắn thảo luận vẫn sẽ được giữ lại.</T>
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingActionReplyId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border-none cursor-pointer"
              >
                <T>Hủy</T>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteActionConfirm(deletingActionReplyId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs border-none cursor-pointer"
              >
                <T>Xóa ngay</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chốt kết luận & Đóng thảo luận */}
      {showCloseTopicModal && selectedTopic && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wide">
                    <T>Chốt kết luận & Đóng thảo luận</T>
                  </h3>
                  <p className="text-[10px] text-emerald-100 font-medium truncate max-w-[250px]">
                    {selectedTopic.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseTopicModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              {/* Linked Report Info Banner */}
              {selectedTopic.reportId && (
                <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-2 text-blue-900">
                  <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-snug">
                    <span className="font-bold uppercase text-blue-700 block">
                      <T>Bản tin KPH liên quan</T>: #{selectedTopic.reportId}
                    </span>
                    <span className="text-slate-600">
                      {reports?.find(r => r.id === selectedTopic.reportId || r.reportCode === selectedTopic.reportId)?.content || "Báo cáo sự cố gốc"}
                    </span>
                  </div>
                </div>
              )}

              {/* Text Area for Conclusion */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <span><T>Nội dung kết luận xử lý cuối cùng</T></span>
                    <span className="text-rose-500">*</span>
                  </label>
                </div>

                <textarea
                  value={conclusionText}
                  onChange={(e) => setConclusionText(e.target.value)}
                  placeholder="Nhập nội dung chốt kết luận xử lý KPH / kết quả thảo luận..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Sync Checkbox */}
              {selectedTopic.reportId && (
                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl hover:bg-emerald-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={syncToReport}
                    onChange={(e) => setSyncToReport(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-700 leading-tight">
                    <span className="font-extrabold text-emerald-800 block">
                      <T>Tự động đồng bộ (Sync) về Bản tin KPH gốc</T>
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      <T>Ghi nhận kết luận này vào mục "Ghi nhận kết quả xử lý KPH" (report.resolutions) của bài viết gốc.</T>
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCloseTopicModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                <T>Hủy</T>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedTopic) return;
                  const finalNote = conclusionText.trim();
                  if (!finalNote) {
                    alert("Vui lòng nhập nội dung kết luận trước khi chốt!");
                    return;
                  }

                  // 1. Update topic status to RESOLVED
                  if (onUpdateForumTopicStatus) {
                    onUpdateForumTopicStatus(selectedTopic.id, "RESOLVED");
                  }

                  // 2. Add pinned conclusion log to discussion thread
                  if (onAddForumReply) {
                    onAddForumReply(
                      selectedTopic.id,
                      `📌 [KẾT LUẬN CUỐI CÙNG & ĐÓNG THẢO LUẬN]:\n${finalNote}`
                    );
                  }

                  // 3. Sync to report.resolutions if enabled & reportId exists
                  if (syncToReport && selectedTopic.reportId && onUpdateReport && reports) {
                    const targetReport = reports.find(
                      r => r.id === selectedTopic.reportId || r.reportCode === selectedTopic.reportId
                    );
                    if (targetReport) {
                      const timeStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                      const newResolution: QualityReportResolution = {
                        id: `res_forum_${Date.now()}`,
                        departmentName: currentUser?.department || selectedTopic.category || "Ban Thảo luận",
                        handlerName: currentUser?.fullName || selectedTopic.creatorName || "Chủ trì Thảo luận",
                        status: "Đã xử lý",
                        resultText: `[Chốt từ Thảo luận Chuyên đề] ${finalNote}`,
                        updatedAt: timeStr
                      };

                      const updatedResolutions = [...(targetReport.resolutions || []), newResolution];
                      const updatedReport: QualityReport = {
                        ...targetReport,
                        resolutions: updatedResolutions,
                        updateLogs: [
                          ...(targetReport.updateLogs || []),
                          `Đã đồng bộ kết luận từ Thảo luận Chuyên đề bởi ${currentUser?.fullName || "Admin"} (${timeStr})`
                        ]
                      };

                      onUpdateReport(updatedReport);
                    }
                  }

                  if (showToast) {
                    showToast("Đã chốt kết luận và đồng bộ vào Bản tin KPH thành công! ✅");
                  }

                  setShowCloseTopicModal(false);
                  setConclusionText("");
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 border-none"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <T>Xác nhận Chốt & Đóng</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for full size image preview */}
      {previewImageModal && (
        <div 
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full flex items-center justify-center">
            <img 
              src={previewImageModal} 
              alt="Full Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
