/**
 * Crowdbeats V2 — Public Discovery & Location Search Contracts
 *
 * Provides platform-neutral domain types for unauthenticated music discovery,
 * location-first hierarchy (Search -> Compact Map -> Top 5 Nearby -> Top 3 Popular),
 * AI-generated profile card summaries, and progressive auth resumption.
 */

import type { IsoTimestamp } from '../common/timestamp';

export const DiscoveryCategory = {
  LIVE_NOW: 'LIVE_NOW',
  NEAR_YOU: 'NEAR_YOU',
  POPULAR: 'POPULAR',
  TRENDING: 'TRENDING',
  SOLO_MUSICIANS: 'SOLO_MUSICIANS',
  BANDS: 'BANDS',
  VENUES: 'VENUES',
  UPCOMING: 'UPCOMING',
  GENRES: 'GENRES',
  FEATURED: 'FEATURED',
  NEW_TO_CROWDBEATS: 'NEW_TO_CROWDBEATS',
} as const;

export type DiscoveryCategory = (typeof DiscoveryCategory)[keyof typeof DiscoveryCategory];

export type AiSummaryStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REVIEW_REQUIRED' | 'REJECTED' | 'FALLBACK';

export interface DiscoveryLocation {
  readonly placeId: string;
  readonly displayName: string;
  readonly city: string;
  readonly administrativeArea?: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly geohash?: string;
  readonly viewport?: {
    readonly northeast: { readonly lat: number; readonly lng: number };
    readonly southwest: { readonly lat: number; readonly lng: number };
  };
}

export interface LocationSearchResult {
  readonly placeId: string;
  readonly mainText: string;
  readonly secondaryText: string;
  readonly description: string;
  readonly types: readonly string[];
}

export interface PublicArtistProfile {
  readonly artistId: string;
  readonly creatorSlug: string;
  readonly stageName: string;
  readonly bio?: string;
  readonly aiCardSummary?: string;
  readonly aiSummaryStatus?: AiSummaryStatus;
  readonly aiSummaryGeneratedAt?: IsoTimestamp;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres: readonly string[];
  readonly socialLinks: Record<string, string>;
  readonly isVerified: boolean;
  readonly isLive: boolean;
  readonly currentVenueId?: string;
  readonly currentVenueName?: string;
  readonly activePerformanceId?: string;
  readonly distanceMiles?: number;
  readonly discoveryLocation?: {
    readonly city?: string;
    readonly administrativeArea?: string;
    readonly country?: string;
    readonly latitude?: number;
    readonly longitude?: number;
  };
  readonly popularityScore?: number;
  readonly trendingScore?: number;
}

export interface PublicBandProfile {
  readonly bandId: string;
  readonly bandSlug: string;
  readonly name: string;
  readonly bio?: string;
  readonly aiCardSummary?: string;
  readonly aiSummaryStatus?: AiSummaryStatus;
  readonly aiSummaryGeneratedAt?: IsoTimestamp;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly genres: readonly string[];
  readonly memberCount: number;
  readonly socialLinks: Record<string, string>;
  readonly isVerified: boolean;
  readonly isLive: boolean;
  readonly currentVenueId?: string;
  readonly currentVenueName?: string;
  readonly activePerformanceId?: string;
  readonly distanceMiles?: number;
  readonly discoveryLocation?: {
    readonly city?: string;
    readonly administrativeArea?: string;
    readonly country?: string;
    readonly latitude?: number;
    readonly longitude?: number;
  };
  readonly popularityScore?: number;
  readonly trendingScore?: number;
}

export interface PublicVenueProfile {
  readonly venueId: string;
  readonly name: string;
  readonly description?: string;
  readonly photoUrl?: string;
  readonly coverUrl?: string;
  readonly city: string;
  readonly state?: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly address?: string;
  readonly activeMusiciansCount?: number;
  readonly stages?: readonly {
    readonly stageId: string;
    readonly stageName: string;
    readonly currentPerformanceId?: string;
  }[];
}

export interface PublicLivePerformance {
  readonly performanceId: string;
  readonly title: string;
  readonly performerId: string;
  readonly performerType: 'artist' | 'band';
  readonly performerName: string;
  readonly photoUrl?: string;
  readonly genre: string;
  readonly venueId: string;
  readonly venueName: string;
  readonly stageName: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly distanceMiles?: number;
  readonly startedAt: IsoTimestamp;
  readonly estimatedEndAt?: IsoTimestamp;
  readonly liveListenerCount?: number;
}

export interface PendingTipAction {
  readonly creatorId: string;
  readonly creatorSlug?: string;
  readonly creatorName: string;
  readonly creatorType: 'artist' | 'band';
  readonly creatorPhotoUrl?: string;
  readonly selectedTipAmountCents: number;
  readonly currency: string;
  readonly sourceScreen: string;
  readonly performanceId?: string;
  readonly venueId?: string;
  readonly message?: string;
  readonly timestamp: number;
}

export interface PendingFollowAction {
  readonly creatorId: string;
  readonly creatorType: 'artist' | 'band';
  readonly creatorName: string;
  readonly timestamp: number;
}

export interface PublicDiscoveryFeedQuery {
  readonly latitude?: number;
  readonly longitude?: number;
  readonly radiusMiles?: number;
  readonly city?: string;
  readonly administrativeArea?: string;
  readonly country?: string;
  readonly category?: DiscoveryCategory;
  readonly genre?: string;
  readonly limit?: number;
  readonly pageToken?: string;
}

export interface PublicDiscoveryFeedResponse {
  readonly location: DiscoveryLocation;
  readonly topNearby: readonly (PublicArtistProfile | PublicBandProfile)[];
  readonly topPopular: readonly (PublicArtistProfile | PublicBandProfile)[];
  readonly livePerformances: readonly PublicLivePerformance[];
  readonly featuredArtists: readonly PublicArtistProfile[];
  readonly featuredBands: readonly PublicBandProfile[];
  readonly nearbyVenues: readonly PublicVenueProfile[];
  readonly totalLiveCount: number;
  readonly totalVenuesCount: number;
  readonly nextPageToken?: string;
}

// ─── Phase 8 Two-Way Discovery & Read Volume Contracts ───────────────────────

export interface DiscoveryFilterOptions {
  readonly liveNow?: boolean;
  readonly startingSoon?: boolean;
  readonly performerType?: 'all' | 'artist' | 'band';
  readonly genres?: readonly string[];
  readonly maxDistanceMiles?: number;
  readonly setting?: 'all' | 'venue' | 'street';
  readonly accessibilityOnly?: boolean;
  readonly verifiedOnly?: boolean;
  readonly savedOnly?: boolean;
}

export interface DiscoveryQueryBounds {
  readonly center?: { readonly lat: number; readonly lng: number };
  readonly radiusMiles?: number;
  readonly viewport?: {
    readonly minLat: number;
    readonly maxLat: number;
    readonly minLng: number;
    readonly maxLng: number;
  };
  readonly geohashCells: readonly string[];
  readonly maxResults?: number;
}

export interface ReadVolumeMetrics {
  readonly documentReads: number;
  readonly queryExecutions: number;
  readonly cacheHits: number;
  readonly deduplicatedDocs: number;
  readonly snapshotEvents: number;
  readonly activeSubscriptions: number;
}

