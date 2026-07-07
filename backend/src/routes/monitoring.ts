import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Batasi hanya Admin Monitoring dan Superadmin yang dapat mengakses data monitoring
router.use(authorize([Role.ADMIN_MONITORING, Role.SUPERADMIN]));

router.get('/audit-logs', MonitoringController.getAuditLogs);
router.get('/stats', MonitoringController.getDashboardStats);

export default router;
