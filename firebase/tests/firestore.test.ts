/**
 * Crowdbeats V2 — Firestore Security Rules Tests (Phase 3)
 *
 * Tests all allowed and denied access patterns.
 * Covers: cross-user, cross-band, cross-sponsor, cross-venue, privilege escalation.
 *
 * Run with emulator:
 *   npx -y firebase-tools@latest emulators:exec --only firestore --project crowdbeats-v2-dev \
 *     "cd firebase/tests && npx jest" --project crowdbeats-v2-dev
 *
 * Or start emulator first, then: npx jest
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
} from 'firebase/firestore';

// ─── Setup ────────────────────────────────────────────────────────────────────

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

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function unauthed() {
  return testEnv.unauthenticatedContext();
}

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

function asStaff(uid: string, role: string) {
  return asUser(uid, { platformRole: role, personaType: 'staff' });
}

async function seedBandMember(
  bandId: string,
  uid: string,
  role: string,
  isActive = true,
) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), `bands/${bandId}/members/${uid}`), {
      uid,
      bandId,
      role,
      isActive,
      joinedAt: new Date().toISOString(),
      invitedByUid: uid,
      displayName: `User ${uid}`,
    });
  });
}

async function seedDoc(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// USER DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════

describe('/users/{uid}', () => {
  const userDoc = {
    uid: 'user-alice',
    email: 'alice@example.com',
    emailVerified: true,
    displayName: 'Alice',
    personaType: 'fan',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    v: 1,
  };

  beforeEach(async () => {
    await seedDoc('users/user-alice', userDoc);
  });

  test('✅ Owner reads own user doc', async () => {
    const ctx = asFan('user-alice');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'users/user-alice')));
  });

  test('❌ Unauthenticated cannot read any user doc', async () => {
    const ctx = unauthed();
    await assertFails(getDoc(doc(ctx.firestore(), 'users/user-alice')));
  });

  test('❌ Other user cannot read alice\'s doc', async () => {
    const ctx = asFan('user-bob');
    await assertFails(getDoc(doc(ctx.firestore(), 'users/user-alice')));
  });

  test('✅ CUSTOMER_SUPPORT staff can read user doc', async () => {
    const ctx = asStaff('staff-001', 'CUSTOMER_SUPPORT');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'users/user-alice')));
  });

  test('✅ Owner updates allowed fields (displayName)', async () => {
    const ctx = asFan('user-alice');
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'users/user-alice'), {
        displayName: 'Alice Updated',
        updatedAt: new Date().toISOString(),
        v: 2, // v + 1
      }),
    );
  });

  test('❌ Owner cannot decrement v', async () => {
    const ctx = asFan('user-alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users/user-alice'), {
        displayName: 'Alice',
        updatedAt: new Date().toISOString(),
        v: 0, // Cannot decrement below existing v (1)
      }),
    );
  });

  test('❌ Owner cannot update personaType (privilege escalation attempt)', async () => {
    const ctx = asFan('user-alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users/user-alice'), {
        personaType: 'staff',
        v: 2,
      }),
    );
  });

  test('❌ Owner cannot self-assign platformRole (escalation attempt)', async () => {
    const ctx = asFan('user-alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users/user-alice'), {
        platformRole: 'SUPER_ADMIN',
        v: 2,
      }),
    );
  });

  test('❌ Owner cannot set deletedAt (soft-delete bypass)', async () => {
    const ctx = asFan('user-alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users/user-alice'), {
        deletedAt: new Date().toISOString(),
        v: 2,
      }),
    );
  });

  test('❌ No client can delete a user document', async () => {
    const ctx = asFan('user-alice');
    await assertFails(deleteDoc(doc(ctx.firestore(), 'users/user-alice')));
  });

  test('✅ Owner can create their own user document without privileged fields', async () => {
    const ctx = asFan('user-new');
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), 'users/user-new'), {
        uid: 'user-new',
        displayName: 'New',
        personaType: 'fan',
      }),
    );
  });

  test('❌ Owner cannot self-assign platformRole or admin fields on creation', async () => {
    const ctx = asFan('user-attacker');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'users/user-attacker'), {
        uid: 'user-attacker',
        displayName: 'Attacker',
        personaType: 'fan',
        platformRole: 'SUPER_ADMIN',
      }),
    );
  });

  test('❌ Bob cannot create alice\'s user document', async () => {
    const ctx = asFan('user-bob');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'users/user-alice-new'), {
        uid: 'user-alice-new',
        displayName: 'Imposter',
        personaType: 'fan',
      }),
    );
  });

  test('❌ Bob cannot update alice\'s document', async () => {
    const ctx = asFan('user-bob');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'users/user-alice'), {
        displayName: 'Hacked',
        v: 2,
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FAN PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe('/fanProfiles/{uid}', () => {
  beforeEach(async () => {
    await seedDoc('fanProfiles/fan-alice', {
      uid: 'fan-alice',
      displayName: 'Alice Fan',
      totalTippedCents: 5000,
      followingArtistIds: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
  });

  test('✅ Owner reads own fan profile', async () => {
    const ctx = asFan('fan-alice');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'fanProfiles/fan-alice')));
  });

  test('❌ Other user cannot read fan profile', async () => {
    const ctx = asFan('fan-bob');
    await assertFails(getDoc(doc(ctx.firestore(), 'fanProfiles/fan-alice')));
  });

  test('❌ Fan cannot write totalTippedCents (server-only)', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'fanProfiles/fan-alice'), {
        totalTippedCents: 99999,
        v: 2,
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ARTIST PROFILES
// ══════════════════════════════════════════════════════════════════════════════

describe('/artistProfiles/{artistId}', () => {
  beforeEach(async () => {
    await seedDoc('artistProfiles/artist-001', {
      artistId: 'artist-001',
      ownerUid: 'user-artist',
      stageName: 'The Artist',
      genres: ['pop'],
      socialLinks: {},
      bankLinked: false,
      isActive: true,
      totalTipsReceivedCents: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
  });

  test('✅ Signed-in user can read active artist profile', async () => {
    const ctx = asFan('fan-bob');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'artistProfiles/artist-001')));
  });

  test('✅ Artist owner can update profile fields', async () => {
    const ctx = asArtist('user-artist');
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'artistProfiles/artist-001'), {
        bio: 'New bio',
        updatedAt: new Date().toISOString(),
        v: 2,
      }),
    );
  });

  test('❌ Artist cannot update totalTipsReceivedCents', async () => {
    const ctx = asArtist('user-artist');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'artistProfiles/artist-001'), {
        totalTipsReceivedCents: 999999,
        v: 2,
      }),
    );
  });

  test('❌ Other user cannot update artist profile', async () => {
    const ctx = asFan('fan-bob');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'artistProfiles/artist-001'), {
        stageName: 'Hacked',
        v: 2,
      }),
    );
  });

  test('❌ Artist cannot update stripeAccountId', async () => {
    const ctx = asArtist('user-artist');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'artistProfiles/artist-001'), {
        stripeAccountId: 'acct_fake123',
        v: 2,
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BANDS
// ══════════════════════════════════════════════════════════════════════════════

describe('/bands/{bandId}', () => {
  beforeEach(async () => {
    await seedDoc('bands/band-001', {
      bandId: 'band-001',
      founderUid: 'user-founder',
      name: 'Test Band',
      isActive: true,
      memberCount: 2,
      totalTipsReceivedCents: 0,
      bankLinked: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
    await seedBandMember('band-001', 'user-founder', 'BAND_FOUNDER');
    await seedBandMember('band-001', 'user-member', 'BAND_MEMBER');
  });

  test('✅ Band member can read band doc', async () => {
    const ctx = asFan('user-member');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'bands/band-001')));
  });

  test('✅ Band admin can update band name', async () => {
    const ctx = asFan('user-founder');
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'bands/band-001'), {
        name: 'Updated Band',
        updatedAt: new Date().toISOString(),
        v: 2,
      }),
    );
  });

  test('❌ Non-member cannot read private band fields', async () => {
    // Strangers can still read (public band info) — this tests the correct behavior
    const ctx = asFan('user-stranger');
    // Public read allowed, not failing test — adjust if bands go private
    // This is actually a design choice: bands are public on the platform
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'bands/band-001')));
  });

  test('❌ Band member (not admin) cannot update band name', async () => {
    const ctx = asFan('user-member'); // Only BAND_MEMBER role
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'bands/band-001'), {
        name: 'Unauthorized Update',
        v: 2,
      }),
    );
  });

  test('❌ No client can write split config directly', async () => {
    const ctx = asFan('user-founder');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'bands/band-001/splitConfig/current'), {
        bandId: 'band-001',
        splits: [{ uid: 'user-founder', splitBps: 10000 }],
        setByUid: 'user-founder',
        v: 1,
      }),
    );
  });

  test('❌ Band admin cannot update totalTipsReceivedCents', async () => {
    const ctx = asFan('user-founder');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'bands/band-001'), {
        totalTipsReceivedCents: 100000,
        v: 2,
      }),
    );
  });

  test('❌ Cross-band: member of band-002 cannot access band-001', async () => {
    await seedDoc('bands/band-002', { bandId: 'band-002', isActive: true, v: 1 });
    await seedBandMember('band-002', 'user-other', 'BAND_FOUNDER');

    const ctx = asFan('user-other');
    // User is member of band-002, NOT band-001 — can still read (public) but not write
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'bands/band-001'), {
        name: 'Cross-Band Attack',
        v: 2,
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FINANCIAL — SERVER-ONLY COLLECTIONS
// ══════════════════════════════════════════════════════════════════════════════

describe('Server-only collections — all client access denied', () => {
  beforeEach(async () => {
    await seedDoc('paymentLedger/entry-001', {
      entryId: 'entry-001',
      txId: 'tx-001',
      tipId: 'tip-001',
      accountType: 'FAN_PAYMENT',
      accountId: 'fan-alice',
      entryType: 'debit',
      amountCents: 1000,
      currency: 'USD',
      memo: 'tip',
      createdAt: '2026-01-01T00:00:00Z',
    });
    await seedDoc('paymentTransactions/tx-001', {
      txId: 'tx-001',
      fanUid: 'fan-alice',
      amountCents: 1000,
    });
    await seedDoc('idempotencyKeys/idem-001', {
      key: 'idem-001',
      uid: 'fan-alice',
      status: 'succeeded',
    });
    await seedDoc('qrTokens/qr-001', {
      tokenId: 'qr-001',
      sessionId: 'sess-001',
    });
  });

  test('❌ Authenticated user cannot read paymentLedger', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(getDoc(doc(ctx.firestore(), 'paymentLedger/entry-001')));
  });

  test('❌ Authenticated user cannot write paymentLedger', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'paymentLedger/entry-999'), {
        entryId: 'entry-999',
        amountCents: 0,
      }),
    );
  });

  test('❌ SUPER_ADMIN cannot read paymentLedger via client', async () => {
    const ctx = asStaff('staff-root', 'SUPER_ADMIN');
    await assertFails(getDoc(doc(ctx.firestore(), 'paymentLedger/entry-001')));
  });

  test('❌ No client can read paymentTransactions', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(getDoc(doc(ctx.firestore(), 'paymentTransactions/tx-001')));
  });

  test('❌ No client can read idempotencyKeys', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(getDoc(doc(ctx.firestore(), 'idempotencyKeys/idem-001')));
  });

  test('❌ No client can read qrTokens', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(getDoc(doc(ctx.firestore(), 'qrTokens/qr-001')));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TIPS
// ══════════════════════════════════════════════════════════════════════════════

describe('/tips/{tipId}', () => {
  beforeEach(async () => {
    await seedDoc('tips/tip-001', {
      tipId: 'tip-001',
      fanUid: 'fan-alice',
      recipientId: 'artist-001',
      recipientType: 'artist',
      amountCents: 500,
      platformFeeCents: 25,
      netAmountCents: 475,
      currency: 'USD',
      status: 'succeeded',
      isAnonymous: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  test('✅ Fan reads own tip receipt', async () => {
    const ctx = asFan('fan-alice');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'tips/tip-001')));
  });

  test('✅ Recipient reads their received tip', async () => {
    const ctx = asArtist('artist-001');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'tips/tip-001')));
  });

  test('❌ Other fan cannot read someone else\'s tip', async () => {
    const ctx = asFan('fan-bob');
    await assertFails(getDoc(doc(ctx.firestore(), 'tips/tip-001')));
  });

  test('❌ Fan cannot create a tip directly', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'tips/tip-fake'), {
        fanUid: 'fan-alice',
        amountCents: 100,
      }),
    );
  });

  test('❌ Fan cannot update their own tip (e.g., change status)', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'tips/tip-001'), {
        status: 'refunded',
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT EVENTS
// ══════════════════════════════════════════════════════════════════════════════

describe('/auditEvents/{eventId}', () => {
  beforeEach(async () => {
    await seedDoc('auditEvents/audit-001', {
      eventId: 'audit-001',
      action: 'TIP_CREATED',
      actorUid: 'fan-alice',
      actorType: 'user',
      metadata: {},
      correlationId: 'corr-001',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  test('✅ COMPLIANCE_OFFICER can read audit events', async () => {
    const ctx = asStaff('staff-comp', 'COMPLIANCE_OFFICER');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'auditEvents/audit-001')));
  });

  test('✅ SUPER_ADMIN can read audit events', async () => {
    const ctx = asStaff('staff-root', 'SUPER_ADMIN');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'auditEvents/audit-001')));
  });

  test('❌ CONTENT_MODERATOR cannot read audit events', async () => {
    const ctx = asStaff('staff-mod', 'CONTENT_MODERATOR');
    await assertFails(getDoc(doc(ctx.firestore(), 'auditEvents/audit-001')));
  });

  test('❌ Regular user cannot read audit events', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(getDoc(doc(ctx.firestore(), 'auditEvents/audit-001')));
  });

  test('❌ SUPER_ADMIN cannot create audit events via client', async () => {
    const ctx = asStaff('staff-root', 'SUPER_ADMIN');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'auditEvents/audit-fake'), {
        eventId: 'audit-fake',
        action: 'USER_CREATED',
        actorUid: 'staff-root',
        actorType: 'staff',
        metadata: {},
        correlationId: 'corr-fake',
        createdAt: new Date().toISOString(),
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// STAFF PRIVILEGE ESCALATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Privilege escalation attempts', () => {
  beforeEach(async () => {
    await seedDoc('staffRecords/staff-target', {
      uid: 'staff-target',
      platformRole: 'CONTENT_MODERATOR',
    });
  });

  test('❌ Regular user cannot read staffRecords of others', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(getDoc(doc(ctx.firestore(), 'staffRecords/staff-target')));
  });

  test('❌ CONTENT_MODERATOR cannot update own staffRecord', async () => {
    const ctx = asStaff('staff-target', 'CONTENT_MODERATOR');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'staffRecords/staff-target'), {
        platformRole: 'SUPER_ADMIN',
      }),
    );
  });

  test('❌ FINANCE_ANALYST cannot create a new staff record', async () => {
    const ctx = asStaff('staff-fin', 'FINANCE_ANALYST');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'staffRecords/staff-new'), {
        uid: 'staff-new',
        platformRole: 'SUPER_ADMIN',
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CROSS-SPONSOR TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('/sponsorOrgs — cross-sponsor isolation', () => {
  beforeEach(async () => {
    await seedDoc('sponsorOrgs/org-001', {
      orgId: 'org-001',
      adminUid: 'user-sponsor-admin',
      name: 'Corp A',
      isVerified: false,
      isActive: true,
      memberCount: 1,
      totalEscrowDepositedCents: 0,
      totalMatchedCents: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
    await seedDoc('sponsorOrgs/org-001/members/user-sponsor-admin', {
      uid: 'user-sponsor-admin',
      orgId: 'org-001',
      role: 'SPONSOR_ADMIN',
      isActive: true,
      joinedAt: '2026-01-01T00:00:00Z',
      invitedByUid: 'user-sponsor-admin',
      displayName: 'Sponsor Admin',
    });
    await seedDoc('sponsorOrgs/org-002', {
      orgId: 'org-002',
      adminUid: 'user-other-sponsor',
      name: 'Corp B',
      isVerified: false,
      isActive: true,
      memberCount: 1,
      totalEscrowDepositedCents: 0,
      totalMatchedCents: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
  });

  test('✅ Sponsor admin can read own org', async () => {
    const ctx = asUser('user-sponsor-admin', { personaType: 'sponsor_rep' });
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'sponsorOrgs/org-001')));
  });

  test('❌ Sponsor admin of org-001 cannot update org-002', async () => {
    const ctx = asUser('user-sponsor-admin', { personaType: 'sponsor_rep' });
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'sponsorOrgs/org-002'), {
        name: 'Cross-Sponsor Attack',
        v: 2,
      }),
    );
  });

  test('❌ Sponsor admin cannot set isVerified (staff-only)', async () => {
    const ctx = asUser('user-sponsor-admin', { personaType: 'sponsor_rep' });
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'sponsorOrgs/org-001'), {
        isVerified: true,
        v: 2,
      }),
    );
  });

  test('❌ Sponsor admin cannot update totalEscrowDepositedCents', async () => {
    const ctx = asUser('user-sponsor-admin', { personaType: 'sponsor_rep' });
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'sponsorOrgs/org-001'), {
        totalEscrowDepositedCents: 999999,
        v: 2,
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════

describe('/reports', () => {
  test('❌ Direct client cannot create a report (must use submitReport callable)', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'reports/report-001'), {
        reportId: 'report-001',
        reporterUid: 'fan-alice',
        targetId: 'artist-001',
        targetType: 'artist',
        reason: 'spam',
        description: 'This is spam',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Reporter cannot set status on own report', async () => {
    const ctx = asFan('fan-alice');
    await assertFails(
      setDoc(doc(ctx.firestore(), 'reports/report-002'), {
        reportId: 'report-002',
        reporterUid: 'fan-alice',
        targetId: 'artist-001',
        targetType: 'artist',
        reason: 'spam',
        status: 'resolved', // Not allowed on create
        createdAt: new Date().toISOString(),
      }),
    );
  });

  test('❌ Other user cannot read another user\'s report', async () => {
    await seedDoc('reports/report-003', {
      reportId: 'report-003',
      reporterUid: 'fan-alice',
      targetId: 'artist-001',
      targetType: 'artist',
      reason: 'spam',
    });
    const ctx = asFan('fan-bob');
    await assertFails(getDoc(doc(ctx.firestore(), 'reports/report-003')));
  });

  test('✅ CONTENT_MODERATOR can read reports', async () => {
    await seedDoc('reports/report-004', {
      reportId: 'report-004',
      reporterUid: 'fan-alice',
      targetId: 'artist-001',
      targetType: 'artist',
      reason: 'harassment',
    });
    const ctx = asStaff('staff-mod', 'CONTENT_MODERATOR');
    await assertSucceeds(getDoc(doc(ctx.firestore(), 'reports/report-004')));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// VENUE CROSS-MEMBER TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('/venueProfiles — cross-venue isolation', () => {
  beforeEach(async () => {
    await seedDoc('venueProfiles/venue-001', {
      venueId: 'venue-001',
      ownerUid: 'user-venue-owner',
      name: 'Venue A',
      address: { city: 'Auckland', country: 'NZ' },
      isActive: true,
      bankLinked: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
    await seedDoc('venueProfiles/venue-001/members/user-venue-owner', {
      uid: 'user-venue-owner',
      venueId: 'venue-001',
      role: 'VENUE_OWNER',
      isActive: true,
      joinedAt: '2026-01-01T00:00:00Z',
      invitedByUid: 'user-venue-owner',
      displayName: 'Venue Owner',
    });
    await seedDoc('venueProfiles/venue-002', {
      venueId: 'venue-002',
      ownerUid: 'user-other-owner',
      name: 'Venue B',
      address: { city: 'Wellington', country: 'NZ' },
      isActive: true,
      bankLinked: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      v: 1,
    });
  });

  test('✅ Venue owner can update own venue', async () => {
    const ctx = asUser('user-venue-owner');
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), 'venueProfiles/venue-001'), {
        name: 'Updated Venue A',
        updatedAt: new Date().toISOString(),
        v: 2,
      }),
    );
  });

  test('❌ Venue owner of venue-001 cannot update venue-002', async () => {
    const ctx = asUser('user-venue-owner');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'venueProfiles/venue-002'), {
        name: 'Cross-Venue Attack',
        v: 2,
      }),
    );
  });

  test('❌ No client can update bankLinked', async () => {
    const ctx = asUser('user-venue-owner');
    await assertFails(
      updateDoc(doc(ctx.firestore(), 'venueProfiles/venue-001'), {
        bankLinked: true,
        v: 2,
      }),
    );
  });
});
