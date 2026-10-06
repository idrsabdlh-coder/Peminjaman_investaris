import React, { useState } from 'react';
import { Loan, Item } from '../../types';
import { DB } from '../../services/db';
import { PDFExportService } from '../../services/pdf';
import { shortName } from '../../utils/shortName';
import {
  FileText,
  Download,
  Filter,
  AlertTriangle,
  Package,
  Printer,
} from 'lucide-react';

interface ReportsViewProps {
  allItems: Item[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ allItems }) => {
  // Filter States (T-4.1)
  const [statusFilter, setStatusFilter] = useState('semua');
  const [itemFilter, setItemFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery] = useState('');

  // Fetch filtered loans
  const queryResult = DB.getLoans({
    search: searchQuery,
    status: statusFilter,
    itemId: itemFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    perPage: 100, // For report preview
  });

  const filteredLoans = queryResult.data;

  // Trigger PDF Downloads
  const handleExportFilteredLoans = () => {
    let filterDescription = 'Semua Transaksi';
    const parts = [];
    if (statusFilter !== 'semua') parts.push(`Status: ${statusFilter}`);
    if (startDate && endDate) parts.push(`Periode: ${startDate} s/d ${endDate}`);
    else if (startDate) parts.push(`Mulai: ${startDate}`);
    if (itemFilter) {
      const it = allItems.find((i) => i.id === itemFilter);
      if (it) parts.push(`Barang: ${it.name}`);
    }
    if (parts.length > 0) filterDescription = parts.join(' | ');

    PDFExportService.exportLoansPDF({
      loans: filteredLoans,
      filterDescription,
    });
  };

  const handleExportUnreturned = () => {
    PDFExportService.exportUnreturnedLoansPDF(DB.getLoans({ perPage: 200 }).data);
  };

  const handleExportStock = () => {
    const items = DB.getItems({ perPage: 200 }).data;
    PDFExportService.exportInventoryStockPDF(items);
  };

  return (
    <div className="space-y-6">
      {/* 3 Quick Export Cards (T-4.2, T-4.4, T-4.5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Laporan Peminjaman Berdasarkan Filter */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Rekapitulasi Peminjaman (PDF)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mencetak data peminjaman sesuai filter rentang tanggal, status, dan barang yang aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportFilteredLoans}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Unduh PDF Rekap ({filteredLoans.length} Data)
          </button>
        </div>

        {/* 2. Laporan Barang Belum Dikembalikan */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 flex flex-col justify-between shadow-2xs hover:border-amber-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Barang Belum Kembali (PDF)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Daftar barang aktif yang sedang dipinjam atau telah melewati batas jatuh tempo (Terlambat).
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportUnreturned}
            className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Unduh PDF Belum Kembali
          </button>
        </div>

        {/* 3. Laporan Stok & Status Inventaris */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs hover:border-emerald-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Daftar Stok & Aset (PDF)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Laporan ringkasan seluruh aset master barang, kuantitas total, stok tersedia, dan kondisi fisik.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportStock}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Unduh PDF Stok Barang
          </button>
        </div>
      </div>

      {/* Filter Section (T-4.1 & T-4.6) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          Sesuaikan filter sebelum unduh dokumen
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Status Peminjaman
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="belum_kembali">Belum Kembali (Dipinjam & Terlambat)</option>
              <option value="dipinjam">Hanya Dipinjam</option>
              <option value="terlambat">Hanya Terlambat</option>
              <option value="dikembalikan">Hanya Dikembalikan</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Barang Tertentu
            </label>
            <select
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Semua Barang</option>
              {allItems.map((it) => (
                <option key={it.id} value={it.id} title={it.name}>
                  {shortName(it.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Periode Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Periode Selesai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Document Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700">
            Pratinjau Data yang Akan Masuk ke PDF ({filteredLoans.length} Baris)
          </div>
          <button
            type="button"
            onClick={handleExportFilteredLoans}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak PDF Sekarang
          </button>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs">
              <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Peminjam</th>
                <th className="py-2.5 px-3">ID/NIM</th>
                <th className="py-2.5 px-3">Divisi</th>
                <th className="py-2.5 px-3">Barang & Qty</th>
                <th className="py-2.5 px-3">Tgl Pinjam</th>
                <th className="py-2.5 px-3">Batas Kembali</th>
                <th className="py-2.5 px-3">Tgl Kembali</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((loan, idx) => (
                <tr key={loan.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {loan.borrower_name}
                    {loan.borrower_type === 'magang' && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-semibold">
                        Magang
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{loan.division}</td>
                  <td className="py-2 px-3">
                    {loan.items?.map((it) => `${it.item_name} (${it.qty}x)`).join(', ')}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">{loan.loan_date}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{loan.due_date}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">
                    {loan.returned_date || '-'}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        loan.display_status === 'Dikembalikan'
                          ? 'bg-emerald-50 text-emerald-700'
                          : loan.display_status === 'Terlambat'
                          ? 'bg-red-50 text-red-700 font-bold'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {loan.display_status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok untuk dicetak.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};