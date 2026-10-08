/**
 * One-time script: sets crowdbeatsllc@gmail.com as SUPER_ADMIN in Firestore.
 * Run: node scripts/set_admin_user.mjs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account — try common paths
let serviceAccount;
const candidatePaths = [
  resolve(__dirname, '../service-account.json'),
  resolve(__dirname, '../apps/web/service-account.json'),
  resolve(__dirname, '../crowdbeats-01-service-account.json'),
];
for (const p of candidatePaths) {
  try { serviceAccount = JSON.parse(readFileSync(p, 'utf8')); break; } catch {}
}

if (!serviceAccount) {
  // Try GOOGLE_APPLICATION_CREDENTIALS env var
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (envPath) {
    try { serviceAccount = JSON.parse(readFileSync(envPath, 'utf8')); } catch {}
  }
}

if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount), projectId: 'crowdbeats-01' });
  } else {
    // Fall back to ADC (Application Default Credentials)
    initializeApp({ projectId: 'crowdbeats-01' });
  }
}

const db = getFirestore();
const auth = getAuth();

const UID   = 'vK1bvXWjqwR1H78yAfiOsXRRyVn2';
const EMAIL = 'crowdbeatsllc@gmail.com';

async function main() {
  console.log(`Setting SUPER_ADMIN for ${EMAIL} (${UID})...`);

  // 1. Update Firestore user document
  await db.collection('users').doc(UID).set({
    uid:            UID,
    email:          EMAIL,
    displayName:    'Crowdbeats Admin',
    personaType:    'staff',
    platformRole:   'SUPER_ADMIN',
    isAdmin:        true,
    emailVerified:  true,
    consentVersion: '2026-08-25',
    createdAt:      new Date().toISOString(),
    updatedAt:      new Date().toISOString(),
  }, { merge: true });

  console.log('✓ Firestore user document updated');

  // 2. Set Firebase custom claims so server-side middleware can verify
  await auth.setCustomUserClaims(UID, {
    personaType:  'staff',
    platformRole: 'SUPER_ADMIN',
    onboarded:    true,
  });

  console.log('✓ Firebase custom claims set');
  console.log('Done! crowdbeatsllc@gmail.com is now SUPER_ADMIN.');
  console.log('Sign out and back in for claims to take effect.');
}

main().catch((err) => { console.error(err); process.exit(1); });
