const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function testFast() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9255;
  const tempDir = path.join(os.tmpdir(), 'chrome_cdp_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

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

    const srcImgPath = 'C:/Users/Knauf/.gemini/antigravity/brain/ecb66477-dc6b-457b-9791-7a860ed6872f/.user_uploaded/media_1791269863839.jpg';
    const srcB64 = fs.readFileSync(srcImgPath).toString('base64');

    // Load image once in page
    const loadScript = `
      window.__srcImg = new Image();
      window.__srcLoaded = new Promise(r => {
        window.__srcImg.onload = () => r({w: window.__srcImg.naturalWidth, h: window.__srcImg.naturalHeight});
        window.__srcImg.src = 'data:image/jpeg;base64,${srcB64}';
      });
    `;
    
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: loadScript } }));
    await new Promise(r => setTimeout(r, 200));

    ws.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: 'window.__srcLoaded', awaitPromise: true, returnByValue: true } }));
    const loadResp = await new Promise(r => ws.onmessage = e => r(JSON.parse(e.data)));
    console.log('Image loaded:', loadResp.result?.result?.value);

    // Now generate desktop 1920x1080 canvas
    const renderDesktopScript = `
      (() => {
        const c = document.createElement('canvas');
        c.width = 1920;
        c.height = 1080;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw flipped so performer is right-of-center
        ctx.save();
        ctx.translate(1920, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(window.__srcImg, 0, 0, 1920, 1080);
        ctx.restore();

        // Left scrim blend to solid #0a0a0b (from 0 to 450px)
        const leftGrad = ctx.createLinearGradient(0, 0, 450, 0);
        leftGrad.addColorStop(0, '#0a0a0b');
        leftGrad.addColorStop(0.35, 'rgba(10, 10, 11, 0.7)');
        leftGrad.addColorStop(0.7, 'rgba(10, 10, 11, 0.25)');
        leftGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, 450, 1080);

        // Top edge blend
        const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
        topGrad.addColorStop(0, 'rgba(10, 10, 11, 0.45)');
        topGrad.addColorStop(1, 'rgba(10, 10, 11, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, 1920, 100);

        window.__cDesk = c;
        return c.toDataURL('image/webp', 0.92);
      })()
    `;

    ws.send(JSON.stringify({ id: 3, method: 'Runtime.evaluate', params: { expression: renderDesktopScript, returnByValue: true } }));
    const deskResp = await new Promise(r => ws.onmessage = e => r(JSON.parse(e.data)));
    const webpData = deskResp.result?.result?.value;
    console.log('Desktop 1920 WebP generated! Length:', webpData?.length);

    ws.close();
  } finally {
    chrome.kill();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

testFast().catch(console.error);
