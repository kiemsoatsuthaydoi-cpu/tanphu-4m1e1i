import React, { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import { T } from "./TranslateText";

interface AutoImageSliderProps {
  imageUrls?: string[];
  fallbackUrl: string;
  isAbnormal?: boolean;
  isSpotlight?: boolean;
  reportType?: "KPH" | "DSA" | "NORMAL";
}

export function AutoImageSlider({ imageUrls, fallbackUrl, isAbnormal, isSpotlight, reportType }: AutoImageSliderProps) {
  const list = imageUrls && imageUrls.length > 0 ? imageUrls : [fallbackUrl];
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // States for Zoom and Pan on Mobile
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // For touch swipe gesture support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  useEffect(() => {
    if (list.length <= 1 || lightboxOpen) return; // Pause automatic rotation when lightbox is active
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % list.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [list, lightboxOpen]);

  // Sync index to lightbox index when opening
  const handleOpenLightbox = () => {
    setLightboxIndex(index);
    resetZoom();
    setLightboxOpen(true);
  };

  const handleNext = () => {
    setLightboxIndex((prev) => (prev + 1) % list.length);
    resetZoom();
  };

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev - 1 + list.length) % list.length);
    resetZoom();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = prev - 0.5;
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleToggleZoom = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Dual-purpose touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches.length === 2) {
      // Pinch started
      const t1 = e.targetTouches[0];
      const t2 = e.targetTouches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialDistance.current = dist;
      initialScale.current = scale;
    } else if (e.targetTouches.length === 1) {
      if (scale <= 1) {
        // Standard swipe start
        touchStartX.current = e.targetTouches[0].clientX;
      } else {
        // Pan zoomed image start
        setIsDragging(true);
        const touch = e.targetTouches[0];
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches.length === 2 && initialDistance.current !== null) {
      const t1 = e.targetTouches[0];
      const t2 = e.targetTouches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / initialDistance.current;
      const nextScale = Math.max(1, Math.min(4, initialScale.current * factor));
      setScale(nextScale);
      if (nextScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.targetTouches.length === 1) {
      if (scale <= 1) {
        // Standard swipe move
        touchEndX.current = e.targetTouches[0].clientX;
      } else {
        // Pan zoomed image move
        if (!isDragging) return;
        const touch = e.targetTouches[0];
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        
        const limit = (scale - 1) * 150;
        setPosition({
          x: Math.max(-limit, Math.min(limit, newX)),
          y: Math.max(-limit, Math.min(limit, newY))
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.targetTouches.length < 2) {
      initialDistance.current = null;
    }

    if (scale <= 1) {
      // Standard swipe end
      if (touchStartX.current === null || touchEndX.current === null) return;
      const diff = touchStartX.current - touchEndX.current;
      const threshold = 40; // minimum distance for swipe
      if (diff > threshold) {
        handleNext();
      } else if (diff < -threshold) {
        handlePrev();
      }
      touchStartX.current = null;
      touchEndX.current = null;
    } else {
      // Pan zoomed image end
      setIsDragging(false);
    }
  };

  return (
    <>
      <div 
        onClick={handleOpenLightbox}
        className="relative group bg-slate-900 border-b border-slate-100 flex items-center justify-center overflow-hidden h-[211px] w-full select-none cursor-pointer"
      >
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
      </div>

      {/* Fullscreen Shopee-style Lightbox Overlay Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-[99999] flex flex-col items-center justify-between py-6 px-4 animate-fade-in touch-none select-none"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header Area with Status and Close button */}
          <div className="w-full flex justify-between items-center z-[100000] px-2" onClick={(e) => e.stopPropagation()}>
            <div className="bg-black/60 text-white rounded-full px-3 py-1.5 text-xs font-semibold border border-white/10 flex items-center gap-2">
              <span translate="no" className="notranslate">{lightboxIndex + 1} / {list.length}</span>
              {scale > 1 && (
                <span className="text-yellow-400 font-bold border-l border-white/20 pl-2">
                  <span translate="no" className="notranslate">{scale.toFixed(1)}x</span>
                </span>
              )}
            </div>
            
            {/* Direct Zoom Action Buttons on Mobile (highly accessible) */}
            <div className="flex items-center gap-1.5 ml-auto mr-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full flex items-center justify-center focus:outline-none transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full flex items-center justify-center focus:outline-none transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {scale > 1 && (
                <button
                  type="button"
                  onClick={resetZoom}
                  className="w-9 h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center focus:outline-none transition-all cursor-pointer"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-all focus:outline-none border border-white/10 cursor-pointer"
              aria-label="Close image viewer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Active Image Centered Area */}
          <div 
            className="flex-1 w-full flex items-center justify-center relative my-4 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left navigation arrow button (visible/active if list.length > 1) */}
            {list.length > 1 && scale === 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-1 w-10 h-10 rounded-full bg-black/40 border border-white/5 active:scale-90 text-white flex items-center justify-center z-[100001] transition-transform cursor-pointer"
              >
                <span className="text-sm font-bold font-mono">◀</span>
              </button>
            )}

            <img
              src={list[lightboxIndex]}
              alt={`Full view ${lightboxIndex}`}
              referrerPolicy="no-referrer"
              onClick={handleToggleZoom}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className={`max-h-[76vh] max-w-full object-contain select-none shadow-2xl ${
                scale > 1 ? "cursor-move" : "cursor-zoom-in"
              }`}
            />

            {/* Right navigation arrow button (visible/active if list.length > 1) */}
            {list.length > 1 && scale === 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-1 w-10 h-10 rounded-full bg-black/40 border border-white/5 active:scale-90 text-white flex items-center justify-center z-[100001] transition-transform cursor-pointer"
              >
                <span className="text-sm font-bold font-mono">▶</span>
              </button>
            )}
          </div>

          {/* Footer Area with Dot Indicators and Swiping help instruction */}
          <div className="w-full flex flex-col items-center gap-2 z-[100000]" onClick={(e) => e.stopPropagation()}>
            {scale > 1 ? (
              <T className="text-[10px] text-yellow-400 font-bold tracking-wider uppercase bg-yellow-950/40 px-3 py-1 rounded-full border border-yellow-500/20">
                <span translate="no" className="notranslate font-semibold">Chạm 2 lần để thu nhỏ rắc về 1x • Vuốt để xem xung quanh</span>
              </T>
            ) : list.length > 1 ? (
              <>
                {/* Dot Indicators */}
                <div className="flex gap-1.5 bg-black/45 px-3 py-1.5 rounded-full mb-1">
                  {list.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all focus:outline-none ${
                        i === lightboxIndex ? "bg-white scale-125" : "bg-white/35 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
                
                {/* Visual swipe instruction */}
                <T className="text-[11px] text-white/50 tracking-wider font-semibold uppercase animate-pulse">
                  <span translate="no" className="notranslate">Chạm 2 lần để phóng to • Vuốt ngang đổi ảnh</span>
                </T>
              </>
            ) : (
              <T className="text-[11px] text-white/50 tracking-wider font-semibold uppercase">
                <span translate="no" className="notranslate">Chạm kép để phóng to ảnh</span>
              </T>
            )}
          </div>
        </div>
      )}
    </>
  );
}
