import React, { useState, useEffect } from 'react';
import { Activity, Clock, Cpu, Factory, Shield, Wifi } from 'lucide-react';

interface HeaderProps {
  activeIncidentsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeIncidentsCount }) => {
  const [time, setTime] = useState<Date>(new Date());
  const [isGatewayOnline, setIsGatewayOnline] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date: dd/mm/yyyy
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Format time: hh:mm:ss
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 py-4 px-6 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Factory className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                META
              </span>
              <span className="font-mono font-bold text-lg bg-red-600 text-white px-2 py-0.5 rounded text-xs tracking-wider uppercase animate-pulse">
                ANDON
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans tracking-wide">
              Hệ Thống Giám Sát Trạng Thái & Cảnh Báo Sự Cố Thời Gian Thực
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Active alerts badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            activeIncidentsCount > 0 
              ? 'bg-red-950/40 border-red-800/80 text-red-400 animate-pulse' 
              : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${activeIncidentsCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
            <span className="font-medium">
              {activeIncidentsCount > 0 ? `${activeIncidentsCount} Sự Cố Đang Hoạt Động` : 'Hệ Thống Bình Thường'}
            </span>
          </div>

          {/* IoT Gateway Status */}
          <button 
            onClick={() => setIsGatewayOnline(!isGatewayOnline)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              isGatewayOnline 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
            }`}
            title="Nhấp để chuyển đổi mô phỏng kết nối IoT Gateway"
          >
            <Wifi className={`h-3.5 w-3.5 ${isGatewayOnline ? 'text-emerald-400' : 'text-amber-500 animate-bounce'}`} />
            <span className="font-mono">
              Gateway: {isGatewayOnline ? 'CONNECTED' : 'STANDBY'}
            </span>
          </button>

          {/* Section info */}
          <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-medium">KHU VỰC: LẮP RÁP CHÍNH</span>
          </div>

          {/* Date & Time display */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg px-4 py-1.5 text-slate-300 flex items-center gap-3 shadow-inner">
            <Clock className="h-4 w-4 text-slate-400" />
            <div className="flex items-center gap-2 font-mono">
              <span className="text-slate-400 font-light">{formatDate(time)}</span>
              <span className="text-slate-500">|</span>
              <span className="text-blue-400 font-semibold tracking-wider text-sm">{formatTime(time)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
