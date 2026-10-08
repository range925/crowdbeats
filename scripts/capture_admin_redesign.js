const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9226;
const tempUserDataDir = path.join(os.tmpdir(), 'chrome_admin_redesign_cdp_' + Date.now());
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

const cookieString = encodeURIComponent(JSON.stringify(sessionCookie));

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
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
    '--window-size=1440,960',
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

    await new Promise(res => ws.addEventListener('open', res));
    await send('Network.enable');
    await send('Page.enable');
    await send('Runtime.enable');

    // Injected script for consent & cookie on EVERY document load
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

    const captures = [
      {
        name: 'Command Center (Desktop 1440px Light)',
        url: 'http://localhost:3000/admin/command-center',
        file: 'admin_redesign_command_center_desktop.png',
        width: 1440,
        height: 960,
        theme: 'light',
      },
      {
        name: 'Command Center (Desktop 1440px Dark)',
        url: 'http://localhost:3000/admin/command-center',
        file: 'admin_redesign_command_center_dark.png',
        width: 1440,
        height: 960,
        theme: 'dark',
      },
      {
        name: 'CRM Directory (Desktop 1440px)',
        url: 'http://localhost:3000/admin/crm',
        file: 'admin_redesign_crm_directory.png',
        width: 1440,
        height: 960,
        theme: 'light',
      },
      {
        name: 'Unified User Workspace (Desktop 1440px)',
        url: 'http://localhost:3000/admin/crm/usr_maya_rivers',
        file: 'admin_redesign_crm_user_detail.png',
        width: 1440,
        height: 960,
        theme: 'light',
      },
      {
        name: 'Support Queue (Desktop 1440px)',
        url: 'http://localhost:3000/admin/support',
        file: 'admin_redesign_support_queue.png',
        width: 1440,
        height: 960,
        theme: 'light',
      },
      {
        name: 'Finance & Reconciliation (Desktop 1440px)',
        url: 'http://localhost:3000/admin/finance',
        file: 'admin_redesign_finance.png',
        width: 1440,
        height: 960,
        theme: 'light',
      },
      {
        name: 'Command Center (Tablet 1024px)',
        url: 'http://localhost:3000/admin/command-center',
        file: 'admin_redesign_tablet_1024.png',
        width: 1024,
        height: 768,
        theme: 'light',
      },
      {
        name: 'Command Center (Mobile 390px)',
        url: 'http://localhost:3000/admin/command-center',
        file: 'admin_redesign_mobile_390.png',
        width: 390,
        height: 844,
        theme: 'light',
      },
    ];

    for (const item of captures) {
      console.log(`\nNavigating to ${item.name} (${item.url})...`);

      // Set viewport
      await send('Emulation.setDeviceMetricsOverride', {
        width: item.width,
        height: item.height,
        deviceScaleFactor: 2,
        mobile: item.width < 768,
      });

      // Set prefers-color-scheme emulation
      await send('Emulation.setEmulatedMedia', {
        media: 'screen',
        features: [{ name: 'prefers-color-scheme', value: item.theme }]
      });

      // Ensure cookie before every navigation
      await send('Network.setCookie', {
        name: '__cb_session',
        value: cookieString,
        url: 'http://localhost:3000',
        path: '/',
      });

      await send('Page.navigate', { url: item.url });
      await sleep(3500);

      // Force theme on root and dismiss consent banners
      await send('Runtime.evaluate', {
        expression: `
          try {
            document.cookie = '__cb_session=${cookieString}; path=/; max-age=86400';
            document.documentElement.dataset.theme = '${item.theme}';
            document.documentElement.setAttribute('data-theme', '${item.theme}');
            localStorage.setItem('crowdbeats_admin_theme', '${item.theme}');
            localStorage.setItem('crowdbeats-theme-preference', '${item.theme}');
            localStorage.setItem('cb_admin_theme', '${item.theme}');
            if ('${item.theme}' === 'dark') {
              const darkBtn = document.querySelectorAll('.admin-theme-btn')[2];
              if (darkBtn) darkBtn.click();
            } else if ('${item.theme}' === 'light') {
              const lightBtn = document.querySelectorAll('.admin-theme-btn')[1];
              if (lightBtn) lightBtn.click();
            }
            const banners = document.querySelectorAll('[class*="consent"], [aria-label*="consent"], [class*="privacy"]');
            banners.forEach(b => { if (b.textContent && b.textContent.includes('Privacy')) b.style.display = 'none'; });
          } catch(e) {}
        `
      });
      await sleep(1200);

      const urlRes = await send('Runtime.evaluate', { expression: 'window.location.href' });
      console.log(`Current Page URL: ${urlRes?.result?.value}`);

      // Capture screenshot
      const result = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });

      const outPath = path.join(artifactDir, item.file);
      fs.writeFileSync(outPath, Buffer.from(result.data, 'base64'));
      console.log(`Saved: ${outPath} (${(result.data.length / 1024).toFixed(1)} KB)`);
    }

    // Now capture Mobile Drawer
    console.log('\n=== Capturing Mobile Drawer (Mobile 390px) ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Network.setCookie', {
      name: '__cb_session',
      value: cookieString,
      url: 'http://localhost:3000',
      path: '/',
    });
    await send('Page.navigate', { url: 'http://localhost:3000/admin/command-center' });
    await sleep(3000);

    // Open drawer via button click
    await send('Runtime.evaluate', {
      expression: `
        const btn = document.querySelector('.admin-hamburger-btn');
        if (btn) btn.click();
      `
    });
    await sleep(900);

    const drawerResult = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const drawerOut = path.join(artifactDir, 'admin_redesign_mobile_drawer_390.png');
    fs.writeFileSync(drawerOut, Buffer.from(drawerResult.data, 'base64'));
    console.log(`Saved Mobile Drawer: ${drawerOut}`);

    // Now capture Profile Edit Modal
    console.log('\n=== Capturing Profile Edit Modal ===');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await send('Network.setCookie', {
      name: '__cb_session',
      value: cookieString,
      url: 'http://localhost:3000',
      path: '/',
    });
    await send('Page.navigate', { url: 'http://localhost:3000/admin/crm/usr_maya_rivers' });
    await sleep(3000);

    // Click "Edit Profile" button
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const editBtn = btns.find(b => b.textContent && b.textContent.includes('Edit Profile'));
        if (editBtn) editBtn.click();
      `
    });
    await sleep(800);

    const modalResult = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const modalOut = path.join(artifactDir, 'admin_redesign_user_edit_modal.png');
    fs.writeFileSync(modalOut, Buffer.from(modalResult.data, 'base64'));
    console.log(`Saved Profile Edit Modal: ${modalOut}`);

    ws.close();
  } catch (err) {
    console.error('Capture error:', err);
  } finally {
    chrome.kill();
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run();
