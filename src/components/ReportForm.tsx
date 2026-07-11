import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, RotateCw, Check, Scissors, AlertTriangle, RefreshCw, ChevronDown, X } from "lucide-react";
import { T } from "./TranslateText";
import { Category4M1E1I, QualityReport, User, Branch, UserRole } from "../types";
import { initialBranches, STANDARDIZED_QC_DEPT } from "../data";
import { loadImage, processImage, CompressingResult } from "../utils/imageProcessor";
import { formatNameCapitalized } from "../utils/branchHelpers";
import { MentionTextArea } from "./MentionTextArea";

interface ReportFormProps {
  currentUser: User;
  users?: User[];
  editingReport?: QualityReport | null;
  onCancel: () => void;
  onSubmitReport: (data: Omit<QualityReport, "id" | "googleDrivePath">) => void;
  offlineMode: boolean;
  branches?: Branch[];
  mobileUIConfig?: {
    displayRule?: "clean" | "full" | "custom";
    columns?: number;
    padding?: "compact" | "normal" | "spacious";
    colorTheme?: "blue" | "indigo" | "emerald" | "amber" | "rose" | "slate";
    fontSize?: "xs" | "sm" | "base";
    customAliases?: Record<string, string>;
  };
  onShowToast?: (message: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function ReportForm({
  currentUser,
  users = [],
  editingReport,
  onCancel,
  onSubmitReport,
  offlineMode,
  branches = initialBranches,
  mobileUIConfig,
  onShowToast
}: ReportFormProps) {
  const isRealMobile = typeof window !== "undefined" && (
    window.innerWidth < 1024 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // Config fallbacks
  const config = mobileUIConfig || {};
  const displayRule = config.displayRule || "clean";
  const columns = config.columns === 1 ? 1 : 2;
  const paddingStyle = config.padding || "normal";
  const colorTheme = config.colorTheme || "blue";
  const fontSize = config.fontSize || "xs";
  const customAliases = config.customAliases || {};

  const fontClass = 
    fontSize === "xs" ? "text-[10px]" :
    fontSize === "sm" ? "text-xs font-semibold" :
    "text-sm font-bold";

  const paddingClass = 
    paddingStyle === "compact" ? "px-2 py-1" :
    paddingStyle === "normal" ? "px-2.5 py-1.5" :
    "px-3 py-2.5";

  const colsClass = columns === 1 ? "grid-cols-1" : "grid-cols-2";

  const activeColorMap: Record<string, { btnClass: string; checkClass: string }> = {
    blue: { btnClass: "bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-400", checkClass: "text-blue-600" },
    indigo: { btnClass: "bg-indigo-50 border-indigo-500 text-indigo-805 ring-1 ring-indigo-400", checkClass: "text-indigo-600" },
    emerald: { btnClass: "bg-emerald-50 border-emerald-550 text-emerald-800 ring-1 ring-emerald-400", checkClass: "text-emerald-600" },
    amber: { btnClass: "bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400", checkClass: "text-amber-600" },
    rose: { btnClass: "bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-400", checkClass: "text-rose-600" },
    slate: { btnClass: "bg-slate-100 border-slate-600 text-slate-800 ring-1 ring-slate-450", checkClass: "text-slate-600" }
  };
  const activeStyles = activeColorMap[colorTheme] || activeColorMap.blue;

  const getBranchDisplayName = (b: Branch) => {
    return b.name;
  };

  const handleCancelWithConfirm = () => {
    setShowCancelConfirm(true);
  };

  const triggerNotification = (message: string, type: "success" | "error" | "warning" | "info" = "warning") => {
    if (onShowToast) {
      onShowToast(message, type);
    } else {
      alert(message);
    }
  };

  // Fields state
  const findMatchingBranch = (targetNameOrId: string, deptName?: string): Branch | undefined => {
    if (!targetNameOrId && !deptName) return undefined;

    // 1. Try exact name or ID match
    if (targetNameOrId) {
      const exactMatch = branches.find(b => b.name === targetNameOrId || b.id === targetNameOrId);
      if (exactMatch) return exactMatch;
    }

    // 2. Try matching by ID extracted from targetNameOrId in parentheses (e.g. "Văn Phòng Công Ty (TPP-CTY)" -> extract TPP-CTY)
    if (targetNameOrId) {
      const parenMatch = targetNameOrId.match(/\(([^)]+)\)/);
      if (parenMatch) {
         const extractedId = parenMatch[1].trim().toUpperCase();
         const branchById = branches.find(b => b.id.toUpperCase() === extractedId);
         if (branchById) return branchById;
      }
    }

    // 3. Try matching by ID extracted from user's department name (e.g. "Phòng Quản Lý Chất Lượng (TPP-CTY)" -> extract TPP-CTY)
    if (deptName) {
      const parenMatchDept = deptName.match(/\(([^)]+)\)/);
      if (parenMatchDept) {
         const extractedId = parenMatchDept[1].trim().toUpperCase();
         const branchById = branches.find(b => b.id.toUpperCase() === extractedId);
         if (branchById) return branchById;
      }
    }

    // 4. Try matching if user branch or department contains the branch ID directly (e.g. "TPP-CTY")
    for (const b of branches) {
      if (b.id && b.id.length >= 2) {
        const idUpper = b.id.toUpperCase();
        if (targetNameOrId && targetNameOrId.toUpperCase().includes(idUpper)) {
          return b;
        }
        if (deptName && deptName.toUpperCase().includes(idUpper)) {
          return b;
        }
      }
    }

    // 5. Try clean and normalized name matching (e.g. "Văn Phòng Công Ty" matching "Văn Phòng Công Ty (TPP-CTY)" or vice versa)
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/\([^)]+\)/g, "") // remove parentheses content
        .replace(/[^a-z0-9]/g, "") // keep only lower-case alphanumeric
        .trim();
    };

    if (targetNameOrId) {
      const normalizedTarget = normalize(targetNameOrId);
      if (normalizedTarget) {
        // Try clean equality first
        const normalizedMatch = branches.find(b => normalize(b.name) === normalizedTarget);
        if (normalizedMatch) return normalizedMatch;

        // Try clean inclusion
        const inclusionMatch = branches.find(b => {
          const bNorm = normalize(b.name);
          return bNorm.includes(normalizedTarget) || normalizedTarget.includes(bNorm);
        });
        if (inclusionMatch) return inclusionMatch;
      }
    }

    return undefined;
  };

  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    const editFactory = editingReport?.factory;
    if (editFactory) {
      const matched = findMatchingBranch(editFactory);
      if (matched) return matched.name;
    }
    
    const userBranch = currentUser?.branch || "";
    const userDept = currentUser?.department || "";
    const matchedUserBranch = findMatchingBranch(userBranch, userDept);
    if (matchedUserBranch) {
      return matchedUserBranch.name;
    }
    
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    if (isAdmin && branches.length > 0) {
      return branches[0].name;
    }

    const scoringBranches = branches.filter(b => b.isScoring);
    return scoringBranches.length > 0 ? scoringBranches[0].name : (branches[0]?.name || "");
  });

  const [isOpenBranchDropdown, setIsOpenBranchDropdown] = useState(false);

  // Calculate dynamic display for selected standard branch
  const foundBranchObj = branches.find((b) => b.name === selectedBranch);
  const displaySelectedBranch = foundBranchObj ? getBranchDisplayName(foundBranchObj) : selectedBranch;

  // Make sure selectedBranch stays in sync with branches list modifications
  useEffect(() => {
    if (branches && branches.length > 0) {
      // 1. If currently selectedBranch is still in the branches list, keep it! (no change/override needed)
      const existsInList = branches.some((b) => b.name === selectedBranch);
      if (existsInList) {
        return;
      }

      // 2. Otherwise (or on initial load sync), try to find a matching branch for the current editingReport
      const editFactory = editingReport?.factory;
      if (editFactory) {
        const matched = findMatchingBranch(editFactory);
        if (matched) {
          setSelectedBranch(matched.name);
          return;
        }
      }

      // 3. Try to find a matching branch for the currentUser's branch or department
      const userBranch = currentUser?.branch || "";
      const userDept = currentUser?.department || "";
      const matchedUserBranch = findMatchingBranch(userBranch, userDept);
      if (matchedUserBranch) {
        setSelectedBranch(matchedUserBranch.name);
        return;
      }

      // 4. Default fallback: first scoring branch or first branch in list
      const isAdmin = currentUser?.role === UserRole.ADMIN;
      const firstScoring = branches.find(b => b.isScoring);
      if (firstScoring) {
        setSelectedBranch(firstScoring.name);
      } else {
        setSelectedBranch(branches[0].name);
      }
    }
  }, [branches, currentUser, selectedBranch, editingReport]);
  const [selectedCategory, setSelectedCategory] = useState<Category4M1E1I>(editingReport?.category || "CON NGƯỜI");
  const [timestamp, setTimestamp] = useState("");
  const [content, setContent] = useState(editingReport?.content || "");
  const [notes, setNotes] = useState(editingReport?.notes || "");
  const [isAbnormal, setIsAbnormal] = useState(editingReport?.isAbnormal || editingReport?.reportType === "KPH" || false);
  const [isSpotlight, setIsSpotlight] = useState(editingReport?.isSpotlight || editingReport?.reportType === "DSA" || false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Multiple Images Management (Max 3)
  interface ProcessedImage {
    id: string;
    base64: string;
    compressedSizeKb: number;
    originalSizeKb: number;
    rotationAngle: number;
    cropBox: { x: number; y: number; width: number; height: number } | null;
    originalImage: HTMLImageElement | null;
    qualitySlider: number;
  }

  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(-1);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format real-time timestamp
  useEffect(() => {
    if (editingReport) {
      setTimestamp(editingReport.timestamp);
    } else {
      const updateClock = () => {
        const d = new Date();
        const hrs = String(d.getHours()).padStart(2, '0');
        const mns = String(d.getMinutes()).padStart(2, '0');
        const scs = String(d.getSeconds()).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        setTimestamp(`${hrs}:${mns}:${scs} ${date}/${month}/${year}`);
      };
      updateClock();
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval);
    }
  }, [editingReport]);

  // Loading existing report's images
  useEffect(() => {
    if (editingReport && images.length === 0) {
      const urls = editingReport.imageUrls || (editingReport.imageUrl ? [editingReport.imageUrl] : []);
      
      const loadInitialImages = async () => {
        const loaded: ProcessedImage[] = [];
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          let imgEl: HTMLImageElement | null = null;
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              img.onload = () => {
                imgEl = img;
                resolve(null);
              };
              img.onerror = reject;
              img.src = url;
            });
          } catch (e) {
            console.warn("Could not preload original image for editing tools:", e);
          }

          loaded.push({
            id: `edit-${i}-${Date.now()}-${Math.random()}`,
            base64: url,
            compressedSizeKb: Math.round((editingReport.compressedSizeKb || 120) / urls.length),
            originalSizeKb: Math.round((editingReport.originalSizeKb || 300) / urls.length),
            rotationAngle: 0,
            cropBox: null,
            originalImage: imgEl,
            qualitySlider: 85
          });
        }

        setImages(loaded);
        if (loaded.length > 0) {
          setActiveImageIndex(0);
        }
      };

      loadInitialImages();
    }
  }, [editingReport]);

  // Single Image compression processor
  const runCompressionForActive = async (
    index: number,
    rotation: number,
    crop: { x: number; y: number; width: number; height: number } | null,
    quality: number
  ) => {
    const targetImg = images[index];
    if (!targetImg || !targetImg.originalImage) return;

    setIsCompressing(true);
    try {
      const targetMin = Math.max(50, quality - 20);
      const targetMax = Math.max(100, quality + 30);

      const res = await processImage(targetImg.originalImage, {
        rotationAngle: rotation,
        cropState: crop,
        targetMinKb: targetMin,
        targetMaxKb: targetMax
      });

      setImages(prev => prev.map((img, i) => i === index ? {
        ...img,
        base64: res.compressedBase64,
        compressedSizeKb: res.compressedSizeKb,
        originalSizeKb: res.originalSizeKb,
        rotationAngle: rotation,
        cropBox: crop,
        qualitySlider: quality
      } : img));
    } catch (err) {
      console.error("Lỗi nén ảnh:", err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Manual File input trigger
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 3) {
      triggerNotification("Quý khách chỉ được chọn tối đa 3 hình ảnh.", "warning");
      return;
    }

    setIsCompressing(true);
    try {
      const img = await loadImage(file);
      const res = await processImage(img, {
        rotationAngle: 0,
        cropState: null,
        targetMinKb: 100,
        targetMaxKb: 200
      });

      const newImageItem: ProcessedImage = {
        id: `upload-${Date.now()}-${Math.random()}`,
        base64: res.compressedBase64,
        compressedSizeKb: res.compressedSizeKb,
        originalSizeKb: res.originalSizeKb,
        rotationAngle: 0,
        cropBox: null,
        originalImage: img,
        qualitySlider: 85
      };

      setImages(prev => {
        const updated = [...prev, newImageItem];
        setActiveImageIndex(updated.length - 1);
        return updated;
      });
    } catch (err) {
      triggerNotification("Không kham nạp được file hình ảnh do lỗi bộ giải mã.", "error");
    } finally {
      setIsCompressing(false);
    }
  };

  // Rotation trigger
  const rotateLeft = () => {
    if (activeImageIndex < 0 || activeImageIndex >= images.length) return;
    const active = images[activeImageIndex];
    const nextRotation = (active.rotationAngle + 90) % 360;
    runCompressionForActive(activeImageIndex, nextRotation, active.cropBox, active.qualitySlider);
  };

  // Preset crop helper
  const toggleSquareCrop = () => {
    if (activeImageIndex < 0 || activeImageIndex >= images.length) return;
    const active = images[activeImageIndex];
    const nextCrop = active.cropBox ? null : { x: 12.5, y: 12.5, width: 75, height: 75 };
    runCompressionForActive(activeImageIndex, active.rotationAngle, nextCrop, active.qualitySlider);
  };

  // Quality slider change
  const handleQualitySliderChange = (newQual: number) => {
    if (activeImageIndex < 0 || activeImageIndex >= images.length) return;
    const active = images[activeImageIndex];
    setImages(prev => prev.map((img, i) => i === activeImageIndex ? { ...img, qualitySlider: newQual } : img));
    runCompressionForActive(activeImageIndex, active.rotationAngle, active.cropBox, newQual);
  };

  // Delete specific index image
  const handleDeleteActiveImage = () => {
    if (activeImageIndex < 0 || activeImageIndex >= images.length) return;
    const filtered = images.filter((_, i) => i !== activeImageIndex);
    setImages(filtered);
    if (filtered.length === 0) {
      setActiveImageIndex(-1);
    } else {
      setActiveImageIndex(Math.max(0, activeImageIndex - 1));
    }
  };

  // Submit report handler
  const handleSendForm = () => {
    if (!content.trim()) {
      triggerNotification("Quý khách hãy bổ sung mô tả sự thay đổi chất lượng.", "warning");
      return;
    }

    if (images.length === 0) {
      triggerNotification("Hãy đính kèm hình ảnh minh chứng để đảm bảo tính xác thực.", "warning");
      return;
    }

    if (!isAbnormal && !isSpotlight) {
      triggerNotification("Điểm KPH và Điểm sáng bắt buộc phải chọn một.", "warning");
      return;
    }

    const totalCompressedSizeKb = images.reduce((sum, img) => sum + img.compressedSizeKb, 0);
    const totalOriginalSizeKb = images.reduce((sum, img) => sum + img.originalSizeKb, 0);

    const reportPayload: Omit<QualityReport, "id" | "googleDrivePath"> = {
      factory: selectedBranch,
      timestamp,
      category: selectedCategory,
      content,
      imageUrl: images[0].base64,
      imageUrls: images.map(img => img.base64),
      compressedSizeKb: totalCompressedSizeKb,
      originalSizeKb: totalOriginalSizeKb,
      uploaderName: editingReport ? editingReport.uploaderName : currentUser.fullName,
      uploaderPhone: editingReport ? editingReport.uploaderPhone : currentUser.phone,
      uploaderId: editingReport ? editingReport.uploaderId : currentUser.id,
      uploaderDepartment: editingReport ? editingReport.uploaderDepartment : (currentUser.department || STANDARDIZED_QC_DEPT),
      notes: notes.trim() ? notes : undefined,
      isAbnormal,
      isSpotlight,
      reportType: isAbnormal ? "KPH" : (isSpotlight ? "DSA" : "NORMAL")
    };

    onSubmitReport(reportPayload);
  };

  return (
    <div className={`w-full flex flex-col relative overflow-hidden select-none text-slate-800 bg-slate-950 transition-all duration-300 ${
      isRealMobile 
        ? "max-w-none rounded-none border-0 shadow-none h-[100dvh]" 
        : "max-w-[440px] lg:w-[375px] h-[100dvh] lg:h-[780px] rounded-[18px] lg:rounded-[36px] border-[3px] lg:border-8 border-slate-950 shadow-2xl"
    }`}>
      {/* Header view standard and title */}
      <div className={`bg-[#1e3a8a] text-white px-4 py-3.5 flex items-center shrink-0 border-b border-blue-900 shadow-md ${
        isRealMobile ? "rounded-none" : "rounded-t-[15px] lg:rounded-t-[28px]"
      }`}>
        <button onClick={handleCancelWithConfirm} className="mr-3 hover:scale-110 active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <T className="font-bold text-[15px] block">GHI NHẬN 4M1E1I</T>
        </div>
        <div className="bg-white text-[#1e3a8a] text-[8px] font-black px-1 py-0.5 rounded tracking-tighter">
          <T>4M1E1I</T>
        </div>
      </div>

      {/* Main scrolling wrapper */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
        {/* Offline notice inside frame */}
        {offlineMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <T className="text-[10px] text-amber-700 leading-tight">
              Tín hiệu kết nối máy chủ ngoại tuyến. Báo cáo này sẽ được lưu tụ tại hàng đợi bộ nhớ và đồng bộ tức thì sau khi thiết bị khôi phục trực tuyến.
            </T>
          </div>
        )}

        {/* 1. Branch selection block (Chi nhánh*) */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5 uppercase">
            <T>Chi nhánh ghi nhận*</T>
            {currentUser?.branch && selectedBranch === currentUser.branch && (
              <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5 normal-case">
                <span>🛡️</span>
                <T>Tự động nhận diện</T>
              </span>
            )}
          </label>

          {currentUser?.role === UserRole.ADMIN ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpenBranchDropdown(!isOpenBranchDropdown)}
                className="w-full flex items-center justify-between bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl py-3 px-3.5 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all cursor-pointer font-sans text-left"
              >
                <span><T>{displaySelectedBranch}</T></span>
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              </button>

              {isOpenBranchDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsOpenBranchDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 max-h-[220px] overflow-y-auto animate-fade-in divide-y divide-slate-100">
                    {branches.filter((b) => b.isScoring).map((b) => {
                      const br = b.name;
                      const displayName = getBranchDisplayName(b);
                      const isSelected = selectedBranch === br;
                      return (
                        <button
                          key={br}
                          type="button"
                          onClick={() => {
                            setSelectedBranch(br);
                            setIsOpenBranchDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold font-sans flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${
                            isSelected ? "bg-blue-50/70 text-blue-800 font-bold border-l-2 border-blue-600 pl-3" : "text-slate-700"
                          }`}
                        >
                          <span><T>{displayName}</T></span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 font-bold" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold shrink-0 text-xs">🛡️</span>
                <span className="text-xs font-extrabold text-slate-705">
                  <T>{displaySelectedBranch}</T>
                </span>
              </div>
              <span className="text-[8.5px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest leading-none">
                <T>Đóng vai trò cố định</T>
              </span>
            </div>
          )}
        </div>

        {/* 2. Timestamp view-only indicator */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
          <T className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Thời gian ghi nhận*</T>
          <T className="text-xs font-mono text-slate-700 font-bold block mt-0.5">{timestamp}</T>
        </div>

        {/* 3. Factors Grid select buttons (Hạng mục 4M1E1I*) */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase">
            <T>Hạng mục yếu tố biến động (4M1E1I)*</T>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: "CON NGƯỜI", color: "bg-indigo-600 border-indigo-700 text-white" },
              { id: "NGUYÊN VẬT LIỆU", color: "bg-fuchsia-600 border-fuchsia-700 text-white" },
              { id: "MÁY MÓC", color: "bg-emerald-600 border-emerald-700 text-white" },
              { id: "PHƯƠNG PHÁP", color: "bg-amber-600 border-amber-700 text-white" },
              { id: "MÔI TRƯỜNG", color: "bg-teal-600 border-teal-700 text-white" },
              { id: "THÔNG TIN", color: "bg-slate-700 border-slate-800 text-white" }
            ].map((cat) => {
              const isSel = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as Category4M1E1I)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase text-center border transition-all ${
                    isSel
                      ? `${cat.color} border-2 shadow-md ring-1 ring-white/10 font-bold`
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <T>{cat.id}</T>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Photo Evidence (Hình ảnh minh chứng*) */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 block uppercase">
              <T>Hình ảnh minh chứng (Tối đa 3 ảnh)*</T>
            </label>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {images.length}/3 <T>ảnh</T>
            </span>
          </div>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Thumbnail row */}
          <div className="flex items-center gap-2 flex-wrap">
            {images.map((img, idx) => {
              const isActive = idx === activeImageIndex;
              return (
                <div key={img.id} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      isActive ? "border-indigo-600 ring-2 ring-indigo-200 scale-105" : "border-slate-200 opacity-80"
                    }`}
                  >
                    <img src={img.base64} alt={`Thumb ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = images.filter((_, i) => i !== idx);
                      setImages(filtered);
                      if (filtered.length === 0) {
                        setActiveImageIndex(-1);
                      } else {
                        setActiveImageIndex(Math.max(0, idx - 1));
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md hover:scale-110 active:scale-95 cursor-pointer"
                    title="Xóa ảnh"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {/* Empty slots or add button */}
            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center text-slate-400 bg-slate-50 transition-colors"
              >
                <Camera className="w-5 h-5 text-slate-400" />
                <span className="text-[8px] font-bold mt-0.5"><T>THÊM</T></span>
              </button>
            )}
          </div>

          {images.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 active:bg-slate-50 transition-colors flex flex-col items-center justify-center text-slate-400"
            >
              <Camera className="w-8 h-8 mb-1 text-slate-400 stroke-[1.5]" />
              <T className="text-xs font-semibold">TẢI HOẶC CHỤP HÌNH ẢNH</T>
              <T className="text-[8px] text-slate-400">Hỗ trợ tối đa 3 ảnh, nén nạp WebP thông minh</T>
            </button>
          ) : (
            activeImageIndex >= 0 && activeImageIndex < images.length && (
              <div className="space-y-2 border-t pt-2 border-slate-100">
                {/* Active Image Display Zone */}
                <div className="relative border border-slate-100 rounded-lg overflow-hidden h-40 bg-slate-100 flex items-center justify-center">
                  <img
                    src={images[activeImageIndex].base64}
                    alt="Active Review"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {isCompressing && (
                    <div className="absolute inset-0 bg-slate-900 bg-opacity-40 flex items-center justify-center text-white">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                  
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white px-1.5 py-0.5 rounded text-[8px] font-mono">
                    <T>Mã hình: </T> {activeImageIndex + 1}
                  </div>
                </div>

                {/* Compression stats & adjustments for active image */}
                <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-indigo-900">
                    <T>Nén thông minh WebP:</T>
                    <span className="text-blue-700">
                      {images[activeImageIndex].compressedSizeKb} KB 
                    </span>
                  </div>
                  
                  {/* Progress gauge */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        images[activeImageIndex].compressedSizeKb < 100
                          ? "bg-amber-400"
                          : images[activeImageIndex].compressedSizeKb <= 200
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, (images[activeImageIndex].compressedSizeKb / 250) * 100)}%` }}
                    />
                  </div>

                  {/* Visual adjustment buttons */}
                  {images[activeImageIndex].originalImage && (
                    <div className="pt-1 border-t border-indigo-100 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={rotateLeft}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-[9px] font-bold flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer text-slate-600"
                      >
                        <RotateCw className="w-3 h-3" />
                        <T>XOAY 90°</T>
                      </button>
                      <button
                        type="button"
                        onClick={toggleSquareCrop}
                        className={`px-2 py-1 border rounded text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                          images[activeImageIndex].cropBox
                            ? "bg-amber-500 border-amber-600 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Scissors className="w-3 h-3" />
                        <T>{images[activeImageIndex].cropBox ? "HUỶ CẮT" : "CẮT VUÔNG"}</T>
                      </button>
                    </div>
                  )}

                  {/* Manual quality tuner slider */}
                  {images[activeImageIndex].originalImage && (
                    <div className="pt-1 text-left space-y-0.5">
                      <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                        <T>Độ sắc nét mục tiêu:</T>
                        <span className="font-bold text-indigo-700">{images[activeImageIndex].qualitySlider}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={images[activeImageIndex].qualitySlider}
                        onChange={(e) => handleQualitySliderChange(Number(e.target.value))}
                        className="w-full accent-indigo-600 bg-slate-300 h-1 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* 5. Classification controls (KPH / DSA) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left panel: Điểm Không Phù Hợp */}
          <button
            type="button"
            onClick={() => {
              setIsAbnormal(true);
              setIsSpotlight(false);
            }}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all h-[80px] cursor-pointer ${
              isAbnormal
                ? "bg-red-50 border-red-500 text-red-900 ring-2 ring-red-200 font-extrabold"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black flex items-center gap-1.5 text-red-700">
                <X size={14} className="stroke-[3.5] text-red-600" />
                <T>KPH</T>
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isAbnormal ? "bg-red-600 text-white shadow-sm ring-2 ring-red-350" : "bg-slate-100 border border-slate-300 text-slate-400"}`}>
                <X size={11} className="stroke-[4]" />
              </div>
            </div>
            <span className="text-[9px] text-slate-500 block leading-tight font-bold mt-auto"><T>Điểm Không Phù Hợp</T></span>
          </button>

          {/* Right panel: Điểm Sáng */}
          <button
            type="button"
            onClick={() => {
              setIsSpotlight(true);
              setIsAbnormal(false);
            }}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all h-[80px] cursor-pointer ${
              isSpotlight
                ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200 font-extrabold"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black flex items-center gap-1.5 text-emerald-700">
                <Check size={14} className="stroke-[3.5] text-emerald-600" />
                <T>DSA</T>
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSpotlight ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-350" : "bg-slate-100 border border-slate-300 text-slate-400"}`}>
                <Check size={11} className="stroke-[4]" />
              </div>
            </div>
            <span className="text-[9px] text-slate-500 block leading-tight font-bold mt-auto"><T>Điểm Sáng (Tin tốt)</T></span>
          </button>
        </div>

        {/* 6. Content statement description (Nội dung thay đổi*) */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex justify-between items-center mb-1 uppercase">
            <T>Nội dung chất lượng chi tiết*</T>
            <T className="text-[9px] text-slate-400 lowercase font-normal">(Chi tiết yếu tố biến động)</T>
          </label>
          <MentionTextArea
            users={users}
            placeholder="Mô tả cụ thể vấn đề chất lượng hay sự đổi mới, ví dụ: 'Bảo dưỡng định kỳ đầu cắm phôi phát hiện bám cặn...'"
            value={content}
            onChange={setContent}
            rows={3}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white font-medium"
          />
        </div>

        {/* 7. Updater view-only metadata */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <T className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">
            {editingReport ? "Nhân viên ghi nhận gốc*" : "Nhân viên ghi nhận (Tự điền)*"}
          </T>
          <div className="flex justify-between items-center mt-1">
            <T className="text-xs font-bold text-slate-700 block">
              {formatNameCapitalized(editingReport ? editingReport.uploaderName : currentUser.fullName)}
            </T>
            <T className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              {editingReport 
                ? ((users || []).find(u => u.id === editingReport.uploaderId)?.role || "NHÂN VIÊN")
                : currentUser.role}
            </T>
          </div>
          <T className="text-[10px] text-slate-500 block font-sans mt-1">
            Bộ phận: {editingReport ? editingReport.uploaderDepartment : (currentUser.department || STANDARDIZED_QC_DEPT)}
          </T>
        </div>

        {/* 8. Additional Comments (Ghi chú thêm) */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
            <T>Ghi chú mở rộng / Biện pháp xử lý</T>
          </label>
          <MentionTextArea
            users={users}
            placeholder="Nhập ghi chú hoặc biên bản khắc phục hiện trường..."
            value={notes}
            onChange={setNotes}
            rows={2}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
          />
        </div>
      </div>

      {/* Green floating BACK button */}
      <button
        type="button"
        onClick={handleCancelWithConfirm}
        className="absolute bottom-20 right-5 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-xl flex items-center justify-center shadow-2xl z-20 hover:shadow-emerald-300 transition-all cursor-pointer border-2 border-white"
        title="Quay lại"
      >
        <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
      </button>

      {/* Primary footer buttons: HỦY BỎ & GỬI BÁO CÁO */}
      <div className="bg-white border-t border-slate-200 p-3.5 grid grid-cols-2 gap-3 shrink-0">
        <button
          type="button"
          onClick={handleCancelWithConfirm}
          className="py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
        >
          <T>HỦY BỎ</T>
        </button>
        <button
          type="button"
          onClick={handleSendForm}
          className="py-2.5 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold hover:bg-[#152862] active:bg-[#0c183d] transition-colors shadow-md shadow-blue-100 flex items-center justify-center gap-1 w-full cursor-pointer"
        >
          <T>{editingReport ? "CẬP NHẬT" : "GỬI BÁO CÁO"}</T>
        </button>
      </div>

      {/* Visual Confirm Cancelation Modal inside Mobile Mockup */}
      {showCancelConfirm && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-[290px] p-5 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-950 text-sm mb-2">
              <T>Xác nhận hủy bỏ?</T>
            </h3>
            <p className="text-slate-500 text-[11px] mb-5 leading-relaxed">
              <T>Chủ quản có chắc chắn muốn hủy bỏ không? Toàn bộ nhập liệu chưa lưu sẽ bị mất hoàn toàn.</T>
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="py-2.5 text-[11px] font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                <T>QUAY LẠI</T>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirm(false);
                  onCancel();
                }}
                className="py-2.5 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                <T>ĐỒNG Ý</T>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
