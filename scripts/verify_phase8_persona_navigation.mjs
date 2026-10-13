import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase8_audit";
const PORT = 9229;

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
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
    screenWidth: width,
    screenHeight: height,
  });
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error('Eval failed: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

async function takeScreenshot(cdp, filePath) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
}

async function main() {
  console.log('=== PHASE 8: PERSONA-SPECIFIC NAVIGATION PATTERNS VERIFICATION ===');
  console.log('Launching headless Chrome on port', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-p8-profile')
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

  const setCookie = async (role, platformRole = null) => {
    const sessionObj = {
      uid: 'test_' + role + '_123',
      personaType: role,
      emailVerified: true,
      onboarded: true,
      displayName: 'Test ' + role,
    };
    if (platformRole) {
      sessionObj.platformRole = platformRole;
    }
    const val = encodeURIComponent(JSON.stringify(sessionObj));
    await cdp.send('Network.setCookie', {
      name: '__cb_session',
      value: val,
      url: 'http://localhost:3000/',
    });
  };

  const personas = [
    {
      name: 'Fan Portal',
      role: 'fan',
      url: 'http://localhost:3000/fan',
      desktopSelector: 'aside',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-fan-mobile-drawer',
      desktopShot: 'p8_fan_desktop.png',
      mobileShot: 'p8_fan_mobile_drawer.png',
      expectedGroups: ['DISCOVER & LIVE', 'WALLET & SETTINGS'],
      checkBottomTabs: true,
    },
    {
      name: 'Creator Studio',
      role: 'artist',
      url: 'http://localhost:3000/creator/dashboard?preview=1',
      desktopSelector: '.creator-sidebar-desktop',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-creator-mobile-drawer',
      desktopShot: 'p8_creator_desktop.png',
      mobileShot: 'p8_creator_mobile_drawer.png',
      expectedGroups: ['STUDIO', 'COMMUNITY & EARNINGS', 'SETTINGS & SECURITY'],
      checkBottomTabs: false,
    },
    {
      name: 'Band Studio',
      role: 'artist',
      url: 'http://localhost:3000/band/dashboard?preview=1',
      desktopSelector: '.band-sidebar-desktop',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-band-mobile-drawer',
      desktopShot: 'p8_band_desktop.png',
      mobileShot: 'p8_band_mobile_drawer.png',
      expectedGroups: ['BAND OVERVIEW', 'COMMUNITY & MONETIZATION', 'MANAGEMENT & GOVERNANCE', 'SETTINGS & SECURITY'],
      checkBottomTabs: false,
    },
    {
      name: 'Sponsor Studio',
      role: 'sponsor_rep',
      url: 'http://localhost:3000/sponsor/dashboard?preview=1',
      desktopSelector: '.sponsor-sidebar-desktop',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-sponsor-mobile-drawer',
      desktopShot: 'p8_sponsor_desktop.png',
      mobileShot: 'p8_sponsor_mobile_drawer.png',
      expectedGroups: ['CAMPAIGNS & TALENT', 'COMMUNICATIONS & ROI', 'ORGANIZATION & SETTINGS'],
      checkBottomTabs: false,
    },
    {
      name: 'Venue Studio',
      role: 'venue_manager',
      url: 'http://localhost:3000/venue/dashboard?preview=1',
      desktopSelector: '.venue-sidebar-desktop',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-venue-mobile-drawer',
      desktopShot: 'p8_venue_desktop.png',
      mobileShot: 'p8_venue_mobile_drawer.png',
      expectedGroups: ['STAGES & LIVE', 'DIRECTORY & INSIGHTS', 'OPERATIONS & SETTINGS'],
      checkBottomTabs: false,
    },
    {
      name: 'Admin Control Plane',
      role: 'admin',
      platformRole: 'SUPER_ADMIN',
      url: 'http://localhost:3000/admin',
      desktopSelector: '.admin-sidebar',
      triggerSelector: 'button.admin-hamburger-btn',
      dialogSelector: '#admin-mobile-drawer',
      desktopShot: 'p8_admin_desktop.png',
      mobileShot: 'p8_admin_mobile_drawer.png',
      expectedGroups: ['GOVERNANCE', 'GROWTH', 'PLATFORM'],
      checkBottomTabs: false,
    },
  ];

  let allPassed = true;

  for (const p of personas) {
    console.log(`\n========================================`);
    console.log(`Auditing Persona Navigation: ${p.name}`);
    console.log(`========================================`);

    await setCookie(p.role, p.platformRole);

    // 1. DESKTOP VIEWPORT (1440x900)
    console.log(`1. Desktop Navigation (1440x900)`);
    await setViewport(cdp, 1440, 900, false);
    await cdp.send('Page.navigate', { url: p.url });
    await sleep(2500);

    const desktopVisible = await evaluate(cdp, `
      (() => {
        const el = document.querySelector('${p.desktopSelector}');
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      })()
    `);

    if (desktopVisible) {
      console.log(`  [PASS] Desktop sidebar visible (${p.desktopSelector})`);
    } else {
      console.error(`  [FAIL] Desktop sidebar missing or hidden`);
      allPassed = false;
    }

    // Verify active link has aria-current="page"
    const activeRouteHasAria = await evaluate(cdp, `
      Boolean(document.querySelector('${p.desktopSelector} a[aria-current="page"]'))
    `);
    if (activeRouteHasAria) {
      console.log(`  [PASS] Active route has aria-current="page"`);
    } else {
      console.warn(`  [WARN] No aria-current="page" link found on desktop sidebar`);
    }

    // Take desktop screenshot
    const desktopPath = path.join(ARTIFACT_DIR, p.desktopShot);
    await takeScreenshot(cdp, desktopPath);
    console.log(`  [SAVED] Desktop screenshot: ${desktopPath}`);

    // 2. MOBILE VIEWPORT (390x844)
    console.log(`2. Mobile Navigation (390x844)`);
    await setViewport(cdp, 390, 844, true);
    await sleep(1000);

    if (p.checkBottomTabs) {
      const bottomTabsCount = await evaluate(cdp, `
        document.querySelectorAll('nav[aria-label="Mobile navigation"] a').length
      `);
      if (bottomTabsCount === 5) {
        console.log(`  [PASS] 5 high-frequency mobile bottom tabs present`);
      } else {
        console.error(`  [FAIL] Expected 5 bottom tabs, found: ${bottomTabsCount}`);
        allPassed = false;
      }
    }

    // Trigger mobile drawer
    const triggerFound = await evaluate(cdp, `
      Boolean(document.querySelector('${p.triggerSelector}'))
    `);

    if (!triggerFound) {
      console.error(`  [FAIL] Mobile hamburger trigger missing: ${p.triggerSelector}`);
      allPassed = false;
      continue;
    }

    await evaluate(cdp, `document.querySelector('${p.triggerSelector}').click();`);
    await sleep(600);

    const drawerOpened = await evaluate(cdp, `
      (() => {
        const d = document.querySelector('${p.dialogSelector}');
        if (!d) return false;
        const style = window.getComputedStyle(d);
        const hasOpenClass = d.classList.contains('open');
        return hasOpenClass || (!d.hasAttribute('hidden') && style.display !== 'none' && style.visibility !== 'hidden');
      })()
    `);

    if (drawerOpened) {
      console.log(`  [PASS] Mobile drawer opened: ${p.dialogSelector}`);
    } else {
      console.error(`  [FAIL] Mobile drawer failed to open`);
      allPassed = false;
    }

    // Take mobile drawer screenshot
    const mobilePath = path.join(ARTIFACT_DIR, p.mobileShot);
    await takeScreenshot(cdp, mobilePath);
    console.log(`  [SAVED] Mobile drawer screenshot: ${mobilePath}`);
  }

  cdp.close();
  chromeProc.kill();

  console.log('\n================ PHASE 8 VERIFICATION SUMMARY ================');
  if (allPassed) {
    console.log('ALL PERSONA-SPECIFIC NAVIGATION PATTERNS PASSED!');
    process.exit(0);
  } else {
    console.error('ONE OR MORE TESTS FAILED.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Phase 8 verification error:', err);
  process.exit(1);
});
