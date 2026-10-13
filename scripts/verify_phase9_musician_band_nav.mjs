import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase9_creator_band_audit";
const PORT = 9243;

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
    fitWindow: false
  });
}

async function captureScreenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(result.data, 'base64');
  const filePath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved screenshot: ${filePath}`);
}

async function auditPage(cdp, url, name, width, height, isMobile) {
  console.log(`\n--- Auditing ${name} (${width}x${height}, isMobile=${isMobile}) ---`);
  await cdp.send('Network.setCookie', {
    url: 'http://localhost:3000',
    name: '__cb_session',
    value: encodeURIComponent(JSON.stringify({
      uid: 'test-creator-uid',
      personaType: 'artist',
      emailVerified: true,
      onboarded: true,
    })),
  });
  await cdp.send('Page.navigate', { url: 'about:blank' });
  await sleep(100);
  await setViewport(cdp, width, height, isMobile);
  await cdp.send('Page.navigate', { url });
  await sleep(2500);

  const evalResult = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const header = document.querySelector('header, .creator-mobile-header, .band-mobile-header');
      const headerBg = header ? window.getComputedStyle(header).backgroundColor : null;
      const burger = document.querySelector('button[aria-label*="navigation menu"], button[aria-controls*="drawer"]');
      const burgerBox = burger ? burger.getBoundingClientRect() : null;

      return {
        viewportWidth: docW,
        scrollWidth: scrollW,
        hasHorizontalOverflow: scrollW > docW + 1,
        bodyBg,
        headerBg,
        burgerSize: burgerBox ? { width: Math.round(burgerBox.width), height: Math.round(burgerBox.height) } : null
      };
    })()`,
    returnByValue: true
  });

  const metrics = evalResult.result.value;
  console.log(`Metrics:`, JSON.stringify(metrics, null, 2));

  if (metrics.hasHorizontalOverflow) {
    console.error(`🚨 HORIZONTAL OVERFLOW DETECTED: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.viewportWidth}`);
  } else {
    console.log(`✅ No horizontal overflow: ${metrics.scrollWidth} <= ${metrics.viewportWidth}`);
  }

  const filename = `p9_${name}_${isMobile ? 'mobile' : 'desktop'}.png`;
  await captureScreenshot(cdp, filename);
  return metrics;
}

async function main() {
  console.log("Starting Headless Chrome for Phase 9 Solo Musician and Band Navigation Audit...");
  const tempProfile = path.join(process.cwd(), '.chrome-temp-p9-soloband-profile');
  if (!fs.existsSync(tempProfile)) {
    fs.mkdirSync(tempProfile, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${tempProfile}`
  ], { stdio: 'ignore' });

  await sleep(1500);

  try {
    const versionRes = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    const versionData = await versionRes.json();
    console.log(`Chrome debugger connected via WebSocket: ${versionData.webSocketDebuggerUrl}`);

    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new`, { method: 'PUT' });
    const tabData = await newTabRes.json();
    const cdp = new CdpClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Network.setCookie', {
      url: 'http://localhost:3000',
      name: '__cb_session',
      value: encodeURIComponent(JSON.stringify({
        uid: 'test-creator-uid',
        personaType: 'artist',
        emailVerified: true,
        onboarded: true,
      })),
    });

    // 1. Solo Musician Creator Studio Dashboard
    await auditPage(cdp, 'http://localhost:3000/creator/dashboard?preview=1', 'creator_dashboard', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/creator/dashboard?preview=1', 'creator_dashboard', 390, 844, true);

    // 2. Solo Musician Campaigns
    await auditPage(cdp, 'http://localhost:3000/creator/campaigns?preview=1', 'creator_campaigns', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/creator/campaigns?preview=1', 'creator_campaigns', 390, 844, true);

    // 3. Band Studio Dashboard
    await auditPage(cdp, 'http://localhost:3000/band/dashboard?preview=1', 'band_dashboard', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/band/dashboard?preview=1', 'band_dashboard', 390, 844, true);

    // 4. Band Splits & Governance
    await auditPage(cdp, 'http://localhost:3000/band/splits?preview=1', 'band_splits', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/band/splits?preview=1', 'band_splits', 390, 844, true);

    cdp.close();
    console.log("\n✅ Phase 9 Solo Musician and Band Navigation CDP Audit complete!");
  } catch (err) {
    console.error("Error in CDP audit:", err);
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch(console.error);
