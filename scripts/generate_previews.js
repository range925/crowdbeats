const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function generateCandidatePreviews() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9248;
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
  
  const imgDir = 'C:/Users/Knauf/.gemini/antigravity/brain/ecb66477-dc6b-457b-9791-7a860ed6872f/.user_uploaded/';
  const img1B64 = fs.readFileSync(imgDir + 'media_1791269863839.jpg').toString('base64');
  const img2B64 = fs.readFileSync(imgDir + 'media_1791269864110.jpg').toString('base64');
  const img3B64 = fs.readFileSync(imgDir + 'media_1791269864112.jpg').toString('base64');

  const script = `
  (() => {
    function loadImage(b64) {
      return new Promise(r => {
        const img = new Image();
        img.onload = () => r(img);
        img.src = 'data:image/jpeg;base64,' + b64;
      });
    }

    return (async () => {
      const img1 = await loadImage('${img1B64}');
      const img2 = await loadImage('${img2B64}');
      const img3 = await loadImage('${img3B64}');

      // Candidate 1A: img1 flipped for desktop (1920x1080)
      const c1 = document.createElement('canvas');
      c1.width = 1920;
      c1.height = 1080;
      const ctx1 = c1.getContext('2d');
      ctx1.imageSmoothingQuality = 'high';
      ctx1.save();
      ctx1.translate(1920, 0);
      ctx1.scale(-1, 1);
      ctx1.drawImage(img1, 0, 0, 1920, 1080);
      ctx1.restore();

      // Fade left 15% to solid #0a0a0b
      const grad1 = ctx1.createLinearGradient(0, 0, 400, 0);
      grad1.addColorStop(0, '#0a0a0b');
      grad1.addColorStop(0.5, 'rgba(10, 10, 11, 0.6)');
      grad1.addColorStop(1, 'rgba(10, 10, 11, 0)');
      ctx1.fillStyle = grad1;
      ctx1.fillRect(0, 0, 400, 1080);

      // Candidate 1 Mobile: img1 4:5 ratio (1080x1350)
      const cm1 = document.createElement('canvas');
      cm1.width = 1080;
      cm1.height = 1350;
      const ctxM1 = cm1.getContext('2d');
      ctxM1.fillStyle = '#0a0a0b';
      ctxM1.fillRect(0, 0, 1080, 1350);
      ctxM1.imageSmoothingQuality = 'high';

      // We want performer centered in top half.
      // In flipped img1, performer face is at x=754/1024, y=230/576.
      // Crop source: sx=520, sy=0, sw=504, sh=576
      // Draw to top portion: dx=0, dy=0, dw=1080, dh=1234
      ctxM1.save();
      ctxM1.translate(1080, 0);
      ctxM1.scale(-1, 1);
      // in original un-flipped: performer is at sx=0..500
      ctxM1.drawImage(img1, 0, 0, 520, 576, 0, 0, 1080, 1196);
      ctxM1.restore();

      // Soft bottom gradient
      const mGrad1 = ctxM1.createLinearGradient(0, 700, 0, 1350);
      mGrad1.addColorStop(0, 'rgba(10, 10, 11, 0)');
      mGrad1.addColorStop(0.5, 'rgba(10, 10, 11, 0.7)');
      mGrad1.addColorStop(1, '#0a0a0b');
      ctxM1.fillStyle = mGrad1;
      ctxM1.fillRect(0, 700, 1080, 650);

      // Candidate 2 Desktop: img2 (1024x576) scaled to 1920x1080
      const c2 = document.createElement('canvas');
      c2.width = 1920;
      c2.height = 1080;
      const ctx2 = c2.getContext('2d');
      ctx2.imageSmoothingQuality = 'high';
      ctx2.drawImage(img2, 0, 0, 1920, 1080);

      return {
        d1: c1.toDataURL('image/jpeg', 0.85),
        m1: cm1.toDataURL('image/jpeg', 0.85),
        d2: c2.toDataURL('image/jpeg', 0.85)
      };
    })()
  })()
  `;

  const evalMsg = {
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: script,
      awaitPromise: true,
      returnByValue: true
    }
  };
  ws.send(JSON.stringify(evalMsg));
  const resp = await new Promise(r => ws.onmessage = e => r(JSON.parse(e.data)));
  const val = resp.result?.result?.value;

  const outDir = 'C:/Users/Knauf/.gemini/antigravity/brain/6824ea21-82a0-413f-87ee-e69fa52057b8/scratch';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'candidate1_desktop.jpg'), Buffer.from(val.d1.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
  fs.writeFileSync(path.join(outDir, 'candidate1_mobile.jpg'), Buffer.from(val.m1.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
  fs.writeFileSync(path.join(outDir, 'candidate2_desktop.jpg'), Buffer.from(val.d2.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));

  console.log('Saved candidate previews to scratch');
  chrome.kill();
}

generateCandidatePreviews().catch(console.error);
