import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { ExcelParserService } from '../services/ExcelParserService';
import { logAction } from '../utils/auditLogger';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { DocType, Role, DocStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export class DocumentController {
  /**
   * Upload berkas proyek dan mem-parsing jika formatnya Excel (.xlsx / .xls)
   */
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.body;
      const fileTypeParam = req.params.fileType as string;
      const file = req.file;

      if (!file) throw new BadRequestError('Berkas tidak ditemukan');
      if (!projectId) throw new BadRequestError('ID Proyek diperlukan');

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new NotFoundError('Proyek tidak ditemukan');

      // Validasi tipe berkas
      const docTypeString = fileTypeParam.toUpperCase();
      if (!Object.values(DocType).includes(docTypeString as DocType)) {
        throw new BadRequestError('Tipe dokumen tidak valid');
      }
      const docType = docTypeString as DocType;

      // Buat data Document di database
      const document = await prisma.document.create({
        data: {
          projectId,
          fileName: file.originalname,
          fileType: docType,
          filePath: file.path,
          fileSize: file.size,
          uploadedById: req.user!.id,
          status: docType === DocType.PO ? DocStatus.PO_PENDING : DocStatus.PENDING,
        },
      });

      let parseResult = null;
      const ext = path.extname(file.originalname).toLowerCase();
      const isExcel = ext === '.xlsx' || ext === '.xls';

      // Parse data excel jika tipenya sesuai
      if (isExcel) {
        if (docType === DocType.BOQ) {
          parseResult = await ExcelParserService.parseBoq(file.path, document.id);
        } else if (docType === DocType.PENAWARAN) {
          const { vendorName, quoteNumber, validityDate } = req.body;
          if (!vendorName) {
            throw new BadRequestError('Nama vendor wajib diisi untuk upload penawaran');
          }
          const validDate = validityDate ? new Date(validityDate) : null;
          parseResult = await ExcelParserService.parsePenawaran(
            file.path,
            document.id,
            vendorName,
            quoteNumber || '',
            validDate
          );
        } else if (docType === DocType.RFQ) {
          const { rfqNumber, targetDate, terms } = req.body;
          if (!rfqNumber) {
            throw new BadRequestError('Nomor RFQ wajib diisi');
          }
          const tgtDate = targetDate ? new Date(targetDate) : null;
          parseResult = await ExcelParserService.parseRfq(
            file.path,
            document.id,
            rfqNumber,
            tgtDate,
            terms || ''
          );
        }
      }

      await logAction({
        userId: req.user!.id,
        actionType: 'UPLOAD_DOCUMENT',
        tableName: 'documents',
        recordId: document.id,
        description: `Mengunggah berkas ${file.originalname} (${docType})${isExcel ? ' dan berhasil di-parse ke database' : ''}`,
        newValues: { document, parseResult },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Berkas berhasil diunggah',
        data: { document, parseResult },
      });
    } catch (error) {
      // Hapus file fisik jika transaksi database/parsing gagal
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  /**
   * Mendapatkan daftar semua dokumen
   */
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documents = await prisma.document.findMany({
        include: {
          project: { select: { name: true } },
          uploadedBy: { select: { name: true, role: true } },
          boqHeaders: true,
          penawaranHeaders: true,
          rfqHeaders: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengunduh berkas fisik proyek
   */
  static async download(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await prisma.document.findUnique({
        where: { id },
        include: { uploadedBy: true },
      });

      if (!document) throw new NotFoundError('Dokumen tidak ditemukan');
      if (!fs.existsSync(document.filePath)) {
        throw new NotFoundError('Berkas fisik tidak ditemukan di server');
      }

      await logAction({
        userId: req.user!.id,
        actionType: 'DOWNLOAD_DOCUMENT',
        tableName: 'documents',
        recordId: document.id,
        description: `Mengunduh berkas '${document.fileName}'`,
        ipAddress: req.ip,
      });

      res.download(document.filePath, document.fileName);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menghapus berkas beserta data terurai dari database
   */
  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await prisma.document.findUnique({ where: { id } });

      if (!document) throw new NotFoundError('Dokumen tidak ditemukan');

      // Proteksi hak akses penghapusan: Superadmin, atau Engineering yang mengupload filenya sendiri
      if (req.user!.role !== Role.SUPERADMIN && document.uploadedById !== req.user!.id) {
        throw new ForbiddenError('Anda tidak memiliki hak untuk menghapus berkas ini');
      }

      // Hapus berkas fisik jika ada
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      await prisma.document.delete({ where: { id } });

      await logAction({
        userId: req.user!.id,
        actionType: 'DELETE_DOCUMENT',
        tableName: 'documents',
        recordId: id,
        description: `Menghapus berkas '${document.fileName}' beserta seluruh datanya`,
        oldValues: document,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Dokumen berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan detail item dari BOQ Document
   */
  static async getBoqDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { docId } = req.params;
      const boqHeader = await prisma.boqHeader.findFirst({
        where: { documentId: docId },
        include: {
          items: { orderBy: { wbsCode: 'asc' } },
        },
      });

      if (!boqHeader) throw new NotFoundError('Data BOQ tidak ditemukan untuk dokumen ini');
      res.status(200).json({ success: true, data: boqHeader });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit harga satuan/estimasi BOQ oleh Procurement
   */
  static async updateBoqItemRate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { itemId } = req.params;
      const { rateProcurement, notes } = req.body;

      if (rateProcurement === undefined || rateProcurement === null) {
        throw new BadRequestError('Harga satuan procurement diperlukan');
      }

      const existingItem = await prisma.boqItem.findUnique({
        where: { id: itemId },
        include: { boqHeader: true },
      });

      if (!existingItem) throw new NotFoundError('Item BOQ tidak ditemukan');

      const newRate = parseFloat(rateProcurement);
      const newTotalPrice = existingItem.quantity * newRate;

      // Update item BOQ
      const updatedItem = await prisma.boqItem.update({
        where: { id: itemId },
        data: {
          rateProcurement: newRate,
          totalPrice: newTotalPrice,
          notes: notes !== undefined ? notes : existingItem.notes,
        },
      });

      // Hitung ulang total amount di BOQ Header
      const allItems = await prisma.boqItem.findMany({
        where: { boqHeaderId: existingItem.boqHeaderId },
      });
      const newTotalHeaderAmount = allItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await prisma.boqHeader.update({
        where: { id: existingItem.boqHeaderId },
        data: { totalAmount: newTotalHeaderAmount },
      });

      // Perbarui status dokumen menjadi REVISED
      await prisma.document.update({
        where: { id: existingItem.boqHeader.documentId },
        data: { status: DocStatus.REVISED_BY_PROCUREMENT },
      });

      await logAction({
        userId: req.user!.id,
        actionType: 'EDIT_BOQ_ITEM',
        tableName: 'boq_items',
        recordId: itemId,
        description: `Mengubah harga item BOQ '${existingItem.description}' dari ${existingItem.rateProcurement} menjadi ${newRate}`,
        oldValues: existingItem,
        newValues: updatedItem,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: updatedItem });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan detail item Penawaran (Quotation) untuk Finance
   */
  static async getPenawaranDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { docId } = req.params;
      const penawaranHeader = await prisma.penawaranHeader.findFirst({
        where: { documentId: docId },
        include: {
          items: { orderBy: { itemNo: 'asc' } },
        },
      });

      if (!penawaranHeader) throw new NotFoundError('Data penawaran tidak ditemukan');
      res.status(200).json({ success: true, data: penawaranHeader });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan detail item RFQ
   */
  static async getRfqDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { docId } = req.params;
      const rfqHeader = await prisma.rfqHeader.findFirst({
        where: { documentId: docId },
        include: {
          items: { orderBy: { itemNo: 'asc' } },
        },
      });

      if (!rfqHeader) throw new NotFoundError('Data RFQ tidak ditemukan');
      res.status(200).json({ success: true, data: rfqHeader });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengubah status dokumen (misalnya menyetujui dokumen atau merilis PO)
   */
  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) throw new BadRequestError('Status baru diperlukan');
      if (!Object.values(DocStatus).includes(status as DocStatus)) {
        throw new BadRequestError('Status tidak valid');
      }

      const document = await prisma.document.findUnique({ where: { id } });
      if (!document) throw new NotFoundError('Dokumen tidak ditemukan');

      // Proteksi: Hanya Superadmin, Finance, atau Procurement yang diizinkan merubah status
      const allowedRoles: Role[] = [Role.SUPERADMIN, Role.FINANCE, Role.PROCUREMENT];
      if (!allowedRoles.includes(req.user!.role)) {
        throw new ForbiddenError('Anda tidak memiliki hak untuk mengubah status berkas');
      }

      const updatedDoc = await prisma.document.update({
        where: { id },
        data: { status: status as DocStatus },
      });

      await logAction({
        userId: req.user!.id,
        actionType: 'UPDATE_DOCUMENT_STATUS',
        tableName: 'documents',
        recordId: id,
        description: `Mengubah status berkas '${document.fileName}' dari ${document.status} menjadi ${status}`,
        oldValues: document,
        newValues: updatedDoc,
        ipAddress: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Status dokumen berhasil diperbarui',
        data: updatedDoc,
      });
    } catch (error) {
      next(error);
    }
  }
}
