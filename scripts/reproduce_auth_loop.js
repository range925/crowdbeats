const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9292',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_repro_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  try {
    const tabs = await (await fetch('http://127.0.0.1:9292/json/list')).json();
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

    logTimeline('START', 'Navigating to /auth?mode=register');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(3000);

    const testEmail = `testuser_${Date.now()}@crowdbeats.ai`;
    const testPassword = 'Password123!Test';
    logTimeline('TEST_ACCOUNT', { testEmail });

    // Fill registration form
    const fillResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInputs = document.querySelectorAll('input[type="password"]');
        if (!emailInput || passInputs.length < 2) {
          return { error: 'Inputs not found', emailInput: !!emailInput, passInputsCount: passInputs.length };
        }
        
        // Native setter helper for React controlled inputs
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setReactInput(emailInput, '${testEmail}');
        setReactInput(passInputs[0], '${testPassword}');
        setReactInput(passInputs[1], '${testPassword}');

        return { success: true, email: emailInput.value, p1: passInputs[0].value, p2: passInputs[1].value };
      })()`,
      returnByValue: true
    });
    logTimeline('FILL_RESULT', fillResult.result?.value);

    // Click submit button
    const submitResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const form = document.querySelector('form');
        const btn = document.querySelector('button[type="submit"]');
        if (btn) {
          btn.click();
          return { clicked: true, btnText: btn.innerText };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    logTimeline('SUBMIT_RESULT', submitResult.result?.value);

    // Watch for 10 seconds to observe navigation loop
    for (let i = 0; i < 10; i++) {
      await sleep(1000);
      const urlEval = await send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
      });
      logTimeline('TICK ' + (i + 1) + 's URL', urlEval.result?.value);
    }

  } finally {
    p.kill();
  }
}

run().catch(console.error);
