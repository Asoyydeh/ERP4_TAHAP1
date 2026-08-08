import { Response } from 'express';
import { AuthenticatedRequest as AuthRequest } from '../middlewares/auth';
import prisma from '../config/db';
import fs from 'fs';
import path from 'path';

/**
 * Controller untuk mengelola Formulir Dokumen Perusahaan (MJI, DJI, IRI) & Tanda Tangan
 */

// Helper untuk memindai seluruh folder TandaTanganDokumen secara rekursif
const scanAllDiskSignatures = () => {
  const rootDir = path.resolve(process.cwd(), '..', 'TandaTanganDokumen');
  const results: { name: string; imageUrl: string }[] = [];

  if (!fs.existsSync(rootDir)) return results;

  const walk = (currentDir: string) => {
    try {
      const items = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        if (item.isDirectory()) {
          const files = fs.readdirSync(fullPath);
          const imgFile = files.find(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));

          if (imgFile) {
            const relPath = path.relative(rootDir, path.join(fullPath, imgFile)).replace(/\\/g, '/');
            let imageUrl = '';
            if (relPath.startsWith('TandaTangan/')) {
              imageUrl = `/signatures-assets/${relPath.substring('TandaTangan/'.length)}`;
            } else if (relPath.startsWith('Proyekadmin/')) {
              imageUrl = `/proyekadmin-signatures-assets/${relPath.substring('Proyekadmin/'.length)}`;
            } else {
              imageUrl = `/signatures-assets/${relPath}`;
            }

            const personName = item.name;
            results.push({ name: personName, imageUrl });

            // Variasi nama umum
            const lowerName = personName.toLowerCase();
            if (lowerName === 'edi') {
              results.push({ name: 'Edi Purwanto', imageUrl });
              results.push({ name: 'Edi', imageUrl });
              results.push({ name: 'Dwi', imageUrl });
            } else if (lowerName === 'fanisa') {
              results.push({ name: 'Fanisa Ariesti', imageUrl });
            } else if (lowerName === 'joko') {
              results.push({ name: 'Joko', imageUrl });
            }
          }
          walk(fullPath);
        } else if (item.isFile() && /\.(png|jpg|jpeg|webp|svg)$/i.test(item.name)) {
          const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          let imageUrl = '';
          if (relPath.startsWith('TandaTangan/')) {
            imageUrl = `/signatures-assets/${relPath.substring('TandaTangan/'.length)}`;
          } else if (relPath.startsWith('Proyekadmin/')) {
            imageUrl = `/proyekadmin-signatures-assets/${relPath.substring('Proyekadmin/'.length)}`;
          } else {
            imageUrl = `/signatures-assets/${relPath}`;
          }

          let rawName = item.name.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '');
          rawName = rawName.replace(/^TTD[_-]?/i, '').replace(/[-_]removebg[-_]preview/i, '').trim();
          if (rawName) {
            const personName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
            results.push({ name: personName, imageUrl });

            const lowerName = personName.toLowerCase();
            if (lowerName === 'joko') {
              results.push({ name: 'Joko', imageUrl });
            } else if (lowerName === 'edi') {
              results.push({ name: 'Edi Purwanto', imageUrl });
              results.push({ name: 'Edi', imageUrl });
            } else if (lowerName === 'fanisa') {
              results.push({ name: 'Fanisa Ariesti', imageUrl });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error scanning dir for signatures:', e);
    }
  };

  walk(rootDir);
  return results;
};

export const getSignatures = async (req: AuthRequest, res: Response) => {
  try {
    const diskSignatures = scanAllDiskSignatures();

    const sigMap = new Map<string, { name: string; imageUrl: string }>();
    diskSignatures.forEach(s => {
      if (!sigMap.has(s.name)) {
        sigMap.set(s.name, s);
      }
    });

    const finalSignatures = Array.from(sigMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      success: true,
      data: finalSignatures,
      signatures: {
        MJK: finalSignatures,
        MJI: finalSignatures,
        DJI: finalSignatures,
        IRI: finalSignatures,
        ALL: {
          MJK: finalSignatures,
          MJI: finalSignatures,
          DJI: finalSignatures,
          IRI: finalSignatures,
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching signatures:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tanda tangan',
      error: error.message,
    });
  }
};

const getProyekAdminSignaturesFromDir = (companyFolder: string) => {
  const baseDir = path.resolve(process.cwd(), '..', 'TandaTanganDokumen', 'Proyekadmin', companyFolder);
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
        // Encoding URI component for space or special chars
        const relativeUrl = `/proyekadmin-signatures-assets/${encodeURIComponent(companyFolder)}/${encodeURIComponent(personName)}/${encodeURIComponent(imageFile)}`;
        results.push({
          name: personName,
          imageUrl: relativeUrl,
        });
      }
    }
  }

  return results.sort((a, b) => a.name.localeCompare(b.name));
};

export const getProyekAdminSignatures = async (req: AuthRequest, res: Response) => {
  try {
    const mjkSignatures = getProyekAdminSignaturesFromDir('TandaTangan(MJK)');
    const djiSignatures = getProyekAdminSignaturesFromDir('TandaTangan(DJI)');

    return res.status(200).json({
      success: true,
      signatures: {
        MJI: mjkSignatures,
        DJI: djiSignatures
      }
    });
  } catch (error: any) {
    console.error('Error fetching proyek admin signatures:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data tanda tangan proyek admin',
      error: error.message,
    });
  }
};

export const createCompanyForm = async (req: AuthRequest, res: Response) => {
  try {
    const allowedRoles = ['SUPERADMIN', 'PROCUREMENT', 'FINANCE', 'PROYEK_ADMIN'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Fitur ini hanya untuk Staff Procurement, Divisi Utama Procurement, Finance, & Super Admin.',
      });
    }

    let { company, documentNo, poNo, vendorName, documentData } = req.body;

    if (!company || !documentNo || !documentData) {
      return res.status(400).json({
        success: false,
        message: 'Data permohonan tidak lengkap (company, documentNo, documentData wajib diisi).',
      });
    }

    if (company === 'MJI') company = 'MJK';
    if (documentNo.includes('PR.MJI.')) documentNo = documentNo.replace(/PR\.MJI\./g, 'PR.MJK.');
    if (poNo && poNo.includes('MJIPO')) poNo = poNo.replace(/MJIPO/g, 'MJKPO');
    if (documentData) {
      if (documentData.docNo && documentData.docNo.includes('PR.MJI.')) {
        documentData.docNo = documentData.docNo.replace(/PR\.MJI\./g, 'PR.MJK.');
      }
      if (documentData.poNo && documentData.poNo.includes('MJIPO')) {
        documentData.poNo = documentData.poNo.replace(/MJIPO/g, 'MJKPO');
      }
    }

    const doc = await (prisma as any).companyFormDocument.create({
      data: {
        company,
        documentNo,
        poNo: poNo || null,
        vendorName: vendorName || null,
        documentData,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Formulir dokumen berhasil disimpan dan terhubung',
      data: doc,
    });
  } catch (error: any) {
    console.error('Error creating company form:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan formulir dokumen',
      error: error.message,
    });
  }
};

export const getCompanyForms = async (req: AuthRequest, res: Response) => {
  try {
    const { company } = req.query;

    const whereCondition: any = {
      NOT: [
        { company: { startsWith: 'GA' } },
        { documentNo: { startsWith: 'GA' } },
        { documentNo: { contains: 'PR-GA' } },
      ]
    };
    if (company && typeof company === 'string') {
      if (company === 'MJK' || company === 'MJI') {
        whereCondition.company = { in: ['MJK', 'MJI'] };
      } else {
        whereCondition.company = company;
      }
    }

    const docs = await (prisma as any).companyFormDocument.findMany({
      where: whereCondition,

      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: docs,
    });
  } catch (error: any) {
    console.error('Error fetching company forms:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat formulir dokumen',
      error: error.message,
    });
  }
};

export const getCompanyFormById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await (prisma as any).companyFormDocument.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Formulir dokumen tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error: any) {
    console.error('Error fetching company form detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail formulir dokumen',
      error: error.message,
    });
  }
};

export const updateCompanyForm = async (req: AuthRequest, res: Response) => {
  try {
    const allowedRoles = ['SUPERADMIN', 'PROCUREMENT', 'FINANCE', 'PROYEK_ADMIN', 'SUPERVISOR', 'PROJECT_MANAGER', 'ENGINEERING', 'GA', 'STAFF_GA', 'HRD'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Pengunaan fitur ini memerlukan hak akses divisi atau Super Admin.',
      });
    }

    const { id } = req.params;
    let { company, documentNo, poNo, vendorName, documentData } = req.body;

    const existing = await (prisma as any).companyFormDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Formulir dokumen tidak ditemukan',
      });
    }

    if (company === 'MJI') company = 'MJK';
    if (documentNo && documentNo.includes('PR.MJI.')) documentNo = documentNo.replace(/PR\.MJI\./g, 'PR.MJK.');
    if (poNo && poNo.includes('MJIPO')) poNo = poNo.replace(/MJIPO/g, 'MJKPO');
    if (documentData) {
      if (documentData.docNo && documentData.docNo.includes('PR.MJI.')) {
        documentData.docNo = documentData.docNo.replace(/PR\.MJI\./g, 'PR.MJK.');
      }
      if (documentData.poNo && documentData.poNo.includes('MJIPO')) {
        documentData.poNo = documentData.poNo.replace(/MJIPO/g, 'MJKPO');
      }
    }

    const doc = await (prisma as any).companyFormDocument.update({
      where: { id },
      data: {
        company: company || existing.company,
        documentNo: documentNo || existing.documentNo,
        poNo: poNo !== undefined ? poNo : existing.poNo,
        vendorName: vendorName !== undefined ? vendorName : existing.vendorName,
        documentData: documentData || existing.documentData,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Formulir dokumen berhasil diperbarui',
      data: doc,
    });
  } catch (error: any) {
    console.error('Error updating company form:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui formulir dokumen',
      error: error.message,
    });
  }
};

export const deleteCompanyForm = async (req: AuthRequest, res: Response) => {
  try {
    const allowedRoles = ['SUPERADMIN', 'PROCUREMENT', 'FINANCE', 'PROYEK_ADMIN', 'GA', 'STAFF_GA', 'HRD'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki izin untuk menghapus formulir dokumen.',
      });
    }

    const { id } = req.params;

    const existing = await (prisma as any).companyFormDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Formulir dokumen tidak ditemukan',
      });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    // Superadmin memiliki akses hapus penuh
    if (userRole !== 'SUPERADMIN') {
      const creator = await prisma.user.findUnique({
        where: { id: existing.createdById },
        select: { role: true, managerId: true }
      });

      const creatorRole = creator?.role || '';
      
      // Jika dokumen dibuat oleh Procurement/staffnya, hanya Procurement/staffnya atau Superadmin yang bisa hapus
      if (creatorRole === 'PROCUREMENT') {
        let isStaffProcurement = false;
        if (req.user.managerId) {
          const mgr = await prisma.user.findUnique({ where: { id: req.user.managerId }, select: { role: true } });
          if (mgr?.role === 'PROCUREMENT') isStaffProcurement = true;
        }
        if (userRole !== 'PROCUREMENT' && !isStaffProcurement) {
          return res.status(403).json({
            success: false,
            message: 'Dokumen ini dibuat oleh divisi Procurement dan hanya dapat dihapus oleh divisi Procurement atau Superadmin.',
          });
        }
      } else if (creatorRole === 'PROYEK_ADMIN') {
        if (userRole !== 'PROYEK_ADMIN') {
          return res.status(403).json({
            success: false,
            message: 'Dokumen ini dibuat oleh divisi Proyek Admin dan hanya dapat dihapus oleh divisi Proyek Admin atau Superadmin.',
          });
        }
      } else if (creatorRole === 'GA' || creatorRole === 'STAFF_GA') {
        if (userRole !== 'GA' && userRole !== 'STAFF_GA') {
          return res.status(403).json({
            success: false,
            message: 'Dokumen ini dibuat oleh divisi GA dan hanya dapat dihapus oleh divisi GA atau Superadmin.',
          });
        }
      } else if (existing.createdById !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Anda hanya dapat menghapus dokumen yang Anda buat sendiri atau dari divisi Anda.',
        });
      }
    }

    await (prisma as any).companyFormDocument.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Formulir dokumen berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting company form:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus formulir dokumen',
      error: error.message,
    });
  }
};

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Berkas tidak ditemukan' });
    }
    const relativePath = req.file.path.replace(/\\/g, '/');
    const storageIdx = relativePath.indexOf('/storage/');
    const fileUrl = storageIdx !== -1 ? relativePath.substring(storageIdx) : `/storage/uploads/general/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Berkas lampiran berhasil diunggah',
      fileUrl,
      fileName: req.file.originalname,
    });
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengunggah lampiran',
      error: error.message,
    });
  }
};

