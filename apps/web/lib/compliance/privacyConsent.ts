/**
 * Crowdbeats V2 — Statutory Privacy Consent Manager
 * Legal Framework: California Civil Code § 1798.100 (CCPA / CPRA) & EU GDPR Article 15
 *
 * Mandates:
 * 1. Zero tracking of guests or users prior to affirmative consent.
 * 2. Explicit Notice at Collection (CCPA § 1798.100).
 * 3. Right of Access and Disclosure (GDPR Article 15).
 * 4. Certified zero sale or cross-context behavioral sharing of personal data.
 */

export interface PrivacyConsentRecord {
  version: string;
  status: 'accepted_all' | 'essential_only' | 'custom';
  timestamp: string;
  strictlyNecessary: boolean;
  analytics: boolean;
  ephemeralGeolocation: boolean;
  doNotSellOrShare: boolean;
  ccpaSection1798Acknowledged: boolean;
  gdprArticle15Acknowledged: boolean;
}

export const PRIVACY_CONSENT_STORAGE_KEY = 'cb_privacy_consent_v1';
export const CURRENT_PRIVACY_VERSION = '2026.1';

export function getStoredConsent(): PrivacyConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PrivacyConsentRecord;
  } catch (e) {
    console.error('[PrivacyConsent] Error reading stored consent:', e);
    return null;
  }
}

export function saveConsentRecord(record: PrivacyConsentRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(
      new CustomEvent('cb_privacy_consent_updated', { detail: record })
    );
  } catch (e) {
    console.error('[PrivacyConsent] Error saving consent record:', e);
  }
}

export function isTrackingPermitted(category: 'analytics' | 'ephemeralGeolocation'): boolean {
  const consent = getStoredConsent();
  if (!consent) return false;
  if (consent.status === 'accepted_all') return true;
  if (consent.status === 'essential_only') return false;
  return !!consent[category];
}

export function resetConsentForTesting(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('cb_privacy_consent_updated', { detail: null }));
}
