const { spawn } = require('child_process');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const srv = spawn('node', ['scripts/serve_dist.js'], { stdio: 'inherit' });
  await sleep(1500);

  const p = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9282',
    '--user-data-dir=C:\\Users\\Knauf\\AppData\\Local\\Temp\\test_cdp_dist_' + Date.now(),
    '--disable-extensions',
    '--disable-gpu',
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);
  const tabs = await (await fetch('http://127.0.0.1:9282/json/list')).json();
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

  const evalJs = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Eval error');
    }
    return res.result?.value;
  };

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:3005/' });
  await sleep(3500);

  // Lazy load scroll
  await evalJs(`(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 800) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  })()`);
  await sleep(1200);

  // 1. Header
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
  console.log('1. Header:', JSON.stringify(headerInfo, null, 2));

  // Theme click test
  const t1 = await evalJs(`document.documentElement.getAttribute('data-theme') || 'light'`);
  await evalJs(`document.querySelector('header button[aria-label*="mode" i]').click()`);
  await sleep(400);
  const t2 = await evalJs(`document.documentElement.getAttribute('data-theme')`);
  console.log('Theme toggle transition:', t1, '->', t2);

  // 2. Hero
  const heroInfo = await evalJs(`(() => {
    const hero = document.querySelector('#hero');
    if (!hero) return null;
    const h1 = hero.querySelector('h1')?.textContent.trim().replace(/\\s+/g, ' ');
    const sub = hero.querySelector('p')?.textContent.trim();
    const btns = Array.from(hero.querySelectorAll('a, button')).map(b => b.textContent.trim());
    return { h1, sub, btns };
  })()`);
  console.log('2. Hero:', JSON.stringify(heroInfo, null, 2));

  // 3. Discover
  const discoverInfo = await evalJs(`(() => {
    const sec = document.querySelector('#discover');
    if (!sec) return null;
    const mapPanel = sec.querySelector('[class*="mapPanel"]');
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
  console.log('3. Discover:', JSON.stringify(discoverInfo, null, 2));

  // 4. Connection
  const connectionInfo = await evalJs(`(() => {
    const sec = document.querySelector('#connection');
    if (!sec) return null;
    const h2 = sec.querySelector('h2')?.textContent.trim().replace(/\\s+/g, ' ');
    const btns = Array.from(sec.querySelectorAll('a, button')).map(b => ({ text: b.textContent.trim(), href: b.getAttribute('href') }));
    return { h2, btns };
  })()`);
  console.log('4. Connection:', JSON.stringify(connectionInfo, null, 2));

  // 5. Bento
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
  console.log('5. Bento:', JSON.stringify(bentoInfo, null, 2));

  // 6. Carousel
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
  console.log('6. Carousel:', JSON.stringify(carouselInfo, null, 2));

  // 7. Media Rail
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
      cards: cards.slice(0, 3),
    };
  })()`);
  console.log('7. Media Rail:', JSON.stringify(mediaRailInfo, null, 2));

  // 8. Footer
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
  console.log('8. Footer:', JSON.stringify(footerInfo, null, 2));

  ws.close();
  p.kill();
  srv.kill();
}

run().catch(console.error);
