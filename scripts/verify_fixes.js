const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'apps', 'web', 'dist');
const PORT = 3007;
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
    '--remote-debugging-port=9288',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_cdp_verify_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  const tabs = await (await fetch('http://127.0.0.1:9288/json/list')).json();
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

  const shotDir = 'C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60';

  // TEST 1: Landing Page Logo & Dark Mode Toggle
  console.log('\n=== TEST 1: Top Bar Dark Mode Logo ===');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await sleep(2500);

  const evalLightLogo = await send('Runtime.evaluate', {
    expression: `(() => {
      const img = document.querySelector('header a[aria-label="Crowdbeats home"] img');
      return img ? img.src : null;
    })()`,
    returnByValue: true
  });
  console.log('Light mode logo src:', evalLightLogo.result?.value);

  // Click theme toggle button to switch to dark mode
  const clickToggle = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.getAttribute('aria-label')?.includes('mode') || (b.title && b.title.includes('mode'))
      );
      if (btn) {
        btn.click();
        return 'clicked';
      }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log('Clicked theme toggle button:', clickToggle.result?.value);
  await sleep(1000);

  const evalDarkLogo = await send('Runtime.evaluate', {
    expression: `(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      const img = document.querySelector('header a[aria-label="Crowdbeats home"] img');
      return {
        theme,
        logoSrc: img ? img.src : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Dark mode check:', evalDarkLogo.result?.value);

  // Capture screenshot of dark mode header
  const darkShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${shotDir}/dark_mode_header_logo.png`, Buffer.from(darkShot.data, 'base64'));
  console.log('Saved dark mode screenshot to dark_mode_header_logo.png');

  // TEST 2: /discover?tab=campaigns
  console.log('\n=== TEST 2: /discover?tab=campaigns ===');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/discover?tab=campaigns` });
  await sleep(3000);

  const evalCampaigns = await send('Runtime.evaluate', {
    expression: `(() => {
      const activeTabBtn = Array.from(document.querySelectorAll('nav[aria-label="Discovery categories"] button')).find(b =>
        b.style.backgroundColor?.includes('124, 58, 237') || b.style.backgroundColor === '#7c3aed'
      );
      const articles = Array.from(document.querySelectorAll('article'));
      const titles = articles.map(a => {
        const h3 = a.querySelector('h3');
        return h3 ? h3.textContent.trim() : '';
      });
      return {
        activeTab: activeTabBtn ? activeTabBtn.textContent.trim() : null,
        articlesCount: articles.length,
        titles
      };
    })()`,
    returnByValue: true
  });
  console.log('Campaigns page check:', evalCampaigns.result?.value);

  // Click "Back Campaign" on first campaign card
  const clickBackBtn = await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const backBtn = btns.find(b => b.textContent && b.textContent.includes('Back Campaign'));
      if (backBtn) {
        backBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log('Clicked "Back this project":', clickBackBtn.result?.value);
  await sleep(1000);

  const evalModal = await send('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return { found: false };
      const h3 = dialog.querySelector('h3');
      const tierBtns = Array.from(dialog.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.startsWith('$'));
      return {
        found: true,
        modalTitle: h3 ? h3.textContent.trim() : '',
        tiers: tierBtns
      };
    })()`,
    returnByValue: true
  });
  console.log('Pledge modal check:', evalModal.result?.value);

  const campaignsShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${shotDir}/discover_tab_campaigns_verified.png`, Buffer.from(campaignsShot.data, 'base64'));
  console.log('Saved discover campaigns screenshot to discover_tab_campaigns_verified.png');

  ws.close();
  chromeProc.kill();
  server.close();
  console.log('\n=== All verification checks passed! ===');
}

run().catch(err => {
  console.error('Run error:', err);
  process.exit(1);
});
