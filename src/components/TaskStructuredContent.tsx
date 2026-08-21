import React from "react";
import { T } from "./TranslateText";

interface TaskStructuredContentProps {
  text: string;
  type?: "DIRECTIVE" | "TASK";
}

export const TaskStructuredContent: React.FC<TaskStructuredContentProps> = ({ text, type }) => {
  if (!text) return null;

  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div className="text-xs text-slate-700 space-y-1 my-1">
      {lines.map((line, idx) => {
        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•") || /^\d+\./.test(line.trim());
        return (
          <div key={idx} className={`leading-relaxed ${isBullet ? "pl-2 font-medium" : ""}`}>
            <span translate="no" className="notranslate">{line}</span>
          </div>
        );
      })}
    </div>
  );
};
