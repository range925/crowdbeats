const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function buildHeroAssets() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9250;
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + debugPort,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  
  await new Promise(r => setTimeout(r, 1200));
  const res = await fetch('http://127.0.0.1:' + debugPort + '/json/list');
  const tabs = await res.json();
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  const srcImgPath = 'C:/Users/Knauf/.gemini/antigravity/brain/ecb66477-dc6b-457b-9791-7a860ed6872f/.user_uploaded/media_1791269863839.jpg';
  const srcB64 = fs.readFileSync(srcImgPath).toString('base64');
  const targetDir = path.resolve(__dirname, '../apps/web/public/landing/v3');

  console.log('Generating assets in Chrome headless canvas...');

  const script = `
  (() => {
    function loadImage(b64) {
      return new Promise(r => {
        const img = new Image();
        img.onload = () => r(img);
        img.src = 'data:image/jpeg;base64,' + b64;
      });
    }

    function applyUnsharp(ctx, width, height, amount, threshold) {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const copy = new Uint8ClampedArray(data);
      const w = width;
      const h = height;

      // 3x3 unsharp kernel
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            // 4-neighbor average
            const up    = copy[((y - 1) * w + x) * 4 + c];
            const down  = copy[((y + 1) * w + x) * 4 + c];
            const left  = copy[(y * w + (x - 1)) * 4 + c];
            const right = copy[(y * w + (x + 1)) * 4 + c];
            const blur = (up + down + left + right) * 0.25;
            const diff = copy[idx + c] - blur;
            if (Math.abs(diff) > threshold) {
              data[idx + c] = Math.min(255, Math.max(0, copy[idx + c] + amount * diff));
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return (async () => {
      const srcImg = await loadImage('${srcB64}');

      // ── 1. DESKTOP MASTER (2560 x 1440) ──────────────────────────────────
      // Flipped horizontally so performer is on the right (x ~ 72%, y ~ 40%)
      const cDeskMaster = document.createElement('canvas');
      cDeskMaster.width = 2560;
      cDeskMaster.height = 1440;
      const ctxDesk = cDeskMaster.getContext('2d');
      ctxDesk.imageSmoothingEnabled = true;
      ctxDesk.imageSmoothingQuality = 'high';

      // Draw flipped
      ctxDesk.save();
      ctxDesk.translate(2560, 0);
      ctxDesk.scale(-1, 1);
      ctxDesk.drawImage(srcImg, 0, 0, 2560, 1440);
      ctxDesk.restore();

      // Soft left-edge blend into solid #0a0a0b (from x=0 to 480px, ~18%)
      const deskLeftGrad = ctxDesk.createLinearGradient(0, 0, 480, 0);
      deskLeftGrad.addColorStop(0, '#0a0a0b');
      deskLeftGrad.addColorStop(0.35, 'rgba(10, 10, 11, 0.7)');
      deskLeftGrad.addColorStop(0.7, 'rgba(10, 10, 11, 0.25)');
      deskLeftGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
      ctxDesk.fillStyle = deskLeftGrad;
      ctxDesk.fillRect(0, 0, 480, 1440);

      // Soft top edge blend into #0a0a0b
      const deskTopGrad = ctxDesk.createLinearGradient(0, 0, 0, 120);
      deskTopGrad.addColorStop(0, 'rgba(10, 10, 11, 0.5)');
      deskTopGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
      ctxDesk.fillStyle = deskTopGrad;
      ctxDesk.fillRect(0, 0, 2560, 120);

      // Apply subtle crispness enhancement
      applyUnsharp(ctxDesk, 2560, 1440, 0.35, 3);

      // ── DESKTOP DERIVATIVES ───────────────────────────────────────────────
      // 1920 x 1080
      const cDesk1920 = document.createElement('canvas');
      cDesk1920.width = 1920;
      cDesk1920.height = 1080;
      const ctx1920 = cDesk1920.getContext('2d');
      ctx1920.imageSmoothingEnabled = true;
      ctx1920.imageSmoothingQuality = 'high';
      ctx1920.drawImage(cDeskMaster, 0, 0, 1920, 1080);

      // 1280 x 720
      const cDesk1280 = document.createElement('canvas');
      cDesk1280.width = 1280;
      cDesk1280.height = 720;
      const ctx1280 = cDesk1280.getContext('2d');
      ctx1280.imageSmoothingEnabled = true;
      ctx1280.imageSmoothingQuality = 'high';
      ctx1280.drawImage(cDeskMaster, 0, 0, 1280, 720);

      // ── 2. MOBILE MASTER (1080 x 1350, 4:5 ratio) ─────────────────────────
      // Performer centered in upper portion (head at y ~ 28%)
      const cMobMaster = document.createElement('canvas');
      cMobMaster.width = 1080;
      cMobMaster.height = 1350;
      const ctxMob = cMobMaster.getContext('2d');
      ctxMob.imageSmoothingEnabled = true;
      ctxMob.imageSmoothingQuality = 'high';

      // Source 4:5 crop: sw = 460.8, sh = 576
      // Performer center in srcImg is around x=260. We take sx=30.
      ctxMob.drawImage(srcImg, 30, 0, 460.8, 576, 0, 0, 1080, 1350);

      // Soft bottom scrim gradient for text readability and transition into #0a0a0b
      const mobBotGrad = ctxMob.createLinearGradient(0, 750, 0, 1350);
      mobBotGrad.addColorStop(0, 'rgba(10, 10, 11, 0)');
      mobBotGrad.addColorStop(0.4, 'rgba(10, 10, 11, 0.45)');
      mobBotGrad.addColorStop(0.75, 'rgba(10, 10, 11, 0.82)');
      mobBotGrad.addColorStop(1, '#0a0a0b');
      ctxMob.fillStyle = mobBotGrad;
      ctxMob.fillRect(0, 750, 1080, 600);

      // Soft top edge blend
      const mobTopGrad = ctxMob.createLinearGradient(0, 0, 0, 100);
      mobTopGrad.addColorStop(0, 'rgba(10, 10, 11, 0.4)');
      mobTopGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
      ctxMob.fillStyle = mobTopGrad;
      ctxMob.fillRect(0, 0, 1080, 100);

      // Subtle crispness
      applyUnsharp(ctxMob, 1080, 1350, 0.35, 3);

      // ── MOBILE DERIVATIVES ───────────────────────────────────────────────
      // 750 x 938 (4:5 ratio, 750 * 5/4 = 937.5 -> 938)
      const cMob750 = document.createElement('canvas');
      cMob750.width = 750;
      cMob750.height = 938;
      const ctx750 = cMob750.getContext('2d');
      ctx750.imageSmoothingEnabled = true;
      ctx750.imageSmoothingQuality = 'high';
      ctx750.drawImage(cMobMaster, 0, 0, 750, 938);

      return {
        deskMasterPng: cDeskMaster.toDataURL('image/png'),
        desk2560Webp:  cDeskMaster.toDataURL('image/webp', 0.92),
        desk1920Webp:  cDesk1920.toDataURL('image/webp', 0.92),
        desk1280Webp:  cDesk1280.toDataURL('image/webp', 0.90),
        mobMasterPng:  cMobMaster.toDataURL('image/png'),
        mob1080Webp:   cMobMaster.toDataURL('image/webp', 0.92),
        mob750Webp:    cMob750.toDataURL('image/webp', 0.90)
      };
    })()
  })()
  `;

  let currentMsgId = 1;
  function callChrome(method, params) {
    const id = currentMsgId++;
    return new Promise(resolve => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const resVal = await callChrome('Runtime.evaluate', {
    expression: script,
    awaitPromise: true,
    returnByValue: true
  });

  const assets = resVal.result?.value;
  if (!assets) {
    throw new Error('Failed to generate assets: ' + JSON.stringify(resVal));
  }

  function saveAsset(filename, dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const dest = path.join(targetDir, filename);
    fs.writeFileSync(dest, buffer);
    console.log(`Saved: ${filename} (${buffer.length} bytes)`);
  }

  saveAsset('hero-desktop-master.png', assets.deskMasterPng);
  saveAsset('hero-desktop-2560.webp', assets.desk2560Webp);
  saveAsset('hero-desktop-1920.webp', assets.desk1920Webp);
  saveAsset('hero-desktop-1280.webp', assets.desk1280Webp);
  saveAsset('hero-mobile-master.png', assets.mobMasterPng);
  saveAsset('hero-mobile-1080.webp', assets.mob1080Webp);
  saveAsset('hero-mobile-750.webp', assets.mob750Webp);

  console.log('All hero assets written to target directory successfully!');
  chrome.kill();
}

buildHeroAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
