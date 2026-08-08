import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { ExcelParserService } from '../services/ExcelParserService';
import { logAction } from '../utils/auditLogger';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { DocType, Role, DocStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
const archiver = require('archiver');
function resolveExistingFilePath(storedPath: string, fileName?: string): string | null {
  if (!storedPath) return null;

  const toAbs = (p: string) => path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);

  // 1. Direct path check (resolve to absolute path)
  const absDirect = toAbs(storedPath);
  if (fs.existsSync(absDirect)) return absDirect;

  // 2. Absolute path check
  const absPath = path.resolve(storedPath);
  if (fs.existsSync(absPath)) return absPath;

  // 3. Normalized path check (strip leading slashes / storage prefix)
  const relativeClean = storedPath.replace(/^\/+/, '').replace(/^storage\/+/, '');
  const rootRelative = path.join(process.cwd(), relativeClean);
  if (fs.existsSync(rootRelative)) return rootRelative;

  const storageRelative = path.join(process.cwd(), 'storage', relativeClean);
  if (fs.existsSync(storageRelative)) return storageRelative;

  // 4. Fallback search in storage/dummy or uploads/documents
  const ext = (path.extname(fileName || storedPath) || '.xlsx').toLowerCase();
  const dummyDir = path.join(process.cwd(), 'storage', 'dummy');
  if (fs.existsSync(dummyDir)) {
    const dummyFiles = fs.readdirSync(dummyDir);
    const matched = dummyFiles.find((f) => f.toLowerCase().endsWith(ext));
    if (matched) return path.join(dummyDir, matched);
    if (dummyFiles.length > 0) return path.join(dummyDir, dummyFiles[0]);
  }

  const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    if (files.length > 0) return path.join(uploadDir, files[0]);
  }

  return null;
}

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

      // Validasi hak akses unggah berdasarkan Peran
      const userRole = req.user!.role;
      if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN_MONITORING) {
        let allowedUploadTypes: DocType[] = [];
        if (userRole === Role.ENGINEERING) {
          allowedUploadTypes = [
            DocType.SPK,
            DocType.DRAWING,
            DocType.RAB,
            DocType.PENAWARAN_DRAFT,
            DocType.BOQ,
            DocType.FORECAST_COST,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.INVOICE,
            DocType.PENAWARAN_FINAL,
          ];
        } else if (userRole === Role.PROYEK_ADMIN) {
          allowedUploadTypes = [
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.INVOICE,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.DRAWING,
            DocType.DRAWING_AS_BUILT,
            DocType.BOQ,
            DocType.RAB,
            DocType.RFQ_SCAN_KOSONG,
            DocType.PENAWARAN_DRAFT,
            DocType.FORECAST_COST,
          ];
        } else if (userRole === Role.PROCUREMENT) {
          allowedUploadTypes = [
            DocType.BOQ,
            DocType.PENAWARAN_DRAFT,
            DocType.PENAWARAN_FINAL,
            DocType.RFQ_SCAN_KOSONG,
            DocType.SUBKON_DOCS,
            DocType.SPK,
            DocType.RAB,
            DocType.FORECAST_COST,
            DocType.FOTO,
          ];
        } else if (userRole === Role.FINANCE) {
          allowedUploadTypes = [
            DocType.INVOICE,
            DocType.SPK,
            DocType.SUBKON_DOCS,
            DocType.PENAWARAN_FINAL,
            DocType.BOQ,
            DocType.RAB,
            DocType.FOTO,
          ];
        } else {
          allowedUploadTypes = [
            DocType.SPK,
            DocType.INVOICE,
            DocType.FOTO,
            DocType.SUBKON_DOCS,
            DocType.DRAWING,
            DocType.RAB,
            DocType.BOQ,
          ];
        }
        
        if (!allowedUploadTypes.includes(docType)) {
          throw new ForbiddenError('Anda tidak memiliki hak untuk mengunggah jenis berkas ini');
        }
      }

      // Buat data Document di database
      const { subFolderName } = req.body;
      const document = await prisma.document.create({
        data: {
          projectId,
          fileName: file.originalname,
          fileType: docType,
          filePath: file.path,
          fileSize: file.size,
          uploadedById: req.user!.id,
          subFolderName: subFolderName || null,
          status: docType === DocType.SUBKON_DOCS ? DocStatus.PO_PENDING : DocStatus.PENDING,
        },
      });

      let parseResult = null;
      const ext = path.extname(file.originalname).toLowerCase();
      const isExcel = ext === '.xlsx' || ext === '.xls';

      // Parse data excel jika tipenya sesuai
      if (isExcel) {
        if (docType === DocType.BOQ) {
          parseResult = await ExcelParserService.parseBoq(file.path, document.id);
        } else if (docType === DocType.PENAWARAN_DRAFT) {
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
        } else if (docType === DocType.RFQ_SCAN_KOSONG) {
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
      const userRole = req.user!.role;
      let whereClause: any = {};

      if (userRole !== Role.SUPERADMIN && userRole !== Role.ADMIN_MONITORING) {
        let allowedTypes: DocType[] = [];

        if (userRole === Role.ENGINEERING) {
          allowedTypes = [
            DocType.DRAWING,
            DocType.RAB,
            DocType.PENAWARAN_DRAFT,
            DocType.BOQ,
            DocType.FORECAST_COST,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.INVOICE
          ];
        } else if (userRole === Role.PROYEK_ADMIN) {
          allowedTypes = [
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.INVOICE,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.DRAWING,
            DocType.RAB,
            DocType.BOQ,
            DocType.PENAWARAN_DRAFT,
            DocType.FORECAST_COST
          ];
        } else if (userRole === Role.PROCUREMENT) {
          allowedTypes = [
            DocType.BOQ,
            DocType.PENAWARAN_DRAFT,
            DocType.PENAWARAN_FINAL,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.SUBKON_DOCS,
            DocType.SPK,
            DocType.RAB,
            DocType.FORECAST_COST,
            DocType.FOTO,
            DocType.DRAWING
          ];
        } else if (userRole === Role.FINANCE) {
          allowedTypes = [
            DocType.PENAWARAN_FINAL,
            DocType.INVOICE,
            DocType.SUBKON_DOCS,
            DocType.RFQ_SCAN_KOSONG,
            DocType.RAB,
            DocType.PENAWARAN_DRAFT,
            DocType.BOQ,
            DocType.FORECAST_COST,
            DocType.SPK,
            DocType.FOTO
          ];
        } else {
          allowedTypes = [
            DocType.DRAWING,
            DocType.RAB,
            DocType.PENAWARAN_DRAFT,
            DocType.BOQ,
            DocType.FORECAST_COST,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.INVOICE
          ];
        }

        whereClause = {
          fileType: { in: allowedTypes }
        };
      }

      if (req.query.projectId) {
        whereClause.projectId = req.query.projectId as string;
      }

      if (req.user?.managerId) {
        whereClause.project = {
          OR: [
            { penawaranPicId: req.user.id },
            { boqPicId: req.user.id },
            { rfqPicId: req.user.id },
            { spkPicId: req.user.id },
            { progressPicId: req.user.id },
            { invoicePicId: req.user.id }
          ]
        };
      }

      const documents = await prisma.document.findMany({
        where: whereClause,
        include: {
          project: { select: { id: true, code: true, name: true } },
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

      // Validasi Hak Akses Unduh berdasarkan Peran
      let rawRole = (req.user?.role || '').toUpperCase();
      if (rawRole === 'STAFF' && req.user?.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: req.user.managerId },
          select: { role: true }
        });
        if (manager?.role) {
          rawRole = (manager.role || '').toUpperCase();
        }
      }

      const fullAccessRoles = ['SUPERADMIN', 'ADMIN_MONITORING', 'PROCUREMENT', 'ENGINEERING', 'FINANCE'];
      if (!fullAccessRoles.includes(rawRole)) {
        if (rawRole === 'PROYEK_ADMIN') {
          const allowedTypes: DocType[] = [
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.INVOICE,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.DRAWING,
            DocType.RAB,
            DocType.BOQ
          ];
          if (!allowedTypes.includes(document.fileType)) {
            throw new ForbiddenError('Anda tidak memiliki hak untuk mengunduh tipe berkas ini');
          }
        } else {
          throw new ForbiddenError('Anda tidak memiliki hak untuk mengunduh tipe berkas ini');
        }
      }

      const fileToServe = resolveExistingFilePath(document.filePath, document.fileName);

      if (!fileToServe) {
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

      res.download(fileToServe, document.fileName);
    } catch (error) {
      next(error);
    }
  }

  static async view(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await prisma.document.findUnique({
        where: { id },
        include: { uploadedBy: true },
      });

      if (!document) throw new NotFoundError('Dokumen tidak ditemukan');

      // Validasi Hak Akses View berdasarkan Peran
      let rawRole = (req.user?.role || '').toUpperCase();
      if (rawRole === 'STAFF' && req.user?.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: req.user.managerId },
          select: { role: true }
        });
        if (manager?.role) {
          rawRole = (manager.role || '').toUpperCase();
        }
      }

      const fullAccessRoles = ['SUPERADMIN', 'ADMIN_MONITORING', 'PROCUREMENT', 'ENGINEERING', 'FINANCE'];
      if (!fullAccessRoles.includes(rawRole)) {
        if (rawRole === 'PROYEK_ADMIN') {
          const allowedTypes: DocType[] = [
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.INVOICE,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.DRAWING,
            DocType.RAB,
            DocType.BOQ
          ];
          if (!allowedTypes.includes(document.fileType)) {
            throw new ForbiddenError('Anda tidak memiliki hak untuk melihat tipe berkas ini');
          }
        } else {
          throw new ForbiddenError('Anda tidak memiliki hak untuk melihat tipe berkas ini');
        }
      }

      const fileToServe = resolveExistingFilePath(document.filePath, document.fileName);

      if (!fileToServe) {
        throw new NotFoundError('Berkas fisik tidak ditemukan di server');
      }

      await logAction({
        userId: req.user!.id,
        actionType: 'VIEW_DOCUMENT',
        tableName: 'documents',
        recordId: document.id,
        description: `Membuka/melihat berkas '${document.fileName}'`,
        ipAddress: req.ip,
      });

      const absoluteFileToServe = path.resolve(process.cwd(), fileToServe);
      res.sendFile(absoluteFileToServe, (err) => {
        if (err && !res.headersSent) {
          console.error('SendFile Error:', err);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengunduh seluruh berkas proyek dalam format ZIP
   */
  static async downloadAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let rawRole = (req.user?.role || '').toUpperCase();
      if (rawRole === 'STAFF' && req.user?.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: req.user.managerId },
          select: { role: true }
        });
        if (manager?.role) {
          rawRole = (manager.role || '').toUpperCase();
        }
      }
      const groupParam = req.query.group as string;

      const GROUP_FILE_TYPES: Record<string, DocType[]> = {
        klien: [DocType.SPK, DocType.PENAWARAN_FINAL, DocType.DRAWING_AS_BUILT, DocType.INVOICE],
        subkon: [DocType.SUBKON_DOCS, DocType.RFQ_SCAN_KOSONG],
        internal: [DocType.DRAWING, DocType.FOTO, DocType.RAB, DocType.PENAWARAN_DRAFT, DocType.BOQ, DocType.FORECAST_COST]
      };

      let allowedTypes: DocType[] = Object.values(DocType);

      const fullAccessRoles = ['SUPERADMIN', 'ADMIN_MONITORING', 'PROCUREMENT', 'ENGINEERING', 'FINANCE'];
      if (!fullAccessRoles.includes(rawRole)) {
        if (rawRole === 'PROYEK_ADMIN') {
          allowedTypes = [
            DocType.SPK,
            DocType.PENAWARAN_FINAL,
            DocType.INVOICE,
            DocType.SUBKON_DOCS,
            DocType.FOTO,
            DocType.DRAWING_AS_BUILT,
            DocType.RFQ_SCAN_KOSONG,
            DocType.DRAWING,
            DocType.RAB,
            DocType.BOQ
          ];
        } else {
          allowedTypes = [];
        }
      }

      // Filter berdasarkan grup jika di-request
      if (groupParam && GROUP_FILE_TYPES[groupParam]) {
        allowedTypes = allowedTypes.filter(type => GROUP_FILE_TYPES[groupParam].includes(type));
      }

      const whereClause = {
        fileType: { in: allowedTypes }
      };

      const documents = await prisma.document.findMany({
        where: whereClause,
        include: {
          project: { select: { name: true } },
          uploadedBy: { select: { name: true } },
        },
      });

      const validDocuments = documents.map((doc) => {
        const resolved = resolveExistingFilePath(doc.filePath, doc.fileName);
        return resolved ? { ...doc, resolvedPath: resolved } : null;
      }).filter(Boolean) as (typeof documents[0] & { resolvedPath: string })[];

      if (validDocuments.length === 0) {
        throw new NotFoundError('Tidak ada berkas fisik yang ditemukan di server');
      }

      // Set headers untuk download ZIP
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=semua-berkas-proyek.zip');

      const archive = archiver('zip', { zlib: { level: 9 } });

      // Tangani error kompresi
      archive.on('error', (err: any) => {
        throw err;
      });

      // Pipa data kompresi langsung ke response
      archive.pipe(res);

      // Tambahkan setiap file ke ZIP dengan subfolder: Proyek/Tipe_Dokumen/Nama_File
      for (const doc of validDocuments) {
        // Hilangkan karakter ilegal dari nama folder proyek agar aman
        const safeProjectName = doc.project.name.replace(/[^a-zA-Z0-9\s-_]/g, '').trim() || doc.projectId;
        const folderInZip = `${safeProjectName}/${doc.fileType}`;
        archive.file(doc.resolvedPath, { name: `${folderInZip}/${doc.fileName}` });
      }

      await logAction({
        userId: req.user!.id,
        actionType: 'DOWNLOAD_ALL_DOCUMENTS',
        tableName: 'documents',
        recordId: 'all',
        description: `Mengunduh seluruh berkas proyek (${validDocuments.length} berkas) dalam format ZIP`,
        ipAddress: req.ip,
      });

      await archive.finalize();
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

      // Proteksi hak akses penghapusan: Superadmin, owner, atau Procurement (khusus BOQ)
      const isOwner = document.uploadedById === req.user!.id;
      const isProcurementDeletingBoq = req.user!.role === Role.PROCUREMENT && document.fileType === 'BOQ';
      if (req.user!.role !== Role.SUPERADMIN && !isOwner && !isProcurementDeletingBoq) {
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
      let rawRole = (req.user?.role || '').toUpperCase();
      if (rawRole === 'STAFF' && req.user?.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: req.user.managerId },
          select: { role: true }
        });
        if (manager?.role) {
          rawRole = (manager.role || '').toUpperCase();
        }
      }

      const allowedRoles = ['SUPERADMIN', 'FINANCE', 'PROCUREMENT'];
      if (!allowedRoles.includes(rawRole)) {
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
