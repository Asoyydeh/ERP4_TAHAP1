const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning Existing Projects & Documents ---');
  await prisma.document.deleteMany({});
  await prisma.projectJob.deleteMany({});
  await prisma.projectSubkon.deleteMany({});
  await prisma.project.deleteMany({});

  console.log('--- Fetching Seed Users ---');
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  const engineering = await prisma.user.findFirst({ where: { role: 'ENGINEERING' } });
  const proyekAdmin = await prisma.user.findFirst({ where: { role: 'PROYEK_ADMIN' } });
  const procurement = await prisma.user.findFirst({ where: { role: 'PROCUREMENT' } });
  const finance = await prisma.user.findFirst({ where: { role: 'FINANCE' } });

  const defaultUser = superadmin || engineering || (await prisma.user.findFirst());
  if (!defaultUser) {
    throw new Error('No users found in database to attach uploaded documents.');
  }

  const uEngineeringId = engineering?.id || defaultUser.id;
  const uProyekAdminId = proyekAdmin?.id || defaultUser.id;
  const uProcurementId = procurement?.id || defaultUser.id;
  const uFinanceId = finance?.id || defaultUser.id;

  console.log('--- Creating 3 Complete Dummy Projects ---');

  // Project 1
  const p1 = await prisma.project.create({
    data: {
      code: 'PRJ-2026-001',
      name: 'Proyek Renovasi Gedung Utama - Jakarta',
      description: 'Pekerjaan struktur, arsitektur, dan interior lantai 1-5 Gedung Utama Jakarta.',
      progress: 65,
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-08-30'),
      remarks: JSON.stringify({
        financeStatus: 'SELESAI',
        financeTermin: 'Termin 2',
        spkValue: 450000000,
        pph26: 9000000,
        grandTotal: 441000000,
        procurementModalBoq: 380000000,
        procurementPengeluaran: 290000000,
        subkon1Nama: 'PT Karya Mandiri Subkon',
        subkon1Nilai: 120000000,
      }),
      penawaranPicId: uEngineeringId,
      boqPicId: uProcurementId,
      rfqPicId: uProcurementId,
      spkPicId: uProyekAdminId,
      progressPicId: uProyekAdminId,
      invoicePicId: uFinanceId,
    }
  });

  // Project 2
  const p2 = await prisma.project.create({
    data: {
      code: 'PRJ-2026-002',
      name: 'Proyek Instalasi MEP Jembatan - Surabaya',
      description: 'Pemasangan sistem mekanikal, elektrikal, dan plumbing Jembatan Surabaya.',
      progress: 40,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-10-15'),
      remarks: JSON.stringify({
        financeStatus: 'ON_PROGRESS',
        financeTermin: 'Termin 1',
        spkValue: 820000000,
        pph26: 16400000,
        grandTotal: 803600000,
        procurementModalBoq: 700000000,
        procurementPengeluaran: 520000000,
        subkon1Nama: 'CV Sinar Subkon Utama',
        subkon1Nilai: 250000000,
      }),
      penawaranPicId: uEngineeringId,
      boqPicId: uProcurementId,
      rfqPicId: uProcurementId,
      spkPicId: uProyekAdminId,
      progressPicId: uProyekAdminId,
      invoicePicId: uFinanceId,
    }
  });

  // Project 3
  const p3 = await prisma.project.create({
    data: {
      code: 'PRJ-2026-003',
      name: 'Proyek Pembangunan Parkiran & Lanskap - Bandung',
      description: 'Konstruksi area parkir multi-lantai dan pekerjaan perkerasan lanskap Bandung.',
      progress: 85,
      startDate: new Date('2026-03-05'),
      endDate: new Date('2026-09-20'),
      remarks: JSON.stringify({
        financeStatus: 'SELESAI',
        financeTermin: 'Pelunasan',
        spkValue: 250000000,
        pph26: 5000000,
        grandTotal: 245000000,
        procurementModalBoq: 210000000,
        procurementPengeluaran: 195000000,
        subkon1Nama: 'PT Mitra Konstruksi Bandung',
        subkon1Nilai: 80000000,
      }),
      penawaranPicId: uEngineeringId,
      boqPicId: uProcurementId,
      rfqPicId: uProcurementId,
      spkPicId: uProyekAdminId,
      progressPicId: uProyekAdminId,
      invoicePicId: uFinanceId,
    }
  });

  console.log('--- Attaching Categorized Documents for All Roles ---');

  const projects = [p1, p2, p3];

  for (const proj of projects) {
    // 1. Proyek Admin Docs (A1, A2, A3, A4, B1, C2)
    await prisma.document.createMany({
      data: [
        {
          projectId: proj.id,
          fileName: `SPK_Klien_${proj.code}.pdf`,
          fileType: 'SPK',
          filePath: `/storage/uploads/seed/spk_${proj.code}.pdf`,
          fileSize: 1024500,
          uploadedById: uProyekAdminId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Penawaran_Final_${proj.code}.pdf`,
          fileType: 'PENAWARAN_FINAL',
          filePath: `/storage/uploads/seed/penawaran_final_${proj.code}.pdf`,
          fileSize: 2048100,
          uploadedById: uProyekAdminId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Drawing_AsBuilt_${proj.code}.pdf`,
          fileType: 'DRAWING_AS_BUILT',
          filePath: `/storage/uploads/seed/asbuilt_${proj.code}.pdf`,
          fileSize: 3145728,
          uploadedById: uProyekAdminId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Invoice_Klien_${proj.code}.pdf`,
          fileType: 'INVOICE',
          filePath: `/storage/uploads/seed/invoice_${proj.code}.pdf`,
          fileSize: 512000,
          uploadedById: uProyekAdminId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Subkon_Docs_${proj.code}.pdf`,
          fileType: 'SUBKON_DOCS',
          filePath: `/storage/uploads/seed/subkon_${proj.code}.pdf`,
          fileSize: 1536000,
          uploadedById: uProyekAdminId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Foto_Lapangan_${proj.code}.jpg`,
          fileType: 'FOTO',
          filePath: `/storage/uploads/seed/foto_${proj.code}.jpg`,
          fileSize: 840000,
          uploadedById: uProyekAdminId,
          status: 'APPROVED',
        },
      ]
    });

    // 2. Engineering Docs (C1, C3, C4, C5, C6, B2)
    await prisma.document.createMany({
      data: [
        {
          projectId: proj.id,
          fileName: `Drawing_Struktur_${proj.code}.dwg`,
          fileType: 'DRAWING',
          filePath: `/storage/uploads/seed/drawing_${proj.code}.dwg`,
          fileSize: 4194304,
          uploadedById: uEngineeringId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `RAB_Estimasi_${proj.code}.xlsx`,
          fileType: 'RAB',
          filePath: `/storage/uploads/seed/rab_${proj.code}.xlsx`,
          fileSize: 720000,
          uploadedById: uEngineeringId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Penawaran_Draft_${proj.code}.xlsx`,
          fileType: 'PENAWARAN_DRAFT',
          filePath: `/storage/uploads/seed/penawaran_draft_${proj.code}.xlsx`,
          fileSize: 650000,
          uploadedById: uEngineeringId,
          status: 'DRAFT',
        },
        {
          projectId: proj.id,
          fileName: `BOQ_Cost_Material_${proj.code}.xlsx`,
          fileType: 'BOQ',
          filePath: `/storage/uploads/seed/boq_${proj.code}.xlsx`,
          fileSize: 980000,
          uploadedById: uEngineeringId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `Forecast_Cost_${proj.code}.xlsx`,
          fileType: 'FORECAST_COST',
          filePath: `/storage/uploads/seed/forecast_${proj.code}.xlsx`,
          fileSize: 1100000,
          uploadedById: uEngineeringId,
          status: 'APPROVED',
        },
        {
          projectId: proj.id,
          fileName: `RFQ_Scan_Kosong_${proj.code}.pdf`,
          fileType: 'RFQ_SCAN_KOSONG',
          filePath: `/storage/uploads/seed/rfq_kosong_${proj.code}.pdf`,
          fileSize: 450000,
          uploadedById: uEngineeringId,
          status: 'APPROVED',
        },
      ]
    });
  }

  console.log('✅ Successfully seeded 3 dummy projects with complete categorized documents for all user roles!');
}

main()
  .catch((e) => {
    console.error('Error seeding dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
