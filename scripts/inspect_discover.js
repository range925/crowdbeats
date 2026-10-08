const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function check() {
  const srv = spawn('node', ['scripts/serve_dist.js'], { stdio: 'ignore' });
  await sleep(1000);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9285',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_disc_' + Date.now(),
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  const tabs = await (await fetch('http://127.0.0.1:9285/json/list')).json();
  const t = tabs.find(x => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let id = 1;
  const send = (m, p = {}) => new Promise((res, rej) => {
    const myId = id++;
    const h = e => {
      const d = JSON.parse(e.data);
      if (d.id === myId) {
        ws.removeEventListener('message', h);
        d.error ? rej(d.error) : res(d.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: myId, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  ws.addEventListener('message', e => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION:', JSON.stringify(d.params.exceptionDetails, null, 2));
    } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      console.log('CONSOLE ERROR:', d.params.args.map(a => a.value || a.description));
    }
  });

  console.log('Navigating to http://127.0.0.1:3005/discover?tab=campaigns...');
  await send('Page.navigate', { url: 'http://127.0.0.1:3005/discover?tab=campaigns' });
  await sleep(3500);

  const res = await send('Runtime.evaluate', {
    expression: `({
      url: window.location.href,
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent.trim()),
      textSnippet: document.body.innerText.slice(0, 600)
    })`,
    returnByValue: true
  });
  console.log('Result:', JSON.stringify(res.result?.value, null, 2));

  // Take screenshot
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60/discover_tab_campaigns.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to discover_tab_campaigns.png');

  ws.close();
  chrome.kill();
  srv.kill();
}

check().catch(console.error);
