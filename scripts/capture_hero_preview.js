const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9278;
const artifactDir = 'C:/Users/Knauf/.gemini/antigravity/brain/605da20c-2c05-4bc6-9456-d2afe0a5da9b';
const url = 'http://localhost:3000/';

const consentRecord = {
  version: '2026.1',
  status: 'accepted_all',
  timestamp: new Date().toISOString(),
  strictlyNecessary: true,
  analytics: true,
  ephemeralGeolocation: true,
  doNotSellOrShare: false,
  ccpaSection1798Acknowledged: true,
  gdprArticle15Acknowledged: true,
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
  const tempDir = path.join(os.tmpdir(), 'cb_hero_preview_' + Date.now());
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tempDir}`,
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: 'ignore' });

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
          if (d.error) reject(d.error);
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { localStorage.setItem('cb_privacy_consent_v1', ${JSON.stringify(JSON.stringify(consentRecord))}); } catch(e){}`,
    });

    // 1. Desktop 1440x900
    console.log('Capturing Desktop 1440x900...');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url });
    await sleep(3000);

    const deskHero = await send('Page.captureScreenshot', { format: 'png' });
    const deskPath = path.join(artifactDir, 'hero_desktop_preview.png');
    fs.writeFileSync(deskPath, Buffer.from(deskHero.data, 'base64'));
    console.log(`Saved desktop preview: ${deskPath} (${deskHero.data.length} bytes)`);

    // 2. Mobile 390x844
    console.log('Capturing Mobile 390x844...');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await sleep(2000);

    const mobHero = await send('Page.captureScreenshot', { format: 'png' });
    const mobPath = path.join(artifactDir, 'hero_mobile_preview.png');
    fs.writeFileSync(mobPath, Buffer.from(mobHero.data, 'base64'));
    console.log(`Saved mobile preview: ${mobPath} (${mobHero.data.length} bytes)`);

    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
