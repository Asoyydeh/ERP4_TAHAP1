import { z } from 'zod';
import { Role, AssetStatus } from '@prisma/client';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  passwordHash: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  passwordHash: z.string().min(6, 'Password minimal 6 karakter'), // Input field name will map to service passwordHash
});

export const categorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  description: z.string().optional(),
});

export const assetCreateSchema = z.object({
  name: z.string().min(2, 'Nama aset minimal 2 karakter'),
  skuCode: z.string().min(3, 'SKU Code minimal 3 karakter'),
  categoryId: z.string().uuid('ID Kategori tidak valid'),
  status: z.nativeEnum(AssetStatus).optional(),
  location: z.string().min(2, 'Lokasi minimal 2 karakter'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
  purchaseDate: z.string().datetime({ message: 'Format tanggal beli harus ISO Date String' }).transform((val) => new Date(val)),
});

export const assetUpdateSchema = z.object({
  name: z.string().min(2, 'Nama aset minimal 2 karakter').optional(),
  skuCode: z.string().min(3, 'SKU Code minimal 3 karakter').optional(),
  categoryId: z.string().uuid('ID Kategori tidak valid').optional(),
  status: z.nativeEnum(AssetStatus).optional(),
  location: z.string().min(2, 'Lokasi minimal 2 karakter').optional(),
  price: z.number().min(0, 'Harga tidak boleh negatif').optional(),
  purchaseDate: z.string().datetime({ message: 'Format tanggal beli harus ISO Date String' }).transform((val) => new Date(val)).optional(),
});
