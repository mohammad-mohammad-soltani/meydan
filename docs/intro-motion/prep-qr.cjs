// Generates qr.json (module matrices) from qr-targets.json.
// Usage: QRLIB=/path/to/qrcode-generator/qrcode.js node prep-qr.cjs   (npm i --no-save qrcode-generator)
const fs = require('fs'), path = require('path');
const qrcode = require(process.env.QRLIB || 'qrcode-generator');
const targets = JSON.parse(fs.readFileSync(path.join(__dirname, 'qr-targets.json'), 'utf8'));
const out = {};
for (const [k, url] of Object.entries(targets)) {
  const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
  const n = qr.getModuleCount();
  out[k] = { url, n, rows: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (qr.isDark(r, c) ? '1' : '0')).join('')) };
}
fs.writeFileSync(path.join(__dirname, 'qr.json'), JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.n}x${v.n} ${v.url}`).join('\n'));
