import React, { useState, useEffect } from "react";
import { 
  Sparkles, Flag, Award, HeartHandshake, Crown, Moon, 
  TreePine, GraduationCap, Heart, Trophy, Image as ImageIcon, 
  Check, Calendar, Link, Sliders, Eye, RefreshCw, Upload,
  PartyPopper, Power, Palette, ChevronDown, ChevronUp, Table, CheckCircle2,
  MoveRight, Play
} from "lucide-react";
import { FestiveBannerConfig, FestiveBannerTheme } from "../types";
import { FESTIVE_PRESETS } from "../utils/festiveBannerPresets";
import { FestiveTopBanner } from "./FestiveTopBanner";
import { T } from "./TranslateText";

interface FestiveBannerConfigCardProps {
  bannerConfig?: FestiveBannerConfig | null;
  onSaveConfig: (config: FestiveBannerConfig) => Promise<void> | void;
}

const DEFAULT_CONFIG: FestiveBannerConfig = {
  enabled: false,
  theme: "TET_NGUYEN_DAN",
  title: FESTIVE_PRESETS.TET_NGUYEN_DAN.defaultTitle,
  subtitle: FESTIVE_PRESETS.TET_NGUYEN_DAN.defaultSubtitle,
  startDate: "",
  endDate: "",
  animationEnabled: true,
  marqueeEnabled: true,
  marqueeSpeed: 30,
  marqueeGap: 120,
  customImageUrl: "",
  linkUrl: ""
};

export const FestiveBannerConfigCard: React.FC<FestiveBannerConfigCardProps> = ({
  bannerConfig,
  onSaveConfig
}) => {
  const [formConfig, setFormConfig] = useState<FestiveBannerConfig>(() => {
    return bannerConfig ? { ...DEFAULT_CONFIG, ...bannerConfig } : DEFAULT_CONFIG;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isThemeListOpen, setIsThemeListOpen] = useState(false);

  useEffect(() => {
    if (bannerConfig) {
      setFormConfig((prev) => ({
        ...prev,
        ...bannerConfig
      }));
    }
  }, [bannerConfig]);

  const handleSelectTheme = (theme: FestiveBannerTheme) => {
    const preset = FESTIVE_PRESETS[theme];
    setFormConfig((prev) => ({
      ...prev,
      theme,
      title: preset.defaultTitle,
      subtitle: preset.defaultSubtitle
    }));
    setIsThemeListOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 1.5MB for crisp web performance)
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Kích thước file ảnh quá lớn (vui lòng chọn ảnh < 1.5MB để đảm bảo tải nhanh).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setFormConfig((prev) => ({
        ...prev,
        customImageUrl: dataUrl,
        theme: "CUSTOM_IMAGE"
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveConfig(formConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving festive banner config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const presetList = Object.values(FESTIVE_PRESETS);
  const currentPreset = FESTIVE_PRESETS[formConfig.theme] || FESTIVE_PRESETS.TET_NGUYEN_DAN;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-5 p-5 sm:p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
            <PartyPopper className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
              <T>CẤU HÌNH BANNER LỄ HỘI & SỰ KIỆN</T>
            </h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mt-0.5">
              <T>Tạo không khí ngày lễ (Tết, 2/9, 30/4, Trung thu, Noel...) trên đỉnh hệ thống Tân Phú.</T>
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Box with Master Toggle embedded directly on the right */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide whitespace-nowrap shrink-0">
            <Eye className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <T>XEM TRƯỚC HIỂN THỊ THỰC TẾ (LIVE PREVIEW)</T>
          </span>

          {/* Master Toggle Right Here */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-bold whitespace-nowrap ${formConfig.enabled ? "text-emerald-600" : "text-slate-500"}`}>
              <T>{formConfig.enabled ? "ĐANG BẬT" : "ĐANG TẮT"}</T>
            </span>
            <button
              type="button"
              onClick={() => setFormConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center shrink-0 ${
                formConfig.enabled ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
            </button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
          <FestiveTopBanner 
            config={{
              ...formConfig,
              enabled: true // Always show in preview box
            }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        
        {/* Step 1: Choose Theme Preset (Collapsible Table / Dropdown Row) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-rose-500" />
              <T>1. CHỌN CHỦ ĐỀ SỰ KIỆN / LỄ HỘI</T>
            </label>
            <button
              type="button"
              onClick={() => setIsThemeListOpen((prev) => !prev)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
            >
              <Table className="w-3.5 h-3.5" />
              <span>{isThemeListOpen ? <T>Thu gọn danh sách</T> : <T>Sổ danh sách chủ đề</T>}</span>
              {isThemeListOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Current Active Selection Summary Bar */}
          <div 
            onClick={() => setIsThemeListOpen((prev) => !prev)}
            className="flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50/70 via-white to-amber-50/40 cursor-pointer hover:border-rose-300 shadow-xs transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-black px-2.5 py-1 rounded-md text-white bg-rose-600 shadow-xs shrink-0">
                <T>{currentPreset.badge}</T>
              </span>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 font-medium leading-none"><T>Đang chọn chủ đề:</T></div>
                <div className="text-sm font-bold text-slate-900 truncate mt-0.5"><T>{currentPreset.label}</T></div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className={`w-20 h-2.5 rounded-full ${currentPreset.bgGradient} hidden sm:block shadow-2xs`} />
              <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                <T>Đổi</T>
                {isThemeListOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </div>
          </div>

          {/* Expandable Table of Festive Themes */}
          {isThemeListOpen && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md bg-white animate-in fade-in-50 duration-200">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-28"><T>Ngày / Mã</T></th>
                      <th className="py-2.5 px-3"><T>Chủ đề Lễ hội / Sự kiện</T></th>
                      <th className="py-2.5 px-3 w-32 hidden sm:table-cell"><T>Tông màu</T></th>
                      <th className="py-2.5 px-3 w-20 text-center"><T>Lựa chọn</T></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {presetList.map((preset) => {
                      const isSelected = formConfig.theme === preset.id;
                      return (
                        <tr
                          key={preset.id}
                          onClick={() => handleSelectTheme(preset.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-rose-50/80 font-bold text-rose-950" 
                              : "hover:bg-slate-50/90 text-slate-700"
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded shadow-2xs ${
                              isSelected ? "bg-rose-600 text-white" : "bg-slate-800 text-white"
                            }`}>
                              <T>{preset.badge}</T>
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800 text-xs">
                              <T>{preset.label}</T>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                              <T>{preset.defaultTitle}</T>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 hidden sm:table-cell">
                            <div className={`h-2 rounded-full w-full ${preset.bgGradient}`} />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isSelected ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white shadow-2xs mx-auto">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold">
                                <T>Chọn</T>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsThemeListOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  <T>Đóng bảng danh sách</T>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Custom Text Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span><T>Tiêu đề chính trên Banner:</T></span>
              <button
                type="button"
                onClick={() => {
                  const p = FESTIVE_PRESETS[formConfig.theme];
                  if (p) setFormConfig((prev) => ({ ...prev, title: p.defaultTitle }));
                }}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <T>Lấy mẫu chuẩn</T>
              </button>
            </label>
            <input
              type="text"
              value={formConfig.title}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Nhập tiêu đề banner..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            {/* Marquee Ticker Setting Box (Clean multi-row layout) */}
            <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-emerald-200/80 shadow-2xs space-y-3">
              {/* Row 1: Title & Main Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MoveRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <T>Hiệu ứng chữ chạy (Marquee Ticker)</T>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                      <T>Mới</T>
                    </span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setFormConfig((prev) => ({ ...prev, marqueeEnabled: !prev.marqueeEnabled }))}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center shrink-0 ${
                    formConfig.marqueeEnabled ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              {/* Row 2: Description */}
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                <T>Chữ tự động lướt ngang toàn khung màn hình, tự dừng khi rê chuột vào để đọc.</T>
              </p>

              {/* Row 3: Detail Controls (Only shown when enabled, on dedicated neat row) */}
              {formConfig.marqueeEnabled && (
                <div className="pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 shrink-0"><T>Tốc độ chạy:</T></span>
                    <select
                      value={formConfig.marqueeSpeed || 30}
                      onChange={(e) => setFormConfig((prev) => ({ ...prev, marqueeSpeed: Number(e.target.value) }))}
                      className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer w-full text-right sm:text-left"
                    >
                      <option value={45}>Chậm (45 giây/vòng)</option>
                      <option value={30}>Vừa phải (30 giây/vòng)</option>
                      <option value={18}>Nhanh (18 giây/vòng)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 shrink-0"><T>Khoảng cách lặp lại:</T></span>
                    <select
                      value={formConfig.marqueeGap || 120}
                      onChange={(e) => setFormConfig((prev) => ({ ...prev, marqueeGap: Number(e.target.value) }))}
                      className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer w-full text-right sm:text-left"
                    >
                      <option value={60}>Gần (60px)</option>
                      <option value={120}>Vừa phải (120px)</option>
                      <option value={200}>Rộng (200px)</option>
                      <option value={350}>Rất rộng (350px)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span><T>Thông điệp / Khẩu hiệu / Lời chúc:</T></span>
              <button
                type="button"
                onClick={() => {
                  const p = FESTIVE_PRESETS[formConfig.theme];
                  if (p) setFormConfig((prev) => ({ ...prev, subtitle: p.defaultSubtitle }));
                }}
                className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <T>Lấy mẫu chuẩn</T>
              </button>
            </label>
            <textarea
              rows={2}
              value={formConfig.subtitle}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Nhập lời chúc hoặc thông điệp gửi tới cán bộ công nhân viên..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Date range schedule */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span><T>Phát sóng từ ngày (dd/mm/yy):</T></span>
            </label>
            <input
              type="text"
              value={formConfig.startDate || ""}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, startDate: e.target.value }))}
              placeholder="Ví dụ: 01/09/26 (để trống = phát sóng ngay)"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span><T>Đến hết ngày (dd/mm/yy):</T></span>
            </label>
            <input
              type="text"
              value={formConfig.endDate || ""}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, endDate: e.target.value }))}
              placeholder="Ví dụ: 05/09/26 (để trống = không giới hạn)"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Link URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Link className="w-3.5 h-3.5 text-slate-500" />
              <span><T>Đường dẫn bài viết / Video sự kiện (Tùy chọn):</T></span>
            </label>
            <input
              type="url"
              value={formConfig.linkUrl || ""}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, linkUrl: e.target.value }))}
              placeholder="https://... (khi click vào banner sẽ mở bài viết này)"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Custom Banner Image upload / URL */}
          <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-200">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <T>Tùy chọn tải ảnh Banner riêng từ máy tính:</T>
              </span>
              {formConfig.customImageUrl && (
                <button
                  type="button"
                  onClick={() => setFormConfig((prev) => ({ ...prev, customImageUrl: "" }))}
                  className="text-[11px] text-red-600 hover:underline cursor-pointer font-semibold"
                >
                  <T>Xóa ảnh đã tải</T>
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <T>Tải ảnh Banner lên (PNG/JPG)</T>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div className="text-[11px] text-slate-400 font-medium truncate flex-1">
                {formConfig.customImageUrl ? (
                  <span className="text-emerald-600 font-semibold"><T>✓ Đã nạp ảnh banner tùy chỉnh</T></span>
                ) : (
                  <span><T>Nếu không tải ảnh, hệ thống sẽ sử dụng nền thiết kế chuẩn của Tân Phú.</T></span>
                )}
              </div>
            </div>
          </div>

          {/* Animation Toggle */}
          <div className="md:col-span-2 pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-xs font-bold text-slate-800 block"><T>Hiệu ứng hạt lễ hội (Hoa mai, tuyết rơi, sao lấp lánh)</T></span>
                <span className="text-[10px] text-slate-500 font-medium block"><T>Hiệu ứng nhẹ, tối ưu chuyển động và không gây tốn tài nguyên máy.</T></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormConfig((prev) => ({ ...prev, animationEnabled: !prev.animationEnabled }))}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer flex items-center ${
                formConfig.animationEnabled ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" />
              <T>Đã lưu và đồng bộ Banner toàn công ty thành công!</T>
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <T>Đang lưu cấu hình...</T>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <T>LƯU & PHÁT SÓNG BANNER</T>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
