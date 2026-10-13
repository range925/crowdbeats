import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\baseline";
const PORT = 9222;

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Launching headless Chrome with remote debugging on port', PORT);
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--window-size=1440,1024',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-baseline-profile')
  ]);

  chromeProc.on('error', (err) => {
    console.error('Failed to spawn Chrome:', err);
  });

  // Wait for Chrome CDP port to open
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
    } catch {
      // wait and retry
    }
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome debugging port.');
    chromeProc.kill();
    process.exit(1);
  }

  // Create new page target
  const newTargetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await newTargetRes.json();
  const pageWsUrl = targetData.webSocketDebuggerUrl;

  console.log('Connecting to page target WebSocket:', pageWsUrl);
  const ws = new WebSocket(pageWsUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  console.log('Enabling Page and Network domains...');
  await sendCommand('Page.enable');
  await sendCommand('Network.enable');

  const viewports = [
    { name: 'desktop', width: 1440, height: 900,  mobile: false, deviceScaleFactor: 1 },
    { name: 'tablet',  width: 768,  height: 1024, mobile: true,  deviceScaleFactor: 2 },
    { name: 'phone',   width: 390,  height: 844,  mobile: true,  deviceScaleFactor: 2 }
  ];

  const pages = [
    {
      key: 'landing',
      url: 'http://localhost:3000/',
      persona: null,
      title: 'Landing Page'
    },
    {
      key: 'creator_dashboard',
      url: 'http://localhost:3000/creator/dashboard?preview=1',
      persona: { uid: 'art_maya_lin', personaType: 'artist', displayName: 'Maya Lin', emailVerified: true, onboarded: true },
      title: 'Creator Studio Dashboard'
    },
    {
      key: 'band_dashboard',
      url: 'http://localhost:3000/band/dashboard?preview=1',
      persona: { uid: 'band_member_1', personaType: 'band_member', displayName: 'Elena Cruz', emailVerified: true, onboarded: true },
      title: 'Band Studio Dashboard'
    },
    {
      key: 'sponsor_dashboard',
      url: 'http://localhost:3000/sponsor/dashboard?preview=1',
      persona: { uid: 'sponsor_rep_1', personaType: 'sponsor_rep', displayName: 'Marcus Vance', emailVerified: true, onboarded: true },
      title: 'Sponsor Studio Dashboard'
    },
    {
      key: 'admin_command_center',
      url: 'http://localhost:3000/admin/command-center?preview=1',
      persona: { uid: 'admin_david', personaType: 'admin', platformRole: 'SUPER_ADMIN', displayName: 'David Naufahu', emailVerified: true, onboarded: true },
      title: 'Admin Command Center'
    },
    {
      key: 'fan_portal',
      url: 'http://localhost:3000/fan?preview=1',
      persona: { uid: 'fan_sarah_m', personaType: 'fan', displayName: 'Sarah Jenkins', emailVerified: true, onboarded: true },
      title: 'Fan Portal'
    }
  ];

  const themes = ['light', 'dark'];

  let totalCaptured = 0;

  for (const page of pages) {
    console.log(`\n=== Setting up for ${page.title} ===`);

    // Setup session cookie if persona required
    if (page.persona) {
      const cookieVal = encodeURIComponent(JSON.stringify(page.persona));
      await sendCommand('Network.setCookie', {
        name: '__cb_session',
        value: cookieVal,
        url: 'http://localhost:3000',
        path: '/'
      });
      await sendCommand('Network.setExtraHTTPHeaders', {
        headers: { 'Cookie': `__cb_session=${cookieVal}` }
      });
    } else {
      await sendCommand('Network.clearBrowserCookies');
      await sendCommand('Network.setExtraHTTPHeaders', { headers: {} });
    }

    for (const vp of viewports) {
      // Set viewport dimensions
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
        mobile: vp.mobile
      });

      for (const theme of themes) {
        console.log(`Navigating to ${page.url} [${vp.name} | ${theme}]...`);
        await sendCommand('Page.navigate', { url: page.url });
        await sleep(2200);

        // Apply theme attributes in DOM and localStorage
        const applyThemeScript = `
          try {
            var theme = '${theme}';
            localStorage.setItem('crowdbeats-theme-preference', theme);
            localStorage.setItem('crowdbeats_admin_theme', theme);
            localStorage.setItem('crowdbeats_theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.dataset.theme = theme;
            document.documentElement.style.colorScheme = theme;
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch(e) {}
        `;
        await sendCommand('Runtime.evaluate', { expression: applyThemeScript });
        await sleep(800);

        const filename = `baseline_${page.key}_${vp.name}_${theme}.png`;
        const outputPath = path.join(ARTIFACT_DIR, filename);

        const screenshot = await sendCommand('Page.captureScreenshot', {
          format: 'png',
          quality: 100,
          captureBeyondViewport: false
        });

        fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
        const size = fs.statSync(outputPath).size;
        console.log(`-> Captured ${filename} (${size} bytes)`);
        totalCaptured++;
      }
    }
  }

  ws.close();
  chromeProc.kill();
  console.log(`\nSuccessfully captured all ${totalCaptured} baseline screenshots in ${ARTIFACT_DIR}!`);
}

main().catch(err => {
  console.error('Error during baseline capture:', err);
  process.exit(1);
});
