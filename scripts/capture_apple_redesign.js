/**
 * Visual capture verification script for Crowdbeats Apple Redesign
 * Runs Chrome headless via CDP, captures viewports 390, 768, 1440, 1920
 * Verifies horizontal overflow and writes screenshots to artifact directory.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9239;
const artifactDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\b53da591-658a-4260-88cc-df5722411675\\screenshots';
fs.mkdirSync(artifactDir, { recursive: true });

const url = 'http://localhost:3000/?preview=1';
const viewports = [
  { name: 'desktop_1440', width: 1440, height: 900, scale: 0.5 },
  { name: 'mobile_390', width: 390, height: 844, scale: 0.8 },
  { name: 'tablet_768', width: 768, height: 1024, scale: 0.6 },
  { name: 'ultrawide_1920', width: 1920, height: 1080, scale: 0.4 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      const t = tabs.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding on port ' + debugPort);
}

async function run() {
  console.log('Launching headless Chrome...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${path.join(os.tmpdir(), 'cb_apple_cdp_' + Date.now())}`,
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: 'ignore' });

  const results = [];
  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
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

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result.value;
    };

    for (const vp of viewports) {
      console.log(`Testing viewport ${vp.name} (${vp.width}x${vp.height})...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width <= 480,
      });

      await send('Page.navigate', { url });
      await sleep(3500);

      // Dismiss privacy consent modal by injecting accepted record
      await evalJs(`(()=>{
        try {
          const rec = {
            version: '2026.1',
            status: 'accepted_all',
            timestamp: new Date().toISOString(),
            strictlyNecessary: true,
            analytics: true,
            ephemeralGeolocation: true,
            doNotSellOrShare: false,
            ccpaSection1798Acknowledged: true,
            gdprArticle15Acknowledged: true
          };
          localStorage.setItem('cb_privacy_consent_v1', JSON.stringify(rec));
          const el = document.querySelector('[data-testid="privacy-consent-banner"]');
          if (el) el.remove();
          const modal = document.querySelector('[role="dialog"]');
          if (modal && modal.textContent && modal.textContent.includes('Privacy')) modal.remove();
        } catch(e){}
      })()`);
      await sleep(1000);

      // Scroll smoothly down and back to trigger lazy images
      await evalJs(`(async()=>{
        const H = document.documentElement.scrollHeight;
        for (let y = 0; y < H; y += 800) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 80));
        }
        window.scrollTo(0, 0);
      })()`);
      await sleep(1500);

      // 1. Capture above-the-fold hero
      const heroShot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(artifactDir, `hero_${vp.name}.png`), Buffer.from(heroShot.data, 'base64'));

      // 2. Capture full page
      const metrics = await send('Page.getLayoutMetrics');
      const fullH = Math.ceil(metrics.cssContentSize.height);
      const fullShot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: vp.width,
          height: Math.min(fullH, 16000),
          scale: vp.scale,
        },
      });
      fs.writeFileSync(path.join(artifactDir, `full_${vp.name}.png`), Buffer.from(fullShot.data, 'base64'));

      // 3. Overflow check
      const overflow = await evalJs(`document.documentElement.scrollWidth - window.innerWidth`);
      const sectionCount = await evalJs(`document.querySelectorAll('main > section').length`);

      results.push({
        viewport: vp.name,
        width: vp.width,
        pageHeight: fullH,
        horizontalOverflowPx: overflow,
        sectionCount,
      });
    }

    fs.writeFileSync(path.join(artifactDir, 'results.json'), JSON.stringify(results, null, 2));
    console.log('Capture completed successfully:\n', JSON.stringify(results, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
