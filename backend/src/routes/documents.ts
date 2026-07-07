import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List dan download bisa diakses oleh semua staff/admin terautentikasi
router.get('/', DocumentController.getAll);
router.get('/download/:id', DocumentController.download);

// Hapus berkas (Proteksi owner/Superadmin divalidasi di controller)
router.delete('/:id', DocumentController.delete);

// Upload berkas proyek (Hanya ENGINEERING dan SUPERADMIN)
router.post(
  '/upload/:fileType',
  authorize([Role.ENGINEERING, Role.PROCUREMENT, Role.SUPERADMIN]),
  upload.single('file'),
  DocumentController.upload
);

// Detail data terurai dari parsing Excel
router.get('/boq/:docId', DocumentController.getBoqDetails);
router.get('/penawaran/:docId', DocumentController.getPenawaranDetails);
router.get('/rfq/:docId', DocumentController.getRfqDetails);

// Edit harga satuan BOQ (Hanya PROCUREMENT dan SUPERADMIN)
router.put(
  '/boq/items/:itemId',
  authorize([Role.PROCUREMENT, Role.SUPERADMIN]),
  DocumentController.updateBoqItemRate
);

// Ubah status dokumen (Hanya Procurement, Finance, dan Superadmin)
router.put(
  '/:id/status',
  authorize([Role.PROCUREMENT, Role.FINANCE, Role.SUPERADMIN]),
  DocumentController.updateStatus
);

export default router;
