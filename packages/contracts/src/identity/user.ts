/**
 * Crowdbeats V2 — User Record Contract (Phase 3)
 *
 * One UserRecord per Firebase UID. This is the identity anchor.
 * Privacy: OWNER_ONLY for most fields. Minimal public projection available.
 *
 * INVARIANTS:
 * - uid matches Firebase Auth UID exactly
 * - email is NEVER returned in public projections
 * - phoneNumber is SERVER_ONLY
 * - No `balance`, `isAdmin`, or `role` fields on this document
 * - Soft-delete only: deletedAt is set; document not removed (audit requirement)
 * - Version field (v) enables optimistic concurrency on high-risk updates
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { PersonaType } from './roles';

// ─── User Record ──────────────────────────────────────────────────────────────

export interface UserRecord {
  readonly uid: string;
  readonly email: string; // OWNER_ONLY
  readonly emailVerified: boolean;
  readonly displayName: string;
  readonly photoUrl?: string;
  readonly personaType: PersonaType;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  /** Optimistic concurrency version. Increment on every update. */
  readonly v: number;
  /** Soft-delete timestamp. Set by SUPER_ADMIN or GDPR deletion request. */
  readonly deletedAt?: IsoTimestamp;
  /** Account suspension timestamp. Set by TRUST_SAFETY staff. */
  readonly suspendedAt?: IsoTimestamp;
  /** Reason for suspension (staff-only visible). */
  readonly suspensionReason?: string;
}

// ─── Public Projection ────────────────────────────────────────────────────────

/** Safe public-facing user data. No PII fields. */
export interface UserPublicProjection {
  readonly uid: string;
  readonly displayName: string;
  readonly photoUrl?: string;
  readonly personaType: PersonaType;
}

// ─── Create / Update Payloads ─────────────────────────────────────────────────

/** Fields a user may set on their own profile via a Cloud Function. */
export interface UserUpdatePayload {
  /** Min 2, max 50 characters. No HTML. */
  readonly displayName?: string;
  /** Must be a valid https:// URL pointing to Firebase Storage. */
  readonly photoUrl?: string;
}

export const USER_DISPLAY_NAME_MIN = 2 as const;
export const USER_DISPLAY_NAME_MAX = 50 as const;

export function validateUserUpdatePayload(p: UserUpdatePayload): void {
  if (p.displayName !== undefined) {
    if (
      p.displayName.length < USER_DISPLAY_NAME_MIN ||
      p.displayName.length > USER_DISPLAY_NAME_MAX
    ) {
      throw new Error(
        `displayName must be ${USER_DISPLAY_NAME_MIN}–${USER_DISPLAY_NAME_MAX} characters.`,
      );
    }
    if (/<[^>]*>/.test(p.displayName)) {
      throw new Error('displayName must not contain HTML tags.');
    }
  }
  if (p.photoUrl !== undefined && !p.photoUrl.startsWith('https://')) {
    throw new Error('photoUrl must be a valid https:// URL.');
  }
}

// ─── Consent Record ───────────────────────────────────────────────────────────

export const ConsentType = {
  TERMS_OF_SERVICE: 'TERMS_OF_SERVICE',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  MARKETING_EMAILS: 'MARKETING_EMAILS',
  PUSH_NOTIFICATIONS: 'PUSH_NOTIFICATIONS',
  ANALYTICS: 'ANALYTICS',
} as const;

export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType];

export interface ConsentRecord {
  readonly uid: string;
  readonly consentType: ConsentType;
  readonly version: string; // e.g. "2026-08-25"
  readonly granted: boolean;
  readonly grantedAt: IsoTimestamp;
  readonly ipAddress?: string; // Hashed — OWNER+COMPLIANCE only
  readonly platform: 'ios' | 'android' | 'web';
}
