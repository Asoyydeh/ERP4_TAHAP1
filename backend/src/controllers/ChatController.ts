import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import { Role } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import fs from 'fs';
import path from 'path';

export class ChatController {
  /**
   * Mendapatkan daftar kontak chat dikelompokkan berdasarkan Role & Staf
   */
  static async getContacts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;

      // Ambil seluruh user
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          photoUrl: true,
          managerId: true,
          manager: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Hitung unread count per sender
      const unreadCounts = await prisma.chatMessage.groupBy({
        by: ['senderId'],
        where: {
          receiverId: currentUserId,
          isRead: false,
        },
        _count: { id: true }
      });

      const unreadMap = new Map<string, number>();
      unreadCounts.forEach((u) => unreadMap.set(u.senderId, u._count.id));

      // Map users dengan info unread
      const contacts = users
        .filter((u) => u.id !== currentUserId)
        .map((u) => ({
          ...u,
          unreadCount: unreadMap.get(u.id) || 0,
        }));

      res.status(200).json({ success: true, data: contacts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan riwayat percakapan dengan User tertentu atau Role tertentu
   */
  static async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const currentUserRole = req.user!.role;
      const { userBId, targetRole } = req.query;

      let whereClause: any = {};

      if (userBId) {
        // 1-on-1 chat
        whereClause = {
          OR: [
            { senderId: currentUserId, receiverId: userBId as string },
            { senderId: userBId as string, receiverId: currentUserId }
          ]
        };
      } else if (targetRole) {
        // Role-wide group chat
        whereClause = {
          targetRole: targetRole as Role
        };
      } else {
        throw new BadRequestError('Harap tentukan userBId atau targetRole');
      }

      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        include: {
          sender: { select: { id: true, name: true, role: true, photoUrl: true } },
          receiver: { select: { id: true, name: true, role: true, photoUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });

      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengirim pesan obrolan baru (1-on-1 atau grup role)
   */
  static async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const senderId = req.user!.id;
      const { receiverId, targetRole, message, attachmentUrl } = req.body;

      if (!message || message.trim() === '') {
        throw new BadRequestError('Pesan tidak boleh kosong');
      }

      if (!receiverId && !targetRole) {
        throw new BadRequestError('Tujuan pesan (receiverId atau targetRole) wajib diisi');
      }

      const newMessage = await prisma.chatMessage.create({
        data: {
          senderId,
          receiverId: receiverId || null,
          targetRole: targetRole ? (targetRole as Role) : null,
          message: message.trim(),
          attachmentUrl: attachmentUrl || null,
        },
        include: {
          sender: { select: { id: true, name: true, role: true, photoUrl: true } },
          receiver: { select: { id: true, name: true, role: true, photoUrl: true } },
        }
      });

      res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Menandai pesan sebagai telah dibaca
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const { senderId } = req.body;

      if (!senderId) throw new BadRequestError('senderId wajib diisi');

      await prisma.chatMessage.updateMany({
        where: {
          senderId,
          receiverId: currentUserId,
          isRead: false,
        },
        data: { isRead: true }
      });

      res.status(200).json({ success: true, message: 'Pesan berhasil ditandai telah dibaca' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mendapatkan total unread chat count untuk user saat ini
   */
  static async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUserId = req.user!.id;
      const count = await prisma.chatMessage.count({
        where: {
          receiverId: currentUserId,
          isRead: false,
        }
      });

      res.status(200).json({ success: true, count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unggah berkas berkas langsung untuk pesan chat
   */
  static async uploadFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new BadRequestError('Tidak ada berkas yang diunggah');

      const filename = path.basename(req.file.path);
      const originalName = req.file.originalname;
      const size = req.file.size;

      // Base URL untuk download berkas chat
      const fileUrl = `/api/chat/attachment/${encodeURIComponent(filename)}?name=${encodeURIComponent(originalName)}`;

      res.status(200).json({
        success: true,
        data: {
          fileUrl,
          fileName: originalName,
          fileSize: size,
          storedName: filename,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mengunduh berkas lampiran chat
   */
  static async downloadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { filename } = req.params;
      const originalName = (req.query.name as string) || filename;

      // Cari file di direktori storage/uploads atau uploads
      let foundPath = findFileRecursive(path.join(process.cwd(), 'storage/uploads'), filename);
      if (!foundPath) {
        foundPath = findFileRecursive(path.join(process.cwd(), 'uploads'), filename);
      }

      if (!foundPath || !fs.existsSync(foundPath)) {
        throw new NotFoundError('Berkas lampiran fisik tidak ditemukan di server');
      }

      res.download(foundPath, originalName);
    } catch (error) {
      next(error);
    }
  }
}

function findFileRecursive(dir: string, targetFile: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const res = findFileRecursive(fullPath, targetFile);
      if (res) return res;
    } else if (f === targetFile) {
      return fullPath;
    }
  }
  return null;
}
