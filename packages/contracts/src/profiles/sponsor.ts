/**
 * Crowdbeats V2 — Sponsor Organization and Membership Contracts (Phase 3 & 9)
 *
 * OD-08: Option A — 2 roles: SPONSOR_ADMIN / SPONSOR_REP
 *
 * Collection paths:
 * - /sponsorOrgs/{orgId}
 * - /sponsorOrgs/{orgId}/members/{uid}
 * - /sponsorOrgs/{orgId}/invitations/{invitationId}
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { SponsorRole } from '../identity/roles';

export interface SponsorOrg {
  readonly orgId: string;
  readonly adminUid: string; // Primary SPONSOR_ADMIN
  readonly name: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly website?: string;
  readonly industry?: string;
  readonly isVerified: boolean; // Set by PARTNERSHIPS staff
  readonly isActive: boolean;
  /** Total escrow deposited in cents. SERVER_ONLY. */
  readonly totalEscrowDepositedCents: number;
  /** Available escrow balance in cents. SERVER_ONLY. */
  readonly availableEscrowCents: number;
  /** Total matched tips in cents. SERVER_ONLY. */
  readonly totalMatchedCents: number;
  /** Stripe Customer ID for escrow deposits. SERVER_ONLY. */
  readonly stripeCustomerId?: string;
  readonly memberCount: number;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export interface SponsorMember {
  readonly uid: string;
  readonly orgId: string;
  readonly role: SponsorRole;
  readonly displayName: string;
  readonly jobTitle?: string;
  readonly joinedAt: IsoTimestamp;
  readonly invitedByUid: string;
  readonly leftAt?: IsoTimestamp;
  readonly isActive: boolean;
}

export const SPONSOR_INVITATION_TTL_DAYS = 7 as const;

export interface SponsorInvitation {
  readonly invitationId: string;
  readonly orgId: string;
  readonly orgName: string;
  readonly inviteeEmail: string;
  readonly role: SponsorRole;
  readonly invitedByUid: string;
  readonly invitedByName: string;
  readonly status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  readonly expiresAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly respondedAt?: IsoTimestamp;
}

export interface InviteSponsorMemberPayload {
  readonly orgId: string;
  readonly email: string;
  readonly role: SponsorRole;
}

export interface RespondSponsorInvitationPayload {
  readonly invitationId: string;
  readonly action: 'accept' | 'decline';
}

export interface DepositEscrowPayload {
  readonly orgId: string;
  readonly amountCents: number;
  readonly idempotencyKey: string;
}

export const SPONSOR_NAME_MAX = 100 as const;
export const SPONSOR_DESCRIPTION_MAX = 2000 as const;
export const SPONSOR_MEMBERS_MAX = 50 as const;

export interface SponsorOrgUpdatePayload {
  readonly name?: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly website?: string;
  readonly industry?: string;
}

export interface SponsorOrgPublicProjection {
  readonly orgId: string;
  readonly name: string;
  readonly description?: string;
  readonly logoUrl?: string;
  readonly website?: string;
  readonly industry?: string;
  readonly isVerified: boolean;
}
