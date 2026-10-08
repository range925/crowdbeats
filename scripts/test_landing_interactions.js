const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9255;
const artifactDir = 'C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60';
const outDir = path.join(artifactDir, 'landing_interactions');
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      const t = tabs.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding');
}

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${path.join(os.tmpdir(), 'cb_nav_cdp_' + Date.now())}`,
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
    const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

    // Desktop: Role Chooser & Dropdown
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(3000);

    // 1. Open Musician dropdown
    await evalJs(`document.querySelector("button[aria-controls='cb-musicians-menu']").click()`);
    await sleep(400);
    const dropShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'dropdown_desktop.png'), Buffer.from(dropShot.data, 'base64'));

    // Close dropdown
    await evalJs(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await sleep(300);

    // 2. Open Role Chooser
    await evalJs(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Join Crowdbeats')).click()`);
    await sleep(500);
    const modalShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'role_chooser_desktop.png'), Buffer.from(modalShot.data, 'base64'));

    // 3. Mobile: Drawer at 390px
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(3000);

    // Click burger
    await evalJs(`document.querySelector("button[aria-controls='cb-mobile-drawer']").click()`);
    await sleep(500);
    const drawerShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'mobile_drawer_390.png'), Buffer.from(drawerShot.data, 'base64'));

    console.log('Interactions verified and saved.');
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
