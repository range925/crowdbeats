/**
 * Crowdbeats V2 — Instagram Reposts 10-Minute Daemon Service
 * 
 * Runs continuously in the background, updating Instagram reposts
 * from https://www.instagram.com/crowdbeatsllc/reposts/ every 10 minutes.
 */

import { syncInstagramReposts } from './sync_instagram_reposts.mjs';

const TEN_MINUTES_MS = 10 * 60 * 1000;

console.log('---------------------------------------------------------');
console.log(' Starting Crowdbeats Instagram 10-Minute Sync Daemon');
console.log(` Interval: Every 10 minutes (${TEN_MINUTES_MS / 1000}s)`);
console.log(` Target: https://www.instagram.com/crowdbeatsllc/reposts/`);
console.log('---------------------------------------------------------');

// Run initial sync
syncInstagramReposts(true)
  .then(() => {
    console.log('[Daemon] Initial sync completed successfully.');
  })
  .catch((err) => {
    console.error('[Daemon] Error during initial sync:', err);
  });

// Recurring 10-minute interval
setInterval(() => {
  console.log(`\n[Daemon] 10-minute timer fired at ${new Date().toISOString()}`);
  syncInstagramReposts(true).catch((err) => {
    console.error('[Daemon] Error during recurring sync:', err);
  });
}, TEN_MINUTES_MS);
