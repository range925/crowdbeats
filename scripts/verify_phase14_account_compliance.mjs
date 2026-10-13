import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase14_audit";
const PORT = 9241;

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
      const shell = document.querySelector('.cb-account-shell, .cb-statement-container, main');
      const shellBg = shell ? window.getComputedStyle(shell).backgroundColor : null;
      const heading = document.querySelector('h1, h2');
      const headingColor = heading ? window.getComputedStyle(heading).color : null;
      const cards = document.querySelectorAll('.cb-account-card, .cb-profile-card');

      return {
        viewportWidth: docW,
        scrollWidth: scrollW,
        hasHorizontalOverflow: scrollW > docW + 1,
        bodyBg,
        shellBg,
        headingColor,
        cardCount: cards.length
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

  const filename = `p14_${name}_${isMobile ? 'mobile' : 'desktop'}.png`;
  await captureScreenshot(cdp, filename);
  return metrics;
}

async function main() {
  console.log("Starting Headless Chrome for Phase 14 Account Center & Compliance Audit...");
  const tempProfile = path.join(process.cwd(), '.chrome-temp-p14-profile');
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

    // 1. Account Center root (Profile & Overview)
    await auditPage(cdp, 'http://localhost:3000/account', 'account_root', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/account', 'account_root', 390, 844, true);

    // 2. Account Center Legal Section
    await auditPage(cdp, 'http://localhost:3000/account?section=legal', 'account_legal', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/account?section=legal', 'account_legal', 390, 844, true);

    // 3. Legal Terms public compliance view
    await auditPage(cdp, 'http://localhost:3000/legal/terms', 'legal_terms', 1440, 900, false);
    await auditPage(cdp, 'http://localhost:3000/legal/terms', 'legal_terms', 390, 844, true);

    cdp.close();
    console.log("\n✅ Phase 14 Chrome CDP Verification complete!");
  } catch (err) {
    console.error("Error in CDP verification:", err);
  } finally {
    try {
      chromeProc.kill();
    } catch {}
  }
}

main().catch(console.error);
