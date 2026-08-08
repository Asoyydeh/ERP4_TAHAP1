import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';

export class MonitoringController {
  /**
   * Mendapatkan seluruh catatan riwayat audit log (Monitoring & Audit Trail)
   */
  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan statistik ringkas sistem
   */
  static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const documentCount = await prisma.document.count();
      const projectCount = await prisma.project.count();
      const userCount = await prisma.user.count();

      const boqAgg = await prisma.boqHeader.aggregate({
        _sum: { totalAmount: true },
      });
      const penawaranAgg = await prisma.penawaranHeader.aggregate({
        _sum: { totalOffer: true },
      });

      res.status(200).json({
        success: true,
        data: {
          documentCount,
          projectCount,
          userCount,
          totalBoqAmount: boqAgg._sum.totalAmount || 0,
          totalPenawaranAmount: penawaranAgg._sum.totalOffer || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
