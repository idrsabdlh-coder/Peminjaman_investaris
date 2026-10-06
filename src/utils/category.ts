import { ItemCategory } from '../types';

// Warna badge per kategori
export const CATEGORY_STYLES: Record<ItemCategory, string> = {
  Elektronik: 'bg-blue-50 text-blue-700 border-blue-200',
  'Audio & Video': 'bg-violet-50 text-violet-700 border-violet-200',
  'Kabel & Aksesoris': 'bg-amber-50 text-amber-700 border-amber-200',
  'Perlengkapan Kantor': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Lainnya: 'bg-slate-100 text-slate-600 border-slate-200',
};