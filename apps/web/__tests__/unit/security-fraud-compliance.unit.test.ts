/**
 * Crowdbeats V2 — Frontend Security, Fraud Prevention, and Compliance Unit Tests (Phase 17)
 *
 * Verifies:
 * 1. Persona Route Guards & Least-Privilege Navigation Boundaries
 * 2. Zero-PII Location & User-Agent Sanitization (Fan & Artist Physical Privacy)
 * 3. Sensitive Action Re-Authentication Window (Financial Holds & Re-Auth)
 * 4. Cross-Platform Security & Fraud Contract Parity
 */

import { computeRouteGuard, type SessionData } from '../../lib/routeGuard';
import {
  parseUserAgent,
  sanitizeApproximateLocation,
} from '../../lib/security/sessionSanitizer';
import {
  RECENT_AUTH_WINDOW_MS,
  isRecentAuthValid,
  markRecentAuthSuccess,
  invalidateRecentAuth,
  getRecentAuthRemainingSeconds,
} from '../../lib/security/recentAuth';
import {
  SecurityAuditCategory,
  FraudRiskLevel,
  FraudSignalCode,
  StorageAllowedMimeTypes,
  StorageMaxSizeBytes,
  CONTRACTS_VERSION,
} from '@crowdbeats/contracts';

describe('Phase 17 — Frontend Security, Fraud and Compliance Suite', () => {
  // ════════════════════════════════════════════════════════════════════════════
  // 1. ROUTE GUARDS & PRIVILEGE BOUNDARIES
  // ════════════════════════════════════════════════════════════════════════════
  describe('Persona Route Guards & Boundary Protection', () => {
    const unauthenticated = null;

    const fanSession: SessionData = {
      uid: 'fan_1',
      personaType: 'fan',
      emailVerified: true,
      onboarded: true,
    };

    const artistSession: SessionData = {
      uid: 'artist_1',
      personaType: 'artist',
      emailVerified: true,
      onboarded: true,
    };

    it('blocks unauthenticated access to sensitive account settings and redirects to auth', () => {
      const result = computeRouteGuard('/account/settings', unauthenticated);
      expect(result).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('blocks unauthenticated direct access to creator dashboard and redirects to auth', () => {
      const result = computeRouteGuard('/creator/dashboard', unauthenticated);
      expect(result).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('blocks unauthenticated access to venue manager area and redirects to auth', () => {
      const result = computeRouteGuard('/venue', unauthenticated);
      expect(result).toEqual({ action: 'redirect', destination: '/auth' });
    });

    it('prevents fan persona from accessing venue manager area and redirects to fan home', () => {
      const result = computeRouteGuard('/venue', fanSession);
      expect(result).toEqual({ action: 'redirect', destination: '/fan' });
    });

    it('prevents artist persona from accessing sponsor rep area and redirects to creator dashboard', () => {
      const result = computeRouteGuard('/sponsor', artistSession);
      expect(result).toEqual({ action: 'redirect', destination: '/creator/dashboard' });
    });

    it('allows public routes (galleries, assets, public performer profiles) without auth', () => {
      expect(computeRouteGuard('/gallery', unauthenticated)).toEqual({ action: 'next' });
      expect(computeRouteGuard('/artist/the-midnight-echo', unauthenticated)).toEqual({ action: 'next' });
      expect(computeRouteGuard('/band/neon-pulse', unauthenticated)).toEqual({ action: 'next' });
      expect(computeRouteGuard('/venue/the-velvet-lounge', unauthenticated)).toEqual({ action: 'next' });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. ZERO-PII PRIVACY SAFEGUARDS (LOCATION & DEVICE DATA)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Zero-PII Privacy Safeguards & Physical Safety', () => {
    it('strips exact GPS latitude and longitude coordinates from logs and telemetry', () => {
      const rawWithCoords = 'Austin, TX, US (30.2672, -97.7431)';
      const sanitized = sanitizeApproximateLocation(rawWithCoords);
      expect(sanitized).not.toContain('30.2672');
      expect(sanitized).not.toContain('-97.7431');
      expect(sanitized).toBe('Austin, TX, US');
    });

    it('strips specific street addresses and postal codes to protect physical safety', () => {
      const rawStreet = '742 Evergreen Terrace, Springfield, OR 97477';
      const sanitized = sanitizeApproximateLocation(rawStreet);
      expect(sanitized).not.toContain('742 Evergreen Terrace');
      expect(sanitized).not.toContain('97477');
      expect(sanitized).toContain('Springfield, OR');
    });

    it('provides safe anonymous fallback for missing or corrupted location signals', () => {
      expect(sanitizeApproximateLocation(null)).toBe('Approximate Region (United States)');
      expect(sanitizeApproximateLocation('')).toBe('Approximate Region (United States)');
    });

    it('normalizes browser and device signatures to prevent device fingerprinting', () => {
      const macChromeUA =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      const parsed = parseUserAgent(macChromeUA);

      expect(parsed.deviceType).toBe('desktop');
      expect(parsed.device).toBe('Mac / MacBook');
      expect(parsed.browser).toBe('Google Chrome');
      expect(parsed.os).toBe('macOS');
      expect(parsed).not.toHaveProperty('canvasFingerprint');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. SENSITIVE ACTION RE-AUTHENTICATION WINDOW (STEP-UP SECURITY)
  // ════════════════════════════════════════════════════════════════════════════
  describe('Step-Up Re-Authentication for Financial & Security Actions', () => {
    beforeEach(() => {
      invalidateRecentAuth();
    });

    it('enforces a strict 5-minute (300,000 ms) step-up authentication window', () => {
      expect(RECENT_AUTH_WINDOW_MS).toBe(5 * 60 * 1000);
    });

    it('treats missing or uninitialized recent auth as invalid', () => {
      expect(isRecentAuthValid()).toBe(false);
      expect(getRecentAuthRemainingSeconds()).toBe(0);
    });

    it('accepts fresh authentications within the 5-minute window upon markRecentAuthSuccess', () => {
      markRecentAuthSuccess();
      expect(isRecentAuthValid()).toBe(true);
      expect(getRecentAuthRemainingSeconds()).toBeGreaterThan(250);
      expect(getRecentAuthRemainingSeconds()).toBeLessThanOrEqual(300);
    });

    it('invalidates recent auth immediately upon sensitive action completion', () => {
      markRecentAuthSuccess();
      expect(isRecentAuthValid()).toBe(true);

      // User finished bank unlinking or password change
      invalidateRecentAuth();
      expect(isRecentAuthValid()).toBe(false);
      expect(getRecentAuthRemainingSeconds()).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. FRAUD & SECURITY CONTRACTS INTEGRITY
  // ════════════════════════════════════════════════════════════════════════════
  describe('Cross-Platform Security and Fraud Contract Parity', () => {
    it('synchronizes contracts version with Phase 17+ milestone', () => {
      expect(CONTRACTS_VERSION).toMatch(/^0\.(30|31)\./);
    });

    it('validates storage media bounds and whitelist contracts', () => {
      expect(StorageAllowedMimeTypes.IMAGES).toEqual([
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ]);
      expect(StorageMaxSizeBytes.IMAGE).toBe(10 * 1024 * 1024);
      expect(StorageMaxSizeBytes.DOCUMENT).toBe(50 * 1024 * 1024);
    });

    it('exposes canonical fraud signal codes and risk levels', () => {
      expect(FraudRiskLevel.CRITICAL).toBe('critical');
      expect(FraudRiskLevel.HIGH).toBe('high');
      expect(FraudSignalCode.PRIVILEGE_ESCALATION_ATTEMPT).toBe('PRIVILEGE_ESCALATION_ATTEMPT');
      expect(FraudSignalCode.WEBHOOK_SIGNATURE_MISMATCH).toBe('WEBHOOK_SIGNATURE_MISMATCH');
      expect(SecurityAuditCategory.STRIPE_WEBHOOK_INTEGRITY).toBe('STRIPE_WEBHOOK_INTEGRITY');
    });
  });
});
