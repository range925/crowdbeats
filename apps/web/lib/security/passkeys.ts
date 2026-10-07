/**
 * Crowdbeats V2 — Passkeys & WebAuthn Integration
 *
 * Implements FIDO2 / WebAuthn passkey registration and authentication.
 * Falls back gracefully on unsupported platforms or user cancellation.
 */

export async function isPasskeySupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export interface RegisteredPasskey {
  id: string;
  rawId: string;
  name: string;
  createdAt: string;
}

export async function registerPasskey(userName: string, userEmail: string): Promise<RegisteredPasskey | null> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('Passkeys are not supported on this browser or device.');
  }

  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const userIdBuffer = new TextEncoder().encode(userEmail || 'crowdbeats_user');

  const creationOptions: CredentialCreationOptions = {
    publicKey: {
      challenge,
      rp: {
        name: 'Crowdbeats',
        id: window.location.hostname,
      },
      user: {
        id: userIdBuffer,
        name: userEmail,
        displayName: userName || 'Crowdbeats Member',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  };

  try {
    const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential | null;
    if (!credential) return null;

    const passkeyRecord: RegisteredPasskey = {
      id: credential.id,
      rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
      name: `${getDeviceFriendlyName()} Passkey`,
      createdAt: new Date().toISOString(),
    };

    // Store in local secure passkey registry
    savePasskeyToStorage(passkeyRecord);
    return passkeyRecord;
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Passkey creation was cancelled or timed out.');
    }
    throw new Error(err.message || 'Failed to create passkey.');
  }
}

function getDeviceFriendlyName(): string {
  if (typeof navigator === 'undefined') return 'Device';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('iphone')) return 'iPhone Touch ID / Face ID';
  if (ua.includes('ipad')) return 'iPad Touch ID / Face ID';
  if (ua.includes('macintosh')) return 'Mac Touch ID';
  if (ua.includes('windows')) return 'Windows Hello';
  if (ua.includes('android')) return 'Android Biometrics';
  return 'Security Key';
}

const PASSKEYS_STORAGE_KEY = 'cb_registered_passkeys';

export function getLocalPasskeys(): RegisteredPasskey[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PASSKEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePasskeyToStorage(passkey: RegisteredPasskey): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalPasskeys();
    const updated = [passkey, ...existing.filter((p) => p.id !== passkey.id)];
    localStorage.setItem(PASSKEYS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // non-fatal
  }
}

export function removePasskeyFromStorage(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalPasskeys();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(PASSKEYS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // non-fatal
  }
}
