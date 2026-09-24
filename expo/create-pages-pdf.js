const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const screenshotsDir = path.resolve(__dirname, 'page-screenshots');
const outPath = path.resolve(__dirname, 'docs', 'F365-App-All-Pages-Screenshots.pdf');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png')).sort();
const doc = new PDFDocument({ size: 'A4', margin: 36, autoFirstPage: false });
doc.pipe(fs.createWriteStream(outPath));

// Cover
doc.addPage();
doc.fontSize(28).fillColor('#151025').text('F365 App', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(18).fillColor('#6D5A8B').text('All Pages Screenshot Document', { align: 'center' });
doc.moveDown(1);
doc.fontSize(11).fillColor('#5B5268').text(`Generated ${new Date().toLocaleDateString('en-GB')} • ${files.length} app pages captured`, { align: 'center' });
doc.moveDown(2);
doc.fontSize(10).fillColor('#7C728A').text('Note: screenshots are captured from the web preview at mobile viewport size. Some authenticated or data-driven pages may show empty, loading, subscription, or default states depending on available local session/data.', { align: 'center' });

for (const file of files) {
  const label = file.replace('.png', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const imagePath = path.join(screenshotsDir, file);
  doc.addPage();
  doc.fontSize(16).fillColor('#151025').text(label, 36, 28, { align: 'center' });
  doc.fontSize(8).fillColor('#8A8195').text(`Route/page: ${file.replace('.png', '')}`, 36, 50, { align: 'center' });
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const maxW = 300;
  const maxH = pageH - 100;
  const x = (pageW - maxW) / 2;
  doc.roundedRect(x - 8, 72, maxW + 16, maxH + 16, 24).fill('#F3EEF9');
  doc.image(imagePath, x, 80, { fit: [maxW, maxH], align: 'center', valign: 'center' });
}

doc.end();
console.log(outPath);
