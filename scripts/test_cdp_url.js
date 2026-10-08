const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9280',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_cdp_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  const tabs = await (await fetch('http://127.0.0.1:9280/json/list')).json();
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
  await send('Log.enable');

  ws.addEventListener('message', (evt) => {
    const d = JSON.parse(evt.data);
    if (d.method === 'Runtime.exceptionThrown') {
      console.log('CLIENT EXCEPTION:', d.params.exceptionDetails);
    } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      console.log('CONSOLE ERROR:', d.params.args.map(a => a.value || a.description));
    }
  });

  console.log('Navigating to http://127.0.0.1:3000/...');
  const navRes = await send('Page.navigate', { url: 'http://127.0.0.1:3000/' });
  console.log('Nav response:', navRes);
  await sleep(4000);
  const evalRes = await send('Runtime.evaluate', {
    expression: '({ href: window.location.href, title: document.title, scrollHeight: document.documentElement.scrollHeight, htmlSnippet: document.body.innerHTML.slice(0, 400) })',
    returnByValue: true
  });
  console.log('Eval result:', evalRes.result?.value);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  console.log('Screenshot data length:', shot.data.length);
  fs.writeFileSync('C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60/landing_verified/test_shot.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved test_shot.png successfully!');
  ws.close();
  p.kill();
}
run().catch(console.error);
