/**
 * Auto-capture screenshots of key app screens for README.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://iron-week-pro.vercel.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const W = 414;
const H = 896;

// Bottom tabs centers (5 tabs at the bottom of the screen)
const TAB_Y = H - 50;
const tabX = (i) => Math.round((W / 5) * i + W / 10); // i=0..4

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
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  // ─── 1. Onboarding ───
  console.log('Capturing onboarding...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  await shot(page, '01-onboarding.png');

  // Pick PPL → click on the card
  await page.getByText('Push / Pull / Legs', { exact: true }).click();
  await page.waitForTimeout(1500);

  // Click COMMENCER
  await page.getByText(/COMMENCER/).click();
  await page.waitForTimeout(4500);

  // ─── 2. Today screen ───
  console.log('Capturing Today...');
  await shot(page, '02-today.png');

  // ─── 3. Programmes tab (tab index 1) ───
  console.log('Capturing Programmes...');
  await page.mouse.click(tabX(1), TAB_Y);
  await page.waitForTimeout(2500);
  await shot(page, '03-programmes.png');

  // ─── 4. Edit a program ───
  console.log('Capturing program edit...');
  const pushCard = page.getByText('Push (Pecs/').first();
  if (await pushCard.count()) {
    await pushCard.click({ force: true });
    await page.waitForTimeout(2500);
    await shot(page, '04-program-edit.png');
    // Go back to Programmes list via header back button (top-left)
    await page.mouse.click(20, 60);
    await page.waitForTimeout(1500);
  }

  // ─── 5. Exercices tab (index 2) ───
  console.log('Capturing Exercices...');
  await page.mouse.click(tabX(2), TAB_Y);
  await page.waitForTimeout(2500);
  await shot(page, '05-exercises.png');

  // First exercise detail
  console.log('Capturing exercise detail...');
  const dcBarre = page.getByText('Développé Couché Barre').first();
  if (await dcBarre.count()) {
    await dcBarre.click({ force: true });
    await page.waitForTimeout(2500);
    await shot(page, '06-exercise-detail.png', { fullPage: true });
    await page.mouse.click(20, 60); // back
    await page.waitForTimeout(1500);
  }

  // ─── 6. Stats tab (index 3) ───
  console.log('Capturing Stats...');
  await page.mouse.click(tabX(3), TAB_Y);
  await page.waitForTimeout(2500);
  await shot(page, '07-stats.png');

  // ─── 7. Réglages tab (index 4) ───
  console.log('Capturing Réglages...');
  await page.mouse.click(tabX(4), TAB_Y);
  await page.waitForTimeout(2500);
  await shot(page, '08-settings.png');

  await browser.close();
  console.log('Done.');
})();
