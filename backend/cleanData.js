const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function clean() {
  await prisma.document.deleteMany({});
  await prisma.project.deleteMany({});
  console.log('Semua data Proyek dan Dokumen berhasil dihapus dari database.');
  
  const uploadDir = path.join(__dirname, 'storage', 'uploads', 'users');
  if (fs.existsSync(uploadDir)) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    console.log('Direktori upload fisik berhasil dihapus.');
  }
}

clean().catch(e => console.error(e)).finally(() => prisma.$disconnect());
