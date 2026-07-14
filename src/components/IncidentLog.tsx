import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  Clock, 
  Filter, 
  UserCheck, 
  MessageSquare,
  Search
} from 'lucide-react';
import { Incident, IncidentStatus, IncidentCategory } from '../types';

interface IncidentLogProps {
  incidents: Incident[];
  onAcknowledge: (incidentId: string) => void;
  onResolve: (incidentId: string) => void;
}

export const IncidentLog: React.FC<IncidentLogProps> = ({ 
  incidents, 
  onAcknowledge, 
  onResolve 
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getCategoryStyles = (category: IncidentCategory) => {
    switch (category) {
      case 'mechanical':
        return 'bg-blue-950/60 border-blue-800 text-blue-400';
      case 'electrical':
        return 'bg-purple-950/60 border-purple-800 text-purple-400';
      case 'quality':
        return 'bg-amber-950/60 border-amber-800 text-amber-400';
      case 'material':
        return 'bg-teal-950/60 border-teal-800 text-teal-400';
      case 'safety':
        return 'bg-red-950/60 border-red-800 text-red-400 animate-pulse';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const getCategoryLabel = (category: IncidentCategory) => {
    switch (category) {
      case 'mechanical': return 'Cơ khí (Mechanical)';
      case 'electrical': return 'Điện (Electrical)';
      case 'quality': return 'Chất lượng (Quality)';
      case 'material': return 'Vật tư (Material)';
      case 'safety': return 'An toàn (Safety)';
      default: return category;
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesSearch = inc.lineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' +
           d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
      {/* Log Header with Controls */}
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/50">
        <div>
          <h2 className="text-lg font-sans font-bold text-slate-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            Nhật Ký Sự Cố & Yêu Cầu Hỗ Trợ
          </h2>
          <p className="text-xs text-slate-400">Danh sách các tín hiệu Andon đang hoạt động và lịch sử sửa chữa</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700 w-44"
            />
          </div>

          {/* Status Filter */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'all' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'active' 
                  ? 'bg-red-950/60 text-red-400 border border-red-800/40 shadow-sm' 
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              Đang hoạt động
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                statusFilter === 'resolved' 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 shadow-sm' 
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Đã khắc phục
            </button>
          </div>
        </div>
      </div>

      {/* Incident List Table */}
      <div className="overflow-x-auto">
        {filteredIncidents.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-60" />
            <p className="font-medium text-slate-300 text-sm">Không tìm thấy sự cố nào</p>
            <p className="text-xs text-slate-500 mt-1">Hệ thống đang hoạt động ổn định và an toàn.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs font-mono border-b border-slate-800/80">
                <th className="p-4 font-semibold uppercase tracking-wider">Thời gian</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Vị trí Line</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Phân Loại Sự Cố</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Mô tả chi tiết</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Người báo / Xử lý</th>
                <th className="p-4 font-semibold uppercase tracking-wider">Trạng thái</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Time field */}
                  <td className="p-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {formatDate(incident.createdAt)}
                  </td>

                  {/* Line info */}
                  <td className="p-4 whitespace-nowrap font-bold text-slate-200">
                    {incident.lineName}
                  </td>

                  {/* Category badg */}
                  <td className="p-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${getCategoryStyles(incident.category)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {getCategoryLabel(incident.category)}
                    </span>
                  </td>

                  {/* Detail description */}
                  <td className="p-4 max-w-xs truncate text-slate-300 font-medium text-xs" title={incident.description}>
                    {incident.description}
                  </td>

                  {/* Reporter & Responder */}
                  <td className="p-4 whitespace-nowrap text-xs text-slate-400">
                    <div>Bởi: <span className="text-slate-300 font-semibold">{incident.reportedBy}</span></div>
                    {incident.assignedTo && (
                      <div className="mt-1 flex items-center gap-1 text-emerald-400">
                        <UserCheck className="h-3 w-3" />
                        <span>KTV: {incident.assignedTo}</span>
                      </div>
                    )}
                  </td>

                  {/* Status Indicator Badge */}
                  <td className="p-4 whitespace-nowrap">
                    {incident.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-950/80 border border-red-500/50 text-red-400 animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Đang Báo Động
                      </span>
                    )}
                    {incident.status === 'acknowledged' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 border border-amber-600/50 text-amber-400">
                        <Wrench className="h-3.5 w-3.5 animate-spin-slow" />
                        Đang Sửa Chữa
                      </span>
                    )}
                    {incident.status === 'resolved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 border border-emerald-600/50 text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Đã Khắc Phục
                      </span>
                    )}
                  </td>

                  {/* Operational Action Column */}
                  <td className="p-4 whitespace-nowrap text-right text-xs">
                    {incident.status === 'active' && (
                      <button
                        onClick={() => onAcknowledge(incident.id)}
                        className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-md transition-all shadow-sm hover:shadow-amber-500/20 active:scale-95"
                      >
                        Tiếp Nhận
                      </button>
                    )}
                    {incident.status === 'acknowledged' && (
                      <button
                        onClick={() => onResolve(incident.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-md transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95"
                      >
                        Khắc Phục Xong
                      </button>
                    )}
                    {incident.status === 'resolved' && (
                      <span className="text-slate-500 font-mono text-xs select-none">
                        Hoàn thành
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
