import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { logAction } from '../utils/auditLogger';
import { NotFoundError } from '../utils/errors';

export class ProjectController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const project = await prisma.project.create({
        data: { name, description },
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'CREATE_PROJECT',
        tableName: 'projects',
        recordId: project.id,
        description: `Proyek '${name}' berhasil didaftarkan`,
        newValues: project,
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

      const project = await prisma.project.update({
        where: { id },
        data: { name, description },
      });

      await logAction({
        userId: req.user?.id,
        actionType: 'UPDATE_PROJECT',
        tableName: 'projects',
        recordId: project.id,
        description: `Proyek '${name}' berhasil diperbarui`,
        oldValues: existing,
        newValues: project,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Proyek tidak ditemukan');

      await prisma.project.delete({ where: { id } });

      await logAction({
        userId: req.user?.id,
        actionType: 'DELETE_PROJECT',
        tableName: 'projects',
        recordId: id,
        description: `Proyek '${existing.name}' berhasil dihapus`,
        oldValues: existing,
        ipAddress: req.ip,
      });

      res.status(200).json({ success: true, message: 'Proyek berhasil dihapus' });
    } catch (error) {
      next(error);
    }
  }
}
