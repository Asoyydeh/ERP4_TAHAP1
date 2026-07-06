import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserPayload } from '../services/AuthService';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'SuperSecretJWTKey123!@#';

/**
 * Middleware untuk memvalidasi token JWT
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token otorisasi diperlukan'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Token tidak valid atau kedaluwarsa'));
  }
}

/**
 * Middleware untuk membatasi akses berdasarkan Role-Based Access Control (RBAC)
 */
export function authorize(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Autentikasi diperlukan'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Anda tidak memiliki hak akses untuk fungsi ini'));
    }

    next();
  };
}
