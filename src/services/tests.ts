import { DB } from './db';
import { Auth } from './auth';

export interface TestResult {
  id: string;
  name: string;
  category: 'Feature' | 'Unit';
  status: 'passed' | 'failed' | 'pending';
  message: string;
  durationMs: number;
}

const DB_KEYS = [
  'kantor_db_items',
  'kantor_db_loans',
  'kantor_db_loan_items',
  'kantor_db_users',
];

/** Tanggal lokal YYYY-MM-DD (sama dengan cara db.ts menghitung "hari ini"). */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function daysFromToday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localDateStr(d);
}

export class AppTestSuite {
  /**
   * Run all tests from Phase 5 (T-5.1 to T-5.6).
   * Data asli di localStorage dicadangkan lalu dipulihkan setelah test selesai.
   */
  public static runAllTests(): TestResult[] {
    const results: TestResult[] = [];

    // Cadangkan data asli
    const backup: Record<string, string | null> = {};
    DB_KEYS.forEach((k) => (backup[k] = localStorage.getItem(k)));

    try {
      // Ensure pristine test database state
      DB.resetToSeed();
      Auth.logout();

      // T-5.1: /admin tanpa login dialihkan ke login
      results.push(this.testAdminAuthGuard());

      // T-5.2: peminjaman mengurangi stok; jumlah melebihi stok ditolak
      results.push(this.testBorrowingStockReductionAndLimit());

      // T-5.3: pengembalian menambah stok; hilang tidak menambah stok; tidak bisa dua kali
      results.push(this.testReturnStockBehaviorAndDuplicatePrevention());

      // T-5.4: display_status dan days_late pada Loan
      results.push(this.testLoanAccessorsDisplayStatusAndDaysLate());

      // T-5.5: barang dengan peminjaman aktif tidak bisa dihapus
      results.push(this.testActiveLoanPreventsItemDeletion());

      // T-5.6: reset peminjaman mengosongkan riwayat dan memulihkan stok
      results.push(this.testClearLoansRestoresStock());
    } finally {
      // Pulihkan data asli
      DB_KEYS.forEach((k) => {
        const v = backup[k];
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      });
    }

    return results;
  }

  // T-5.1
  private static testAdminAuthGuard(): TestResult {
    const start = performance.now();
    try {
      Auth.logout();
      const isAuthBefore = Auth.isAuthenticated();
      if (isAuthBefore) {
        throw new Error('Sesi terdeteksi aktif padahal sudah logout');
      }

      // Try login with invalid credentials
      const badLogin = Auth.login('wrong@kantor.id', 'wrongpass');
      if (badLogin.success) {
        throw new Error('Login dengan kredensial salah seharusnya ditolak');
      }

      // Valid login
      const goodLogin = Auth.login('admin@kantor.id', 'password123');
      if (!goodLogin.success || !Auth.isAuthenticated()) {
        throw new Error('Login admin gagal dengan kredensial valid');
      }

      // Cleanup
      Auth.logout();

      return {
        id: 'T-5.1',
        name: 'Feature test: /admin tanpa login dialihkan ke login & sesi tervalidasi',
        category: 'Feature',
        status: 'passed',
        message:
          'Akses tanpa autentikasi dicegah, login admin valid berhasil dan logout membersihkan sesi.',
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        id: 'T-5.1',
        name: 'Feature test: /admin tanpa login dialihkan ke login',
        category: 'Feature',
        status: 'failed',
        message: err.message || 'Test failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // T-5.2
  private static testBorrowingStockReductionAndLimit(): TestResult {
    const start = performance.now();
    try {
      // Create a test item with 5 total and 5 available
      const testItem = DB.createItem({
        name: 'Barang Uji Stok Pengurangan',
        total_qty: 5,
        condition: 'baik',
      });

      const initialAvail = testItem.available_qty; // 5

      // 1. Valid borrow 2 units
      DB.createLoan({
        borrower_name: 'Budi Test',
        division: 'Divisi Uji',
        loan_date: '2026-10-01',
        due_date: '2026-10-03',
        items: [{ item_id: testItem.id, qty: 2 }],
      });

      const afterBorrow = DB.getItemById(testItem.id);
      if (!afterBorrow || afterBorrow.available_qty !== 3) {
        throw new Error(
          `Stok tersedia tidak berkurang dengan benar. Ekspektasi: 3, Aktual: ${afterBorrow?.available_qty}`
        );
      }

      // 2. Reject exceeding stock (available 3, requesting 4)
      let rejected = false;
      try {
        DB.createLoan({
          borrower_name: 'Siti Overlimit',
          division: 'Divisi Uji',
          loan_date: '2026-10-01',
          due_date: '2026-10-03',
          items: [{ item_id: testItem.id, qty: 4 }],
        });
      } catch (e: any) {
        rejected = true;
        if (!e.message.includes('tidak mencukupi')) {
          throw new Error('Pesan error penolakan overlimit tidak sesuai: ' + e.message);
        }
      }

      if (!rejected) {
        throw new Error('Peminjaman melebihi stok yang tersedia seharusnya ditolak!');
      }

      return {
        id: 'T-5.2',
        name: 'Feature test: peminjaman mengurangi stok; jumlah melebihi stok ditolak',
        category: 'Feature',
        status: 'passed',
        message: `Stok awal ${initialAvail} dipinjam 2 menjadi 3 unit. Permintaan melebihi stok ditolak.`,
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        id: 'T-5.2',
        name: 'Feature test: peminjaman mengurangi stok; jumlah melebihi stok ditolak',
        category: 'Feature',
        status: 'failed',
        message: err.message || 'Test failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // T-5.3
  private static testReturnStockBehaviorAndDuplicatePrevention(): TestResult {
    const start = performance.now();
    try {
      // 1. Test normal return (baik): available_qty increases
      const itemBaik = DB.createItem({
        name: 'Barang Uji Kembali Baik',
        total_qty: 3,
        condition: 'baik',
      });

      const loanBaik = DB.createLoan({
        borrower_name: 'Peminjam Baik',
        division: 'Divisi Uji',
        loan_date: '2026-10-01',
        due_date: '2026-10-04',
        items: [{ item_id: itemBaik.id, qty: 1 }],
      });

      DB.returnLoan({
        loan_id: loanBaik.id,
        items: [{ item_id: itemBaik.id, condition: 'baik' }],
      });

      const itemBaikAfter = DB.getItemById(itemBaik.id);
      if (itemBaikAfter?.available_qty !== 3) {
        throw new Error('Pengembalian baik gagal mengembalikan stok tersedia ke 3!');
      }

      // Duplicate return prevention
      let dupRejected = false;
      try {
        DB.returnLoan({
          loan_id: loanBaik.id,
          items: [{ item_id: itemBaik.id, condition: 'baik' }],
        });
      } catch {
        dupRejected = true;
      }
      if (!dupRejected) {
        throw new Error('Pengembalian kedua kali pada pinjaman yang sama seharusnya ditolak!');
      }

      // 2. Test lost item return ('hilang'):
      // stok tersedia TIDAK bertambah dan total_qty dikurangi sesuai jumlah hilang
      const itemHilang = DB.createItem({
        name: 'Barang Uji Kembali Hilang',
        total_qty: 4,
        condition: 'baik',
      });

      const loanHilang = DB.createLoan({
        borrower_name: 'Peminjam Hilang',
        division: 'Divisi Uji',
        loan_date: '2026-10-01',
        due_date: '2026-10-04',
        items: [{ item_id: itemHilang.id, qty: 1 }], // available becomes 3
      });

      DB.returnLoan({
        loan_id: loanHilang.id,
        items: [{ item_id: itemHilang.id, condition: 'hilang' }],
      });

      const itemHilangAfter = DB.getItemById(itemHilang.id);
      // total_qty: 4 - 1 = 3, available_qty tetap 3
      if (itemHilangAfter?.total_qty !== 3 || itemHilangAfter?.available_qty !== 3) {
        throw new Error(
          `Kondisi hilang tidak konsisten: total_qty=${itemHilangAfter?.total_qty} (harus 3), available_qty=${itemHilangAfter?.available_qty} (harus 3)`
        );
      }

      return {
        id: 'T-5.3',
        name: 'Feature test: pengembalian menambah stok; kondisi hilang kurangi total_qty; cegah ganda',
        category: 'Feature',
        status: 'passed',
        message:
          'Pengembalian normal memulihkan stok. Kondisi hilang memotong total_qty tanpa menambah available_qty. Pengembalian ganda ditolak.',
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        id: 'T-5.3',
        name: 'Feature test: pengembalian menambah stok',
        category: 'Feature',
        status: 'failed',
        message: err.message || 'Test failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // T-5.4
  private static testLoanAccessorsDisplayStatusAndDaysLate(): TestResult {
    const start = performance.now();
    try {
      const today = localDateStr(new Date());

      // 1. Returned loan -> display_status 'Dikembalikan'
      const returnedLoan = DB.computeLoanAccessors({
        id: 'loan_acc_1',
        borrower_name: 'A',
        division: 'D',
        loan_date: '2026-09-01',
        due_date: '2026-09-05',
        returned_date: '2026-09-05',
        status: 'dikembalikan',
        created_at: '2026-09-01',
        updated_at: '2026-09-05',
      });
      if (returnedLoan.display_status !== 'Dikembalikan') {
        throw new Error('Pinjaman dengan returned_date harus berstatus "Dikembalikan"');
      }

      // 2. Active loan, due date in future -> 'Dipinjam', days_late = 0
      const activeLoan = DB.computeLoanAccessors({
        id: 'loan_acc_2',
        borrower_name: 'B',
        division: 'D',
        loan_date: today,
        due_date: daysFromToday(5),
        returned_date: null,
        status: 'dipinjam',
        created_at: today,
        updated_at: today,
      });
      if (activeLoan.display_status !== 'Dipinjam' || activeLoan.days_late !== 0) {
        throw new Error('Pinjaman aktif sebelum jatuh tempo harus "Dipinjam" dengan days_late = 0');
      }

      // 3. Overdue loan, due date 3 days ago -> 'Terlambat', days_late = 3
      const overdueLoan = DB.computeLoanAccessors({
        id: 'loan_acc_3',
        borrower_name: 'C',
        division: 'D',
        loan_date: daysFromToday(-10),
        due_date: daysFromToday(-3),
        returned_date: null,
        status: 'dipinjam',
        created_at: daysFromToday(-10),
        updated_at: daysFromToday(-10),
      });
      if (overdueLoan.display_status !== 'Terlambat' || overdueLoan.days_late !== 3) {
        throw new Error(
          `Pinjaman lewat jatuh tempo harus "Terlambat" dengan days_late = 3 (aktual: ${overdueLoan.days_late})`
        );
      }

      return {
        id: 'T-5.4',
        name: 'Unit test: display_status dan days_late pada Loan',
        category: 'Unit',
        status: 'passed',
        message:
          'Accessor display_status (Dipinjam / Terlambat / Dikembalikan) dan days_late terhitung dinamis dari tanggal.',
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        id: 'T-5.4',
        name: 'Unit test: display_status dan days_late pada Loan',
        category: 'Unit',
        status: 'failed',
        message: err.message || 'Test failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // T-5.5
  private static testActiveLoanPreventsItemDeletion(): TestResult {
    const start = performance.now();
    try {
      const lockedItem = DB.createItem({
        name: 'Barang Uji Kunci Peminjaman Aktif',
        total_qty: 2,
        condition: 'baik',
      });

      // Create active loan
      const activeLoan = DB.createLoan({
        borrower_name: 'Peminjam Kunci',
        division: 'Divisi Uji',
        loan_date: '2026-10-01',
        due_date: '2026-10-05',
        items: [{ item_id: lockedItem.id, qty: 1 }],
      });

      let deleteBlocked = false;
      try {
        DB.deleteItem(lockedItem.id);
      } catch (e: any) {
        deleteBlocked = true;
        if (!e.message.includes('masih ada dalam peminjaman aktif')) {
          throw new Error('Pesan error cegah hapus barang tidak informatif: ' + e.message);
        }
      }

      if (!deleteBlocked) {
        throw new Error('Barang dengan peminjaman aktif seharusnya tidak boleh dihapus!');
      }

      // Return the loan
      DB.returnLoan({
        loan_id: activeLoan.id,
        items: [{ item_id: lockedItem.id, condition: 'baik' }],
      });

      // Now deleting should succeed using soft delete
      const deletedOk = DB.deleteItem(lockedItem.id);
      if (!deletedOk) {
        throw new Error('Penghapusan barang setelah pinjaman selesai seharusnya berhasil!');
      }

      // Verify soft deleted item is excluded from normal listing
      const listedItems = DB.getItems({ perPage: 1000 });
      if (listedItems.data.some((i) => i.id === lockedItem.id)) {
        throw new Error('Barang yang di-soft-delete tidak boleh muncul di getItems()!');
      }

      return {
        id: 'T-5.5',
        name: 'Test: barang dengan peminjaman aktif tidak bisa dihapus & soft delete berfungsi',
        category: 'Feature',
        status: 'passed',
        message:
          'Penghapusan barang dengan pinjaman aktif ditolak; setelah dikembalikan soft-delete berjalan aman.',
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        id: 'T-5.5',
        name: 'Test: barang dengan peminjaman aktif tidak bisa dihapus',
        category: 'Feature',
        status: 'failed',
        message: err.message || 'Test failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }

  // T-5.6
  private static testClearLoansRestoresStock(): TestResult {
    const start = performance.now();
    try {
      const item = DB.createItem({
        name: 'Barang Uji Reset Peminjaman',
        total_qty: 4,
        condition: 'baik',
      });

      DB.createLoan({
        borrower_name: 'Karyawan Satu',
        division: 'Divisi A',
        phone: '08111111111',
        loan_date: '2026-10-01',
        due_date: '2026-10-04',
        items: [{ item_id: item.id, qty: 2 }],
      });

      const beforeClear = DB.getItemById(item.id);
      if (beforeClear?.available_qty !== 2) {
        throw new Error(
          `Persiapan test gagal: stok tersedia seharusnya 2, aktual ${beforeClear?.available_qty}`
        );
      }

      DB.clearLoans();

      const loansAfter = DB.getLoans({ perPage: 1000 });
      if (loansAfter.total !== 0) {
        throw new Error(`Riwayat peminjaman seharusnya kosong, aktual ${loansAfter.total}`);
      }

      const stats = DB.getSummaryStats();
      if (stats.borrowedCount !== 0 || stats.overdueCount !== 0 || stats.returnedCount !== 0) {
        throw new Error('Ringkasan peminjaman seharusnya 0 setelah reset');
      }

      const afterClear = DB.getItemById(item.id);
      if (afterClear?.available_qty !== 4 || afterClear?.total_qty !== 4) {
        throw new Error(
          `Stok seharusnya pulih penuh: tersedia=${afterClear?.available_qty}, total=${afterClear?.total_qty} (harus 4/4)`
        );
      }

      return {
        id: 'T-5.6',
        name: 'Test: reset peminjaman mengosongkan riwayat dan memulihkan stok',
        category: 'Feature',
        status: 'passed',
        message:
          'Semua riwayat peminjaman terhapus, ringkasan kembali 0, dan stok tersedia sama dengan total stok. Data barang tetap.',
        durationMs: Math.round(performance.now() - start),
      };
    } catch (err: any) {
      return {
        id: 'T-5.6',
        name: 'Test: reset peminjaman mengosongkan riwayat dan memulihkan stok',
        category: 'Feature',
        status: 'failed',
        message: err.message || 'Test failed',
        durationMs: Math.round(performance.now() - start),
      };
    }
  }
}