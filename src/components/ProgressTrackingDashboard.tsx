import React, { useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Search, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  TrendingUp, 
  Building2, 
  ShieldAlert,
  UserX,
  PlusCircle,
  Check
} from "lucide-react";
import { T } from "./TranslateText";
import { QualityReport, User, UserRole, QualityReportResolution } from "../types";
import { formatNameCapitalized } from "../utils/branchHelpers";

interface ProgressTrackingDashboardProps {
  reports: QualityReport[];
  users: User[];
  currentUser: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  onAddBroadcast?: (notice: string, type: string) => void;
  showToast: (message: string, type?: "success" | "error" | "warning" | "info") => void;
}

export default function ProgressTrackingDashboard({
  reports = [],
  users = [],
  currentUser,
  onUpdateReport,
  onAddBroadcast,
  showToast
}: ProgressTrackingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "CHUA_TIEP_NHAN" | "DANG_XU_LY" | "DA_XU_LY">("ALL");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  
  // Directly edit/add resolution states inside the card
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<"Đang xử lý" | "Đã xử lý">("Đang xử lý");
  const [resResultText, setResResultText] = useState("");

  // Direct assign states inside the card for Admin
  const [assigningReportId, setAssigningReportId] = useState<string | null>(null);
  const [assigneeId, setAssigneeId] = useState("");

  // Replication states for completed KPHs
  const [replicatingReportId, setReplicatingReportId] = useState<string | null>(null);
  const [editingRepId, setEditingRepId] = useState<string | null>(null);
  const [repFactoryName, setRepFactoryName] = useState("");
  const [repDeptName, setRepDeptName] = useState("");
  const [repStatus, setRepStatus] = useState<"Đang chuẩn bị" | "Đang triển khai" | "Đã hoàn thành">("Đang chuẩn bị");
  const [repTargetDate, setRepTargetDate] = useState("");
  const [repCurrentState, setRepCurrentState] = useState("");
  const [repSupportRequired, setRepSupportRequired] = useState("");

  // Helper to format Vietnamese relative time or simple date
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

  const handleSaveReplication = (report: QualityReport) => {
    if (!repFactoryName || !repDeptName || !repTargetDate) {
      showToast("Vui lòng điền đầy đủ Nhà máy, Bộ phận và Hạn hoàn thành! ⚠️", "warning");
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{2}$/;
    if (!dateRegex.test(repTargetDate.trim())) {
      showToast("Định dạng hạn hoàn thành phải là dd/mm/yy (Ví dụ: 30/12/26)! ⚠️", "warning");
      return;
    }

    const currentReps = report.replications ? [...report.replications] : [];
    const targetRepId = editingRepId || `rep-${Date.now()}`;

    const newRep = {
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

    setReplicatingReportId(null);
    setEditingRepId(null);
    showToast("Đã lưu đăng ký nhân rộng thành công! ✅", "success");
  };

  const handleDeleteReplication = (report: QualityReport, repIdToDelete: string) => {
    const currentReps = report.replications ? [...report.replications] : [];
    const updatedReps = currentReps.filter((r) => r.id !== repIdToDelete);

    const updatedReport: QualityReport = {
      ...report,
      replications: updatedReps
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
    }

    setReplicatingReportId(null);
    setEditingRepId(null);
    showToast("Đã xóa đăng ký nhân rộng! 🗑️", "info");
  };

  // Only KPH reports (Không Phù Hợp - Abnormal/KPH) are tracked here
  const kphReports = reports.filter(
    (r) => !r.isDeleted && (r.reportType === "KPH" || r.isAbnormal)
  );

  // Helper: Get status of a KPH report
  const getKphStatus = (report: QualityReport): "CHUA_TIEP_NHAN" | "DANG_XU_LY" | "DA_XU_LY" => {
    // 1. Check if received (sharedBy is not empty)
    const isReceived = report.sharedBy && report.sharedBy.length > 0;
    
    // 2. Check resolutions
    const resolutions = report.resolutions || [];
    const hasCompletedRes = resolutions.some((res) => res.status === "Đã xử lý");
    const hasActiveRes = resolutions.some((res) => res.status === "Đang xử lý");

    if (hasCompletedRes) {
      return "DA_XU_LY";
    }
    if (isReceived || hasActiveRes || resolutions.length > 0) {
      return "DANG_XU_LY";
    }
    return "CHUA_TIEP_NHAN";
  };

  // Stats Counters
  const totalKph = kphReports.length;
  const countChuaTiepNhan = kphReports.filter((r) => getKphStatus(r) === "CHUA_TIEP_NHAN").length;
  const countDangXuLy = kphReports.filter((r) => getKphStatus(r) === "DANG_XU_LY").length;
  const countDaXuLy = kphReports.filter((r) => getKphStatus(r) === "DA_XU_LY").length;

  const percentProgress = totalKph > 0 ? Math.round((countDaXuLy / totalKph) * 100) : 0;

  // Filtered KPH List
  const filteredKph = kphReports.filter((r) => {
    // Filter by branch
    if (selectedBranch !== "Tất cả") {
      if (r.factory !== selectedBranch) return false;
    }

    // Filter by status
    const status = getKphStatus(r);
    if (selectedStatus !== "ALL" && status !== selectedStatus) return false;

    // Filter by search query (uploader, assignee, content)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const contentMatch = r.content.toLowerCase().includes(q);
      const uploaderMatch = r.uploaderName.toLowerCase().includes(q);
      const assigneeMatch = r.assignedPersonName?.toLowerCase().includes(q) || false;
      const deptMatch = r.assignedPersonRole?.toLowerCase().includes(q) || false;
      const codeMatch = r.reportCode?.toLowerCase().includes(q) || false;
      return contentMatch || uploaderMatch || assigneeMatch || deptMatch || codeMatch;
    }

    return true;
  });

  // Lagging Person Analysis: Group pending/unreceived KPHs by the assigned person
  const pendingByPerson: Record<
    string, 
    { user: User; count: number; reports: QualityReport[] }
  > = {};

  kphReports.forEach((r) => {
    const status = getKphStatus(r);
    if (status !== "DA_XU_LY" && r.assignedPersonId) {
      const uId = r.assignedPersonId;
      if (!pendingByPerson[uId]) {
        const u = users.find((user) => user.id === uId);
        if (u) {
          pendingByPerson[uId] = {
            user: u,
            count: 0,
            reports: []
          };
        }
      }
      if (pendingByPerson[uId]) {
        pendingByPerson[uId].count += 1;
        pendingByPerson[uId].reports.push(r);
      }
    }
  });

  const laggingList = Object.values(pendingByPerson).sort((a, b) => b.count - a.count);

  // Trigger Hot Alert/Urge notification
  const handleTriggerUrgentAlert = (personName: string, dept: string, count: number, personId: string) => {
    if (!currentUser) {
      showToast("Vui lòng đăng nhập để thực hiện! ⚠️", "warning");
      return;
    }
    
    const companyLabel = currentUser.company || "DNP";
    const notificationText = `🔴 [BÁO ĐỘNG TIẾN ĐỘ] Kính đề nghị Anh/Chị ${personName} (Trưởng BP ${dept || "Đơn vị"}) khẩn trương tiếp nhận và đẩy nhanh tiến độ xử lý ${count} điểm sự cố KPH đang bị tồn đọng tại nhà máy ${companyLabel}! Xin cảm ơn.`;
    
    if (onAddBroadcast) {
      onAddBroadcast(notificationText, "Báo động thúc đẩy tiến độ");
      showToast(`Đã phát sóng cảnh báo thúc đẩy nóng tới Trưởng BP ${personName}! 🔔`, "success");
    } else {
      showToast(`Hệ thống giả lập gửi cảnh báo đến ${personName}! 🔔`, "success");
    }
  };

  // Direct Assign handler
  const handleAssignPerson = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    if (!assigneeId) {
      showToast("Vui lòng chọn nhân sự phụ trách! ⚠️", "warning");
      return;
    }

    const u = users.find((user) => user.id === assigneeId);
    if (!u) return;

    const updatedReport: QualityReport = {
      ...report,
      assignedPersonId: u.id,
      assignedPersonName: u.fullName,
      assignedPersonRole: u.department,
      updateLogs: [...(report.updateLogs || []), `Giao phụ trách cho ${u.fullName} (${getFormattedNow()})`]
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
      showToast(`Đã phân công ${u.fullName} làm người phụ trách! 🎯`, "success");
      setAssigningReportId(null);
      setAssigneeId("");
    }
  };

  // Direct add/edit resolution handler
  const handleAddResolution = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    if (!resResultText.trim()) {
      showToast("Vui lòng nhập nội dung khắc phục! ⚠️", "warning");
      return;
    }

    const currentResolutions = report.resolutions ? [...report.resolutions] : [];
    
    const newRes: QualityReportResolution = {
      id: `res-pt-${Date.now()}`,
      departmentName: currentUser?.department || "Bộ phận xử lý",
      handlerName: currentUser?.fullName || "Người khắc phục",
      status: resStatus,
      resultText: resResultText.trim(),
      updatedAt: getFormattedNow()
    };

    currentResolutions.push(newRes);

    const updatedReport: QualityReport = {
      ...report,
      resolutions: currentResolutions,
      updateLogs: [...(report.updateLogs || []), `Cập nhật tiến độ: ${resStatus} - "${resResultText.substring(0, 30)}..." (${getFormattedNow()})`]
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
      showToast(`Đã cập nhật tiến độ khắc phục sự cố! 🛠️`, "success");
      setEditingReportId(null);
      setResResultText("");
    }
  };

  // Direct quick receive/acknowledge handler
  const handleQuickReceive = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    const userName = currentUser?.fullName || "Kiểm soát viên";
    const userDept = currentUser?.department || "BP Liên Quan";
    const label = `${userName} (${userDept})`;

    const currentShares = report.sharedBy || [];
    if (currentShares.some(name => name.startsWith(userName))) {
      showToast("Bạn đã tiếp nhận báo cáo này trước đó! 👌", "info");
      return;
    }

    const updatedReport: QualityReport = {
      ...report,
      sharedBy: [...currentShares, label],
      updateLogs: [...(report.updateLogs || []), `${userName} xác nhận tiếp nhận trực tiếp từ bảng tiến độ (${getFormattedNow()})`]
    };

    if (onUpdateReport) {
      onUpdateReport(updatedReport);
      showToast("Đã xác nhận tiếp nhận thông tin sự cố thành công! ✅", "success");
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn select-text pb-10">
      
      {/* 1. Header & KPI counters */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-indigo-900 p-4 shadow-md text-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-[16.5px] font-black uppercase tracking-tight">
              <span translate="no" className="notranslate"><T>Mục Tiêu Khắc Phục KPH</T></span>
            </h3>
          </div>
          <span className="text-[14px] font-bold bg-indigo-550 px-2.5 py-1 rounded-full">
            <span translate="no" className="notranslate">HT: {percentProgress}%</span>
          </span>
        </div>

        {/* Big Progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full transition-all duration-500"
              style={{ width: `${percentProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[13.5px] text-slate-400 font-bold">
            <span translate="no" className="notranslate"><T>Đã hoàn thành</T>: {countDaXuLy}/{totalKph} KPH</span>
            <span translate="no" className="notranslate">{percentProgress}%</span>
          </div>
        </div>

        {/* 3 Status mini blocks */}
        <div className="grid grid-cols-3 gap-2 pt-1.5">
          <button
            onClick={() => setSelectedStatus("CHUA_TIEP_NHAN")}
            className={`p-2 rounded-xl text-center border transition-all cursor-pointer bg-transparent ${
              selectedStatus === "CHUA_TIEP_NHAN"
                ? "border-red-500 bg-red-950/40 text-red-100"
                : "border-slate-800 hover:border-slate-700 text-slate-300"
            }`}
          >
            <div className="text-[20px] font-black text-red-400">{countChuaTiepNhan}</div>
            <div className="text-[13px] font-black uppercase tracking-wider text-slate-400 leading-tight">
              <span translate="no" className="notranslate"><T>Chưa Tiếp Nhận</T></span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("DANG_XU_LY")}
            className={`p-2 rounded-xl text-center border transition-all cursor-pointer bg-transparent ${
              selectedStatus === "DANG_XU_LY"
                ? "border-amber-500 bg-amber-950/40 text-amber-100"
                : "border-slate-800 hover:border-slate-700 text-slate-300"
            }`}
          >
            <div className="text-[20px] font-black text-amber-400">{countDangXuLy}</div>
            <div className="text-[13px] font-black uppercase tracking-wider text-slate-400 leading-tight">
              <span translate="no" className="notranslate"><T>Đang Khắc Phục</T></span>
            </div>
          </button>

          <button
            onClick={() => setSelectedStatus("DA_XU_LY")}
            className={`p-2 rounded-xl text-center border transition-all cursor-pointer bg-transparent ${
              selectedStatus === "DA_XU_LY"
                ? "border-emerald-500 bg-emerald-950/40 text-emerald-100"
                : "border-slate-800 hover:border-slate-700 text-slate-300"
            }`}
          >
            <div className="text-[20px] font-black text-emerald-400">{countDaXuLy}</div>
            <div className="text-[13px] font-black uppercase tracking-wider text-slate-400 leading-tight">
              <span translate="no" className="notranslate"><T>Đã Xử Lý Xong</T></span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Hot Alarm/Urgent list Section */}
      {laggingList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <h4 className="text-[15px] font-black text-red-900 uppercase tracking-tight">
              <span translate="no" className="notranslate"><T>BÁO ĐỘNG & THÚC ĐẨY CẢI TIẾN TRỌNG ĐIỂM</T></span>
            </h4>
          </div>
          <p className="text-[14px] text-slate-600 leading-normal font-semibold">
            <span translate="no" className="notranslate">Dưới đây là danh sách Trưởng đơn vị có số lượng tin KPH chưa hoàn thành xử lý. Hãy nhấp nút thúc đẩy để phát tín hiệu báo động hệ thống.</span>
          </p>

          <div className="flex flex-col gap-2">
            {laggingList.slice(0, 3).map(({ user, count }) => (
              <div key={user.id} className="bg-white rounded-xl border border-red-100 p-2.5 flex items-center justify-between gap-3 shadow-6xs">
                <div className="min-w-0">
                  <div className="text-[15px] font-black text-slate-800 truncate flex items-center gap-1">
                    <span>👤</span>
                    <span translate="no" className="notranslate">{formatNameCapitalized(user.fullName)}</span>
                  </div>
                  <div className="text-[13.5px] text-slate-500 font-extrabold mt-0.5 uppercase">
                    <span translate="no" className="notranslate">{user.department} - {user.branch}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[14px] font-black bg-red-100 text-red-700 px-2 py-1 rounded-lg">
                    <span translate="no" className="notranslate">{count} Sự cố</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTriggerUrgentAlert(user.fullName, user.department, count, user.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13.5px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 border-none cursor-pointer uppercase shadow-5xs"
                  >
                    <Bell className="w-3 h-3 text-white animate-bounce" />
                    <span translate="no" className="notranslate"><T>Hối thúc</T></span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Filter & Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-6xs space-y-2.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm theo uploader, assignee, mã, nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[15px] font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
          />
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-[13px] text-slate-400 hover:text-slate-600 font-black border-none bg-transparent cursor-pointer"
            >
              ❌
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Filter Branch */}
          <div className="space-y-0.5">
            <label className="text-[13px] font-black uppercase tracking-wider text-slate-500">
              <span translate="no" className="notranslate"><T>Nhà Máy:</T></span>
            </label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[14.5px] font-bold focus:outline-none shadow-3xs text-slate-700 appearance-none cursor-pointer"
              >
                <option value="Tất cả">Tất cả chi nhánh</option>
                <option value="Nhà máy DNP-BBM">DNP BBM</option>
                <option value="Nhà máy DNP-BBC">DNP BBC</option>
                <option value="Nhà máy Tân Phú - Long An">Tân Phú LA</option>
                <option value="Nhà máy Tân Phú - Sài Gòn">Tân Phú SG</option>
                <option value="Nhà máy Tân Phú - Bắc Ninh">Tân Phú BN</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <span className="text-[12px]">▼</span>
              </div>
            </div>
          </div>

          {/* Filter Status select */}
          <div className="space-y-0.5">
            <label className="text-[13px] font-black uppercase tracking-wider text-slate-500">
              <span translate="no" className="notranslate"><T>Trạng Thái Khắc Phục:</T></span>
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[14.5px] font-bold focus:outline-none shadow-3xs text-slate-700 appearance-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CHUA_TIEP_NHAN">🔴 Chưa Tiếp Nhận</option>
                <option value="DANG_XU_LY">🟡 Đang Khắc Phục</option>
                <option value="DA_XU_LY">🟢 Đã Xử Lý Xong</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <span className="text-[12px]">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed list of KPH Reports */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-[15px] font-black text-slate-500 uppercase tracking-wider">
            <span translate="no" className="notranslate"><T>Danh Sách Sự Cố KPH</T> ({filteredKph.length})</span>
          </span>
          {selectedStatus !== "ALL" && (
            <button
              onClick={() => setSelectedStatus("ALL")}
              className="text-[14px] font-bold text-blue-600 hover:underline bg-transparent border-none cursor-pointer"
            >
              <span translate="no" className="notranslate">Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {filteredKph.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
            <div className="text-3xl">🎉</div>
            <p className="text-[15px] font-bold leading-normal">
              <span translate="no" className="notranslate">Không tìm thấy báo cáo sự cố KPH nào cần khắc phục theo bộ lọc hiện tại. Tất cả đều an toàn và kiểm soát tốt!</span>
            </p>
          </div>
        ) : (
          filteredKph.map((report) => {
            const status = getKphStatus(report);
            const isExpanded = expandedReportId === report.id;
            const isAssignedToMe = report.assignedPersonId === currentUser?.id;
            const isPrivileged = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.REVIEWER;

            return (
              <div 
                key={report.id}
                className={`bg-white rounded-2xl border-2 transition-all p-3.5 space-y-3 ${
                  status === "DA_XU_LY" 
                    ? "border-emerald-200 bg-emerald-50/10" 
                    : status === "DANG_XU_LY" 
                    ? "border-amber-300" 
                    : "border-red-400 ring-2 ring-red-50"
                }`}
              >
                {/* Card Top Row: Factory & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[14px] font-black bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md uppercase">
                      <span translate="no" className="notranslate">{report.factory}</span>
                    </span>
                    <h5 className="text-[15.5px] font-black text-slate-800 mt-1 leading-tight">
                      <span translate="no" className="notranslate">{report.category}</span>
                    </h5>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {status === "DA_XU_LY" ? (
                      <span className="text-[13.5px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span translate="no" className="notranslate"><T>Đã Khắc Phục</T></span>
                      </span>
                    ) : status === "DANG_XU_LY" ? (
                      <span className="text-[13.5px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span translate="no" className="notranslate"><T>Đang Xử Lý</T></span>
                      </span>
                    ) : (
                      <span className="text-[13.5px] font-black text-red-800 bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span translate="no" className="notranslate"><T>Chưa Tiếp Nhận</T></span>
                      </span>
                    )}
                    {report.reportCode && (
                      <span className="text-[13px] text-slate-400 font-mono">
                        <span translate="no" className="notranslate">Code: {report.reportCode}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content description */}
                <p className="text-[15px] font-bold text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span translate="no" className="notranslate">"{report.content}"</span>
                </p>

                {/* Uploader & Date */}
                <div className="flex justify-between items-center text-[13.5px] text-slate-400 border-b border-slate-100 pb-2">
                  <span translate="no" className="notranslate">Đăng bởi: {report.uploaderName}</span>
                  <span translate="no" className="notranslate">{report.timestamp}</span>
                </div>

                {/* Assigned Person Display / Assignment edit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px]">👤</span>
                      <span className="text-[14.5px] font-black text-slate-700">
                        <span translate="no" className="notranslate">
                          Người phụ trách: {report.assignedPersonName ? (
                            <strong className="text-blue-700">{report.assignedPersonName} (Trưởng {report.assignedPersonRole || "BP"})</strong>
                          ) : (
                            <em className="text-red-500">Chưa được giao / Chỉ định</em>
                          )}
                        </span>
                      </span>
                    </div>

                    {/* Button to assign directly for admin */}
                    {isPrivileged && (
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningReportId(assigningReportId === report.id ? null : report.id);
                          setAssigneeId(report.assignedPersonId || "");
                        }}
                        className="text-[14px] text-blue-600 hover:text-blue-800 font-black cursor-pointer bg-transparent border-none flex items-center gap-0.5"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span translate="no" className="notranslate">{report.assignedPersonId ? "Giao lại" : "Chỉ định"}</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Dropdown for direct assign */}
                  {assigningReportId === report.id && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col gap-2 animate-fadeIn">
                      <label className="text-[13.5px] font-black text-slate-500 uppercase tracking-wider">
                        <span translate="no" className="notranslate">Chọn Nhân Sự Đảm Nhận:</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={assigneeId}
                          onChange={(e) => setAssigneeId(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[14.5px] font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Chọn Trưởng BP / DV --</option>
                          {users
                            .filter(u => u.status === "Đã hoạt động")
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {u.fullName} ({u.department || "BP"})
                              </option>
                            ))
                          }
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAssignPerson(report.id)}
                          className="bg-blue-600 active:bg-blue-700 text-white font-extrabold text-[14px] px-3 py-1.5 rounded-lg border-none cursor-pointer"
                        >
                          <span translate="no" className="notranslate">Lưu</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons on Card for assigned person */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-50">
                  {/* Receive action */}
                  {status === "CHUA_TIEP_NHAN" && (
                    <button
                      type="button"
                      onClick={() => handleQuickReceive(report.id)}
                      className="bg-red-600 active:bg-red-700 text-white font-black text-[14px] px-3 py-2 rounded-xl border-none cursor-pointer flex items-center gap-1 shadow-4xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span translate="no" className="notranslate"><T>TIẾP NHẬN SỰ CỐ NOW</T></span>
                    </button>
                  )}

                  {/* Update resolution actions for Assignee or Admin */}
                  {(isAssignedToMe || isPrivileged) && status !== "DA_XU_LY" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReportId(editingReportId === report.id ? null : report.id);
                        setResStatus("Đã xử lý");
                      }}
                      className="bg-indigo-600 active:bg-indigo-700 text-white font-black text-[14px] px-3 py-2 rounded-xl border-none cursor-pointer flex items-center gap-1 shadow-4xs"
                    >
                      <span>⚙️</span>
                      <span translate="no" className="notranslate">CẬP NHẬT BIỆN PHÁP KHẮC PHỤC</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                    className="ml-auto text-[14.5px] font-black text-slate-500 hover:text-slate-800 cursor-pointer bg-transparent border-none flex items-center gap-0.5"
                  >
                    <span translate="no" className="notranslate">{isExpanded ? "Thu gọn" : "Xem lịch sử"}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Direct Add Resolution Form panel */}
                {editingReportId === report.id && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-indigo-100 space-y-2.5 animate-fadeIn">
                    <div className="text-[14px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1">
                      <span>🛠️</span>
                      <span translate="no" className="notranslate">Khai báo Kết quả / Biện pháp khắc phục:</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setResStatus("Đang xử lý")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[13.5px] font-black uppercase transition-all border ${
                          resStatus === "Đang xử lý"
                            ? "bg-amber-100 border-amber-300 text-amber-900"
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <span translate="no" className="notranslate">Đang xử lý</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setResStatus("Đã xử lý")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[13.5px] font-black uppercase transition-all border ${
                          resStatus === "Đã xử lý"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                            : "bg-white border-slate-200 text-slate-500"
                        }`}
                      >
                        <span translate="no" className="notranslate">Đã xử lý xong</span>
                      </button>
                    </div>

                    <textarea
                      placeholder="Ghi cụ thể kết quả khắc phục sự cố, nguyên nhân rễ được xử lý thế nào..."
                      rows={2}
                      value={resResultText}
                      onChange={(e) => setResResultText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[14.5px] font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReportId(null);
                          setResResultText("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-[13.5px] font-bold text-slate-500 bg-transparent hover:bg-slate-100 border-none cursor-pointer"
                      >
                        <span translate="no" className="notranslate">Hủy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddResolution(report.id)}
                        className="px-3 py-1.5 rounded-lg text-[13.5px] font-black text-white bg-indigo-600 active:bg-indigo-700 border-none cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span translate="no" className="notranslate">Cập nhật</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded details / History of changes */}
                {isExpanded && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 text-[14px] font-medium leading-relaxed animate-fadeIn">
                    <div className="text-[14px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 border-b border-slate-200 pb-1">
                      <span>⏳</span>
                      <span translate="no" className="notranslate">Lịch sử sự cố & Nhật ký xử lý:</span>
                    </div>

                    {/* Change logs */}
                    {report.updateLogs && report.updateLogs.length > 0 ? (
                      <div className="space-y-1 pl-1">
                        {report.updateLogs.map((log, index) => (
                          <div key={index} className="text-slate-650 flex items-start gap-1">
                            <span className="text-blue-500">•</span>
                            <span translate="no" className="notranslate">{log}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic pl-1">Chưa có nhật ký ghi nhận thay đổi nào.</div>
                    )}

                    {/* Existing resolutions list */}
                    {report.resolutions && report.resolutions.length > 0 && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
                        <div className="font-extrabold text-slate-700 flex items-center gap-1">
                          <span>🛠️</span>
                          <span translate="no" className="notranslate">Biện pháp khắc phục đã triển khai:</span>
                        </div>
                        {report.resolutions.map((res, index) => (
                          <div key={res.id || index} className="bg-white p-2 rounded-lg border border-slate-150 space-y-1">
                            <div className="flex items-center justify-between">
                              <span translate="no" className="notranslate font-black text-slate-800">
                                {res.handlerName} ({res.departmentName})
                              </span>
                              <span className={`text-[13px] px-1.5 py-0.5 rounded font-black ${
                                res.status === "Đã xử lý" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                <span translate="no" className="notranslate">{res.status}</span>
                              </span>
                            </div>
                            <div translate="no" className="notranslate text-slate-650 text-[13.5px] leading-relaxed italic">
                              "{res.resultText}"
                            </div>
                            <div translate="no" className="notranslate text-[12.5px] text-slate-400 text-right">
                              Cập nhật lúc: {res.updatedAt}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Replications Section for Resolved KPH */}
                    {report.resolutions && report.resolutions.some(res => res.status === "Đã xử lý") && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <div className="font-extrabold text-emerald-700 flex items-center gap-1">
                            <span>🚀</span>
                            <span>Nhân rộng biện pháp khắc phục (cải tiến) sang nhà máy khác:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (replicatingReportId === report.id) {
                                setReplicatingReportId(null);
                              } else {
                                setReplicatingReportId(report.id);
                                setEditingRepId(null);
                                setRepFactoryName(currentUser?.branch || "");
                                setRepDeptName(currentUser?.department || "");
                                setRepStatus("Đang chuẩn bị");
                                setRepTargetDate("");
                                setRepCurrentState("");
                                setRepSupportRequired("");
                              }
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[12px] px-2 py-1 rounded border border-emerald-200 cursor-pointer transition-all"
                          >
                            ➕ Đăng ký nhân rộng
                          </button>
                        </div>

                        {/* Replication Form */}
                        {replicatingReportId === report.id && (
                          <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2.5 shadow-xs animate-fadeIn text-[13px]">
                            <div className="text-[13px] font-black text-emerald-900 uppercase">
                              {editingRepId ? "Sửa thông tin nhân rộng" : "Đăng ký nhân rộng biện pháp cải tiến"}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">Nhà Máy:</label>
                                <select
                                  value={repFactoryName}
                                  onChange={(e) => setRepFactoryName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold cursor-pointer"
                                >
                                  <option value="">-- Chọn Nhà Máy --</option>
                                  <option value="Nhà máy DNP-BBM">DNP BBM</option>
                                  <option value="Nhà máy TH WATER">TH WATER</option>
                                  <option value="Nhà máy Tân Phú - Long An">Tân Phú LA</option>
                                  <option value="Nhà máy Tân Phú - Bắc Ninh">Tân Phú BN</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">Bộ phận:</label>
                                <input
                                  type="text"
                                  value={repDeptName}
                                  onChange={(e) => setRepDeptName(e.target.value)}
                                  placeholder="Ví dụ: KCS, Sản xuất..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">Trạng thái:</label>
                                <select
                                  value={repStatus}
                                  onChange={(e) => setRepStatus(e.target.value as any)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold cursor-pointer"
                                >
                                  <option value="Đang chuẩn bị">⏳ Đang chuẩn bị</option>
                                  <option value="Đang triển khai">⚙️ Đang triển khai</option>
                                  <option value="Đã hoàn thành">✅ Đã hoàn thành</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">Hạn hoàn thành (dd/mm/yy):</label>
                                <input
                                  type="text"
                                  placeholder="Ví dụ: 30/12/26"
                                  value={repTargetDate}
                                  onChange={(e) => setRepTargetDate(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">Hiện trạng triển khai:</label>
                              <textarea
                                placeholder="Ghi nhận hiện trạng áp dụng..."
                                value={repCurrentState}
                                onChange={(e) => setRepCurrentState(e.target.value)}
                                rows={1}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase">Đề xuất hỗ trợ (nếu có):</label>
                              <textarea
                                placeholder="Cần hỗ trợ thiết bị, SOP mẫu hay đào tạo..."
                                value={repSupportRequired}
                                onChange={(e) => setRepSupportRequired(e.target.value)}
                                rows={1}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplicatingReportId(null);
                                  setEditingRepId(null);
                                }}
                                className="px-3 py-1.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 border-none cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveReplication(report)}
                                className="px-4 py-1.5 rounded-lg font-black text-white bg-emerald-600 hover:bg-emerald-700 border-none cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Lưu đăng ký
                              </button>
                            </div>
                          </div>
                        )}

                        {/* List of registered replications */}
                        {report.replications && report.replications.length > 0 ? (
                          <div className="space-y-1.5">
                            {report.replications.map((rep) => (
                              <div key={rep.id} className="bg-white p-2 rounded-lg border border-emerald-100 flex flex-col gap-1 text-[13.5px]">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-800">
                                    {rep.factoryName} - {rep.departmentName}
                                  </span>
                                  <span className={`text-[12px] px-1.5 py-0.5 rounded font-black ${
                                    rep.status === "Đã hoàn thành"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : rep.status === "Đang triển khai"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-sky-100 text-sky-800"
                                  }`}>
                                    {rep.status}
                                  </span>
                                </div>
                                
                                {rep.currentState && (
                                  <div className="text-slate-650 text-[13px] leading-relaxed">
                                    <strong className="text-emerald-850">Hiện trạng:</strong> {rep.currentState}
                                  </div>
                                )}
                                {rep.supportRequired && (
                                  <div className="text-slate-650 text-[13px] leading-relaxed">
                                    <strong className="text-amber-850">Đề xuất hỗ trợ:</strong> {rep.supportRequired}
                                  </div>
                                )}

                                <div className="text-[12px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-50">
                                  <span>Đăng ký bởi: {rep.registrantName} (Hạn: {rep.targetDate})</span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplicatingReportId(report.id);
                                        setEditingRepId(rep.id);
                                        setRepFactoryName(rep.factoryName);
                                        setRepDeptName(rep.departmentName);
                                        setRepStatus(rep.status);
                                        setRepTargetDate(rep.targetDate);
                                        setRepCurrentState(rep.currentState || "");
                                        setRepSupportRequired(rep.supportRequired || "");
                                      }}
                                      className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-bold text-[12px]"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReplication(report, rep.id)}
                                      className="text-red-600 hover:underline bg-transparent border-none cursor-pointer font-bold text-[12px]"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[13px] pl-1">Chưa có đơn vị nào đăng ký nhân rộng biện pháp khắc phục này.</div>
                        )}
                      </div>
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
