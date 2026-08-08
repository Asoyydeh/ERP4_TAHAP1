import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import {
  getSignatures,
  getProyekAdminSignatures,
  createCompanyForm,
  getCompanyForms,
  getCompanyFormById,
  updateCompanyForm,
  deleteCompanyForm,
  uploadAttachment,
} from '../controllers/companyDocumentController';

const router = Router();

router.use(authenticate);

// Endpoint Tanda Tangan
router.get('/signatures', getSignatures);
router.get('/proyek-signatures', getProyekAdminSignatures);

// Safe Multer Upload Middleware Handler
const safeUploadAttachment = (req: any, res: any, next: any) => {
  upload.single('attachment')(req, res, (err: any) => {
    if (err) {
      if (err.message === 'Request aborted' || err.code === 'ECONNABORTED') {
        return res.status(400).json({ success: false, message: 'Pengunggahan dibatalkan oleh klien.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Gagal mengunggah berkas' });
    }
    next();
  });
};

// Endpoint Upload Lampiran File (Excel + PDF)
router.post('/upload-attachment', safeUploadAttachment, uploadAttachment);

// Endpoint CRUD Company Form Documents
router.get('/forms', getCompanyForms);
router.get('/forms/:id', getCompanyFormById);
router.post('/forms', createCompanyForm);
router.put('/forms/:id', updateCompanyForm);
router.delete('/forms/:id', deleteCompanyForm);

export default router;
