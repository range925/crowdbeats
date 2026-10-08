const { spawn } = require('child_process');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9306',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_artist_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  try {
    const tabs = await (await fetch('http://127.0.0.1:9306/json/list')).json();
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

    const testEmail = `artist_${Date.now()}@crowdbeats.ai`;
    const testPassword = 'Password123!Test';
    logTimeline('START', 'Navigating to /auth?mode=register');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(3000);

    // Register
    await send('Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInputs = document.querySelectorAll('input[type="password"]');
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        setReactInput(emailInput, '${testEmail}');
        setReactInput(passInputs[0], '${testPassword}');
        setReactInput(passInputs[1], '${testPassword}');
        document.querySelector('button[type="submit"]')?.click();
      })()`
    });

    await sleep(4000);
    // Step 1: Consent
    await send('Runtime.evaluate', {
      expression: `(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(c => { if (!c.checked) c.click(); });
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.toLowerCase().includes('agree'));
        if (continueBtn) continueBtn.click();
      })()`
    });

    await sleep(3000);
    // Step 2: Persona picker - Solo Musician
    logTimeline('STEP_2', 'Selecting Solo Musician role');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const artistBtn = btns.find(b => b.innerText && b.innerText.includes('Solo Musician'));
        if (artistBtn) artistBtn.click();
        setTimeout(() => {
          const continueBtn = btns.find(b => b.innerText.trim() === 'Continue');
          if (continueBtn) continueBtn.click();
        }, 500);
      })()`
    });

    await sleep(4000);
    logTimeline('STEP_2_URL', (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value);

    // On /onboarding/artist: fill details
    logTimeline('STEP_3', 'Filling artist essentials');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const textInputs = Array.from(document.querySelectorAll('input[type="text"]'));
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (textInputs[0]) setReactInput(textInputs[0], 'Marcus Rivera');
        if (textInputs[1]) setReactInput(textInputs[1], 'marcusrivera');

        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.toLowerCase().includes('continue') || b.innerText.toLowerCase().includes('finish') || b.innerText.toLowerCase().includes('complete') || b.innerText.toLowerCase().includes('dashboard'));
        if (continueBtn) continueBtn.click();
      })()`
    });

    await sleep(4000);
    const postArtistUrl = (await send('Runtime.evaluate', { expression: 'window.location.href', returnByValue: true })).result?.value;
    logTimeline('POST_ARTIST_URL', postArtistUrl);

    // NOW TEST LOGIN AS ARTIST:
    logTimeline('RELOGIN_TEST', 'Navigating to /auth to test logging in as artist');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth' });
    await sleep(3000);

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

    // Watch next 15 seconds
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const urlEval = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          bodyText: document.body.innerText.slice(0, 150)
        })`,
        returnByValue: true
      });
      logTimeline('RELOGIN TICK ' + (i + 1) + 's', urlEval.result?.value);
    }

  } finally {
    p.kill();
  }
}

run().catch(console.error);
