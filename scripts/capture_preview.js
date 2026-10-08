const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] || 'http://localhost:8085/#/preview';
const outputPath = process.argv[3] || path.join(__dirname, 'preview.png');
const width = parseInt(process.argv[4] || '1200', 10);
const height = parseInt(process.argv[5] || '880', 10);

console.log(`Target: ${targetUrl}`);
console.log(`Output: ${outputPath}`);
console.log(`Viewport: ${width}x${height}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9223;

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  `--window-size=${width},${height}`,
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  targetUrl
], { stdio: 'ignore' });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
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

    await new Promise(r => ws.addEventListener('open', r));
    console.log('WebSocket open, setting viewport...');

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Waiting for Flutter app to render frames...');
    await sleep(7000);

    console.log('Capturing screenshot...');
    const result = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(result.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Saved screenshot (${buffer.length} bytes) to ${outputPath}`);

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
  }
}

run();
