/**
 * Crowdbeats V2 — Artist Profile Contract (Phase 3)
 *
 * Privacy:
 * - stageName, genre, bio, photoUrl, coverUrl: PUBLIC
 * - totalTipsReceivedCents, stripeAccountId, bankLinked: SERVER_ONLY
 * - verifiedAt: PUBLIC (badge display)
 */

import type { IsoTimestamp } from '../common/timestamp';

export const MusicGenre = {
  POP: 'pop',
  ROCK: 'rock',
  HIP_HOP: 'hip_hop',
  JAZZ: 'jazz',
  CLASSICAL: 'classical',
  ELECTRONIC: 'electronic',
  COUNTRY: 'country',
  RNB: 'rnb',
  FOLK: 'folk',
  LATIN: 'latin',
  REGGAE: 'reggae',
  BLUES: 'blues',
  OTHER: 'other',
} as const;

export type MusicGenre = (typeof MusicGenre)[keyof typeof MusicGenre];

export interface ArtistProfile {
  readonly artistId: string; // = uid for solo artists
  readonly ownerUid: string;
  readonly stageName: string;
  readonly creatorSlug?: string;
  readonly canonicalProfileUrl?: string;
  readonly bio?: string;
  readonly tagline?: string;
  readonly originCity?: string;
  readonly instruments?: readonly string[];
  readonly influences?: readonly string[];
  readonly accolades?: readonly string[];
  readonly audioPreviewUrl?: string;
  readonly featuredTrackTitle?: string;
  readonly showFanWall?: boolean;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres: readonly MusicGenre[];
  readonly socialLinks: ArtistSocialLinks;
  /** True when platform has verified identity. Set by ARTIST_RELATIONS staff. */
  readonly verifiedAt?: IsoTimestamp;
  /** Total tips received in cents. SERVER_ONLY. */
  readonly totalTipsReceivedCents: number;
  /** Stripe Express Account ID. SERVER_ONLY. */
  readonly stripeAccountId?: string;
  /** True when Stripe onboarding is complete. SERVER_ONLY. */
  readonly bankLinked: boolean;
  readonly isActive: boolean;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly v: number;
}

export interface ArtistSocialLinks {
  readonly instagram?: string;
  readonly tiktok?: string;
  readonly spotify?: string;
  readonly appleMusic?: string;
  readonly youtube?: string;
  readonly soundcloud?: string;
  readonly website?: string;
}

export const ARTIST_STAGE_NAME_MAX = 80 as const;
export const ARTIST_BIO_MAX = 1000 as const;
export const ARTIST_TAGLINE_MAX = 140 as const;
export const ARTIST_GENRES_MAX = 3 as const;

export interface ArtistProfileUpdatePayload {
  readonly stageName?: string;
  readonly creatorSlug?: string;
  readonly bio?: string;
  readonly tagline?: string;
  readonly originCity?: string;
  readonly instruments?: readonly string[];
  readonly influences?: readonly string[];
  readonly accolades?: readonly string[];
  readonly audioPreviewUrl?: string;
  readonly featuredTrackTitle?: string;
  readonly showFanWall?: boolean;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres?: readonly MusicGenre[];
  readonly socialLinks?: Partial<ArtistSocialLinks>;
}

/** Public projection for discovery and display. No financial fields. */
export interface ArtistPublicProjection {
  readonly artistId: string;
  readonly stageName: string;
  readonly creatorSlug?: string;
  readonly canonicalProfileUrl?: string;
  readonly bio?: string;
  readonly tagline?: string;
  readonly originCity?: string;
  readonly instruments?: readonly string[];
  readonly influences?: readonly string[];
  readonly accolades?: readonly string[];
  readonly audioPreviewUrl?: string;
  readonly featuredTrackTitle?: string;
  readonly showFanWall?: boolean;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres: readonly MusicGenre[];
  readonly socialLinks: ArtistSocialLinks;
  readonly verifiedAt?: string;
  readonly isActive: boolean;
}

