/**
 * Crowdbeats V2 — Mobile Biometric App Unlock Service
 *
 * Provides local biometric app unlock on supported mobile & desktop devices (Touch ID, Face ID, Windows Hello).
 *
 * ARCHITECTURAL INVARIANT:
 * Do not substitute device biometrics for Crowdbeats server authentication.
 * Device biometrics protect local application access and session cache, while all financial,
 * administrative, and profile operations are cryptographically verified by Firebase Auth tokens and server sessions.
 */

export const BIOMETRIC_SECURITY_DISCLAIMER =
  'Device biometrics (Face ID, Touch ID, Windows Hello) lock the local Crowdbeats application on this hardware. ' +
  'Biometrics do not replace Crowdbeats server-side cryptographic authentication or financial verification.';

const BIOMETRIC_STORAGE_KEY = 'cb_biometric_app_unlock_enabled';

export function isBiometricUnlockEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(BIOMETRIC_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setBiometricUnlockEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BIOMETRIC_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('cb_biometric_preference_changed', { detail: { enabled } }));
  } catch {
    // non-fatal
  }
}
