const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

const exportCode = `const AdmZip = require('adm-zip');

app.post('/api/compile/export', async (req, res) => {
  try {
    const { content, images = [] } = req.body;
    const zip = new AdmZip();
    zip.addFile('main.tex', Buffer.from(content || '', 'utf8'));
    const regex = /\\\\includegraphics(?:\\[.*?\\])?\\{(.*?)\\}/g;
    const imagesToFetch = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      const url = match[1];
      const projectImg = images.find(img => img.name === url);
      if (projectImg && projectImg.url) {
        imagesToFetch.push({ name: url, url: projectImg.url });
      }
    }
    await Promise.all(imagesToFetch.map(async (img) => {
      try {
        const axios = require('axios');
        const response = await axios.get(img.url, { responseType: 'arraybuffer' });
        zip.addFile(img.name, Buffer.from(response.data));
      } catch (err) {
        console.error('Failed to fetch image for ZIP:', img.url);
      }
    }));
    const zipBuffer = zip.toBuffer();
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=project.zip');
    res.send(zipBuffer);
  } catch (error) {
    console.error('ZIP Export Error:', error);
    res.status(500).json({ error: 'Failed to create ZIP export.' });
  }
});

// Compile LaTeX to PDF using public texlive.net API`;

c = c.replace('// Compile LaTeX to PDF using public texlive.net API', exportCode);
fs.writeFileSync('server.js', c);
console.log('Patched');
