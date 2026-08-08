import { Response, NextFunction } from 'express';
import { WorkReportService } from '../services/WorkReportService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class WorkReportController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, description } = req.body;
      const attachmentUrl = req.file ? `/storage/uploads/users/${req.user!.id}/work_reports/${req.file.filename}` : undefined;
      const result = await WorkReportService.create(req.user!.id, title, description, attachmentUrl);
      res.status(201).json({ success: true, message: 'Laporan kerja berhasil dikirim', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMyReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await WorkReportService.getMyReports(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAllReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await WorkReportService.getAllReports();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
