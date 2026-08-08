import prisma from '../config/db';

export class WorkReportService {
  static async create(userId: string, title: string, description: string, attachmentUrl?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.workReport.create({
      data: {
        userId,
        date: today,
        title,
        description,
        attachmentUrl
      }
    });
  }

  static async getMyReports(userId: string) {
    return prisma.workReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getAllReports() {
    return prisma.workReport.findMany({
      include: {
        user: {
          select: { name: true, role: true, email: true, photoUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
