/**
 * Crowdbeats V2 — Start Venue Stage Session Cloud Function (Phase 9)
 *
 * Callable function to launch a live stage session:
 * - Verifies caller has membership in venue
 * - Enforces invariant: Only ONE active session per stage at a time
 * - Creates `/stageSessions/{sessionId}` with status 'active' and server timestamp
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const startVenueSession = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { venueId, stageId, performerId, performerType, performerName } = request.data || {};

    if (!venueId || typeof venueId !== 'string') {
      throw new HttpsError('invalid-argument', 'Venue ID is required.');
    }
    if (!stageId || typeof stageId !== 'string') {
      throw new HttpsError('invalid-argument', 'Stage ID is required.');
    }
    if (!performerId || typeof performerId !== 'string') {
      throw new HttpsError('invalid-argument', 'Performer ID is required.');
    }
    if (!['artist', 'band'].includes(performerType)) {
      throw new HttpsError('invalid-argument', 'Performer type must be "artist" or "band".');
    }

    const db = admin.firestore();

    // 1. Verify caller has membership in venue
    const memberDoc = await db.collection('venueProfiles').doc(venueId).collection('members').doc(uid).get();
    if (!memberDoc.exists || !memberDoc.data()?.isActive) {
      throw new HttpsError('permission-denied', 'You are not an authorized staff member of this venue.');
    }

    // 2. Check if stage exists and belongs to this venue
    const stageDoc = await db.collection('stages').doc(stageId).get();
    if (!stageDoc.exists || stageDoc.data()?.venueId !== venueId || !stageDoc.data()?.isActive) {
      throw new HttpsError('not-found', 'Stage not found or does not belong to this venue.');
    }

    // 3. Enforce 1-active-session invariant per stage
    const activeSessionsQuery = await db
      .collection('stageSessions')
      .where('stageId', '==', stageId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!activeSessionsQuery.empty) {
      throw new HttpsError('already-exists', 'There is already an active session running on this stage.');
    }

    const sessionRef = db.collection('stageSessions').doc();
    const sessionId = sessionRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const qrPrefix = `cb_sess_${sessionId.slice(0, 8)}`;

    await sessionRef.set({
      sessionId,
      stageId,
      venueId,
      performerId,
      performerType,
      performerName: performerName ? String(performerName) : 'Live Performer',
      status: 'active',
      startedAt: now,
      qrPrefix,
      totalTipsReceivedCents: 0,
      tipCount: 0,
      createdByUid: uid,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      sessionId,
      stageId,
      performerName: performerName || 'Live Performer',
      qrPrefix,
      message: 'Stage session is now live!',
    };
  }
);
