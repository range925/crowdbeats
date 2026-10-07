/**
 * Crowdbeats V2 — End Venue Stage Session Cloud Function (Phase 9)
 *
 * Callable function to end an active stage session:
 * - Verifies caller has membership in venue
 * - Updates `/stageSessions/{sessionId}` with status 'ended' and `endedAt` timestamp
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const endVenueSession = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { sessionId } = request.data || {};

    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'Session ID is required.');
    }

    const db = admin.firestore();
    const sessionRef = db.collection('stageSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }

    const sessionData = sessionDoc.data()!;
    if (sessionData.status !== 'active') {
      throw new HttpsError('failed-precondition', `Session is not active (current status: ${sessionData.status}).`);
    }

    const venueId = sessionData.venueId;

    // Verify caller is a staff member of the venue
    const memberDoc = await db.collection('venueProfiles').doc(venueId).collection('members').doc(uid).get();
    if (!memberDoc.exists || !memberDoc.data()?.isActive) {
      throw new HttpsError('permission-denied', 'You are not authorized to end sessions for this venue.');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    await sessionRef.update({
      status: 'ended',
      endedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      sessionId,
      totalTipsReceivedCents: sessionData.totalTipsReceivedCents || 0,
      tipCount: sessionData.tipCount || 0,
      message: 'Stage session ended successfully.',
    };
  }
);
