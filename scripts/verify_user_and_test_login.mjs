import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Load service account or ADC
let serviceAccount;
const candidatePaths = [
  resolve(__dirname, '../service-account.json'),
  resolve(__dirname, '../apps/web/service-account.json'),
  resolve(__dirname, '../crowdbeats-01-service-account.json'),
];
for (const p of candidatePaths) {
  try { serviceAccount = JSON.parse(readFileSync(p, 'utf8')); break; } catch {}
}

if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount), projectId: 'crowdbeats-01' });
  } else {
    initializeApp({ projectId: 'crowdbeats-01' });
  }
}

const auth = getAuth();
const db = getFirestore();

async function main() {
  const testEmail = 'testuser_1791490428226@crowdbeats.ai';
  const testPassword = 'Password123!Test';

  console.log('[1/4] Ensuring test user is emailVerified in Firebase Auth & Firestore...');
  const userRecord = await auth.getUserByEmail(testEmail);
  console.log(`Found user: ${userRecord.uid}`);

  await auth.updateUser(userRecord.uid, {
    emailVerified: true
  });
  console.log('Firebase Auth emailVerified set to true.');

  await db.collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: testEmail,
    displayName: 'Test Fan Explorer',
    personaType: 'fan',
    onboardedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    v: 1
  }, { merge: true });

  await db.collection('fanProfiles').doc(userRecord.uid).set({
    uid: userRecord.uid,
    displayName: 'Test Fan Explorer',
    favoriteGenres: ['Indie Rock', 'Jazz'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    v: 1
  }, { merge: true });
  console.log('Firestore user document & fanProfile successfully verified and synced.');

  console.log('[2/4] Launching headless Chrome CDP to test login on https://crowdbeats.ai/auth...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9295',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_verified_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9295/json/list')).json();
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
        console.log(`[FRAME_NAVIGATED] ${d.params.frame?.url}`);
      }
    });

    console.log('[3/4] Navigating to https://crowdbeats.ai/auth');
    await send('Page.navigate', { url: 'https://crowdbeats.ai/auth' });
    await sleep(2500);

    console.log('Submitting login credentials...');
    const fillResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        if (!emailInput || !passInput) return { error: 'Inputs not found' };

        function setReactInput(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setReactInput(emailInput, '${testEmail}');
        setReactInput(passInput, '${testPassword}');

        const btn = document.querySelector('button[type="submit"]');
        if (!btn) return { error: 'Submit button not found' };
        btn.click();
        return { success: true };
      })()`,
      returnByValue: true
    });
    console.log('Fill & submit result:', fillResult.result?.value);

    console.log('[4/4] Observing navigation for 15 seconds to ensure NO bounce back...');
    const observations = [];
    for (let i = 1; i <= 15; i++) {
      await sleep(1000);
      const state = await send('Runtime.evaluate', {
        expression: `({
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          h1: document.querySelector('h1')?.innerText || '',
          bodyTextPrefix: document.body.innerText.slice(0, 150)
        })`,
        returnByValue: true
      });
      const val = state.result?.value;
      observations.push(val);
      console.log(`[Tick ${i}s] URL: ${val?.url} | H1: ${val?.h1}`);
    }

    // Capture screenshot of destination
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = resolve(__dirname, '../C:/Users/Knauf/.gemini/antigravity/brain/3f628977-a368-4457-aac2-a7e744b95e60/verified_fan_dashboard_after_login.png');
    // Also save directly to brain folder
    import('fs').then(fs => {
      fs.writeFileSync('C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\verified_fan_dashboard_after_login.png', Buffer.from(screenshot.data, 'base64'));
    });

    const finalUrl = observations[observations.length - 1]?.pathname;
    const bounced = observations.some(o => o?.pathname === '/auth' && observations.indexOf(o) > 2);

    console.log('\n--- VERIFICATION REPORT ---');
    console.log('Final URL pathname:', finalUrl);
    console.log('Bounced back to /auth after login?:', bounced ? 'YES (FAIL)' : 'NO (PASS)');
    console.log('Destination reached:', finalUrl === '/fan' ? 'Fan Dashboard /fan (PASS)' : finalUrl);
    console.log('---------------------------\n');

  } finally {
    p.kill();
  }
}

main().catch(err => {
  console.error('Fatal error in test:', err);
  process.exit(1);
});
