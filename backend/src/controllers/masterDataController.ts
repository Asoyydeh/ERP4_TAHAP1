import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { logAction } from '../utils/auditLogger';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors';

export class MasterDataController {
  
  // --- MASTER COMPANY ---
  
  static async getCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const companies = await prisma.masterCompany.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: companies });
    } catch (error) {
      next(error);
    }
  }

  static async createCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { code, name } = req.body;
      if (!code || !name) throw new BadRequestError('Kode dan Nama Perusahaan wajib diisi');

      const formattedCode = code.trim().toUpperCase();
      const formattedName = name.trim();

      const existingCode = await prisma.masterCompany.findUnique({ where: { code: formattedCode } });
      if (existingCode) throw new ConflictError(`Kode / Singkatan '${formattedCode}' sudah terdaftar.`);

      const company = await prisma.masterCompany.create({
        data: { code: formattedCode, name: formattedName }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'CREATE_MASTER_DATA',
        tableName: 'master_companies',
        recordId: company.id,
        description: `Menambahkan Perusahaan baru: ${name} (${code})`,
        newValues: company,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  }

  static async updateCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;
      const { code, name } = req.body;

      const existing = await prisma.masterCompany.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data Perusahaan tidak ditemukan');

      const company = await prisma.masterCompany.update({
        where: { id },
        data: { code, name }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'UPDATE_MASTER_DATA',
        tableName: 'master_companies',
        recordId: company.id,
        description: `Mengubah Perusahaan: ${name} (${code})`,
        oldValues: existing,
        newValues: company,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: company });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;

      const existing = await prisma.masterCompany.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data Perusahaan tidak ditemukan');

      await prisma.masterCompany.delete({ where: { id } });

      await logAction({
        userId: req.user?.id,
        actionType: 'DELETE_MASTER_DATA',
        tableName: 'master_companies',
        recordId: id,
        description: `Menghapus Perusahaan: ${existing.name}`,
        oldValues: existing,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Data Perusahaan berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  // --- MASTER CLIENT ---

  static async getClients(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const clients = await prisma.masterClient.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }

  static async createClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { code, name } = req.body;
      if (!code || !name) throw new BadRequestError('Kode dan Nama Client wajib diisi');

      const formattedCode = code.trim().toUpperCase();
      const formattedName = name.trim();

      const existingCode = await prisma.masterClient.findUnique({ where: { code: formattedCode } });
      if (existingCode) throw new ConflictError(`Kode / Singkatan '${formattedCode}' sudah terdaftar.`);

      const client = await prisma.masterClient.create({
        data: { code: formattedCode, name: formattedName }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'CREATE_MASTER_DATA',
        tableName: 'master_clients',
        recordId: client.id,
        description: `Menambahkan PT Client baru: ${name} (${code})`,
        newValues: client,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;
      const { code, name } = req.body;

      const existing = await prisma.masterClient.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data PT Client tidak ditemukan');

      const client = await prisma.masterClient.update({
        where: { id },
        data: { code, name }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'UPDATE_MASTER_DATA',
        tableName: 'master_clients',
        recordId: client.id,
        description: `Mengubah PT Client: ${name} (${code})`,
        oldValues: existing,
        newValues: client,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClient(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;

      const existing = await prisma.masterClient.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data PT Client tidak ditemukan');

      await prisma.masterClient.delete({ where: { id } });

      await logAction({
        userId: req.user?.id,
        actionType: 'DELETE_MASTER_DATA',
        tableName: 'master_clients',
        recordId: id,
        description: `Menghapus PT Client: ${existing.name}`,
        oldValues: existing,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Data PT Client berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  // --- MASTER SUBKON ---

  static async getSubkons(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const subkons = await prisma.masterSubkon.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: subkons });
    } catch (error) {
      next(error);
    }
  }

  static async createSubkon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { code, name } = req.body;
      if (!code || !name) throw new BadRequestError('Kode dan Nama Subkon wajib diisi');

      const formattedCode = code.trim().toUpperCase();
      const formattedName = name.trim();

      const existingCode = await prisma.masterSubkon.findUnique({ where: { code: formattedCode } });
      if (existingCode) throw new ConflictError(`Kode / Singkatan '${formattedCode}' sudah terdaftar.`);

      const subkon = await prisma.masterSubkon.create({
        data: { code: formattedCode, name: formattedName }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'CREATE_MASTER_DATA',
        tableName: 'master_subkons',
        recordId: subkon.id,
        description: `Menambahkan Subkon baru: ${name} (${code})`,
        newValues: subkon,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: subkon });
    } catch (error) {
      next(error);
    }
  }

  static async updateSubkon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;
      const { code, name } = req.body;

      const existing = await prisma.masterSubkon.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data Subkon tidak ditemukan');

      const subkon = await prisma.masterSubkon.update({
        where: { id },
        data: { code, name }
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'UPDATE_MASTER_DATA',
        tableName: 'master_subkons',
        recordId: subkon.id,
        description: `Mengubah Subkon: ${name} (${code})`,
        oldValues: existing,
        newValues: subkon,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: subkon });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubkon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;

      const existing = await prisma.masterSubkon.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data Subkon tidak ditemukan');

      await prisma.masterSubkon.delete({ where: { id } });

      await logAction({
        userId: req.user?.id,
        actionType: 'DELETE_MASTER_DATA',
        tableName: 'master_subkons',
        recordId: id,
        description: `Menghapus Subkon: ${existing.name}`,
        oldValues: existing,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Data Subkon berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }

  // --- MASTER NUMBERING (PENOMORAN KODE PROYEK) ---

  static async getNumberings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const numberings = await (prisma as any).masterNumbering.findMany({
        orderBy: { code: 'asc' },
      });
      res.status(200).json({ success: true, data: numberings });
    } catch (error) {
      next(error);
    }
  }

  static async createNumbering(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { code, name } = req.body;
      if (!code || !name) throw new BadRequestError('Kode/Nomor dan Format Penomoran wajib diisi');

      const formattedCode = code.trim().toUpperCase();
      const formattedName = name.trim();

      const existingCode = await (prisma as any).masterNumbering.findUnique({ where: { code: formattedCode } });
      if (existingCode) throw new ConflictError(`Nomor / Kode '${formattedCode}' sudah terdaftar.`);

      const numbering = await (prisma as any).masterNumbering.create({
        data: { code: formattedCode, name: formattedName }
      });

      // Auto-update any existing projects that match this number code or sequence
      try {
        const numSeq = parseInt(formattedCode, 10);
        const whereConditions: any[] = [
          { code: { startsWith: `${formattedCode} -` } },
          { code: { startsWith: `${formattedCode} ` } },
          { code: formattedCode }
        ];
        if (!isNaN(numSeq)) {
          whereConditions.push({ sequence: numSeq });
        }

        const matchingProjects = await prisma.project.findMany({
          where: { OR: whereConditions }
        });

        for (const proj of matchingProjects) {
          await prisma.project.update({
            where: { id: proj.id },
            data: { code: formattedName }
          });
        }
      } catch (err) {
        console.error('Error auto-updating matching project codes:', err);
      }

      await logAction({
        userId: req.user?.id,
        actionType: 'CREATE_MASTER_DATA',
        tableName: 'master_numberings',
        recordId: numbering.id,
        description: `Menambahkan Penomoran Proyek baru: ${name} (${code})`,
        newValues: numbering,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: numbering });
    } catch (error) {
      next(error);
    }
  }

  static async updateNumbering(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;
      const { code, name } = req.body;

      const existing = await (prisma as any).masterNumbering.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data Penomoran tidak ditemukan');

      const formattedCode = code.trim().toUpperCase();
      const formattedName = name.trim();

      const numbering = await (prisma as any).masterNumbering.update({
        where: { id },
        data: { code: formattedCode, name: formattedName }
      });

      // Auto-update matching projects when master numbering format is updated
      try {
        const numSeq = parseInt(formattedCode, 10);
        const oldSeq = parseInt(existing.code, 10);
        const whereConditions: any[] = [
          { code: { startsWith: `${formattedCode} -` } },
          { code: { startsWith: `${existing.code} -` } },
          { code: formattedCode },
          { code: existing.code },
          { code: existing.name }
        ];
        if (!isNaN(numSeq)) whereConditions.push({ sequence: numSeq });
        if (!isNaN(oldSeq)) whereConditions.push({ sequence: oldSeq });

        const matchingProjects = await prisma.project.findMany({
          where: { OR: whereConditions }
        });

        for (const proj of matchingProjects) {
          await prisma.project.update({
            where: { id: proj.id },
            data: { code: formattedName }
          });
        }
      } catch (err) {
        console.error('Error auto-updating matching project codes:', err);
      }

      await logAction({
        userId: req.user?.id,
        actionType: 'UPDATE_MASTER_DATA',
        tableName: 'master_numberings',
        recordId: numbering.id,
        description: `Mengubah Penomoran Proyek: ${name} (${code})`,
        oldValues: existing,
        newValues: numbering,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: numbering });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNumbering(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== 'SUPERADMIN') throw new ForbiddenError('Akses ditolak');
      const { id } = req.params;

      const existing = await (prisma as any).masterNumbering.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Data Penomoran tidak ditemukan');

      await (prisma as any).masterNumbering.delete({ where: { id } });

      await logAction({
        userId: req.user?.id,
        actionType: 'DELETE_MASTER_DATA',
        tableName: 'master_numberings',
        recordId: id,
        description: `Menghapus Penomoran Proyek: ${existing.name}`,
        oldValues: existing,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Data Penomoran berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }
}
