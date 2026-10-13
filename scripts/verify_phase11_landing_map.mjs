import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\phase11_landing_map_audit";
const PORT = 9245;

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

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });
  await cdp.send('Emulation.setVisibleSize', { width, height });
}

async function captureScreenshot(cdp, filePath) {
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', quality: 90 });
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function main() {
  console.log('--- Phase 11: Landing Page and Map Responsiveness Verification ---');

  const userDataDir = path.resolve('.chrome-temp-p11-landingmap-profile');
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ]);

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      try {
        const resp = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        versionData = await resp.json();
        break;
      } catch (err) {
        await sleep(300);
      }
    }

    if (!versionData || !versionData.webSocketDebuggerUrl) {
      throw new Error('Failed to connect to Chrome remote debugging port.');
    }

    const browserWs = versionData.webSocketDebuggerUrl;
    const browserCdp = new CdpClient(browserWs);
    await browserWs;
    await browserCdp.connect();

    const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
    const targetWs = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
    const pageCdp = new CdpClient(targetWs);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('DOM.enable');
    await pageCdp.send('Runtime.enable');

    const viewports = [
      { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
      { name: 'desktop_1024', width: 1024, height: 768, mobile: false },
      { name: 'tablet_768', width: 768, height: 1024, mobile: true },
      { name: 'phone_430', width: 430, height: 932, mobile: true },
      { name: 'phone_390', width: 390, height: 844, mobile: true },
      { name: 'phone_375', width: 375, height: 667, mobile: true },
      { name: 'phone_320', width: 320, height: 568, mobile: true },
    ];

    console.log('\nTesting Landing Page (/) across 7 viewports:');

    for (const vp of viewports) {
      await setViewport(pageCdp, vp.width, vp.height, vp.mobile);
      await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/?preview=1' });
      await sleep(1500);

      // Ensure privacy banner is dismissed via localStorage
      await evaluate(pageCdp, `(() => {
        try {
          localStorage.setItem('cb_privacy_consent_v1', JSON.stringify({
            version: '2026.1',
            status: 'accepted_all',
            timestamp: new Date().toISOString(),
            strictlyNecessary: true,
            analytics: true,
            ephemeralGeolocation: true,
            doNotSellOrShare: true,
            ccpaSection1798Acknowledged: true,
            gdprArticle15Acknowledged: true
          }));
        } catch {}
      })()`);

      // Verify sections and responsiveness metrics
      const audit = await evaluate(pageCdp, `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const overflow = docWidth > winWidth + 1;

        const hero = document.getElementById('hero');
        const discover = document.getElementById('discover');
        const searchInput = discover ? discover.querySelector('input[type="text"]') : null;
        const mapPanel = discover ? (discover.querySelector('.mapPanel34') || discover.querySelector('[class*="mapPanel34"]')) : null;
        const tabs = discover ? Array.from(discover.querySelectorAll('button[role="tab"]')).map(t => t.textContent.trim()) : [];
        const activeTab = discover ? discover.querySelector('button[role="tab"][aria-selected="true"]')?.textContent.trim() : null;

        return {
          viewport: { width: winWidth, height: window.innerHeight },
          docScrollWidth: docWidth,
          overflow,
          heroFound: !!hero,
          discoverFound: !!discover,
          searchInput: searchInput ? {
            placeholder: searchInput.placeholder,
            width: searchInput.getBoundingClientRect().width,
            height: searchInput.getBoundingClientRect().height,
          } : null,
          mapPanel: mapPanel ? {
            width: mapPanel.getBoundingClientRect().width,
            height: mapPanel.getBoundingClientRect().height,
            visible: window.getComputedStyle(mapPanel).display !== 'none',
          } : null,
          tabs,
          activeTab,
        };
      })()`);

      console.log(`\n[${vp.name}] Width: ${audit.viewport.width}px, ScrollWidth: ${audit.docScrollWidth}px, Overflow: ${audit.overflow}`);
      console.log(`  Hero: ${audit.heroFound}, Discover: ${audit.discoverFound}`);
      console.log(`  Search input: ${audit.searchInput ? `${audit.searchInput.width.toFixed(0)}x${audit.searchInput.height.toFixed(0)}px` : 'none'}`);
      console.log(`  Map Panel: ${audit.mapPanel ? `${audit.mapPanel.width.toFixed(0)}x${audit.mapPanel.height.toFixed(0)}px (vis: ${audit.mapPanel.visible})` : 'none'}`);
      console.log(`  Tabs: [${audit.tabs.join(', ')}], Active: "${audit.activeTab}"`);

      // Scroll to Discover section
      await evaluate(pageCdp, `(() => {
        const el = document.getElementById('discover');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`);
      await sleep(600);

      const shotPath = path.join(ARTIFACT_DIR, `p11_landing_discover_${vp.name}.png`);
      await captureScreenshot(pageCdp, shotPath);
      console.log(`  Screenshot saved: ${shotPath}`);

      // On mobile viewports, test switching to Map view via view toggle if present
      if (vp.mobile) {
        await evaluate(pageCdp, `(() => {
          const mapBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Map');
          if (mapBtn) mapBtn.click();
        })()`);
        await sleep(500);

        const mapShotPath = path.join(ARTIFACT_DIR, `p11_landing_map_toggle_${vp.name}.png`);
        await captureScreenshot(pageCdp, mapShotPath);
        console.log(`  Map Toggle Screenshot saved: ${mapShotPath}`);

        // Switch back to List view
        await evaluate(pageCdp, `(() => {
          const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'List');
          if (listBtn) listBtn.click();
        })()`);
        await sleep(300);
      }
    }

    // Now test dedicated /discover page
    console.log('\nTesting Dedicated Discover Page (/discover):');
    for (const vp of [viewports[0], viewports[4]]) { // Desktop 1440 & Mobile 390
      await setViewport(pageCdp, vp.width, vp.height, vp.mobile);
      await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/discover' });
      await sleep(1500);

      const discoverAudit = await evaluate(pageCdp, `(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      })()`);

      console.log(`[/discover - ${vp.name}] Width: ${discoverAudit.innerWidth}px, Overflow: ${discoverAudit.overflow}`);
      const shotPath = path.join(ARTIFACT_DIR, `p11_discover_page_${vp.name}.png`);
      await captureScreenshot(pageCdp, shotPath);
      console.log(`  Screenshot saved: ${shotPath}`);
    }

    pageCdp.close();
    browserCdp.close();
    console.log('\n--- Phase 11 CDP Verification Completed Successfully ---');
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(err => {
  console.error('Fatal error in Phase 11 audit script:', err);
  process.exit(1);
});
