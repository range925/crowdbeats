/**
 * Crowdbeats V2 — Check-In & Stationary Live Session Callables (Phase 6)
 *
 * Implements:
 * 1. startCheckIn
 * 2. submitCheckInSample
 * 3. startStationaryLiveSession
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import {
  encodeGeohash,
} from '../lib/geohash.js';
import type {
  StartCheckInRequest,
  StartCheckInResponse,
  SubmitCheckInSampleRequest,
  SubmitCheckInSampleResponse,
  StartStationaryLiveSessionRequest,
  StartStationaryLiveSessionResponse,
  CheckInAttempt,
  PrivateLocationSession,
} from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import { verifyAppCheck, hashAppCheckContext } from '../lib/appCheck.js';
import { recordCostGuardMetric } from '../lib/costGuard.js';
import {
  getFirestoreDb,
  haversineMeters,
  validatePerformerAuthorization,
  writeLocationAuditEvent,
} from './sessionHelpers.js';

const CHECKIN_ATTEMPT_TTL_MS = 5 * 60_000; // 5 minutes to submit verification sample
const DEFAULT_VENUE_RADIUS_M = 200;
const MAX_SAMPLE_AGE_MS = 30_000; // 30 seconds freshness
const MAX_CHECKIN_ACCURACY_M = 50; // max 50m accuracy for check-in
const MAX_SESSION_DURATION_HOURS = 12;

interface VenueDocData {
  venueId?: string;
  name?: string;
  location?: admin.firestore.GeoPoint | { latitude: number; longitude: number };
  lat?: number;
  lng?: number;
  geofenceRadiusMeters?: number;
  isActive?: boolean;
}

async function getVenueData(
  db: admin.firestore.Firestore,
  venueId: string,
): Promise<{ name: string; lat: number; lng: number; allowedRadiusMeters: number }> {
  let snap = await db.collection('venues').doc(venueId).get();
  if (!snap.exists) {
    snap = await db.collection('venueProfiles').doc(venueId).get();
  }
  if (!snap.exists) {
    throw new HttpsError('not-found', `Venue ${venueId} not found.`);
  }
  const vd = snap.data() as VenueDocData;
  if (vd.isActive === false) {
    throw new HttpsError('failed-precondition', 'Venue is inactive.');
  }

  let lat: number | undefined;
  let lng: number | undefined;

  if (vd.location) {
    lat = vd.location.latitude;
    lng = vd.location.longitude;
  } else if (typeof vd.lat === 'number' && typeof vd.lng === 'number') {
    lat = vd.lat;
    lng = vd.lng;
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new HttpsError('failed-precondition', 'Venue has no location coordinates configured.');
  }

  const name = vd.name || 'Venue';
  const allowedRadiusMeters = vd.geofenceRadiusMeters && vd.geofenceRadiusMeters > 0
    ? vd.geofenceRadiusMeters
    : DEFAULT_VENUE_RADIUS_M;

  return { name, lat, lng, allowedRadiusMeters };
}

/**
 * 1. startCheckIn
 * Initiates an untrusted check-in proposal for an artist or band at a selected venue.
 */
export const startCheckIn = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<StartCheckInResponse> => {
    const correlationId = `cin_start_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as StartCheckInRequest;

    verifyAppCheck(request, 'startCheckIn');
    await enforceRateLimit({ identifier: uid, action: 'check_in_start' });
    const appHash = hashAppCheckContext(request);
    await enforceRateLimit({ identifier: appHash, action: 'check_in_start' });

    if (!data.profileId || !data.role || !data.selectedVenueId) {
      throw new HttpsError('invalid-argument', 'profileId, role, and selectedVenueId are required.');
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string' || data.idempotencyKey.length < 8) {
      throw new HttpsError('invalid-argument', 'idempotencyKey must be a non-empty string (min 8 chars).');
    }

    const db = getFirestoreDb();

    // 1. Authorize performer
    await validatePerformerAuthorization(db, uid, data.profileId, data.role);

    // 2. Lookup venue
    const venue = await getVenueData(db, data.selectedVenueId);

    // 3. Idempotency check
    const idemKey = `startCheckIn:${uid}:${data.profileId}:${data.idempotencyKey}`;
    const idemRef = db.collection('idempotencyKeys').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists && idemSnap.data()?.['status'] === 'succeeded') {
      const cached = idemSnap.data()?.['responseSnapshot'] as StartCheckInResponse;
      return cached;
    }

    // 4. Create checkInAttempt
    const checkInAttemptId = uuidv4();
    const nowMs = Date.now();
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + CHECKIN_ATTEMPT_TTL_MS).toISOString();

    const attemptDoc: CheckInAttempt & { callerUid: string; allowedRadiusMeters: number } = {
      checkInAttemptId,
      performerId: data.profileId,
      callerUid: uid,
      role: data.role,
      selectedVenueId: data.selectedVenueId,
      status: 'acquiring',
      idempotencyKey: data.idempotencyKey,
      allowedRadiusMeters: venue.allowedRadiusMeters,
      createdAt,
      expiresAt,
    };

    const batch = db.batch();
    batch.set(db.collection('checkInAttempts').doc(checkInAttemptId), attemptDoc);
    batch.set(idemRef, {
      key: idemKey,
      uid,
      operation: 'startCheckIn',
      status: 'succeeded',
      responseSnapshot: {
        checkInAttemptId,
        venueId: data.selectedVenueId,
        venueName: venue.name,
        allowedRadiusMeters: venue.allowedRadiusMeters,
        expiresAt,
      },
      createdAt,
      expiresAt,
    });

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: data.profileId,
      action: 'checkin_attempt_created',
      outcome: 'success',
      coarseGeohash5: encodeGeohash(venue.lat, venue.lng, 5),
      idempotencyKey: data.idempotencyKey,
      correlationId,
      platform: 'server',
    });

    logger.info('[startCheckIn] Check-in attempt created', {
      correlationId,
      checkInAttemptId,
      profileId: data.profileId,
      venueId: data.selectedVenueId,
    });

    return {
      checkInAttemptId,
      venueId: data.selectedVenueId,
      venueName: venue.name,
      allowedRadiusMeters: venue.allowedRadiusMeters,
      expiresAt,
    };
  },
);

/**
 * 2. submitCheckInSample
 * Evaluates the client's location sample against canonical venue coordinates and freshness/accuracy policy.
 */
export const submitCheckInSample = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<SubmitCheckInSampleResponse> => {
    const correlationId = `cin_sample_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as SubmitCheckInSampleRequest;

    verifyAppCheck(request, 'submitCheckInSample');
    if (data.checkInAttemptId) {
      await enforceRateLimit({ identifier: data.checkInAttemptId, action: 'check_in_sample' });
    }

    if (!data.checkInAttemptId || !data.sample) {
      throw new HttpsError('invalid-argument', 'checkInAttemptId and sample are required.');
    }
    const sample = data.sample;
    if (
      typeof sample.lat !== 'number' ||
      typeof sample.lng !== 'number' ||
      typeof sample.accuracyMeters !== 'number' ||
      !sample.timestamp
    ) {
      throw new HttpsError('invalid-argument', 'Sample must include lat, lng, accuracyMeters, and timestamp.');
    }

    const db = getFirestoreDb();
    const attemptRef = db.collection('checkInAttempts').doc(data.checkInAttemptId);
    const attemptSnap = await attemptRef.get();

    if (!attemptSnap.exists) {
      throw new HttpsError('not-found', 'Check-in attempt not found.');
    }
    const attempt = attemptSnap.data() as CheckInAttempt & {
      callerUid?: string;
      allowedRadiusMeters?: number;
    };

    if (attempt.callerUid && attempt.callerUid !== uid && attempt.performerId !== uid) {
      throw new HttpsError('permission-denied', 'You do not own this check-in attempt.');
    }

    if (attempt.status !== 'acquiring') {
      if (attempt.status === 'verified') {
        const venue = await getVenueData(db, attempt.selectedVenueId);
        return {
          checkInAttemptId: data.checkInAttemptId,
          verified: true,
          venueName: venue.name,
          verifiedAt: attempt.verifiedAt || new Date().toISOString(),
        };
      }
      throw new HttpsError('failed-precondition', `Check-in attempt is already ${attempt.status}.`);
    }

    const now = Date.now();
    if (new Date(attempt.expiresAt).getTime() < now) {
      await attemptRef.update({ status: 'expired' });
      throw new HttpsError('failed-precondition', 'Check-in attempt has expired.');
    }

    const platform = data.attestationContext?.platform || 'server';

    // A. Reject Mock GPS
    if (sample.isMock === true) {
      await attemptRef.update({
        status: 'rejected',
        rejectionReason: 'mock_gps_rejected',
      });
      await writeLocationAuditEvent({
        performerId: attempt.performerId,
        action: 'mock_gps_rejected',
        outcome: 'rejected',
        rejectionReason: 'Mock GPS detected',
        correlationId,
        platform,
      });
      throw new HttpsError('failed-precondition', 'Mock GPS coordinates are rejected.');
    }

    // B. Check Sample Freshness (<30s)
    const sampleTime = new Date(sample.timestamp).getTime();
    if (isNaN(sampleTime) || Math.abs(now - sampleTime) > MAX_SAMPLE_AGE_MS) {
      await writeLocationAuditEvent({
        performerId: attempt.performerId,
        action: 'checkin_sample_rejected',
        outcome: 'rejected',
        rejectionReason: 'Sample timestamp is stale (>30s)',
        correlationId,
        platform,
      });
      throw new HttpsError('failed-precondition', 'Sample timestamp is stale (> 30 seconds old).');
    }

    // C. Check Accuracy Threshold
    if (sample.accuracyMeters > MAX_CHECKIN_ACCURACY_M) {
      await writeLocationAuditEvent({
        performerId: attempt.performerId,
        action: 'checkin_sample_rejected',
        outcome: 'rejected',
        rejectionReason: `Accuracy ${Math.round(sample.accuracyMeters)}m exceeds limit (${MAX_CHECKIN_ACCURACY_M}m)`,
        correlationId,
        platform,
      });
      throw new HttpsError(
        'failed-precondition',
        `GPS accuracy (${Math.round(sample.accuracyMeters)}m) exceeds maximum allowable threshold (${MAX_CHECKIN_ACCURACY_M}m).`,
      );
    }

    // D. Proximity Calculation against Canonical Venue
    const venue = await getVenueData(db, attempt.selectedVenueId);
    const distanceMeters = haversineMeters(sample.lat, sample.lng, venue.lat, venue.lng);
    const allowedRadius = attempt.allowedRadiusMeters || venue.allowedRadiusMeters || DEFAULT_VENUE_RADIUS_M;

    if (distanceMeters > allowedRadius) {
      await attemptRef.update({
        status: 'rejected',
        rejectionReason: `too_far (${Math.round(distanceMeters)}m > ${allowedRadius}m)`,
      });
      await writeLocationAuditEvent({
        performerId: attempt.performerId,
        action: 'proximity_check_failed',
        outcome: 'rejected',
        rejectionReason: `Distance ${Math.round(distanceMeters)}m exceeds allowed radius ${allowedRadius}m`,
        coarseGeohash5: encodeGeohash(venue.lat, venue.lng, 5),
        correlationId,
        platform,
      });
      await recordCostGuardMetric({
        metric: 'check_in_rejected',
        entityId: attempt.performerId,
        details: { distanceMeters },
      });
      throw new HttpsError(
        'failed-precondition',
        `Location is outside venue radius (${Math.round(distanceMeters)}m > ${allowedRadius}m).`,
      );
    }

    // Verification Success!
    const verifiedAt = new Date().toISOString();
    await attemptRef.update({
      status: 'verified',
      verifiedAt,
      verifiedSample: {
        lat: sample.lat,
        lng: sample.lng,
        accuracyMeters: sample.accuracyMeters,
        timestamp: sample.timestamp,
      },
    });

    await writeLocationAuditEvent({
      performerId: attempt.performerId,
      action: 'checkin_sample_verified',
      outcome: 'success',
      coarseGeohash5: encodeGeohash(venue.lat, venue.lng, 5),
      correlationId,
      platform,
    });
    await recordCostGuardMetric({
      metric: 'check_in_accepted',
      entityId: attempt.performerId,
      details: { distanceMeters },
    });

    logger.info('[submitCheckInSample] Sample verified successfully', {
      correlationId,
      checkInAttemptId: data.checkInAttemptId,
      distanceMeters,
    });

    return {
      checkInAttemptId: data.checkInAttemptId,
      verified: true,
      venueName: venue.name,
      verifiedAt,
    };
  },
);

/**
 * 3. startStationaryLiveSession
 * Consumes a verified check-in attempt to instantiate an active stationary live session.
 * Employs canonical venue coordinates for public discovery — NEVER raw GPS.
 */
export const startStationaryLiveSession = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<StartStationaryLiveSessionResponse> => {
    const correlationId = `sess_stat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as StartStationaryLiveSessionRequest;

    verifyAppCheck(request, 'startStationaryLiveSession');
    await enforceRateLimit({ identifier: uid, action: 'live_stationary_start' });

    if (!data.verifiedAttemptId) {
      throw new HttpsError('invalid-argument', 'verifiedAttemptId is required.');
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string' || data.idempotencyKey.length < 8) {
      throw new HttpsError('invalid-argument', 'idempotencyKey must be a non-empty string (min 8 chars).');
    }

    const db = getFirestoreDb();

    // Idempotency check
    const idemKey = `startStationaryLiveSession:${uid}:${data.idempotencyKey}`;
    const idemRef = db.collection('idempotencyKeys').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists && idemSnap.data()?.['status'] === 'succeeded') {
      return idemSnap.data()?.['responseSnapshot'] as StartStationaryLiveSessionResponse;
    }

    // Fetch and validate check-in attempt
    const attemptRef = db.collection('checkInAttempts').doc(data.verifiedAttemptId);
    const attemptSnap = await attemptRef.get();
    if (!attemptSnap.exists) {
      throw new HttpsError('not-found', 'Check-in attempt not found.');
    }
    const attempt = attemptSnap.data() as CheckInAttempt & {
      callerUid?: string;
      verifiedSample?: { lat: number; lng: number; accuracyMeters: number };
    };

    if (attempt.callerUid && attempt.callerUid !== uid && attempt.performerId !== uid) {
      throw new HttpsError('permission-denied', 'You do not own this check-in attempt.');
    }
    if (attempt.status !== 'verified') {
      throw new HttpsError('failed-precondition', `Check-in attempt is ${attempt.status}, not verified.`);
    }

    // Re-verify authorization
    const { performerName } = await validatePerformerAuthorization(
      db,
      uid,
      attempt.performerId,
      attempt.role,
    );

    // Guard: max 1 active session per performer
    const activeExisting = await db
      .collection('sessions')
      .where('performerId', '==', attempt.performerId)
      .where('status', '==', 'live')
      .limit(1)
      .get();
    if (!activeExisting.empty) {
      throw new HttpsError(
        'already-exists',
        `Performer already has an active live session (${activeExisting.docs[0].id}). End it first.`,
      );
    }

    // Fetch canonical venue
    const venue = await getVenueData(db, attempt.selectedVenueId);

    // Compute duration
    const requestedMinutes = data.requestedDurationMinutes && data.requestedDurationMinutes > 0
      ? Math.min(data.requestedDurationMinutes, MAX_SESSION_DURATION_HOURS * 60)
      : 120; // 2 hours default
    const durationMs = requestedMinutes * 60_000;
    const nowMs = Date.now();
    const endsAt = new Date(nowMs + durationMs).toISOString();

    const sessionId = uuidv4();
    const publicLat = venue.lat;
    const publicLng = venue.lng;
    const geohash5 = encodeGeohash(publicLat, publicLng, 5);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    // 1. Mark attempt consumed
    batch.update(attemptRef, {
      status: 'consumed',
      sessionId,
      consumedAt: new Date().toISOString(),
    });

    // 2. Public presence doc (NO RAW GPS!)
    const sessionDoc: Record<string, unknown> = {
      sessionId,
      performerId: attempt.performerId,
      performerName,
      performerType: attempt.role,
      status: 'live',
      locationType: 'venue',
      lat: publicLat, // Canonical venue pin
      lng: publicLng,
      geohash5,
      venueId: attempt.selectedVenueId,
      venueName: venue.name,
      startedAt: now,
      endsAt: admin.firestore.Timestamp.fromDate(new Date(nowMs + durationMs)),
      lastConfirmedAt: now,
      lastHeartbeatAt: now,
      lastHeartbeatSeq: 0,
      heartbeatCount: 0,
      v: 1,
    };
    batch.set(db.collection('sessions').doc(sessionId), sessionDoc);

    // 3. Private operational location doc
    const sampleLat = attempt.verifiedSample?.lat ?? venue.lat;
    const sampleLng = attempt.verifiedSample?.lng ?? venue.lng;
    const sampleAccuracy = attempt.verifiedSample?.accuracyMeters ?? 10;
    const privateDoc: Omit<PrivateLocationSession, 'deletedAt'> = {
      sessionId,
      performerId: attempt.performerId,
      lat: sampleLat,
      lng: sampleLng,
      geohash9: encodeGeohash(sampleLat, sampleLng, 9),
      geohash7: encodeGeohash(sampleLat, sampleLng, 7),
      geohash5: encodeGeohash(sampleLat, sampleLng, 5),
      isMockRejected: false,
      accuracyMeters: sampleAccuracy,
      idempotencyKey: data.idempotencyKey,
      capturedAt: new Date().toISOString(),
    };
    batch.set(
      db.collection('sessions').doc(sessionId).collection('private').doc('location'),
      privateDoc,
    );

    const response: StartStationaryLiveSessionResponse = {
      sessionId,
      status: 'live',
      locationType: 'venue',
      publicLat,
      publicLng,
      venueId: attempt.selectedVenueId,
      venueName: venue.name,
      endsAt,
    };

    batch.set(idemRef, {
      key: idemKey,
      uid,
      operation: 'startStationaryLiveSession',
      status: 'succeeded',
      responseSnapshot: response,
      createdAt: new Date().toISOString(),
      expiresAt: endsAt,
    });

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: attempt.performerId,
      sessionId,
      action: 'session_started',
      outcome: 'success',
      coarseGeohash5: geohash5,
      idempotencyKey: data.idempotencyKey,
      correlationId,
      platform: 'server',
    });

    logger.info('[startStationaryLiveSession] Stationary live session started', {
      correlationId,
      sessionId,
      performerId: attempt.performerId,
      venueId: attempt.selectedVenueId,
    });

    return response;
  },
);
