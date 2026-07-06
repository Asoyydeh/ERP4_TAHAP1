import { Response, NextFunction } from 'express';
import { AssetService } from '../services/AssetService';
import { ReportService } from '../services/ReportService';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AssetStatus } from '@prisma/client';

export class AssetController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        status: req.query.status as AssetStatus,
      };

      const assets = await AssetService.getAllAssets(filters);
      res.status(200).json({
        success: true,
        data: assets,
      });
    } catch (error) {
      next(error);
    }
  }

  static async get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const asset = await AssetService.getAssetById(req.params.id);
      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const userName = req.user?.name || 'System';
      const asset = await AssetService.createAsset(req.body, userId, userName);
      res.status(201).json({
        success: true,
        message: 'Aset berhasil didaftarkan',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      const userName = req.user?.name || 'System';
      const asset = await AssetService.updateAsset(req.params.id, req.body, userId, userName);
      res.status(200).json({
        success: true,
        message: 'Aset berhasil diperbarui',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || '';
      await AssetService.deleteAsset(req.params.id, userId);
      res.status(200).json({
        success: true,
        message: 'Aset berhasil dihapus beserta seluruh log terkait',
      });
    } catch (error) {
      next(error);
    }
  }

  static async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await AssetService.getDashboardMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await AssetService.getAllLogs();
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportPdf(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await ReportService.generateAssetPDFReport();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="laporan-aset.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}
