import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal memiliki 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  passwordHash: z.string().min(6, 'Password minimal memiliki 6 karakter'),
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  passwordHash: z.string().min(1, 'Password wajib diisi'),
});
