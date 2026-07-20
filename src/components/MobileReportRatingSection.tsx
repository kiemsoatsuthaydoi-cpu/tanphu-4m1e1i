import React, { useState, useRef, useEffect } from "react";
import { Star, ChevronDown, ChevronUp, Award, Check } from "lucide-react";
import { QualityReport, QualityReportRating, User, UserRole, getBadgeScore } from "../types";
import { T } from "./TranslateText";
import { resolveBadgeGiverInfo } from "../utils/userResolver";

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

export const BADGE_PRAISE_MAP: Record<string, { description: string; praises: string[]; icon: string }> = {
  CANH_BAO_KIP_THOI: {
    icon: "🚨",
    description: "Trao cho bản tin KPH được đăng ngay lập tức khi sự cố vừa xảy ra, giúp ngăn chặn hậu quả dây chuyền.",
    praises: [
      "Sự nhạy bén và hành động tức thì của bạn đã xuất sắc bảo vệ sự an toàn cho dây chuyền sản xuất!",
      "Tuyệt vời! Bạn là tấm khiên vững vàng giúp nhà máy phát hiện sớm và dập tắt rủi ro tức thì!",
      "Tinh thần chủ động cao độ của bạn đã giúp ngăn chặn kịp thời các sự cố dây chuyền nghiêm trọng!"
    ]
  },
  CON_MAT_TINH_TUONG: {
    icon: "🔍",
    description: "Trao cho bản tin mô tả những lỗi cực nhỏ, khó thấy bằng mắt thường hoặc những lỗi tiềm ẩn sâu trong quy trình.",
    praises: [
      "Sự tỉ mỉ và đôi mắt sắc bén của bạn đã tìm ra điểm bất thường cực nhỏ mà người khác dễ bỏ qua!",
      "Thật nể phục óc quan sát tinh tường của bạn! Sự kỹ lưỡng này giúp duy trì chất lượng vượt trội.",
      "Sự cẩn trọng tuyệt vời! Bạn đã giúp hệ thống ngăn ngừa lỗi tiềm ẩn ngay từ những khâu nhỏ nhất!"
    ]
  },
  CHOT_CHAN_RUI_RO: {
    icon: "🛡️",
    description: "Trao cho bản tin KPH về những lỗi nghiêm trọng có thể gây hỏng lô hàng lớn hoặc ảnh hưởng trực tiếp đến an toàn.",
    praises: [
      "Lá chắn vững chắc bảo vệ chất lượng! Sự can thiệp quả cảm của bạn đã cứu nguy cho cả lô hàng lớn!",
      "Bản lĩnh tuyệt vời! Bạn đã xuất sắc chặn đứng lỗi nghiêm trọng trước khi nó gây ra thiệt hại!",
      "Một chốt chặn chất lượng hoàn hảo! Sự cẩn mật của bạn đem lại sự an tâm tuyệt đối cho toàn nhà máy!"
    ]
  },
  THONG_TIN_CHUAN_MUC: {
    icon: "📊",
    description: "Trao cho bản tin có mô tả 4M1E1I cực kỳ chi tiết, hình ảnh rõ nét, thông tin chính xác, không cần hỏi lại.",
    praises: [
      "Mô tả 4M1E1I vô cùng rõ ràng và chuẩn mực! Đây là bản tin kiểu mẫu cho toàn bộ hệ thống!",
      "Hình ảnh trực quan, thông tin cực kỳ chi tiết! Bản tin chất lượng cao của bạn giúp tiết kiệm thời gian phối hợp!",
      "Khen ngợi sự ghi nhận chuẩn mực, đầy đủ và khoa học! Thông tin của bạn có giá trị thực tiễn rất cao!"
    ]
  },
  DIEM_SANG_TIEU_BIEU: {
    icon: "🌟",
    description: "Huy hiệu mặc định cho các bản tin DSA có giá trị học hỏi cao cho toàn bộ nhà máy.",
    praises: [
      "Sáng kiến/thành tích xuất sắc! Bạn là điểm sáng tiêu biểu truyền cảm hứng mạnh mẽ cho đồng nghiệp!",
      "Thành quả tuyệt vời đóng góp cho nhà máy! Đây là tấm gương cải tiến mẫu mực để nhân rộng rộng khắp!",
      "Chúc mừng nỗ lực xuất sắc vượt bậc của bạn! Sự đóng góp này mang giá trị học hỏi rất cao!"
    ]
  },
  CO_HOI_VANG: {
    icon: "🤝",
    description: "Trao cho bản tin về tiếp khách, audit, hoặc các thông tin có tiềm năng mang lại hợp đồng/mối quan hệ kinh doanh mới (Dành cho TH WATER).",
    praises: [
      "Nhạy bén mở ra cơ hội hợp tác và nâng tầm dịch vụ! Chúc mừng nỗ lực kết nối vô giá của bạn!",
      "Nỗ lực tối ưu hóa dịch vụ tuyệt vời! Bạn đã giúp mang lại giá trị gia tăng lớn cho các bên liên quan!",
      "Tinh thần hướng tới khách hàng xuất sắc! Đóng góp của bạn đã nâng tầm uy tín và thương hiệu!"
    ]
  },
  SANG_KIEN_LAN_TOA: {
    icon: "🚀",
    description: "Trao cho bản tin DSA mà sau khi đăng, có nhiều đơn vị khác vào nút 'Đăng ký nhân rộng'.",
    praises: [
      "Ý tưởng cải tiến có sức hút mạnh mẽ! Sáng kiến của bạn đang lan tỏa năng lượng tích cực khắp nơi!",
      "Tuyệt vời! Ý tưởng đột phá của bạn đã thúc đẩy tinh thần cải tiến và nhân rộng trên toàn hệ thống!",
      "Sức lan tỏa phi thường! Sáng kiến của bạn là động lực thúc đẩy mọi người cùng chung tay cải tiến!"
    ]
  },
  VUOT_TROI_NANG_SUAT: {
    icon: "💎",
    description: "Trao cho các bản tin ghi nhận việc phá kỷ lục sản xuất, rút ngắn thời gian làm việc mà vẫn đảm bảo chất lượng.",
    praises: [
      "Thành tích phá kỷ lục năng suất đáng tự hào! Nỗ lực phi thường của bạn mang lại hiệu suất vượt trội!",
      "Rút ngắn thời gian mà vẫn đảm bảo chất lượng! Bạn đã thiết lập một tiêu chuẩn năng suất mới!",
      "Hiệu suất đỉnh cao! Khen ngợi tinh thần tối ưu hóa tuyệt vời giúp tăng tốc vận hành mạnh mẽ!"
    ]
  },
  CHAT_LUONG_VUOT_TROI: {
    icon: "🛡️",
    description: "Dành cho Cải thiện chất lượng, tượng trưng cho việc bảo vệ uy tín chất lượng của Tân Phú/DNP.",
    praises: [
      "Cam kết chất lượng tuyệt đối của bạn là bệ phóng vững chắc giữ gìn uy tín thương hiệu Tân Phú/DNP!",
      "Tiêu chuẩn vàng trong vận hành! Sự tận tâm của bạn giúp duy trì chất lượng vượt trội bền vững!",
      "Sự cẩn trọng tuyệt vời giúp nâng tầm sản phẩm của chúng ta vượt trên sự mong đợi của khách hàng!"
    ]
  },
  MOI_TRUONG_5_SAO: {
    icon: "✨",
    description: "Dành cho Cải tiến môi trường, tượng trưng cho sự sạch sẽ, gọn gàng, an toàn.",
    praises: [
      "Môi trường làm việc sạch sẽ, ngăn nắp và an toàn hơn nhờ sự đóng góp tích cực từng ngày của bạn!",
      "Hành động xanh vì một không gian làm việc lý tưởng! Bạn là tấm gương sáng về chuẩn mực 5S!",
      "Cải tiến không gian an toàn, gọn gàng vượt trội! Chúc mừng góc làm việc kiểu mẫu của bạn!"
    ]
  },
  THONG_TIN_RO_RANG: {
    icon: "📜",
    description: "Dành cho Chuẩn hóa thông tin đầu vào/ra.",
    praises: [
      "Sự rõ ràng và chuẩn hóa tuyệt vời! Đóng góp của bạn giúp luồng thông tin vận hành luôn thông suốt!",
      "Thông tin rành mạch, có tính hệ thống cao giúp việc phối hợp giữa các bộ phận trở nên dễ dàng!",
      "Sự tỉ mỉ trong chuẩn hóa dữ liệu của bạn đã giúp toàn đội ngũ ra quyết định nhanh chóng và chính xác!"
    ]
  },
  VAN_HANH_BEN_BI: {
    icon: "🦾",
    description: "Dành cho Ổn định chất lượng máy móc.",
    praises: [
      "Sự chăm sóc chu đáo giữ cho máy móc luôn ổn định bền bỉ! Bạn là xương sống của sự vận hành!",
      "Vận hành êm ái, trơn tru tuyệt đối! Cảm ơn sự tận tụy không ngừng nghỉ của bạn!",
      "Giữ máy ổn định, duy trì nhịp sản xuất bền vững! Đóng góp của bạn vô cùng đáng trân trọng!"
    ]
  },
  BAO_CHUNG_HE_THONG: {
    icon: "🔄",
    description: "Dành cho Duy trì và cải tiến hệ thống, tượng trưng cho sự cải tiến liên tục không ngừng nghỉ.",
    praises: [
      "Tinh thần cải tiến liên tục không ngừng nghỉ! Bạn là nhân tố cốt lõi thúc đẩy hệ thống hoàn thiện!",
      "Bảo chứng vững chắc cho sự phát triển dài lâu! Nỗ lực tối ưu hóa của bạn thật đáng khen ngợi!",
      "Kiên trì cải tiến bền bỉ mỗi ngày, mang lại sự bền vững và chuẩn mực cho toàn hệ thống!"
    ]
  }
};

export function MobileReportRatingContainer({
  report,
  currentUser,
  onUpdateReport,
  categoryIcon,
  theme,
  users
}: {
  report: QualityReport;
  currentUser: User | null;
  onUpdateReport?: (report: QualityReport) => void;
  categoryIcon: React.ReactNode;
  theme: any;
  users?: User[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBadgesMenuOpen, setIsBadgesMenuOpen] = useState(false);
  const [selectedInfoBadge, setSelectedInfoBadge] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isBadgesMenuOpen) return;
    const handleBadgeOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (badgeMenuRef.current && !badgeMenuRef.current.contains(target)) {
        setIsBadgesMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleBadgeOutsideClick);
    document.addEventListener("touchstart", handleBadgeOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleBadgeOutsideClick);
      document.removeEventListener("touchstart", handleBadgeOutsideClick);
    };
  }, [isBadgesMenuOpen]);

  return (
    <div ref={containerRef} className="pb-2 border-b border-slate-100 block w-full select-none">
      <div className="flex items-center justify-between w-full">
        <div className={`flex items-center font-bold text-xs uppercase select-none ${theme.text}`}>
          {categoryIcon}
          <T>{report.category}</T>
        </div>

        <div className="flex items-center gap-1 shrink-0 relative">
          {/* Rating Trigger (aligned right) */}
          <MobileReportRatingSectionTrigger
            report={report}
            currentUser={currentUser}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />

          {/* Awarded Badges List (Hộp Huy Hiệu) */}
          {report.badges && report.badges.length > 0 && (
            <div ref={badgeMenuRef} className="pl-1.5 border-l border-slate-300 ml-1.5 shrink-0 flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBadgesMenuOpen(!isBadgesMenuOpen);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all duration-200 cursor-pointer active:scale-95 shadow-3xs"
                title={`Bản tin này nhận được ${report.badges.length} huy hiệu. Nhấn để xem chi tiết!`}
              >
                <span className="text-[14px]">🛡️</span>
                <span className="text-[9px] font-black text-amber-700 bg-amber-200/60 px-1 rounded-full min-w-[12px] text-center">
                  <span translate="no" className="notranslate"><T>{report.badges.length}</T></span>
                </span>
              </button>

              {/* Badges Dropdown Popover */}
              {isBadgesMenuOpen && (() => {
                const getLocalBadgeScore = (b: any) => {
                  const resolvedGiver = resolveBadgeGiverInfo(users, b);
                  const pos = resolvedGiver.position || (b.giverName === "Lê Nhật Trường" ? "Trưởng Phòng Quản Lý Chất Lượng" : b.giverRole);
                  return getBadgeScore(pos);
                };
                const totalScore = report.badges.reduce((acc, b) => acc + getLocalBadgeScore(b), 0);
                return (
                  <div className="absolute right-0 top-7 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-amber-100 p-2 z-[50] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="text-[8.5px] uppercase font-black text-amber-800 tracking-wider pb-1.5 border-b border-amber-50 px-1.5 flex items-center justify-between">
                      <span>🏆 <T>HUY HIỆU ĐÃ NHẬN</T></span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBadgesMenuOpen(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 font-bold px-1 text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
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
                        const resolvedGiver = resolveBadgeGiverInfo(users, badge);
                        const badgeScore = getLocalBadgeScore(badge);
                        const displayPosition = resolvedGiver.position || (resolvedGiver.fullName === "Lê Nhật Trường" ? "Trưởng Phòng" : resolvedGiver.role);
                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsBadgesMenuOpen(false);
                              const badgeMapItem = BADGE_PRAISE_MAP[badge.id] || { praises: ["Xin nhiệt liệt biểu dương đóng góp xuất sắc của bạn!"] };
                              const praisesList = badgeMapItem.praises;
                              const selectedPraise = praisesList[Math.floor(Math.random() * praisesList.length)];
                              setSelectedInfoBadge({ ...badge, icon, praise: selectedPraise, giverName: resolvedGiver.fullName, giverPosition: displayPosition });
                            }}
                            className="flex items-center gap-2 p-1.5 bg-amber-50/20 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 cursor-pointer transition-all duration-150 text-left"
                          >
                            <span className="text-[18px] shrink-0 filter drop-shadow-3xs">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-extrabold text-slate-800 block truncate notranslate" translate="no">
                                <T>{badge.name}</T>
                              </span>
                              <span className="text-[8px] text-slate-500 block truncate notranslate" translate="no">
                                <T>Bởi:</T> {resolvedGiver.fullName} {displayPosition ? <span className="text-amber-700 font-medium">({displayPosition})</span> : ""}
                              </span>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                +{badgeScore}đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Total point footer */}
                    <div className="pt-1.5 border-t border-amber-100 px-1.5 flex items-center justify-between text-[9px] font-bold text-amber-900 bg-amber-50/40 rounded-b-lg">
                      <span><T>TỔNG ĐIỂM:</T></span>
                      <span className="text-[11px] font-black text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded-full">
                        {totalScore}đ
                      </span>
                    </div>
                  </div>
                );
              })()}
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

      {/* Elegant Praise Modal Dialog */}
      {selectedInfoBadge && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] select-none pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInfoBadge(null);
          }}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-[224px] overflow-hidden shadow-2xl border border-amber-100 flex flex-col relative pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Thân thiện, nhỏ gọn với nút đóng X chắc chắn */}
            <div className="absolute top-2 right-2 z-[10000]">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInfoBadge(null);
                }}
                className="w-5.5 h-5.5 rounded-full bg-black/15 hover:bg-black/25 text-white font-bold flex items-center justify-center cursor-pointer transition-colors text-[9px] border-none outline-none"
              >
                ✕
              </button>
            </div>

            {/* Header with decorative borders - Thinner design */}
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-2.5 pb-3 text-center text-white relative">
              <div className="text-2xl filter drop-shadow-md mb-1">{selectedInfoBadge.icon}</div>
              <h3 className="text-[8px] font-black tracking-wider uppercase font-sans mb-0.5 text-amber-100">
                <span translate="no" className="notranslate"><T>HUY HIỆU DANH GIÁ</T></span>
              </h3>
              <h2 className="text-[12px] font-extrabold font-sans tracking-wide px-1">
                <span translate="no" className="notranslate"><T>{selectedInfoBadge.name}</T></span>
              </h2>
            </div>

            {/* Content Body */}
            <div className="px-4 pt-5 pb-7 flex flex-col gap-4 text-center text-slate-700 bg-amber-50/10">
              <div className="flex flex-col gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50/50 p-3.5 rounded-md border border-amber-100 shadow-3xs">
                <div className="text-[8.5px] uppercase font-extrabold tracking-wider text-orange-700 font-sans flex items-center justify-center gap-1">
                  <span>🌟</span>
                  <span translate="no" className="notranslate"><T>LỜI BIỂU DƯƠNG</T></span>
                  <span>🌟</span>
                </div>
                <p className="text-[9.5px] text-amber-950 font-bold leading-normal">
                  <span translate="no" className="notranslate">
                    <T>{selectedInfoBadge.praise || "Xin nhiệt liệt biểu dương tinh thần trách nhiệm cao và sự đóng góp xuất sắc của bạn!"}</T>
                  </span>
                </p>
              </div>

              {/* Giver info */}
              <div className="text-[8px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 py-2.5 px-2.5 rounded-md flex flex-col gap-0.5">
                <div>
                  <span translate="no" className="notranslate">
                    <T>Người trao: {selectedInfoBadge.giverName} ({selectedInfoBadge.giverPosition || selectedInfoBadge.giverRole})</T>
                  </span>
                </div>
                <div>
                  <span translate="no" className="notranslate">
                    <T>Thời gian: {selectedInfoBadge.timestamp}</T>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
