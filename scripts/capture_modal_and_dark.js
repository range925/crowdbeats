const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9225;
const width = 1440;
const height = 960;
const tempUserDataDir = path.join(os.tmpdir(), 'chrome_admin_modal_' + Date.now());

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
      if (pageTab) return pageTab.webSocketDebuggerUrl;
      if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) return tabs[0].webSocketDebuggerUrl;
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

    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try {
          document.cookie = '__cb_session=${cookieString}; path=/; max-age=86400';
          localStorage.setItem('cb_privacy_consent_v1', JSON.stringify(${JSON.stringify(consentRecord)}));
        } catch (e) {}
      `
    });

    await send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(1500);

    // 1. User detail page with Edit Profile Modal
    console.log('Navigating to Maya Rivers user detail...');
    await send('Page.navigate', { url: 'http://localhost:3000/admin/crm/usr_maya_rivers' });
    await sleep(4000);

    console.log('Clicking Profile tab and opening Edit Profile modal...');
    await send('Runtime.evaluate', {
      expression: `
        // Click Profile tab
        const buttons = Array.from(document.querySelectorAll('button'));
        const profileTab = buttons.find(b => b.textContent && b.textContent.includes('Profile'));
        if (profileTab) profileTab.click();
      `
    });
    await sleep(1000);

    await send('Runtime.evaluate', {
      expression: `
        // Click Edit Profile button
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(b => b.textContent && b.textContent.includes('Edit Profile'));
        if (editBtn) editBtn.click();
      `
    });
    await sleep(1200);

    // Make an edit in the modal to trigger the before/after diff preview
    await send('Runtime.evaluate', {
      expression: `
        const inputs = Array.from(document.querySelectorAll('input, textarea'));
        const bioInput = inputs.find(i => i.placeholder && i.placeholder.includes('artist biography') || i.name === 'bio');
        if (bioInput) {
          bioInput.value = 'Indie electronic & synthpop headliner from Austin, TX. Featuring analog synths and spatial live reverb.';
          bioInput.dispatchEvent(new Event('input', { bubbles: true }));
          bioInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const reasonInput = inputs.find(i => i.placeholder && i.placeholder.includes('Explain why this change is necessary') || i.name === 'reason');
        if (reasonInput) {
          reasonInput.value = 'Verified promotional headline change requested by artist management via ticket TKT-8901.';
          reasonInput.dispatchEvent(new Event('input', { bubbles: true }));
          reasonInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `
    });
    await sleep(1000);

    console.log('Capturing admin_user_edit_modal.png...');
    const modalRes = await send('Page.captureScreenshot', { format: 'png' });
    const modalBuf = Buffer.from(modalRes.data, 'base64');
    fs.writeFileSync(path.join(artifactDir, 'admin_user_edit_modal.png'), modalBuf);
    console.log('✓ Saved admin_user_edit_modal.png');

    // 2. Dark Mode Command Center
    console.log('Navigating to Command Center in Dark Theme...');
    await send('Page.navigate', { url: 'http://localhost:3000/admin/command-center' });
    await sleep(3500);

    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.dataset.theme = 'dark';
      `
    });
    await sleep(1000);

    console.log('Capturing admin_command_center_dark.png...');
    const darkRes = await send('Page.captureScreenshot', { format: 'png' });
    const darkBuf = Buffer.from(darkRes.data, 'base64');
    fs.writeFileSync(path.join(artifactDir, 'admin_command_center_dark.png'), darkBuf);
    console.log('✓ Saved admin_command_center_dark.png');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(tempUserDataDir, { recursive: true, force: true }); } catch {}
  }
}

run();
