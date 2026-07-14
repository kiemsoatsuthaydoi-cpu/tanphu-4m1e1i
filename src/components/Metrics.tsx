import React from 'react';
import { Award, CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { FactoryMetrics } from '../types';

interface MetricsProps {
  metrics: FactoryMetrics;
  totalTarget: number;
  totalActual: number;
}

export const Metrics: React.FC<MetricsProps> = ({ metrics, totalTarget, totalActual }) => {
  const yieldPercentage = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* OEE Circular Gauge Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-950 text-blue-400 p-2 rounded-lg">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">HIỆU SUẤT TOÀN THIẾT BỊ</span>
              <h3 className="text-sm font-semibold text-slate-200">Chỉ số OEE Tổng Thể</h3>
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-blue-400">{metrics.oee}%</span>
        </div>

        {/* Mini progress bar components */}
        <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/60">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Sẵn sàng (Availability)</span>
            <span className="font-mono text-slate-200 font-medium">{metrics.availability}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.availability}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Hiệu suất (Performance)</span>
            <span className="font-mono text-slate-200 font-medium">{metrics.performance}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.performance}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Chất lượng (Quality Rate)</span>
            <span className="font-mono text-slate-200 font-medium">{metrics.quality}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-teal-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${metrics.quality}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Production Output Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-950 text-indigo-400 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">TIẾN ĐỘ SẢN XUẤT</span>
              <h3 className="text-sm font-semibold text-slate-200">Sản Lượng Đạt Được</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 px-2 py-1 rounded">
            Đạt {yieldPercentage}%
          </span>
        </div>

        <div className="flex justify-between items-baseline mb-2">
          <span className="text-3xl font-black font-mono text-white">{totalActual}</span>
          <span className="text-slate-500 text-xs">chỉ tiêu: <span className="font-mono font-medium text-slate-300">{totalTarget}</span></span>
        </div>

        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${Math.min(yieldPercentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-slate-400">
          Tổng sản lượng hoàn thành trên toàn bộ các dây chuyền lắp ráp hôm nay.
        </p>
      </div>

      {/* Mean Time to Repair (MTTR) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-950 text-amber-400 p-2 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">THỜI GIAN KHẮC PHỤC</span>
              <h3 className="text-sm font-semibold text-slate-200">Chỉ số MTTR</h3>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-3xl font-black font-mono text-amber-400">{metrics.mttr}</span>
          <span className="text-slate-400 text-sm font-medium">phút / sự cố</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Nhanh hơn 12% so với mục tiêu (30 phút)</span>
        </div>
        <p className="text-xs text-slate-400">
          Thời gian trung bình để xử lý, sửa chữa kể từ lúc Andon phát tín hiệu dừng line.
        </p>
      </div>

      {/* Active Incidents & Severity Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-red-950 text-red-400 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">CẢNH BÁO HOẠT ĐỘNG</span>
              <h3 className="text-sm font-semibold text-slate-200">Sự Cố Đang Chờ Xử Lý</h3>
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-black font-mono text-red-500">
            {metrics.activeIncidents}
          </span>
          <span className="text-slate-400 text-xs">yêu cầu hỗ trợ trực tiếp</span>
        </div>

        <div className="text-xs space-y-1 text-slate-400">
          <div className="flex justify-between">
            <span>Mechanical (Cơ khí):</span>
            <span className="font-mono text-slate-300 font-medium">Hoạt động</span>
          </div>
          <div className="flex justify-between">
            <span>Electrical (Điện):</span>
            <span className="font-mono text-slate-300 font-medium">Hoạt động</span>
          </div>
        </div>
      </div>
    </div>
  );
};
