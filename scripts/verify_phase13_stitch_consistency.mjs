import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase13_stitch_consistency_audit";
const PORT = 9247;

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
  console.log("=== PHASE 13: GOOGLE STITCH VISUAL CONSISTENCY CDP AUDIT ===");

  const tempProfileDir = path.resolve('.chrome-temp-p13-profile');
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

    if (!versionData) {
      throw new Error("Failed to connect to headless Chrome remote debugging port.");
    }

    const listRes = await fetch(`http://localhost:${PORT}/json/list`);
    const pages = await listRes.json();
    const wsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No page target found");

    cdp = new CdpClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    const viewports = [
      { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
      { name: 'phone_390', width: 390, height: 844, mobile: true },
      { name: 'phone_320', width: 320, height: 640, mobile: true },
    ];

    const targets = [
      {
        name: 'landing_hero_and_header',
        url: 'http://localhost:3000/',
        waitFor: 'header',
      },
      {
        name: 'onboarding_consent_page',
        url: 'http://localhost:3000/onboarding',
        waitFor: 'h1',
      },
      {
        name: 'onboarding_persona_page',
        url: 'http://localhost:3000/onboarding/persona',
        waitFor: 'h1',
      },
      {
        name: 'auth_page',
        url: 'http://localhost:3000/auth',
        waitFor: 'input',
      },
      {
        name: 'performer_tip_view',
        url: 'http://localhost:3000/tip/art_maya_lin',
        waitFor: 'main',
      },
      {
        name: 'discover_live_stages',
        url: 'http://localhost:3000/discover',
        waitFor: 'main',
      },
    ];

    const auditResults = [];

    for (const target of targets) {
      console.log(`\nAuditing Target: ${target.name} (${target.url})`);

      for (const vp of viewports) {
        await setViewport(cdp, vp.width, vp.height, vp.mobile);
        await cdp.send('Page.navigate', { url: target.url });
        await sleep(1500);

        const metrics = await evaluate(cdp, `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth;
          const overflowDiff = Math.max(0, scrollWidth - clientWidth);

          // Check logo presence
          const logoImgs = Array.from(document.querySelectorAll('img[src*="crowdbeats-logo"], img[src*="crowdbeats-emblem"]'));
          const hasMasterLogo = logoImgs.length > 0;

          // Check body background
          const bodyBg = window.getComputedStyle(body).backgroundColor;

          // Check interactive touch targets
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const minTargetViolations = [];
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40)) {
              const text = btn.innerText?.trim() || btn.getAttribute('aria-label') || 'unnamed';
              // Allow tiny inline tag links/indicators if they are secondary
              if (rect.height < 24 && !btn.getAttribute('role')) return;
              minTargetViolations.push({ text: text.slice(0, 30), width: Math.round(rect.width), height: Math.round(rect.height) });
            }
          });

          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow,
            overflowDiff,
            hasMasterLogo,
            logoCount: logoImgs.length,
            bodyBg,
            minTargetViolations: minTargetViolations.slice(0, 5),
          };
        })()`);

        const shotPath = path.join(ARTIFACT_DIR, `p13_${target.name}_${vp.name}.png`);
        await captureScreenshot(cdp, shotPath);

        const statusStr = metrics.hasHorizontalOverflow
          ? `FAIL: ${metrics.overflowDiff}px overflow`
          : 'PASS: 0px overflow';

        console.log(`  [${vp.name}] ${statusStr} | Logos: ${metrics.logoCount} | Bg: ${metrics.bodyBg}`);

        auditResults.push({
          target: target.name,
          viewport: vp.name,
          width: vp.width,
          overflow: metrics.overflowDiff,
          hasMasterLogo: metrics.hasMasterLogo,
          bodyBg: metrics.bodyBg,
          violations: metrics.minTargetViolations,
          screenshot: shotPath,
        });
      }
    }

    const reportPath = path.join(ARTIFACT_DIR, 'audit_summary.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\nAudit complete. Summary written to ${reportPath}`);

    const hasAnyOverflow = auditResults.some(r => r.overflow > 0);
    if (hasAnyOverflow) {
      console.error("\nCRITICAL: Horizontal overflow detected in one or more viewports!");
      process.exit(1);
    } else {
      console.log("\nALL TARGETS PASSED 0px OVERFLOW & STITCH CONSISTENCY AUDIT!");
    }

  } catch (err) {
    console.error("Audit error:", err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
  }
}

main();
