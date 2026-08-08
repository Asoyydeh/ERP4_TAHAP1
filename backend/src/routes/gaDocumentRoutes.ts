import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import {
  getGaSignatures,
  createGaForm,
  getGaForms,
  updateGaForm,
  deleteGaForm,
  uploadGaAttachment,
} from '../controllers/gaDocumentController';

const router = Router();

router.use(authenticate);

// Endpoint Tanda Tangan HRGA
router.get('/signatures', getGaSignatures);

// Endpoint Upload Lampiran File GA (Excel, PDF, Foto)
router.post('/upload-attachment', upload.single('attachment'), uploadGaAttachment);

// Endpoint CRUD GA Form Documents
router.get('/forms', getGaForms);
router.post('/forms', createGaForm);
router.put('/forms/:id', updateGaForm);
router.delete('/forms/:id', deleteGaForm);

export default router;

