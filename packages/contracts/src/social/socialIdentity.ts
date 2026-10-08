/**
 * Crowdbeats V2 — Social Identity Contract
 *
 * Defines the entities participating in the social graph (Fan, Solo Musician, Band)
 * and distinguishes the authenticated human operator from the acting social identity.
 */

export type SocialEntityType = 'fan' | 'artist' | 'band' | 'venue' | 'sponsor';

export interface SocialIdentityRef {
  /** The social identity ID (user UID, artistProfile ID, or band ID). */
  readonly id: string;
  /** The entity persona type. */
  readonly type: SocialEntityType;
  /** Optional display name cached for presentation. */
  readonly displayName?: string;
  /** Optional avatar URL cached for presentation. */
  readonly avatarUrl?: string;
  /** Optional handle or slug (e.g. '@luna-hollis'). */
  readonly handle?: string;
}

export interface SocialProfileSummary {
  readonly id: string;
  readonly type: SocialEntityType;
  readonly name: string;
  readonly handle?: string;
  readonly avatarUrl?: string;
  readonly isVerified?: boolean;
  readonly bio?: string;
  readonly followerCount?: number;
  readonly followingCount?: number;
  /** True if this entity follows the authenticated viewer. */
  readonly followsViewer?: boolean;
  /** True if the authenticated viewer follows this entity. */
  readonly viewerIsFollowing?: boolean;
}

export type BandOperatorRole = 'FOUNDER' | 'ADMIN' | 'MEMBER';
