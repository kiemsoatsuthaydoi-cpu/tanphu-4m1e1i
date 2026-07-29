import React from 'react';
import { Activity, AlertOctagon, AlertTriangle, CheckCircle2, ShieldCheck, Clock, Zap } from 'lucide-react';
import { ProductionLine, AndonTicket } from '../types';

interface AndonBoardViewProps {
  lines: ProductionLine[];
  tickets: AndonTicket[];
  onSelectLine: (lineId: string) => void;
}

export const AndonBoardView: React.FC<AndonBoardViewProps> = ({
  lines,
  tickets,
  onSelectLine
}) => {
  const activeTickets = tickets.filter(t => t.status !== 'CLOSED');

  const getLineActiveTicket = (lineId: string) => {
    return activeTickets.find(t => t.lineId === lineId && t.severity === 'CRITICAL') ||
           activeTickets.find(t => t.lineId === lineId);
  };

  return (
    <div className="space-y-6">
      {/* Shopfloor Big Display Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-xl font-black tracking-wide text-white">BẢNG ĐÈN ĐIỆN TỬ ANDON NHÀ XƯỞNG</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Giám sát trạng thái hoạt động thời gian thực của toàn bộ các dây chuyền sản xuất</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300 font-medium">Bình Thường</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300 font-medium">Cảnh Báo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
              <span className="text-slate-300 font-medium">Dừng Dây Chuyền</span>
            </div>
          </div>
        </div>

        {/* Lines Status Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lines.map((line) => {
            const activeTicket = getLineActiveTicket(line.id);
            const isStopped = line.status === 'STOPPED';
            const isWarning = line.status === 'WARNING';

            return (
              <div
                key={line.id}
                onClick={() => onSelectLine(line.id)}
                className={`rounded-2xl border p-5 transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isStopped
                    ? 'bg-rose-950/80 border-rose-500 shadow-2xl shadow-rose-950/80 animate-pulse'
                    : isWarning
                    ? 'bg-amber-950/80 border-amber-500 shadow-xl shadow-amber-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Status Lamp Top Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-mono font-extrabold text-amber-400 bg-black/40 px-2 py-0.5 rounded">
                      {line.code}
                    </span>
                    <h3 className="font-bold text-base text-white mt-1">{line.name}</h3>
                    <p className="text-[11px] text-slate-400">{line.workshop}</p>
                  </div>

                  {/* 3-Color Andon Tower Lamp */}
                  <div className="bg-slate-900 border border-slate-700 p-1 rounded-full flex flex-col gap-1 shadow-inner">
                    <div className={`w-4 h-4 rounded-full transition ${isStopped ? 'bg-rose-500 shadow-lg shadow-rose-500/80 animate-ping' : 'bg-rose-950/60'}`}></div>
                    <div className={`w-4 h-4 rounded-full transition ${isWarning ? 'bg-amber-400 shadow-lg shadow-amber-400/80' : 'bg-amber-950/60'}`}></div>
                    <div className={`w-4 h-4 rounded-full transition ${line.status === 'NORMAL' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80' : 'bg-emerald-950/60'}`}></div>
                  </div>
                </div>

                {/* Production Metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center text-xs my-2">
                  <div>
                    <p className="text-[10px] text-slate-400">Mục Tiêu</p>
                    <p className="font-extrabold text-white">{line.targetQty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Thực Tế</p>
                    <p className="font-extrabold text-emerald-400">{line.actualQty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Lỗi (Defect)</p>
                    <p className={`font-extrabold ${line.defectQty > 10 ? 'text-rose-400' : 'text-amber-300'}`}>
                      {line.defectQty}
                    </p>
                  </div>
                </div>

                {/* Active Ticket Banner on Line */}
                {activeTicket ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span className="flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                        {activeTicket.ticketCode}
                      </span>
                      <span>{activeTicket.category}</span>
                    </div>
                    <p className="font-semibold text-white line-clamp-1">{activeTicket.title}</p>
                    <p className="text-[10px] text-slate-400">Trạm: {activeTicket.stationName}</p>
                  </div>
                ) : (
                  <div className="mt-2 py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Dây chuyền thông suốt
                    </span>
                    <span className="text-[10px] opacity-80">{line.activeOperatorCount} công nhân</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
