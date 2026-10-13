import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase14_edge_audit";
const PORT = 9248;

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
    deviceScaleFactor: 1,
    mobile,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });
}

async function captureScreenshot(cdp, filePath) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  return res.result?.value;
}

async function main() {
  console.log("=== PHASE 14: MICROSOFT EDGE (CHROMIUM) CROSS-BROWSER AUDIT ===");

  const tempProfileDir = path.resolve('.chrome-temp-p14-edge-profile');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const edgeProc = spawn(EDGE_PATH, [
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

    if (!versionData) {
      throw new Error("Failed to connect to Microsoft Edge remote debugging port.");
    }

    console.log(`Connected to Edge browser: ${versionData.Browser}`);

    const listRes = await fetch(`http://localhost:${PORT}/json/list`);
    const pages = await listRes.json();
    const wsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No page target found in Edge");

    cdp = new CdpClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    const viewports = [
      { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
      { name: 'phone_390', width: 390, height: 844, mobile: true },
      { name: 'phone_320', width: 320, height: 640, mobile: true },
    ];

    const targets = [
      { name: 'edge_landing', url: 'http://localhost:3000/' },
      { name: 'edge_onboarding', url: 'http://localhost:3000/onboarding' },
      { name: 'edge_persona', url: 'http://localhost:3000/onboarding/persona' },
      { name: 'edge_auth', url: 'http://localhost:3000/auth' },
      { name: 'edge_discover', url: 'http://localhost:3000/discover' },
      { name: 'edge_tip', url: 'http://localhost:3000/tip/art_maya_lin' },
      { name: 'edge_fan_receipts', url: 'http://localhost:3000/fan/receipts' },
      { name: 'edge_creator_campaign', url: 'http://localhost:3000/creator/campaigns/new' },
    ];

    const auditResults = [];

    for (const target of targets) {
      console.log(`\nAuditing Target in Edge: ${target.name} (${target.url})`);

      for (const vp of viewports) {
        console.log(`  Setting viewport ${vp.name}...`);
        await setViewport(cdp, vp.width, vp.height, vp.mobile);
        console.log(`  Navigating to ${target.url}...`);
        await cdp.send('Page.navigate', { url: target.url });
        await sleep(1500);
        console.log(`  Evaluating metrics...`);

        const metrics = await evaluate(cdp, `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;
          const overflowDiff = Math.max(0, scrollWidth - clientWidth);
          const bodyBg = window.getComputedStyle(body).backgroundColor;

          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow,
            overflowDiff,
            bodyBg,
          };
        })()`);

        const shotPath = path.join(ARTIFACT_DIR, `p14_${target.name}_${vp.name}.png`);
        await captureScreenshot(cdp, shotPath);

        const statusStr = metrics.hasHorizontalOverflow
          ? `FAIL: ${metrics.overflowDiff}px overflow`
          : 'PASS: 0px overflow';

        console.log(`  [${vp.name}] ${statusStr} | Bg: ${metrics.bodyBg}`);

        auditResults.push({
          browser: 'Microsoft Edge (Chromium)',
          target: target.name,
          viewport: vp.name,
          width: vp.width,
          overflow: metrics.overflowDiff,
          bodyBg: metrics.bodyBg,
          screenshot: shotPath,
        });
      }
    }

    const reportPath = path.join(ARTIFACT_DIR, 'edge_audit_summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\nEdge audit complete. Summary written to ${reportPath}`);

    const hasAnyOverflow = auditResults.some(r => r.overflow > 0);
    if (hasAnyOverflow) {
      console.error("\nCRITICAL: Horizontal overflow detected in Microsoft Edge!");
      process.exit(1);
    } else {
      console.log("\nALL TARGETS IN MICROSOFT EDGE PASSED 0px OVERFLOW AUDIT!");
    }

  } catch (err) {
    console.error("Edge audit error:", err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    edgeProc.kill();
  }
}

main();
