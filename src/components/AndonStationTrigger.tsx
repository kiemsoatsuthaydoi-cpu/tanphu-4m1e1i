import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, PackageX, ShieldAlert, Cpu, CheckCircle2, Camera, Sparkles } from 'lucide-react';
import { IssueCategory, Severity, ProductionLine, Workstation } from '../types';

interface AndonStationTriggerProps {
  lines: ProductionLine[];
  workstations: Workstation[];
  onSubmitTicket: (ticket: {
    lineId: string;
    lineName: string;
    stationId: string;
    stationName: string;
    category: IssueCategory;
    severity: Severity;
    title: string;
    description: string;
    reportedBy: string;
    imageUrl?: string;
  }) => void;
  playSound: (type: 'CRITICAL' | 'WARNING') => void;
}

export const AndonStationTrigger: React.FC<AndonStationTriggerProps> = ({
  lines,
  workstations,
  onSubmitTicket,
  playSound,
}) => {
  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.id || 'line-1');
  const [selectedStationId, setSelectedStationId] = useState<string>(workstations[0]?.id || 'st-101');
  const [category, setCategory] = useState<IssueCategory>('QUALITY');
  const [severity, setSeverity] = useState<Severity>('CRITICAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [operatorName, setOperatorName] = useState('Nguyễn Văn Anh (QC Line)');
  const [sampleImage, setSampleImage] = useState<string | undefined>();
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const availableStations = workstations.filter(st => st.lineId === selectedLineId);
  const currentLine = lines.find(l => l.id === selectedLineId);

  const handleQuickPreset = (presetCategory: IssueCategory, presetSeverity: Severity, presetTitle: string, desc: string) => {
    setCategory(presetCategory);
    setSeverity(presetSeverity);
    setTitle(presetTitle);
    setDescription(desc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const currentStation = workstations.find(st => st.id === selectedStationId);

    onSubmitTicket({
      lineId: selectedLineId,
      lineName: currentLine?.name || 'Dây chuyền',
      stationId: selectedStationId,
      stationName: currentStation ? `${currentStation.name} (${currentStation.code})` : 'Trạm làm việc',
      category,
      severity,
      title,
      description: description || 'Phát hiện bởi công nhân tại trạm - Khẩu hiệu "Mỗi Nhân Viên Là Một QC"',
      reportedBy: operatorName,
      imageUrl: sampleImage
    });

    playSound(severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING');

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setTitle('');
      setDescription('');
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="bg-black/30 text-amber-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> TRIẾT LÝ QC TOÀN DÂN
            </span>
            <h2 className="text-2xl font-black tracking-tight">MỖI NHÂN VIÊN LÀ MỘT QC</h2>
            <p className="text-amber-100 text-sm mt-1 max-w-2xl">
              Khi phát hiện bất kỳ dấu hiệu lỗi chất lượng, máy kẹt, hoặc rủi ro an toàn, công nhân hãy nhấn nút kích hoạt còi Andon ngay lập tức để dừng dây chuyền và nhận hỗ trợ từ Kỹ thuật & QC!
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center min-w-[160px]">
            <p className="text-xs text-amber-200">Dây Chuyền Đang Chọn</p>
            <p className="font-extrabold text-base text-white mt-0.5">{currentLine?.code || 'L-01'}</p>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
              currentLine?.status === 'STOPPED' ? 'bg-rose-500 text-white' :
              currentLine?.status === 'WARNING' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
            }`}>
              {currentLine?.status === 'STOPPED' ? '🔴 ĐANG DỪNG' :
               currentLine?.status === 'WARNING' ? '🟡 CÓ CẢNH BÁO' : '🟢 BÌNH THƯỜNG'}
            </span>
          </div>
        </div>
      </div>

      {submittedSuccess && (
        <div className="bg-emerald-900/90 border-2 border-emerald-500 text-emerald-100 p-4 rounded-xl flex items-center gap-3 animate-bounce shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-base">Đã phát còi báo Andon thành công!</p>
            <p className="text-xs text-emerald-200">Tổ trưởng, Đội Kỹ Thuật và Trưởng QC đã nhận được thông báo khẩn cấp.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Step 1: Location & Operator */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">1</span>
            Xác Định Dây Chuyền & Trạm Làm Việc
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Chọn Dây Chuyền</label>
              <select
                value={selectedLineId}
                onChange={(e) => {
                  setSelectedLineId(e.target.value);
                  const firstSt = workstations.find(st => st.lineId === e.target.value);
                  if (firstSt) setSelectedStationId(firstSt.id);
                }}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {l.name} ({l.workshop})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Trạm Của Bạn</label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                {availableStations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tên Công Nhân / QC Báo Lỗi</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Nhập tên người báo lỗi"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 2: Quick Presets */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">2</span>
            Chọn Nhanh Loại Sự Cố Thường Gặp (1 Touch)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => handleQuickPreset('QUALITY', 'CRITICAL', 'Lỗi ngoại quan / Bo mạch bong tróc', 'Phát hiện sản phẩm bị lỗi ngoại quan hàng loạt, không đạt tiêu chuẩn kỹ thuật.')}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                category === 'QUALITY'
                  ? 'bg-rose-950/80 border-rose-500 text-white ring-2 ring-rose-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <AlertOctagon className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition" />
              <p className="font-bold text-sm">Lỗi Chất Lượng</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Sản phẩm sai hỏng, ngoại quan, thông số</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('EQUIPMENT', 'CRITICAL', 'Sự cố máy kẹt / Băng tải hỏng', 'Thiết bị phát ra tiếng kêu lạ, máy dừng đột ngột hoặc băng tải bị kẹt.')}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                category === 'EQUIPMENT'
                  ? 'bg-amber-950/80 border-amber-500 text-white ring-2 ring-amber-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Cpu className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition" />
              <p className="font-bold text-sm">Hỏng Thiết Bị</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Máy kẹt, rò rỉ, kẹt băng tải</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('MATERIAL', 'WARNING', 'Cần cấp bổ sung nguyên vật liệu', 'Số lượng linh kiện tại trạm sắp hết, cần kho cấp ngay.')}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                category === 'MATERIAL'
                  ? 'bg-blue-950/80 border-blue-500 text-white ring-2 ring-blue-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <PackageX className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition" />
              <p className="font-bold text-sm">Thiếu Vật Tư</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Hết nguyên liệu, sai mã hàng</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('SAFETY', 'CRITICAL', 'Rủi ro an toàn / Màn chắn cảm biến', 'Phát hiện nguy cơ mất an toàn lao động hoặc thiết bị che chắn có vấn đề.')}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                category === 'SAFETY'
                  ? 'bg-purple-950/80 border-purple-500 text-white ring-2 ring-purple-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <ShieldAlert className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition" />
              <p className="font-bold text-sm">An Toàn (Safety)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Mất an toàn, nguy cơ chấn thương</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('METHOD', 'WARNING', 'Sai lệch quy trình thao tác SOP', 'Cần tổ trưởng hướng dẫn lại thao tác lắp ráp chuẩn.')}
              className={`p-3.5 rounded-xl border text-left transition relative overflow-hidden group ${
                category === 'METHOD'
                  ? 'bg-emerald-950/80 border-emerald-500 text-white ring-2 ring-emerald-500'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition" />
              <p className="font-bold text-sm">Quy Trình SOP</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bản vẽ không rõ, thắc mắc thao tác</p>
            </button>
          </div>
        </div>

        {/* Step 3: Ticket Details */}
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">3</span>
            Nội Dung Chi Tiết Sự Cố
          </h3>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Mức Độ Nghiêm Trọng</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('CRITICAL')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      severity === 'CRITICAL'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🔴 CRITICAL - DỪNG MÁY KHẨN CẤP
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('WARNING')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                      severity === 'WARNING'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🟡 WARNING - CẦN HỖ TRỢ NGAY
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Hình Ảnh Minh Họa Lỗi (Tùy chọn)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSampleImage('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Đính kèm ảnh mẫu SMT
                  </button>
                  {sampleImage && (
                    <span className="text-xs text-emerald-400 font-medium">✓ Đã đính kèm ảnh</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Tiêu Đề Sự Cố <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Lỗi viền kim loại bị xước, đứt dây nguồn..."
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Mô Tả Hiện Tượng Chi Tiết</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả cụ thể vị trí xảy ra lỗi, số lượng sản phẩm bị ảnh hưởng..."
                className="w-full bg-slate-950 text-white border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Big Button */}
        <div className="pt-2">
          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-black text-lg tracking-wide uppercase shadow-2xl transition transform active:scale-98 flex items-center justify-center gap-3 ${
              severity === 'CRITICAL'
                ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-950/50'
            }`}
          >
            <AlertOctagon className="w-7 h-7 animate-pulse" />
            KÍCH HOẠT ĐÈN VÀ CÒI BÁO ANDON NGAY
          </button>
        </div>
      </form>
    </div>
  );
};
