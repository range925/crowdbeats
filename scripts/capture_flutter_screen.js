const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] || 'http://localhost:8085/#/onboarding';
const outputPath = process.argv[3] || path.join(__dirname, 'profile_creation_screen.png');
const width = parseInt(process.argv[4] || '412', 10);
const height = parseInt(process.argv[5] || '892', 10);

console.log(`Navigating to: ${targetUrl}`);
console.log(`Writing screenshot to: ${outputPath}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9227;

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  `--window-size=${width},${height}`,
  '--no-sandbox',
  '--enable-webgl',
  '--use-gl=angle',
  '--run-all-compositor-stages-before-draw',
  '--hide-scrollbars',
  targetUrl
], { stdio: 'ignore' });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  await sleep(1500);
  try {
    const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    const tabs = await res.json();
    const tab = tabs.find(t => t.type === 'page') || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

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

    const isMobile = width < 600;
    console.log(`Setting device viewport (${width}x${height}, isMobile=${isMobile})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    });

    console.log('Waiting for Flutter CanvasKit to finish drawing frames...');
    await sleep(6000);

    console.log('Capturing screenshot...');
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    const buffer = Buffer.from(result.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Success! Wrote ${buffer.length} bytes to ${outputPath}`);

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
  }
}

run();
