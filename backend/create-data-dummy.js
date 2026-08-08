const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'storage', 'dummy');
const targetDir = 'C:\\PROJECT\\data dummy';

// Pastikan folder target ada
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Map file dummy ke file yang bisa dipakai test berdasarkan role
const filesToCreate = [
  // 1. Engineering
  { src: 'Draft_Drawing_Arsitektur.pdf', dest: '1_Engineering_Drawing_Arsitektur.pdf' },
  { src: 'Draft_Penawaran_V1.xlsx', dest: '2_Engineering_Penawaran_Draft.xlsx' },
  { src: 'BOQ_Material_Server.xlsx', dest: '3_Engineering_BOQ_Material.xlsx' },
  { src: 'Drawing_AsBuilt_A.dwg', dest: '4_Engineering_Drawing_AsBuilt.dwg' },
  { src: 'RFQ_Server_Kosong.pdf', dest: '5_Engineering_RFQ_Scan.pdf' },
  { src: 'SPK_Subkon1_Cisco.pdf', dest: '6_Engineering_SPK_Subkon.pdf' },

  // 2. Proyek Admin
  { src: 'SPK_Klien_IT.pdf', dest: '7_ProyekAdmin_SPK_Klien.pdf' },
  { src: 'Foto_Progress_Minggu1.jpg', dest: '8_ProyekAdmin_Foto_Lapangan.jpg' },
  { src: 'Invoice_Subkon1.pdf', dest: '9_ProyekAdmin_Invoice_Subkon.pdf' },

  // 3. Procurement
  { src: 'BOQ_Material_Cabling.xlsx', dest: '10_Procurement_BOQ_Cabling.xlsx' },
  { src: 'Penawaran_Final_PDN.pdf', dest: '11_Procurement_Penawaran_Final.pdf' },

  // 4. Finance
  { src: 'Invoice_DP_PDN.pdf', dest: '12_Finance_Invoice_DP.pdf' },
  { src: 'Forecast_Budget_Q3.xlsx', dest: '13_Finance_Forecast_Cost.xlsx' },
  { src: 'RAB_Internal_PDN.xlsx', dest: '14_Finance_RAB.xlsx' },

  // 5. General Subkon
  { src: 'SPK_Subkon2_HP.pdf', dest: '15_General_Subkon_Docs.pdf' },
];

filesToCreate.forEach((f) => {
  const sourcePath = path.join(sourceDir, f.src);
  const targetPath = path.join(targetDir, f.dest);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${f.dest}`);
  } else {
    console.error(`Source file not found: ${f.src}`);
  }
});

console.log(`\nBerhasil membuat 15 file dummy di folder ${targetDir}`);
