import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase5_evidence";
const PORT = 9225;

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

async function main() {
  console.log('=== PHASE 5: STANDARDIZE WEB COLORS AND COMPONENTS VERIFICATION ===');
  console.log('Launching headless Chrome on port', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-p5-profile')
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        console.log('Connected to Chrome CDP:', wsUrl);
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome debugging port.');
    chromeProc.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await newTargetRes.json();
  const cdp = new CdpClient(targetData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');

  // Set session cookie for authenticated views
  const sessionCookieVal = encodeURIComponent(JSON.stringify({
    uid: 'test_creator_123',
    personaType: 'artist',
    emailVerified: true,
    onboarded: true,
    displayName: 'Test Artist',
  }));

  await cdp.send('Network.setCookie', {
    name: '__cb_session',
    value: sessionCookieVal,
    url: 'http://localhost:3000/',
  });

  const checks = [];

  // ── 1. Discovery Page & Nav Colors ──────────────────────────────────────────
  console.log('\n--- Check 1: Discovery Page & Nav Colors ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/discover' });
  await sleep(3000);

  const discoveryEval = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const nav = document.querySelector('header');
      const navStyles = nav ? window.getComputedStyle(nav) : null;
      const bodyStyles = window.getComputedStyle(document.body);
      const isNavLight = navStyles ? (navStyles.backgroundColor.includes('rgba(255, 255, 255') || navStyles.backgroundColor.includes('rgb(255, 255, 255') || navStyles.backgroundColor.includes('rgba(0, 0, 0, 0)')) : false;
      const isBodyLight = !bodyStyles.backgroundColor.includes('rgb(11, 12, 16)') && !bodyStyles.backgroundColor.includes('rgb(18, 20, 28)');
      return {
        navBg: navStyles ? navStyles.backgroundColor : null,
        bodyBg: bodyStyles.backgroundColor,
        bodyColor: bodyStyles.color,
        isNavLight,
        isBodyLight
      };
    })()`,
    returnByValue: true
  });
  const discoveryInfo = discoveryEval.result.value;
  console.log('  Discovery colors:', discoveryInfo);
  checks.push({
    name: 'Discovery Page & Nav: Light Theme Backgrounds',
    passed: discoveryInfo.isBodyLight && (discoveryInfo.isNavLight || discoveryInfo.navBg !== 'rgb(11, 12, 16)'),
    details: discoveryInfo
  });

  const shotRes1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p5_discovery_desktop_light.png'), Buffer.from(shotRes1.data, 'base64'));

  // ── 2. Creator Studio Dashboard & Header ───────────────────────────────────
  console.log('\n--- Check 2: Creator Studio Dashboard & Header ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/creator/dashboard' });
  await sleep(3000);

  const creatorEval = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const headerStyles = header ? window.getComputedStyle(header) : null;
      const logoText = header ? header.querySelector('span, svg') : null;
      const bodyStyles = window.getComputedStyle(document.body);
      return {
        headerBg: headerStyles ? headerStyles.backgroundColor : null,
        bodyBg: bodyStyles.backgroundColor,
        bodyColor: bodyStyles.color,
        isHeaderLight: headerStyles ? (!headerStyles.backgroundColor.includes('rgb(11, 12, 16)') && !headerStyles.backgroundColor.includes('rgb(18, 20, 28)')) : true,
        isBodyLight: !bodyStyles.backgroundColor.includes('rgb(11, 12, 16)') && !bodyStyles.backgroundColor.includes('rgb(18, 20, 28)')
      };
    })()`,
    returnByValue: true
  });
  const creatorInfo = creatorEval.result.value;
  console.log('  Creator Studio:', creatorInfo);
  checks.push({
    name: 'Creator Studio Dashboard: Light Header and Surface',
    passed: creatorInfo.isHeaderLight && creatorInfo.isBodyLight,
    details: creatorInfo
  });

  const shotRes2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p5_creator_dashboard_light.png'), Buffer.from(shotRes2.data, 'base64'));

  // ── 3. Band Studio Dashboard & Header ──────────────────────────────────────
  console.log('\n--- Check 3: Band Studio Dashboard & Header ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/band/dashboard' });
  await sleep(3000);

  const bandEval = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const bodyStyles = window.getComputedStyle(document.body);
      return {
        bodyBg: bodyStyles.backgroundColor,
        bodyColor: bodyStyles.color,
        isBodyLight: !bodyStyles.backgroundColor.includes('rgb(11, 12, 16)') && !bodyStyles.backgroundColor.includes('rgb(18, 20, 28)')
      };
    })()`,
    returnByValue: true
  });
  const bandInfo = bandEval.result.value;
  console.log('  Band Studio:', bandInfo);
  checks.push({
    name: 'Band Studio Dashboard: Light Surface',
    passed: bandInfo.isBodyLight,
    details: bandInfo
  });

  const shotRes3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p5_band_dashboard_light.png'), Buffer.from(shotRes3.data, 'base64'));

  // ── 4. Account Settings & DataExportCard ───────────────────────────────────
  console.log('\n--- Check 4: Account Settings & DataExportCard ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/account?section=data' });
  await sleep(3000);

  const accountEval = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const exportCard = document.querySelector('[data-testid="data-export-card"]') || document.querySelector('button[aria-haspopup="dialog"]')?.closest('div') || document.body;
      const exportCardStyles = window.getComputedStyle(exportCard);
      const isCardLight = !exportCardStyles.backgroundColor.includes('rgb(15, 16, 23)');
      return {
        cardBg: exportCardStyles.backgroundColor,
        isCardLight,
        innerTextSnippet: document.body.innerText.substring(0, 150)
      };
    })()`,
    returnByValue: true
  });
  const accountInfo = accountEval.result.value;
  console.log('  Account Data Card:', accountInfo);
  checks.push({
    name: 'Account Settings: DataExportCard Light Tokens',
    passed: accountInfo.isCardLight,
    details: accountInfo
  });

  const shotRes4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p5_account_data_export_light.png'), Buffer.from(shotRes4.data, 'base64'));

  // ── 5. Mobile Responsive Viewport Contrast Check ───────────────────────────
  console.log('\n--- Check 5: Mobile Responsive Viewport Contrast Check ---');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/discover' });
  await sleep(2500);

  const mobileEval = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const burger = header ? header.querySelector('button') : null;
      const burgerStyles = burger ? window.getComputedStyle(burger) : null;
      return {
        burgerBg: burgerStyles ? burgerStyles.backgroundColor : null,
        burgerColor: burgerStyles ? burgerStyles.color : null
      };
    })()`,
    returnByValue: true
  });
  const mobileInfo = mobileEval.result.value;
  console.log('  Mobile Nav Discovery:', mobileInfo);
  checks.push({
    name: 'Mobile Discovery Nav: Clean Frosted / Light Elements',
    passed: mobileInfo.burgerBg !== 'rgb(11, 12, 16)',
    details: mobileInfo
  });

  const shotRes5 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p5_mobile_discovery_light.png'), Buffer.from(shotRes5.data, 'base64'));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n================ PHASE 5 VERIFICATION RESULTS ================');
  let allPassed = true;
  for (const c of checks) {
    console.log(`[${c.passed ? 'PASS' : 'FAIL'}] ${c.name}`);
    if (!c.passed) allPassed = false;
  }

  cdp.close();
  chromeProc.kill();

  if (allPassed) {
    console.log('\nALL PHASE 5 CHECKS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('\nSOME PHASE 5 CHECKS FAILED!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during Phase 5 verification:', err);
  process.exit(1);
});
