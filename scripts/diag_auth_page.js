const { spawn } = require('child_process');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9291',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_diag_' + Date.now(),
    'about:blank'
  ]);
  await sleep(1500);
  try {
    const tabs = await (await fetch('http://127.0.0.1:9291/json/list')).json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === myId) { ws.removeEventListener('message', h); resolve(d.result); }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=login' });
    await sleep(3000);
    const res = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.href,
        h1: document.querySelector('h1')?.innerText,
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, name: i.name, placeholder: i.placeholder })),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText)
      })`,
      returnByValue: true
    });
    console.log('DIAG RESULT:', JSON.stringify(res.result?.value, null, 2));
  } finally {
    p.kill();
  }
}
test();
