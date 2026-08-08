import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Pastikan direktori uploads dasar ada
const baseUploadDir = path.join(process.cwd(), 'storage/uploads');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Konfigurasi Penyimpanan Disk Multer secara Dinamis dan Aman
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    try {
      const user = (req as any).user;
      const fileType = req.params.fileType || req.body.fileType || 'general';
      const projectId = req.params.projectId || req.body.projectId;

      let targetFolder = path.join(baseUploadDir, 'general');

      if (user?.id) {
        const cleanUserId = String(user.id).replace(/[^a-zA-Z0-9_-]/g, '_');
        if (fileType === 'profile') {
          targetFolder = path.join(baseUploadDir, 'users', cleanUserId, 'profile');
        } else if (projectId) {
          const cleanProjId = String(projectId).replace(/[^a-zA-Z0-9_-]/g, '_');
          targetFolder = path.join(baseUploadDir, 'users', cleanUserId, 'projects', cleanProjId, fileType);
        } else {
          targetFolder = path.join(baseUploadDir, 'users', cleanUserId, fileType);
        }
      }

      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      cb(null, targetFolder);
    } catch (error: any) {
      console.error('Multer storage destination error:', error);
      const fallbackDir = path.join(baseUploadDir, 'general');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      cb(null, fallbackDir);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname || '.bin');
      const baseName = path.basename(file.originalname || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      cb(null, `${baseName || 'file'}-${uniqueSuffix}${ext}`);
    } catch (err) {
      cb(null, `upload-${Date.now()}${path.extname(file.originalname || '.bin')}`);
    }
  },
});

// Filter jenis file yang diizinkan (menerima semua jenis berkas)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

// Inisialisasi Middleware Multer dengan batas ukuran 100MB
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});
