export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
}

export type ItemCondition = 'baik' | 'rusak' | 'perlu_perbaikan';
export const ITEM_CATEGORIES = [
  'Elektronik',
  'Audio & Video',
  'Kabel & Aksesoris',
  'Perlengkapan Kantor',
  'Lainnya',
] as const;
export type ItemCategory = string;
export type ReturnItemCondition = 'baik' | 'rusak' | 'hilang';
export type LoanStatus = 'dipinjam' | 'dikembalikan';
export type BorrowerType = 'karyawan' | 'magang';
export type DisplayStatus = 'Dipinjam' | 'Terlambat' | 'Dikembalikan';

export interface Item {
  id: string;
  name: string;
  total_qty: number;
  available_qty: number;
  category: ItemCategory;
  condition: ItemCondition;
  notes?: string | null;
  deleted_at?: string | null; // soft delete timestamp ISO
  created_at: string;
  updated_at: string;
}

export interface LoanItem {
  id: string;
  loan_id: string;
  item_id: string;
  item_name?: string;
  qty: number;
  return_condition?: ReturnItemCondition | null;
}

export interface Loan {
  id: string;
  borrower_name: string;
  borrower_type?: BorrowerType;
  division: string;
  phone?: string | null;
  loan_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  returned_date?: string | null; // YYYY-MM-DD
  status: LoanStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: LoanItem[];
  // Computed accessors
  display_status?: DisplayStatus;
  days_late?: number;
}

export interface LoanInputItem {
  item_id: string;
  qty: number;
}

export interface CreateLoanDTO {
  borrower_name: string;
  borrower_type?: BorrowerType;
  division: string;
  phone?: string;
  loan_date: string;
  due_date: string;
  items: LoanInputItem[];
  notes?: string;
}

export interface ReturnLoanDTO {
  loan_id: string;
  items: {
    item_id: string;
    condition: ReturnItemCondition;
  }[];
  notes?: string;
}

export interface CorrectLoanDTO {
  loan_id: string;
  borrower_name?: string;
  division?: string;
  phone?: string | null;
  loan_date?: string;
  due_date?: string;
  notes?: string | null;
  reason: string;
}