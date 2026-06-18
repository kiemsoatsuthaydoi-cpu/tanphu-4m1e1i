import React, { useState, useEffect } from "react";
import { Search, RotateCw, Plus, Users, Cpu, FileText, Settings, Heart, BellOff, Info, ArrowLeft, Camera, Trash2, Edit, Maximize, Minimize } from "lucide-react";
import { QualityReport, Category4M1E1I } from "../types";
import { T } from "./TranslateText";

interface AutoImageSliderProps {
  imageUrls?: string[];
  fallbackUrl: string;
  isAbnormal?: boolean;
}

export function AutoImageSlider({ imageUrls, fallbackUrl, isAbnormal }: AutoImageSliderProps) {
  const list = imageUrls && imageUrls.length > 0 ? imageUrls : [fallbackUrl];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [list]);

  return (
    <div className="relative group bg-slate-900 border-b border-slate-100 flex items-center justify-center overflow-hidden h-44 w-full select-none">
      {list.map((url, i) => (
        <img
          key={url + i}
          src={url}
          alt={`Slide ${i}`}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
            i === index ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 z-0"
          }`}
        />
      ))}
      
      {/* Indicator Dots */}
      {list.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 z-20 bg-black/60 px-2 py-1 rounded-full">
          {list.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === index ? "bg-white scale-110" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {isAbnormal && (
        <div className="absolute top-0 inset-x-0 bg-red-600 bg-opacity-85 text-white py-1px px-3 flex items-center gap-1.5 z-20 py-1">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse block shrink-0" />
          <T className="text-[10px] font-bold block uppercase tracking-wide leading-none select-none">
            PHÁT HIỆN BIẾN ĐỘNG BẤT THƯỜNG
          </T>
        </div>
      )}
    </div>
  );
}

interface MobileFrameProps {
  reports: QualityReport[];
  currentUserId: string;
  onOpenReportForm: () => void;
  onDeleteReport: (id: string) => void;
  onEditReport: (report: QualityReport) => void;
  offlineMode: boolean;
}

export default function MobileFrame({
  reports,
  currentUserId,
  onOpenReportForm,
  onDeleteReport,
  onEditReport,
  offlineMode
}: MobileFrameProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const docEl = document.documentElement as any;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen({ navigationUI: "hide" });
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  // Filter items based on uploader or factory search or description search
  const filteredReports = reports.filter((r) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      r.factory.toLowerCase().includes(s) ||
      r.uploaderName.toLowerCase().includes(s) ||
      r.content.toLowerCase().includes(s) ||
      r.category.toLowerCase().includes(s);

    const matchesCategory = selectedCategory ? r.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Category Icon Resolver
  const getCategoryIcon = (cat: Category4M1E1I) => {
    switch (cat) {
      case "CON NGƯỜI":
        return <Users className="w-4 h-4 mr-2 text-indigo-600" />;
      case "MÁY MÓC":
        return <Cpu className="w-4 h-4 mr-2 text-green-600" />;
      case "NGUYÊN VẬT LIỆU":
        return <Settings className="w-4 h-4 mr-2 text-fuchsia-600" />;
      case "PHƯƠNG PHÁP":
        return <FileText className="w-4 h-4 mr-2 text-amber-600" />;
      case "MÔI TRƯỜNG":
        return <Heart className="w-4 h-4 mr-2 text-teal-600" />;
      case "THÔNG TIN":
        return <Info className="w-4 h-4 mr-2 text-slate-600" />;
    }
  };

  return (
    <div id="mobile-viewport" className="w-full h-[100dvh] max-w-[440px] lg:w-[375px] lg:h-[780px] bg-slate-100 rounded-[18px] lg:rounded-[36px] border-[3px] lg:border-8 border-slate-950 shadow-2xl overflow-hidden flex flex-col relative">
      {/* Main Appsheet Blue Title Bar */}
      <div className="bg-[#1e3a8a] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* TANPHU simulated logo block */}
          <div className="bg-white text-[#1e3a8a] text-[9px] font-black px-1.5 py-0.5 rounded flex items-center justify-center font-sans tracking-tighter">
            <T>TANPHU</T>
          </div>
          <T className="font-bold text-sm tracking-wide">BÁO CÁO 4M1E1I</T>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleFullscreen}
            className="hover:scale-115 active:scale-95 transition-transform"
            title={isFullscreen ? "Thoát toàn màn hình" : "Bung toàn màn hình"}
          >
            {isFullscreen ? (
              <Minimize className="w-[18px] h-[18px] text-white" />
            ) : (
              <Maximize className="w-[18px] h-[18px] text-white" />
            )}
          </button>
          <button 
            onClick={() => { setSelectedCategory(null); setSearchTerm(""); }} 
            className="hover:scale-115 active:scale-95 transition-transform"
            title="Tải lại dữ liệu"
          >
            <RotateCw className="w-[18px] h-[18px] text-white" />
          </button>
        </div>
      </div>

      {/* Internal layout controls (Search inputs) */}
      <div className="bg-white px-3 py-2 border-b border-slate-200 shadow-sm shrink-0 flex flex-col gap-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà máy, người đăng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 rounded-full text-xs focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400 text-slate-700 font-medium"
          />
        </div>
        {/* Rapid filter chips */}
        <div className="flex py-0.5 gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {(["CON NGƯỜI", "MÁY MÓC", "NGUYÊN VẬT LIỆU", "PHƯƠNG PHÁP", "MÔI TRƯỜNG", "THÔNG TIN"] as Category4M1E1I[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-[#1e3a8a] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <T>{cat}</T>
            </button>
          ))}
        </div>
      </div>

      {/* Offline Alert Sticky Banner */}
      {offlineMode && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 text-[10px] px-3 py-1.5 font-bold flex items-center justify-between shrink-0 select-none">
          <T>⚠️ Đang chạy Offline - Lưu báo cáo vào hàng chờ</T>
        </div>
      )}

      {/* Main card list scroll area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-slate-50 relative">
        {filteredReports.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 bg-opacity-70">
            <T className="text-slate-400 text-xs font-semibold">Không tìm thấy báo cáo nào phù hợp.</T>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isUploader = report.uploaderId === currentUserId;
            return (
              <div
                key={report.id}
                className={`bg-white rounded-xl shadow-lg border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
                  report.isAbnormal ? "border-red-400" : "border-slate-200"
                }`}
              >
                {/* Header card info */}
                <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <T className="font-bold text-[#1e3a8a] text-xs block leading-tight">{report.factory}</T>
                    <T className="text-[9px] text-slate-400 block mt-0.5">{report.timestamp}</T>
                  </div>
                  {report.isAbnormal && (
                    <T className="bg-red-500 text-white font-black text-[7px] px-1.5 py-0.5 rounded tracking-wider uppercase block">
                      CẢNH BÁO
                    </T>
                  )}
                </div>

                {/* Report Image */}
                {report.imageUrl && (
                  <AutoImageSlider
                    imageUrls={report.imageUrls}
                    fallbackUrl={report.imageUrl}
                    isAbnormal={report.isAbnormal}
                  />
                )}

                {/* Card Info Section */}
                <div className="p-3 bg-white">
                  {/* Category marker with standard styling */}
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-[#1e3a8a] font-bold text-xs uppercase select-none">
                      {getCategoryIcon(report.category)}
                      <T>{report.category}</T>
                    </div>
                    {/* Personnel tags */}
                    <div className="text-right">
                      <T className="text-[10px] text-slate-500 font-semibold block">{report.uploaderName}</T>
                    </div>
                  </div>

                  {/* Body description text */}
                  <div className="pt-2 text-xs text-slate-700 font-medium leading-relaxed">
                    <T>{report.content}</T>
                  </div>

                  {report.notes && (
                    <div className="mt-2 bg-slate-50 rounded p-2 text-[10px] text-slate-500 italic border-l-2 border-blue-400">
                      <T>Ghi chú: {report.notes}</T>
                    </div>
                  )}
                </div>

                {/* Footer buttons of card (Xóa/Sửa) only for managers or the author */}
                <div className="bg-slate-50 border-t border-slate-100 px-3 py-2 flex justify-between items-center select-none text-[10px] font-semibold text-slate-600">
                  <button
                    onClick={() => onDeleteReport(report.id)}
                    className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 transition-colors py-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <T>XÓA</T>
                  </button>
                  <button
                    onClick={() => onEditReport(report)}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors py-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <T>CHỈNH SỬA</T>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Blue Circular float creation trigger */}
      <button
        onClick={onOpenReportForm}
        className="absolute bottom-20 right-5 w-14 h-14 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-transform z-20 hover:bg-[#1a306c]"
      >
        <Plus className="w-7 h-7 text-white stroke-[3px]" />
      </button>

      {/* Mock navigation bottom bar on appsheet */}
      <div className="bg-slate-50 border-t border-slate-200 grid grid-cols-3 py-2.5 text-center text-slate-400 text-[10px] font-semibold select-none shrink-0 font-sans shadow-inner">
        <div>
          <Heart className="w-4 h-4 mx-auto mb-0.5 text-slate-400" />
          <T>Đóng Góp</T>
        </div>
        <div className="text-[#1e3a8a]">
          <FileText className="w-4 h-4 mx-auto mb-0.5" />
          <T>Báo Cáo</T>
        </div>
        <div onClick={onOpenReportForm} className="cursor-pointer">
          <Camera className="w-4 h-4 mx-auto mb-0.5" />
          <T>Chụp Ảnh</T>
        </div>
      </div>
    </div>
  );
}
