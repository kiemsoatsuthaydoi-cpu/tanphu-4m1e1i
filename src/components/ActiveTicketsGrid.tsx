import React, { useState } from 'react';
import { Clock, UserCheck, Wrench, CheckCircle, AlertOctagon, AlertTriangle, Shield, ArrowRight, Eye, Sparkles } from 'lucide-react';
import { AndonTicket, Role, TicketStatus } from '../types';

interface ActiveTicketsGridProps {
  tickets: AndonTicket[];
  role: Role;
  onUpdateStatus: (ticketId: string, status: TicketStatus, payload?: Partial<AndonTicket>) => void;
  onSelectTicket: (ticket: AndonTicket) => void;
}

export const ActiveTicketsGrid: React.FC<ActiveTicketsGridProps> = ({
  tickets,
  role,
  onUpdateStatus,
  onSelectTicket
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    if (sev === 'CRITICAL') {
      return (
        <span className="bg-rose-950 text-rose-300 border border-rose-600/80 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> CRITICAL (Dừng máy)
        </span>
      );
    }
    return (
      <span className="bg-amber-950 text-amber-300 border border-amber-600/80 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> WARNING (Cảnh báo)
      </span>
    );
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">MỚI TẠO</span>;
      case 'ACKNOWLEDGED':
        return <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded">ĐÃ XÁC NHẬN</span>;
      case 'IN_PROGRESS':
        return <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">ĐANG XỬ LÝ</span>;
      case 'RESOLVED':
        return <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">ĐÃ KHẮC PHỤC</span>;
      case 'CLOSED':
        return <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">ĐÃ ĐÓNG (QC PASS)</span>;
    }
  };

  const calculateDowntime = (reportedAtStr: string, resolvedAtStr?: string) => {
    const start = new Date(reportedAtStr).getTime();
    const end = resolvedAtStr ? new Date(resolvedAtStr).getTime() : Date.now();
    const diffMinutes = Math.floor((end - start) / (1000 * 60));
    return diffMinutes;
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Trạng Thái Ticket:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 text-white border border-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-medium"
            >
              <option value="ALL">Tất cả trạng thái ({tickets.length})</option>
              <option value="NEW">Mới tạo ({tickets.filter(t => t.status === 'NEW').length})</option>
              <option value="ACKNOWLEDGED">Đã xác nhận ({tickets.filter(t => t.status === 'ACKNOWLEDGED').length})</option>
              <option value="IN_PROGRESS">Đang xử lý ({tickets.filter(t => t.status === 'IN_PROGRESS').length})</option>
              <option value="RESOLVED">Đã khắc phục ({tickets.filter(t => t.status === 'RESOLVED').length})</option>
              <option value="CLOSED">Đã đóng ({tickets.filter(t => t.status === 'CLOSED').length})</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Phân Loại Sự Cố:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-950 text-white border border-slate-700 text-xs rounded-lg px-3 py-1.5 outline-none font-medium"
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="QUALITY">Lỗi Chất Lượng (Quality)</option>
              <option value="EQUIPMENT">Hỏng Máy (Equipment)</option>
              <option value="MATERIAL">Thiếu Vật Tư (Material)</option>
              <option value="SAFETY">An Toàn (Safety)</option>
              <option value="METHOD">Quy Trình (Method)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Đang hiển thị <strong className="text-white">{filteredTickets.length}</strong> / {tickets.length} cảnh báo
        </div>
      </div>

      {/* Grid of Ticket Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((t) => {
          const downtime = calculateDowntime(t.reportedAt, t.resolvedAt);

          return (
            <div
              key={t.id}
              className={`bg-slate-900 rounded-xl border transition shadow-lg flex flex-col justify-between overflow-hidden relative ${
                t.severity === 'CRITICAL' && t.status !== 'CLOSED'
                  ? 'border-rose-600/80 hover:border-rose-500'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header of card */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 font-mono tracking-wider">{t.ticketCode}</span>
                    {getStatusBadge(t.status)}
                  </div>
                  {getSeverityBadge(t.severity)}
                </div>

                <div>
                  <h4 className="font-bold text-white text-base line-clamp-1 group-hover:text-amber-400 transition">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                </div>

                {/* Line & Station Info */}
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Dây chuyền:</span>
                    <strong className="text-amber-300">{t.lineName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Trạm phát hiện:</span>
                    <strong className="text-slate-200">{t.stationName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Người báo lỗi:</span>
                    <span className="text-slate-300 font-medium">{t.reportedBy}</span>
                  </div>
                </div>

                {/* Downtime & SLA */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Downtime:</span>
                    <strong className={`font-mono font-bold ${downtime > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {downtime} phút
                    </strong>
                  </div>

                  {t.assignedTo && (
                    <div className="text-[11px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                      🔧 {t.assignedTo}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectTicket(t)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  Xem 5-Why & AI RCA
                </button>

                {/* Status Advancement Buttons */}
                <div className="flex items-center gap-1">
                  {t.status === 'NEW' && (role === 'SUPERVISOR' || role === 'QC_INSPECTOR' || role === 'OPERATOR') && (
                    <button
                      onClick={() => onUpdateStatus(t.id, 'ACKNOWLEDGED', { acknowledgedBy: 'Tổ Trưởng Trực' })}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Xác Nhận
                    </button>
                  )}

                  {t.status === 'ACKNOWLEDGED' && (role === 'MAINTENANCE' || role === 'SUPERVISOR') && (
                    <button
                      onClick={() => onUpdateStatus(t.id, 'IN_PROGRESS', { assignedTo: 'Kỹ Thuật Ca' })}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Sửa Máy
                    </button>
                  )}

                  {t.status === 'IN_PROGRESS' && (role === 'MAINTENANCE' || role === 'SUPERVISOR') && (
                    <button
                      onClick={() => onUpdateStatus(t.id, 'RESOLVED', { resolutionSummary: 'Đã hoàn tất sửa chữa & chạy thử pass' })}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Khắc Phục Xong
                    </button>
                  )}

                  {t.status === 'RESOLVED' && (role === 'QC_INSPECTOR' || role === 'SUPERVISOR') && (
                    <button
                      onClick={() => onUpdateStatus(t.id, 'CLOSED')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      QC Nghiệm Thu
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTickets.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <Sparkles className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="font-bold text-lg text-white">Không có sự cố nào thuộc bộ lọc hiện tại</p>
          <p className="text-xs text-slate-400">Dây chuyền đang hoạt động ổn định hoặc tất cả ticket đã được xử lý.</p>
        </div>
      )}
    </div>
  );
};
