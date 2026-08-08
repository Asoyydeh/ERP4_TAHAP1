const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

const dummyDir = path.join(process.cwd(), 'storage', 'dummy');
if (!fs.existsSync(dummyDir)) {
  fs.mkdirSync(dummyDir, { recursive: true });
}

const files = [
  'SPK_Klien_PDN.pdf', 'Penawaran_Final_PDN.pdf', 'Drawing_AsBuilt_A.dwg', 
  'Invoice_DP_PDN.pdf', 'SPK_Klien_IT.pdf', 'Invoice_Termin1_IT.pdf', 
  'RFQ_Server_Kosong.pdf', 'RFQ_Kabel_Kosong.pdf', 'SPK_Subkon1_Cisco.pdf', 
  'Invoice_Subkon1.pdf', 'SPK_Subkon2_HP.pdf', 'SPK_Subkon3_Dell.pdf', 
  'SPK_Subkon4_Schneider.pdf', 'SPK_Subkon5_Daikin.pdf', 'Draft_Drawing_Arsitektur.pdf', 
  'Draft_Drawing_MEP.pdf', 'Foto_Progress_Minggu1.jpg', 'Foto_Progress_Minggu2.jpg', 
  'RAB_Internal_PDN.xlsx', 'Forecast_Budget_Q3.xlsx', 'Draft_Penawaran_V1.xlsx', 
  'BOQ_Material_Server.xlsx', 'BOQ_Material_Cabling.xlsx'
];

async function createDummies() {
  for (const file of files) {
    const filePath = path.join(dummyDir, file);
    const ext = path.extname(file).toLowerCase();

    if (ext === '.pdf') {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(25).text('Dummy File: ' + file, 100, 100);
      doc.end();
    } else if (ext === '.xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ["Dummy Header 1", "Dummy Header 2"],
        ["Data 1", "Data 2"],
        ["File", file]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, filePath);
    } else if (ext === '.jpg') {
      // 1x1 transparent GIF disguised as JPG (browsers usually render it fine)
      const base64Jpg = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      fs.writeFileSync(filePath, Buffer.from(base64Jpg, 'base64'));
    } else {
      fs.writeFileSync(filePath, 'Dummy content for ' + file);
    }
    console.log(`Created dummy for ${file}`);
  }
}

createDummies().then(() => console.log('All dummy files created successfully!'));
