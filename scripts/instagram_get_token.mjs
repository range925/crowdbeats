#!/usr/bin/env node
/**
 * instagram_get_token.mjs
 *
 * One-click Instagram OAuth token generator for @crowdbeatsllc.
 * Run once to get a long-lived access token (valid 60 days, auto-refreshes with use).
 *
 * Usage:
 *   node scripts/instagram_get_token.mjs
 *
 * Prerequisites:
 *   1. Create a Meta App at developers.facebook.com
 *   2. Add "Instagram API with Instagram Login" product
 *   3. Add to apps/web/.env.local:
 *        INSTAGRAM_APP_ID=your_meta_app_id
 *        INSTAGRAM_APP_SECRET=your_meta_app_secret
 *   4. In your Meta App dashboard → Instagram → API setup with Instagram Login
 *      Add this OAuth Redirect URI: http://localhost:3456/callback
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const ENV_FILE  = path.join(ROOT, 'apps', 'web', '.env.local');

const REDIRECT_PORT = 3456;
const REDIRECT_URI  = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPE         = 'instagram_business_basic,instagram_business_manage_messages';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadEnvFile() {
  const env = { ...process.env };
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

function upsertEnvVar(key, value) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    // Add under Instagram section if it exists, otherwise append
    if (content.includes('# Instagram')) {
      content = content.replace(
        /^(# Instagram.*)$/m,
        `$1\n${key}=${value}`
      );
    } else {
      content += `\n# Instagram Graph API\n${key}=${value}\n`;
    }
  }
  fs.writeFileSync(ENV_FILE, content, 'utf-8');
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CrowdBeats/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try { resolve(JSON.parse(data)); } catch { reject(new Error(`Bad JSON: ${data}`)); }
        }
      });
    }).on('error', reject);
  });
}

function httpsPost(urlStr, body) {
  return new Promise((resolve, reject) => {
    const url     = new URL(urlStr);
    const bodyStr = new URLSearchParams(body).toString();
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(bodyStr),
        'User-Agent':     'CrowdBeats/1.0',
      },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try { resolve(JSON.parse(data)); } catch { reject(new Error(`Bad JSON: ${data}`)); }
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' });
    else if (process.platform === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' });
    else execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
  } catch {
    console.log(`\n  Open this URL in your browser:\n  ${url}\n`);
  }
}

function fmtExpiry(seconds) {
  const days = Math.floor(seconds / 86400);
  const date = new Date(Date.now() + seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${days} days (until ${date})`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎵 CrowdBeats Instagram Token Generator');
  console.log('━'.repeat(50));

  const env        = loadEnvFile();
  const APP_ID     = env.INSTAGRAM_APP_ID;
  const APP_SECRET = env.INSTAGRAM_APP_SECRET;

  if (!APP_ID || APP_ID.includes('your_') || APP_ID.includes('placeholder')) {
    console.error('\n❌  INSTAGRAM_APP_ID not configured.\n');
    console.error('Steps to set it up:');
    console.error('  1. Go to https://developers.facebook.com → My Apps → Create App');
    console.error('  2. Choose "Business" type → name it "CrowdBeats Sync"');
    console.error('  3. Add product: Instagram → "Instagram API with Instagram Login"');
    console.error('  4. Go to App settings → Copy your App ID and App Secret');
    console.error(`  5. Add to ${ENV_FILE}:`);
    console.error('       INSTAGRAM_APP_ID=YOUR_APP_ID');
    console.error('       INSTAGRAM_APP_SECRET=YOUR_APP_SECRET');
    console.error('\n  Also add this Redirect URI in Meta App → Instagram → API Setup:');
    console.error(`       ${REDIRECT_URI}\n`);
    process.exit(1);
  }

  if (!APP_SECRET || APP_SECRET.includes('your_') || APP_SECRET.includes('placeholder')) {
    console.error('\n❌  INSTAGRAM_APP_SECRET not configured in .env.local\n');
    process.exit(1);
  }

  // Build authorization URL
  const authUrl =
    `https://api.instagram.com/oauth/authorize` +
    `?client_id=${APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&response_type=code`;

  console.log('\n📋 Redirect URI (must be added in Meta App dashboard):');
  console.log(`   ${REDIRECT_URI}`);

  // Wait for auth code via local HTTP server
  let resolveCode;
  const codePromise = new Promise(res => { resolveCode = res; });

  const server = http.createServer((req, res) => {
    const u     = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
    const code  = u.searchParams.get('code');
    const error = u.searchParams.get('error_reason') || u.searchParams.get('error');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

    if (error) {
      res.end(`<html><body style="font:18px sans-serif;padding:40px;text-align:center">
        <h2>❌ Authorization denied</h2><p>Reason: ${error}</p>
        <p>You can close this tab.</p></body></html>`);
      resolveCode(null);
      return;
    }

    if (code) {
      res.end(`<html><body style="font:18px sans-serif;padding:40px;text-align:center;color:#16a34a">
        <h2>✅ Authorized! Return to your terminal.</h2>
        <p>You can close this tab.</p></body></html>`);
      resolveCode(code);
    }
  });

  await new Promise(res => server.listen(REDIRECT_PORT, res));
  console.log(`\n🌐 Opening Instagram login in your browser...`);
  console.log(`   (Waiting for callback on port ${REDIRECT_PORT})\n`);
  openBrowser(authUrl);

  const code = await codePromise;
  server.close();

  if (!code) {
    console.error('\n❌  Authorization was denied. Re-run and try again.\n');
    process.exit(1);
  }

  console.log('✅  Got authorization code.\n');

  // ── Exchange auth code → short-lived user token ───────────────────────────
  console.log('🔄  Exchanging code for short-lived token...');
  let shortToken, igUserId;
  try {
    const r = await httpsPost('https://api.instagram.com/oauth/access_token', {
      client_id:     APP_ID,
      client_secret: APP_SECRET,
      grant_type:    'authorization_code',
      redirect_uri:  REDIRECT_URI,
      code,
    });
    shortToken = r.access_token;
    igUserId   = String(r.user_id);
    console.log(`   Instagram User ID: ${igUserId}`);
  } catch (e) {
    console.error('\n❌  Token exchange failed:', e.message);
    console.error('   Make sure your App Secret is correct and the Redirect URI matches exactly.\n');
    process.exit(1);
  }

  // ── Exchange short → long-lived token (60 days) ───────────────────────────
  console.log('🔄  Exchanging for long-lived token (60 days)...');
  let longToken, expiresIn;
  try {
    const r = await httpsGet(
      `https://graph.instagram.com/access_token` +
      `?grant_type=ig_exchange_token` +
      `&client_secret=${encodeURIComponent(APP_SECRET)}` +
      `&access_token=${encodeURIComponent(shortToken)}`
    );
    longToken  = r.access_token;
    expiresIn  = r.expires_in || 5183944; // default ~60 days
    console.log(`   Valid for: ${fmtExpiry(expiresIn)}`);
  } catch (e) {
    console.error('\n❌  Long-lived token exchange failed:', e.message);
    process.exit(1);
  }

  // ── Verify token by fetching profile ─────────────────────────────────────
  console.log('🔍  Verifying token with Instagram profile fetch...');
  let username = 'crowdbeatsllc';
  try {
    const profile = await httpsGet(
      `https://graph.instagram.com/v22.0/me` +
      `?fields=id,username,name,followers_count,media_count` +
      `&access_token=${encodeURIComponent(longToken)}`
    );
    username = profile.username || username;
    console.log(`\n   ✅  Token verified!`);
    console.log(`       Username:  @${profile.username}`);
    console.log(`       Name:      ${profile.name || '—'}`);
    console.log(`       Followers: ${(profile.followers_count || 0).toLocaleString()}`);
    console.log(`       Posts:     ${profile.media_count || 0}`);
  } catch (e) {
    console.warn(`\n   ⚠️   Profile fetch failed (${e.message})`);
    console.warn('       Token saved anyway — you can verify it manually.\n');
  }

  // ── Persist to .env.local ─────────────────────────────────────────────────
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  upsertEnvVar('INSTAGRAM_APP_ID',           APP_ID);
  upsertEnvVar('INSTAGRAM_APP_SECRET',       APP_SECRET);
  upsertEnvVar('INSTAGRAM_ACCESS_TOKEN',     longToken);
  upsertEnvVar('INSTAGRAM_USER_ID',          igUserId);
  upsertEnvVar('INSTAGRAM_USERNAME',         username);
  upsertEnvVar('INSTAGRAM_TOKEN_EXPIRES_AT', String(expiresAt));

  console.log(`\n💾  Credentials saved to ${ENV_FILE}`);
  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│  Saved environment variables                 │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│  INSTAGRAM_APP_ID           = ${APP_ID.padEnd(14)} │`);
  console.log(`│  INSTAGRAM_USER_ID          = ${igUserId.padEnd(14)} │`);
  console.log(`│  INSTAGRAM_USERNAME         = @${username.padEnd(13)} │`);
  console.log(`│  INSTAGRAM_ACCESS_TOKEN     = ${longToken.slice(0,6)}...${longToken.slice(-4).padEnd(5)} │`);
  console.log(`│  Token valid for            = ${fmtExpiry(expiresIn).padEnd(14)} │`);
  console.log('└──────────────────────────────────────────────┘');

  console.log('\n🎉  All done! Next steps:');
  console.log('   1. Restart dev server:  npm run dev --workspace=apps/web');
  console.log('   2. Test sync endpoint:  curl "http://localhost:3000/api/instagram/sync?force=true"');
  console.log('   3. The sync fetches your 10 most recent Instagram posts every 10 min.');
  console.log('   4. Token auto-refreshes with use. Re-run this script if it ever expires.\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
