const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');

const BIN_DIR = path.join(__dirname, 'bin');
const TECTONIC_BIN = path.join(BIN_DIR, process.platform === 'win32' ? 'tectonic.exe' : 'tectonic');

function isSystemTectonicAvailable() {
  try {
    const cmd = process.platform === 'win32' ? 'tectonic.exe --version' : 'tectonic --version';
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

let downloadPromise = null;

async function getTectonicBinary() {
  if (isSystemTectonicAvailable()) {
    return process.platform === 'win32' ? 'tectonic.exe' : 'tectonic';
  }

  if (fs.existsSync(TECTONIC_BIN)) {
    return `"${TECTONIC_BIN}"`;
  }

  if (downloadPromise) return downloadPromise;

  downloadPromise = (async () => {
    console.log('[Tectonic] No system Tectonic installation found. Automatically downloading standalone binary...');
    if (!fs.existsSync(BIN_DIR)) {
      fs.mkdirSync(BIN_DIR, { recursive: true });
    }

    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    let url;
    if (isWin) {
      url = 'https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-pc-windows-msvc.zip';
    } else if (isMac) {
      url = 'https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-apple-darwin.tar.gz';
    } else {
      url = 'https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-musl.tar.gz';
    }

    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);

    if (isWin) {
      const zip = new AdmZip(buffer);
      zip.extractEntryTo('tectonic.exe', BIN_DIR, false, true);
    } else {
      const tarPath = path.join(BIN_DIR, 'tectonic.tar.gz');
      fs.writeFileSync(tarPath, buffer);
      execSync(`tar -xzf "${tarPath}" -C "${BIN_DIR}"`);
      try { fs.unlinkSync(tarPath); } catch {}
      fs.chmodSync(TECTONIC_BIN, 0o755);
    }

    console.log('[Tectonic] Standalone binary installed successfully at:', TECTONIC_BIN);
    return `"${TECTONIC_BIN}"`;
  })();

  try {
    const result = await downloadPromise;
    return result;
  } finally {
    downloadPromise = null;
  }
}

module.exports = { getTectonicBinary, isSystemTectonicAvailable };
