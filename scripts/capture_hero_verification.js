const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function captureHero() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const debugPort = 9265;
  const tempDir = path.join(os.tmpdir(), 'chrome_cap_' + Date.now());
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

    let msgId = 1;
    function send(method, params = {}) {
      const id = msgId++;
      return new Promise(resolve => {
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');

    // Desktop capture
    console.log('Navigating to http://localhost:3000 at desktop viewport...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3000));

    const deskShot = await send('Page.captureScreenshot', { format: 'png' });
    const deskOut = 'C:/Users/Knauf/.gemini/antigravity/brain/605da20c-2c05-4bc6-9456-d2afe0a5da9b/hero_desktop_preview.png';
    fs.writeFileSync(deskOut, Buffer.from(deskShot.data, 'base64'));
    console.log('Desktop screenshot saved to:', deskOut);

    // Mobile capture
    console.log('Switching to mobile viewport (390x844)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));

    const mobShot = await send('Page.captureScreenshot', { format: 'png' });
    const mobOut = 'C:/Users/Knauf/.gemini/antigravity/brain/605da20c-2c05-4bc6-9456-d2afe0a5da9b/hero_mobile_preview.png';
    fs.writeFileSync(mobOut, Buffer.from(mobShot.data, 'base64'));
    console.log('Mobile screenshot saved to:', mobOut);

    ws.close();
  } finally {
    chrome.kill();
  }
}

captureHero().catch(console.error);
