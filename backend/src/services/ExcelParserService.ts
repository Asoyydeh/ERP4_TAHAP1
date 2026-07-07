import * as XLSX from 'xlsx';
import prisma from '../config/db';

export class ExcelParserService {
  private static findVal(row: any, searchKeys: string[]): any {
    for (const k of Object.keys(row)) {
      const kLower = k.toLowerCase().trim();
      if (searchKeys.some(sk => kLower.includes(sk))) {
        return row[k];
      }
    }
    return null;
  }

  /**
   * Parse data BOQ Excel ke Database
   */
  static async parseBoq(filePath: string, documentId: string) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Buat BOQ Header
    const boqHeader = await prisma.boqHeader.create({
      data: {
        documentId,
        totalAmount: 0,
      },
    });

    let calculatedTotal = 0;
    const itemsData = [];

    for (const row of jsonData as any[]) {
      const description = this.findVal(row, ['deskripsi', 'pekerjaan', 'barang', 'description', 'item', 'nama'])?.toString();
      
      // Jika baris deskripsi kosong, abaikan
      if (!description) continue;

      const wbsCode = this.findVal(row, ['wbs', 'pos', 'kode', 'code'])?.toString() || null;

      const quantityVal = this.findVal(row, ['qty', 'volume', 'kuantitas', 'jumlah', 'quantity', 'vol']);
      const quantity = typeof quantityVal === 'number' ? quantityVal : parseFloat(quantityVal || '0');

      const unit = this.findVal(row, ['satuan', 'unit', 'sat'])?.toString() || 'pcs';

      const rateEngVal = this.findVal(row, ['harga', 'rate', 'price', 'satuan', 'eng']);
      const rateEngineering = typeof rateEngVal === 'number' ? rateEngVal : parseFloat(rateEngVal || '0');

      const notes = this.findVal(row, ['keterangan', 'notes', 'note', 'ket'])?.toString() || null;

      const totalPrice = quantity * rateEngineering;
      calculatedTotal += totalPrice;

      itemsData.push({
        boqHeaderId: boqHeader.id,
        wbsCode,
        description,
        quantity,
        unit,
        rateEngineering,
        rateProcurement: rateEngineering, // Di awal disamakan dengan harga engineering
        totalPrice,
        notes,
      });
    }

    if (itemsData.length > 0) {
      await prisma.boqItem.createMany({
        data: itemsData,
      });
    }

    // Perbarui total akumulasi di BOQ Header
    await prisma.boqHeader.update({
      where: { id: boqHeader.id },
      data: { totalAmount: calculatedTotal },
    });

    return { boqHeaderId: boqHeader.id, totalAmount: calculatedTotal, itemCount: itemsData.length };
  }

  /**
   * Parse data Penawaran Excel ke Database
   */
  static async parsePenawaran(
    filePath: string,
    documentId: string,
    vendorName: string,
    quoteNumber: string,
    validityDate: Date | null
  ) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const penawaranHeader = await prisma.penawaranHeader.create({
      data: {
        documentId,
        vendorName,
        quoteNumber,
        totalOffer: 0,
        validityDate,
      },
    });

    let calculatedTotal = 0;
    const itemsData = [];
    let idx = 1;

    for (const row of jsonData as any[]) {
      const description = this.findVal(row, ['deskripsi', 'barang', 'pekerjaan', 'description', 'name', 'item', 'nama'])?.toString();
      if (!description) continue;

      const itemNoVal = this.findVal(row, ['no', 'item']);
      const itemNo = typeof itemNoVal === 'number' ? itemNoVal : idx++;

      const quantityVal = this.findVal(row, ['qty', 'volume', 'kuantitas', 'jumlah', 'quantity', 'vol']);
      const quantity = typeof quantityVal === 'number' ? quantityVal : parseFloat(quantityVal || '0');

      const unit = this.findVal(row, ['satuan', 'unit', 'sat'])?.toString() || 'pcs';

      const unitPriceVal = this.findVal(row, ['harga', 'price', 'satuan', 'unit_price', 'unitprice']);
      const unitPrice = typeof unitPriceVal === 'number' ? unitPriceVal : parseFloat(unitPriceVal || '0');

      const notes = this.findVal(row, ['keterangan', 'notes', 'note', 'ket'])?.toString() || null;
      const totalPrice = quantity * unitPrice;
      calculatedTotal += totalPrice;

      itemsData.push({
        penawaranHeaderId: penawaranHeader.id,
        itemNo: Number(itemNo),
        description,
        quantity,
        unit,
        unitPrice,
        totalPrice,
        notes,
      });
    }

    if (itemsData.length > 0) {
      await prisma.penawaranItem.createMany({
        data: itemsData,
      });
    }

    await prisma.penawaranHeader.update({
      where: { id: penawaranHeader.id },
      data: { totalOffer: calculatedTotal },
    });

    return { penawaranHeaderId: penawaranHeader.id, totalOffer: calculatedTotal, itemCount: itemsData.length };
  }

  /**
   * Parse data RFQ Excel ke Database
   */
  static async parseRfq(
    filePath: string,
    documentId: string,
    rfqNumber: string,
    targetDate: Date | null,
    terms: string
  ) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const rfqHeader = await prisma.rfqHeader.create({
      data: {
        documentId,
        rfqNumber,
        targetDate,
        terms,
      },
    });

    const itemsData = [];
    let idx = 1;

    for (const row of jsonData as any[]) {
      const description = this.findVal(row, ['deskripsi', 'barang', 'pekerjaan', 'description', 'name', 'item', 'nama'])?.toString();
      if (!description) continue;

      const itemNoVal = this.findVal(row, ['no', 'item']);
      const itemNo = typeof itemNoVal === 'number' ? itemNoVal : idx++;

      const quantityVal = this.findVal(row, ['qty', 'volume', 'kuantitas', 'jumlah', 'quantity', 'vol']);
      const quantity = typeof quantityVal === 'number' ? quantityVal : parseFloat(quantityVal || '0');

      const unit = this.findVal(row, ['satuan', 'unit', 'sat'])?.toString() || 'pcs';
      const specifications = this.findVal(row, ['spesifikasi', 'specs', 'specification', 'detail'])?.toString() || null;
      const notes = this.findVal(row, ['keterangan', 'notes', 'note', 'ket'])?.toString() || null;

      itemsData.push({
        rfqHeaderId: rfqHeader.id,
        itemNo: Number(itemNo),
        description,
        quantity,
        unit,
        specifications,
        notes,
      });
    }

    if (itemsData.length > 0) {
      await prisma.rfqItem.createMany({
        data: itemsData,
      });
    }

    return { rfqHeaderId: rfqHeader.id, itemCount: itemsData.length };
  }
}
