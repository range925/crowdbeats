const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9297',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_cont_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9297/json/list')).json();
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
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Page.frameNavigated') {
        console.log(`[NAVIGATED] ${d.params.frame?.url}`);
      }
    });

    const email = `continue_test_${Date.now()}@crowdbeats.ai`;
    const pass = 'SecurePass2026!';

    console.log('[1/4] Navigating to https://crowdbeats.ai/auth?mode=register');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(2500);

    console.log('[2/4] Registering new account...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const emailInput = document.querySelector('input[type="email"]');
        const passInputs = Array.from(document.querySelectorAll('input[type="password"]'));
        setReactInput(emailInput, '${email}');
        setReactInput(passInputs[0], '${pass}');
        setReactInput(passInputs[1], '${pass}');

        document.querySelector('button[type="submit"]')?.click();
      })()`
    });

    await sleep(4000);
    console.log('[3/4] Arrived on verify-email page. Clicking "Continue to dashboard"...');
    const clickRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const contBtn = btns.find(b => b.innerText.toLowerCase().includes('continue to dashboard'));
        if (contBtn) {
          contBtn.click();
          return { clicked: true, text: contBtn.innerText };
        }
        return { clicked: false, buttons: btns.map(b => b.innerText) };
      })()`,
      returnByValue: true
    });
    console.log('Click result:', clickRes.result?.value);

    console.log('[4/4] Observing navigation destination for 10 seconds...');
    const timeline = [];
    for (let i = 1; i <= 10; i++) {
      await sleep(1000);
      const state = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          h1: document.querySelector('h1')?.innerText || ''
        })`,
        returnByValue: true
      });
      const val = state.result?.value;
      timeline.push(val);
      console.log(`[Tick ${i}s] Path: ${val?.pathname} | H1: ${val?.h1}`);
    }

    const finalPath = timeline[timeline.length - 1]?.pathname;
    const isBouncedBack = timeline.some((t, idx) => idx > 3 && t?.pathname.startsWith('/auth'));

    console.log('\n--- AUDIT VERIFICATION ---');
    console.log('Final path reached:', finalPath);
    console.log('Did user successfully enter onboarding?:', finalPath === '/onboarding' ? 'YES (PASS)' : 'NO');
    console.log('Did it bounce back to /auth?:', isBouncedBack ? 'YES (FAIL)' : 'NO (PASS)');
    console.log('---------------------------\n');

  } finally {
    p.kill();
  }
}

run().catch(console.error);
