import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Activity, Clock, ShieldCheck, Zap, Sparkles, Cpu, Download } from 'lucide-react';
import { AndonTicket, ShiftSummary } from '../types';

interface AnalyticsDashboardProps {
  tickets: AndonTicket[];
  shiftSummary: ShiftSummary;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  tickets,
  shiftSummary
}) => {
  const [aiReportText, setAiReportText] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Group tickets by Category for Pareto
  const categoryCounts: Record<string, number> = {
    'Chất Lượng': tickets.filter(t => t.category === 'QUALITY').length,
    'Hỏng Máy': tickets.filter(t => t.category === 'EQUIPMENT').length,
    'Thiếu Vật Tư': tickets.filter(t => t.category === 'MATERIAL').length,
    'An Toàn': tickets.filter(t => t.category === 'SAFETY').length,
    'SOP / Quy Trình': tickets.filter(t => t.category === 'METHOD').length,
  };

  const paretoData = Object.entries(categoryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const paretoColors = ['#f43f5e', '#f59e0b', '#3b82f6', '#a855f7', '#10b981'];

  // Trend data by Hour
  const hourlyData = [
    { hour: '06:00', tickets: 1, downtime: 10 },
    { hour: '07:00', tickets: 2, downtime: 15 },
    { hour: '08:00', tickets: 4, downtime: 35 },
    { hour: '09:00', tickets: 3, downtime: 20 },
    { hour: '10:00', tickets: 2, downtime: 12 },
    { hour: '11:00', tickets: 1, downtime: 8 },
    { hour: '12:00', tickets: 1, downtime: 5 },
  ];

  const handleGenerateAiShiftReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/shift-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets })
      });
      const data = await res.json();
      setAiReportText(data.summaryText + '\n\nKhuyến nghị:' + (data.recommendations ? '\n- ' + data.recommendations.join('\n- ') : ''));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Chỉ Số OEE Toàn Nhà Máy</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{shiftSummary.oee}%</p>
            <p className="text-[10px] text-emerald-500/80 mt-0.5">↑ +1.2% so với ca trước</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tỷ Lệ Thành Phẩm First Yield</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{shiftSummary.yieldRate}%</p>
            <p className="text-[10px] text-blue-500/80 mt-0.5">Mục tiêu: {'>'}98%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Thời Gian Phản Ứng (MTTR Response)</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{shiftSummary.avgResponseTimeSec}s</p>
            <p className="text-[10px] text-amber-500/80 mt-0.5">Đạt chuẩn ISO Andon SLA</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tổng Thời Gian Sửa Chữa Tr.Bình</p>
            <p className="text-2xl font-black text-purple-400 mt-1">{shiftSummary.avgResolutionTimeMin}m</p>
            <p className="text-[10px] text-purple-500/80 mt-0.5">Trung bình / ticket</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pareto Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Biểu Đồ Pareto Phân Loại Lỗi Ca 1
            </h3>
            <span className="text-xs text-slate-400">Quy tắc 80/20 QC</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paretoData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {paretoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={paretoColors[index % paretoColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Downtime Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Xu Hướng Sự Cố Theo Giờ Trong Ca
            </h3>
            <span className="text-xs text-slate-400">Downtime (Phút)</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="downtime" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="tickets" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Shift Report Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Báo Cáo Tóm Tắt Tự Động Ca Sản Xuất (Gemini AI)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tổng hợp sự cố, đánh giá hiệu suất dây chuyền và gợi ý cho ca tiếp theo</p>
          </div>

          <button
            onClick={handleGenerateAiShiftReport}
            disabled={isGeneratingReport}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50"
          >
            <Cpu className={`w-4 h-4 ${isGeneratingReport ? 'animate-spin' : ''}`} />
            {isGeneratingReport ? 'Đang Tạo Báo Cáo...' : 'Tạo Báo Cáo Ca Bằng AI'}
          </button>
        </div>

        {aiReportText && (
          <div className="bg-slate-950 p-4 rounded-xl border border-purple-800/40 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
            {aiReportText}
          </div>
        )}
      </div>
    </div>
  );
};
