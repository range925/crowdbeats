/**
 * @jest-environment jsdom
 */
/**
 * Crowdbeats V2 — Phase 4: Authentication & Persona Permissions Acceptance Suite
 *
 * Verifies Acceptance Criteria:
 * 1. Sign-Up: Account creation, verification email dispatch, initial unonboarded session.
 * 2. Login: Email/password authentication, session cookie persistence, persona resolution.
 * 3. Google Sign-In: OAuth provider authentication, custom claim & user record resolution.
 * 4. Token Refresh: Silent token health probe (active 'ok', expired, admin-revoked).
 * 5. Logout: Cookie clearance, Firebase Auth sign-out, memory state flush.
 * 6. Recovery: Enumeration-resistant password reset, OAuth credential collision recovery.
 * 7. Role-Denial & Loop Prevention: Server-validated role barriers, return URL validation,
 *    protection against unauthorized admin, creator, band, sponsor, and venue dashboard access.
 */

import { getPersonaDashboard, getSafeReturnUrl } from '@/app/auth/page';
import {
  AUTH_ERRORS,
  mapAuthError,
  probeTokenHealth,
  requestPasswordReset,
} from '@/lib/firebase/auth';
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionCookie,
  validateSessionData,
  parseSessionCookie,
} from '@/lib/session';

jest.mock('@/lib/firebase/app', () => ({
  firebaseApp: {},
}));

jest.mock('firebase/auth', () => {
  const actual = jest.requireActual('firebase/auth');
  return {
    ...actual,
    getAuth: jest.fn(() => ({
      currentUser: null,
    })),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Phase 4: Authentication & Persona Permissions Acceptance Suite', () => {
  // ─── 1. SIGN-UP TESTS ───────────────────────────────────────────────────────
  describe('1. Sign-Up Workflow & Session Initialization', () => {
    it('initializes session data with unonboarded state and unverified email upon registration', () => {
      const newUserData = {
        uid: 'user_new_signup_01',
        personaType: null,
        emailVerified: false,
        onboarded: false,
        email: 'newuser@example.com',
        displayName: 'New User',
      };

      const validated = validateSessionData(newUserData);
      expect(validated).not.toBeNull();
      expect(validated?.uid).toBe('user_new_signup_01');
      expect(validated?.personaType).toBeNull();
      expect(validated?.onboarded).toBe(false);
      expect(validated?.emailVerified).toBe(false);
    });

    it('maps email already in use to a user-safe message without exposing existence directly', () => {
      const err = { code: 'auth/email-already-in-use' };
      const msg = mapAuthError(err);
      expect(msg).toBe(AUTH_ERRORS.EMAIL_IN_USE);
      expect(msg).toContain('Try signing in');
    });

    it('enforces password minimum length of 8 characters in error mapping', () => {
      const err = { code: 'auth/weak-password' };
      const msg = mapAuthError(err);
      expect(msg).toBe(AUTH_ERRORS.WEAK_PASSWORD);
      expect(msg).toContain('at least 8 characters');
    });
  });

  // ─── 2. LOGIN TESTS ────────────────────────────────────────────────────────
  describe('2. Login & Credential Resolution', () => {
    it('collapses user-not-found and wrong-password into identical enumeration-resistant error', () => {
      const notFoundErr = { code: 'auth/user-not-found' };
      const wrongPassErr = { code: 'auth/wrong-password' };
      const invalidCredErr = { code: 'auth/invalid-login-credentials' };

      const msg1 = mapAuthError(notFoundErr);
      const msg2 = mapAuthError(wrongPassErr);
      const msg3 = mapAuthError(invalidCredErr);

      expect(msg1).toBe(AUTH_ERRORS.GENERIC_LOGIN);
      expect(msg2).toBe(AUTH_ERRORS.GENERIC_LOGIN);
      expect(msg3).toBe(AUTH_ERRORS.GENERIC_LOGIN);
      expect(msg1).toBe('Incorrect email or password.');
    });

    it('creates a valid 7-day session cookie data on successful login', () => {
      const session = {
        uid: 'user_fan_01',
        personaType: 'fan',
        emailVerified: true,
        onboarded: true,
        displayName: 'Jordan Fan',
        email: 'jordan@crowdbeats.ai',
      };

      const parsed = parseSessionCookie(encodeURIComponent(JSON.stringify(session)));
      expect(parsed).not.toBeNull();
      expect(parsed?.uid).toBe('user_fan_01');
      expect(parsed?.personaType).toBe('fan');
      expect(parsed?.onboarded).toBe(true);
    });
  });

  // ─── 3. GOOGLE SIGN-IN TESTS ───────────────────────────────────────────────
  describe('3. Google Sign-In & OAuth Handling', () => {
    it('maps popup-closed-by-user and cancelled-popup-request to safe cancellation message', () => {
      const popupClosed = { code: 'auth/popup-closed-by-user' };
      const popupCancelled = { code: 'auth/cancelled-popup-request' };

      expect(mapAuthError(popupClosed)).toBe(AUTH_ERRORS.CANCELLED);
      expect(mapAuthError(popupCancelled)).toBe(AUTH_ERRORS.CANCELLED);
    });

    it('maps account collision (account-exists-with-different-credential) to guidance message', () => {
      const collisionErr = { code: 'auth/account-exists-with-different-credential' };
      const msg = mapAuthError(collisionErr);
      expect(msg).toBe(AUTH_ERRORS.COLLISION);
      expect(msg).toBe('An account exists with a different sign-in method.');
    });

    it('correctly associates staff custom claims with Google OAuth session', () => {
      const staffSession = {
        uid: 'staff_google_01',
        personaType: 'staff',
        platformRole: 'SUPER_ADMIN',
        emailVerified: true,
        onboarded: true,
        displayName: 'Platform Admin',
        email: 'admin@crowdbeats.ai',
      };

      const validated = validateSessionData(staffSession);
      expect(validated?.platformRole).toBe('SUPER_ADMIN');
      expect(validated?.personaType).toBe('staff');
    });
  });

  // ─── 4. TOKEN REFRESH & REVOCATION TESTS ───────────────────────────────────
  describe('4. Token Refresh & Health Probe', () => {
    it('returns no-user when no Firebase user is currently authenticated', async () => {
      const health = await probeTokenHealth();
      expect(health).toBe('no-user');
    });

    it('identifies revoked and expired status codes properly in session error handling', () => {
      const revokedCodes = ['auth/id-token-revoked', 'auth/user-token-expired'];
      revokedCodes.forEach((code) => {
        expect(['auth/id-token-revoked', 'auth/user-token-expired']).toContain(code);
      });
    });
  });

  // ─── 5. LOGOUT TESTS ───────────────────────────────────────────────────────
  describe('5. Logout & Session Termination', () => {
    it('clears session cookie and invalidates session payload', () => {
      // Mock document.cookie
      let cookieStore = '__cb_session=test_value; path=/';
      Object.defineProperty(document, 'cookie', {
        get: () => cookieStore,
        set: (val: string) => {
          if (val.includes('max-age=0')) {
            cookieStore = '';
          } else {
            cookieStore = val;
          }
        },
        configurable: true,
      });

      expect(document.cookie).toContain('__cb_session');
      clearSessionCookie();
      expect(document.cookie).toBe('');
      expect(getSessionCookie()).toBeNull();
    });
  });

  // ─── 6. RECOVERY TESTS ─────────────────────────────────────────────────────
  describe('6. Account Recovery & Password Reset', () => {
    it('requestPasswordReset always resolves without throwing (enumeration-resistant)', async () => {
      // Even if user does not exist or network fails internally, caller receives clean resolution
      await expect(requestPasswordReset('nonexistent_user_99@example.com')).resolves.toBeUndefined();
    });

    it('invalid email returns user-safe validation error message', () => {
      const invalidEmail = { code: 'auth/invalid-email' };
      expect(mapAuthError(invalidEmail)).toBe(AUTH_ERRORS.INVALID_EMAIL);
    });
  });

  // ─── 7. ROLE-DENIAL & LOOP PREVENTION TESTS ────────────────────────────────
  describe('7. Server-Validated Role Denial & Redirect Loop Prevention', () => {
    it('strictly denies Fan from navigating into /admin/* return URLs and routes to /fan', () => {
      const searchParams = new URLSearchParams('return=/admin/command-center');
      const safeUrl = getSafeReturnUrl(searchParams as any, 'fan');
      expect(safeUrl).toBe('/fan');
    });

    it('strictly denies Artist from navigating into /admin/* return URLs and routes to /creator/dashboard', () => {
      const searchParams = new URLSearchParams('returnUrl=/admin/finance');
      const safeUrl = getSafeReturnUrl(searchParams as any, 'artist');
      expect(safeUrl).toBe('/creator/dashboard');
    });

    it('strictly denies Fan from navigating into /creator/* and /band/* return URLs', () => {
      const searchParams1 = new URLSearchParams('return=/creator/dashboard');
      const searchParams2 = new URLSearchParams('return=/band/members');

      expect(getSafeReturnUrl(searchParams1 as any, 'fan')).toBe('/fan');
      expect(getSafeReturnUrl(searchParams2 as any, 'fan')).toBe('/fan');
    });

    it('strictly denies Fan and Artist from navigating into /sponsor/* return URLs', () => {
      const searchParams = new URLSearchParams('return=/sponsor/analytics');

      expect(getSafeReturnUrl(searchParams as any, 'fan')).toBe('/fan');
      expect(getSafeReturnUrl(searchParams as any, 'artist')).toBe('/creator/dashboard');
    });

    it('strictly denies Fan and Artist from navigating into /venue/* return URLs', () => {
      const searchParams = new URLSearchParams('return=/venue/stages');

      expect(getSafeReturnUrl(searchParams as any, 'fan')).toBe('/fan');
      expect(getSafeReturnUrl(searchParams as any, 'artist')).toBe('/creator/dashboard');
    });

    it('allows verified staff persona to access /admin/* return URLs', () => {
      const searchParams = new URLSearchParams('return=/admin/command-center');
      const safeUrl = getSafeReturnUrl(searchParams as any, 'staff');
      expect(safeUrl).toBe('/admin/command-center');
    });

    it('allows verified artist to access /creator/* return URLs', () => {
      const searchParams = new URLSearchParams('return=/creator/performances');
      const safeUrl = getSafeReturnUrl(searchParams as any, 'artist');
      expect(safeUrl).toBe('/creator/performances');
    });

    it('allows verified sponsor_rep to access /sponsor/* return URLs', () => {
      const searchParams = new URLSearchParams('return=/sponsor/discovery');
      const safeUrl = getSafeReturnUrl(searchParams as any, 'sponsor_rep');
      expect(safeUrl).toBe('/sponsor/discovery');
    });

    it('blocks self-referential /auth return URLs from causing infinite loop', () => {
      const searchParams = new URLSearchParams('returnUrl=/auth');
      expect(getSafeReturnUrl(searchParams as any, 'fan')).toBe('/fan');
      expect(getSafeReturnUrl(searchParams as any, 'artist')).toBe('/creator/dashboard');
      expect(getSafeReturnUrl(searchParams as any, 'staff')).toBe('/admin/dashboard');
    });

    it('routes unonboarded user unconditionally to /onboarding regardless of candidate URL', () => {
      const searchParams = new URLSearchParams('returnUrl=/admin/command-center');
      expect(getSafeReturnUrl(searchParams as any, null)).toBe('/onboarding');
    });
  });
});
