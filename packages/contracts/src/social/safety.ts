/**
 * Crowdbeats V2 — Social Safety, Block & Restriction Contracts
 *
 * Implements hard bidirectional block boundaries, quiet messaging restrictions,
 * and reporting to Admin Support.
 */

import type { IsoTimestamp } from '../common/timestamp.js';
import type { SocialEntityType, SocialProfileSummary } from './socialIdentity.js';

export interface SocialBlockRecord {
  readonly blockId: string;
  readonly blockerId: string;
  readonly blockerType: SocialEntityType;
  readonly blockedId: string;
  readonly blockedType: SocialEntityType;
  readonly operatorUid: string;
  readonly createdAt: IsoTimestamp;
  readonly reason?: string;
}

export interface SocialRestrictionRecord {
  readonly restrictionId: string;
  readonly restricterId: string;
  readonly restricterType: SocialEntityType;
  readonly restrictedId: string;
  readonly restrictedType: SocialEntityType;
  readonly operatorUid: string;
  readonly createdAt: IsoTimestamp;
}

// ── Block / Restrict Callable Requests / Responses ──────────────────────────

export interface BlockEntityRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
  readonly reason?: string;
}

export interface BlockEntityResponse {
  readonly ok: boolean;
  readonly isBlocked: boolean;
}

export interface UnblockEntityRequest {
  readonly targetId: string;
  readonly targetType?: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export interface UnblockEntityResponse {
  readonly ok: boolean;
  readonly isBlocked: boolean;
}

export interface RestrictEntityRequest {
  readonly targetId: string;
  readonly targetType: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export interface RestrictEntityResponse {
  readonly ok: boolean;
  readonly isRestricted: boolean;
}

export interface UnrestrictEntityRequest {
  readonly targetId: string;
  readonly targetType?: SocialEntityType;
  readonly actingAsBandId?: string;
  readonly actingAsArtistId?: string;
}

export interface UnrestrictEntityResponse {
  readonly ok: boolean;
  readonly isRestricted: boolean;
}

export interface ListBlockedEntitiesResponse {
  readonly items: SocialProfileSummary[];
}

export interface ListRestrictedEntitiesResponse {
  readonly items: SocialProfileSummary[];
}
