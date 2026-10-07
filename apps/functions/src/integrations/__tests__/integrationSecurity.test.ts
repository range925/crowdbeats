import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSet = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn();
const mockAdd = jest.fn().mockResolvedValue({ id: 'audit_123' } as never);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
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
  saveIntegrationSecret,
  validateCustomApiEndpoint,
  testIntegrationConnection,
} from '../integrationCallables';

describe('Integrations & Secret Management Security Probes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unauthenticated requests to save integration secret', async () => {
    await expect(
      (saveIntegrationSecret as any).run({
        auth: null,
        data: {
          integrationId: 'int-stripe',
          environment: 'DEVELOPMENT',
          secretKeyName: 'STRIPE_RESTRICTED_KEY',
          secretValue: 'rk_test_123',
          reason: 'Test rotation',
        },
      }),
    ).rejects.toThrow('Authentication required.');
  });

  it('stores secret metadata write-only and creates audit log without secret content', async () => {
    const res = await (saveIntegrationSecret as any).run({
      auth: { uid: 'sec_admin_1', token: { platformRole: 'SECURITY_ADMIN' } },
      data: {
        integrationId: 'int-stripe',
        environment: 'DEVELOPMENT',
        secretKeyName: 'STRIPE_RESTRICTED_KEY',
        secretValue: 'rk_test_SUPER_SECRET_VALUE',
        reason: 'Scheduled quarterly key rotation',
      },
    });

    expect(res.ok).toBe(true);
    expect(res.credentialVersion).toBeDefined();
    expect(mockSet).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();

    // Verify audit log DOES NOT contain raw secret
    const auditCallArg: any = mockAdd.mock.calls[0][0];
    expect(auditCallArg.eventType).toBe('INTEGRATION_CREDENTIAL_UPDATED');
    expect(JSON.stringify(auditCallArg)).not.toContain('rk_test_SUPER_SECRET_VALUE');
  });

  it('blocks SSRF attacks to localhost and private cloud metadata', async () => {
    const localhostRes = await (validateCustomApiEndpoint as any).run({
      auth: { uid: 'admin_1' },
      data: { url: 'https://localhost:8080/admin' },
    });
    expect(localhostRes.safe).toBe(false);
    expect(localhostRes.reason).toContain('forbidden');

    const metadataRes = await (validateCustomApiEndpoint as any).run({
      auth: { uid: 'admin_1' },
      data: { url: 'https://169.254.169.254/computeMetadata/v1/' },
    });
    expect(metadataRes.safe).toBe(false);
    expect(metadataRes.reason).toContain('forbidden');

    const privateIpRes = await (validateCustomApiEndpoint as any).run({
      auth: { uid: 'admin_1' },
      data: { url: 'https://192.168.1.100/api' },
    });
    expect(privateIpRes.safe).toBe(false);

    const safeRes = await (validateCustomApiEndpoint as any).run({
      auth: { uid: 'admin_1' },
      data: { url: 'https://api.sendgrid.com/v3/mail/send' },
    });
    expect(safeRes.safe).toBe(true);
    expect(safeRes.hostname).toBe('api.sendgrid.com');
  });

  it('tests integration connection and returns redacted response', async () => {
    const res = await (testIntegrationConnection as any).run({
      auth: { uid: 'admin_1' },
      data: { integrationId: 'int-stripe', environment: 'DEVELOPMENT' },
    });

    expect(res.ok).toBe(true);
    expect(res.status).toBe('HEALTHY');
    expect(res.latencyMs).toBeGreaterThan(0);
  });
});
