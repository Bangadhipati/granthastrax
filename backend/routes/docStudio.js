const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');
const marked = require('marked');
const TurndownService = require('turndown');
const AdmZip = require('adm-zip');
const { PDFParse } = require('pdf-parse');

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

// ── Auto-delete helper (5 min TTL) ──────────────────────────────────────────
const scheduleDelete = (filePath) => {
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete expired doc: ${filePath}`, err);
      else console.log(`Deleted expired doc: ${filePath}`);
    });
  }, 5 * 60 * 1000);
};

// ── XML / HTML escape helper ─────────────────────────────────────────────────
function escapeXml(unsafe = '') {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── LaTeX to Semantic HTML parser ────────────────────────────────────────────
function latexToHtml(texContent) {
  let text = texContent;
  // Remove comments
  text = text.replace(/(^|[^\\])%.*$/gm, '$1');

  let docTitle = '';
  const titleMatch = text.match(/\\title\{([^}]+)\}/);
  if (titleMatch) docTitle = titleMatch[1].trim();

  // Extract \begin{document}...\end{document} if present
  const docMatch = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  if (docMatch) text = docMatch[1];

  // Headings
  text = text.replace(/\\section\*?\{([^}]+)\}/g, '<h1>$1</h1>');
  text = text.replace(/\\subsection\*?\{([^}]+)\}/g, '<h2>$1</h2>');
  text = text.replace(/\\subsubsection\*?\{([^}]+)\}/g, '<h3>$1</h3>');
  text = text.replace(/\\paragraph\*?\{([^}]+)\}/g, '<h4>$1</h4>');

  // Inline styling
  text = text.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
  text = text.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
  text = text.replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>');
  text = text.replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>');
  text = text.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');

  // Lists
  text = text.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) => {
    const listItems = items.split('\\item').slice(1).map(i => `<li>${i.trim()}</li>`).join('');
    return `<ul>${listItems}</ul>`;
  });
  text = text.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
    const listItems = items.split('\\item').slice(1).map(i => `<li>${i.trim()}</li>`).join('');
    return `<ol>${listItems}</ol>`;
  });

  // Math display & inline
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, '<div style="font-family: serif; font-style: italic; text-align: center; margin: 1em 0;">$1</div>');
  text = text.replace(/\$([^$]+)\$/g, '<span style="font-family: serif; font-style: italic;">$1</span>');

  // Strip generic unknown commands
  text = text.replace(/\\[a-zA-Z]+\{([^}]+)\}/g, '$1');
  text = text.replace(/\\[a-zA-Z]+/g, '');

  const blocks = text.split(/\n\s*\n/).map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<div')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean).join('\n');

  return docTitle ? `<h1>${docTitle}</h1>\n${blocks}` : blocks;
}

// ── PDF Text & HTML extractor ────────────────────────────────────────────────
async function pdfToHtmlAndText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const rawText = result.text || '';
  const paragraphs = rawText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.match(/^--\s*\d+\s*of\s*\d+\s*--$/i));

  const htmlBody = paragraphs.map(p => {
    if (p.length < 80 && !p.endsWith('.') && !p.includes('\n')) {
      return `<h2>${escapeXml(p)}</h2>`;
    }
    return `<p>${escapeXml(p).replace(/\n/g, '<br/>')}</p>`;
  }).join('\n');

  return { text: rawText, html: htmlBody };
}

// ── HTML → DOCX Builder ──────────────────────────────────────────────────────
async function buildDocxBuffer({ title, htmlContent }) {
  const clean = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  const children = [];
  if (title) {
    children.push(new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 }
    }));
  }

  const blockRegex = /<(h[1-6]|p|li|blockquote|pre)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let matchFound = false;

  while ((match = blockRegex.exec(clean)) !== null) {
    matchFound = true;
    const tag = match[1].toLowerCase();
    const rawContent = match[2];

    const text = rawContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    if (!text) continue;

    if (tag === 'h1') {
      children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } }));
    } else if (tag === 'h2') {
      children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    } else if (tag === 'h3') {
      children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } }));
    } else if (tag === 'li') {
      children.push(new Paragraph({ text: `•  ${text}`, spacing: { after: 60 } }));
    } else if (tag === 'blockquote') {
      children.push(new Paragraph({ text, spacing: { before: 100, after: 100 } }));
    } else {
      children.push(new Paragraph({ text, spacing: { after: 120 } }));
    }
  }

  if (!matchFound) {
    const plain = clean
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    const lines = plain.split(/\n\s*\n|\r\n\s*\r\n/);
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed) children.push(new Paragraph({ text: trimmed, spacing: { after: 120 } }));
    });
  }

  if (children.length === 0) {
    children.push(new Paragraph({ text: 'GranthAstraX Converted Document' }));
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  return Packer.toBuffer(doc);
}

// ── EPUB 3.0 Builder using AdmZip ───────────────────────────────────────────
function buildEpubBuffer({ title, htmlContent, author = 'GranthAstraX Publisher' }) {
  const zip = new AdmZip();
  const bookId = crypto.randomUUID();
  const dateStr = new Date().toISOString().replace(/\.[0-9]+Z$/, 'Z');

  // 1. mimetype (Must be first, stored uncompressed)
  zip.addFile('mimetype', Buffer.from('application/epub+zip', 'utf-8'), '', 0);

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.addFile('META-INF/container.xml', Buffer.from(containerXml, 'utf-8'));

  // 3. OEBPS/style.css
  const css = `
body {
  font-family: Georgia, 'Times New Roman', serif;
  line-height: 1.6;
  margin: 5%;
  color: #1a1a1a;
}
h1, h2, h3, h4 {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
p { margin-bottom: 1em; text-indent: 1.2em; }
p:first-of-type { text-indent: 0; }
pre, code { font-family: monospace; background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1em; color: #555; }
`;
  zip.addFile('OEBPS/style.css', Buffer.from(css, 'utf-8'));

  // Clean HTML to valid XHTML
  const cleanBody = htmlContent
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<hr\s*\/?>/gi, '<hr/>')
    .replace(/<br\s*\/?>/gi, '<br/>')
    .replace(/<img([^>]*)(?<!\/)>/gi, '<img$1/>');

  // 4. OEBPS/chapter1.xhtml
  const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8" />
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <h1>${escapeXml(title)}</h1>
  ${cleanBody}
</body>
</html>`;
  zip.addFile('OEBPS/chapter1.xhtml', Buffer.from(chapterXhtml, 'utf-8'));

  // 5. OEBPS/nav.xhtml
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="utf-8" />
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="chapter1.xhtml">${escapeXml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`;
  zip.addFile('OEBPS/nav.xhtml', Buffer.from(navXhtml, 'utf-8'));

  // 6. OEBPS/content.opf
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">urn:uuid:${bookId}</dc:identifier>
    <meta property="dcterms:modified">${dateStr}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="nav"/>
    <itemref idref="chapter1"/>
  </spine>
</package>`;
  zip.addFile('OEBPS/content.opf', Buffer.from(opf, 'utf-8'));

  return zip.toBuffer();
}

// ── Standalone HTML Wrapper ─────────────────────────────────────────────────
function wrapStandaloneHtml(bodyHtml, title = 'GranthAstraX Document') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0c10;
      --card-bg: #14161d;
      --text: #e6e8ee;
      --text-muted: #9ba1b0;
      --gold: #d4af37;
      --border: #232733;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8f9fa;
        --card-bg: #ffffff;
        --text: #1a1a1a;
        --text-muted: #666666;
        --gold: #b38f2a;
        --border: #e2e4e9;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px 20px;
      background: var(--bg);
      color: var(--text);
      font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.7;
    }
    .doc-container {
      max-width: 840px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 48px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    h1, h2, h3, h4 {
      font-family: 'Montserrat', sans-serif;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    h1 { font-size: 2.2rem; border-bottom: 2px solid var(--gold); padding-bottom: 12px; margin-top: 0; }
    h2 { font-size: 1.6rem; margin-top: 32px; }
    h3 { font-size: 1.25rem; margin-top: 24px; }
    p { margin-bottom: 1.4em; }
    pre, code { font-family: monospace; background: var(--border); padding: 3px 6px; border-radius: 4px; font-size: 0.9em; }
    blockquote { border-left: 3px solid var(--gold); margin: 20px 0; padding-left: 16px; color: var(--text-muted); font-style: italic; }
    ul, ol { padding-left: 24px; margin-bottom: 1.4em; }
    li { margin-bottom: 6px; }
    @media print {
      body { background: white; color: black; padding: 0; }
      .doc-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

// ── HTML → PDF via Puppeteer ────────────────────────────────────────────────
async function htmlToPdf(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(wrapStandaloneHtml(htmlContent), { waitUntil: 'networkidle0' });
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

// ── PDF compression ──────────────────────────────────────────────────────────
async function compressPdf(buffer) {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
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
    const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const baseId = crypto.randomUUID();
    let processedBuffer = req.file.buffer;
    let outputExt = ext;
    let steps = [];

    // ── Intermediate extraction (to HTML and raw text) ───────────────────────
    let intermediateHtml = '';
    let intermediateText = '';

    if (ext === 'docx') {
      const htmlResult = await mammoth.convertToHtml({ buffer: processedBuffer });
      intermediateHtml = htmlResult.value;
      const textResult = await mammoth.extractRawText({ buffer: processedBuffer });
      intermediateText = textResult.value;
      steps.push('Parsed DOCX structure & styles');
    } else if (ext === 'pdf') {
      const pdfData = await pdfToHtmlAndText(processedBuffer);
      intermediateText = pdfData.text;
      intermediateHtml = pdfData.html;
      steps.push('Extracted PDF text & structure');
    } else if (ext === 'md' || ext === 'markdown') {
      intermediateText = processedBuffer.toString('utf-8');
      intermediateHtml = marked.parse(intermediateText);
      steps.push('Compiled Markdown to Semantic HTML');
    } else if (ext === 'html' || ext === 'htm') {
      intermediateHtml = processedBuffer.toString('utf-8');
      const td = new TurndownService();
      intermediateText = td.turndown(intermediateHtml).replace(/[#*`_]/g, '');
      steps.push('Parsed HTML DOM');
    } else if (ext === 'tex' || ext === 'latex') {
      const texStr = processedBuffer.toString('utf-8');
      intermediateHtml = latexToHtml(texStr);
      intermediateText = intermediateHtml.replace(/<[^>]+>/g, '');
      steps.push('Parsed LaTeX environments & math');
    } else if (ext === 'txt' || ext === 'rtf') {
      let raw = processedBuffer.toString('utf-8');
      if (ext === 'rtf') {
        // Simple RTF unescape
        raw = raw.replace(/\{\\[\s\S]*?\}|\\([a-z]{1,32})(-?\d+)? ?|\\'[0-9a-f]{2}/gi, '').trim();
      }
      intermediateText = raw;
      const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      intermediateHtml = escaped.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n');
      steps.push(`Normalized ${ext.toUpperCase()} text flow`);
    } else {
      return res.status(400).json({ error: `Unsupported input format: .${ext}` });
    }

    // ── Step 1: Target Conversion ────────────────────────────────────────────
    if (convertEnabled === 'true') {
      const target = (targetFormat || 'pdf').toLowerCase();

      if (target === 'pdf') {
        if (ext === 'pdf') {
          outputExt = 'pdf';
          steps.push('Convert: PDF retained');
        } else {
          processedBuffer = await htmlToPdf(intermediateHtml);
          outputExt = 'pdf';
          steps.push(`Convert: ${ext.toUpperCase()} → Vector PDF`);
        }
      } else if (target === 'docx') {
        if (ext === 'docx') {
          outputExt = 'docx';
          steps.push('Convert: DOCX retained');
        } else {
          processedBuffer = await buildDocxBuffer({ title: baseName, htmlContent: intermediateHtml });
          outputExt = 'docx';
          steps.push(`Convert: ${ext.toUpperCase()} → Microsoft Word (.docx)`);
        }
      } else if (target === 'epub') {
        processedBuffer = buildEpubBuffer({ title: baseName, htmlContent: intermediateHtml });
        outputExt = 'epub';
        steps.push(`Convert: ${ext.toUpperCase()} → Reflowable EPUB 3.0`);
      } else if (target === 'html') {
        const fullHtml = wrapStandaloneHtml(intermediateHtml, baseName);
        processedBuffer = Buffer.from(fullHtml, 'utf-8');
        outputExt = 'html';
        steps.push(`Convert: ${ext.toUpperCase()} → Responsive HTML`);
      } else if (target === 'md') {
        const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
        const mdText = td.turndown(intermediateHtml);
        processedBuffer = Buffer.from(mdText, 'utf-8');
        outputExt = 'md';
        steps.push(`Convert: ${ext.toUpperCase()} → GitHub Markdown (.md)`);
      } else if (target === 'txt') {
        processedBuffer = Buffer.from(intermediateText, 'utf-8');
        outputExt = 'txt';
        steps.push(`Convert: ${ext.toUpperCase()} → Plain Text (.txt)`);
      } else {
        return res.status(400).json({ error: `Target format .${target} is not supported.` });
      }
    }

    // ── Step 2: Compress (PDF output only) ───────────────────────────────────
    if (compressEnabled === 'true') {
      if (outputExt === 'pdf') {
        processedBuffer = await compressPdf(processedBuffer);
        steps.push('Compress: Optimized streams & deduplicated fonts');
      } else {
        steps.push('Compress: Skipped (applies to PDF output)');
      }
    }

    // ── Step 3: Expand for print (embed DPI metadata) ────────────────────────
    if (expandEnabled === 'true') {
      if (outputExt === 'pdf') {
        const pdfDoc = await PDFDocument.load(processedBuffer);
        pdfDoc.setSubject(`Print Intent: ${dpi || 300} DPI`);
        processedBuffer = Buffer.from(await pdfDoc.save());
        steps.push(`Expand: Print intent embedded at ${dpi || 300} DPI`);
      } else {
        steps.push('Expand: Skipped (applies to PDF output)');
      }
    }

    // ── Save to disk (5 min TTL) ─────────────────────────────────────────────
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
