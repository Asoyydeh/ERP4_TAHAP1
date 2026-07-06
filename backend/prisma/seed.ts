import { PrismaClient, Role, AssetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding database...');

  // 1. Bersihkan database terlebih dahulu
  await prisma.assetLog.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Buat Pengguna Default (Admin & Staff)
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const staffPasswordHash = await bcrypt.hash('staff123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrator Utama',
      email: 'admin@asset.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Staf Inventori',
      email: 'staff@asset.com',
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
    },
  });

  console.log('👤 Users created successfully!');

  // 3. Buat Kategori Aset
  const hardware = await prisma.category.create({
    data: { name: 'Hardware', description: 'Perangkat keras fisik komputer dan jaringan' },
  });

  const software = await prisma.category.create({
    data: { name: 'Software', description: 'Lisensi software dan langganan cloud SaaS' },
  });

  const furniture = await prisma.category.create({
    data: { name: 'Furniture', description: 'Meja, kursi, lemari, dan kebutuhan interior kantor' },
  });

  console.log('🏷️  Categories created successfully!');

  // 4. Buat Aset Contoh
  const asset1 = await prisma.asset.create({
    data: {
      skuCode: 'HW-MACBOOK-001',
      name: 'MacBook Pro M3 Max 16 inch',
      categoryId: hardware.id,
      status: AssetStatus.IN_USE,
      location: 'R. Developer Lantai 2',
      price: 45000000,
      purchaseDate: new Date('2026-01-15T00:00:00.000Z'),
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      skuCode: 'HW-THINKPAD-002',
      name: 'Lenovo ThinkPad T14 Gen 4',
      categoryId: hardware.id,
      status: AssetStatus.AVAILABLE,
      location: 'Gudang IT Lantai 3',
      price: 18500000,
      purchaseDate: new Date('2026-03-10T00:00:00.000Z'),
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      skuCode: 'SW-OFFICE365-001',
      name: 'Lisensi Microsoft Office 365 E5 50-Seat',
      categoryId: software.id,
      status: AssetStatus.IN_USE,
      location: 'Cloud / Server Utama',
      price: 12000000,
      purchaseDate: new Date('2026-02-01T00:00:00.000Z'),
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      skuCode: 'FN-CHAIR-045',
      name: 'Kursi Ergonomis Jaring Hitam',
      categoryId: furniture.id,
      status: AssetStatus.MAINTENANCE,
      location: 'Ruang Meeting A',
      price: 2500000,
      purchaseDate: new Date('2025-11-20T00:00:00.000Z'),
    },
  });

  console.log('📦 Assets created successfully!');

  // 5. Buat Logs Aktivitas Awal
  await prisma.assetLog.createMany({
    data: [
      {
        assetId: asset1.id,
        userId: admin.id,
        actionType: 'CREATE',
        notes: 'Aset pertama kali didaftarkan dengan status IN_USE',
        timestamp: new Date('2026-01-15T09:00:00.000Z'),
      },
      {
        assetId: asset2.id,
        userId: admin.id,
        actionType: 'CREATE',
        notes: 'Aset pertama kali didaftarkan dengan status AVAILABLE',
        timestamp: new Date('2026-03-10T10:00:00.000Z'),
      },
      {
        assetId: asset3.id,
        userId: admin.id,
        actionType: 'CREATE',
        notes: 'Aset pertama kali didaftarkan dengan status IN_USE',
        timestamp: new Date('2026-02-01T08:30:00.000Z'),
      },
      {
        assetId: asset4.id,
        userId: admin.id,
        actionType: 'CREATE',
        notes: 'Aset pertama kali didaftarkan',
        timestamp: new Date('2025-11-20T14:00:00.000Z'),
      },
      {
        assetId: asset4.id,
        userId: staff.id,
        actionType: 'STATUS_CHANGE',
        notes: 'Status diubah dari AVAILABLE menjadi MAINTENANCE karena roda kursi patah',
        timestamp: new Date('2026-05-12T11:15:00.000Z'),
      },
    ],
  });

  console.log('📝 Initial log activities created!');
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
