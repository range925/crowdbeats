/**
 * Crowdbeats V2 — Follow Contract (Phase 6)
 *
 * Collection path: /follows/{fanUid}_{artistId}
 *
 * INVARIANTS:
 * - Document ID is compound: "{fanUid}_{artistId}"
 * - Clients may create/delete their own follow records
 * - followerCount on artistProfile is SERVER-MAINTAINED
 * - Clients cannot increment followerCount directly
 */

import type { IsoTimestamp } from '../common/timestamp';

// ── Follow Record ─────────────────────────────────────────────────────────────

export interface Follow {
  /** Fan's Firebase Auth UID. */
  readonly fanUid: string;
  /** Artist profile ID being followed. */
  readonly artistId: string;
  readonly createdAt: IsoTimestamp;
}

// ── Follow Callables ──────────────────────────────────────────────────────────

export interface FollowArtistRequest {
  readonly artistId: string;
}

export interface FollowArtistResponse {
  readonly ok: boolean;
}
