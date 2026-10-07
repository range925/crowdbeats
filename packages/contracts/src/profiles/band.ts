/**
 * Crowdbeats V2 — Band, Band Membership, and Split Config Contracts (Phase 3)
 *
 * Collection paths:
 * - /bands/{bandId}
 * - /bands/{bandId}/members/{uid}
 * - /bands/{bandId}/splitConfig/current
 *
 * INVARIANTS:
 * - splitConfig is SERVER-WRITTEN ONLY — no client may write it directly
 * - Split percentages are in basis points (integer), must total 10000
 * - OD-09: Largest Remainder Method for odd-cent distribution
 * - Band founder cannot be removed (only transfer ownership then leave)
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { BandRole } from '../identity/roles';
import type { MemberSplitBps } from '../common/money';

// ─── Band ─────────────────────────────────────────────────────────────────────

export interface Band {
  readonly bandId: string;
  readonly founderUid: string;
  readonly name: string;
  readonly creatorSlug?: string;
  readonly canonicalProfileUrl?: string;
  readonly bio?: string;
  readonly tagline?: string;
  readonly originCity?: string;
  readonly influences?: readonly string[];
  readonly accolades?: readonly string[];
  readonly audioPreviewUrl?: string;
  readonly featuredTrackTitle?: string;
  readonly rosterPreview?: readonly BandRosterMember[];
  readonly showFanWall?: boolean;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres: readonly string[];
  readonly socialLinks: BandSocialLinks;
  readonly isActive: boolean;
  readonly memberCount: number; // SERVER_ONLY — maintained by Cloud Functions
  /** Stripe Express Account ID for the band (if tips go directly to band). SERVER_ONLY. */
  readonly stripeAccountId?: string;
  readonly bankLinked: boolean;
  /** Total tips received by band as entity. SERVER_ONLY. */
  readonly totalTipsReceivedCents: number;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export interface BandRosterMember {
  readonly uid?: string;
  readonly name: string;
  readonly role: string;
  readonly instrument: string;
  readonly photoUrl?: string;
}

export interface BandSocialLinks {
  readonly instagram?: string;
  readonly tiktok?: string;
  readonly spotify?: string;
  readonly appleMusic?: string;
  readonly youtube?: string;
  readonly website?: string;
}

export const BAND_NAME_MAX = 80 as const;
export const BAND_BIO_MAX = 1000 as const;
export const BAND_TAGLINE_MAX = 140 as const;
export const BAND_MEMBERS_MAX = 20 as const;

// ─── Band Membership ──────────────────────────────────────────────────────────

export interface BandMember {
  readonly uid: string;
  readonly bandId: string;
  readonly role: BandRole;
  readonly displayName: string; // Snapshot at time of join
  readonly photoUrl?: string;
  readonly joinedAt: IsoTimestamp;
  readonly invitedByUid: string;
  /** Set when member leaves or is removed. Document retained for audit. */
  readonly leftAt?: IsoTimestamp;
  readonly isActive: boolean;
}

// ─── Split Config ─────────────────────────────────────────────────────────────

/**
 * SERVER-WRITTEN ONLY. No client may write this document directly.
 * Founder sets splits via Cloud Function which validates and writes atomically.
 * splitBps must total exactly 10000 for all active members.
 */
export interface BandSplitConfig {
  readonly bandId: string;
  readonly splits: readonly MemberSplitBps[];
  readonly setByUid: string; // Band founder who submitted the config
  readonly validatedAt: IsoTimestamp; // Server-set on write
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export interface SetBandSplitConfigPayload {
  readonly bandId: string;
  readonly splits: readonly MemberSplitBps[];
  readonly idempotencyKey: string;
}

// ─── Band Update Payload ──────────────────────────────────────────────────────

export interface BandUpdatePayload {
  readonly name?: string;
  readonly creatorSlug?: string;
  readonly bio?: string;
  readonly tagline?: string;
  readonly originCity?: string;
  readonly influences?: readonly string[];
  readonly accolades?: readonly string[];
  readonly audioPreviewUrl?: string;
  readonly featuredTrackTitle?: string;
  readonly rosterPreview?: readonly BandRosterMember[];
  readonly showFanWall?: boolean;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres?: readonly string[];
  readonly socialLinks?: Partial<BandSocialLinks>;
}

// ─── Public Projection ────────────────────────────────────────────────────────

export interface BandPublicProjection {
  readonly bandId: string;
  readonly name: string;
  readonly creatorSlug?: string;
  readonly canonicalProfileUrl?: string;
  readonly bio?: string;
  readonly tagline?: string;
  readonly originCity?: string;
  readonly influences?: readonly string[];
  readonly accolades?: readonly string[];
  readonly audioPreviewUrl?: string;
  readonly featuredTrackTitle?: string;
  readonly rosterPreview?: readonly BandRosterMember[];
  readonly showFanWall?: boolean;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres: readonly string[];
  readonly memberCount: number;
  readonly isActive: boolean;
}

// ─── Phase 8: Band Governance & Invitations ───────────────────────────────────

export const BAND_INVITATION_TTL_DAYS = 7 as const;

export type BandInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface BandInvitation {
  readonly invitationId: string;
  readonly bandId: string;
  readonly bandName: string;
  readonly inviteeEmail: string;
  readonly inviteeUid?: string;
  readonly role: BandRole;
  readonly invitedByUid: string;
  readonly status: BandInvitationStatus;
  readonly expiresAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly respondedAt?: IsoTimestamp;
}

export interface BandSplitVersion {
  readonly version: number;
  readonly bandId: string;
  readonly splits: readonly MemberSplitBps[];
  readonly setByUid: string;
  readonly effectiveAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}

export interface MemberEarningsSnapshot {
  readonly uid: string;
  readonly displayName: string;
  readonly role: BandRole;
  readonly splitBps: number;
  readonly totalEarnedCents: number;
  readonly availableBalanceCents: number;
  readonly pendingKycBalanceCents: number;
  readonly stripeChargesEnabled: boolean;
  readonly stripePayoutsEnabled: boolean;
}

export interface BandTreasurySummary {
  readonly bandId: string;
  readonly totalTipsReceivedCents: number;
  readonly platformFeesPaidCents: number;
  readonly netDistributedCents: number;
  readonly currentSplitVersion: number;
  readonly members: readonly MemberEarningsSnapshot[];
}

export interface InviteMemberPayload {
  readonly bandId: string;
  readonly email: string;
  readonly role: BandRole;
  readonly idempotencyKey: string;
}

export interface RespondInvitationPayload {
  readonly invitationId: string;
  readonly response: 'accept' | 'decline';
  readonly idempotencyKey: string;
}

export interface UpdateMemberRolePayload {
  readonly bandId: string;
  readonly memberUid: string;
  readonly newRole: BandRole;
  readonly idempotencyKey: string;
}

export interface RemoveMemberPayload {
  readonly bandId: string;
  readonly memberUid: string;
  readonly reason?: string;
  readonly idempotencyKey: string;
}

export interface TransferOwnershipPayload {
  readonly bandId: string;
  readonly targetUid: string;
  readonly confirmationPhrase: string; // Must match "TRANSFER OWNERSHIP"
  readonly idempotencyKey: string;
}
