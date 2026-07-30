import React, { useState, useEffect } from "react";
import { 
  X, ChevronLeft, ChevronRight, Download, Play, Maximize2, Minimize2, 
  Search, FileText, CheckCircle2, Sparkles, BookOpen, Layers, Monitor, 
  Share2, Award, AlertTriangle, Printer
} from "lucide-react";
import { T } from "./TranslateText";
import { SLIDES_DATA, SlideData, exportToPowerPoint } from "../utils/pptxExporter";

interface PowerPointGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PowerPointGuideModal({ isOpen, onClose }: PowerPointGuideModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"SLIDES" | "CHEATSHEET">("SLIDES");

  const filteredSlides = SLIDES_DATA.filter((slide) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      slide.title.toLowerCase().includes(q) ||
      slide.subtitle?.toLowerCase().includes(q) ||
      slide.category.toLowerCase().includes(q) ||
      slide.content.points.some(
        (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      )
    );
  });

  const currentSlide: SlideData = SLIDES_DATA[currentSlideIndex] || SLIDES_DATA[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(prev + 1, SLIDES_DATA.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen) return null;

  const handleDownloadPPTX = async () => {
    try {
      setIsExporting(true);
      await exportToPowerPoint();
    } catch (err) {
      console.error("Lỗi xuất PowerPoint:", err);
      alert("Không thể tạo file PowerPoint. Vui lòng thử lại!");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? "bg-black" : "bg-slate-900/80 backdrop-blur-md p-2 sm:p-4"} animate-fadeIn select-text`}>
      <div 
        className={`bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none border-none" : "w-full max-w-7xl h-[92vh]"
        }`}
      >
        {/* --- MODAL HEADER / CONTROLS --- */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md font-black shrink-0">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  <span translate="no" className="notranslate"><T>SLIDE HƯỚNG DẪN SỬ DỤNG META ANDON 4M1E1I</T></span>
                </h2>
                <span className="bg-orange-500/20 text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                  PPTX 12 Slides
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Tài liệu cẩm nang thao tác chi tiết cho CBCNV Tân Phú Plastics (Project: tanphu-4m1e1i)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PPTX Button */}
            <button
              onClick={handleDownloadPPTX}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
              title="Tải về file PowerPoint (.pptx) gốc"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce" : ""}`} />
              <span translate="no" className="notranslate"><T>{isExporting ? "Đang tạo PPTX..." : "TẢI PPTX (.pptx)"}</T></span>
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrintPDF}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="In hoặc xuất PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span translate="no" className="notranslate"><T>IN / PDF</T></span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
              title={isFullscreen ? "Thoát toàn màn hình" : "Chế độ trình chiếu toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Đóng Hướng dẫn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- MAIN BODY (NAVBAR + SLIDE VIEW) --- */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* --- LEFT SIDEBAR: THUMBNAILS & SEARCH --- */}
          <div className="w-full md:w-80 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
            {/* Search Box */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm slide (vd: 5-Whys, Task, KPH)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-slate-800 px-3 pt-2 text-xs font-bold gap-2">
              <button
                onClick={() => setActiveTab("SLIDES")}
                className={`pb-2 px-2 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "SLIDES" ? "border-amber-500 text-amber-400" : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span translate="no" className="notranslate"><T>Danh Sách Slide ({filteredSlides.length})</T></span>
              </button>
            </div>

            {/* Thumbnails List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
              {filteredSlides.map((slide) => {
                const isSelected = slide.id === currentSlide.id;
                return (
                  <button
                    key={slide.id}
                    onClick={() => {
                      const idx = SLIDES_DATA.findIndex((s) => s.id === slide.id);
                      if (idx !== -1) setCurrentSlideIndex(idx);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isSelected ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
                    }`}>
                      {slide.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider truncate">
                          {slide.category}
                        </span>
                        {slide.badge && (
                          <span className="text-[8px] px-1 py-0.2 bg-slate-800 text-slate-400 rounded shrink-0">
                            {slide.badge}
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-semibold truncate ${isSelected ? "text-white font-bold" : "text-slate-300"}`}>
                        {slide.title}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* --- RIGHT: SLIDE DISPLAY CANVAS --- */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto p-3 sm:p-6 justify-between items-center relative">
            
            {/* Slide Box (16:9 Aspect Ratio style) */}
            <div className="w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col min-h-[520px] justify-between relative overflow-hidden my-auto">
              
              {/* Decorative top bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500" />

              {/* Slide Top Metadata */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider rounded-md border border-amber-500/30">
                    <span translate="no" className="notranslate"><T>{currentSlide.category}</T></span>
                  </span>
                  {currentSlide.badge && (
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[11px] font-medium rounded-md border border-slate-700">
                      <span translate="no" className="notranslate"><T>{currentSlide.badge}</T></span>
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-xs font-mono">
                  Slide {currentSlide.id} / {SLIDES_DATA.length}
                </div>
              </div>

              {/* Slide Titles */}
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight mb-2">
                  <span translate="no" className="notranslate"><T>{currentSlide.title}</T></span>
                </h1>
                {currentSlide.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-400 font-medium italic">
                    <span translate="no" className="notranslate"><T>{currentSlide.subtitle}</T></span>
                  </p>
                )}
              </div>

              {/* Slide Main Content Points */}
              <div className="flex-1 space-y-3 mb-6">
                {currentSlide.content.heading && (
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span translate="no" className="notranslate"><T>{currentSlide.content.heading}</T></span>
                  </h3>
                )}

                <div className="grid grid-cols-1 gap-2.5">
                  {currentSlide.content.points.map((point, idx) => (
                    <div
                      key={idx}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        point.highlight
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-100 ring-1 ring-amber-500/20"
                          : "bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        point.highlight ? "bg-amber-500 text-slate-950 font-black" : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs sm:text-sm font-bold mb-1 ${point.highlight ? "text-amber-300" : "text-white"}`}>
                          <span translate="no" className="notranslate"><T>{point.title}</T></span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <span translate="no" className="notranslate"><T>{point.desc}</T></span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table if applicable */}
                {currentSlide.content.table && (
                  <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-800 text-slate-200">
                          {currentSlide.content.table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5 font-bold border-b border-slate-700">
                              <span translate="no" className="notranslate"><T>{h}</T></span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {currentSlide.content.table.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40">
                            {r.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-slate-300">
                                <span translate="no" className="notranslate"><T>{cell}</T></span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tips block */}
                {currentSlide.content.tips && (
                  <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      {currentSlide.content.tips.map((t, tIdx) => (
                        <p key={tIdx}><span translate="no" className="notranslate"><T>{t}</T></span></p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Slide Footer Info */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span translate="no" className="notranslate"><T>Công ty Cổ phần Sản xuất Gia dụng Tân Phú (Project: tanphu-4m1e1i)</T></span>
                <span className="font-mono">Định dạng ngày: dd/mm/yy</span>
              </div>
            </div>

            {/* --- BOTTOM SLIDE NAVIGATION CONTROLS --- */}
            <div className="w-full max-w-5xl mt-4 flex items-center justify-between gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span translate="no" className="notranslate"><T>Slide Trước</T></span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  Slide <strong className="text-amber-400 font-bold">{currentSlideIndex + 1}</strong> / {SLIDES_DATA.length}
                </span>
              </div>

              <button
                onClick={() => setCurrentSlideIndex((prev) => Math.min(prev + 1, SLIDES_DATA.length - 1))}
                disabled={currentSlideIndex === SLIDES_DATA.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
              >
                <span translate="no" className="notranslate"><T>Slide Tiếp</T></span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
