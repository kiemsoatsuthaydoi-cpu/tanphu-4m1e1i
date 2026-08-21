import React, { useState } from "react";
import { 
  Sparkles, Flag, Award, HeartHandshake, Crown, Moon, 
  TreePine, GraduationCap, Heart, Trophy, Image as ImageIcon, 
  X, ExternalLink, Eye, EyeOff, Settings
} from "lucide-react";
import { FestiveBannerConfig, FestiveBannerTheme } from "../types";
import { FESTIVE_PRESETS, isFestiveBannerActive } from "../utils/festiveBannerPresets";
import { T } from "./TranslateText";

interface FestiveTopBannerProps {
  config?: FestiveBannerConfig | null;
  isAdmin?: boolean;
  onOpenConfig?: () => void;
}

const renderThemeIcon = (theme: FestiveBannerTheme, className: string = "w-4 h-4") => {
  switch (theme) {
    case "TET_NGUYEN_DAN":
      return <Sparkles className={className} />;
    case "QUOC_KHANH_2_9":
      return <Flag className={className} />;
    case "GIAI_PHONG_30_4":
      return <Award className={className} />;
    case "QUOC_TE_LAO_DONG_1_5":
      return <HeartHandshake className={className} />;
    case "GIO_TO_HUNG_VUONG":
      return <Crown className={className} />;
    case "TRUNG_THU":
      return <Moon className={className} />;
    case "GIANG_SINH_NOEL":
      return <TreePine className={className} />;
    case "NGAY_NHA_GIAO_20_11":
      return <GraduationCap className={className} />;
    case "PHU_NU_8_3_20_10":
      return <Heart className={className} />;
    case "KY_NIEM_TAN_PHU":
      return <Trophy className={className} />;
    default:
      return <ImageIcon className={className} />;
  }
};

export const FestiveTopBanner: React.FC<FestiveTopBannerProps> = ({
  config,
  isAdmin = false,
  onOpenConfig
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner should be displayed
  if (!isFestiveBannerActive(config)) {
    return null;
  }

  const activeTheme = config?.theme || "TET_NGUYEN_DAN";
  const preset = FESTIVE_PRESETS[activeTheme] || FESTIVE_PRESETS.TET_NGUYEN_DAN;
  
  const title = config?.title?.trim() || preset.defaultTitle;
  const subtitle = config?.subtitle?.trim() || preset.defaultSubtitle;
  const hasCustomImage = activeTheme === "CUSTOM_IMAGE" && !!config?.customImageUrl;
  const showAnimation = config?.animationEnabled !== false;
  const isMarquee = config?.marqueeEnabled === true;
  const marqueeSpeed = config?.marqueeSpeed || 30; // seconds per cycle
  const marqueeGap = config?.marqueeGap || 120;   // px gap between repetitions

  // Render collapsed mini-trigger button if user dismissed it temporarily
  if (isDismissed) {
    return (
      <aside 
        aria-label="Khôi phục banner sự kiện"
        className="fixed top-1.5 right-16 z-50 animate-fadeIn"
      >
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 text-amber-300 text-[10px] font-extrabold shadow-lg backdrop-blur-md border border-amber-500/40 transition-all cursor-pointer hover:scale-105"
          title="Mở lại thanh Banner sự kiện lễ hội"
        >
          {renderThemeIcon(activeTheme, "w-3 h-3 text-amber-400")}
          <T>{preset.badge}</T>
          <Eye className="w-3 h-3 text-slate-300 ml-0.5" />
        </button>
      </aside>
    );
  }

  const bannerContent = (
    <div 
      className={`relative w-full overflow-hidden text-white transition-all shadow-md group ${
        hasCustomImage 
          ? "bg-slate-900" 
          : (config?.bgColor || preset.bgGradient)
      }`}
      style={{
        color: config?.textColor || undefined,
      }}
    >
      {/* Background Custom Image if provided */}
      {hasCustomImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url(${config.customImageUrl})` }}
        />
      )}

      {/* Decorative Subtle Festive Ambient Particles */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 select-none">
          {preset.particleType === "blossom" && (
            <div className="absolute inset-0 flex justify-around items-center text-xs animate-pulse">
              <span className="animate-bounce text-amber-300 duration-1000">🌸</span>
              <span className="text-yellow-300">✨</span>
              <span className="animate-bounce text-red-300 duration-700">🏮</span>
              <span className="text-amber-200">🌸</span>
              <span className="animate-bounce text-yellow-400 duration-1000">✨</span>
            </div>
          )}
          {preset.particleType === "snow" && (
            <div className="absolute inset-0 flex justify-around items-center text-xs">
              <span className="animate-pulse text-white">❄️</span>
              <span className="text-sky-200">✨</span>
              <span className="animate-pulse text-emerald-200">🎄</span>
              <span className="text-white">❄️</span>
              <span className="animate-pulse text-amber-200">🔔</span>
            </div>
          )}
          {preset.particleType === "lantern" && (
            <div className="absolute inset-0 flex justify-around items-center text-xs animate-pulse">
              <span className="text-amber-300">🏮</span>
              <span className="text-yellow-200">🌕</span>
              <span className="text-amber-400">🏮</span>
              <span className="text-yellow-300">✨</span>
              <span className="text-orange-300">🏮</span>
            </div>
          )}
          {preset.particleType === "star" && (
            <div className="absolute inset-0 flex justify-around items-center text-xs animate-pulse">
              <span className="text-yellow-300">⭐</span>
              <span className="text-amber-200">✨</span>
              <span className="text-yellow-400">★</span>
              <span className="text-amber-300">✨</span>
              <span className="text-yellow-200">⭐</span>
            </div>
          )}
          {preset.particleType === "flower" && (
            <div className="absolute inset-0 flex justify-around items-center text-xs animate-pulse">
              <span className="text-pink-300">💐</span>
              <span className="text-rose-200">✨</span>
              <span className="text-pink-200">🌸</span>
              <span className="text-rose-300">💖</span>
              <span className="text-pink-400">💐</span>
            </div>
          )}
          {preset.particleType === "sparkle" && (
            <div className="absolute inset-0 flex justify-around items-center text-xs">
              <span className="animate-pulse text-amber-200">✨</span>
              <span className="text-sky-200">🌟</span>
              <span className="animate-pulse text-yellow-300">✨</span>
              <span className="text-cyan-200">💫</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 w-full px-3 sm:px-5 py-1 sm:py-1.5 flex items-center justify-between gap-3 text-xs">
        
        {/* Left Side: Badge (Fixed on Left) */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/35 backdrop-blur-xs border border-white/20 text-white shrink-0 shadow-xs z-10">
          <span className="text-amber-300 drop-shadow-xs">
            {renderThemeIcon(activeTheme, "w-3.5 h-3.5 sm:w-4 sm:h-4")}
          </span>
          <span className="text-[9.5px] sm:text-[10.5px] font-black tracking-wider uppercase text-amber-200 whitespace-nowrap">
            <T>{preset.badge}</T>
          </span>
        </div>

        {/* Center: Full-width Marquee Ticker or Static Text */}
        <div className="flex-1 min-w-0 overflow-hidden relative">
          {isMarquee ? (
            <div className="relative w-full overflow-hidden whitespace-nowrap">
              <div 
                className="inline-flex items-center animate-banner-ticker hover:[animation-play-state:paused] cursor-default select-none"
                style={{
                  animationDuration: `${marqueeSpeed}s`,
                }}
              >
                {/* Loop Chunk 1 */}
                <div 
                  className="inline-flex items-center gap-3 shrink-0"
                  style={{ paddingRight: `${marqueeGap}px` }}
                >
                  <h4 className="font-black text-[11.5px] sm:text-[13px] tracking-tight uppercase drop-shadow-xs text-amber-200">
                    <T>{title}</T>
                  </h4>
                  {subtitle && (
                    <span className="text-[11px] sm:text-[12px] opacity-95 font-medium border-l border-white/30 pl-3">
                      <T>{subtitle}</T>
                    </span>
                  )}
                  <span className="text-amber-300/70 text-[10px] pl-3">✦ ✦ ✦</span>
                </div>

                {/* Loop Chunk 2 */}
                <div 
                  className="inline-flex items-center gap-3 shrink-0"
                  style={{ paddingRight: `${marqueeGap}px` }}
                >
                  <h4 className="font-black text-[11.5px] sm:text-[13px] tracking-tight uppercase drop-shadow-xs text-amber-200">
                    <T>{title}</T>
                  </h4>
                  {subtitle && (
                    <span className="text-[11px] sm:text-[12px] opacity-95 font-medium border-l border-white/30 pl-3">
                      <T>{subtitle}</T>
                    </span>
                  )}
                  <span className="text-amber-300/70 text-[10px] pl-3">✦ ✦ ✦</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 min-w-0 flex-wrap sm:flex-nowrap justify-center">
              <h4 className="font-black text-[11px] sm:text-[12.5px] tracking-tight uppercase whitespace-nowrap drop-shadow-xs">
                <T>{title}</T>
              </h4>
              {subtitle && (
                <span className="hidden md:inline-block text-[11px] opacity-90 truncate max-w-xl font-medium border-l border-white/30 pl-2">
                  <T>{subtitle}</T>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Controls & Close button (Hidden by default, visible on banner hover) */}
        <div className="flex items-center gap-1.5 shrink-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {config?.linkUrl && (
            <a
              href={config.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-[10px] transition-all backdrop-blur-xs shadow-xs"
            >
              <T>Chi tiết</T>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          {isAdmin && onOpenConfig && (
            <button
              type="button"
              onClick={onOpenConfig}
              className="p-1 rounded-md bg-black/30 hover:bg-black/50 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="Mở cấu hình Banner lễ hội"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md bg-black/30 hover:bg-rose-600 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Tạm ẩn thanh banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return bannerContent;
};
