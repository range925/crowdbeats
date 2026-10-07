/**
 * Crowdbeats V2 — Creator Slug & Canonical URL Contracts (Phase 2)
 *
 * Implements canonical public URL definitions and slug lifecycle for solo artists and bands.
 *
 * Invariants:
 * - Each creator URL corresponds to exactly one Crowdbeats creator identity.
 * - Format: https://crowdbeats.ai/artist/{creatorSlug} or https://crowdbeats.ai/band/{bandSlug}
 * - Reserved slugs are protected from collision/impersonation.
 * - Suspended and deleted accounts are cleanly reflected in slug resolution state.
 */

import type { IsoTimestamp } from '../common/timestamp';

export const RESERVED_SLUGS: readonly string[] = [
  'admin',
  'administration',
  'api',
  'app',
  'artist',
  'artists',
  'auth',
  'band',
  'bands',
  'billing',
  'compliance',
  'connect',
  'creator',
  'dashboard',
  'explore',
  'fan',
  'help',
  'legal',
  'login',
  'logout',
  'moderation',
  'onboarding',
  'payout',
  'payouts',
  'privacy',
  'root',
  'security',
  'settings',
  'signup',
  'sponsor',
  'stripe',
  'support',
  'terms',
  'tip',
  'tips',
  'trust-safety',
  'venue',
  'venues',
  'webhook',
  'webhooks',
] as const;

export type CreatorSlugStatus = 'active' | 'suspended' | 'deleted';

export interface CreatorSlugRecord {
  readonly slug: string;
  readonly creatorId: string;
  readonly creatorType: 'artist' | 'band';
  readonly canonicalProfileUrl: string;
  readonly status: CreatorSlugStatus;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface ResolveSlugResponse {
  readonly found: boolean;
  readonly slug: string;
  readonly creatorId: string | null;
  readonly creatorType: 'artist' | 'band' | null;
  readonly canonicalProfileUrl: string | null;
  readonly status: CreatorSlugStatus | null;
  readonly isMonetizable: boolean;
}

/**
 * Normalizes a raw creator or band name into a clean, URL-safe slug.
 * Example: "The Midnight Echo & Co.!" -> "the-midnight-echo-co"
 */
export function normalizeSlug(rawName: string): string {
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
    return 'creator-unnamed';
  }

  const normalized = rawName
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '')         // remove leading and trailing hyphens
    .substring(0, 50);

  return normalized.length >= 2 ? normalized : `creator-${normalized || 'unnamed'}`;
}

/**
 * Determines whether a given slug matches a system reserved word.
 */
export function isReservedSlug(slug: string): boolean {
  const clean = slug.toLowerCase().trim();
  return RESERVED_SLUGS.includes(clean);
}

/**
 * Builds the canonical public profile URL for a creator or band.
 */
export function buildCanonicalProfileUrl(creatorType: 'artist' | 'band', slug: string): string {
  const normalized = normalizeSlug(slug);
  return creatorType === 'band'
    ? `https://crowdbeats.ai/band/${normalized}`
    : `https://crowdbeats.ai/artist/${normalized}`;
}
