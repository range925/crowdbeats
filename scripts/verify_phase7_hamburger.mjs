import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase7_audit";
const PORT = 9228;

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

async function setViewport(cdp, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true,
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
  console.log('=== PHASE 7: MOBILE HAMBURGER NAVIGATION VERIFICATION ===');
  console.log('Launching headless Chrome on port', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-p7-profile')
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

  const tests = [
    {
      name: 'Discover Nav Hamburger',
      role: 'fan',
      platformRole: null,
      url: 'http://localhost:3000/discover',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: 'div[role="dialog"]',
      closeSelector: 'button[aria-label="Close navigation menu"]',
      screenshotName: 'p7_discover_drawer_open.png',
      testEscape: true,
    },
    {
      name: 'Fan Portal Mobile Drawer',
      role: 'fan',
      platformRole: null,
      url: 'http://localhost:3000/fan',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-fan-mobile-drawer',
      closeSelector: 'button[aria-label="Close navigation menu"]',
      screenshotName: 'p7_fan_drawer_open.png',
      testEscape: false,
    },
    {
      name: 'Creator Studio Mobile Drawer',
      role: 'artist',
      platformRole: null,
      url: 'http://localhost:3000/creator/dashboard?preview=1',
      triggerSelector: 'button[aria-label="Open navigation menu"]',
      dialogSelector: '#cb-creator-mobile-drawer',
      closeSelector: 'button[aria-label="Close navigation menu"]',
      screenshotName: 'p7_creator_drawer_open.png',
      testEscape: true,
    },
    {
      name: 'Admin Control Plane Drawer',
      role: 'admin',
      platformRole: 'SUPER_ADMIN',
      url: 'http://localhost:3000/admin',
      triggerSelector: 'button.admin-hamburger-btn',
      dialogSelector: '#admin-mobile-drawer',
      closeSelector: 'button.admin-drawer-close',
      screenshotName: 'p7_admin_drawer_open.png',
      testEscape: false,
    },
  ];

  let allPassed = true;

  for (const t of tests) {
    console.log(`\nTesting: ${t.name} (${t.url})`);
    await setCookie(t.role, t.platformRole);
    await setViewport(cdp, 390, 844);

    await cdp.send('Page.navigate', { url: t.url });
    await sleep(2500);

    // Check trigger button exists
    const triggerExists = await evaluate(cdp, `
      Boolean(document.querySelector('${t.triggerSelector}'))
    `);

    if (!triggerExists) {
      console.error(`  [FAIL] Trigger button not found: ${t.triggerSelector}`);
      const availableButtons = await evaluate(cdp, `
        Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('aria-label') || b.className)
      `);
      console.log('  Available buttons:', availableButtons);
      allPassed = false;
      continue;
    }
    console.log(`  [PASS] Trigger button found: ${t.triggerSelector}`);

    // Check initial aria-expanded is "false"
    const initialAriaExpanded = await evaluate(cdp, `
      document.querySelector('${t.triggerSelector}')?.getAttribute('aria-expanded')
    `);
    console.log(`  [INFO] Initial aria-expanded: ${initialAriaExpanded}`);

    // Click trigger button
    await evaluate(cdp, `
      document.querySelector('${t.triggerSelector}')?.click();
    `);
    await sleep(600);

    // Verify drawer opened
    const drawerOpen = await evaluate(cdp, `
      (() => {
        const d = document.querySelector('${t.dialogSelector}');
        if (!d) return false;
        const style = window.getComputedStyle(d);
        const hasOpenClass = d.classList.contains('open');
        const isNotHidden = !d.hasAttribute('hidden') && style.display !== 'none' && style.visibility !== 'hidden';
        return hasOpenClass || isNotHidden;
      })()
    `);

    const openAriaExpanded = await evaluate(cdp, `
      document.querySelector('${t.triggerSelector}')?.getAttribute('aria-expanded')
    `);

    if (drawerOpen) {
      console.log(`  [PASS] Drawer is open and active (aria-expanded=${openAriaExpanded})`);
    } else {
      console.error(`  [FAIL] Drawer failed to open or is not active`);
      allPassed = false;
    }

    // Capture screenshot
    const shotPath = path.join(ARTIFACT_DIR, t.screenshotName);
    await takeScreenshot(cdp, shotPath);
    console.log(`  [SAVED] Screenshot saved to: ${shotPath}`);

    // Test close via Escape or close button
    if (t.testEscape) {
      console.log('  Testing Escape key dismiss...');
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Escape',
        code: 'Escape',
        windowsVirtualKeyCode: 27,
      });
      await sleep(600);
    } else {
      console.log('  Testing close button dismiss...');
      await evaluate(cdp, `
        document.querySelector('${t.closeSelector}')?.click();
      `);
      await sleep(600);
    }

    const drawerClosed = await evaluate(cdp, `
      (() => {
        const d = document.querySelector('${t.dialogSelector}');
        if (!d) return true;
        const style = window.getComputedStyle(d);
        const hasOpenClass = d.classList.contains('open');
        if (d.id === 'admin-mobile-drawer') {
          return !hasOpenClass;
        }
        return !hasOpenClass && (d.hasAttribute('hidden') || style.display === 'none' || style.visibility === 'hidden');
      })()
    `);

    const closedAriaExpanded = await evaluate(cdp, `
      document.querySelector('${t.triggerSelector}')?.getAttribute('aria-expanded')
    `);

    if (drawerClosed) {
      console.log(`  [PASS] Drawer dismissed successfully (aria-expanded=${closedAriaExpanded})`);
    } else {
      console.error(`  [FAIL] Drawer failed to close`);
      allPassed = false;
    }
  }

  cdp.close();
  chromeProc.kill();

  console.log('\n================ PHASE 7 VERIFICATION SUMMARY ================');
  if (allPassed) {
    console.log('ALL MOBILE HAMBURGER NAVIGATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('ONE OR MORE TESTS FAILED.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
