import prisma from '../config/db';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { AssetStatus, Prisma } from '@prisma/client';
import { sendAssetStatusNotification, sendAssetCreationNotification, sendToSpreadsheet } from '../utils/notification';

export interface AssetFilter {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
}

export class AssetService {
  static async getAllAssets(filters: AssetFilter = {}) {
    const where: Prisma.AssetWhereInput = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { skuCode: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.asset.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getAssetById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        logs: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundError('Aset tidak ditemukan');
    }

    return asset;
  }

  static async createAsset(
    data: {
      skuCode: string;
      name: string;
      categoryId: string;
      status?: AssetStatus;
      location: string;
      price: number;
      purchaseDate: Date;
    },
    userId: string,
    userName: string
  ) {
    // Validasi SKU unik
    const existing = await prisma.asset.findUnique({
      where: { skuCode: data.skuCode },
    });
    if (existing) {
      throw new ConflictError('Kode SKU sudah terdaftar');
    }

    // Validasi kategori ada
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!categoryExists) {
      throw new BadRequestError('Kategori tidak valid');
    }

    // Transaksi pembuatan aset dan log
    const asset = await prisma.$transaction(async (tx) => {
      const createdAsset = await tx.asset.create({
        data: {
          name: data.name,
          skuCode: data.skuCode,
          categoryId: data.categoryId,
          status: data.status || AssetStatus.AVAILABLE,
          location: data.location,
          price: data.price,
          purchaseDate: data.purchaseDate,
        },
      });

      await tx.assetLog.create({
        data: {
          assetId: createdAsset.id,
          userId: userId,
          actionType: 'CREATE',
          notes: `Aset didaftarkan pertama kali di lokasi: ${data.location}`,
        },
      });

      return createdAsset;
    });

    // Memicu notifikasi secara asinkron di luar transaksi utama
    sendAssetCreationNotification(
      asset.name,
      asset.skuCode,
      asset.status,
      asset.location,
      asset.price,
      userName
    ).catch((err) => console.error('Failed to send asset creation notification:', err));

    sendToSpreadsheet(
      'CREATE',
      asset.name,
      asset.skuCode,
      asset.status,
      asset.location,
      asset.price,
      userName
    ).catch((err) => console.error('Failed to sync creation to spreadsheet:', err));

    return asset;
  }

  static async updateAsset(
    id: string,
    data: {
      name?: string;
      skuCode?: string;
      categoryId?: string;
      status?: AssetStatus;
      location?: string;
      price?: number;
      purchaseDate?: Date;
    },
    userId: string,
    userName: string
  ) {
    const currentAsset = await this.getAssetById(id);

    if (data.skuCode && data.skuCode !== currentAsset.skuCode) {
      const existing = await prisma.asset.findUnique({
        where: { skuCode: data.skuCode },
      });
      if (existing) {
        throw new ConflictError('Kode SKU sudah digunakan');
      }
    }

    if (data.categoryId && data.categoryId !== currentAsset.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!categoryExists) {
        throw new BadRequestError('Kategori tidak valid');
      }
    }

    const isStatusChanged = data.status && data.status !== currentAsset.status;
    const oldStatus = currentAsset.status;

    return prisma.$transaction(async (tx) => {
      const updatedAsset = await tx.asset.update({
        where: { id },
        data: {
          name: data.name,
          skuCode: data.skuCode,
          categoryId: data.categoryId,
          status: data.status,
          location: data.location,
          price: data.price,
          purchaseDate: data.purchaseDate,
        },
      });

      let notes = 'Detail aset diperbarui';
      if (isStatusChanged) {
        notes = `Status diubah dari ${oldStatus} menjadi ${data.status}`;
      }

      await tx.assetLog.create({
        data: {
          assetId: id,
          userId: userId,
          actionType: isStatusChanged ? 'STATUS_CHANGE' : 'UPDATE',
          notes,
        },
      });

      // Memicu notifikasi secara asinkron di luar transaksi utama
      if (isStatusChanged && data.status) {
        sendAssetStatusNotification(
          updatedAsset.name,
          updatedAsset.skuCode,
          oldStatus,
          data.status,
          userName
        ).catch((err) => console.error('Failed to send status change notification:', err));
      }

      sendToSpreadsheet(
        isStatusChanged ? 'STATUS_CHANGE' : 'UPDATE',
        updatedAsset.name,
        updatedAsset.skuCode,
        updatedAsset.status,
        updatedAsset.location,
        updatedAsset.price,
        userName
      ).catch((err) => console.error('Failed to sync update to spreadsheet:', err));

      return updatedAsset;
    });
  }

  static async deleteAsset(id: string, userId: string) {
    await this.getAssetById(id);

    // Langsung hapus aset (log terhapus otomatis secara cascade)
    return prisma.asset.delete({
      where: { id },
    });
  }

  static async getDashboardMetrics() {
    const totalAssets = await prisma.asset.count();
    
    const assetsByStatus = await prisma.asset.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const totalValueResult = await prisma.asset.aggregate({
      _sum: {
        price: true,
      },
    });

    const recentLogs = await prisma.assetLog.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        asset: {
          select: {
            name: true,
            skuCode: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const categoryDistribution = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: { assets: true },
        },
      },
    });

    // Format status counts
    const statusCounts = {
      AVAILABLE: 0,
      IN_USE: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    };

    assetsByStatus.forEach((item) => {
      if (item.status in statusCounts) {
        statusCounts[item.status as keyof typeof statusCounts] = item._count.id;
      }
    });

    return {
      totalAssets,
      totalValue: totalValueResult._sum.price || 0,
      statusCounts,
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c.name,
        count: c._count.assets,
      })),
      recentLogs,
    };
  }

  static async getAllLogs() {
    return prisma.assetLog.findMany({
      include: {
        asset: {
          select: {
            name: true,
            skuCode: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}
