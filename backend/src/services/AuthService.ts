import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'SuperSecretJWTKey123!@#';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  managerId: string | null;
}

export class AuthService {
  /**
   * Mendaftar user baru (hanya Admin yang bisa mendaftarkan user baru jika diwajibkan RBAC,
   * namun kita buat fungsionalitas register umum dlu untuk inisiasi Admin pertama)
   */
  static async register(data: { name: string; email: string; passwordHash: string; role?: Role }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email sudah terdaftar');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: passwordHash,
        role: data.role || Role.ENGINEERING,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Autentikasi Login User
   */
  static async login(email: string, passwordHash: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: cleanEmail,
          mode: 'insensitive'
        }
      },
      include: { manager: true }
    });

    if (!user) {
      throw new UnauthorizedError('Email atau password salah');
    }

    const isMatch = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Email atau password salah');
    }

    const payload: UserPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerId: user.managerId,
        address: user.address,
        photoUrl: user.photoUrl,
        manager: user.manager ? { id: user.manager.id, role: user.manager.role } : null
      },
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        address: true,
        photoUrl: true,
        createdAt: true,
        manager: {
          select: {
            id: true,
            role: true,
          }
        }
      },
    });
    if (!user) {
      throw new UnauthorizedError('User tidak ditemukan');
    }
    return user;
  }

  static async updateProfile(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        photoUrl: true,
      },
    });
  }

  /**
   * Menampilkan semua user (Untuk Admin memantau Staff)
   */
  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        address: true,
        photoUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async updateUserByAdmin(id: string, data: { name?: string; email?: string; role?: Role; password?: string }) {
    try {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.role) updateData.role = data.role as any;
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(data.password, salt);
      }
      return await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (err: any) {
      console.warn('Prisma update exception, executing raw SQL fallback for user role:', err?.message);
      if (data.role) {
        await prisma.$executeRawUnsafe(`UPDATE users SET role = $1::"Role", updated_at = NOW() WHERE id = $2`, String(data.role), id);
      }
      if (data.name) {
        await prisma.$executeRawUnsafe(`UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`, data.name, id);
      }
      if (data.email) {
        await prisma.$executeRawUnsafe(`UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`, data.email, id);
      }
      if (data.password) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(data.password, salt);
        await prisma.$executeRawUnsafe(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, hash, id);
      }
      return prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    }
  }

  static async deleteUserByAdmin(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
