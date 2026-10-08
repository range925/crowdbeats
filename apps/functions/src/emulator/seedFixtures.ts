/**
 * Crowdbeats V2 — Emulator Seed Fixtures (Phase 2)
 *
 * Populates the Firebase Emulator with deterministic test data for:
 *  - venues (2 with geohash fields)
 *  - artistProfiles (Solo — live, not-live)
 *  - bands (Band — live, not-live)
 *  - sessions/publicLivePresence (fresh, stale/expired, active mobile)
 *  - sessions/{id}/private/location (server-only; emulator only — proves subcollection exists)
 *  - sessions/{id}/audienceGrants (authorized individual and aggregate)
 *  - audienceZones (above threshold, below threshold → suppressed)
 *  - consentReceipts/{fanUid} (fan-scoped)
 *  - locationAuditEvents (sample audit entries)
 *
 * Usage (emulator only):
 *   cd apps/functions && npx ts-node src/emulator/seedFixtures.ts
 *
 * NOTE: This script targets the Firestore Emulator.
 * It will refuse to run against a production Firestore instance.
 */

import * as admin from 'firebase-admin';
import { encodeGeohash, computeApproxGeohash7, decodeGeohash } from '../lib/geohash.js';

// ── Guard: emulator only ──────────────────────────────────────────────────────
const emulatorHost = process.env['FIRESTORE_EMULATOR_HOST'];
if (!emulatorHost) {
  console.error(
    'ERROR: FIRESTORE_EMULATOR_HOST is not set. ' +
    'This script may only run against the Firebase Emulator. Aborting.',
  );
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: 'crowdbeats-emulator' });
}

const db = admin.firestore();
const now = new Date().toISOString();
const future6h = new Date(Date.now() + 6 * 3_600_000).toISOString();
const past1h = new Date(Date.now() - 1 * 3_600_000).toISOString();
const future90d = new Date(Date.now() + 90 * 86_400_000).toISOString();

// ─── Venue coordinates ────────────────────────────────────────────────────────
const VENUE_A_LAT = 33.8358;
const VENUE_A_LNG = -118.3406;
const VENUE_B_LAT = 33.9425;
const VENUE_B_LNG = -118.4081;

async function seedAll(): Promise<void> {
  console.log('🌱 Seeding Crowdbeats Emulator fixtures...\n');

  await seedVenues();
  await seedArtistProfiles();
  await seedBands();
  await seedSessions();
  await seedAudienceZones();
  await seedConsentReceipts();
  await seedLocationAuditEvents();

  console.log('\n✅ Seed complete.');
}

// ── Venues ────────────────────────────────────────────────────────────────────

async function seedVenues(): Promise<void> {
  const venues = [
    {
      venueId: 'venue_torrance_jazz',
      name: 'Torrance Jazz House',
      address: { city: 'Torrance', state: 'CA', country: 'US' },
      lat: VENUE_A_LAT,
      lng: VENUE_A_LNG,
      geohash5: encodeGeohash(VENUE_A_LAT, VENUE_A_LNG, 5),
      geofenceRadiusMeters: 200,
      isActive: true,
      location: new admin.firestore.GeoPoint(VENUE_A_LAT, VENUE_A_LNG),
      createdAt: now,
      updatedAt: now,
    },
    {
      venueId: 'venue_culver_blues',
      name: 'Culver Blues Bar',
      address: { city: 'Culver City', state: 'CA', country: 'US' },
      lat: VENUE_B_LAT,
      lng: VENUE_B_LNG,
      geohash5: encodeGeohash(VENUE_B_LAT, VENUE_B_LNG, 5),
      geofenceRadiusMeters: 150,
      isActive: true,
      location: new admin.firestore.GeoPoint(VENUE_B_LAT, VENUE_B_LNG),
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const v of venues) {
    await db.collection('venues').doc(v.venueId).set(v);
  }
  console.log('  ✓ venues (2)');
}

// ── Artist profiles ───────────────────────────────────────────────────────────

async function seedArtistProfiles(): Promise<void> {
  const artists = [
    {
      artistId: 'artist_solo_live',
      stageName: 'Maria S.',
      genres: ['jazz', 'soul'],
      isLive: true,
      isActive: true,
      currentSessionId: 'sess_solo_live',
      popularityScore: 88,
      trendingScore: 72,
      createdAt: now,
    },
    {
      artistId: 'artist_solo_offline',
      stageName: 'Keyboardist K.',
      genres: ['blues'],
      isLive: false,
      isActive: true,
      popularityScore: 55,
      trendingScore: 40,
      createdAt: now,
    },
    {
      artistId: 'artist_unauthorized',
      stageName: 'Uninvited U.',
      genres: ['pop'],
      isLive: false,
      isActive: false, // suspended
      popularityScore: 10,
      trendingScore: 5,
      createdAt: now,
    },
  ];
  for (const a of artists) {
    await db.collection('artistProfiles').doc(a.artistId).set(a);
  }
  console.log('  ✓ artistProfiles (3)');
}

// ── Band profiles ─────────────────────────────────────────────────────────────

async function seedBands(): Promise<void> {
  const bands = [
    {
      bandId: 'band_live',
      name: 'The Blue Notes',
      genres: ['jazz', 'blues'],
      memberCount: 4,
      isLive: true,
      isActive: true,
      currentSessionId: 'sess_band_live',
      popularityScore: 95,
      trendingScore: 85,
      createdAt: now,
    },
    {
      bandId: 'band_offline',
      name: 'Silent Strings',
      genres: ['folk'],
      memberCount: 3,
      isLive: false,
      isActive: true,
      popularityScore: 60,
      trendingScore: 50,
      createdAt: now,
    },
  ];
  for (const b of bands) {
    await db.collection('bands').doc(b.bandId).set(b);
  }
  console.log('  ✓ bands (2)');
}

// ── Sessions + private subcollections ────────────────────────────────────────

async function seedSessions(): Promise<void> {
  const gh5A = encodeGeohash(VENUE_A_LAT, VENUE_A_LNG, 5);
  const gh5B = encodeGeohash(VENUE_B_LAT, VENUE_B_LNG, 5);

  // ── Fresh venue session (LIVE_STATIONARY) ─────────────────────────────────
  await db.collection('sessions').doc('sess_solo_live').set({
    sessionId: 'sess_solo_live',
    performerId: 'artist_solo_live',
    performerName: 'Maria S.',
    performerType: 'artist',
    status: 'live',
    locationType: 'venue',
    lat: VENUE_A_LAT,       // venue canonical pin
    lng: VENUE_A_LNG,
    geohash5: gh5A,
    venueId: 'venue_torrance_jazz',
    venueName: 'Torrance Jazz House',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    endsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 6 * 3_600_000)),
    lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHeartbeatSeq: 0,
    heartbeatCount: 0,
    v: 1,
  });

  // Private location document (server-only; tests prove subcollection exists)
  await db.collection('sessions').doc('sess_solo_live')
    .collection('private').doc('location').set({
      sessionId: 'sess_solo_live',
      performerId: 'artist_solo_live',
      lat: VENUE_A_LAT,
      lng: VENUE_A_LNG,
      geohash9: encodeGeohash(VENUE_A_LAT, VENUE_A_LNG, 9),
      geohash7: encodeGeohash(VENUE_A_LAT, VENUE_A_LNG, 7),
      geohash5: gh5A,
      isMockRejected: false,
      accuracyMeters: 8,
      idempotencyKey: 'seed_idem_001',
      capturedAt: now,
    });

  // Audience grant for solo session (individual tier)
  await db.collection('sessions').doc('sess_solo_live')
    .collection('audienceGrants').doc('grant_001').set({
      grantId: 'grant_001',
      sessionId: 'sess_solo_live',
      performerId: 'artist_solo_live',
      grantRef: 'opaque_ref_fan_a',  // NOT the fan UID
      tier: 'individual_session',
      approxGeohash7: computeApproxGeohash7(VENUE_A_LAT + 0.001, VENUE_A_LNG + 0.001),
      grantedAt: now,
      expiresAt: future6h,
    });

  // ── Stale / expired session ─────────────────────────────────────────────
  await db.collection('sessions').doc('sess_expired').set({
    sessionId: 'sess_expired',
    performerId: 'artist_solo_offline',
    performerName: 'Keyboardist K.',
    performerType: 'artist',
    status: 'expired',
    locationType: 'venue',
    lat: VENUE_B_LAT,
    lng: VENUE_B_LNG,
    geohash5: gh5B,
    venueId: 'venue_culver_blues',
    venueName: 'Culver Blues Bar',
    startedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 9 * 3_600_000)),
    endsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 3_600_000)),
    endedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHeartbeatAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 3_600_000)),
    lastHeartbeatSeq: 5,
    heartbeatCount: 5,
    v: 1,
  });

  // ── Live stationary band session ────────────────────────────────────────
  await db.collection('sessions').doc('sess_band_live').set({
    sessionId: 'sess_band_live',
    performerId: 'band_live',
    performerName: 'The Blue Notes',
    performerType: 'band',
    status: 'live',
    locationType: 'venue',
    lat: VENUE_A_LAT,
    lng: VENUE_A_LNG,
    geohash5: gh5A,
    venueId: 'venue_torrance_jazz',
    venueName: 'Torrance Jazz House',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    endsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 4 * 3_600_000)),
    lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHeartbeatSeq: 2,
    heartbeatCount: 2,
    v: 1,
  });

  // Aggregate-tier audience grant for band session
  await db.collection('sessions').doc('sess_band_live')
    .collection('audienceGrants').doc('grant_002').set({
      grantId: 'grant_002',
      sessionId: 'sess_band_live',
      performerId: 'band_live',
      grantRef: 'opaque_ref_fan_b',
      tier: 'aggregate',
      zoneGeohash5: gh5A,
      grantedAt: now,
      expiresAt: future6h,
    });

  // ── Approximate mobile session (LIVE_MOBILE equivalent) ─────────────────
  const streetLat = 33.8370;
  const streetLng = -118.3420;
  const gh7street = computeApproxGeohash7(streetLat, streetLng);
  const { lat: pinLat, lng: pinLng } = decodeGeohash(gh7street);

  await db.collection('sessions').doc('sess_mobile_live').set({
    sessionId: 'sess_mobile_live',
    performerId: 'artist_solo_live', // reuse profile for simplicity
    performerName: 'Maria S. (Street)',
    performerType: 'artist',
    status: 'live',
    locationType: 'street',
    lat: pinLat,   // geohash-7 centroid — NOT device GPS
    lng: pinLng,
    geohash5: encodeGeohash(pinLat, pinLng, 5),
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    endsAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 3_600_000)),
    lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHeartbeatSeq: 1,
    heartbeatCount: 1,
    v: 1,
  });

  console.log('  ✓ sessions (4: live-venue ×2, expired, mobile-street) + private subcollections + grants');
}

// ── Audience zones ────────────────────────────────────────────────────────────

async function seedAudienceZones(): Promise<void> {
  const gh5 = encodeGeohash(VENUE_A_LAT, VENUE_A_LNG, 5);

  // Above threshold (published)
  await db.collection('audienceZones').doc('zone_001').set({
    zoneId: 'zone_001',
    sessionId: 'sess_solo_live',
    performerId: 'artist_solo_live',
    geohash5: gh5,
    countBand: '[5-14]',  // rawCount=7; above threshold of 5
    aggregatedAtMs: Date.now(),
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  });

  // Below threshold (suppressed — zone doc should NOT exist in real code;
  // included here so tests can assert the threshold rule explicitly)
  await db.collection('audienceZones').doc('zone_suppressed').set({
    zoneId: 'zone_suppressed',
    sessionId: 'sess_band_live',
    performerId: 'band_live',
    geohash5: encodeGeohash(VENUE_B_LAT, VENUE_B_LNG, 5),
    countBand: '[1-4]',   // rawCount=3; below threshold — marked for suppression test
    _suppressed: true,    // test annotation; not part of production schema
    aggregatedAtMs: Date.now(),
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  });

  console.log('  ✓ audienceZones (2: above-threshold, below-threshold)');
}

// ── Consent receipts ──────────────────────────────────────────────────────────

async function seedConsentReceipts(): Promise<void> {
  await db.collection('users').doc('fan_a')
    .collection('consentReceipts').doc('rcpt_001').set({
      receiptId: 'rcpt_001',
      fanUid: 'fan_a',
      sessionId: 'sess_solo_live',
      performerId: 'artist_solo_live',
      tier: 'individual_session',
      action: 'granted',
      grantId: 'grant_001',
      createdAt: now,
      expiresAt: future90d,
    });
  console.log('  ✓ consentReceipts (1)');
}

// ── Location audit events ────────────────────────────────────────────────────

async function seedLocationAuditEvents(): Promise<void> {
  const events = [
    {
      eventId: 'lae_seed_001',
      sessionId: 'sess_solo_live',
      performerId: 'artist_solo_live',
      action: 'session_started',
      outcome: 'success',
      coarseGeohash5: encodeGeohash(VENUE_A_LAT, VENUE_A_LNG, 5),
      correlationId: 'seed_corr_001',
      createdAt: now,
      platform: 'ios',
      v: 1,
    },
    {
      eventId: 'lae_seed_002',
      sessionId: 'sess_expired',
      performerId: 'artist_solo_offline',
      action: 'session_expired',
      outcome: 'success',
      correlationId: 'seed_corr_002',
      createdAt: past1h,
      platform: 'server',
      v: 1,
    },
    {
      eventId: 'lae_seed_003',
      performerId: 'artist_unauthorized',
      action: 'session_started',
      outcome: 'rejected',
      rejectionReason: 'mock_gps_rejected',
      correlationId: 'seed_corr_003',
      createdAt: now,
      platform: 'android',
      v: 1,
    },
  ];
  for (const e of events) {
    await db.collection('locationAuditEvents').doc(e.eventId).set(e);
  }
  console.log('  ✓ locationAuditEvents (3)');
}

// ── Run ───────────────────────────────────────────────────────────────────────

seedAll().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
