import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSet = jest.fn<any>().mockResolvedValue({} as any);
const mockGet = jest.fn<any>();

const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
}));

const mockCollection = jest.fn((name: string) => ({
  doc: mockDoc,
  where: jest.fn().mockReturnThis(),
  get: mockGet,
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: ['[DEFAULT]'],
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      doc: mockDoc,
    }),
    {
      FieldValue: {
        serverTimestamp: () => 'MOCK_TIMESTAMP',
      },
    },
  ),
}));

import {
  requestPrivacyExport,
  PRIVACY_EXPORT_TTL_MS,
  generatePrivacyExportPayload,
} from '../requestDataExport';

describe('GDPR/CCPA Privacy Export Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    await expect(
      (requestPrivacyExport as any).run({
        auth: null,
      }),
    ).rejects.toThrow('Authentication required.');
  });

  it('rejects unverified email accounts', async () => {
    await expect(
      (requestPrivacyExport as any).run({
        auth: { uid: 'u_1', token: { email_verified: false } },
      }),
    ).rejects.toThrow('Email verification required');
  });

  it('enforces strict 24-hour signed download URL expiry', () => {
    expect(PRIVACY_EXPORT_TTL_MS).toBe(24 * 60 * 60 * 1000);
    expect(PRIVACY_EXPORT_TTL_MS).toBe(86400000);
  });

  it('generates export payload and enforces 24h expiration timestamp', async () => {
    const mockDb = {
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue({
          get: jest.fn<any>().mockResolvedValue({ data: () => ({ displayName: 'Jane Fan' }) } as any),
        }),
        where: jest.fn().mockReturnValue({
          get: jest.fn<any>().mockResolvedValue({ docs: [] } as any),
        }),
      }),
    };

    const before = Date.now();
    const result = await generatePrivacyExportPayload(mockDb as any, 'u_fan_999');
    const after = Date.now();

    expect(result.exportData.uid).toBe('u_fan_999');
    expect(result.exportData.retentionNotice).toBeDefined();
    expect(result.maxTtlMs).toBe(86400000);

    const expectedMinExpires = before + 86400000;
    const expectedMaxExpires = after + 86400000;
    expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpires);
    expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpires);
  });
});
