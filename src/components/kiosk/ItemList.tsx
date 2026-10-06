import React, { useState } from 'react';
import { Item } from '../../types';
import { Search, Package, PlusCircle } from 'lucide-react';

interface ItemListProps {
  items: Item[];
  onSelectItemForBorrow: (itemId: string) => void;
  onOpenGeneralBorrowModal: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  onSelectItemForBorrow,
  onOpenGeneralBorrowModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const totalAvailableUnits = items.reduce((sum, it) => sum + it.available_qty, 0);

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Perlu Alat atau Perangkat Kantor?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-6 leading-relaxed">
            Pilih barang di bawah ini, atau langsung isi formulir peminjaman sebagai karyawan atau anak magang.
          </p>
          <button
            type="button"
            onClick={onOpenGeneralBorrowModal}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-blue-700 font-bold text-sm sm:text-base rounded-xl shadow-lg hover:bg-blue-50 active:scale-98 transition-all"
          >
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Isi Formulir Peminjaman
          </button>
        </div>
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden sm:block">
          <Package className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Search + ringkasan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama atau kode barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-slate-500">
          {filteredItems.length} barang,{' '}
          <span className="font-semibold text-emerald-600">
            {totalAvailableUnits} unit siap pinjam
          </span>
        </p>
      </div>

      {/* Daftar barang: satu baris per barang */}
      <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {filteredItems.map((item) => {
          const isOutOfStock = item.available_qty <= 0;

          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className={`min-w-0 ${isOutOfStock ? 'opacity-60' : ''}`}>
                <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                <p className="text-xs text-slate-500">
                  
                  {' · '}
                  {isOutOfStock ? (
                    <span className="text-amber-700 font-medium">Sedang dipinjam semua</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      {item.available_qty} dari {item.total_qty} tersedia
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => onSelectItemForBorrow(item.id)}
                className={`shrink-0 min-h-12 px-5 rounded-xl font-bold text-sm transition-all ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-98'
                }`}
              >
                {isOutOfStock ? 'Habis' : 'Pinjam'}
              </button>
            </li>
          );
        })}
      </ul>

      {filteredItems.length === 0 && (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">Barang tidak ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain.</p>
        </div>
      )}
    </div>
  );
};