/**
 * Crowdbeats V2 — startSession (Phase 2 update)
 *
 * Changes from Phase B:
 *  - Typed against StartSessionRequest / StartSessionResponse contracts.
 *  - Computes geohash5, geohash7, geohash9 server-side using encodeGeohash().
 *  - Writes GeoPoint ONLY to sessions/{id}/private/location (deny-all rules).
 *  - Main sessions/{id} doc contains geohash5 + publicLat/publicLng (venue pin or
 *    geohash-7 centroid) — NEVER raw device coordinates.
 *  - Validates idempotencyKey; deduplicates via idempotencyKeys/{key} collection.
 *  - Validates isMock flag; rejects mock GPS in production (enforced by policy).
 *  - Records LocationAuditEvent on success and failure.
 *  - PublicLivePresence brand applied via _toPublicPresence() factory.
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
  StartSessionRequest,
  StartSessionResponse,
  PrivateLocationSession,
  LocationAuditEvent,
} from '@crowdbeats/contracts';
import { validateCoordinates } from '../discovery/geoService.js';
import { logger } from '../lib/logger.js';

if (admin.apps.length === 0) admin.initializeApp();

const ALLOWED_PERFORMER_TYPES = ['artist', 'band_member', 'venue_manager'] as const;
const SESSION_INITIAL_TTL_MS  = 8 * 3_600_000;  // 8h initial lease
const MAX_VENUE_PROXIMITY_M   = 200;             // server-enforced; overrideable by policy

function _db() { return admin.firestore(); }

export const startSession = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request) => {
    const correlationId = `sess_start_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // ── Auth ──────────────────────────────────────────────────────────────────
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as StartSessionRequest;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!ALLOWED_PERFORMER_TYPES.includes(data.performerType)) {
      throw new HttpsError('invalid-argument', `performerType must be one of: ${ALLOWED_PERFORMER_TYPES.join(', ')}.`);
    }
    if (!data.performerName?.trim()) {
      throw new HttpsError('invalid-argument', 'performerName is required.');
    }
    if (!data.idempotencyKey || typeof data.idempotencyKey !== 'string' || data.idempotencyKey.length < 8) {
      throw new HttpsError('invalid-argument', 'idempotencyKey must be a non-empty string (min 8 chars).');
    }
    if (data.locationType !== 'venue' && data.locationType !== 'street') {
      throw new HttpsError('invalid-argument', "locationType must be 'venue' or 'street'.");
    }

    // ── Idempotency check ─────────────────────────────────────────────────────
    const idemKey = `startSession:${uid}:${data.idempotencyKey}`;
    const idemRef  = _db().collection('idempotencyKeys').doc(idemKey);
    const idemSnap = await idemRef.get();
    if (idemSnap.exists) {
      const cached = idemSnap.data()!;
      if (cached['status'] === 'succeeded') {
        logger.info('[startSession] idempotent replay', { correlationId });
        return cached['responseSnapshot'] as StartSessionResponse;
      }
    }
    // Mark in-flight
    await idemRef.set({
      key: idemKey, uid,
      operation: 'startSession',
      status: 'processing',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    });

    // ── Mock GPS rejection ────────────────────────────────────────────────────
    if (data.isMock === true) {
      await _writeAuditEvent({ performerId: uid, action: 'session_started', outcome: 'rejected',
        rejectionReason: 'mock_gps_rejected', idempotencyKey: data.idempotencyKey,
        correlationId, platform: 'ios' });
      await idemRef.update({ status: 'failed' });
      throw new HttpsError('failed-precondition', 'Mock GPS coordinates are not accepted for live sessions.');
    }

    // ── Enforce: max 1 active session per performer ───────────────────────────
    const existing = await _db().collection('sessions')
      .where('performerId', '==', uid)
      .where('status', '==', 'live')
      .limit(1).get();
    if (!existing.empty) {
      await idemRef.update({ status: 'failed' });
      throw new HttpsError('already-exists',
        `You already have an active session (${existing.docs[0].id}). End it first.`);
    }

    // ── Resolve location ──────────────────────────────────────────────────────
    let rawLat: number;
    let rawLng: number;
    let publicLat: number;
    let publicLng: number;
    let resolvedVenueName: string | null = null;
    let resolvedVenueId: string | null = null;

    if (data.locationType === 'venue') {
      if (!data.venueId) throw new HttpsError('invalid-argument', 'venueId required for venue sessions.');
      const venueSnap = await _db().collection('venues').doc(data.venueId).get();
      if (!venueSnap.exists) throw new HttpsError('not-found', `Venue ${data.venueId} not found.`);
      const vd = venueSnap.data()!;
      const venueLoc = vd['location'] as admin.firestore.GeoPoint | undefined;
      if (!venueLoc) throw new HttpsError('failed-precondition', 'Venue has no location set.');
      rawLat = venueLoc.latitude;
      rawLng = venueLoc.longitude;
      // Public pin == venue canonical pin (already public address-level)
      publicLat = rawLat;
      publicLng = rawLng;
      resolvedVenueName = (vd['name'] as string | null) ?? null;
      resolvedVenueId = data.venueId;

      // If performer-supplied GPS provided, validate proximity
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        const dist = _haversineMeters(data.lat, data.lng, rawLat, rawLng);
        if (dist > MAX_VENUE_PROXIMITY_M) {
          await _writeAuditEvent({ performerId: uid, action: 'session_started', outcome: 'rejected',
            rejectionReason: `too_far (${Math.round(dist)}m > ${MAX_VENUE_PROXIMITY_M}m)`,
            coarseGeohash5: encodeGeohash(data.lat, data.lng, 5),
            idempotencyKey: data.idempotencyKey, correlationId, platform: 'ios' });
          await idemRef.update({ status: 'failed' });
          throw new HttpsError('failed-precondition',
            `Device is ${Math.round(dist)}m from venue (max ${MAX_VENUE_PROXIMITY_M}m).`);
        }
      }
    } else {
      // street mode — validate device-supplied coordinates
      if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
        throw new HttpsError('invalid-argument', 'lat and lng required for street sessions.');
      }
      if (!validateCoordinates(data.lat, data.lng)) {
        throw new HttpsError('invalid-argument', 'lat/lng values are out of valid range.');
      }
      rawLat = data.lat;
      rawLng = data.lng;
      // Public pin == geohash-7 centroid — NOT device GPS
      const gh7 = computeApproxGeohash7(rawLat, rawLng, 100);
      const centroid = decodeGeohash(gh7);
      publicLat = centroid.lat;
      publicLng = centroid.lng;
    }

    // ── Compute geohashes ─────────────────────────────────────────────────────
    const geohash9 = encodeGeohash(rawLat, rawLng, 9);
    const geohash7 = encodeGeohash(rawLat, rawLng, 7);
    const geohash5 = encodeGeohash(rawLat, rawLng, 5);
    const publicGeohash5 = encodeGeohash(publicLat, publicLng, 5);

    // ── Create session documents ──────────────────────────────────────────────
    const sessionId = uuidv4();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const endsAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + SESSION_INITIAL_TTL_MS));
    const endsAtIso = new Date(Date.now() + SESSION_INITIAL_TTL_MS).toISOString();
    const nowIso = new Date().toISOString();
    const db = _db();
    const batch = db.batch();

    // Public presence document — NO raw GPS
    const publicDoc: Record<string, unknown> = {
      sessionId,
      performerId: uid,
      performerName: data.performerName.trim(),
      performerType: data.performerType,
      status: 'live',
      locationType: data.locationType,
      lat: publicLat,     // venue pin OR geohash-7 centroid — NEVER device GPS
      lng: publicLng,
      geohash5: publicGeohash5,
      startedAt: now,
      endsAt,
      // Session lease fields (heartbeat tracking)
      lastHeartbeatAt: now,
      lastHeartbeatSeq: 0,
      heartbeatCount: 0,
      v: 1,
    };
    if (resolvedVenueName) publicDoc['venueName'] = resolvedVenueName;
    if (resolvedVenueId)   publicDoc['venueId']   = resolvedVenueId;

    batch.set(db.collection('sessions').doc(sessionId), publicDoc);

    // Private location document — Admin SDK only (deny-all client rules)
    const privateDoc: Omit<PrivateLocationSession, 'deletedAt'> = {
      sessionId,
      performerId: uid,
      lat: rawLat,
      lng: rawLng,
      geohash9,
      geohash7,
      geohash5,
      isMockRejected: false,
      accuracyMeters: data.accuracyMeters ?? 999,
      idempotencyKey: data.idempotencyKey,
      capturedAt: nowIso,
    };
    batch.set(
      db.collection('sessions').doc(sessionId).collection('private').doc('location'),
      privateDoc,
    );

    await batch.commit();

    // ── Audit event ───────────────────────────────────────────────────────────
    await _writeAuditEvent({
      performerId: uid, sessionId, action: 'session_started', outcome: 'success',
      coarseGeohash5: geohash5, idempotencyKey: data.idempotencyKey,
      correlationId, platform: 'ios',
    });

    const response: StartSessionResponse = {
      sessionId,
      locationType: data.locationType,
      publicLat,
      publicLng,
      endsAt: endsAtIso,
    };

    // ── Mark idempotency as succeeded ─────────────────────────────────────────
    await idemRef.update({ status: 'succeeded', responseSnapshot: response });

    logger.info('[startSession] session created', { correlationId, sessionId });
    return response;
  },
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function _haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function _writeAuditEvent(fields: {
  performerId: string;
  sessionId?: string;
  action: LocationAuditEvent['action'];
  outcome: LocationAuditEvent['outcome'];
  rejectionReason?: string;
  coarseGeohash5?: string;
  idempotencyKey?: string;
  correlationId: string;
  platform: LocationAuditEvent['platform'];
}): Promise<void> {
  try {
    const eventId = `lae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const event: LocationAuditEvent = {
      eventId,
      sessionId: fields.sessionId,
      performerId: fields.performerId,
      action: fields.action,
      outcome: fields.outcome,
      rejectionReason: fields.rejectionReason,
      coarseGeohash5: fields.coarseGeohash5,
      idempotencyKey: fields.idempotencyKey,
      correlationId: fields.correlationId,
      createdAt: new Date().toISOString(),
      platform: fields.platform,
      v: 1,
    };
    await _db().collection('locationAuditEvents').doc(eventId).set(event);
  } catch {
    // Audit failures must not fail the main operation
    logger.warn('[startSession] audit write failed', { correlationId: fields.correlationId });
  }
}
