import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserPayload } from '../services/AuthService';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || 'SuperSecretJWTKey123!@#';

import prisma from '../config/db';

/**
 * Middleware untuk memvalidasi token JWT
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return next(new UnauthorizedError('Token otorisasi diperlukan'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    
    // Inherit PROYEK_ADMIN role if their manager is PROYEK_ADMIN and user is not SUPERADMIN
    if (decoded.managerId && decoded.role !== Role.SUPERADMIN) {
      const userWithManager = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { manager: true }
      });
      if (userWithManager?.manager?.role) {
        decoded.role = userWithManager.manager.role as Role;
      }
    }

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
