/**
 * Crowdbeats V2 — Location & Session Security Rules Tests (Phase 7)
 *
 * Verifies all 15 security posture requirements:
 * 1. Fan bounded public presence reads (live + unexpired only; operational telemetry private)
 * 2. Creator reads own session status; client writes denied
 * 3. Public presence writes are server-only
 * 4. Private audience signals readable only by granting Fan; creators denied direct read
 * 5. Creator audience zones readable only by authorized session performer, unexpired only
 * 6. Individual audience grants immediately inaccessible on revoke, expiry, or bidirectional block
 * 7. Tipping records client writes strictly denied
 * 8. Location audit events client access denied (Admin SDK only)
 * 9. Check-in attempts readable by caller/performer only, client writes denied
 */

import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

const FIRESTORE_RULES = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
const PROJECT_ID = 'crowdbeats-v2-dev';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: FIRESTORE_RULES,
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

function asUser(uid: string, claims?: Record<string, unknown>) {
  return testEnv.authenticatedContext(uid, {
    email_verified: true,
    ...claims,
  });
}

function asFan(uid: string) {
  return asUser(uid, { personaType: 'fan' });
}

function asArtist(uid: string) {
  return asUser(uid, { personaType: 'artist' });
}

function asSupport(uid: string) {
  return asUser(uid, { platformRole: 'CUSTOMER_SUPPORT', personaType: 'staff' });
}

async function seedDoc(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

describe('Phase 7 — Live Sessions & Public Presence Rules', () => {
  const futureTime = new Date(Date.now() + 3600 * 1000);
  const pastTime = new Date(Date.now() - 3600 * 1000);

  test('✅ Fan can read active, unexpired live session', async () => {
    await seedDoc('sessions/session-live-01', {
      sessionId: 'session-live-01',
      performerId: 'artist-01',
      status: 'live',
      endsAt: Timestamp.fromDate(futureTime),
      publicLat: 37.7749,
      publicLng: -122.4194,
    });

    const fanCtx = asFan('fan-01');
    const snap = await assertSucceeds(getDoc(doc(fanCtx.firestore(), 'sessions/session-live-01')));
    expect(snap.exists()).toBe(true);
  });

  test('❌ Fan cannot read session when status is not live (e.g. ended or draft)', async () => {
    await seedDoc('sessions/session-ended-01', {
      sessionId: 'session-ended-01',
      performerId: 'artist-01',
      status: 'ended',
      endsAt: Timestamp.fromDate(futureTime),
    });

    const fanCtx = asFan('fan-01');
    await assertFails(getDoc(doc(fanCtx.firestore(), 'sessions/session-ended-01')));
  });

  test('❌ Fan cannot read session when endsAt has expired', async () => {
    await seedDoc('sessions/session-expired-01', {
      sessionId: 'session-expired-01',
      performerId: 'artist-01',
      status: 'live',
      endsAt: Timestamp.fromDate(pastTime),
    });

    const fanCtx = asFan('fan-01');
    await assertFails(getDoc(doc(fanCtx.firestore(), 'sessions/session-expired-01')));
  });

  test('✅ Creator can read own session status even if ended', async () => {
    await seedDoc('sessions/session-ended-02', {
      sessionId: 'session-ended-02',
      performerId: 'artist-01',
      status: 'ended',
      endsAt: Timestamp.fromDate(pastTime),
    });

    const artistCtx = asArtist('artist-01');
    const snap = await assertSucceeds(getDoc(doc(artistCtx.firestore(), 'sessions/session-ended-02')));
    expect(snap.exists()).toBe(true);
  });

  test('❌ Creator cannot read another creator’s ended session', async () => {
    await seedDoc('sessions/session-ended-03', {
      sessionId: 'session-ended-03',
      performerId: 'artist-02',
      status: 'ended',
      endsAt: Timestamp.fromDate(pastTime),
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(getDoc(doc(artistCtx.firestore(), 'sessions/session-ended-03')));
  });

  test('❌ Client writes to sessions are strictly blocked (server-only writes)', async () => {
    const artistCtx = asArtist('artist-01');
    await assertFails(
      setDoc(doc(artistCtx.firestore(), 'sessions/session-client-write'), {
        sessionId: 'session-client-write',
        performerId: 'artist-01',
        status: 'live',
        endsAt: Timestamp.fromDate(futureTime),
      }),
    );
  });

  test('❌ No client can read private operational location telemetry', async () => {
    await seedDoc('sessions/session-live-01/private/location', {
      exactLat: 37.77492,
      exactLng: -122.41941,
    });

    const fanCtx = asFan('fan-01');
    const artistCtx = asArtist('artist-01');
    await assertFails(getDoc(doc(fanCtx.firestore(), 'sessions/session-live-01/private/location')));
    await assertFails(getDoc(doc(artistCtx.firestore(), 'sessions/session-live-01/private/location')));
  });
});

describe('Phase 7 — Private Audience Signals & Anti-Triangulation Rules', () => {
  test('✅ Granting fan can read own private audience signal', async () => {
    await seedDoc('privateAudienceSignals/sig-fan-01', {
      signalId: 'sig-fan-01',
      fanUid: 'fan-01',
      sessionId: 'session-live-01',
      coarseGeohash5: '9q8yy',
    });

    const fanCtx = asFan('fan-01');
    const snap = await assertSucceeds(getDoc(doc(fanCtx.firestore(), 'privateAudienceSignals/sig-fan-01')));
    expect(snap.exists()).toBe(true);
  });

  test('❌ Creator cannot read private audience signal directly', async () => {
    await seedDoc('privateAudienceSignals/sig-fan-02', {
      signalId: 'sig-fan-02',
      fanUid: 'fan-02',
      sessionId: 'session-live-01',
      coarseGeohash5: '9q8yy',
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(getDoc(doc(artistCtx.firestore(), 'privateAudienceSignals/sig-fan-02')));
  });

  test('❌ Other fan cannot read someone else’s private audience signal', async () => {
    await seedDoc('privateAudienceSignals/sig-fan-03', {
      signalId: 'sig-fan-03',
      fanUid: 'fan-03',
      sessionId: 'session-live-01',
    });

    const fanBob = asFan('fan-bob');
    await assertFails(getDoc(doc(fanBob.firestore(), 'privateAudienceSignals/sig-fan-03')));
  });

  test('❌ Client writes to privateAudienceSignals are denied', async () => {
    const fanCtx = asFan('fan-01');
    await assertFails(
      setDoc(doc(fanCtx.firestore(), 'privateAudienceSignals/sig-forge'), {
        signalId: 'sig-forge',
        fanUid: 'fan-01',
      }),
    );
  });
});

describe('Phase 7 — Creator Audience Zones Rules', () => {
  const futureTime = new Date(Date.now() + 1800 * 1000);
  const pastTime = new Date(Date.now() - 1800 * 1000);

  test('✅ Authorized performer can read unexpired audience zone', async () => {
    await seedDoc('audienceZones/zone-01', {
      zoneId: 'zone-01',
      sessionId: 'session-live-01',
      performerId: 'artist-01',
      countBand: '[5-14]',
      expiresAt: Timestamp.fromDate(futureTime),
    });

    const artistCtx = asArtist('artist-01');
    const snap = await assertSucceeds(getDoc(doc(artistCtx.firestore(), 'audienceZones/zone-01')));
    expect(snap.exists()).toBe(true);
  });

  test('❌ Performer cannot read expired audience zone', async () => {
    await seedDoc('audienceZones/zone-expired', {
      zoneId: 'zone-expired',
      sessionId: 'session-live-01',
      performerId: 'artist-01',
      countBand: '[5-14]',
      expiresAt: Timestamp.fromDate(pastTime),
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(getDoc(doc(artistCtx.firestore(), 'audienceZones/zone-expired')));
  });

  test('❌ Fan or non-performer cannot read audience zones', async () => {
    await seedDoc('audienceZones/zone-02', {
      zoneId: 'zone-02',
      sessionId: 'session-live-01',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(futureTime),
    });

    const fanCtx = asFan('fan-01');
    const otherArtist = asArtist('artist-other');
    await assertFails(getDoc(doc(fanCtx.firestore(), 'audienceZones/zone-02')));
    await assertFails(getDoc(doc(otherArtist.firestore(), 'audienceZones/zone-02')));
  });

  test('❌ Direct client writes to audienceZones are blocked', async () => {
    const artistCtx = asArtist('artist-01');
    await assertFails(
      setDoc(doc(artistCtx.firestore(), 'audienceZones/zone-forge'), {
        zoneId: 'zone-forge',
        performerId: 'artist-01',
        expiresAt: Timestamp.fromDate(futureTime),
      }),
    );
  });
});

describe('Phase 7 — Audience Visibility Grants & Invalidation Rules', () => {
  const futureTime = new Date(Date.now() + 3600 * 1000);
  const pastTime = new Date(Date.now() - 3600 * 1000);

  test('✅ Granting fan can read own grant', async () => {
    await seedDoc('sessions/session-01/audienceGrants/grant-01', {
      grantId: 'grant-01',
      sessionId: 'session-01',
      fanUid: 'fan-alice',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(futureTime),
    });

    const fanCtx = asFan('fan-alice');
    const snap = await assertSucceeds(
      getDoc(doc(fanCtx.firestore(), 'sessions/session-01/audienceGrants/grant-01')),
    );
    expect(snap.exists()).toBe(true);
  });

  test('✅ Performer can read active, unexpired, unrevoked grant from unblocked fan', async () => {
    await seedDoc('sessions/session-01/audienceGrants/grant-02', {
      grantId: 'grant-02',
      sessionId: 'session-01',
      fanUid: 'fan-bob',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(futureTime),
    });

    const artistCtx = asArtist('artist-01');
    const snap = await assertSucceeds(
      getDoc(doc(artistCtx.firestore(), 'sessions/session-01/audienceGrants/grant-02')),
    );
    expect(snap.exists()).toBe(true);
  });

  test('❌ Performer cannot read revoked grant', async () => {
    await seedDoc('sessions/session-01/audienceGrants/grant-revoked', {
      grantId: 'grant-revoked',
      sessionId: 'session-01',
      fanUid: 'fan-charlie',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(futureTime),
      revokedAt: Timestamp.now(),
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(
      getDoc(doc(artistCtx.firestore(), 'sessions/session-01/audienceGrants/grant-revoked')),
    );
  });

  test('❌ Performer cannot read expired grant', async () => {
    await seedDoc('sessions/session-01/audienceGrants/grant-expired', {
      grantId: 'grant-expired',
      sessionId: 'session-01',
      fanUid: 'fan-dave',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(pastTime),
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(
      getDoc(doc(artistCtx.firestore(), 'sessions/session-01/audienceGrants/grant-expired')),
    );
  });

  test('❌ Performer cannot read grant if performer blocked fan', async () => {
    await seedDoc('users/artist-01/blockedUsers/fan-blocked', { blockedAt: Timestamp.now() });
    await seedDoc('sessions/session-01/audienceGrants/grant-blocked-1', {
      grantId: 'grant-blocked-1',
      sessionId: 'session-01',
      fanUid: 'fan-blocked',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(futureTime),
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(
      getDoc(doc(artistCtx.firestore(), 'sessions/session-01/audienceGrants/grant-blocked-1')),
    );
  });

  test('❌ Performer cannot read grant if fan blocked performer', async () => {
    await seedDoc('users/fan-blocking/blockedUsers/artist-01', { blockedAt: Timestamp.now() });
    await seedDoc('sessions/session-01/audienceGrants/grant-blocked-2', {
      grantId: 'grant-blocked-2',
      sessionId: 'session-01',
      fanUid: 'fan-blocking',
      performerId: 'artist-01',
      expiresAt: Timestamp.fromDate(futureTime),
    });

    const artistCtx = asArtist('artist-01');
    await assertFails(
      getDoc(doc(artistCtx.firestore(), 'sessions/session-01/audienceGrants/grant-blocked-2')),
    );
  });
});

describe('Phase 7 — Check-In Attempts, Audit Events, & Tips Rules', () => {
  test('✅ Caller can inspect own checkInAttempt', async () => {
    await seedDoc('checkInAttempts/attempt-01', {
      checkInAttemptId: 'attempt-01',
      callerUid: 'user-performer-01',
      performerId: 'artist-01',
      status: 'verified',
    });

    const ctx = asUser('user-performer-01');
    const snap = await assertSucceeds(getDoc(doc(ctx.firestore(), 'checkInAttempts/attempt-01')));
    expect(snap.exists()).toBe(true);
  });

  test('❌ Other user cannot inspect checkInAttempt', async () => {
    await seedDoc('checkInAttempts/attempt-02', {
      checkInAttemptId: 'attempt-02',
      callerUid: 'user-performer-01',
      performerId: 'artist-01',
      status: 'verified',
    });

    const intruder = asUser('user-intruder');
    await assertFails(getDoc(doc(intruder.firestore(), 'checkInAttempts/attempt-02')));
  });

  test('❌ Client writes to checkInAttempts are denied', async () => {
    const ctx = asUser('user-performer-01');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'checkInAttempts/attempt-fake'), {
        checkInAttemptId: 'attempt-fake',
        callerUid: 'user-performer-01',
        status: 'verified',
      }),
    );
  });

  test('❌ Location audit events cannot be read or written by clients (Admin SDK only)', async () => {
    await seedDoc('locationAuditEvents/event-01', {
      performerId: 'artist-01',
      action: 'session_started',
    });

    const fanDb = asFan('fan-01').firestore();
    const artistDb = asArtist('artist-01').firestore();
    const supportDb = asSupport('staff-01').firestore();

    await assertFails(getDoc(doc(fanDb, 'locationAuditEvents/event-01')));
    await assertFails(getDoc(doc(artistDb, 'locationAuditEvents/event-01')));
    await assertFails(getDoc(doc(supportDb, 'locationAuditEvents/event-01')));

    await assertFails(
      setDoc(doc(artistDb, 'locationAuditEvents/event-fake'), {
        action: 'tampered',
      }),
    );
  });

  test('❌ Tips collection: client writes strictly denied (cannot forge or inject location consent)', async () => {
    const fanCtx = asFan('fan-01');
    await assertFails(
      setDoc(doc(fanCtx.firestore(), 'tips/tip-forged'), {
        tipId: 'tip-forged',
        fanUid: 'fan-01',
        recipientId: 'artist-01',
        amountCents: 500,
        locationConsentGranted: true, // Attempted location consent injection
      }),
    );
  });
});
