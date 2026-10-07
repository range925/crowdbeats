/**
 * Crowdbeats V2 — Role Definitions (Phase 3)
 *
 * OD-07: EXECUTIVE included → 16 enterprise/staff roles.
 * OD-08: Option A → SPONSOR_REP / SPONSOR_ADMIN (2 sponsor org roles).
 *
 * DESIGN INVARIANTS:
 * - Do NOT use a single `isAdmin: boolean` for authorization
 * - Do NOT put band/venue/sponsor memberships in Firebase custom claims
 * - Custom claims carry ONLY platformRole (if staff) + personaType
 * - All entity membership roles are fetched from Firestore on the server
 * - Clients never self-assign roles
 */

// ─── Platform / Staff Roles (OD-07: 16 roles) ────────────────────────────────

export const PlatformRole = {
  // Tier 1: Full platform control
  SUPER_ADMIN: 'SUPER_ADMIN',

  // Tier 2: Analytics & Finance (read-only)
  EXECUTIVE: 'EXECUTIVE', // GMV, take-rate, revenue, compliance export (OD-07)
  FINANCE_ANALYST: 'FINANCE_ANALYST', // Ledger, payout reports, fee config
  DATA_ANALYST: 'DATA_ANALYST', // Behavioral cohorts, custom event queries (no PII)

  // Tier 3: Trust & Safety
  CONTENT_MODERATOR: 'CONTENT_MODERATOR', // Reports queue, content removal
  TRUST_SAFETY: 'TRUST_SAFETY', // Fraud signals, dispute escalation, account holds
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER', // Audit export, consent records, deletions
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT', // Non-PII user lookup, tip lookup, refund initiation

  // Tier 4: Growth & Partnerships
  GROWTH_MANAGER: 'GROWTH_MANAGER', // Campaign oversight, featured artist management
  PARTNERSHIPS: 'PARTNERSHIPS', // Sponsorship review, match pool config
  ARTIST_RELATIONS: 'ARTIST_RELATIONS', // Artist profile assistance, payout enquiry
  VENUE_RELATIONS: 'VENUE_RELATIONS', // Venue profile assistance, stage session support

  // Tier 5: Technical & QA
  DEVELOPER: 'DEVELOPER', // Project config, function deployment (non-prod only)
  QA_TESTER: 'QA_TESTER', // Test account flag, emulator only, no production access

  // Tier 6: Legal & Marketing
  LEGAL: 'LEGAL', // Contract export, ToS management, consent audit
  MARKETING: 'MARKETING', // Campaign analytics read-only, newsletter export
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

export const ALL_PLATFORM_ROLES: readonly PlatformRole[] = Object.values(PlatformRole);

// ─── Persona Types (non-staff user-facing) ────────────────────────────────────

export const PersonaType = {
  FAN: 'fan',
  ARTIST: 'artist',
  BAND_MEMBER: 'band_member',
  VENUE_MANAGER: 'venue_manager',
  SPONSOR_REP: 'sponsor_rep',
  STAFF: 'staff',
} as const;

export type PersonaType = (typeof PersonaType)[keyof typeof PersonaType];

// ─── Band Roles ───────────────────────────────────────────────────────────────

export const BandRole = {
  BAND_FOUNDER: 'BAND_FOUNDER', // Full control, split config, bank linkage
  BAND_ADMIN: 'BAND_ADMIN', // Member management, session management
  BAND_MEMBER: 'BAND_MEMBER', // View financials, participate in sessions
} as const;

export type BandRole = (typeof BandRole)[keyof typeof BandRole];

export const BAND_ROLE_HIERARCHY: readonly BandRole[] = [
  BandRole.BAND_FOUNDER,
  BandRole.BAND_ADMIN,
  BandRole.BAND_MEMBER,
];

export function bandRoleAtLeast(userRole: BandRole, minimum: BandRole): boolean {
  return BAND_ROLE_HIERARCHY.indexOf(userRole) <= BAND_ROLE_HIERARCHY.indexOf(minimum);
}

// ─── Venue Roles ──────────────────────────────────────────────────────────────

export const VenueRole = {
  VENUE_OWNER: 'VENUE_OWNER', // Full venue control, bank linkage
  VENUE_MANAGER: 'VENUE_MANAGER', // Stage sessions, staff management
  VENUE_STAFF: 'VENUE_STAFF', // Check-in operations, session monitoring
} as const;

export type VenueRole = (typeof VenueRole)[keyof typeof VenueRole];

export const VENUE_ROLE_HIERARCHY: readonly VenueRole[] = [
  VenueRole.VENUE_OWNER,
  VenueRole.VENUE_MANAGER,
  VenueRole.VENUE_STAFF,
];

export function venueRoleAtLeast(userRole: VenueRole, minimum: VenueRole): boolean {
  return VENUE_ROLE_HIERARCHY.indexOf(userRole) <= VENUE_ROLE_HIERARCHY.indexOf(minimum);
}

// ─── Sponsor Org Roles (OD-08: Option A) ─────────────────────────────────────

export const SponsorRole = {
  SPONSOR_ADMIN: 'SPONSOR_ADMIN', // Treasury, contract signing, team seat management
  SPONSOR_REP: 'SPONSOR_REP', // Discovery, shortlist, messaging, analytics view
} as const;

export type SponsorRole = (typeof SponsorRole)[keyof typeof SponsorRole];

export const SPONSOR_ROLE_HIERARCHY: readonly SponsorRole[] = [
  SponsorRole.SPONSOR_ADMIN,
  SponsorRole.SPONSOR_REP,
];

export function sponsorRoleAtLeast(userRole: SponsorRole, minimum: SponsorRole): boolean {
  return SPONSOR_ROLE_HIERARCHY.indexOf(userRole) <= SPONSOR_ROLE_HIERARCHY.indexOf(minimum);
}

// ─── Privacy Classification ───────────────────────────────────────────────────

export const PrivacyClass = {
  PUBLIC: 'public', // Anyone can read (no auth required)
  AUTHENTICATED: 'authenticated', // Any signed-in user
  MEMBER_ONLY: 'member_only', // Requires entity membership
  OWNER_ONLY: 'owner_only', // Only the resource owner
  SERVER_ONLY: 'server_only', // Only Cloud Functions / Admin SDK
} as const;

export type PrivacyClass = (typeof PrivacyClass)[keyof typeof PrivacyClass];
