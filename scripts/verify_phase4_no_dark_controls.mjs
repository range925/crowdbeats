import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase4_evidence";
const PORT = 9224;

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
  console.log('=== PHASE 4: REMOVE WEB DARK-MODE CONTROLS VERIFICATION ===');
  console.log('Launching headless Chrome on port', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-p4-profile')
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
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  const checks = [];

  // ── 1. Landing Page: Desktop Header & Mobile Drawer ───────────────────────
  console.log('\n--- Check 1: Landing Page Theme Toggle Removal ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/' });
  await sleep(2500);

  const landingEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasThemeToggleDesktop: !!document.querySelector('button[title*="theme" i], button[aria-label*="theme" i], .themeToggle'),
      hasDarkRadio: !!document.querySelector('button[aria-label*="dark" i]'),
    })`,
    returnByValue: true
  });
  const landingInfo = landingEval.result.value;
  console.log('  Landing Desktop Header:', landingInfo);
  checks.push({
    name: 'Landing Desktop Header: No Theme Toggle',
    passed: !landingInfo.hasThemeToggleDesktop && !landingInfo.hasDarkRadio,
    details: landingInfo
  });

  const shotRes1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p4_landing_desktop_clean.png'), Buffer.from(shotRes1.data, 'base64'));

  // Test mobile drawer toggle on landing page
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await sleep(500);

  // Click burger to open drawer
  await cdp.send('Runtime.evaluate', {
    expression: `
      const burger = document.querySelector('button[aria-label="Open menu"]');
      if (burger) burger.click();
    `
  });
  await sleep(600);

  const drawerEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasThemeToggleInDrawer: !!document.querySelector('.drawerTopActions button[title*="theme" i], .drawerTopActions button[aria-label*="theme" i]'),
    })`,
    returnByValue: true
  });
  const drawerInfo = drawerEval.result.value;
  console.log('  Landing Mobile Drawer:', drawerInfo);
  checks.push({
    name: 'Landing Mobile Drawer: No Theme Toggle',
    passed: !drawerInfo.hasThemeToggleInDrawer,
    details: drawerInfo
  });

  const shotResDrawer = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p4_landing_mobile_drawer_clean.png'), Buffer.from(shotResDrawer.data, 'base64'));

  // Reset viewport to desktop
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // ── 2. Auth Page: Appearance Selector Removal ──────────────────────────────
  console.log('\n--- Check 2: Auth Page Appearance Selector Removal ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/auth' });
  await sleep(2000);

  const authEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasAppearanceSelector: !!document.querySelector('div[aria-label="Appearance options"]'),
      hasDarkButton: !!document.querySelector('button[title="Dark theme"]'),
      hasAutoButton: !!document.querySelector('button[title="System default"]'),
    })`,
    returnByValue: true
  });
  const authInfo = authEval.result.value;
  console.log('  Auth Page:', authInfo);
  checks.push({
    name: 'Auth Page: AppearanceSelector Removed',
    passed: !authInfo.hasAppearanceSelector && !authInfo.hasDarkButton && !authInfo.hasAutoButton,
    details: authInfo
  });

  const shotRes2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p4_auth_clean.png'), Buffer.from(shotRes2.data, 'base64'));

  // ── 3. Admin Console: Segmented Theme Switch Removal ───────────────────────
  console.log('\n--- Check 3: Admin Console Theme Switch Removal ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/admin' });
  await sleep(2500);

  const adminEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasAdminThemeSwitch: !!document.querySelector('.admin-theme-switch'),
      hasAdminThemeBtns: !!document.querySelector('.admin-theme-btn'),
    })`,
    returnByValue: true
  });
  const adminInfo = adminEval.result.value;
  console.log('  Admin Console:', adminInfo);
  checks.push({
    name: 'Admin Console: Theme Switch Removed',
    passed: !adminInfo.hasAdminThemeSwitch && !adminInfo.hasAdminThemeBtns,
    details: adminInfo
  });

  const shotRes3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p4_admin_clean.png'), Buffer.from(shotRes3.data, 'base64'));

  await cdp.send('Network.enable');
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

  // ── 4. Settings Appearance: Light Mode Standard Only ───────────────────────
  console.log('\n--- Check 4: Settings Appearance Cards Standardized ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/account?section=appearance' });
  await sleep(3000);

  const settingsEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      bodyTextSnippet: document.body.innerText.substring(0, 200),
      hasLightModeStandard: document.body.innerText.includes('Light Mode (Active Standard)') || document.body.innerText.includes('Light Mode Standard'),
      hasDarkOption: document.body.innerText.includes('Deep Obsidian Pro'),
      hasSystemOption: document.body.innerText.includes('Adaptive OS Sync'),
      hasDarkThemeRadio: !!document.querySelector('div[role="radio"][aria-checked="true"]')?.innerText?.includes('Dark'),
    })`,
    returnByValue: true
  });
  const settingsInfo = settingsEval.result.value;
  console.log('  Creator Settings Appearance:', settingsInfo);
  checks.push({
    name: 'Settings: Dark/System Options Removed, Light Standard Enforced',
    passed: settingsInfo.hasLightModeStandard && !settingsInfo.hasDarkOption && !settingsInfo.hasSystemOption,
    details: settingsInfo
  });

  const shotRes4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p4_creator_settings_appearance_clean.png'), Buffer.from(shotRes4.data, 'base64'));

  // ── 5. Standalone landing.html Theme Toggle Removal ───────────────────────
  console.log('\n--- Check 5: Standalone landing.html Theme Toggle Removal ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/landing.html' });
  await sleep(1500);

  const landingHtmlEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      hasThemeToggleBtn: !!document.getElementById('themeToggleBtn'),
      hasThemeToggleIcon: !!document.getElementById('themeToggleIcon'),
    })`,
    returnByValue: true
  });
  const landingHtmlInfo = landingHtmlEval.result.value;
  console.log('  landing.html:', landingHtmlInfo);
  checks.push({
    name: 'landing.html: themeToggleBtn Removed',
    passed: !landingHtmlInfo.hasThemeToggleBtn,
    details: landingHtmlInfo
  });

  const shotRes5 = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p4_landing_html_clean.png'), Buffer.from(shotRes5.data, 'base64'));

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n================ PHASE 4 VERIFICATION RESULTS ================');
  let allPassed = true;
  for (const c of checks) {
    console.log(`[${c.passed ? 'PASS' : 'FAIL'}] ${c.name}`);
    if (!c.passed) allPassed = false;
  }

  cdp.close();
  chromeProc.kill();

  if (allPassed) {
    console.log('\nALL PHASE 4 CHECKS PASSED PERFECTLY!');
    process.exit(0);
  } else {
    console.error('\nSOME PHASE 4 CHECKS FAILED!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during Phase 4 verification:', err);
  process.exit(1);
});
