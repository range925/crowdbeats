import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase12_forms_payments_audit";
const PORT = 9246;

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
  await cdp.send('Emulation.setVisibleSize', { width, height });
}

async function captureScreenshot(cdp, filePath) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result?.result?.value;
}

async function main() {
  console.log('--- Starting Phase 12 Live Forms, Auth, and Payment Flows Audit ---');
  const tempProfileDir = path.join(process.cwd(), '.chrome-temp-p12-profile');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempProfileDir}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--disable-translate',
    '--mute-audio',
    'about:blank',
  ], { detached: false });

  let connected = false;
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      versionData = await res.json();
      connected = true;
      break;
    } catch {
      await sleep(400);
    }
  }

  if (!connected || !versionData) {
    console.error('Failed to connect to headless Chrome on port', PORT);
    chromeProc.kill();
    process.exit(1);
  }

  const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const pages = await listRes.json();
  const targetPage = pages.find(p => p.type === 'page') || pages[0];

  const cdp = new CdpClient(targetPage.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');

  const testCases = [
    {
      name: 'Auth Page (Login / Register)',
      url: 'http://localhost:3000/auth',
      sizes: [
        { label: 'desktop_1440', width: 1440, height: 900, mobile: false },
        { label: 'phone_390', width: 390, height: 844, mobile: true },
        { label: 'phone_320', width: 320, height: 568, mobile: true },
      ],
      customAudit: async () => {
        return await evaluate(cdp, `(() => {
          const emailInput = document.querySelector('input[type="email"]');
          const passInput = document.querySelector('input[type="password"]');
          const tabs = Array.from(document.querySelectorAll('button[role="tab"]')).map(b => b.textContent?.trim());
          const emailFontSize = emailInput ? window.getComputedStyle(emailInput).fontSize : null;
          const passFontSize = passInput ? window.getComputedStyle(passInput).fontSize : null;
          const passHeight = passInput ? passInput.getBoundingClientRect().height : null;
          return {
            hasEmail: Boolean(emailInput),
            hasPass: Boolean(passInput),
            emailFontSize,
            passFontSize,
            passHeight,
            tabs,
            bodyBg: window.getComputedStyle(document.body).backgroundColor,
          };
        })()`);
      }
    },
    {
      name: 'Canonical Performer Tip Route',
      url: 'http://localhost:3000/tip/maya-lin',
      sizes: [
        { label: 'desktop_1440', width: 1440, height: 900, mobile: false },
        { label: 'phone_390', width: 390, height: 844, mobile: true },
        { label: 'phone_320', width: 320, height: 568, mobile: true },
      ],
      customAudit: async () => {
        return await evaluate(cdp, `(() => {
          const text = document.body.innerText;
          const hasFeeDisclosure = text.includes('6%');
          const presetBtns = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t === '$5' || t === '$10' || t === '$20');
          const cardSurface = document.querySelector('main > div, main div');
          const cardBg = cardSurface ? window.getComputedStyle(cardSurface).backgroundColor : null;
          return {
            hasFeeDisclosure,
            presetBtns,
            cardBg,
            textSnippet: text.slice(0, 160).replace(/\\s+/g, ' '),
          };
        })()`);
      }
    },
    {
      name: 'Onboarding Terms & Privacy Gate',
      url: 'http://localhost:3000/onboarding',
      sizes: [
        { label: 'desktop_1440', width: 1440, height: 900, mobile: false },
        { label: 'phone_390', width: 390, height: 844, mobile: true },
        { label: 'phone_320', width: 320, height: 568, mobile: true },
      ],
      customAudit: async () => {
        return await evaluate(cdp, `(() => {
          const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
          const buttons = Array.from(document.querySelectorAll('button'));
          const continueBtn = buttons.find(b => b.textContent?.includes('Agree') || b.textContent?.includes('Continue') || b.textContent?.includes('Proceed'));
          return {
            checkboxCount: checkboxes.length,
            continueDisabled: continueBtn ? continueBtn.disabled : null,
            bodyBg: window.getComputedStyle(document.body).backgroundColor,
          };
        })()`);
      }
    },
    {
      name: 'Onboarding Persona Selection',
      url: 'http://localhost:3000/onboarding/persona?preview=true',
      sizes: [
        { label: 'desktop_1440', width: 1440, height: 900, mobile: false },
        { label: 'phone_390', width: 390, height: 844, mobile: true },
        { label: 'phone_320', width: 320, height: 568, mobile: true },
      ],
      customAudit: async () => {
        return await evaluate(cdp, `(() => {
          const roleCards = Array.from(document.querySelectorAll('button[id^="role-card-"]')).map(b => b.id);
          const hasContinue = Boolean(Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Continue')));
          return {
            roleCards,
            hasContinue,
          };
        })()`);
      }
    }
  ];

  const results = [];

  for (const tc of testCases) {
    console.log(`\nAuditing: ${tc.name} (${tc.url})`);
    await cdp.send('Page.navigate', { url: tc.url });
    await sleep(2000);

    for (const size of tc.sizes) {
      await setViewport(cdp, size.width, size.height, size.mobile);
      await sleep(600);

      const metrics = await evaluate(cdp, `(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        const overflow = scrollWidth - clientWidth;
        return { scrollWidth, clientWidth, overflow: overflow > 1 ? overflow : 0 };
      })()`);

      const screenshotName = `p12_${tc.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${size.label}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotName);
      await captureScreenshot(cdp, screenshotPath);

      let customData = null;
      if (size.label === 'phone_390' && tc.customAudit) {
        customData = await tc.customAudit();
      }

      console.log(`  [${size.label} ${size.width}x${size.height}] overflow: ${metrics.overflow}px | screenshot: ${screenshotName}`);
      results.push({
        testCase: tc.name,
        size: size.label,
        width: size.width,
        height: size.height,
        metrics,
        screenshot: screenshotName,
        customData,
      });
    }
  }

  cdp.close();
  chromeProc.kill();

  console.log('\n--- Live CDP Audit Summary ---');
  const allNoOverflow = results.every(r => r.metrics.overflow === 0);
  console.log(`Horizontal Scroll Safety: ${allNoOverflow ? 'PASSED (0px overflow on all tested viewports)' : 'FAILED'}`);
  console.log('Audit data logged. Artifacts written to:', ARTIFACT_DIR);
}

main().catch(err => {
  console.error('Audit script encountered error:', err);
  process.exit(1);
});
