/**
 * Crowdbeats V2 — onCompleteOnboarding Unit Tests (Phase 5)
 *
 * Tests: input validation, persona guard (no STAFF), idempotency, auth check.
 * Uses mocks — NO emulator required for these unit tests.
 *
 * Run: npm test (in apps/functions)
 */

// ── Mock firebase-admin ───────────────────────────────────────────────────────

const mockSetCustomUserClaims = jest.fn().mockResolvedValue(undefined);
const mockUpdate              = jest.fn().mockResolvedValue(undefined);
const mockSet                 = jest.fn().mockResolvedValue(undefined);
const mockGet                 = jest.fn().mockResolvedValue({ exists: false, data: () => ({}) });
const mockDoc                 = jest.fn().mockReturnValue({ update: mockUpdate, set: mockSet, get: mockGet });
const mockCollection          = jest.fn().mockReturnValue({ doc: mockDoc });
const mockServerTimestamp     = jest.fn().mockReturnValue('SERVER_TS');
const mockIncrement           = jest.fn().mockReturnValue('INCREMENT');

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  auth:          () => ({ setCustomUserClaims: mockSetCustomUserClaims }),
  firestore:     Object.assign(() => ({
    collection: mockCollection,
    runTransaction: jest.fn(async (cb: any) => cb({
      get: mockGet,
      set: mockSet,
      update: mockUpdate,
    })),
  }), {
    FieldValue: {
      serverTimestamp: mockServerTimestamp,
      increment:       mockIncrement,
    },
  }),
}));

// ── Mock firebase-functions/v2 ────────────────────────────────────────────────

class MockHttpsError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

jest.mock('firebase-functions/v2', () => ({
  https: { HttpsError: MockHttpsError },
}));

jest.mock('firebase-functions/v2/https', () => ({
  onCall: (_opts: unknown, handler: Function) => handler,
}));

// ── Import handler ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { onCompleteOnboarding } = require('../onCompleteOnboarding') as {
  onCompleteOnboarding: (req: { auth?: { uid: string }; data: unknown }) => Promise<unknown>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  data: Record<string, unknown>,
  uid = 'test-uid-123',
) {
  return { auth: { uid }, data };
}

const VALID_DATA = {
  personaType:    'fan',
  displayName:    'Test User',
  consentVersion: '2026-08-25',
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('onCompleteOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Authentication guard ───────────────────────────────────────────────────

  describe('authentication guard', () => {
    it('rejects unauthenticated calls', async () => {
      await expect(
        onCompleteOnboarding({ auth: undefined, data: VALID_DATA }),
      ).rejects.toMatchObject({ code: 'unauthenticated' });
    });
  });

  // ── Persona validation ────────────────────────────────────────────────────

  describe('persona validation', () => {
    const ALLOWED: string[] = ['fan', 'artist', 'band_member', 'venue_manager', 'sponsor_rep'];
    const BLOCKED:  string[] = ['staff', 'admin', 'platform_admin', 'STAFF', 'ADMIN', ''];

    ALLOWED.forEach(persona => {
      it(`accepts persona: ${persona}`, async () => {
        const result = await onCompleteOnboarding(
          makeRequest({ ...VALID_DATA, personaType: persona }),
        );
        expect(result).toMatchObject({ success: true, personaType: persona });
        expect(mockSetCustomUserClaims).toHaveBeenCalledWith('test-uid-123', {
          personaType: persona,
          claimsVersion: 1,
        });
      });
    });

    BLOCKED.forEach(persona => {
      it(`rejects blocked persona: "${persona}"`, async () => {
        await expect(
          onCompleteOnboarding(makeRequest({ ...VALID_DATA, personaType: persona })),
        ).rejects.toMatchObject({ code: 'invalid-argument' });
        expect(mockSetCustomUserClaims).not.toHaveBeenCalled();
      });
    });
  });

  // ── Display name validation ───────────────────────────────────────────────

  describe('displayName validation', () => {
    it('rejects too-short display name', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, displayName: 'A' })),
      ).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('rejects too-long display name (51 chars)', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, displayName: 'A'.repeat(51) })),
      ).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('accepts exactly 2 char display name (boundary)', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, displayName: 'Jo' })),
      ).resolves.toMatchObject({ success: true });
    });

    it('accepts exactly 50 char display name (boundary)', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, displayName: 'A'.repeat(50) })),
      ).resolves.toMatchObject({ success: true });
    });

    it('rejects display name containing HTML', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, displayName: '<script>bad</script>' })),
      ).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('rejects non-string display name', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, displayName: 42 })),
      ).rejects.toMatchObject({ code: 'invalid-argument' });
    });
  });

  // ── Consent version validation ────────────────────────────────────────────

  describe('consentVersion validation', () => {
    it('accepts valid ISO date consent version', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, consentVersion: '2026-01-01' })),
      ).resolves.toMatchObject({ success: true });
    });

    it('rejects malformed consent version', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, consentVersion: 'not-a-date' })),
      ).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('rejects non-string consent version', async () => {
      await expect(
        onCompleteOnboarding(makeRequest({ ...VALID_DATA, consentVersion: 20260825 })),
      ).rejects.toMatchObject({ code: 'invalid-argument' });
    });
  });

  // ── Side effects ──────────────────────────────────────────────────────────

  describe('side effects on valid call', () => {
    it('sets Firestore user record and consent', async () => {
      await onCompleteOnboarding(makeRequest(VALID_DATA));

      // User record updated
      expect(mockCollection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith('test-uid-123');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        displayName: 'Test User',
        personaType: 'fan',
      }));

      // Consent recorded
      expect(mockCollection).toHaveBeenCalledWith('consent');
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          uid:         'test-uid-123',
          consentType: 'TERMS_OF_SERVICE',
          version:     '2026-08-25',
          granted:     true,
        }),
        { merge: true },
      );
    });

    it('is idempotent — calling twice with same persona does not throw', async () => {
      await expect(onCompleteOnboarding(makeRequest(VALID_DATA))).resolves.toMatchObject({ success: true });
      await expect(onCompleteOnboarding(makeRequest(VALID_DATA))).resolves.toMatchObject({ success: true });
      expect(mockSetCustomUserClaims).toHaveBeenCalledTimes(2);
    });

    it('passes profileData to consent record', async () => {
      const profileData = { genre: 'jazz', city: 'Auckland' };
      await onCompleteOnboarding(makeRequest({ ...VALID_DATA, personaType: 'artist', profileData }));
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ profileData }),
        { merge: true },
      );
    });
  });

  // ── UID isolation ─────────────────────────────────────────────────────────

  describe('UID isolation', () => {
    it('only writes to the authenticated UID, not an arbitrary one', async () => {
      await onCompleteOnboarding(makeRequest({ ...VALID_DATA }, 'user-abc'));
      expect(mockSetCustomUserClaims).toHaveBeenCalledWith('user-abc', expect.anything());
      expect(mockDoc).toHaveBeenCalledWith('user-abc');
      expect(mockDoc).not.toHaveBeenCalledWith('some-other-uid');
    });
  });
});
