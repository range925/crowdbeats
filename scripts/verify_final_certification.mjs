import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3aae0d40-c867-400e-88e1-e301f2bc0ae0\\final_certification_audit";
const PORT = 9250;

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
    deviceScaleFactor: 1,
    mobile,
    screenOrientation: { angle: 0, type: 'portraitPrimary' }
  });
}

async function captureScreenshot(cdp, filePath) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(result.data, 'base64'));
}

async function evaluate(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  return res.result?.value;
}

async function main() {
  console.log("=== FINAL CERTIFICATION: 9-VIEWPORT & OS DARK-MODE OVERRIDE AUDIT ===");

  const tempProfileDir = path.resolve('.chrome-temp-final-cert');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank'
  ]);

  let cdp = null;

  try {
    let versionData = null;
    for (let i = 0; i < 30; i++) {
      await sleep(400);
      try {
        const res = await fetch(`http://localhost:${PORT}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {}
    }

    if (!versionData) throw new Error("Could not connect to Chrome remote debugging port.");

    const listRes = await fetch(`http://localhost:${PORT}/json/list`);
    const pages = await listRes.json();
    const wsUrl = pages[0]?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No page target found");

    cdp = new CdpClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    // 1. All 9 Required Viewports
    const viewports = [
      { name: 'vp_320', width: 320, height: 640, mobile: true, label: '320px (Ultra-narrow)' },
      { name: 'vp_375', width: 375, height: 667, mobile: true, label: '375px (Compact Phone)' },
      { name: 'vp_390', width: 390, height: 844, mobile: true, label: '390px (iPhone 14/15)' },
      { name: 'vp_430', width: 430, height: 932, mobile: true, label: '430px (iPhone Pro Max)' },
      { name: 'vp_768', width: 768, height: 1024, mobile: false, label: '768px (Tablet Portrait)' },
      { name: 'vp_1024', width: 1024, height: 768, mobile: false, label: '1024px (Tablet Landscape)' },
      { name: 'vp_1280', width: 1280, height: 800, mobile: false, label: '1280px (Standard Desktop)' },
      { name: 'vp_1440', width: 1440, height: 900, mobile: false, label: '1440px (Wide Desktop)' },
      { name: 'vp_1920', width: 1920, height: 1080, mobile: false, label: '1920px (FHD Large Desktop)' },
    ];

    // 2. Representative Routes Across Personas
    const testRoutes = [
      { persona: 'Guest', name: 'landing', path: '/' },
      { persona: 'Guest', name: 'discover', path: '/discover' },
      { persona: 'Guest', name: 'performer_tip', path: '/tip/art_maya_lin' },
      { persona: 'Auth', name: 'auth', path: '/auth' },
      { persona: 'Onboarding', name: 'onboarding_persona', path: '/onboarding/persona' },
      { persona: 'Fan', name: 'fan_portal', path: '/fan' },
      { persona: 'Creator', name: 'creator_campaign', path: '/creator/campaigns/new' },
      { persona: 'Band', name: 'band_splits', path: '/band/splits' },
      { persona: 'Admin', name: 'admin_dashboard', path: '/admin/dashboard' },
    ];

    const matrixResults = [];

    console.log("\n--- TEST A: 9-VIEWPORT RESPONSIVE AUDIT ---");
    for (const r of testRoutes) {
      console.log(`\nAuditing [${r.persona}] ${r.name} (${r.path}):`);
      for (const vp of viewports) {
        await setViewport(cdp, vp.width, vp.height, vp.mobile);
        await cdp.send('Page.navigate', { url: `http://localhost:3000${r.path}` });
        await sleep(1000);

        const metrics = await evaluate(cdp, `(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const overflowDiff = Math.max(0, scrollWidth - clientWidth);
          const bodyBg = window.getComputedStyle(body).backgroundColor;

          // Check for hamburger button visibility at <= 768px
          const hamburgerBtn = document.querySelector('button[aria-label*="navigation menu"], button[aria-label*="menu"]');
          const isHamburgerVisible = hamburgerBtn ? (hamburgerBtn.getBoundingClientRect().width > 0) : false;

          return {
            scrollWidth,
            clientWidth,
            overflowDiff,
            bodyBg,
            isHamburgerVisible,
          };
        })()`);

        const shotPath = path.join(ARTIFACT_DIR, `cert_${r.name}_${vp.name}.png`);
        await captureScreenshot(cdp, shotPath);

        const pass = metrics.overflowDiff === 0;
        const mark = pass ? 'PASS' : 'FAIL';
        console.log(`  [${vp.name} - ${vp.width}px] ${mark}: ${metrics.overflowDiff}px overflow | Bg: ${metrics.bodyBg} | Hamburger: ${metrics.isHamburgerVisible}`);

        matrixResults.push({
          persona: r.persona,
          route: r.path,
          viewport: vp.name,
          width: vp.width,
          overflow: metrics.overflowDiff,
          passed: pass,
          bodyBg: metrics.bodyBg,
          hamburgerVisible: metrics.isHamburgerVisible,
          screenshot: shotPath,
        });
      }
    }

    console.log("\n--- TEST B: OS DARK MODE OVERRIDE IMMUNITY TEST ---");
    // Force OS/Browser dark mode media query: prefers-color-scheme: dark
    await cdp.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-color-scheme', value: 'dark' }],
    });

    const osDarkRoutes = ['/', '/auth', '/discover', '/tip/art_maya_lin'];
    const darkOverrideResults = [];

    for (const p of osDarkRoutes) {
      await cdp.send('Page.navigate', { url: `http://localhost:3000${p}` });
      await sleep(1200);

      const darkCheck = await evaluate(cdp, `(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const computedBg = window.getComputedStyle(body).backgroundColor;
        const colorScheme = window.getComputedStyle(docEl).colorScheme;
        const themeAttr = docEl.getAttribute('data-theme');

        // Check if background remains light (rgb >= 240, 240, 240)
        // RGB of #FBFBFD is rgb(251, 251, 253)
        const isLight = computedBg.includes('251, 251, 253') || computedBg.includes('255, 255, 255') || computedBg.includes('247, 248, 252');

        // Check for any dark-mode toggle button or switch in the DOM
        const toggleButtons = Array.from(document.querySelectorAll('button, input[type="checkbox"]'))
          .filter(el => {
            const text = (el.innerText || el.getAttribute('aria-label') || '').toLowerCase();
            return text.includes('dark mode') || text.includes('theme toggle') || text.includes('switch to dark');
          });

        return {
          computedBg,
          colorScheme,
          themeAttr,
          isLight,
          darkToggleCount: toggleButtons.length,
        };
      })()`);

      const darkShot = path.join(ARTIFACT_DIR, `os_dark_override_${p.replace(/[\/:]/g, '_')}.png`);
      await captureScreenshot(cdp, darkShot);

      const pass = darkCheck.isLight && darkCheck.darkToggleCount === 0;
      console.log(`  [OS DARK MODE] ${p} -> Bg: ${darkCheck.computedBg} | ColorScheme: ${darkCheck.colorScheme} | DarkToggles: ${darkCheck.darkToggleCount} | ${pass ? 'PASS (IMMUNE)' : 'FAIL'}`);

      darkOverrideResults.push({
        path: p,
        computedBg: darkCheck.computedBg,
        colorScheme: darkCheck.colorScheme,
        isLight: darkCheck.isLight,
        darkToggleCount: darkCheck.darkToggleCount,
        passed: pass,
        screenshot: darkShot,
      });
    }

    const fullReport = {
      matrix: matrixResults,
      osDarkOverride: darkOverrideResults,
      generatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(ARTIFACT_DIR, 'final_certification_summary.json'), JSON.stringify(fullReport, null, 2));
    console.log(`\nFinal Certification audit finished. Full JSON report written to ${path.join(ARTIFACT_DIR, 'final_certification_summary.json')}`);

  } catch (err) {
    console.error("Certification audit error:", err);
    process.exit(1);
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
  }
}

main();
