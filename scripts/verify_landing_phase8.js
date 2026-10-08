/**
 * Phase 8 Landing Page QA & Verification Script
 * Viewports: 360, 390, 768, 1024, 1440
 * Target: C:\Users\Knauf\.gemini\antigravity\brain\3f628977-a368-4457-aac2-a7e744b95e60\landing_verified\
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9291;
const targetDir = 'C:\\Users\\Knauf\\.gemini\\antigravity\\brain\\3f628977-a368-4457-aac2-a7e744b95e60\\landing_verified';
fs.mkdirSync(targetDir, { recursive: true });

const url = 'http://127.0.0.1:3005/';
const viewports = [
  { width: 360, height: 740, mobile: true, scale: 0.8, label: '360px_mobile_small' },
  { width: 390, height: 844, mobile: true, scale: 0.8, label: '390px_mobile_standard' },
  { width: 768, height: 1024, mobile: false, scale: 0.6, label: '768px_tablet' },
  { width: 1024, height: 768, mobile: false, scale: 0.5, label: '1024px_small_desktop' },
  { width: 1440, height: 900, mobile: false, scale: 0.5, label: '1440px_wide_desktop' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const tabs = await res.json();
      const t = tabs.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch (e) {}
  }
  throw new Error('CDP not responding on port ' + debugPort);
}

const consentRecord = {
  version: '2026.1', status: 'accepted_all', timestamp: new Date().toISOString(),
  strictlyNecessary: true, analytics: true, ephemeralGeolocation: true, doNotSellOrShare: false,
  ccpaSection1798Acknowledged: true, gdprArticle15Acknowledged: true,
};

async function run() {
  console.log('--- Spawning Production Dist Server on Port 3005 ---');
  const distServer = spawn('node', ['scripts/serve_dist.js'], { stdio: 'inherit' });
  await sleep(1500);

  console.log('--- Launching Chrome for Phase 8 Verification ---');
  const tmpProfile = path.join(os.tmpdir(), 'cb_p8_cdp_' + Date.now());
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tmpProfile}`,
    '--disable-extensions',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: 'ignore' });

  const testResults = [];
  function record(name, pass, details) {
    testResults.push({ name, pass, details });
    console.log(`${pass ? '✅ [PASS]' : '❌ [FAIL]'} ${name}: ${details}`);
  }

  try {
    const wsUrl = await getWsUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.addEventListener('open', r));

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

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.exception?.description || 'Eval error');
      }
      return res.result?.value;
    };

    // Pre-populate consent in localStorage so privacy modal does not block viewports
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try {
        localStorage.setItem('cb_privacy_consent_v1', ${JSON.stringify(JSON.stringify(consentRecord))});
        localStorage.setItem('crowdbeats-theme-preference', 'light');
      } catch(e) {}`,
    });

    const navigateAndWait = async (targetUrl) => {
      const loadPromise = new Promise((resolve) => {
        const handler = (evt) => {
          try {
            const d = JSON.parse(evt.data);
            if (d.method === 'Page.loadEventFired') {
              ws.removeEventListener('message', handler);
              resolve();
            }
          } catch(e) {}
        };
        ws.addEventListener('message', handler);
      });
      await send('Page.navigate', { url: targetUrl });
      await Promise.race([loadPromise, sleep(8000)]);
      await sleep(2500);
    };

    console.log('\n--- Running Structural & Functional Checks at 1440px ---');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigateAndWait(url);

    // Trigger full lazy scroll then scroll back to top
    await evalJs(`(async () => {
      const H = document.documentElement.scrollHeight;
      for (let y = 0; y < H; y += 800) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    })()`);
    await sleep(1500);

    // 1. Header Checks
    const headerInfo = await evalJs(`(() => {
      const header = document.querySelector('header');
      if (!header) return { exists: false };
      const themeToggle = header.querySelector('button[aria-label*="mode" i], button[title*="mode" i]');
      const navLinks = Array.from(header.querySelectorAll('nav a')).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') }));
      const signInLink = Array.from(header.querySelectorAll('a')).find(a => a.textContent.includes('Sign In') || a.getAttribute('href') === '/auth' || a.getAttribute('href') === '/account');
      const joinBtn = Array.from(header.querySelectorAll('button')).find(b => b.textContent.includes('Join Crowdbeats'));
      return {
        exists: true,
        hasThemeToggle: !!themeToggle,
        themeLabel: themeToggle?.getAttribute('aria-label'),
        navLinks,
        hasSignIn: !!signInLink,
        signInHref: signInLink?.getAttribute('href'),
        hasJoinBtn: !!joinBtn,
      };
    })()`);
    record(
      'Header & Navigation Links Present',
      headerInfo.exists && headerInfo.hasSignIn && headerInfo.hasJoinBtn && headerInfo.navLinks.length >= 3,
      `Nav links: ${headerInfo.navLinks?.map(l => `${l.text} (${l.href})`).join(', ')}, Sign-in href: ${headerInfo.signInHref}`
    );

    // Theme Toggle Functionality Check
    const initialTheme = await evalJs(`document.documentElement.getAttribute('data-theme') || 'light'`);
    await evalJs(`(() => {
      const themeToggle = document.querySelector('header button[aria-label*="mode" i], header button[title*="mode" i]');
      if (themeToggle) themeToggle.click();
    })()`);
    await sleep(400);
    const toggledTheme = await evalJs(`document.documentElement.getAttribute('data-theme')`);
    await evalJs(`(() => {
      const themeToggle = document.querySelector('header button[aria-label*="mode" i], header button[title*="mode" i]');
      if (themeToggle) themeToggle.click();
    })()`);
    await sleep(400);
    const restoredTheme = await evalJs(`document.documentElement.getAttribute('data-theme')`);
    record(
      'Theme Toggle Button Operability',
      toggledTheme !== initialTheme && restoredTheme === initialTheme,
      `Initial: ${initialTheme} -> Toggled: ${toggledTheme} -> Restored: ${restoredTheme}`
    );

    // 2. Hero Section Checks
    const heroInfo = await evalJs(`(() => {
      const hero = document.querySelector('#hero');
      if (!hero) return null;
      const h1 = hero.querySelector('h1')?.textContent.trim().replace(/\\s+/g, ' ');
      const sub = hero.querySelector('p')?.textContent.trim();
      const btns = Array.from(hero.querySelectorAll('a, button')).map(b => b.textContent.trim());
      return { h1, sub, btns };
    })()`);
    const expectedPromise = 'Discover live musicians near you. Support the music you love.';
    record(
      'Hero Section Promise Headline',
      heroInfo && heroInfo.h1 === expectedPromise,
      `H1 text: "${heroInfo?.h1}" (Expected: "${expectedPromise}")`
    );

    // 3. Discover Map Section Checks
    const discoverInfo = await evalJs(`(() => {
      const sec = document.querySelector('#discover');
      if (!sec) return null;
      const mapPanel = sec.querySelector('[class*="mapPanel"]');
      const mapCanvas = sec.querySelector('[class*="mapCanvas"], .gm-style, canvas');
      const tabs = Array.from(sec.querySelectorAll('[role="tab"]')).map(t => t.textContent.trim());
      const cards = sec.querySelectorAll('[class*="card"], [class*="PerformerCard"], li');
      const mapWidth = mapPanel ? mapPanel.offsetWidth : 0;
      return {
        hasSection: true,
        hasMapPanel: !!mapPanel,
        mapWidth,
        tabs,
        cardCount: cards.length,
      };
    })()`);
    record(
      'Discover Map Section & Layout',
      discoverInfo && discoverInfo.hasMapPanel && discoverInfo.mapWidth > 600,
      `Map panel width: ${discoverInfo?.mapWidth}px, Tabs: ${discoverInfo?.tabs.join(' | ')}, Cards count: ${discoverInfo?.cardCount}`
    );

    // 4. Connection Section Checks
    const connectionInfo = await evalJs(`(() => {
      const sec = document.querySelector('#connection');
      if (!sec) return null;
      const h2 = sec.querySelector('h2')?.textContent.trim().replace(/\\s+/g, ' ');
      const btns = Array.from(sec.querySelectorAll('a, button')).map(b => ({ text: b.textContent.trim(), href: b.getAttribute('href') }));
      return { h2, btns };
    })()`);
    const expectedConnection = 'Great music. Real connection.';
    record(
      'Connection Section Heading & CTAs',
      connectionInfo && connectionInfo.h2 === expectedConnection,
      `H2: "${connectionInfo?.h2}", CTAs: ${connectionInfo?.btns.map(b => `${b.text} (${b.href})`).join(', ')}`
    );

    // 5. 6-card Storytelling Bento Grid Checks
    const bentoInfo = await evalJs(`(() => {
      const grid = document.querySelector('#grid');
      if (!grid) return null;
      const soloLink = grid.querySelector('#tile-solo-musicians a[href*="intent=solo"]');
      const bandLink = grid.querySelector('#tile-bands a[href*="intent=band"]');
      const campaignLink = grid.querySelector('#tile-campaigns a[href*="campaigns"]');
      const tippingCard = grid.querySelector('#tile-tipping');
      const tipPresets = tippingCard ? Array.from(tippingCard.querySelectorAll('[role="radio"]')).map(r => r.textContent.trim()) : [];
      const tiles = Array.from(grid.querySelectorAll('[id^="tile-"]')).map(t => t.id);
      return {
        tiles,
        soloHref: soloLink?.getAttribute('href'),
        bandHref: bandLink?.getAttribute('href'),
        campaignHref: campaignLink?.getAttribute('href'),
        tipPresets,
      };
    })()`);
    const bentoValid = bentoInfo &&
      bentoInfo.tiles.length === 6 &&
      bentoInfo.soloHref === '/auth?mode=register&intent=solo' &&
      bentoInfo.bandHref === '/auth?mode=register&intent=band' &&
      bentoInfo.campaignHref === '/discover?tab=campaigns';
    record(
      '6-Card Storytelling Bento Grid & Contract Links',
      bentoValid,
      `Tiles found: ${bentoInfo?.tiles.length} (${bentoInfo?.tiles.join(', ')}), Solo: ${bentoInfo?.soloHref}, Band: ${bentoInfo?.bandHref}, Campaigns: ${bentoInfo?.campaignHref}, Tip chips: ${bentoInfo?.tipPresets.join(', ')}`
    );

    // 6. Editorial Carousel Checks
    const carouselInfo = await evalJs(`(() => {
      const carousel = document.querySelector('#carousel');
      if (!carousel) return null;
      const navBtns = carousel.querySelectorAll('button[class*="navCircleButton"]');
      const activeSlide = carousel.querySelector('[class*="carouselSlideActive"]');
      const performerName = activeSlide?.querySelector('h3')?.textContent.trim();
      const tipLink = activeSlide?.querySelector('a[href^="/tip/"]')?.getAttribute('href');
      const profileLink = activeSlide?.querySelector('a[href^="/artist/"], a[href^="/band/"]')?.getAttribute('href');
      const dots = carousel.querySelectorAll('[role="tab"]');
      return {
        exists: true,
        navBtnCount: navBtns.length,
        dotsCount: dots.length,
        firstPerformer: performerName,
        tipLink,
        profileLink,
      };
    })()`);
    // Test navigation button click
    await evalJs(`(() => {
      const nextBtn = document.querySelectorAll('#carousel button[class*="navCircleButton"]')[1];
      if (nextBtn) nextBtn.click();
    })()`);
    await sleep(400);
    const secondSlidePerformer = await evalJs(`document.querySelector('#carousel [class*="carouselSlideActive"] h3')?.textContent.trim()`);
    // Click prev back
    await evalJs(`(() => {
      const prevBtn = document.querySelectorAll('#carousel button[class*="navCircleButton"]')[0];
      if (prevBtn) prevBtn.click();
    })()`);
    await sleep(400);
    const restoredSlidePerformer = await evalJs(`document.querySelector('#carousel [class*="carouselSlideActive"] h3')?.textContent.trim()`);
    const carouselValid = carouselInfo &&
      carouselInfo.navBtnCount === 2 &&
      carouselInfo.tipLink &&
      carouselInfo.profileLink &&
      secondSlidePerformer !== carouselInfo.firstPerformer &&
      restoredSlidePerformer === carouselInfo.firstPerformer;
    record(
      'Editorial Carousel Functional Navigation & Profile/Tip Links',
      carouselValid,
      `Slide 1: ${carouselInfo?.firstPerformer} (Tip: ${carouselInfo?.tipLink}, Profile: ${carouselInfo?.profileLink}) -> Slide 2: ${secondSlidePerformer} -> Back: ${restoredSlidePerformer}`
    );

    // 7. Media Rail Checks
    const mediaRailInfo = await evalJs(`(() => {
      const sec = document.querySelector('[class*="mediaRailSection"]');
      if (!sec) return null;
      const title = sec.querySelector('h3')?.textContent.trim();
      const cards = Array.from(sec.querySelectorAll('a[class*="railCard"]')).map(a => a.textContent.trim().replace(/\\s+/g, ' '));
      const navBtns = sec.querySelectorAll('button[class*="navCircleButton"]');
      return {
        title,
        cardCount: cards.length,
        navBtnCount: navBtns.length,
        cards,
      };
    })()`);
    record(
      'Media Rail with Sound & City Channels',
      mediaRailInfo && mediaRailInfo.cardCount >= 6 && mediaRailInfo.title?.toLowerCase().includes('sound & city'),
      `Title: "${mediaRailInfo?.title}", Channel count: ${mediaRailInfo?.cardCount}, Channels: ${mediaRailInfo?.cards.slice(0, 3).join(' | ')}...`
    );

    // 8. Footer Checks
    const footerInfo = await evalJs(`(() => {
      const footer = document.querySelector('footer');
      if (!footer) return null;
      const text = footer.innerText;
      const hasCcpa = text.includes('CCPA') && text.includes('1798');
      const hasFee = text.includes('6%') && text.includes('platform');
      const hasJurisdiction = text.includes('California');
      const links = Array.from(footer.querySelectorAll('a')).map(a => a.getAttribute('href'));
      const hasDiscoverAnchor = links.some(h => h === '/#discover' || h === '/discover');
      const hasCarouselAnchor = links.some(h => h === '/#carousel');
      const hasTerms = links.some(h => h === '/legal/terms');
      const hasPrivacy = links.some(h => h === '/legal/privacy');
      return {
        hasCcpa,
        hasFee,
        hasJurisdiction,
        hasDiscoverAnchor,
        hasCarouselAnchor,
        hasTerms,
        hasPrivacy,
        totalLinks: links.length,
      };
    })()`);
    const footerValid = footerInfo &&
      footerInfo.hasCcpa &&
      footerInfo.hasFee &&
      footerInfo.hasJurisdiction &&
      footerInfo.hasDiscoverAnchor &&
      footerInfo.hasCarouselAnchor &&
      footerInfo.hasTerms &&
      footerInfo.hasPrivacy;
    record(
      'Footer Statutory Disclosures & Fixed Anchor Links',
      footerValid,
      `CCPA: ${footerInfo?.hasCcpa}, 6% Fee: ${footerInfo?.hasFee}, Jurisdiction CA: ${footerInfo?.hasJurisdiction}, #discover anchor: ${footerInfo?.hasDiscoverAnchor}, #carousel anchor: ${footerInfo?.hasCarouselAnchor}, Legal links present: ${footerInfo?.hasTerms && footerInfo?.hasPrivacy}, Total links: ${footerInfo?.totalLinks}`
    );

    console.log('\n--- Capturing Landing Page at 5 Viewports & Testing Overflow ---');
    const viewportResults = [];

    for (const vp of viewports) {
      console.log(`\nTesting viewport: ${vp.width}px (${vp.label})...`);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });

      await navigateAndWait(url);

      // Lazy load scroll
      await evalJs(`(async () => {
        const H = document.documentElement.scrollHeight;
        for (let y = 0; y < H; y += 700) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      })()`);
      await sleep(1500);

      // Overflow calculation
      const overflowData = await evalJs(`(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const overflow = Math.max(0, scrollW - innerW);
        // Find overflowing elements if any
        const culprits = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.right > innerW + 1 && r.width > 0 && r.height > 0) {
            culprits.push({
              tag: el.tagName,
              id: el.id,
              class: (el.className || '').toString().slice(0, 50),
              right: Math.round(r.right),
              width: Math.round(r.width)
            });
          }
        });
        return { scrollW, innerW, overflow, culprits: culprits.slice(0, 5) };
      })()`);

      const passOverflow = overflowData.overflow === 0;
      record(
        `Viewport ${vp.width}px Horizontal Overflow (0px Required)`,
        passOverflow,
        `scrollWidth: ${overflowData.scrollW}px, innerWidth: ${overflowData.innerW}px, overflow: ${overflowData.overflow}px${!passOverflow ? `, Culprits: ${JSON.stringify(overflowData.culprits)}` : ''}`
      );

      // Capture full landing page screenshot
      const metrics = await send('Page.getLayoutMetrics');
      const fullH = Math.ceil(metrics.cssContentSize.height);
      console.log(`Layout height for ${vp.width}px: ${fullH}px`);

      const shot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: vp.width,
          height: Math.min(fullH, 12000),
          scale: vp.scale || 0.6,
        },
      });

      const shotFileName = `landing_${vp.width}px.png`;
      const shotPath = path.join(targetDir, shotFileName);
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log(`📸 Saved screenshot: ${shotPath} (${Math.round(fs.statSync(shotPath).size / 1024)} KB)`);

      viewportResults.push({
        viewport: vp.width,
        label: vp.label,
        pageHeight: fullH,
        overflowPx: overflowData.overflow,
        screenshotFile: shotFileName,
        screenshotPath: shotPath,
      });
    }

    // Save comprehensive report
    const fullReport = {
      timestamp: new Date().toISOString(),
      url,
      summary: {
        totalChecks: testResults.length,
        passed: testResults.filter((t) => t.pass).length,
        failed: testResults.filter((t) => !t.pass).length,
      },
      checks: testResults,
      viewports: viewportResults,
    };

    fs.writeFileSync(
      path.join(targetDir, 'qa_landing_verification_report.json'),
      JSON.stringify(fullReport, null, 2)
    );
    console.log(`\nVerification report written to: ${path.join(targetDir, 'qa_landing_verification_report.json')}`);

    ws.close();
  } catch (err) {
    console.error('Execution error during verification:', err);
    process.exitCode = 1;
  } finally {
    if (distServer) distServer.kill();
    chrome.kill('SIGKILL');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
