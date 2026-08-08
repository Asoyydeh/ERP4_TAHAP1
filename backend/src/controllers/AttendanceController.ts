import { Response, NextFunction } from 'express';
import { AttendanceService } from '../services/AttendanceService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class AttendanceController {
  static async checkIn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, notes, lat, lng } = req.body;
      const photoUrl = req.file ? `/storage/uploads/users/${req.user!.id}/misc/${req.file.filename}` : undefined;
      const result = await AttendanceService.checkIn(req.user!, status, notes, photoUrl, lat ? parseFloat(lat) : undefined, lng ? parseFloat(lng) : undefined);
      res.status(200).json({ success: true, message: 'Check-in berhasil', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { lat, lng } = req.body;
      const result = await AttendanceService.checkOut(req.user!, lat, lng);
      res.status(200).json({ success: true, message: 'Check-out berhasil', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getMyAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.getMyAttendance(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAllAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AttendanceService.getAllAttendance();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
