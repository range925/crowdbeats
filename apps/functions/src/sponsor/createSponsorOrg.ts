/**
 * Crowdbeats V2 — Create Sponsor Organization Cloud Function (Phase 9)
 *
 * Callable function to initialize a new Sponsor Organization:
 * - Creates `/sponsorOrgs/{orgId}`
 * - Sets the caller as primary `SPONSOR_ADMIN` in `/sponsorOrgs/{orgId}/members/{uid}`
 * - Initializes escrow tracking balances to 0
 * - Writes audit log entry
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createSponsorOrg = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const { name, description, website, industry, logoUrl } = request.data || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Organization name is required.');
    }
    if (name.length > 100) {
      throw new HttpsError('invalid-argument', 'Organization name must not exceed 100 characters.');
    }

    const db = admin.firestore();
    const orgRef = db.collection('sponsorOrgs').doc();
    const orgId = orgRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const memberRef = orgRef.collection('members').doc(uid);
    const auditRef = orgRef.collection('auditLogs').doc();

    const batch = db.batch();

    // 1. Create sponsor organization document
    batch.set(orgRef, {
      orgId,
      adminUid: uid,
      name: name.trim(),
      description: description ? String(description).slice(0, 2000) : null,
      website: website ? String(website) : null,
      industry: industry ? String(industry) : null,
      logoUrl: logoUrl ? String(logoUrl) : null,
      isVerified: false,
      isActive: true,
      totalEscrowDepositedCents: 0,
      availableEscrowCents: 0,
      totalMatchedCents: 0,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });

    // 2. Add founder as SPONSOR_ADMIN
    batch.set(memberRef, {
      uid,
      orgId,
      role: 'SPONSOR_ADMIN',
      displayName: token.name || 'Sponsor Admin',
      joinedAt: now,
      invitedByUid: uid,
      isActive: true,
    });

    // 3. Write immutable audit log
    batch.set(auditRef, {
      logId: auditRef.id,
      action: 'SPONSOR_ORG_CREATED',
      performedByUid: uid,
      targetUid: uid,
      details: { name: name.trim() },
      createdAt: now,
    });

    await batch.commit();

    return {
      success: true,
      orgId,
      message: 'Sponsor organization successfully created.',
    };
  }
);
