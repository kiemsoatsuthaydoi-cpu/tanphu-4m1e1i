import React, { useState, useEffect, useRef } from "react";
import { UserCheck, Building, AtSign, Bell, Check } from "lucide-react";

export interface MentionItem {
  id: string;
  name: string;
  type: "person" | "dept";
  detail?: string;
}

export const DEFAULT_MENTION_ITEMS: MentionItem[] = [
  // Key Personnel
  { id: "p1", name: "Giáp", type: "person", detail: "Mr. Giáp - P. Mua Hàng" },
  { id: "p2", name: "Lê Nhật Trường", type: "person", detail: "Trưởng ban QLCL" },
  { id: "p3", name: "Trần Huy Tiến", type: "person", detail: "Cán bộ QLCL" },
  { id: "p4", name: "Bùi Tài", type: "person", detail: "Phụ trách QA/QC" },
  { id: "p5", name: "Lê Nguyễn Phú", type: "person", detail: "Giám sát Chất lượng" },
  { id: "p6", name: "Phạm Thị Tuyền", type: "person", detail: "Trưởng BP Chất lượng (QC Head)" },
  { id: "p7", name: "Lê Thị Phương", type: "person", detail: "Cán bộ Kiểm soát KPH" },
  { id: "p8", name: "Trương Thị Thanh Thiện", type: "person", detail: "Nhân viên QC / Người lập" },
  { id: "p9", name: "Mr. Võ Thái Bình", type: "person", detail: "Quản lý Chi nhánh" },
  { id: "p10", name: "Trần Minh Đức", type: "person", detail: "Tổ Trưởng Ca 1" },
  { id: "p11", name: "Lê Hoàng Nam", type: "person", detail: "Kỹ Thuật SMT" },
  { id: "p12", name: "Nguyễn Văn Anh", type: "person", detail: "QC Line" },
  { id: "p13", name: "Lê Văn Cường", type: "person", detail: "Ngoại quan AOI" },

  // Key Departments
  { id: "d1", name: "P.MH", type: "dept", detail: "Phòng Mua Hàng / Vật tư" },
  { id: "d2", name: "P.SX", type: "dept", detail: "Phòng Sản Xuất" },
  { id: "d3", name: "P.QLCL", type: "dept", detail: "Phòng Quản Lý Chất Lượng" },
  { id: "d4", name: "P.HSE", type: "dept", detail: "Phòng An Toàn Môi Trường" },
  { id: "d5", name: "Kho", type: "dept", detail: "Bộ phận Kho & Tiếp liệu" },
  { id: "d6", name: "P.Kỹ Thuật", type: "dept", detail: "Phòng Kỹ Thuật / Bảo Trì" },
  { id: "d7", name: "Xưởng TPP-LAN", type: "dept", detail: "Chi nhánh Long An" },
  { id: "d8", name: "Xưởng DNP-BBM", type: "dept", detail: "Nhà máy BBM" },
  { id: "d9", name: "BGĐ", type: "dept", detail: "Ban Giám Đốc" },
];

interface MentionTextAreaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  customMentions?: MentionItem[];
  onShowNotification?: (mentionName: string) => void;
  disabled?: boolean;
  users?: any[];
  onKeyDown?: (e: any) => void;
  onPaste?: (e: any) => void;
  onInput?: (e: any) => void;
  style?: React.CSSProperties;
  containerClassName?: string;
}

export function MentionTextArea({
  value,
  onChange,
  placeholder,
  className = "w-full bg-transparent text-blue-700 print:text-black font-semibold text-xs leading-relaxed focus:bg-amber-50 focus:outline-none resize-y",
  rows = 3,
  customMentions,
  onShowNotification,
  disabled = false,
  onKeyDown,
  onPaste,
  onInput,
  style,
  containerClassName,
}: MentionTextAreaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const mentionList = customMentions && customMentions.length > 0 ? customMentions : DEFAULT_MENTION_ITEMS;

  const filteredMentions = mentionList.filter((m) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.detail && m.detail.toLowerCase().includes(q));
  });

  // Handle textarea change and detect @
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    onChange(val);
    setCursorPos(pos);

    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/@([a-zA-Z0-9_À-ỹ. -]*)$/);

    if (match) {
      setFilterQuery(match[1]);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectMention = (item: MentionItem) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart || cursorPos;
    const textBefore = value.slice(0, pos);
    const textAfter = value.slice(pos);

    const lastAtIndex = textBefore.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const newTextBefore = textBefore.slice(0, lastAtIndex) + "@" + item.name + " ";
      const newValue = newTextBefore + textAfter;
      onChange(newValue);

      // Reset focus & cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursor = newTextBefore.length;
          textareaRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 50);
    }

    setIsOpen(false);
    if (onShowNotification) {
      onShowNotification(item.name);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(ev.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(ev.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-expand height to fit all content lines without scrollbars
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    if (el.scrollHeight > 0) {
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={`relative group ${containerClassName || "w-full"}`}>
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onInput={onInput}
        style={style}
      />

      {/* Mention Dropdown Popup */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-1 left-0 w-72 bg-white border border-slate-300 rounded-xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 no-print"
        >
          <div className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
            <span className="flex items-center gap-1">
              <AtSign className="w-3 h-3 text-indigo-600" />
              <span translate="no" className="notranslate">TAG NGƯỜI / BỘ PHẬN LIÊN QUAN</span>
            </span>
            <span className="text-[9px] font-normal text-slate-400">Gõ @ để mở</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredMentions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                Không tìm thấy "{filterQuery}"
              </div>
            ) : (
              filteredMentions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMention(item)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50/80 rounded-lg transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-indigo-100"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.type === "person" ? (
                      <span className="p-1 bg-blue-100 text-blue-700 rounded-md">
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      </span>
                    ) : (
                      <span className="p-1 bg-amber-100 text-amber-800 rounded-md">
                        <Building className="w-3.5 h-3.5 shrink-0" />
                      </span>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                        <span translate="no" className="notranslate">@{item.name}</span>
                      </div>
                      {item.detail && (
                        <div className="text-[10px] text-slate-500 truncate">
                          <span translate="no" className="notranslate">{item.detail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Chọnn
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  customMentions?: MentionItem[];
  onShowNotification?: (mentionName: string) => void;
  disabled?: boolean;
  users?: any[];
  onKeyDown?: (e: any) => void;
  onPaste?: (e: any) => void;
  onInput?: (e: any) => void;
  style?: React.CSSProperties;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className = "w-full bg-transparent text-blue-700 print:text-black font-semibold text-xs focus:bg-amber-50 focus:outline-none",
  customMentions,
  onShowNotification,
  disabled = false,
  onKeyDown,
  onPaste,
  onInput,
  style,
}: MentionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const mentionList = customMentions && customMentions.length > 0 ? customMentions : DEFAULT_MENTION_ITEMS;

  const filteredMentions = mentionList.filter((m) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.detail && m.detail.toLowerCase().includes(q));
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    onChange(val);
    setCursorPos(pos);

    const textBefore = val.slice(0, pos);
    const match = textBefore.match(/@([a-zA-Z0-9_À-ỹ. -]*)$/);

    if (match) {
      setFilterQuery(match[1]);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectMention = (item: MentionItem) => {
    if (!inputRef.current) return;
    const pos = inputRef.current.selectionStart || cursorPos;
    const textBefore = value.slice(0, pos);
    const textAfter = value.slice(pos);

    const lastAtIndex = textBefore.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const newTextBefore = textBefore.slice(0, lastAtIndex) + "@" + item.name + " ";
      const newValue = newTextBefore + textAfter;
      onChange(newValue);

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newCursor = newTextBefore.length;
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 50);
    }

    setIsOpen(false);
    if (onShowNotification) {
      onShowNotification(item.name);
    }
  };

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(ev.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(ev.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onInput={onInput}
        style={style}
      />

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-50 mt-1 left-0 w-72 bg-white border border-slate-300 rounded-xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 no-print"
        >
          <div className="px-2 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
            <span className="flex items-center gap-1">
              <AtSign className="w-3 h-3 text-indigo-600" />
              <span translate="no" className="notranslate">TAG NGƯỜI / BỘ PHẬN</span>
            </span>
          </div>

          <div className="max-h-44 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredMentions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
                Không tìm thấy "{filterQuery}"
              </div>
            ) : (
              filteredMentions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectMention(item)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-indigo-50/80 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.type === "person" ? (
                      <span className="p-1 bg-blue-100 text-blue-700 rounded-md">
                        <UserCheck className="w-3 h-3 shrink-0" />
                      </span>
                    ) : (
                      <span className="p-1 bg-amber-100 text-amber-800 rounded-md">
                        <Building className="w-3 h-3 shrink-0" />
                      </span>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                        <span translate="no" className="notranslate">@{item.name}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
