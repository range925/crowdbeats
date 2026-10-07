#!/usr/bin/env node
/**
 * instagram_sync_daemon.mjs
 *
 * Runs every 10 minutes:
 *  1. Fetches latest @crowdbeatsllc posts from the Instagram Graph API
 *  2. Downloads thumbnail images locally
 *  3. Updates public/data/instagram_reposts.json
 *  4. If posts changed ? auto rebuilds + deploys to Firebase crowdbeats-01
 *  5. Auto-refreshes the access token before it expires
 *
 * Usage:  node scripts/instagram_sync_daemon.mjs
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const ROOT          = path.resolve(__dirname, '..');
const ENV_FILE      = path.join(ROOT, 'apps', 'web', '.env.local');
const CACHE_FILE    = path.join(ROOT, 'apps', 'web', 'public', 'data', 'instagram_reposts.json');
const INSTAGRAM_DIR = path.join(ROOT, 'apps', 'web', 'public', 'instagram');

const IG_API_BASE           = 'https://graph.instagram.com/v22.0';
const SYNC_INTERVAL_MINUTES = 10;
const TOKEN_REFRESH_DAYS    = 7;
const FIREBASE_PROJECT      = 'crowdbeats-01';

function loadEnv() {
  const env = { ...process.env };
  if (fs.existsSync(ENV_FILE)) {
    for (const line of fs.readFileSync(ENV_FILE, 'utf-8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

function upsertEnvVar(key, value) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  content = regex.test(content) ? content.replace(regex, `${key}=${value}`) : content + `\n${key}=${value}`;
  fs.writeFileSync(ENV_FILE, content, 'utf-8');
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CrowdBeats-Daemon/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Bad JSON: ${data.slice(0, 100)}`)); }
      });
    }).on('error', reject);
  });
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol.get(url, { headers: { 'User-Agent': 'CrowdBeats-Daemon/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlink(destPath, () => {});
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (e) => { fs.unlink(destPath, () => {}); reject(e); });
  });
}

async function refreshAccessToken(token) {
  return httpsGetJson(`${IG_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
}

async function fetchMedia(token, userId, count = 10) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username';
  const res = await httpsGetJson(
    `${IG_API_BASE}/${userId}/media?fields=${encodeURIComponent(fields)}&limit=${count}&access_token=${encodeURIComponent(token)}`
  );
  if (res.error) throw new Error(res.error.message);
  return res.data || [];
}

async function ensureImageCached(imageUrl, mediaId) {
  if (!imageUrl) return null;
  const filename = `ig_live_${mediaId}.jpg`;
  const destPath = path.join(INSTAGRAM_DIR, filename);
  const webPath  = `/instagram/${filename}`;
  try {
    fs.mkdirSync(INSTAGRAM_DIR, { recursive: true });
    await downloadImage(imageUrl, destPath);
    return webPath;
  } catch (e) {
    console.warn(`[Daemon] Image download failed for ${mediaId}: ${e.message}`);
    return fs.existsSync(destPath) ? webPath : imageUrl;
  }
}

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8')); }
  catch { return { posts: [], account: 'crowdbeatsllc' }; }
}

function saveCache(data) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function buildAndDeploy() {
  console.log('[Daemon] Building production site...');
  try {
    execSync('npm run web:build:prod', { cwd: ROOT, stdio: 'inherit' });
    execSync('node scripts/sync_dist.js', { cwd: ROOT, stdio: 'inherit' });
    console.log('[Daemon] Deploying to Firebase crowdbeats-01...');
    execSync(`npx -y firebase-tools deploy --only hosting --project ${FIREBASE_PROJECT}`, { cwd: ROOT, stdio: 'inherit' });
    console.log('[Daemon] Site is live at https://crowdbeats-01.web.app');
  } catch (e) {
    console.error('[Daemon] Build/Deploy failed:', e.message);
  }
}

function formatTs(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function mediaToPost(media) {
  const isVideo  = media.media_type === 'VIDEO' || media.media_type === 'REELS';
  const rawThumb = isVideo ? (media.thumbnail_url || media.media_url) : media.media_url;
  const imageUrl = await ensureImageCached(rawThumb, media.id);

  // Download the actual MP4 so it plays without expiring CDN URLs
  let localVideoPath = null;
  if (isVideo && media.media_url) {
    const videoFilename = `ig_live_video_${media.id}.mp4`;
    const videoDest     = path.join(INSTAGRAM_DIR, videoFilename);
    try {
      fs.mkdirSync(INSTAGRAM_DIR, { recursive: true });
      await downloadImage(media.media_url, videoDest);
      localVideoPath = `/instagram/${videoFilename}`;
      console.log(`[Daemon] Video cached: ${videoFilename}`);
    } catch (e) {
      console.warn(`[Daemon] Video download failed for ${media.id}: ${e.message}`);
      localVideoPath = null;
    }
  }

  return {
    id:              `cb_ig_live_${media.id}`,
    originalCreator: `@${media.username || 'crowdbeatsllc'}`,
    creatorName:     'Crowdbeats',
    creatorAvatar:   '/instagram/crowdbeats_avatar.png',
    postUrl:         media.permalink,
    imageUrl:        imageUrl || '',
    videoUrl:        localVideoPath,
    caption:         (media.caption || '').slice(0, 300),
    type:            isVideo ? 'reel' : (media.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image'),
    timestamp:       formatTs(media.timestamp),
    location:        'crowdbeats.ai',
    repostTag:       '@crowdbeatsllc',
    repostCount:     0,
    isDirectPost:    true,
    rawMediaType:    media.media_type,
    rawTimestamp:    media.timestamp,
    igMediaId:       media.id,
  };
}

async function syncTick() {
  const now = Date.now();
  console.log(`\n[Daemon] Sync tick at ${new Date(now).toLocaleTimeString()}`);

  const env       = loadEnv();
  const token     = env.INSTAGRAM_ACCESS_TOKEN;
  const userId    = env.INSTAGRAM_USER_ID;
  const expiresAt = Number(env.INSTAGRAM_TOKEN_EXPIRES_AT || '0');

  if (!token || !userId) {
    console.warn('[Daemon] Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID in .env.local');
    return;
  }

  // Token refresh
  let activeToken = token;
  if (expiresAt > 0) {
    const daysLeft = (expiresAt - Math.floor(now / 1000)) / 86400;
    if (daysLeft <= 0) { console.error('[Daemon] Token EXPIRED. Generate a new one at the Meta Developer portal.'); return; }
    if (daysLeft < TOKEN_REFRESH_DAYS) {
      console.log(`[Daemon] Token expires in ${daysLeft.toFixed(1)} days — refreshing...`);
      try {
        const r = await refreshAccessToken(token);
        if (r.access_token) {
          activeToken = r.access_token;
          const newExpiry = Math.floor(now / 1000) + (r.expires_in || 5183944);
          upsertEnvVar('INSTAGRAM_ACCESS_TOKEN', activeToken);
          upsertEnvVar('INSTAGRAM_TOKEN_EXPIRES_AT', String(newExpiry));
          console.log(`[Daemon] Token refreshed until ${new Date(newExpiry * 1000).toLocaleDateString()}`);
        }
      } catch (e) { console.error('[Daemon] Token refresh failed:', e.message); }
    }
  }

  // Fetch
  let mediaItems;
  try {
    mediaItems = await fetchMedia(activeToken, userId, 10);
    console.log(`[Daemon] Fetched ${mediaItems.length} posts from Instagram API`);
  } catch (e) {
    console.error('[Daemon] Media fetch failed:', e.message);
    return;
  }

  if (!mediaItems.length) { console.log('[Daemon] No posts returned.'); return; }

  // Check if changed
  const existing = loadCache();
  const oldIds = (existing.posts || []).map(p => p.igMediaId || p.id).join(',');
  const newIds = mediaItems.map(m => m.id).join(',');

  if (oldIds === newIds) {
    console.log('[Daemon] No new posts — skipping rebuild.');
    return;
  }

  console.log(`[Daemon] Posts changed! Rebuilding site...`);

  // Download images + map posts
  const posts = [];
  for (const m of mediaItems) {
    try { posts.push(await mediaToPost(m)); }
    catch (e) { console.warn(`[Daemon] Failed to process ${m.id}:`, e.message); }
  }

  // Save JSON
  const intervalMs = SYNC_INTERVAL_MINUTES * 60 * 1000;
  saveCache({
    account: 'crowdbeatsllc', userId,
    instagramProfileUrl: 'https://www.instagram.com/crowdbeatsllc/',
    syncSource: 'instagram_graph_api_daemon',
    syncStatus: 'healthy',
    lastCheckedAt: now, lastCheckedIso: new Date(now).toISOString(),
    nextCheckAt: now + intervalMs, nextCheckIso: new Date(now + intervalMs).toISOString(),
    repostCheckIntervalMinutes: SYNC_INTERVAL_MINUTES,
    totalPosts: posts.length, posts,
  });
  console.log(`[Daemon] JSON updated with ${posts.length} posts.`);

  // Rebuild + deploy
  buildAndDeploy();
}

console.log('CrowdBeats Instagram Sync Daemon');
console.log(`  Account : @crowdbeatsllc`);
console.log(`  Every   : ${SYNC_INTERVAL_MINUTES} minutes`);
console.log(`  Deploy  : Firebase ${FIREBASE_PROJECT} (auto on new posts)`);
console.log('='.repeat(50));

syncTick().catch(e => console.error('[Daemon] Tick error:', e.message));
setInterval(
  () => syncTick().catch(e => console.error('[Daemon] Tick error:', e.message)),
  SYNC_INTERVAL_MINUTES * 60 * 1000
);
process.on('SIGINT',  () => { console.log('\n[Daemon] Stopped.'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n[Daemon] Stopped.'); process.exit(0); });
