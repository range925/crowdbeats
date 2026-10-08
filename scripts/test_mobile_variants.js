const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function testMobileVariants() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9249;
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

      // Mobile Variant A: Unflipped (mic on left, looking right)
      // Exact 4:5 slice from 1024x576:
      // Height = 576. 4:5 width = 576 * 4 / 5 = 460.8.
      // Performer center is around x=260. So sx = 30, sw = 460.8, sy = 0, sh = 576.
      const ca = document.createElement('canvas');
      ca.width = 1080;
      ca.height = 1350;
      const ctxA = ca.getContext('2d');
      ctxA.imageSmoothingQuality = 'high';
      ctxA.drawImage(img1, 30, 0, 460.8, 576, 0, 0, 1080, 1350);

      // Bottom scrim overlay for text readability
      const gradA = ctxA.createLinearGradient(0, 800, 0, 1350);
      gradA.addColorStop(0, 'rgba(10, 10, 11, 0)');
      gradA.addColorStop(0.5, 'rgba(10, 10, 11, 0.6)');
      gradA.addColorStop(1, '#0a0a0b');
      ctxA.fillStyle = gradA;
      ctxA.fillRect(0, 800, 1080, 550);

      // Mobile Variant B: Flipped (matches desktop orientation: mic on right, looking left)
      const cb = document.createElement('canvas');
      cb.width = 1080;
      cb.height = 1350;
      const ctxB = cb.getContext('2d');
      ctxB.imageSmoothingQuality = 'high';
      ctxB.save();
      ctxB.translate(1080, 0);
      ctxB.scale(-1, 1);
      ctxB.drawImage(img1, 30, 0, 460.8, 576, 0, 0, 1080, 1350);
      ctxB.restore();

      const gradB = ctxB.createLinearGradient(0, 800, 0, 1350);
      gradB.addColorStop(0, 'rgba(10, 10, 11, 0)');
      gradB.addColorStop(0.5, 'rgba(10, 10, 11, 0.6)');
      gradB.addColorStop(1, '#0a0a0b');
      ctxB.fillStyle = gradB;
      ctxB.fillRect(0, 800, 1080, 550);

      return {
        mobileA: ca.toDataURL('image/jpeg', 0.88),
        mobileB: cb.toDataURL('image/jpeg', 0.88)
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
  fs.writeFileSync(path.join(outDir, 'mobile_variant_a.jpg'), Buffer.from(val.mobileA.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
  fs.writeFileSync(path.join(outDir, 'mobile_variant_b.jpg'), Buffer.from(val.mobileB.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));

  console.log('Saved mobile variants');
  chrome.kill();
}

testMobileVariants().catch(console.error);
