const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const ImageTracer = require('imagetracerjs');

// ── Uploads directory setup ───────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads/images');
const LEGACY_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Session & File Registry (5-minute TTL) ──────────────────────────────────
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// sessions: sessionId -> { workingImage: Object | null, processed: Array<Object> }
const sessions = new Map();

// fileRegistry: filename -> { filename, filePath, originalName, size, dimensions, expiresAt, sessionId, isWorkingImage }
const fileRegistry = new Map();

// Helper to safely delete a file from disk and registry
function purgeFile(filename) {
  const meta = fileRegistry.get(filename);
  if (meta) {
    fileRegistry.delete(filename);
    if (meta.sessionId && sessions.has(meta.sessionId)) {
      const sess = sessions.get(meta.sessionId);
      if (sess.workingImage && sess.workingImage.filename === filename) {
        sess.workingImage = null;
      }
      sess.processed = sess.processed.filter((p) => p.filename !== filename);
    }
    try {
      if (fs.existsSync(meta.filePath)) {
        fs.unlinkSync(meta.filePath);
        console.log(`[Image Studio] Cleaned up expired file: ${filename}`);
      }
    } catch (err) {
      console.error(`[Image Studio] Error purging ${filename}:`, err.message);
    }
  } else {
    // If not in registry, attempt direct disk check
    const directPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(directPath)) {
      try {
        fs.unlinkSync(directPath);
      } catch (e) {}
    }
  }
}

// Clean up files older than 5 minutes on startup, keep fresher ones
try {
  const existingFiles = fs.readdirSync(UPLOADS_DIR);
  const now = Date.now();
  for (const file of existingFiles) {
    const filePath = path.join(UPLOADS_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const age = now - stat.mtimeMs;
        if (age >= FIVE_MINUTES_MS) {
          fs.unlinkSync(filePath);
        } else {
          // Re-register surviving file for remaining time
          const remainingTime = FIVE_MINUTES_MS - age;
          const meta = {
            filename: file,
            filePath,
            originalName: file,
            size: stat.size,
            dimensions: null,
            expiresAt: now + remainingTime,
            sessionId: 'recovered',
            isWorkingImage: file.startsWith('source-')
          };
          fileRegistry.set(file, meta);
          setTimeout(() => purgeFile(file), remainingTime);
        }
      }
    } catch (e) {}
  }
} catch (e) {
  console.error('[Image Studio] Error during startup cleanup:', e);
}

// Sweeper: runs every 20 seconds to guarantee no expired files linger
setInterval(() => {
  const now = Date.now();
  for (const [filename, meta] of fileRegistry.entries()) {
    if (meta.expiresAt <= now) {
      purgeFile(filename);
    }
  }
}, 20000);

function getSessionId(req) {
  return (
    req.headers['x-session-id'] ||
    req.query.sessionId ||
    (req.body && req.body.sessionId) ||
    'default-session'
  );
}

function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      workingImage: null,
      processed: []
    });
  }
  return sessions.get(sessionId);
}

// Multer setup for in-memory processing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 } // 40MB limit
});

// ── GET /session: Retrieve active temporary session data ─────────────────────
router.get('/session', (req, res) => {
  const sessionId = getSessionId(req);
  const session = getOrCreateSession(sessionId);
  const now = Date.now();

  // Validate working image
  if (session.workingImage) {
    if (session.workingImage.expiresAt <= now || !fs.existsSync(session.workingImage.filePath)) {
      purgeFile(session.workingImage.filename);
      session.workingImage = null;
    }
  }

  // Validate processed images
  session.processed = session.processed.filter((item) => {
    if (item.expiresAt <= now || !fs.existsSync(item.filePath)) {
      purgeFile(item.filename);
      return false;
    }
    return true;
  });

  res.json({
    success: true,
    sessionId,
    workingImage: session.workingImage
      ? {
          id: session.workingImage.filename,
          filename: session.workingImage.filename,
          originalName: session.workingImage.originalName,
          size: session.workingImage.size,
          dimensions: session.workingImage.dimensions,
          previewUrl: `/api/image-studio/preview/${session.workingImage.filename}`,
          downloadUrl: `/api/image-studio/download/${session.workingImage.filename}`,
          expiresAt: session.workingImage.expiresAt,
          timeRemaining: Math.max(0, session.workingImage.expiresAt - now)
        }
      : null,
    processedImages: session.processed.map((item) => ({
      id: item.filename,
      originalName: item.originalName,
      filename: item.filename,
      downloadUrl: `/api/image-studio/download/${item.filename}`,
      previewUrl: `/api/image-studio/preview/${item.filename}`,
      expiresAt: item.expiresAt,
      timeRemaining: Math.max(0, item.expiresAt - now),
      size: item.size
    }))
  });
});

// ── POST /temp-upload: Save active working image for 5 minutes ──────────────
router.post('/temp-upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const sessionId = getSessionId(req);
    const session = getOrCreateSession(sessionId);

    // If an existing working image exists, purge it
    if (session.workingImage) {
      purgeFile(session.workingImage.filename);
      session.workingImage = null;
    }

    const originalName = req.file.originalname || 'uploaded-image.png';
    const ext = path.extname(originalName).toLowerCase() || '.png';
    const baseFileName = `source-${crypto.randomUUID()}`;
    const filename = `${baseFileName}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Inspect image metadata
    let dimensions = { width: 800, height: 600 };
    try {
      const meta = await sharp(req.file.buffer).metadata();
      if (meta.width && meta.height) {
        dimensions = { width: meta.width, height: meta.height };
      }
    } catch (e) {
      // Vector or uncompressed fallback
    }

    // Save image to disk
    fs.writeFileSync(filePath, req.file.buffer);

    const expiresAt = Date.now() + FIVE_MINUTES_MS;
    const workingMeta = {
      id: filename,
      filename,
      filePath,
      originalName,
      size: req.file.size,
      dimensions,
      expiresAt,
      createdAt: Date.now(),
      sessionId,
      isWorkingImage: true
    };

    fileRegistry.set(filename, workingMeta);
    session.workingImage = workingMeta;

    setTimeout(() => purgeFile(filename), FIVE_MINUTES_MS);

    res.json({
      success: true,
      workingImage: {
        id: filename,
        filename,
        originalName,
        size: req.file.size,
        dimensions,
        previewUrl: `/api/image-studio/preview/${filename}`,
        downloadUrl: `/api/image-studio/download/${filename}`,
        expiresAt,
        timeRemaining: FIVE_MINUTES_MS
      }
    });
  } catch (error) {
    console.error('[Image Studio] Temp upload error:', error);
    res.status(500).json({ error: 'Failed to temporarily store working image' });
  }
});

// ── POST /process: Convert, compress, scale image ───────────────────────────
router.post('/process', upload.single('image'), async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const session = getOrCreateSession(sessionId);

    let imageBuffer = null;
    let originalName = 'processed-image';

    if (req.file) {
      imageBuffer = req.file.buffer;
      originalName = req.file.originalname;
    } else if (session.workingImage && fs.existsSync(session.workingImage.filePath)) {
      // Use currently cached working image if no new file is passed
      imageBuffer = fs.readFileSync(session.workingImage.filePath);
      originalName = session.workingImage.originalName;
    } else {
      return res.status(400).json({ error: 'No image uploaded or active session found' });
    }

    const { targetFormat = 'WEBP', quality = 80, scale = 1 } = req.body;
    const format = targetFormat.toLowerCase();
    const q = parseInt(quality, 10);
    const s = parseFloat(scale);

    const baseFileName = crypto.randomUUID();
    const outputFileName = `${baseFileName}.${format}`;
    const outputPath = path.join(UPLOADS_DIR, outputFileName);

    // Initial sharp instance
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    const newWidth = Math.max(1, Math.round((metadata.width || 800) * s));
    const newHeight = Math.max(1, Math.round((metadata.height || 600) * s));

    if (format === 'pdf') {
      const processedBuffer = await image.resize(newWidth).png().toBuffer();
      const doc = new PDFDocument({
        size: [newWidth, newHeight],
        margin: 0
      });
      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);
      doc.image(processedBuffer, 0, 0, { width: newWidth, height: newHeight });
      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else if (format === 'svg') {
      const processedBuffer = await image.resize(newWidth).png().toBuffer();
      const rawImage = sharp(processedBuffer);
      const { data, info } = await rawImage.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

      const imgData = { width: info.width, height: info.height, data: new Uint8Array(data) };
      const svgString = ImageTracer.imagedataToSVG(imgData, { scale: 1 });
      fs.writeFileSync(outputPath, svgString);
    } else {
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

    const outputStat = fs.statSync(outputPath);
    const expiresAt = Date.now() + FIVE_MINUTES_MS;

    const processedRecord = {
      id: outputFileName,
      filename: outputFileName,
      filePath: outputPath,
      originalName,
      size: outputStat.size,
      downloadUrl: `/api/image-studio/download/${outputFileName}`,
      previewUrl: `/api/image-studio/preview/${outputFileName}`,
      expiresAt,
      createdAt: Date.now(),
      sessionId,
      isWorkingImage: false
    };

    fileRegistry.set(outputFileName, processedRecord);
    session.processed.unshift(processedRecord);

    setTimeout(() => purgeFile(outputFileName), FIVE_MINUTES_MS);

    res.json({
      success: true,
      filename: outputFileName,
      originalName,
      downloadUrl: `/api/image-studio/download/${outputFileName}`,
      previewUrl: `/api/image-studio/preview/${outputFileName}`,
      expiresAt,
      timeRemaining: FIVE_MINUTES_MS,
      size: outputStat.size
    });
  } catch (error) {
    console.error('[Image Studio] Process error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// ── GET /preview/:filename: Inline image preview ────────────────────────────
router.get('/preview/:filename', (req, res) => {
  const filename = req.params.filename;
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  let filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(LEGACY_DIR, filename);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found or has expired (available for 5 minutes)' });
  }

  const ext = path.extname(filename).toLowerCase().replace('.', '');
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    svg: 'image/svg+xml',
    pdf: 'application/pdf'
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=300');
  fs.createReadStream(filePath).pipe(res);
});

// ── GET /download/:filename: Download image file ────────────────────────────
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  let filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(LEGACY_DIR, filename);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or has expired (available for 5 minutes)' });
  }

  res.download(filePath, filename);
});

// ── DELETE /session/working-image: Remove working image ───────────────────────
router.delete('/session/working-image', (req, res) => {
  const sessionId = getSessionId(req);
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    if (session.workingImage) {
      purgeFile(session.workingImage.filename);
      session.workingImage = null;
    }
  }
  res.json({ success: true });
});

// ── DELETE /session/processed/:filename: Remove single processed item ────────
router.delete('/session/processed/:filename', (req, res) => {
  const filename = req.params.filename;
  purgeFile(filename);
  res.json({ success: true });
});

module.exports = router;
