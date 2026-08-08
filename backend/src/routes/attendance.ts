import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../middlewares/upload';

const attendanceRouter = Router();

// Endpoint untuk Karyawan
attendanceRouter.post('/check-in', authenticate, upload.single('file'), AttendanceController.checkIn);
attendanceRouter.post('/check-out', authenticate, AttendanceController.checkOut);
attendanceRouter.get('/my-attendance', authenticate, AttendanceController.getMyAttendance);

// Endpoint untuk Super Admin & HRD
attendanceRouter.get('/all', authenticate, authorize([Role.SUPERADMIN, Role.HRD]), AttendanceController.getAllAttendance);

export default attendanceRouter;
