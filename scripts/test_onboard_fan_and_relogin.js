const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9298',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_onboard_fan_' + Date.now(),
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

    // On /onboarding: check checkboxes and click continue
    logTimeline('STEP_1', 'Checking consent checkboxes and clicking agree');
    const step1Res = await send('Runtime.evaluate', {
      expression: `(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(c => { if (!c.checked) c.click(); });
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.toLowerCase().includes('agree') || b.innerText.toLowerCase().includes('continue'));
        if (continueBtn) {
          continueBtn.click();
          return { clicked: true, text: continueBtn.innerText };
        }
        return { clicked: false, buttons: btns.map(b => b.innerText) };
      })()`,
      returnByValue: true
    });
    logTimeline('STEP_1_CLICK', step1Res.result?.value);

    await sleep(3000);
    const step1Url = (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value;
    logTimeline('STEP_1_URL', step1Url);

    // On /onboarding/persona: click Fan & Supporter card, then Continue
    logTimeline('STEP_2', 'Selecting Fan role');
    const step2Res = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('div, button'));
        const fanCard = cards.find(el => el.innerText && el.innerText.includes('Fan & Supporter'));
        if (fanCard) {
          fanCard.click();
          return { foundFan: true };
        }
        return { foundFan: false };
      })()`,
      returnByValue: true
    });
    logTimeline('STEP_2_CLICK', step2Res.result?.value);

    await sleep(1000);
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.toLowerCase().includes('continue'));
        if (continueBtn) continueBtn.click();
      })()`
    });

    await sleep(4000);
    const step2Url = (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value;
    logTimeline('STEP_2_URL', step2Url);

    // On /onboarding/fan: enter display name and handle
    logTimeline('STEP_3', 'Filling fan essentials');
    const step3Res = await send('Runtime.evaluate', {
      expression: `(() => {
        const textInputs = Array.from(document.querySelectorAll('input[type="text"]'));
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (textInputs[0]) setReactInput(textInputs[0], 'Test Fan User');
        if (textInputs[1]) setReactInput(textInputs[1], 'testfan123');

        const btns = Array.from(document.querySelectorAll('button'));
        const nextBtn = btns.find(b => b.innerText.toLowerCase().includes('continue'));
        if (nextBtn) {
          nextBtn.click();
          return { clicked: true, text: nextBtn.innerText, inputs: textInputs.length };
        }
        return { clicked: false, buttons: btns.map(b => b.innerText) };
      })()`,
      returnByValue: true
    });
    logTimeline('STEP_3_RESULT', step3Res.result?.value);

    await sleep(3000);
    // On Step 2 of wizard: click skip / complete
    logTimeline('STEP_4', 'Completing setup');
    const step4Res = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const completeBtn = btns.find(b => b.innerText.toLowerCase().includes('complete') || b.innerText.toLowerCase().includes('skip'));
        if (completeBtn) {
          completeBtn.click();
          return { clicked: true, text: completeBtn.innerText };
        }
        return { clicked: false, buttons: btns.map(b => b.innerText) };
      })()`,
      returnByValue: true
    });
    logTimeline('STEP_4_RESULT', step4Res.result?.value);

    await sleep(4000);
    // Click final Discover or Go to Fan Hub button
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const finalBtn = btns.find(b => b.innerText.toLowerCase().includes('fan hub') || b.innerText.toLowerCase().includes('discover') || b.innerText.toLowerCase().includes('start'));
        if (finalBtn) finalBtn.click();
      })()`
    });

    await sleep(5000);
    const postOnboardingUrl = (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value;
    logTimeline('POST_ONBOARDING_URL', postOnboardingUrl);

    // NOW TEST THE REAL BUG:
    // User is onboarded as a Fan.
    // Let's navigate to /auth to log in again!
    logTimeline('RELOGIN_TEST', 'Navigating to /auth to test logging in with onboarded account');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth' });
    await sleep(4000);

    // Fill login again
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

    // Watch next 15 seconds to see if it rotates to dashboard and bounces back!
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const urlEval = await send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
      });
      logTimeline('RELOGIN TICK ' + (i + 1) + 's', urlEval.result?.value);
    }

  } finally {
    p.kill();
  }
}

run().catch(console.error);
