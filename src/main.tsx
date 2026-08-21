import React, { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanStaleLocalStorage } from './utils/storageCleaner';

// Tự động dọn dẹp các bản sao bộ nhớ đệm cũ quá 30 ngày trên localStorage
cleanStaleLocalStorage(30);

// React Error Boundary để bắt và hiển thị lỗi an toàn
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary] Đã bắt ngoại lệ giao diện:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      // Dọn dẹp cache tạm thời (không xóa phiên bản CAPA hay bản nháp quan trọng)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('temp_') || key.startsWith('capa_print_snapshot_') || key.startsWith('capa_print_target_'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              Khôi Phục Giao Diện Ứng Dụng
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {this.state.error?.message || 'Hệ thống đã tự động bảo vệ giao diện khỏi sự cố bộ nhớ tạm.'}
            </p>
            <button
              onClick={this.handleClearCacheAndReload}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-98"
            >
              Làm mới & Khôi phục phiên làm việc
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Đăng ký Service Worker cho PWA META ANDON
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('META ANDON SW registered successfully:', reg.scope))
      .catch((err) => console.warn('META ANDON SW registration skipped:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

