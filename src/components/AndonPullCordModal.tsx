import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Wrench, 
  Package, 
  ShieldAlert, 
  HelpCircle, 
  Send,
  Zap,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ProductionLine, AlertCategory, AlertSeverity, QCDefectType, AndonTicket } from '../types/andon';
import { andonSound } from '../utils/audioAlert';
import confetti from 'canvas-confetti';

interface AndonPullCordModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ProductionLine[];
  defectTypes: QCDefectType[];
  onSubmitTicket: (ticket: Omit<AndonTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => void;
}

export const AndonPullCordModal = ({
  isOpen,
  onClose,
  lines,
  defectTypes,
  onSubmitTicket
}: AndonPullCordModalProps) => {
  const [selectedLineId, setSelectedLineId] = useState(lines[0]?.id || '');
  const [selectedStationId, setSelectedStationId] = useState(lines[0]?.stations[0]?.id || '');
  const [category, setCategory] = useState<AlertCategory>('QUALITY');
  const [severity, setSeverity] = useState<AlertSeverity>('critical');
  const [reporterName, setReporterName] = useState('Trần Văn Bình');
  const [reporterRole, setReporterRole] = useState('Công nhân may (QC Tự chủ)');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDefect, setSelectedDefect] = useState(defectTypes[0]?.name || '');

  if (!isOpen) return null;

  const currentLine = lines.find(l => l.id === selectedLineId) || lines[0];
  const availableStations = currentLine ? currentLine.stations : [];
  const currentStation = availableStations.find(s => s.id === selectedStationId) || availableStations[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    andonSound.playAlertChime(severity);

    onSubmitTicket({
      stationId: currentStation?.id || 'st-unknown',
      stationName: currentStation?.name || 'Vị trí làm việc',
      lineName: currentLine?.name || 'Chuyền sản xuất',
      reporterName,
      reporterRole,
      category,
      severity,
      title,
      description: description || `Báo động Andon tại ${currentStation?.name}. Phát hiện lỗi kiểm soát chất lượng cần hỗ trợ khẩn cấp.`,
      defectType: category === 'QUALITY' ? selectedDefect : undefined,
      suggestedAction: severity === 'critical' ? 'Tạm dừng đưa phôi tiếp theo, chờ kỹ thuật/QC kiểm tra.' : 'Cần giám sát hỗ trợ tại vị trí.'
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ef4444', '#f97316', '#eab308']
    });

    onClose();
  };

  const handleQuickQualityDefect = (defectName: string) => {
    setSelectedDefect(defectName);
    setTitle(`Lỗi chất lượng: ${defectName}`);
    setCategory('QUALITY');
    setSeverity('critical');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with pull cord styling */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 p-4 sm:p-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 shadow-inner">
              <Zap className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide flex items-center gap-2">
                KÉO DÂY BÁO ĐỘNG ANDON
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Mỗi Nhân Viên Là Một QC • Dừng Chuyền Khi Phát Hiện Bất Thường
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-slate-200 text-sm">
          
          {/* Line & Station Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Chuyền sản xuất:
              </label>
              <select
                value={selectedLineId}
                onChange={(e) => {
                  setSelectedLineId(e.target.value);
                  const l = lines.find(line => line.id === e.target.value);
                  if (l && l.stations.length > 0) {
                    setSelectedStationId(l.stations[0].id);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs sm:text-sm"
              >
                {lines.map(line => (
                  <option key={line.id} value={line.id}>
                    {line.name} ({line.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Vị trí công đoạn / Trạm làm việc:
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs sm:text-sm"
              >
                {availableStations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name} - CN: {station.workerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Phân loại sự cố Andon:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setCategory('QUALITY')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  category === 'QUALITY'
                    ? 'bg-red-500/20 border-red-500 text-red-400 font-bold shadow-md shadow-red-500/10'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <span className="text-[11px] text-center leading-tight">Chất lượng QC</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('EQUIPMENT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  category === 'EQUIPMENT'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-5 h-5 text-amber-400" />
                <span className="text-[11px] text-center leading-tight">Máy móc / Cơ điện</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('MATERIAL')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  category === 'MATERIAL'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Package className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] text-center leading-tight">Nguyên phụ liệu</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('SAFETY')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  category === 'SAFETY'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span className="text-[11px] text-center leading-tight">An toàn / 5S</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('TECH_SUPPORT')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1 ${
                  category === 'TECH_SUPPORT'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400 font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-5 h-5 text-purple-400" />
                <span className="text-[11px] text-center leading-tight">Kỹ thuật / Rập</span>
              </button>
            </div>
          </div>

          {/* Quick Select Defect Chips if Quality */}
          {category === 'QUALITY' && (
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Chọn nhanh lỗi kiểm tra chất lượng (QC Defect Catalog):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {defectTypes.map((defect) => (
                  <button
                    key={defect.code}
                    type="button"
                    onClick={() => handleQuickQualityDefect(defect.name)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      selectedDefect === defect.name
                        ? 'bg-red-600/30 border-red-500 text-red-300 font-medium'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    {defect.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Severity & Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block text-xs font-semibold text-slate-400 sm:col-span-3 mb-0">
              Mức độ ảnh hưởng dây chuyền:
            </label>
            
            <button
              type="button"
              onClick={() => setSeverity('critical')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 ${
                severity === 'critical'
                  ? 'bg-red-500/20 border-red-500 text-red-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <div className="text-xs">
                <p className="font-bold">Khẩn cấp (Dừng)</p>
                <p className="text-[10px] text-slate-400">Yêu cầu dừng trạm tức thì</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSeverity('major')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 ${
                severity === 'major'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="text-xs">
                <p className="font-bold">Nghiêm trọng (Cảnh báo)</p>
                <p className="text-[10px] text-slate-400">Nguy cơ lỗi hàng loạt</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSeverity('minor')}
              className={`p-2 rounded-lg border text-left flex items-center gap-2 ${
                severity === 'minor'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div className="text-xs">
                <p className="font-bold">Hỗ trợ thường</p>
                <p className="text-[10px] text-slate-400">Cần QC/Bảo trì ghé qua</p>
              </div>
            </button>
          </div>

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Tiêu đề sự cố / Lỗi phát hiện:
            </label>
            <input
              type="text"
              required
              placeholder="VD: Lỗi lệch bo cổ 2mm, nhiệt độ bàn ép tụt..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Mô tả chi tiết & Hành động sơ bộ:
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả số lượng sản phẩm nghi vấn lỗi, hiện tượng bất thường..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Reporter info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Họ tên người báo:</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Vai trò / Chức danh:</label>
              <input
                type="text"
                value={reporterRole}
                onChange={(e) => setReporterRole(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              PHÁT TÍN HIỆU ANDON NGAY
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
