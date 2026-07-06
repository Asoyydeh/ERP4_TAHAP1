import dotenv from 'dotenv';
// Load environment variables dari file .env di awal aplikasi
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRouter from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Proteksi Kerentanan HTTP Headers menggunakan Helmet
app.use(helmet());

// 2. Konfigurasi Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: '*', // Bisa diperketat ke domain client di produksi
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Global Rate Limiter untuk mencegah brute-force/DDoS sederhana
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200, // Maksimal 200 request per IP per 15 menit
  message: {
    success: false,
    message: 'Terlahu banyak request dari IP Anda, silakan coba lagi nanti.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Jalankan Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});
