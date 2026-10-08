const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const [,, html, out, fpsArg] = process.argv;
const FPS = +(fpsArg || 30);
(async () => {
  const local = path.join(path.dirname(out), 'local-export.html');
  fs.writeFileSync(local, '<!doctype html><html><head><meta charset="utf-8"></head><body>' + fs.readFileSync(html, 'utf8') + '</body></html>');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const page = await browser.newPage({ viewport: { width: 1300, height: 1000 } });
  page.on('pageerror', e => console.error('pageerror', e));
  await page.route('**/d3.min.js', r => r.fulfill({ path: process.env.D3, contentType: 'application/javascript' }));
  await page.goto('file://' + local);
  await page.evaluate(() => window.NM.ready);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const DUR = await page.evaluate(() => window.NM.DUR);
  const N = Math.round(DUR * FPS), t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const b64 = await page.evaluate(t => { window.NM.renderAt(t); return window.NM.canvas.toDataURL('image/jpeg', 0.95).split(',')[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
