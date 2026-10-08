/**
 * Crowdbeats V2 — Audience Radar & Visibility Grant Callables (Phase 6)
 *
 * Implements:
 * 10. optIntoAggregateAudienceSignal
 * 11. grantAudienceVisibility
 * 12. revokeAudienceVisibility
 * 13. getCreatorAudienceRadar (k-anonymity threshold enforcement, fan anonymity protection)
 */

import * as crypto from 'crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { v4 as uuidv4 } from 'uuid';
import {
  encodeGeohash,
  decodeGeohash,
  computeApproxGeohash7,
} from '../lib/geohash.js';
import type {
  OptIntoAggregateAudienceSignalRequest,
  OptIntoAggregateAudienceSignalResponse,
  GrantAudienceVisibilityRequest,
  GrantAudienceVisibilityResponse,
  RevokeAudienceVisibilityRequest,
  RevokeAudienceVisibilityResponse,
  GetCreatorAudienceRadarRequest,
  GetCreatorAudienceRadarResponse,
  CreatorAudienceZoneView,
  ConsentedFanProfileView,
  AudienceCountBand,
  ConsentReceipt,
} from '@crowdbeats/contracts';
import {
  getFirestoreDb,
  areUsersBlocked,
  writeLocationAuditEvent,
} from './sessionHelpers.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import { verifyAppCheck } from '../lib/appCheck.js';
import { assertSessionNotExpired } from '../lib/costGuard.js';

const K_ANONYMITY_THRESHOLD = 5; // minimum 5 fans required to publish a zone
const SIGNAL_TTL_MS = 30 * 60_000; // 30 minutes TTL for audience signals
const GRANT_DEFAULT_DURATION_MS = 120 * 60_000; // 2 hours

function hashFanUid(uid: string, sessionId: string): string {
  return crypto.createHash('sha256').update(`${uid}:${sessionId}:cb_radar_salt_2026`).digest('hex');
}

/**
 * 10. optIntoAggregateAudienceSignal
 * Records a fan's coarse presence for k-anonymous aggregate crowd radar.
 * Fan UID is one-way hashed with session salt — identity cannot be reconstructed.
 */
export const optIntoAggregateAudienceSignal = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<OptIntoAggregateAudienceSignalResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as OptIntoAggregateAudienceSignalRequest;

    if (!data.sessionId || !data.consentVersion || !data.approximateSample) {
      throw new HttpsError('invalid-argument', 'sessionId, consentVersion, and approximateSample are required.');
    }
    const { lat, lng } = data.approximateSample;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new HttpsError('invalid-argument', 'approximateSample must contain valid lat and lng numbers.');
    }

    const db = getFirestoreDb();
    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Live session not found.');
    }
    const sessionData = sessionSnap.data()!;

    verifyAppCheck(request, 'optIntoAggregateAudienceSignal');
    assertSessionNotExpired(sessionData);
    await enforceRateLimit({ identifier: uid, action: 'audience_opt_in' });

    if (sessionData['status'] !== 'live') {
      throw new HttpsError('failed-precondition', 'Audience signals are only accepted for live sessions.');
    }

    const performerId = sessionData['performerId'] as string;

    // Safety: check blocked status
    const blocked = await areUsersBlocked(db, uid, performerId);
    if (blocked) {
      // Silent suppression for safety
      return {
        signalId: 'suppressed',
        status: 'accepted',
        expiresAt: new Date(Date.now() + SIGNAL_TTL_MS).toISOString(),
      };
    }

    const fanUidHash = hashFanUid(uid, data.sessionId);
    const coarseGeohash5 = encodeGeohash(lat, lng, 5);
    const nowMs = Date.now();
    const expiresAtIso = new Date(nowMs + SIGNAL_TTL_MS).toISOString();

    const signalRef = sessionRef.collection('privateAudienceSignals').doc(fanUidHash);
    const receiptRef = db
      .collection('users')
      .doc(uid)
      .collection('consentReceipts')
      .doc(`cr_sig_${data.sessionId}`);

    const batch = db.batch();

    batch.set(signalRef, {
      signalId: fanUidHash,
      sessionId: data.sessionId,
      fanUidHash,
      coarseGeohash5,
      consentVersion: data.consentVersion,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: expiresAtIso,
      v: 1,
    });

    const consentReceipt: ConsentReceipt = {
      receiptId: `cr_sig_${data.sessionId}`,
      fanUid: uid,
      sessionId: data.sessionId,
      performerId,
      tier: 'aggregate',
      action: 'granted',
      grantId: fanUidHash,
      consentVersion: data.consentVersion,
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: expiresAtIso,
    };
    batch.set(receiptRef, consentReceipt);

    await batch.commit();

    return {
      signalId: fanUidHash,
      status: 'accepted',
      expiresAt: expiresAtIso,
    };
  },
);

/**
 * 11. grantAudienceVisibility
 * Allows a fan to grant individual, approximate location visibility to the performer.
 * Applies 100-meter grid snapping (geohash-7 centroid) — raw GPS is never stored.
 */
export const grantAudienceVisibility = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GrantAudienceVisibilityResponse> => {
    const correlationId = `aud_grt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as GrantAudienceVisibilityRequest;

    if (!data.sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId is required.');
    }

    const db = getFirestoreDb();
    const sessionRef = db.collection('sessions').doc(data.sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Session not found.');
    }
    const sessionData = sessionSnap.data()!;

    verifyAppCheck(request, 'grantAudienceVisibility');
    assertSessionNotExpired(sessionData);
    await enforceRateLimit({ identifier: uid, action: 'audience_grant' });

    if (sessionData['status'] !== 'live') {
      throw new HttpsError('failed-precondition', 'Cannot grant visibility to a session that is not live.');
    }

    const performerId = sessionData['performerId'] as string;

    // Safety: check blocked status
    const blocked = await areUsersBlocked(db, uid, performerId);
    if (blocked) {
      throw new HttpsError('permission-denied', 'Cannot grant visibility due to block status.');
    }

    // Coarsen coordinates if provided
    let approxGeohash7: string | undefined;
    let approxLat = 0;
    let approxLng = 0;
    if (typeof data.lat === 'number' && typeof data.lng === 'number') {
      approxGeohash7 = computeApproxGeohash7(data.lat, data.lng, 100);
      const centroid = decodeGeohash(approxGeohash7);
      approxLat = centroid.lat;
      approxLng = centroid.lng;
    }

    // Fetch fan profile data if consented
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data() || {};
    const allowedFields = data.allowedProfileFields || [];

    const displayName = allowedFields.includes('displayName')
      ? (userData['displayName'] as string) || 'Fan'
      : undefined;
    const avatarUrl = allowedFields.includes('avatarUrl')
      ? (userData['photoUrl'] as string) || undefined
      : undefined;

    const grantId = uuidv4();
    const grantRef = hashFanUid(uid, data.sessionId).slice(0, 16); // Opaque reference
    const nowMs = Date.now();
    const durationMs = data.requestedDurationMinutes && data.requestedDurationMinutes > 0
      ? data.requestedDurationMinutes * 60_000
      : GRANT_DEFAULT_DURATION_MS;
    const expiresAtIso = new Date(nowMs + durationMs).toISOString();

    const grantDoc = {
      grantId,
      sessionId: data.sessionId,
      performerId,
      grantRef,
      tier: 'individual_session' as const,
      fanUid: uid, // server-side filter only, not exposed to creator
      approxGeohash7,
      approxLat,
      approxLng,
      displayName,
      avatarUrl,
      consentVersion: data.consentVersion || 'v1',
      grantedAt: new Date(nowMs).toISOString(),
      expiresAt: expiresAtIso,
      v: 1,
    };

    const batch = db.batch();

    // 1. Store grant in session subcollection
    batch.set(sessionRef.collection('audienceGrants').doc(grantId), grantDoc);

    // 2. Store fan reference for fast fan-initiated revocation
    batch.set(
      db.collection('users').doc(uid).collection('activeGrants').doc(grantId),
      { grantId, sessionId: data.sessionId, expiresAt: expiresAtIso },
    );

    // 3. Store ConsentReceipt in fan's private ledger
    const receiptRef = db.collection('users').doc(uid).collection('consentReceipts').doc(grantId);
    batch.set(receiptRef, {
      receiptId: grantId,
      fanUid: uid,
      sessionId: data.sessionId,
      performerId,
      tier: 'individual_session',
      action: 'granted',
      grantId,
      consentVersion: data.consentVersion || 'v1',
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: expiresAtIso,
    } satisfies ConsentReceipt);

    await batch.commit();

    await writeLocationAuditEvent({
      performerId,
      sessionId: data.sessionId,
      action: 'audience_grant_created',
      outcome: 'success',
      correlationId,
      platform: 'server',
    });

    return {
      grantId,
      tier: 'individual_session',
      expiresAt: expiresAtIso,
    };
  },
);

/**
 * 12. revokeAudienceVisibility
 * Revokes a previously granted audience visibility token.
 */
export const revokeAudienceVisibility = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<RevokeAudienceVisibilityResponse> => {
    const correlationId = `aud_rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as RevokeAudienceVisibilityRequest;

    verifyAppCheck(request, 'revokeAudienceVisibility');
    await enforceRateLimit({ identifier: uid, action: 'audience_revoke' });

    if (!data.grantId) {
      throw new HttpsError('invalid-argument', 'grantId is required.');
    }

    const db = getFirestoreDb();

    // Lookup fan active grant record
    const userGrantRef = db.collection('users').doc(uid).collection('activeGrants').doc(data.grantId);
    const userGrantSnap = await userGrantRef.get();

    let targetSessionId = data.sessionId;
    if (userGrantSnap.exists) {
      targetSessionId = targetSessionId || (userGrantSnap.data()?.['sessionId'] as string);
    }

    if (!targetSessionId) {
      throw new HttpsError('invalid-argument', 'sessionId could not be determined for grant.');
    }

    const sessionGrantRef = db
      .collection('sessions')
      .doc(targetSessionId)
      .collection('audienceGrants')
      .doc(data.grantId);

    const snap = await sessionGrantRef.get();
    if (snap.exists) {
      const grantData = snap.data()!;
      if (grantData['fanUid'] && grantData['fanUid'] !== uid) {
        throw new HttpsError('permission-denied', 'You do not own this visibility grant.');
      }
    }

    const batch = db.batch();
    batch.delete(sessionGrantRef);
    batch.delete(userGrantRef);

    // Update consent receipt
    const receiptRef = db.collection('users').doc(uid).collection('consentReceipts').doc(data.grantId);
    batch.update(receiptRef, {
      revokedAt: new Date().toISOString(),
    });

    await batch.commit();

    await writeLocationAuditEvent({
      performerId: snap.exists ? snap.data()?.['performerId'] : 'unknown',
      sessionId: targetSessionId,
      action: 'audience_grant_revoked',
      outcome: 'success',
      correlationId,
      platform: 'server',
    });

    return {
      grantId: data.grantId,
      status: 'revoked',
    };
  },
);

/**
 * 13. getCreatorAudienceRadar
 * Provides the live performer with an aggregated, k-anonymized audience density radar
 * and consented fan profiles.
 *
 * Enforces:
 * - k-Anonymity threshold (>=5 fans): zones with fewer than 5 fans are SUPPRESSED.
 * - Count bands only: '[5-14]' | '[15+]'.
 * - Fan UIDs are NEVER returned or disclosed.
 * - Blocked fans are excluded.
 */
export const getCreatorAudienceRadar = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetCreatorAudienceRadarResponse> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = request.auth.uid;
    const data = request.data as GetCreatorAudienceRadarRequest;

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

    verifyAppCheck(request, 'getCreatorAudienceRadar');
    assertSessionNotExpired(sessionData);
    if (sessionData['status'] !== 'live') {
      throw new HttpsError('failed-precondition', 'Session is not live.');
    }
    await enforceRateLimit({ identifier: data.sessionId, action: 'audience_radar_read' });

    // Anti-triangulation guard: reject micro-viewport probing
    if (data.boundedViewport) {
      const latSpan = Math.abs(data.boundedViewport.maxLat - data.boundedViewport.minLat);
      const lngSpan = Math.abs(data.boundedViewport.maxLng - data.boundedViewport.minLng);
      if (latSpan < 0.005 || lngSpan < 0.005) {
        throw new HttpsError(
          'invalid-argument',
          'Viewport bounding box is too small. Queries must span at least 0.005 degrees to prevent micro-zone probing.',
        );
      }
    }

    // Performer authorization check
    if (sessionData['performerId'] !== uid) {
      if (sessionData['performerType'] === 'band') {
        const memberSnap = await db
          .collection('bands')
          .doc(sessionData['performerId'])
          .collection('members')
          .doc(uid)
          .get();
        if (!memberSnap.exists || memberSnap.data()?.['isActive'] === false) {
          throw new HttpsError('permission-denied', 'You do not have access to this session audience radar.');
        }
      } else {
        throw new HttpsError('permission-denied', 'You can only view audience radar for your own sessions.');
      }
    }

    const performerId = sessionData['performerId'] as string;

    // Fetch performer's blocked users
    const blockedSnap = await db.collection('users').doc(performerId).collection('blockedUsers').get();
    const blockedUids = new Set<string>(blockedSnap.docs.map((d) => d.id));

    // 1. Process Aggregate Signals
    const signalsSnap = await sessionRef.collection('privateAudienceSignals').get();
    const cellCounts = new Map<string, number>();
    const now = Date.now();
    let totalSignals = 0;

    for (const doc of signalsSnap.docs) {
      const d = doc.data();
      const expiresAt = new Date(d['expiresAt'] as string).getTime();
      if (expiresAt > now) {
        const cell = d['coarseGeohash5'] as string;
        if (cell) {
          cellCounts.set(cell, (cellCounts.get(cell) || 0) + 1);
          totalSignals++;
        }
      }
    }

    // Apply k-anonymity suppression & count band discretization
    const zones: CreatorAudienceZoneView[] = [];
    for (const [cell, count] of cellCounts.entries()) {
      if (count >= K_ANONYMITY_THRESHOLD) {
        const countBand: AudienceCountBand = count >= 15 ? '[15+]' : '[5-14]';
        zones.push({
          zoneId: cell,
          geohash5: cell,
          countBand,
          expiresAt: new Date(now + 10 * 60_000).toISOString(),
        });
      }
      // If count < K_ANONYMITY_THRESHOLD, suppressed! (Zone omitted)
    }

    // 2. Process Individual Grants
    const grantsSnap = await sessionRef.collection('audienceGrants').get();
    const visibleFans: ConsentedFanProfileView[] = [];

    for (const doc of grantsSnap.docs) {
      const g = doc.data();
      const fanUid = g['fanUid'] as string | undefined;

      // Skip blocked fans or expired/revoked grants
      if (fanUid && blockedUids.has(fanUid)) continue;
      if (g['revokedAt']) continue;
      const expiresAt = new Date(g['expiresAt'] as string).getTime();
      if (expiresAt <= now) continue;

      const approxLat = (g['approxLat'] as number) || 0;
      const approxLng = (g['approxLng'] as number) || 0;

      // Check viewport filter if supplied
      if (data.boundedViewport) {
        const { minLat, maxLat, minLng, maxLng } = data.boundedViewport;
        if (
          approxLat < minLat ||
          approxLat > maxLat ||
          approxLng < minLng ||
          approxLng > maxLng
        ) {
          continue;
        }
      }

      // Map to safe public view — ZERO fan UIDs
      visibleFans.push({
        grantRef: g['grantRef'] || doc.id,
        displayName: g['displayName'],
        avatarUrl: g['avatarUrl'],
        approxLat,
        approxLng,
        grantedAt: g['grantedAt'] || new Date().toISOString(),
      });
    }

    const totalBucket: AudienceCountBand | 'below_threshold' =
      totalSignals >= 15 ? '[15+]' : totalSignals >= 5 ? '[5-14]' : 'below_threshold';

    return {
      sessionId: data.sessionId,
      zones,
      visibleFans,
      totalActiveSignalsBucket: totalBucket,
    };
  },
);
