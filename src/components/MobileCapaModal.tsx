import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  FileCheck,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Building2,
  Clock,
  Sparkles,
  ShieldCheck,
  Tag,
  Layers,
  ChevronRight,
  Download
} from "lucide-react";
import { QualityReport, CapaData, CapaVersion, User, Branch } from "../types";
import { parseReportTimestamp } from "../utils/notificationHelper";
import { generateProfessionalClientCapaDraft } from "../utils/aiCapaGenerator";
import { isCapaBelongingToReport, isVersionsBelongingToReport } from "./CapaManagementHub";

const T: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span translate="no" className="notranslate">{children}</span>
);

interface MobileCapaModalProps {
  report: QualityReport;
  allReports?: QualityReport[];
  currentUser?: User | null;
  users?: User[];
  branches?: Branch[];
  onClose: () => void;
  onShowToast?: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
}

// Format dd/mm/yy safely
const formatDDMMYY = (val?: string | Date): string => {
  if (!val) return "—";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.includes("/")) {
      const parts = trimmed.split(" ")[0].split("/");
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const dd = d.padStart(2, "0");
        const mm = m.padStart(2, "0");
        const yy = y.length === 4 ? y.slice(-2) : y.padStart(2, "0");
        return `${dd}/${mm}/${yy}`;
      }
    }
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
  return String(val);
};

export const checkReportHasCapa = (
  report: QualityReport,
  allReports?: QualityReport[]
): {
  hasCapa: boolean;
  isApproved: boolean;
  activeVersion?: string;
  capaData?: CapaData;
  versions: CapaVersion[];
} => {
  if (!report) return { hasCapa: false, isApproved: false, versions: [] };

  // Quy tắc: Chỉ các bản tin Không Phù Hợp (KPH NB / KPH BN) và Rủi Ro / Cảnh Báo (RRO) mới lập CAPA.
  // Các điểm sáng (DSA / Spotlight) tuyệt đối KHÔNG lập CAPA.
  const isDsa =
    report.reportType === "DSA" ||
    !!report.isSpotlight ||
    (report as any).category === "GREEN" ||
    (report as any).isDsaReport;

  if (isDsa) {
    return { hasCapa: false, isApproved: false, versions: [] };
  }

  const keys = [report.id, report.reportCode].filter(Boolean) as string[];
  let foundVersions: CapaVersion[] = [];
  let foundDraft: CapaData | null = null;

  for (const k of keys) {
    try {
      const vStr =
        localStorage.getItem(`capa_versions_v1_${k}`) ||
        localStorage.getItem(`capa_versions_${k}`) ||
        localStorage.getItem(`capa_history_${k}`);
      if (vStr) {
        const parsed = JSON.parse(vStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((v: any) => v && v.data);
          if (valid.length > 0 && isVersionsBelongingToReport(valid, report, allReports)) {
            foundVersions = valid;
            break;
          }
        }
      }
    } catch (e) {}
  }

  for (const k of keys) {
    try {
      const fStr =
        localStorage.getItem(`capa_form_v1_${k}`) ||
        localStorage.getItem(`capa_form_${k}`) ||
        localStorage.getItem(`capa_draft_${k}`);
      if (fStr) {
        const parsed = JSON.parse(fStr);
        if (parsed && typeof parsed === "object" && isCapaBelongingToReport(parsed, report, allReports)) {
          foundDraft = parsed;
          break;
        }
      }
    } catch (e) {}
  }

  // Chỉ xem là đã duyệt / ban hành khi đã có ít nhất một phiên bản ban hành chính thức (v1.0, v1.1...)
  const isApproved = foundVersions.length > 0;
  const hasCapa = isApproved || (foundDraft !== null && (!!foundDraft.ncDescription || !!foundDraft.reason));

  const activeVersion = isApproved
    ? foundVersions[0].version
    : foundDraft
    ? "Dự thảo"
    : undefined;

  const capaData = isApproved ? foundVersions[0].data : foundDraft || undefined;

  return {
    hasCapa,
    isApproved,
    activeVersion,
    capaData,
    versions: foundVersions
  };
};

export const MobileCapaModal: React.FC<MobileCapaModalProps> = ({
  report,
  allReports = [],
  currentUser,
  users = [],
  branches = [],
  onClose,
  onShowToast
}) => {
  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(0);
  const [activeZoomImg, setActiveZoomImg] = useState<string | null>(null);

  const capaInfo = checkReportHasCapa(report, allReports);
  const versions = capaInfo.versions;

  // Selected version or fallback to draft/default data
  const rawFallbackData: CapaData = {
    reportId: report.id,
    docNo: "BM01-ISO-QT04-KPPN",
    rev: "01",
    effDate: formatDDMMYY(report.timestamp || new Date()),
    occurDate: formatDDMMYY(report.timestamp || new Date()),
    sendDate: formatDDMMYY(report.timestamp || new Date()),
    ncNumber: report.reportCode || report.id,
    poNumber: "",
    productType: "finished",
    productName: (report as any).productName || report.content?.substring(0, 40) || "Sản phẩm Tân Phú",
    customerName: (report as any).customerName || "Khách Hàng Nội Bộ",
    productCode: (report as any).productCode || report.reportCode || "TP-PROD",
    totalQuantity: "",
    ncQuantity: "1 lô",
    ncStatus: "on_hold",
    ncDescription: report.content || "",
    illustrationUrls: report.imageUrls || (report.imageUrl ? [report.imageUrl] : []),
    reason: report.notes || "",
    correction: "",
    correctionTargetDate: "",
    correctionResponsible: "",
    traceability: "",
    traceabilityTargetDate: "",
    traceabilityResponsible: "",
    preventiveAction: "",
    preventiveTargetDate: "",
    preventiveResponsible: "",
    qcStaffName: report.uploaderName || "NV QC",
    qcStaffDate: formatDDMMYY(report.timestamp || new Date()),
    qcStaffSigned: true,
    supplierRepName: "Trưởng Bộ Phận",
    supplierRepDate: "",
    supplierRepSigned: false,
    qcHeadName: "Trưởng BP QLCL",
    approvalDate: formatDDMMYY(new Date()),
    stampStatus: "PASS",
    customerFeedbackStatus: "",
    customerOpinion: ""
  };

  const currentData: CapaData =
    versions.length > 0 && versions[activeVersionIndex]
      ? versions[activeVersionIndex].data
      : capaInfo.capaData || generateProfessionalClientCapaDraft(report, rawFallbackData);

  const currentVerTag =
    versions.length > 0 && versions[activeVersionIndex]
      ? versions[activeVersionIndex].version
      : "v1.0 (Dự thảo)";

  const isApproved = versions.length > 0 || currentData.stampStatus === "PASS";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-300 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-black text-[11px] tracking-wider text-white shrink-0 shadow-xs">
              <span translate="no" className="notranslate">CAPA</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-xs text-white uppercase tracking-tight truncate">
                  <T>BIỂU MẪU CAPA (BM01-ISO-QT04)</T>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-bold border border-slate-700">
                  #{report.reportCode || report.id}
                </span>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                    isApproved
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {isApproved ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                  <T>{isApproved ? "ĐÃ DUYỆT" : "DỰ THẢO"}</T>
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                <T>Phiên bản:</T> <b className="text-white font-mono">{currentVerTag}</b> • <T>Ngày ban hành:</T> <span className="font-mono">{formatDDMMYY(currentData.effDate || currentData.occurDate)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
              title="In / Xuất PDF biểu mẫu"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline"><T>In</T></span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer shadow-xs"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* Version Switcher Bar if multiple versions */}
        {versions.length > 1 && (
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0">
            <span className="font-extrabold text-slate-600 shrink-0">
              <T>Lịch sử ban hành:</T>
            </span>
            {versions.map((ver, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveVersionIndex(idx)}
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all whitespace-nowrap ${
                  activeVersionIndex === idx
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{ver.version}</span>
                {idx === 0 && <span className="ml-1 text-[8px] font-normal opacity-80">(Hiện hành)</span>}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Modal Content: The Exact ISO 9001 Form (Form Hình 2) */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 bg-slate-50/50 space-y-3">
          {/* Main Paper Box with Clean Border */}
          <div className="bg-white border-2 border-slate-900 rounded-lg shadow-xs overflow-hidden text-slate-900 font-sans text-xs">
            {/* 1. Header Table */}
            <table className="w-full border-b-2 border-slate-900 border-collapse">
              <tbody>
                <tr>
                  {/* Cột 1: Logo */}
                  <td className="w-[20%] p-2 border-r-2 border-slate-900 text-center align-middle bg-white">
                    <img
                      src="/tpp_logo.png"
                      alt="Logo Tan Phu"
                      className="max-h-12 max-w-full mx-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="text-[8.5px] font-black text-blue-900 uppercase mt-0.5 tracking-tighter">
                      <T>TÂN PHÚ</T>
                    </div>
                  </td>

                  {/* Cột 2: Tiêu đề biểu mẫu */}
                  <td className="w-[58%] p-2 border-r-2 border-slate-900 text-center align-middle bg-white">
                    <div className="text-[9.5px] sm:text-[11px] uppercase tracking-tight text-slate-800 font-bold leading-tight">
                      <T>BRANCH OF TAN PHU VIETNAM JOINT STOCK COMPANY</T>
                    </div>
                    <div className="mt-1 border-t border-slate-300 pt-1 space-y-0.5">
                      <div className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wide leading-tight">
                        <T>BÁO CÁO SỰ KHÔNG PHÙ HỢP</T>
                      </div>
                      <div className="text-[9.5px] sm:text-[11px] font-extrabold text-slate-700 tracking-wider leading-tight">
                        <T>NON - CONFORMITY REPORT</T>
                      </div>
                    </div>
                  </td>

                  {/* Cột 3: Mã No.Doc & Rev */}
                  <td className="w-[22%] text-[8px] sm:text-[9.5px] font-sans font-medium text-left p-1.5 sm:p-2 space-y-0.5 bg-slate-50 align-middle">
                    <div className="border-b border-slate-200 pb-0.5">
                      <T>Mã (No.Doc):</T> <b>{currentData.docNo || "BM01-ISO-QT04-KPPN"}</b>
                    </div>
                    <div className="border-b border-slate-200 pb-0.5">
                      <T>Lần ban hành (Rev):</T> <b>{currentVerTag}</b>
                    </div>
                    <div className="border-b border-slate-200 pb-0.5">
                      <T>Ngày ban hành:</T> <b>{formatDDMMYY(currentData.effDate || currentData.occurDate)}</b>
                    </div>
                    <div>
                      <T>Trang (Pages):</T> <b>01/01</b>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* PART 1: THÔNG TIN VỀ SỰ KHÔNG PHÙ HỢP */}
            <div>
              <div className="bg-slate-200 border-b-2 border-slate-900 px-2 py-1 font-black text-[11px] uppercase flex items-center justify-between text-slate-900">
                <T>1. THÔNG TIN VỀ SỰ KHÔNG PHÙ HỢP (NON - CONFORMITY INFORMATION)</T>
                {currentData.isAiDrafted && (
                  <span className="text-[8px] bg-indigo-600 text-white font-bold px-1 py-0.2 rounded flex items-center gap-0.5">
                    <Sparkles className="w-2 h-2" />
                    <T>AI trích xuất</T>
                  </span>
                )}
              </div>

              <table className="w-full border-collapse text-[10px] sm:text-xs">
                <tbody>
                  {/* Product Type Row */}
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 w-1/4 bg-slate-50">
                      <T>Thông tin (Information)</T>
                    </td>
                    <td className="p-1 border-r border-slate-900 text-center font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-black text-xs text-blue-700">
                          {currentData.productType === "finished" ? "☑" : "☐"}
                        </span>
                        <T>Thành phẩm</T>
                      </span>
                    </td>
                    <td className="p-1 border-r border-slate-900 text-center font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-black text-xs text-blue-700">
                          {currentData.productType === "semi" ? "☑" : "☐"}
                        </span>
                        <T>Bán thành phẩm</T>
                      </span>
                    </td>
                    <td className="p-1 border-r border-slate-900 text-center font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-black text-xs text-blue-700">
                          {currentData.productType === "raw" ? "☑" : "☐"}
                        </span>
                        <T>Nguyên vật liệu</T>
                      </span>
                    </td>
                    <td className="p-1 text-center font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-black text-xs text-blue-700">
                          {currentData.productType === "reject" ? "☑" : "☐"}
                        </span>
                        <T>Từ chối nhận</T>
                      </span>
                    </td>
                  </tr>

                  {/* Dates Row */}
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Ngày nhận diện KPH:</T>
                    </td>
                    <td className="p-1.5 border-r border-slate-900 font-extrabold text-blue-800">
                      {formatDDMMYY(currentData.occurDate)}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Ngày gửi NC:</T>
                    </td>
                    <td className="p-1.5 font-extrabold text-blue-800" colSpan={2}>
                      {formatDDMMYY(currentData.sendDate || currentData.occurDate)}
                    </td>
                  </tr>

                  {/* NC Number & PO */}
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Số NC (NC number):</T>
                    </td>
                    <td className="p-1.5 border-r border-slate-900 font-extrabold text-blue-800">
                      {currentData.ncNumber || report.reportCode || report.id}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Số PO (Purchase Order):</T>
                    </td>
                    <td className="p-1.5 font-extrabold text-blue-800" colSpan={2}>
                      {currentData.poNumber || "—"}
                    </td>
                  </tr>

                  {/* Product Name */}
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Tên sản phẩm (Product name):</T>
                    </td>
                    <td className="p-1.5 font-extrabold text-blue-800 uppercase" colSpan={4}>
                      {currentData.productName || "—"}
                    </td>
                  </tr>

                  {/* Customer Name */}
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Tên khách hàng (Customer name):</T>
                    </td>
                    <td className="p-1.5 font-extrabold text-blue-800 uppercase" colSpan={4}>
                      {currentData.customerName || "—"}
                    </td>
                  </tr>

                  {/* Product Code & Quantity */}
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Mã sản phẩm (Product code):</T>
                    </td>
                    <td className="p-1.5 border-r border-slate-900 font-extrabold text-blue-800">
                      {currentData.productCode || report.reportCode || "—"}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-50">
                      <T>Số lượng KPH (Quantity):</T>
                    </td>
                    <td className="p-1.5 font-extrabold text-blue-800" colSpan={2}>
                      {currentData.ncQuantity || "—"}
                    </td>
                  </tr>

                  {/* Description & Photo */}
                  <tr className="border-b-2 border-slate-900">
                    <td className="p-2 font-bold border-r border-slate-900 bg-slate-50 align-top w-1/2" colSpan={3}>
                      <div className="font-bold text-slate-900 underline mb-1">
                        <T>Mô tả sự không phù hợp (NC description):</T>
                      </div>
                      <div className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words pl-1 border-l-2 border-indigo-200">
                        {currentData.ncDescription || report.content || "—"}
                      </div>
                    </td>
                    <td className="p-2 font-bold align-top w-1/2 bg-slate-50/50" colSpan={2}>
                      <div className="font-bold text-slate-900 underline mb-1">
                        <T>Hình ảnh sự không phù hợp (Evidence Photo):</T>
                      </div>
                      {currentData.illustrationUrls && currentData.illustrationUrls.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap items-center pt-1">
                          {currentData.illustrationUrls.map((url, i) => (
                            <div
                              key={i}
                              onClick={() => setActiveZoomImg(url)}
                              className="relative border border-slate-300 rounded p-0.5 bg-white shadow-2xs cursor-pointer hover:border-indigo-500 group"
                            >
                              <img
                                src={url}
                                alt={`Evidence ${i + 1}`}
                                className="max-h-24 sm:max-h-28 object-contain rounded block"
                              />
                              <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white p-0.5 rounded-full opacity-75 group-hover:opacity-100">
                                <ZoomIn className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[10px] pt-2">
                          <T>Không có hình đính kèm</T>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PART 2: HÀNH ĐỘNG KHẮC PHỤC TỨC THỜI (CORRECTIVE ACTION - C) */}
            <div>
              <div className="bg-slate-200 border-b-2 border-slate-900 px-2 py-1 font-black text-[11px] uppercase text-slate-900">
                <T>2. HÀNH ĐỘNG KHẮC PHỤC TỨC THỜI (CORRECTIVE ACTION - C)</T>
              </div>
              <div className="p-2 border-b-2 border-slate-900 bg-white">
                <div className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words pl-1 border-l-2 border-emerald-300">
                  {currentData.correction || currentData.reason?.includes("【HÀNH ĐỘNG KHẮC PHỤC") ? currentData.correction : (
                    currentData.correction || "• Đã tiến hành cô lập lô hàng không phù hợp, dán tem cảnh báo và xử lý chọn lọc theo quy trình."
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[9.5px] pt-1.5 border-t border-slate-200 text-slate-600">
                  <div>
                    <T>Người phụ trách:</T> <b className="text-slate-800">{currentData.correctionResponsible || currentData.supplierRepName || "Tổ Trưởng / QC Ca"}</b>
                  </div>
                  <div>
                    <T>Hạn hoàn thành:</T> <b className="text-slate-800 font-mono">{formatDDMMYY(currentData.correctionTargetDate || currentData.occurDate)}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 3: PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS - R) */}
            <div>
              <div className="bg-slate-200 border-b-2 border-slate-900 px-2 py-1 font-black text-[11px] uppercase text-slate-900">
                <T>3. PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS - 5 WHY / 4M1E1I)</T>
              </div>
              <div className="p-2 border-b-2 border-slate-900 bg-white">
                <div className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words pl-1 border-l-2 border-amber-400">
                  {currentData.reason || "• Đang phân tích nguyên nhân gốc rễ theo phương pháp 5-Why và 4M1E1I."}
                </div>
              </div>
            </div>

            {/* PART 4: BIỆN PHÁP KHẮC PHỤC PHÒNG NGỪA (PREVENTIVE ACTION - P) */}
            <div>
              <div className="bg-slate-200 border-b-2 border-slate-900 px-2 py-1 font-black text-[11px] uppercase text-slate-900">
                <T>4. BIỆN PHÁP KHẮC PHỤC PHÒNG NGỪA (PREVENTIVE ACTION - P)</T>
              </div>
              <div className="p-2 border-b-2 border-slate-900 bg-white">
                <div className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap break-words pl-1 border-l-2 border-blue-400">
                  {currentData.preventiveAction || "• Chuẩn hóa thao tác công đoạn, cập nhật tiêu chuẩn kiểm tra chất lượng và đào tạo lại nhân sự ca chạy."}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[9.5px] pt-1.5 border-t border-slate-200 text-slate-600">
                  <div>
                    <T>Bộ phận thực hiện:</T> <b className="text-slate-800">{currentData.preventiveResponsible || "Phòng Kỹ thuật / Sản xuất"}</b>
                  </div>
                  <div>
                    <T>Thời hạn phòng ngừa:</T> <b className="text-slate-800 font-mono">{formatDDMMYY(currentData.preventiveTargetDate || currentData.effDate)}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 5: THEO DÕI ĐÁNH GIÁ HIỆU QUẢ */}
            <div>
              <div className="bg-slate-200 border-b-2 border-slate-900 px-2 py-1 font-black text-[11px] uppercase text-slate-900">
                <T>5. THEO DÕI ĐÁNH GIÁ HIỆU QUẢ (FOLLOW UP & EVALUATION)</T>
              </div>
              <div className="p-2 border-b-2 border-slate-900 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div>
                  <T>Kết quả theo dõi:</T> <span className="font-semibold text-emerald-800">{currentData.verificationResult || "Đạt yêu cầu kiểm soát chất lượng sau 3 ca chạy liên tiếp."}</span>
                </div>
                <div>
                  <T>Trạng thái xác nhận:</T> <span className="font-extrabold text-emerald-700 uppercase">{currentData.verificationStatus || "Có hiệu quả (Effective)"}</span>
                </div>
              </div>
            </div>

            {/* PART 6: CHỮ KÝ & PHÊ DUYỆT (SIGNATURES & APPROVAL STAMP) */}
            <div className="p-3 bg-slate-50/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Step 3: Trưởng BP có sự KPH */}
                <div className="flex flex-col items-center bg-white p-2 rounded border border-slate-200">
                  <div className="font-bold text-[9.5px] text-slate-800">
                    <T>Trưởng BP có sự KPH</T>
                  </div>
                  <div className="text-[8px] italic text-slate-400 mb-1">
                    <T>[Bước 3] Xác nhận nguyên nhân</T>
                  </div>
                  <div className="my-1.5 h-6 flex items-center justify-center">
                    {currentData.supplierRepSigned ? (
                      <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <T>ĐÃ KÝ</T>
                      </span>
                    ) : (
                      <span className="text-[9px] italic text-slate-400">
                        <T>[Đã ký điện tử]</T>
                      </span>
                    )}
                  </div>
                  <div className="font-extrabold text-[10px] text-blue-900 truncate max-w-full">
                    {currentData.supplierRepName || "Trưởng BP"}
                  </div>
                  <div className="text-[8.5px] text-slate-500 font-mono">
                    {formatDDMMYY(currentData.supplierRepDate || currentData.approvalDate)}
                  </div>
                </div>

                {/* Step 2: BP Quản lý Chất lượng (QC Head) with PASS STAMP */}
                <div className="flex flex-col items-center bg-white p-2 rounded border border-slate-200 relative">
                  <div className="font-bold text-[9.5px] text-slate-800">
                    <T>BP Quản Lý Chất Lượng</T>
                  </div>
                  <div className="text-[8px] italic text-slate-400 mb-1">
                    <T>[Bước 2] Trưởng BP QLCL</T>
                  </div>
                  <div className="my-1.5 h-6 flex items-center justify-center">
                    <div className="px-2 py-0.5 rounded border-2 border-emerald-600 bg-emerald-50 text-emerald-700 font-black text-[10px] tracking-wider uppercase shadow-2xs transform -rotate-3">
                      <T>✓ ĐÃ DUYỆT</T>
                    </div>
                  </div>
                  <div className="font-extrabold text-[10px] text-blue-900 truncate max-w-full">
                    {currentData.qcHeadName || "Bùi Tài"}
                  </div>
                  <div className="text-[8.5px] text-slate-500 font-mono">
                    {formatDDMMYY(currentData.approvalDate)}
                  </div>
                </div>

                {/* Step 1: Người Lập (NV QC) */}
                <div className="flex flex-col items-center bg-white p-2 rounded border border-slate-200">
                  <div className="font-bold text-[9.5px] text-slate-800">
                    <T>Người Lập (NV QC)</T>
                  </div>
                  <div className="text-[8px] italic text-slate-400 mb-1">
                    <T>[Bước 1] Khởi tạo phiếu</T>
                  </div>
                  <div className="my-1.5 h-6 flex items-center justify-center">
                    <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <T>ĐÃ KÝ</T>
                    </span>
                  </div>
                  <div className="font-extrabold text-[10px] text-blue-900 truncate max-w-full">
                    {currentData.qcStaffName || report.uploaderName || "NV QC"}
                  </div>
                  <div className="text-[8.5px] text-slate-500 font-mono">
                    {formatDDMMYY(currentData.qcStaffDate || currentData.occurDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-100 border-t border-slate-200 px-3 py-2 flex items-center justify-between shrink-0 text-xs">
          <div className="text-[10px] text-slate-500 font-medium">
            <T>Hệ thống Quản lý Biến động 4M1E1I - Tân Phú</T>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[11px] rounded-lg shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <T>Đóng</T>
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {activeZoomImg && (
        <div
          className="fixed inset-0 z-[100000] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveZoomImg(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={activeZoomImg}
              alt="Zoomed Evidence"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border-2 border-white/20"
            />
            <button
              type="button"
              onClick={() => setActiveZoomImg(null)}
              className="absolute -top-3 -right-3 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer hover:bg-rose-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
