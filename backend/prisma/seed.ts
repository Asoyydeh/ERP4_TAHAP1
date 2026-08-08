import { PrismaClient, Role, DocType, DocStatus } from '@prisma/client';
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
    { name: 'Budi (Engineering)', email: 'engineering@project.com', passwordHash: engPassword, role: Role.ENGINEERING },
    { name: 'Siti (Proyek Admin)', email: 'proyekadmin@project.com', passwordHash: adminProyPassword, role: Role.PROYEK_ADMIN },
    { name: 'Agus (Procurement)', email: 'procurement@project.com', passwordHash: procPassword, role: Role.PROCUREMENT },
    { name: 'Dewi (Finance)', email: 'finance@project.com', passwordHash: finPassword, role: Role.FINANCE },
    { name: 'Rudi (Monitoring)', email: 'adminmon@project.com', passwordHash: monPassword, role: Role.ADMIN_MONITORING },
    { name: 'Super Administrator', email: 'superadmin@project.com', passwordHash: superPassword, role: Role.SUPERADMIN },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
      },
    });
    createdUsers[u.role] = user;
    
    // Buat Folder Fisik Representasi di DB untuk masing-masing user
    await prisma.userFolder.create({
      data: {
        userId: user.id,
        folderPath: `storage/uploads/users/${user.id}`,
      },
    });
  }

  console.log('👤 6 Users created successfully!');

  // 3. Buat Proyek Contoh
  const proj1 = await prisma.project.create({
    data: {
      name: 'Pembangunan Pusat Data Nasional',
      code: 'PDN-2026',
      description: 'Proyek strategis pembangunan pusat data nasional berskala tinggi.',
      progress: 45,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'Renovasi Infrastruktur Kantor IT',
      code: 'IT-RENOV',
      description: 'Proyek renovasi dan modernisasi infrastruktur jaringan dan ruang kerja.',
      progress: 80,
    },
  });

  console.log('🏗️  Projects created successfully!');

  // Helper untuk create document
  const createDoc = async (
    fileName: string, 
    fileType: DocType, 
    projectId: string, 
    uploaderId: string, 
    status: DocStatus = 'APPROVED',
    subFolderName: string | null = null
  ) => {
    return prisma.document.create({
      data: {
        fileName,
        filePath: `storage/dummy/${fileName}`,
        fileSize: Math.floor(Math.random() * 5000000) + 100000, // random 100kb to 5mb
        fileType,
        status,
        projectId,
        uploadedById: uploaderId,
        subFolderName,
      }
    });
  };

  const engId = createdUsers[Role.ENGINEERING].id;
  const proAdminId = createdUsers[Role.PROYEK_ADMIN].id;
  const procId = createdUsers[Role.PROCUREMENT].id;
  const finId = createdUsers[Role.FINANCE].id;

  // 4. Seeding Data untuk Klien (SPK, Penawaran Final, Drawing As-Build, Invoice)
  await createDoc('SPK_Klien_PDN.pdf', 'SPK', proj1.id, proAdminId, 'APPROVED');
  const pf = await createDoc('Penawaran_Final_PDN.pdf', 'PENAWARAN_FINAL', proj1.id, proAdminId, 'APPROVED');
  await createDoc('Drawing_AsBuilt_A.dwg', 'DRAWING_AS_BUILT', proj1.id, engId, 'APPROVED');
  await createDoc('Invoice_DP_PDN.pdf', 'INVOICE', proj1.id, finId, 'APPROVED');

  await createDoc('SPK_Klien_IT.pdf', 'SPK', proj2.id, proAdminId, 'APPROVED');
  await createDoc('Invoice_Termin1_IT.pdf', 'INVOICE', proj2.id, finId, 'APPROVED');

  // 5. Seeding Data untuk Subkon
  // RFQ
  const rfq1 = await createDoc('RFQ_Server_Kosong.pdf', 'RFQ_SCAN_KOSONG', proj1.id, engId, 'APPROVED');
  const rfq2 = await createDoc('RFQ_Kabel_Kosong.pdf', 'RFQ_SCAN_KOSONG', proj1.id, engId, 'APPROVED');

  // Subkon 1 - 5
  await createDoc('SPK_Subkon1_Cisco.pdf', 'SUBKON_DOCS', proj1.id, engId, 'PO_RELEASED', 'Subkon 1 (Cisco)');
  await createDoc('Invoice_Subkon1.pdf', 'SUBKON_DOCS', proj1.id, proAdminId, 'PENDING', 'Subkon 1 (Cisco)');

  await createDoc('SPK_Subkon2_HP.pdf', 'SUBKON_DOCS', proj1.id, engId, 'PO_PENDING', 'Subkon 2 (HP)');
  
  await createDoc('SPK_Subkon3_Dell.pdf', 'SUBKON_DOCS', proj1.id, engId, 'PO_PENDING', 'Subkon 3 (Dell)');
  await createDoc('SPK_Subkon4_Schneider.pdf', 'SUBKON_DOCS', proj1.id, engId, 'PO_RELEASED', 'Subkon 4 (Schneider)');
  await createDoc('SPK_Subkon5_Daikin.pdf', 'SUBKON_DOCS', proj1.id, engId, 'PO_PENDING', 'Subkon 5 (Daikin)');

  // 6. Seeding Data untuk Internal
  await createDoc('Draft_Drawing_Arsitektur.pdf', 'DRAWING', proj1.id, engId, 'PENDING');
  await createDoc('Draft_Drawing_MEP.pdf', 'DRAWING', proj1.id, engId, 'APPROVED');
  
  await createDoc('Foto_Progress_Minggu1.jpg', 'FOTO', proj1.id, proAdminId, 'APPROVED');
  await createDoc('Foto_Progress_Minggu2.jpg', 'FOTO', proj1.id, proAdminId, 'APPROVED');

  await createDoc('RAB_Internal_PDN.xlsx', 'RAB', proj1.id, engId, 'REVISED_BY_PROCUREMENT');
  await createDoc('Forecast_Budget_Q3.xlsx', 'FORECAST_COST', proj1.id, engId, 'APPROVED');
  
  const pd = await createDoc('Draft_Penawaran_V1.xlsx', 'PENAWARAN_DRAFT', proj1.id, engId, 'APPROVED');
  
  const boq1 = await createDoc('BOQ_Material_Server.xlsx', 'BOQ', proj1.id, procId, 'APPROVED');
  const boq2 = await createDoc('BOQ_Material_Cabling.xlsx', 'BOQ', proj2.id, procId, 'APPROVED');

  // Add dummy data for BOQ
  await prisma.boqHeader.create({
    data: {
      documentId: boq1.id,
      totalAmount: 15000000,
      items: {
        create: [
          { description: 'Server Blade', quantity: 2, unit: 'Unit', rateEngineering: 5000000, rateProcurement: 4500000, totalPrice: 9000000 },
          { description: 'Storage 10TB', quantity: 1, unit: 'Unit', rateEngineering: 6000000, rateProcurement: 6000000, totalPrice: 6000000 },
        ]
      }
    }
  });

  await prisma.boqHeader.create({
    data: {
      documentId: boq2.id,
      totalAmount: 5000000,
      items: {
        create: [
          { description: 'Cat6 Cable', quantity: 10, unit: 'Roll', rateEngineering: 500000, rateProcurement: 500000, totalPrice: 5000000 },
        ]
      }
    }
  });

  // Add dummy data for Penawaran Draft
  await prisma.penawaranHeader.create({
    data: {
      documentId: pd.id,
      vendorName: 'PT Vendor Dummy',
      totalOffer: 25000000,
      items: {
        create: [
          { itemNo: 1, description: 'Jasa Instalasi', quantity: 1, unit: 'Lot', unitPrice: 25000000, totalPrice: 25000000 },
        ]
      }
    }
  });

  // Add dummy data for Penawaran Final
  await prisma.penawaranHeader.create({
    data: {
      documentId: pf.id,
      vendorName: 'PT Vendor Dummy Final',
      totalOffer: 24000000,
      items: {
        create: [
          { itemNo: 1, description: 'Jasa Instalasi Final', quantity: 1, unit: 'Lot', unitPrice: 24000000, totalPrice: 24000000 },
        ]
      }
    }
  });

  // Add dummy data for RFQ
  await prisma.rfqHeader.create({
    data: {
      documentId: rfq1.id,
      rfqNumber: 'RFQ/001/2026',
      items: {
        create: [
          { itemNo: 1, description: 'Server Blade Type A', quantity: 2, unit: 'Unit' },
        ]
      }
    }
  });

  await prisma.rfqHeader.create({
    data: {
      documentId: rfq2.id,
      rfqNumber: 'RFQ/002/2026',
      items: {
        create: [
          { itemNo: 1, description: 'Kabel UTP Cat6', quantity: 50, unit: 'Box' },
        ]
      }
    }
  });

  console.log('📄 Documents created successfully!');
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
