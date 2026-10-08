/**
 * Crowdbeats V2 — Mobile Live Session Callables (Phase 6)
 *
 * Implements:
 * 4. startMobileLiveSession
 * 6. submitMobileLocationSample
 * 7. pauseMobileLocation
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import {
  encodeGeohash,
  decodeGeohash,
  computeApproxGeohash7,
} from '../lib/geohash.js';
import type {
  StartMobileLiveSessionRequest,
  StartMobileLiveSessionResponse,
  SubmitMobileLocationSampleRequest,
  SubmitMobileLocationSampleResponse,
  PauseMobileLocationRequest,
  PauseMobileLocationResponse,
  LocationSample,
  PrivateLocationSession,
  ConsentReceipt,
} from '@crowdbeats/contracts';
import { logger } from '../lib/logger.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import { verifyAppCheck } from '../lib/appCheck.js';
import { assertSessionNotExpired, recordCostGuardMetric } from '../lib/costGuard.js';
import {
  getFirestoreDb,
  haversineMeters,
  validatePerformerAuthorization,
  writeLocationAuditEvent,
} from './sessionHelpers.js';

const MAX_SAMPLE_AGE_MS = 30_000; // 30 seconds freshness
const MAX_MOBILE_ACCURACY_M = 100; // max 100m accuracy for mobile
const MAX_VELOCITY_METERS_PER_SEC = 45; // ~162 km/h / 100 mph speed limit
const MAX_SESSION_DURATION_HOURS = 12;
const LOCATION_SAMPLE_TTL_MS = 15 * 60_000; // 15-minute rolling window

/**
 * 4. startMobileLiveSession
 * Initiates a mobile live broadcast with server-coarsened public presence.
 * Raw device coordinates are isolated in private operational documents.
 */
export const startMobileLiveSession = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<StartMobileLiveSessionResponse> => {
    const correlationId = `mob_start_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as StartMobileLiveSessionRequest;

    verifyAppCheck(request, 'startMobileLiveSession');
    await enforceRateLimit({ identifier: uid, action: 'live_mobile_start' });

    if (!data.profileId || !data.role || !data.consentVersion || !data.initialSample) {
      throw new HttpsError(
        'invalid-argument',
        'profileId, role, consentVersion, and initialSample are required.',
      );
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string' || data.idempotencyKey.length < 8) {
      throw new HttpsError('invalid-argument', 'idempotencyKey must be a non-empty string (min 8 chars).');
    }

    const sample = data.initialSample;
    if (
      typeof sample.lat !== 'number' ||
      typeof sample.lng !== 'number' ||
      typeof sample.accuracyMeters !== 'number' ||
      !sample.timestamp
    ) {
      throw new HttpsError('invalid-argument', 'initialSample must contain lat, lng, accuracyMeters, and timestamp.');
    }

    const db = getFirestoreDb();

    // Idempotency check
    const idemKey = `startMobileLiveSession:${uid}:${data.idempotencyKey}`;
    const idemRef = db.collection('idempotencyKeys').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists && idemSnap.data()?.['status'] === 'succeeded') {
      return idemSnap.data()?.['responseSnapshot'] as StartMobileLiveSessionResponse;
    }

    // 1. Authorize performer
    const { performerName } = await validatePerformerAuthorization(db, uid, data.profileId, data.role);

    // 2. Guard: max 1 active session per performer
    const activeExisting = await db
      .collection('sessions')
      .where('performerId', '==', data.profileId)
      .where('status', '==', 'live')
      .limit(1)
      .get();
    if (!activeExisting.empty) {
      throw new HttpsError(
        'already-exists',
        `Performer already has an active live session (${activeExisting.docs[0].id}). End it first.`,
      );
    }

    // 3. Sample validation
    const nowMs = Date.now();
    if (sample.isMock === true) {
      await writeLocationAuditEvent({
        performerId: data.profileId,
        action: 'mock_gps_rejected',
        outcome: 'rejected',
        rejectionReason: 'Mock GPS detected on mobile start',
        correlationId,
        platform: 'server',
      });
      throw new HttpsError('failed-precondition', 'Mock GPS coordinates are rejected for mobile live sessions.');
    }

    const sampleTime = new Date(sample.timestamp).getTime();
    if (isNaN(sampleTime) || Math.abs(nowMs - sampleTime) > MAX_SAMPLE_AGE_MS) {
      throw new HttpsError('failed-precondition', 'Initial location sample timestamp is stale (> 30s).');
    }

    if (sample.accuracyMeters > MAX_MOBILE_ACCURACY_M) {
      throw new HttpsError(
        'failed-precondition',
        `GPS accuracy (${Math.round(sample.accuracyMeters)}m) exceeds maximum threshold (${MAX_MOBILE_ACCURACY_M}m).`,
      );
    }

    // 4. Coarsen coordinates to 100-m grid geohash-7 centroid — NEVER raw GPS
    const gh7 = computeApproxGeohash7(sample.lat, sample.lng, 100);
    const centroid = decodeGeohash(gh7);
    const publicLat = centroid.lat;
    const publicLng = centroid.lng;
    const geohash5 = encodeGeohash(publicLat, publicLng, 5);

    // 5. Session TTL & Document Creation
    const requestedMinutes = data.requestedDurationMinutes && data.requestedDurationMinutes > 0
      ? Math.min(data.requestedDurationMinutes, MAX_SESSION_DURATION_HOURS * 60)
      : 120; // 2h default
    const durationMs = requestedMinutes * 60_000;
    const endsAtIso = new Date(nowMs + durationMs).toISOString();

    const sessionId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    // Public presence document
    const sessionDoc: Record<string, unknown> = {
      sessionId,
      performerId: data.profileId,
      performerName,
      performerType: data.role,
      status: 'live',
      locationType: 'mobile',
      lat: publicLat,
      lng: publicLng,
      geohash5,
      consentVersion: data.consentVersion,
      policyVersion: data.policyVersion || 'v1',
      startedAt: now,
      endsAt: admin.firestore.Timestamp.fromDate(new Date(nowMs + durationMs)),
      lastConfirmedAt: now,
      lastHeartbeatAt: now,
      lastHeartbeatSeq: 1,
      heartbeatCount: 0,
      v: 1,
    };
    batch.set(db.collection('sessions').doc(sessionId), sessionDoc);

    // Private operational location document
    const privateDoc: Omit<PrivateLocationSession, 'deletedAt'> = {
      sessionId,
      performerId: data.profileId,
      lat: sample.lat,
      lng: sample.lng,
      geohash9: encodeGeohash(sample.lat, sample.lng, 9),
      geohash7: encodeGeohash(sample.lat, sample.lng, 7),
      geohash5,
      isMockRejected: false,
      accuracyMeters: sample.accuracyMeters,
      idempotencyKey: data.idempotencyKey,
      capturedAt: sample.timestamp,
    };
    batch.set(
      db.collection('sessions').doc(sessionId).collection('private').doc('location'),
      privateDoc,
    );

    // Initial rolling location sample
    const sampleId = uuidv4();
    const locationSampleDoc: LocationSample = {
      sampleId,
      sessionId,
      seq: 1,
      idempotencyKey: data.idempotencyKey,
      lat: sample.lat,
      lng: sample.lng,
      geohash9: encodeGeohash(sample.lat, sample.lng, 9),
      accuracyMeters: sample.accuracyMeters,
      capturedAt: sample.timestamp,
      receivedAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + LOCATION_SAMPLE_TTL_MS).toISOString(),
    };
    batch.set(
      db.collection('sessions').doc(sessionId).collection('private').doc('locationSamples').collection('samples').doc(sampleId),
      locationSampleDoc,
    );

    // Consent receipt
    const receiptId = `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const consentReceipt: ConsentReceipt = {
      receiptId,
      fanUid: uid,
      sessionId,
      performerId: data.profileId,
      tier: 'individual_session',
      action: 'granted',
      grantId: receiptId,
      consentVersion: data.consentVersion,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: endsAtIso,
    };
    batch.set(
      db.collection('users').doc(uid).collection('consentReceipts').doc(receiptId),
      consentReceipt,
    );

    const response: StartMobileLiveSessionResponse = {
      sessionId,
      status: 'live',
      locationType: 'mobile',
      publicLat,
      publicLng,
      endsAt: endsAtIso,
    };

    batch.set(idemRef, {
      key: idemKey,
      uid,
      operation: 'startMobileLiveSession',
      status: 'succeeded',
      responseSnapshot: response,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: endsAtIso,
    });

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: data.profileId,
      sessionId,
      action: 'session_started',
      outcome: 'success',
      coarseGeohash5: geohash5,
      idempotencyKey: data.idempotencyKey,
      correlationId,
      platform: 'server',
    });

    logger.info('[startMobileLiveSession] Mobile live session started', {
      correlationId,
      sessionId,
      performerId: data.profileId,
    });

    return response;
  },
);

/**
 * 6. submitMobileLocationSample
 * Ingests periodic location samples from a mobile performer.
 * Enforces monotonic sequence numbers, sample freshness, accuracy, and velocity limits.
 */
export const submitMobileLocationSample = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<SubmitMobileLocationSampleResponse> => {
    const correlationId = `mob_samp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as SubmitMobileLocationSampleRequest;

    if (!data.sessionId || typeof data.seq !== 'number' || !data.sample) {
      throw new HttpsError('invalid-argument', 'sessionId, seq, and sample are required.');
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string') {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required.');
    }

    const sample = data.sample;
    if (
      typeof sample.lat !== 'number' ||
      typeof sample.lng !== 'number' ||
      typeof sample.accuracyMeters !== 'number' ||
      !sample.timestamp
    ) {
      throw new HttpsError('invalid-argument', 'Sample must contain lat, lng, accuracyMeters, and timestamp.');
    }

    const db = getFirestoreDb();
    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const sessionData = sessionSnap.data()!;

    // Performer check
    if (sessionData['performerId'] !== uid) {
      // Check if band member with access
      if (sessionData['performerType'] === 'band') {
        const memberSnap = await db
          .collection('bands')
          .doc(sessionData['performerId'])
          .collection('members')
          .doc(uid)
          .get();
        if (!memberSnap.exists || memberSnap.data()?.['isActive'] === false) {
          throw new HttpsError('permission-denied', 'You cannot submit location samples for this session.');
        }
      } else {
        throw new HttpsError('permission-denied', 'You cannot submit location samples for this session.');
      }
    }

    verifyAppCheck(request, 'submitMobileLocationSample');
    assertSessionNotExpired(sessionData);
    await enforceRateLimit({ identifier: data.sessionId, action: 'mobile_location_sample' });
    await recordCostGuardMetric({
      metric: 'telemetry_sample_ingested',
      entityId: data.sessionId,
      details: { sequence: data.seq },
    });

    if (sessionData['status'] !== 'live') {
      throw new HttpsError('failed-precondition', `Cannot update location for session with status '${sessionData['status']}'.`);
    }
    if (sessionData['locationType'] !== 'mobile') {
      throw new HttpsError('failed-precondition', 'Location samples are only accepted for mobile sessions.');
    }

    // Monotonic sequence check
    const lastSeq = (sessionData['lastHeartbeatSeq'] as number) || 0;
    if (data.seq <= lastSeq) {
      await writeLocationAuditEvent({
        performerId: sessionData['performerId'],
        sessionId: data.sessionId,
        action: 'heartbeat_rejected_seq',
        outcome: 'rejected',
        rejectionReason: `seq ${data.seq} <= lastSeq ${lastSeq}`,
        correlationId,
        platform: 'server',
      });
      throw new HttpsError('failed-precondition', `Sequence number ${data.seq} is not greater than current sequence ${lastSeq}.`);
    }

    // Freshness & Mock check
    const nowMs = Date.now();
    if (sample.isMock === true) {
      await writeLocationAuditEvent({
        performerId: sessionData['performerId'],
        sessionId: data.sessionId,
        action: 'mock_gps_rejected',
        outcome: 'rejected',
        rejectionReason: 'Mock GPS detected in mobile sample',
        correlationId,
        platform: 'server',
      });
      throw new HttpsError('failed-precondition', 'Mock GPS coordinates are rejected.');
    }

    const sampleTime = new Date(sample.timestamp).getTime();
    if (isNaN(sampleTime) || Math.abs(nowMs - sampleTime) > MAX_SAMPLE_AGE_MS) {
      await writeLocationAuditEvent({
        performerId: sessionData['performerId'],
        sessionId: data.sessionId,
        action: 'mobile_sample_rejected',
        outcome: 'rejected',
        rejectionReason: 'Stale sample (>30s)',
        correlationId,
        platform: 'server',
      });
      throw new HttpsError('failed-precondition', 'Sample timestamp is stale (> 30 seconds old).');
    }

    if (sample.accuracyMeters > MAX_MOBILE_ACCURACY_M) {
      await writeLocationAuditEvent({
        performerId: sessionData['performerId'],
        sessionId: data.sessionId,
        action: 'mobile_sample_rejected',
        outcome: 'rejected',
        rejectionReason: `Accuracy ${Math.round(sample.accuracyMeters)}m exceeds threshold`,
        correlationId,
        platform: 'server',
      });
      throw new HttpsError('failed-precondition', `GPS accuracy exceeds allowable threshold (${MAX_MOBILE_ACCURACY_M}m).`);
    }

    // Velocity check against last private sample
    const privateLocRef = sessionRef.collection('private').doc('location');
    const privateLocSnap = await privateLocRef.get();
    if (privateLocSnap.exists) {
      const prevData = privateLocSnap.data()!;
      const prevLat = prevData['lat'] as number;
      const prevLng = prevData['lng'] as number;
      const prevCapturedAt = new Date(prevData['capturedAt'] as string).getTime();

      const distMeters = haversineMeters(sample.lat, sample.lng, prevLat, prevLng);
      const deltaSeconds = Math.max(1, (sampleTime - prevCapturedAt) / 1000);
      const velocityMps = distMeters / deltaSeconds;

      if (velocityMps > MAX_VELOCITY_METERS_PER_SEC) {
        await writeLocationAuditEvent({
          performerId: sessionData['performerId'],
          sessionId: data.sessionId,
          action: 'mobile_sample_rejected',
          outcome: 'rejected',
          rejectionReason: `velocity_exceeded: ${Math.round(velocityMps)} m/s > ${MAX_VELOCITY_METERS_PER_SEC} m/s`,
          correlationId,
          platform: 'server',
        });
        throw new HttpsError(
          'failed-precondition',
          `Travel velocity (${Math.round(velocityMps)} m/s) exceeds maximum permitted travel policy (${MAX_VELOCITY_METERS_PER_SEC} m/s).`,
        );
      }
    }

    // Coarsen coordinates to 100-m grid geohash-7 centroid — NEVER raw GPS
    const gh7 = computeApproxGeohash7(sample.lat, sample.lng, 100);
    const centroid = decodeGeohash(gh7);
    const publicLat = centroid.lat;
    const publicLng = centroid.lng;
    const geohash5 = encodeGeohash(publicLat, publicLng, 5);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const updatedAt = new Date(nowMs).toISOString();
    const batch = db.batch();

    // 1. Update public presence document with coarsened coordinates
    batch.update(sessionRef, {
      lat: publicLat,
      lng: publicLng,
      geohash5,
      lastHeartbeatSeq: data.seq,
      lastHeartbeatAt: now,
      lastConfirmedAt: now,
      updatedAt: now,
    });

    // 2. Update private operational location doc with raw coordinates
    batch.set(privateLocRef, {
      sessionId: data.sessionId,
      performerId: sessionData['performerId'],
      lat: sample.lat,
      lng: sample.lng,
      geohash9: encodeGeohash(sample.lat, sample.lng, 9),
      geohash7: encodeGeohash(sample.lat, sample.lng, 7),
      geohash5,
      isMockRejected: false,
      accuracyMeters: sample.accuracyMeters,
      idempotencyKey: data.idempotencyKey,
      capturedAt: sample.timestamp,
    });

    // 3. Write rolling sample to subcollection (TTL 15 min)
    const sampleId = uuidv4();
    const sampleDocRef = sessionRef
      .collection('private')
      .doc('locationSamples')
      .collection('samples')
      .doc(sampleId);
    batch.set(sampleDocRef, {
      sampleId,
      sessionId: data.sessionId,
      seq: data.seq,
      idempotencyKey: data.idempotencyKey,
      lat: sample.lat,
      lng: sample.lng,
      geohash9: encodeGeohash(sample.lat, sample.lng, 9),
      accuracyMeters: sample.accuracyMeters,
      capturedAt: sample.timestamp,
      receivedAt: updatedAt,
      expiresAt: new Date(nowMs + LOCATION_SAMPLE_TTL_MS).toISOString(),
    });

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: sessionData['performerId'],
      sessionId: data.sessionId,
      action: 'mobile_sample_accepted',
      outcome: 'success',
      coarseGeohash5: geohash5,
      idempotencyKey: data.idempotencyKey,
      correlationId,
      platform: 'server',
    });

    return {
      sessionId: data.sessionId,
      seq: data.seq,
      accepted: true,
      publicLat,
      publicLng,
      updatedAt,
    };
  },
);

/**
 * 7. pauseMobileLocation
 * Suspends public broadcast of moving coordinates.
 * Retains session state and history while setting public status to 'paused'.
 */
export const pauseMobileLocation = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<PauseMobileLocationResponse> => {
    const correlationId = `mob_pause_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as PauseMobileLocationRequest;

    if (!data.sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const db = getFirestoreDb();
    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const snap = await sessionRef.get();

    if (!snap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const sessionData = snap.data()!;

    if (sessionData['performerId'] !== uid) {
      throw new HttpsError('permission-denied', 'You do not have permission to pause this session.');
    }

    if (sessionData['status'] === 'paused') {
      return { sessionId: data.sessionId, status: 'paused' };
    }
    if (sessionData['status'] !== 'live') {
      throw new HttpsError('failed-precondition', `Cannot pause session with status '${sessionData['status']}'.`);
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await sessionRef.update({
      status: 'paused',
      pausedAt: now,
      pauseReason: data.reason || 'performer_paused',
    });

    await writeLocationAuditEvent({
      performerId: sessionData['performerId'],
      sessionId: data.sessionId,
      action: 'mobile_location_paused',
      outcome: 'success',
      correlationId,
      platform: 'server',
    });

    logger.info('[pauseMobileLocation] Mobile session paused', {
      correlationId,
      sessionId: data.sessionId,
    });

    return {
      sessionId: data.sessionId,
      status: 'paused',
    };
  },
);
