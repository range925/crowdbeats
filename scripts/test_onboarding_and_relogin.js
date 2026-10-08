const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9296',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_onboard_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  try {
    const tabs = await (await fetch('http://127.0.0.1:9296/json/list')).json();
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

    const timeline = [];
    const logTimeline = (type, data) => {
      const entry = `[${new Date().toISOString()}] [${type}] ${typeof data === 'object' ? JSON.stringify(data) : data}`;
      timeline.push(entry);
      console.log(entry);
    };

    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        logTimeline(`CONSOLE ${d.params.type.toUpperCase()}`, d.params.args.map(a => a.value || a.description).join(' '));
      } else if (d.method === 'Runtime.exceptionThrown') {
        logTimeline('EXCEPTION', `${d.params.exceptionDetails?.text} ${d.params.exceptionDetails?.exception?.description}`);
      } else if (d.method === 'Page.frameNavigated') {
        logTimeline('NAVIGATED', d.params.frame?.url);
      }
    });

    const testEmail = 'testuser_1791490428226@crowdbeats.ai';
    const testPassword = 'Password123!Test';
    logTimeline('START', 'Navigating to /auth to log in');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth' });
    await sleep(3000);

    // Login
    await send('Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        setReactInput(emailInput, '${testEmail}');
        setReactInput(passInput, '${testPassword}');
        document.querySelector('button[type="submit"]')?.click();
      })()`
    });

    await sleep(4000);
    logTimeline('AFTER_LOGIN_URL', (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value);

    // Now on /onboarding: check checkboxes and click continue
    logTimeline('STEP_1', 'Checking consent checkboxes');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(c => { if (!c.checked) c.click(); });
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.includes('Continue'));
        if (continueBtn) continueBtn.click();
      })()`
    });

    await sleep(3000);
    logTimeline('STEP_1_URL', (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value);

    // Now on /onboarding/persona: select fan
    logTimeline('STEP_2', 'Selecting Fan role');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div, button'));
        const fanCard = cards.find(el => el.innerText && el.innerText.includes('Fan & Supporter'));
        if (fanCard) fanCard.click();
        setTimeout(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const continueBtn = btns.find(b => b.innerText.includes('Continue'));
          if (continueBtn) continueBtn.click();
        }, 500);
      })()`
    });

    await sleep(4000);
    logTimeline('STEP_2_URL', (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value);

    // Now on /onboarding/fan: complete fan profile
    logTimeline('STEP_3', 'Completing fan profile');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textInputs = document.querySelectorAll('input[type="text"]');
        if (textInputs[0]) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(textInputs[0], 'Test Fan User');
          textInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
        const btns = Array.from(document.querySelectorAll('button'));
        const completeBtn = btns.find(b => b.innerText.includes('Complete') || b.innerText.includes('Finish') || b.innerText.includes('Go to'));
        if (completeBtn) completeBtn.click();
      })()`
    });

    await sleep(5000);
    const finalUrl = (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value;
    logTimeline('POST_ONBOARDING_URL', finalUrl);

  } finally {
    p.kill();
  }
}

run().catch(console.error);
