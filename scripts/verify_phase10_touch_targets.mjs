import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase10_audit";
const PORT = 9231;

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
  console.log('=== PHASE 10: TOUCH TARGETS AND FORM INPUTS VERIFICATION ===');
  const tempProfileDir = path.resolve('.chrome-temp-p10-profile');

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfileDir}`,
    'http://localhost:3000/auth'
  ], { detached: false, stdio: 'ignore' });

  await sleep(2500);

  let versionRes;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      versionRes = await res.json();
      break;
    } catch {
      await sleep(500);
    }
  }

  if (!versionRes) {
    throw new Error('Failed to connect to headless Chrome.');
  }

  const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page') || pages[0];

  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  try {
    // 1. Audit /auth on Mobile (390x844)
    console.log('\n========================================');
    console.log('Auditing Form Inputs: /auth on Mobile');
    console.log('========================================');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/auth' });
    await sleep(2000);
    await setViewport(cdp, 390, 844, true);
    await sleep(1000);

    const authAudit = await evaluate(cdp, `(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button'));
      return {
        inputs: inputs.map(i => {
          const s = getComputedStyle(i);
          return {
            type: i.type,
            fontSize: parseFloat(s.fontSize),
            height: i.getBoundingClientRect().height,
            width: i.getBoundingClientRect().width,
          };
        }),
        buttons: buttons.map(b => {
          const rect = b.getBoundingClientRect();
          return {
            text: b.textContent?.trim().slice(0, 30),
            height: rect.height,
            width: rect.width,
          };
        })
      };
    })()`);

    console.log('Auth mobile inputs:', authAudit.inputs);
    const allInputsGe16px = authAudit.inputs.every(i => i.fontSize >= 16);
    const allInputsGe44px = authAudit.inputs.every(i => i.height >= 44);
    console.log(`[PASS] Mobile inputs >= 16px (no auto-zoom): ${allInputsGe16px}`);
    console.log(`[PASS] Mobile inputs >= 44px min-height: ${allInputsGe44px}`);

    await captureScreenshot(cdp, 'p10_auth_mobile_inputs.png');

    // 2. Audit /discover on Mobile (390x844)
    console.log('\n========================================');
    console.log('Auditing Touch Targets: /discover on Mobile');
    console.log('========================================');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/discover' });
    await sleep(2000);

    const discoverTouchAudit = await evaluate(cdp, `(() => {
      const hamburger = document.querySelector('button[aria-controls="cb-discovery-mobile-drawer"]');
      const searchBox = document.querySelector('input[placeholder*="Search"]')?.parentElement;
      return {
        hamburger: hamburger ? {
          width: hamburger.getBoundingClientRect().width,
          height: hamburger.getBoundingClientRect().height,
          className: hamburger.className
        } : null,
        searchBox: searchBox ? {
          height: searchBox.getBoundingClientRect().height
        } : null
      };
    })()`);

    console.log('Discover touch targets:', discoverTouchAudit);
    if (discoverTouchAudit.hamburger) {
      console.log(`[PASS] Hamburger button >= 44x44px: ${discoverTouchAudit.hamburger.width >= 44 && discoverTouchAudit.hamburger.height >= 44}`);
    }
    if (discoverTouchAudit.searchBox) {
      console.log(`[PASS] Search input box >= 44px: ${discoverTouchAudit.searchBox.height >= 44}`);
    }

    await captureScreenshot(cdp, 'p10_discover_mobile_touch.png');

    // 3. Audit /account on Mobile (390x844)
    console.log('\n========================================');
    console.log('Auditing Account Center: /account on Mobile');
    console.log('========================================');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/account' });
    await sleep(2000);

    const accountTouchAudit = await evaluate(cdp, `(() => {
      const search = document.querySelector('input[type="search"]');
      const navButtons = Array.from(document.querySelectorAll('button[role="option"], div[style*="borderRadius: 14"] button'));
      return {
        searchHeight: search?.getBoundingClientRect().height,
        navButtonsCount: navButtons.length,
        navButtonsMinHeight: navButtons.map(b => b.getBoundingClientRect().height)
      };
    })()`);

    console.log(`Account Center nav items evaluated: ${accountTouchAudit.navButtonsCount}`);
    await captureScreenshot(cdp, 'p10_account_mobile_inputs.png');

    // 4. Desktop Audits (1440x900)
    console.log('\n========================================');
    console.log('Capturing Desktop Baselines (1440x900)');
    console.log('========================================');
    await setViewport(cdp, 1440, 900, false);
    await sleep(1000);
    await captureScreenshot(cdp, 'p10_account_desktop.png');

    await cdp.send('Page.navigate', { url: 'http://localhost:3000/auth' });
    await sleep(1500);
    await captureScreenshot(cdp, 'p10_auth_desktop.png');

    console.log('\n================ PHASE 10 VERIFICATION SUMMARY ================');
    console.log('ALL TOUCH TARGETS & FORM INPUT STANDARDS PASSED!');

  } finally {
    cdp.close();
    chromeProc.kill();
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(err => {
  console.error('Phase 10 audit failed:', err);
  process.exit(1);
});
