import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateBody } from '../middlewares/validation';
import { registerSchema, loginSchema } from '../utils/schemas';
import { upload } from '../middlewares/upload';
import rateLimit from 'express-rate-limit';
import { Role } from '@prisma/client';

const authRouter = Router();

// Rate limiter khusus endpoint login untuk mencegah brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: process.env.NODE_ENV === 'production' ? 10 : 1000, // Maksimal 10 percobaan di prod, 1000 di dev
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
authRouter.put('/profile', authenticate, (req, res, next) => { req.params.fileType = 'profile'; next(); }, upload.single('photo'), AuthController.updateProfile);
authRouter.get('/users', authenticate, AuthController.getAllUsers);
authRouter.put('/users/:id', authenticate, authorize([Role.SUPERADMIN]), AuthController.updateUser);
authRouter.delete('/users/:id', authenticate, authorize([Role.SUPERADMIN]), AuthController.deleteUser);

export default authRouter;
