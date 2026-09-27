// Renders public/icons/*.svg to PNG at PWA sizes using Playwright's Chromium.
// Usage: node scripts/render-icons.mjs   (requires playwright-core available via PW_MODULE or node_modules)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pw = require(process.env.PW_MODULE ?? 'playwright-core');
const exe = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

const jobs = [
  { svg: 'icon.svg', out: 'icon-192.png', size: 192 },
  { svg: 'icon.svg', out: 'icon-512.png', size: 512 },
  { svg: 'icon.svg', out: 'apple-touch-icon.png', size: 180 },
  { svg: 'icon-maskable.svg', out: 'icon-512-maskable.png', size: 512 },
];

const browser = await pw.chromium.launch({ executablePath: exe });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const j of jobs) {
  const svg = readFileSync(resolve('public/icons', j.svg), 'utf8');
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${j.size}" height="${j.size}"`)}</body></html>`);
  const buf = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: j.size, height: j.size } });
  writeFileSync(resolve('public/icons', j.out), buf);
  console.log('wrote', j.out);
}
await browser.close();
