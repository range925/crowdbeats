/**
 * Crowdbeats V2 — generateQrToken Tests (Phase 7)
 *
 * Uses the same mock pattern as createTipIntent.test.ts (working baseline).
 *
 * Covers:
 * 1. Valid performer generates token with correct fields
 * 2. Token for a different performer's session rejected (permission-denied)
 * 3. Token for ended session rejected (failed-precondition)
 * 4. Missing sessionId rejected (invalid-argument)
 * 5. Session not found rejected (not-found)
 * 6. Unauthenticated rejected (unauthenticated)
 * 7. Expiry is 90 seconds from now
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ── Firestore mock ────────────────────────────────────────────────────────────

const _mockGetSession = jest.fn<any>();
const _mockSetQr = jest.fn<any>();

jest.mock('firebase-admin', () => ({
  apps: [true], // already initialized
  initializeApp: jest.fn(),
  firestore: Object.assign(
    jest.fn(() => ({
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: () => {
            if (name === 'sessions') return _mockGetSession(id);
            return Promise.resolve({ exists: false, data: () => undefined });
          },
          set: _mockSetQr,
        }),
      }),
      FieldValue: { serverTimestamp: () => 'SERVER_TS' },
    })),
    {
      FieldValue: { serverTimestamp: () => 'SERVER_TS' },
    },
  ),
}));

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

jest.mock('uuid', () => ({ v4: () => 'test-token-uuid-1234' }));

process.env['HMAC_KEY'] = 'test-hmac-key-phase7';

// ── Import after mocks ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateQrToken } = require('../generateQrToken');

// ── Helpers ───────────────────────────────────────────────────────────────────

function req(uid: string, data: Record<string, unknown>) {
  return { auth: { uid }, data };
}

function sessionSnap(data: Record<string, unknown> | null) {
  return Promise.resolve({ exists: data !== null, data: () => data });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('generateQrToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _mockSetQr.mockResolvedValue(undefined);
  });

  it('generates a token for a valid artist session', async () => {
    _mockGetSession.mockReturnValue(sessionSnap({
      performerId: 'uid-artist',
      performerType: 'artist',
      status: 'live',
    }));

    const result = await (generateQrToken as any)(req('uid-artist', { sessionId: 'sess-1' }));

    expect(result.tokenId).toBe('test-token-uuid-1234');
    expect(result.sessionId).toBe('sess-1');
    expect(typeof result.expiresAtMs).toBe('number');
    expect(result.expiresAtMs).toBeGreaterThan(Date.now());
    expect(typeof result.sig).toBe('string');
    expect(_mockSetQr).toHaveBeenCalledTimes(1);
  });

  it('rejects when sessionId is missing', async () => {
    await expect(
      (generateQrToken as any)(req('uid-artist', {})),
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects when session does not exist', async () => {
    _mockGetSession.mockReturnValue(sessionSnap(null));
    await expect(
      (generateQrToken as any)(req('uid-artist', { sessionId: 'sess-missing' })),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('rejects when session belongs to a different performer', async () => {
    _mockGetSession.mockReturnValue(sessionSnap({
      performerId: 'uid-other',
      performerType: 'artist',
      status: 'live',
    }));
    await expect(
      (generateQrToken as any)(req('uid-artist', { sessionId: 'sess-1' })),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('rejects when session is ended (not live)', async () => {
    _mockGetSession.mockReturnValue(sessionSnap({
      performerId: 'uid-artist',
      performerType: 'artist',
      status: 'ended',
    }));
    await expect(
      (generateQrToken as any)(req('uid-artist', { sessionId: 'sess-1' })),
    ).rejects.toMatchObject({ code: 'failed-precondition' });
  });

  it('rejects unauthenticated requests', async () => {
    await expect(
      (generateQrToken as any)({ auth: null, data: { sessionId: 'sess-1' } }),
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });
});

describe('QR token integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _mockSetQr.mockResolvedValue(undefined);
  });

  it('expiry is exactly 90 seconds from now', async () => {
    _mockGetSession.mockReturnValue(sessionSnap({
      performerId: 'uid-a',
      performerType: 'artist',
      status: 'live',
    }));
    const before = Date.now();
    const r = await (generateQrToken as any)(req('uid-a', { sessionId: 'sess-A' }));
    const after = Date.now();
    expect(r.expiresAtMs).toBeGreaterThanOrEqual(before + 90_000);
    expect(r.expiresAtMs).toBeLessThanOrEqual(after + 90_000);
  });

  it('signature is 64-character hex', async () => {
    _mockGetSession.mockReturnValue(sessionSnap({
      performerId: 'uid-a',
      performerType: 'artist',
      status: 'live',
    }));
    const r = await (generateQrToken as any)(req('uid-a', { sessionId: 'sess-A' }));
    expect(r.sig).toMatch(/^[a-f0-9]{64}$/);
  });
});
