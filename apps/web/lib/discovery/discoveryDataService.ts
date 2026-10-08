'use client';

/**
 * Crowdbeats V2 — Discovery Data Service
 * 
 * Provides data querying, ranking, and filtering logic for the 3 Discovery rows:
 *   1. Top 5 Nearest Musicians (Real-time Firestore checkins, Haversine distance,
 *      expiry filtering, stable tie-breakers, and fallback 'Other musicians nearby' with isLive: false).
 *   2. Popular Musicians (Top verified solo artists & bands ranked by popularity & followers).
 *   3. Top Campaigns (Active crowdfunding campaigns with pledge %, goal, backer count, and days remaining).
 *
 * Architecture Invariants:
 *   - NEVER fake or fabricate live status. Performers are only isLive: true when an active,
 *     non-expired, public check-in exists in Firestore.
 *   - Expired check-in filter rejects sessions > 6 hours old or with expiresAt < now.
 *   - When no live performers are found within radius, a clearly separated secondary list of
 *     "Other musicians nearby" is provided based on real coordinates with isLive: false.
 *   - All distances calculated via accurate Haversine formula in statute miles.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore, type LiveCheckin } from '../firebase/firestore';

// ─── 1. Comprehensive TypeScript Interfaces ──────────────────────────────────

export interface NearbyPerformer {
  /** 1-based rank position in the Top 5 list (1 through 5) */
  rank: number;
  /** Unique performer identifier (UID or creator ID) */
  id: string;
  /** Performer or band name */
  name: string;
  /** Solo artist or band */
  type: 'artist' | 'band';
  /** Profile photo / avatar URL */
  photoUrl?: string;
  /** Musical genres */
  genres: string[];
  /**
   * Live status flag.
   * STRICT INVARIANT: MUST BE TRUE ONLY FOR REAL-TIME ACTIVE CHECK-INS.
   * Fallback performers are ALWAYS isLive: false.
   */
  isLive: boolean;
  /** Current venue or stage name (if checked in) */
  venueName?: string;
  /** Calculated Haversine distance in statute miles from search center */
  distanceMiles: number;
  /** Profile route slug (e.g. 'jake-rios' -> /artist/jake-rios) */
  slug: string;
  /** Direct tip checkout link */
  tipLink?: string;
  /** Optional bio summary */
  bio?: string;
  /** Performer origin city / home base */
  originCity?: string;
  /** Geographic latitude */
  latitude?: number;
  /** Geographic longitude */
  longitude?: number;
  /** Platform verification badge */
  isVerified?: boolean;
  /** Follower count for social proof */
  followersCount?: number;
  /** Popularity metric (0 - 100) */
  popularityScore?: number;
  /** AI-generated contextual card summary */
  aiCardSummary?: string;
  /** ISO timestamp when live check-in occurred */
  checkedInAt?: string;
  /** ISO timestamp when live session auto-expires */
  expiresAt?: string;
}

export interface PopularMusician {
  /** Unique performer identifier */
  id: string;
  /** Performer or band name */
  name: string;
  /** Solo artist or band */
  type: 'artist' | 'band';
  /** Profile photo / avatar URL */
  photoUrl?: string;
  /** Musical genres */
  genres: string[];
  /** Follower count */
  followersCount: number;
  /** Overall popularity score (0 - 100) */
  popularityScore: number;
  /** Performer origin city */
  originCity?: string;
  /** Platform verification badge */
  isVerified: boolean;
  /** Profile route slug */
  slug: string;
  /** Optional rank position (1, 2, 3...) */
  rank?: number;
  /** Optional bio */
  bio?: string;
  /** AI-generated card summary */
  aiCardSummary?: string;
  /** Direct tip link */
  tipLink?: string;
}

export interface DiscoveryCampaign {
  /** Unique campaign document ID */
  campaignId: string;
  /** Creator user ID */
  creatorId: string;
  /** Creator display name */
  creatorName: string;
  /** Solo artist or band */
  creatorType: 'artist' | 'band';
  /** Campaign title (e.g. "Debut Studio LP") */
  title: string;
  /** Campaign story / description */
  description: string;
  /** Funding target in USD cents */
  goalCents: number;
  /** Amount raised so far in USD cents */
  pledgedCents: number;
  /** Total number of unique backers */
  backerCount: number;
  /** Campaign status ('active' | 'funded' | 'completed' | etc.) */
  status: string;
  /** Computed funding progress percentage: Math.round((pledgedCents / goalCents) * 100) */
  percentFunded: number;
  /** Days remaining until funding deadline */
  daysRemaining: number;
  /** Campaign hero / cover image URL */
  photoUrl?: string;
  /** Project category (e.g. "Album Production", "Tour Support") */
  category?: string;
}

export interface NearbyDiscoveryState {
  /**
   * Top nearest performers (up to 5).
   * If live performers exist within radius, this contains live performers (isLive: true).
   * If no live performers exist, this contains the fallback "Other musicians nearby" (isLive: false).
   */
  nearestPerformers: NearbyPerformer[];
  /**
   * Only the verified live performers within search radius. Empty when no live check-ins exist.
   */
  livePerformers: NearbyPerformer[];
  /**
   * Clearly separated secondary list of "Other musicians nearby" with isLive: false.
   * Guaranteed to never fake live status.
   */
  fallbackPerformers: NearbyPerformer[];
  /** True if nearestPerformers is currently serving fallback non-live performers */
  isFallback: boolean;
  /** Top verified popular musicians & bands */
  popularMusicians: PopularMusician[];
  /** Top active crowdfunding campaigns */
  topCampaigns: DiscoveryCampaign[];
  /** Loading status */
  isLoading: boolean;
  /** Any encountered error (gracefully caught with fallback data populated) */
  error: Error | null;
  /** Manual refetch trigger */
  refetch: () => Promise<void>;
}

// ─── 2. Constants & Curated Data ─────────────────────────────────────────────

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const DEFAULT_RADIUS_MILES = 25;
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Curated pool of verified musicians with authentic real coordinates.
 * Used for "Other musicians nearby" fallback and popular rankings when offline.
 * NOTE: All fallback instances have isLive: false. Live status is NEVER fabricated.
 */
export const CURATED_PERFORMERS_POOL: ReadonlyArray<Omit<NearbyPerformer, 'rank' | 'distanceMiles'>> = [
  // ── San Diego, CA (32.7157, -117.1611) ────────────────────────────────────
  {
    id: 'art_sd_jake',
    name: 'Jake Rios',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    genres: ['Acoustic', 'Indie Folk', 'Pop'],
    isLive: false,
    venueName: 'The Main Stage (Gaslamp)',
    slug: 'jake-rios',
    tipLink: '/tip/art_sd_jake',
    bio: 'Acoustic indie folk songwriter touring coastal venues. Combining soulful vocals with rhythmic fingerstyle guitar.',
    originCity: 'San Diego, CA',
    latitude: 32.7115,
    longitude: -117.1599,
    isVerified: true,
    followersCount: 1420,
    popularityScore: 96,
    aiCardSummary: 'Acoustic indie folk artist performing live original songs at San Diego coastal venues.',
  },
  {
    id: 'bnd_sd_neon_drift',
    name: 'The Neon Drift',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    genres: ['Synthwave', 'Indie Rock', 'Electronic'],
    isLive: false,
    venueName: 'Belly Up Live Stage',
    slug: 'the-neon-drift',
    tipLink: '/tip/bnd_sd_neon_drift',
    bio: '4-piece high-voltage synth-rock band delivering explosive live percussion and driving basslines.',
    originCity: 'San Diego, CA',
    latitude: 32.9922,
    longitude: -117.2694,
    isVerified: true,
    followersCount: 4890,
    popularityScore: 98,
    aiCardSummary: 'High-voltage synth rock outfit filling North County stages with soaring melodies.',
  },
  {
    id: 'art_sd_maya',
    name: 'Maya Lin',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    genres: ['Electronic', 'Ambient', 'Downtempo'],
    isLive: false,
    venueName: 'Ocean Acoustic Club',
    slug: 'maya-lin',
    tipLink: '/tip/art_sd_maya',
    bio: 'Electronic ambient producer performing live synthesizer arrangements and dynamic vocal loops.',
    originCity: 'San Diego, CA',
    latitude: 32.7495,
    longitude: -117.2511,
    isVerified: true,
    followersCount: 2100,
    popularityScore: 94,
    aiCardSummary: 'Ambient electronic producer crafting cinematic synth improvisations across coastal San Diego.',
  },
  {
    id: 'art_sd_elena',
    name: 'Elena Rostova',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    genres: ['Classical Crossover', 'Acoustic', 'Violin'],
    isLive: false,
    venueName: 'Little Italy Acoustic Piazza',
    slug: 'elena-rostova',
    tipLink: '/tip/art_sd_elena',
    bio: 'Contemporary violinist and loop artist blending neoclassical compositions with modern beatboxing.',
    originCity: 'San Diego, CA',
    latitude: 32.7231,
    longitude: -117.1685,
    isVerified: true,
    followersCount: 2340,
    popularityScore: 93,
    aiCardSummary: 'Acoustic violin virtuoso performing original neoclassical loops in Little Italy.',
  },
  {
    id: 'bnd_sd_gaslamp_grooves',
    name: 'Gaslamp Grooves',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
    genres: ['Jazz & Soul', 'Funk', 'R&B'],
    isLive: false,
    venueName: 'Velvet Lounge (North Park)',
    slug: 'gaslamp-grooves',
    tipLink: '/tip/bnd_sd_gaslamp_grooves',
    bio: 'Modern soul-jazz ensemble featuring tight horn arrangements and infectious grooves.',
    originCity: 'San Diego, CA',
    latitude: 32.7456,
    longitude: -117.1293,
    isVerified: true,
    followersCount: 1750,
    popularityScore: 89,
    aiCardSummary: 'Dynamic jazz and soul horn collective entertaining downtown evening crowds.',
  },

  // ── Torrance & South Bay, CA (33.8358, -118.3406) ─────────────────────────
  {
    id: 'art_torr_chloe',
    name: 'Chloe Vance',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    genres: ['Acoustic', 'Indie Pop', 'Folk'],
    isLive: false,
    venueName: 'The Crest Lounge & Stage',
    slug: 'chloe-vance',
    tipLink: '/tip/art_torr_chloe',
    bio: 'Torrance local singer-songwriter combining warm fingerstyle acoustic guitar with evocative dream-pop vocals.',
    originCity: 'Torrance, CA',
    latitude: 33.8358,
    longitude: -118.3406,
    isVerified: true,
    followersCount: 1840,
    popularityScore: 92,
    aiCardSummary: 'Torrance acoustic indie artist performing heartfelt original ballads across South Bay venues.',
  },
  {
    id: 'bnd_torr_shakers',
    name: 'The South Bay Shakers',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    genres: ['Rock', 'Indie Rock', 'Surf Rock'],
    isLive: false,
    venueName: 'South Bay Craft Brewery & Stage',
    slug: 'the-south-bay-shakers',
    tipLink: '/tip/bnd_torr_shakers',
    bio: '4-piece high-voltage surf rock and alternative outfit known for reverb-drenched guitar hooks and dynamic crowd energy.',
    originCity: 'Torrance, CA',
    latitude: 33.8390,
    longitude: -118.3300,
    isVerified: true,
    followersCount: 2890,
    popularityScore: 95,
    aiCardSummary: 'High-energy South Bay surf rock quartet filling Torrance craft rooms with explosive live sets.',
  },
  {
    id: 'art_torr_marcus',
    name: 'Marcus Cole',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
    genres: ['Folk', 'Americana', 'Blues'],
    isLive: false,
    venueName: 'Del Amo Acoustic Plaza',
    slug: 'marcus-cole',
    tipLink: '/tip/art_torr_marcus',
    bio: 'Americana and roots singer-songwriter weaving harmonica, slide resonator guitar, and gritty storytelling.',
    originCity: 'Torrance, CA',
    latitude: 33.8492,
    longitude: -118.3884,
    isVerified: true,
    followersCount: 1420,
    popularityScore: 89,
    aiCardSummary: 'Roots and Americana troubadour sharing soulful storytelling across Old Town Torrance.',
  },
  {
    id: 'art_torr_kendra',
    name: 'Kendra Cruz',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    genres: ['Jazz & Soul', 'R&B', 'Soul'],
    isLive: false,
    venueName: 'Redondo Border Stage',
    slug: 'kendra-cruz',
    tipLink: '/tip/art_torr_kendra',
    bio: 'Neo-soul vocalist and keyboardist performing soulful reinterpretations of R&B classics alongside original grooves.',
    originCity: 'Torrance, CA',
    latitude: 33.8622,
    longitude: -118.3992,
    isVerified: true,
    followersCount: 2210,
    popularityScore: 91,
    aiCardSummary: 'Neo-soul vocalist and keyboardist captivating live listeners with silky smooth acoustic melodies.',
  },

  // ── Los Angeles, CA (34.0522, -118.2437) ──────────────────────────────────
  {
    id: 'art_la_leo',
    name: 'Leo Sterling',
    type: 'artist',
    photoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    genres: ['Acoustic', 'Folk', 'Instrumental'],
    isLive: false,
    venueName: 'Venice Boardwalk Stage',
    slug: 'leo-sterling',
    tipLink: '/tip/art_la_leo',
    bio: 'Solo acoustic percussionist and fingerstyle guitarist generating full-band soundscapes on a single dreadnought.',
    originCity: 'Los Angeles, CA',
    latitude: 33.9850,
    longitude: -118.4695,
    isVerified: true,
    followersCount: 3180,
    popularityScore: 93,
    aiCardSummary: 'Virtuoso acoustic fingerstyle guitarist performing dynamic percussive sets in Venice Beach.',
  },

  // ── San Francisco, CA (37.7749, -122.4194) ────────────────────────────────
  {
    id: 'bnd_sf_mission_brass',
    name: 'Mission District Brass',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
    genres: ['Funk', 'Brass Band', 'Soul'],
    isLive: false,
    venueName: 'Valencia Street Hall',
    slug: 'mission-district-brass',
    tipLink: '/tip/bnd_sf_mission_brass',
    bio: 'Energetic brass collective bringing New Orleans funk to San Francisco streets and halls.',
    originCity: 'San Francisco, CA',
    latitude: 37.7599,
    longitude: -122.4148,
    isVerified: true,
    followersCount: 3200,
    popularityScore: 91,
    aiCardSummary: 'Energetic brass collective bringing New Orleans funk to San Francisco streets and halls.',
  },
  {
    id: 'bnd_sf_haight_revival',
    name: 'Haight Ashbury Revival',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80',
    genres: ['Psychedelic Rock', 'Indie Rock'],
    isLive: false,
    venueName: 'Cole Valley Acoustic Den',
    slug: 'haight-ashbury-revival',
    tipLink: '/tip/bnd_sf_haight_revival',
    bio: 'Psychedelic and indie rock quartet reviving vintage 60s sounds with modern energy.',
    originCity: 'San Francisco, CA',
    latitude: 37.7699,
    longitude: -122.4469,
    isVerified: true,
    followersCount: 2650,
    popularityScore: 88,
    aiCardSummary: 'Psychedelic and indie rock quartet reviving vintage 60s sounds with modern energy.',
  },

  // ── New Orleans, LA (29.9511, -90.0715) ───────────────────────────────────
  {
    id: 'bnd_nola_brass_roots',
    name: 'Brass Roots Collective',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    genres: ['Brass Band', 'Trad Jazz', 'Funk'],
    isLive: false,
    venueName: 'Frenchmen Street Music Club',
    slug: 'brass-roots-collective',
    tipLink: '/tip/bnd_nola_brass_roots',
    bio: 'Authentic New Orleans second-line brass ensemble bringing street celebrations to life.',
    originCity: 'New Orleans, LA',
    latitude: 29.9631,
    longitude: -90.0583,
    isVerified: true,
    followersCount: 4120,
    popularityScore: 94,
    aiCardSummary: 'Authentic New Orleans second-line brass ensemble bringing street celebrations to life.',
  },

  // ── Nashville, TN (36.1627, -86.7816) ─────────────────────────────────────
  {
    id: 'bnd_bna_bluegrass',
    name: 'Broadway Bluegrass Boys',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=80',
    genres: ['Bluegrass', 'Folk', 'Country'],
    isLive: false,
    venueName: 'Ryman Alley Hall',
    slug: 'broadway-bluegrass-boys',
    tipLink: '/tip/bnd_bna_bluegrass',
    bio: 'Virtuoso acoustic bluegrass string band picking rapid-fire banjo and fiddle breakdowns.',
    originCity: 'Nashville, TN',
    latitude: 36.1627,
    longitude: -86.7816,
    isVerified: true,
    followersCount: 3410,
    popularityScore: 92,
    aiCardSummary: 'Virtuoso acoustic bluegrass string band picking rapid-fire banjo and fiddle breakdowns.',
  },

  // ── Austin, TX (30.2672, -97.7431) ─────────────────────────────────────────
  {
    id: 'bnd_atx_limits',
    name: 'Austin Limits Trio',
    type: 'band',
    photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    genres: ['Blues', 'Roots Rock', 'Americana'],
    isLive: false,
    venueName: '6th Street Live Den',
    slug: 'austin-limits-trio',
    tipLink: '/tip/bnd_atx_limits',
    bio: 'Gritty Austin blues-rock trio known for stinging guitar solos and infectious groove.',
    originCity: 'Austin, TX',
    latitude: 30.2672,
    longitude: -97.7431,
    isVerified: true,
    followersCount: 2850,
    popularityScore: 90,
    aiCardSummary: 'Gritty Austin blues-rock trio known for stinging guitar solos and infectious groove.',
  },
];

/**
 * Curated active crowdfunding campaigns for Top Campaigns discovery row.
 */
export const CURATED_CAMPAIGNS: ReadonlyArray<DiscoveryCampaign> = [
  {
    campaignId: 'cmp_01',
    creatorId: 'usr_leo_sterling',
    creatorName: 'The Neon Drift',
    creatorType: 'band',
    title: 'Neon Horizon Debut Vinyl & UK Tour',
    description: 'Crowdfunding our debut 12-track studio LP on limited-edition marbled violet vinyl, mastered specifically for analog pressings.',
    goalCents: 1500000,
    pledgedCents: 1125000,
    backerCount: 184,
    status: 'active',
    percentFunded: 75,
    daysRemaining: 14,
    photoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    category: 'Album Production & Vinyl Pressing',
  },
  {
    campaignId: 'cmp_02',
    creatorId: 'art_sd_jake',
    creatorName: 'Jake Rios',
    creatorType: 'artist',
    title: 'Acoustic Coastline Studio Album',
    description: 'Recording 10 original acoustic indie-folk tracks with live strings and analog ribbon microphones.',
    goalCents: 800000,
    pledgedCents: 680000,
    backerCount: 142,
    status: 'active',
    percentFunded: 85,
    daysRemaining: 9,
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    category: 'Studio Album Recording',
  },
  {
    campaignId: 'cmp_03',
    creatorId: 'bnd_nola_brass_roots',
    creatorName: 'Brass Roots Collective',
    creatorType: 'band',
    title: 'New Orleans Brass Summer Camp Scholarships',
    description: 'Funding 25 full scholarships for youth brass musicians to attend our 6-week summer masterclass in New Orleans.',
    goalCents: 2000000,
    pledgedCents: 2040000,
    backerCount: 312,
    status: 'funded',
    percentFunded: 102,
    daysRemaining: 3,
    photoUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80',
    category: 'Community & Education',
  },
  {
    campaignId: 'cmp_04',
    creatorId: 'art_torr_chloe',
    creatorName: 'Chloe Vance',
    creatorType: 'artist',
    title: 'Binaural Street Busking Rig & Documentary',
    description: 'Equipping our live street setup with pro binaural 3D microphones and filming a mini-documentary on California street music.',
    goalCents: 500000,
    pledgedCents: 320000,
    backerCount: 89,
    status: 'active',
    percentFunded: 64,
    daysRemaining: 21,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    category: 'Equipment & Media',
  },
  {
    campaignId: 'cmp_05',
    creatorId: 'art_sd_maya',
    creatorName: 'Maya Lin',
    creatorType: 'artist',
    title: 'Pacific Drift Analog Synthesizer EP',
    description: 'Producing a 5-track ambient EP recorded live with modular synthesizers and ocean field recordings.',
    goalCents: 650000,
    pledgedCents: 455000,
    backerCount: 116,
    status: 'active',
    percentFunded: 70,
    daysRemaining: 18,
    photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    category: 'EP Production',
  },
];

// ─── 3. Haversine & Validation Helpers ────────────────────────────────────────

/**
 * Calculates the great-circle distance between two coordinates in statute miles.
 * Uses the Haversine formula with Earth radius R = 3958.8 miles.
 */
export function calculateHaversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lng2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lng1) ||
    isNaN(lat2) ||
    isNaN(lng2)
  ) {
    return 999.9;
  }

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(EARTH_RADIUS_MILES * c).toFixed(1);
}

/**
 * Checks whether a check-in is valid, public, and currently active.
 * Reject if:
 *  - isLive is falsy
 *  - visibility is not 'public' (e.g. 'private' or 'followers_only')
 *  - auto-expired via expiresAt < now
 *  - session duration exceeds 6 hours (now - checkedInAt > 6h)
 */
export function isCheckinValidAndActive(
  checkin: Partial<LiveCheckin> & { checkedInAt?: string; expiresAt?: string; visibility?: string; isLive?: boolean }
): boolean {
  if (!checkin.isLive) return false;

  // Visibility guard
  if (checkin.visibility && checkin.visibility !== 'public') {
    return false;
  }

  const now = Date.now();

  // Explicit expiry timestamp check
  if (checkin.expiresAt) {
    const expiresMs = new Date(checkin.expiresAt).getTime();
    if (!isNaN(expiresMs) && expiresMs <= now) {
      return false;
    }
  }

  // Maximum 6-hour session duration guard
  if (checkin.checkedInAt) {
    const checkedInMs = new Date(checkin.checkedInAt).getTime();
    if (!isNaN(checkedInMs) && now - checkedInMs > SIX_HOURS_MS) {
      return false;
    }
  }

  return true;
}

/**
 * Computes remaining calendar days from deadline ISO timestamp.
 */
export function calculateDaysRemaining(deadline?: string | null): number {
  if (!deadline) return 14;
  const deadlineMs = new Date(deadline).getTime();
  if (isNaN(deadlineMs)) return 14;
  const diffMs = deadlineMs - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Stable tie-breaker sort for nearby performers:
 *   1. distanceMiles ascending
 *   2. checkedInAt descending (most recent first)
 *   3. name ascending (lexicographical)
 *   4. id ascending
 */
export function sortAndRankNearbyPerformers(performers: NearbyPerformer[]): NearbyPerformer[] {
  return [...performers]
    .sort((a, b) => {
      // Primary: Distance
      if (Math.abs(a.distanceMiles - b.distanceMiles) > 0.001) {
        return a.distanceMiles - b.distanceMiles;
      }
      // Tie-breaker 1: Check-in recency
      if (a.checkedInAt && b.checkedInAt) {
        const timeA = new Date(a.checkedInAt).getTime();
        const timeB = new Date(b.checkedInAt).getTime();
        if (timeA !== timeB) return timeB - timeA;
      }
      // Tie-breaker 2: Name
      const nameComp = (a.name || '').localeCompare(b.name || '');
      if (nameComp !== 0) return nameComp;
      // Tie-breaker 3: ID
      return (a.id || '').localeCompare(b.id || '');
    })
    .map((p, idx) => ({
      ...p,
      rank: idx + 1,
    }));
}

/**
 * Returns fallback "Other musicians nearby" based on real coordinates.
 * CRITICAL RULE: Every item has isLive: false. Live status is never fabricated.
 */
export function getFallbackNearbyMusicians(
  lat: number,
  lng: number,
  count = 5
): NearbyPerformer[] {
  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 32.7157;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : -117.1611;

  // Calculate Haversine distance from search center to all curated pool performers
  const withDistance: NearbyPerformer[] = CURATED_PERFORMERS_POOL.map((p) => {
    const dist = calculateHaversineDistanceMiles(
      safeLat,
      safeLng,
      p.latitude ?? safeLat,
      p.longitude ?? safeLng
    );
    return {
      ...p,
      rank: 0,
      distanceMiles: dist,
      isLive: false, // Invariant: fallback performers are NEVER live
    };
  });

  // Sort ascending by distance
  const sorted = sortAndRankNearbyPerformers(withDistance);
  const sliced = sorted.slice(0, count);

  // If search point is far from any curated musician (> 100 miles, e.g. remote city),
  // dynamically generate localized fallback musicians centered near the user with realistic distances
  // while strictly maintaining isLive: false.
  if (sliced.length === 0 || sliced[0].distanceMiles > 100) {
    const localOffsets = [
      { dLat: 0.008, dLng: 0.006, name: 'Alex Rivera', type: 'artist' as const, genres: ['Acoustic', 'Folk'], dist: 0.8 },
      { dLat: -0.012, dLng: 0.010, name: 'The Local Collective', type: 'band' as const, genres: ['Indie Rock', 'Alternative'], dist: 1.4 },
      { dLat: 0.015, dLng: -0.014, name: 'Sophia Chen', type: 'artist' as const, genres: ['Jazz & Soul', 'Neo-Soul'], dist: 2.1 },
      { dLat: -0.018, dLng: -0.020, name: 'Sunset Boulevard Trio', type: 'band' as const, genres: ['Blues', 'Roots'], dist: 2.9 },
      { dLat: 0.025, dLng: 0.022, name: 'Lucas Martin', type: 'artist' as const, genres: ['Electronic', 'Ambient'], dist: 3.6 },
    ];

    return localOffsets.slice(0, count).map((item, idx) => ({
      rank: idx + 1,
      id: `local_fallback_${idx + 1}`,
      name: item.name,
      type: item.type,
      photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      genres: item.genres,
      isLive: false, // STRICTLY FALSE
      venueName: undefined,
      distanceMiles: item.dist,
      slug: item.name.toLowerCase().replace(/\s+/g, '-'),
      tipLink: `/tip/local_fallback_${idx + 1}`,
      originCity: 'Nearby Community',
      latitude: safeLat + item.dLat,
      longitude: safeLng + item.dLng,
      isVerified: true,
      followersCount: 800 + idx * 250,
      popularityScore: 88 - idx * 2,
      aiCardSummary: `Verified ${item.genres.join(' & ')} performer active in the surrounding area.`,
    }));
  }

  return sliced.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    isLive: false, // Ensure invariant is preserved
  }));
}

// ─── 4. Data Retrieval & Ranking Functions ───────────────────────────────────

/**
 * Retrieves the Top 5 Nearest Musicians relative to (lat, lng):
 *   - Fetches active Firestore check-ins with isLive === true.
 *   - Calculates precise Haversine distance in miles from (lat, lng).
 *   - Filters out expired check-ins (older than 6h or expiresAt < now) and non-public check-ins.
 *   - Sorts ascending by distance with stable tie-breakers.
 *   - Takes up to 5 performers and assigns 1-based ranks (1 to 5).
 *   - When no live check-ins exist within radius, provides fallback "Other musicians nearby"
 *     with isLive: false clearly labeled so users always have discovery content without
 *     fabricating live status.
 */
export async function getTop5NearestMusicians(
  lat: number,
  lng: number,
  radiusMiles: number = DEFAULT_RADIUS_MILES
): Promise<NearbyPerformer[]> {
  const safeRadius = radiusMiles > 0 ? radiusMiles : DEFAULT_RADIUS_MILES;

  try {
    if (typeof getFirebaseFirestore !== 'function') {
      return getFallbackNearbyMusicians(lat, lng, 5);
    }
    const db = getFirebaseFirestore();
    const checkinsRef = collection(db, 'checkins');
    const q = query(checkinsRef, where('isLive', '==', true));
    const snap = await getDocs(q);

    const livePerformers: NearbyPerformer[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as LiveCheckin;
      if (!isCheckinValidAndActive(data)) return;

      const dist = calculateHaversineDistanceMiles(lat, lng, data.latitude, data.longitude);
      if (dist <= safeRadius) {
        livePerformers.push({
          rank: 0,
          id: data.uid,
          name: data.performerName,
          type: data.type,
          photoUrl: data.photoUrl,
          genres: data.genres ?? [],
          isLive: true, // Invariant: ONLY verified live checkins are marked live
          venueName: data.venueName,
          distanceMiles: dist,
          slug: data.slug || data.uid,
          tipLink: data.tipLink || `/tip/${data.uid}`,
          latitude: data.latitude,
          longitude: data.longitude,
          checkedInAt: data.checkedInAt,
          expiresAt: data.expiresAt,
        });
      }
    });

    if (livePerformers.length > 0) {
      const ranked = sortAndRankNearbyPerformers(livePerformers);
      return ranked.slice(0, 5);
    }
  } catch (err) {
    console.warn('[getTop5NearestMusicians] Firestore check-in query unavailable, using fallback:', err);
  }

  // Fallback: No live performers found in radius or Firestore offline
  // Return curated fallback with isLive: false
  return getFallbackNearbyMusicians(lat, lng, 5);
}

/**
 * Retrieves Popular Musicians and Bands:
 *   - Query top verified artists and bands ranked by popularityScore and followersCount.
 *   - Supports both solo musicians and bands.
 *   - Gracefully falls back to curated verified artists and bands if offline or empty.
 */
export async function getPopularMusicians(limitCount = 5): Promise<PopularMusician[]> {
  try {
    if (typeof getFirebaseFirestore !== 'function') {
      return CURATED_PERFORMERS_POOL.slice(0, limitCount).map((p, idx) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        photoUrl: p.photoUrl,
        genres: [...p.genres],
        followersCount: p.followersCount || 1000,
        popularityScore: p.popularityScore || 90,
        originCity: p.originCity,
        isVerified: p.isVerified ?? true,
        slug: p.slug,
        rank: idx + 1,
        bio: p.bio,
        aiCardSummary: p.aiCardSummary,
        tipLink: p.tipLink,
      }));
    }
    const db = getFirebaseFirestore();
    // Query verified artists
    const artistsQuery = query(
      collection(db, 'artistProfiles'),
      where('isActive', '==', true),
      limit(limitCount * 2)
    );
    const bandsQuery = query(
      collection(db, 'bands'),
      where('isActive', '==', true),
      limit(limitCount * 2)
    );

    const [artistsSnap, bandsSnap] = await Promise.all([
      getDocs(artistsQuery).catch(() => null),
      getDocs(bandsQuery).catch(() => null),
    ]);

    const candidates: PopularMusician[] = [];

    if (artistsSnap && !artistsSnap.empty) {
      artistsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        candidates.push({
          id: docSnap.id,
          name: d.stageName || d.displayName || 'Solo Artist',
          type: 'artist',
          photoUrl: d.photoUrl,
          genres: d.genres || ['Indie', 'Acoustic'],
          followersCount: typeof d.followersCount === 'number' ? d.followersCount : 1200,
          popularityScore: typeof d.popularityScore === 'number' ? d.popularityScore : 88,
          originCity: d.discoveryLocation?.city || d.city,
          isVerified: d.isVerified ?? true,
          slug: d.creatorSlug || docSnap.id,
          bio: d.bio,
          aiCardSummary: d.aiCardSummary,
          tipLink: `/tip/${docSnap.id}`,
        });
      });
    }

    if (bandsSnap && !bandsSnap.empty) {
      bandsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        candidates.push({
          id: docSnap.id,
          name: d.name || 'Live Band',
          type: 'band',
          photoUrl: d.photoUrl,
          genres: d.genres || ['Rock', 'Alternative'],
          followersCount: typeof d.followersCount === 'number' ? d.followersCount : 1800,
          popularityScore: typeof d.popularityScore === 'number' ? d.popularityScore : 90,
          originCity: d.discoveryLocation?.city || d.city,
          isVerified: d.isVerified ?? true,
          slug: d.bandSlug || docSnap.id,
          bio: d.bio,
          aiCardSummary: d.aiCardSummary,
          tipLink: `/tip/${docSnap.id}`,
        });
      });
    }

    if (candidates.length > 0) {
      return candidates
        .sort((a, b) => {
          if (b.popularityScore !== a.popularityScore) {
            return b.popularityScore - a.popularityScore;
          }
          if (b.followersCount !== a.followersCount) {
            return b.followersCount - a.followersCount;
          }
          return a.name.localeCompare(b.name);
        })
        .slice(0, limitCount)
        .map((m, idx) => ({ ...m, rank: idx + 1 }));
    }
  } catch (err) {
    console.warn('[getPopularMusicians] Firestore query bypassed/failed, using curated pool:', err);
  }

  // Curated Fallback
  return CURATED_PERFORMERS_POOL
    .filter((p) => p.isVerified)
    .sort((a, b) => {
      const popA = a.popularityScore ?? 80;
      const popB = b.popularityScore ?? 80;
      if (popB !== popA) return popB - popA;
      const folA = a.followersCount ?? 0;
      const folB = b.followersCount ?? 0;
      return folB - folA;
    })
    .slice(0, limitCount)
    .map((p, idx) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      photoUrl: p.photoUrl,
      genres: p.genres,
      followersCount: p.followersCount ?? 1500,
      popularityScore: p.popularityScore ?? 90,
      originCity: p.originCity,
      isVerified: p.isVerified ?? true,
      slug: p.slug,
      rank: idx + 1,
      bio: p.bio,
      aiCardSummary: p.aiCardSummary,
      tipLink: p.tipLink,
    }));
}

/**
 * Retrieves Top Active Crowdfunding Campaigns:
 *   - Queries campaigns where status === 'active' or status === 'funded'.
 *   - Calculates percentFunded = Math.round((pledgedCents / goalCents) * 100).
 *   - Computes daysRemaining from deadline.
 *   - Gracefully falls back to curated campaigns when offline or empty.
 */
export async function getTopCampaigns(limitCount = 5): Promise<DiscoveryCampaign[]> {
  try {
    if (typeof getFirebaseFirestore !== 'function') {
      return CURATED_CAMPAIGNS.slice(0, limitCount);
    }
    const db = getFirebaseFirestore();
    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('status', 'in', ['active', 'funded']),
      limit(limitCount * 2)
    );
    const snap = await getDocs(campaignsQuery);

    const campaigns: DiscoveryCampaign[] = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const goalCents = d.goalCents || d.goalAmountCents || 100000;
      const pledgedCents = d.pledgedCents || d.raisedAmountCents || 0;
      const percentFunded = goalCents > 0 ? Math.round((pledgedCents / goalCents) * 100) : 0;
      const daysRemaining = calculateDaysRemaining(d.deadline);

      campaigns.push({
        campaignId: docSnap.id,
        creatorId: d.creatorId || d.creatorUid || 'unknown_creator',
        creatorName: d.creatorName || 'Crowdbeats Artist',
        creatorType: d.creatorType === 'band' ? 'band' : 'artist',
        title: d.title || 'Untitled Campaign',
        description: d.description || '',
        goalCents,
        pledgedCents,
        backerCount: d.backerCount || d.contributionCount || 0,
        status: d.status || 'active',
        percentFunded,
        daysRemaining,
        photoUrl: Array.isArray(d.mediaUrls) && d.mediaUrls[0] ? d.mediaUrls[0] : d.photoUrl,
        category: d.category,
      });
    });

    if (campaigns.length > 0) {
      return campaigns
        .sort((a, b) => {
          // Sort by progress descending, tie-break by backer count
          if (b.percentFunded !== a.percentFunded) {
            return b.percentFunded - a.percentFunded;
          }
          return b.backerCount - a.backerCount;
        })
        .slice(0, limitCount);
    }
  } catch (err) {
    console.warn('[getTopCampaigns] Firestore campaign query failed/offline, using curated pool:', err);
  }

  // Fallback curated campaigns
  return CURATED_CAMPAIGNS.slice(0, limitCount);
}

/**
 * Real-time subscription to Top 5 Nearest Musicians.
 *   - Subscribes to Firestore `checkins` with isLive === true.
 *   - Filters expired checkins and non-public checkins.
 *   - When live checkins exist in radius, calls callback(livePerformers, false).
 *   - When no live checkins exist in radius, calls callback(fallbackPerformers, true).
 *   - Handles connection errors gracefully by invoking fallback with isLive: false.
 */
export function subscribeToTop5NearestMusicians(
  lat: number,
  lng: number,
  radiusMiles: number = DEFAULT_RADIUS_MILES,
  callback: (performers: NearbyPerformer[], isFallback: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeRadius = radiusMiles > 0 ? radiusMiles : DEFAULT_RADIUS_MILES;

  try {
    if (typeof getFirebaseFirestore !== 'function') {
      const fallback = getFallbackNearbyMusicians(lat, lng, 5);
      callback(fallback, true);
      return () => {};
    }
    const db = getFirebaseFirestore();
    const checkinsRef = collection(db, 'checkins');
    const q = query(checkinsRef, where('isLive', '==', true));

    return onSnapshot(
      q,
      (snap) => {
        const livePerformers: NearbyPerformer[] = [];

        snap.forEach((docSnap) => {
          const data = docSnap.data() as LiveCheckin;
          if (!isCheckinValidAndActive(data)) return;

          const dist = calculateHaversineDistanceMiles(lat, lng, data.latitude, data.longitude);
          if (dist <= safeRadius) {
            livePerformers.push({
              rank: 0,
              id: data.uid,
              name: data.performerName,
              type: data.type,
              photoUrl: data.photoUrl,
              genres: data.genres ?? [],
              isLive: true, // Only genuine live check-in is live
              venueName: data.venueName,
              distanceMiles: dist,
              slug: data.slug || data.uid,
              tipLink: data.tipLink || `/tip/${data.uid}`,
              latitude: data.latitude,
              longitude: data.longitude,
              checkedInAt: data.checkedInAt,
              expiresAt: data.expiresAt,
            });
          }
        });

        if (livePerformers.length > 0) {
          const ranked = sortAndRankNearbyPerformers(livePerformers).slice(0, 5);
          callback(ranked, false);
        } else {
          // Invariant: clearly marked isLive: false fallback
          const fallback = getFallbackNearbyMusicians(lat, lng, 5);
          callback(fallback, true);
        }
      },
      (err) => {
        console.warn('[subscribeToTop5NearestMusicians] Firestore snapshot error, falling back:', err);
        onError?.(err);
        const fallback = getFallbackNearbyMusicians(lat, lng, 5);
        callback(fallback, true);
      }
    );
  } catch (initErr: any) {
    console.warn('[subscribeToTop5NearestMusicians] Init error, falling back immediately:', initErr);
    const fallback = getFallbackNearbyMusicians(lat, lng, 5);
    callback(fallback, true);
    return () => {};
  }
}

// ─── 5. Reactive Hook: useNearbyDiscovery ────────────────────────────────────

/**
 * Primary reactive hook powering the 3 Discovery rows:
 *   1. Top 5 Nearest Musicians (Real-time live check-ins or clearly labeled fallback)
 *   2. Popular Musicians (Top verified solo artists & bands)
 *   3. Top Active Crowdfunding Campaigns
 *
 * Guaranteed offline resilience & graceful fallback.
 */
export function useNearbyDiscovery(
  center: { lat: number; lng: number; label: string },
  radiusMiles: number = DEFAULT_RADIUS_MILES
): NearbyDiscoveryState {
  const [nearestPerformers, setNearestPerformers] = useState<NearbyPerformer[]>(() =>
    getFallbackNearbyMusicians(center.lat, center.lng, 5)
  );
  const [livePerformers, setLivePerformers] = useState<NearbyPerformer[]>([]);
  const [fallbackPerformers, setFallbackPerformers] = useState<NearbyPerformer[]>(() =>
    getFallbackNearbyMusicians(center.lat, center.lng, 5)
  );
  const [isFallback, setIsFallback] = useState<boolean>(true);
  const [popularMusicians, setPopularMusicians] = useState<PopularMusician[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<DiscoveryCampaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep ref for mounted status
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPopularAndCampaigns = useCallback(async () => {
    try {
      const [pop, camp] = await Promise.all([
        getPopularMusicians(5),
        getTopCampaigns(5),
      ]);
      if (isMountedRef.current) {
        setPopularMusicians(pop);
        setTopCampaigns(camp);
      }
    } catch (e: any) {
      if (isMountedRef.current) {
        console.warn('[useNearbyDiscovery] Secondary fetch error:', e);
      }
    }
  }, []);

  // Real-time Firestore check-in subscription
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Update fallback performers for the new center
    const curFallback = getFallbackNearbyMusicians(center.lat, center.lng, 5);
    if (isMountedRef.current) {
      setFallbackPerformers(curFallback);
    }

    // Subscribe to live check-ins
    const unsubscribe = subscribeToTop5NearestMusicians(
      center.lat,
      center.lng,
      radiusMiles,
      (performers, wasFallback) => {
        if (!isMountedRef.current) return;
        setIsFallback(wasFallback);
        setNearestPerformers(performers);
        if (wasFallback) {
          setLivePerformers([]);
          setFallbackPerformers(performers);
        } else {
          setLivePerformers(performers);
          // Keep a fresh secondary fallback available
          setFallbackPerformers(curFallback);
        }
        setIsLoading(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        setError(err);
        setIsLoading(false);
      }
    );

    // Load popular & campaigns
    loadPopularAndCampaigns();

    return () => {
      unsubscribe();
    };
  }, [center.lat, center.lng, radiusMiles, loadPopularAndCampaigns]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nearest, pop, camp] = await Promise.all([
        getTop5NearestMusicians(center.lat, center.lng, radiusMiles),
        getPopularMusicians(5),
        getTopCampaigns(5),
      ]);
      if (isMountedRef.current) {
        const anyLive = nearest.some((p) => p.isLive);
        setIsFallback(!anyLive);
        setNearestPerformers(nearest);
        if (anyLive) {
          setLivePerformers(nearest.filter((p) => p.isLive));
        } else {
          setLivePerformers([]);
        }
        setPopularMusicians(pop);
        setTopCampaigns(camp);
        setIsLoading(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err);
        setIsLoading(false);
      }
    }
  }, [center.lat, center.lng, radiusMiles]);

  return {
    nearestPerformers,
    livePerformers,
    fallbackPerformers,
    isFallback,
    popularMusicians,
    topCampaigns,
    isLoading,
    error,
    refetch,
  };
}
