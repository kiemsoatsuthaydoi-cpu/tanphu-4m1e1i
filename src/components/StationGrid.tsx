import { useState } from 'react';
import { 
  ProductionLine, 
  AndonStation, 
  AndonTicket 
} from '../types/andon';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  User, 
  Gauge, 
  Layers, 
  TrendingUp,
  Clock,
  Radio,
  Zap
} from 'lucide-react';

interface StationGridProps {
  lines: ProductionLine[];
  tickets: AndonTicket[];
  onSelectStation: (station: AndonStation, line: ProductionLine) => void;
  onOpenTicketDetail: (ticket: AndonTicket) => void;
}

export const StationGrid = ({
  lines,
  tickets,
  onSelectStation,
  onOpenTicketDetail
}: StationGridProps) => {
  const [filterLineId, setFilterLineId] = useState<string>('all');

  const filteredLines = filterLineId === 'all' 
    ? lines 
    : lines.filter(l => l.id === filterLineId);

  // Helper for Andon Light Tower visual
  const renderTower = (status: AndonStation['status']) => {
    return (
      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-full border border-slate-800 shadow-inner">
        {/* Red light */}
        <div 
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            status === 'ALERT' 
              ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse scale-110' 
              : 'bg-red-950/40 opacity-40'
          }`} 
        />
        {/* Yellow light */}
        <div 
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            status === 'WARNING' 
              ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse scale-110' 
              : 'bg-amber-950/40 opacity-40'
          }`} 
        />
        {/* Green light */}
        <div 
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            status === 'NORMAL' 
              ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
              : 'bg-emerald-950/40 opacity-40'
          }`} 
        />
        {/* Blue light (Maintenance) */}
        <div 
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            status === 'MAINTENANCE' 
              ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse' 
              : 'bg-blue-950/40 opacity-40'
          }`} 
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">First Pass Yield (FPY)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">97.2%</span>
            <span className="text-xs text-emerald-400 font-medium">+0.4% so với hôm qua</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tỷ lệ đạt chuẩn ngay lần may đầu</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Sự cố Andon đang mở</span>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-400">
              {tickets.filter(t => t.status !== 'RESOLVED').length}
            </span>
            <span className="text-xs text-slate-400">trên 3 chuyền</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">MTTR trung bình: 4.8 phút</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">OEE Hiệu suất tổng thể</span>
            <Gauge className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-300">91.5%</span>
            <span className="text-xs text-blue-400 font-medium">Mục tiêu: &gt; 85%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Availability: 94% • Quality: 98%</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">QC Tự chủ (Mỗi CN 1 QC)</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-yellow-300">100%</span>
            <span className="text-xs text-emerald-400 font-medium">9 trạm phủ sóng</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Đã cấp quyền dừng chuyền tự chủ</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterLineId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterLineId === 'all'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tất cả chuyền ({lines.length})
          </button>
          {lines.map(line => (
            <button
              key={line.id}
              onClick={() => setFilterLineId(line.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filterLineId === line.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{line.name.split('-')[0]}</span>
              {line.stations.some(s => s.status === 'ALERT') && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Bình thường</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cảnh báo</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Dừng Andon</span>
        </div>
      </div>

      {/* Production Lines and Workstations */}
      <div className="space-y-6">
        {filteredLines.map(line => (
          <div key={line.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            
            {/* Line Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {line.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {line.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quản lý: <span className="text-slate-300 font-medium">{line.manager}</span> • {line.shift}
                  </p>
                </div>
              </div>

              {/* Line stats */}
              <div className="flex items-center gap-3 sm:gap-6 text-xs">
                <div className="text-right">
                  <p className="text-slate-400">FPY Chuyền</p>
                  <p className="font-bold text-emerald-400 text-sm">{line.fpy}%</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">OEE</p>
                  <p className="font-bold text-blue-400 text-sm">{line.oee}%</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400">Trạng thái</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                    line.status === 'RUNNING' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                  }`}>
                    {line.status === 'RUNNING' ? 'ĐANG CHẠY' : 'CÓ SỰ CỐ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stations in this line */}
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {line.stations.map((station, index) => {
                const activeTicket = tickets.find(t => t.id === station.activeAlertId || (t.stationId === station.id && t.status !== 'RESOLVED'));
                
                return (
                  <div
                    key={station.id}
                    onClick={() => onSelectStation(station, line)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                      station.status === 'ALERT'
                        ? 'bg-red-950/30 border-red-500/70 shadow-lg shadow-red-500/10 hover:border-red-400'
                        : station.status === 'WARNING'
                        ? 'bg-amber-950/30 border-amber-500/70 hover:border-amber-400'
                        : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    
                    {/* Top row: Name & Tower */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                            #{index + 1} • {station.code}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-1 group-hover:text-blue-300 transition-colors">
                            {station.name}
                          </h4>
                        </div>
                        {renderTower(station.status)}
                      </div>

                      {/* Worker info */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-3 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-medium truncate">{station.workerName}</span>
                        <span className="text-[10px] text-slate-400 ml-auto font-mono">{station.workerCode}</span>
                      </div>

                      {/* Station KPIs */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">Takt Time</span>
                          <span className="font-bold text-slate-200">{station.taktTimeSec}s</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">Sản lượng / Mục tiêu</span>
                          <span className="font-bold text-slate-200">{station.outputToday}/{station.targetToday}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status / Active Alert pill */}
                    <div className="pt-2 border-t border-slate-800/60">
                      {activeTicket ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTicketDetail(activeTicket);
                          }}
                          className="w-full text-left p-2 rounded-lg bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 text-[11px] text-red-300 font-bold">
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse flex-shrink-0" />
                            <span className="truncate">{activeTicket.title}</span>
                          </div>
                          <span className="text-[10px] text-red-200/80 block mt-0.5">
                            Bấm xem xử lý 5-Why & Biện pháp
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn chất lượng
                          </span>
                          <span className="text-[10px]">Lỗi: {station.defectCountToday}</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
