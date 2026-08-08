import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Semua pengguna terautentikasi dapat melihat proyek
router.get('/', ProjectController.getAll);
router.get('/data-txt', ProjectController.getDataTxtLines);

// Hanya Superadmin yang dapat membuat proyek baru
router.post('/', authorize([Role.SUPERADMIN]), ProjectController.create);
router.put('/:id', authorize([Role.SUPERADMIN, Role.PROYEK_ADMIN, Role.ENGINEERING, Role.ADMIN_MONITORING, Role.FINANCE, Role.PROCUREMENT]), ProjectController.update);
router.delete('/:id', authorize([Role.SUPERADMIN]), ProjectController.delete);

export default router;
