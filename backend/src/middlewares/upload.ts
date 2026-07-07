import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest } from './auth';

const storage = multer.diskStorage({
  destination: (req: AuthenticatedRequest, file, cb) => {
    const userId = req.user?.id;
    if (!userId) {
      return cb(new Error('User tidak terautentikasi'), '');
    }

    // Ambil fileType dari route parameters, ubah ke lowercase
    const fileType = (req.params.fileType || 'misc').toLowerCase();
    
    // Path: storage/uploads/users/{userId}/{fileType}
    const uploadPath = path.join(
      process.cwd(),
      'storage/uploads/users',
      userId,
      fileType
    );

    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Simpan dengan nama unik menggunakan timestamp untuk mencegah bentrok nama file
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // Maksimal 15MB
  },
});
