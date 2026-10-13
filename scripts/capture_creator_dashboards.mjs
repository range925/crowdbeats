import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0";
const PORT = 9222;

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
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-profile')
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

  const cookieVal = encodeURIComponent(JSON.stringify({
    uid: 'art_maya_lin',
    personaType: 'artist',
    displayName: 'Maya Lin',
    emailVerified: true,
    onboarded: true
  }));

  console.log('Setting auth session cookie for artist...');
  await sendCommand('Network.setCookie', {
    name: '__cb_session',
    value: cookieVal,
    url: 'http://localhost:3000',
    path: '/'
  });

  await sendCommand('Network.setExtraHTTPHeaders', {
    headers: {
      'Cookie': `__cb_session=${cookieVal}`
    }
  });

  // Set localStorage user as well for client-side useAuth
  const clientUserStorageScript = `
    document.cookie = '__cb_session=${cookieVal}; path=/';
    localStorage.setItem('__cb_active_persona', 'artist');
    localStorage.setItem('__cb_persona_type', 'artist');
    localStorage.setItem('__cb_display_name', 'Maya Lin');
  `;

  const targets = [
    { url: 'http://localhost:3000/creator/dashboard?preview=1',    filename: 'creator_dashboard_overview.png',     title: 'Creator Dashboard Overview' },
    { url: 'http://localhost:3000/creator/analytics?preview=1',    filename: 'creator_dashboard_analytics.png',    title: 'Creator Analytics & Tip Performance' },
    { url: 'http://localhost:3000/creator/activity?preview=1',     filename: 'creator_dashboard_activity.png',     title: 'Live Stage Activity & Radar' },
    { url: 'http://localhost:3000/creator/profile?preview=1',      filename: 'creator_dashboard_profile.png',      title: 'Creator EPK & Public Profile Editor' },
    { url: 'http://localhost:3000/creator/performances?preview=1', filename: 'creator_dashboard_performances.png', title: 'Performances & Gigs Schedule' },
    { url: 'http://localhost:3000/creator/payouts?preview=1',      filename: 'creator_dashboard_payouts.png',      title: 'Creator Payouts & Stripe Connect' }
  ];

  for (const target of targets) {
    console.log(`Navigating to ${target.url}...`);
    await sendCommand('Page.navigate', { url: target.url });
    // Wait for DOM load & hydration
    await sleep(2500);

    // Evaluate localStorage script inside page
    await sendCommand('Runtime.evaluate', { expression: clientUserStorageScript });

    // Wait a brief moment for any layout shift to settle
    await sleep(1000);

    console.log(`Capturing screenshot for ${target.title}...`);
    const screenshot = await sendCommand('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
      captureBeyondViewport: false
    });

    const outputPath = path.join(ARTIFACT_DIR, target.filename);
    fs.writeFileSync(outputPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Saved screenshot to ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
  }

  ws.close();
  chromeProc.kill();
  console.log('Finished capturing all creator dashboard screenshots successfully!');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
