const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = 'C:\\PROJECT\\data dummy';
const targetDir = 'C:\\PROJECT\\assetmenagemen\\backend\\uploads\\documents';
const projectId = '943b8eeb-c482-4257-abde-c79447801dbf';
const userId = '5b0e7348-a9a9-4cea-bbd3-48d921f7affb';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Map the folders and files to doc types and statuses
async function run() {
  const folders = ['Enginering', 'Finance', 'Purchasing', 'proyek admin'];

  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    if (!fs.existsSync(folderPath)) continue;

    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const sourcePath = path.join(folderPath, file);
      
      // skip if directory
      if (fs.statSync(sourcePath).isDirectory()) continue;

      let docType = 'DRAWING'; // default
      let docStatus = 'APPROVED'; // default
      let subFolder = null;

      if (file.includes('Drawing_Arsitektur')) docType = 'DRAWING';
      else if (file.includes('Penawaran_Draft')) docType = 'PENAWARAN_DRAFT';
      else if (file.includes('BOQ_Material')) docType = 'BOQ';
      else if (file.includes('Drawing_AsBuilt')) docType = 'DRAWING_AS_BUILT';
      else if (file.includes('RFQ_Scan')) docType = 'RFQ_SCAN_KOSONG';
      else if (file.includes('SPK_Subkon')) { docType = 'SPK'; subFolder = 'SUBKON'; }
      else if (file.includes('SPK_Klien')) { docType = 'SPK'; subFolder = 'KLIEN'; }
      else if (file.includes('Foto_Lapangan')) docType = 'FOTO';
      else if (file.includes('Invoice_Subkon')) { docType = 'INVOICE'; subFolder = 'SUBKON'; }
      else if (file.includes('BOQ_Cabling')) docType = 'BOQ';
      else if (file.includes('Penawaran_Final')) docType = 'PENAWARAN_FINAL';
      else if (file.includes('Invoice_DP')) docType = 'INVOICE';
      else if (file.includes('Forecast_Cost')) docType = 'FORECAST_COST';
      else if (file.includes('RAB')) docType = 'RAB';
      else if (file.includes('General_Subkon_Docs')) { docType = 'SUBKON_DOCS'; subFolder = 'SUBKON'; }

      // Generate a uuid for the physical file
      const ext = path.extname(file);
      const uuid = crypto.randomUUID();
      const newFileName = `${uuid}${ext}`;
      const destPath = path.join(targetDir, newFileName);

      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);

      await prisma.document.create({
        data: {
          projectId,
          fileName: file,
          fileType: docType,
          filePath: newFileName,
          fileSize: stats.size,
          uploadedById: userId,
          status: docStatus,
          subFolderName: subFolder,
        }
      });
      console.log(`Inserted ${file} -> ${newFileName} as ${docType}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
