/**
 * Iron Week Pro — Logo Generator
 * Generates: icon-1024.png, adaptive-icon-1024.png, splash-2048.png, favicon-48.png
 *
 * Concept: a bold orange barbell on a dark background, geometric and sporty.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// Brand colors
const BG = '#0a0a0f';
const ACCENT = '#ff4d1c';
const ACCENT_LIGHT = '#ff8c42';
const TEXT = '#e8e8f0';

/* ─────────────────── Icon (1024×1024) ─────────────────── */
// Square dark canvas with rounded corners, big orange barbell + bold IW monogram.

const iconSvg = (size, withRoundedCorners = false) => {
  const r = withRoundedCorners ? size * 0.22 : 0;
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 1024;

  // Barbell dimensions (centered)
  const barW = 640 * scale;
  const barH = 60 * scale;
  const plateW = 120 * scale;
  const plateH = 280 * scale;
  const collarW = 30 * scale;
  const collarH = 100 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="plateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ACCENT_LIGHT}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1a1a26"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  ${withRoundedCorners
    ? `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bgGrad)"/>`
    : `<rect width="${size}" height="${size}" fill="url(#bgGrad)"/>`}

  <!-- Decorative subtle ring -->
  <circle cx="${cx}" cy="${cy}" r="${size * 0.42}" fill="none" stroke="${ACCENT}" stroke-width="${4 * scale}" opacity="0.08"/>

  <!-- Barbell bar -->
  <rect x="${cx - barW / 2}" y="${cy - barH / 2}" width="${barW}" height="${barH}" fill="${TEXT}" rx="${barH / 2}"/>

  <!-- Inner collars -->
  <rect x="${cx - barW / 2 + plateW + 10 * scale}" y="${cy - collarH / 2}" width="${collarW}" height="${collarH}" fill="${TEXT}" rx="${4 * scale}"/>
  <rect x="${cx + barW / 2 - plateW - collarW - 10 * scale}" y="${cy - collarH / 2}" width="${collarW}" height="${collarH}" fill="${TEXT}" rx="${4 * scale}"/>

  <!-- Left plate -->
  <rect x="${cx - barW / 2}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#plateGrad)" rx="${20 * scale}"/>
  <!-- Right plate -->
  <rect x="${cx + barW / 2 - plateW}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#plateGrad)" rx="${20 * scale}"/>

  <!-- Plate inner highlights -->
  <rect x="${cx - barW / 2 + 16 * scale}" y="${cy - plateH / 2 + 16 * scale}" width="${10 * scale}" height="${plateH - 32 * scale}" fill="${ACCENT_LIGHT}" opacity="0.5"/>
  <rect x="${cx + barW / 2 - plateW + 16 * scale}" y="${cy - plateH / 2 + 16 * scale}" width="${10 * scale}" height="${plateH - 32 * scale}" fill="${ACCENT_LIGHT}" opacity="0.5"/>

  <!-- "IW" monogram — small, top-left corner -->
  <g transform="translate(${size * 0.10}, ${size * 0.12})">
    <text x="0" y="0"
      font-family="Impact, Bebas Neue, Arial Black, sans-serif"
      font-size="${size * 0.13}"
      font-weight="900"
      fill="${ACCENT}"
      letter-spacing="${size * 0.005}"
    >IW</text>
  </g>
</svg>`;
};

async function gen(name, size, withRounded = false) {
  const svg = iconSvg(size, withRounded);
  const outPath = path.join(ASSETS_DIR, name);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`  ✓ ${name} (${size}×${size})`);
}

/* ─────────────────── Splash (2048×2048) ─────────────────── */
const splashSvg = (size) => {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 2048;

  const barW = 1100 * scale;
  const barH = 90 * scale;
  const plateW = 200 * scale;
  const plateH = 480 * scale;
  const collarW = 50 * scale;
  const collarH = 170 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="plateGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ACCENT_LIGHT}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${BG}"/>

  <!-- Subtle radial glow -->
  <circle cx="${cx}" cy="${cy}" r="${size * 0.55}" fill="${ACCENT}" opacity="0.04"/>
  <circle cx="${cx}" cy="${cy}" r="${size * 0.35}" fill="${ACCENT}" opacity="0.06"/>

  <!-- Barbell -->
  <rect x="${cx - barW / 2}" y="${cy - barH / 2}" width="${barW}" height="${barH}" fill="${TEXT}" rx="${barH / 2}"/>
  <rect x="${cx - barW / 2 + plateW + 18 * scale}" y="${cy - collarH / 2}" width="${collarW}" height="${collarH}" fill="${TEXT}" rx="${6 * scale}"/>
  <rect x="${cx + barW / 2 - plateW - collarW - 18 * scale}" y="${cy - collarH / 2}" width="${collarW}" height="${collarH}" fill="${TEXT}" rx="${6 * scale}"/>
  <rect x="${cx - barW / 2}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#plateGrad2)" rx="${30 * scale}"/>
  <rect x="${cx + barW / 2 - plateW}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#plateGrad2)" rx="${30 * scale}"/>
  <rect x="${cx - barW / 2 + 30 * scale}" y="${cy - plateH / 2 + 30 * scale}" width="${20 * scale}" height="${plateH - 60 * scale}" fill="${ACCENT_LIGHT}" opacity="0.5"/>
  <rect x="${cx + barW / 2 - plateW + 30 * scale}" y="${cy - plateH / 2 + 30 * scale}" width="${20 * scale}" height="${plateH - 60 * scale}" fill="${ACCENT_LIGHT}" opacity="0.5"/>

  <!-- App name below -->
  <text x="${cx}" y="${cy + size * 0.30}"
    font-family="Impact, Bebas Neue, Arial Black, sans-serif"
    font-size="${size * 0.075}"
    font-weight="900"
    fill="${TEXT}"
    text-anchor="middle"
    letter-spacing="${size * 0.012}"
  >IRON WEEK</text>
  <text x="${cx}" y="${cy + size * 0.36}"
    font-family="Impact, Bebas Neue, Arial Black, sans-serif"
    font-size="${size * 0.030}"
    font-weight="900"
    fill="${ACCENT}"
    text-anchor="middle"
    letter-spacing="${size * 0.012}"
  >PRO</text>
</svg>`;
};

async function genSplash() {
  const svg = splashSvg(2048);
  const outPath = path.join(ASSETS_DIR, 'splash.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`  ✓ splash.png (2048×2048)`);
}

/* ─────────────────── Adaptive icon (1024×1024, transparent foreground) ─────────────────── */
const adaptiveFgSvg = (size) => {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 1024;
  // Adaptive icons need foreground to be on a 432dp safe zone, with full bleed of 108dp.
  // Render the barbell smaller to fit safely inside the safe zone.
  const barW = 480 * scale;
  const barH = 50 * scale;
  const plateW = 90 * scale;
  const plateH = 200 * scale;
  const collarW = 22 * scale;
  const collarH = 75 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="pl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ACCENT_LIGHT}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>
  <rect x="${cx - barW / 2}" y="${cy - barH / 2}" width="${barW}" height="${barH}" fill="${TEXT}" rx="${barH / 2}"/>
  <rect x="${cx - barW / 2 + plateW + 8 * scale}" y="${cy - collarH / 2}" width="${collarW}" height="${collarH}" fill="${TEXT}" rx="${3 * scale}"/>
  <rect x="${cx + barW / 2 - plateW - collarW - 8 * scale}" y="${cy - collarH / 2}" width="${collarW}" height="${collarH}" fill="${TEXT}" rx="${3 * scale}"/>
  <rect x="${cx - barW / 2}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#pl)" rx="${15 * scale}"/>
  <rect x="${cx + barW / 2 - plateW}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#pl)" rx="${15 * scale}"/>
</svg>`;
};

async function genAdaptive() {
  const svg = adaptiveFgSvg(1024);
  const outPath = path.join(ASSETS_DIR, 'adaptive-icon.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`  ✓ adaptive-icon.png (1024×1024 transparent fg)`);
}

/* ─────────────────── Favicon (192×192, simplified) ─────────────────── */
const faviconSvg = (size) => {
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 192;
  const barW = 130 * scale;
  const barH = 18 * scale;
  const plateW = 30 * scale;
  const plateH = 78 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="fav" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ACCENT_LIGHT}"/>
      <stop offset="100%" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${BG}"/>
  <rect x="${cx - barW / 2}" y="${cy - barH / 2}" width="${barW}" height="${barH}" fill="${TEXT}" rx="${barH / 2}"/>
  <rect x="${cx - barW / 2}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#fav)" rx="${6 * scale}"/>
  <rect x="${cx + barW / 2 - plateW}" y="${cy - plateH / 2}" width="${plateW}" height="${plateH}" fill="url(#fav)" rx="${6 * scale}"/>
</svg>`;
};

async function genFavicon() {
  const svg = faviconSvg(192);
  const outPath = path.join(ASSETS_DIR, 'favicon.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`  ✓ favicon.png (192×192 simplified)`);
}

/* ─────────────────── PWA / iOS specific sizes ─────────────────── */
async function genPwaIcons() {
  // Apple touch icon (iOS home screen)
  const appleSvg = faviconSvg(180);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(ASSETS_DIR, 'apple-touch-icon.png'));
  console.log(`  ✓ apple-touch-icon.png (180×180)`);

  // PWA icons
  const pwa192 = faviconSvg(192);
  await sharp(Buffer.from(pwa192))
    .png()
    .toFile(path.join(ASSETS_DIR, 'pwa-192.png'));
  console.log(`  ✓ pwa-192.png (192×192)`);

  const pwa512 = faviconSvg(512);
  await sharp(Buffer.from(pwa512))
    .png()
    .toFile(path.join(ASSETS_DIR, 'pwa-512.png'));
  console.log(`  ✓ pwa-512.png (512×512)`);

  // Maskable icon (Android adaptive)
  const maskable = faviconSvg(512);
  await sharp(Buffer.from(maskable))
    .png()
    .toFile(path.join(ASSETS_DIR, 'pwa-maskable-512.png'));
  console.log(`  ✓ pwa-maskable-512.png (512×512)`);
}

(async () => {
  console.log('Generating Iron Week Pro logo assets...');
  await gen('icon.png', 1024, true);
  await genFavicon();
  await genAdaptive();
  await genSplash();
  await genPwaIcons();
  console.log('Done.');
})();
