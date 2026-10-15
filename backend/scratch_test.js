const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getTectonicBinary } = require('./tectonicManager');

async function test() {
  const tmpDir = path.join(os.tmpdir(), 'test_latex_' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  const tex = '\\documentclass{article}\\begin{document}Hello GranthAstraX! LaTeX compilation works!\\end{document}';
  fs.writeFileSync(path.join(tmpDir, 'document.tex'), tex);

  const bin = await getTectonicBinary();
  console.log('Using binary:', bin);
  execSync(`${bin} --chatter minimal document.tex`, { cwd: tmpDir, stdio: 'inherit' });

  const pdfPath = path.join(tmpDir, 'document.pdf');
  const exists = fs.existsSync(pdfPath);
  console.log('RESULT: document.pdf generated:', exists, 'size:', exists ? fs.statSync(pdfPath).size : 0);
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

test().catch(console.error);
