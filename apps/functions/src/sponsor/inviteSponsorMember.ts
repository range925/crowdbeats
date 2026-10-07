/**
 * Crowdbeats V2 — Invite Sponsor Member Cloud Function (Phase 9)
 *
 * Callable function to invite a team member to a Sponsor Organization:
 * - Verifies caller has `SPONSOR_ADMIN` role in the organization
 * - Enforces 50-member cap
 * - Generates a 7-day expiring invitation in `/sponsorOrgs/{orgId}/invitations/{id}` and top-level index
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const SPONSOR_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const inviteSponsorMember = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const { orgId, email, role } = request.data || {};

    if (!orgId || typeof orgId !== 'string') {
      throw new HttpsError('invalid-argument', 'Organization ID is required.');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new HttpsError('invalid-argument', 'A valid email address is required.');
    }
    if (!role || !['SPONSOR_ADMIN', 'SPONSOR_REP'].includes(role)) {
      throw new HttpsError('invalid-argument', 'Role must be SPONSOR_ADMIN or SPONSOR_REP.');
    }

    const db = admin.firestore();

    // 1. Verify caller is an active SPONSOR_ADMIN in this organization
    const callerDoc = await db.collection('sponsorOrgs').doc(orgId).collection('members').doc(uid).get();
    if (!callerDoc.exists || !callerDoc.data()?.isActive || callerDoc.data()?.role !== 'SPONSOR_ADMIN') {
      throw new HttpsError('permission-denied', 'Only active Sponsor Admins can invite team members.');
    }

    // 2. Check organization member count
    const orgDoc = await db.collection('sponsorOrgs').doc(orgId).get();
    if (!orgDoc.exists || !orgDoc.data()?.isActive) {
      throw new HttpsError('not-found', 'Sponsor organization not found or inactive.');
    }

    const orgData = orgDoc.data()!;
    if ((orgData.memberCount || 0) >= 50) {
      throw new HttpsError('resource-exhausted', 'Sponsor organization has reached the maximum of 50 members.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const invitationRef = db.collection('sponsorOrgs').doc(orgId).collection('invitations').doc();
    const invitationId = invitationRef.id;

    const expiresAt = new Date(Date.now() + SPONSOR_INVITATION_TTL_MS).toISOString();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const invitationData = {
      invitationId,
      orgId,
      orgName: orgData.name,
      inviteeEmail: cleanEmail,
      role,
      invitedByUid: uid,
      invitedByName: token.name || 'Sponsor Admin',
      status: 'pending',
      expiresAt,
      createdAt: now,
    };

    const batch = db.batch();
    // Subcollection invitation
    batch.set(invitationRef, invitationData);

    // Global invitation index
    batch.set(db.collection('invitations').doc(invitationId), {
      ...invitationData,
      type: 'sponsor',
    });

    await batch.commit();

    return {
      success: true,
      invitationId,
      expiresAt,
      message: `Invitation successfully sent to ${cleanEmail}. Valid for 7 days.`,
    };
  }
);
