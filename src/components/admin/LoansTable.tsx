import React, { useState } from 'react';
import { Loan, Item } from '../../types';
import { DB } from '../../services/db';
import { shortName } from '../../utils/shortName';
import {
  Layers,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  Package,
  Edit3,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface LoansTableProps {
  allItems: Item[];
  onDataChanged: () => void;
}

export const LoansTable: React.FC<LoansTableProps> = ({
  allItems,
  onDataChanged,
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [itemFilter, setItemFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [correctingLoan, setCorrectingLoan] = useState<Loan | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    borrower_name: '',
    division: '',
    phone: '',
    loan_date: '',
    due_date: '',
    reason: '',
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Stats summary (T-3.4)
  const stats = DB.getSummaryStats();
  const stockPct =
    stats.totalQty > 0 ? Math.round((stats.availableQty / stats.totalQty) * 100) : 0;
  const stockBarColor =
    stockPct > 50 ? 'bg-emerald-500' : stockPct > 20 ? 'bg-amber-500' : 'bg-red-500';

  // Query data (T-3.3)
  const result = DB.getLoans({
    search: searchQuery,
    status: statusFilter,
    itemId: itemFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    perPage: itemsPerPage,
  });

  const handleOpenCorrection = (loan: Loan) => {
    setCorrectingLoan(loan);
    setCorrectionForm({
      borrower_name: loan.borrower_name,
      division: loan.division,
      phone: loan.phone || '',
      loan_date: loan.loan_date,
      due_date: loan.due_date,
      reason: '',
    });
    setNotification(null);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingLoan) return;

    if (!correctionForm.reason.trim()) {
      setNotification({
        type: 'error',
        message: 'Alasan koreksi data wajib diisi untuk rekam audit administrasi.',
      });
      return;
    }

    try {
      // T-3.6: Koreksi dalam DB::transaction
      DB.correctLoan({
        loan_id: correctingLoan.id,
        borrower_name: correctionForm.borrower_name,
        division: correctionForm.division,
        phone: correctionForm.phone,
        loan_date: correctionForm.loan_date,
        due_date: correctionForm.due_date,
        reason: correctionForm.reason,
      });

      setNotification({
        type: 'success',
        message: `Koreksi data peminjaman #${correctingLoan.id} berhasil dicatat dalam audit trail.`,
      });
      setCorrectingLoan(null);
      onDataChanged();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menyimpan koreksi.',
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('semua');
    setItemFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* T-3.4: Ringkasan di atas daftar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Sedang Dipinjam */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Sedang dipinjam</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-[18px] h-[18px]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {stats.borrowedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">transaksi aktif belum kembali</p>
        </div>

        {/* Terlambat: hanya merah kalau ada */}
        <div
          className={`p-5 rounded-2xl border shadow-sm ${
            stats.overdueCount > 0
              ? 'bg-red-50 border-red-200 ring-1 ring-red-100'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-medium ${
                stats.overdueCount > 0 ? 'text-red-700' : 'text-slate-500'
              }`}
            >
              Terlambat
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                stats.overdueCount > 0
                  ? 'bg-red-100 text-red-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-[18px] h-[18px]" />
            </div>
          </div>
          <p
            className={`mt-3 text-3xl font-extrabold tracking-tight ${
              stats.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {stats.overdueCount}
          </p>
          <p
            className={`text-xs mt-1 ${
              stats.overdueCount > 0 ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {stats.overdueCount > 0
              ? 'melewati batas tanggal kembali'
              : 'tidak ada keterlambatan'}
          </p>
        </div>

        {/* Sudah Kembali */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Sudah kembali</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-[18px] h-[18px]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {stats.returnedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">riwayat peminjaman selesai</p>
        </div>

        {/* Ketersediaan Stok */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Stok tersedia</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-[18px] h-[18px]" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {stats.availableQty}
            <span className="text-base font-semibold text-slate-400">
              {' '}
              / {stats.totalQty} unit
            </span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stockBarColor}`}
              style={{ width: `${stockPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{stockPct}% siap dipinjam</p>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar (T-3.3 & T-3.7) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari peminjam, divisi, atau nama barang..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filter: "Belum Dikembalikan" (T-3.7) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === 'belum_kembali' ? 'semua' : 'belum_kembali');
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${
                statusFilter === 'belum_kembali'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              ⚡ Filter Cepat: Belum Dikembalikan
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 underline font-medium"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Multi Criteria Dropdowns (Status, Barang, Rentang Tanggal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Peminjaman
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="belum_kembali">Belum Dikembalikan (Aktif)</option>
              <option value="dipinjam">Dipinjam (Berjalan)</option>
              <option value="terlambat">Terlambat (Overdue)</option>
              <option value="dikembalikan">Dikembalikan (Selesai)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filter Barang Tertentu
            </label>
            <select
              value={itemFilter}
              onChange={(e) => {
                setItemFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Semua Barang</option>
              {allItems.map((item) => (
                <option key={item.id} value={item.id} title={item.name}>
                  {shortName(item.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Dari Tanggal Pinjam
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Sampai Tanggal Pinjam
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Table of Loans (T-3.1 & T-3.2) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3">Peminjam</th>
                <th className="py-3 px-3">Divisi</th>
                <th className="py-3 px-3">Barang & Qty</th>
                <th className="py-3 px-3">Tgl Pinjam</th>
                <th className="py-3 px-3">Batas Kembali</th>
                <th className="py-3 px-3">Tgl Kembali</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.data.map((loan) => {
                const isOverdue = loan.display_status === 'Terlambat';
                const isReturned = loan.display_status === 'Dikembalikan';

                return (
                  <tr
                    key={loan.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOverdue ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {loan.borrower_name}
                      </div>
                      {loan.phone && (
                        <div className="font-mono text-[11px] text-slate-500">
                          {loan.phone}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {loan.division}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {loan.items?.map((it) => (
                          <div key={it.id} className="text-xs flex items-center gap-1">
                            <span className="font-medium text-slate-800">
                              {it.item_name}
                            </span>
                            <span className="font-mono font-bold text-blue-600">
                              ({it.qty}x)
                            </span>
                            {it.return_condition && (
                              <span
                                className={`text-[10px] px-1 py-0.2 rounded font-semibold uppercase ${
                                  it.return_condition === 'hilang'
                                    ? 'bg-red-100 text-red-700'
                                    : it.return_condition === 'rusak'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {it.return_condition}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono text-xs">
                      {loan.loan_date}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs">
                      <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {loan.due_date}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {loan.returned_date || '-'}
                    </td>

                    {/* T-3.2: Badge status berwarna */}
                    <td className="py-3 px-3 text-center">
                      {isReturned ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Dikembalikan
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Terlambat (+{loan.days_late}h)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          Dipinjam
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailLoan(loan)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCorrection(loan)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-amber-50"
                          title="Koreksi Data Peminjaman (Admin)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {result.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi peminjaman yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {result.lastPage > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Halaman {result.page} dari {result.lastPage} ({result.total} transaksi)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-30 hover:bg-white text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= result.lastPage}
                onClick={() => setCurrentPage((p) => Math.min(result.lastPage, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-30 hover:bg-white text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal (T-3.5) */}
      {detailLoan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Detail Peminjaman Barang</h3>
                <span className="font-mono text-xs text-blue-600 font-semibold">{detailLoan.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailLoan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">Nama Peminjam</span>
                  <span className="font-bold text-slate-900">{detailLoan.borrower_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Divisi</span>
                  <span className="font-medium text-slate-800">{detailLoan.division}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">No. Kontak</span>
                  <span className="font-medium text-slate-800">{detailLoan.phone || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Tgl Pinjam</span>
                  <span className="font-bold text-slate-800">{detailLoan.loan_date}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Batas Kembali</span>
                  <span className="font-bold text-blue-700">{detailLoan.due_date}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Tgl Kembali</span>
                  <span className="font-bold text-slate-800">{detailLoan.returned_date || 'Belum'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2">Barang yang Dipinjam:</span>
                <div className="space-y-1.5">
                  {detailLoan.items?.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="font-semibold text-slate-800 block text-xs">
                            {it.item_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-600 block">{it.qty} Unit</span>
                        {it.return_condition && (
                          <span className="text-[10px] font-bold text-slate-600 capitalize">
                            Kondisi: {it.return_condition}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {detailLoan.notes && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Catatan & Log Audit:</span>
                  <pre className="whitespace-pre-wrap font-sans">{detailLoan.notes}</pre>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setDetailLoan(null)}
                className="px-4 py-2 font-semibold text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Koreksi Data Modal (T-3.6: Should) */}
      {correctingLoan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">
                Koreksi Data Peminjaman #{correctingLoan.id}
              </h3>
              <button
                type="button"
                onClick={() => setCorrectingLoan(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Koreksi data dilakukan dalam <code>DB::transaction</code> dan alasan perbaikan akan disimpan permanen ke dalam catatan audit.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Peminjam</label>
                <input
                  type="text"
                  required
                  value={correctionForm.borrower_name}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, borrower_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Divisi</label>
                <input
                  type="text"
                  required
                  value={correctionForm.division}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, division: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tgl Pinjam</label>
                  <input
                    type="date"
                    required
                    value={correctionForm.loan_date}
                    onChange={(e) =>
                      setCorrectionForm({ ...correctionForm, loan_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rencana Kembali</label>
                  <input
                    type="date"
                    required
                    value={correctionForm.due_date}
                    onChange={(e) =>
                      setCorrectionForm({ ...correctionForm, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Koreksi (Wajib untuk Audit Log) <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Salah ketik nama peminjam saat input form."
                  value={correctionForm.reason}
                  onChange={(e) =>
                    setCorrectionForm({ ...correctionForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCorrectingLoan(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  Simpan Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};