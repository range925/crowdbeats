/**
 * Crowdbeats V2 — Slug & Canonical URL Service Tests (Phase 2 Compliance)
 *
 * Unit tests verifying:
 * 1. Slug normalization: converts mixed casing, diacritics, and special characters.
 * 2. Reserved word protection: detects reserved slugs and disambiguates them.
 * 3. Canonical URL construction: formats artist and band canonical URLs.
 * 4. Collision avoidance: handles namespace collisions deterministically.
 * 5. Immutable creator ID mapping: 1-to-1 correspondence.
 * 6. Suspended and deleted account resolution: correctly reflects status and blocks false monetization.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  normalizeSlug,
  isReservedSlug,
  buildCanonicalProfileUrl,
} from '@crowdbeats/contracts';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    ref: {
      update: jest.fn().mockImplementation(async (updates: any) => {
        store[`${cId}/${docId}`] = { ...(store[`${cId}/${docId}`] || {}), ...updates };
      }),
    },
    get: jest.fn().mockImplementation(async () => {
      const data = store[`${cId}/${docId}`];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (data: any) => {
      store[`${cId}/${docId}`] = data;
    }),
    update: jest.fn().mockImplementation(async (updates: any) => {
      store[`${cId}/${docId}`] = { ...(store[`${cId}/${docId}`] || {}), ...updates };
    }),
  };
};

const mockFirestore = {
  collection: (cId: string) => ({
    doc: (dId?: string) => _mockDoc(cId, dId),
    where: (field: string, op: string, value: any) => ({
      limit: (n: number) => ({
        get: jest.fn().mockImplementation(async () => {
          const docs: any[] = [];
          for (const [key, val] of Object.entries(store)) {
            if (key.startsWith(`${cId}/`) && val[field] === value) {
              const docId = key.split('/')[1];
              docs.push(_mockDoc(cId, docId));
            }
          }
          return { empty: docs.length === 0, docs };
        }),
      }),
    }),
  }),
  runTransaction: jest.fn().mockImplementation(async (callback: any) => {
    const tx = {
      get: async (ref: any) => ref.get(),
      set: (ref: any, data: any) => {
        ref.set(data);
      },
      update: (ref: any, updates: any) => {
        ref.update(updates);
      },
    };
    return await callback(tx);
  }),
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
};

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: Object.assign(jest.fn(() => mockFirestore), {
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  reserveCreatorSlug,
  resolveCreatorSlug,
  updateCreatorSlugStatus,
} = require('../slugService');

describe('Slug & Canonical URL Engine (Phase 2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  describe('normalizeSlug', () => {
    it('normalizes spaces, special characters, and diacritics', () => {
      expect(normalizeSlug('Café Del Mar & The Groove!')).toBe('cafe-del-mar-the-groove');
      expect(normalizeSlug('  DJ --- Sp!nz 99  ')).toBe('dj-sp-nz-99');
    });

    it('enforces minimum length with fallback', () => {
      expect(normalizeSlug('A')).toBe('creator-a');
      expect(normalizeSlug('')).toBe('creator-unnamed');
    });

    it('truncates excessively long slugs', () => {
      const longName = 'A'.repeat(80);
      const slug = normalizeSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(50);
    });
  });

  describe('isReservedSlug', () => {
    it('identifies system reserved slugs', () => {
      expect(isReservedSlug('admin')).toBe(true);
      expect(isReservedSlug('stripe')).toBe(true);
      expect(isReservedSlug('legal')).toBe(true);
      expect(isReservedSlug('terms')).toBe(true);
      expect(isReservedSlug('john-mayer')).toBe(false);
    });
  });

  describe('buildCanonicalProfileUrl', () => {
    it('constructs correct artist and band canonical URLs', () => {
      expect(buildCanonicalProfileUrl('artist', 'the-weeknd')).toBe('https://crowdbeats.ai/artist/the-weeknd');
      expect(buildCanonicalProfileUrl('band', 'coldplay')).toBe('https://crowdbeats.ai/band/coldplay');
    });
  });

  describe('reserveCreatorSlug', () => {
    it('reserves a new slug and updates user document', async () => {
      store['users/artist-1'] = { personaType: 'artist' };
      store['artistProfiles/artist-1'] = { stageName: 'Luna Bay' };

      const result = await reserveCreatorSlug(mockFirestore as any, {
        creatorId: 'artist-1',
        creatorType: 'artist',
        preferredName: 'Luna Bay',
      });

      expect(result.slug).toBe('luna-bay');
      expect(result.canonicalProfileUrl).toBe('https://crowdbeats.ai/artist/luna-bay');
      expect(store['creatorSlugs/luna-bay']).toBeDefined();
      expect(store['creatorSlugs/luna-bay'].creatorId).toBe('artist-1');
      expect(store['users/artist-1'].creatorSlug).toBe('luna-bay');
    });

    it('disambiguates reserved words automatically', async () => {
      store['users/artist-2'] = { personaType: 'artist' };

      const result = await reserveCreatorSlug(mockFirestore as any, {
        creatorId: 'artist-2',
        creatorType: 'artist',
        preferredName: 'Admin',
      });

      expect(result.slug).toBe('admin-music');
      expect(result.canonicalProfileUrl).toBe('https://crowdbeats.ai/artist/admin-music');
    });

    it('resolves namespace collisions by appending numerical increment', async () => {
      store['creatorSlugs/the-pulse'] = {
        slug: 'the-pulse',
        creatorId: 'band-1',
        creatorType: 'band',
        status: 'active',
      };
      store['users/band-2'] = { personaType: 'band_member' };

      const result = await reserveCreatorSlug(mockFirestore as any, {
        creatorId: 'band-2',
        creatorType: 'band',
        preferredName: 'The Pulse',
      });

      expect(result.slug).toBe('the-pulse-2');
      expect(result.canonicalProfileUrl).toBe('https://crowdbeats.ai/band/the-pulse-2');
    });

    it('reuses existing slug if already owned by same creator', async () => {
      store['creatorSlugs/solo-act'] = {
        slug: 'solo-act',
        creatorId: 'artist-3',
        creatorType: 'artist',
        status: 'active',
      };
      store['users/artist-3'] = { personaType: 'artist' };

      const result = await reserveCreatorSlug(mockFirestore as any, {
        creatorId: 'artist-3',
        creatorType: 'artist',
        preferredName: 'Solo Act',
      });

      expect(result.slug).toBe('solo-act');
    });
  });

  describe('resolveCreatorSlug', () => {
    it('returns found: false when slug does not exist', async () => {
      const res = await resolveCreatorSlug(mockFirestore as any, 'unknown-band');
      expect(res.found).toBe(false);
      expect(res.creatorId).toBeNull();
      expect(res.isMonetizable).toBe(false);
    });

    it('returns active monetizable profile for healthy account', async () => {
      store['creatorSlugs/active-artist'] = {
        slug: 'active-artist',
        creatorId: 'artist-10',
        creatorType: 'artist',
        canonicalProfileUrl: 'https://crowdbeats.ai/artist/active-artist',
        status: 'active',
      };
      store['users/artist-10'] = { personaType: 'artist' };

      const res = await resolveCreatorSlug(mockFirestore as any, 'active-artist');
      expect(res.found).toBe(true);
      expect(res.creatorId).toBe('artist-10');
      expect(res.status).toBe('active');
      expect(res.isMonetizable).toBe(true);
    });

    it('handles suspended account correctly and blocks monetization', async () => {
      store['creatorSlugs/suspended-artist'] = {
        slug: 'suspended-artist',
        creatorId: 'artist-20',
        creatorType: 'artist',
        status: 'active',
      };
      store['users/artist-20'] = { personaType: 'artist', isSuspended: true };

      const res = await resolveCreatorSlug(mockFirestore as any, 'suspended-artist');
      expect(res.found).toBe(true);
      expect(res.status).toBe('suspended');
      expect(res.isMonetizable).toBe(false);
    });

    it('handles deleted account correctly', async () => {
      store['creatorSlugs/deleted-artist'] = {
        slug: 'deleted-artist',
        creatorId: 'artist-30',
        creatorType: 'artist',
        status: 'active',
      };
      store['users/artist-30'] = { personaType: 'artist', deletedAt: 'SERVER_TS' };

      const res = await resolveCreatorSlug(mockFirestore as any, 'deleted-artist');
      expect(res.found).toBe(true);
      expect(res.status).toBe('deleted');
      expect(res.isMonetizable).toBe(false);
    });
  });

  describe('updateCreatorSlugStatus', () => {
    it('updates slug status in Firestore', async () => {
      store['creatorSlugs/artist-slug'] = {
        slug: 'artist-slug',
        creatorId: 'artist-50',
        creatorType: 'artist',
        status: 'active',
      };

      await updateCreatorSlugStatus(mockFirestore as any, 'artist-50', 'suspended');
      expect(store['creatorSlugs/artist-slug'].status).toBe('suspended');
    });
  });
});
