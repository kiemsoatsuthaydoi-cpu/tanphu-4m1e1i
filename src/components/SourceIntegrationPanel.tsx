import React, { useState, useEffect } from 'react';
import { Code2, UploadCloud, CheckCircle2, Server, Terminal, RefreshCw, Cpu, Layers, FileJson, Copy, Check } from 'lucide-react';
import { AppEnvConfig } from '../types';

export const SourceIntegrationPanel: React.FC = () => {
  const [envInfo, setEnvInfo] = useState<AppEnvConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceSnippet, setSourceSnippet] = useState<string>(`// META ANDON - Custom Rule Engine / Source Configuration
{
  "appName": "META ANDON - Mỗi Nhân Viên Là Một QC",
  "version": "2.5.0-META",
  "autoEscalationTimeMinutes": 15,
  "enableSoundAlert": true,
  "defaultSLA": {
    "CRITICAL": 5,
    "WARNING": 15
  },
  "customWorkshops": [
    "Xưởng 1 - Lắp Ráp Linh Kiện SMT",
    "Xưởng 2 - Gia Công Cơ Khí CNC",
    "Xưởng 3 - Hoàn Thiện & Sơn",
    "Xưởng 4 - Đóng Gói"
  ]
}`);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchEnv = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/system/env');
      const data = await res.json();
      setEnvInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnv();
  }, []);

  const handleImportSource = async () => {
    setImportStatus('Đang đồng bộ source code và cấu hình vào hệ thống...');
    try {
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(sourceSnippet);
      } catch (e) {
        // Not JSON, treat as raw snippet
      }

      const res = await fetch('/api/system/import-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: parsedConfig,
          sourceCodeSnippet: sourceSnippet
        })
      });

      const data = await res.json();
      if (data.success) {
        setImportStatus('✅ Tích hợp Source Code META ANDON thành công! Hệ thống đã tự động cập nhật quy tắc và trạm làm việc.');
        fetchEnv();
      } else {
        setImportStatus(`❌ Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`❌ Lỗi tích hợp: ${err.message}`);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(sourceSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" /> MÔI TRƯỜNG TÍCH HỢP SOURCE CODE
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">SẴN SÀNG NHẬN SOURCE META ANDON</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Môi trường Cloud Run + Express + React 19 + Gemini AI đã được khởi tạo hoàn chỉnh. Anh có thể dán cấu hình/source code trực tiếp vào đây hoặc cập nhật các file nguồn trong thư mục dự án!
            </p>
          </div>

          <button
            onClick={fetchEnv}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Kiểm Tra Môi Trường
          </button>
        </div>
      </div>

      {/* Environment Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Server className="w-4 h-4 text-indigo-400" /> Server Runtime
          </p>
          <p className="font-extrabold text-white text-base mt-1">{envInfo?.nodeEnv || 'development'}</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">Port 3000 Active</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-purple-400" /> Trợ Lý Gemini AI
          </p>
          <p className="font-extrabold text-white text-base mt-1">
            {envInfo?.geminiConnected ? 'Đã Kết Nối' : 'Chờ API Key'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Model: gemini-2.5-flash</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" /> Dây Chuyền Hoạt Động
          </p>
          <p className="font-extrabold text-amber-400 text-base mt-1">{envInfo?.activeLineCount || 5} Dây Chuyền</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Xưởng 1 đến Xưởng 4</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <FileJson className="w-4 h-4 text-emerald-400" /> Phiên Bản System
          </p>
          <p className="font-extrabold text-emerald-400 text-base mt-1">{envInfo?.version || '2.5.0-META'}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Mỗi nhân viên là một QC</p>
        </div>
      </div>

      {/* Upload / Source Code Paste Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            Nhập Source Code / Cấu Hình JSON Tùy Chỉnh Của Anh
          </h3>

          <button
            onClick={copySnippet}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã copy' : 'Copy mẫu'}
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Anh có thể dán mã nguồn mã hóa, luật kinh doanh, danh mục máy móc, sơ đồ dây chuyền, hoặc mã script xử lý Andon của anh vào ô dưới đây để hệ thống tích hợp trực tiếp:
        </p>

        <textarea
          value={sourceSnippet}
          onChange={(e) => setSourceSnippet(e.target.value)}
          rows={12}
          className="w-full bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
          placeholder="Dán code / JSON source của anh vào đây..."
        />

        {importStatus && (
          <div className="p-3 bg-indigo-950/60 border border-indigo-800/80 rounded-xl text-xs font-semibold text-indigo-200">
            {importStatus}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleImportSource}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-xl shadow-indigo-950/50"
          >
            <UploadCloud className="w-4 h-4" />
            Tích Hợp & Tối Ưu Hóa Ngay
          </button>
        </div>
      </div>

      {/* Guide Card */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs text-slate-300 space-y-2">
        <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Hướng Dẫn Tải Lên Trực Tiếp Của AI Studio:
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>Môi trường phát triển đã chạy sẵn Express Server tại đường dẫn chính <code>/api/*</code>.</li>
          <li>Anh có thể dùng bảng quản lý file bên trái trong màn hình AI Studio để tải thẳng các file code <code>.ts</code>, <code>.tsx</code>, <code>.json</code> vào thư mục <code>src/</code>.</li>
          <li>Sau khi tích hợp source, em sẽ đồng bộ hóa tự động dữ liệu và tiến hành tối ưu thuật toán phân tích sự cố!</li>
        </ul>
      </div>
    </div>
  );
};
