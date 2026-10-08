const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9235;

const targets = [
  {
    name: 'persona_selection',
    url: 'http://localhost:3000/onboarding/persona?preview=true',
    width: 1200,
    height: 900,
  },
  {
    name: 'fan_flow',
    url: 'http://localhost:3000/onboarding/fan?preview=true',
    width: 1200,
    height: 950,
  },
  {
    name: 'solo_musician_flow',
    url: 'http://localhost:3000/onboarding/artist?preview=true',
    width: 1200,
    height: 1000,
  },
  {
    name: 'band_flow',
    url: 'http://localhost:3000/onboarding/band?preview=true',
    width: 1200,
    height: 1000,
  },
];

const artifactDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\5b8a6e81-11da-40a6-bbb0-5a543a61f415';
const docsDir = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(300);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        return tabs[0].webSocketDebuggerUrl;
      }
    } catch (e) {}
  }
  throw new Error('Chrome remote debugging did not respond');
}

async function run() {
  console.log('Spawning Chrome headless on port ' + debugPort + '...');
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      '--window-size=1200,1000',
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to CDP:', wsUrl);

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

    await new Promise((r) => ws.addEventListener('open', r));
    await send('Network.enable');

    // Set cookie for session bypass
    const cookieValue = encodeURIComponent(
      JSON.stringify({
        uid: 'preview_demo_user',
        personaType: null,
        emailVerified: true,
        onboarded: false,
      })
    );

    await send('Network.setCookie', {
      name: '__cb_session',
      value: cookieValue,
      domain: 'localhost',
      path: '/',
    });

    for (const target of targets) {
      console.log(`\nNavigating to ${target.url}...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: target.width,
        height: target.height,
        deviceScaleFactor: 1,
        mobile: false,
      });

      await send('Page.navigate', { url: target.url });
      await sleep(3500);

      console.log(`Capturing screenshot for ${target.name}...`);
      const result = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });

      const buffer = Buffer.from(result.data, 'base64');
      const docsFile = path.join(docsDir, `${target.name}.png`);
      const artifactFile = path.join(artifactDir, `${target.name}.png`);

      fs.writeFileSync(docsFile, buffer);
      fs.writeFileSync(artifactFile, buffer);

      console.log(`Saved: ${docsFile} (${buffer.length} bytes)`);
      console.log(`Saved: ${artifactFile} (${buffer.length} bytes)`);
    }

    ws.close();
    console.log('\nAll screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
  }
}

run();
