const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');

// ── GSM → spine thickness per SHEET (both pages) in mm ──────────────────────
const GSM_THICKNESS = { 50: 0.05, 70: 0.075, 80: 0.09, 100: 0.11, 120: 0.13 };
const MM_TO_PT = 2.8346;

function calcSpine(pageCount, gsm, coverType) {
  const sheetCount = Math.ceil(pageCount / 2);
  const thickness = GSM_THICKNESS[gsm] ?? 0.09;
  let spineWidth = sheetCount * thickness;
  if (coverType === 'hardcover') spineWidth += 6;
  return Math.max(spineWidth, 3); // minimum 3mm
}

// ── POST /api/writer-desk/template ──────────────────────────────────────────
router.post('/template', async (req, res) => {
  try {
    const {
      trimWidth,    // mm
      trimHeight,   // mm
      pageCount,
      paperGSM,
      coverType,
      bookTitle,
      authorName
    } = req.body;

    const w = parseFloat(trimWidth);
    const h = parseFloat(trimHeight);
    const gsm = parseInt(paperGSM, 10);
    const pages = parseInt(pageCount, 10);
    const bleed = 3; // mm
    const safe = 5;  // mm inside trim

    const spineW = calcSpine(pages, gsm, coverType);

    // ── Full cover dimensions ──────────────────────────────────────────────
    const totalW = bleed + w + spineW + w + bleed; // mm
    const totalH = bleed + h + bleed;              // mm

    // Convert to points
    const toPt = (mm) => mm * MM_TO_PT;

    const doc = new PDFDocument({
      size: [toPt(totalW), toPt(totalH)],
      margin: 0,
      info: {
        Title: `Cover Template — ${bookTitle || 'My Book'}`,
        Author: 'GranthAstraX Writer Desk',
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cover-template.pdf"`);
    doc.pipe(res);

    // ── Background: light grey ─────────────────────────────────────────────
    doc.rect(0, 0, toPt(totalW), toPt(totalH)).fill('#f5f5f5');

    // ── Bleed zone outline (red dashed) ───────────────────────────────────
    doc.rect(0, 0, toPt(totalW), toPt(totalH))
      .dash(4, { space: 4 })
      .strokeColor('#ff0000').lineWidth(0.5).stroke().undash();

    // ── Back cover zone ────────────────────────────────────────────────────
    const backX = toPt(bleed);
    const coverY = toPt(bleed);
    const coverH = toPt(h);
    const coverW = toPt(w);
    const spineX = toPt(bleed + w);
    const frontX = toPt(bleed + w + spineW);

    // Back cover — white
    doc.rect(backX, coverY, coverW, coverH).fill('#ffffff').stroke();

    // Safe zone — back cover
    doc.rect(backX + toPt(safe), coverY + toPt(safe), coverW - toPt(safe * 2), coverH - toPt(safe * 2))
      .dash(3, { space: 3 })
      .strokeColor('#00aa44').lineWidth(0.5).stroke().undash();

    // ── Spine zone ────────────────────────────────────────────────────────
    doc.rect(spineX, coverY, toPt(spineW), coverH).fill('#e8e8e8').stroke();

    // ── Front cover zone ──────────────────────────────────────────────────
    doc.rect(frontX, coverY, coverW, coverH).fill('#ffffff').stroke();

    // Safe zone — front cover
    doc.rect(frontX + toPt(safe), coverY + toPt(safe), coverW - toPt(safe * 2), coverH - toPt(safe * 2))
      .dash(3, { space: 3 })
      .strokeColor('#00aa44').lineWidth(0.5).stroke().undash();

    // ── Labels ────────────────────────────────────────────────────────────
    doc.fillColor('#999999').fontSize(9).font('Helvetica');

    // Back cover label
    doc.text('BACK COVER', backX + toPt(5), coverY + toPt(5), { width: coverW - toPt(10), align: 'center' });
    doc.text(`${w.toFixed(1)} × ${h.toFixed(1)} mm`, backX + toPt(5), coverY + toPt(15), { width: coverW - toPt(10), align: 'center' });

    // Spine label (rotated)
    doc.save();
    doc.translate(spineX + toPt(spineW / 2), coverY + coverH / 2);
    doc.rotate(-90);
    doc.fillColor('#666666').fontSize(7).text(`SPINE  ${spineW.toFixed(1)} mm`, -60, -4, { width: 120, align: 'center' });
    doc.restore();

    // Front cover label
    doc.fillColor('#999999').fontSize(9).font('Helvetica');
    doc.text('FRONT COVER', frontX + toPt(5), coverY + toPt(5), { width: coverW - toPt(10), align: 'center' });
    doc.text(`${w.toFixed(1)} × ${h.toFixed(1)} mm`, frontX + toPt(5), coverY + toPt(15), { width: coverW - toPt(10), align: 'center' });

    // Book title hint on front
    if (bookTitle) {
      doc.fillColor('#cccccc').fontSize(18).font('Helvetica-Bold');
      doc.text(bookTitle, frontX + toPt(10), coverY + coverH / 2 - 20, { width: coverW - toPt(20), align: 'center' });
    }
    if (authorName) {
      doc.fillColor('#cccccc').fontSize(12).font('Helvetica');
      doc.text(authorName, frontX + toPt(10), coverY + coverH / 2 + 10, { width: coverW - toPt(20), align: 'center' });
    }

    // ── Legend box ────────────────────────────────────────────────────────
    const legX = toPt(2), legY = toPt(2);
    doc.fillColor('#333333').fontSize(6.5).font('Helvetica');
    doc.rect(legX, legY, 120, 44).fill('#ffffffbb');
    doc.fillColor('#333333').text('LEGEND', legX + 4, legY + 4);
    doc.moveTo(legX + 4, legY + 14).lineTo(legX + 22, legY + 14).dash(2, { space: 2 }).strokeColor('#ff0000').stroke().undash();
    doc.fillColor('#555555').text('Bleed line (3mm) — extend design to here', legX + 26, legY + 11);
    doc.moveTo(legX + 4, legY + 24).lineTo(legX + 22, legY + 24).dash(2, { space: 2 }).strokeColor('#00aa44').stroke().undash();
    doc.fillColor('#555555').text('Safe zone (5mm) — keep text inside here', legX + 26, legY + 21);
    doc.fillColor('#555555').text(`Spine: ${spineW.toFixed(2)} mm  ·  GSM: ${gsm}  ·  Pages: ${pages}  ·  Cover: ${coverType}`, legX + 4, legY + 33);

    // ── Dimensions line (bottom) ──────────────────────────────────────────
    doc.fillColor('#aaaaaa').fontSize(7);
    doc.text(
      `Total bleed area: ${totalW.toFixed(1)} × ${totalH.toFixed(1)} mm   |   Trim: ${(totalW - bleed * 2).toFixed(1)} × ${(totalH - bleed * 2).toFixed(1)} mm`,
      toPt(bleed), toPt(totalH - 5), { width: toPt(totalW - bleed * 2), align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('Writer Desk template error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ── POST /api/writer-desk/barcode ────────────────────────────────────────────
router.post('/barcode', async (req, res) => {
  try {
    const { isbn, price, currency } = req.body;

    if (!isbn || isbn.replace(/-/g, '').length < 10) {
      return res.status(400).json({ error: 'Invalid ISBN. Must be 10 or 13 digits.' });
    }

    const cleanIsbn = isbn.replace(/-/g, '').replace(/\s/g, '');

    // Build barcode text — price add-on is a 5-digit UPC supplement
    let barcodeText = cleanIsbn;
    let addon = '';
    if (price) {
      const priceNum = parseFloat(price);
      if (!isNaN(priceNum)) {
        // Encode price: 5-digit supplement (9XXXX = price in local currency cents)
        // Standard: 90000 = no price, 9XXXX = price in USD cents, etc.
        const encoded = Math.min(99999, Math.round(priceNum * 100));
        addon = String(encoded).padStart(5, '0');
      }
    }

    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'isbn',
      text: barcodeText,
      scale: 4,
      height: 30,
      includetext: true,
      textxalign: 'center',
      paddingwidth: 10,
      paddingheight: 10,
      backgroundcolor: 'ffffff',
      ...(addon ? { addontextxalign: 'center', addon } : {}),
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="isbn-barcode.png"`);
    res.send(pngBuffer);
  } catch (err) {
    console.error('Writer Desk barcode error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ── GET /api/writer-desk/spine ───────────────────────────────────────────────
router.get('/spine', (req, res) => {
  const { pageCount, gsm, coverType } = req.query;
  const spine = calcSpine(parseInt(pageCount, 10), parseInt(gsm, 10), coverType);
  res.json({ spineWidth: parseFloat(spine.toFixed(2)) });
});

module.exports = router;
