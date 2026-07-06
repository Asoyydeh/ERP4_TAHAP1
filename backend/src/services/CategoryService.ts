import prisma from '../config/db';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';

export class CategoryService {
  static async getAllCategories() {
    return prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  static async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundError('Kategori tidak ditemukan');
    }
    return category;
  }

  static async createCategory(data: { name: string; description?: string }) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ConflictError('Kategori dengan nama ini sudah terdaftar');
    }

    return prisma.category.create({
      data,
    });
  }

  static async updateCategory(id: string, data: { name?: string; description?: string }) {
    await this.getCategoryById(id);

    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictError('Nama kategori sudah digunakan');
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id: string) {
    await this.getCategoryById(id);

    // Cek apakah ada aset dalam kategori ini
    const assetCount = await prisma.asset.count({
      where: { categoryId: id },
    });

    if (assetCount > 0) {
      throw new BadRequestError('Kategori tidak bisa dihapus karena masih memiliki aset terhubung');
    }

    return prisma.category.delete({
      where: { id },
    });
  }
}
