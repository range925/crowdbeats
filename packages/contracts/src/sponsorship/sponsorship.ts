/**
 * Crowdbeats V2 — Sponsorship and Match Pool Contracts (Phase 3)
 *
 * Collection paths:
 * - /sponsorships/{sponsorshipId}
 * - /matchPools/{poolId}
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { ISO4217CurrencyCode } from '../common/money';

export const SponsorshipStatus = {
  PROPOSED: 'proposed',
  NEGOTIATING: 'negotiating',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type SponsorshipStatus = (typeof SponsorshipStatus)[keyof typeof SponsorshipStatus];

export interface Sponsorship {
  readonly sponsorshipId: string;
  readonly orgId: string;
  readonly recipientId: string; // artistId or bandId
  readonly recipientType: 'artist' | 'band';
  readonly status: SponsorshipStatus;
  readonly title: string;
  readonly description?: string;
  readonly valueAmountCents: number;
  readonly currency: ISO4217CurrencyCode;
  readonly startsAt?: IsoTimestamp;
  readonly endsAt?: IsoTimestamp;
  readonly signedByOrgAt?: IsoTimestamp; // Set by SPONSOR_ADMIN
  readonly signedByArtistAt?: IsoTimestamp; // Set by artist/band founder
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export const MatchPoolStatus = {
  ACTIVE: 'active',
  EXHAUSTED: 'exhausted',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type MatchPoolStatus = (typeof MatchPoolStatus)[keyof typeof MatchPoolStatus];

export interface MatchPool {
  readonly poolId: string;
  readonly orgId: string;
  readonly recipientId: string;
  readonly recipientType: 'artist' | 'band';
  readonly status: MatchPoolStatus;
  readonly totalPoolCents: number;
  readonly remainingPoolCents: number; // SERVER_ONLY
  readonly matchRatioBps: number; // e.g. 10000 = 1:1 match (100%)
  readonly perTipCapCents?: number; // Max match per individual tip
  readonly startsAt: IsoTimestamp;
  readonly expiresAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}
