const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'apps', 'web');
const DIST_DIR = path.join(WEB_DIR, 'dist');
const NEXT_DIR = path.join(WEB_DIR, '.next');
const PUBLIC_DIR = path.join(WEB_DIR, 'public');
const SERVER_APP_DIR = path.join(NEXT_DIR, 'server', 'app');
const STATIC_DIR = path.join(NEXT_DIR, 'static');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  if (!exists) return;
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('--- Synchronizing build to apps/web/dist ---');

// 1. Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 2. Copy public directory assets
if (fs.existsSync(PUBLIC_DIR)) {
  console.log('Copying apps/web/public -> apps/web/dist');
  copyRecursiveSync(PUBLIC_DIR, DIST_DIR);
}

// 3. Copy .next/static -> dist/_next/static
if (fs.existsSync(STATIC_DIR)) {
  const destStatic = path.join(DIST_DIR, '_next', 'static');
  console.log(`Copying .next/static -> ${destStatic}`);
  copyRecursiveSync(STATIC_DIR, destStatic);
}

// 4. Copy .next/server/app HTML and assets
if (fs.existsSync(SERVER_APP_DIR)) {
  console.log('Copying generated HTML from .next/server/app -> apps/web/dist');
  
  function copyHtmlFiles(dir, relPath = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const srcPath = path.join(dir, item.name);
      const targetRel = path.join(relPath, item.name);
      const destPath = path.join(DIST_DIR, targetRel);

      if (item.isDirectory()) {
        // Skip .segments or internal folders
        if (item.name.endsWith('.segments')) continue;
        copyHtmlFiles(srcPath, targetRel);
      } else if (item.name.endsWith('.html') || item.name.endsWith('.rsc') || item.name.endsWith('.meta')) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyHtmlFiles(SERVER_APP_DIR);
}

// 5. Ensure each top-level route has an index.html in its directory for static hosting fallbacks
const routes = [
  'auth',
  'onboarding',
  'account',
  'creator',
  'fan',
  'sponsor',
  'venue',
  'band',
  'gallery',
  'preview',
  'mobile-preview',
  'support',
  'legal',
  'discover'
];

for (const route of routes) {
  const htmlFile = path.join(DIST_DIR, `${route}.html`);
  const routeDir = path.join(DIST_DIR, route);
  const indexHtml = path.join(routeDir, 'index.html');

  if (fs.existsSync(htmlFile)) {
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.copyFileSync(htmlFile, indexHtml);
    console.log(`Created ${route}/index.html from ${route}.html`);
  }
}

// Handle dashboard routes for creator, sponsor, venue, band
const dashboards = [
  { section: 'creator', page: 'dashboard' },
  { section: 'sponsor', page: 'dashboard' },
  { section: 'venue',   page: 'dashboard' },
  { section: 'band',    page: 'dashboard' },
];

for (const { section, page } of dashboards) {
  const dashHtml = path.join(DIST_DIR, section, `${page}.html`);
  const dashDir  = path.join(DIST_DIR, section, page);
  if (fs.existsSync(dashHtml)) {
    if (!fs.existsSync(dashDir)) {
      fs.mkdirSync(dashDir, { recursive: true });
    }
    fs.copyFileSync(dashHtml, path.join(dashDir, 'index.html'));
    console.log(`Created ${section}/${page}/index.html`);

    // Also guarantee section/index.html exists
    const sectionIndex = path.join(DIST_DIR, section, 'index.html');
    if (!fs.existsSync(sectionIndex)) {
      fs.copyFileSync(dashHtml, sectionIndex);
      console.log(`Fallback created ${section}/index.html from ${page}.html`);
    }
  }
}

// Section subpages (creator, band, venue, sponsor, fan, legal, onboarding, artist, admin)
const sections = ['creator', 'band', 'venue', 'sponsor', 'fan', 'legal', 'onboarding', 'artist', 'admin'];
for (const section of sections) {
  const secDir = path.join(DIST_DIR, section);
  if (fs.existsSync(secDir)) {
    const files = fs.readdirSync(secDir);
    for (const file of files) {
      if (file.endsWith('.html') && file !== 'index.html') {
        const pageName = file.replace('.html', '');
        const subDir = path.join(secDir, pageName);
        if (!fs.existsSync(subDir)) {
          fs.mkdirSync(subDir, { recursive: true });
        }
        fs.copyFileSync(path.join(secDir, file), path.join(subDir, 'index.html'));
      }
    }
    console.log(`Synchronized ${section}/* pages to directory index.html files`);
  }
}

// Ensure admin/dashboard.html exists for the firebase.json rewrite target
// Admin pages are dynamic so we copy from index.html as a SPA shell
const adminDir = path.join(DIST_DIR, 'admin');
const adminDashHtml = path.join(adminDir, 'dashboard.html');
const indexHtml = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(adminDashHtml) && fs.existsSync(indexHtml)) {
  fs.mkdirSync(adminDir, { recursive: true });
  fs.copyFileSync(indexHtml, adminDashHtml);
  console.log('Created admin/dashboard.html from index.html (SPA shell for admin routes)');
}

console.log('--- Sync to apps/web/dist completed successfully ---');
