import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { registerSchema, loginSchema } from '../utils/schemas';
import rateLimit from 'express-rate-limit';
import { Role } from '@prisma/client';

const authRouter = Router();

// Rate limiter khusus endpoint login untuk mencegah brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 percobaan
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register', validateBody(registerSchema), AuthController.register);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), AuthController.login);
authRouter.get('/me', authenticate, AuthController.me);
authRouter.get('/users', authenticate, authorize([Role.ADMIN]), AuthController.getAllUsers);

export default authRouter;
