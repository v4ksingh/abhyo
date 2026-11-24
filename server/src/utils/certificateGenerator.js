/**
 * Olympiad Certificate Generator
 * Generates a styled PDF certificate using pdfkit
 * Embeds a QR code for public verification
 */
const path = require('path');
const fs   = require('fs');

/**
 * Generate a unique short certificate ID
 */
function generateCertificateId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'OLY-';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/**
 * Generate an olympiad certificate PDF
 * @param {Object} data - Certificate data
 * @param {string} data.studentName
 * @param {string} data.olympiadTitle
 * @param {string} data.subjectName
 * @param {string} data.className     e.g. "Class 8"
 * @param {string} data.grade         e.g. "Gold", "Silver", "Bronze", "Merit"
 * @param {number} data.nationalRank
 * @param {number} data.obtainedMarks
 * @param {number} data.totalMarks
 * @param {string} data.examDate      e.g. "15 June 2025"
 * @param {string} data.certificateId
 * @param {string} outputPath         Full path to save the PDF
 */
async function generateCertificatePDF(data, outputPath) {
  // Lazy-require so server still starts if pdfkit/qrcode not yet installed
  let PDFDocument, QRCode;
  try {
    PDFDocument = require('pdfkit');
    QRCode      = require('qrcode');
  } catch (e) {
    throw new Error('pdfkit and qrcode packages are required. Run: npm install pdfkit qrcode');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const W = 841.89; // A4 landscape width
      const H = 595.28; // A4 landscape height

      // ── Background gradient simulation (filled rect layers) ──
      doc.rect(0, 0, W, H).fill('#0f0c29');
      doc.rect(0, 0, W, H / 3).fill('#302b63');
      doc.rect(0, H * 0.6, W, H * 0.4).fill('#24243e');

      // ── Decorative border ──
      doc.rect(20, 20, W - 40, H - 40)
        .lineWidth(3)
        .stroke('#f59e0b');
      doc.rect(28, 28, W - 56, H - 56)
        .lineWidth(1)
        .stroke('#fbbf24');

      // ── Header: Abhyo Olympiad ──
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#fbbf24')
        .text('ABHYO', 0, 55, { align: 'center', characterSpacing: 8 });
      doc.font('Helvetica').fontSize(8).fillColor('#a5b4fc')
        .text('Empowering Minds · Building Futures', 0, 72, { align: 'center', characterSpacing: 2 });

      // ── Title line ──
      doc.moveTo(160, 92).lineTo(W - 160, 92).stroke('#6366f1');

      // ── Certificate of Achievement ──
      doc.font('Helvetica-Bold').fontSize(28).fillColor('#ffffff')
        .text('CERTIFICATE OF ACHIEVEMENT', 0, 105, { align: 'center' });

      // ── Subtitle ──
      doc.font('Helvetica').fontSize(12).fillColor('#a5b4fc')
        .text('This is proudly presented to', 0, 148, { align: 'center' });

      // ── Student Name ──
      doc.font('Helvetica-Bold').fontSize(34).fillColor('#fbbf24')
        .text(data.studentName || 'Student Name', 0, 170, { align: 'center' });

      // ── Body text ──
      const bodyY = 220;
      doc.font('Helvetica').fontSize(12).fillColor('#e2e8f0')
        .text(
          `For outstanding performance in the  ${data.olympiadTitle}`,
          60, bodyY, { align: 'center', width: W - 120 }
        );
      doc.font('Helvetica').fontSize(11).fillColor('#94a3b8')
        .text(
          `Subject: ${data.subjectName}   ·   ${data.className}   ·   Exam Date: ${data.examDate}`,
          60, bodyY + 24, { align: 'center', width: W - 120 }
        );

      // ── Score & Rank boxes ──
      const boxY = 270;
      const boxes = [
        { label: 'Marks Obtained', value: `${data.obtainedMarks}/${data.totalMarks}` },
        { label: 'National Rank',  value: data.nationalRank ? `#${data.nationalRank}` : 'TBD' },
        { label: 'Grade',          value: data.grade || 'Merit' },
      ];
      const boxW = 140, boxH = 60, gap = 30;
      const totalBoxW = boxes.length * boxW + (boxes.length - 1) * gap;
      let boxX = (W - totalBoxW) / 2;

      boxes.forEach(box => {
        doc.roundedRect(boxX, boxY, boxW, boxH, 8).fill('rgba(99,102,241,0.3)');
        doc.roundedRect(boxX, boxY, boxW, boxH, 8).lineWidth(1).stroke('#6366f1');
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#fbbf24')
          .text(box.value, boxX, boxY + 10, { width: boxW, align: 'center' });
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
          .text(box.label, boxX, boxY + 38, { width: boxW, align: 'center' });
        boxX += boxW + gap;
      });

      // ── Divider ──
      doc.moveTo(100, 350).lineTo(W - 100, 350).lineWidth(0.5).stroke('#475569');

      // ── Footer: signatures ──
      const sigY = 370;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
        .text('Authorized Signatory', 80, sigY + 30, { width: 160, align: 'center' });
      doc.moveTo(80, sigY + 28).lineTo(240, sigY + 28).lineWidth(1).stroke('#64748b');

      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
        .text('Director, Abhyo Olympiad', W - 240, sigY + 30, { width: 160, align: 'center' });
      doc.moveTo(W - 240, sigY + 28).lineTo(W - 80, sigY + 28).lineWidth(1).stroke('#64748b');

      // ── Certificate ID ──
      doc.font('Helvetica').fontSize(7).fillColor('#64748b')
        .text(`Certificate ID: ${data.certificateId}`, 60, H - 50, { align: 'left' });

      // ── QR code (async — generate then embed) ──
      const verifyUrl = `${process.env.CLIENT_URL || 'https://abhyo.com'}/olympiad/verify/${data.certificateId}`;
      QRCode.toDataURL(verifyUrl, { width: 70, margin: 1, color: { dark: '#ffffff', light: '#0000' } })
        .then(qrDataUrl => {
          const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
          doc.image(qrBuffer, W - 110, H - 100, { width: 70, height: 70 });
          doc.font('Helvetica').fontSize(6).fillColor('#64748b')
            .text('Scan to verify', W - 110, H - 28, { width: 70, align: 'center' });
          doc.end();
        })
        .catch(() => {
          doc.end(); // end without QR if generation fails
        });

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateCertificatePDF, generateCertificateId };
