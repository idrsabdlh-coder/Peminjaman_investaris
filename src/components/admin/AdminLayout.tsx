import React, { useState, useEffect } from 'react';
import { Auth, SessionState } from '../../services/auth';
import {
  Package,
  Layers,
  FileText,
  LogOut,
  Shield,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

type AdminTab = 'barang' | 'peminjaman' | 'laporan' | 'pengujian';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onExitToKiosk: () => void;
  children: React.ReactNode;
}

const TABS = [
  {
    id: 'peminjaman',
    label: 'Data Peminjaman',
    desc: 'Pantau pinjaman aktif, keterlambatan, dan riwayat pengembalian.',
    icon: Layers,
  },
  {
    id: 'barang',
    label: 'Kelola Barang',
    desc: 'Atur data master barang, stok, dan kondisi fisik aset.',
    icon: Package,
  },
  {
    id: 'laporan',
    label: 'Laporan & PDF',
    desc: 'Rekap peminjaman dan ekspor dokumen laporan.',
    icon: FileText,
  },
  {
    id: 'pengujian',
    label: 'Pengujian',
    desc: 'Validasi aturan bisnis dan kondisi sistem.',
    icon: CheckCircle2,
  },
] as const;

const getInitials = (name?: string) => {
  if (!name) return 'AD';
  const parts = name.replace(/\(.*?\)/g, '').trim().split(/\s+/);
  return (parts[0]?.[0] || 'A').concat(parts[1]?.[0] || '').toUpperCase();
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onExitToKiosk,
  children,
}) => {
  const [session, setSession] = useState<SessionState>(Auth.getState());

  useEffect(() => {
    const unsubscribe = Auth.subscribe((newState) => {
      setSession(newState);
      if (!newState.user) {
        onExitToKiosk();
      }
    });
    return unsubscribe;
  }, [onExitToKiosk]);

  const handleLogout = () => {
    Auth.logout('Logout manual oleh admin');
    onExitToKiosk();
  };

  const activeTab = TABS.find((t) => t.id === currentTab) ?? TABS[0];

  return (
    <div className="min-h-screen bg-slate-50 lg:flex antialiased">
      {/* ===== SIDEBAR (desktop) ===== */}
      <aside className="hidden lg:flex lg:w-64 shrink-0 flex-col bg-slate-950 text-slate-300 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
            <Shield className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-white text-sm">Inventaris Kantor</p>
            <p className="text-xs text-slate-500">Panel administrasi</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-400" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] ${
                    isActive ? 'text-blue-300' : 'text-slate-500'
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Footer: user + actions */}
        <div className="p-3 m-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-200 flex items-center justify-center text-xs font-bold ring-1 ring-blue-400/30">
              {getInitials(session.user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session.user?.name?.replace(/\(.*?\)/g, '').trim() || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session.user?.email || 'admin'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExitToKiosk}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Monitor className="w-3.5 h-3.5" />
              Kiosk
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* ===== KONTEN ===== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-slate-950 text-white sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm truncate">Inventaris Kantor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExitToKiosk}
                className="p-2 rounded-lg bg-white/10 text-slate-300"
                title="Layar kiosk"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-500/15 text-red-300"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-3 pb-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Page heading */}
        <div className="bg-white/80 backdrop-blur border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {activeTab.label}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{activeTab.desc}</p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
};