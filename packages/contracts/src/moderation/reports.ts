/**
 * Crowdbeats V2 — Abuse Reporting & Complaints Contracts (Phase 6)
 *
 * Defines the schemas, target types, reporter types, and SLA classifications
 * for the platform abuse reporting pipeline.
 */

import { ModerationRiskCategory } from './moderation.js';

export const ReportTargetType = {
  CREATOR: 'CREATOR',
  SESSION: 'SESSION',
  SONG_REQUEST: 'SONG_REQUEST',
  TIP_MESSAGE: 'TIP_MESSAGE',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  PROFILE_IMAGE: 'PROFILE_IMAGE',
  EXTERNAL_URL: 'EXTERNAL_URL',
} as const;

export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType];

export const ReporterType = {
  AUTHENTICATED_USER: 'AUTHENTICATED_USER',
  ANONYMOUS_PUBLIC: 'ANONYMOUS_PUBLIC',
  RIGHTSHOLDER: 'RIGHTSHOLDER',
  LAW_ENFORCEMENT: 'LAW_ENFORCEMENT',
} as const;

export type ReporterType = (typeof ReporterType)[keyof typeof ReporterType];

export const ReportStatus = {
  RECEIVED: 'RECEIVED',
  TRIAGED: 'TRIAGED',
  IN_REVIEW: 'IN_REVIEW',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  ESCALATED_LEGAL: 'ESCALATED_LEGAL',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ReportSlaTier = {
  CRITICAL_1_HOUR: 'CRITICAL_1_HOUR',
  HIGH_4_HOUR: 'HIGH_4_HOUR',
  STANDARD_24_HOUR: 'STANDARD_24_HOUR',
} as const;

export type ReportSlaTier = (typeof ReportSlaTier)[keyof typeof ReportSlaTier];

export interface AbuseReport {
  readonly reportId: string;
  readonly ticketNumber: string;
  readonly targetType: ReportTargetType;
  readonly targetId: string;
  readonly targetUrl?: string;
  readonly reporterType: ReporterType;
  readonly reporterUid?: string;
  readonly reporterEmail?: string;
  readonly reporterName?: string;
  readonly violationCategory: ModerationRiskCategory;
  readonly description: string;
  readonly evidenceUrls: readonly string[];
  readonly status: ReportStatus;
  readonly slaTier: ReportSlaTier;
  readonly ipHash?: string;
  readonly userAgent?: string;
  readonly assignedModeratorUid?: string;
  readonly resolutionNotes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
}

export interface SubmitReportRequest {
  readonly targetType: ReportTargetType;
  readonly targetId: string;
  readonly targetUrl?: string;
  readonly reporterType?: ReporterType;
  readonly reporterEmail?: string;
  readonly reporterName?: string;
  readonly violationCategory: ModerationRiskCategory;
  readonly description: string;
  readonly evidenceUrls?: readonly string[];
}

export interface SubmitReportResponse {
  readonly reportId: string;
  readonly ticketNumber: string;
  readonly status: ReportStatus;
  readonly slaTier: ReportSlaTier;
  readonly receivedAt: string;
}
