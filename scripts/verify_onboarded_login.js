const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9298',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_onboarded_login_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9298/json/list')).json();
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

    const userEmail = `fan_verified_${Date.now()}@crowdbeats.ai`;
    const userPass = 'PassValid2026!#';

    console.log('[Step 1] Registering test user:', userEmail);
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(2500);

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
        setReactInput(emailInput, '${userEmail}');
        setReactInput(passInputs[0], '${userPass}');
        setReactInput(passInputs[1], '${userPass}');
        document.querySelector('button[type="submit"]')?.click();
      })()`
    });

    await sleep(3500);
    console.log('[Step 2] Agreeing to terms on /onboarding...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        checkboxes.forEach(cb => {
          if (!cb.checked) cb.click();
        });
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue'));
        btn?.click();
      })()`
    });

    await sleep(2500);
    console.log('[Step 3] Choosing Fan persona on /onboarding/persona...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div, button'));
        const fanCard = cards.find(el => el.innerText && el.innerText.includes('Fan & Supporter'));
        fanCard?.click();
        setTimeout(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue'));
          btn?.click();
        }, 500);
      })()`
    });

    await sleep(3000);
    console.log('[Step 4] Completing fan profile...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const nameInput = inputs.find(i => i.placeholder && i.placeholder.includes('name'));
        if (nameInput) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(nameInput, 'Verified Fan');
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const contBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Next') || b.innerText.includes('Complete') || b.innerText.includes('Continue'));
        contBtn?.click();
      })()`
    });

    await sleep(2500);

    console.log('[Step 5] Signing out to test fresh login as an onboarded user...');
    await send('Network.clearBrowserCookies');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=login' });
    await sleep(2500);

    console.log('[Step 6] Logging in on /auth...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        setReactInput(emailInput, '${userEmail}');
        setReactInput(passInput, '${userPass}');
        document.querySelector('button[type="submit"]')?.click();
      })()`
    });

    console.log('[Step 7] Monitoring destination for 10 seconds...');
    const timeline = [];
    for (let i = 1; i <= 10; i++) {
      await sleep(1000);
      const state = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title
        })`,
        returnByValue: true
      });
      const val = state.result?.value;
      timeline.push(val);
      console.log(`[Tick ${i}s] Path: ${val?.pathname} | Title: ${val?.title}`);
    }

    const finalPath = timeline[timeline.length - 1]?.pathname;
    const bounced = timeline.slice(2).some(t => t?.pathname === '/auth');

    console.log('\n--- ONBOARDED USER LOGIN AUDIT ---');
    console.log('Final path reached:', finalPath);
    console.log('Did it route away from /auth without getting stuck?:', finalPath !== '/auth' ? 'YES (PASS)' : 'NO');
    console.log('Did it bounce back to /auth?:', bounced ? 'YES (FAIL - BOUNCE LOOP)' : 'NO (PASS - STABLE)');
    console.log('----------------------------------\n');

  } finally {
    p.kill();
  }
}

run().catch(console.error);
