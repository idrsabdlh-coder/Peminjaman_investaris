import React, { useState } from 'react';
import { Item, Loan } from '../../types';
import { DB } from '../../services/db';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Calendar,
  User,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  Package,
} from 'lucide-react';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  allItems: Item[];
  initialSelectedItemId?: string;
  onLoanSuccess: (loan: Loan) => void;
}

interface CartItem {
  item_id: string;
  qty: number;
}

const COMMON_DIVISIONS = [
  'Teknologi Informasi (IT)',
  'Marketing & Komunikasi',
  'Keuangan & Akuntansi',
  'Human Resources (HRD)',
  'General Affairs & Operasional',
  'Legal & Kepatuhan',
];

// Ambil nama singkat: potong di " / " pertama, lalu batasi panjangnya
const shortName = (name: string, max = 26) => {
  const base = name.split(' / ')[0].trim();
  return base.length > max ? base.slice(0, max).trim() + '…' : base;
};

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  onClose,
  allItems,
  initialSelectedItemId,
  onLoanSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 3600 * 1000)
    .toISOString()
    .split('T')[0];

  // Form State
  const [borrowerName, setBorrowerName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [division, setDivision] = useState('');
  const [phone, setPhone] = useState('');
  const [loanDate, setLoanDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(tomorrowStr);
  const [notes, setNotes] = useState('');

  // Items Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (initialSelectedItemId) {
      return [{ item_id: initialSelectedItemId, qty: 1 }];
    }
    const firstAvailable = allItems.find((i) => i.available_qty > 0);
    return firstAvailable ? [{ item_id: firstAvailable.id, qty: 1 }] : [];
  });

  // Protection & submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedLoan, setConfirmedLoan] = useState<Loan | null>(null);
  const [formToken, setFormToken] = useState<string>(() => 'tok_' + Date.now());

  if (!isOpen) return null;

  const availableItems = allItems.filter((i) => i.available_qty > 0);

  // Cart operations
  const handleAddItemToCart = () => {
    const unselectedItem = availableItems.find(
      (item) => !cart.some((c) => c.item_id === item.id)
    );
    if (unselectedItem) {
      setCart([...cart, { item_id: unselectedItem.id, qty: 1 }]);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = cart.filter((_, idx) => idx !== index);
    setCart(updated);
  };

  const handleUpdateItem = (index: number, newItemId: string) => {
    const updated = [...cart];
    updated[index].item_id = newItemId;
    updated[index].qty = 1;
    setCart(updated);
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const updated = [...cart];
    const current = updated[index];
    const item = allItems.find((i) => i.id === current.item_id);
    if (!item) return;

    const newQty = current.qty + delta;
    if (newQty >= 1 && newQty <= item.available_qty) {
      current.qty = newQty;
      setCart(updated);
    }
  };

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validation
    if (!borrowerName.trim()) {
      setErrorMessage('Nama peminjam wajib diisi.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMessage('NIK / ID Karyawan wajib diisi.');
      return;
    }
    if (!division.trim()) {
      setErrorMessage('Divisi karyawan wajib diisi.');
      return;
    }
    if (dueDate < loanDate) {
      setErrorMessage('Tanggal rencana kembali tidak boleh sebelum tanggal pinjam.');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('Pilih minimal 1 barang untuk dipinjam.');
      return;
    }

    // Check duplicate items
    const ids = cart.map((c) => c.item_id);
    if (new Set(ids).size !== ids.length) {
      setErrorMessage('Ada barang yang sama dipilih berulang kali. Silakan sesuaikan jumlahnya.');
      return;
    }

    // Check quantities
    for (const c of cart) {
      const it = allItems.find((i) => i.id === c.item_id);
      if (!it || c.qty > it.available_qty) {
        setErrorMessage(
          `Jumlah pinjam untuk "${it?.name || 'Barang'}" melebihi stok tersedia (${it?.available_qty || 0} unit).`
        );
        return;
      }
    }

    // T-2.8: Anti double submit
    setIsSubmitting(true);

    try {
      // Execute in DB::transaction
      const newLoan = DB.createLoan({
        borrower_name: borrowerName,
        employee_id: employeeId,
        division,
        phone,
        loan_date: loanDate,
        due_date: dueDate,
        items: cart,
        notes,
      });

      // Invalidate token
      setFormToken('used_' + Date.now());
      setConfirmedLoan(newLoan);
      onLoanSuccess(newLoan);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan peminjaman. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {confirmedLoan ? 'Konfirmasi Peminjaman Berhasil' : 'Formulir Peminjaman Barang'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {confirmedLoan
                ? 'Peminjaman telah tercatat secara resmi di database kantor.'
                : 'Isi data peminjam dan pastikan barang dikembalikan tepat waktu.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {confirmedLoan ? (
            /* SUCCESS CONFIRMATION RECEIPT (T-2.9) */
            <div className="space-y-6">
              <div className="text-center py-4 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-emerald-900">Peminjaman Berhasil Dicatat!</h3>
                <p className="text-xs text-emerald-700">
                  Stok barang telah otomatis diperbarui. Harap simpan bukti ini atau catat tanggal kembali.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 font-sans text-sm">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ID Peminjaman</span>
                  <span className="font-mono font-bold text-slate-900">{confirmedLoan.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Nama Peminjam</span>
                    <span className="font-semibold text-slate-900">{confirmedLoan.borrower_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">NIK / ID Karyawan</span>
                    <span className="font-semibold text-slate-900">{confirmedLoan.employee_id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Divisi</span>
                    <span className="font-semibold text-slate-900">{confirmedLoan.division}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">No. Kontak</span>
                    <span className="font-semibold text-slate-900">{confirmedLoan.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Tanggal Pinjam</span>
                    <span className="font-semibold text-slate-900">{confirmedLoan.loan_date}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Wajib Kembali Pada</span>
                    <span className="font-semibold text-blue-700">{confirmedLoan.due_date}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500 block mb-2 font-semibold">Daftar Barang yang Dipinjam:</span>
                  <div className="space-y-1.5">
                    {confirmedLoan.items?.map((it) => (
                      <div
                        key={it.id}
                        className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200/80"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-800 text-xs sm:text-sm">
                            {it.item_name}
                          </span>
                        </div>
                        <span className="font-bold text-blue-600 text-sm">
                          {it.qty} Unit
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {confirmedLoan.notes && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Keterangan:</span> {confirmedLoan.notes}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Bukti Peminjaman
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 text-sm transition-colors shadow-xs"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : (
            /* FORM INPUT */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Identitas Karyawan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap Peminjam <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIK / ID Karyawan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: EMP-1042"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm uppercase rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Divisi / Unit Kerja <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      list="divisi-options"
                      placeholder="Pilih atau ketik divisi..."
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <datalist id="divisi-options">
                      {COMMON_DIVISIONS.map((div) => (
                        <option key={div} value={div} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    No. WhatsApp / Telepon <span className="text-slate-400 text-xs font-normal">(Opsional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Tanggal Peminjaman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Pinjam <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      value={loanDate}
                      onChange={(e) => setLoanDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal Rencana Kembali <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      min={loanDate}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-blue-300 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pemilihan Barang (Bisa lebih dari 1 barang, stok tervalidasi) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    Barang yang Dipinjam ({cart.length})
                  </label>

                  {cart.length < availableItems.length && (
                    <button
                      type="button"
                      onClick={handleAddItemToCart}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Barang
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    Belum ada barang yang dipilih. Klik tombol "Tambah Barang" di atas.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {cart.map((cartItem, idx) => {
                      const selectedItem = allItems.find((i) => i.id === cartItem.item_id);
                      const maxAvailable = selectedItem?.available_qty || 1;

                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <div className="flex-1 min-w-0">
                            <select
                              value={cartItem.item_id}
                              onChange={(e) => handleUpdateItem(idx, e.target.value)}
                              className="w-full py-2 px-3 text-sm font-medium rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                              {availableItems.map((item) => {
                                const isAlreadyChosen = cart.some(
                                  (c, cIdx) => c.item_id === item.id && cIdx !== idx
                                );
                                return (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                    disabled={isAlreadyChosen}
                                    title={item.name}
                                  >
                                    {shortName(item.name)}
                                    {isAlreadyChosen ? ' (dipilih)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                            {selectedItem && (
                              <p className="mt-1 text-[11px] text-slate-400 truncate">
                                {selectedItem.code} · {selectedItem.name}
                              </p>
                            )}
                          </div>

                          {/* Stepper Jumlah */}
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="flex items-center border border-slate-300 bg-white rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, -1)}
                                disabled={cartItem.qty <= 1}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-10 text-center font-bold text-sm text-slate-800">
                                {cartItem.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, 1)}
                                disabled={cartItem.qty >= maxAvailable}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-xs text-slate-500">
                              / maks {maxAvailable}
                            </span>

                            {cart.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(idx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
                                title="Hapus dari daftar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Catatan / Keperluan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keperluan / Catatan Peminjaman
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Rapat presentasi tender di Ruang Rapat Anggrek"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Simpan Peminjaman
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};