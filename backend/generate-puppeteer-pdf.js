const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Install puppeteer-core if missing
try {
  require('puppeteer-core');
} catch (e) {
  console.log('Installing puppeteer-core...');
  execSync('npm install puppeteer-core', { cwd: __dirname, stdio: 'inherit' });
}

const puppeteer = require('puppeteer-core');

(async () => {
  console.log('Launching Chrome for PDF generation...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
      '--enable-local-file-accesses'
    ]
  });

  const page = await browser.newPage();
  const htmlPath = 'file:///c:/PROJECT/assetmenagemen/Dokumentasi_Lengkap_Aplikasi.html';
  console.log('Loading HTML:', htmlPath);
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });

  // Wait for rendering
  console.log('Waiting 2s for images and fonts to settle...');
  await new Promise(r => setTimeout(r, 2000));

  const pdfPath1 = 'c:/PROJECT/assetmenagemen/Dokumentasi_Lengkap_dan_Flowmap_ERP_Konstruksi.pdf';
  const pdfPath2 = 'c:/PROJECT/assetmenagemen/Dokumentasi_Lengkap_dan_Flowmap_Aplikasi.pdf';
  
  console.log('Generating PDF to:', pdfPath1);
  await page.pdf({
    path: pdfPath1,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '8mm',
      bottom: '8mm',
      left: '8mm',
      right: '8mm'
    }
  });

  // Also copy to second PDF name for convenience
  fs.copyFileSync(pdfPath1, pdfPath2);
  console.log('Copied PDF to:', pdfPath2);

  await browser.close();
  console.log('PDF successfully generated!');
})();

