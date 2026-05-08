const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://iron-week-pro.vercel.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
const W = 414, H = 896;
const TAB_Y = H - 50;
const tabX = (i) => Math.round((W / 5) * i + W / 10);

async function shot(page, name, opts = {}) {
  const file = path.join(OUT, name);
  await page.waitForTimeout(opts.delay || 2000);
  await page.screenshot({ path: file, fullPage: !!opts.fullPage });
  console.log(`  ✓ ${name}`);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);

  // Skip onboarding (already onboarded → goes straight to home)
  // If onboarding shown (first run), bypass it
  const hasOnboarding = await page.getByText(/BIENVENUE/).count();
  if (hasOnboarding > 0) {
    await page.getByText('Push / Pull / Legs', { exact: true }).click();
    await page.waitForTimeout(1200);
    await page.getByText(/COMMENCER/).click();
    await page.waitForTimeout(4500);
  }

  // 06 — Exercise detail
  console.log('Capturing exercise detail...');
  await page.mouse.click(tabX(2), TAB_Y);
  await page.waitForTimeout(2500);
  // Click on first exercise card area instead of text (text matches multiple elements)
  // First exercise card is around y=170 (after header + search + filters)
  await page.mouse.click(W / 2, 220);
  await page.waitForTimeout(2500);
  await shot(page, '06-exercise-detail.png', { fullPage: true });

  // Back to home
  await page.mouse.click(tabX(0), TAB_Y);
  await page.waitForTimeout(1500);

  // 07 — Stats
  console.log('Capturing Stats...');
  await page.mouse.click(tabX(3), TAB_Y);
  await page.waitForTimeout(2500);
  await shot(page, '07-stats.png');

  // 08 — Réglages
  console.log('Capturing Réglages...');
  await page.mouse.click(tabX(4), TAB_Y);
  await page.waitForTimeout(2500);
  await shot(page, '08-settings.png');

  await browser.close();
  console.log('Done.');
})();
