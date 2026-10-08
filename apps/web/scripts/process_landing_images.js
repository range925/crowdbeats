const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const brainDir = 'C:/Users/Knauf/.gemini/antigravity/brain/60ab879b-06db-4ab7-bd6d-102421ad9d52';
const targetDir = path.resolve(__dirname, '../public/landing/v3');

fs.mkdirSync(targetDir, { recursive: true });

const images = [
  {
    src: path.join(brainDir, 'hero_desktop_v3_1791194689472.jpg'),
    masterName: 'hero-desktop-master.png',
    aspect: 16 / 9,
    gravity: sharp.gravity.center,
    widths: [
      { name: 'hero-desktop-1280.webp', w: 1280 },
      { name: 'hero-desktop-1920.webp', w: 1920 },
      { name: 'hero-desktop-2560.webp', w: 2560 },
    ],
  },
  {
    src: path.join(brainDir, 'hero_mobile_v3_1791194706691.jpg'),
    masterName: 'hero-mobile-master.png',
    aspect: 4 / 5,
    gravity: sharp.gravity.north, // Keep performer in upper portion
    widths: [
      { name: 'hero-mobile-750.webp', w: 750 },
      { name: 'hero-mobile-1080.webp', w: 1080 },
    ],
  },
  {
    src: path.join(brainDir, 'fans_v3_1791194723979.jpg'),
    masterName: 'fans-master.png',
    aspect: 4 / 5,
    gravity: sharp.gravity.center,
    widths: [
      { name: 'fans-800.webp', w: 800 },
      { name: 'fans-1400.webp', w: 1400 },
    ],
  },
  {
    src: path.join(brainDir, 'solo_v3_1791194745748.jpg'),
    masterName: 'solo-master.png',
    aspect: 4 / 5,
    gravity: sharp.gravity.center,
    widths: [
      { name: 'solo-800.webp', w: 800 },
      { name: 'solo-1400.webp', w: 1400 },
    ],
  },
  {
    src: path.join(brainDir, 'band_v3_1791194766157.jpg'),
    masterName: 'band-master.png',
    aspect: 4 / 3,
    gravity: sharp.gravity.center,
    widths: [
      { name: 'band-800.webp', w: 800 },
      { name: 'band-1400.webp', w: 1400 },
    ],
  },
  {
    src: path.join(brainDir, 'chapter_v3_1791194786143.jpg'),
    masterName: 'chapter-master.png',
    aspect: 3 / 2,
    gravity: sharp.gravity.center,
    widths: [
      { name: 'chapter-1000.webp', w: 1000 },
      { name: 'chapter-1600.webp', w: 1600 },
    ],
  },
];

async function processAll() {
  const manifest = [];
  for (const item of images) {
    console.log(`Processing: ${item.masterName} from ${item.src}`);
    const metadata = await sharp(item.src).metadata();
    console.log(`  Source: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

    // Compute crop dimensions based on target aspect ratio
    let targetCropW = metadata.width;
    let targetCropH = Math.round(metadata.width / item.aspect);
    if (targetCropH > metadata.height) {
      targetCropH = metadata.height;
      targetCropW = Math.round(metadata.height * item.aspect);
    }

    // Save master png
    const masterPath = path.join(targetDir, item.masterName);
    await sharp(item.src)
      .resize({ width: targetCropW, height: targetCropH, fit: 'cover', position: item.gravity })
      .png({ quality: 100 })
      .toFile(masterPath);
    const masterStat = fs.statSync(masterPath);
    console.log(`  Saved master: ${item.masterName} (${targetCropW}x${targetCropH}, ${(masterStat.size / 1024).toFixed(1)} KB)`);

    // Generate responsive webps
    for (const v of item.widths) {
      const outPath = path.join(targetDir, v.name);
      // Avoid upscaling beyond source crop width
      const renderW = Math.min(v.w, targetCropW);
      const renderH = Math.round(renderW / item.aspect);

      await sharp(item.src)
        .resize({ width: renderW, height: renderH, fit: 'cover', position: item.gravity })
        .webp({ quality: 82, effort: 6 })
        .toFile(outPath);
      const stat = fs.statSync(outPath);
      console.log(`    -> ${v.name}: ${renderW}x${renderH} (${(stat.size / 1024).toFixed(1)} KB)${renderW < v.w ? ' [capped at source width]' : ''}`);

      manifest.push({
        file: v.name,
        width: renderW,
        height: renderH,
        kb: (stat.size / 1024).toFixed(1),
      });
    }
  }

  fs.writeFileSync(path.join(brainDir, 'scratch/image_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('All images processed successfully.');
}

processAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
