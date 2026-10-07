/**
 * Crowdbeats V2 — Invite Venue Staff Cloud Function (Phase 9)
 *
 * Callable function to invite a staff member or manager to a Venue:
 * - Verifies caller has `VENUE_OWNER` or `VENUE_MANAGER` role
 * - Restricts `VENUE_MANAGER` from inviting another manager (owner only)
 * - Generates 7-day expiring invitation doc
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const VENUE_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const inviteVenueStaff = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const { venueId, email, role } = request.data || {};

    if (!venueId || typeof venueId !== 'string') {
      throw new HttpsError('invalid-argument', 'Venue ID is required.');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new HttpsError('invalid-argument', 'A valid email address is required.');
    }
    if (!role || !['VENUE_MANAGER', 'VENUE_STAFF'].includes(role)) {
      throw new HttpsError('invalid-argument', 'Role must be VENUE_MANAGER or VENUE_STAFF.');
    }

    const db = admin.firestore();

    // 1. Check caller permissions
    const callerDoc = await db.collection('venueProfiles').doc(venueId).collection('members').doc(uid).get();
    if (!callerDoc.exists || !callerDoc.data()?.isActive) {
      throw new HttpsError('permission-denied', 'You are not a staff member of this venue.');
    }

    const callerRole = callerDoc.data()?.role;
    if (callerRole === 'VENUE_STAFF') {
      throw new HttpsError('permission-denied', 'Venue Staff cannot invite new team members.');
    }
    if (callerRole === 'VENUE_MANAGER' && role === 'VENUE_MANAGER') {
      throw new HttpsError('permission-denied', 'Only the Venue Owner can invite other Venue Managers.');
    }

    const venueDoc = await db.collection('venueProfiles').doc(venueId).get();
    if (!venueDoc.exists || !venueDoc.data()?.isActive) {
      throw new HttpsError('not-found', 'Venue profile not found.');
    }

    const venueData = venueDoc.data()!;
    const cleanEmail = email.trim().toLowerCase();
    const invitationRef = db.collection('venueProfiles').doc(venueId).collection('invitations').doc();
    const invitationId = invitationRef.id;

    const expiresAt = new Date(Date.now() + VENUE_INVITATION_TTL_MS).toISOString();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const invitationData = {
      invitationId,
      venueId,
      venueName: venueData.name,
      inviteeEmail: cleanEmail,
      role,
      invitedByUid: uid,
      invitedByName: token.name || 'Venue Manager',
      status: 'pending',
      expiresAt,
      createdAt: now,
    };

    const batch = db.batch();
    batch.set(invitationRef, invitationData);
    batch.set(db.collection('invitations').doc(invitationId), {
      ...invitationData,
      type: 'venue',
    });

    await batch.commit();

    return {
      success: true,
      invitationId,
      expiresAt,
      message: `Staff invitation successfully sent to ${cleanEmail}.`,
    };
  }
);
