import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import path from 'path';

/**
 * Middleware penanganan error global Express
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  if (err.name === 'MulterError' && err.message === 'File too large') { res.status(413).json({ success: false, message: 'Ukuran berkas terlalu besar (Maks 50MB)' }); return; }
  if (err.name === 'MulterError') { res.status(400).json({ success: false, message: 'Gagal mengunggah berkas: ' + err.message }); return; }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError' && (err as any).code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'Data dengan Kode / Singkatan tersebut sudah terdaftar di sistem.',
    });
    return;
  }

  // Handling error Prisma Client (Koneksi, Tabel Hilang, Autentikasi DB)
  if (err.name?.includes('Prisma')) {
    const code = (err as any).code;
    let msg = err.message;
    if (code === 'P1000') {
      msg = 'Gagal autentikasi PostgreSQL (User/Password di backend/.env salah).';
    } else if (code === 'P1001') {
      msg = 'Server PostgreSQL (Port 5432) tidak aktif. Pastikan Service PostgreSQL Running.';
    } else if (code === 'P2021' || msg.includes('does not exist')) {
      msg = 'Tabel database belum dibuat. Silakan jalankan SETUP_DATABASE_OFFLINE.bat.';
    }

    res.status(500).json({
      success: false,
      message: `[Database Error ${code || ''}] ${msg}`,
    });
    return;
  }

  // Fallback ke 500 Internal Server Error untuk error yang tidak terdokumentasi
  try {
    const logPath = path.join(process.cwd(), 'last_error.txt');
    require('fs').writeFileSync(logPath, err.stack || err.message);
  } catch (e) {
    // ignore write file error
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server',
  });
}
