import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase6_audit";
const PORT = 9226;

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 1;
    this.pending = new Map();
    this.isOpen = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        this.isOpen = true;
        resolve();
      };
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

const VIEWPORTS = [
  { name: '320_small_phone', width: 320, height: 640, mobile: true, scale: 2 },
  { name: '375_phone', width: 375, height: 667, mobile: true, scale: 2 },
  { name: '390_iphone14', width: 390, height: 844, mobile: true, scale: 2 },
  { name: '430_iphone15_promax', width: 430, height: 932, mobile: true, scale: 2 },
  { name: '768_tablet_portrait', width: 768, height: 1024, mobile: true, scale: 2 },
  { name: '1024_tablet_landscape', width: 1024, height: 768, mobile: false, scale: 1 },
  { name: '1280_laptop', width: 1280, height: 800, mobile: false, scale: 1 },
  { name: '1440_desktop', width: 1440, height: 900, mobile: false, scale: 1 },
  { name: '1920_ultrawide', width: 1920, height: 1080, mobile: false, scale: 1 },
  { name: '844x390_mobile_landscape', width: 844, height: 390, mobile: true, scale: 2 },
];

const PAGES_TO_AUDIT = [
  { name: 'landing', url: 'http://localhost:3000/' },
  { name: 'discover', url: 'http://localhost:3000/discover' },
  { name: 'auth', url: 'http://localhost:3000/auth' },
  { name: 'account', url: 'http://localhost:3000/account' },
  { name: 'creator_dashboard', url: 'http://localhost:3000/creator/dashboard' },
  { name: 'band_dashboard', url: 'http://localhost:3000/band/dashboard' },
  { name: 'sponsor_dashboard', url: 'http://localhost:3000/sponsor/dashboard' },
  { name: 'venue_dashboard', url: 'http://localhost:3000/venue/dashboard' },
  { name: 'admin', url: 'http://localhost:3000/admin' },
];

async function main() {
  console.log('=== PHASE 6: RESPONSIVE BREAKPOINT AND LAYOUT AUDIT ===');
  console.log('Launching headless Chrome on port', PORT);

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--user-data-dir=' + path.join(process.cwd(), '.chrome-temp-p6-profile')
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        console.log('Connected to Chrome CDP:', wsUrl);
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Could not connect to Chrome debugging port.');
    chromeProc.kill();
    process.exit(1);
  }

  const newTargetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const targetData = await newTargetRes.json();
  const cdp = new CdpClient(targetData.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');

  const sessionCookieVal = encodeURIComponent(JSON.stringify({
    uid: 'test_creator_123',
    personaType: 'artist',
    emailVerified: true,
    onboarded: true,
    displayName: 'Test Artist',
  }));

  await cdp.send('Network.setCookie', {
    name: '__cb_session',
    value: sessionCookieVal,
    url: 'http://localhost:3000/',
  });

  const auditResults = [];

  for (const pageItem of PAGES_TO_AUDIT) {
    console.log(`\nAuditing route: ${pageItem.name} (${pageItem.url})`);
    
    for (const vp of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.scale,
        mobile: vp.mobile
      });

      await cdp.send('Page.navigate', { url: pageItem.url });
      await sleep(1200);

      // Measure overflow and layout metrics
      const overflowMetrics = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
          const innerWidth = window.innerWidth;
          const hasHorizontalOverflow = scrollWidth > innerWidth + 1; // 1px threshold for subpixel

          // Find overflowing elements if any
          const overflowingElements = [];
          if (hasHorizontalOverflow) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > innerWidth + 2 && r.width > 0 && r.height > 0) {
                const tag = el.tagName.toLowerCase();
                const cls = el.className ? (typeof el.className === 'string' ? el.className.slice(0, 40) : '') : '';
                const id = el.id ? '#' + el.id : '';
                overflowingElements.push({
                  selector: tag + id + (cls ? '.' + cls.trim().split(/\\s+/)[0] : ''),
                  right: Math.round(r.right),
                  width: Math.round(r.width)
                });
                if (overflowingElements.length >= 5) break;
              }
            }
          }

          return {
            scrollWidth,
            innerWidth,
            hasHorizontalOverflow,
            overflowingElements
          };
        })()`,
        returnByValue: true
      });

      const metrics = overflowMetrics.result.value;
      const status = metrics.hasHorizontalOverflow ? 'FAIL' : 'PASS';
      
      console.log(`  [${status}] ${vp.name} (${vp.width}x${vp.height}): innerWidth=${metrics.innerWidth}, scrollWidth=${metrics.scrollWidth}${metrics.hasHorizontalOverflow ? ` OVERFLOW: ${JSON.stringify(metrics.overflowingElements)}` : ''}`);

      auditResults.push({
        page: pageItem.name,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        hasHorizontalOverflow: metrics.hasHorizontalOverflow,
        scrollWidth: metrics.scrollWidth,
        innerWidth: metrics.innerWidth,
        overflowingElements: metrics.overflowingElements
      });

      // Capture screenshot for key representative combinations
      const shouldCapture = (vp.width === 320 || vp.width === 390 || vp.width === 768 || vp.width === 1440 || vp.name.includes('landscape'));
      if (shouldCapture) {
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const shotFilename = `p6_${pageItem.name}_${vp.width}px.png`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, shotFilename), Buffer.from(shot.data, 'base64'));
      }
    }
  }

  // Save full JSON report
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'responsive_audit_results.json'), JSON.stringify(auditResults, null, 2));

  console.log('\n================ PHASE 6 AUDIT SUMMARY ================');
  const failures = auditResults.filter(r => r.hasHorizontalOverflow);
  console.log(`Total combinations checked: ${auditResults.length}`);
  console.log(`Passed combinations: ${auditResults.length - failures.length}`);
  console.log(`Failed combinations: ${failures.length}`);

  if (failures.length > 0) {
    console.log('\nFailing Viewports & Routes:');
    for (const f of failures) {
      console.log(`- ${f.page} @ ${f.viewport} (${f.width}px): scrollWidth=${f.scrollWidth} > innerWidth=${f.innerWidth}. Culprits: ${JSON.stringify(f.overflowingElements)}`);
    }
  }

  cdp.close();
  chromeProc.kill();

  if (failures.length === 0) {
    console.log('\nALL RESPONSIVE VIEWPORTS PASSED WITH ZERO HORIZONTAL OVERFLOW!');
    process.exit(0);
  } else {
    console.log('\nResponsive adjustments needed for identified failing combinations.');
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Fatal error during Phase 6 audit:', err);
  process.exit(1);
});
