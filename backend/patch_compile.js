const fs = require('fs');

let c = fs.readFileSync('server.js', 'utf8');

const compileLogic = `// Compile LaTeX to PDF locally using child_process
app.post('/api/compile', requireAuth, async (req, res) => {
  const os = require('os');
  const path = require('path');
  const { execSync } = require('child_process');
  const crypto = require('crypto');

  let tmpDir;
  try {
    let { content, engine = 'pdflatex', images = [] } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'LaTeX content is required' });
    }

    tmpDir = path.join(os.tmpdir(), 'latex_' + crypto.randomUUID());
    fs.mkdirSync(tmpDir, { recursive: true });

    // Auto-fix common syntax errors from frontend editors
    content = content.replace(/\\\\usepackage\\s*(?:\\[[^\\]]*\\])?\\s*\\{\\s*\\}/g, ''); // empty {}
    content = content.replace(/\\\\usepackage\\s*\\[\\s*\\](?!\\s*\\{)/g, ''); // empty [] not followed by {

    const regex = /\\\\includegraphics(?:\\[.*?\\])?\\{([^}]+)\\}/g;
    const downloadedImages = new Map();
    let imageCounter = 0;

    const replaceAsync = async (str, regex, asyncFn) => {
      const promises = [];
      str.replace(regex, (match, ...args) => {
        promises.push(asyncFn(match, ...args));
        return match;
      });
      const data = await Promise.all(promises);
      return str.replace(regex, () => data.shift());
    };

    content = await replaceAsync(content, regex, async (match, url) => {
      const projectImg = images.find(img => img.name === url);
      let downloadUrl = projectImg ? projectImg.url : url;
      
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        try {
          if (!downloadedImages.has(downloadUrl)) {
            const { default: axios } = require('axios');
            const imgRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const urlParts = downloadUrl.split('?')[0].split('.');
            let ext = urlParts.length > 1 ? urlParts.pop() : 'png';
            if (ext.length > 4) ext = 'png'; 
            
            const filename = \`image_\${imageCounter++}.\${ext}\`;
            fs.writeFileSync(path.join(tmpDir, filename), Buffer.from(imgRes.data));
            downloadedImages.set(downloadUrl, { filename });
          }
          const localFile = downloadedImages.get(downloadUrl).filename;
          return match.replace(url, localFile);
        } catch (e) {
          console.error("Failed to download image:", downloadUrl);
          return match;
        }
      }
      return match;
    });

    const texPath = path.join(tmpDir, 'document.tex');
    fs.writeFileSync(texPath, content, 'utf8');

    // Compile
    try {
      execSync(\`\${engine} -interaction=nonstopmode -halt-on-error document.tex\`, { cwd: tmpDir, stdio: 'pipe' });
      // Run again to resolve references
      execSync(\`\${engine} -interaction=nonstopmode -halt-on-error document.tex\`, { cwd: tmpDir, stdio: 'pipe' });
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error(\`Command '\${engine}' not found. You MUST install MiKTeX (Windows) or TeX Live (Linux) on the server to use local compilation.\`);
      }
      const logOutput = err.stdout ? err.stdout.toString() : err.message;
      let cleanError = "Local Compilation failed.";
      const errorMatch = logOutput.match(/^!\\s+(.*?)\\n(.*?\\n.*?\\n)/m);
      if (errorMatch) {
         const errorType = errorMatch[1].trim();
         const errorDetails = errorMatch[2].replace(/<[^>]*>?/gm, '').replace(/\\n/g, ' ').trim();
         cleanError = \`LaTeX Error: \${errorType} \\nContext: \${errorDetails}\`;
      } else {
         const fallbackMatch = logOutput.match(/^!\\s+(.*?)\\n/m);
         if (fallbackMatch) {
            cleanError = \`LaTeX Error: \${fallbackMatch[1]}\`;
         } else {
            cleanError = logOutput.substring(0, 1000);
         }
      }
      return res.status(400).json({ error: 'Compilation failed', details: cleanError });
    }

    const pdfPath = path.join(tmpDir, 'document.pdf');
    if (fs.existsSync(pdfPath)) {
      const pdfData = fs.readFileSync(pdfPath);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="document.pdf"',
      });
      res.send(pdfData);
    } else {
      res.status(500).json({ error: 'PDF was not generated.' });
    }

  } catch (error) {
    console.error('Local Compilation error:', error);
    res.status(500).json({ error: 'Failed to compile LaTeX locally', details: error.message });
  } finally {
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup tmpDir:', e);
      }
    }
  }
});
`;

const startIndex = c.indexOf('// Compile LaTeX via texlive.net proxy');
const endIndex = c.indexOf('// Image Studio Routes');

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = c.substring(0, startIndex) + compileLogic + '\n' + c.substring(endIndex);
  fs.writeFileSync('server.js', newContent);
  console.log('Successfully replaced compile logic.');
} else {
  console.log('Could not find markers to replace logic.');
}
