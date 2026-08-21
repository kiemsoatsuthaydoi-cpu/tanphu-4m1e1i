import React from "react";
import { User } from "../types";
import { formatNameCapitalized } from "./branchHelpers";

export interface FormattedMessageOptions {
  isMe?: boolean;
  users?: User[];
  onOpenDirectChat?: (user: User | { fullName: string; phone?: string; id?: string }) => void;
}

/**
 * Parses and renders rich formatted chat message text including:
 * - @mentions with colored badges
 * - **bold** or <b>bold</b>
 * - *italic* or <i>italic</i>
 * - <u>underline</u>
 * - ==highlight== or [highlight]text[/highlight]
 * - [size=L]large text[/size], [size=S]small text[/size]
 * - [color=red/blue/green/amber]colored text[/color]
 */
export function renderFormattedMessage(
  text: string | undefined | null,
  options: FormattedMessageOptions = {}
): React.ReactNode {
  if (!text || typeof text !== "string") {
    return "";
  }

  const { isMe = false, users = [], onOpenDirectChat } = options;

  // Step 1: Parse @mentions
  const candidatesSet = new Set<string>();
  if (users && users.length > 0) {
    users.forEach((u) => {
      if (u.fullName && u.fullName.trim()) {
        candidatesSet.add(u.fullName.trim());
        const parts = u.fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          candidatesSet.add(parts.slice(-2).join(" "));
        }
        if (parts[parts.length - 1].length >= 2) {
          candidatesSet.add(parts[parts.length - 1]);
        }
      }
      if (u.department && u.department.trim()) {
        candidatesSet.add(u.department.trim());
        const cleanDept = u.department.replace(/^Phòng\s+/i, "").trim();
        if (cleanDept.length >= 2) candidatesSet.add(cleanDept);
      }
      if (u.id && u.id.trim()) candidatesSet.add(u.id.trim());
    });
  }

  candidatesSet.add("Tất cả");
  candidatesSet.add("All");
  candidatesSet.add("Mọi người");
  candidatesSet.add("Ban Giám Đốc");
  candidatesSet.add("QLCL");
  candidatesSet.add("QC");
  candidatesSet.add("R&D");

  const candidates = Array.from(candidatesSet).sort((a, b) => b.length - a.length);

  type TextToken = 
    | { type: "text"; value: string }
    | { type: "mention"; name: string; fullTag: string }
    | { type: "bold"; value: string }
    | { type: "italic"; value: string }
    | { type: "underline"; value: string }
    | { type: "highlight"; value: string }
    | { type: "size"; size: "S" | "L" | "M"; value: string }
    | { type: "color"; color: string; value: string };

  // Parse inline text tokens (rich tags + mentions)
  // Let's parse with a regular expression tokenizer
  const combinedRegex = /(@[\p{L}\w\-_]+(?:\s+[\p{L}\w\-_]+)*|\*\*([^*]+)\*\*|<b>(.*?)<\/b>|\*([^*]+)\*|<i>(.*?)<\/i>|<u>(.*?)<\/u>|==([^=]+)==|\[size=(S|L|M)\]([\s\S]*?)\[\/size\]|\[color=([a-zA-Z0-9#]+)\]([\s\S]*?)\[\/color\])/gu;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const fullMatch = match[0];

    if (fullMatch.startsWith("@")) {
      // Mention tag
      const rawTag = fullMatch;
      const cleanName = rawTag.substring(1).trim();
      const matchedUser = users.find(
        (u) =>
          u.fullName.toLowerCase() === cleanName.toLowerCase() ||
          u.fullName.toLowerCase().endsWith(cleanName.toLowerCase()) ||
          (u.id && u.id.toLowerCase() === cleanName.toLowerCase())
      );

      const formattedName = matchedUser?.fullName 
        ? formatNameCapitalized(matchedUser.fullName) 
        : formatNameCapitalized(cleanName);

      parts.push(
        <span
          key={`mention-${match.index}`}
          onClick={(e) => {
            if (matchedUser && onOpenDirectChat) {
              e.stopPropagation();
              onOpenDirectChat(matchedUser);
            }
          }}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md font-bold text-[13px] mx-0.5 transition-all select-none ${
            isMe
              ? "bg-blue-200/70 text-blue-800 border border-blue-300/80 hover:bg-blue-200"
              : "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200/80"
          } ${matchedUser && onOpenDirectChat ? "cursor-pointer hover:underline" : ""}`}
          title={matchedUser ? `Bấm để nhắn tin 1:1 với ${formatNameCapitalized(matchedUser.fullName)}` : `Được nhắc đến: ${formattedName}`}
        >
          <span translate="no" className="notranslate">@{formattedName}</span>
        </span>
      );
    } else if (fullMatch.startsWith("**") && fullMatch.endsWith("**")) {
      // Bold Markdown
      const content = match[2];
      parts.push(
        <strong key={`bold-${match.index}`} className="font-extrabold">
          {content}
        </strong>
      );
    } else if (fullMatch.startsWith("<b>") && fullMatch.endsWith("</b>")) {
      // Bold HTML
      const content = match[3];
      parts.push(
        <strong key={`bold-html-${match.index}`} className="font-extrabold">
          {content}
        </strong>
      );
    } else if (fullMatch.startsWith("*") && fullMatch.endsWith("*")) {
      // Italic Markdown
      const content = match[4];
      parts.push(
        <em key={`italic-${match.index}`} className="italic">
          {content}
        </em>
      );
    } else if (fullMatch.startsWith("<i>") && fullMatch.endsWith("</i>")) {
      // Italic HTML
      const content = match[5];
      parts.push(
        <em key={`italic-html-${match.index}`} className="italic">
          {content}
        </em>
      );
    } else if (fullMatch.startsWith("<u>") && fullMatch.endsWith("</u>")) {
      // Underline
      const content = match[6];
      parts.push(
        <span key={`underline-${match.index}`} className="underline decoration-1 underline-offset-2 font-medium">
          {content}
        </span>
      );
    } else if (fullMatch.startsWith("==") && fullMatch.endsWith("==")) {
      // Highlight
      const content = match[7];
      parts.push(
        <mark
          key={`mark-${match.index}`}
          className={`px-1 py-0.5 rounded font-semibold ${
            isMe ? "bg-amber-200 text-amber-950 border border-amber-300" : "bg-amber-100 text-amber-900 border border-amber-300"
          }`}
        >
          {content}
        </mark>
      );
    } else if (fullMatch.startsWith("[size=")) {
      // Font Size
      const sizeTag = match[8] as "S" | "L" | "M";
      const content = match[9];
      const sizeClass =
        sizeTag === "L"
          ? "text-[17px] font-medium"
          : sizeTag === "S"
          ? "text-[12.5px]"
          : "text-[15px]";
      parts.push(
        <span key={`size-${match.index}`} className={sizeClass}>
          {content}
        </span>
      );
    } else if (fullMatch.startsWith("[color=")) {
      // Color Tag
      const colorVal = match[10];
      const content = match[11];
      let colorClass = "";
      if (colorVal === "red") colorClass = isMe ? "text-rose-700 font-bold" : "text-rose-600 font-bold";
      else if (colorVal === "blue") colorClass = isMe ? "text-blue-700 font-bold" : "text-blue-600 font-bold";
      else if (colorVal === "green") colorClass = isMe ? "text-emerald-700 font-bold" : "text-emerald-600 font-bold";
      else if (colorVal === "amber" || colorVal === "yellow") colorClass = isMe ? "text-amber-800 font-bold" : "text-amber-700 font-bold";
      else colorClass = isMe ? "text-slate-900 font-bold" : "text-slate-900 font-bold";

      parts.push(
        <span key={`color-${match.index}`} className={colorClass}>
          {content}
        </span>
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
