/**
 * Landing page capture + footer regression fingerprint.
 * Usage: node scripts/capture_landing.js <label> [viewports]
 *   label: e.g. "before" | "after"
 *   viewports: comma list of widths (default 1440,1024,390,360,1920)
 * Outputs to <artifactDir>/landing_<label>/:
 *   full_<w>_<theme>.png, footer_<w>_<theme>.png, hero_<w>_<theme>.png,
 *   footer_<w>_<theme>.json  (outerHTML hash + computed-style hash + links)
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9231;
const artifactDir = 'C:/Users/Knauf/.gemini/antigravity/brain/60ab879b-06db-4ab7-bd6d-102421ad9d52';
const label = process.argv[2] || 'before';
const widths = (process.argv[3] || '1440,1024,390,360,1920').split(',').map(Number);
const themes = (process.argv[4] || 'light,dark').split(',');
const url = process.env.LANDING_URL || 'http://localhost:3000/';
const outDir = path.join(artifactDir, `landing_${label}`);
fs.mkdirSync(outDir, { recursive: true });

const consentRecord = {
  version: '2026.1', status: 'accepted_all', timestamp: new Date().toISOString(),
  strictlyNecessary: true, analytics: true, ephemeralGeolocation: true, doNotSellOrShare: false,
  ccpaSection1798Acknowledged: true, gdprArticle15Acknowledged: true,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);

async function getWsUrl() {
  for (let i = 0; i < 50; i++) {
    await sleep(300);
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      const t = tabs.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding');
}

// Runs inside the page: fingerprint the footer subtree.
const FOOTER_PROBE = `(() => {
  const all = Array.from(document.querySelectorAll('footer'));
  const footer = all[all.length - 1];
  if (!footer) return null;
  const props = ['color','background-color','font-family','font-size','font-weight','line-height','letter-spacing','padding','margin','border','display','gap','text-decoration','border-radius','width'];
  const styles = [];
  footer.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    styles.push(el.tagName + ':' + props.map((p) => cs.getPropertyValue(p)).join('|'));
  });
  const cs = getComputedStyle(footer);
  const rootStyle = props.map((p) => cs.getPropertyValue(p)).join('|');
  const links = Array.from(footer.querySelectorAll('a')).map((a) => a.getAttribute('href') + ' :: ' + a.textContent.trim());
  const r = footer.getBoundingClientRect();
  return {
    html: footer.outerHTML,
    text: footer.innerText,
    styles: styles.join('\\n'),
    rootStyle,
    links,
    rect: { y: r.top + window.scrollY, h: r.height, w: r.width },
  };
})()`;

async function run() {
  const chrome = spawn(chromePath, [
    '--headless=new', `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${path.join(os.tmpdir(), 'cb_landing_cdp_' + Date.now())}`,
    '--disable-extensions', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });

  const summary = [];
  try {
    const ws = new WebSocket(await getWsUrl());
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 1;
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const myId = id++;
      const h = (evt) => {
        const d = JSON.parse(evt.data);
        if (d.id === myId) { ws.removeEventListener('message', h); d.error ? reject(d.error) : resolve(d.result); }
      };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: myId, method, params }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

    for (const theme of themes) {
      const scriptId = (await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try{localStorage.setItem('cb_privacy_consent_v1', ${JSON.stringify(JSON.stringify(consentRecord))});localStorage.setItem('crowdbeats-theme-preference','${theme}');}catch(e){}`,
      })).identifier;
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });

      for (const w of widths) {
        const h = w <= 480 ? 844 : 900;
        await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w <= 480 });
        await send('Page.navigate', { url });
        await sleep(6000);
        // Scroll through to trigger lazy content, then back to top.
        await evalJs(`(async()=>{const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}window.scrollTo(0,0);})()`);
        await sleep(1500);

        const tag = `${w}_${theme}`;
        // Hero / first viewport
        const hero = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(outDir, `hero_${tag}.png`), Buffer.from(hero.data, 'base64'));

        const metrics = await send('Page.getLayoutMetrics');
        const fullH = Math.ceil(metrics.cssContentSize.height);
        const full = await send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: w, height: Math.min(fullH, 16000), scale: w > 1000 ? 0.5 : 0.6 },
        });
        fs.writeFileSync(path.join(outDir, `full_${tag}.png`), Buffer.from(full.data, 'base64'));

        const fp = await evalJs(FOOTER_PROBE);
        if (fp) {
          const shot = await send('Page.captureScreenshot', {
            format: 'png', captureBeyondViewport: true,
            clip: { x: 0, y: fp.rect.y, width: w, height: Math.ceil(fp.rect.h), scale: 1 },
          });
          fs.writeFileSync(path.join(outDir, `footer_${tag}.png`), Buffer.from(shot.data, 'base64'));
          const record = {
            width: w, theme, footerHeight: fp.rect.h, footerWidth: fp.rect.w,
            htmlHash: sha(fp.html), textHash: sha(fp.text), styleHash: sha(fp.styles), rootStyle: fp.rootStyle,
            linkCount: fp.links.length, links: fp.links,
          };
          fs.writeFileSync(path.join(outDir, `footer_${tag}.json`), JSON.stringify(record, null, 2));
          fs.writeFileSync(path.join(outDir, `footer_${tag}.styles.txt`), fp.styles);
          fs.writeFileSync(path.join(outDir, `footer_${tag}.html`), fp.html);
          summary.push({ tag, pageHeight: fullH, footerH: fp.rect.h, htmlHash: record.htmlHash, styleHash: record.styleHash, textHash: record.textHash, links: fp.links.length });
        } else {
          summary.push({ tag, pageHeight: fullH, footer: 'NOT FOUND' });
        }
        // Overflow check
        const overflow = await evalJs(`document.documentElement.scrollWidth - window.innerWidth`);
        summary[summary.length - 1].horizontalOverflowPx = overflow;
        console.log(JSON.stringify(summary[summary.length - 1]));
      }
      await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptId });
    }
    fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
