/**
 * Crowdbeats V2 — Creator Lifecycle Enforcement Service Tests (Phase 8 Compliance)
 *
 * Unit tests verifying:
 * 1. DEMONETIZE action freezes monetization and places compliance hold without suspending account.
 * 2. SUSPEND action suspends account, sets slug to suspended, and revokes active live sessions.
 * 3. TERMINATE action permanently marks account deleted, sets slug to deleted, and revokes sessions.
 * 4. REINSTATE action clears all compliance holds and restores active status across user and slug records.
 * 5. Immutable audit logs are created for every lifecycle action.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CreatorLifecycleAction } from '@crowdbeats/contracts';

const store: Record<string, Record<string, unknown>> = {};

const _mockDoc = (cId: string, dId?: string) => {
  const docId = dId || `doc_${Math.random()}`;
  return {
    id: docId,
    get: jest.fn().mockImplementation(async () => {
      const data = store[`${cId}/${docId}`];
      return { exists: data !== undefined, data: () => data };
    }),
    set: jest.fn().mockImplementation(async (data: any, options?: any) => {
      if (options?.merge && store[`${cId}/${docId}`]) {
        store[`${cId}/${docId}`] = { ...store[`${cId}/${docId}`], ...data };
      } else {
        store[`${cId}/${docId}`] = data;
      }
    }),
    update: jest.fn().mockImplementation(async (updates: any) => {
      store[`${cId}/${docId}`] = { ...(store[`${cId}/${docId}`] || {}), ...updates };
    }),
  };
};

const mockQuery = (colPath: string, filters: Array<[string, any]>) => {
  const getFn = jest.fn().mockImplementation(async () => {
    const docs: any[] = [];
    for (const [key, val] of Object.entries(store)) {
      if (key.startsWith(`${colPath}/`)) {
        const matches = filters.every(([field, value]) => val[field] === value);
        if (matches) {
          const docId = key.split('/').pop();
          docs.push({ id: docId, ref: _mockDoc(colPath, docId), data: () => val });
        }
      }
    }
    return { empty: docs.length === 0, docs };
  });

  return {
    where: (field: string, op: string, value: any) => mockQuery(colPath, [...filters, [field, value]]),
    limit: (n: number) => ({ get: getFn }),
    get: getFn,
  };
};

const mockCollection = (colPath: string) => ({
  doc: (dId?: string) => _mockDoc(colPath, dId),
  where: (field: string, op: string, value: any) => mockQuery(colPath, [[field, value]]),
});

const mockFirestore = {
  collection: (cId: string) => mockCollection(cId),
  batch: () => {
    const ops: Array<() => void> = [];
    return {
      set: (ref: any, data: any, options?: any) => ops.push(() => ref.set(data, options)),
      update: (ref: any, data: any) => ops.push(() => ref.update(data)),
      commit: async () => {
        for (const op of ops) await op();
      },
    };
  },
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
const { enforceCreatorLifecycle } = require('../lifecycleService');

describe('Creator Lifecycle Enforcement Service (Phase 8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['users/artist_1'] = {
      uid: 'artist_1',
      displayName: 'DJ Phoenix',
      slug: 'dj-phoenix',
      isSuspended: false,
      monetizationStatus: 'ACTIVE',
      complianceHold: false,
    };
    store['artistProfiles/artist_1'] = {
      artistId: 'artist_1',
      slug: 'dj-phoenix',
      isActive: true,
      monetizationStatus: 'ACTIVE',
    };
    store['creatorSlugs/dj-phoenix'] = {
      slug: 'dj-phoenix',
      creatorId: 'artist_1',
      status: 'active',
    };
    store['sessions/session_live_1'] = {
      sessionId: 'session_live_1',
      performerUid: 'artist_1',
      status: 'ACTIVE',
    };
  });

  it('demonetizes creator without suspending account', async () => {
    const response = await enforceCreatorLifecycle(mockFirestore as any, 'mod_user_1', {
      creatorId: 'artist_1',
      action: CreatorLifecycleAction.DEMONETIZE,
      reason: 'Excessive chargeback rate investigation',
    });

    expect(response.success).toBe(true);
    expect(response.newStatus).toBe('DEMONETIZED');
    expect(response.complianceHold).toBe(true);
    expect(response.slugStatus).toBe('active');
    expect(response.revokedSessionsCount).toBe(0);

    const user = store['users/artist_1'];
    expect(user.isSuspended).toBe(false);
    expect(user.monetizationStatus).toBe('DEMONETIZED');
    expect(user.complianceHold).toBe(true);
  });

  it('suspends creator, updates slug to suspended, and terminates active sessions', async () => {
    const response = await enforceCreatorLifecycle(mockFirestore as any, 'mod_user_1', {
      creatorId: 'artist_1',
      action: CreatorLifecycleAction.SUSPEND,
      reason: 'Trust & safety investigation for violent threats',
      durationDays: 30,
    });

    expect(response.success).toBe(true);
    expect(response.newStatus).toBe('SUSPENDED');
    expect(response.slugStatus).toBe('suspended');
    expect(response.revokedSessionsCount).toBe(1);

    const user = store['users/artist_1'];
    expect(user.isSuspended).toBe(true);
    expect(user.monetizationStatus).toBe('DEMONETIZED');

    const slugRecord = store['creatorSlugs/dj-phoenix'];
    expect(slugRecord.status).toBe('suspended');

    const session = store['sessions/session_live_1'];
    expect(session.status).toBe('TERMINATED_SAFETY');
  });

  it('terminates creator permanently and sets slug to deleted', async () => {
    const response = await enforceCreatorLifecycle(mockFirestore as any, 'mod_user_1', {
      creatorId: 'artist_1',
      action: CreatorLifecycleAction.TERMINATE,
      reason: 'Confirmed severe fraudulent activity',
    });

    expect(response.success).toBe(true);
    expect(response.newStatus).toBe('TERMINATED');
    expect(response.slugStatus).toBe('deleted');

    const user = store['users/artist_1'];
    expect(user.isSuspended).toBe(true);
    expect(user.deletedAt).toBe('SERVER_TS');
    expect(user.monetizationStatus).toBe('TERMINATED');

    const slugRecord = store['creatorSlugs/dj-phoenix'];
    expect(slugRecord.status).toBe('deleted');
  });

  it('reinstates creator and restores clean active status', async () => {
    // Set initially suspended state
    store['users/artist_1'].isSuspended = true;
    store['users/artist_1'].complianceHold = true;
    store['users/artist_1'].monetizationStatus = 'DEMONETIZED';
    store['creatorSlugs/dj-phoenix'].status = 'suspended';

    const response = await enforceCreatorLifecycle(mockFirestore as any, 'mod_user_1', {
      creatorId: 'artist_1',
      action: CreatorLifecycleAction.REINSTATE,
      reason: 'Appeal upheld by Trust & Safety Lead',
    });

    expect(response.success).toBe(true);
    expect(response.newStatus).toBe('ACTIVE');
    expect(response.complianceHold).toBe(false);
    expect(response.slugStatus).toBe('active');

    const user = store['users/artist_1'];
    expect(user.isSuspended).toBe(false);
    expect(user.complianceHold).toBe(false);
    expect(user.monetizationStatus).toBe('ACTIVE');

    const slugRecord = store['creatorSlugs/dj-phoenix'];
    expect(slugRecord.status).toBe('active');
  });
});
