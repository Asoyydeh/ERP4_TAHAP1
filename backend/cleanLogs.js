const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanLogs() {
  await prisma.auditLog.deleteMany({});
  console.log('Semua log aktivitas (notifikasi) berhasil dihapus dari database.');
}

cleanLogs().catch(e => console.error(e)).finally(() => prisma.$disconnect());
