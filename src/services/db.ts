import {
  Item,
  Loan,
  LoanItem,
  User,
  CreateLoanDTO,
  ReturnLoanDTO,
  CorrectLoanDTO,
  DisplayStatus,
} from '../types';

interface DatabaseSchema {
  users: User[];
  items: Item[];
  loans: Loan[];
  loan_items: LoanItem[];
}

const STORAGE_KEY = 'kantor_db_sqlite_v1';

// Initial Seeder Data
const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_01',
    name: 'Administrator Kantor (Budi Santoso)',
    email: 'admin@kantor.id',
    passwordHash: 'password123', // default seeded credential
  },
];

const INITIAL_ITEMS: Item[] = [
  {
    id: 'item_01',
    code: 'PRJ-01',
    name: 'Proyektor Epson EB-X500',
    total_qty: 4,
    available_qty: 3,
    condition: 'baik',
    notes: 'Kabel power dan HDMI ada di dalam tas proyektor',
    deleted_at: null,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'item_02',
    code: 'PTR-01',
    name: 'Wireless Presenter / Laser Pointer Logitech R400',
    total_qty: 5,
    available_qty: 4,
    condition: 'baik',
    notes: 'Termasuk baterai AAA cadangan di pouch',
    deleted_at: null,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'item_03',
    code: 'CAM-01',
    name: 'Webcam Logitech C922 Pro Stream Full HD',
    total_qty: 3,
    available_qty: 2,
    condition: 'baik',
    notes: 'Tripod mini disertakan',
    deleted_at: null,
    created_at: '2026-09-02T09:00:00Z',
    updated_at: '2026-09-02T09:00:00Z',
  },
  {
    id: 'item_04',
    code: 'SPK-01',
    name: 'Speakerphone Jabra Speak 510 Bluetooth/USB',
    total_qty: 3,
    available_qty: 3,
    condition: 'baik',
    notes: 'Untuk meeting hybrid ruang rapat kecil/sedang',
    deleted_at: null,
    created_at: '2026-09-02T09:30:00Z',
    updated_at: '2026-09-02T09:30:00Z',
  },
  {
    id: 'item_05',
    code: 'ADP-01',
    name: 'Adapter Multiport USB-C ke HDMI / VGA / USB 3.0',
    total_qty: 8,
    available_qty: 7,
    condition: 'baik',
    notes: 'Kompatibel Macbook dan Windows USB-C',
    deleted_at: null,
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-03T10:00:00Z',
  },
  {
    id: 'item_06',
    code: 'KBL-01',
    name: 'Kabel Rol Terminal Listrik Uticon 10 Meter',
    total_qty: 6,
    available_qty: 6,
    condition: 'baik',
    notes: '4 colokan arde aman',
    deleted_at: null,
    created_at: '2026-09-03T10:30:00Z',
    updated_at: '2026-09-03T10:30:00Z',
  },
  {
    id: 'item_07',
    code: 'MIC-01',
    name: 'Wireless Lavalier Microphone Boya BY-V2',
    total_qty: 2,
    available_qty: 2,
    condition: 'baik',
    notes: 'Receiver Lightning & USB-C untuk rekaman dokumentasi',
    deleted_at: null,
    created_at: '2026-09-04T11:00:00Z',
    updated_at: '2026-09-04T11:00:00Z',
  },
];

// Initial seeded loans to show Dipinjam, Terlambat, and Dikembalikan
const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan_sample_01',
    borrower_name: 'Dewi Lestari',
    employee_id: 'EMP-1042',
    division: 'Marketing & Komunikasi',
    phone: '081298765432',
    loan_date: '2026-09-20',
    due_date: '2026-09-25', // Past due date -> Terlambat!
    returned_date: null,
    status: 'dipinjam',
    notes: 'Untuk presentasi peluncuran produk baru',
    created_at: '2026-09-20T09:00:00Z',
    updated_at: '2026-09-20T09:00:00Z',
  },
  {
    id: 'loan_sample_02',
    borrower_name: 'Ahmad Fauzi',
    employee_id: 'EMP-2081',
    division: 'Teknologi Informasi',
    phone: '085612345678',
    loan_date: '2026-09-30',
    due_date: '2026-10-05', // Future due date -> Dipinjam!
    returned_date: null,
    status: 'dipinjam',
    notes: 'Meeting video conference vendor infrastruktur',
    created_at: '2026-09-30T10:15:00Z',
    updated_at: '2026-09-30T10:15:00Z',
  },
  {
    id: 'loan_sample_03',
    borrower_name: 'Siti Nurhaliza',
    employee_id: 'EMP-3015',
    division: 'Keuangan & Akuntansi',
    phone: '087788990011',
    loan_date: '2026-09-15',
    due_date: '2026-09-18',
    returned_date: '2026-09-18', // Returned -> Dikembalikan!
    status: 'dikembalikan',
    notes: 'Audit internal semesteran',
    created_at: '2026-09-15T08:30:00Z',
    updated_at: '2026-09-18T16:00:00Z',
  },
];

const INITIAL_LOAN_ITEMS: LoanItem[] = [
  {
    id: 'li_01',
    loan_id: 'loan_sample_01',
    item_id: 'item_01', // PRJ-01
    qty: 1,
    return_condition: null,
  },
  {
    id: 'li_02',
    loan_id: 'loan_sample_01',
    item_id: 'item_02', // PTR-01
    qty: 1,
    return_condition: null,
  },
  {
    id: 'li_03',
    loan_id: 'loan_sample_02',
    item_id: 'item_03', // CAM-01
    qty: 1,
    return_condition: null,
  },
  {
    id: 'li_04',
    loan_id: 'loan_sample_02',
    item_id: 'item_05', // ADP-01
    qty: 1,
    return_condition: null,
  },
  {
    id: 'li_05',
    loan_id: 'loan_sample_03',
    item_id: 'item_04', // SPK-01
    qty: 1,
    return_condition: 'baik',
  },
];

class DatabaseManager {
  private schema: DatabaseSchema;
  private listeners: (() => void)[] = [];

  constructor() {
    this.schema = this.loadDatabase();

    // Sinkron saat tab/jendela lain mengubah data
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.schema = this.loadDatabase();
          this.listeners.forEach((cb) => cb());
        }
      });
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items) && Array.isArray(parsed.loans)) {
          return parsed;
        }
      }
    } catch {
      // In case localStorage fails or is corrupted, fallback to seed
    }
    const initial: DatabaseSchema = {
      users: INITIAL_USERS,
      items: INITIAL_ITEMS,
      loans: INITIAL_LOANS,
      loan_items: INITIAL_LOAN_ITEMS,
    };
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(data: DatabaseSchema) {
    this.schema = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota error if any
    }
  }

  /**
   * DB::transaction execution wrapper.
   * If any error is thrown during the callback, the database rolls back to its pre-transaction state.
   */
  public transaction<T>(callback: () => T): T {
    // Ambil data terbaru dulu supaya tidak menimpa perubahan dari tab lain
    this.schema = this.loadDatabase();

    // Clone snapshot of database
    const snapshot: DatabaseSchema = JSON.parse(JSON.stringify(this.schema));
    try {
      const result = callback();
      // Persist changes
      this.saveDatabase(this.schema);
      return result;
    } catch (error) {
      // Rollback
      this.schema = snapshot;
      this.saveDatabase(snapshot);
      throw error;
    }
  }

  /**
   * Reset database to fresh seed state (useful for tests or demo reset).
   */
  public resetToSeed(): void {
    const seed: DatabaseSchema = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      items: JSON.parse(JSON.stringify(INITIAL_ITEMS)),
      loans: JSON.parse(JSON.stringify(INITIAL_LOANS)),
      loan_items: JSON.parse(JSON.stringify(INITIAL_LOAN_ITEMS)),
    };
    this.saveDatabase(seed);
  }

  // --- ACCESSOR COMPUTATION ---
  public computeLoanAccessors(loan: Loan): Loan {
    const todayStr = new Date().toISOString().split('T')[0];
    let display_status: DisplayStatus = 'Dipinjam';
    let days_late = 0;

    if (loan.returned_date) {
      display_status = 'Dikembalikan';
    } else {
      // Compare dates: due_date vs todayStr
      const dueDate = new Date(loan.due_date + 'T00:00:00');
      const todayDate = new Date(todayStr + 'T00:00:00');
      const diffMs = todayDate.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        display_status = 'Terlambat';
        days_late = diffDays;
      } else {
        display_status = 'Dipinjam';
        days_late = 0;
      }
    }

    // Attach loan items with item names
    const items = this.schema.loan_items
      .filter((li) => li.loan_id === loan.id)
      .map((li) => {
        const item = this.schema.items.find((it) => it.id === li.item_id);
        return {
          ...li,
          item_code: item ? item.code : '(Barang Dihapus)',
          item_name: item ? item.name : '(Barang Dihapus)',
        };
      });

    return {
      ...loan,
      display_status,
      days_late,
      items,
    };
  }

  // --- ITEMS OPERATIONS ---
  public getItems(options?: {
    search?: string;
    includeDeleted?: boolean;
    availableOnly?: boolean;
    page?: number;
    perPage?: number;
  }) {
    let list = this.schema.items.slice();

    if (!options?.includeDeleted) {
      list = list.filter((item) => !item.deleted_at);
    }

    if (options?.availableOnly) {
      list = list.filter((item) => item.available_qty > 0);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q))
      );
    }

    // Sort by code
    list.sort((a, b) => a.code.localeCompare(b.code));

    const total = list.length;
    const page = options?.page || 1;
    const perPage = options?.perPage || 10;
    const from = (page - 1) * perPage;
    const paginatedItems = list.slice(from, from + perPage);

    return {
      data: paginatedItems,
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage) || 1,
    };
  }

  public getItemById(id: string): Item | undefined {
    return this.schema.items.find((i) => i.id === id && !i.deleted_at);
  }

  public createItem(data: {
    code: string;
    name: string;
    total_qty: number;
    condition: 'baik' | 'rusak' | 'perlu_perbaikan';
    notes?: string;
  }): Item {
    return this.transaction(() => {
      const trimmedCode = data.code.trim().toUpperCase();
      if (!trimmedCode) {
        throw new Error('Kode barang wajib diisi!');
      }
      if (!data.name.trim()) {
        throw new Error('Nama barang wajib diisi!');
      }
      if (data.total_qty < 0 || isNaN(data.total_qty)) {
        throw new Error('Jumlah total stok harus berupa angka minimal 0!');
      }

      // Check unique code
      const existing = this.schema.items.find(
        (i) => i.code.toUpperCase() === trimmedCode && !i.deleted_at
      );
      if (existing) {
        throw new Error(`Kode barang "${trimmedCode}" sudah digunakan oleh barang lain!`);
      }

      const now = new Date().toISOString();
      const newItem: Item = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        code: trimmedCode,
        name: data.name.trim(),
        total_qty: Number(data.total_qty),
        // PRD T-1.15: available_qty otomatis sama dengan total_qty saat tambah barang
        available_qty: Number(data.total_qty),
        condition: data.condition,
        notes: data.notes?.trim() || null,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      };

      this.schema.items.push(newItem);
      return newItem;
    });
  }

  public updateItem(
    id: string,
    data: {
      code: string;
      name: string;
      total_qty: number;
      available_qty?: number;
      condition: 'baik' | 'rusak' | 'perlu_perbaikan';
      notes?: string;
    }
  ): Item {
    return this.transaction(() => {
      const itemIndex = this.schema.items.findIndex((i) => i.id === id && !i.deleted_at);
      if (itemIndex === -1) {
        throw new Error('Barang tidak ditemukan!');
      }
      const existing = this.schema.items[itemIndex];
      const trimmedCode = data.code.trim().toUpperCase();

      // Check unique code (ignoring self)
      const duplicateCode = this.schema.items.find(
        (i) => i.id !== id && i.code.toUpperCase() === trimmedCode && !i.deleted_at
      );
      if (duplicateCode) {
        throw new Error(`Kode barang "${trimmedCode}" sudah digunakan oleh barang lain!`);
      }

      // Validate quantities
      const newTotal = Number(data.total_qty);
      if (newTotal < 0) {
        throw new Error('Jumlah total stok tidak boleh kurang dari 0!');
      }

      // Check currently borrowed qty
      const activeBorrowedQty = this.schema.loan_items
        .filter((li) => {
          if (li.item_id !== id) return false;
          const loan = this.schema.loans.find((l) => l.id === li.loan_id);
          return loan && !loan.returned_date && loan.status === 'dipinjam';
        })
        .reduce((sum, li) => sum + li.qty, 0);

      if (newTotal < activeBorrowedQty) {
        throw new Error(
          `Total stok tidak boleh lebih kecil dari jumlah yang sedang dipinjam (${activeBorrowedQty} unit)!`
        );
      }

      const newAvailable =
        data.available_qty !== undefined
          ? Number(data.available_qty)
          : newTotal - activeBorrowedQty;

      if (newAvailable < 0) {
        throw new Error('Jumlah stok tersedia tidak boleh negatif!');
      }
      if (newAvailable > newTotal) {
        throw new Error('Stok tersedia tidak boleh melebihi total stok!');
      }

      const updatedItem: Item = {
        ...existing,
        code: trimmedCode,
        name: data.name.trim(),
        total_qty: newTotal,
        available_qty: newAvailable,
        condition: data.condition,
        notes: data.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      this.schema.items[itemIndex] = updatedItem;
      return updatedItem;
    });
  }

  public deleteItem(id: string): boolean {
    return this.transaction(() => {
      const item = this.schema.items.find((i) => i.id === id && !i.deleted_at);
      if (!item) {
        throw new Error('Barang tidak ditemukan!');
      }

      // T-1.17: Cegah hapus barang yang masih punya peminjaman aktif
      const activeLoanWithItem = this.schema.loan_items.some((li) => {
        if (li.item_id !== id) return false;
        const loan = this.schema.loans.find((l) => l.id === li.loan_id);
        return loan && !loan.returned_date && loan.status === 'dipinjam';
      });

      if (activeLoanWithItem) {
        throw new Error(
          `Barang "${item.name}" tidak dapat dihapus karena masih ada dalam peminjaman aktif yang belum dikembalikan!`
        );
      }

      // Soft delete: set deleted_at
      item.deleted_at = new Date().toISOString();
      item.updated_at = new Date().toISOString();
      return true;
    });
  }

  // --- LOANS OPERATIONS ---

  public getLoans(options?: {
    search?: string;
    status?: string; // 'semua' | 'dipinjam' | 'terlambat' | 'dikembalikan' | 'belum_kembali'
    itemId?: string;
    startDate?: string;
    endDate?: string;
    employeeIdOnly?: string;
    page?: number;
    perPage?: number;
  }) {
    let list = this.schema.loans.map((l) => this.computeLoanAccessors(l));

    // Privacy filter: if employeeIdOnly provided (public return screen)
    if (options?.employeeIdOnly) {
      const targetEmp = options.employeeIdOnly.toLowerCase().trim();
      list = list.filter((l) => l.employee_id.toLowerCase().trim() === targetEmp);
    }

    // Status filter
    if (options?.status && options.status !== 'semua') {
      if (options.status === 'belum_kembali') {
        // dipinjam OR terlambat
        list = list.filter((l) => !l.returned_date);
      } else if (options.status === 'dipinjam') {
        list = list.filter((l) => l.display_status === 'Dipinjam');
      } else if (options.status === 'terlambat') {
        list = list.filter((l) => l.display_status === 'Terlambat');
      } else if (options.status === 'dikembalikan') {
        list = list.filter((l) => l.display_status === 'Dikembalikan');
      }
    }

    // Item filter
    if (options?.itemId) {
      list = list.filter((l) => l.items?.some((i) => i.item_id === options.itemId));
    }

    // Date range filter (loan_date)
    if (options?.startDate) {
      list = list.filter((l) => l.loan_date >= options.startDate!);
    }
    if (options?.endDate) {
      list = list.filter((l) => l.loan_date <= options.endDate!);
    }

    // Search query
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.borrower_name.toLowerCase().includes(q) ||
          l.employee_id.toLowerCase().includes(q) ||
          l.division.toLowerCase().includes(q) ||
          (l.phone && l.phone.toLowerCase().includes(q)) ||
          l.items?.some(
            (it) =>
              it.item_name?.toLowerCase().includes(q) ||
              it.item_code?.toLowerCase().includes(q)
          )
      );
    }

    // Sort by created_at desc
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const page = options?.page || 1;
    const perPage = options?.perPage || 10;
    const from = (page - 1) * perPage;
    const paginated = list.slice(from, from + perPage);

    return {
      data: paginated,
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage) || 1,
    };
  }

  public getLoanById(id: string): Loan | undefined {
    const loan = this.schema.loans.find((l) => l.id === id);
    if (!loan) return undefined;
    return this.computeLoanAccessors(loan);
  }

  /**
   * T-2.5, T-2.6, T-2.7:
   * Create loan in DB::transaction with strict validation & stock reduction.
   */
  public createLoan(dto: CreateLoanDTO): Loan {
    return this.transaction(() => {
      // 1. Validasi form dasar
      if (!dto.borrower_name?.trim()) {
        throw new Error('Nama peminjam wajib diisi!');
      }
      if (!dto.employee_id?.trim()) {
        throw new Error('NIK / ID Karyawan wajib diisi!');
      }
      if (!dto.division?.trim()) {
        throw new Error('Divisi karyawan wajib diisi!');
      }
      if (!dto.loan_date) {
        throw new Error('Tanggal pinjam wajib diisi!');
      }
      if (!dto.due_date) {
        throw new Error('Tanggal rencana kembali wajib diisi!');
      }

      // T-2.6: due_date >= loan_date
      if (dto.due_date < dto.loan_date) {
        throw new Error('Tanggal rencana kembali tidak boleh sebelum tanggal pinjam!');
      }

      // T-2.6: minimal 1 barang
      if (!dto.items || dto.items.length === 0) {
        throw new Error('Pilih minimal 1 barang untuk dipinjam!');
      }

      // T-2.6: tidak ada barang ganda dalam satu form
      const itemIds = dto.items.map((i) => i.item_id);
      const uniqueIds = new Set(itemIds);
      if (uniqueIds.size !== itemIds.length) {
        throw new Error('Tidak boleh ada barang yang sama berulang kali dalam satu peminjaman!');
      }

      // 2. Cek stok di dalam transaction dan update available_qty
      for (const reqItem of dto.items) {
        if (!reqItem.qty || reqItem.qty <= 0) {
          throw new Error('Jumlah barang yang dipinjam harus lebih dari 0!');
        }

        const item = this.schema.items.find(
          (i) => i.id === reqItem.item_id && !i.deleted_at
        );
        if (!item) {
          throw new Error('Barang tidak ditemukan atau sudah dinonaktifkan!');
        }

        // T-2.6: jumlah <= available_qty
        if (reqItem.qty > item.available_qty) {
          throw new Error(
            `Stok barang "${item.name}" tidak mencukupi! Tersedia: ${item.available_qty}, diminta: ${reqItem.qty}.`
          );
        }

        // Kurangi stok tersedia
        item.available_qty -= reqItem.qty;
        item.updated_at = new Date().toISOString();
      }

      // 3. Simpan loan & loan_items
      const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      const newLoan: Loan = {
        id: loanId,
        borrower_name: dto.borrower_name.trim(),
        employee_id: dto.employee_id.trim().toUpperCase(),
        division: dto.division.trim(),
        phone: dto.phone?.trim() || null,
        loan_date: dto.loan_date,
        due_date: dto.due_date,
        returned_date: null,
        status: 'dipinjam',
        notes: dto.notes?.trim() || null,
        created_at: now,
        updated_at: now,
      };

      this.schema.loans.push(newLoan);

      for (const reqItem of dto.items) {
        const loanItemId = 'li_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        this.schema.loan_items.push({
          id: loanItemId,
          loan_id: loanId,
          item_id: reqItem.item_id,
          qty: reqItem.qty,
          return_condition: null,
        });
      }

      return this.computeLoanAccessors(newLoan);
    });
  }

  /**
   * T-2.10, T-2.11, T-2.12, T-2.13:
   * Process return in DB::transaction with stock restoration / lost qty handling.
   */
  public returnLoan(dto: ReturnLoanDTO): Loan {
    return this.transaction(() => {
      const loan = this.schema.loans.find((l) => l.id === dto.loan_id);
      if (!loan) {
        throw new Error('Data peminjaman tidak ditemukan!');
      }

      // T-2.13: Cegah pengembalian dua kali pada peminjaman yang sama
      if (loan.returned_date || loan.status === 'dikembalikan') {
        throw new Error('Peminjaman ini sudah dikembalikan sebelumnya!');
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      loan.returned_date = todayStr;
      loan.status = 'dikembalikan';
      loan.updated_at = now;
      if (dto.notes) {
        loan.notes = (loan.notes ? loan.notes + ' | ' : '') + 'Catatan Pengembalian: ' + dto.notes;
      }

      // Process conditions per item
      for (const conditionItem of dto.items) {
        const loanItem = this.schema.loan_items.find(
          (li) => li.loan_id === dto.loan_id && li.item_id === conditionItem.item_id
        );
        if (!loanItem) {
          throw new Error('Barang tidak cocok dengan daftar barang yang dipinjam!');
        }

        loanItem.return_condition = conditionItem.condition;

        const item = this.schema.items.find((i) => i.id === conditionItem.item_id);
        if (item) {
          // PRD Temporary Decision:
          // 1. Kondisi hilang: stok tersedia TIDAK bertambah dan total_qty dikurangi sesuai jumlah hilang.
          // 2. Kondisi rusak: stok tersedia BERTAMBAH, kondisi barang dicatat di catatan peminjaman.
          // 3. Kondisi baik: stok tersedia BERTAMBAH.
          if (conditionItem.condition === 'hilang') {
            item.total_qty = Math.max(0, item.total_qty - loanItem.qty);
            // available_qty does not increase!
            item.notes = (item.notes ? item.notes + ' | ' : '') + `Hilang ${loanItem.qty} unit pada ${todayStr}`;
          } else {
            // baik or rusak: increase available_qty
            item.available_qty = Math.min(item.total_qty, item.available_qty + loanItem.qty);
            if (conditionItem.condition === 'rusak') {
              item.notes = (item.notes ? item.notes + ' | ' : '') + `Dikembalikan rusak (${loanItem.qty} unit) pada ${todayStr}`;
            }
          }
          item.updated_at = now;
        }
      }

      return this.computeLoanAccessors(loan);
    });
  }

  /**
   * T-3.6: Koreksi data peminjaman oleh Admin dalam DB::transaction.
   */
  public correctLoan(dto: CorrectLoanDTO): Loan {
    return this.transaction(() => {
      const loan = this.schema.loans.find((l) => l.id === dto.loan_id);
      if (!loan) {
        throw new Error('Peminjaman tidak ditemukan!');
      }

      if (!dto.reason?.trim()) {
        throw new Error('Alasan koreksi wajib diisi oleh admin!');
      }

      if (dto.borrower_name) loan.borrower_name = dto.borrower_name.trim();
      if (dto.employee_id) loan.employee_id = dto.employee_id.trim().toUpperCase();
      if (dto.division) loan.division = dto.division.trim();
      if (dto.phone !== undefined) loan.phone = dto.phone?.trim() || null;
      if (dto.loan_date) loan.loan_date = dto.loan_date;
      if (dto.due_date) loan.due_date = dto.due_date;

      const now = new Date().toISOString();
      const auditNote = `[Koreksi Admin ${now.split('T')[0]}]: ${dto.reason.trim()}`;
      loan.notes = loan.notes ? `${loan.notes} \n${auditNote}` : auditNote;
      loan.updated_at = now;

      return this.computeLoanAccessors(loan);
    });
  }

    // --- STATS SUMMARY ---
  public getSummaryStats() {
    const allLoans = this.schema.loans.map((l) => this.computeLoanAccessors(l));
    const activeLoans = allLoans.filter((l) => !l.returned_date);
    const overdueLoans = activeLoans.filter((l) => l.display_status === 'Terlambat');
    const returnedLoans = allLoans.filter((l) => l.display_status === 'Dikembalikan');

    const totalItems = this.schema.items.filter((i) => !i.deleted_at).length;
    const totalQty = this.schema.items
      .filter((i) => !i.deleted_at)
      .reduce((sum, i) => sum + i.total_qty, 0);
    const availableQty = this.schema.items
      .filter((i) => !i.deleted_at)
      .reduce((sum, i) => sum + i.available_qty, 0);

    return {
      borrowedCount: activeLoans.length,
      overdueCount: overdueLoans.length,
      returnedCount: returnedLoans.length,
      totalLoans: allLoans.length,
      totalItems,
      totalQty,
      availableQty,
    };
  }

  // --- AUTH ---
  public findUserByEmail(email: string): User | undefined {
    return this.schema.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
  }
}

export const DB = new DatabaseManager();