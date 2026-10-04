import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// The supplied document is a browser-only reference, never an app dependency.
const referenceUrl = process.env.MEYDAN_REFERENCE_URL;
if (!referenceUrl) throw new Error('Set MEYDAN_REFERENCE_URL to the served reference HTML URL.');
const origin = process.env.MEYDAN_PREVIEW_ORIGIN || 'http://127.0.0.1:3100';
const output = path.resolve(process.env.MEYDAN_PARITY_OUTPUT || 'docs/reference-parity/artifacts');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.MEYDAN_CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const viewports = [[390,844],[430,932],[768,1024],[1280,800],[1440,900]];
const results = [];
try {
  for (const kind of ['reference', 'app']) {
    const page = await browser.newPage({ viewport: { width:1440, height:900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(kind === 'reference' ? referenceUrl : `${origin}/home`);
    for (const [theme, label] of [['light','روز'],['dark','شب'],['black',kind === 'reference' ? 'تیره' : 'آمولد']]) {
      await page.setViewportSize({width:1440,height:900});
      await page.getByRole('radio', { name:label, exact:true }).click();
      await page.waitForTimeout(350);
      for (const [width,height] of viewports) {
        await page.setViewportSize({ width,height });
        await page.waitForTimeout(350);
        const computed = await page.evaluate(kind => {
          const center = document.querySelector(kind === 'reference' ? '.max-w-7xl.mx-auto > div.max-w-xl' : '#mainAppShell');
          const shell = center.parentElement;
          const rect = element => {
            if (!element) return null;
            const bounds = element.getBoundingClientRect();
            const css = getComputedStyle(element);
            return { x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,
              background:css.backgroundColor,color:css.color,border:css.borderColor,
              padding:css.padding,radius:css.borderRadius,shadow:css.boxShadow,blur:css.backdropFilter };
          };
          const palette = {};
          const probe = document.createElement('span');
          document.body.append(probe);
          for (const token of ['bg','soft','line','tx','mu','glass']) {
            probe.style.backgroundColor = `var(--m-${token})`;
            palette[token] = getComputedStyle(probe).backgroundColor;
          }
          probe.remove();
          const navigation = [...shell.children].find(element => element.tagName === 'ASIDE');
          const trends = [...shell.children].filter(element => element.tagName === 'ASIDE').at(-1);
          return { palette,center:rect(center),navigation:rect(navigation),trends:rect(trends),
            bottom:rect(document.querySelector(kind === 'reference' ? 'nav.fixed.bottom-0' : '#bottomNavBar')),
            header:rect(center.querySelector('header.sticky')),
            documentWidth:document.documentElement.clientWidth,bodyWidth:document.body.scrollWidth,
            font:getComputedStyle(center).fontFamily };
        }, kind);
        const filename = `${kind}-home-${theme}-${width}x${height}.png`;
        await page.screenshot({ path:path.join(output,filename) });
        results.push({ kind,theme,width,height,filename,computed,errors:[...errors] });
      }
    }
    await page.close();
  }
  const comparisons = results.filter(item => item.kind === 'app').map(app => {
    const reference = results.find(item => item.kind === 'reference' && item.theme === app.theme && item.width === app.width);
    const palette = Object.fromEntries(Object.keys(app.computed.palette).map(key => [key, {
      reference:reference.computed.palette[key],app:app.computed.palette[key],equal:reference.computed.palette[key] === app.computed.palette[key],
    }]));
    const geometry = Object.fromEntries(['center','navigation','trends'].map(key => [key, {
      reference:reference.computed[key],app:app.computed[key],
      horizontalEqual:['x','width'].every(field => Math.abs(reference.computed[key][field] - app.computed[key][field]) < .1),
    }]));
    return { theme:app.theme,width:app.width,height:app.height,palette,geometry };
  });
  await writeFile(path.join(output,'computed-comparison.json'),JSON.stringify({results,comparisons},null,2));
  console.log(JSON.stringify(comparisons.map(item => ({theme:item.theme,width:item.width,
    palette:Object.values(item.palette).every(value => value.equal),
    columns:Object.values(item.geometry).every(value => value.horizontalEqual)})),null,2));
} finally { await browser.close(); }
