import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase8_guest_fan_audit";
const PORT = 9242;

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
  await setViewport(cdp, width, height, isMobile);
  await cdp.send('Page.navigate', { url });
  await sleep(2500);

  const evalResult = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const header = document.querySelector('header, .cb-mobile-header');
      const headerBg = header ? window.getComputedStyle(header).backgroundColor : null;
      const burger = document.querySelector('button[aria-label*="menu"], button[aria-controls*="drawer"], .cb-burger');
      const burgerBox = burger ? burger.getBoundingClientRect() : null;
      const bottomNav = document.querySelector('nav[aria-label="Mobile navigation"]');
      const bottomNavBox = bottomNav ? bottomNav.getBoundingClientRect() : null;

      return {
        viewportWidth: docW,
        scrollWidth: scrollW,
        hasHorizontalOverflow: scrollW > docW + 1,
        bodyBg,
        headerBg,
        burgerSize: burgerBox ? { width: Math.round(burgerBox.width), height: Math.round(burgerBox.height) } : null,
        hasBottomNav: !!bottomNav
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

  const filename = `p8_${name}_${isMobile ? 'mobile' : 'desktop'}.png`;
  await captureScreenshot(cdp, filename);
  return metrics;
}

async function main() {
  console.log("Starting Headless Chrome for Phase 8 Guest and Fan Navigation Audit...");
  const tempProfile = path.join(process.cwd(), '.chrome-temp-p8-guestfan-profile');
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

    // 1. Guest Landing Page Navigation
    await auditPage(cdp, 'http://localhost:3000/', 'guest_landing', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/', 'guest_landing', 390, 844, true);

    // 2. Guest Discovery Live Map Navigation
    await auditPage(cdp, 'http://localhost:3000/discover', 'guest_discover', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/discover', 'guest_discover', 390, 844, true);

    // 3. Fan Portal Navigation (Tabs & Drawer)
    await auditPage(cdp, 'http://localhost:3000/fan', 'fan_portal', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/fan', 'fan_portal', 390, 844, true);

    // 4. Public Musician Profile (Guest Browsing & Tip Gate)
    await auditPage(cdp, 'http://localhost:3000/artist/jake-rios', 'guest_artist_profile', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/artist/jake-rios', 'guest_artist_profile', 390, 844, true);

    cdp.close();
    console.log("\n✅ Phase 8 Guest and Fan Navigation CDP Audit complete!");
  } catch (err) {
    console.error("Error in CDP audit:", err);
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch(console.error);
