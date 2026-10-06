import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loan, Item } from '../types';

export class PDFExportService {
  /**
   * Format date into readable Indonesian string
   */
  private static formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr || '-';
    }
  }

  private static getNowPrintTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
  }

  /**
   * T-4.2, T-4.3: Export filtered loans list to Landscape PDF.
   */
  public static exportLoansPDF(options: {
    loans: Loan[];
    title?: string;
    filterDescription?: string;
    fileName?: string;
  }) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const title = options.title || 'LAPORAN REKAPITULASI PEMINJAMAN BARANG KANTOR';
    const printDate = this.getNowPrintTimestamp();
    const filterText = options.filterDescription || 'Semua Data';

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title, 14, 15);

    // Metadata Subheader
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Filter / Periode: ${filterText}`, 14, 21);
    doc.text(`Waktu Cetak: ${printDate} | Total: ${options.loans.length} Transaksi`, 14, 26);

    // Table Data
    const tableBody = options.loans.map((loan, index) => {
      const itemsList =
        loan.items && loan.items.length > 0
          ? loan.items.map((i) => `${i.item_name} (${i.qty} unit)`).join('\n')
          : '-';

      const conditionNotes =
        loan.items && loan.items.some((i) => i.return_condition)
          ? loan.items
              .filter((i) => i.return_condition)
              .map((i) => `${i.item_name}: ${i.return_condition}`)
              .join(', ')
          : '-';

      let statusBadge = loan.display_status || 'Dipinjam';
      if (statusBadge === 'Terlambat' && loan.days_late) {
        statusBadge += ` (+${loan.days_late} hari)`;
      }

      return [
        (index + 1).toString(),
         `${loan.borrower_name}\n(${loan.borrower_type === 'magang' ? 'Anak Magang' : 'Karyawan'})`,
        loan.division,
        itemsList,
        this.formatDate(loan.loan_date),
        this.formatDate(loan.due_date),
        this.formatDate(loan.returned_date),
        statusBadge,
        conditionNotes,
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [
        [
          'No',
          'Nama Peminjam',
          'NIM / ID',
          'Divisi',
          'Barang & Jumlah',
          'Tgl Pinjam',
          'Rencana Kembali',
          'Tgl Kembali',
          'Status',
          'Kondisi Kembali',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // Brand Blue #2563EB
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 32 },
        2: { cellWidth: 24, fontStyle: 'bold' },
        3: { cellWidth: 28 },
        4: { cellWidth: 62 },
        5: { halign: 'center', cellWidth: 22 },
        6: { halign: 'center', cellWidth: 24 },
        7: { halign: 'center', cellWidth: 22 },
        8: { halign: 'center', cellWidth: 25 },
        9: { cellWidth: 21 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer page numbering
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount} - Sistem Peminjaman & Inventaris Kantor`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 8,
          { align: 'right' }
        );
      },
    });

    const fileName =
      options.fileName ||
      `laporan-peminjaman-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  /**
   * T-4.4: Export list of items not yet returned (belum dikembalikan).
   */
  public static exportUnreturnedLoansPDF(loans: Loan[]) {
    const unreturned = loans.filter((l) => !l.returned_date);
    this.exportLoansPDF({
      loans: unreturned,
      title: 'DAFTAR BARANG KANTOR YANG BELUM DIKEMBALIKAN',
      filterDescription: 'Khusus status Dipinjam & Terlambat (Aktif)',
      fileName: `laporan-belum-kembali-${new Date().toISOString().split('T')[0]}.pdf`,
    });
  }

  /**
   * T-4.5: Export inventory stock report (Daftar Stok & Status Barang).
   */
  public static exportInventoryStockPDF(items: Item[]) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const printDate = this.getNowPrintTimestamp();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('LAPORAN DAFTAR STOK & STATUS INVENTARIS BARANG', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Waktu Cetak: ${printDate} | Total Barang: ${items.length} Macam`, 14, 21);

        const body = items.map((item, idx) => {
      const borrowedQty = item.total_qty - item.available_qty;
      return [
        (idx + 1).toString(),
        item.name,
        item.category,
        item.total_qty.toString(),
        item.available_qty.toString(),
        borrowedQty.toString(),
        item.condition.toUpperCase(),
        item.notes || '-',
      ];
    });

    autoTable(doc, {
      startY: 26,
      head: [
        [
          'No',
          'Kode',
          'Nama Barang',
          'Kategori',
          'Total',
          'Tersedia',
          'Dipinjam',
          'Kondisi',
          'Keterangan',
        ],
      ],
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        2: { cellWidth: 44 },
        3: { cellWidth: 26 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'center', cellWidth: 16 },
        6: { halign: 'center', cellWidth: 16 },
        7: { halign: 'center', cellWidth: 18 },
        8: { cellWidth: 20 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount} - Sistem Peminjaman & Inventaris Kantor`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 8,
          { align: 'right' }
        );
      },
    });

    doc.save(`laporan-stok-barang-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
