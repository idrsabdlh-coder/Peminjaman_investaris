import React, { useState, useEffect } from 'react';
import { Clock, Shield, Monitor, RefreshCw, Box } from 'lucide-react';

interface KioskHeaderProps {
  currentTab: 'katalog' | 'kembali';
  onTabChange: (tab: 'katalog' | 'kembali') => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn: boolean;
  onGoToAdmin: () => void;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onGoToAdmin,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setTimeStr(now.toLocaleDateString('id-ID', options) + ' WIB');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & Kiosk Location */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Peminjaman Barang Kantor
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Terminal Mandiri (Kiosk)
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5" />
                    Layar Komputer Kantor
                  </span>
                </div>
              </div>
            </div>

            {/* Admin entry point (subtle, non-obtrusive per PRD T-2.2) */}
            <div className="sm:hidden">
              {isAdminLoggedIn ? (
                <button
                  onClick={onGoToAdmin}
                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  Panel Admin
                </button>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="text-xs text-slate-400 hover:text-slate-600 p-1"
                  title="Akses Petugas Admin"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Central Mode Switcher (Kiosk Big Buttons) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => onTabChange('katalog')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                currentTab === 'katalog'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box className="w-4 h-4" />
              1. Katalog & Pinjam
            </button>
            <button
              type="button"
              onClick={() => onTabChange('kembali')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 ${
                currentTab === 'kembali'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              2. Pengembalian Mandiri
            </button>
          </div>

          {/* Clock & Desktop Admin Link */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeStr || 'Memuat waktu...'}</span>
            </div>

            {isAdminLoggedIn ? (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                Masuk Panel Admin
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded transition-colors flex items-center gap-1"
                title="Khusus Petugas Inventaris"
              >
                <Shield className="w-3.5 h-3.5" />
                Login Petugas
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
