import React, { useState, useEffect } from 'react';
import { DB } from './services/db';
import { Auth, SessionState } from './services/auth';
import { Item, Loan } from './types';
import { KioskHeader } from './components/kiosk/KioskHeader';
import { ItemList } from './components/kiosk/ItemList';
import { BorrowModal } from './components/kiosk/BorrowModal';
import { ReturnView } from './components/kiosk/ReturnView';
import { AdminLayout } from './components/admin/AdminLayout';
import { ItemsCrud } from './components/admin/ItemsCrud';
import { LoansTable } from './components/admin/LoansTable';
import { ReportsView } from './components/admin/ReportsView';
import { TestRunnerModal } from './components/admin/TestRunnerModal';
import { LoginModal } from './components/admin/LoginModal';

export default function App() {
  // App view state
  const [appMode, setAppMode] = useState<'kiosk' | 'admin'>('kiosk');
  const [kioskTab, setKioskTab] = useState<'katalog' | 'kembali'>('katalog');
  const [adminTab, setAdminTab] = useState<'barang' | 'peminjaman' | 'laporan' | 'pengujian'>('peminjaman');

  // Auth state
  const [session, setSession] = useState<SessionState>(Auth.getState());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Kiosk Borrow Modal State
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedItemIdForBorrow, setSelectedItemIdForBorrow] = useState<string | undefined>();

  // Database snapshot trigger
  const [dbVersion, setDbVersion] = useState(1);
  const refreshDb = () => setDbVersion((v) => v + 1);

  // Load items list
  const [items, setItems] = useState<Item[]>(() => DB.getItems({ perPage: 100 }).data);

  useEffect(() => {
    setItems(DB.getItems({ perPage: 100 }).data);
  }, [dbVersion]);

  // Refresh otomatis saat data diubah dari tab lain
  useEffect(() => {
    return DB.subscribe(() => setDbVersion((v) => v + 1));
  }, []);

  // Auth subscription
  useEffect(() => {
    const unsub = Auth.subscribe((newState) => {
      setSession(newState);
      if (!newState.user && appMode === 'admin') {
        setAppMode('kiosk');
      }
    });
    return unsub;
  }, [appMode]);

  // Handle switching to Admin mode (Protected Route T-1.13 & FR-03.1)
  const handleOpenAdmin = () => {
    if (Auth.isAuthenticated()) {
      setAppMode('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleSelectItemForBorrow = (itemId: string) => {
    setSelectedItemIdForBorrow(itemId);
    setIsBorrowModalOpen(true);
  };

  const handleOpenGeneralBorrowModal = () => {
    setSelectedItemIdForBorrow(undefined);
    setIsBorrowModalOpen(true);
  };

  const handleLoanCreated = (_newLoan: Loan) => {
    refreshDb();
  };

  const handleReturnSuccess = () => {
    refreshDb();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {appMode === 'kiosk' ? (
        /* KIOSK MODE (Karyawan tanpa login) */
        <div className="flex-1 flex flex-col">
          <KioskHeader
            currentTab={kioskTab}
            onTabChange={setKioskTab}
            onOpenAdminLogin={() => setIsLoginModalOpen(true)}
            isAdminLoggedIn={Auth.isAuthenticated()}
            onGoToAdmin={handleOpenAdmin}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
            {kioskTab === 'katalog' ? (
              <ItemList
                items={items}
                onSelectItemForBorrow={handleSelectItemForBorrow}
                onOpenGeneralBorrowModal={handleOpenGeneralBorrowModal}
              />
            ) : (
              <ReturnView onReturnSuccess={handleReturnSuccess} />
            )}
          </main>

          {/* Simple Kiosk Footer */}
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Sistem Peminjaman & Inventaris Kantor © 2026</span>
              <span className="text-[11px] text-slate-400">
                Layar Sentuh Komputer Bersama · Privasi Terisolasi per ID Peminjam
              </span>
            </div>
          </footer>

          {/* Borrow Form Modal */}
          {isBorrowModalOpen && (
            <BorrowModal
              isOpen={isBorrowModalOpen}
              onClose={() => setIsBorrowModalOpen(false)}
              allItems={items}
              initialSelectedItemId={selectedItemIdForBorrow}
              onLoanSuccess={handleLoanCreated}
            />
          )}

          {/* Login Admin Modal */}
          {isLoginModalOpen && (
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
              onLoginSuccess={() => {
                setAppMode('admin');
              }}
            />
          )}
        </div>
      ) : (
        /* ADMIN PANEL (Login Petugas) */
        <AdminLayout
          currentTab={adminTab}
          onTabChange={setAdminTab}
          onExitToKiosk={() => setAppMode('kiosk')}
        >
          {adminTab === 'barang' && <ItemsCrud onDataChanged={refreshDb} />}
          {adminTab === 'peminjaman' && (
            <LoansTable allItems={items} onDataChanged={refreshDb} />
          )}
          {adminTab === 'laporan' && <ReportsView allItems={items} />}
          {adminTab === 'pengujian' && (
            <TestRunnerModal onDatabaseReset={refreshDb} />
          )}
        </AdminLayout>
      )}
    </div>
  );
}