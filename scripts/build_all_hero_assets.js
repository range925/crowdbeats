const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function buildAll() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9260;
  const tempDir = path.join(os.tmpdir(), 'chrome_hero_builder_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const targetDir = path.resolve(__dirname, '../apps/web/public/landing/v3');

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + debugPort,
    '--user-data-dir=' + tempDir,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1500));
    const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function evalCode(expr) {
      const id = msgId++;
      return new Promise(resolve => {
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result?.result?.value);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({
          id,
          method: 'Runtime.evaluate',
          params: { expression: expr, awaitPromise: true, returnByValue: true }
        }));
      });
    }

    const srcImgPath = 'C:/Users/Knauf/.gemini/antigravity/brain/ecb66477-dc6b-457b-9791-7a860ed6872f/.user_uploaded/media_1791269863839.jpg';
    const srcB64 = fs.readFileSync(srcImgPath).toString('base64');

    console.log('Loading source image into headless Chrome...');
    await evalCode(`
      new Promise(r => {
        window.__srcImg = new Image();
        window.__srcImg.onload = () => r(true);
        window.__srcImg.src = 'data:image/jpeg;base64,${srcB64}';
      })
    `);

    // Helper to save base64 dataUrl
    function saveFile(filename, dataUrl) {
      const b64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64, 'base64');
      const outPath = path.join(targetDir, filename);
      fs.writeFileSync(outPath, buf);
      console.log(`Saved: ${filename} (${buf.length} bytes)`);
    }

    // 1. Desktop Master Canvas (1920 x 1080)
    console.log('Rendering Desktop Master (1920x1080)...');
    await evalCode(`
      (() => {
        const c = document.createElement('canvas');
        c.width = 1920;
        c.height = 1080;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw flipped: subject right-of-center
        ctx.save();
        ctx.translate(1920, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(window.__srcImg, 0, 0, 1920, 1080);
        ctx.restore();

        // Left scrim blend to #0a0a0b
        const leftGrad = ctx.createLinearGradient(0, 0, 480, 0);
        leftGrad.addColorStop(0, '#0a0a0b');
        leftGrad.addColorStop(0.35, 'rgba(10, 10, 11, 0.7)');
        leftGrad.addColorStop(0.7, 'rgba(10, 10, 11, 0.25)');
        leftGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, 480, 1080);

        // Top edge blend
        const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
        topGrad.addColorStop(0, 'rgba(10, 10, 11, 0.45)');
        topGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, 1920, 100);

        window.__cDesk = c;
        return true;
      })()
    `);

    // Retrieve hero-desktop-master.png
    console.log('Exporting hero-desktop-master.png...');
    const deskPng = await evalCode(`window.__cDesk.toDataURL('image/png')`);
    saveFile('hero-desktop-master.png', deskPng);

    // Retrieve hero-desktop-1920.webp
    console.log('Exporting hero-desktop-1920.webp...');
    const desk1920 = await evalCode(`window.__cDesk.toDataURL('image/webp', 0.92)`);
    saveFile('hero-desktop-1920.webp', desk1920);

    // Retrieve hero-desktop-2560.webp (render at 2560x1440)
    console.log('Rendering and exporting hero-desktop-2560.webp...');
    const desk2560 = await evalCode(`
      (() => {
        const c = document.createElement('canvas');
        c.width = 2560;
        c.height = 1440;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(window.__cDesk, 0, 0, 2560, 1440);
        return c.toDataURL('image/webp', 0.92);
      })()
    `);
    saveFile('hero-desktop-2560.webp', desk2560);

    // Retrieve hero-desktop-1280.webp (1280x720)
    console.log('Rendering and exporting hero-desktop-1280.webp...');
    const desk1280 = await evalCode(`
      (() => {
        const c = document.createElement('canvas');
        c.width = 1280;
        c.height = 720;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(window.__cDesk, 0, 0, 1280, 720);
        return c.toDataURL('image/webp', 0.90);
      })()
    `);
    saveFile('hero-desktop-1280.webp', desk1280);

    // 2. Mobile Master Canvas (896 x 1120, 4:5 ratio)
    console.log('Rendering Mobile Master (896x1120)...');
    await evalCode(`
      (() => {
        const c = document.createElement('canvas');
        c.width = 896;
        c.height = 1120;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Crop: sw = 460.8, sh = 576, sx = 30
        ctx.drawImage(window.__srcImg, 30, 0, 460.8, 576, 0, 0, 896, 1120);

        // Soft bottom scrim gradient for text readability and transition into #0a0a0b
        const botGrad = ctx.createLinearGradient(0, 620, 0, 1120);
        botGrad.addColorStop(0, 'rgba(10, 10, 11, 0)');
        botGrad.addColorStop(0.4, 'rgba(10, 10, 11, 0.45)');
        botGrad.addColorStop(0.75, 'rgba(10, 10, 11, 0.82)');
        botGrad.addColorStop(1, '#0a0a0b');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, 620, 896, 500);

        // Soft top edge blend
        const topGrad = ctx.createLinearGradient(0, 0, 0, 80);
        topGrad.addColorStop(0, 'rgba(10, 10, 11, 0.4)');
        topGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, 896, 80);

        window.__cMob = c;
        return true;
      })()
    `);

    // Retrieve hero-mobile-master.png
    console.log('Exporting hero-mobile-master.png...');
    const mobPng = await evalCode(`window.__cMob.toDataURL('image/png')`);
    saveFile('hero-mobile-master.png', mobPng);

    // Retrieve hero-mobile-1080.webp (1080x1350)
    console.log('Rendering and exporting hero-mobile-1080.webp...');
    const mob1080 = await evalCode(`
      (() => {
        const c = document.createElement('canvas');
        c.width = 1080;
        c.height = 1350;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(window.__cMob, 0, 0, 1080, 1350);
        return c.toDataURL('image/webp', 0.92);
      })()
    `);
    saveFile('hero-mobile-1080.webp', mob1080);

    // Retrieve hero-mobile-750.webp (750x938)
    console.log('Rendering and exporting hero-mobile-750.webp...');
    const mob750 = await evalCode(`
      (() => {
        const c = document.createElement('canvas');
        c.width = 750;
        c.height = 938;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(window.__cMob, 0, 0, 750, 938);
        return c.toDataURL('image/webp', 0.90);
      })()
    `);
    saveFile('hero-mobile-750.webp', mob750);

    console.log('ALL HERO ASSETS GENERATED AND SAVED SUCCESSFULLY!');
    ws.close();
  } finally {
    chrome.kill();
    try {
      setTimeout(() => fs.rmSync(tempDir, { recursive: true, force: true }), 1000);
    } catch (e) {}
  }
}

buildAll().catch(console.error);
