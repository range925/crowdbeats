const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9304',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_check_doc_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  try {
    const tabs = await (await fetch('http://127.0.0.1:9304/json/list')).json();
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

    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth' });
    await sleep(3000);

    const testEmail = 'testuser_1791490428226@crowdbeats.ai';
    const testPassword = 'Password123!Test';

    // Sign in and inspect
    const result = await send('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { getDoc, doc, updateDoc, setDoc } = await import('firebase/firestore');
          const { auth, db } = window.__test_handles || {};
          
          // Use the app's firebase instance from DOM or module
          // Or sign in via DOM form
          const emailInput = document.querySelector('input[type="email"]');
          const passInput = document.querySelector('input[type="password"]');
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(emailInput, '${testEmail}');
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          setter.call(passInput, '${testPassword}');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          document.querySelector('button[type="submit"]')?.click();
          
          return { submitted: true };
        } catch (err) {
          return { error: err.message };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Submit result:', result.result?.value);

    await sleep(4000);

    // Now inspect from the page context what Firestore has!
    const inspectResult = await send('Runtime.evaluate', {
      expression: `(async () => {
        try {
          // Find Firebase app from indexedDB or auth state
          return {
            url: window.location.href,
            cookies: document.cookie,
            localStorage: Object.keys(localStorage).map(k => ({ [k]: localStorage.getItem(k) }))
          };
        } catch (err) {
          return { error: err.message };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Inspect result:', JSON.stringify(inspectResult.result?.value, null, 2));

  } finally {
    p.kill();
  }
}

run().catch(console.error);
