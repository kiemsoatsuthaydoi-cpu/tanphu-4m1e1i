import { useState } from 'react';
import { 
  QCDefectType 
} from '../types/andon';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Sparkles,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';

interface QCInspectionGuideProps {
  defectTypes: QCDefectType[];
}

export const QCInspectionGuide = ({ defectTypes }: QCInspectionGuideProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChecklist, setActiveChecklist] = useState<{ [key: string]: boolean }>({
    'check-1': true,
    'check-2': true,
    'check-3': false,
    'check-4': true,
    'check-5': false
  });

  const filteredDefects = defectTypes.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCheck = (id: string) => {
    setActiveChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Slogan */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-800/60 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-3">
            <ShieldCheck className="w-4 h-4" /> TRIẾT LÝ TOYOTA TPS 4.0
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            MỖI NHÂN VIÊN LÀ MỘT QC TỰ CHỦ
          </h2>
          <p className="text-xs sm:text-sm text-blue-200/80 mt-2 leading-relaxed">
            "Không nhận sản phẩm lỗi từ công đoạn trước • Không tự sản xuất ra lỗi tại công đoạn mình • Không chuyển giao sản phẩm lỗi cho công đoạn sau".
          </p>
        </div>
      </div>

      {/* Grid: 3-Minute 5S QC Checklist + Defect Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 3-Minute Self-QC Checklist */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              Checklist 3 Phút QC Đầu Ca
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Thực hiện trước khi bắt đầu may/ép sản phẩm đầu tiên để triệt tiêu lỗi hệ thống:
          </p>

          <div className="space-y-2.5">
            {[
              { id: 'check-1', title: '1. Kiểm tra kim & cữ gá', desc: 'Kim sắc bén, không cong vênh, ốc cữ may đã siết chặt.' },
              { id: 'check-2', title: '2. Thử đường may mẫu (First Piece)', desc: 'Soi mật độ chỉ, độ co giãn và sức căng chỉ trên/dưới.' },
              { id: 'check-3', title: '3. Đối chiếu Bảng Thông Số Size', desc: 'Kiểm tra thông số vòng ngực, dài áo, bản lé so với rập chuẩn.' },
              { id: 'check-4', title: '4. Kiểm tra nhiệt độ & áp suất ép', desc: 'Đồng hồ nhiệt đạt 145°C ± 3°C, áp suất 4.5 Bar.' },
              { id: 'check-5', title: '5. Sẵn sàng nút bấm Dừng Andon', desc: 'Đèn tháp Andon tại trạm phản hồi tín hiệu bình thường.' }
            ].map(item => (
              <div 
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  activeChecklist[item.id]
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                  activeChecklist[item.id]
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-600 bg-slate-800'
                }`}>
                  {activeChecklist[item.id] && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 text-center">
            {Object.values(activeChecklist).filter(Boolean).length}/5 hạng mục đã xác nhận đạt chuẩn
          </div>
        </div>

        {/* Right: Defect Inspection Catalog */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Từ Điển Tiêu Chuẩn Dung Sai & Lỗi QC
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quy chuẩn đối chiếu khi phát hiện sản phẩm có dấu hiệu lỗi
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã lỗi hoặc tên lỗi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredDefects.map(defect => (
              <div 
                key={defect.code}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {defect.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Phân loại: {defect.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Dung sai: {defect.standardTolerance}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white">
                  {defect.name}
                </h4>

                <div className="text-xs text-slate-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80">
                  <strong className="text-slate-400">Hướng dẫn kiểm tra trực quan: </strong>
                  {defect.inspectionGuide}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
