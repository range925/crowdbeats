const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9288',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_cdp_auth_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  try {
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
    await send('Log.enable');
    await send('Network.enable');

    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log(`[CONSOLE ${d.params.type.toUpperCase()}]`, d.params.args.map(a => a.value || a.description).join(' '));
      } else if (d.method === 'Runtime.exceptionThrown') {
        console.log('[EXCEPTION]', d.params.exceptionDetails?.text, d.params.exceptionDetails?.exception?.description);
      } else if (d.method === 'Page.frameNavigated') {
        console.log('[NAVIGATED]', d.params.frame?.url);
      }
    });

    console.log('Navigating to https://crowdbeats.ai/auth...');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth' });
    await sleep(4000);

    const state = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          href: window.location.href,
          title: document.title,
          inputs: Array.from(document.querySelectorAll('input')).map(i => ({ name: i.name, type: i.type, placeholder: i.placeholder })),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
          cookies: document.cookie,
          localStorageKeys: Object.keys(localStorage),
        };
      })()`,
      returnByValue: true
    });
    console.log('Current state on /auth:', JSON.stringify(state.result?.value, null, 2));

  } finally {
    p.kill();
  }
}

run().catch(console.error);
