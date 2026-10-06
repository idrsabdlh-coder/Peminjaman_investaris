/**
 * DB Service — localStorage-based in-memory database
 * Provides reactive CRUD for Items and Loans with pagination, filtering, and business logic.
 */
import {
  ITEM_CATEGORIES,
  User,
  Item,
  ItemCondition,
  ItemCategory,
  LoanItem,
  Loan,
  LoanStatus,
  DisplayStatus,
  CreateLoanDTO,
  ReturnLoanDTO,
  CorrectLoanDTO,
} from '../types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  items: 'kantor_db_items',
  loans: 'kantor_db_loans',
  loanItems: 'kantor_db_loan_items',
  users: 'kantor_db_users',
} as const;

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_USERS: User[] = [
  {
    id: 'user_admin_01',
    name: 'Administrator',
    username: 'admin',
    email: 'admin@kantor.id',
    passwordHash: 'password123',
  },
];

// Barang dikosongkan: admin mengisi barang kantor sendiri lewat menu kelola barang.
const SEED_ITEMS: Item[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Selisih hari antara dua tanggal berformat YYYY-MM-DD (b - a). */
function daysDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.max(0, Math.round((db - da) / 86_400_000));
}

/** Pastikan kategori valid; jika kosong/tidak dikenal, pakai 'Lainnya'. */
function normalizeCategory(category?: string): ItemCategory {
  if (category && (ITEM_CATEGORIES as readonly string[]).includes(category)) {
    return category as ItemCategory;
  }
  return 'Lainnya' as ItemCategory;
}

function assertValidQty(qty: number, label = 'Jumlah'): void {
  if (!Number.isInteger(qty) || qty < 0) {
    throw new Error(`${label} harus berupa bilangan bulat tidak negatif.`);
  }
}

// ─── Pagination Result ────────────────────────────────────────────────────────
interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

function paginate<T>(list: T[], pageIn?: number, perPageIn?: number): PagedResult<T> {
  const total = list.length;
  const perPage = Math.max(1, perPageIn ?? 10);
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(1, pageIn ?? 1), lastPage);
  const start = (page - 1) * perPage;
  return { data: list.slice(start, start + perPage), total, page, perPage, lastPage };
}

// ─── DB Class ─────────────────────────────────────────────────────────────────
class DBService {
  private listeners: (() => void)[] = [];

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  /** Subscribe to any DB change. Returns unsubscribe function. */
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // ── Storage R/W ─────────────────────────────────────────────────────────────
  private readItems(): Item[] {
    try {
      const raw = localStorage.getItem(KEYS.items);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeItems(items: Item[]): void {
    localStorage.setItem(KEYS.items, JSON.stringify(items));
  }

  private readLoans(): Loan[] {
    try {
      const raw = localStorage.getItem(KEYS.loans);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeLoans(loans: Loan[]): void {
    localStorage.setItem(KEYS.loans, JSON.stringify(loans));
  }

  private readLoanItems(): LoanItem[] {
    try {
      const raw = localStorage.getItem(KEYS.loanItems);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeLoanItems(li: LoanItem[]): void {
    localStorage.setItem(KEYS.loanItems, JSON.stringify(li));
  }

  private readUsers(): User[] {
    try {
      const raw = localStorage.getItem(KEYS.users);
      return raw ? JSON.parse(raw) : SEED_USERS;
    } catch {
      return SEED_USERS;
    }
  }

  /** Ensure DB is seeded on first run. */
  private ensureSeeded(): void {
    if (!localStorage.getItem(KEYS.items)) {
      this.writeItems(SEED_ITEMS.map((i) => ({ ...i })));
    }
    if (!localStorage.getItem(KEYS.loans)) {
      this.writeLoans([]);
    }
    if (!localStorage.getItem(KEYS.loanItems)) {
      this.writeLoanItems([]);
    }
    if (!localStorage.getItem(KEYS.users)) {
      localStorage.setItem(KEYS.users, JSON.stringify(SEED_USERS));
    }
  }

  constructor() {
    this.ensureSeeded();
    this.resetDataOnce();
    // Also listen for changes from other tabs
    window.addEventListener('storage', () => this.notify());
  }

  /** Kosongkan barang dan peminjaman satu kali saja (website masih baru). */
  private resetDataOnce(): void {
    const FLAG = 'kantor_db_data_reset_v1';
    if (localStorage.getItem(FLAG)) return;

    this.writeItems([]);
    this.writeLoans([]);
    this.writeLoanItems([]);

    localStorage.setItem(FLAG, '1');
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  public resetToSeed(): void {
    this.writeItems(SEED_ITEMS.map((i) => ({ ...i })));
    this.writeLoans([]);
    this.writeLoanItems([]);
    localStorage.setItem(KEYS.users, JSON.stringify(SEED_USERS));
    this.notify();
  }

  /** Hapus semua riwayat peminjaman, stok dikembalikan penuh. Data barang tetap. */
  public clearLoans(): void {
    this.writeLoans([]);
    this.writeLoanItems([]);

    const now = nowIso();
    const items = this.readItems().map((i) => ({
      ...i,
      available_qty: i.total_qty,
      updated_at: now,
    }));
    this.writeItems(items);

    this.notify();
  }

  // ── Users ────────────────────────────────────────────────────────────────────
  public findUserByUsername(username: string): User | undefined {
    return this.readUsers().find((u) => u.username === username);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.readUsers().find((u) => u.email === email);
  }

  // ── Items ────────────────────────────────────────────────────────────────────
  public getItems(
    options: {
      search?: string;
      category?: string;
      page?: number;
      perPage?: number;
      includeDeleted?: boolean;
    } = {}
  ): PagedResult<Item> {
    this.ensureSeeded();
    let items = this.readItems();

    // Exclude soft-deleted unless asked
    if (!options.includeDeleted) {
      items = items.filter((i) => !i.deleted_at);
    }

    // Filter kategori
    if (options.category) {
      items = items.filter((i) => i.category === options.category);
    }

    // Search (nama, kategori, keterangan)
    if (options.search) {
      const q = options.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.notes || '').toLowerCase().includes(q)
      );
    }

    return paginate(items, options.page, options.perPage);
  }

  public getItemById(id: string): Item | undefined {
    return this.readItems().find((i) => i.id === id);
  }

  public createItem(input: {
    name: string;
    total_qty: number;
    category?: ItemCategory;
    condition: ItemCondition;
    notes?: string;
  }): Item {
    const items = this.readItems();

    if (!input.name || !input.name.trim()) {
      throw new Error('Nama barang wajib diisi.');
    }
    assertValidQty(input.total_qty, 'Jumlah total');

    const now = nowIso();
    const item: Item = {
      id: generateId('item'),
      name: input.name.trim(),
      total_qty: input.total_qty,
      available_qty: input.total_qty, // T-1.15: available = total on create
      category: normalizeCategory(input.category),
      condition: input.condition,
      notes: input.notes || null,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    items.push(item);
    this.writeItems(items);
    this.notify();
    return item;
  }

  public updateItem(
    id: string,
    input: {
      name?: string;
      total_qty?: number;
      category?: ItemCategory;
      condition?: ItemCondition;
      notes?: string;
    }
  ): Item {
    const items = this.readItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Barang tidak ditemukan.');

    const current = items[idx];

    if (input.name !== undefined && !input.name.trim()) {
      throw new Error('Nama barang wajib diisi.');
    }

    // Adjust available_qty if total_qty changed
    let newAvailable = current.available_qty;
    if (input.total_qty !== undefined && input.total_qty !== current.total_qty) {
      assertValidQty(input.total_qty, 'Jumlah total');
      const borrowed = current.total_qty - current.available_qty;
      if (input.total_qty < borrowed) {
        throw new Error(
          `Jumlah total tidak boleh kurang dari jumlah yang sedang dipinjam (${borrowed}).`
        );
      }
      newAvailable = input.total_qty - borrowed;
    }

    const updated: Item = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      total_qty: input.total_qty ?? current.total_qty,
      available_qty: newAvailable,
      category:
        input.category !== undefined ? normalizeCategory(input.category) : current.category,
      condition: input.condition ?? current.condition,
      notes: input.notes !== undefined ? input.notes || null : current.notes,
      updated_at: nowIso(),
    };

    items[idx] = updated;
    this.writeItems(items);
    this.notify();
    return updated;
  }

  /** Soft-delete item. Throws if item has active loans. */
  public deleteItem(id: string): boolean {
    const items = this.readItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1 || items[idx].deleted_at) throw new Error('Barang tidak ditemukan.');

    // T-1.17: Cegah hapus bila ada peminjaman aktif
    const loanItems = this.readLoanItems();
    const loans = this.readLoans();
    const hasActiveLoan = loanItems.some((li) => {
      if (li.item_id !== id) return false;
      const loan = loans.find((l) => l.id === li.loan_id);
      return loan && loan.status === 'dipinjam';
    });

    if (hasActiveLoan) {
      throw new Error(
        `Barang ini masih ada dalam peminjaman aktif dan tidak bisa dihapus saat ini.`
      );
    }

    const now = nowIso();
    items[idx] = { ...items[idx], deleted_at: now, updated_at: now };
    this.writeItems(items);
    this.notify();
    return true;
  }

  // ── Loans ────────────────────────────────────────────────────────────────────

  /** Compute display_status and days_late for a loan object. */
  public computeLoanAccessors(loan: Omit<Loan, 'display_status' | 'days_late'>): Loan {
    const today = todayStr();
    let display_status: DisplayStatus;
    let days_late = 0;

    if (loan.status === 'dikembalikan' || loan.returned_date) {
      display_status = 'Dikembalikan';
    } else if (loan.due_date < today) {
      display_status = 'Terlambat';
      days_late = daysDiff(loan.due_date, today);
    } else {
      display_status = 'Dipinjam';
    }

    return { ...loan, display_status, days_late };
  }

  private enrichLoan(loan: Loan): Loan {
    const loanItems = this.readLoanItems();
    const items = this.readItems();
    const enrichedItems: LoanItem[] = loanItems
      .filter((li) => li.loan_id === loan.id)
      .map((li) => {
        const item = items.find((i) => i.id === li.item_id);
        return {
          ...li,
          item_name: item?.name,
        };
      });
    const withItems = { ...loan, items: enrichedItems };
    return this.computeLoanAccessors(withItems);
  }

  public getLoans(
    options: {
      search?: string;
      status?: string;
      itemId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      perPage?: number;
    } = {}
  ): PagedResult<Loan> {
    let loans = this.readLoans().map((l) => this.enrichLoan(l));

    // Status filter
    if (options.status && options.status !== 'semua') {
      switch (options.status) {
        case 'belum_kembali':
          loans = loans.filter((l) => l.status === 'dipinjam');
          break;
        case 'dipinjam':
          loans = loans.filter(
            (l) => l.status === 'dipinjam' && l.display_status === 'Dipinjam'
          );
          break;
        case 'terlambat':
          loans = loans.filter((l) => l.display_status === 'Terlambat');
          break;
        case 'dikembalikan':
          loans = loans.filter((l) => l.status === 'dikembalikan');
          break;
      }
    }

    // Filter by item
    if (options.itemId) {
      const loanItems = this.readLoanItems();
      const loanIdsWithItem = new Set(
        loanItems.filter((li) => li.item_id === options.itemId).map((li) => li.loan_id)
      );
      loans = loans.filter((l) => loanIdsWithItem.has(l.id));
    }

    // Date range filter (on loan_date)
    if (options.startDate) {
      loans = loans.filter((l) => l.loan_date >= options.startDate!);
    }
    if (options.endDate) {
      loans = loans.filter((l) => l.loan_date <= options.endDate!);
    }

    // Full-text search (peminjam, divisi, telepon, nama barang)
    if (options.search) {
      const q = options.search.toLowerCase();
      loans = loans.filter(
        (l) =>
          l.borrower_name.toLowerCase().includes(q) ||
          (l.division || '').toLowerCase().includes(q) ||
          (l.phone || '').toLowerCase().includes(q) ||
          (l.items || []).some((it) => (it.item_name || '').toLowerCase().includes(q))
      );
    }

    // Sort: newest first
    loans = loans.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return paginate(loans, options.page, options.perPage);
  }

  public createLoan(input: CreateLoanDTO): Loan {
    const items = this.readItems();
    const loans = this.readLoans();
    const allLoanItems = this.readLoanItems();

    if (!input.items || input.items.length === 0) {
      throw new Error('Pilih minimal satu barang untuk dipinjam.');
    }
    if (input.due_date < input.loan_date) {
      throw new Error('Tanggal jatuh tempo tidak boleh sebelum tanggal pinjam.');
    }

    // Gabungkan item duplikat agar validasi stok akurat
    const requested = new Map<string, number>();
    for (const li of input.items) {
      if (!Number.isInteger(li.qty) || li.qty <= 0) {
        throw new Error('Jumlah barang yang dipinjam harus bilangan bulat lebih dari 0.');
      }
      requested.set(li.item_id, (requested.get(li.item_id) ?? 0) + li.qty);
    }

    // Validate stock availability (T-5.2)
    for (const [itemId, qty] of requested) {
      const item = items.find((i) => i.id === itemId && !i.deleted_at);
      if (!item) throw new Error(`Barang dengan ID "${itemId}" tidak ditemukan.`);
      if (item.available_qty < qty) {
        throw new Error(
          `Stok barang "${item.name}" tidak mencukupi. Tersedia: ${item.available_qty}, diminta: ${qty}.`
        );
      }
    }

    const now = nowIso();
    const loan = {
      id: generateId('loan'),
      borrower_name: input.borrower_name,
      borrower_type: input.borrower_type,
      division: input.division,
      phone: input.phone || null,
      loan_date: input.loan_date,
      due_date: input.due_date,
      returned_date: null,
      status: 'dipinjam',
      notes: input.notes || null,
      created_at: now,
      updated_at: now,
    } as Loan;

    // Deduct stock & buat loan items
    for (const [itemId, qty] of requested) {
      const idx = items.findIndex((i) => i.id === itemId);
      items[idx] = {
        ...items[idx],
        available_qty: items[idx].available_qty - qty,
        updated_at: now,
      };
      const loanItem: LoanItem = {
        id: generateId('li'),
        loan_id: loan.id,
        item_id: itemId,
        qty,
        return_condition: null,
      };
      allLoanItems.push(loanItem);
    }

    loans.push(loan);
    this.writeLoans(loans);
    this.writeLoanItems(allLoanItems);
    this.writeItems(items);
    this.notify();

    return this.enrichLoan(loan);
  }

  public returnLoan(input: ReturnLoanDTO): Loan {
    const loans = this.readLoans();
    const items = this.readItems();
    const allLoanItems = this.readLoanItems();

    const loanIdx = loans.findIndex((l) => l.id === input.loan_id);
    if (loanIdx === -1) throw new Error('Peminjaman tidak ditemukan.');

    const loan = loans[loanIdx];
    if (loan.status === 'dikembalikan') {
      throw new Error('Peminjaman ini sudah dikembalikan sebelumnya.');
    }

    const now = nowIso();
    const today = todayStr();

    // Process each item return
    for (const ret of input.items) {
      const liIdx = allLoanItems.findIndex(
        (li) => li.loan_id === input.loan_id && li.item_id === ret.item_id
      );
      if (liIdx === -1) continue;

      const li = allLoanItems[liIdx];
      // Lewati bila item ini sudah diproses sebelumnya
      if (li.return_condition) continue;

      const itemIdx = items.findIndex((i) => i.id === ret.item_id);
      if (itemIdx === -1) continue;

      allLoanItems[liIdx] = { ...li, return_condition: ret.condition };

      if (ret.condition === 'hilang') {
        // T-5.3: Lost item — reduce total_qty but NOT available_qty
        items[itemIdx] = {
          ...items[itemIdx],
          total_qty: Math.max(0, items[itemIdx].total_qty - li.qty),
          updated_at: now,
        };
      } else {
        // baik or rusak — restore available_qty
        items[itemIdx] = {
          ...items[itemIdx],
          available_qty: items[itemIdx].available_qty + li.qty,
          condition: ret.condition === 'rusak' ? 'rusak' : items[itemIdx].condition,
          updated_at: now,
        };
      }
    }

    // Build audit notes
    const returnNote = input.notes ? `\nCatatan: ${input.notes}` : '';
    const auditLine = `[${today}] Dikembalikan oleh peminjam.${returnNote}`;
    const updatedNotes = loan.notes ? `${loan.notes}\n${auditLine}` : auditLine;

    loans[loanIdx] = {
      ...loan,
      status: 'dikembalikan',
      returned_date: today,
      notes: updatedNotes,
      updated_at: now,
    };

    this.writeLoans(loans);
    this.writeLoanItems(allLoanItems);
    this.writeItems(items);
    this.notify();

    return this.enrichLoan(loans[loanIdx]);
  }

  /** Correct loan data (admin only, T-3.6). Appends audit log. */
  public correctLoan(input: CorrectLoanDTO): Loan {
    const loans = this.readLoans();
    const idx = loans.findIndex((l) => l.id === input.loan_id);
    if (idx === -1) throw new Error('Peminjaman tidak ditemukan.');

    if (!input.reason || !input.reason.trim()) {
      throw new Error('Alasan koreksi wajib diisi.');
    }

    const loan = loans[idx];
    const now = nowIso();
    const today = todayStr();

    const newLoanDate = input.loan_date ?? loan.loan_date;
    const newDueDate = input.due_date ?? loan.due_date;
    if (newDueDate < newLoanDate) {
      throw new Error('Tanggal jatuh tempo tidak boleh sebelum tanggal pinjam.');
    }

    const auditLine = `[${today}] KOREKSI ADMIN — Alasan: ${input.reason.trim()}`;
    const updatedNotes = loan.notes ? `${loan.notes}\n${auditLine}` : auditLine;

    loans[idx] = {
      ...loan,
      borrower_name: input.borrower_name ?? loan.borrower_name,
      division: input.division ?? loan.division,
      phone: input.phone !== undefined ? input.phone : loan.phone,
      loan_date: newLoanDate,
      due_date: newDueDate,
      notes: updatedNotes,
      updated_at: now,
    };

    this.writeLoans(loans);
    this.notify();

    return this.enrichLoan(loans[idx]);
  }

  // ── Summary Stats ─────────────────────────────────────────────────────────────
  public getSummaryStats(): {
    borrowedCount: number;
    overdueCount: number;
    returnedCount: number;
    totalQty: number;
    availableQty: number;
  } {
    const loans = this.readLoans().map((l) => this.computeLoanAccessors(l));
    const items = this.readItems().filter((i) => !i.deleted_at);

    const borrowedCount = loans.filter((l) => l.status === 'dipinjam').length;
    const overdueCount = loans.filter((l) => l.display_status === 'Terlambat').length;
    const returnedCount = loans.filter((l) => l.status === 'dikembalikan').length;
    const totalQty = items.reduce((s, i) => s + i.total_qty, 0);
    const availableQty = items.reduce((s, i) => s + i.available_qty, 0);

    return { borrowedCount, overdueCount, returnedCount, totalQty, availableQty };
  }
}

// Singleton export
export const DB = new DBService();

// Re-export all types from types.ts for convenience (for files that previously imported from db.ts)
export type {
  User,
  Item,
  ItemCondition,
  ItemCategory,
  LoanItem,
  Loan,
  LoanStatus,
  DisplayStatus,
  CreateLoanDTO,
  ReturnLoanDTO,
  CorrectLoanDTO,
} from '../types';
export { ITEM_CATEGORIES } from '../types';
export type { BorrowerType, ReturnItemCondition, LoanInputItem } from '../types';