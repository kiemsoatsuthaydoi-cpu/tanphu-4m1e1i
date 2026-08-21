import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Smile,
  Image as ImageIcon,
  Send,
  X,
  ChevronDown,
  Highlighter,
  Sparkles
} from "lucide-react";
import { User } from "../types";
import { MentionTextArea } from "./MentionTextArea";
import { T } from "./TranslateText";

export interface AttachedImage {
  id: string;
  name: string;
  url: string;
  sizeKb?: number;
}

interface RichChatInputBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (message: string, attachedImages?: AttachedImage[]) => void;
  placeholder?: string;
  users?: User[];
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  showFormatToolbar?: boolean;
  themeColor?: "blue" | "pink" | "indigo" | "emerald" | string;
}

export const EMOJI_CATEGORIES = [
  {
    name: "Vui vẻ & Nụ cười",
    icon: "😄",
    emojis: [
      "😄", "😃", "😀", "😊", "😁", "😆", "😅", "😂", "🤣", "🥰",
      "😍", "🤩", "😘", "😗", "😚", "😋", "😜", "🤪", "😝", "🤗",
      "🤭", "🥳", "😎", "😇", "🤠", "😺", "😸", "😻", "😏", "😌"
    ]
  },
  {
    name: "Công việc & Đồng đội",
    icon: "👍",
    emojis: [
      "👍", "👏", "🙌", "👐", "🤝", "✌️", "👌", "🤟", "💪", "💯",
      "🔥", "🚀", "🎉", "🎊", "🎯", "💡", "⚡", "📌", "✅", "⚠️",
      "🏆", "🏅", "🥇", "✍️", "📊", "📈", "📋", "💼", "🔑", "🛡️"
    ]
  },
  {
    name: "Yêu thương & Trái tim",
    icon: "❤️",
    emojis: [
      "❤️", "💖", "💕", "💞", "💓", "💗", "💘", "💝", "💟", "💌",
      "🌸", "💐", "🌹", "🌻", "🍀", "💎", "⭐", "🌟", "✨", "☀️"
    ]
  },
  {
    name: "Thư giãn & Đời sống",
    icon: "☕",
    emojis: [
      "☕", "🍵", "🍻", "🥂", "🍾", "🍹", "🎂", "🍰", "🍩", "🍕",
      "🍎", "🍓", "🍉", "🎁", "🎈", "🎶", "🎵", "💬", "👀", "🔔"
    ]
  }
];

export function RichChatInputBox({
  value,
  onChange,
  onSend,
  placeholder = "Nhập nội dung thảo luận mới...",
  users = [],
  disabled = false,
  className = "",
  showFormatToolbar = true,
  themeColor = "blue",
}: RichChatInputBoxProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState<string>("ALL");
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L">("M");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine button / highlight styles based on themeColor
  const isPink = themeColor === "pink";
  const primaryBgClass = isPink
    ? "bg-pink-600 hover:bg-pink-700 shadow-pink-500/20"
    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20";
  const activeIconColor = isPink ? "text-pink-600" : "text-blue-600";
  const activeBorderColor = isPink ? "border-pink-300 bg-pink-50" : "border-blue-300 bg-blue-50";

  // Close popups on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        sizePickerRef.current &&
        !sizePickerRef.current.contains(event.target as Node)
      ) {
        setShowSizeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to wrap text with formatting
  const applyFormat = (prefix: string, suffix: string = prefix, defaultPlaceholder = "văn bản") => {
    // If there is existing value, we append or wrap
    onChange(value ? `${value} ${prefix}${defaultPlaceholder}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`);
  };

  const handleBold = () => applyFormat("**", "**", "in đậm");
  const handleItalic = () => applyFormat("*", "*", "in nghiêng");
  const handleUnderline = () => applyFormat("<u>", "</u>", "gạch chân");
  const handleHighlight = () => applyFormat("==", "==", "nổi bật");

  const handleSelectSize = (size: "S" | "M" | "L") => {
    setSelectedSize(size);
    setShowSizeDropdown(false);
    if (size === "L") {
      applyFormat("[size=L]", "[/size]", "chữ lớn");
    } else if (size === "S") {
      applyFormat("[size=S]", "[/size]", "chữ nhỏ");
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    onChange((value ? `${value} ` : "") + emoji);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          setAttachedImages((prev) => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              url: resultUrl,
              sizeKb: Math.round(file.size / 1024)
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSend = () => {
    if ((!value.trim() && attachedImages.length === 0) || disabled) return;
    onSend(value.trim(), attachedImages);
    onChange("");
    setAttachedImages([]);
    setShowEmojiPicker(false);
  };

  return (
    <div ref={containerRef} className={`w-full flex flex-col space-y-1.5 select-none ${className}`}>
      {/* Top Formatting Toolbar (B I U | M ▾ ⬛) */}
      {showFormatToolbar && (
        <div className="flex items-center gap-1.5 px-0.5 py-0.5">
          {/* Bold, Italic, Underline Pill Group */}
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleBold}
              className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-700 hover:${activeIconColor} transition-colors font-black text-xs cursor-pointer active:scale-95`}
              title="In đậm (Ctrl+B)"
            >
              <span className="font-extrabold text-xs">B</span>
            </button>
            <button
              type="button"
              onClick={handleItalic}
              className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-700 hover:${activeIconColor} transition-colors italic text-xs cursor-pointer active:scale-95`}
              title="In nghiêng (Ctrl+I)"
            >
              <span className="font-serif italic font-bold text-xs">I</span>
            </button>
            <button
              type="button"
              onClick={handleUnderline}
              className={`w-6 h-6 flex items-center justify-center rounded-md hover:bg-white text-slate-700 hover:${activeIconColor} transition-colors text-xs cursor-pointer active:scale-95`}
              title="Gạch chân (Ctrl+U)"
            >
              <span className="underline decoration-1 underline-offset-2 font-bold text-xs">U</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

          {/* Size Selector Dropdown */}
          <div className="relative" ref={sizePickerRef}>
            <button
              type="button"
              onClick={() => setShowSizeDropdown((prev) => !prev)}
              className="h-6 px-2 flex items-center gap-1 bg-slate-100/90 hover:bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              title="Kích thước chữ"
            >
              <span>{selectedSize}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showSizeDropdown && (
              <div className="absolute left-0 top-7 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 min-w-[110px] animate-scaleUp">
                <button
                  type="button"
                  onClick={() => handleSelectSize("S")}
                  className={`w-full text-left px-2 py-1 rounded-md text-xs hover:bg-slate-50 hover:${activeIconColor} font-medium flex items-center justify-between`}
                >
                  <span className="text-[11px]"><span translate="no" className="notranslate">Nhỏ (S)</span></span>
                  {selectedSize === "S" && <span className={`${activeIconColor} font-bold`}>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSize("M")}
                  className={`w-full text-left px-2 py-1 rounded-md text-xs hover:bg-slate-50 hover:${activeIconColor} font-medium flex items-center justify-between`}
                >
                  <span className="text-xs"><span translate="no" className="notranslate">Vừa (M)</span></span>
                  {selectedSize === "M" && <span className={`${activeIconColor} font-bold`}>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSize("L")}
                  className={`w-full text-left px-2 py-1 rounded-md text-xs hover:bg-slate-50 hover:${activeIconColor} font-medium flex items-center justify-between`}
                >
                  <span className="text-sm font-bold"><span translate="no" className="notranslate">Lớn (L)</span></span>
                  {selectedSize === "L" && <span className={`${activeIconColor} font-bold`}>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Highlight Button */}
          <button
            type="button"
            onClick={handleHighlight}
            className="w-6 h-6 flex items-center justify-center bg-slate-100/90 hover:bg-amber-100 border border-slate-200 rounded-lg text-slate-700 hover:text-amber-800 transition-colors text-xs cursor-pointer shadow-2xs"
            title="Đánh dấu nổi bật (==nội dung==)"
          >
            <div className="w-3 h-2.5 bg-amber-400 rounded-xs border border-amber-500 shadow-2xs" />
          </button>
        </div>
      )}

      {/* Main Input Card: Compact single-row default (reduced 1/2 height), auto-expands on multiline */}
      <div className={`relative flex flex-col bg-slate-50/80 hover:bg-slate-100/70 focus-within:bg-white focus-within:ring-2 ${isPink ? "focus-within:ring-pink-100 focus-within:border-pink-500" : "focus-within:ring-blue-100 focus-within:border-blue-500"} border border-slate-300 rounded-xl px-2 py-1.5 transition-all shadow-2xs`}>
        {/* Attached Images Thumbnail Preview Row */}
        {attachedImages.length > 0 && (
          <div className="flex items-center gap-2 p-1.5 mb-1 overflow-x-auto border-b border-slate-200">
            {attachedImages.map((img) => (
              <div key={img.id} className="relative group shrink-0">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                  title="Xóa ảnh này"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar Row (Left Action Icons: Stacked EMOJI & ẢNH without text + Textarea + Right Send Button) */}
        <div className="flex items-center gap-1.5">
          {/* Left Action Buttons: 2 stacked icons without text labels */}
          <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 pr-1 border-r border-slate-200/80">
            {/* EMOJI Button */}
            <div className="relative" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`p-1 rounded-md transition-all cursor-pointer border ${
                  showEmojiPicker
                    ? `${activeBorderColor} ${activeIconColor} shadow-2xs`
                    : `hover:bg-slate-200/80 border-transparent text-slate-500 hover:${activeIconColor}`
                }`}
                title="Biểu tượng cảm xúc (Emoji)"
              >
                <Smile className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute left-0 bottom-11 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 z-40 w-80 max-w-[92vw] animate-scaleUp">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span><span translate="no" className="notranslate">Biểu tượng cảm xúc</span></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-1.5 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setActiveEmojiTab("ALL")}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        activeEmojiTab === "ALL"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <T>Tất cả</T>
                    </button>
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveEmojiTab(cat.name)}
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 ${
                          activeEmojiTab === cat.name
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span translate="no" className="notranslate">{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Emojis Grid */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {EMOJI_CATEGORIES.filter(cat => activeEmojiTab === "ALL" || activeEmojiTab === cat.name).map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span translate="no" className="notranslate">{cat.name}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {cat.emojis.map((emoji, eIdx) => (
                            <button
                              key={eIdx}
                              type="button"
                              onClick={() => handleInsertEmoji(emoji)}
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 active:scale-125 text-lg flex items-center justify-center transition-all cursor-pointer border-none bg-transparent"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ẢNH (Image) Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1 rounded-md transition-all cursor-pointer border border-transparent hover:bg-slate-200/80 text-slate-500 hover:${activeIconColor}`}
                title="Đính kèm hình ảnh (JPG, PNG, GIF)"
              >
                <ImageIcon className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Textarea Input Field - Compact default height (18px-22px), smoothly expands up to 120px+ for long text */}
          <div className="flex-1 min-w-0 py-0.5">
            <MentionTextArea
              users={users}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              containerClassName="w-full flex items-center"
              onKeyDown={(e) => {
                // Keyboard shortcut: Enter to send (unless shift is pressed)
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                // Ctrl+B for bold
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                  e.preventDefault();
                  handleBold();
                }
                // Ctrl+I for italic
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                  e.preventDefault();
                  handleItalic();
                }
                // Ctrl+U for underline
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
                  e.preventDefault();
                  handleUnderline();
                }
              }}
              className="w-full bg-transparent text-slate-900 border-none p-0 text-xs md:text-sm leading-relaxed focus:outline-none resize-none min-h-[20px] max-h-[120px] overflow-y-auto placeholder:text-slate-400 font-normal transition-all duration-100"
              rows={1}
            />
          </div>

          {/* Right Send Button - Compact & Crisp */}
          <div className="shrink-0 pb-0.5">
            <button
              type="button"
              onClick={handleSend}
              disabled={(!value.trim() && attachedImages.length === 0) || disabled}
              className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                value.trim() || attachedImages.length > 0
                  ? `${primaryBgClass} active:scale-95 text-white shadow-xs`
                  : "bg-slate-200/90 text-slate-400 cursor-not-allowed"
              }`}
              title="Gửi tin nhắn (Enter)"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
