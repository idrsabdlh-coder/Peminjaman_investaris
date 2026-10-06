import React, { useState } from 'react';
import { Item, Loan, BorrowerType } from '../../types';
import { DB } from '../../services/db';
import {
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
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
  'Admintration & Corporate secreatary',
  'Solopos Institude ',
  'Keuangan & Accounting',
  'General Affair & Project management',
  'Radio Solopos',
  'Pisalin',
  'Legal & Compliance',
];

// Nama singkat untuk dropdown barang
const shortName = (name: string, max = 26) => {
  const base = name.split(' / ')[0].trim();
  return base.length > max ? base.slice(0, max).trim() + '…' : base;
};

// Tanggal lokal (YYYY-MM-DD), bukan UTC
const toLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  onClose,
  allItems,
  initialSelectedItemId,
  onLoanSuccess,
}) => {
  const today = toLocalDate(new Date());
  const tomorrow = toLocalDate(new Date(Date.now() + 24 * 3600 * 1000));

  const [borrowerType, setBorrowerType] = useState<BorrowerType>('karyawan');
  const [borrowerName, setBorrowerName] = useState('');
  const [division, setDivision] = useState('');
  const [dueDate, setDueDate] = useState(tomorrow);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (initialSelectedItemId) {
      return [{ item_id: initialSelectedItemId, qty: 1 }];
    }
    const first = allItems.find((i) => i.available_qty > 0);
    return first ? [{ item_id: first.id, qty: 1 }] : [];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedLoan, setConfirmedLoan] = useState<Loan | null>(null);

  if (!isOpen) return null;

  const availableItems = allItems.filter((i) => i.available_qty > 0);

  // Keranjang
  const handleAddItem = () => {
    const next = availableItems.find((i) => !cart.some((c) => c.item_id === i.id));
    if (next) setCart([...cart, { item_id: next.id, qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleChangeItem = (index: number, itemId: string) => {
    const updated = [...cart];
    updated[index] = { item_id: itemId, qty: 1 };
    setCart(updated);
  };

  const handleChangeQty = (index: number, delta: number) => {
    const updated = [...cart];
    const item = allItems.find((i) => i.id === updated[index].item_id);
    if (!item) return;
    const newQty = updated[index].qty + delta;
    if (newQty >= 1 && newQty <= item.available_qty) {
      updated[index] = { ...updated[index], qty: newQty };
      setCart(updated);
    }
  };

  // Simpan
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!borrowerName.trim() || !division.trim()) {
      setErrorMessage('Nama dan divisi wajib diisi.');
      return;
    }
    if (dueDate < today) {
      setErrorMessage('Tanggal kembali tidak boleh sebelum hari ini.');
      return;
    }
    if (cart.length === 0) {
      setErrorMessage('Pilih minimal 1 barang.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loan = DB.createLoan({
        borrower_type: borrowerType,
        borrower_name: borrowerName,
        division,
        loan_date: today,
        due_date: dueDate,
        items: cart,
      });
      setConfirmedLoan(loan);
      onLoanSuccess(loan);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan peminjaman.');
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <h2 className="text-lg font-bold text-slate-900">
            {confirmedLoan ? 'Peminjaman Berhasil' : 'Formulir Peminjaman'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {confirmedLoan ? (
            /* Struk sederhana */
            <div className="space-y-5">
              <div className="text-center py-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-emerald-900">Peminjaman tercatat</p>
                <p className="text-xs text-emerald-700">
                  Harap kembalikan sebelum {confirmedLoan.due_date}.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Peminjam</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {confirmedLoan.borrower_name}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({confirmedLoan.borrower_type === 'magang' ? 'Anak Magang' : 'Karyawan'})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Divisi</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {confirmedLoan.division}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  {confirmedLoan.items?.map((it) => (
                    <div key={it.id} className="flex justify-between gap-3">
                      <span className="text-slate-800">{it.item_name}</span>
                      <span className="font-bold text-blue-600 whitespace-nowrap">
                        {it.qty} unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center">
                Saat mengembalikan, cukup ketik nama atau divisi Anda di menu Pengembalian.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Selesai
              </button>
            </div>
          ) : (
            /* Formulir */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Karyawan / Anak Magang */}
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: 'karyawan', label: 'Karyawan', icon: Briefcase },
                    { id: 'magang', label: 'Anak Magang', icon: GraduationCap },
                  ] as const
                ).map((type) => {
                  const Icon = type.icon;
                  const selected = borrowerType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setBorrowerType(type.id)}
                      className={`flex items-center justify-center gap-2 min-h-12 rounded-xl border-2 text-sm font-bold transition-colors ${
                        selected
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama peminjam
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Divisi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dari divisi mana?
                </label>
                <input
                  type="text"
                  required
                  list="divisi-options"
                  placeholder="Pilih atau ketik divisi..."
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className={inputClass}
                />
                <datalist id="divisi-options">
                  {COMMON_DIVISIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Barang */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Barang yang dipinjam</label>
                  {cart.length < availableItems.length && (
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah barang
                    </button>
                  )}
                </div>

                {cart.map((cartItem, idx) => {
                  const selected = allItems.find((i) => i.id === cartItem.item_id);
                  const max = selected?.available_qty || 1;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <select
                        value={cartItem.item_id}
                        onChange={(e) => handleChangeItem(idx, e.target.value)}
                        className="flex-1 min-w-0 py-2 px-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                      >
                        {availableItems.map((item) => {
                          const taken = cart.some(
                            (c, cIdx) => c.item_id === item.id && cIdx !== idx
                          );
                          return (
                            <option key={item.id} value={item.id} disabled={taken} title={item.name}>
                              {shortName(item.name)}
                            </option>
                          );
                        })}
                      </select>

                      <div className="flex items-center border border-slate-300 bg-white rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleChangeQty(idx, -1)}
                          disabled={cartItem.qty <= 1}
                          className="w-8 h-9 flex items-center justify-center text-slate-600 disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-sm">{cartItem.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleChangeQty(idx, 1)}
                          disabled={cartItem.qty >= max}
                          className="w-8 h-9 flex items-center justify-center text-slate-600 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {cart.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tanggal kembali */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Akan dikembalikan pada
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Pinjam'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};