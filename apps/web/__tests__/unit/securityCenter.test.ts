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
import { evaluatePasswordStrength } from '../../components/security/ChangePasswordModal';
import { BIOMETRIC_SECURITY_DISCLAIMER } from '../../lib/security/biometrics';

describe('Crowdbeats Security Center — Unit Tests', () => {
  describe('Location Sanitization & Privacy Safeguards', () => {
    it('strips exact GPS latitude and longitude coordinates', () => {
      const rawWithCoords = 'Austin, TX, US (30.2672, -97.7431)';
      const sanitized = sanitizeApproximateLocation(rawWithCoords);
      expect(sanitized).not.toContain('30.2672');
      expect(sanitized).not.toContain('-97.7431');
      expect(sanitized).toBe('Austin, TX, US');
    });

    it('strips street level addresses and postal codes', () => {
      const rawStreet = '742 Evergreen Terrace, Springfield, OR 97477';
      const sanitized = sanitizeApproximateLocation(rawStreet);
      expect(sanitized).not.toContain('742 Evergreen Terrace');
      expect(sanitized).not.toContain('97477');
      expect(sanitized).toContain('Springfield, OR');
    });

    it('returns a safe fallback for missing, empty, or garbage input', () => {
      expect(sanitizeApproximateLocation(null)).toBe('Approximate Region (United States)');
      expect(sanitizeApproximateLocation('')).toBe('Approximate Region (United States)');
      expect(sanitizeApproximateLocation('   ')).toBe('Approximate Region (United States)');
    });
  });

  describe('User-Agent & Device Taxonomy Parsing', () => {
    it('parses iPhone mobile user-agents into clean human descriptions', () => {
      const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
      const parsed = parseUserAgent(iphoneUA);
      expect(parsed.deviceType).toBe('mobile');
      expect(parsed.device).toBe('Apple iPhone');
      expect(parsed.browser).toBe('Apple Safari');
      expect(parsed.os).toContain('iOS');
    });

    it('parses Mac Chrome user-agents correctly', () => {
      const macUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';
      const parsed = parseUserAgent(macUA);
      expect(parsed.deviceType).toBe('desktop');
      expect(parsed.device).toBe('Mac / MacBook');
      expect(parsed.browser).toBe('Google Chrome');
      expect(parsed.os).toBe('macOS');
    });

    it('parses Windows PC user-agents correctly', () => {
      const winUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0';
      const parsed = parseUserAgent(winUA);
      expect(parsed.deviceType).toBe('desktop');
      expect(parsed.device).toBe('Windows PC');
      expect(parsed.browser).toBe('Microsoft Edge');
      expect(parsed.os).toBe('Windows');
    });

    it('parses iPad tablet user-agents correctly', () => {
      const ipadUA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
      const parsed = parseUserAgent(ipadUA);
      expect(parsed.deviceType).toBe('tablet');
      expect(parsed.device).toBe('Apple iPad');
    });
  });

  describe('Recent Authentication (Step-Up Guard) Lifetime', () => {
    beforeEach(() => {
      invalidateRecentAuth();
    });

    it('confirms 5-minute security validity window constant', () => {
      expect(RECENT_AUTH_WINDOW_MS).toBe(300000); // 5 minutes in milliseconds
    });

    it('returns false when no recent authentication has occurred', () => {
      expect(isRecentAuthValid()).toBe(false);
      expect(getRecentAuthRemainingSeconds()).toBe(0);
    });

    it('returns true immediately after marking successful recent authentication', () => {
      markRecentAuthSuccess();
      expect(isRecentAuthValid()).toBe(true);
      expect(getRecentAuthRemainingSeconds()).toBeGreaterThan(290);
      expect(getRecentAuthRemainingSeconds()).toBeLessThanOrEqual(300);
    });

    it('invalidates immediately upon explicit call', () => {
      markRecentAuthSuccess();
      expect(isRecentAuthValid()).toBe(true);
      invalidateRecentAuth();
      expect(isRecentAuthValid()).toBe(false);
      expect(getRecentAuthRemainingSeconds()).toBe(0);
    });
  });

  describe('Password Strength Evaluation', () => {
    it('identifies short or simple passwords as Weak', () => {
      expect(evaluatePasswordStrength('secret').label).toBe('Weak');
      expect(evaluatePasswordStrength('12345678').label).toBe('Weak');
    });

    it('identifies mixed alphanumeric passwords as Good', () => {
      expect(evaluatePasswordStrength('Crowdbeats2026').label).toBe('Good');
    });

    it('identifies complex passwords with symbols and length as Strong', () => {
      expect(evaluatePasswordStrength('Cr0wdB34ts!#2026$Safe').label).toBe('Strong');
    });
  });

  describe('Mobile Biometric Server Authentication Invariant', () => {
    it('contains mandatory architectural disclaimer preventing local biometric substitution for server auth', () => {
      expect(BIOMETRIC_SECURITY_DISCLAIMER).toBeDefined();
      expect(BIOMETRIC_SECURITY_DISCLAIMER.toLowerCase()).toContain('lock the local');
      expect(BIOMETRIC_SECURITY_DISCLAIMER.toLowerCase()).toContain('do not replace crowdbeats server-side');
    });
  });
});
