const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const ImageTracer = require('imagetracerjs');

// Ensure uploads directory exists and clean it up on startup
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} else {
  // Clean up any left over files from previous runs
  const files = fs.readdirSync(UPLOADS_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(UPLOADS_DIR, file));
  }
}

// Multer setup for in-memory storage (we process it via sharp before saving)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB limit
});

// Process image
router.post('/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { targetFormat = 'WEBP', quality = 80, scale = 1 } = req.body;
    const format = targetFormat.toLowerCase();
    const q = parseInt(quality, 10);
    const s = parseFloat(scale);

    const baseFileName = crypto.randomUUID();
    const outputFileName = `${baseFileName}.${format}`;
    const outputPath = path.join(UPLOADS_DIR, outputFileName);

    // Initial sharp instance
    const image = sharp(req.file.buffer);
    const metadata = await image.metadata();

    const newWidth = Math.round((metadata.width || 800) * s);

    if (format === 'pdf') {
      // 1. Process via sharp to intermediate PNG to ensure compatibility
      const processedBuffer = await image.resize(newWidth).png().toBuffer();
      
      // 2. Write to PDF using pdfkit
      const doc = new PDFDocument({ 
        size: [newWidth, Math.round((metadata.height || 600) * s)],
        margin: 0
      });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);
      doc.image(processedBuffer, 0, 0, { width: newWidth });
      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else if (format === 'svg') {
      // 1. Convert to a small format (png) for tracing
      const processedBuffer = await image.resize(newWidth).png().toBuffer();
      
      // 2. Trace using imagetracerjs
      const rawImage = sharp(processedBuffer);
      const { data, info } = await rawImage.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      
      // Create ImageData-like object
      const imgData = { width: info.width, height: info.height, data: new Uint8Array(data) };
      
      const svgString = ImageTracer.imagedataToSVG(imgData, { scale: 1 });
      fs.writeFileSync(outputPath, svgString);
    } else {
      // Raster formats via sharp
      let pipeline = image.resize(newWidth);
      
      switch (format) {
        case 'png':
          pipeline = pipeline.png({ quality: q });
          break;
        case 'jpg':
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality: q });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality: q });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality: q });
          break;
        case 'tiff':
          pipeline = pipeline.tiff({ quality: q });
          break;
        default:
          return res.status(400).json({ error: 'Unsupported format' });
      }

      await pipeline.toFile(outputPath);
    }

    // Schedule deletion after 5 minutes (300,000 ms)
    setTimeout(() => {
      fs.unlink(outputPath, (err) => {
        if (err) console.error(`Failed to delete expired file ${outputPath}:`, err);
        else console.log(`Deleted expired file: ${outputPath}`);
      });
    }, 5 * 60 * 1000);

    res.json({
      success: true,
      filename: outputFileName,
      downloadUrl: `/api/image-studio/download/${outputFileName}`
    });
  } catch (error) {
    console.error('Image Studio Error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Download image
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  // Basic path traversal prevention
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or has expired (available for 5 minutes)' });
  }

  res.download(filePath, filename);
});

module.exports = router;
