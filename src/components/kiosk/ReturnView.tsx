import React, { useState } from 'react';
import { Loan, ReturnItemCondition } from '../../types';
import { DB } from '../../services/db';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from 'lucide-react';

interface ReturnViewProps {
  onReturnSuccess: () => void;
}

export const ReturnView: React.FC<ReturnViewProps> = ({ onReturnSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected loan to return
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  // Condition state map: { [itemId]: ReturnItemCondition }
  const [conditions, setConditions] = useState<Record<string, ReturnItemCondition>>({});
  const [returnNotes, setReturnNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Search loans for borrower by name or division
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSelectedLoan(null);

    const query = searchQuery.trim();
    if (!query) {
      setFeedback({
        type: 'error',
        message: 'Masukkan nama peminjam atau divisi untuk mencari peminjaman.',
      });
      return;
    }

    setIsSearching(true);
    try {
      // Cari peminjaman aktif berdasarkan nama atau divisi
      const result = DB.getLoans({
        search: query,
        status: 'belum_kembali',
      });

      setActiveLoans(result.data);
      setSearchedQuery(query);

      if (result.data.length === 0) {
        setFeedback({
          type: 'error',
          message: `Tidak ditemukan peminjaman aktif untuk "${query}". Pastikan nama atau divisi sudah benar, atau barang sudah pernah dikembalikan.`,
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Terjadi kesalahan saat memuat data peminjaman.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setFeedback(null);

    // Initialize conditions for all items in this loan default to 'baik'
    const initialCond: Record<string, ReturnItemCondition> = {};
    loan.items?.forEach((it) => {
      initialCond[it.item_id] = 'baik';
    });
    setConditions(initialCond);
  };

  const handleSetCondition = (itemId: string, cond: ReturnItemCondition) => {
    setConditions((prev) => ({
      ...prev,
      [itemId]: cond,
    }));
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const itemsPayload =
        selectedLoan.items?.map((it) => ({
          item_id: it.item_id,
          condition: conditions[it.item_id] || 'baik',
        })) || [];

      // Execute in DB::transaction
      DB.returnLoan({
        loan_id: selectedLoan.id,
        items: itemsPayload,
        notes: returnNotes,
      });

      setFeedback({
        type: 'success',
        message: `Pengembalian barang untuk peminjaman #${selectedLoan.id} berhasil dicatat! Terima kasih telah mengembalikan tepat waktu.`,
      });

      // Reset selection
      setSelectedLoan(null);
      // Refresh search list
      if (searchedQuery) {
        const refreshed = DB.getLoans({
          search: searchedQuery,
          status: 'belum_kembali',
        });
        setActiveLoans(refreshed.data);
      }
      onReturnSuccess();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal memproses pengembalian barang.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Formulir Pengembalian Mandiri
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan nama atau divisi Anda untuk melihat dan memverifikasi pengembalian barang yang sedang dipinjam.
            </p>
          </div>
        </div>

        {/* Name / Division Lookup Form */}
        <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              placeholder="Ketik nama peminjam atau divisi (misal: Budi / IT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            {isSearching ? (
              'Mencari...'
            ) : (
              <>
                <Search className="w-4 h-4" />
                Cari Peminjaman Saya
              </>
            )}
          </button>
        </form>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* List of Active Loans for this Employee */}
      {searchedQuery && activeLoans.length > 0 && !selectedLoan && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Peminjaman Aktif untuk <span className="font-mono text-blue-600">"{searchedQuery}"</span>
            </h3>
            <span className="text-xs text-slate-500">
              {activeLoans.length} peminjaman belum dikembalikan
            </span>
          </div>

          <div className="space-y-3">
            {activeLoans.map((loan) => {
              const isOverdue = loan.display_status === 'Terlambat';

              return (
                <div
                  key={loan.id}
                  className={`bg-white rounded-xl border p-5 transition-all hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isOverdue ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                        {loan.id}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        {loan.borrower_name} ({loan.division})
                      </span>
                      {isOverdue ? (
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Terlambat {loan.days_late} Hari
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                          Sedang Dipinjam
                        </span>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {loan.items?.map((it) => (
                        <div
                          key={it.id}
                          className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium flex items-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          <span>{it.item_name}</span>
                          <span className="font-bold text-blue-600 font-mono">
                            ×{it.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Tgl Pinjam: {loan.loan_date}
                      </span>
                      <span>·</span>
                      <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                        Batas Kembali: {loan.due_date}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectLoan(loan)}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Pilih untuk Dikembalikan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Return Confirmation & Physical Condition Selection (T-2.11) */}
      {selectedLoan && (
        <form
          onSubmit={handleConfirmReturn}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Pemeriksaan Kondisi Fisik Barang
              </h3>
              <p className="text-xs text-slate-500">
                Pilih kondisi fisik untuk setiap barang saat ini sebelum diserahkan ke loker kantor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              Kembali ke Daftar
            </button>
          </div>

          {/* Items Condition Cards */}
          <div className="space-y-4">
            {selectedLoan.items?.map((it) => {
              const currentCondition = conditions[it.item_id] || 'baik';

              return (
                <div
                  key={it.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {it.item_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          Jumlah: <strong className="text-slate-800">{it.qty} unit</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Condition Selector: Touch Friendly 48px cards */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Kondisi Fisik Saat Dikembalikan:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* BAIK */}
                      <button
                        type="button"
                        onClick={() => handleSetCondition(it.item_id, 'baik')}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          currentCondition === 'baik'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <ShieldCheck
                          className={`w-5 h-5 ${
                            currentCondition === 'baik' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-xs sm:text-sm">Baik / Normal</div>
                          <div className="text-[11px] text-slate-500">Stok kembali tersedia</div>
                        </div>
                      </button>

                      {/* RUSAK */}
                      <button
                        type="button"
                        onClick={() => handleSetCondition(it.item_id, 'rusak')}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          currentCondition === 'rusak'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            currentCondition === 'rusak' ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-xs sm:text-sm">Rusak / Cacat</div>
                          <div className="text-[11px] text-slate-500">Dicatat untuk servis</div>
                        </div>
                      </button>

                      {/* HILANG */}
                      <button
                        type="button"
                        onClick={() => handleSetCondition(it.item_id, 'hilang')}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          currentCondition === 'hilang'
                            ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <XCircle
                          className={`w-5 h-5 ${
                            currentCondition === 'hilang' ? 'text-red-600' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-xs sm:text-sm">Hilang</div>
                          <div className="text-[11px] text-slate-500">Total stok berkurang</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Kondisi / Keterangan Pengembalian (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Barang diletakkan di lemari loker GA lantai 2, kabel HDMI lengkap."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          </div>

          {/* Submit Action (T-2.12 & T-2.13) */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedLoan(null)}
              disabled={isSubmitting}
              className="px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                'Memproses Transaksi...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Pengembalian Barang
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
