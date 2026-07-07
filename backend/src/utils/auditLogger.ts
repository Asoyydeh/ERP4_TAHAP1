import prisma from '../config/db';

export async function logAction(data: {
  userId?: string;
  actionType: string;
  tableName: string;
  recordId: string;
  description: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        actionType: data.actionType,
        tableName: data.tableName,
        recordId: data.recordId,
        description: data.description,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Gagal menulis audit log:', error);
  }
}
