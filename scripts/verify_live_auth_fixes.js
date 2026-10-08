const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9299',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_live_verify_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9299/json/list')).json();
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
      } else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
        console.log(`[PAGE ERROR]`, d.params.args?.map(a => a.value || a.description).join(' '));
      } else if (d.method === 'Runtime.exceptionThrown') {
        console.log(`[PAGE EXCEPTION]`, d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text);
      }
    });

    console.log('===============================================================');
    console.log('TEST 1: LIVE REGISTRATION & ONBOARDING DESTINATION TRANSITION');
    console.log('===============================================================');

    const regEmail = `live_verify_${Date.now()}@crowdbeats.ai`;
    const regPassword = 'PassValid2026!#';

    console.log('[1.1] Navigating to https://crowdbeats.ai/auth?mode=register');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(3000);

    console.log('[1.2] Filling registration form for:', regEmail);
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
        setReactInput(emailInput, '${regEmail}');
        setReactInput(passInputs[0], '${regPassword}');
        setReactInput(passInputs[1], '${regPassword}');

        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        } else {
          document.querySelector('button[type="submit"]')?.click();
        }
      })()`
    });

    console.log('[1.3] Submitted registration. Monitoring navigation for 10 seconds...');
    const regTimeline = [];
    for (let i = 1; i <= 10; i++) {
      await sleep(1000);
      const state = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          error: document.querySelector('[role="alert"]')?.innerText || ''
        })`,
        returnByValue: true
      });
      const val = state.result?.value;
      regTimeline.push(val);
      console.log(`[Reg Tick ${i}s] Path: ${val?.pathname} | H1: ${val?.h1}${val?.error ? ' | ERR: ' + val.error : ''}`);
    }

    const regFinalPath = regTimeline[regTimeline.length - 1]?.pathname;
    const reachedOnboardingIdx = regTimeline.findIndex(t => t?.pathname === '/onboarding');
    const regBouncedBack = reachedOnboardingIdx !== -1 && regTimeline.slice(reachedOnboardingIdx).some(t => t?.pathname === '/auth');

    console.log('\n--- REGISTRATION AUDIT RESULT ---');
    console.log('Final path reached:', regFinalPath);
    console.log('Did user successfully arrive on /onboarding?:', regFinalPath === '/onboarding' ? 'YES (PASS)' : 'NO');
    console.log('Did it bounce back to /auth?:', regBouncedBack ? 'YES (FAIL - BOUNCE LOOP)' : 'NO (PASS - STABLE)');
    console.log('---------------------------------\n');

    console.log('===============================================================');
    console.log('TEST 2: LIVE LOGIN & STABLE DESTINATION TRANSITION');
    console.log('===============================================================');

    console.log('[2.0] Clearing all browser session data (cookies, localStorage, indexedDB) for clean login test...');
    await send('Storage.clearDataForOrigin', {
      origin: 'https://crowdbeats.ai',
      storageTypes: 'all'
    });
    await sleep(1000);

    console.log('[2.1] Navigating back to https://crowdbeats.ai/auth?mode=login');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=login' });
    await sleep(3500);

    console.log('[2.2] Submitting login for newly registered user:', regEmail);
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
        setReactInput(emailInput, '${regEmail}');
        setReactInput(passInput, '${regPassword}');

        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
        } else {
          document.querySelector('button[type="submit"]')?.click();
        }
      })()`
    });

    console.log('[2.3] Submitted login. Monitoring navigation for 10 seconds...');
    const loginTimeline = [];
    for (let i = 1; i <= 10; i++) {
      await sleep(1000);
      const state = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          error: document.querySelector('[role="alert"]')?.innerText || ''
        })`,
        returnByValue: true
      });
      const val = state.result?.value;
      loginTimeline.push(val);
      console.log(`[Login Tick ${i}s] Path: ${val?.pathname} | H1: ${val?.h1}${val?.error ? ' | ERR: ' + val.error : ''}`);
    }

    const loginFinalPath = loginTimeline[loginTimeline.length - 1]?.pathname;
    const reachedDestinationIdx = loginTimeline.findIndex(t => t?.pathname !== '/auth');
    const loginBouncedBack = reachedDestinationIdx !== -1 && loginTimeline.slice(reachedDestinationIdx).some(t => t?.pathname === '/auth');

    console.log('\n--- LOGIN AUDIT RESULT ---');
    console.log('Final path reached:', loginFinalPath);
    console.log('Did user navigate to destination?:', loginFinalPath !== '/auth' ? 'YES (PASS)' : 'NO');
    console.log('Did it bounce back to /auth?:', loginBouncedBack ? 'YES (FAIL - BOUNCE LOOP)' : 'NO (PASS - STABLE)');
    console.log('--------------------------\n');

  } finally {
    p.kill();
  }
}

run().catch(console.error);
