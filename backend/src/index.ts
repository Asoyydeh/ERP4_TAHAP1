import dotenv from 'dotenv';
// Load environment variables dari file .env di awal aplikasi
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Proteksi Kerentanan HTTP Headers menggunakan Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));

// 2. Konfigurasi Cross-Origin Resource Sharing (CORS)
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const isProd = process.env.NODE_ENV === 'production';
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: isProd ? Number(process.env.RATE_LIMIT_MAX || 1000) : 1000000, // Pembatasan wajar di produksi
  message: {
    success: false,
    message: 'Terlalu banyak request dari IP Anda, silakan coba lagi nanti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads dengan header perizinan iframe
app.use('/storage', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  next();
}, express.static(path.join(process.cwd(), 'storage')));

// Serve static files for signatures
const rootSignaturesDir = path.resolve(process.cwd(), '..', 'TandaTanganDokumen');
const signaturesDir = path.resolve(process.cwd(), '..', 'TandaTanganDokumen', 'TandaTangan');
const proyekAdminSignaturesDir = path.resolve(process.cwd(), '..', 'TandaTanganDokumen', 'Proyekadmin');

app.use('/signatures-assets', express.static(rootSignaturesDir));
app.use('/signatures-assets', express.static(signaturesDir));
app.use('/proyekadmin-signatures-assets', express.static(proyekAdminSignaturesDir));

// 5. Mount API Routes
app.use('/api', apiRouter);

// Endpoint Tes Koneksi
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend server is running smoothly',
    timestamp: new Date(),
  });
});

// 6. Penanganan Route 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API Endpoint tidak ditemukan',
  });
});

// 7. Global Error Handler Middleware
app.use(errorHandler);

// Jalankan Server (Listen di 0.0.0.0 agar bisa diakses dari LAN kantor)
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Server berjalan di http://0.0.0.0:${PORT}`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});
