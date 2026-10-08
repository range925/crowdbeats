const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9224;
const width = 1440;
const height = 960;
const tempUserDataDir = path.join(os.tmpdir(), 'chrome_admin_cdp_' + Date.now());

const artifactDir = 'C:/Users/Knauf/.gemini/antigravity/brain/60ab879b-06db-4ab7-bd6d-102421ad9d52';

const sessionCookie = {
  uid: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2',
  displayName: 'Crowdbeats Admin',
  email: 'crowdbeatsllc@gmail.com',
  personaType: 'staff',
  platformRole: 'SUPER_ADMIN',
  emailVerified: true,
  onboarded: true,
};

const consentRecord = {
  version: '2026.1',
  status: 'accepted_all',
  timestamp: new Date().toISOString(),
  strictlyNecessary: true,
  analytics: true,
  ephemeralGeolocation: true,
  doNotSellOrShare: false,
  ccpaSection1798Acknowledged: true,
  gdprArticle15Acknowledged: true,
};

const routes = [
  { url: 'http://localhost:3000/admin/command-center', file: 'admin_command_center.png', name: 'Command Center' },
  { url: 'http://localhost:3000/admin/crm', file: 'admin_crm_directory.png', name: 'CRM Directory' },
  { url: 'http://localhost:3000/admin/crm/usr_maya_rivers', file: 'admin_crm_user_detail.png', name: 'User Workspace (CRM [id])' },
  { url: 'http://localhost:3000/admin/support', file: 'admin_support_queue.png', name: 'Support Queue' },
  { url: 'http://localhost:3000/admin/finance', file: 'admin_finance_reconciliation.png', name: 'Finance & Reconciliation' },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTab) {
        return pageTab.webSocketDebuggerUrl;
      }
      if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        return tabs[0].webSocketDebuggerUrl;
      }
    } catch (e) {}
  }
  throw new Error('Chrome remote debugging did not respond');
}

async function run() {
  console.log('Launching headless Chrome on port', debugPort);
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--disable-extensions',
    '--disable-background-networking',
    `--window-size=${width},${height}`,
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to CDP page tab:', wsUrl);

    const ws = new WebSocket(wsUrl);
    let msgId = 1;

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => ws.addEventListener('open', r));
    console.log('WebSocket open.');

    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const cookieString = encodeURIComponent(JSON.stringify(sessionCookie));

    // Script to ensure cookie and consent localStorage are present on every single document load
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try {
          document.cookie = '__cb_session=${cookieString}; path=/; max-age=86400';
          localStorage.setItem('cb_privacy_consent_v1', JSON.stringify(${JSON.stringify(consentRecord)}));
        } catch (e) {}
      `
    });

    // Warm up the origin
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2000);

    // Host-only cookie without domain
    await send('Network.setCookie', {
      name: '__cb_session',
      value: cookieString,
      url: 'http://localhost:3000',
      path: '/',
    });

    for (const route of routes) {
      console.log(`\nNavigating to ${route.name} (${route.url})...`);
      
      // Ensure cookie before each navigation
      await send('Network.setCookie', {
        name: '__cb_session',
        value: cookieString,
        url: 'http://localhost:3000',
        path: '/',
      });

      await send('Page.navigate', { url: route.url });
      
      // Give Next.js time to compile and render
      await sleep(5000);

      const urlRes = await send('Runtime.evaluate', { expression: 'window.location.href' });
      const titleRes = await send('Runtime.evaluate', { expression: 'document.title' });
      console.log(`Page URL: ${urlRes?.result?.value} | Title: ${titleRes?.result?.value}`);

      // Dismiss any remaining consent banner if still visible
      await send('Runtime.evaluate', {
        expression: `
          try {
            localStorage.setItem('cb_privacy_consent_v1', JSON.stringify(${JSON.stringify(consentRecord)}));
            const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Accept All'));
            if (acceptBtn) acceptBtn.click();
          } catch(e) {}
        `
      });
      await sleep(500);

      console.log(`Capturing screenshot for ${route.name}...`);
      const result = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(result.data, 'base64');
      const outPath = path.join(artifactDir, route.file);
      fs.writeFileSync(outPath, buffer);
      console.log(`✓ Saved screenshot (${buffer.length} bytes) to ${outPath}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch {}
    console.log('Finished capturing all admin views.');
  }
}

run();
