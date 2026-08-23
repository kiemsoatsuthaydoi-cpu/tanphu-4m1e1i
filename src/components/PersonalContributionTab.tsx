import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Sparkles,
  Zap,
  Shield,
  Flame,
  CheckCircle2,
  TrendingUp,
  Clock,
  ThumbsUp,
  FileText,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Edit,
  X,
  Target,
  Calendar,
  Layers,
  Factory,
  Building2,
  Eye,
  Check,
  Star
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { T } from "./TranslateText";
import {
  User,
  QualityReport,
  Company,
  Branch,
  Department,
  Category4M1E1I
} from "../types";
import { compressAvatar } from "../utils/imageProcessor";

export interface AwardMoment {
  id: string;
  title: string;
  date: string; // dd/mm/yy
  imageUrl: string;
  giver?: string;
  notes?: string;
  createdAt: number;
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

export const PersonalContributionTab: React.FC<PersonalContributionTabProps> = ({
  currentUser,
  reports,
  users,
  companies,
  branches,
  departments,
  onSwitchToTasks,
  onUpdateReport,
  onDeleteReport,
  onShowToast
}) => {
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

  // Active reports
  const validReports = useMemo(() => reports.filter((r) => !r.isDeleted), [reports]);
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
  }, [myCreatedReports, validReports, currentUser]);

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

  // --- 5. Custom Award Gallery State (Stored in localStorage) ---
  const storageKey = `tanphu_4m1e1i_award_gallery_${currentUser.id || "guest"}`;
  const [awardMoments, setAwardMoments] = useState<AwardMoment[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [isAddingAward, setIsAddingAward] = useState(false);
  const [newAwardTitle, setNewAwardTitle] = useState("");
  const [newAwardDate, setNewAwardDate] = useState(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  });
  const [newAwardGiver, setNewAwardGiver] = useState("");
  const [newAwardImage, setNewAwardImage] = useState("");
  const [newAwardNotes, setNewAwardNotes] = useState("");
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<AwardMoment | null>(null);

  const saveAwardMoments = (list: AwardMoment[]) => {
    setAwardMoments(list);
    try {
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {
      console.error("Failed to persist awards", e);
    }
  };

  const handleAddAwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAwardTitle.trim()) {
      onShowToast?.("Vui lòng nhập tên giải thưởng hoặc thành tích!", "warning");
      return;
    }
    if (!newAwardImage) {
      onShowToast?.("Vui lòng tải lên hoặc chọn ảnh trao thưởng!", "warning");
      return;
    }

    const newMoment: AwardMoment = {
      id: Math.random().toString(36).substring(2, 9),
      title: newAwardTitle.trim(),
      date: newAwardDate.trim() || "dd/mm/yy",
      imageUrl: newAwardImage,
      giver: newAwardGiver.trim() || "Ban Giám Đốc / Công ty",
      notes: newAwardNotes.trim(),
      createdAt: Date.now()
    };

    saveAwardMoments([newMoment, ...awardMoments]);
    onShowToast?.("Đã thêm ảnh khoảnh khắc khen thưởng vào hồ sơ! 🏆", "success");
    setIsAddingAward(false);
    setNewAwardTitle("");
    setNewAwardImage("");
    setNewAwardNotes("");
    setNewAwardGiver("");
  };

  const handleDeleteAward = (id: string) => {
    const filtered = awardMoments.filter((a) => a.id !== id);
    saveAwardMoments(filtered);
    onShowToast?.("Đã xóa ảnh thành tích khỏi hồ sơ.", "info");
    if (selectedPhotoModal?.id === id) {
      setSelectedPhotoModal(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner & Profile Summary Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <T>HỒ SƠ ĐÓNG GÓP & THÀNH TÍCH 4M1E1I</T>
            </div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>{currentUser.fullName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500 text-white shadow-sm uppercase">
                {currentUser.position || currentUser.role}
              </span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              <T>Đóng góp tích cực vào chuỗi kiểm soát chất lượng 4M1E1I, phát hiện kịp thời sự cố KPH và đề xuất sáng kiến cải tiến DSA tại</T>{" "}
              <strong className="text-white font-semibold">{currentUser.branch || "Tân Phú"}</strong>.
            </p>
          </div>

          {/* Quick Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-300 uppercase font-bold block mb-0.5">
                <T>TỔNG BẢN TIN</T>
              </span>
              <span className="text-2xl font-black text-white font-mono">{myCreatedReports.length}</span>
            </div>
            <div className="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-xl p-3 text-center min-w-[100px]">
              <span className="text-[10px] text-rose-200 uppercase font-bold block mb-0.5">
                <T>SỰ CỐ KPH</T>
              </span>
              <span className="text-2xl font-black text-rose-300 font-mono">{myKphReports.length}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-xl p-3 text-center min-w-[100px]">
              <span className="text-[10px] text-emerald-200 uppercase font-bold block mb-0.5">
                <T>ĐIỂM SÁNG DSA</T>
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono">{myDsaReports.length}</span>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-xl p-3 text-center min-w-[100px]">
              <span className="text-[10px] text-amber-200 uppercase font-bold block mb-0.5">
                <T>HUY HIỆU</T>
              </span>
              <span className="text-2xl font-black text-amber-300 font-mono">{managementBadges.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHỐI 1: TỶ TRỌNG ĐÓNG GÓP CỦA TÔI (3 BIỂU ĐỒ BÁNH / DONUT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                <T>TỶ TRỌNG ĐÓNG GÓP BẢN TIN 4M1E1I CỦA BẠN</T>
              </h3>
              <p className="text-[11px] text-slate-500">
                <T>Tỷ lệ phần trăm đóng góp của bạn so với toàn Công ty, Nhà máy và Bộ phận</T>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-lg border border-blue-200">
            <T>THỜI GIAN THỰC</T>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart 1: So với Toàn Công ty */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-between text-center relative hover:border-blue-300 transition-all">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <T>Toàn Tập đoàn / Công ty</T>
              </span>
              <span className="font-mono text-blue-700 font-black">{myTotalCount}/{totalSystemCount}</span>
            </div>

            <div className="w-36 h-36 relative my-2 flex items-center justify-center">
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
                    innerRadius={36}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={PIE_COLORS.my} />
                    <Cell fill={PIE_COLORS.others} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-800 font-mono">{systemRatio}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase"><T>Tỷ lệ</T></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              <T>Đóng góp</T> <strong className="text-blue-700 font-black">{systemRatio}%</strong> <T>tổng lượng bản tin toàn hệ thống</T>
            </p>
          </div>

          {/* Chart 2: So với Chi nhánh / Nhà máy */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-between text-center relative hover:border-indigo-300 transition-all">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Factory className="w-3.5 h-3.5 text-indigo-600" />
                <T>Chi nhánh / Nhà máy</T>
              </span>
              <span className="font-mono text-indigo-700 font-black">{myBranchCount}/{totalBranchCount}</span>
            </div>

            <div className="w-36 h-36 relative my-2 flex items-center justify-center">
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
                    innerRadius={36}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#4f46e5" />
                    <Cell fill={PIE_COLORS.others} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-800 font-mono">{branchRatio}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase"><T>Nhà máy</T></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              <T>Tại</T> <strong className="text-indigo-700 font-bold">{currentUser.branch || "Chi nhánh"}</strong>: <strong className="text-indigo-700 font-black">{branchRatio}%</strong>
            </p>
          </div>

          {/* Chart 3: So với Bộ phận / Đơn vị */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-between text-center relative hover:border-emerald-300 transition-all">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <T>Phòng ban / Bộ phận</T>
              </span>
              <span className="font-mono text-emerald-700 font-black">{myDeptCount}/{totalDeptCount}</span>
            </div>

            <div className="w-36 h-36 relative my-2 flex items-center justify-center">
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
                    innerRadius={36}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#059669" />
                    <Cell fill={PIE_COLORS.others} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-slate-800 font-mono">{deptRatio}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase"><T>Bộ phận</T></span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 font-medium leading-tight">
              <T>Tại BP</T> <strong className="text-emerald-700 font-bold">{currentUser.department || "Bộ phận"}</strong>: <strong className="text-emerald-700 font-black">{deptRatio}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 3. KHỐI 2: CHI TIẾT SỰ CỐ KPH & ĐIỂM SÁNG DSA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card KPH & RRRO */}
        <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-rose-900 uppercase tracking-wide">
                  <T>THỐNG KÊ SỰ CỐ KPH & RỦI RO RRRO</T>
                </h3>
                <p className="text-[11px] text-slate-500">
                  <T>Các vấn đề không phù hợp bạn đã kịp thời phát hiện & cảnh báo</T>
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-rose-700 font-mono bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
              {myKphReports.length} <span className="text-[10px] font-bold"><T>vụ</T></span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                <T>KPH NỘI BỘ (NB)</T>
              </span>
              <span className="text-lg font-black text-rose-700 font-mono">{kphInternalCount}</span>
            </div>
            <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                <T>KPH BÊN NGOÀI (BN)</T>
              </span>
              <span className="text-lg font-black text-rose-800 font-mono">{kphExternalCount}</span>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                <T>RỦI RO TIỀM ẨN (RRO)</T>
              </span>
              <span className="text-lg font-black text-amber-700 font-mono">{rroCount}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <T>Tỷ lệ KPH đã được giải quyết dứt điểm:</T>
            </span>
            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              {kphResolvedCount}/{myKphReports.length} ({kphResolutionRate}%)
            </span>
          </div>
        </div>

        {/* Card Điểm sáng DSA (Kaizen) */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                  <T>THỐNG KÊ ĐIỂM SÁNG DSA (KAIZEN)</T>
                </h3>
                <p className="text-[11px] text-slate-500">
                  <T>Các sáng kiến cải tiến, kinh nghiệm hay và đổi mới bạn đóng góp</T>
                </p>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-700 font-mono bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              {myDsaReports.length} <span className="text-[10px] font-bold"><T>sáng kiến</T></span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                <T>ĐÃ ĐƯỢC PHÊ DUYỆT</T>
              </span>
              <span className="text-lg font-black text-emerald-700 font-mono">{dsaApprovedCount}</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-3 text-center">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">
                <T>ĐÃ ĐƯỢC NHÂN RỘNG</T>
              </span>
              <span className="text-lg font-black text-teal-700 font-mono">{dsaReplicatedCount}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <T>Đóng góp giá trị gia tăng:</T>
            </span>
            <span className="text-slate-600 font-medium">
              <T>Tiết kiệm thời gian & nâng cao năng suất</T>
            </span>
          </div>
        </div>
      </div>

      {/* 4. KHỐI 3: HUY HIỆU TỰ HÀO & CÔNG VIỆC XỬ LÝ THẦN TỐC / ĐƯỢC KHEN TẶNG */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                <T>BẢNG HUY HIỆU TỰ HÀO & KHEN TẶNG CỦA CẤP QUẢN LÝ</T>
              </h3>
              <p className="text-[11px] text-slate-500">
                <T>Huy hiệu vinh danh và các chỉ đạo đánh giá xuất sắc từ Ban Giám đốc / Quản lý</T>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-black rounded-lg border border-amber-200 flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <T>VINH DANH CÁ NHÂN</T>
          </span>
        </div>

        {/* Badges Grid */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <T>Huy hiệu được trao tặng</T> ({managementBadges.length})
          </h4>

          {managementBadges.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
              <T>Chưa có huy hiệu trao tặng trực tiếp nào. Hãy tiếp tục phát hiện KPH và đề xuất DSA để nhận huy hiệu từ Ban Giám đốc!</T>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {managementBadges.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-xs"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-black text-amber-950 truncate">
                        {item.badge?.name || <T>Huy hiệu Xuất sắc</T>}
                      </h5>
                      <span className="text-[9px] font-mono font-bold text-amber-700">{item.badge?.timestamp || "dd/mm/yy"}</span>
                    </div>
                    <p className="text-[10px] text-amber-800/90 line-clamp-1 mt-0.5">
                      <T>Người trao:</T> <strong className="text-amber-950">{item.badge?.giverName || <T>Ban Giám đốc</T>}</strong>
                    </p>
                    <div className="mt-1 text-[9px] text-slate-500 truncate font-mono">
                      {item.reportCode}: {item.content}
                    </div>
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
            <T>Công việc xử lý nhanh & nhận lời khen ngợi</T> ({fastResolutions.length})
          </h4>

          {fastResolutions.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
              <T>Chưa có ghi nhận công việc khen thưởng riêng. Hệ thống tự động ghi nhận khi có chỉ đạo biểu dương hoặc giải pháp hoàn tất.</T>
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
                      <span className="font-mono font-bold text-blue-700 text-[11px]">
                        {r.reportCode || r.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <T>Đã khắc phục tốt</T>
                      </span>
                    </div>
                    <p className="text-slate-800 line-clamp-1 font-medium">{r.content}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{r.timestamp}</span>
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

      {/* 5. KHỐI 4: ALBUM KHOẢNH KHẮC TRAO THƯỞNG & CHỨNG NHẬN (TỰ UPLOAD HÌNH ẢNH) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                <T>ALBUM KHOẢNH KHẮC TRAO THƯỞNG & CHỨNG NHẬN</T>
              </h3>
              <p className="text-[11px] text-slate-500">
                <T>Lưu trữ hình ảnh nhận thưởng, bằng khen, chứng nhận cải tiến tại Nhà máy & Tập đoàn</T>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingAward(!isAddingAward)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <T>{isAddingAward ? "ĐÓNG BIỂU MẪU" : "THÊM ẢNH THÀNH TÍCH"}</T>
          </button>
        </div>

        {/* Add Award Form Modal / Inline */}
        {isAddingAward && (
          <form
            onSubmit={handleAddAwardSubmit}
            className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-3 animate-fadeIn"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  <T>Tên giải thưởng / Thành tích *</T>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sáng kiến xuất sắc Quý 1..."
                  value={newAwardTitle}
                  onChange={(e) => setNewAwardTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  <T>Ngày nhận (dd/mm/yy) *</T>
                </label>
                <input
                  type="text"
                  required
                  placeholder="dd/mm/yy"
                  value={newAwardDate}
                  onChange={(e) => setNewAwardDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  <T>Đơn vị / Cấp trao thưởng</T>
                </label>
                <input
                  type="text"
                  placeholder="VD: Ban Giám đốc Nhà máy Long An..."
                  value={newAwardGiver}
                  onChange={(e) => setNewAwardGiver(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            {/* Photo upload input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  <T>Tải ảnh giấy khen / Khoảnh khắc nhận thưởng *</T>
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <T>Chọn ảnh từ máy</T>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            if (onShowToast) onShowToast("Đang nén ảnh thành tích...", "info");
                            const compressed = await compressAvatar(file);
                            setNewAwardImage(compressed);
                            if (onShowToast) onShowToast("Đã xử lý ảnh thành công!", "success");
                          } catch (err: any) {
                            if (onShowToast) onShowToast("Lỗi nén ảnh: " + (err.message || err), "error");
                          }
                        }
                      }}
                    />
                  </label>
                  {newAwardImage && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> <T>Đã chọn ảnh</T>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  <T>Ghi chú thêm</T>
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú chi tiết..."
                  value={newAwardNotes}
                  onChange={(e) => setNewAwardNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            {newAwardImage && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-300 relative group">
                <img src={newAwardImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => setNewAwardImage("")}
                  className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full hover:bg-rose-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddingAward(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
              >
                <T>HỦY</T>
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                <T>LƯU ẢNH THÀNH TÍCH</T>
              </button>
            </div>
          </form>
        )}

        {/* Photo Gallery Grid */}
        {awardMoments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-xl">
            <ImageIcon className="w-8 h-8 opacity-40 text-slate-400" />
            <span className="text-xs font-bold">
              <T>Bạn chưa thêm ảnh trao thưởng / giấy khen nào.</T>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingAward(true)}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              <T>+ Bấm vào đây để tải ảnh thành tích đầu tiên</T>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {awardMoments.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden group hover:shadow-md transition-all flex flex-col"
              >
                <div
                  className="w-full aspect-square bg-slate-100 overflow-hidden relative cursor-pointer"
                  onClick={() => setSelectedPhotoModal(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1" title={item.title}>
                      {item.title}
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 truncate max-w-[90px]">{item.giver}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAward(item.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. KHỐI ĐIỀU HƯỚNG NHANH ĐẾN DANH SÁCH VIỆC TÁC NGHIỆP */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              <T>XEM & QUẢN LÝ CHI TIẾT TOÀN BỘ CÔNG VIỆC / BÁO CÁO CỦA BẠN</T>
            </h4>
            <p className="text-[11px] text-slate-500">
              <T>Chuyển sang tab "Danh sách chi tiết việc của tôi" để lọc trạng thái, tìm kiếm, xuất file Excel hoặc chỉnh sửa nội dung.</T>
            </p>
          </div>
        </div>

        {onSwitchToTasks && (
          <button
            type="button"
            onClick={onSwitchToTasks}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <T>XEM VIỆC CỦA TÔI</T>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-black text-slate-800">{selectedPhotoModal.title}</h4>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={selectedPhotoModal.imageUrl}
                alt={selectedPhotoModal.title}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-700">
                  <T>Đơn vị trao:</T> {selectedPhotoModal.giver || "Tân Phú"}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">{selectedPhotoModal.date}</p>
                {selectedPhotoModal.notes && (
                  <p className="text-[11px] text-slate-600 mt-1">{selectedPhotoModal.notes}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAward(selectedPhotoModal.id)}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 font-bold"
              >
                <T>Xóa ảnh này</T>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalContributionTab;
