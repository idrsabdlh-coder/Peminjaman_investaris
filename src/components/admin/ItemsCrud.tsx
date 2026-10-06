import React, { useState } from 'react';
import { Item, ItemCondition, ItemCategory, ITEM_CATEGORIES } from '../../types';
import { DB } from '../../services/db';
import { CATEGORY_STYLES } from '../../utils/category';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ItemsCrudProps {
  onDataChanged: () => void;
}

export const ItemsCrud: React.FC<ItemsCrudProps> = ({ onDataChanged }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    category: 'Elektronik' as ItemCategory,
    total_qty: 1,
    condition: 'baik' as ItemCondition,
    notes: '',
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Retrieve data with pagination
  const result = DB.getItems({
    search: searchQuery,
    category: categoryFilter || undefined,
    page: currentPage,
    perPage: itemsPerPage,
  });

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    setModalError(null);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      category: 'Elektronik',
      total_qty: 1,
      condition: 'baik',
      notes: '',
    });
    setModalError(null);
    setIsAddModalOpen(true);
    setNotification(null);
  };

  const handleOpenEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      total_qty: item.total_qty,
      condition: item.condition,
      notes: item.notes || '',
    });
    setModalError(null);
    setNotification(null);
  };

  // Submit Add
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // T-1.15: available_qty otomatis sama dengan total_qty saat tambah barang
      const created = DB.createItem({
        name: formData.name,
        category: formData.category,
        total_qty: Number(formData.total_qty),
        condition: formData.condition,
        notes: formData.notes,
      });

      setNotification({
        type: 'success',
        message: `Barang "${created.name}" (${created.category}) berhasil ditambahkan dengan stok ${created.total_qty} unit.`,
      });
      closeModal();
      onDataChanged();
    } catch (err: any) {
      setModalError(err.message || 'Gagal menambahkan barang.');
    }
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      DB.updateItem(editingItem.id, {
        name: formData.name,
        category: formData.category,
        total_qty: Number(formData.total_qty),
        condition: formData.condition,
        notes: formData.notes,
      });

      setNotification({
        type: 'success',
        message: `Data barang "${formData.name}" berhasil diperbarui.`,
      });
      closeModal();
      onDataChanged();
    } catch (err: any) {
      setModalError(err.message || 'Gagal memperbarui data barang.');
    }
  };

  // Delete Action (T-1.17: Cegah hapus bila ada peminjaman aktif)
  const handleDeleteItem = (item: Item) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus barang "${item.name}"?`
    );
    if (!confirmDelete) return;

    try {
      DB.deleteItem(item.id);
      setNotification({
        type: 'success',
        message: `Barang "${item.name}" berhasil dihapus.`,
      });
      // Jaga agar halaman tidak kosong setelah hapus
      const after = DB.getItems({
        search: searchQuery,
        category: categoryFilter || undefined,
        perPage: itemsPerPage,
      });
      setCurrentPage((p) => Math.min(p, after.lastPage));
      onDataChanged();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal menghapus barang.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Add Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Barang Baru
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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

      {/* Filter and Search Bar (T-1.16) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau kategori..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-3 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {ITEM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-800">{result.total}</strong> barang terdaftar
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Total Stok</th>
                <th className="py-3 px-4 text-center">Tersedia</th>
                <th className="py-3 px-4 text-center">Dipinjam</th>
                <th className="py-3 px-4">Kondisi</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.data.map((item) => {
                const borrowedQty = item.total_qty - item.available_qty;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                          CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.Lainnya
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {item.total_qty}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          item.available_qty > 0
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-red-700 bg-red-50'
                        }`}
                      >
                        {item.available_qty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-medium ${
                          borrowedQty > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {borrowedQty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-700 font-medium">
                        {item.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Ubah data barang"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Hapus barang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {result.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada barang yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (T-1.16) */}
        {result.lastPage > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Halaman {result.page} dari {result.lastPage}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent hover:bg-white text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= result.lastPage}
                onClick={() => setCurrentPage((p) => Math.min(result.lastPage, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent hover:bg-white text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">
                {editingItem ? 'Ubah Data Barang' : 'Tambah Barang Inventaris Baru'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingItem ? handleSaveEdit : handleSaveAdd}
              className="p-5 space-y-4 text-xs sm:text-sm"
            >
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Kategori Barang */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Kategori Barang <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ITEM_CATEGORIES.map((cat) => {
                    const isSelected = formData.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300 hover:text-blue-700'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Proyektor Epson EB-X500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Total Stok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.total_qty}
                    onChange={(e) =>
                      setFormData({ ...formData, total_qty: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {!editingItem && (
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Stok tersedia otomatis sama dengan total stok awal.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kondisi Fisik
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        condition: e.target.value as ItemCondition,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="baik">Baik</option>
                    <option value="rusak">Rusak</option>
                    <option value="perlu_perbaikan">Perlu Perbaikan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Aksesoris
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Tersedia kabel HDMI dan remote di pouch"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};