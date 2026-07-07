import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Semua pengguna terautentikasi dapat melihat proyek
router.get('/', ProjectController.getAll);

// Hanya Superadmin yang dapat melakukan penulisan (Tambah, Edit, Hapus) proyek
router.post('/', authorize([Role.SUPERADMIN]), ProjectController.create);
router.put('/:id', authorize([Role.SUPERADMIN]), ProjectController.update);
router.delete('/:id', authorize([Role.SUPERADMIN]), ProjectController.delete);

export default router;
