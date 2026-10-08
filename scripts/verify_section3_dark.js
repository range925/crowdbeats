const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'apps', 'web', 'dist');
const PORT = 3008;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Server error');
  }
});

async function run() {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Server listening on http://127.0.0.1:${PORT}`);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9292',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_cdp_sec3_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  const tabs = await (await fetch('http://127.0.0.1:9292/json/list')).json();
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
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to landing page...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await sleep(2500);

  // Switch to dark mode
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.classList.add('dark');
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.getAttribute('aria-label')?.includes('mode') || (b.title && b.title.includes('mode'))
      );
      if (btn && btn.getAttribute('aria-label')?.includes('dark')) {
        btn.click();
      }
    })()`
  });
  await sleep(1000);

  // Check section 3 headline & subheadline colors
  const evalColors = await send('Runtime.evaluate', {
    expression: `(() => {
      const sec = document.querySelector('#connection');
      if (!sec) return { error: 'Section #connection not found' };
      const h2 = sec.querySelector('#connection-title');
      const p = sec.querySelector('p:nth-of-type(2)');
      const eyebrow = sec.querySelector('p:first-of-type');
      
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        sectionBg: window.getComputedStyle(sec).backgroundColor,
        headlineText: h2 ? h2.textContent.trim().replace(/\\s+/g, ' ') : null,
        headlineColor: h2 ? window.getComputedStyle(h2).color : null,
        subheadlineText: p ? p.textContent.trim().replace(/\\s+/g, ' ') : null,
        subheadlineColor: p ? window.getComputedStyle(p).color : null,
        eyebrowColor: eyebrow ? window.getComputedStyle(eyebrow).color : null,
      };
    })()`,
    returnByValue: true
  });
  console.log('Section 3 Dark Mode Colors Evaluation:', evalColors.result?.value);

  // Scroll section 3 into view and screenshot
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sec = document.querySelector('#connection');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`
  });
  await sleep(800);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const shotPath = 'C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60/section3_dark_mode_verified.png';
  fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
  console.log(`Saved screenshot to ${shotPath}`);

  ws.close();
  chromeProc.kill();
  server.close();
  console.log('Verification finished successfully!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
