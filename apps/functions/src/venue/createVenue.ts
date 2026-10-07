/**
 * Crowdbeats V2 — Create Venue Profile Cloud Function (Phase 9)
 *
 * Callable function to initialize a new Venue Profile:
 * - Creates `/venueProfiles/{venueId}`
 * - Sets the caller as primary `VENUE_OWNER` in `/venueProfiles/{venueId}/members/{uid}`
 * - Initializes stages subcollection & audit logs
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createVenue = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const { name, description, address, capacity, photoUrl, coverUrl, geofenceRadiusMeters } = request.data || {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Venue name is required.');
    }
    if (name.length > 100) {
      throw new HttpsError('invalid-argument', 'Venue name must not exceed 100 characters.');
    }

    const db = admin.firestore();
    const venueRef = db.collection('venueProfiles').doc();
    const venueId = venueRef.id;
    const now = admin.firestore.FieldValue.serverTimestamp();

    const memberRef = venueRef.collection('members').doc(uid);
    const auditRef = venueRef.collection('auditLogs').doc();

    const batch = db.batch();

    // 1. Create venue profile document
    batch.set(venueRef, {
      venueId,
      ownerUid: uid,
      name: name.trim(),
      description: description ? String(description).slice(0, 2000) : null,
      address: address || { city: 'San Francisco', country: 'US' },
      capacity: capacity ? Number(capacity) : null,
      photoUrl: photoUrl ? String(photoUrl) : null,
      coverUrl: coverUrl ? String(coverUrl) : null,
      isActive: true,
      bankLinked: false,
      geofenceRadiusMeters: geofenceRadiusMeters ? Number(geofenceRadiusMeters) : 100,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
      v: 1,
    });

    // 2. Add founder as VENUE_OWNER
    batch.set(memberRef, {
      uid,
      venueId,
      role: 'VENUE_OWNER',
      displayName: token.name || 'Venue Owner',
      joinedAt: now,
      invitedByUid: uid,
      isActive: true,
    });

    // 3. Write audit log
    batch.set(auditRef, {
      logId: auditRef.id,
      action: 'VENUE_CREATED',
      performedByUid: uid,
      targetUid: uid,
      details: { name: name.trim() },
      createdAt: now,
    });

    await batch.commit();

    return {
      success: true,
      venueId,
      message: 'Venue profile successfully created.',
    };
  }
);
