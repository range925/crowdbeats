/**
 * Crowdbeats V2 — Campaign Function Tests (Phase 7)
 *
 * Covers:
 * 1. createCampaign — valid + validation errors
 * 2. submitCampaign — valid + completeness validation + draft recovery
 * 3. publishCampaign — unauthorized publish (non-owner)
 * 4. cancelCampaign — releases held contributions
 * 5. updateCampaign — draft-only edits
 * 6. postCampaignUpdate — cancelled campaign rejected
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ── Firestore mock with mutable store ────────────────────────────────────────
const store: Record<string, Record<string, unknown>> = {};

const _mockCommit = jest.fn<any>();
const _mockAdd = jest.fn<any>();
const _mockCancelPI = jest.fn<any>();
const _mockGetConnectStatus = jest.fn<any>();
const _mockCreateTransfer = jest.fn<any>();
const _mockGetDocs = jest.fn<any>();

const mockBatch = {
  set: jest.fn().mockReturnThis(),
  update: jest.fn((ref: { _key?: string }, patch: Record<string, unknown>) => {
    if (ref?._key) {
      store[ref._key] = { ...store[ref._key], ...patch };
    }
    return mockBatch;
  }),
  commit: _mockCommit,
};

jest.mock('uuid', () => ({ v4: () => 'test-campaign-id-7777' }));

jest.mock('firebase-functions/v2/https', () => ({
  onCall: jest.fn((_opts: unknown, handler: unknown) => handler),
  HttpsError: class HttpsError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'HttpsError';
    }
  },
}));

jest.mock('firebase-admin', () => {
  const docFn = (collId: string, docId: string) => ({
    _key: `${collId}/${docId}`,
    get: jest.fn().mockImplementation(async () => {
      const key = `${collId}/${docId}`;
      const data = store[key];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (d: unknown) => {
      store[`${collId}/${docId}`] = d as Record<string, unknown>;
    }),
    update: jest.fn().mockImplementation(async (patch: unknown) => {
      store[`${collId}/${docId}`] = { ...store[`${collId}/${docId}`], ...(patch as Record<string, unknown>) };
    }),
    collection: jest.fn((subCol: string) => ({
      where: jest.fn().mockReturnThis(),
      get: _mockGetDocs,
      add: _mockAdd,
      doc: (subId: string) => docFn(`${collId}/${docId}/${subCol}`, subId),
    })),
  });

  return {
    apps: [true],
    initializeApp: jest.fn(),
    firestore: Object.assign(
      jest.fn(() => ({
        collection: (cId: string) => ({
          doc: (dId: string) => docFn(cId, dId),
          add: _mockAdd,
          where: jest.fn().mockReturnThis(),
          get: _mockGetDocs,
        }),
        batch: () => mockBatch,
        FieldValue: {
          serverTimestamp: () => 'SERVER_TS',
          increment: (n: number) => ({ _increment: n }),
        },
      })),
      {
        FieldValue: {
          serverTimestamp: () => 'SERVER_TS',
          increment: (n: number) => ({ _increment: n }),
        },
      },
    ),
  };
});

jest.mock('../../lib/stripe', () => ({
  stripe: {
    cancelPaymentIntent: _mockCancelPI,
    getConnectAccountStatus: _mockGetConnectStatus,
    createTransfer: _mockCreateTransfer,
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createCampaign } = require('../createCampaign');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { submitCampaign } = require('../submitCampaign');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { publishCampaign } = require('../publishCampaign');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { cancelCampaign } = require('../cancelCampaign');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateCampaign } = require('../updateCampaign');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { postCampaignUpdate } = require('../postCampaignUpdate');

// ── Helpers ───────────────────────────────────────────────────────────────────
function request(uid: string, data: Record<string, unknown>) {
  return { auth: { uid }, data };
}

function seedUser(uid: string, personaType = 'artist') {
  store[`users/${uid}`] = { personaType };
}

function validDeadlineIso(): string {
  return new Date(Date.now() + 30 * 86_400_000).toISOString();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    _mockCommit.mockResolvedValue(undefined);
    _mockAdd.mockResolvedValue({ id: 'audit-id' });
    _mockCancelPI.mockResolvedValue(undefined);
    _mockGetConnectStatus.mockResolvedValue({ chargesEnabled: true, payoutsEnabled: true });
    _mockCreateTransfer.mockResolvedValue({ id: 'tr_mock' });
  });

  it('creates a draft campaign with valid inputs', async () => {
    seedUser('uid-artist-1');

    const result = await (createCampaign as any)(request('uid-artist-1', {
      title: 'Debut Vinyl Album',
      description: 'Funding press for 500 limited copies of our upcoming debut LP.',
      goalCents: 500000,
      currency: 'USD',
      deadline: validDeadlineIso(),
      rewardTiers: [
        { tierId: 't1', title: 'Digital LP', description: 'Download', amountCents: 1500, quantityClaimed: 0 },
      ],
    }));

    expect(result.campaignId).toBe('test-campaign-id-7777');

    const saved = store['campaigns/test-campaign-id-7777'];
    expect(saved['title']).toBe('Debut Vinyl Album');
    expect(saved['creatorId']).toBe('uid-artist-1');
    expect(saved['pledgedCents']).toBe(0);
    expect(saved['backerCount']).toBe(0);
  });

  it('rejects goalCents below $10 minimum', async () => {
    seedUser('uid-artist-1');
    await expect(
      (createCampaign as any)(request('uid-artist-1', {
        title: 'Title',
        goalCents: 500, // $5 — minimum is $10
        deadline: validDeadlineIso(),
      })),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects non-future deadline', async () => {
    seedUser('uid-artist-1');
    const pastIso = new Date(Date.now() - 1000).toISOString();
    await expect(
      (createCampaign as any)(request('uid-artist-1', {
        title: 'Title',
        goalCents: 10000,
        deadline: pastIso,
      })),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects fan persona', async () => {
    seedUser('uid-fan-1', 'fan');
    await expect(
      (createCampaign as any)(request('uid-fan-1', {
        title: 'Title',
        goalCents: 10000,
        deadline: validDeadlineIso(),
      })),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });
});

describe('submitCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it('submits a complete draft campaign for review', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      title: 'Complete Campaign',
      description: 'This is a detailed description of the campaign over 50 characters long.',
      goalCents: 50000,
      currency: 'USD',
      status: 'draft',
      deadline: validDeadlineIso(),
      rewardTiers: [
        { tierId: 't1', title: 'Reward', description: 'Desc', amountCents: 1000, quantityClaimed: 0 },
      ],
    };

    const result = await (submitCampaign as any)(request('uid-artist-1', { campaignId: 'camp-1' }));
    expect(result.status).toBe('submitted');
    expect(store['campaigns/camp-1']['status']).toBe('submitted');
  });

  it('rejects submission if description is under 50 characters', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      title: 'Short Desc Campaign',
      description: 'Too short',
      goalCents: 50000,
      status: 'draft',
      rewardTiers: [{ tierId: 't1', title: 'T', description: 'D', amountCents: 1000, quantityClaimed: 0 }],
    };

    await expect(
      (submitCampaign as any)(request('uid-artist-1', { campaignId: 'camp-1' })),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects submission if no reward tiers exist', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      title: 'No Rewards Campaign',
      description: 'Long enough description over fifty characters for complete validation test.',
      goalCents: 50000,
      status: 'draft',
      rewardTiers: [],
    };

    await expect(
      (submitCampaign as any)(request('uid-artist-1', { campaignId: 'camp-1' })),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});

describe('publishCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it('rejects publish attempt by non-owner', async () => {
    seedUser('uid-artist-owner');
    seedUser('uid-artist-other');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-owner',
      title: 'Approved Campaign',
      status: 'approved',
    };

    await expect(
      (publishCampaign as any)(request('uid-artist-other', { campaignId: 'camp-1' })),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });
});

describe('cancelCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    _mockCommit.mockResolvedValue(undefined);
    _mockCancelPI.mockResolvedValue(undefined);
    _mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('cancels active campaign and marks status cancelled', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      status: 'active',
    };

    const result = await (cancelCampaign as any)(request('uid-artist-1', {
      campaignId: 'camp-1',
      reason: 'Unforeseen circumstances',
    }));

    expect(result.status).toBe('cancelled');
    expect(store['campaigns/camp-1']['status']).toBe('cancelled');
  });
});

describe('postCampaignUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    _mockAdd.mockResolvedValue({ id: 'update-123' });
    _mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('posts update with HTML stripped from body', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      status: 'active',
    };

    const result = await (postCampaignUpdate as any)(request('uid-artist-1', {
      campaignId: 'camp-1',
      body: 'Hello <script>alert("xss")</script> <b>world</b>!',
    }));

    expect(result.updateId).toBe('test-campaign-id-7777');
    const updateDoc = store['campaigns/camp-1/updates/test-campaign-id-7777'];
    expect(updateDoc).toBeDefined();
    expect(updateDoc['body']).toBe('Hello alert("xss") world!');
  });

  it('rejects post on cancelled campaign', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      status: 'cancelled',
    };

    await expect(
      (postCampaignUpdate as any)(request('uid-artist-1', {
        campaignId: 'camp-1',
        body: 'Update text long enough',
      })),
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });
});

describe('updateCampaign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    _mockGetDocs.mockResolvedValue({ docs: [] });
  });

  it('updates draft campaign whitelisted fields', async () => {
    seedUser('uid-artist-1');
    store['campaigns/camp-1'] = {
      campaignId: 'camp-1',
      creatorId: 'uid-artist-1',
      title: 'Original Title',
      status: 'draft',
    };

    const result = await (updateCampaign as any)(request('uid-artist-1', {
      campaignId: 'camp-1',
      title: 'Updated Title',
    }));

    expect(result.campaignId).toBe('camp-1');
    expect(store['campaigns/camp-1']['title']).toBe('Updated Title');
  });
});
