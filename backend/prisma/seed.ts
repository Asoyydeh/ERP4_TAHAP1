import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding project document database...');

  // 1. Bersihkan database terlebih dahulu
  await prisma.auditLog.deleteMany({});
  await prisma.boqItem.deleteMany({});
  await prisma.boqHeader.deleteMany({});
  await prisma.penawaranItem.deleteMany({});
  await prisma.penawaranHeader.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rfqHeader.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.userFolder.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Buat Pengguna Default untuk masing-masing Role
  const salt = await bcrypt.genSalt(10);
  const engPassword = await bcrypt.hash('eng123', salt);
  const adminProyPassword = await bcrypt.hash('proyek123', salt);
  const procPassword = await bcrypt.hash('proc123', salt);
  const finPassword = await bcrypt.hash('fin123', salt);
  const monPassword = await bcrypt.hash('mon123', salt);
  const superPassword = await bcrypt.hash('super123', salt);

  const usersData = [
    { name: 'Staf Engineering', email: 'engineering@project.com', passwordHash: engPassword, role: Role.ENGINEERING },
    { name: 'Staf Proyek Admin', email: 'proyekadmin@project.com', passwordHash: adminProyPassword, role: Role.PROYEK_ADMIN },
    { name: 'Staf Procurement', email: 'procurement@project.com', passwordHash: procPassword, role: Role.PROCUREMENT },
    { name: 'Staf Finance', email: 'finance@project.com', passwordHash: finPassword, role: Role.FINANCE },
    { name: 'Admin Monitoring', email: 'adminmon@project.com', passwordHash: monPassword, role: Role.ADMIN_MONITORING },
    { name: 'Super Administrator', email: 'superadmin@project.com', passwordHash: superPassword, role: Role.SUPERADMIN },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
      },
    });
    createdUsers.push(user);
    
    // Buat Folder Fisik Representasi di DB untuk masing-masing user
    await prisma.userFolder.create({
      data: {
        userId: user.id,
        folderPath: `storage/uploads/users/${user.id}`,
      },
    });
  }

  console.log('👤 6 Users and folders created successfully!');

  // 3. Buat Proyek Contoh
  await prisma.project.create({
    data: {
      name: 'Pembangunan Pusat Data Nasional',
      description: 'Proyek strategis pembangunan pusat data nasional berskala tinggi.',
    },
  });

  await prisma.project.create({
    data: {
      name: 'Renovasi Infrastruktur Kantor IT',
      description: 'Proyek renovasi dan modernisasi infrastruktur jaringan dan ruang kerja.',
    },
  });

  console.log('🏗️  Projects created successfully!');
  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
