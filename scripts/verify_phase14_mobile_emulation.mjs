import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase14_mobile_emulation_audit";
const PORT = 9249;

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

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  return res.result?.value;
}

async function captureScreenshot(cdp, filePath) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
}

async function main() {
  console.log("=== PHASE 14: SIMULATED IOS SAFARI & ANDROID CHROME MOBILE AUDIT ===");

  const tempProfileDir = path.resolve('.chrome-temp-p14-mobile-profile');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank'
  ]);

  let cdp = null;

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      await sleep(400);
      try {
        const res = await fetch(`http://localhost:${PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
    }

    if (!versionData) throw new Error("Could not connect to Chrome CDP");

    const listRes = await fetch(`http://localhost:${PORT}/json/list`);
    const pages = await listRes.json();
    const wsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No page target found");

    cdp = new CdpClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    const devices = [
      {
        name: 'ios_safari_iphone15',
        label: 'iOS Safari (iPhone 15 Pro)',
        width: 393,
        height: 852,
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      },
      {
        name: 'android_chrome_pixel8',
        label: 'Android Chrome (Pixel 8)',
        width: 412,
        height: 915,
        deviceScaleFactor: 2.625,
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
      },
    ];

    const targets = [
      { name: 'landing', url: 'http://localhost:3000/' },
      { name: 'onboarding_persona', url: 'http://localhost:3000/onboarding/persona' },
      { name: 'auth', url: 'http://localhost:3000/auth' },
      { name: 'discover', url: 'http://localhost:3000/discover' },
      { name: 'tip_maya', url: 'http://localhost:3000/tip/art_maya_lin' },
    ];

    const results = [];

    for (const dev of devices) {
      console.log(`\nTesting Emulated Device: ${dev.label}`);

      console.log('  Setting user-agent override...');
      await cdp.send('Network.setUserAgentOverride', { userAgent: dev.userAgent });
      console.log('  Setting device metrics override...');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: dev.width,
        height: dev.height,
        deviceScaleFactor: 1,
        mobile: true,
        screenOrientation: { angle: 0, type: 'portraitPrimary' }
      });
      console.log('  Setting touch emulation...');
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });

      for (const target of targets) {
        console.log(`  Navigating to ${target.name} (${target.url})...`);
        await cdp.send('Page.navigate', { url: target.url });
        await sleep(1500);

        const metrics = await evaluate(cdp, `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const overflowDiff = Math.max(0, scrollWidth - clientWidth);

          // Check font size on inputs (iOS Safari auto-zoom prevention check >= 16px)
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
          const sub16pxInputs = inputs
            .map(el => parseFloat(window.getComputedStyle(el).fontSize))
            .filter(sz => sz < 16);

          return {
            overflowDiff,
            sub16pxInputCount: sub16pxInputs.length,
          };
        })()`);

        const shotPath = path.join(ARTIFACT_DIR, `p14_${dev.name}_${target.name}.png`);
        await captureScreenshot(cdp, shotPath);

        const status = metrics.overflowDiff === 0 ? 'PASS' : `FAIL (${metrics.overflowDiff}px overflow)`;
        console.log(`  [${target.name}] ${status} | iOS Zoom Risk (<16px inputs): ${metrics.sub16pxInputCount}`);

        results.push({
          device: dev.label,
          target: target.name,
          overflow: metrics.overflowDiff,
          sub16pxInputs: metrics.sub16pxInputCount,
          screenshot: shotPath,
        });
      }
    }

    const reportPath = path.join(ARTIFACT_DIR, 'mobile_emulation_summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nMobile emulation audit complete. Summary saved to ${reportPath}`);

  } catch (err) {
    console.error("Mobile emulation audit error:", err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
  }
}

main();
