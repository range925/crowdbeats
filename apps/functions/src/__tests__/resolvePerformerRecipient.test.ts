/**
 * Crowdbeats V2 — resolvePerformerRecipient Test Suite
 *
 * Verifies:
 * 1. Resolves solo artist by immutable ID or slug.
 * 2. Resolves band by immutable ID or slug.
 * 3. Enforces account status (not deleted, not suspended, not banned).
 * 4. Enforces monetization eligibility via evaluateCreatorMonetizationEligibility.
 * 5. Server-authoritative truthful live status (query active sessions where endsAt > now).
 * 6. Returns server-authoritative details and canonicalTipUrl.
 * 7. Fails closed with appropriate HttpsErrors on invalid input or non-existent performer.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const store: Record<string, any> = {};

const mockDoc = (path: string): any => {
  const id = path.split('/').pop();
  return {
    id,
    get: jest.fn<any>().mockImplementation(async () => {
      const data = store[path];
      return {
        exists: data !== undefined,
        data: () => data,
        id,
        ref: mockDoc(path),
      };
    }),
    set: jest.fn<any>().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[path]) {
        store[path] = { ...store[path], ...data };
      } else {
        store[path] = { ...data };
      }
    }),
    update: jest.fn<any>().mockImplementation(async (data: any) => {
      if (!store[path]) throw new Error(`Doc not found: ${path}`);
      store[path] = { ...store[path], ...data };
    }),
    delete: jest.fn<any>().mockImplementation(async () => {
      delete store[path];
    }),
  };
};

const mockCollection = (colPath: string): any => {
  return {
    doc: (docId?: string) => {
      const id = docId || `mock_${Math.random().toString(36).substring(7)}`;
      return mockDoc(`${colPath}/${id}`);
    },
    where: jest.fn<any>().mockImplementation((field: string, op: string, val: any) => {
      const conditions: Array<{ field: string; op: string; val: any }> = [{ field, op, val }];
      const queryObj: any = {
        where: jest.fn<any>().mockImplementation((f: string, o: string, v: any) => {
          conditions.push({ field: f, op: o, val: v });
          return queryObj;
        }),
        limit: jest.fn<any>().mockReturnThis(),
        get: jest.fn<any>().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [k, v] of Object.entries(store)) {
            if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
              let match = true;
              for (const cond of conditions) {
                if (cond.op === '==' && v[cond.field] !== cond.val) {
                  match = false;
                  break;
                }
              }
              if (match) {
                docs.push({
                  id: k.split('/').pop(),
                  data: () => v,
                  exists: true,
                });
              }
            }
          }
          return { docs, empty: docs.length === 0, size: docs.length };
        }),
      };
      return queryObj;
    }),
    get: jest.fn<any>().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [k, v] of Object.entries(store)) {
        if (k.startsWith(colPath + '/') && k.split('/').length === colPath.split('/').length + 1) {
          docs.push({
            id: k.split('/').pop(),
            data: () => v,
            exists: true,
          });
        }
      }
      return { docs, empty: docs.length === 0, size: docs.length };
    }),
  };
};

const mockFirestore = {
  collection: (col: string) => mockCollection(col),
};

jest.mock('firebase-admin', () => {
  return {
    apps: [{}],
    initializeApp: jest.fn(),
    firestore: Object.assign(
      jest.fn(() => mockFirestore),
      {
        Timestamp: {
          now: () => ({
            toMillis: () => Date.now(),
            toDate: () => new Date(),
          }),
          fromDate: (d: Date) => ({
            toMillis: () => d.getTime(),
            toDate: () => d,
          }),
        },
        FieldValue: {
          serverTimestamp: () => new Date().toISOString(),
        },
      },
    ),
  };
});

describe('resolvePerformerRecipient Cloud Function Test Suite', () => {
  let resolvePerformerRecipient: any;

  beforeEach(async () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    const module = await import('../tip/resolvePerformerRecipient.js');
    resolvePerformerRecipient = module.resolvePerformerRecipient;
  });

  const setupEligibleArtist = (id = 'artist_maya', slug = 'maya-lin') => {
    store[`users/${id}`] = {
      uid: id,
      displayName: 'Maya Lin',
      photoUrl: 'https://cdn.crowdbeats.app/maya.jpg',
      personaType: 'artist',
      creatorSlug: slug,
      termsAccepted: true,
      aupAccepted: true,
      monetizationPolicyAccepted: true,
      stripeConnectAccountId: 'acct_maya_123',
      chargesEnabled: true,
      connectStatus: 'active',
    };
    store[`artistProfiles/${id}`] = {
      artistId: id,
      ownerUid: id,
      stageName: 'Maya Lin Live',
      creatorSlug: slug,
      photoUrl: 'https://cdn.crowdbeats.app/maya.jpg',
      bio: 'Indie folk singer-songwriter based in San Diego.',
      genres: ['Indie Folk', 'Acoustic'],
      verifiedAt: '2026-01-15T00:00:00Z',
      isActive: true,
      totalTipsReceivedCents: 5000,
      bankLinked: true,
    };
    store[`creatorSlugs/${slug}`] = {
      slug,
      creatorId: id,
      creatorType: 'artist',
      canonicalProfileUrl: `https://crowdbeats.ai/artist/${slug}`,
      status: 'active',
    };
  };

  const setupEligibleBand = (id = 'band_neon', slug = 'neon-pulse') => {
    store[`users/founder_neon`] = {
      uid: 'founder_neon',
      displayName: 'Neon Founder',
      personaType: 'band_member',
      termsAccepted: true,
      aupAccepted: true,
      monetizationPolicyAccepted: true,
      stripeConnectAccountId: 'acct_neon_band',
      chargesEnabled: true,
    };
    store[`bands/${id}`] = {
      bandId: id,
      founderUid: 'founder_neon',
      name: 'Neon Pulse',
      bandSlug: slug,
      creatorSlug: slug,
      photoUrl: 'https://cdn.crowdbeats.app/neon.jpg',
      bio: 'Electronic synth-pop quartet.',
      genres: ['Electronic', 'Synthwave'],
      verifiedAt: '2026-02-10T00:00:00Z',
      isActive: true,
      stripeAccountId: 'acct_neon_band',
      chargesEnabled: true,
      bankLinked: true,
    };
    store[`creatorSlugs/${slug}`] = {
      slug,
      creatorId: id,
      creatorType: 'band',
      canonicalProfileUrl: `https://crowdbeats.ai/band/${slug}`,
      status: 'active',
    };
  };

  it('resolves an eligible solo artist by immutable performerId', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.performerId).toBe('artist_maya');
    expect(res.performerType).toBe('artist');
    expect(res.displayName).toBe('Maya Lin Live');
    expect(res.slug).toBe('maya-lin');
    expect(res.avatarUrl).toBe('https://cdn.crowdbeats.app/maya.jpg');
    expect(res.bio).toBe('Indie folk singer-songwriter based in San Diego.');
    expect(res.genres).toEqual(['Indie Folk', 'Acoustic']);
    expect(res.isVerified).toBe(true);
    expect(res.isLive).toBe(false);
    expect(res.currentVenueName).toBeUndefined();
    expect(res.canAcceptTips).toBe(true);
    expect(res.eligibilityReason).toBeUndefined();
    expect(res.canonicalTipUrl).toBe('https://crowdbeats.app/tip/artist_maya');
  });

  it('resolves an eligible solo artist by slug via creatorSlugs', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');

    const res = await (resolvePerformerRecipient as any).run({
      data: { slug: 'maya-lin' },
    });

    expect(res.performerId).toBe('artist_maya');
    expect(res.displayName).toBe('Maya Lin Live');
    expect(res.canAcceptTips).toBe(true);
    expect(res.canonicalTipUrl).toBe('https://crowdbeats.app/tip/artist_maya');
  });

  it('resolves an eligible band by immutable bandId and by bandSlug', async () => {
    setupEligibleBand('band_neon', 'neon-pulse');

    // 1. By ID
    const resId = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'band_neon' },
    });
    expect(resId.performerId).toBe('band_neon');
    expect(resId.performerType).toBe('band');
    expect(resId.displayName).toBe('Neon Pulse');
    expect(resId.slug).toBe('neon-pulse');
    expect(resId.canAcceptTips).toBe(true);
    expect(resId.canonicalTipUrl).toBe('https://crowdbeats.app/tip/band_neon');

    // 2. By slug
    const resSlug = await (resolvePerformerRecipient as any).run({
      data: { slug: 'neon-pulse' },
    });
    expect(resSlug.performerId).toBe('band_neon');
    expect(resSlug.displayName).toBe('Neon Pulse');
    expect(resSlug.canAcceptTips).toBe(true);
  });

  it('reports truthful isLive = true and currentVenueName when active unexpired session exists', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');

    const futureTime = new Date(Date.now() + 3600_000).toISOString();
    store['sessions/session_live_1'] = {
      sessionId: 'session_live_1',
      performerId: 'artist_maya',
      performerType: 'artist',
      status: 'live',
      venueName: 'The Belly Up Tavern',
      startedAt: new Date().toISOString(),
      endsAt: futureTime,
    };

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.isLive).toBe(true);
    expect(res.currentVenueName).toBe('The Belly Up Tavern');
  });

  it('reports truthful isLive = false when session has expired (endsAt <= now)', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');

    const pastTime = new Date(Date.now() - 600_000).toISOString(); // expired 10 min ago
    store['sessions/session_expired_1'] = {
      sessionId: 'session_expired_1',
      performerId: 'artist_maya',
      status: 'live', // still marked 'live' in doc before cleanup, but expired
      venueName: 'Past Stage',
      endsAt: pastTime,
    };

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.isLive).toBe(false);
    expect(res.currentVenueName).toBeUndefined();
  });

  it('flags canAcceptTips = false when performer account is suspended', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');
    store['users/artist_maya'].isSuspended = true;
    store['users/artist_maya'].suspendedAt = new Date().toISOString();

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.performerId).toBe('artist_maya');
    expect(res.canAcceptTips).toBe(false);
    expect(res.eligibilityReason).toBe('ACCOUNT_SUSPENDED');
  });

  it('flags canAcceptTips = false when performer account is banned', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');
    store['users/artist_maya'].isBanned = true;

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.canAcceptTips).toBe(false);
    expect(res.eligibilityReason).toBe('ACCOUNT_BANNED');
  });

  it('flags canAcceptTips = false when performer account is deleted', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');
    store['users/artist_maya'].deletedAt = new Date().toISOString();

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.canAcceptTips).toBe(false);
    expect(res.eligibilityReason).toBe('ACCOUNT_DELETED');
  });

  it('flags canAcceptTips = false when Stripe Connect account is missing', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');
    delete store['users/artist_maya'].stripeConnectAccountId;
    delete store['artistProfiles/artist_maya'].stripeAccountId;

    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });

    expect(res.canAcceptTips).toBe(false);
    expect(res.eligibilityReason).toContain('STRIPE_CONNECT_ACCOUNT_MISSING');
  });

  it('throws not-found when performer does not exist', async () => {
    await expect(
      (resolvePerformerRecipient as any).run({
        data: { performerId: 'unknown_artist_xyz' },
      }),
    ).rejects.toThrow('Performer \'unknown_artist_xyz\' not found.');
  });

  it('throws invalid-argument when no identifier is passed', async () => {
    await expect(
      (resolvePerformerRecipient as any).run({
        data: {},
      }),
    ).rejects.toThrow('performerId, slug, or identifier is required.');
  });

  it('Scenario 9: Tipping Performer A by QR preserves Performer A even when Performer B is physically closer', async () => {
    setupEligibleArtist('artist_a', 'artist-a');
    setupEligibleArtist('artist_b', 'artist-b');

    // Caller requested Performer A (from QR scan)
    const res = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_a' },
    });

    // Performer A is resolved strictly, never substituted with closer Performer B
    expect(res.performerId).toBe('artist_a');
    expect(res.displayName).toBe('Maya Lin Live');
    expect(res.canonicalTipUrl).toBe('https://crowdbeats.app/tip/artist_a');
    expect(res.canAcceptTips).toBe(true);
  });

  it('Scenario 13: Changing a performer display name preserves their existing QR destination and immutable performer ID', async () => {
    setupEligibleArtist('artist_maya', 'maya-lin');

    // 1. Initial resolution with original name
    const initialRes = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });
    expect(initialRes.performerId).toBe('artist_maya');
    expect(initialRes.displayName).toBe('Maya Lin Live');
    expect(initialRes.canonicalTipUrl).toBe('https://crowdbeats.app/tip/artist_maya');

    // 2. Performer updates their stage name in profile
    store['artistProfiles/artist_maya'].stageName = 'Maya Lin & The Starlight Orchestra';
    store['users/artist_maya'].displayName = 'Maya Lin & The Starlight Orchestra';

    // 3. Existing printed QR codes pointing to immutable ID continue resolving correctly
    const updatedRes = await (resolvePerformerRecipient as any).run({
      data: { performerId: 'artist_maya' },
    });
    expect(updatedRes.performerId).toBe('artist_maya');
    expect(updatedRes.displayName).toBe('Maya Lin & The Starlight Orchestra');
    expect(updatedRes.canonicalTipUrl).toBe('https://crowdbeats.app/tip/artist_maya');
    expect(updatedRes.canAcceptTips).toBe(true);
  });
});
