/**
 * Crowdbeats V2 — CRM Event & Shared Data Foundation Contracts (Phase 6)
 *
 * Provides platform-neutral contracts for:
 * - CRM Events & Ingestion with deterministic ID generation and idempotency
 * - Unified Customer Profile aggregation across users, artists, bands, finance, relationships, and support
 * - Permission-aware data hydration (sanitizing staff-only notes for regular users)
 * - Directed relationship (follow) tracking with deterministic compound IDs
 * - Cross-collection financial references & support ticket aggregations
 */

import type { IsoTimestamp } from '../common/timestamp';
import type { PlatformRole } from '../identity/roles';

// ─── Entity Types & Processing Status ────────────────────────────────────────

export type CrmEntityType =
  | 'user'
  | 'artist'
  | 'band'
  | 'venue'
  | 'sponsor'
  | 'staff'
  | 'system';

export type CrmProcessingStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

// ─── Retention Constants (Days) ──────────────────────────────────────────────

export const CRM_RETENTION_DAYS = {
  TELEMETRY: 30,
  DEFAULT: 365,
  EXTENDED: 730,
  FINANCIAL_COMPLIANCE: 2555, // 7 years IRS / regulatory requirement
} as const;

// ─── CRM Event ID Generator ──────────────────────────────────────────────────

export function buildCrmEventId(
  source: string,
  targetType: string,
  targetId: string,
  timestampMs: number = Date.now()
): string {
  const cleanSource = source.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanType = targetType.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanTarget = targetId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `crm_${cleanSource}_${cleanType}_${cleanTarget}_${timestampMs}`;
}

// ─── CRM Event Model ─────────────────────────────────────────────────────────

export interface CrmEvent {
  readonly eventId: string;
  readonly source: string;
  readonly action: string;
  readonly actorUid: string;
  readonly actorRole?: string;
  readonly targetId: string;
  readonly targetType: CrmEntityType;
  readonly processingStatus: CrmProcessingStatus;
  readonly timestamp: IsoTimestamp;
  readonly retentionDays: number;
  readonly idempotencyKey: string;
  readonly payload: Record<string, unknown>;
  readonly errorMessage?: string;
  readonly processedAt?: IsoTimestamp;
}

// ─── Internal Notes ──────────────────────────────────────────────────────────

export interface CrmInternalNote {
  readonly id: string;
  readonly authorUid: string;
  readonly authorRole?: string;
  readonly authorEmail?: string;
  readonly note: string;
  readonly createdAt: IsoTimestamp;
}

// ─── Customer Profile ────────────────────────────────────────────────────────

export interface CrmArtistSummary {
  readonly stageName: string | null;
  readonly genre: string | null;
  readonly bio: string | null;
  readonly verified: boolean;
  readonly totalTipsReceivedCents: number;
}

export interface CrmBandAffiliation {
  readonly bandId: string;
  readonly name: string;
  readonly role: string;
  readonly joinedAt?: IsoTimestamp;
}

export interface CrmFinancialSummary {
  readonly totalTipsSentCents: number;
  readonly totalTipsReceivedCents: number;
  readonly tipsSentCount: number;
  readonly tipsReceivedCount: number;
  readonly payoutBalanceCents?: number;
  readonly stripeCustomerId?: string | null;
  readonly stripeAccountId?: string | null;
  readonly stripeAccountStatus?: string;
}

export interface CrmRelationshipSummary {
  readonly followerCount: number;
  readonly followingCount: number;
}

export interface CrmSupportSummary {
  readonly openTicketsCount: number;
  readonly totalTicketsCount: number;
}

export interface CrmCustomerProfile {
  readonly uid: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly photoUrl: string | null;
  readonly personaType: string | null;
  readonly platformRole: PlatformRole | string | null;
  readonly emailVerified: boolean;
  readonly isSuspended: boolean;
  readonly suspendedAt: IsoTimestamp | null;
  readonly suspensionReason: string | null;
  readonly createdAt: IsoTimestamp | null;
  readonly updatedAt: IsoTimestamp | null;
  readonly onboardedAt: IsoTimestamp | null;
  readonly artistProfile?: CrmArtistSummary | null;
  readonly bandAffiliations: CrmBandAffiliation[];
  readonly financialSummary: CrmFinancialSummary;
  readonly relationshipSummary: CrmRelationshipSummary;
  readonly supportSummary: CrmSupportSummary;
  /** Internal staff notes — only populated for authorized staff callers. */
  readonly internalNotes?: CrmInternalNote[];
  readonly metadata?: Record<string, unknown>;
}

// ─── Relationships ───────────────────────────────────────────────────────────

export interface CrmRelationshipItem {
  readonly followId: string; // Deterministic: `${sourceId}_${targetId}`
  readonly sourceId: string;
  readonly sourceType: string;
  readonly targetId: string;
  readonly targetType: string;
  readonly operatorUid: string;
  readonly createdAt: IsoTimestamp;
  readonly status: string;
}

// ─── Financial References ────────────────────────────────────────────────────

export interface CrmFinancialReference {
  readonly referenceId: string;
  readonly type: 'tip_sent' | 'tip_received' | 'payout' | 'refund' | 'dispute';
  readonly amountCents: number;
  readonly currency: string;
  readonly status: string;
  readonly createdAt: IsoTimestamp;
  readonly counterpartyId: string;
  readonly counterpartyName?: string;
  readonly metadata?: Record<string, unknown>;
}

// ─── Support Ticket Reference ────────────────────────────────────────────────

export interface CrmSupportTicketSummary {
  readonly ticketId: string;
  readonly userId: string;
  readonly subject: string;
  readonly status: string;
  readonly priority: string;
  readonly category?: string;
  readonly assignedTo?: string | null;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

// ─── Callables Contracts ─────────────────────────────────────────────────────

export interface GetCrmCustomerProfileRequest {
  readonly targetUid: string;
}

export interface GetCrmCustomerProfileResponse {
  readonly ok: boolean;
  readonly profile: CrmCustomerProfile;
}

export interface RecordCrmEventRequest {
  readonly source: string;
  readonly action: string;
  readonly targetId: string;
  readonly targetType: CrmEntityType;
  readonly idempotencyKey?: string;
  readonly payload?: Record<string, unknown>;
  readonly retentionDays?: number;
}

export interface RecordCrmEventResponse {
  readonly ok: boolean;
  readonly event: CrmEvent;
  readonly isReplay: boolean;
}

export interface GetCrmRelationshipsRequest {
  readonly uid: string;
  readonly direction?: 'followers' | 'following';
  readonly limit?: number;
}

export interface GetCrmRelationshipsResponse {
  readonly ok: boolean;
  readonly relationships: CrmRelationshipItem[];
  readonly totalCount: number;
}

export interface GetCrmFinancialReferencesRequest {
  readonly uid: string;
  readonly limit?: number;
}

export interface GetCrmFinancialReferencesResponse {
  readonly ok: boolean;
  readonly references: CrmFinancialReference[];
  readonly totalSentCents: number;
  readonly totalReceivedCents: number;
}

export interface AddCrmInternalNoteRequest {
  readonly targetUid: string;
  readonly note: string;
}

export interface AddCrmInternalNoteResponse {
  readonly ok: boolean;
  readonly note: CrmInternalNote;
}

// ─── Phase 8 Unified Directory & Search Contracts ───────────────────────────

export interface CrmDirectoryFilter {
  readonly entityType?: 'all' | 'fan' | 'solo_musician' | 'band' | 'sponsor';
  readonly verificationStatus?: 'all' | 'verified' | 'unverified';
  readonly accountStatus?: 'all' | 'active' | 'suspended';
  readonly searchQuery?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CrmDirectoryItem {
  readonly id?: string;
  readonly uid: string;
  readonly displayName: string | null;
  readonly email: string | null;
  readonly photoUrl: string | null;
  readonly personaType: string | null;
  readonly verificationStatus: 'verified' | 'unverified' | 'pending';
  readonly accountStatus: 'active' | 'suspended';
  readonly city: string | null;
  readonly genre?: string | null;
  readonly stageName?: string | null;
  readonly totalMonetaryCents: number;
  readonly relationshipsCount: number;
  readonly openCasesCount: number;
  readonly stripeConnected: boolean;
  readonly createdAt: IsoTimestamp | null;
}

export interface SearchCrmDirectoryRequest {
  readonly filter?: CrmDirectoryFilter;
}

export interface SearchCrmDirectoryResponse {
  readonly ok: boolean;
  readonly items: CrmDirectoryItem[];
  readonly totalCount: number;
}

// ─── Phase 8 Case History Contracts ─────────────────────────────────────────

export interface CrmCaseHistoryItem {
  readonly caseId: string;
  readonly type: 'SUPPORT_TICKET' | 'TRUST_SAFETY_REPORT' | 'DISPUTE' | 'PAYOUT_HOLD';
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly createdAt: IsoTimestamp;
  readonly resolvedAt?: IsoTimestamp | null;
  readonly assignedStaff?: string | null;
  readonly details?: Record<string, unknown>;
}

export interface GetCrmCaseHistoryRequest {
  readonly targetUid: string;
}

export interface GetCrmCaseHistoryResponse {
  readonly ok: boolean;
  readonly targetUid: string;
  readonly cases: CrmCaseHistoryItem[];
  readonly totalCount: number;
}

// ─── Phase 8 Verification Status Contracts ──────────────────────────────────

export interface UpdateCrmVerificationStatusRequest {
  readonly targetUid: string;
  readonly targetType: 'user' | 'artist' | 'band' | 'sponsor';
  readonly verified: boolean;
  readonly reason: string;
}

export interface UpdateCrmVerificationStatusResponse {
  readonly ok: boolean;
  readonly message: string;
  readonly targetUid: string;
  readonly verified: boolean;
}

