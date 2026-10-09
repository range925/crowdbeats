const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\persona_journeys';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9365',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\cb_artist_clean_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(2000);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9365/json/list')).json();
    const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data || evt);
        if (d.id === myId) {
          ws.removeEventListener('message', h);
          d.error ? reject(d.error) : resolve(d.result?.result?.value !== undefined ? d.result.result.value : d.result);
        }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    await send('Page.enable');
    await send('Network.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    const artistEmail = `artist_e2e_${Date.now()}@crowdbeats.ai`;
    const artistPass = 'CrowdbeatsSolo2026!';

    console.log('1. Registering artist user:', artistEmail);
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth?mode=register' });
    await sleep(3000);

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
        setReactInput(emailInput, '${artistEmail}');
        setReactInput(passInputs[0], '${artistPass}');
        setReactInput(passInputs[1], '${artistPass}');
        const form = document.querySelector('form');
        if (form) form.requestSubmit();
      })()`
    });

    await sleep(5000);

    // Consent
    console.log('2. Accepting consent...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelectorAll('input[type="checkbox"]').forEach(c => { if (!c.checked) c.click(); });
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.innerText.toLowerCase().includes('agree') || b.innerText.toLowerCase().includes('continue'));
        if (continueBtn) continueBtn.click();
      })()`
    });
    await sleep(4000);

    // Persona picker: select Solo Musician
    console.log('3. Selecting Solo Musician persona...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const artistBtn = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('solo musician'));
        if (artistBtn) artistBtn.click();
        setTimeout(() => {
          const continueBtn = btns.find(b => b.innerText.trim() === 'Continue');
          if (continueBtn) continueBtn.click();
        }, 500);
      })()`
    });
    await sleep(4500);

    // Step 1: Inputs and genre
    console.log('4. Entering Stage Profile details & genre...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const stageInput = document.querySelector('input[placeholder*="Luna Valentine"]');
        const handleInput = document.querySelector('input[placeholder*="lunavalentine"]');
        setReactInput(stageInput, 'Devon Cole');
        setReactInput(handleInput, 'devoncole');

        const btns = Array.from(document.querySelectorAll('button'));
        const genreBtn = btns.find(b => b.innerText.trim() === 'Acoustic / Folk' || b.innerText.trim() === 'Rock');
        if (genreBtn) genreBtn.click();
      })()`
    });

    // Allow React state to settle
    await sleep(1500);

    console.log('5. Advancing to Step 2: Creator Readiness...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue to Creator Readiness'));
        if (nextBtn) nextBtn.click();
      })()`
    });

    await sleep(2500);

    console.log('6. Clicking Launch Creator Studio...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const launchBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Launch Creator Studio'));
        if (launchBtn) launchBtn.click();
      })()`
    });

    await sleep(3500);

    // If Step 3 Celebration Panel is showing, click 'Go to Creator Studio'
    console.log('6b. Checking for Step 3 Celebration Panel...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const goBtn = btns.find(b => b.innerText.includes('Go to Creator Studio'));
        if (goBtn) {
          goBtn.click();
        } else {
          window.location.href = '/creator/dashboard';
        }
      })()`
    });

    await sleep(5000);

    // Accept consent if banner visible
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const agreeBtn = btns.find(b => b.innerText.toLowerCase().includes('accept all') || b.innerText.toLowerCase().includes('agree'));
        if (agreeBtn) agreeBtn.click();
      })()`
    });
    await sleep(1500);

    const artistDashboard = await send('Runtime.evaluate', {
      expression: `({
        url: window.location.href,
        pathname: window.location.pathname,
        h1: document.querySelector('h1')?.innerText || '',
        sidebarText: document.querySelector('aside, nav')?.innerText.slice(0, 150) || '',
        bodySnippet: document.body.innerText.slice(0, 300)
      })`,
      returnByValue: true
    });

    console.log('Solo Artist Dashboard State:', JSON.stringify(artistDashboard, null, 2));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    const targetPath = path.join(artifactDir, 'persona_3_solo_artist.png');
    fs.writeFileSync(targetPath, Buffer.from(ss.data, 'base64'));
    console.log('Saved screenshot to:', targetPath);

  } finally {
    p.kill();
  }
}

run().catch(console.error);
