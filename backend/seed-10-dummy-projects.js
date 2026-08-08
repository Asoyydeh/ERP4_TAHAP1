const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Step 2: Seeding 10 VARIED Dummy Projects & Subkons for ALL User Roles & Tables ---');

  // Clean existing project data
  await prisma.auditLog.deleteMany({});
  await prisma.workReport.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.boqItem.deleteMany({});
  await prisma.boqHeader.deleteMany({});
  await prisma.penawaranItem.deleteMany({});
  await prisma.penawaranHeader.deleteMany({});
  await prisma.rfqItem.deleteMany({});
  await prisma.rfqHeader.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.projectJob.deleteMany({});
  await prisma.projectSubkonTermin.deleteMany({});
  await prisma.projectSubkon.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.masterSubkon.deleteMany({});

  console.log('--- Seeding Master Subkons ---');
  const ms1 = await prisma.masterSubkon.create({ data: { code: 'MS-001', name: 'PT. Karya Subkon Mandiri' } });
  const ms2 = await prisma.masterSubkon.create({ data: { code: 'MS-002', name: 'CV. Sinar Teknik Subkon' } });
  const ms3 = await prisma.masterSubkon.create({ data: { code: 'MS-003', name: 'PT. Mitra Utama Konstruksi' } });
  const ms4 = await prisma.masterSubkon.create({ data: { code: 'MS-004', name: 'PT. Steelindo Utama' } });
  const ms5 = await prisma.masterSubkon.create({ data: { code: 'MS-005', name: 'CV. Medan Design Interior' } });
  const ms6 = await prisma.masterSubkon.create({ data: { code: 'MS-006', name: 'PT. Ready Mix Tangerang' } });
  const ms7 = await prisma.masterSubkon.create({ data: { code: 'MS-007', name: 'PT. Environment Care' } });
  const ms8 = await prisma.masterSubkon.create({ data: { code: 'MS-008', name: 'PT. Cikarang Subkon Mandiri' } });
  const ms9 = await prisma.masterSubkon.create({ data: { code: 'MS-009', name: 'CV. Indo Plafon Gypsum' } });
  const ms10 = await prisma.masterSubkon.create({ data: { code: 'MS-010', name: 'PT. Aspal Jaya Bandung' } });

  const masterSubkonList = [ms1, ms2, ms3, ms4, ms5, ms6, ms7, ms8, ms9, ms10];

  console.log('--- Fetching Role Users ---');
  const superadmin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  const engineering = await prisma.user.findFirst({ where: { role: 'ENGINEERING' } });
  const proyekAdmin = await prisma.user.findFirst({ where: { role: 'PROYEK_ADMIN' } });
  const procurement = await prisma.user.findFirst({ where: { role: 'PROCUREMENT' } });
  const finance = await prisma.user.findFirst({ where: { role: 'FINANCE' } });
  const hrd = await prisma.user.findFirst({ where: { role: 'HRD' } });
  const monitoring = await prisma.user.findFirst({ where: { role: 'ADMIN_MONITORING' } });

  const defaultUser = superadmin || engineering || (await prisma.user.findFirst());
  const uSuperAdminId = superadmin?.id || defaultUser.id;
  const uEngineeringId = engineering?.id || defaultUser.id;
  const uProyekAdminId = proyekAdmin?.id || defaultUser.id;
  const uProcurementId = procurement?.id || defaultUser.id;
  const uFinanceId = finance?.id || defaultUser.id;
  const uHrdId = hrd?.id || defaultUser.id;

  const projectsData = [
    {
      code: 'PRJ-2026-001 - MJK - PT. Sampoerna Harta',
      name: 'Proyek Construction Gedung Utama MJK',
      client: 'PT. Sampoerna Harta Konstruksi',
      reqBy: 'Ir. Budi Santoso (Klien Utama)',
      reqDate: '2026-07-01',
      prog: 85,
      city: 'Jakarta',
      statusPekerjaan: 'Pengerjaan Finishing',
      financeStatus: 'SELESAI',
      financeTermin: 'Termin 2 (40%)',
      statusPenagihan: 'Lunas',
      remarksPenagihan: 'Fisik 100% & BAST Valid',
      issue: 'Tidak Ada Kendala',
      nilKontrak: 450000000,
      nilKontrakStr: '450.000.000',
      pphStr: '9.000.000',
      grandTotalStr: '441.000.000',
      pengeluaran: 290000000,
      jobs: [
        {
          uraianPekerjaan: 'Pekerjaan Pondasi & Struktur Beton Lantai 1-5',
          rfqDate: '05-Jul',
          progress: 'Selesai',
          subkon1Nama: 'PT. Karya Subkon Mandiri',
          subkon1Status: 'Deal',
          subkon2Nama: 'CV. Sinar Teknik',
          subkon2Status: 'SPK',
          subkon3Nama: 'PT. Mitra Utama',
          subkon3Status: 'Nego',
          remarks: 'Berkas BAST & BAPP 100% Valid'
        },
        {
          uraianPekerjaan: 'Pemasangan Sistem Dinding & Partisi Gypsum',
          rfqDate: '12-Jul',
          progress: 'Mulai',
          subkon1Nama: 'PT. Karya Subkon Mandiri',
          subkon1Status: 'Deal',
          subkon2Nama: 'CV. Indo Plafon',
          subkon2Status: 'QUO',
          subkon3Nama: 'PT. Karya Steel',
          subkon3Status: 'Unsent',
          remarks: 'Progress Lapangan 60%'
        }
      ]
    },
    {
      code: 'PRJ-2026-002 - MJK - PT. Sinar Mas Jatim',
      name: 'Proyek Instalasi MEP Jembatan Layang',
      client: 'PT. Sinar Mas Jatim',
      reqBy: 'Hendra Wijaya, ST',
      reqDate: '2026-07-03',
      prog: 60,
      city: 'Surabaya',
      statusPekerjaan: 'Pemasangan Kabel & Panel',
      financeStatus: 'ON_PROGRESS',
      financeTermin: 'Termin 1 (50%)',
      statusPenagihan: 'Proses Cair',
      remarksPenagihan: 'Menunggu TTD Klien',
      issue: 'Verifikasi Rekening Bank',
      nilKontrak: 820000000,
      nilKontrakStr: '820.000.000',
      pphStr: '16.400.000',
      grandTotalStr: '803.600.000',
      pengeluaran: 520000000,
      jobs: [
        {
          uraianPekerjaan: 'Pemasangan Kabel Power & Tray Jembatan',
          rfqDate: '10-Jul',
          progress: 'Mulai',
          subkon1Nama: 'CV Sinar Subkon Utama',
          subkon1Status: 'QUO',
          subkon2Nama: 'PT Elektro Mandiri',
          subkon2Status: 'Nego',
          subkon3Nama: 'PT Karya Steel',
          subkon3Status: 'Unsent',
          remarks: 'Kabel Tray Terpasang Rapi'
        }
      ]
    },
    {
      code: 'PRJ-2026-003 - MJK - PT. Bandung Asri',
      name: 'Proyek Penataan Lanskap & Parkir',
      client: 'PT. Bandung Asri Land',
      reqBy: 'Dra. Maya Indah',
      reqDate: '2026-06-25',
      prog: 95,
      city: 'Bandung',
      statusPekerjaan: 'Uji Lab & Serah Terima',
      financeStatus: 'SELESAI',
      financeTermin: 'Pelunasan (100%)',
      statusPenagihan: 'Lunas',
      remarksPenagihan: 'Faktur Pajak Terbit',
      issue: 'Selesai Sesuai SPK',
      nilKontrak: 250000000,
      nilKontrakStr: '250.000.000',
      pphStr: '5.000.000',
      grandTotalStr: '245.000.000',
      pengeluaran: 195000000,
      jobs: [
        {
          uraianPekerjaan: 'Pengaspalan & Perkerasan Paving Block Parkir',
          rfqDate: '02-Jul',
          progress: 'Selesai',
          subkon1Nama: 'PT Mitra Konstruksi Bandung',
          subkon1Status: 'Deal',
          subkon2Nama: 'CV Paving Mandiri',
          subkon2Status: 'Deal',
          subkon3Nama: 'PT Aspal Jaya',
          subkon3Status: 'SPK',
          remarks: 'Hasil Uji Kepadatan Lab Pass'
        }
      ]
    },
    {
      code: 'PRJ-2026-004 - MJK - PT. Central Logistik',
      name: 'Proyek Pembangunan Warehousing Logistik',
      client: 'PT. Central Logistik Indonesia',
      reqBy: 'Bambang Haryo',
      reqDate: '2026-07-08',
      prog: 35,
      city: 'Semarang',
      statusPekerjaan: 'Ereksi Rangka Baja',
      financeStatus: 'DP 20%',
      financeTermin: 'DP (20%)',
      statusPenagihan: 'Proses Cair',
      remarksPenagihan: 'Pengajuan DP Lapangan',
      issue: 'Menunggu Pengiriman Material',
      nilKontrak: 600000000,
      nilKontrakStr: '600.000.000',
      pphStr: '12.000.000',
      grandTotalStr: '588.000.000',
      pengeluaran: 380000000,
      jobs: [
        {
          uraianPekerjaan: 'Fabrikasi & Ereksi Rangka Gudang Utama',
          rfqDate: '14-Jul',
          progress: 'Mulai',
          subkon1Nama: 'PT Steelindo Utama',
          subkon1Status: 'Nego',
          subkon2Nama: 'CV Konstruksi Logistik',
          subkon2Status: 'QUO',
          subkon3Nama: 'PT Rangka Mas',
          subkon3Status: 'Unsent',
          remarks: 'Material Baja WF Tiba Onsite'
        }
      ]
    },
    {
      code: 'PRJ-2026-005 - MJK - PT. Bank Sumatra',
      name: 'Proyek Renovasi Kantor Cabang Utama',
      client: 'PT. Bank Sumatra Utama',
      reqBy: 'Siti Rahmah, SE',
      reqDate: '2026-07-02',
      prog: 70,
      city: 'Medan',
      statusPekerjaan: 'Pemasangan Fit-Out Interior',
      financeStatus: 'ON_PROGRESS',
      financeTermin: 'Termin 1 (40%)',
      statusPenagihan: 'Lunas',
      remarksPenagihan: 'Kwitansi & Transfer Diterima',
      issue: 'Jadwal Kerja Malam',
      nilKontrak: 350000000,
      nilKontrakStr: '350.000.000',
      pphStr: '7.000.000',
      grandTotalStr: '343.000.000',
      pengeluaran: 220000000,
      jobs: [
        {
          uraianPekerjaan: 'Pekerjaan Interior Teller & Meeting Room',
          rfqDate: '08-Jul',
          progress: 'Selesai',
          subkon1Nama: 'CV Medan Design Interior',
          subkon1Status: 'Deal',
          subkon2Nama: 'PT Furniture Jaya',
          subkon2Status: 'SPK',
          subkon3Nama: 'CV Kaca Mandiri',
          subkon3Status: 'Deal',
          remarks: 'Serah Terima Phase 1 Selesai'
        }
      ]
    },
    {
      code: 'PRJ-2026-006 - MJK - PT. Tirta Sulsel',
      name: 'Proyek Konstruksi Pipa & Drainase Air',
      client: 'PT. Tirta Sulsel Perdana',
      reqBy: 'Andi Muhammad',
      reqDate: '2026-07-12',
      prog: 20,
      city: 'Makassar',
      statusPekerjaan: 'Galian Jalur Pipa',
      financeStatus: 'BELUM_DITAGIH',
      financeTermin: 'Belum saatnya penagihan',
      statusPenagihan: 'Draft Pengajuan',
      remarksPenagihan: 'Persiapan Berkas BAPP',
      issue: 'Cuaca Hujan Deras',
      nilKontrak: 500000000,
      nilKontrakStr: '500.000.000',
      pphStr: '10.000.000',
      grandTotalStr: '490.000.000',
      pengeluaran: 280000000,
      jobs: [
        {
          uraianPekerjaan: 'Galian & Pemasangan Pipa HDPE 500mm',
          rfqDate: '20-Jul',
          progress: 'Belum',
          subkon1Nama: 'PT Makassar Pipe Solution',
          subkon1Status: 'QUO',
          subkon2Nama: 'CV Sulsel Drainase',
          subkon2Status: 'Unsent',
          subkon3Nama: 'PT Tirta Mandiri',
          subkon3Status: 'Unsent',
          remarks: 'Izin Galian Dinas PU Selesai'
        }
      ]
    },
    {
      code: 'PRJ-2026-007 - MJK - PT. Adonia Footwear',
      name: 'Proyek Pemasangan Mezzanine Pabrik',
      client: 'PT. Adonia Footwear III',
      reqBy: 'Mr. Chen Wei',
      reqDate: '2026-06-28',
      prog: 90,
      city: 'Bekasi',
      statusPekerjaan: 'Uji Beban Mezzanine',
      financeStatus: 'SELESAI',
      financeTermin: 'Pelunasan (90%)',
      statusPenagihan: 'Lunas',
      remarksPenagihan: 'BAST Phase 2 Disetujui',
      issue: 'Lulus Uji Beban 10 Ton',
      nilKontrak: 400000000,
      nilKontrakStr: '400.000.000',
      pphStr: '8.000.000',
      grandTotalStr: '392.000.000',
      pengeluaran: 310000000,
      jobs: [
        {
          uraianPekerjaan: 'Konstruksi Mezzanine Produksi Gedung 2',
          rfqDate: '01-Jul',
          progress: 'Selesai',
          subkon1Nama: 'PT Bekasi Steelwork',
          subkon1Status: 'Deal',
          subkon2Nama: 'CV Mezzanine Jaya',
          subkon2Status: 'Deal',
          subkon3Nama: 'PT Industri Mandiri',
          subkon3Status: 'SPK',
          remarks: 'Uji Beban Struktur 10 Ton Pass'
        }
      ]
    },
    {
      code: 'PRJ-2026-008 - MJK - PT. Tangerang Concrete',
      name: 'Proyek Pembuatan Akses Jalan Concrete',
      client: 'PT. Tangerang Concrete Industry',
      reqBy: 'Rian Hermawan',
      reqDate: '2026-07-05',
      prog: 50,
      city: 'Tangerang',
      statusPekerjaan: 'Pengecoran Segment 2',
      financeStatus: 'ON_PROGRESS',
      financeTermin: 'Termin 2 (50%)',
      statusPenagihan: 'Proses Cair',
      remarksPenagihan: 'Review Tim Audit Internal',
      issue: 'Penyesuaian Elevasi Jalan',
      nilKontrak: 700000000,
      nilKontrakStr: '700.000.000',
      pphStr: '14.000.000',
      grandTotalStr: '686.000.000',
      pengeluaran: 430000000,
      jobs: [
        {
          uraianPekerjaan: 'Pengecoran Jalan Rigid Concrete K-350',
          rfqDate: '11-Jul',
          progress: 'Mulai',
          subkon1Nama: 'PT Ready Mix Tangerang',
          subkon1Status: 'Deal',
          subkon2Nama: 'CV Cor Mandiri',
          subkon2Status: 'SPK',
          subkon3Nama: 'PT Semen Jaya',
          subkon3Status: 'Nego',
          remarks: 'Segment 1 Pengecoran Selesai'
        }
      ]
    },
    {
      code: 'PRJ-2026-009 - MJK - PT. Karawang Eco',
      name: 'Proyek Canopy Domestic Waste & WWTP',
      client: 'PT. Karawang Eco Environment',
      reqBy: 'Dr. Ahmad Fauzi',
      reqDate: '2026-07-04',
      prog: 75,
      city: 'Karawang',
      statusPekerjaan: 'Komisioning WWTP',
      financeStatus: 'ON_PROGRESS',
      financeTermin: 'Termin 2 (70%)',
      statusPenagihan: 'Lunas',
      remarksPenagihan: 'Kwitansi Resmi Terbit',
      issue: 'Komisioning WWTP Berhasil',
      nilKontrak: 300000000,
      nilKontrakStr: '300.000.000',
      pphStr: '6.000.000',
      grandTotalStr: '294.000.000',
      pengeluaran: 190000000,
      jobs: [
        {
          uraianPekerjaan: 'Canopy Domestic Waste & WWTP Equipment',
          rfqDate: '06-Jul',
          progress: 'Selesai',
          subkon1Nama: 'PT Environment Care',
          subkon1Status: 'Deal',
          subkon2Nama: 'CV WWTP Specialist',
          subkon2Status: 'SPK',
          subkon3Nama: 'PT Canopy Mas',
          subkon3Status: 'Deal',
          remarks: 'Komisioning Pompa WWTP Lulus'
        }
      ]
    },
    {
      code: 'PRJ-2026-010 - MJK - PT. Cikarang Metalindo',
      name: 'Proyek Extension Workshop & Plafon',
      client: 'PT. Cikarang Metalindo',
      reqBy: 'Denny Kurniawan',
      reqDate: '2026-07-10',
      prog: 15,
      city: 'Cikarang',
      statusPekerjaan: 'Bongkar Rangka Lama',
      financeStatus: 'DP 10%',
      financeTermin: 'DP (10%)',
      statusPenagihan: 'Proses Cair',
      remarksPenagihan: 'Pencairan DP Vendor Subkon',
      issue: 'Menunggu Pembongkaran Rangka',
      nilKontrak: 280000000,
      nilKontrakStr: '280.000.000',
      pphStr: '5.600.000',
      grandTotalStr: '274.400.000',
      pengeluaran: 160000000,
      jobs: [
        {
          uraianPekerjaan: 'Partisi Workshop 4,5,6 & Plafon',
          rfqDate: '15-Jul',
          progress: 'Belum',
          subkon1Nama: 'PT Cikarang Subkon Mandiri',
          subkon1Status: 'QUO',
          subkon2Nama: 'CV Plafon Gypsum',
          subkon2Status: 'Unsent',
          subkon3Nama: 'PT Metalindo Utama',
          subkon3Status: 'Nego',
          remarks: 'Material Rangka Plafon Onsite'
        }
      ]
    }
  ];

  console.log('--- Seeding 10 VARIED Projects with Jobs, Formatted Remarks & Subkons ---');

  for (let i = 0; i < projectsData.length; i++) {
    const pData = projectsData[i];

    const remarksObj = {
      reqBy: pData.reqBy,
      reqDate: pData.reqDate,
      financePt: 'MJK',
      financeClient: pData.client,
      financeStatus: pData.financeStatus,
      financeTermin: pData.financeTermin,
      financeNilai: pData.nilKontrakStr,
      financePph: pData.pphStr,
      financeGrandTotal: pData.grandTotalStr,
      financeStatusPenagihan: pData.statusPenagihan,
      financePenagihanRemarks: pData.remarksPenagihan,
      financeIssue: pData.issue,
      financeRemark: `Catatan ${pData.name}`,
      procurementPt: 'MJK',
      procurementClient: pData.client,
      procurementModalBoq: pData.nilKontrak,
      procurementPengeluaran: pData.pengeluaran,
      progressManual: `${pData.prog}%`,
      flowManual: 'On Schedule',
      statusPekerjaan: pData.statusPekerjaan,
      nilaiKontrak: `Rp ${pData.nilKontrakStr}`,
      spk: `SPK-MJK-2026/00${i+1} (Ada)`,
      boq: `BOQ Final 2026 (Ada)`,
      shopDrawing: `Drawing V2 (Ada)`,
      asBuiltDrawing: `As Built Drawing (Ada)`,
      nilaiTerminDpp: `Rp ${Math.round(pData.nilKontrak * 0.4).toLocaleString('id-ID')}`,
      pembayaranPersen: `${pData.prog}%`,
      prosedurPenagihan: pData.financeTermin,
      proformaInvoice: `PI-2026-00${i+1} (Ada)`,
      invoice: `INV-2026-00${i+1} (Ada)`,
      fakturPajak: `FP-010.000-26 (Ada)`,
      baapBast: `BAST-00${i+1} (Ada)`,
      suratJalan: `SJ-2026-00${i+1} (Ada)`,
      fotoProgress: `Foto Progress Lapangan (Ada)`,
      laporanProgress: `Laporan Mingguan (Ada)`,
      tandaTerima: `TT-2026-00${i+1} (Ada)`,
      tanggalPenagihan: `2026-07-05`,
      tanggalDibayar: `2026-07-15`
    };

    const project = await prisma.project.create({
      data: {
        code: pData.code,
        name: pData.name,
        description: JSON.stringify({ reqBy: pData.reqBy, reqDate: pData.reqDate }),
        progress: pData.prog,
        startDate: new Date(2026, 0, 10 + i * 4),
        endDate: new Date(2026, 9, 15 + i * 3),
        remarks: JSON.stringify(remarksObj),
        penawaranPicId: uEngineeringId,
        penawaranDueDate: new Date(2026, 6, 15 + i),
        boqPicId: uProcurementId,
        boqDueDate: new Date(2026, 6, 20 + i),
        rfqPicId: uProcurementId,
        rfqDueDate: new Date(2026, 6, 22 + i),
        spkPicId: uProyekAdminId,
        spkDueDate: new Date(2026, 6, 25 + i),
        progressPicId: uProyekAdminId,
        progressDueDate: new Date(2026, 6, 28 + i),
        invoicePicId: uFinanceId,
        invoiceDueDate: new Date(2026, 7, 5 + i),
      }
    });

    // Seed ProjectJob records for RFQ Tracking Table
    for (const j of pData.jobs) {
      await prisma.projectJob.create({
        data: {
          projectId: project.id,
          uraianPekerjaan: j.uraianPekerjaan,
          rfqDate: j.rfqDate,
          progress: j.progress,
          subkon1Nama: j.subkon1Nama,
          subkon1Status: j.subkon1Status,
          subkon2Nama: j.subkon2Nama,
          subkon2Status: j.subkon2Status,
          subkon3Nama: j.subkon3Nama,
          subkon3Status: j.subkon3Status,
          remarks: j.remarks,
        }
      });
    }

    // Seed Categorized Documents (A1 - C6) & Track Document IDs
    const docMap = {};
    const docs = [
      { name: `01_SPK_Klien_${pData.code}.pdf`, type: 'SPK', user: uProyekAdminId },
      { name: `02_Penawaran_Final_${pData.code}.pdf`, type: 'PENAWARAN_FINAL', user: uProyekAdminId },
      { name: `03_Drawing_AsBuilt_${pData.code}.pdf`, type: 'DRAWING_AS_BUILT', user: uProyekAdminId },
      { name: `04_Invoice_${pData.code}.pdf`, type: 'INVOICE', user: uFinanceId },
      { name: `05_Subkon_Docs_${pData.code}.pdf`, type: 'SUBKON_DOCS', user: uProyekAdminId },
      { name: `06_RFQ_Scan_${pData.code}.pdf`, type: 'RFQ_SCAN_KOSONG', user: uEngineeringId },
      { name: `07_Drawing_Teknis_${pData.code}.pdf`, type: 'DRAWING', user: uEngineeringId },
      { name: `08_Foto_Progress_${pData.code}.jpg`, type: 'FOTO', user: uProyekAdminId },
      { name: `09_RAB_${pData.code}.xlsx`, type: 'RAB', user: uEngineeringId },
      { name: `10_BOQ_${pData.code}.xlsx`, type: 'BOQ', user: uEngineeringId },
    ];

    for (const d of docs) {
      const doc = await prisma.document.create({
        data: {
          projectId: project.id,
          fileName: d.name,
          fileType: d.type,
          filePath: `/storage/uploads/seed/${d.name}`,
          fileSize: 1024000 + i * 2000,
          uploadedById: d.user,
          status: 'APPROVED',
        }
      });

      docMap[d.type] = doc.id;

      if (d.type === 'BOQ') {
        const boqHeader = await prisma.boqHeader.create({
          data: {
            documentId: doc.id,
            totalAmount: pData.nilKontrak,
          }
        });

        await prisma.boqItem.createMany({
          data: [
            {
              boqHeaderId: boqHeader.id,
              wbsCode: '1.01',
              description: `Pekerjaan Persiapan & Mobilisasi ${pData.name}`,
              quantity: 1,
              unit: 'Ls',
              rateEngineering: 25000000,
              rateProcurement: 24000000,
              totalPrice: 24000000,
            },
            {
              boqHeaderId: boqHeader.id,
              wbsCode: '2.01',
              description: `Pengadaan Material Utama & Instalasi ${pData.name}`,
              quantity: 10,
              unit: 'Unit',
              rateEngineering: Math.round(pData.nilKontrak / 10),
              rateProcurement: Math.round(pData.nilKontrak / 10 * 0.95),
              totalPrice: Math.round(pData.nilKontrak * 0.95),
            }
          ]
        });
      }
    }

    // Seed Data Subkon (Parent-Child) with Linked MasterSubkon & Linked Documents
    const chosenMaster1 = masterSubkonList[i % masterSubkonList.length];
    const chosenMaster2 = masterSubkonList[(i + 3) % masterSubkonList.length];

    // Subkon 1
    const subkon1 = await prisma.projectSubkon.create({
      data: {
        projectId: project.id,
        masterSubkonId: chosenMaster1.id,
        namaPekerjaan: `Spesialis Pemasangan Subkon ${pData.name}`,
        kategori: `SPK-SUB-2026/00${i+1}`,
        nilaiKontrak: Math.round(pData.nilKontrak * 0.35),
        type: 'SUBKON1',
      }
    });

    await prisma.projectSubkonTermin.create({
      data: {
        projectSubkonId: subkon1.id,
        nilaiJasa: Math.round(pData.nilKontrak * 0.20),
        pembayaranPersen: 60,
        prosedurPenagihan: 'Termin 1 (60% Progress)',
        autoRfq: docMap['RFQ_SCAN_KOSONG'],
        autoBoq: docMap['BOQ'],
        autoSpk: docMap['SPK'],
        autoFotoProgress: docMap['FOTO'],
        bapp: 'BAPP-SUB-2026/01 (Disetujui)',
        laporanProgress: 'Laporan Mingguan V1 (Ada)',
        suratJalan: 'SJ-MAT-2026/01 (Ada)',
        ceklist: 'QC Pass 100%',
        bastBasT2: 'BAST-Phase1 (Valid)',
        proformaInvoice: 'PI-SUB-2026/01 (Ada)',
        tandaTerimaTukarFaktur: 'TT-2026/01 (Ada)',
        invoice: 'INV-SUB-2026/01 (Ada)',
        kwitansi: 'KW-SUB-2026/01 (Ada)',
        tanggalPengajuan: new Date(2026, 6, 5),
        tanggalDibayar: new Date(2026, 6, 12),
      }
    });

    if (pData.prog >= 70) {
      await prisma.projectSubkonTermin.create({
        data: {
          projectSubkonId: subkon1.id,
          nilaiJasa: Math.round(pData.nilKontrak * 0.15),
          pembayaranPersen: 40,
          prosedurPenagihan: 'Pelunasan (40%)',
          autoRfq: docMap['RFQ_SCAN_KOSONG'],
          autoBoq: docMap['BOQ'],
          autoSpk: docMap['SPK'],
          autoFotoProgress: docMap['FOTO'],
          bapp: 'BAPP-SUB-2026/02 (Disetujui)',
          laporanProgress: 'Laporan Final Subkon',
          suratJalan: 'SJ-MAT-2026/02 (Ada)',
          ceklist: 'QC Final Pass',
          bastBasT2: 'BAST-Final (Valid)',
          proformaInvoice: 'PI-SUB-2026/02 (Ada)',
          tandaTerimaTukarFaktur: 'TT-2026/02 (Ada)',
          invoice: 'INV-SUB-2026/02 (Ada)',
          kwitansi: 'KW-SUB-2026/02 (Ada)',
          tanggalPengajuan: new Date(2026, 6, 15),
          tanggalDibayar: new Date(2026, 6, 20),
        }
      });
    }

    // Subkon 2
    const subkon2 = await prisma.projectSubkon.create({
      data: {
        projectId: project.id,
        masterSubkonId: chosenMaster2.id,
        namaPekerjaan: `Pengadaan & Instalasi MEP Subkon ${pData.name}`,
        kategori: `SPK-SUB-2026/00${i+1}-MEP`,
        nilaiKontrak: Math.round(pData.nilKontrak * 0.25),
        type: 'SUBKON2',
      }
    });

    await prisma.projectSubkonTermin.create({
      data: {
        projectSubkonId: subkon2.id,
        nilaiJasa: Math.round(pData.nilKontrak * 0.25),
        pembayaranPersen: pData.prog >= 50 ? 50 : 25,
        prosedurPenagihan: 'Termin 1 (DP & Material)',
        autoRfq: docMap['RFQ_SCAN_KOSONG'],
        autoBoq: docMap['BOQ'],
        autoSpk: docMap['SPK'],
        autoFotoProgress: docMap['FOTO'],
        bapp: 'BAPP-MEP-2026 (Proses)',
        laporanProgress: 'Laporan Mingguan MEP',
        suratJalan: 'SJ-MEP-2026 (Ada)',
        ceklist: 'QC Material Onsite',
        bastBasT2: 'BAST-MEP (Draft)',
        proformaInvoice: 'PI-MEP-2026 (Ada)',
        tandaTerimaTukarFaktur: 'TT-MEP-2026 (Ada)',
        invoice: 'INV-MEP-2026 (Ada)',
        kwitansi: 'KW-MEP-2026 (Ada)',
        tanggalPengajuan: new Date(2026, 6, 10),
        tanggalDibayar: new Date(2026, 6, 18),
      }
    });

    // Seed Audit Log
    await prisma.auditLog.create({
      data: {
        userId: uSuperAdminId,
        actionType: 'CREATE_PROJECT',
        tableName: 'projects',
        recordId: project.id,
        description: `Membuat dan memverifikasi data proyek & subkon '${project.name}' (${project.code})`,
        ipAddress: '127.0.0.1',
      }
    });
  }

  // Seed Attendance & Work Reports for HRD Role
  console.log('--- Seeding Attendance & Work Reports for HRD ---');
  const allUsers = [superadmin, engineering, proyekAdmin, procurement, finance, hrd, monitoring].filter(Boolean);
  for (const u of allUsers) {
    await prisma.attendance.create({
      data: {
        userId: u.id,
        date: new Date(),
        status: 'HADIR',
        notes: 'Absen geotagging lokasi proyek terverifikasi akurat',
        photoUrl: '/storage/uploads/seed/selfie_default.jpg',
      }
    });

    await prisma.workReport.create({
      data: {
        userId: u.id,
        date: new Date(),
        title: `Laporan Hasil Kerja Harian Staf - ${u.role}`,
        description: `Seluruh target operasional proyek dan pengelolaan berkas untuk divisi ${u.role} telah tercapai 100%.`,
      }
    });
  }

  console.log('✅ Successfully seeded MasterSubkons, Subkon Parent-Child, and Linked Documents for ALL 10 Projects!');
}

main()
  .catch((e) => {
    console.error('Error seeding 10 projects & subkons:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
