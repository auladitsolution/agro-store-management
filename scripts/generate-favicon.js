const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="50%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Leaf Left Gradient -->
    <linearGradient id="leafLeft" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#A7F3D0" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>

    <!-- Leaf Right Gradient -->
    <linearGradient id="leafRight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#6EE7B7" />
    </linearGradient>

    <!-- Center Sprout Accent -->
    <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#E2FBE8" />
      <stop offset="100%" stop-color="#FFFFFF" />
    </linearGradient>

    <!-- Drop shadow for the plant icon -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#022c22" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bgGrad)" />
  <rect x="4" y="4" width="120" height="120" rx="28" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-opacity="0.25" />

  <!-- Plant Icon Content -->
  <g filter="url(#glow)">
    <!-- Soil / Growth baseline curve -->
    <path d="M38 98 Q 64 94 90 98" stroke="#A7F3D0" stroke-width="6" stroke-linecap="round" fill="none" />

    <!-- Main Stem -->
    <path d="M64 96 C 64 74 62 52 64 36" stroke="url(#stemGrad)" stroke-width="7" stroke-linecap="round" fill="none" />

    <!-- Left Leaf -->
    <path d="M63 68 C 42 68 28 54 28 36 C 46 36 61 50 63 68 Z" fill="url(#leafLeft)" />
    <path d="M59 64 C 49 57 40 48 35 41" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-opacity="0.35" fill="none" />

    <!-- Right Leaf -->
    <path d="M64 54 C 84 52 98 40 98 22 C 80 22 66 36 64 54 Z" fill="url(#leafRight)" />
    <path d="M67 50 C 77 43 87 34 91 27" stroke="#047857" stroke-width="2" stroke-linecap="round" stroke-opacity="0.35" fill="none" />

    <!-- Tiny center sprout shoot at top -->
    <path d="M64 36 C 62 26 64 19 65 17 C 66 19 68 26 66 36 Z" fill="#FFFFFF" />
  </g>
</svg>`;

// Helper function to build a valid Windows ICO buffer from PNG buffers
function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // number of images

  let currentOffset = 6 + count * 16;
  const dirEntries = [];

  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function run() {
  const svgBuffer = Buffer.from(svgContent, 'utf-8');

  // Save SVG
  const srcAppDir = path.join(__dirname, '..', 'src', 'app');
  const publicDir = path.join(__dirname, '..', 'public');

  fs.writeFileSync(path.join(srcAppDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  console.log('Saved SVG icons');

  // Generate PNG sizes
  const sizes = [16, 32, 48, 64, 180, 192, 512];
  const pngMap = {};

  for (const size of sizes) {
    const buf = await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    pngMap[size] = buf;
  }

  // Save specific PNG files
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), pngMap[16]);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), pngMap[32]);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngMap[180]);
  fs.writeFileSync(path.join(srcAppDir, 'apple-icon.png'), pngMap[180]);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), pngMap[192]);
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), pngMap[512]);
  console.log('Saved PNG icons');

  // Generate ICO with 16, 32, 48
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: pngMap[16] },
    { width: 32, height: 32, buffer: pngMap[32] },
    { width: 48, height: 48, buffer: pngMap[48] },
  ]);

  fs.writeFileSync(path.join(srcAppDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Saved ICO icons');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
