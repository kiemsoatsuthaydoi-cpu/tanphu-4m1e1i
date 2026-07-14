import React, { useState } from 'react';
import { X, AlertOctagon, ShieldAlert } from 'lucide-react';
import { ProductionLine, IncidentCategory, IncidentSeverity } from '../types';

interface TriggerAlertModalProps {
  line: ProductionLine | null;
  isOpen: boolean;
  onClose: () => void;
  onTrigger: (
    lineId: string, 
    category: IncidentCategory, 
    severity: IncidentSeverity, 
    description: string, 
    reportedBy: string
  ) => void;
}

export const TriggerAlertModal: React.FC<TriggerAlertModalProps> = ({
  line,
  isOpen,
  onClose,
  onTrigger,
}) => {
  const [category, setCategory] = useState<IncidentCategory>('mechanical');
  const [severity, setSeverity] = useState<IncidentSeverity>('high');
  const [description, setDescription] = useState<string>('');
  const [reportedBy, setReportedBy] = useState<string>('Nguyễn Văn Hải (Operator)');

  if (!isOpen || !line) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reportedBy.trim()) return;
    
    onTrigger(line.id, category, severity, description, reportedBy);
    
    // Reset state
    setDescription('');
    onClose();
  };

  // Sample quick templates for manufacturing incidents based on category
  const incidentTemplates: Record<IncidentCategory, string[]> = {
    mechanical: [
      'Băng tải chính bị kẹt cơ khí, motor quá nhiệt',
      'Trục xoay robot hàn bị rơ, lệch tâm định vị',
      'Rò rỉ dầu thủy lực xi lanh ép khuôn số 3',
    ],
    electrical: [
      'Hỏng cảm biến tiệm cận hành trình xylanh cấp phôi',
      'Mất nguồn điều khiển tủ điện 24VDC',
      'Biến tần báo lỗi quá dòng (Overcurrent F001)',
    ],
    quality: [
      'Phát hiện vết xước bề mặt sản phẩm liên tục',
      'Độ khít khớp ghép mộng vượt quá dung sai 0.2mm',
      'Mối hàn robot bị rỗ khí, không ngấu thiếc',
    ],
    material: [
      'Thiếu linh kiện khay sạc pin đầu vào khâu lắp ráp',
      'Keo dán tản nhiệt bị khô/hết lô cấp nguyên liệu',
      'Sai lệch mã vạch thùng linh kiện bán thành phẩm',
    ],
    safety: [
      'Cửa an toàn khu vực Robot dập không khóa chặt',
      'Cảm biến hàng rào quang điện (Light curtain) báo động',
      'Phát hiện khói nhẹ từ tủ sấy sấy keo UV',
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-950/40 border-b border-red-900/40 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertOctagon className="h-5 w-5 animate-pulse" />
            <h2 className="font-sans font-extrabold text-base uppercase tracking-wider">
              Kích Hoạt Tín Hiệu Andon Khẩn Cấp
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">Dây chuyền kích hoạt:</span>
              <span className="text-slate-100 font-bold">{line.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quản lý khu vực:</span>
              <span className="text-slate-300 font-mono font-medium">{line.manager}</span>
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Phân Nhóm Sự Cố
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['mechanical', 'electrical', 'quality', 'material', 'safety'] as IncidentCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    // Autofill with the first template
                    setDescription(incidentTemplates[cat][0]);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col justify-between h-14 ${
                    category === cat 
                      ? 'bg-red-950/40 border-red-500/60 text-red-400 shadow-inner' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="capitalize">{cat}</span>
                  <span className="text-[9px] font-normal text-slate-500">Nhấp để chọn</span>
                </button>
              ))}
            </div>
          </div>

          {/* Severity & Reporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Mức Độ Nghiêm Trọng
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="medium">Medium - Chậm tiến độ nhẹ</option>
                <option value="high">High - Nguy cơ dừng chuyền</option>
                <option value="critical">Critical - DỪNG CHUYỀN NGAY LẬP TỨC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Người Báo Cáo
              </label>
              <input
                type="text"
                required
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder="Họ tên (Chức vụ)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Incident Templates Suggestion Box */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Mẫu Sự Cố Thường Gặp ({category})
            </label>
            <div className="space-y-1.5">
              {incidentTemplates[category].map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDescription(tpl)}
                  className="w-full text-left bg-slate-950 hover:bg-slate-800/40 text-slate-300 hover:text-slate-100 p-2 rounded border border-slate-800/40 text-[11px] transition-all truncate block"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed description text area */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Mô Tả Chi Tiết Sự Cố
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể hiện trạng hư hại, mã lỗi kỹ thuật hoặc sự cố gặp phải để kỹ thuật viên nắm bắt..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              <ShieldAlert className="h-4 w-4" />
              Kích Hoạt ANDON
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
