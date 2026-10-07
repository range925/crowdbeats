/**
 * Crowdbeats V2 — Create Venue Stage Cloud Function (Phase 9)
 *
 * Callable function to configure a physical or virtual stage for a Venue:
 * - Verifies caller has `VENUE_OWNER` or `VENUE_MANAGER` role
 * - Creates `/stages/{stageId}` linked to `venueId`
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createVenueStage = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.auth;
    const { venueId, name, description, capacity } = request.data || {};

    if (!venueId || typeof venueId !== 'string') {
      throw new HttpsError('invalid-argument', 'Venue ID is required.');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Stage name is required.');
    }
    if (name.length > 80) {
      throw new HttpsError('invalid-argument', 'Stage name must not exceed 80 characters.');
    }

    const db = admin.firestore();

    // 1. Verify caller has VENUE_OWNER or VENUE_MANAGER role
    const memberDoc = await db.collection('venueProfiles').doc(venueId).collection('members').doc(uid).get();
    if (!memberDoc.exists || !memberDoc.data()?.isActive) {
      throw new HttpsError('permission-denied', 'You are not a staff member of this venue.');
    }

    const role = memberDoc.data()?.role;
    if (role === 'VENUE_STAFF') {
      throw new HttpsError('permission-denied', 'Only Venue Owners and Managers can configure stages.');
    }

    const stageRef = db.collection('stages').doc();
    const stageId = stageRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    await stageRef.set({
      stageId,
      venueId,
      name: name.trim(),
      description: description ? String(description).slice(0, 1000) : null,
      capacity: capacity ? Number(capacity) : null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      stageId,
      name: name.trim(),
      message: `Stage "${name.trim()}" created successfully.`,
    };
  }
);
