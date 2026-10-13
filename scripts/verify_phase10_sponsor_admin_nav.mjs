import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase10_sponsor_admin_audit";
const PORT = 9244;

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

async function setSessionCookie(cdp, sessionData) {
  await cdp.send('Network.setCookie', {
    url: 'http://localhost:3000',
    name: '__cb_session',
    value: encodeURIComponent(JSON.stringify(sessionData)),
  });
}

async function auditPage(cdp, url, name, width, height, isMobile, sessionData) {
  console.log(`\n--- Auditing ${name} (${width}x${height}, isMobile=${isMobile}) ---`);
  await setSessionCookie(cdp, sessionData);
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
      const header = document.querySelector('header, .sponsor-mobile-header, .admin-topbar');
      const headerBg = header ? window.getComputedStyle(header).backgroundColor : null;
      const burger = document.querySelector('button[aria-label*="navigation menu"], button[aria-controls*="drawer"], .admin-hamburger-btn');
      const burgerBox = burger ? burger.getBoundingClientRect() : null;
      const table = document.querySelector('.admin-table-container');
      const tableBox = table ? table.getBoundingClientRect() : null;

      return {
        viewportWidth: docW,
        scrollWidth: scrollW,
        hasHorizontalOverflow: scrollW > docW + 1,
        bodyBg,
        headerBg,
        burgerSize: burgerBox ? { width: Math.round(burgerBox.width), height: Math.round(burgerBox.height) } : null,
        hasTable: !!table,
        tableWidth: tableBox ? Math.round(tableBox.width) : null
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

  const filename = `p10_${name}_${isMobile ? 'mobile' : 'desktop'}.png`;
  await captureScreenshot(cdp, filename);
  return metrics;
}

async function main() {
  console.log("Starting Headless Chrome for Phase 10 Sponsor and Admin Navigation Audit...");
  const tempProfile = path.join(process.cwd(), '.chrome-temp-p10-sponsoradmin-profile');
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

    const sponsorSession = {
      uid: 'test-sponsor-uid',
      personaType: 'sponsor_rep',
      emailVerified: true,
      onboarded: true,
      displayName: 'Nike Talent Rep',
      email: 'sponsor@nike.com',
    };

    const adminSession = {
      uid: 'test-admin-uid',
      personaType: 'admin',
      platformRole: 'SUPER_ADMIN',
      emailVerified: true,
      onboarded: true,
      displayName: 'Sarah Connor',
      email: 'sarah.connor@crowdbeats.com',
    };

    // 1. Sponsor Studio Dashboard
    await auditPage(cdp, 'http://localhost:3000/sponsor/dashboard?preview=1', 'sponsor_dashboard', 1440, 900, false, sponsorSession);
    await auditPage(cdp, 'http://localhost:3000/sponsor/dashboard?preview=1', 'sponsor_dashboard', 390, 844, true, sponsorSession);

    // 2. Sponsor Studio Discovery
    await auditPage(cdp, 'http://localhost:3000/sponsor/discovery?preview=1', 'sponsor_discovery', 1440, 900, false, sponsorSession);
    await auditPage(cdp, 'http://localhost:3000/sponsor/discovery?preview=1', 'sponsor_discovery', 390, 844, true, sponsorSession);

    // 3. Admin Command Center
    await auditPage(cdp, 'http://localhost:3000/admin/command-center?preview=1', 'admin_command_center', 1440, 900, false, adminSession);
    await auditPage(cdp, 'http://localhost:3000/admin/command-center?preview=1', 'admin_command_center', 390, 844, true, adminSession);

    // 4. Admin Finance / Large Data Table
    await auditPage(cdp, 'http://localhost:3000/admin/finance?preview=1', 'admin_finance', 1440, 900, false, adminSession);
    await auditPage(cdp, 'http://localhost:3000/admin/finance?preview=1', 'admin_finance', 390, 844, true, adminSession);

    cdp.close();
    console.log("\n✅ Phase 10 Sponsor and Admin Navigation CDP Audit complete!");
  } catch (err) {
    console.error("Error in CDP audit:", err);
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch(console.error);
