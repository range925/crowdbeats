/**
 * Crowdbeats V2 — Fan Profile Contract (Phase 3)
 * Privacy: OWNER_ONLY for financial fields; public for displayName/avatar.
 */

import type { IsoTimestamp } from '../common/timestamp';

export interface FanProfile {
  readonly uid: string;
  readonly displayName: string;
  readonly photoUrl?: string;
  readonly bio?: string;
  /** Total tips sent in cents. SERVER_ONLY — never client-writable. */
  readonly totalTippedCents: number;
  /** Followed artist IDs. Max 1000. */
  readonly followingArtistIds: readonly string[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export const FAN_BIO_MAX = 300 as const;
export const FAN_FOLLOWING_MAX = 1000 as const;

export interface FanProfileUpdatePayload {
  readonly bio?: string;
  readonly photoUrl?: string;
}
