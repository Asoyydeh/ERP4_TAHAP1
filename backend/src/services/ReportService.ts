import PDFDocument from 'pdfkit';
import prisma from '../config/db';

export class ReportService {
  /**
   * Menghasilkan file PDF daftar aset dalam bentuk buffer
   */
  static async generateAssetPDFReport(): Promise<Buffer> {
    const assets = await prisma.asset.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        skuCode: 'asc',
      },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Laporan
      doc
        .font('Times-Bold')
        .fillColor('#1e293b')
        .fontSize(20)
        .text('LAPORAN DAFTAR ASET PERUSAHAAN', { align: 'center' });
      
      doc
        .font('Times-Roman')
        .fontSize(10)
        .fillColor('#64748b')
        .text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, { align: 'center' });

      doc.moveDown(2);

      // Ringkasan Laporan
      const totalAssets = assets.length;
      const totalValue = assets.reduce((sum, item) => sum + item.price, 0);

      const summaryY = doc.y;
      doc
        .fillColor('#f8fafc')
        .rect(40, summaryY, 515, 50)
        .fill();

      // Border & Label Ringkasan
      doc
        .font('Times-Bold')
        .fillColor('#0f172a')
        .fontSize(11)
        .text(`Total Jenis Aset: ${totalAssets}`, 50, summaryY + 12)
        .text(`Total Nilai Aset: Rp ${totalValue.toLocaleString('id-ID')}`, 50, summaryY + 28);

      // Set doc.y manually to the bottom of the summary box
      doc.y = summaryY + 50;
      doc.moveDown(1.5);

      // Gambar Table Header
      const tableTop = doc.y;
      const colWidths = {
        sku: 85,
        name: 110,
        category: 85,
        status: 75,
        location: 80,
        price: 80,
      };

      const colPositions = {
        sku: 40,
        name: colPositionsOfX(colWidths.sku, 40),
        category: colPositionsOfX(colWidths.name, colPositionsOfX(colWidths.sku, 40)),
        status: colPositionsOfX(colWidths.category, colPositionsOfX(colWidths.name, colPositionsOfX(colWidths.sku, 40))),
        location: colPositionsOfX(colWidths.status, colPositionsOfX(colWidths.category, colPositionsOfX(colWidths.name, colPositionsOfX(colWidths.sku, 40)))),
        price: colPositionsOfX(colWidths.location, colPositionsOfX(colWidths.status, colPositionsOfX(colWidths.category, colPositionsOfX(colWidths.name, colPositionsOfX(colWidths.sku, 40))))),
      };

      function colPositionsOfX(width: number, currentX: number) {
        return currentX + width;
      }

      // Desain Header Tabel
      doc
        .rect(40, tableTop, 515, 20)
        .fillColor('#0284c7')
        .fill();

      doc
        .font('Times-Bold')
        .fillColor('#ffffff')
        .fontSize(9)
        .text('SKU', colPositions.sku + 5, tableTop + 5)
        .text('Nama Aset', colPositions.name + 5, tableTop + 5)
        .text('Kategori', colPositions.category + 5, tableTop + 5)
        .text('Status', colPositions.status + 5, tableTop + 5)
        .text('Lokasi', colPositions.location + 5, tableTop + 5)
        .text('Harga (Rp)', colPositions.price + 5, tableTop + 5);

      let currentY = tableTop + 20;

      // Iterasi Baris Tabel Aset
      assets.forEach((asset, index) => {
        // Ganti halaman jika terlalu panjang
        if (currentY > 750) {
          doc.addPage();
          currentY = 40; // Atur margin atas halaman baru
        }

        // Alternating row background
        if (index % 2 === 0) {
          doc
            .rect(40, currentY, 515, 20)
            .fillColor('#f1f5f9')
            .fill();
        }

        doc
          .font('Times-Roman')
          .fillColor('#334155')
          .fontSize(8)
          .text(asset.skuCode, colPositions.sku + 5, currentY + 6)
          .text(asset.name.length > 20 ? asset.name.substring(0, 18) + '...' : asset.name, colPositions.name + 5, currentY + 6)
          .text(asset.category.name, colPositions.category + 5, currentY + 6)
          .text(asset.status, colPositions.status + 5, currentY + 6)
          .text(asset.location, colPositions.location + 5, currentY + 6)
          .text(asset.price.toLocaleString('id-ID'), colPositions.price + 5, currentY + 6);

        // Border line horizontal tipis
        doc
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .moveTo(40, currentY + 20)
          .lineTo(555, currentY + 20)
          .stroke();

        currentY += 20;
      });

      doc.end();
    });
  }
}
