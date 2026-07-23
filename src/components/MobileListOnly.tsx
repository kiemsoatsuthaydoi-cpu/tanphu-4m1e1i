import React, { useEffect } from "react";
import { T } from "./TranslateText";
import { QualityReport, User, Branch } from "../types";
import { Users, User as UserIcon, Cpu, Settings, FileText, Heart, Info, Award } from "lucide-react";
import { formatNameCapitalized } from "../utils/branchHelpers";
import { getReportRatingsStats, renderSummaryStars, isEligibleEvaluator } from "./MobileReportRatingSection";

interface MobileListOnlyProps {
  reports: QualityReport[];
  currentUser?: User | null;
  branches?: Branch[];
  mobileUIConfig?: {
    colorTheme?: "blue" | "indigo" | "emerald" | "amber" | "rose" | "slate";
    fontSize?: "xs" | "sm" | "base";
  };
  onClose: () => void;
}

export function MobileListOnly({
  reports,
  currentUser,
  branches,
  mobileUIConfig,
  onClose,
}: MobileListOnlyProps) {
  
  const getFactoryDisplayName = (factoryName: string | undefined | null) => {
    if (!factoryName || typeof factoryName !== "string") return "";

    // Find the matching branch with robust lowercase and regex-cleaned comparison
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

  const getContentFontSizeClass = (size: string | undefined) => {
    switch (size) {
      case "sm": return "text-[13px]";
      case "base": return "text-[15px]";
      case "xs":
      default:
        return "text-[12px]";
    }
  };

  const contentFontSizeClass = getContentFontSizeClass(mobileUIConfig?.fontSize);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "CON NGƯỜI":
        return <Users className="w-4 h-4 mr-1 text-indigo-600 inline" />;
      case "MÁY MÓC":
        return <Cpu className="w-4 h-4 mr-1 text-green-600 inline" />;
      case "NGUYÊN VẬT LIỆU":
        return <Settings className="w-4 h-4 mr-1 text-fuchsia-600 inline" />;
      case "PHƯƠNG PHÁP":
        return <FileText className="w-4 h-4 mr-1 text-amber-600 inline" />;
      case "MÔI TRƯỜNG":
        return <Heart className="w-4 h-4 mr-1 text-teal-600 inline" />;
      case "THÔNG TIN":
        return <Info className="w-4 h-4 mr-1 text-slate-600 inline" />;
      default:
        return <Info className="w-4 h-4 mr-1 text-slate-600 inline" />;
    }
  };

  useEffect(() => {
    // Apply "native-scroll-active" and force height: auto on root wrappers
    document.body.classList.add("native-scroll-active");
    document.documentElement.classList.add("native-scroll-active");
    const root = document.getElementById("root");
    if (root) {
      root.classList.add("native-scroll-active");
    }

    // Direct inline styles override for total bulletproofing
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.setProperty("overflow", "visible", "important");
    document.body.style.setProperty("height", "auto", "important");
    document.documentElement.style.setProperty("overflow", "visible", "important");
    document.documentElement.style.setProperty("height", "auto", "important");

    if (root) {
      root.style.setProperty("height", "auto", "important");
      root.style.setProperty("overflow", "visible", "important");
      root.style.setProperty("display", "block", "important");
    }

    return () => {
      document.body.classList.remove("native-scroll-active");
      document.documentElement.classList.remove("native-scroll-active");
      if (root) {
        root.classList.remove("native-scroll-active");
        root.style.overflow = "";
        root.style.height = "";
        root.style.display = "";
      }
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  // Filter out deleted reports
  const activeReports = reports.filter(r => !r.isDeleted);

  const [showAckDetailsList, setShowAckDetailsList] = React.useState<Record<string, boolean>>({});
  const [expandedDirectiveIdsList, setExpandedDirectiveIdsList] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    function handleGlobalClick(e: Event) {
      const target = e.target as HTMLElement;
      if (!target) return;

      const hasExpanded = Object.values(expandedDirectiveIdsList).some(Boolean);
      if (hasExpanded) {
        if (!target.closest('[data-directive-container-list="true"]')) {
          setExpandedDirectiveIdsList({});
          setShowAckDetailsList({});
        }
      }
    }

    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("touchstart", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [expandedDirectiveIdsList]);

  // Sort reports chronologically or reverse-chronologically (newest first matches system view)
  const sortedReports = [...activeReports].sort((a, b) => {
    return b.timestamp.localeCompare(a.timestamp);
  });

  return (
    <div className="w-full min-h-screen bg-white font-sans flex flex-col antialiased">
      {/* Banner vàng cố định trên cùng */}
      <div 
        onClick={onClose}
        className="fixed top-0 left-0 right-0 z-[100000] bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-3 text-xs font-black text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-lg select-none border-b border-amber-600 font-sans"
      >
        <span translate="no" className="notranslate">📸 ĐANG TRONG CHẾ ĐỘ CHỤP CUỘN. Hãy dùng phím cứng điện thoại để chụp ngay! [X ĐÓNG]</span>
      </div>

      {/* Capture zone containing only the pure, printable flat content */}
      <div 
        id="capture-zone" 
        className="w-full bg-white px-4 pb-16 pt-16 flex flex-col font-sans select-none"
        style={{ height: "auto", overflow: "visible" }}
      >
        {/* Header báo cáo in ấn */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            <span translate="no" className="notranslate">BÁO CÁO THAY ĐỔI 4M1E1I CHẤT LƯỢNG TÂN PHÚ</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
            <span translate="no" className="notranslate">Chế độ trích xuất sạch - Không trùng lặp linh kiện phần mềm</span>
          </p>
        </div>

        {sortedReports.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold">
            <span translate="no" className="notranslate">Không có báo cáo nào hiện có.</span>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedReports.map((report) => (
              <div 
                key={report.id}
                className={`p-4 bg-white rounded-xl border-2 ${
                  report.reportType === "KPH" || report.isAbnormal
                    ? "border-red-500 bg-red-50/10"
                    : report.reportType === "DSA" || report.isSpotlight
                    ? "border-emerald-500 bg-emerald-50/10"
                    : "border-slate-200"
                } flex flex-col gap-3 break-inside-avoid`}
              >
                {/* Card header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-[14px] font-black text-slate-800 uppercase">
                      <span translate="no" className="notranslate">{getFactoryDisplayName(report.factory)?.toUpperCase()}</span>
                    </h3>
                    <p className="text-[10px] text-slate-600 font-extrabold mt-0.5">
                      <UserIcon className="w-3.5 h-3.5 inline-block mr-0.5 align-text-bottom stroke-[2.5] text-blue-600" /> <span translate="no" className="notranslate">{formatNameCapitalized(report.uploaderName)}</span> <span className="text-slate-300 mx-1.5 font-normal">|</span> <span translate="no" className="notranslate text-[9px] text-slate-400 font-sans font-semibold">{report.timestamp}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {report.reportType === "KPH" || report.isAbnormal ? (
                      <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase">
                        <span translate="no" className="notranslate">⚠️ ĐIỂM KPH</span>
                      </span>
                    ) : report.reportType === "DSA" || report.isSpotlight ? (
                      <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded uppercase">
                        <span translate="no" className="notranslate">⭐ ĐIỂM SÁNG (DSA)</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                        <span translate="no" className="notranslate">TIÊU CHUẨN</span>
                      </span>
                    )}
                    {report.reportCode && (
                      <span className="text-[9px] text-slate-400 font-sans font-semibold">
                        <span translate="no" className="notranslate">ID: {report.reportCode}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Flat, stacked grid of images so they are fully captured in the scrolling screenshot */}
                {((report.imageUrls && report.imageUrls.length > 0) || report.imageUrl) && (
                  <div className="grid grid-cols-3 gap-1.5 py-1">
                    {report.imageUrls && report.imageUrls.length > 0 ? (
                      report.imageUrls.map((url, i) => (
                        <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          <img 
                            src={url} 
                            alt="Báo cáo" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 col-span-1">
                        <img 
                          src={report.imageUrl} 
                          alt="Báo cáo" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Details list info */}
                <div className="text-[11px] text-slate-700 space-y-2 leading-relaxed">
                  <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-100">
                    <div className="flex items-center gap-1 font-bold text-[10px] text-slate-500 uppercase">
                      {getCategoryIcon(report.category)}
                      <span translate="no" className="notranslate">{report.category}</span>
                    </div>
                    {/* Read-only rating stars for scroll screenshot */}
                    {(() => {
                      const stats = getReportRatingsStats(report);
                      const eligible = isEligibleEvaluator(currentUser);
                      return stats.count > 0 ? (
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          {renderSummaryStars(stats.average, eligible)}
                          <span className="text-[10px] text-slate-600 font-bold font-sans ml-0.5">{stats.average}</span>
                          <span className="text-[9px] text-slate-400 font-medium font-sans">({stats.count})</span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  <div className={`font-black text-slate-900 ${contentFontSizeClass}`}>
                    <span translate="no" className="notranslate">{(report.content || "").toUpperCase()}</span>
                  </div>

                  {report.notes && (
                    <div className="p-2 bg-slate-50/90 rounded border-l-2 border-slate-400 text-[10.5px] italic text-slate-800 font-medium">
                      <span translate="no" className="notranslate">Ghi chú: {report.notes}</span>
                    </div>
                  )}

                  {/* Manager Directives list rendered clean */}
                  {report.directives && report.directives.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="text-[9px] text-amber-800 font-extrabold uppercase flex items-center gap-1">
                        <span>🛡️</span>
                        <span translate="no" className="notranslate">Chỉ đạo từ Ban kiểm soát:</span>
                      </div>
                      {report.directives.map((dir) => {
                        const isExpanded = !!expandedDirectiveIdsList[dir.id];
                        if (!isExpanded) {
                          return (
                            <div 
                              key={dir.id}
                              data-directive-container-list="true"
                              onClick={() => setExpandedDirectiveIdsList(prev => ({ ...prev, [dir.id]: true }))}
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

                        return (
                          <div key={dir.id} data-directive-container-list="true" className="p-2 bg-amber-50/70 border border-amber-100 rounded">
                            <div className="flex justify-between text-[8px] text-slate-400 font-bold mb-1 border-b border-amber-200/40 pb-0.5 select-none">
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
                                    setExpandedDirectiveIdsList(prev => ({ ...prev, [dir.id]: false }));
                                  }}
                                  className="text-[8px] text-amber-800 hover:text-amber-950 bg-amber-100 px-1 py-0.1 rounded border border-amber-200 font-sans cursor-pointer active:scale-95 transition-all"
                                >
                                  <T>Thu gọn</T>
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] text-amber-950 font-medium mb-1.5">
                              <span translate="no" className="notranslate">{dir.text}</span>
                            </p>

                            {/* Receipts */}
                            {acknowledgesList.length > 0 && (
                              <div className="mt-1 border-t border-amber-200/40 pt-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[8px] text-slate-400 font-bold">Tiếp nhận chỉ đạo:</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAckDetailsList(prev => ({ ...prev, [dir.id]: !prev[dir.id] }))}
                                    className="px-1.5 py-0.2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[8px] font-sans font-bold rounded flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <span>🤝</span>
                                    <span>{acknowledgesList.length} tiếp nhận</span>
                                  </button>
                                </div>

                                {showAckDetailsList[dir.id] && (
                                  <div className="mt-1 p-1 bg-white border border-emerald-200/50 rounded text-[8px] text-slate-700 space-y-0.5 max-h-16 overflow-y-auto">
                                    {acknowledgesList.map((ack, aIdx) => (
                                      <div key={aIdx} className="flex justify-between items-center gap-1">
                                        <span className="font-semibold text-slate-800 truncate"><T>{ack.by}</T></span>
                                        <span className="text-slate-400 shrink-0 font-mono text-[7px]">{ack.at}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Resolutions/Kết quả xử lý chi tiết rendered clean */}
                  {report.resolutions && report.resolutions.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] text-indigo-800 font-extrabold uppercase flex items-center gap-1.5 flex-wrap">
                        <span>✅</span>
                        <span translate="no" className="notranslate">KẾT QUẢ XỬ LÝ CHI TIẾT (BP/ĐV PHẢN HỒI):</span>
                      </div>
                      {report.resolutions.map((res) => (
                        <div key={res.id} className="p-2 bg-slate-50 border border-slate-150 rounded">
                          <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-500 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-indigo-800 font-extrabold">
                                <span translate="no" className="notranslate">{res.departmentName}</span>
                              </span>
                              {res.badges && res.badges.length > 0 && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {res.badges.map((badge, bIdx) => {
                                    const icon = badge.id === "BAC_SI_MAY_MOC" ? "🦾" :
                                                 badge.id === "CHOT_CHAN_5WHY" ? "🔍" :
                                                 badge.id === "HO_VE_DAY_CHUYEN" ? "🛡️" :
                                                 badge.id === "CHIEN_BINH_PHAN_UNG_NHANH" ? "⚡" :
                                                 badge.id === "BAC_THAY_DU_DOAN" ? "🔮" :
                                                 badge.id === "CANH_BAO_KIP_THOI" ? "🚨" :
                                                 badge.id === "CON_MAT_TINH_TUONG" ? "🔍" :
                                                 badge.id === "CHOT_CHAN_RUI_RO" ? "🛡️" :
                                                 badge.id === "THONG_TIN_CHUAN_MUC" ? "📊" : "🏅";
                                    return (
                                      <span
                                        key={bIdx}
                                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 border border-amber-300 text-[10px] shadow-3xs"
                                        title={`Huy hiệu: ${badge.name} (Bởi ${badge.giverName})`}
                                      >
                                        <span>{icon}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span translate="no" className={`notranslate text-[8.5px] font-extrabold px-1 py-0.2 rounded border uppercase ${
                                res.status === "Đã xử lý"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {res.status}
                              </span>
                              <span translate="no" className="notranslate">{res.updatedAt}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-800 font-medium whitespace-pre-wrap">
                            <span translate="no" className="notranslate">{res.resultText}</span>
                          </p>
                          <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between select-none">
                            <span translate="no" className="notranslate">Đại diện: {res.handlerName}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span translate="no" className="notranslate">{res.updatedAt}</span>
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded border text-[8px] font-sans font-extrabold bg-slate-50 text-slate-500 border-slate-200">
                                <Heart className={`w-2.5 h-2.5 ${res.likedBy?.length ? "fill-rose-500 stroke-rose-500 text-rose-500" : ""}`} />
                                <span>{res.likedBy?.length || 0}</span>
                              </span>
                              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded border text-[8px] font-sans font-extrabold bg-slate-50 text-slate-500 border-slate-200">
                                <Award className="w-2.5 h-2.5 text-amber-500" />
                                <span>{res.badges?.length || 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Replications/Yêu cầu nhân bản rendered clean */}
                  {report.replications && report.replications.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="text-[9px] text-emerald-800 font-extrabold uppercase flex items-center gap-1">
                        <span>✨</span>
                        <span translate="no" className="notranslate">YÊU CẦU NHÂN BẢN (REPLICATION):</span>
                      </div>
                      {report.replications.map((rep) => (
                        <div key={rep.id} className="p-2 bg-emerald-50/40 border border-emerald-100 rounded text-[9.5px]">
                          <div className="flex justify-between text-[8px] text-slate-400 font-bold mb-1">
                            <span className="text-emerald-800 font-extrabold">
                              <span translate="no" className="notranslate">{rep.factoryName} - {rep.departmentName}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span translate="no" className={`notranslate text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase ${
                                rep.status === "Đã hoàn thành"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rep.status === "Đang triển khai"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {rep.status}
                              </span>
                              <span translate="no" className="notranslate">{rep.updatedAt}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-700 mt-1">
                            <div>
                              <span className="font-extrabold text-slate-500 uppercase text-[8px]"><T>Hiện trạng:</T> </span>
                              <span translate="no" className="notranslate font-medium">{rep.currentState}</span>
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-500 uppercase text-[8px]"><T>Hỗ trợ cần thiết:</T> </span>
                              <span translate="no" className="notranslate font-medium">{rep.supportRequired}</span>
                            </div>
                          </div>
                          {rep.notes && (
                            <div className="mt-1 text-[8.5px] italic text-slate-500">
                              <span translate="no" className="notranslate">Ghi chú nhân bản: {rep.notes}</span>
                            </div>
                          )}
                          <div className="text-[8px] text-slate-400 mt-1.5 text-right select-none">
                            <span translate="no" className="notranslate">Người thực hiện: {rep.registrantName} {rep.phoneNumber ? `(SĐT: ${rep.phoneNumber})` : ""} | Hạn: {rep.targetDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
