/**
 * Crowdbeats V2 — Privacy Consent & Statutory Compliance Unit Tests
 * CCPA § 1798.100 & GDPR Article 15 Mandates
 */

import {
  getStoredConsent,
  saveConsentRecord,
  isTrackingPermitted,
  resetConsentForTesting,
  CURRENT_PRIVACY_VERSION,
  PRIVACY_CONSENT_STORAGE_KEY,
  type PrivacyConsentRecord,
} from '../../lib/compliance/privacyConsent';

describe('CCPA § 1798.100 & GDPR Art. 15 Privacy Consent Manager', () => {
  beforeEach(() => {
    localStorage.clear();
    resetConsentForTesting();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Zero-Tracking By Default (Do Not Track Prior to Consent)', () => {
    it('returns null when a first-time visitor arrives without stored consent', () => {
      expect(getStoredConsent()).toBeNull();
    });

    it('strictly forbids analytics tracking for first-time visitors before consent', () => {
      expect(isTrackingPermitted('analytics')).toBe(false);
    });

    it('strictly forbids ephemeral geolocation telemetry before consent', () => {
      expect(isTrackingPermitted('ephemeralGeolocation')).toBe(false);
    });
  });

  describe('Affirmative Consent Acceptance ("Accept All")', () => {
    it('records affirmative consent with statutory CCPA & GDPR acknowledgment', () => {
      const record: PrivacyConsentRecord = {
        version: CURRENT_PRIVACY_VERSION,
        status: 'accepted_all',
        timestamp: new Date().toISOString(),
        strictlyNecessary: true,
        analytics: true,
        ephemeralGeolocation: true,
        doNotSellOrShare: true,
        ccpaSection1798Acknowledged: true,
        gdprArticle15Acknowledged: true,
      };

      saveConsentRecord(record);

      const stored = getStoredConsent();
      expect(stored).not.toBeNull();
      expect(stored?.status).toBe('accepted_all');
      expect(stored?.ccpaSection1798Acknowledged).toBe(true);
      expect(stored?.gdprArticle15Acknowledged).toBe(true);
      expect(stored?.doNotSellOrShare).toBe(true);

      // Verify tracking gates now permit performance analytics
      expect(isTrackingPermitted('analytics')).toBe(true);
      expect(isTrackingPermitted('ephemeralGeolocation')).toBe(true);
    });
  });

  describe('Essential Only Mode ("Limit to Essential Only")', () => {
    it('strictly blocks all non-essential telemetry when user chooses essential only', () => {
      const record: PrivacyConsentRecord = {
        version: CURRENT_PRIVACY_VERSION,
        status: 'essential_only',
        timestamp: new Date().toISOString(),
        strictlyNecessary: true,
        analytics: false,
        ephemeralGeolocation: false,
        doNotSellOrShare: true,
        ccpaSection1798Acknowledged: true,
        gdprArticle15Acknowledged: true,
      };

      saveConsentRecord(record);

      const stored = getStoredConsent();
      expect(stored?.status).toBe('essential_only');
      expect(stored?.strictlyNecessary).toBe(true);
      expect(stored?.analytics).toBe(false);

      // Verify tracking gates STRICTLY block analytics
      expect(isTrackingPermitted('analytics')).toBe(false);
      expect(isTrackingPermitted('ephemeralGeolocation')).toBe(false);
    });
  });

  describe('Custom Granular Rights Toggles', () => {
    it('honors selective user toggles (e.g. analytics allowed, geolocation denied)', () => {
      const record: PrivacyConsentRecord = {
        version: CURRENT_PRIVACY_VERSION,
        status: 'custom',
        timestamp: new Date().toISOString(),
        strictlyNecessary: true,
        analytics: true,
        ephemeralGeolocation: false,
        doNotSellOrShare: true,
        ccpaSection1798Acknowledged: true,
        gdprArticle15Acknowledged: true,
      };

      saveConsentRecord(record);

      expect(isTrackingPermitted('analytics')).toBe(true);
      expect(isTrackingPermitted('ephemeralGeolocation')).toBe(false);
    });
  });
});
