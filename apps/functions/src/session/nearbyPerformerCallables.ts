/**
 * Crowdbeats V2 — Camera-Triggered Nearby Live Performer Callables
 *
 * Implements getNearbyLivePerformers:
 * - Proximity via GPS only: strictly 100m radius check against active live sessions.
 * - Zero biometric or content analysis: NO facial recognition, NO audio fingerprinting, NO media scanning.
 * - Entity correctness: Band check-ins route tips to Band collective entity, not member UIDs.
 * - Social safety: Filter out blocked entities (bidirectional).
 * - Uncertainty handling: flags requiresChooser if >1 candidate or horizontal accuracy >50m.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type {
  GetNearbyLivePerformersRequest,
  GetNearbyLivePerformersResponse,
  NearbyLivePerformerCandidate,
  DisambiguationReason,
} from '@crowdbeats/contracts';
import {
  getFirestoreDb,
  haversineMeters,
  areUsersBlocked,
} from './sessionHelpers.js';
import { enforceRateLimit } from '../lib/rateLimiter.js';
import { logger } from '../lib/logger.js';

const NEARBY_RADIUS_METERS = 100; // Hard requirement: 100 meters
const ACCURACY_CHOOSER_THRESHOLD_METERS = 50; // Accuracy > 50m requires chooser
const MAX_SAMPLE_AGE_MS = 30_000; // 30 seconds freshness

export const getNearbyLivePerformers = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<GetNearbyLivePerformersResponse> => {
    const callerUid = request.auth?.uid;
    const data = request.data as GetNearbyLivePerformersRequest;

    if (!data?.query) {
      throw new HttpsError('invalid-argument', 'Query object is required.');
    }

    const { lat, lng, accuracyMeters, timestamp, clientSessionId } = data.query;

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new HttpsError('invalid-argument', 'Valid latitude and longitude are required.');
    }

    // Rate limiting: authenticated UID or anonymous client session bucket
    const rateLimitKey = callerUid || clientSessionId || 'anonymous_camera_client';
    await enforceRateLimit({
      identifier: rateLimitKey,
      action: 'camera_nearby_query',
    });

    // Sample age verification (warn if older than 30s)
    if (timestamp) {
      const sampleTime = new Date(timestamp).getTime();
      const ageMs = Date.now() - sampleTime;
      if (ageMs > MAX_SAMPLE_AGE_MS) {
        logger.warn('[getNearbyLivePerformers] Stale location sample received', {
          ageMs,
          maxAgeMs: MAX_SAMPLE_AGE_MS,
        });
      }
    }

    const db = getFirestoreDb();
    const candidateMap = new Map<string, NearbyLivePerformerCandidate>();

    // 1. Query active live sessions in `sessions` collection
    const activeSessionsSnap = await db
      .collection('sessions')
      .where('status', '==', 'live')
      .limit(50)
      .get();

    for (const doc of activeSessionsSnap.docs) {
      const s = doc.data();
      const sLat = typeof s['publicLat'] === 'number' ? s['publicLat'] : null;
      const sLng = typeof s['publicLng'] === 'number' ? s['publicLng'] : null;

      if (sLat === null || sLng === null) continue;

      const dist = haversineMeters(lat, lng, sLat, sLng);
      if (dist > NEARBY_RADIUS_METERS) continue;

      const performerId = (s['performerId'] || '') as string;
      const performerType = (s['performerType'] === 'band' ? 'band' : 'artist') as 'artist' | 'band';
      const performerName = (s['performerName'] || 'Live Performer') as string;

      // Filter blocked performers if caller is authenticated
      if (callerUid && performerId) {
        const isBlocked = await areUsersBlocked(db, callerUid, performerId);
        if (isBlocked) continue;

        // Also check entity-level socialBlocks collection
        const [b1, b2] = await Promise.all([
          db.collection('socialBlocks').doc(`block_${callerUid}_${performerId}`).get(),
          db.collection('socialBlocks').doc(`block_${performerId}_${callerUid}`).get(),
        ]);
        if (b1.exists || b2.exists) continue;
      }

      candidateMap.set(performerId, {
        performerId,
        performerType,
        performerName,
        performerAvatarUrl: (s['performerAvatarUrl'] || s['photoUrl']) as string | undefined,
        activeSessionId: doc.id,
        locationType: (s['locationType'] || 'street') as 'venue' | 'street',
        venueName: s['venueName'] as string | undefined,
        distanceMeters: Math.round(dist * 10) / 10,
        genres: Array.isArray(s['genres']) ? s['genres'] : ['Live Music'],
        bio: s['bio'] as string | undefined,
        defaultTipAmountCents: 500, // $5.00 USD
      });
    }

    // 2. Query active stageSessions (venue/festival performances)
    try {
      const stageSnap = await db
        .collection('stageSessions')
        .where('status', '==', 'ACTIVE')
        .limit(50)
        .get();

      for (const doc of stageSnap.docs) {
        const s = doc.data();
        const sLat = typeof s['latitude'] === 'number' ? s['latitude'] : null;
        const sLng = typeof s['longitude'] === 'number' ? s['longitude'] : null;

        if (sLat === null || sLng === null) continue;

        const dist = haversineMeters(lat, lng, sLat, sLng);
        if (dist > NEARBY_RADIUS_METERS) continue;

        const performerId = (s['performerId'] || s['artistId'] || '') as string;
        if (!performerId || candidateMap.has(performerId)) continue;

        // Social safety check
        if (callerUid) {
          const isBlocked = await areUsersBlocked(db, callerUid, performerId);
          if (isBlocked) continue;
        }

        const performerType = (s['performerType'] === 'band' ? 'band' : 'artist') as 'artist' | 'band';

        candidateMap.set(performerId, {
          performerId,
          performerType,
          performerName: (s['performerName'] || s['artistName'] || 'Live Performer') as string,
          performerAvatarUrl: (s['photoUrl'] || s['performerPhotoUrl']) as string | undefined,
          activeSessionId: doc.id,
          locationType: 'venue',
          venueName: (s['venueName'] || 'Main Stage') as string,
          distanceMeters: Math.round(dist * 10) / 10,
          genres: Array.isArray(s['genres']) ? s['genres'] : [s['genre'] || 'Live Music'],
          bio: s['bio'] as string | undefined,
          defaultTipAmountCents: 500,
        });
      }
    } catch {
      // Stage sessions optional fallback
    }

    const candidates = Array.from(candidateMap.values()).sort(
      (a, b) => a.distanceMeters - b.distanceMeters,
    );

    const requiresChooser =
      candidates.length > 1 || (typeof accuracyMeters === 'number' && accuracyMeters > ACCURACY_CHOOSER_THRESHOLD_METERS);

    let disambiguationReason: DisambiguationReason = 'none';
    let selectedCandidate: NearbyLivePerformerCandidate | undefined;

    if (candidates.length === 0) {
      disambiguationReason = 'no_performers_in_range';
    } else if (candidates.length === 1) {
      selectedCandidate = candidates[0];
      if (typeof accuracyMeters === 'number' && accuracyMeters > ACCURACY_CHOOSER_THRESHOLD_METERS) {
        disambiguationReason = 'poor_gps_accuracy';
      } else {
        disambiguationReason = 'none';
      }
    } else {
      disambiguationReason = 'multiple_performers';
    }

    return {
      candidates,
      requiresChooser,
      selectedCandidate,
      disambiguationReason,
      queriedAt: new Date().toISOString(),
      radiusMeters: NEARBY_RADIUS_METERS,
    };
  },
);
