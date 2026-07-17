import React, { useState, useRef, useEffect } from "react";
import { Star, ChevronDown, ChevronUp, Award, Check } from "lucide-react";
import { QualityReport, QualityReportRating, User, UserRole } from "../types";
import { T } from "./TranslateText";

interface MobileReportRatingSectionProps {
  report: QualityReport;
  currentUser: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export const isEligibleEvaluator = (user: User | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  if (user.role === UserRole.REVIEWER) return true;
  
  const dept = (user.department || "").toLowerCase();
  const name = (user.fullName || "").toLowerCase();
  const title = (user.role || "").toLowerCase();
  
  return (
    dept.includes("trưởng") ||
    dept.includes("phó") ||
    dept.includes("giám đốc") ||
    dept.includes("gđ") ||
    dept.includes("tgđ") ||
    dept.includes("ban quản lý") ||
    name.includes("trưởng") ||
    name.includes("giám đốc") ||
    title.includes("trưởng") ||
    title.includes("giám đốc") ||
    title.includes("gđ") ||
    title.includes("tgđ") ||
    user.canSpeciallyEditDelete === true
  );
};

export const getReportRatingsStats = (report: QualityReport) => {
  const ratings = report.ratings || [];
  if (ratings.length === 0) {
    return {
      average: 0,
      imagesAverage: 0,
      infoAverage: 0,
      timelinessAverage: 0,
      count: 0
    };
  }
  
  let totalImages = 0;
  let totalInfo = 0;
  let totalTimeliness = 0;
  let totalOverall = 0;
  
  ratings.forEach((r) => {
    totalImages += r.imagesRating;
    totalInfo += r.infoRating;
    totalTimeliness += r.timelinessRating;
    totalOverall += (r.imagesRating + r.infoRating + r.timelinessRating) / 3;
  });
  
  const count = ratings.length;
  return {
    average: parseFloat((totalOverall / count).toFixed(1)),
    imagesAverage: parseFloat((totalImages / count).toFixed(1)),
    infoAverage: parseFloat((totalInfo / count).toFixed(1)),
    timelinessAverage: parseFloat((totalTimeliness / count).toFixed(1)),
    count
  };
};

export function renderSummaryStars(val: number, isEligible: boolean) {
  const rounded = Math.round(val * 2) / 2; // round to nearest 0.5
  return (
    <div className="flex items-center gap-0.5 select-none shrink-0">
      {Array.from({ length: 5 }, (_, i) => {
        const starNum = i + 1;
        const isFull = starNum <= Math.floor(rounded);
        const isHalf = !isFull && starNum === Math.ceil(rounded) && rounded % 1 !== 0;
        
        if (isFull) {
          return <Star key={starNum} className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />;
        } else if (isHalf) {
          return (
            <div key={starNum} className="relative w-3.5 h-3.5 shrink-0">
              <Star className="w-3.5 h-3.5 text-slate-300 fill-transparent absolute top-0 left-0" />
              <div className="absolute top-0 left-0 overflow-hidden w-[50%] h-full">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 max-w-none" />
              </div>
            </div>
          );
        } else {
          return <Star key={starNum} className={`w-3.5 h-3.5 ${isEligible ? "text-slate-300 fill-transparent" : "text-slate-200 fill-transparent"} shrink-0`} />;
        }
      })}
    </div>
  );
}

export function MobileReportRatingSectionTrigger({
  report,
  currentUser,
  isExpanded,
  setIsExpanded
}: MobileReportRatingSectionProps) {
  const stats = getReportRatingsStats(report);
  const eligible = isEligibleEvaluator(currentUser);

  return (
    <button
      type="button"
      onClick={() => setIsExpanded(!isExpanded)}
      className="flex items-center gap-1 hover:bg-slate-50 active:bg-slate-100 rounded-lg py-1 px-1.5 transition-colors border border-transparent hover:border-slate-100 select-none cursor-pointer shrink-0"
    >
      {stats.count > 0 ? (
        <>
          {renderSummaryStars(stats.average, eligible)}
          <T className="text-[10px] text-slate-600 font-black font-sans ml-0.5 leading-none">{stats.average}</T>
          <T className="text-[8.5px] text-slate-400 font-bold font-sans leading-none">({stats.count})</T>
        </>
      ) : (
        <>
          {renderSummaryStars(0, eligible)}
          <T className="text-[9px] text-slate-500 font-extrabold font-sans hover:text-amber-600 transition-colors ml-0.5 leading-none">
            {eligible ? "Đánh giá" : "Chưa đánh giá"}
          </T>
        </>
      )}
      {isExpanded ? (
        <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
      ) : (
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      )}
    </button>
  );
}

export function MobileReportRatingSectionContent({
  report,
  currentUser,
  onUpdateReport,
  isExpanded,
  setIsExpanded
}: {
  report: QualityReport;
  currentUser: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  isExpanded: boolean;
  setIsExpanded?: (expanded: boolean) => void;
}) {
  const eligible = isEligibleEvaluator(currentUser);
  if (!isExpanded) return null;

  const existingRating = (report.ratings || []).find(r => r.evaluatorId === currentUser?.id);

  // Ratings local state
  const [imagesVal, setImagesVal] = useState(existingRating?.imagesRating || 5);
  const [infoVal, setInfoVal] = useState(existingRating?.infoRating || 5);
  const [timelinessVal, setTimelinessVal] = useState(existingRating?.timelinessRating || 5);
  const [commentVal, setCommentVal] = useState(existingRating?.comment || "");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveRating = () => {
    if (!currentUser || !eligible || !onUpdateReport) return;

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    const newRating: QualityReportRating = {
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.fullName,
      evaluatorRole: currentUser.role === UserRole.ADMIN ? "Chủ Admin" : (currentUser.department || "Quản lý"),
      imagesRating: imagesVal,
      infoRating: infoVal,
      timelinessRating: timelinessVal,
      timestamp: dateStr,
      comment: commentVal
    };

    const currentRatings = report.ratings || [];
    const otherRatings = currentRatings.filter(r => r.evaluatorId !== currentUser.id);
    const updatedRatings = [...otherRatings, newRating];

    const overallScore = parseFloat(((imagesVal + infoVal + timelinessVal) / 3).toFixed(1));
    const roleLabel = currentUser.role === UserRole.ADMIN ? "Chủ Admin" : "Quản lý";
    const commentSuffix = commentVal ? ` - Ghi chú: "${commentVal}"` : "";
    const logMsg = `Đánh giá bản tin bởi ${currentUser.fullName} (${roleLabel}): ${overallScore}/5 sao (Hình ảnh: ${imagesVal}, Thông tin: ${infoVal}, Kịp thời: ${timelinessVal})${commentSuffix}`;

    const logs = report.updateLogs ? [...report.updateLogs] : [];
    logs.push(logMsg);

    const updatedReport: QualityReport = {
      ...report,
      ratings: updatedRatings,
      updateLogs: logs
    };

    onUpdateReport(updatedReport);
    setSuccessMsg("Đã lưu đánh giá chất lượng!");
    setTimeout(() => {
      setSuccessMsg(null);
      if (setIsExpanded) {
        setIsExpanded(false);
      }
    }, 1000);
  };

  const renderStarSelector = (
    label: string,
    description: string,
    value: number,
    setValue: (val: number) => void,
    readOnly: boolean
  ) => {
    return (
      <div className="bg-white p-1.5 rounded-lg border border-slate-100 flex flex-col gap-0.5 shadow-3xs animate-fadeIn">
        <div>
          <T className="text-[9.5px] font-black text-slate-700 block leading-tight">{label}</T>
          <T className="text-[8.5px] text-slate-400 block font-medium mt-0.5 leading-tight">{description}</T>
        </div>
        <div className="flex items-center gap-1 mt-0.5 select-none">
          {Array.from({ length: 5 }, (_, i) => {
            const starNum = i + 1;
            const isFilled = starNum <= value;
            return (
              <button
                key={starNum}
                type="button"
                disabled={readOnly}
                onClick={() => setValue(starNum)}
                className={`transition-all duration-150 p-0.5 ${readOnly ? "cursor-default" : "hover:scale-125 active:scale-90"}`}
              >
                <Star
                  className={`w-5 h-5 stroke-[1.5] ${
                    isFilled
                      ? "text-amber-500 fill-amber-500 animate-pulse"
                      : "text-slate-300 fill-transparent"
                  }`}
                />
              </button>
            );
          })}
          <T className="text-[10px] font-bold text-slate-600 font-sans ml-1">{value} / 5</T>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-1.5 p-2 bg-slate-50/95 rounded-xl border border-slate-150 space-y-1.5 animate-slideDown select-text block">
      <div className="flex justify-between items-center pb-1 border-b border-slate-200/60 select-none">
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-600 shrink-0" />
          <T className="font-black text-[9.5px] text-slate-700 tracking-wide">ĐÁNH GIÁ CHẤT LƯỢNG BẢN TIN</T>
        </div>
        {eligible && (
          <T className="text-[7.5px] bg-amber-500/10 text-amber-700 font-extrabold px-1 py-0.5 rounded-full select-none">
            Bảng quản lý
          </T>
        )}
      </div>

      {/* Criteria Checklists */}
      <div className="grid grid-cols-1 gap-1">
        {renderStarSelector(
          "1. HÌNH ẢNH SỰ VIỆC",
          "Hình ảnh rõ nét, đúng trọng tâm lỗi hoặc điểm sáng chất lượng không?",
          imagesVal,
          setImagesVal,
          !eligible
        )}
        {renderStarSelector(
          "2. NỘI DUNG THÔNG TIN",
          "Thông tin đầy đủ, mô tả ngắn gọn, súc tích, dễ hiểu không?",
          infoVal,
          setInfoVal,
          !eligible
        )}
        {renderStarSelector(
          "3. TÍNH KỊP THỜI (TIME)",
          "Phát hiện và đăng tin có ngay lúc sự việc xảy ra không?",
          timelinessVal,
          setTimelinessVal,
          !eligible
        )}
      </div>

      {/* Note input for manager */}
      {eligible && (
        <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-3xs flex flex-col gap-0.5">
          <T className="text-[9px] font-black text-slate-700 block leading-tight">Ý KIẾN / GHI CHÚ ĐÓNG GÓP</T>
          <input
            type="text"
            value={commentVal}
            onChange={(e) => setCommentVal(e.target.value)}
            placeholder="Nhập ghi chú hoặc ý kiến đóng góp cho tác giả..."
            className="w-full text-[9px] p-1 border border-slate-200 rounded focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>
      )}

      {/* Eligible user actions */}
      {eligible && (
        <div className="pt-1 border-t border-slate-200/50 flex items-center justify-between gap-1.5 select-none">
          <div className="flex-1">
            {successMsg ? (
              <T className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5 animate-pulse">
                <Check className="w-3 h-3 stroke-[2.5]" />
                {successMsg}
              </T>
            ) : (
              <T className="text-[8px] text-slate-400 font-medium">
                {existingRating ? "Bạn đã đánh giá. Có thể chỉnh sửa lại." : "Vui lòng chọn sao và bấm Lưu."}
              </T>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveRating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black px-2.5 py-1 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer"
          >
            <T>LƯU ĐÁNH GIÁ</T>
          </button>
        </div>
      )}

      {/* List of other managers' ratings */}
      {report.ratings && report.ratings.length > 0 && (
        <div className="pt-1.5 border-t border-slate-200/50 space-y-1">
          <T className="text-[8.5px] text-slate-400 font-extrabold block uppercase tracking-wider select-none">
            Chi tiết đánh giá ({report.ratings.length}):
          </T>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {report.ratings.map((rat, idx) => {
              const ratingAvg = parseFloat(((rat.imagesRating + rat.infoRating + rat.timelinessRating) / 3).toFixed(1));
              return (
                <div
                  key={idx}
                  className="bg-white p-1 rounded border border-slate-100 flex flex-col gap-0.5 text-[9px] leading-tight shadow-3xs"
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-700">
                      👤 {rat.evaluatorName} <span className="text-slate-400 font-medium text-[8px]">({rat.evaluatorRole})</span>
                    </span>
                    <span className="text-amber-500 font-sans">{ratingAvg} ★</span>
                  </div>
                  <div className="text-slate-500 flex justify-between items-center text-[8px]">
                    <span>
                      Ảnh: {rat.imagesRating} • Tin: {rat.infoRating} • Giờ: {rat.timelinessRating}
                    </span>
                    <span className="text-slate-400">{rat.timestamp}</span>
                  </div>
                  {rat.comment && (
                    <div className="text-[8px] text-indigo-600 bg-indigo-50/40 p-1 rounded mt-0.5 border border-indigo-100/20 font-medium">
                      Ghi chú: {rat.comment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileReportRatingContainer({
  report,
  currentUser,
  onUpdateReport,
  categoryIcon,
  theme
}: {
  report: QualityReport;
  currentUser: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  categoryIcon: React.ReactNode;
  theme: any;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isExpanded]);

  return (
    <div ref={containerRef} className="pb-2 border-b border-slate-100 block w-full select-none">
      <div className="flex items-center justify-between w-full">
        <div className={`flex items-center font-bold text-xs uppercase select-none ${theme.text}`}>
          {categoryIcon}
          <T>{report.category}</T>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Rating Trigger (aligned right) */}
          <MobileReportRatingSectionTrigger
            report={report}
            currentUser={currentUser}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />

          {/* Awarded Badges List (Separated by | border) */}
          {report.badges && report.badges.length > 0 && (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-300 ml-1.5 shrink-0">
              {report.badges.map((badge, idx) => {
                const icon = badge.id === "CANH_BAO_KIP_THOI" ? "🚨" :
                             badge.id === "CON_MAT_TINH_TUONG" ? "🔍" :
                             badge.id === "CHOT_CHAN_RUI_RO" ? "🛡️" :
                             badge.id === "THONG_TIN_CHUAN_MUC" ? "📊" :
                             badge.id === "DIEM_SANG_TIEU_BIEU" ? "🌟" :
                             badge.id === "CO_HOI_VANG" ? "🤝" :
                             badge.id === "SANG_KIEN_LAN_TOA" ? "🚀" :
                             badge.id === "VUOT_TROI_NANG_SUAT" ? "💎" :
                             badge.id === "CHAT_LUONG_VUOT_TROI" ? "🛡️" :
                             badge.id === "MOI_TRUONG_5_SAO" ? "✨" :
                             badge.id === "THONG_TIN_RO_RANG" ? "📜" :
                             badge.id === "VAN_HANH_BEN_BI" ? "🦾" :
                             badge.id === "BAO_CHUNG_HE_THONG" ? "🔄" : "🏅";
                return (
                  <span 
                    key={idx} 
                    className="text-[16.5px] leading-none filter drop-shadow-3xs flex items-center justify-center" 
                    title={`${badge.name} - Trao bởi: ${badge.giverName} (${badge.timestamp})`}
                  >
                    {icon}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hidden Checklist Section (Checklist ẩn) rendered full-width right below */}
      <MobileReportRatingSectionContent
        report={report}
        currentUser={currentUser}
        onUpdateReport={onUpdateReport}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
      />
    </div>
  );
}
