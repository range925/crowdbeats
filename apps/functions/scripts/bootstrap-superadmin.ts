/**
 * Crowdbeats V2 — Super Admin Bootstrap CLI Script
 *
 * Usage:
 *   npx ts-node scripts/bootstrap-superadmin.ts <TARGET_UID>
 */

import * as admin from 'firebase-admin';

async function main() {
  const targetUid = process.argv[2];

  if (!targetUid) {
    console.error('Error: Please provide target UID. Example: npx ts-node scripts/bootstrap-superadmin.ts <UID>');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp();
  }

  console.log(`Setting SUPER_ADMIN custom claims for UID: ${targetUid}...`);

  await admin.auth().setCustomUserClaims(targetUid, {
    platformRole: 'SUPER_ADMIN',
    personaType: 'staff',
  });

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('users').doc(targetUid).set(
    {
      platformRole: 'SUPER_ADMIN',
      personaType: 'staff',
      updatedAt: now,
    },
    { merge: true }
  );

  const auditRef = db.collection('auditEvents').doc();
  await auditRef.set({
    eventId: auditRef.id,
    actionType: 'STAFF_ROLE_GRANTED',
    actorUid: 'CLI_BOOTSTRAP_SCRIPT',
    targetEntityType: 'user',
    targetEntityId: targetUid,
    details: {
      role: 'SUPER_ADMIN',
      reason: 'Direct CLI Bootstrap',
    },
    timestamp: now,
  });

  console.log(`Successfully bootstrapped SUPER_ADMIN for ${targetUid}!`);
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
