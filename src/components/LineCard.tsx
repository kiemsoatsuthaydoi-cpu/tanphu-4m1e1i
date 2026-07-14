import React from 'react';
import { Play, AlertTriangle, AlertOctagon, RefreshCw, User, BarChart2 } from 'lucide-react';
import { ProductionLine, LineStatus } from '../types';

interface LineCardProps {
  line: ProductionLine;
  onStatusChange: (lineId: string, newStatus: LineStatus, category?: any) => void;
  onOpenTriggerModal: (line: ProductionLine) => void;
}

export const LineCard: React.FC<LineCardProps> = ({ line, onStatusChange, onOpenTriggerModal }) => {
  const outputProgress = line.targetOutput > 0 ? Math.round((line.actualOutput / line.targetOutput) * 100) : 0;

  // Visual status configurations
  const statusConfig = {
    normal: {
      bg: 'bg-slate-900 border-emerald-800/40 hover:border-emerald-700/60 shadow-emerald-950/10',
      badgeBg: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
      label: 'Đang Vận Hành',
      lightRed: 'bg-red-950 text-red-900/30',
      lightYellow: 'bg-yellow-950 text-yellow-900/30',
      lightGreen: 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/50 animate-pulse',
    },
    warning: {
      bg: 'bg-slate-900 border-amber-800/50 hover:border-amber-700/60 shadow-amber-950/10',
      badgeBg: 'bg-amber-950/40 border-amber-800/60 text-amber-400',
      label: 'Cảnh Báo / Bảo Trì',
      lightRed: 'bg-red-950 text-red-900/30',
      lightYellow: 'bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/50 animate-pulse',
      lightGreen: 'bg-emerald-950 text-emerald-900/30',
    },
    stopped: {
      bg: 'bg-slate-900 border-red-800/60 hover:border-red-700/60 shadow-red-950/20',
      badgeBg: 'bg-red-950/40 border-red-800/60 text-red-400 animate-pulse',
      label: 'ĐÃ DỪNG KHẨN CẤP',
      lightRed: 'bg-red-500 text-red-950 shadow-lg shadow-red-500/50 animate-ping-once', // Custom animated red stack light
      lightYellow: 'bg-yellow-950 text-yellow-900/30',
      lightGreen: 'bg-emerald-950 text-emerald-900/30',
    },
  };

  const config = statusConfig[line.status];

  return (
    <div className={`border rounded-xl p-5 transition-all shadow-md flex flex-col justify-between h-full ${config.bg}`}>
      {/* Upper info: Line name, Manager, Tower light */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-100 tracking-tight">
              {line.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <User className="h-3.5 w-3.5" />
              <span>Quản lý: {line.manager}</span>
            </div>
          </div>

          {/* Physical Andon Stack Light Visualization */}
          <div className="flex flex-col gap-0.5 bg-slate-950 p-1.5 rounded-md border border-slate-800 shadow-inner">
            {/* Red Light */}
            <div 
              className={`h-4 w-7 rounded-sm flex items-center justify-center font-mono text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${
                line.status === 'stopped' ? 'bg-red-500 text-red-950 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-red-950/40 text-red-900/30'
              }`}
              title="Red Light: Stop / Emergency"
            >
              R
            </div>
            {/* Yellow Light */}
            <div 
              className={`h-4 w-7 rounded-sm flex items-center justify-center font-mono text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${
                line.status === 'warning' ? 'bg-amber-500 text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-amber-950/40 text-amber-900/30'
              }`}
              title="Yellow Light: Warning / Call"
            >
              Y
            </div>
            {/* Green Light */}
            <div 
              className={`h-4 w-7 rounded-sm flex items-center justify-center font-mono text-[9px] font-black tracking-widest uppercase transition-all duration-300 ${
                line.status === 'normal' ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-emerald-950/40 text-emerald-900/30'
              }`}
              title="Green Light: Running OK"
            >
              G
            </div>
          </div>
        </div>

        {/* Current status banner */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold mb-5 ${config.badgeBg}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${
            line.status === 'normal' ? 'bg-emerald-400' : line.status === 'warning' ? 'bg-amber-400' : 'bg-red-500 animate-ping'
          }`}></span>
          <span>{config.label}</span>
        </div>

        {/* Yield Output target and progress bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Sản lượng (Yield):</span>
            <span className="text-slate-200 font-bold">
              {line.actualOutput} / {line.targetOutput} ({outputProgress}%)
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/40">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                outputProgress >= 90 ? 'bg-emerald-500' : outputProgress >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(outputProgress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Interactive Quick-Action controls */}
      <div className="border-t border-slate-800/80 pt-4 mt-auto">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">BẢNG ĐIỀU KHIỂN NHANH</p>
        <div className="grid grid-cols-3 gap-2">
          {/* Normal Action button */}
          <button
            onClick={() => onStatusChange(line.id, 'normal')}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold border transition-all ${
              line.status === 'normal' 
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400 font-extrabold shadow-inner' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Play className={`h-4 w-4 ${line.status === 'normal' ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            <span>Chạy OK</span>
          </button>

          {/* Warning / Call Action button */}
          <button
            onClick={() => onStatusChange(line.id, 'warning')}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold border transition-all ${
              line.status === 'warning' 
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-400 font-extrabold shadow-inner' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Yêu Cầu</span>
          </button>

          {/* Stop / Alarm button */}
          <button
            onClick={() => onOpenTriggerModal(line)}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold border transition-all ${
              line.status === 'stopped' 
                ? 'bg-red-950/50 border-red-500/50 text-red-400 font-extrabold shadow-inner' 
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-red-950/20 hover:border-red-900/60 hover:text-red-300'
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
            <span>BÁO SỰ CỐ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
