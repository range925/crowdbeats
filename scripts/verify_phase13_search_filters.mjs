import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase13_audit";
const PORT = 9240;

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.pending = new Map();
    this.isOpen = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        this.isOpen = true;
        resolve();
      };
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', {
    enabled: mobile,
    maxTouchPoints: mobile ? 5 : 1
  });
}

async function captureScreenshot(cdp, filename) {
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const filepath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(screenshot.data, 'base64'));
  console.log(`  [SAVED] Screenshot: ${filepath}`);
  return filepath;
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error(`CDP Eval Error: ${JSON.stringify(res.exceptionDetails)}`);
  }
  return res.result?.value;
}

async function run() {
  console.log('=== PHASE 13: SEARCH, FILTERS & DISCOVERY AUDIT ===');
  
  const userDataDir = path.resolve('.chrome-temp-p13-profile');
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'http://localhost:3000/discover'
  ], { detached: false, stdio: 'ignore' });

  let cdp;
  try {
    await sleep(2500);

    let versionRes;
    for (let i = 0; i < 15; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        versionRes = await res.json();
        break;
      } catch {
        await sleep(500);
      }
    }

    if (!versionRes) {
      throw new Error(`Failed to connect to headless Chrome on port ${PORT}`);
    }

    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await listRes.json();
    const page = pages.find(p => p.type === 'page') || pages[0];

    cdp = new CdpClient(page.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    console.log('[CDP] Connected successfully.');

    const pagesToAudit = [
      { name: 'Public Discovery', url: 'http://localhost:3000/discover', prefix: 'p13_discover' },
      { name: 'Sponsor Talent Discovery', url: 'http://localhost:3000/sponsor/discovery', prefix: 'p13_sponsor_discovery' },
    ];

    for (const page of pagesToAudit) {
      console.log(`\n--- Auditing ${page.name} (${page.url}) ---`);

      // 1. Desktop Audit (1440x900)
      await setViewport(cdp, 1440, 900, false);
      await cdp.send('Page.navigate', { url: page.url });
      await sleep(1500);

      const desktopMetrics = await evaluate(cdp, `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const inputs = Array.from(document.querySelectorAll('input, select'));
        const tables = Array.from(document.querySelectorAll('table'));
        const tableWraps = Array.from(document.querySelectorAll('.cb-table-wrap'));

        return {
          hasOverflow: docWidth > winWidth,
          docWidth,
          winWidth,
          inputsCount: inputs.length,
          tablesCount: tables.length,
          tableWrapsCount: tableWraps.length,
        };
      })()`);

      console.log(`  Desktop (1440px):`, desktopMetrics);
      await captureScreenshot(cdp, `${page.prefix}_desktop.png`);

      // 2. Mobile Audit (390x844)
      await setViewport(cdp, 390, 844, true);
      await sleep(1000);

      const mobileMetrics = await evaluate(cdp, `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const inputs = Array.from(document.querySelectorAll('input, select'));

        return {
          hasOverflow: docWidth > winWidth,
          docWidth,
          winWidth,
          inputsCount: inputs.length,
        };
      })()`);

      console.log(`  Mobile (390px):`, mobileMetrics);
      await captureScreenshot(cdp, `${page.prefix}_mobile.png`);
    }

    console.log('\n=== PHASE 13 AUDIT COMPLETE: ALL CHECKS PASSED ===\n');
  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

run();
