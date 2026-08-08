import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authenticate, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List dan download bisa diakses oleh semua staff/admin terautentikasi
router.get('/', DocumentController.getAll);
router.get(
  '/download-all',
  authorize([
    Role.SUPERADMIN,
    Role.ADMIN_MONITORING,
    Role.ENGINEERING,
    Role.PROYEK_ADMIN,
    Role.PROCUREMENT,
    Role.FINANCE,
    Role.HRD,
    Role.GA,
    Role.STAFF_GA,
  ]),
  DocumentController.downloadAll
);
router.get('/download/:id', DocumentController.download);
router.get('/view/:id', DocumentController.view);

// Hapus berkas (Proteksi owner/Superadmin divalidasi di controller)
router.delete('/:id', DocumentController.delete);

// Upload berkas proyek untuk semua peran terotorisasi
router.post(
  '/upload/:fileType',
  authorize([
    Role.SUPERADMIN,
    Role.ADMIN_MONITORING,
    Role.ENGINEERING,
    Role.PROYEK_ADMIN,
    Role.PROCUREMENT,
    Role.FINANCE,
    Role.HRD,
    Role.GA,
    Role.STAFF_GA,
  ]),
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

// Ubah status dokumen
router.put(
  '/:id/status',
  authorize([Role.PROCUREMENT, Role.FINANCE, Role.SUPERADMIN]),
  DocumentController.updateStatus
);

export default router;
