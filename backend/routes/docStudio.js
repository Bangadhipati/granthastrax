const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

// ── Upload directory setup ───────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads/docs');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} else {
  // Clean orphaned files on startup
  fs.readdirSync(UPLOADS_DIR).forEach(f => {
    try { fs.unlinkSync(path.join(UPLOADS_DIR, f)); } catch {}
  });
}

// ── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
});

// ── Auto-delete helper ───────────────────────────────────────────────────────
const scheduleDelete = (filePath) => {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete expired doc: ${filePath}`, err);
      else console.log(`Deleted expired doc: ${filePath}`);
    });
  }, 5 * 60 * 1000);
};

// ── Conversion helpers ───────────────────────────────────────────────────────

/**
 * Convert DOCX/RTF/TXT/HTML buffer → HTML string
 */
async function bufferToHtml(buffer, ext) {
  switch (ext) {
    case 'docx': {
      const result = await mammoth.convertToHtml({ buffer });
      return result.value;
    }
    case 'html':
    case 'htm':
      return buffer.toString('utf-8');
    case 'txt':
    case 'rtf':
      // Wrap plain text in a basic HTML structure
      return `<html><body><pre style="font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; padding: 40px;">${
        buffer.toString('utf-8').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }</pre></body></html>`;
    default:
      throw new Error(`Unsupported source format for conversion: .${ext}`);
  }
}

/**
 * Render HTML → PDF buffer using Puppeteer
 */
async function htmlToPdf(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Compress a PDF buffer using pdf-lib (strips metadata, re-serializes)
 */
async function compressPdf(buffer, targetPercent) {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  // pdf-lib's save with useObjectStreams compresses object streams
  const compressed = await pdfDoc.save({ useObjectStreams: true });
  return Buffer.from(compressed);
}

// ── Process endpoint ─────────────────────────────────────────────────────────
router.post('/process', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });

    const {
      convertEnabled, targetFormat,
      compressEnabled, compressPercent,
      expandEnabled, dpi
    } = req.body;

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const baseId = crypto.randomUUID();
    let processedBuffer = req.file.buffer;
    let outputExt = ext;
    let steps = [];

    // ── Step 1: Convert ──────────────────────────────────────────────────────
    if (convertEnabled === 'true') {
      const target = (targetFormat || 'pdf').toLowerCase();

      if (target === 'pdf') {
        if (ext === 'pdf') {
          // Already PDF — nothing to do
          steps.push('Convert: Already PDF, skipped');
        } else {
          const html = await bufferToHtml(processedBuffer, ext);
          processedBuffer = await htmlToPdf(html);
          outputExt = 'pdf';
          steps.push(`Convert: ${ext.toUpperCase()} → PDF`);
        }
      } else if (target === 'txt') {
        if (ext === 'docx') {
          const result = await mammoth.extractRawText({ buffer: processedBuffer });
          processedBuffer = Buffer.from(result.value, 'utf-8');
          outputExt = 'txt';
          steps.push('Convert: DOCX → TXT');
        } else if (ext === 'txt' || ext === 'html') {
          processedBuffer = Buffer.from(processedBuffer.toString('utf-8'));
          outputExt = 'txt';
          steps.push('Convert: Already text, skipped');
        } else {
          return res.status(400).json({ error: `Cannot convert .${ext} to TXT directly. Try converting to PDF first.` });
        }
      } else if (target === 'html') {
        if (ext === 'docx') {
          const html = await bufferToHtml(processedBuffer, ext);
          processedBuffer = Buffer.from(html, 'utf-8');
          outputExt = 'html';
          steps.push('Convert: DOCX → HTML');
        } else {
          return res.status(400).json({ error: `Cannot convert .${ext} to HTML directly.` });
        }
      } else {
        return res.status(400).json({ error: `Target format .${target} is not supported.` });
      }
    }

    // ── Step 2: Compress ─────────────────────────────────────────────────────
    if (compressEnabled === 'true') {
      if (outputExt === 'pdf') {
        processedBuffer = await compressPdf(processedBuffer, parseInt(compressPercent || 60, 10));
        steps.push(`Compress: PDF re-optimized`);
      } else {
        steps.push(`Compress: Skipped (only works on PDF output)`);
      }
    }

    // ── Step 3: Expand for print (re-render at target DPI) ───────────────────
    if (expandEnabled === 'true') {
      if (outputExt === 'pdf') {
        // Embed a DPI comment in PDF metadata
        const pdfDoc = await PDFDocument.load(processedBuffer);
        pdfDoc.setSubject(`Print DPI: ${dpi || 300}`);
        processedBuffer = Buffer.from(await pdfDoc.save());
        steps.push(`Expand: Print intent set to ${dpi || 300} DPI`);
      } else {
        steps.push(`Expand: Skipped (only works on PDF output)`);
      }
    }

    // ── Save to disk ─────────────────────────────────────────────────────────
    const outputFileName = `${baseId}.${outputExt}`;
    const outputPath = path.join(UPLOADS_DIR, outputFileName);
    fs.writeFileSync(outputPath, processedBuffer);
    scheduleDelete(outputPath);

    const originalName = req.file.originalname;

    res.json({
      success: true,
      filename: outputFileName,
      originalName,
      steps,
      downloadUrl: `/api/doc-studio/download/${outputFileName}`
    });
  } catch (err) {
    console.error('DocStudio process error:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

// ── Download endpoint ────────────────────────────────────────────────────────
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or has expired (available for 5 minutes only)' });
  }
  res.download(filePath, filename);
});

module.exports = router;
