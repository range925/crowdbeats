/**
 * Crowdbeats V2 — onCreate Auth Trigger (Phase 5)
 *
 * Creates the users/{uid} Firestore record the first time a user registers.
 * This is the server-authoritative source of truth for the user identity anchor.
 *
 * INVARIANTS:
 * - Never trust client-supplied personaType — set to null on creation
 * - Never write balance, payouts, or financial records here
 * - deletedAt and suspendedAt are NEVER set on creation
 * - All timestamps are server-generated (FieldValue.serverTimestamp())
 */

import * as admin from 'firebase-admin';
import { beforeUserCreated } from 'firebase-functions/v2/identity';

const db = () => admin.firestore();

// Use beforeUserCreated which is the Gen2 equivalent of onCreate for user events
// Fallback: use onDocumentCreated trigger pattern or pub/sub if identity API changes
export const onCreateUser = beforeUserCreated({ timeoutSeconds: 7 }, async (event) => {
  const user = event.data;
  if (!user) return;
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db().collection('users').doc(user.uid).set({
    uid:         user.uid,
    email:       user.email ?? null,
    emailVerified: user.emailVerified,
    displayName: user.displayName ?? null,
    photoUrl:    user.photoURL ?? null,
    personaType: null,   // set after onboarding via onCompleteOnboarding
    createdAt:   now,
    updatedAt:   now,
    v:           0,
    // Explicitly NOT setting: suspendedAt, deletedAt, platformRole
  });

  console.log(`[onCreateUser] Created users/${user.uid} record`);
});
