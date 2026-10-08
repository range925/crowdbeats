const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9296',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_signup_' + Date.now(),
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    const logs = [];
    ws.addEventListener('message', (evt) => {
      const d = JSON.parse(evt.data);
      if (d.method === 'Page.frameNavigated') {
        const msg = `[NAVIGATED] ${d.params.frame?.url}`;
        console.log(msg);
        logs.push(msg);
      } else if (d.method === 'Runtime.consoleAPICalled') {
        const msg = `[CONSOLE ${d.params.type}] ${d.params.args.map(a => a.value || a.description).join(' ')}`;
        if (d.params.type === 'error') console.log(msg);
        logs.push(msg);
      }
    });

    console.log('[Step 1] Navigating to https://crowdbeats.ai/auth?mode=register');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(2500);

    // Verify Theme Switcher works smoothly between light, dark, and system
    console.log('[Step 2] Testing Appearance Switcher (Light / Dark / Auto)...');
    const themeTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('div[role="group"] button'));
        const labels = buttons.map(b => b.getAttribute('aria-label') || b.innerText);
        // Click dark mode button
        const darkBtn = buttons.find(b => (b.getAttribute('aria-label') || '').includes('Dark'));
        if (darkBtn) darkBtn.click();
        const htmlThemeDark = document.documentElement.getAttribute('data-theme');
        
        // Click light mode button
        const lightBtn = buttons.find(b => (b.getAttribute('aria-label') || '').includes('Light'));
        if (lightBtn) lightBtn.click();
        const htmlThemeLight = document.documentElement.getAttribute('data-theme');

        return { labels, htmlThemeDark, htmlThemeLight };
      })()`,
      returnByValue: true
    });
    console.log('Appearance Switcher Result:', themeTest.result?.value);

    // Capture screenshot of auth page in Light mode
    const shotLight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\auth_page_light_verified.png', Buffer.from(shotLight.data, 'base64'));

    // Switch to dark and capture
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('div[role="group"] button'));
        const darkBtn = buttons.find(b => (b.getAttribute('aria-label') || '').includes('Dark'));
        if (darkBtn) darkBtn.click();
      })()`
    });
    await sleep(400);
    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\auth_page_dark_verified.png', Buffer.from(shotDark.data, 'base64'));

    // Switch back to light for clean form fill
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('div[role="group"] button'));
        const lightBtn = buttons.find(b => (b.getAttribute('aria-label') || '').includes('Light'));
        if (lightBtn) lightBtn.click();
      })()`
    });
    await sleep(400);

    const newEmail = `fan_live_${Date.now()}@crowdbeats.ai`;
    const newPass = 'CrowdbeatsLive2026!';
    console.log(`[Step 3] Submitting new account registration with ${newEmail}...`);

    const fillResult = await send('Runtime.evaluate', {
      expression: `(() => {
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const emailInput = document.querySelector('input[type="email"]');
        const passInputs = Array.from(document.querySelectorAll('input[type="password"]'));
        if (!emailInput || passInputs.length < 2) {
          return { error: 'Register inputs not found', passCount: passInputs.length };
        }

        setReactInput(emailInput, '${newEmail}');
        setReactInput(passInputs[0], '${newPass}');
        setReactInput(passInputs[1], '${newPass}');

        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return { error: 'Submit button not found' };
        submitBtn.click();
        return { success: true, btnText: submitBtn.innerText };
      })()`,
      returnByValue: true
    });
    console.log('Registration submission result:', fillResult.result?.value);

    console.log('[Step 4] Observing post-registration transition for 15 seconds...');
    const timeline = [];
    for (let i = 1; i <= 15; i++) {
      await sleep(1000);
      const state = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText).filter(Boolean).slice(0, 5)
        })`,
        returnByValue: true
      });
      const val = state.result?.value;
      timeline.push(val);
      console.log(`[Tick ${i}s] Path: ${val?.pathname} | H1: ${val?.h1} | Buttons: ${JSON.stringify(val?.buttons)}`);
    }

    const finalPath = timeline[timeline.length - 1]?.pathname;
    const isStuckOnAuth = finalPath === '/auth' && timeline.length > 5;
    const isVerifyEmail = finalPath === '/auth/verify-email';
    const isOnboarding = finalPath === '/onboarding';

    console.log('\n========================================');
    console.log('REGISTRATION & NAVIGATION AUDIT REPORT');
    console.log('========================================');
    console.log('Created account:', newEmail);
    console.log('Final URL pathname:', finalPath);
    console.log('Did it get stuck on /auth?:', isStuckOnAuth ? 'YES (FAIL)' : 'NO (PASS)');
    console.log('Did it navigate to valid destination?:', (isVerifyEmail || isOnboarding) ? `YES (${finalPath}) (PASS)` : 'NO');
    console.log('Zero bounce back detected?:', !timeline.some((t, idx) => idx > 3 && t?.pathname === '/auth') ? 'PASS' : 'FAIL');
    console.log('========================================\n');

  } finally {
    p.kill();
  }
}

run().catch(console.error);
