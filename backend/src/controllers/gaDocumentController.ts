import { Response } from 'express';
import { AuthenticatedRequest as AuthRequest } from '../middlewares/auth';
import prisma from '../config/db';
import fs from 'fs';
import path from 'path';

/**
 * Controller untuk Formulir Dokumen GA (General Affairs)
 * Tanda tangan diambil dari folder TTD_HRGA(DJI) dan TTD_HRGA(MJK)
 */

// Helper untuk memindai folder tanda tangan GA
const getHrgaSignaturesFromDir = (companyFolder: string) => {
  const baseDir = path.resolve(process.cwd(), '..', 'TandaTanganDokumen', 'TandaTangan', companyFolder);
  const results: { name: string; imageUrl: string }[] = [];

  if (!fs.existsSync(baseDir)) {
    return results;
  }

  const personDirs = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const personDir of personDirs) {
    if (personDir.isDirectory()) {
      const personName = personDir.name;
      const personPath = path.join(baseDir, personName);
      const files = fs.readdirSync(personPath);

      const imageFile = files.find(file =>
        /\.(png|jpg|jpeg|webp|svg)$/i.test(file)
      );

      if (imageFile) {
        const relativeUrl = `/signatures-assets/${encodeURIComponent(companyFolder)}/${encodeURIComponent(personName)}/${encodeURIComponent(imageFile)}`;
        results.push({
          name: personName,
          imageUrl: relativeUrl,
        });
      }
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
};

// GET /ga-documents/signatures
export const getGaSignatures = async (req: AuthRequest, res: Response) => {
  try {
    const hrgaMjkSigs = getHrgaSignaturesFromDir('TTD_HRGA(MJK)');
    const hrgaDjiSigs = getHrgaSignaturesFromDir('TTD_HRGA(DJI)');

    // Merge: MJK signatures first, then add DJI ones not already in MJK
    const mergedMap = new Map<string, { name: string; imageUrl: string }>();
    [...hrgaMjkSigs, ...hrgaDjiSigs].forEach(item => {
      if (!mergedMap.has(item.name)) {
        mergedMap.set(item.name, item);
      }
    });

    const allSignatures = Array.from(mergedMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return res.status(200).json({
      success: true,
      signatures: {
        MJK: hrgaMjkSigs,
        DJI: hrgaDjiSigs,
        ALL: allSignatures,
      },
    });
  } catch (error: any) {
    console.error('Error fetching GA signatures:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tanda tangan GA',
      error: error.message,
    });
  }
};

// POST /ga-documents/forms
export const createGaForm = async (req: AuthRequest, res: Response) => {
  try {
    const allowedRoles = ['SUPERADMIN', 'HRD', 'GA', 'STAFF_GA'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Fitur ini hanya untuk HRD & Super Admin.',
      });
    }

    const { company, documentNo, documentTitle, documentData } = req.body;

    if (!company || !documentNo || !documentData) {
      return res.status(400).json({
        success: false,
        message: 'Data tidak lengkap (company, documentNo, documentData wajib diisi).',
      });
    }

    const gaCompany = `GA-${company}`;

    const existingDoc = await (prisma as any).companyFormDocument.findFirst({
      where: { company: gaCompany, documentNo },
    });

    let doc;
    if (existingDoc) {
      doc = await (prisma as any).companyFormDocument.update({
        where: { id: existingDoc.id },
        data: {
          vendorName: documentTitle || null,
          documentData,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    } else {
      doc = await (prisma as any).companyFormDocument.create({
        data: {
          company: gaCompany,
          documentNo,
          poNo: null,
          vendorName: documentTitle || null,
          documentData,
          createdById: req.user!.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Formulir GA berhasil disimpan',
      data: doc,
    });
  } catch (error: any) {
    console.error('Error creating GA form:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan formulir GA',
      error: error.message,
    });
  }
};

// GET /ga-documents/forms
export const getGaForms = async (req: AuthRequest, res: Response) => {
  try {
    const { company } = req.query;

    const whereCondition: any = {
      company: { startsWith: 'GA-' },
    };

    if (company && typeof company === 'string') {
      whereCondition.company = `GA-${company}`;
    }

    const docs = await (prisma as any).companyFormDocument.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error: any) {
    console.error('Error fetching GA forms:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat formulir GA',
      error: error.message,
    });
  }
};

// PUT /ga-documents/forms/:id
export const updateGaForm = async (req: AuthRequest, res: Response) => {
  try {
    const allowedRoles = ['SUPERADMIN', 'HRD', 'GA', 'STAFF_GA', 'PROCUREMENT', 'FINANCE', 'PROYEK_ADMIN', 'SUPERVISOR', 'PROJECT_MANAGER', 'ENGINEERING'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const { id } = req.params;
    const { documentNo, documentTitle, documentData } = req.body;

    const existing = await (prisma as any).companyFormDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Formulir GA tidak ditemukan' });
    }

    const doc = await (prisma as any).companyFormDocument.update({
      where: { id },
      data: {
        documentNo: documentNo || existing.documentNo,
        vendorName: documentTitle !== undefined ? documentTitle : existing.vendorName,
        documentData: documentData || existing.documentData,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return res.status(200).json({ success: true, message: 'Formulir GA berhasil diperbarui', data: doc });
  } catch (error: any) {
    console.error('Error updating GA form:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui formulir GA', error: error.message });
  }
};

// DELETE /ga-documents/forms/:id
export const deleteGaForm = async (req: AuthRequest, res: Response) => {
  try {
    const allowedRoles = ['SUPERADMIN', 'HRD', 'GA', 'STAFF_GA'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    const { id } = req.params;
    const existing = await (prisma as any).companyFormDocument.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Formulir GA tidak ditemukan' });
    }

    await (prisma as any).companyFormDocument.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Formulir GA berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting GA form:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus formulir GA', error: error.message });
  }
};

// POST /ga-documents/upload-attachment
export const uploadGaAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Berkas tidak ditemukan' });
    }
    const relativePath = req.file.path.replace(/\\/g, '/');
    const storageIdx = relativePath.indexOf('/storage/');
    const fileUrl = storageIdx !== -1 ? relativePath.substring(storageIdx) : `/storage/uploads/general/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Berkas lampiran GA berhasil diunggah',
      fileUrl,
      fileName: req.file.originalname,
    });
  } catch (error: any) {
    console.error('Error uploading GA attachment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengunggah lampiran GA',
      error: error.message,
    });
  }
};

