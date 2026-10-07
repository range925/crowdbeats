/**
 * Crowdbeats V2 — Venue Profile and Membership Contracts (Phase 3 & 9)
 *
 * Collection paths:
 * - /venueProfiles/{venueId}
 * - /venueProfiles/{venueId}/members/{uid}
 * - /venueProfiles/{venueId}/invitations/{invitationId}
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { VenueRole } from '../identity/roles';

export interface VenueProfile {
  readonly venueId: string;
  readonly ownerUid: string;
  readonly name: string;
  readonly description?: string;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly address: VenueAddress;
  readonly capacity?: number;
  readonly isActive: boolean;
  /** Stripe Account ID. SERVER_ONLY. */
  readonly stripeAccountId?: string;
  readonly bankLinked: boolean;
  readonly geofenceRadiusMeters?: number;
  readonly memberCount: number;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export interface VenueAddress {
  readonly street?: string;
  readonly city: string;
  readonly state?: string;
  readonly postalCode?: string;
  readonly country: string; // ISO 3166-1 alpha-2
  readonly lat?: number;
  readonly lng?: number;
}

export interface VenueMember {
  readonly uid: string;
  readonly venueId: string;
  readonly role: VenueRole;
  readonly displayName: string;
  readonly joinedAt: IsoTimestamp;
  readonly invitedByUid: string;
  readonly leftAt?: IsoTimestamp;
  readonly isActive: boolean;
}

export const VENUE_INVITATION_TTL_DAYS = 7 as const;

export interface VenueInvitation {
  readonly invitationId: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly inviteeEmail: string;
  readonly role: VenueRole;
  readonly invitedByUid: string;
  readonly invitedByName: string;
  readonly status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
  readonly expiresAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
  readonly respondedAt?: IsoTimestamp;
}

export interface InviteVenueStaffPayload {
  readonly venueId: string;
  readonly email: string;
  readonly role: VenueRole;
}

export interface RespondVenueInvitationPayload {
  readonly invitationId: string;
  readonly action: 'accept' | 'decline';
}

export interface CreateStagePayload {
  readonly venueId: string;
  readonly name: string;
  readonly description?: string;
  readonly capacity?: number;
}

export const VENUE_NAME_MAX = 100 as const;
export const VENUE_DESCRIPTION_MAX = 2000 as const;

export interface VenueUpdatePayload {
  readonly name?: string;
  readonly description?: string;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly address?: Partial<VenueAddress>;
  readonly capacity?: number;
  readonly geofenceRadiusMeters?: number;
}

export interface VenuePublicProjection {
  readonly venueId: string;
  readonly name: string;
  readonly description?: string;
  readonly photoUrl?: string;
  readonly address: Pick<VenueAddress, 'city' | 'state' | 'country' | 'lat' | 'lng'>;
  readonly capacity?: number;
  readonly isActive: boolean;
}
