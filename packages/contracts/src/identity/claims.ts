/**
 * Crowdbeats V2 — Firebase Auth Custom Claims Contract (Phase 3)
 *
 * DESIGN INVARIANTS:
 * - Custom claims MUST stay under 1KB (Firebase limit)
 * - Claims NEVER include: band memberships, payment status, email, balance
 * - Only platformRole (if staff) + personaType + version
 * - Membership roles are ALWAYS fetched from Firestore server-side
 * - Claims are set ONLY by Cloud Functions (never by clients)
 * - Clients NEVER trust their own ID token claims for authorization logic;
 *   server always re-reads claims from the Admin SDK verifyIdToken result
 */

import type { PlatformRole, PersonaType } from './roles';

// ─── Custom Claims ────────────────────────────────────────────────────────────

/**
 * Crowdbeats custom claims attached to Firebase ID tokens.
 * Set exclusively by Cloud Functions via admin.auth().setCustomUserClaims().
 */
export interface CrowdbeatsClaims {
  /** Present only for platform staff. Absent for regular users. */
  readonly platformRole?: PlatformRole;
  /** Active persona type for this user. Default: 'fan'. */
  readonly personaType: PersonaType;
  /**
   * Claims schema version. Increment when structure changes.
   * Clients must handle version mismatches gracefully (re-fetch if outdated).
   */
  readonly claimsVersion: number;
}

export const CURRENT_CLAIMS_VERSION = 1 as const;

/** Maximum safe size for claims payload in bytes. Firebase limit is 1000 bytes. */
export const MAX_CLAIMS_BYTES = 900 as const;

// ─── Claims Validation ────────────────────────────────────────────────────────

export function validateClaims(claims: CrowdbeatsClaims): void {
  const json = JSON.stringify(claims);
  if (new TextEncoder().encode(json).length > MAX_CLAIMS_BYTES) {
    throw new Error(`Claims payload exceeds ${MAX_CLAIMS_BYTES} bytes. Got: ${json.length} bytes.`);
  }
}

// ─── Default Claims ───────────────────────────────────────────────────────────

export function defaultFanClaims(): CrowdbeatsClaims {
  return { personaType: 'fan', claimsVersion: CURRENT_CLAIMS_VERSION };
}

export function staffClaims(role: PlatformRole): CrowdbeatsClaims {
  return { platformRole: role, personaType: 'staff', claimsVersion: CURRENT_CLAIMS_VERSION };
}

// ─── Step-Up Auth ─────────────────────────────────────────────────────────────

/**
 * Step-up auth actions that require additional verification before proceeding.
 * Used for high-risk operations (bank linkage, payout initiation, role grants).
 */
export const StepUpAction = {
  LINK_BANK_ACCOUNT: 'LINK_BANK_ACCOUNT',
  INITIATE_PAYOUT: 'INITIATE_PAYOUT',
  GRANT_STAFF_ROLE: 'GRANT_STAFF_ROLE',
  REVOKE_STAFF_ROLE: 'REVOKE_STAFF_ROLE',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  EXPORT_USER_DATA: 'EXPORT_USER_DATA',
  SIGN_CONTRACT: 'SIGN_CONTRACT',
} as const;

export type StepUpAction = (typeof StepUpAction)[keyof typeof StepUpAction];
