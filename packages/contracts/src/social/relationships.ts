/**
 * Crowdbeats V2 — Social Relationship & Follow Contracts
 *
 * Covers all 9 directed pairs between Fans, Solo Musicians, and Bands.
 */

import type { IsoTimestamp } from '../common/timestamp.js';
import type { SocialEntityType, SocialProfileSummary } from './socialIdentity.js';

export type FollowStatus = 'active' | 'pending' | 'none';

export interface FollowRelationshipState {
  readonly isFollowing: boolean;
  readonly isFollowedBy: boolean;
  readonly followsYou: boolean;
  readonly mutualFollow: boolean;
  readonly isBlocked: boolean;
  readonly isRestricted: boolean;
}

export interface FollowRecord {
  readonly followId: string;
  readonly sourceId: string;
  readonly sourceType: SocialEntityType;
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  /** Human operator who authorized this follow action. */
  readonly operatorUid: string;
  readonly createdAt: IsoTimestamp;
  readonly status: FollowStatus;
}

// ── Follow Entity Callable Requests / Responses ─────────────────────────────

export interface FollowEntityRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  /** If the caller is acting on behalf of a band they manage. */
  readonly actingAsBandId?: string;
  /** If the caller is acting on behalf of an artist profile they manage. */
  readonly actingAsArtistId?: string;
}

export interface FollowEntityResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
}

export interface UnfollowEntityRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export interface UnfollowEntityResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
}

export interface RemoveFollowerRequest {
  /** The incoming follower ID to remove. */
  readonly followerId: string;
  readonly followerType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export interface RemoveFollowerResponse {
  readonly ok: boolean;
  readonly relationshipState: FollowRelationshipState;
}

export interface GetRelationshipStateRequest {
  readonly targetId: string;
  readonly targetType?: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export interface ListFollowersRequest {
  readonly entityId: string;
  readonly entityType: SocialEntityType;
  readonly limit?: number;
  readonly startAfter?: string;
  readonly searchQuery?: string;
}

export interface ListFollowersResponse {
  readonly items: Array<SocialProfileSummary & { followedAt?: string }>;
  readonly nextCursor?: string;
  readonly totalCount: number;
}

export interface ListFollowingRequest {
  readonly entityId: string;
  readonly entityType: SocialEntityType;
  readonly limit?: number;
  readonly startAfter?: string;
  readonly searchQuery?: string;
}

export interface ListFollowingResponse {
  readonly items: Array<SocialProfileSummary & { followedAt?: string }>;
  readonly nextCursor?: string;
  readonly totalCount: number;
}
