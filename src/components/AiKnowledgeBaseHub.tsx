import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Award, 
  Building2, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  ExternalLink, 
  FileCheck, 
  Layers, 
  Info, 
  Zap, 
  ShieldCheck, 
  Maximize2,
  FileCode,
  Tag,
  Calendar,
  AlertCircle,
  HelpCircle,
  Hash,
  Download,
  Share2,
  CheckCircle2
} from "lucide-react";
import Markdown from "react-markdown";
import { KnowledgeDoc, KnowledgeStandardType, User, Branch } from "../types";
import { T } from "./TranslateText";

interface AiKnowledgeBaseHubProps {
  knowledgeDocs: KnowledgeDoc[];
  branches: Branch[];
  currentUser: User | null;
  onAddDoc: (doc: Omit<KnowledgeDoc, "id" | "updatedAt">) => void;
  onUpdateDoc: (doc: KnowledgeDoc) => void;
  onDeleteDoc: (id: string) => void;
  onShowToast?: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const AiKnowledgeBaseHub: React.FC<AiKnowledgeBaseHubProps> = ({
  knowledgeDocs,
  branches,
  currentUser,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc,
  onShowToast
}) => {
  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [selectedStandard, setSelectedStandard] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Active states
  const [viewingDoc, setViewingDoc] = useState<KnowledgeDoc | null>(null);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isTestPromptOpen, setIsTestPromptOpen] = useState<boolean>(false);
  const [testFactory, setTestFactory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    category: "STANDARD" as "STANDARD" | "PROCEDURE" | "WORK_INSTRUCTION" | "REGULATION",
    standardType: "ISO_9001" as KnowledgeStandardType,
    branchId: "ALL",
    version: "v1.0",
    effectiveDate: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    summary: "",
    content: "",
    keywordsStr: "",
    isActive: true
  });

  const [editorMode, setEditorMode] = useState<"WRITE" | "PREVIEW">("WRITE");

  // Standard type labels map
  const standardTypeLabels: Record<KnowledgeStandardType, { label: string; color: string; bg: string; border: string }> = {
    TIÊU_CHUẨN_QUỐC_TẾ: { label: "Tiêu chuẩn Quốc tế", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    QUY_TRÌNH_NỘI_BỘ: { label: "Quy trình Nội bộ", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
    HƯỚNG_DẪN_CÔNG_VIỆC: { label: "Hướng dẫn Công việc", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
    QUY_CHẾ_CHẤT_LƯỢNG: { label: "Quy chế Chất lượng", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    ISO_9001: { label: "ISO 9001:2015", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
    BRCGS: { label: "BRCGS Packaging", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    BSCI: { label: "BSCI Trách nhiệm XH", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    SCAN: { label: "SCAN C-TPAT An ninh", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
    ISO_22000: { label: "ISO 22000 ATTP", color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
    ISO_14001: { label: "ISO 14001 Môi trường", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
    MOC_4M1E: { label: "Quy trình MOC 4M1E1I", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
    CAPA_SOP: { label: "Quy trình CAPA", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
    FACTORY_INTERNAL: { label: "Quy định Nhà máy", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" }
  };

  const categoryLabels: Record<string, { label: string; color: string }> = {
    STANDARD: { label: "Tiêu chuẩn quốc tế", color: "text-blue-600 bg-blue-50 border-blue-200" },
    PROCEDURE: { label: "Quy trình quản lý", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    WORK_INSTRUCTION: { label: "Hướng dẫn công việc (SOP)", color: "text-teal-600 bg-teal-50 border-teal-200" },
    REGULATION: { label: "Quy chế chất lượng", color: "text-amber-600 bg-amber-50 border-amber-200" }
  };

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    map.set("ALL", "Tất cả Nhà máy (Toàn hệ thống)");
    branches.forEach((b) => {
      map.set(b.id, b.name);
    });
    return map;
  }, [branches]);

  // Filtered knowledge docs
  const filteredDocs = useMemo(() => {
    return knowledgeDocs.filter((doc) => {
      // Filter by branch
      if (selectedBranchId !== "ALL" && doc.branchId !== "ALL" && doc.branchId !== selectedBranchId) {
        return false;
      }
      // Filter by standard
      if (selectedStandard !== "ALL" && doc.standardType !== selectedStandard) {
        return false;
      }
      // Filter by category
      if (selectedCategory !== "ALL" && doc.category !== selectedCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchCode = doc.code.toLowerCase().includes(q);
        const matchSummary = doc.summary.toLowerCase().includes(q);
        const matchContent = doc.content.toLowerCase().includes(q);
        const matchKeywords = doc.keywords?.some((k) => k.toLowerCase().includes(q));
        if (!matchTitle && !matchCode && !matchSummary && !matchContent && !matchKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [knowledgeDocs, selectedBranchId, selectedStandard, selectedCategory, searchQuery]);

  // Total text stats
  const totalCharacters = useMemo(() => {
    return knowledgeDocs.reduce((acc, d) => acc + (d.content ? d.content.length : 0), 0);
  }, [knowledgeDocs]);

  const estimatedStorageKB = useMemo(() => {
    return (totalCharacters / 1024).toFixed(1);
  }, [totalCharacters]);

  // Open Create Form
  const handleOpenCreate = () => {
    setFormData({
      title: "",
      code: `KB-${new Date().getFullYear()}-${String(knowledgeDocs.length + 1).padStart(3, "0")}`,
      category: "STANDARD",
      standardType: "ISO_9001",
      branchId: selectedBranchId !== "ALL" ? selectedBranchId : "ALL",
      version: "v1.0",
      effectiveDate: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" }),
      summary: "",
      content: "",
      keywordsStr: "",
      isActive: true
    });
    setEditingDoc(null);
    setEditorMode("WRITE");
    setIsCreateOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (doc: KnowledgeDoc) => {
    setFormData({
      title: doc.title,
      code: doc.code,
      category: (doc.category as "STANDARD" | "PROCEDURE" | "WORK_INSTRUCTION" | "REGULATION") || "STANDARD",
      standardType: doc.standardType,
      branchId: doc.branchId || "ALL",
      version: doc.version,
      effectiveDate: doc.effectiveDate,
      summary: doc.summary || "",
      content: doc.content,
      keywordsStr: doc.keywords ? doc.keywords.join(", ") : "",
      isActive: doc.isActive ?? true
    });
    setEditingDoc(doc);
    setEditorMode("WRITE");
    setIsCreateOpen(true);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      if (onShowToast) onShowToast("Vui lòng nhập tên tài liệu / tiêu chuẩn", "warning");
      return;
    }
    if (!formData.content.trim()) {
      if (onShowToast) onShowToast("Vui lòng nhập nội dung văn bản cho tài liệu", "warning");
      return;
    }

    const keywords = formData.keywordsStr
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (editingDoc) {
      const updated: KnowledgeDoc = {
        ...editingDoc,
        title: formData.title.trim(),
        code: formData.code.trim(),
        category: formData.category,
        standardType: formData.standardType,
        branchId: formData.branchId,
        version: formData.version.trim(),
        effectiveDate: formData.effectiveDate.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        keywords,
        isActive: formData.isActive,
        updatedAt: new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" })
      };
      onUpdateDoc(updated);
      if (onShowToast) onShowToast("Đã cập nhật tài liệu tri thức thành công!", "success");
    } else {
      const newDoc: Omit<KnowledgeDoc, "id" | "updatedAt"> = {
        title: formData.title.trim(),
        code: formData.code.trim() || `KB-${Date.now()}`,
        category: formData.category,
        standardType: formData.standardType,
        branchId: formData.branchId,
        version: formData.version.trim() || "v1.0",
        effectiveDate: formData.effectiveDate.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        keywords,
        isActive: formData.isActive,
        createdByName: currentUser?.fullName || "Quản trị viên",
        createdByPhone: currentUser?.phone || ""
      };
      onAddDoc(newDoc);
      if (onShowToast) onShowToast("Đã thêm tài liệu mới vào Kho Tri thức AI!", "success");
    }

    setIsCreateOpen(false);
    setEditingDoc(null);
  };

  // Copy text to clipboard
  const handleCopyContent = (doc: KnowledgeDoc) => {
    navigator.clipboard.writeText(doc.content);
    setCopiedId(doc.id);
    if (onShowToast) onShowToast("Đã sao chép nội dung văn bản Notepad vào clipboard!", "info");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Compiled Prompt Context for Factory Preview
  const testFactoryPromptContext = useMemo(() => {
    const relevantDocs = knowledgeDocs.filter(
      (d) => d.isActive && (d.branchId === "ALL" || testFactory === "ALL" || d.branchId === testFactory)
    );
    if (relevantDocs.length === 0) return "Không có tài liệu nào trong kho tri thức phù hợp với nhà máy này.";

    return relevantDocs
      .map((d, index) => {
        return `[TÀI LIỆU ${index + 1}: ${d.title} (${d.code} - ${d.version})]
Áp dụng: ${branchMap.get(d.branchId) || d.branchId} | Tiêu chuẩn: ${standardTypeLabels[d.standardType]?.label || d.standardType}
Tóm tắt cốt lõi: ${d.summary}
Nội dung chi tiết:
${d.content}
----------------------------------------`;
      })
      .join("\n\n");
  }, [knowledgeDocs, testFactory, branchMap]);

  return (
    <div id="ai_knowledge_base_hub" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] border border-slate-700/60 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <T>Kho Tri thức Tiêu chuẩn AI</T>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    <T>Notepad / Text Ingestion</T>
                  </span>
                </h1>
                <T className="text-xs text-slate-300 block">
                  Tập hợp tiêu chuẩn quốc tế (ISO 9001, BRCGS, BSCI, SCAN...) và quy chế, quy trình, hướng dẫn vận hành từng nhà máy nạp trực tiếp cho AI.
                </T>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsTestPromptOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <T>Kiểm tra Prompt AI</T>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold transition-all flex items-center gap-2 shadow-md hover:shadow-teal-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <T>+ Nạp văn bản Notepad mới</T>
            </button>
          </div>
        </div>

        {/* Lightweight Storage & Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <T className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tổng số tài liệu</T>
            <span className="text-lg font-black text-white mt-0.5 block">{knowledgeDocs.length}</span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <T className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tiêu chuẩn quốc tế</T>
            <span className="text-lg font-black text-teal-400 mt-0.5 block">
              {knowledgeDocs.filter((d) => d.category === "STANDARD").length}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <T className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quy trình & Hướng dẫn SOP</T>
            <span className="text-lg font-black text-sky-400 mt-0.5 block">
              {knowledgeDocs.filter((d) => d.category === "PROCEDURE" || d.category === "WORK_INSTRUCTION").length}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <T className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Dung lượng Text siêu nhẹ</T>
            <span className="text-lg font-black text-emerald-300 mt-0.5 block">
              {estimatedStorageKB} KB <span className="text-[11px] text-slate-400 font-normal">(~{totalCharacters.toLocaleString()} ký tự)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, mã số, tóm tắt, từ khóa hoặc điều khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Filter by Branch */}
          <div className="w-full md:w-64">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">🏢 Tất cả Nhà máy / Toàn hệ thống</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Standard Type */}
          <div className="w-full md:w-56">
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">📜 Mọi bộ Tiêu chuẩn</option>
              <option value="ISO_9001">ISO 9001:2015</option>
              <option value="BRCGS">BRCGS Packaging</option>
              <option value="BSCI">BSCI (Trách nhiệm xã hội)</option>
              <option value="SCAN">SCAN C-TPAT (An ninh chuỗi)</option>
              <option value="ISO_22000">ISO 22000 (ATTP)</option>
              <option value="ISO_14001">ISO 14001 (Môi trường)</option>
              <option value="MOC_4M1E">Quy trình MOC 4M1E1I</option>
              <option value="CAPA_SOP">Quy trình CAPA</option>
              <option value="FACTORY_INTERNAL">Quy định nội bộ nhà máy</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <T className="text-xs font-bold text-slate-500 mr-2">Phân loại:</T>
          {[
            { id: "ALL", label: "Tất cả danh mục" },
            { id: "STANDARD", label: "Tiêu chuẩn quốc tế (ISO/BRC/BSCI/SCAN)" },
            { id: "PROCEDURE", label: "Quy trình quản lý (MOC/CAPA)" },
            { id: "WORK_INSTRUCTION", label: "Hướng dẫn công việc (SOP/WI)" },
            { id: "REGULATION", label: "Quy chế chất lượng" }
          ].map((cat) => {
            const isSel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSel
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <T>{cat.label}</T>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">
            <T>Không tìm thấy tài liệu phù hợp</T>
          </h3>
          <T className="text-xs text-slate-500 max-w-md mx-auto block">
            Thử thay đổi bộ lọc hoặc bấm nút "+ Nạp văn bản Notepad mới" để thêm tiêu chuẩn và quy trình cho nhà máy.
          </T>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <T>Nạp tài liệu mới</T>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => {
            const stdCfg = standardTypeLabels[doc.standardType] || standardTypeLabels.ISO_9001;
            const branchName = branchMap.get(doc.branchId) || doc.branchId;

            return (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${stdCfg.bg} ${stdCfg.color} ${stdCfg.border}`}>
                      <T>{stdCfg.label}</T>
                    </span>

                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {doc.version}
                    </span>
                  </div>

                  <h3 
                    onClick={() => setViewingDoc(doc)}
                    className="text-sm font-bold text-slate-800 hover:text-teal-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
                  >
                    <T>{doc.title}</T>
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                      {doc.code}
                    </span>
                    <span>•</span>
                    <span className="truncate flex items-center gap-1 text-slate-600">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <T>{branchName}</T>
                    </span>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  <T>{doc.summary || doc.content.slice(0, 140) + "..."}</T>
                </div>

                {/* Keywords tags */}
                {doc.keywords && doc.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {doc.keywords.slice(0, 4).map((kw, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        #{kw}
                      </span>
                    ))}
                    {doc.keywords.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium">+{doc.keywords.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Footer metadata & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span><T>Hiệu lực:</T> {doc.effectiveDate}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Copy text */}
                    <button
                      onClick={() => handleCopyContent(doc)}
                      title="Sao chép văn bản Notepad"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* View */}
                    <button
                      onClick={() => setViewingDoc(doc)}
                      title="Xem chi tiết"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      title="Chỉnh sửa"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${doc.title}" khỏi Kho Tri thức AI?`)) {
                          onDeleteDoc(doc.id);
                          if (onShowToast) onShowToast("Đã xóa tài liệu khỏi Kho Tri thức AI", "info");
                        }
                      }}
                      title="Xóa tài liệu"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW DOCUMENT DETAIL (MARKDOWN VIEWER)                           */}
      {/* ========================================================================= */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <T>{standardTypeLabels[viewingDoc.standardType]?.label || viewingDoc.standardType}</T>
                  </span>
                  <span className="font-mono text-xs text-slate-300 font-bold">{viewingDoc.code}</span>
                  <span className="text-xs text-slate-400 font-bold">• {viewingDoc.version}</span>
                </div>
                <h2 className="text-base font-black text-white leading-tight">
                  <T>{viewingDoc.title}</T>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyContent(viewingDoc)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === viewingDoc.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <T>Đã chép</T>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <T>Sao chép Text</T>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Meta Info Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold"><T>Áp dụng tại</T></span>
                <span className="font-bold text-slate-700">{branchMap.get(viewingDoc.branchId) || viewingDoc.branchId}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold"><T>Ngày ban hành</T></span>
                <span className="font-bold text-slate-700">{viewingDoc.effectiveDate}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold"><T>Người tạo / Cập nhật</T></span>
                <span className="font-bold text-slate-700">{viewingDoc.createdByName || "Quản trị viên"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold"><T>Dung lượng Text</T></span>
                <span className="font-bold text-teal-600">{(viewingDoc.content.length / 1024).toFixed(1)} KB ({viewingDoc.content.length} ký tự)</span>
              </div>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {viewingDoc.summary && (
                <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4">
                  <h4 className="text-xs font-extrabold uppercase text-teal-800 tracking-wider mb-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <T>Tóm tắt cốt lõi cho AI</T>
                  </h4>
                  <T className="text-xs text-teal-900 leading-relaxed font-medium">
                    {viewingDoc.summary}
                  </T>
                </div>
              )}

              {/* Markdown Content */}
              <div>
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-3">
                  <T>Nội dung văn bản chi tiết</T>
                </h4>
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 font-sans leading-relaxed text-xs">
                  <div className="space-y-4">
                    <Markdown>{viewingDoc.content}</Markdown>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              {viewingDoc.keywords && viewingDoc.keywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                    <T>Từ khóa AI đối chiếu</T>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingDoc.keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const doc = viewingDoc;
                  setViewingDoc(null);
                  handleOpenEdit(doc);
                }}
                className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <T>Chỉnh sửa tài liệu này</T>
              </button>

              <button
                onClick={() => setViewingDoc(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <T>Đóng</T>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT DOCUMENT (NOTEPAD INGESTION FORM)                  */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-teal-400" />
                  <T>{editingDoc ? "Chỉnh sửa Tài liệu Tri thức AI" : "Nạp Tri thức Mới (Notepad/Text Ingestion)"}</T>
                </h2>
                <T className="text-xs text-slate-400 mt-0.5 block">
                  Dán trực tiếp văn bản từ Notepad, Word hoặc quy trình để AI tự động học và đối chiếu.
                </T>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700">
                {/* Row 1: Title and Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      <T>Tên tài liệu / Tiêu chuẩn / Quy trình</T> <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Tiêu chuẩn BRCGS Packaging Issue 6 - Quản lý ngoại quan và kiểm soát vật thể lạ"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      <T>Mã hiệu tài liệu</T>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: BRCGS-PKG-06"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Row 2: Standard Type, Category, Branch, Version */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      <T>Bộ Tiêu chuẩn</T>
                    </label>
                    <select
                      value={formData.standardType}
                      onChange={(e) => setFormData({ ...formData, standardType: e.target.value as KnowledgeStandardType })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="ISO_9001">ISO 9001:2015</option>
                      <option value="BRCGS">BRCGS Packaging</option>
                      <option value="BSCI">BSCI (Trách nhiệm xã hội)</option>
                      <option value="SCAN">SCAN C-TPAT (An ninh)</option>
                      <option value="ISO_22000">ISO 22000 (ATTP)</option>
                      <option value="ISO_14001">ISO 14001 (Môi trường)</option>
                      <option value="MOC_4M1E">Quy trình MOC 4M1E1I</option>
                      <option value="CAPA_SOP">Quy trình CAPA</option>
                      <option value="FACTORY_INTERNAL">Quy định Nhà máy</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      <T>Phân loại</T>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="STANDARD">Tiêu chuẩn quốc tế</option>
                      <option value="PROCEDURE">Quy trình quản lý</option>
                      <option value="WORK_INSTRUCTION">Hướng dẫn công việc (SOP)</option>
                      <option value="REGULATION">Quy chế chất lượng</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      <T>Nhà máy áp dụng</T>
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="ALL">🏢 Toàn hệ thống (Tất cả Nhà máy)</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      <T>Phiên bản / Ngày hiệu lực</T>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="v1.0"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        className="w-20 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                      />
                      <input
                        type="text"
                        placeholder="dd/mm/yy"
                        value={formData.effectiveDate}
                        onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                        className="flex-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                    <span><T>Tóm tắt cốt lõi</T></span>
                    <span className="text-[11px] text-slate-400 font-normal"><T>Giúp AI nắm bắt nhanh ý nghĩa chính</T></span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mô tả tóm tắt nội dung quy định hoặc tiêu chuẩn này..."
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                {/* Main Notepad Content Area with Editor Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                      <T>Nội dung văn bản (Plain Text / Markdown)</T> <span className="text-rose-500">*</span>
                      <span className="text-[11px] font-normal text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {formData.content.length.toLocaleString()} ký tự (~{(formData.content.length / 1024).toFixed(1)} KB)
                      </span>
                    </label>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setEditorMode("WRITE")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          editorMode === "WRITE" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <T>Soạn thảo Notepad</T>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("PREVIEW")}
                        className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                          editorMode === "PREVIEW" ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        <T>Xem trước định dạng</T>
                      </button>
                    </div>
                  </div>

                  {editorMode === "WRITE" ? (
                    <textarea
                      rows={12}
                      required
                      placeholder={`# TIÊU CHUẨN ISO 9001:2015 - ĐIỀU KHOẢN 8.5
Dán hoặc sao chép nội dung tiêu chuẩn từ Notepad vào đây...

1. Mục tiêu và phạm vi áp dụng
2. Các bước kiểm tra chất lượng
3. Tiêu chí đánh giá KPH (Không phù hợp)`}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 leading-relaxed shadow-inner"
                    />
                  ) : (
                    <div className="min-h-[280px] max-h-[360px] overflow-y-auto p-5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                      {formData.content.trim() ? (
                        <div className="space-y-3">
                          <Markdown>{formData.content}</Markdown>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic"><T>Chưa có nội dung văn bản để xem trước.</T></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Keywords Tagging */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                    <span><T>Từ khóa AI nhận diện (cách nhau bởi dấu phẩy)</T></span>
                    <span className="text-[11px] text-slate-400 font-normal"><T>Ví dụ: ép nhựa, nhiệt độ, ngoại quan, bao bì, rách góc</T></span>
                  </label>
                  <input
                    type="text"
                    placeholder="BRCGS, ISO 9001, vết xước, nứt vỡ, màng PE, Inochi..."
                    value={formData.keywordsStr}
                    onChange={(e) => setFormData({ ...formData, keywordsStr: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <T>Hủy bỏ</T>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-teal-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <T>{editingDoc ? "Lưu thay đổi" : "Lưu vào Kho Tri thức AI"}</T>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TEST AI PROMPT & FACTORY CONTEXT INSPECTOR                       */}
      {/* ========================================================================= */}
      {isTestPromptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <T>Kiểm tra Ngữ cảnh Kho Tri thức AI</T>
                </h2>
                <T className="text-xs text-slate-400 mt-0.5 block">
                  Xem chính xác những tiêu chuẩn và quy trình nào sẽ được AI trích xuất khi phân tích báo cáo tại từng nhà máy.
                </T>
              </div>

              <button
                onClick={() => setIsTestPromptOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 shrink-0">
                <T>Chọn Nhà máy giả lập:</T>
              </label>
              <select
                value={testFactory}
                onChange={(e) => setTestFactory(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="ALL">🏢 Toàn hệ thống (Nhận tất cả tiêu chuẩn chung)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span><T>Dữ liệu Context được truyền vào Gemini API:</T></span>
                <span className="text-teal-600">{(testFactoryPromptContext.length / 1024).toFixed(1)} KB</span>
              </div>

              <textarea
                readOnly
                rows={16}
                value={testFactoryPromptContext}
                className="w-full p-4 bg-slate-900 text-teal-300 font-mono text-xs rounded-xl border border-slate-700 leading-relaxed shadow-inner"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(testFactoryPromptContext);
                  if (onShowToast) onShowToast("Đã sao chép toàn bộ context tri thức vào clipboard!", "info");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <T>Sao chép Context này</T>
              </button>

              <button
                onClick={() => setIsTestPromptOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <T>Đóng</T>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
