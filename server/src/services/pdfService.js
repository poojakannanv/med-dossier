const PDFDocument = require('pdfkit');

const STATUS_LABELS = {
  'not-started': 'Not started',
  draft: 'Draft',
  'in-review': 'In review',
  approved: 'Approved',
  submitted: 'Submitted',
  rejected: 'Rejected',
};

/**
 * Streams a PDF summary of a submission into the provided writable stream
 * (normally the Express response). Expects submission populated with
 * productId, createdBy and modules.owner.
 */
const buildSubmissionPdf = (submission, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const product = submission.productId || {};
  const progress = submission.progress ? submission.progress() : 0;

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text('MedDossier Submission Summary');
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#666666')
    .text(`Generated on ${new Date().toUTCString()}`);
  doc.fillColor('#000000');
  doc.moveDown(1);

  // Product information
  doc.fontSize(14).font('Helvetica-Bold').text('Product Information');
  doc.moveDown(0.4);
  doc.fontSize(10).font('Helvetica');
  const productRows = [
    ['Product name', product.productName || 'N/A'],
    ['Active ingredient', product.activeIngredient || 'N/A'],
    ['Dosage form', product.dosageForm || 'N/A'],
    ['Strength', product.strength || 'N/A'],
    ['Manufacturer', product.manufacturer || 'N/A'],
    ['MAH', product.mah || 'N/A'],
    ['ATC code', product.atcCode || 'N/A'],
  ];
  productRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(String(value));
  });
  doc.moveDown(1);

  // Submission meta
  doc.fontSize(14).font('Helvetica-Bold').text('Submission Details');
  doc.moveDown(0.4);
  doc.fontSize(10);
  const metaRows = [
    ['Regulatory authority', submission.regulatoryAuthority],
    ['Submission type', submission.submissionType],
    ['Target date', new Date(submission.targetDate).toDateString()],
    ['Status', STATUS_LABELS[submission.status] || submission.status],
    ['Overall progress', `${progress}% of modules approved`],
    ['Created by', submission.createdBy && submission.createdBy.name ? submission.createdBy.name : 'N/A'],
    ['Created on', new Date(submission.createdAt).toDateString()],
  ];
  metaRows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(String(value));
  });
  doc.moveDown(1);

  // Module checklist table
  doc.fontSize(14).font('Helvetica-Bold').text('CTD Module Checklist');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const colX = { code: 50, title: 120, status: 340, owner: 420 };

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Module', colX.code, tableTop);
  doc.text('Title', colX.title, tableTop);
  doc.text('Status', colX.status, tableTop);
  doc.text('Owner', colX.owner, tableTop);
  doc
    .moveTo(50, tableTop + 14)
    .lineTo(545, tableTop + 14)
    .strokeColor('#999999')
    .stroke();

  let y = tableTop + 20;
  doc.font('Helvetica').fontSize(9);

  submission.modules.forEach((module) => {
    if (y > 760) {
      doc.addPage();
      y = 50;
    }
    const ownerName = module.owner && module.owner.name ? module.owner.name : 'Unassigned';
    doc.text(module.code, colX.code, y, { width: 65 });
    doc.text(module.title, colX.title, y, { width: 210 });
    doc.text(STATUS_LABELS[module.status] || module.status, colX.status, y, { width: 70 });
    doc.text(ownerName, colX.owner, y, { width: 120 });
    const rowHeight = Math.max(
      doc.heightOfString(module.title, { width: 210 }),
      12
    );
    y += rowHeight + 8;
  });

  // Footer
  doc
    .fontSize(8)
    .fillColor('#666666')
    .text(
      'MedDossier is an educational portfolio project built against the publicly published ICH CTD format.',
      50,
      790,
      { align: 'center', width: 495 }
    );

  doc.end();
};

module.exports = { buildSubmissionPdf };
