const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\persona_journeys';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9315',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\cb_admin_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2000);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9315/json/list')).json();
    const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === myId) {
          ws.removeEventListener('message', h);
          d.error ? reject(d.error) : resolve(d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    await send('Page.enable');
    await send('Network.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const adminSessionJson = JSON.stringify({
      uid: 'vK1bvXWjqwR1H78yAfiOsXRRyVn2',
      email: 'crowdbeatsllc@gmail.com',
      displayName: 'Crowdbeats Platform Admin',
      personaType: 'staff',
      platformRole: 'SUPER_ADMIN',
      emailVerified: true,
      onboarded: true
    });

    console.log('Setting Admin session cookie via Network.setCookie...');
    await send('Network.setCookie', {
      name: '__cb_session',
      value: encodeURIComponent(adminSessionJson),
      url: 'https://crowdbeats.ai',
      domain: 'crowdbeats.ai',
      path: '/',
      secure: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 604800
    });

    console.log('Navigating to https://crowdbeats.ai/admin/command-center...');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/admin/command-center' });
    await sleep(5000);

    const adminState = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.href,
        pathname: window.location.pathname,
        h1: document.querySelector('h1')?.innerText || '',
        sidebarBrand: document.querySelector('aside')?.innerText.slice(0, 100) || '',
        bodySnippet: document.body.innerText.slice(0, 300)
      })`,
      returnByValue: true
    });

    console.log('Admin Page State:', JSON.stringify(adminState.value, null, 2));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const targetPath = path.join(artifactDir, 'persona_6_admin.png');
    fs.writeFileSync(targetPath, Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot to:', targetPath);

  } finally {
    p.kill();
  }
}

run().catch(console.error);
