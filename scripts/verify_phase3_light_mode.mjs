import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase3_evidence";
const PORT = 9223;

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
  console.log('=== PHASE 3: WEB-ONLY LIGHT THEME ENFORCEMENT VERIFICATION ===');
  console.log('Launching headless Chrome with remote debugging on port', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-p3-profile')
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

  // Emulate OS dark mode (prefers-color-scheme: dark)
  console.log('\n--- Test 1: Simulating OS prefers-color-scheme: dark ---');
  await cdp.send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-color-scheme', value: 'dark' }]
  });

  const testPages = [
    { name: 'Landing Page', url: 'http://localhost:3000/', filename: 'p3_landing_os_dark' },
    { name: 'Auth Portal', url: 'http://localhost:3000/auth', filename: 'p3_auth_os_dark' },
    { name: 'Admin Console', url: 'http://localhost:3000/admin', filename: 'p3_admin_os_dark' },
    { name: 'Fan Nearby Map', url: 'http://localhost:3000/fan/nearby', filename: 'p3_nearby_os_dark' },
    { name: 'Terms of Service', url: 'http://localhost:3000/terms', filename: 'p3_terms_os_dark' },
  ];

  const results = [];

  for (const page of testPages) {
    console.log(`Navigating to ${page.name} (${page.url}) under emulated dark OS...`);
    await cdp.send('Page.navigate', { url: page.url });
    await sleep(2500);

    const evalRes = await cdp.send('Runtime.evaluate', {
      expression: `({
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasDarkClass: document.documentElement.classList.contains('dark'),
        colorScheme: document.documentElement.style.colorScheme,
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyColor: window.getComputedStyle(document.body).color,
        localStorageTheme: localStorage.getItem('crowdbeats-theme-preference'),
      })`,
      returnByValue: true
    });

    const info = evalRes.result.value;
    console.log(`  DOM attributes: data-theme="${info.dataTheme}", hasDarkClass=${info.hasDarkClass}, colorScheme="${info.colorScheme}"`);
    console.log(`  Computed styles: bodyBg="${info.bodyBg}", bodyColor="${info.bodyColor}"`);
    console.log(`  LocalStorage theme: "${info.localStorageTheme}"`);

    const isLightModeEnforced = info.dataTheme === 'light' &&
      !info.hasDarkClass &&
      info.colorScheme === 'light' &&
      (info.bodyBg === 'rgb(251, 251, 253)' || info.bodyBg === 'rgb(255, 255, 255)' || info.bodyBg === 'rgba(0, 0, 0, 0)');

    results.push({
      page: page.name,
      url: page.url,
      passed: isLightModeEnforced,
      ...info
    });

    const shotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, `${page.filename}.png`);
    fs.writeFileSync(shotPath, Buffer.from(shotRes.data, 'base64'));
    console.log(`  Saved screenshot: ${shotPath}`);
  }

  console.log('\n--- Test 2: Forcing dark mode in localStorage and reloading ---');
  await cdp.send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('crowdbeats-theme-preference', 'dark');
      localStorage.setItem('crowdbeats_theme', 'dark');
      localStorage.setItem('crowdbeats_admin_theme', 'dark');
    `
  });
  console.log('Set localStorage theme keys to "dark"');

  console.log('Reloading page...');
  await cdp.send('Page.reload');
  await sleep(2500);

  const reloadEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      dataTheme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      colorScheme: document.documentElement.style.colorScheme,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      localStorageTheme: localStorage.getItem('crowdbeats-theme-preference'),
      legacyTheme: localStorage.getItem('crowdbeats_theme'),
    })`,
    returnByValue: true
  });

  const reloadInfo = reloadEval.result.value;
  console.log('Post-reload state:');
  console.log(`  data-theme: "${reloadInfo.dataTheme}"`);
  console.log(`  hasDarkClass: ${reloadInfo.hasDarkClass}`);
  console.log(`  colorScheme: "${reloadInfo.colorScheme}"`);
  console.log(`  bodyBg: "${reloadInfo.bodyBg}"`);
  console.log(`  localStorage theme: "${reloadInfo.localStorageTheme}"`);
  console.log(`  localStorage legacy: "${reloadInfo.legacyTheme}"`);

  const reloadPassed = reloadInfo.dataTheme === 'light' &&
    !reloadInfo.hasDarkClass &&
    reloadInfo.localStorageTheme === 'light';

  console.log('\n--- Test 3: Standalone landing.html light mode verification ---');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/landing.html' });
  await sleep(1500);

  const landingHtmlEval = await cdp.send('Runtime.evaluate', {
    expression: `({
      dataTheme: document.documentElement.getAttribute('data-theme'),
      hasDarkClass: document.documentElement.classList.contains('dark'),
      hasLightClass: document.documentElement.classList.contains('light'),
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
    })`,
    returnByValue: true
  });
  const landingHtmlInfo = landingHtmlEval.result.value;
  console.log(`landing.html: hasDarkClass=${landingHtmlInfo.hasDarkClass}, hasLightClass=${landingHtmlInfo.hasLightClass}, dataTheme=${landingHtmlInfo.dataTheme}`);

  const shotResLanding = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'p3_landing_html_light.png'), Buffer.from(shotResLanding.data, 'base64'));

  // Summary
  console.log('\n================ VERIFICATION SUMMARY ================');
  let allPassed = reloadPassed && !landingHtmlInfo.hasDarkClass;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.page}: data-theme="${r.dataTheme}", darkClass=${r.hasDarkClass}`);
    if (!r.passed) allPassed = false;
  }
  console.log(`[${reloadPassed ? 'PASS' : 'FAIL'}] LocalStorage Dark Override Immunity & Persistence on Reload`);
  console.log(`[${!landingHtmlInfo.hasDarkClass ? 'PASS' : 'FAIL'}] Standalone landing.html Light Standardization`);

  cdp.close();
  chromeProc.kill();

  if (allPassed) {
    console.log('\nALL PHASE 3 ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\nSOME PHASE 3 TESTS FAILED!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
