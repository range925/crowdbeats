/**
 * Crowdbeats V2 — Repeat Offender & Disciplinary Strike Service Tests (Phase 7 Compliance)
 *
 * Unit tests verifying:
 * 1. Strike 1: issues formal warning without pausing monetization.
 * 2. Strike 2: triggers monetization restriction (LIMITED) and compliance hold.
 * 3. Strike 3: triggers 30-day account suspension and full demonetization.
 * 4. Strike 4: triggers permanent platform termination.
 * 5. Zero-tolerance violations (CSAM/terrorism) immediately trigger permanent termination.
 * 6. Strike resolution on appeal restores account standing.
 * 7. Repeat offender status evaluation correctly reports restrictions.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  StrikeTier,
  StrikeStatus,
  ModerationRiskCategory,
} from '@crowdbeats/contracts';

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
    collection: (subCol: string) => mockCollection(`${cId}/${docId}/${subCol}`),
  };
};

const mockCollection = (colPath: string) => ({
  doc: (dId?: string) => _mockDoc(colPath, dId),
  where: (field: string, op: string, value: any) => ({
    where: (f2: string, op2: string, v2: any) => ({
      get: jest.fn().mockImplementation(async () => {
        const docs: any[] = [];
        for (const [key, val] of Object.entries(store)) {
          if (key.startsWith(`${colPath}/`) && val[field] === value && val[f2] === v2) {
            const docId = key.split('/').pop();
            docs.push({ id: docId, data: () => val });
          }
        }
        return { empty: docs.length === 0, docs };
      }),
    }),
    get: jest.fn().mockImplementation(async () => {
      const docs: any[] = [];
      for (const [key, val] of Object.entries(store)) {
        if (key.startsWith(`${colPath}/`) && val[field] === value) {
          const docId = key.split('/').pop();
          docs.push({ id: docId, data: () => val });
        }
      }
      return { empty: docs.length === 0, docs };
    }),
  }),
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
const {
  issueStrike,
  resolveStrike,
  evaluateRepeatOffenderStatus,
} = require('../strikeService');

describe('Repeat Offender & Disciplinary Strike Engine (Phase 7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);

    store['users/creator_1'] = {
      uid: 'creator_1',
      displayName: 'DJ Pulse',
      isSuspended: false,
      monetizationStatus: 'ACTIVE',
      complianceHold: false,
    };
    store['artistProfiles/creator_1'] = {
      artistId: 'creator_1',
      monetizationStatus: 'ACTIVE',
      isActive: true,
    };
  });

  it('issues Strike 1 as a formal warning without pausing monetization', async () => {
    const strike = await issueStrike(mockFirestore as any, 'mod_1', {
      targetUid: 'creator_1',
      reason: 'Inappropriate song request note response',
      violationCategory: ModerationRiskCategory.SPAM,
    });

    expect(strike.strikeNumber).toBe(1);
    expect(strike.tier).toBe(StrikeTier.STRIKE_1_WARNING);
    expect(strike.status).toBe(StrikeStatus.ACTIVE);

    const user = store['users/creator_1'];
    expect(user.isSuspended).toBe(false);
    expect(user.monetizationStatus).toBe('ACTIVE');
    expect(user.activeStrikeCount).toBe(1);
  });

  it('issues Strike 2 as a monetization restriction (LIMITED) with payout hold', async () => {
    // Setup existing strike 1
    store['strikes/strike_prev_1'] = {
      strikeId: 'strike_prev_1',
      targetUid: 'creator_1',
      status: StrikeStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      issuedAt: new Date(Date.now() - 86400000).toISOString(),
    };

    const strike = await issueStrike(mockFirestore as any, 'mod_1', {
      targetUid: 'creator_1',
      reason: 'Repeated profanity in tipping feed',
      violationCategory: ModerationRiskCategory.GENERAL_PROFANITY,
    });

    expect(strike.strikeNumber).toBe(2);
    expect(strike.tier).toBe(StrikeTier.STRIKE_2_RESTRICTION);

    const user = store['users/creator_1'];
    expect(user.monetizationStatus).toBe('LIMITED');
    expect(user.complianceHold).toBe(true);
    expect(user.payoutHoldReason).toBe('STRIKE_2_RESTRICTION');
  });

  it('issues Strike 3 as a 30-day account suspension and demonetization', async () => {
    // Setup existing 2 strikes
    store['strikes/s1'] = { targetUid: 'creator_1', status: StrikeStatus.ACTIVE, expiresAt: new Date(Date.now() + 86400000).toISOString(), issuedAt: new Date().toISOString() };
    store['strikes/s2'] = { targetUid: 'creator_1', status: StrikeStatus.ACTIVE, expiresAt: new Date(Date.now() + 86400000).toISOString(), issuedAt: new Date().toISOString() };

    const strike = await issueStrike(mockFirestore as any, 'mod_1', {
      targetUid: 'creator_1',
      reason: 'Harassment of audience member in chat',
      violationCategory: ModerationRiskCategory.HATE_SPEECH_HARASSMENT,
    });

    expect(strike.strikeNumber).toBe(3);
    expect(strike.tier).toBe(StrikeTier.STRIKE_3_SUSPENSION);

    const user = store['users/creator_1'];
    expect(user.isSuspended).toBe(true);
    expect(user.monetizationStatus).toBe('DEMONETIZED');
    expect(user.complianceHold).toBe(true);
  });

  it('issues Strike 4 as permanent platform termination', async () => {
    // Setup existing 3 strikes
    store['strikes/s1'] = { targetUid: 'creator_1', status: StrikeStatus.ACTIVE, expiresAt: new Date(Date.now() + 86400000).toISOString(), issuedAt: new Date().toISOString() };
    store['strikes/s2'] = { targetUid: 'creator_1', status: StrikeStatus.ACTIVE, expiresAt: new Date(Date.now() + 86400000).toISOString(), issuedAt: new Date().toISOString() };
    store['strikes/s3'] = { targetUid: 'creator_1', status: StrikeStatus.ACTIVE, expiresAt: new Date(Date.now() + 86400000).toISOString(), issuedAt: new Date().toISOString() };

    const strike = await issueStrike(mockFirestore as any, 'mod_1', {
      targetUid: 'creator_1',
      reason: 'Persistent copyright infringement',
      violationCategory: ModerationRiskCategory.COPYRIGHT_INFRINGEMENT,
    });

    expect(strike.strikeNumber).toBe(4);
    expect(strike.tier).toBe(StrikeTier.STRIKE_4_TERMINATION);

    const user = store['users/creator_1'];
    expect(user.isSuspended).toBe(true);
    expect(user.deletedAt).toBe('SERVER_TS');
    expect(user.monetizationStatus).toBe('TERMINATED');
  });

  it('immediately triggers ZERO_TOLERANCE_BAN for CSAM/terrorism', async () => {
    const strike = await issueStrike(mockFirestore as any, 'mod_1', {
      targetUid: 'creator_1',
      reason: 'Zero-tolerance CSAM violation',
      violationCategory: ModerationRiskCategory.CSAM_CSAE,
    });

    expect(strike.tier).toBe(StrikeTier.ZERO_TOLERANCE_BAN);

    const user = store['users/creator_1'];
    expect(user.isSuspended).toBe(true);
    expect(user.deletedAt).toBe('SERVER_TS');
    expect(user.monetizationStatus).toBe('TERMINATED');
  });

  it('resolves strike on appeal and restores account standing', async () => {
    store['strikes/strike_to_appeal'] = {
      strikeId: 'strike_to_appeal',
      targetUid: 'creator_1',
      tier: StrikeTier.STRIKE_2_RESTRICTION,
      status: StrikeStatus.ACTIVE,
    };

    await resolveStrike(mockFirestore as any, 'mod_lead_1', {
      strikeId: 'strike_to_appeal',
      resolution: 'REVERSED_ON_APPEAL',
      notes: 'Legitimate cover song license confirmed by label.',
    });

    expect(store['strikes/strike_to_appeal'].status).toBe('REVERSED_ON_APPEAL');
    const user = store['users/creator_1'];
    expect(user.complianceHold).toBe(false);
    expect(user.monetizationStatus).toBe('ACTIVE');
  });

  it('evaluates repeat offender status accurately', async () => {
    store['strikes/s1'] = {
      strikeId: 's1',
      targetUid: 'creator_1',
      tier: StrikeTier.STRIKE_1_WARNING,
      status: StrikeStatus.ACTIVE,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const evaluation = await evaluateRepeatOffenderStatus(mockFirestore as any, 'creator_1');
    expect(evaluation.activeStrikeCount).toBe(1);
    expect(evaluation.currentTier).toBe(StrikeTier.STRIKE_1_WARNING);
    expect(evaluation.canMonetize).toBe(true);
  });
});
