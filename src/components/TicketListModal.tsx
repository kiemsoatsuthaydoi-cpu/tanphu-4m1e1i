import { useState } from 'react';
import { 
  AndonTicket, 
  AlertStatus, 
  AlertSeverity 
} from '../types/andon';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  Package, 
  HelpCircle, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { andonSound } from '../utils/audioAlert';
import confetti from 'canvas-confetti';

interface TicketListModalProps {
  tickets: AndonTicket[];
  onUpdateTicketStatus: (ticketId: string, status: AlertStatus, responderName?: string, rootCause?: AndonTicket['rootCause5Why']) => void;
  onOpenNewTicket: () => void;
}

export const TicketListModal = ({
  tickets,
  onUpdateTicketStatus,
  onOpenNewTicket
}: TicketListModalProps) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  
  // 5-Why form state
  const [why1, setWhy1] = useState('');
  const [why2, setWhy2] = useState('');
  const [why3, setWhy3] = useState('');
  const [why4, setWhy4] = useState('');
  const [why5, setWhy5] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [responderName, setResponderName] = useState('Phạm Hữu Vinh (Trưởng QC Chuyền)');

  const filteredTickets = tickets.filter(t => {
    if (activeFilter === 'ACTIVE') return t.status !== 'RESOLVED';
    if (activeFilter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || filteredTickets[0];

  const handleResolve = (ticketId: string) => {
    andonSound.playResolvedChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });

    onUpdateTicketStatus(ticketId, 'RESOLVED', responderName, {
      why1: why1 || selectedTicket?.rootCause5Why?.why1 || 'Phát hiện lỗi ngoại quan lệch tiêu chuẩn.',
      why2: why2 || selectedTicket?.rootCause5Why?.why2 || 'Cữ gá hoặc thiết bị bị xê dịch trong ca sản xuất.',
      why3: why3 || selectedTicket?.rootCause5Why?.why3 || 'Rung động cơ học sau thời gian vận hành liên tục.',
      why4: why4 || selectedTicket?.rootCause5Why?.why4 || 'Chưa định kỳ kiểm tra lực siết định vị.',
      why5: why5 || selectedTicket?.rootCause5Why?.why5 || 'Thiếu mục kiểm tra nhanh 5S đầu ca.',
      rootCause: rootCause || selectedTicket?.rootCause5Why?.rootCause || 'Cần chuẩn hóa bước siết ốc cữ may đầu ca làm việc.',
      preventiveAction: preventiveAction || selectedTicket?.rootCause5Why?.preventiveAction || 'Đưa vào checklist QC tự chủ 3 phút đầu giờ và huấn luyện công nhân.'
    });
  };

  const getCategoryIcon = (category: AndonTicket['category']) => {
    switch (category) {
      case 'QUALITY': return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'EQUIPMENT': return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'MATERIAL': return <Package className="w-4 h-4 text-blue-400" />;
      case 'SAFETY': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default: return <HelpCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'ACTIVE'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Đang xử lý ({tickets.filter(t => t.status !== 'RESOLVED').length})
          </button>
          <button
            onClick={() => setActiveFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Đã khắc phục ({tickets.filter(t => t.status === 'RESOLVED').length})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({tickets.length})
          </button>
        </div>

        <button
          onClick={onOpenNewTicket}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-red-600/20 flex items-center gap-1.5"
        >
          <AlertTriangle className="w-4 h-4" />
          Kéo dây Andon mới
        </button>
      </div>

      {/* Main Grid: Ticket List + 5-Why Resolver Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Hàng đợi sự cố Andon ({filteredTickets.length})
          </h3>

          {filteredTickets.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">Không có sự cố nào cần xử lý</p>
              <p className="text-xs text-slate-500 mt-1">Toàn bộ chuyền đang vận hành đạt chuẩn 100% QC Tự Chủ.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500/80 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(ticket.category)}
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {ticket.ticketNumber}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ticket.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                    }`}>
                      {ticket.status === 'RESOLVED' ? 'ĐÃ KHẮC PHỤC' : ticket.status === 'IN_PROGRESS' ? 'ĐANG XỬ LÝ' : 'CHỜ TIẾP NHẬN'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white mt-2 line-clamp-1">
                    {ticket.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {ticket.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                    <span>{ticket.lineName}</span>
                    <span>{ticket.createdAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Ticket Details & 5-Why Root Cause Resolver */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
              
              {/* Top Banner */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-bold">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedTicket.stationName} • {selectedTicket.lineName}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1.5">
                    {selectedTicket.title}
                  </h2>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-block ${
                    selectedTicket.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                  }`}>
                    {selectedTicket.status === 'RESOLVED' ? 'HOÀN TẤT ĐÓNG TICKET' : 'ĐANG MỞ CẢNH BÁO'}
                  </span>
                </div>
              </div>

              {/* Reporter Info & Description */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Người kéo dây Andon: <strong className="text-slate-200">{selectedTicket.reporterName}</strong> ({selectedTicket.reporterRole})</span>
                  <span>Thời gian: {selectedTicket.createdAt}</span>
                </div>
                {selectedTicket.defectType && (
                  <div className="text-red-400 font-medium">
                    Mã lỗi QC: {selectedTicket.defectType}
                  </div>
                )}
                <p className="text-slate-300 text-sm leading-relaxed pt-1">
                  {selectedTicket.description}
                </p>
                {selectedTicket.suggestedAction && (
                  <div className="mt-2 bg-blue-950/40 border border-blue-800/40 p-2.5 rounded-lg text-blue-300 text-xs">
                    <strong>Đề xuất xử lý nhanh:</strong> {selectedTicket.suggestedAction}
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateTicketStatus(selectedTicket.id, 'IN_PROGRESS', responderName)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedTicket.status === 'IN_PROGRESS'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Tiếp nhận & Đến hiện trường
                </button>

                <button
                  type="button"
                  onClick={() => handleResolve(selectedTicket.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 ml-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Khắc phục xong & Đóng Andon
                </button>
              </div>

              {/* 5-Why Root Cause Analysis (Toyota TPS Standard) */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Phân tích nguyên nhân gốc rễ 5-Why (Root Cause Analysis)
                  </h4>
                  <span className="text-[11px] text-slate-500">Chuẩn Lean Six Sigma</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 font-semibold block mb-0.5">Why 1: Tại sao phát sinh lỗi ngoại quan/thông số?</span>
                    <input
                      type="text"
                      placeholder="VD: Bo cổ bị kéo căng lệch khi vào rãnh gá..."
                      defaultValue={selectedTicket.rootCause5Why?.why1 || ''}
                      onChange={(e) => setWhy1(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 font-semibold block mb-0.5">Why 2: Tại sao lại bị kéo căng lệch?</span>
                    <input
                      type="text"
                      placeholder="VD: Cữ dẫn hướng bị lệch 1.5mm do ốc lỏng..."
                      defaultValue={selectedTicket.rootCause5Why?.why2 || ''}
                      onChange={(e) => setWhy2(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 font-semibold block mb-0.5">Why 3: Tại sao ốc bị lỏng?</span>
                    <input
                      type="text"
                      placeholder="VD: Rung động cơ học mô-tơ sau thời gian vận hành dài..."
                      defaultValue={selectedTicket.rootCause5Why?.why3 || ''}
                      onChange={(e) => setWhy3(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 font-semibold block mb-0.5">Gốc rễ (Root Cause) & Biện pháp phòng ngừa (Kaizen):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Nguyên nhân gốc rễ..."
                        defaultValue={selectedTicket.rootCause5Why?.rootCause || ''}
                        onChange={(e) => setRootCause(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Hành động Kaizen phòng ngừa..."
                        defaultValue={selectedTicket.rootCause5Why?.preventiveAction || ''}
                        onChange={(e) => setPreventiveAction(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              Chọn một sự cố từ danh sách bên trái để xem chi tiết và thực hiện phân tích 5-Why.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
