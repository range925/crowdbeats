/**
 * Crowdbeats V2 — Platform Contracts (Phase 3)
 *
 * All platform-neutral TypeScript contracts for:
 * - apps/web (imported directly)
 * - apps/functions (imported directly)
 * - apps/mobile (Dart parity models tested separately)
 *
 * Import from '@crowdbeats/contracts' in TypeScript packages.
 */

// ─── Common ───────────────────────────────────────────────────────────────────
export * from './common/money';
export * from './common/envelope';
export * from './common/pagination';
export * from './common/timestamp';

// ─── Identity ─────────────────────────────────────────────────────────────────
export * from './identity/roles';
export * from './identity/claims';
export * from './identity/user';

// ─── Profiles ─────────────────────────────────────────────────────────────────
export * from './profiles/fan';
export * from './profiles/artist';
export * from './profiles/band';
export * from './profiles/venue';
export * from './profiles/sponsor';
export * from './profiles/slug';

// ─── Performance ──────────────────────────────────────────────────────────────
export * from './performance/stage';
export * from './performance/qr';

// ─── Financial ────────────────────────────────────────────────────────────────
export * from './financial/tip';
export * from './financial/payment';
export * from './financial/payout';
export * from './financial/campaign';
export * from './financial/connect';
export * from './financial/eligibility';
export * from './financial/payoutHold';
export * from './financial/dispute';

// ─── Payment / Stripe ─────────────────────────────────────────────────────────
export * from './payment/paymentMethod';

// ─── Social ───────────────────────────────────────────────────────────────────
export * from './social/follow';

// ─── Sponsorship ──────────────────────────────────────────────────────────────
export * from './sponsorship/sponsorship';

// ─── Audit ────────────────────────────────────────────────────────────────────
export * from './audit/audit';

// ─── Phase 11 Integration & Routing ──────────────────────────────────────────
export * from './routing/deepLinks';
export * from './notifications/notifications';

// ─── Location (Phase 2, 9, 10 & 11) ──────────────────────────────────────────
export * from './location/liveLocation';
export * from './location/mapFeedback';
export * from './location/sessionRecovery';
export * from './location/locationObservability';
export * from './location/locationRemoteConfig';

// ─── Analytics & BigQuery ────────────────────────────────────────────────────
export * from './analytics/bigquerySchema';

// ─── Compliance & Legal Policies ──────────────────────────────────────────
export * from './compliance/policies';

// ─── Content Moderation & Abuse Reporting ─────────────────────────────────
export * from './moderation/moderation';
export * from './moderation/reports';
export * from './moderation/strikes';
export * from './moderation/lifecycle';

// ─── Public Discovery, Map & Location Search ──────────────────────────────
export * from './discovery/publicDiscovery';

// ─── User Settings & Preferences ──────────────────────────────────────────
export * from './settings/userSettings';
export * from './settings/securityContracts';

// ─── RBAC Permissions & Separation of Duties ──────────────────────────────
export * from './auth/permissions';

// ─── Compliance Obligation Register ───────────────────────────────────────
export * from './compliance/complianceRegister';

// ─── Menu & Capability Registry (Zero Dead Menu Contract) ─────────────────
export * from './registry/menuCapabilityRegistry';

// ─── Integrations, Provider Schemas & API Security ────────────────────────
export * from './integrations/integrationSchemas';
export * from './integrations/customApiSecurity';

// ─── Legal Document Lifecycle & Stripe Compliance Master Registry ──────────
export * from './compliance/legalDocumentTypes';
export * from './compliance/stripeComplianceTypes';

// ─── Platform Fee Configuration & Financial Reconciliation ────────────────
export * from './financial/platformFeeTypes';
export * from './financial/stripeDailyFeeTypes';

// ─── Universal Onboarding & Resumable State Machine ───────────────────────
export * from './onboarding/onboardingTypes';

// ─── Social Relationships & Messaging ───────────────────────────────────────
export * from './social/index';

// ─── Camera-Triggered Nearby Performer Tipping ─────────────────────────────
export * from './camera/index';

export const CONTRACTS_VERSION = '0.18.0-camera-tipping' as const;


