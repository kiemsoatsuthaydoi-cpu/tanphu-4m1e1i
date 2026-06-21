import React, { useState, useEffect, useRef } from "react";
import { User, UserRole } from "../types";
import { T } from "./TranslateText";

// Accent remover helper for intuitive Vietnamese typing
export function removeVietnameseTones(str: string): string {
  let res = str;
  res = res.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  res = res.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  res = res.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  res = res.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  res = res.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  res = res.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  res = res.replace(/đ/g, "d");
  res = res.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  res = res.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  res = res.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  res = res.replace(/Ò|Ó|Ọ|Ỏ|Ỗ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  res = res.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  res = res.replace(/Ỳ|Ý|Y|Ỷ|Ỹ/g, "Y");
  res = res.replace(/Đ/g, "D");
  res = res.replace(/\u0300|\u0301|\u0309|\u0303|\u0323/g, ""); 
  res = res.replace(/\u02C6|\u0306|\u031B/g, ""); 
  return res;
}

interface MentionControlsProps {
  users?: User[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  style?: React.CSSProperties;
  name?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void;
}

export function MentionTextArea({
  users = [],
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
  style,
  name,
  onKeyDown,
  onInput
}: MentionControlsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [annotationStartIdx, setAnnotationStartIdx] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter active users on matching searchQuery
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const normalizedName = removeVietnameseTones(u.fullName.toLowerCase());
    const normalizedDept = removeVietnameseTones((u.department || "").toLowerCase());
    const normalizedQuery = removeVietnameseTones(searchQuery.toLowerCase());
    return normalizedName.includes(normalizedQuery) || normalizedDept.includes(normalizedQuery);
  }).slice(0, 8); // Top 8 suggestions

  const handleSelectUser = (user: User) => {
    if (!textareaRef.current) return;
    const cursorPosition = textareaRef.current.selectionStart || 0;
    const textBefore = value.slice(0, annotationStartIdx);
    const textAfter = value.slice(cursorPosition);

    const tag = `@${user.fullName} `;
    const newValue = textBefore + tag + textAfter;

    onChange(newValue);
    setShowDropdown(false);

    // Reposition cursor immediately
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextCursor = textBefore.length + tag.length;
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, selectionStart);
    const match = textBeforeCursor.match(/@([^@\s]*)$/);

    if (match) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf("@");
      setAnnotationStartIdx(atIndex);
      setSearchQuery(query);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectUser(filteredUsers[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onInput={onInput}
        rows={rows}
        className={className}
        style={style}
      />

      {showDropdown && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 max-h-48 overflow-y-auto bg-white border border-slate-250 rounded-xl shadow-xl z-[999999] p-1.5 space-y-0.5"
        >
          <div className="px-2 py-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-50 mb-1">
            <T><span translate="no" className="notranslate">Nhấn phím lên/xuống & Enter để Tag nhanh:</span></T>
          </div>
          {filteredUsers.map((u, i) => (
            <button
              key={u.id || i}
              type="button"
              onClick={() => handleSelectUser(u)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-lg transition-all ${
                i === selectedIndex
                  ? "bg-amber-100 text-amber-900 font-semibold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center ${
                i === selectedIndex ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                <span translate="no" className="notranslate">
                  {u.fullName.split(" ").pop()?.slice(0, 2).toUpperCase() || "NV"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">
                  <span translate="no" className="notranslate">{u.fullName}</span>
                </div>
                <div className="text-[9px] opacity-75 truncate">
                  <span translate="no" className="notranslate">
                    {u.department || "QC"} • {u.role === UserRole.ADMIN ? "Quản trị" : u.role}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MentionInputProps {
  users?: User[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  type?: string;
}

export function MentionInput({
  users = [],
  value,
  onChange,
  placeholder,
  className,
  style,
  name,
  type = "text"
}: MentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [annotationStartIdx, setAnnotationStartIdx] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const normalizedName = removeVietnameseTones(u.fullName.toLowerCase());
    const normalizedDept = removeVietnameseTones((u.department || "").toLowerCase());
    const normalizedQuery = removeVietnameseTones(searchQuery.toLowerCase());
    return normalizedName.includes(normalizedQuery) || normalizedDept.includes(normalizedQuery);
  }).slice(0, 8);

  const handleSelectUser = (user: User) => {
    if (!inputRef.current) return;
    const cursorPosition = inputRef.current.selectionStart || 0;
    const textBefore = value.slice(0, annotationStartIdx);
    const textAfter = value.slice(cursorPosition);

    const tag = `@${user.fullName} `;
    const newValue = textBefore + tag + textAfter;

    onChange(newValue);
    setShowDropdown(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextCursor = textBefore.length + tag.length;
        inputRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    const selectionStart = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, selectionStart);
    const match = textBeforeCursor.match(/@([^@\s]*)$/);

    if (match) {
      const query = match[1];
      const atIndex = textBeforeCursor.lastIndexOf("@");
      setAnnotationStartIdx(atIndex);
      setSearchQuery(query);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectUser(filteredUsers[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={className}
        style={style}
      />

      {showDropdown && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 bottom-full mb-1 sm:bottom-auto sm:top-full sm:mt-1 max-h-48 overflow-y-auto bg-white border border-slate-250 rounded-xl shadow-xl z-[999999] p-1.5 space-y-0.5"
        >
          <div className="px-2 py-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-50 mb-1">
            <T><span translate="no" className="notranslate">Nhấn phím lên/xuống & Enter để Tag nhanh:</span></T>
          </div>
          {filteredUsers.map((u, i) => (
            <button
              key={u.id || i}
              type="button"
              onClick={() => handleSelectUser(u)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-lg transition-all ${
                i === selectedIndex
                  ? "bg-amber-100 text-amber-900 font-semibold"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center ${
                i === selectedIndex ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                <span translate="no" className="notranslate">
                  {u.fullName.split(" ").pop()?.slice(0, 2).toUpperCase() || "NV"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">
                  <span translate="no" className="notranslate">{u.fullName}</span>
                </div>
                <div className="text-[9px] opacity-75 truncate">
                  <span translate="no" className="notranslate">
                    {u.department || "QC"} • {u.role === UserRole.ADMIN ? "Quản trị" : u.role}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
