/**
 * Capture Section 2 (#discover) at 1440, 768, and 390 widths.
 * Usage: node scripts/capture_section2.js <label> [url]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9245;
const artifactDir = 'C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60';
const label = process.argv[2] || 'baseline';
const targetUrl = process.argv[3] || 'https://crowdbeats-01.web.app/';
const outDir = path.join(artifactDir, `section2_${label}`);
fs.mkdirSync(outDir, { recursive: true });

const widths = [1440, 768, 390];
const consentRecord = {
  version: '2026.1', status: 'accepted_all', timestamp: new Date().toISOString(),
  strictlyNecessary: true, analytics: true, ephemeralGeolocation: true, doNotSellOrShare: false,
  ccpaSection1798Acknowledged: true, gdprArticle15Acknowledged: true,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    await sleep(300);
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      const t = tabs.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding');
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${path.join(os.tmpdir(), 'cb_sec2_cdp_' + Date.now())}`,
    '--disable-extensions', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });

  try {
    const ws = new WebSocket(await getWsUrl());
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === myId) { ws.removeEventListener('message', h); d.error ? reject(d.error) : resolve(d.result); }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try{localStorage.setItem('cb_privacy_consent_v1', ${JSON.stringify(JSON.stringify(consentRecord))});localStorage.setItem('crowdbeats-theme-preference','light');}catch(e){}`,
    });

    for (const w of widths) {
      const h = w <= 480 ? 844 : 950;
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 480 });
      await send('Page.navigate', { url: targetUrl });
      await sleep(4000);

      // Scroll to #discover
      await evalJs(`(() => {
        const el = document.getElementById('discover');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      })()`);
      await sleep(2000);

      // Get bounding box of #discover
      const clip = await evalJs(`(() => {
        const el = document.getElementById('discover');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.max(0, rect.left + window.scrollX),
          y: Math.max(0, rect.top + window.scrollY),
          width: rect.width,
          height: rect.height,
          scale: 1,
        };
      })()`);

      console.log(`[width ${w}] clip:`, clip);

      if (clip && clip.height > 50) {
        const shot = await send('Page.captureScreenshot', {
          format: 'png',
          clip: {
            x: clip.x,
            y: clip.y,
            width: clip.width,
            height: Math.min(clip.height, 2400),
            scale: 1,
          },
          captureBeyondViewport: true,
        });
        const outPath = path.join(outDir, `section2_${w}px.png`);
        fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
        console.log(`Saved: ${outPath}`);

        // If mobile/tablet, also switch to Map view and capture
        if (w < 960) {
          await evalJs(`(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const mapBtn = btns.find((b) => b.textContent.trim() === 'Map');
            if (mapBtn) mapBtn.click();
          })()`);
          await sleep(1500);

          const mapClip = await evalJs(`(() => {
            const el = document.getElementById('discover');
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return {
              x: Math.max(0, rect.left + window.scrollX),
              y: Math.max(0, rect.top + window.scrollY),
              width: rect.width,
              height: rect.height,
              scale: 1,
            };
          })()`);

          if (mapClip && mapClip.height > 50) {
            const mapShot = await send('Page.captureScreenshot', {
              format: 'png',
              clip: {
                x: mapClip.x,
                y: mapClip.y,
                width: mapClip.width,
                height: Math.min(mapClip.height, 1400),
                scale: 1,
              },
              captureBeyondViewport: true,
            });
            const mapOutPath = path.join(outDir, `section2_${w}px_map.png`);
            fs.writeFileSync(mapOutPath, Buffer.from(mapShot.data, 'base64'));
            console.log(`Saved Map View: ${mapOutPath}`);
          }
        }
      } else {
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        const outPath = path.join(outDir, `viewport_${w}px.png`);
        fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
        console.log(`Fallback saved: ${outPath}`);
      }
    }

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
