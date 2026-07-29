import React, { useState } from 'react';
import { X, Sparkles, Cpu, AlertTriangle, CheckCircle, Plus, Trash2, ArrowDownRight, Camera } from 'lucide-react';
import { AndonTicket, FiveWhyItem } from '../types';

interface TicketDetailModalProps {
  ticket: AndonTicket | null;
  onClose: () => void;
  onSaveTicket: (updated: Partial<AndonTicket>) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  onClose,
  onSaveTicket
}) => {
  if (!ticket) return null;

  const [fiveWhys, setFiveWhys] = useState<FiveWhyItem[]>(
    ticket.fiveWhys && ticket.fiveWhys.length > 0
      ? ticket.fiveWhys
      : [
          { why: 'Tại sao xảy ra lỗi?', answer: ticket.description || 'Chưa phân tích' },
          { why: 'Tại sao xảy ra nguyên nhân trên?', answer: '' },
          { why: 'Tại sao chưa phát hiện sớm?', answer: '' },
          { why: 'Tại sao thiếu quy trình kiểm soát?', answer: '' },
          { why: 'Tại sao SOP/FMEA chưa cập nhật?', answer: '' }
        ]
  );

  const [capaActions, setCapaActions] = useState<string[]>(
    ticket.capaActions || ['Tạm dừng lô hàng nghi ngờ', 'Căn chỉnh lại thông số máy']
  );

  const [newCapa, setNewCapa] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState(ticket.resolutionSummary || '');
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo || 'Kỹ Thuật Ca');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState(ticket.aiRcaSuggestion || '');

  const handleAddWhy = () => {
    setFiveWhys([...fiveWhys, { why: `Tại sao ...?`, answer: '' }]);
  };

  const handleUpdateWhy = (index: number, field: 'why' | 'answer', val: string) => {
    const next = [...fiveWhys];
    next[index][field] = val;
    setFiveWhys(next);
  };

  const handleAddCapa = () => {
    if (!newCapa.trim()) return;
    setCapaActions([...capaActions, newCapa.trim()]);
    setNewCapa('');
  };

  const handleRemoveCapa = (index: number) => {
    setCapaActions(capaActions.filter((_, i) => i !== index));
  };

  const handleGenerateAiRca = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/rca-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          lineName: ticket.lineName,
          stationName: ticket.stationName
        })
      });
      const data = await res.json();
      if (data.fiveWhys) setFiveWhys(data.fiveWhys);
      if (data.capaActions) setCapaActions(data.capaActions);
      if (data.aiRcaSummary) setAiSummary(data.aiRcaSummary);
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = () => {
    onSaveTicket({
      fiveWhys,
      capaActions,
      resolutionSummary,
      assignedTo,
      aiRcaSuggestion: aiSummary
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded font-mono">
              {ticket.ticketCode}
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">{ticket.title}</h3>
              <p className="text-xs text-slate-400">
                {ticket.lineName} • {ticket.stationName} • Báo bởi <strong className="text-slate-200">{ticket.reportedBy}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Summary Banner & AI Button */}
          <div className="bg-gradient-to-r from-slate-950 via-purple-950/40 to-slate-950 p-4 rounded-xl border border-purple-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-1">
                <Sparkles className="w-4 h-4" /> TRỢ LÝ PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (GEMINI AI)
              </span>
              <p className="text-xs text-slate-300">
                Nhấn nút bên dưới để AI tự động phân tích sự cố theo chuẩn 5-Why và đề xuất hành động phòng ngừa CAPA chuẩn ISO/IATF.
              </p>
            </div>

            <button
              onClick={handleGenerateAiRca}
              disabled={isGeneratingAi}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shrink-0 transition disabled:opacity-50 shadow-lg shadow-purple-950/50"
            >
              <Cpu className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              {isGeneratingAi ? 'Đang Phân Tích RCA...' : 'Tự Động Tạo 5-Why bới AI'}
            </button>
          </div>

          {aiSummary && (
            <div className="bg-purple-950/30 border border-purple-800/60 p-4 rounded-xl text-xs text-purple-200 space-y-1">
              <strong className="text-purple-300 font-bold block">💡 Kết Luận Tự Động Từ AI:</strong>
              <p>{aiSummary}</p>
            </div>
          )}

          {ticket.imageUrl && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-400" />
                Hình Ảnh Hiện Trường
              </label>
              <img
                src={ticket.imageUrl}
                alt="Defect"
                className="w-full max-h-60 object-cover rounded-xl border border-slate-800"
              />
            </div>
          )}

          {/* 5-Why Tree Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">5W</span>
                Cây Phân Tích 5-Why (Phân Tích Nguyên Nhân Gốc Rễ)
              </h4>
              <button
                onClick={handleAddWhy}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
              </button>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {fiveWhys.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 relative pl-2 border-l-2 border-amber-500/50">
                  <ArrowDownRight className="w-4 h-4 text-amber-400 shrink-0 mt-2" />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={item.why}
                      onChange={(e) => handleUpdateWhy(idx, 'why', e.target.value)}
                      className="w-full bg-slate-900 text-amber-300 border border-slate-800 rounded px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => handleUpdateWhy(idx, 'answer', e.target.value)}
                      placeholder="Trả lời câu hỏi tại sao..."
                      rows={1}
                      className="w-full bg-slate-900 text-white border border-slate-800 rounded px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CAPA Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-xs font-black flex items-center justify-center">CAPA</span>
              Hành Động Khắc Phục & Phòng Ngừa (CAPA)
            </h4>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCapa}
                  onChange={(e) => setNewCapa(e.target.value)}
                  placeholder="Thêm biện pháp khắc phục hoặc cập nhật SOP..."
                  className="flex-1 bg-slate-900 text-white border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none"
                />
                <button
                  onClick={handleAddCapa}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm CAPA
                </button>
              </div>

              <ul className="space-y-1.5">
                {capaActions.map((capa, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-200">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {capa}
                    </span>
                    <button
                      onClick={() => handleRemoveCapa(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Execution Note & Technician */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Người Đảm Nhận Sửa Chữa / QC</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tóm Tắt Kết Quả Sửa Chữa</label>
              <input
                type="text"
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                placeholder="VD: Đã lau chùi Stencil và thay mắt cảm biến..."
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-lg px-3 py-2 text-xs font-medium outline-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-lg"
          >
            Lưu 5-Why & Hồ Sơ RCA
          </button>
        </div>
      </div>
    </div>
  );
};
