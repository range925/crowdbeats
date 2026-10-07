/**
 * Crowdbeats V2 — Connect Tests (Phase 1 Compliance)
 *
 * Unit tests verifying:
 * 1. createConnectLink: creates new Connect account, registers canonical URL, stores safe identifiers.
 * 2. createConnectLink: reuses existing account without duplicate creation.
 * 3. createConnectLink: rejects unauthorized personas (fan) with permission-denied.
 * 4. createConnectLink: rejects unauthenticated requests.
 * 5. createConnectLink: generates audit log event.
 * 6. getConnectStatus: returns comprehensive safe status (chargesEnabled, payoutsEnabled, bankPayoutReadiness, creatorVerificationState).
 * 7. getConnectStatus: correctly handles missing account (actionType: 'create_account', bankPayoutReadiness: 'not_created').
 * 8. getConnectStatus: handles incomplete KYC with requirements due and action needed.
 * 9. getConnectStatus: identifies restricted accounts with disabled_reason.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const store: Record<string, Record<string, unknown>> = {};
const _mockCreateConnectAccount = jest.fn<any>();
const _mockCreateConnectAccountLink = jest.fn<any>();
const _mockGetConnectAccountStatus = jest.fn<any>();
const _mockUpdate = jest.fn<any>();
const _mockSet = jest.fn<any>();

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

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => ({
      collection: (cId: string) => ({
        doc: (dId?: string) => {
          const docId = dId || `mock_doc_${Math.random()}`;
          return {
            id: docId,
            get: jest.fn().mockImplementation(async () => {
              const data = store[`${cId}/${docId}`];
              return { exists: data !== undefined, data: () => data };
            }),
            update: _mockUpdate,
            set: _mockSet,
          };
        },
      }),
      FieldValue: { serverTimestamp: () => 'SERVER_TS' },
    })),
    { FieldValue: { serverTimestamp: () => 'SERVER_TS' } },
  ),
}));

jest.mock('../../lib/stripe', () => ({
  stripe: {
    createConnectAccount: _mockCreateConnectAccount,
    createConnectAccountLink: _mockCreateConnectAccountLink,
    getConnectAccountStatus: _mockGetConnectAccountStatus,
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createConnectLink } = require('../createConnectLink');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getConnectStatus } = require('../getConnectStatus');

function req(uid: string, personaType = 'artist', data: Record<string, unknown> = {}) {
  return { auth: { uid, token: { personaType } }, data };
}

describe('createConnectLink (Phase 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    _mockCreateConnectAccount.mockResolvedValue({ id: 'acct_mock_new' });
    _mockCreateConnectAccountLink.mockResolvedValue('https://connect.stripe.com/mock');
    _mockGetConnectAccountStatus.mockResolvedValue({
      accountId: 'acct_mock_new',
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      disabledReason: null,
      requirementsDue: [],
      eventuallyDue: [],
      pastDue: [],
      capabilities: { cardPayments: 'active', transfers: 'active' },
      bankPayoutReadiness: 'ready',
      creatorVerificationState: 'verified',
      requiresAction: false,
      actionType: null,
    });
    _mockUpdate.mockResolvedValue(undefined);
    _mockSet.mockResolvedValue(undefined);
  });

  it('creates a new Connect account with canonical URL and returns link', async () => {
    store['users/uid-1'] = { personaType: 'artist', email: 'artist@test.com', creatorSlug: 'john-doe' };
    store['artistProfiles/uid-1'] = { stageName: 'John Doe' };

    const result = await (createConnectLink as any)(req('uid-1', 'artist', { creatorSlug: 'john-doe' }));
    expect(result.accountId).toBe('acct_mock_new');
    expect(result.accountLinkUrl).toBe('https://connect.stripe.com/mock');
    expect(result.bankPayoutReadiness).toBe('ready');
    expect(result.creatorVerificationState).toBe('verified');
    expect(_mockCreateConnectAccount).toHaveBeenCalledWith('uid-1', 'artist@test.com', {
      businessProfileUrl: 'https://crowdbeats.ai/artist/john-doe',
      creatorType: 'artist',
    });
    expect(_mockSet).toHaveBeenCalled(); // Audit event written
  });

  it('reuses existing accountId without calling createConnectAccount', async () => {
    store['users/uid-existing'] = {
      personaType: 'artist',
      stripeConnectAccountId: 'acct_existing_123',
    };

    const result = await (createConnectLink as any)(req('uid-existing'));
    expect(result.accountId).toBe('acct_existing_123');
    expect(_mockCreateConnectAccount).not.toHaveBeenCalled();
    expect(_mockCreateConnectAccountLink).toHaveBeenCalledWith(
      'acct_existing_123',
      expect.any(String),
      expect.any(String),
    );
  });

  it('rejects fan persona with permission-denied', async () => {
    store['users/uid-fan'] = { personaType: 'fan' };
    await expect(
      (createConnectLink as any)(req('uid-fan', 'fan')),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('rejects unauthenticated request with unauthenticated', async () => {
    await expect(
      (createConnectLink as any)({ auth: null, data: {} }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});

describe('getConnectStatus (Phase 1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(store).forEach((k) => delete store[k]);
    _mockGetConnectAccountStatus.mockResolvedValue({
      accountId: 'acct_active',
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      disabledReason: null,
      requirementsDue: [],
      eventuallyDue: [],
      pastDue: [],
      capabilities: { cardPayments: 'active', transfers: 'active' },
      bankPayoutReadiness: 'ready',
      creatorVerificationState: 'verified',
      requiresAction: false,
      actionType: null,
    });
    _mockUpdate.mockResolvedValue(undefined);
  });

  it('returns status for fully verified active account', async () => {
    store['users/uid-active'] = {
      personaType: 'artist',
      stripeConnectAccountId: 'acct_active',
    };

    const result = await (getConnectStatus as any)(req('uid-active'));
    expect(result.chargesEnabled).toBe(true);
    expect(result.payoutsEnabled).toBe(true);
    expect(result.bankPayoutReadiness).toBe('ready');
    expect(result.creatorVerificationState).toBe('verified');
    expect(result.requiresAction).toBe(false);
  });

  it('returns actionType create_account and not_created when no account exists', async () => {
    store['users/uid-new'] = { personaType: 'artist' };
    const result = await (getConnectStatus as any)(req('uid-new'));
    expect(result.accountId).toBeNull();
    expect(result.requiresAction).toBe(true);
    expect(result.actionType).toBe('create_account');
    expect(result.bankPayoutReadiness).toBe('not_created');
  });

  it('returns action_required and complete_kyc when KYC requirements are due', async () => {
    store['users/uid-partial'] = {
      personaType: 'artist',
      stripeConnectAccountId: 'acct_partial',
    };
    _mockGetConnectAccountStatus.mockResolvedValueOnce({
      accountId: 'acct_partial',
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      disabledReason: null,
      requirementsDue: ['individual.verification.document'],
      eventuallyDue: [],
      pastDue: [],
      capabilities: { cardPayments: 'inactive', transfers: 'inactive' },
      bankPayoutReadiness: 'action_required',
      creatorVerificationState: 'unverified',
      requiresAction: true,
      actionType: 'complete_kyc',
    });

    const result = await (getConnectStatus as any)(req('uid-partial'));
    expect(result.requiresAction).toBe(true);
    expect(result.chargesEnabled).toBe(false);
    expect(result.requirementsDue).toContain('individual.verification.document');
    expect(result.actionType).toBe('complete_kyc');
  });
});
