import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock firebase-admin before import
const mockSet = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn();
const mockAdd = jest.fn().mockResolvedValue({ id: 'audit_123' } as never);
const mockRevokeRefreshTokens = jest.fn().mockResolvedValue(undefined as never);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
}));

const mockCollection = jest.fn((name: string) => ({
  doc: mockDoc,
  add: mockAdd,
  where: jest.fn().mockReturnThis(),
  get: mockGet,
}));

const mockCollectionGroup = jest.fn(() => ({
  where: jest.fn().mockReturnThis(),
  get: mockGet,
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: ['[DEFAULT]'],
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      collectionGroup: mockCollectionGroup,
      doc: mockDoc,
    }),
    {
      FieldValue: {
        serverTimestamp: () => 'MOCK_TIMESTAMP',
        increment: (n: number) => `INCREMENT_${n}`,
      },
    },
  ),
  auth: () => ({
    revokeRefreshTokens: mockRevokeRefreshTokens,
  }),
}));

import { requestAccountDeletion } from '../requestAccountDeletion';

describe('requestAccountDeletion Cloud Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    await expect(
      (requestAccountDeletion as any).run({
        auth: null,
        data: { confirmPhrase: 'delete my account' },
      }),
    ).rejects.toThrow('Authentication required.');
  });

  it('rejects unverified email accounts', async () => {
    await expect(
      (requestAccountDeletion as any).run({
        auth: { uid: 'user_1', token: { email_verified: false } },
        data: { confirmPhrase: 'delete my account' },
      }),
    ).rejects.toThrow('Email verification required');
  });

  it('rejects mismatching confirm phrase', async () => {
    await expect(
      (requestAccountDeletion as any).run({
        auth: { uid: 'user_1', token: { email_verified: true } },
        data: { confirmPhrase: 'no thanks' },
      }),
    ).rejects.toThrow('Confirmation phrase mismatch');
  });

  it('executes soft deletion and token revocation on valid request', async () => {
    // Mock no band memberships
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] } as never);
    // Mock no payout holds
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] } as never);

    const result = await (requestAccountDeletion as any).run({
      auth: { uid: 'user_1', token: { email_verified: true } },
      data: { confirmPhrase: 'delete my account', feedbackReason: 'Moving away' },
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('SCHEDULED');
    expect(mockSet).toHaveBeenCalled();
    expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('user_1');
    expect(mockAdd).toHaveBeenCalled(); // Audit event logged
  });
});
