// Isolated Next server + fixture API: never changes a running app or real content.
// Run: node tests/content-banners.browser.mjs (CHROMIUM_PATH optional).
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, cp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = process.cwd();
const dir = await mkdtemp(path.join(tmpdir(), 'meydan-banners-'));
const svg = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="600"><rect width="100%" height="100%" fill="#ffc21c"/><text x="50%" y="50%" text-anchor="middle" font-size="80">BANNER</text></svg>');
const row = (id, enabled = true) => ({ id, media_id: 1, image_url: id === 'one' ? svg.replace('width%3D%221080%22', 'width%3D%22600%22') : id === 'two' ? svg.replace('height%3D%22600%22', 'height%3D%221400%22') : svg, title: `بنر ${id}`, href: `/content?banner=${id}`, enabled });
let banners = [row('one'), row('two'), row('three', false)];
let failPublic = false;
let failSave = false;
let lastSave;
const api = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/me') return res.end(JSON.stringify({ data: { id: 1, role: 'administrator', roles: ['administrator'], display_name: 'مدیر' } }));
  if (url.pathname === '/content/banners') {
    if (failPublic) { res.statusCode = 503; return res.end(JSON.stringify({ error: { message: 'unavailable' } })); }
    return res.end(JSON.stringify({ data: banners.filter(b => b.enabled) }));
  }
  if (url.pathname === '/admin/content/banners') {
    if (req.method === 'PUT') {
      let body = ''; for await (const part of req) body += part;
      lastSave = JSON.parse(body);
      if (failSave) { res.statusCode = 422; return res.end(JSON.stringify({ error: { code: 'validation_failed', message: 'لینک را اصلاح کنید.', fields: { 'banners.0.href': 'invalid' } } })); }
      banners = lastSave.banners.map(b => ({ ...b, image_url: svg }));
    }
    return res.end(JSON.stringify({ data: banners }));
  }
  res.end(JSON.stringify({ data: [], meta: { next_cursor: null } }));
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const apiPort = api.address().port;
const portFinder = createServer();
await new Promise(resolve => portFinder.listen(0, '127.0.0.1', resolve));
const port = portFinder.address().port;
await new Promise(resolve => portFinder.close(resolve));
let server, browser;
let logs = '';
try {
  for (const name of ['app', 'components', 'features', 'lib', 'public', 'types', 'next.config.ts', 'tsconfig.json', 'package.json', 'postcss.config.mjs']) {
    try { await cp(path.join(root, name), path.join(dir, name), { recursive: true }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  // Webpack resolves symlinked dependencies correctly in an isolated temporary root.
  server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--port', String(port)], {
    cwd: dir, env: { ...process.env, MEYDAN_API_BASE_URL: `http://127.0.0.1:${apiPort}`, NEXT_PUBLIC_MEYDAN_API_BASE_URL: `http://127.0.0.1:${apiPort}`, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', c => { logs += c; }); server.stderr.on('data', c => { logs += c; });
  const base = `http://localhost:${port}`;
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(base + '/content', { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'isolated Next server ready');
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'meydan_access', value: 'local-test-only', url: base }]);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('https://**', route => route.abort());
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + '/content');
    const section = page.getByRole('region', { name: 'بنرهای محتوا' });
    await section.waitFor();
    assert.equal(await section.locator('a').count(), 2);
    const metrics = await section.evaluate(el => {
      const strip = el.firstElementChild, links = strip.querySelectorAll('a');
      const a = links[0].getBoundingClientRect(), b = links[1].getBoundingClientRect();
      return { imageFit: getComputedStyle(links[0].querySelector("img")).objectFit, direction: getComputedStyle(strip).direction, snap: getComputedStyle(strip).scrollSnapType, ratio: a.width/a.height, peek: b.right > strip.getBoundingClientRect().left, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.equal(metrics.imageFit, 'cover', 'Square and portrait uploads must fill the banner without letterboxing');
    assert.equal(metrics.direction, 'rtl'); assert.equal(metrics.snap, 'x mandatory');
    assert.ok(Math.abs(metrics.ratio - 1.8) < .02); assert.ok(metrics.peek); assert.ok(!metrics.overflow);
    await section.locator('a').first().focus(); await page.keyboard.press('Tab');
    assert.equal(await section.locator('a').nth(1).evaluate(el => el === document.activeElement), true);
    await section.locator('a').nth(1).click(); await page.waitForURL('**/content?banner=two');
    await page.screenshot({ path: path.join(root, `test-results/content-banners-${width}.png`) });
  }
  banners = [row('single')]; await page.goto(base + '/content');
  assert.equal(await page.getByRole('region', { name: 'بنرهای محتوا' }).locator('a').count(), 1);
  banners = []; await page.goto(base + '/content');
  assert.equal(await page.getByRole('region', { name: 'بنرهای محتوا' }).count(), 0);
  failPublic = true; await page.goto(base + '/content');
  assert.equal(await page.getByRole('region', { name: 'بنرهای محتوا' }).count(), 0);
  await page.getByRole('heading', { name: 'کلام و یادداشت' }).waitFor(); failPublic = false;
  banners = [row('one'), row('two')];
  await page.goto(base + '/admin/content/banners');
  await page.getByRole('heading', { name: 'بنرها', exact: true }).waitFor();
  await page.getByRole('button', { name: 'انتقال بنر 2 به بالا', exact: true }).click();
  await page.getByLabel('عنوان بنر', { exact: true }).first().fill('ویرایش بنر');
  await page.getByLabel('نمایش بنر در صفحه محتوا').first().uncheck();
  await page.getByRole('button', { name: 'ذخیره بنرها', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'بنرها ذخیره شدند.' }).waitFor();
  assert.deepEqual(lastSave.banners.map(b => b.id), ['two', 'one']);
  assert.equal(lastSave.banners[0].enabled, false); assert.equal(lastSave.banners[0].title, 'ویرایش بنر');
  failSave = true;
  await page.getByLabel('لینک مقصد', { exact: true }).first().fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'ذخیره بنرها', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'لینک را اصلاح کنید.' }).waitFor();
  assert.equal(await page.getByLabel('لینک مقصد', { exact: true }).first().inputValue(), 'javascript:alert(1)');
  failSave = false;
  await page.getByRole('button', { name: 'حذف بنر 1', exact: true }).click();
  await page.getByRole('button', { name: 'حذف بنر 1', exact: true }).click();
  await page.getByRole('button', { name: 'ذخیره بنرها', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'بنرها ذخیره شدند.' }).waitFor();
  assert.deepEqual(lastSave.banners, []);
  await page.getByRole('button', { name: 'افزودن بنر', exact: true }).click();
  await page.getByLabel('عنوان بنر', { exact: true }).fill('بنر جدید');
  await page.getByLabel('لینک مقصد', { exact: true }).fill('/content');
  await page.getByText('استفاده از شناسهٔ رسانهٔ موجود').click();
  await page.getByRole('spinbutton').fill('1');
  await page.getByRole('button', { name: 'ذخیره بنرها', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'بنرها ذخیره شدند.' }).waitFor();
  assert.equal(lastSave.banners.length, 1); assert.ok(lastSave.banners[0].id);
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('PASS: responsive RTL carousel, navigation, empty/error states, admin add/edit/order/toggle/delete/save and validation.');
} catch (error) { console.error(logs.slice(-6000)); throw error; }
finally {
  if (browser) await browser.close();
  if (server) { server.kill('SIGTERM'); await new Promise(resolve => { server.once('exit', resolve); setTimeout(resolve, 5000); }); }
  await new Promise(resolve => api.close(resolve));
  await rm(dir, { recursive: true, force: true });
}
