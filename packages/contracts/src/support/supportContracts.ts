/**
 * Crowdbeats V2 — Support & Case Management Contracts (Phase 9)
 *
 * Defines the schemas, ticket statuses, priorities, SLA tiers,
 * conversation message models, private staff notes, history audit logs,
 * and callables contracts for omnichannel customer support and case triage.
 */

import { IsoTimestamp } from '../common/timestamp.js';

// ─── Status & Priority Types ──────────────────────────────────────────────────

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportTicketCategory =
  | 'billing'
  | 'payout'
  | 'account'
  | 'band'
  | 'campaign'
  | 'safety'
  | 'technical'
  | 'general';

// ─── Message & Note Models ────────────────────────────────────────────────────

/**
 * Customer-facing message in the ticket conversation thread.
 * Both the customer and authorized staff can view these.
 */
export interface SupportMessage {
  readonly id: string;
  readonly ticketId: string;
  readonly senderUid: string;
  readonly senderName?: string;
  readonly senderEmail?: string;
  readonly senderRole?: string;
  readonly isStaff: boolean;
  readonly message: string;
  readonly createdAt: IsoTimestamp;
}

/**
 * Private internal staff note.
 * STRICT PRIVACY BOUNDARY: Only staff roles can access; NEVER returned to customers.
 */
export interface SupportInternalNote {
  readonly id: string;
  readonly ticketId: string;
  readonly authorUid: string;
  readonly authorName?: string;
  readonly authorEmail?: string;
  readonly authorRole: string;
  readonly note: string;
  readonly createdAt: IsoTimestamp;
}

/**
 * Audit history log entry tracking ticket lifecycle events.
 */
export interface SupportTicketHistoryEntry {
  readonly id: string;
  readonly ticketId: string;
  readonly action:
    | 'CREATED'
    | 'ASSIGNED'
    | 'STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'RESOLVED'
    | 'REOPENED'
    | 'MESSAGE_SENT'
    | 'INTERNAL_NOTE_ADDED';
  readonly actorUid: string;
  readonly actorEmail?: string;
  readonly actorRole?: string;
  readonly fromStatus?: SupportTicketStatus;
  readonly toStatus?: SupportTicketStatus;
  readonly details?: Record<string, unknown>;
  readonly timestamp: IsoTimestamp;
}

// ─── Support Ticket Entity ────────────────────────────────────────────────────

export interface SupportTicket {
  readonly id: string;
  readonly ticketId: string;
  readonly ticketNumber: string;
  readonly userId?: string | null;
  readonly userEmail?: string;
  readonly userName?: string;
  readonly userPersona?: string;
  readonly subject: string;
  readonly description: string;
  readonly category: SupportTicketCategory;
  readonly priority: SupportTicketPriority;
  readonly status: SupportTicketStatus;
  readonly assignedTo?: string | null;
  readonly assignedStaffName?: string | null;
  readonly assignedStaffEmail?: string | null;
  readonly assignedAt?: IsoTimestamp | null;
  readonly resolvedAt?: IsoTimestamp | null;
  readonly resolvedBy?: string | null;
  readonly resolutionNotes?: string | null;
  readonly reopenedAt?: IsoTimestamp | null;
  readonly reopenedBy?: string | null;
  readonly reopenReason?: string | null;
  readonly slaDueAt?: IsoTimestamp;
  readonly messageCount: number;
  readonly noteCount: number;
  readonly relatedSessionId?: string | null;
  readonly relatedTipId?: string | null;
  readonly relatedCampaignId?: string | null;
  readonly tags?: string[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

// ─── Callables Request & Response Contracts ───────────────────────────────────

export interface CreateSupportTicketRequest {
  readonly subject: string;
  readonly message: string;
  readonly category?: SupportTicketCategory;
  readonly priority?: SupportTicketPriority;
  readonly email?: string;
  readonly name?: string;
  readonly relatedSessionId?: string;
  readonly relatedTipId?: string;
  readonly relatedCampaignId?: string;
}

export interface CreateSupportTicketResponse {
  readonly ok: boolean;
  readonly ticketId: string;
  readonly ticketNumber: string;
  readonly status: SupportTicketStatus;
  readonly priority: SupportTicketPriority;
  readonly message: string;
}

export interface AssignSupportTicketRequest {
  readonly ticketId: string;
  readonly assignedStaffUid: string;
  readonly assignedStaffName?: string;
  readonly assignedStaffEmail?: string;
  readonly note?: string;
}

export interface AssignSupportTicketResponse {
  readonly ok: boolean;
  readonly ticketId: string;
  readonly assignedTo: string;
  readonly status: SupportTicketStatus;
  readonly message: string;
}

export interface ResolveSupportTicketRequest {
  readonly ticketId: string;
  readonly resolutionNotes: string;
}

export interface ResolveSupportTicketResponse {
  readonly ok: boolean;
  readonly ticketId: string;
  readonly status: SupportTicketStatus;
  readonly resolvedAt: IsoTimestamp;
  readonly message: string;
}

export interface ReopenSupportTicketRequest {
  readonly ticketId: string;
  readonly reason: string;
}

export interface ReopenSupportTicketResponse {
  readonly ok: boolean;
  readonly ticketId: string;
  readonly status: SupportTicketStatus;
  readonly reopenedAt: IsoTimestamp;
  readonly message: string;
}

export interface AddSupportTicketMessageRequest {
  readonly ticketId: string;
  readonly message: string;
}

export interface AddSupportTicketMessageResponse {
  readonly ok: boolean;
  readonly messageId: string;
  readonly ticketId: string;
  readonly status: SupportTicketStatus;
}

export interface AddSupportInternalNoteRequest {
  readonly ticketId: string;
  readonly note: string;
}

export interface AddSupportInternalNoteResponse {
  readonly ok: boolean;
  readonly noteId: string;
  readonly ticketId: string;
}

export interface GetSupportTicketDetailsRequest {
  readonly ticketId: string;
}

export interface GetSupportTicketDetailsResponse {
  readonly ok: boolean;
  readonly ticket: SupportTicket;
  readonly messages: SupportMessage[];
  readonly internalNotes?: SupportInternalNote[]; // Omitted / stripped for non-staff callers
  readonly history: SupportTicketHistoryEntry[];
}
