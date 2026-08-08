import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Diperbolehkan untuk semua role agar notifikasi dapat ditampilkan di dashboard semua role
router.get('/audit-logs', MonitoringController.getAuditLogs);
router.get('/stats', MonitoringController.getDashboardStats);

export default router;
