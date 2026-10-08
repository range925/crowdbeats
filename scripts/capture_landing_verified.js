const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9266;
const outDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\landing_verified';
fs.mkdirSync(outDir, { recursive: true });

const url = 'http://127.0.0.1:3000/';
const viewports = [
  { width: 360, height: 740, mobile: true, scale: 0.8, name: '360px' },
  { width: 390, height: 844, mobile: true, scale: 0.8, name: '390px' },
  { width: 768, height: 1024, mobile: false, scale: 0.6, name: '768px' },
  { width: 1024, height: 768, mobile: false, scale: 0.5, name: '1024px' },
  { width: 1440, height: 900, mobile: false, scale: 0.5, name: '1440px' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      const t = tabs.find((x) => x.type === 'page' && !x.url.startsWith('chrome-extension') && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding on port ' + debugPort);
}

const consentRecord = {
  version: '2026.1', status: 'accepted_all', timestamp: new Date().toISOString(),
  strictlyNecessary: true, analytics: true, ephemeralGeolocation: true, doNotSellOrShare: false,
  ccpaSection1798Acknowledged: true, gdprArticle15Acknowledged: true,
};

async function run() {
  console.log('--- Launching Chrome for Verified Visual Capture ---');
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${path.join(os.tmpdir(), 'cb_verif_cdp_' + Date.now())}`,
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const ws = new WebSocket(await getWsUrl());
    await new Promise((r) => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === myId) {
          ws.removeEventListener('message', h);
          d.error ? reject(d.error) : resolve(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try {
        localStorage.setItem('cb_privacy_consent_v1', ${JSON.stringify(JSON.stringify(consentRecord))});
        localStorage.setItem('crowdbeats-theme-preference', 'light');
      } catch(e) {}`,
    });

    const summary = [];

    for (const vp of viewports) {
      console.log(`\nCapturing viewport: ${vp.name}...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });

      await send('Page.navigate', { url });
      await sleep(3500);

      // Scroll smoothly down and back to trigger lazy images
      await evalJs(`(async () => {
        const H = document.documentElement.scrollHeight;
        for (let y = 0; y < H; y += 750) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      })()`);
      await sleep(1500);

      const metrics = await send('Page.getLayoutMetrics');
      const fullH = Math.ceil(metrics.cssContentSize.height);
      const overflow = await evalJs(`Math.max(0, document.documentElement.scrollWidth - window.innerWidth)`);

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: vp.width,
          height: Math.min(fullH, 12000),
          scale: vp.scale,
        },
      });

      const shotFile = `landing_${vp.name}.png`;
      const shotPath = path.join(outDir, shotFile);
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      const sizeKB = Math.round(fs.statSync(shotPath).size / 1024);

      console.log(`Saved: ${shotFile} (${sizeKB} KB) | Height: ${fullH}px | Overflow: ${overflow}px`);
      summary.push({ viewport: vp.name, width: vp.width, height: fullH, overflow, sizeKB, file: shotFile });
    }

    console.log('\n--- Capture Summary ---');
    console.table(summary);
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
